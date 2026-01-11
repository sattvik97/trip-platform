from pydantic_settings import BaseSettings, SettingsConfigDict
from datetime import timedelta
from typing import Literal, List
from pathlib import Path
import os

# Determine if .env file should be loaded based on ENV variable
# In prod, only use environment variables (no .env file)
# This is evaluated at import time
_env_value = os.getenv("ENV", "local")
_env_file = None if _env_value == "prod" else ".env"


class Settings(BaseSettings):
    # Environment: local | test | prod
    ENV: Literal["local", "test", "prod"] = "local"
    
    # Database configuration
    DATABASE_URL: str = "postgresql://trip:trip@localhost:5432/tripdb"
    
    # JWT configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    # Azure Blob Storage configuration (required for test/prod)
    BLOB_CONNECTION_STRING: str = ""
    BLOB_CONTAINER: str = "trip-images"
    
    # Local storage configuration (used only for local environment)
    LOCAL_UPLOAD_DIR: str = "media"
    
    # CORS configuration
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Pydantic v2 model configuration
    # Conditionally load .env file based on ENV variable (evaluated at import time)
    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    @property
    def access_token_expire(self) -> timedelta:
        return timedelta(hours=self.ACCESS_TOKEN_EXPIRE_HOURS)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """
        Parse CORS_ORIGINS string into a list.
        Normalizes origins by:
        - Stripping whitespace
        - Removing trailing slashes (CORS requires exact match)
        - Filtering empty strings
        """
        if not self.CORS_ORIGINS:
            return []
        origins = []
        for origin in self.CORS_ORIGINS.split(","):
            origin = origin.strip()
            if origin:
                # Remove trailing slash - CORS origin matching is exact and trailing slashes cause mismatches
                origin = origin.rstrip("/")
                if origin not in origins:  # Avoid duplicates
                    origins.append(origin)
        return origins
    
    @property
    def is_local(self) -> bool:
        """Check if running in local environment."""
        return self.ENV == "local"
    
    @property
    def is_test(self) -> bool:
        """Check if running in test environment."""
        return self.ENV == "test"
    
    @property
    def is_prod(self) -> bool:
        """Check if running in prod environment."""
        return self.ENV == "prod"
    
    @property
    def uses_azure_storage(self) -> bool:
        """Check if Azure Blob Storage should be used."""
        return self.ENV in ("test", "prod")
    
    @property
    def uses_local_storage(self) -> bool:
        """Check if local filesystem storage should be used."""
        return self.ENV == "local"


# Create settings instance
settings = Settings()

