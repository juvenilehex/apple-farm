from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from core.config import settings
from models.base import Base

# Alembic Config object
config = context.config

# 동적으로 DB URL 설정 (.env → settings)
# asyncpg → psycopg2 (sync) 로 변환 (Alembic은 sync 드라이버 사용)
sync_url = settings.database_url.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", sync_url)

# Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 모델 메타데이터 (autogenerate 지원)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """offline 모드: DB 연결 없이 SQL 생성."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """online 모드: DB 연결 후 마이그레이션 실행."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
