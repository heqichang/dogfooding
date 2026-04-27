import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_news.collectors import create_collector
from ai_news.core.database import async_session
from ai_news.models import DataSource, FetchTask, NewsItem
from ai_news.services.processor import get_content_processor


class FetchTaskManager:
    def __init__(self):
        self.processor = get_content_processor()

    async def _create_fetch_task(
        self,
        source_id: int,
        task_type: str = "fetch",
    ) -> FetchTask:
        async with async_session() as session:
            task = FetchTask(
                source_id=source_id,
                task_type=task_type,
                status="pending",
                started_at=datetime.utcnow(),
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)
            return task

    async def _update_fetch_task(
        self,
        task_id: int,
        status: str,
        items_fetched: int = 0,
        items_new: int = 0,
        items_duplicate: int = 0,
        error_message: Optional[str] = None,
    ) -> None:
        async with async_session() as session:
            result = await session.execute(
                select(FetchTask).where(FetchTask.id == task_id)
            )
            task = result.scalar_one_or_none()

            if task:
                task.status = status
                task.items_fetched = items_fetched
                task.items_new = items_new
                task.items_duplicate = items_duplicate
                task.error_message = error_message
                if status in ["success", "failed"]:
                    task.completed_at = datetime.utcnow()
                await session.commit()

    async def _update_source_status(
        self,
        source_id: int,
        success: bool,
        error_message: Optional[str] = None,
    ) -> None:
        async with async_session() as session:
            result = await session.execute(
                select(DataSource).where(DataSource.id == source_id)
            )
            source = result.scalar_one_or_none()

            if source:
                source.last_fetch_at = datetime.utcnow()
                if success:
                    source.last_fetch_status = "success"
                    source.fail_count = 0
                else:
                    source.last_fetch_status = "failed"
                    source.fail_count += 1

                await session.commit()

    async def _save_news_items(self, news_items: List[NewsItem]) -> int:
        if not news_items:
            return 0

        async with async_session() as session:
            saved_count = 0
            for item in news_items:
                try:
                    existing = await session.execute(
                        select(NewsItem).where(
                            NewsItem.content_fingerprint == item.content_fingerprint
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue

                    session.add(item)
                    saved_count += 1
                except Exception:
                    continue

            if saved_count > 0:
                await session.commit()

            return saved_count

    async def execute_fetch(self, source: DataSource) -> Dict[str, Any]:
        source_config = {
            "name": source.name,
            "url": source.url,
            "region": source.region,
            "source_type": source.source_type,
        }

        if source.config:
            try:
                extra_config = json.loads(source.config)
                source_config.update(extra_config)
            except Exception:
                pass

        fetch_task = await self._create_fetch_task(source.id, "fetch")

        try:
            collector = create_collector(source_config)
            raw_items = await collector.fetch()

            items_fetched = len(raw_items)
            items_duplicate = 0
            items_filtered = 0
            items_new = 0

            if raw_items:
                process_results = await self.processor.process_batch(raw_items)

                news_to_save = []
                for result in process_results:
                    if result.deduplication_result and result.deduplication_result.is_duplicate:
                        items_duplicate += 1
                        continue

                    if result.filter_result and not result.filter_result.is_safe:
                        items_filtered += 1
                        continue

                    news_item = self.processor.to_news_item(result)
                    if news_item:
                        news_item.source_id = source.id
                        news_to_save.append(news_item)

                items_new = await self._save_news_items(news_to_save)

            await self._update_fetch_task(
                fetch_task.id,
                "success",
                items_fetched=items_fetched,
                items_new=items_new,
                items_duplicate=items_duplicate,
            )
            await self._update_source_status(source.id, success=True)

            return {
                "success": True,
                "source_id": source.id,
                "source_name": source.name,
                "items_fetched": items_fetched,
                "items_new": items_new,
                "items_duplicate": items_duplicate,
                "items_filtered": items_filtered,
            }

        except Exception as e:
            error_msg = str(e)
            await self._update_fetch_task(
                fetch_task.id,
                "failed",
                error_message=error_msg,
            )
            await self._update_source_status(source.id, success=False, error_message=error_msg)

            return {
                "success": False,
                "source_id": source.id,
                "source_name": source.name,
                "error": error_msg,
            }


_task_manager: Optional[FetchTaskManager] = None


def get_task_manager() -> FetchTaskManager:
    global _task_manager
    if _task_manager is None:
        _task_manager = FetchTaskManager()
    return _task_manager
