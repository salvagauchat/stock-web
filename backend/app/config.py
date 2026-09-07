from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = "cambiar-esto-por-una-clave-random-larga"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 600
    frontend_url: str = "http://localhost:4200"


settings = Settings()
