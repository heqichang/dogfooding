from typing import Tuple
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )
    
    APP_NAME: str = "image-service"
    DEBUG: bool = False
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024
    MAX_RESOLUTION_WIDTH: int = 8192
    MAX_RESOLUTION_HEIGHT: int = 8192
    CACHE_MAX_AGE: int = 86400
    
    @property
    def MAX_RESOLUTION(self) -> Tuple[int, int]:
        return (self.MAX_RESOLUTION_WIDTH, self.MAX_RESOLUTION_HEIGHT)


settings = Settings()
