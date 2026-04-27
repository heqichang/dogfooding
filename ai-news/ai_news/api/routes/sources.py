from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_news.api.schemas import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceUpdate,
    FetchTaskResponse,
)
from ai_news.core.database import get_db
from ai_news.models import DataSource, FetchTask
from ai_news.scheduler import get_scheduler

router = APIRouter(prefix="/sources", tags=["数据源管理"])


@router.get("/", response_model=List[DataSourceResponse])
async def list_sources(
    enabled_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(DataSource)
    if enabled_only:
        query = query.where(DataSource.enabled == True)
    query = query.order_by(DataSource.name)

    result = await db.execute(query)
    sources = result.scalars().all()

    return [DataSourceResponse.model_validate(source) for source in sources]


@router.get("/{source_id}", response_model=DataSourceResponse)
async def get_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="数据源不存在")

    return DataSourceResponse.model_validate(source)


@router.post("/", response_model=DataSourceResponse, status_code=201)
async def create_source(
    source_data: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(DataSource).where(DataSource.name == source_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="数据源名称已存在")

    source = DataSource(
        name=source_data.name,
        source_type=source_data.source_type,
        url=source_data.url,
        region=source_data.region,
        enabled=source_data.enabled,
        fetch_interval=source_data.fetch_interval,
        config=source_data.config,
    )

    db.add(source)
    await db.commit()
    await db.refresh(source)

    if source.enabled:
        scheduler = get_scheduler()
        await scheduler.add_source_job(source)

    return DataSourceResponse.model_validate(source)


@router.put("/{source_id}", response_model=DataSourceResponse)
async def update_source(
    source_id: int,
    source_data: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="数据源不存在")

    update_data = source_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)

    scheduler = get_scheduler()
    await scheduler.update_source_job(source)

    return DataSourceResponse.model_validate(source)


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="数据源不存在")

    scheduler = get_scheduler()
    await scheduler.remove_source_job(source_id)

    await db.delete(source)
    await db.commit()


@router.post("/{source_id}/enable", response_model=DataSourceResponse)
async def enable_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="数据源不存在")

    if source.enabled:
        return DataSourceResponse.model_validate(source)

    source.enabled = True
    await db.commit()
    await db.refresh(source)

    scheduler = get_scheduler()
    await scheduler.add_source_job(source)

    return DataSourceResponse.model_validate(source)


@router.post("/{source_id}/disable", response_model=DataSourceResponse)
async def disable_source(
    source_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(status_code=404, detail="数据源不存在")

    if not source.enabled:
        return DataSourceResponse.model_validate(source)

    source.enabled = False
    await db.commit()
    await db.refresh(source)

    scheduler = get_scheduler()
    await scheduler.remove_source_job(source_id)

    return DataSourceResponse.model_validate(source)


@router.get("/{source_id}/tasks", response_model=List[FetchTaskResponse])
async def list_source_tasks(
    source_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FetchTask)
        .where(FetchTask.source_id == source_id)
        .order_by(FetchTask.created_at.desc())
        .limit(limit)
    )
    tasks = result.scalars().all()

    return [FetchTaskResponse.model_validate(task) for task in tasks]
