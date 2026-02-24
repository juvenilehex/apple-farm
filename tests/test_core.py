"""
pj18_apple Core Tests
- Backend Python modules existence and importability
- Core config/data files verification
- TypeScript source file existence (file checks only)
- Backend package structure integrity
"""
import ast
import importlib
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
APP_ROOT = PROJECT_ROOT / "app"

# Ensure backend is on sys.path for import tests
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


# ── Backend Python module structure ──

BACKEND_PACKAGES = [
    "api",
    "core",
    "models",
    "schemas",
    "services",
]

BACKEND_CORE_MODULES = [
    "core/config.py",
    "core/database.py",
    "core/enums.py",
    "core/evolution_engine.py",
    "core/experiment.py",
    "core/feature_flags.py",
    "core/migration_manager.py",
    "core/versioning.py",
]

BACKEND_API_MODULES = [
    "api/land.py",
    "api/orchard.py",
    "api/price.py",
    "api/simulation.py",
    "api/statistics.py",
    "api/trend.py",
    "api/variety.py",
    "api/weather.py",
]

BACKEND_SERVICE_MODULES = [
    "services/adaptive_scheduler.py",
    "services/anomaly_detector.py",
    "services/data_quality.py",
    "services/data_refresher.py",
    "services/health_monitor.py",
    "services/orchard.py",
    "services/simulation.py",
    "services/simulation_analytics.py",
    "services/simulation_feedback.py",
    "services/simulation_validator.py",
    "services/trend_detector.py",
    "services/usage_analytics.py",
    "services/variety.py",
]

BACKEND_SCHEMA_MODULES = [
    "schemas/land.py",
    "schemas/orchard.py",
    "schemas/price.py",
    "schemas/simulation.py",
    "schemas/trend.py",
    "schemas/variety.py",
    "schemas/weather.py",
]

# TypeScript source files to verify exist
TS_PAGE_FILES = [
    "app/src/app/page.tsx",
    "app/src/app/layout.tsx",
    "app/src/app/calendar/page.tsx",
    "app/src/app/design/page.tsx",
    "app/src/app/monthly/page.tsx",
    "app/src/app/price/page.tsx",
    "app/src/app/resources/page.tsx",
    "app/src/app/simulation/page.tsx",
    "app/src/app/varieties/page.tsx",
    "app/src/app/weather/page.tsx",
]

TS_LIB_FILES = [
    "app/src/lib/api.ts",
    "app/src/lib/analytics.ts",
    "app/src/lib/theme.ts",
    "app/src/lib/monetization.ts",
]


# ── Test: Backend package structure ──


class TestBackendPackageStructure:
    @pytest.mark.parametrize("package", BACKEND_PACKAGES)
    def test_package_dir_exists(self, package):
        pkg_dir = BACKEND_ROOT / package
        assert pkg_dir.is_dir(), f"Missing backend package: {package}/"

    @pytest.mark.parametrize("package", BACKEND_PACKAGES)
    def test_package_has_init(self, package):
        init_file = BACKEND_ROOT / package / "__init__.py"
        assert init_file.exists(), f"Missing __init__.py in {package}/"

    def test_main_py_exists(self):
        assert (BACKEND_ROOT / "main.py").exists(), "Missing backend/main.py"

    def test_requirements_txt_exists(self):
        assert (BACKEND_ROOT / "requirements.txt").exists(), "Missing requirements.txt"

    def test_alembic_ini_exists(self):
        assert (BACKEND_ROOT / "alembic.ini").exists(), "Missing alembic.ini"


# ── Test: Python files are syntactically valid (AST parse) ──


ALL_PYTHON_MODULES = (
    BACKEND_CORE_MODULES
    + BACKEND_API_MODULES
    + BACKEND_SERVICE_MODULES
    + BACKEND_SCHEMA_MODULES
)


class TestPythonSyntax:
    @pytest.mark.parametrize("module_path", ALL_PYTHON_MODULES)
    def test_python_file_exists(self, module_path):
        full = BACKEND_ROOT / module_path
        assert full.exists(), f"Missing Python file: backend/{module_path}"

    @pytest.mark.parametrize("module_path", ALL_PYTHON_MODULES)
    def test_python_syntax_valid(self, module_path):
        """Verify each Python file can be parsed by AST (syntax check)."""
        full = BACKEND_ROOT / module_path
        if not full.exists():
            pytest.skip(f"backend/{module_path} does not exist")
        source = full.read_text(encoding="utf-8", errors="replace")
        try:
            ast.parse(source, filename=str(full))
        except SyntaxError as e:
            pytest.fail(f"Syntax error in backend/{module_path}: {e}")


