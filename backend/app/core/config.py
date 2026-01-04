from pydantic_settings import BaseSettings
from datetime import timedelta


class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def access_token_expire(self) -> timedelta:
        return timedelta(hours=self.ACCESS_TOKEN_EXPIRE_HOURS)


settings = Settings()

