import asyncio
import re
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from bs4 import BeautifulSoup

from ai_news.collectors.base import BaseCollector, RawNewsItem
from ai_news.core.config import settings


class GitHubTrendingCollector(BaseCollector):
    GITHUB_TRENDING_URL = "https://github.com/trending"

    def __init__(self, source_config: dict):
        super().__init__(source_config)
        self.timeout = settings.request_timeout
        self.interval = settings.request_interval
        self.max_retries = settings.request_max_retries
        self.user_agents = settings.user_agents
        self.proxy = settings.proxy_url
        self._current_ua_index = 0

        self.language = source_config.get("language", "")
        self.since = source_config.get("since", "daily")

    def _get_user_agent(self) -> str:
        ua = self.user_agents[self._current_ua_index % len(self.user_agents)]
        self._current_ua_index += 1
        return ua

    def _build_url(self) -> str:
        url = self.GITHUB_TRENDING_URL
        params = []

        if self.language:
            url = f"{url}/{self.language}"

        if self.since and self.since != "daily":
            params.append(f"since={self.since}")

        if params:
            url = f"{url}?{'&'.join(params)}"

        return url

    async def _fetch_page(self, url: str) -> Optional[str]:
        headers = {
            "User-Agent": self._get_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(
            timeout=self.timeout,
            proxy=self.proxy,
            follow_redirects=True,
        ) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.get(url, headers=headers)
                    response.raise_for_status()
                    return response.text
                except Exception:
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.interval * (attempt + 1))
                        continue
                    return None
        return None

    def _parse_stars(self, text: str) -> int:
        text = text.strip().replace(",", "")
        if "k" in text.lower():
            return int(float(text.lower().replace("k", "")) * 1000)
        try:
            return int(text)
        except ValueError:
            return 0

    def _extract_repo_info(self, article) -> Optional[dict]:
        try:
            title_elem = article.find("h2", class_="h3 lh-condensed")
            if not title_elem:
                return None

            link_elem = title_elem.find("a")
            if not link_elem or not link_elem.get("href"):
                return None

            repo_path = link_elem.get("href", "").lstrip("/")
            full_url = f"https://github.com/{repo_path}"

            owner, repo = repo_path.split("/") if "/" in repo_path else ("", repo_path)

            desc_elem = article.find("p", class_="col-9 color-fg-muted my-1 pr-4")
            description = desc_elem.get_text(strip=True) if desc_elem else ""

            lang_elem = article.find("span", itemprop="programmingLanguage")
            language = lang_elem.get_text(strip=True) if lang_elem else ""

            star_spans = article.find_all("a", href=lambda x: x and "/stargazers" in x)
            total_stars = 0
            today_stars = 0

            for star_span in star_spans:
                star_text = star_span.get_text(strip=True)
                if "stars" in star_text.lower() or "star" in star_text.lower():
                    parts = star_text.split()
                    if len(parts) > 0:
                        total_stars = self._parse_stars(parts[0])
                if "today" in star_text.lower():
                    today_stars = self._parse_stars(star_text)

            built_by_elem = article.find("span", class_="d-inline-block mr-3")
            built_by = []
            if built_by_elem:
                avatars = built_by_elem.find_all("img", class_="avatar")
                for avatar in avatars:
                    alt_text = avatar.get("alt", "")
                    if alt_text.startswith("@"):
                        built_by.append(alt_text[1:])
                    else:
                        built_by.append(alt_text)

            return {
                "owner": owner,
                "repo": repo,
                "full_name": repo_path,
                "url": full_url,
                "description": description,
                "language": language,
                "total_stars": total_stars,
                "today_stars": today_stars,
                "built_by": built_by,
            }

        except Exception:
            return None

    def _generate_summary(self, repo_info: dict) -> str:
        parts = []
        if repo_info["language"]:
            parts.append(f"[{repo_info['language']}]")
        parts.append(repo_info["description"] or "暂无描述")

        stats = []
        if repo_info["total_stars"] > 0:
            stats.append(f"⭐ {repo_info['total_stars']:,} stars")
        if repo_info["today_stars"] > 0:
            stats.append(f"🔥 {repo_info['today_stars']:,} today")

        if stats:
            parts.append(" | ".join(stats))

        if repo_info["built_by"]:
            contributors = ", ".join(repo_info["built_by"][:5])
            if len(repo_info["built_by"]) > 5:
                contributors += f" 等 {len(repo_info['built_by'])} 人"
            parts.append(f"维护者: {contributors}")

        return " ".join(parts)

    async def fetch(self) -> List[RawNewsItem]:
        items = []
        url = self._build_url()

        html = await self._fetch_page(url)
        if not html:
            return items

        soup = BeautifulSoup(html, "html.parser")
        articles = soup.find_all("article", class_="Box-row")

        for idx, article in enumerate(articles):
            repo_info = self._extract_repo_info(article)
            if not repo_info:
                continue

            title = f"{repo_info['owner']}/{repo_info['repo']}"
            if repo_info["description"]:
                short_desc = repo_info["description"][:50]
                if len(repo_info["description"]) > 50:
                    short_desc += "..."
                title = f"{title}: {short_desc}"

            since_text = {
                "daily": "今日",
                "weekly": "本周",
                "monthly": "本月",
            }.get(self.since, "今日")

            hot_score = repo_info["today_stars"] if repo_info["today_stars"] > 0 else 0

            summary = self._generate_summary(repo_info)

            language_display = self.language if self.language else "全部语言"
            source_name = f"GitHub Trending ({language_display} - {since_text})"

            tags = ["开源项目", "GitHub"]
            if repo_info["language"]:
                tags.append(repo_info["language"])

            raw_data = {
                "owner": repo_info["owner"],
                "repo": repo_info["repo"],
                "total_stars": repo_info["total_stars"],
                "today_stars": repo_info["today_stars"],
                "language": repo_info["language"],
                "built_by": repo_info["built_by"],
                "since": self.since,
            }

            item = RawNewsItem(
                title=title,
                original_url=repo_info["url"],
                source_name=source_name,
                publish_time=datetime.now(timezone.utc),
                summary=summary,
                cover_image=None,
                content_snippet=summary,
                language="en",
                region="global",
                raw_data=raw_data,
            )
            items.append(item)

        return items

    async def test_connection(self) -> bool:
        html = await self._fetch_page(self._build_url())
        if not html:
            return False
        soup = BeautifulSoup(html, "html.parser")
        articles = soup.find_all("article", class_="Box-row")
        return len(articles) > 0
