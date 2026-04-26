from pydantic_settings import BaseSettings

class CommonSettings(BaseSettings):
    APP_ENV: str = "dev"
    SECRET_KEY: str = "change-me"
    HEARTBEAT_SECONDS: int = 5
    TEMP_DEADBAND_F: int = 3

    class Config:
        env_file = ".env"
