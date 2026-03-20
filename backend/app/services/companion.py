from dataclasses import dataclass, field
from typing import Protocol

from app.core.config import Settings


@dataclass
class CompanionReply:
    reply: str
    risk_level: str = "none"
    emergency_mode: bool = False
    guidance: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)


class CompanionService(Protocol):
    def reply(self, message: str) -> CompanionReply:
        ...


class RuleBasedCompanionService:
    emergency_keywords: dict[str, list[str]] = {
        "critical": ["胸痛", "喘不上气", "呼吸困难", "昏迷", "晕倒", "大量出血"],
        "high": ["剧烈头痛", "一侧无力", "说话含糊", "心口痛", "高烧不退"],
        "medium": ["头晕", "肚子痛", "恶心", "呕吐", "发烧"],
    }

    def reply(self, message: str) -> CompanionReply:
        severity, hit_keyword = self._detect_risk(message)
        if severity != "none":
            return CompanionReply(
                reply="我听到了您身体不舒服，我现在进入紧急协助模式。",
                risk_level=severity,
                emergency_mode=True,
                guidance=self._guidance_for(severity),
                metadata={"hit_keyword": hit_keyword},
            )

        return CompanionReply(
            reply=self._daily_reply(message),
            risk_level="none",
            emergency_mode=False,
            guidance=[],
            metadata={"mode": "companion"},
        )

    def _detect_risk(self, text: str) -> tuple[str, str]:
        for level, keywords in self.emergency_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    return level, keyword
        return "none", ""

    def _guidance_for(self, severity: str) -> list[str]:
        base = [
            "请先坐下或平躺，保持通风，避免独自走动。",
            "立即联系家属或紧急联系人。",
        ]
        if severity in {"high", "critical"}:
            base.insert(1, "请尽快拨打 120，描述症状与地址。")
        return base

    def _daily_reply(self, text: str) -> str:
        if "孤单" in text or "无聊" in text:
            return "我在这儿陪您，咱们可以聊聊今天发生的事，也可以回忆过去的故事。"
        if "吃药" in text or "药" in text:
            return "我建议您现在核对药盒和时间表，如果需要我也可以帮您加一条提醒。"
        if "喝水" in text:
            return "好的，先喝几口温水。保持规律补水对身体很重要。"
        if "睡不着" in text:
            return "您先放慢呼吸，吸气 4 秒、呼气 6 秒，连续做 5 次会舒服一些。"
        return "我听着呢。您可以慢慢说，我会一步一步陪您处理。"


class OpenAICompatibleCompanionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def reply(self, message: str) -> CompanionReply:
        # 这里保留 OpenAI 兼容接口扩展位，MVP 阶段先返回可用降级结果。
        return CompanionReply(
            reply="当前在线模型未启用，已切换到本地陪伴模式。您继续说，我一直在。",
            risk_level="low",
            emergency_mode=False,
            guidance=[],
            metadata={"provider": "openai_compatible_stub"},
        )


def build_companion_service(settings: Settings) -> CompanionService:
    provider = settings.chat_provider.strip().lower()
    if provider == "openai_compatible":
        return OpenAICompatibleCompanionService(settings)
    return RuleBasedCompanionService()

