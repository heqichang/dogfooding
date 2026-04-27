import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

from ai_news.collectors.base import RawNewsItem
from ai_news.models import NewsItem
from ai_news.services.ai import AIClassificationResult, AIContentFilterResult, get_ai_service
from ai_news.services.processor.cleaner import CleanedContent, get_content_cleaner
from ai_news.services.processor.deduplicator import DeduplicationResult, get_deduplicator


@dataclass
class ProcessResult:
    raw_item: RawNewsItem
    cleaned_content: Optional[CleanedContent] = None
    deduplication_result: Optional[DeduplicationResult] = None
    filter_result: Optional[AIContentFilterResult] = None
    classification_result: Optional[AIClassificationResult] = None
    summary_result: Optional[str] = None
    translation_result: Optional[str] = None
    is_success: bool = True
    error_message: Optional[str] = None
    processed_at: datetime = datetime.utcnow()

    def should_save(self) -> bool:
        if not self.is_success:
            return False
        if self.deduplication_result and self.deduplication_result.is_duplicate:
            return False
        if self.filter_result and not self.filter_result.is_safe:
            return False
        return True


class ContentProcessor:
    def __init__(
        self,
        enable_ai: bool = True,
        enable_translation: bool = True,
        enable_filter: bool = True,
    ):
        self.enable_ai = enable_ai
        self.enable_translation = enable_translation
        self.enable_filter = enable_filter

        self.cleaner = get_content_cleaner()
        self.deduplicator = get_deduplicator()
        self.ai_service = get_ai_service() if enable_ai else None

    async def process_single(
        self,
        raw_item: RawNewsItem,
    ) -> ProcessResult:
        result = ProcessResult(raw_item=raw_item)

        try:
            result.cleaned_content = self.cleaner.clean(
                title=raw_item.title,
                summary=raw_item.summary,
                content=raw_item.content_snippet,
            )

            title_to_check = result.cleaned_content.title if result.cleaned_content else raw_item.title
            content_to_check = (
                result.cleaned_content.summary if result.cleaned_content and result.cleaned_content.summary
                else raw_item.summary or ""
            )

            result.deduplication_result = await self.deduplicator.check_duplicate(
                title=title_to_check,
                content=content_to_check,
                url=raw_item.original_url,
            )

            if result.deduplication_result.is_duplicate:
                return result

            if self.enable_filter:
                result.filter_result = await self.ai_service.filter_content(
                    title=title_to_check,
                    content=content_to_check,
                )

                if not result.filter_result.is_safe:
                    return result

            if self.enable_ai and self.ai_service:
                if self.enable_translation and raw_item.language != "zh":
                    text_to_translate = (
                        result.cleaned_content.summary
                        if result.cleaned_content and result.cleaned_content.summary
                        else raw_item.summary or raw_item.title
                    )

                    if text_to_translate:
                        translation = await self.ai_service.translate(
                            text=text_to_translate,
                            target_language="zh",
                            source_language=raw_item.language,
                        )
                        result.translation_result = translation.translated_text

                        if result.cleaned_content and result.translation_result:
                            result.cleaned_content.summary = result.translation_result

                content_for_ai = (
                    result.cleaned_content.summary
                    if result.cleaned_content and result.cleaned_content.summary
                    else raw_item.summary or raw_item.title
                )

                if content_for_ai:
                    result.classification_result = await self.ai_service.classify_content(
                        title=title_to_check,
                        content=content_for_ai,
                    )

                    if len(content_for_ai) > 300:
                        summary = await self.ai_service.generate_summary(
                            content=content_for_ai,
                            max_words=200,
                            min_words=100,
                        )
                        result.summary_result = summary.summary

                        if result.cleaned_content:
                            result.cleaned_content.summary = result.summary_result

        except Exception as e:
            result.is_success = False
            result.error_message = str(e)

        return result

    async def process_batch(
        self,
        raw_items: List[RawNewsItem],
        max_concurrent: int = 5,
    ) -> List[ProcessResult]:
        results = []
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_semaphore(item: RawNewsItem) -> ProcessResult:
            async with semaphore:
                return await self.process_single(item)

        tasks = [process_with_semaphore(item) for item in raw_items]
        results = await asyncio.gather(*tasks)

        return list(results)

    def to_news_item(self, process_result: ProcessResult) -> Optional[NewsItem]:
        if not process_result.should_save():
            return None

        raw_item = process_result.raw_item
        cleaned = process_result.cleaned_content

        fingerprint = self.deduplicator.calculate_fingerprint(
            title=cleaned.title if cleaned else raw_item.title,
            content=cleaned.summary if cleaned and cleaned.summary else raw_item.summary or "",
            url=raw_item.original_url,
        )

        category = None
        tags = None
        if process_result.classification_result:
            category = process_result.classification_result.category
            tags_list = process_result.classification_result.tags
            if tags_list:
                tags = ",".join(tags_list)

        cover_image = None
        if cleaned and cleaned.cover_image:
            cover_image = cleaned.cover_image
        elif raw_item.cover_image:
            cover_image = raw_item.cover_image

        summary = None
        if cleaned and cleaned.summary:
            summary = cleaned.summary
        elif raw_item.summary:
            summary = raw_item.summary

        content_snippet = None
        if cleaned and cleaned.content_snippet:
            content_snippet = cleaned.content_snippet
        elif raw_item.content_snippet:
            content_snippet = raw_item.content_snippet

        language = raw_item.language
        if process_result.translation_result:
            language = "zh"

        hot_score = 0.0
        if raw_item.raw_data and "today_stars" in raw_item.raw_data:
            hot_score = float(raw_item.raw_data["today_stars"])

        news_item = NewsItem(
            title=cleaned.title if cleaned else raw_item.title,
            original_url=raw_item.original_url,
            source_name=raw_item.source_name,
            publish_time=raw_item.publish_time,
            summary=summary,
            cover_image=cover_image,
            content_snippet=content_snippet,
            category=category,
            tags=tags,
            region=raw_item.region,
            language=language,
            is_hot=False,
            is_original=False,
            hot_score=hot_score,
            content_fingerprint=fingerprint,
            is_processed=True,
            processed_at=datetime.utcnow(),
        )

        return news_item


_processor: Optional[ContentProcessor] = None


def get_content_processor(
    enable_ai: bool = True,
    enable_translation: bool = True,
    enable_filter: bool = True,
) -> ContentProcessor:
    global _processor
    if _processor is None:
        _processor = ContentProcessor(
            enable_ai=enable_ai,
            enable_translation=enable_translation,
            enable_filter=enable_filter,
        )
    return _processor
