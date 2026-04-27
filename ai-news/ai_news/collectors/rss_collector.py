import asyncio
import hashlib
import re
from datetime import datetime, timezone
from typing import List, Optional

import feedparser
import httpx

from ai_news.collectors.base import BaseCollector, RawNewsItem
from ai_news.core.config import settings


class RSSCollector(BaseCollector):
    def __init__(self, source_config: dict):
        super().__init__(source_config)
        self.timeout = settings.request_timeout
        self.interval = settings.request_interval
        self.max_retries = settings.request_max_retries
        self.user_agents = settings.user_agents
        self.proxy = settings.proxy_url
        self._current_ua_index = 0

    def _get_user_agent(self) -> str:
        ua = self.user_agents[self._current_ua_index % len(self.user_agents)]
        self._current_ua_index += 1
        return ua

    async def _fetch_feed(self, url: str) -> Optional[feedparser.FeedParserDict]:
        headers = {"User-Agent": self._get_user_agent()}

        async with httpx.AsyncClient(
            timeout=self.timeout,
            proxy=self.proxy,
            follow_redirects=True,
        ) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.get(url, headers=headers)
                    response.raise_for_status()

                    feed = feedparser.parse(response.content)
                    if feed.bozo == 0:
                        return feed
                    elif attempt < self.max_retries - 1:
                        await asyncio.sleep(self.interval * (attempt + 1))
                        continue
                    else:
                        return None
                except Exception:
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.interval * (attempt + 1))
                        continue
                    return None
        return None

    def _parse_publish_time(self, entry: dict) -> Optional[datetime]:
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            try:
                return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            except Exception:
                pass

        if hasattr(entry, "updated_parsed") and entry.updated_parsed:
            try:
                return datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            except Exception:
                pass

        return None

    def _extract_summary(self, entry: dict) -> Optional[str]:
        summary = None

        if hasattr(entry, "summary") and entry.summary:
            summary = entry.summary
        elif hasattr(entry, "description") and entry.description:
            summary = entry.description

        if summary:
            summary = re.sub(r"<[^>]+>", "", summary)
            summary = re.sub(r"\s+", " ", summary).strip()

        return summary[:500] if summary else None

    def _extract_cover_image(self, entry: dict) -> Optional[str]:
        if hasattr(entry, "links"):
            for link in entry.links:
                if hasattr(link, "rel") and link.rel == "enclosure":
                    if hasattr(link, "type") and link.type and "image" in link.type:
                        return link.href if hasattr(link, "href") else None
                    return link.href if hasattr(link, "href") else None

        if hasattr(entry, "media_content"):
            for media in entry.media_content:
                if hasattr(media, "url"):
                    return media.url

        if hasattr(entry, "image") and hasattr(entry.image, "href"):
            return entry.image.href

        return None

    def _detect_language(self, entry: dict) -> str:
        if hasattr(entry, "title_detail") and hasattr(entry.title_detail, "language"):
            lang = entry.title_detail.language
            if lang:
                if lang.startswith("zh"):
                    return "zh"
                elif lang.startswith("en"):
                    return "en"

        return "zh" if self.region == "cn" else "en"

    def _calculate_fingerprint(self, title: str, url: str) -> str:
        content = f"{title}:{url}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    async def fetch(self) -> List[RawNewsItem]:
        items = []

        feed = await self._fetch_feed(self.url)
        if not feed:
            return items

        for entry in feed.entries:
            try:
                title = entry.title if hasattr(entry, "title") else ""
                if not title:
                    continue

                original_url = entry.link if hasattr(entry, "link") else ""
                if not original_url:
                    continue

                publish_time = self._parse_publish_time(entry)
                summary = self._extract_summary(entry)
                cover_image = self._extract_cover_image(entry)
                language = self._detect_language(entry)

                raw_data = {}
                if hasattr(entry, "author"):
                    raw_data["author"] = entry.author
                if hasattr(entry, "tags"):
                    raw_data["tags"] = [
                        tag.term for tag in entry.tags if hasattr(tag, "term")
                    ]

                item = RawNewsItem(
                    title=title.strip(),
                    original_url=original_url,
                    source_name=self.name,
                    publish_time=publish_time,
                    summary=summary,
                    cover_image=cover_image,
                    content_snippet=summary,
                    language=language,
                    region=self.region,
                    raw_data=raw_data if raw_data else None,
                )
                items.append(item)

            except Exception:
                continue

        return items

    async def test_connection(self) -> bool:
        feed = await self._fetch_feed(self.url)
        return feed is not None and len(feed.entries) > 0
