from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    frontend_url: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://localhost:5432/pj18_apple"

    # 공공데이터포털 API 키
    data_portal_api_key: str = ""
    # KAMIS API
    kamis_api_key: str = ""
    kamis_api_id: str = ""
    # 브이월드 API
    vworld_api_key: str = ""
    # KOSIS 통계청 API
    kosis_api_key: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
