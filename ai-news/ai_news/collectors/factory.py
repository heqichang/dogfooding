from typing import Dict, Type

from ai_news.collectors.base import BaseCollector
from ai_news.collectors.github_collector import GitHubTrendingCollector
from ai_news.collectors.rss_collector import RSSCollector


class CollectorFactory:
    _collectors: Dict[str, Type[BaseCollector]] = {
        "rss": RSSCollector,
        "github": GitHubTrendingCollector,
    }

    @classmethod
    def register(cls, source_type: str, collector_class: Type[BaseCollector]) -> None:
        cls._collectors[source_type] = collector_class

    @classmethod
    def create(cls, source_config: dict) -> BaseCollector:
        source_type = source_config.get("source_type", "rss").lower()

        collector_class = cls._collectors.get(source_type)
        if not collector_class:
            raise ValueError(f"Unknown source type: {source_type}")

        return collector_class(source_config)

    @classmethod
    def get_available_types(cls) -> list:
        return list(cls._collectors.keys())


def create_collector(source_config: dict) -> BaseCollector:
    return CollectorFactory.create(source_config)
