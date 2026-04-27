import asyncio

from ai_news.core.database import engine
from ai_news.models import Base


async def init_db():
    print("正在初始化数据库...")

    async with engine.begin() as conn:
        print("创建数据表...")
        await conn.run_sync(Base.metadata.create_all)

    print("数据库初始化完成！")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
