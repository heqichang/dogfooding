import json
from typing import List, Optional

from pydantic import field_validator, Field
from pydantic_settings import BaseSettings


DEFAULT_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


class Settings(BaseSettings):
    project_name: str = "AI资讯聚合智能体"
    debug: bool = False

    database_url: str = "mysql+pymysql://root:password@localhost:3306/ai_news"
    database_url_async: str = "mysql+aiomysql://root:password@localhost:3306/ai_news"

    redis_url: str = "redis://localhost:6379/0"

    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-3.5-turbo"

    request_timeout: int = 30
    request_interval: float = 1.0
    request_max_retries: int = 3

    user_agents: List[str] = Field(default_factory=lambda: DEFAULT_USER_AGENTS)

    proxy_url: Optional[str] = None

    sensitive_keywords: List[str] = Field(default_factory=list)
    blocked_sites: List[str] = Field(default_factory=list)

    @field_validator("proxy_url", mode="before")
    @classmethod
    def parse_proxy_url(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            if v == "" or v.lower() in ["none", "null"]:
                return None
        return v

    @field_validator("user_agents", mode="before")
    @classmethod
    def parse_user_agents(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            if v.startswith("[") and v.endswith("]"):
                try:
                    items = v[1:-1].split(",")
                    cleaned = []
                    for item in items:
                        item = item.strip().strip('"').strip("'")
                        if item:
                            cleaned.append(item)
                    if cleaned:
                        return cleaned
                except Exception:
                    pass
        return DEFAULT_USER_AGENTS

    @field_validator("sensitive_keywords", "blocked_sites", mode="before")
    @classmethod
    def parse_list(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            if v == "" or v == "[]":
                return []
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            if v.startswith("[") and v.endswith("]"):
                try:
                    items = v[1:-1].split(",")
                    cleaned = []
                    for item in items:
                        item = item.strip().strip('"').strip("'")
                        if item:
                            cleaned.append(item)
                    return cleaned
                except Exception:
                    pass
        return []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
