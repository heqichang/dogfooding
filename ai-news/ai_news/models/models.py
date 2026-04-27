from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum, Index, String, Text, Boolean, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ai_news.core.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    source_type: Mapped[str] = mapped_column(
        Enum("rss", "web", "api", "github", name="source_type_enum"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    region: Mapped[str] = mapped_column(
        Enum("cn", "en", "global", name="region_enum"),
        default="cn",
        nullable=False,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    fetch_interval: Mapped[int] = mapped_column(default=60)
    last_fetch_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_fetch_status: Mapped[Optional[str]] = mapped_column(String(20))
    fail_count: Mapped[int] = mapped_column(default=0)
    config: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    news_items: Mapped[List["NewsItem"]] = relationship(
        "NewsItem", back_populates="source"
    )

    __table_args__ = (
        Index("idx_source_type", "source_type"),
        Index("idx_enabled", "enabled"),
        Index("idx_region", "region"),
    )


class NewsItem(Base):
    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    original_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("data_sources.id", ondelete="SET NULL")
    )
    source_name: Mapped[str] = mapped_column(String(100))
    publish_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500))
    content_snippet: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(50))
    tags: Mapped[Optional[str]] = mapped_column(String(500))
    region: Mapped[str] = mapped_column(
        Enum("cn", "en", name="region_enum"),
        default="cn",
    )
    language: Mapped[str] = mapped_column(String(10), default="zh")
    is_hot: Mapped[bool] = mapped_column(Boolean, default=False)
    is_original: Mapped[bool] = mapped_column(Boolean, default=False)
    hot_score: Mapped[float] = mapped_column(Float, default=0.0)
    content_fingerprint: Mapped[str] = mapped_column(String(64), unique=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_filtered: Mapped[bool] = mapped_column(Boolean, default=False)
    filter_reason: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source: Mapped[Optional["DataSource"]] = relationship(
        "DataSource", back_populates="news_items"
    )

    __table_args__ = (
        Index("idx_publish_time", "publish_time"),
        Index("idx_category", "category"),
        Index("idx_region", "region"),
        Index("idx_is_hot", "is_hot"),
        Index("idx_created_at", "created_at"),
        Index("idx_content_fingerprint", "content_fingerprint"),
    )


class FetchTask(Base):
    __tablename__ = "fetch_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id", ondelete="CASCADE"))
    task_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pending", "running", "success", "failed", name="task_status_enum"),
        default="pending",
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    items_fetched: Mapped[int] = mapped_column(default=0)
    items_new: Mapped[int] = mapped_column(default=0)
    items_duplicate: Mapped[int] = mapped_column(default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_source_id", "source_id"),
        Index("idx_status", "status"),
        Index("idx_created_at", "created_at"),
    )


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_date: Mapped[str] = mapped_column(String(10), nullable=False)
    report_type: Mapped[str] = mapped_column(
        Enum("morning", "evening", name="report_type_enum"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    news_count: Mapped[int] = mapped_column(default=0)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    __table_args__ = (
        Index("idx_report_date", "report_date"),
        Index("idx_report_type", "report_type"),
    )


class NewsCategory(Base):
    __tablename__ = "news_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name_en: Mapped[Optional[str]] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(String(200))
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_sort_order", "sort_order"),
        Index("idx_is_active", "is_active"),
    )
