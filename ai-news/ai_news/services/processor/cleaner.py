import hashlib
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from bs4 import BeautifulSoup

from ai_news.core.config import settings


@dataclass
class CleanedContent:
    title: str
    summary: Optional[str]
    content_snippet: Optional[str]
    cover_image: Optional[str]
    cleaned_at: datetime


class BaseContentCleaner(ABC):
    @abstractmethod
    def clean_html(self, html_content: str) -> str:
        pass

    @abstractmethod
    def clean_title(self, title: str) -> str:
        pass

    @abstractmethod
    def clean_summary(self, summary: str) -> str:
        pass

    @abstractmethod
    def extract_image(self, html_content: str) -> Optional[str]:
        pass


class ContentCleaner(BaseContentCleaner):
    REMOVE_PATTERNS = [
        re.compile(r"广告|推广|赞助|合作|点击关注|扫码关注|加微信|加QQ", re.IGNORECASE),
        re.compile(r"本文来源|原文链接|责任编辑|作者：", re.IGNORECASE),
        re.compile(r"未经授权不得转载|版权所有|All Rights Reserved", re.IGNORECASE),
    ]

    REMOVE_TAGS = [
        "script",
        "style",
        "noscript",
        "iframe",
        "embed",
        "object",
        "form",
        "input",
        "button",
        "select",
        "textarea",
    ]

    def clean_html(self, html_content: str) -> str:
        if not html_content:
            return ""

        soup = BeautifulSoup(html_content, "lxml")

        for tag in self.REMOVE_TAGS:
            for element in soup.find_all(tag):
                element.decompose()

        for element in soup.find_all(
            class_=lambda x: x
            and any(
                keyword in x.lower()
                for keyword in ["ad", "advert", "ads", "banner", "promo", "sponsor"]
            )
        ):
            element.decompose()

        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"\n+", "\n", text)
        text = text.strip()

        return text

    def clean_title(self, title: str) -> str:
        if not title:
            return ""

        title = re.sub(r"【.*?】|\[.*?\]|\(.*?\)", "", title)
        title = re.sub(r"^【|^【.*?】", "", title)
        title = re.sub(r"^\s*[-|—|–|·|•]\s*", "", title)

        title = re.sub(r"\s+", " ", title).strip()
        title = title.strip("|·—-")

        for pattern in self.REMOVE_PATTERNS:
            title = pattern.sub("", title)

        return title.strip()

    def clean_summary(self, summary: str) -> str:
        if not summary:
            return ""

        summary = self.clean_html(summary)

        for pattern in self.REMOVE_PATTERNS:
            summary = pattern.sub("", summary)

        summary = re.sub(r"\s+", " ", summary).strip()
        summary = re.sub(r"\n\s*\n", "\n\n", summary)

        return summary

    def extract_image(self, html_content: str) -> Optional[str]:
        if not html_content:
            return None

        soup = BeautifulSoup(html_content, "lxml")

        meta_image = soup.find("meta", property="og:image")
        if meta_image and meta_image.get("content"):
            return meta_image["content"]

        meta_twitter = soup.find("meta", name="twitter:image")
        if meta_twitter and meta_twitter.get("content"):
            return meta_twitter["content"]

        images = soup.find_all("img")
        for img in images:
            src = img.get("src", "")
            if not src:
                continue

            if "logo" in src.lower() or "icon" in src.lower():
                continue

            srcset = img.get("srcset", "")
            if srcset:
                sources = srcset.split(",")
                if sources:
                    first_src = sources[0].strip().split()[0]
                    if first_src and "http" in first_src:
                        return first_src

            if src.startswith("http"):
                return src

        return None

    def clean(
        self,
        title: str,
        summary: Optional[str] = None,
        content: Optional[str] = None,
    ) -> CleanedContent:
        cleaned_title = self.clean_title(title)
        cleaned_summary = None
        cleaned_content = None
        cover_image = None

        if summary:
            cleaned_summary = self.clean_summary(summary)

        if content:
            cleaned_content = self.clean_html(content)
            cover_image = self.extract_image(content)

        if not cleaned_summary and cleaned_content:
            cleaned_summary = cleaned_content[:500]
            if len(cleaned_content) > 500:
                cleaned_summary += "..."

        return CleanedContent(
            title=cleaned_title,
            summary=cleaned_summary,
            content_snippet=cleaned_content,
            cover_image=cover_image,
            cleaned_at=datetime.utcnow(),
        )


_cleaner: Optional[ContentCleaner] = None


def get_content_cleaner() -> ContentCleaner:
    global _cleaner
    if _cleaner is None:
        _cleaner = ContentCleaner()
    return _cleaner
