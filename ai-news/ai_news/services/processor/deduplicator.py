import hashlib
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Set

import jieba


@dataclass
class DeduplicationResult:
    is_duplicate: bool
    duplicate_id: Optional[str]
    similarity_score: float
    reason: Optional[str]


class BaseDeduplicator(ABC):
    @abstractmethod
    async def check_duplicate(
        self,
        title: str,
        content: str,
        url: str,
    ) -> DeduplicationResult:
        pass

    @abstractmethod
    async def record_processed(
        self,
        fingerprint: str,
        news_id: int,
        title: str,
    ) -> None:
        pass

    @abstractmethod
    def calculate_fingerprint(self, title: str, content: str, url: str) -> str:
        pass


class ContentDeduplicator(BaseDeduplicator):
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self._local_fingerprints: Set[str] = set()
        self._title_fingerprints: Set[str] = set()

    def calculate_fingerprint(self, title: str, content: str, url: str) -> str:
        title_hash = self._hash_title(title)
        content_hash = self._hash_content(content)
        url_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()

        combined = f"{title_hash}:{content_hash}:{url_hash}"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""

        text = text.lower()

        text = re.sub(r"[^\w\s\u4e00-\u9fff]", "", text)
        text = re.sub(r"\s+", "", text)

        stopwords = ["的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "他", "她", "它"]
        for word in stopwords:
            text = text.replace(word, "")

        return text

    def _hash_title(self, title: str) -> str:
        normalized = self._normalize_text(title)
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]

    def _hash_content(self, content: str) -> str:
        if not content or len(content) < 20:
            return ""

        normalized = self._normalize_text(content)

        words = jieba.lcut(normalized)
        word_freq = {}
        for word in words:
            if len(word) >= 2:
                word_freq[word] = word_freq.get(word, 0) + 1

        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        top_words = [w for w, _ in sorted_words[:20]]

        fingerprint_str = "".join(sorted(top_words))
        return hashlib.sha256(fingerprint_str.encode("utf-8")).hexdigest()[:16]

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0

        set1 = set(jieba.lcut(self._normalize_text(text1)))
        set2 = set(jieba.lcut(self._normalize_text(text2)))

        if not set1 or not set2:
            return 0.0

        intersection = len(set1 & set2)
        union = len(set1 | set2)

        return intersection / union if union > 0 else 0.0

    async def _check_redis(self, fingerprint: str) -> Optional[str]:
        if self.redis is None:
            return None

        try:
            result = await self.redis.get(f"dedup:{fingerprint}")
            return result.decode("utf-8") if result else None
        except Exception:
            return None

    async def _store_redis(self, fingerprint: str, value: str) -> None:
        if self.redis is None:
            return

        try:
            await self.redis.setex(
                f"dedup:{fingerprint}",
                86400 * 7,
                value,
            )
        except Exception:
            pass

    async def check_duplicate(
        self,
        title: str,
        content: str,
        url: str,
    ) -> DeduplicationResult:
        fingerprint = self.calculate_fingerprint(title, content, url)
        title_hash = self._hash_title(title)

        existing = await self._check_redis(fingerprint)
        if existing:
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_id=existing,
                similarity_score=1.0,
                reason="内容指纹完全匹配",
            )

        existing_title = await self._check_redis(f"title:{title_hash}")
        if existing_title:
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_id=existing_title,
                similarity_score=0.95,
                reason="标题高度相似",
            )

        if fingerprint in self._local_fingerprints:
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_id=None,
                similarity_score=1.0,
                reason="本地缓存指纹匹配",
            )

        if title_hash in self._title_fingerprints:
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_id=None,
                similarity_score=0.9,
                reason="本地缓存标题匹配",
            )

        return DeduplicationResult(
            is_duplicate=False,
            duplicate_id=None,
            similarity_score=0.0,
            reason=None,
        )

    async def record_processed(
        self,
        fingerprint: str,
        news_id: int,
        title: str,
    ) -> None:
        self._local_fingerprints.add(fingerprint)

        title_hash = self._hash_title(title)
        self._title_fingerprints.add(title_hash)

        await self._store_redis(fingerprint, str(news_id))
        await self._store_redis(f"title:{title_hash}", str(news_id))


_deduplicator: Optional[ContentDeduplicator] = None


def get_deduplicator(redis_client=None) -> ContentDeduplicator:
    global _deduplicator
    if _deduplicator is None:
        _deduplicator = ContentDeduplicator(redis_client)
    return _deduplicator
