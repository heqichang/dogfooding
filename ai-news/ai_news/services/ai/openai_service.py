import json
from typing import List, Optional

import httpx
from openai import AsyncOpenAI

from ai_news.core.config import settings
from ai_news.services.ai.base import (
    AIClassificationResult,
    AIContentFilterResult,
    AISummaryResult,
    AITranslationResult,
    BaseAIService,
)

CATEGORIES = [
    "大模型",
    "多模态",
    "AI芯片",
    "自动驾驶",
    "开源项目",
    "行业政策",
    "投融资",
    "海外动态",
    "AI安全",
    "其他",
]

CATEGORY_KEYWORDS = {
    "大模型": ["GPT", "LLM", "大模型", "语言模型", "Transformer", "基座模型", "预训练"],
    "多模态": ["多模态", "视觉语言", "图文", "视频生成", "图像生成", "VLM", "CLIP"],
    "AI芯片": ["芯片", "GPU", "TPU", "NPU", "H100", "A100", "半导体", "算力", "硬件"],
    "自动驾驶": ["自动驾驶", "无人驾驶", "智能驾驶", "自动驾驶", "Robotaxi", "ADAS"],
    "开源项目": ["开源", "GitHub", "Star", "开源项目", "开源社区", "MIT", "Apache"],
    "行业政策": ["政策", "法规", "监管", "政府", "条例", "规定", "准则"],
    "投融资": ["融资", "投资", "估值", "IPO", "并购", "融资", "投资", "领投", "跟投"],
    "海外动态": ["OpenAI", "Anthropic", "DeepMind", "Google", "Microsoft", "Meta"],
    "AI安全": ["安全", "伦理", "风险", "AI安全", "对齐", "监管", "风险"],
}


