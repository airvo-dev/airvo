from __future__ import annotations

from airvo.router.classifier import classify as classify_prompt, CATEGORY_META


class RouterService:
    """Application service for prompt classification and category metadata."""

    def classify(self, prompt: str) -> str:
        return classify_prompt(prompt)

    def categories(self) -> dict:
        return CATEGORY_META
