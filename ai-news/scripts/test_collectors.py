import asyncio
import json

from ai_news.collectors import create_collector
from ai_news.services.processor import get_content_processor


async def test_rss_collector():
    print("=" * 60)
    print("测试 RSS 采集器")
    print("=" * 60)

    test_sources = [
        {
            "name": "机器之心测试",
            "source_type": "rss",
            "url": "https://www.jiqizhixin.com/rss",
            "region": "cn",
        },
    ]

    for source_config in test_sources:
        print(f"\n测试源: {source_config['name']}")
        print(f"URL: {source_config['url']}")

        try:
            collector = create_collector(source_config)

            is_connected = await collector.test_connection()
            print(f"连接测试: {'✓ 通过' if is_connected else '✗ 失败'}")

            if is_connected:
                items = await collector.fetch()
                print(f"抓取数量: {len(items)} 条")

                if items:
                    for i, item in enumerate(items[:3]):
                        print(f"\n  第 {i+1} 条:")
                        print(f"    标题: {item.title}")
                        print(f"    URL: {item.original_url}")
                        print(f"    来源: {item.source_name}")
                        print(f"    摘要: {item.summary[:100] if item.summary else '无'}...")

        except Exception as e:
            print(f"测试失败: {e}")


async def test_github_collector():
    print("\n" + "=" * 60)
    print("测试 GitHub Trending 采集器")
    print("=" * 60)

    test_sources = [
        {
            "name": "GitHub Trending (Python)",
            "source_type": "github",
            "url": "https://github.com/trending/python",
            "region": "global",
            "language": "python",
            "since": "daily",
        },
    ]

    for source_config in test_sources:
        print(f"\n测试源: {source_config['name']}")

        try:
            collector = create_collector(source_config)

            is_connected = await collector.test_connection()
            print(f"连接测试: {'✓ 通过' if is_connected else '✗ 失败'}")

            if is_connected:
                items = await collector.fetch()
                print(f"抓取数量: {len(items)} 条")

                if items:
                    for i, item in enumerate(items[:3]):
                        print(f"\n  第 {i+1} 条:")
                        print(f"    标题: {item.title}")
                        print(f"    URL: {item.original_url}")
                        if item.raw_data:
                            print(f"    Stars: {item.raw_data.get('total_stars', 'N/A')}")
                            print(f"    Today: {item.raw_data.get('today_stars', 'N/A')}")

        except Exception as e:
            print(f"测试失败: {e}")


async def test_content_cleaner():
    print("\n" + "=" * 60)
    print("测试内容清洗器")
    print("=" * 60)

    from ai_news.services.processor.cleaner import ContentCleaner

    cleaner = ContentCleaner()

    test_cases = [
        {
            "title": " 【重磅】GPT-5 即将发布！[广告]  ",
            "summary": "<p>这是一段测试内容。<script>alert('xss')</script>点击关注获取更多信息。</p>",
        },
    ]

    for test in test_cases:
        print(f"\n原始标题: {test['title']}")
        result = cleaner.clean(
            title=test["title"],
            summary=test["summary"],
        )
        print(f"清洗后标题: {result.title}")
        print(f"清洗后摘要: {result.summary}")


async def main():
    print("AI 资讯聚合智能体 - 测试脚本")
    print("=" * 60)

    await test_rss_collector()
    await test_github_collector()
    await test_content_cleaner()

    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
