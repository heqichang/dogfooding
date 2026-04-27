import uvicorn

from ai_news.api.main import create_app
from ai_news.core.config import settings

app = create_app()


def main():
    uvicorn.run(
        "ai_news.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
