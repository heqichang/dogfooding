from ai_news.collectors.base import BaseCollector, RawNewsItem
from ai_news.collectors.factory import CollectorFactory, create_collector
from ai_news.collectors.github_collector import GitHubTrendingCollector
from ai_news.collectors.rss_collector import RSSCollector

__all__ = [
    "BaseCollector",
    "RawNewsItem",
    "RSSCollector",
    "GitHubTrendingCollector",
    "CollectorFactory",
    "create_collector",
]