class OpenAICompatibleService(BaseAIService):
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.openai_api_key
        self.api_base = api_base or settings.openai_api_base
        self.model = model or settings.openai_model

        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.api_base,
                http_client=httpx.AsyncClient(timeout=60.0),
            )
        return self._client

    async def _chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.3,
    ) -> Optional[str]:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )

            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
            return None
        except Exception:
            return None

    async def generate_summary(
        self,
        content: str,
        max_words: int = 200,
        min_words: int = 100,
    ) -> AISummaryResult:
        original_length = len(content)

        if original_length < min_words:
            return AISummaryResult(
                summary=content,
                original_length=original_length,
                summary_length=original_length,
            )

        system_prompt = f"""你是一个专业的AI资讯编辑。请将以下内容压缩成一篇精简摘要，
要求：
1. 字数控制在 {min_words}-{max_words} 字之间
2. 保留核心信息：时间、主体、事件、关键点
3. 语言流畅，符合中文表达习惯
4. 不要使用列表或编号格式，用段落形式呈现
5. 保留原文中的关键数据和专有名词"""

        user_prompt = f"请为以下内容生成摘要：\n\n{content[:8000]}"

        summary = await self._chat_completion(system_prompt, user_prompt, max_tokens=500)

        if not summary:
            summary = content[:max_words * 2]

        return AISummaryResult(
            summary=summary,
            original_length=original_length,
            summary_length=len(summary),
        )

    def _classify_by_keywords(self, title: str, content: str) -> Optional[AIClassificationResult]:
        combined_text = f"{title} {content}".lower()

        best_category = "其他"
        best_score = 0
        matched_tags = []

        for category, keywords in CATEGORY_KEYWORDS.items():
            score = 0
            tags_for_category = []

            for keyword in keywords:
                if keyword.lower() in combined_text:
                    score += 1
                    tags_for_category.append(keyword)

            if score > best_score:
                best_score = score
                best_category = category
                matched_tags = tags_for_category

        if best_score > 0:
            return AIClassificationResult(
                category=best_category,
                tags=matched_tags[:5],
                confidence=min(0.9, 0.5 + best_score * 0.1),
            )

        return None

    async def classify_content(
        self,
        title: str,
        content: str,
    ) -> AIClassificationResult:
        keyword_result = self._classify_by_keywords(title, content)

        if keyword_result and keyword_result.confidence > 0.7:
            return keyword_result

        categories_str = "、".join(CATEGORIES)

        system_prompt = f"""你是一个专业的AI资讯分类器。请将以下新闻内容分类到以下类别中的一个：
{categories_str}

要求：
1. 只选择一个最适合的类别
2. 同时提取 3-5 个相关标签
3. 以 JSON 格式输出，包含: category, tags, confidence

示例输出：
{{
    "category": "大模型",
    "tags": ["GPT", "OpenAI", "大模型"],
    "confidence": 0.95
}}"""

        user_prompt = f"标题：{title}\n\n内容摘要：{content[:3000]}"

        result_str = await self._chat_completion(system_prompt, user_prompt, max_tokens=200)

        if result_str:
            try:
                json_start = result_str.find("{")
                json_end = result_str.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = result_str[json_start:json_end]
                    result = json.loads(json_str)

                    category = result.get("category", "其他")
                    if category not in CATEGORIES:
                        category = "其他"

                    return AIClassificationResult(
                        category=category,
                        tags=result.get("tags", [])[:5],
                        confidence=float(result.get("confidence", 0.7)),
                    )
            except Exception:
                pass

        if keyword_result:
            return keyword_result

        return AIClassificationResult(
            category="其他",
            tags=[],
            confidence=0.5,
        )

    async def translate(
        self,
        text: str,
        target_language: str = "zh",
        source_language: Optional[str] = None,
    ) -> AITranslationResult:
        if target_language.startswith("zh"):
            target_lang_name = "中文"
        elif target_language.startswith("en"):
            target_lang_name = "英文"
        else:
            target_lang_name = target_language

        system_prompt = f"""你是一个专业的翻译官。请将以下内容翻译成{target_lang_name}。
要求：
1. 保持原意不变
2. 语言流畅自然
3. 保留专有名词和专业术语
4. 对于技术内容，使用行业通用译法"""

        user_prompt = text[:8000]

        translated = await self._chat_completion(system_prompt, user_prompt, max_tokens=4000)

        if not translated:
            translated = text

        return AITranslationResult(
            translated_text=translated,
            source_language=source_language or "auto",
            target_language=target_language,
        )

    async def filter_content(
        self,
        title: str,
        content: str,
    ) -> AIContentFilterResult:
        combined_text = f"{title} {content}".lower()

        sensitive_keywords = [
            "敏感词",
            "违规",
            "色情",
            "暴力",
            "赌博",
            "毒品",
            "诈骗",
            "传销",
        ]

        for keyword in sensitive_keywords:
            if keyword in combined_text:
                return AIContentFilterResult(
                    is_safe=False,
                    risk_score=0.9,
                    risk_category="敏感内容",
                    reason=f"包含敏感关键词: {keyword}",
                )

        marketing_patterns = [
            "加微信",
            "加QQ",
            "扫码关注",
            "点击领取",
            "限时优惠",
            "立即购买",
        ]

        marketing_count = 0
        for pattern in marketing_patterns:
            if pattern in combined_text:
                marketing_count += 1

        if marketing_count >= 2:
            return AIContentFilterResult(
                is_safe=False,
                risk_score=0.7,
                risk_category="营销内容",
                reason=f"检测到营销内容，包含 {marketing_count} 个营销模式",
            )

        return AIContentFilterResult(
            is_safe=True,
            risk_score=0.0,
            risk_category=None,
            reason=None,
        )

    async def is_available(self) -> bool:
        try:
            models = await self.client.models.list()
            return len(models.data) > 0
        except Exception:
            return False


_ai_service: Optional[OpenAICompatibleService] = None


def get_ai_service() -> OpenAICompatibleService:
    global _ai_service
    if _ai_service is None:
        _ai_service = OpenAICompatibleService()
    return _ai_service
