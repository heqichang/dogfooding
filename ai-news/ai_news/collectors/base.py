from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass
class RawNewsItem:
    title: str
    original_url: str
    source_name: str
    publish_time: Optional[datetime] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    content_snippet: Optional[str] = None
    language: str = "zh"
    region: str = "cn"
    raw_data: Optional[dict] = None


class BaseCollector(ABC):
    def __init__(self, source_config: dict):
        self.source_config = source_config
        self.name = source_config.get("name", "unknown")
        self.url = source_config.get("url", "")
        self.region = source_config.get("region", "cn")

    @abstractmethod
    async def fetch(self) -> List[RawNewsItem]:
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        pass

    def get_source_info(self) -> dict:
        return {
            "name": self.name,
            "url": self.url,
            "region": self.region,
            "type": self.__class__.__name__,
        }
