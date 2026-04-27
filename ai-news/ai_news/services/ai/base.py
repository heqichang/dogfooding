from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class AIClassificationResult:
    category: str
    tags: List[str]
    confidence: float


@dataclass
class AISummaryResult:
    summary: str
    original_length: int
    summary_length: int


@dataclass
class AITranslationResult:
    translated_text: str
    source_language: str
    target_language: str


@dataclass
class AIContentFilterResult:
    is_safe: bool
    risk_score: float
    risk_category: Optional[str]
    reason: Optional[str]


class BaseAIService(ABC):
    @abstractmethod
    async def generate_summary(
        self,
        content: str,
        max_words: int = 200,
        min_words: int = 100,
    ) -> AISummaryResult:
        pass

    @abstractmethod
    async def classify_content(
        self,
        title: str,
        content: str,
    ) -> AIClassificationResult:
        pass

    @abstractmethod
    async def translate(
        self,
        text: str,
        target_language: str = "zh",
        source_language: Optional[str] = None,
    ) -> AITranslationResult:
        pass

    @abstractmethod
    async def filter_content(
        self,
        title: str,
        content: str,
    ) -> AIContentFilterResult:
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        pass
