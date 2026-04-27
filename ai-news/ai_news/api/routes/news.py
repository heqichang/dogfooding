from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ai_news.api.schemas import (
    FetchResultResponse,
    JobResponse,
    NewsItemResponse,
    NewsListResponse,
    StatisticsResponse,
)
from ai_news.core.database import get_db
from ai_news.models import NewsItem
from ai_news.scheduler import get_scheduler

router = APIRouter(prefix="/news", tags=["新闻资讯"])


@router.get("/", response_model=NewsListResponse)
async def list_news(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    category: Optional[str] = Query(None, description="分类筛选"),
    region: Optional[str] = Query(None, description="地区筛选"),
    source_name: Optional[str] = Query(None, description="来源筛选"),
    is_hot: Optional[bool] = Query(None, description="是否热门"),
    db: AsyncSession = Depends(get_db),
):
    query = select(NewsItem).where(NewsItem.is_filtered == False)

    if category:
        query = query.where(NewsItem.category == category)
    if region:
        query = query.where(NewsItem.region == region)
    if source_name:
        query = query.where(NewsItem.source_name == source_name)
    if is_hot is not None:
        query = query.where(NewsItem.is_hot == is_hot)

    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = (
        query.order_by(
            NewsItem.is_hot.desc(),
            case(
                (NewsItem.publish_time.is_(None), 0),
                else_=1,
            ).desc(),
            NewsItem.publish_time.desc(),
            NewsItem.created_at.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    return NewsListResponse(
        items=[NewsItemResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=page * page_size < total,
    )


@router.get("/{news_id}", response_model=NewsItemResponse)
async def get_news(
    news_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NewsItem).where(NewsItem.id == news_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="新闻不存在")

    return NewsItemResponse.model_validate(item)


@router.get("/hot", response_model=NewsListResponse)
async def list_hot_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await list_news(
        page=page,
        page_size=page_size,
        is_hot=True,
        db=db,
    )


@router.get("/categories/{category}", response_model=NewsListResponse)
async def list_news_by_category(
    category: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await list_news(
        page=page,
        page_size=page_size,
        category=category,
        db=db,
    )


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db),
):
    from ai_news.models import DataSource

    total_news_result = await db.execute(
        select(func.count()).select_from(NewsItem)
    )
    total_news = total_news_result.scalar() or 0

    total_sources_result = await db.execute(
        select(func.count()).select_from(DataSource)
    )
    total_sources = total_sources_result.scalar() or 0

    active_sources_result = await db.execute(
        select(func.count()).select_from(DataSource).where(DataSource.enabled == True)
    )
    active_sources = active_sources_result.scalar() or 0

    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    news_today_result = await db.execute(
        select(func.count()).select_from(NewsItem).where(
            NewsItem.created_at >= today_start
        )
    )
    news_today = news_today_result.scalar() or 0

    week_ago = today_start - timedelta(days=7)
    news_week_result = await db.execute(
        select(func.count()).select_from(NewsItem).where(
            NewsItem.created_at >= week_ago
        )
    )
    news_this_week = news_week_result.scalar() or 0

    categories_result = await db.execute(
        select(NewsItem.category, func.count())
        .select_from(NewsItem)
        .where(NewsItem.category.isnot(None))
        .group_by(NewsItem.category)
    )
    categories_count = {row[0]: row[1] for row in categories_result.all()}

    regions_result = await db.execute(
        select(NewsItem.region, func.count())
        .select_from(NewsItem)
        .group_by(NewsItem.region)
    )
    regions_count = {row[0]: row[1] for row in regions_result.all()}

    return StatisticsResponse(
        total_news=total_news,
        total_sources=total_sources,
        active_sources=active_sources,
        news_today=news_today,
        news_this_week=news_this_week,
        categories_count=categories_count,
        regions_count=regions_count,
    )


@router.post("/fetch/{source_id}", response_model=FetchResultResponse)
async def manual_fetch(
    source_id: int,
):
    scheduler = get_scheduler()
    result = await scheduler.run_immediate(source_id)
    return FetchResultResponse(**result)


@router.get("/jobs", response_model=list[JobResponse])
async def list_scheduled_jobs():
    scheduler = get_scheduler()
    jobs = scheduler.get_jobs()
    return [JobResponse(**job) for job in jobs]
