"""설정 마이그레이션 관리자 (진화 렌즈 L5: 무중단 진화).

설정 스키마가 변경될 때 기존 데이터를 자동으로 새 형식으로 마이그레이션한다.
DB 없이도 동작 (JSON 파일 기반).

마이그레이션 규칙:
- 각 마이그레이션은 버전 번호 + 변환 함수로 구성
- 순차 적용: v1 → v2 → v3 ...
- 실패 시 자동 롤백 + 로그 기록
- 마이그레이션 이력 영구 보존
"""
from __future__ import annotations

import json
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_MIGRATION_LOG = _DATA_DIR / "migration_log.jsonl"


class Migration:
    """단일 마이그레이션 정의."""

    def __init__(self, version: int, name: str,
                 up: Callable[[dict], dict],
                 down: Callable[[dict], dict] | None = None):
        self.version = version
        self.name = name
        self.up = up
        self.down = down


class MigrationManager:
    """JSON 파일 기반 설정 마이그레이션 관리자."""

    def __init__(self):
        self._migrations: list[Migration] = []
        self._register_migrations()

    def _register_migrations(self) -> None:
        """마이그레이션 목록 등록."""

        # v1: flags.json에 version 필드 추가
        self._migrations.append(Migration(
            version=1,
            name="flags_add_version",
            up=lambda d: {**d, "_schema_version": 1},
            down=lambda d: {k: v for k, v in d.items() if k != "_schema_version"},
        ))

        # v2: 피처 플래그에 rollout_pct 필드 추가
        def add_rollout(data: dict) -> dict:
            for key, val in data.items():
                if isinstance(val, dict) and "enabled" in val and "rollout_pct" not in val:
                    val["rollout_pct"] = 100 if val["enabled"] else 0
            data["_schema_version"] = 2
            return data

        self._migrations.append(Migration(
            version=2,
            name="flags_add_rollout_pct",
            up=add_rollout,
        ))

        # v3: 실험 설정에 태그 시스템 추가
        def add_tags(data: dict) -> dict:
            for exp in data.get("experiments", []):
                if "tags" not in exp:
                    exp["tags"] = []
            data["_schema_version"] = 3
            return data

        self._migrations.append(Migration(
            version=3,
            name="experiments_add_tags",
            up=add_tags,
        ))

    def migrate_file(self, file_path: Path) -> dict:
        """파일을 최신 스키마로 마이그레이션.

        Returns:
            {"migrated": bool, "from_version": int, "to_version": int, "applied": list}
        """
        if not file_path.exists():
            return {"migrated": False, "reason": "파일 없음"}

        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            return {"migrated": False, "reason": f"파싱 실패: {e}"}

        current_version = data.get("_schema_version", 0)
        target_version = self._migrations[-1].version if self._migrations else 0

        if current_version >= target_version:
            return {"migrated": False, "from_version": current_version,
                    "to_version": target_version, "reason": "이미 최신"}

        # 백업 생성
        backup_path = file_path.with_suffix(f".v{current_version}.bak")
        shutil.copy2(file_path, backup_path)

        applied = []
        for migration in self._migrations:
            if migration.version <= current_version:
                continue
            try:
                data = migration.up(data)
                applied.append(migration.name)
                logger.info("마이그레이션 적용: %s (v%d)", migration.name, migration.version)
            except Exception as e:
                # 실패 시 롤백
                logger.error("마이그레이션 실패 (v%d %s): %s", migration.version, migration.name, e)
                shutil.copy2(backup_path, file_path)
                self._log_migration(file_path.name, current_version, migration.version,
                                     applied, success=False, error=str(e))
                return {"migrated": False, "reason": f"v{migration.version} 실패: {e}",
                        "rolled_back": True}

        # 성공: 파일 저장
        file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        self._log_migration(file_path.name, current_version, target_version, applied, success=True)

        return {
            "migrated": True,
            "from_version": current_version,
            "to_version": target_version,
            "applied": applied,
        }

    def migrate_all(self) -> dict[str, Any]:
        """data/ 디렉토리의 모든 JSON 파일 마이그레이션."""
        results = {}
        for json_file in _DATA_DIR.glob("*.json"):
            if json_file.name.endswith(".bak"):
                continue
            result = self.migrate_file(json_file)
            if result.get("migrated") or result.get("reason") != "파일 없음":
                results[json_file.name] = result
        return results

    def get_status(self) -> dict:
        """마이그레이션 상태."""
        latest = self._migrations[-1].version if self._migrations else 0
        return {
            "latest_schema_version": latest,
            "registered_migrations": len(self._migrations),
            "migrations": [
                {"version": m.version, "name": m.name, "reversible": m.down is not None}
                for m in self._migrations
            ],
        }

    def _log_migration(self, filename: str, from_v: int, to_v: int,
                       applied: list, success: bool, error: str = "") -> None:
        entry = {
            "timestamp": datetime.now().isoformat(),
            "file": filename,
            "from_version": from_v,
            "to_version": to_v,
            "applied": applied,
            "success": success,
            "error": error,
        }
        try:
            _MIGRATION_LOG.parent.mkdir(parents=True, exist_ok=True)
            with open(_MIGRATION_LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except OSError:
            pass


# 전역 싱글턴
_manager: MigrationManager | None = None


def get_migration_manager() -> MigrationManager:
    global _manager
    if _manager is None:
        _manager = MigrationManager()
    return _manager