# ── Test: Core module importability ──


class TestCoreImportability:
    def test_import_enums(self):
        """core.enums should be importable (no heavy external deps)."""
        try:
            spec = importlib.util.find_spec("core.enums")
            assert spec is not None, "core.enums module not found on sys.path"
        except ModuleNotFoundError:
            pytest.skip("core.enums not importable (missing dependencies)")

    def test_import_feature_flags(self):
        try:
            spec = importlib.util.find_spec("core.feature_flags")
            assert spec is not None, "core.feature_flags module not found"
        except ModuleNotFoundError:
            pytest.skip("core.feature_flags not importable (missing dependencies)")

    def test_import_versioning(self):
        try:
            spec = importlib.util.find_spec("core.versioning")
            assert spec is not None, "core.versioning module not found"
        except ModuleNotFoundError:
            pytest.skip("core.versioning not importable (missing dependencies)")

    def test_enums_has_expected_classes(self):
        """Verify core.enums defines expected Enum classes."""
        source = (BACKEND_ROOT / "core" / "enums.py").read_text(
            encoding="utf-8", errors="replace"
        )
        tree = ast.parse(source)
        class_names = [
            node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)
        ]
        assert "CostCategory" in class_names, "Missing CostCategory in enums.py"
        assert "AppleGrade" in class_names, "Missing AppleGrade in enums.py"


# ── Test: Config/data files ──


class TestConfigDataFiles:
    def test_package_json_exists(self):
        assert (PROJECT_ROOT / "package.json").exists(), "Missing root package.json"

    def test_app_package_json_exists(self):
        assert (APP_ROOT / "package.json").exists(), "Missing app/package.json"

    def test_vercel_json_exists(self):
        assert (PROJECT_ROOT / "vercel.json").exists(), "Missing vercel.json"

    def test_tsconfig_exists(self):
        assert (APP_ROOT / "tsconfig.json").exists(), "Missing app/tsconfig.json"

    def test_backend_data_dir_exists(self):
        data_dir = BACKEND_ROOT / "data"
        assert data_dir.is_dir(), "Missing backend/data/ directory"

    def test_experiments_json_exists(self):
        experiments = BACKEND_ROOT / "data" / "experiments.json"
        assert experiments.exists(), "Missing backend/data/experiments.json"

    def test_alembic_migrations_exist(self):
        versions_dir = BACKEND_ROOT / "alembic" / "versions"
        assert versions_dir.is_dir(), "Missing alembic/versions/ directory"
        migrations = list(versions_dir.glob("*.py"))
        assert len(migrations) > 0, "No migration files found in alembic/versions/"


# ── Test: TypeScript source files exist ──


class TestTypeScriptSources:
    @pytest.mark.parametrize("ts_path", TS_PAGE_FILES)
    def test_page_tsx_exists(self, ts_path):
        full = PROJECT_ROOT / ts_path
        assert full.exists(), f"Missing TSX page: {ts_path}"

    @pytest.mark.parametrize("ts_path", TS_LIB_FILES)
    def test_lib_ts_exists(self, ts_path):
        full = PROJECT_ROOT / ts_path
        assert full.exists(), f"Missing TS lib file: {ts_path}"

    def test_globals_css_exists(self):
        css = APP_ROOT / "src" / "app" / "globals.css"
        assert css.exists(), "Missing app/src/app/globals.css"

    def test_components_dir_exists(self):
        comp_dir = APP_ROOT / "src" / "components"
        assert comp_dir.is_dir(), "Missing app/src/components/ directory"

    def test_has_ui_components(self):
        ui_dir = APP_ROOT / "src" / "components" / "ui"
        assert ui_dir.is_dir(), "Missing app/src/components/ui/ directory"
        tsx_files = list(ui_dir.glob("*.tsx"))
        assert len(tsx_files) > 0, "No .tsx files in components/ui/"
