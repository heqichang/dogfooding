import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from ai_news.core.database import async_session
from ai_news.models import DataSource
from ai_news.scheduler.task_manager import get_task_manager


class SchedulerConfig:
    DEFAULT_INTERVALS = {
        "10min": 10,
        "30min": 30,
        "1hour": 60,
        "daily": 1440,
    }

    @classmethod
    def get_interval_trigger(cls, minutes: int) -> IntervalTrigger:
        return IntervalTrigger(minutes=minutes)

    @classmethod
    def get_cron_trigger(cls, cron_expression: str) -> CronTrigger:
        parts = cron_expression.split()
        return CronTrigger(
            minute=parts[0] if len(parts) > 0 else "*",
            hour=parts[1] if len(parts) > 1 else "*",
            day=parts[2] if len(parts) > 2 else "*",
            month=parts[3] if len(parts) > 3 else "*",
            day_of_week=parts[4] if len(parts) > 4 else "*",
        )


DEFAULT_DATA_SOURCES = [
    {
        "name": "机器之心",
        "source_type": "rss",
        "url": "https://www.jiqizhixin.com/rss",
        "region": "cn",
        "enabled": True,
        "fetch_interval": 60,
    },
    {
        "name": "量子位",
        "source_type": "rss",
        "url": "https://www.qbitai.com/feed",
        "region": "cn",
        "enabled": True,
        "fetch_interval": 60,
    },
    {
        "name": "智东西",
        "source_type": "rss",
        "url": "https://www.zhidx.com/feed",
        "region": "cn",
        "enabled": True,
        "fetch_interval": 60,
    },
    {
        "name": "GitHub Trending (Python)",
        "source_type": "github",
        "url": "https://github.com/trending/python",
        "region": "global",
        "enabled": True,
        "fetch_interval": 120,
        "config": json.dumps({"language": "python", "since": "daily"}),
    },
    {
        "name": "GitHub Trending (全部语言)",
        "source_type": "github",
        "url": "https://github.com/trending",
        "region": "global",
        "enabled": True,
        "fetch_interval": 120,
        "config": json.dumps({"language": "", "since": "daily"}),
    },
    {
        "name": "GitHub Trending (JavaScript)",
        "source_type": "github",
        "url": "https://github.com/trending/javascript",
        "region": "global",
        "enabled": False,
        "fetch_interval": 120,
        "config": json.dumps({"language": "javascript", "since": "daily"}),
    },
    {
        "name": "GitHub Trending (Rust)",
        "source_type": "github",
        "url": "https://github.com/trending/rust",
        "region": "global",
        "enabled": False,
        "fetch_interval": 120,
        "config": json.dumps({"language": "rust", "since": "daily"}),
    },
    {
        "name": "GitHub Trending (Go)",
        "source_type": "github",
        "url": "https://github.com/trending/go",
        "region": "global",
        "enabled": False,
        "fetch_interval": 120,
        "config": json.dumps({"language": "go", "since": "daily"}),
    },
]


class NewsScheduler:
    def __init__(self):
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.task_manager = get_task_manager()
        self._running = False

    async def _fetch_source(self, source_id: int) -> Dict[str, Any]:
        async with async_session() as session:
            result = await session.execute(
                select(DataSource).where(DataSource.id == source_id)
            )
            source = result.scalar_one_or_none()

            if not source or not source.enabled:
                return {"success": False, "reason": "Source not found or disabled"}

            return await self.task_manager.execute_fetch(source)

    async def initialize_default_sources(self) -> int:
        async with async_session() as session:
            result = await session.execute(select(DataSource))
            existing = result.scalars().all()

            if existing:
                return 0

            added = 0
            for source_data in DEFAULT_DATA_SOURCES:
                source = DataSource(
                    name=source_data["name"],
                    source_type=source_data["source_type"],
                    url=source_data["url"],
                    region=source_data["region"],
                    enabled=source_data["enabled"],
                    fetch_interval=source_data["fetch_interval"],
                    config=source_data.get("config"),
                )
                session.add(source)
                added += 1

            await session.commit()
            return added

    def _create_job_id(self, source_id: int) -> str:
        return f"fetch_source_{source_id}"

    async def add_source_job(self, source: DataSource) -> bool:
        if not self.scheduler or not source.enabled:
            return False

        job_id = self._create_job_id(source.id)

        existing_job = self.scheduler.get_job(job_id)
        if existing_job:
            self.scheduler.remove_job(job_id)

        interval_minutes = source.fetch_interval or 60

        self.scheduler.add_job(
            self._fetch_source,
            trigger=IntervalTrigger(minutes=interval_minutes),
            id=job_id,
            args=[source.id],
            name=f"Fetch: {source.name}",
            replace_existing=True,
        )

        return True

    async def remove_source_job(self, source_id: int) -> bool:
        if not self.scheduler:
            return False

        job_id = self._create_job_id(source_id)
        job = self.scheduler.get_job(job_id)
        if job:
            self.scheduler.remove_job(job_id)
            return True
        return False

    async def update_source_job(self, source: DataSource) -> bool:
        if not source.enabled:
            return await self.remove_source_job(source.id)
        return await self.add_source_job(source)

    async def start(self) -> None:
        if self._running:
            return

        await self.initialize_default_sources()

        self.scheduler = AsyncIOScheduler()

        async with async_session() as session:
            result = await session.execute(
                select(DataSource).where(DataSource.enabled == True)
            )
            sources = result.scalars().all()

            for source in sources:
                await self.add_source_job(source)

        self.scheduler.start()
        self._running = True

    async def stop(self) -> None:
        if self.scheduler:
            self.scheduler.shutdown(wait=False)
            self._running = False

    async def run_immediate(self, source_id: int) -> Dict[str, Any]:
        return await self._fetch_source(source_id)

    def get_jobs(self) -> List[Dict[str, Any]]:
        if not self.scheduler:
            return []

        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append(
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": str(job.next_run_time) if job.next_run_time else None,
                    "trigger": str(job.trigger),
                }
            )
        return jobs


_scheduler: Optional[NewsScheduler] = None


def get_scheduler() -> NewsScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = NewsScheduler()
    return _scheduler
