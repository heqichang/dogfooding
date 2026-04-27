from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class NewsItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    original_url: str
    source_name: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    region: str = "cn"
    language: str = "zh"
    is_hot: bool = False
    hot_score: float = 0.0


class NewsItemCreate(NewsItemBase):
    publish_time: Optional[datetime] = None
    content_snippet: Optional[str] = None


class NewsItemUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_hot: Optional[bool] = None
    is_processed: Optional[bool] = None


class NewsItemResponse(NewsItemBase):
    id: int
    source_id: Optional[int] = None
    publish_time: Optional[datetime] = None
    content_snippet: Optional[str] = None
    is_processed: bool = False
    is_filtered: bool = False
    fetched_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    items: List[NewsItemResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class DataSourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    source_type: str = Field(..., pattern="^(rss|web|api|github)$")
    url: str
    region: str = "cn"
    enabled: bool = True
    fetch_interval: int = 60
    config: Optional[str] = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None
    fetch_interval: Optional[int] = None
    config: Optional[str] = None


class DataSourceResponse(DataSourceBase):
    id: int
    last_fetch_at: Optional[datetime] = None
    last_fetch_status: Optional[str] = None
    fail_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FetchTaskResponse(BaseModel):
    id: int
    source_id: int
    task_type: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items_fetched: int = 0
    items_new: int = 0
    items_duplicate: int = 0
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StatisticsResponse(BaseModel):
    total_news: int
    total_sources: int
    active_sources: int
    news_today: int
    news_this_week: int
    categories_count: dict[str, int]
    regions_count: dict[str, int]


class FetchResultResponse(BaseModel):
    success: bool
    source_id: Optional[int] = None
    source_name: Optional[str] = None
    items_fetched: Optional[int] = None
    items_new: Optional[int] = None
    items_duplicate: Optional[int] = None
    items_filtered: Optional[int] = None
    error: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    name: str
    next_run_time: Optional[str] = None
    trigger: str
