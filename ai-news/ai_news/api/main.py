from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_news.api.routes import news_router, sources_router
from ai_news.core.config import settings
from ai_news.core.database import engine
from ai_news.models import Base
from ai_news.scheduler import get_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    scheduler = get_scheduler()
    await scheduler.start()

    yield

    await scheduler.stop()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        description="AI 资讯聚合智能体 API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(news_router, prefix="/api/v1")
    app.include_router(sources_router, prefix="/api/v1")

    @app.get("/")
    async def root():
        return {
            "name": settings.project_name,
            "version": "0.1.0",
            "status": "running",
            "docs": "/docs",
        }

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()
