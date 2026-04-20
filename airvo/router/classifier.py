"""
Smart Router — prompt classifier.

Classifies a prompt into one of 6 categories using fast regex/keyword
matching. No API calls — runs in microseconds.

Categories
----------
code      — writing new code, functions, classes, scripts
debug     — fixing errors, tracebacks, bugs, exceptions
math      — calculations, equations, proofs, statistics
creative  — stories, poems, marketing copy, brainstorming
explain   — explanations, definitions, "how does X work", summaries
general   — everything else (default fallback)
"""

import re
from typing import Literal

Category = Literal["code", "debug", "math", "creative", "explain", "general"]

# ── Pattern sets (order matters — more specific first) ────────────────────

_DEBUG_PATTERNS = [
    r"\berror\b", r"\bexception\b", r"\btraceback\b", r"\bbug\b",
    r"\bfix\b.*\b(code|function|script|error)\b",
    r"\b(not working|broken|failing|crash)\b",
    r"\bAttributeError\b", r"\bTypeError\b", r"\bValueError\b",
    r"\bKeyError\b", r"\bIndexError\b", r"\bSyntaxError\b",
    r"\bImportError\b", r"\bNameError\b", r"\bRuntimeError\b",
    r"why (is|does|won't|doesn't|can't).*\b(work|run|compile|execute)\b",
    r"\bdebug\b",
]

_CODE_PATTERNS = [
    r"\b(write|create|generate|implement|build|make)\b.{0,30}\b(code|function|class|script|program|method|api|endpoint|algorithm)\b",
    r"\b(code|function|class|method|algorithm|implement)\b",
    r"\b(python|javascript|typescript|rust|go|java|c\+\+|sql|bash|powershell|html|css|react|vue|node)\b",
    r"```",
    r"\bdef \w+\(", r"\bclass \w+",
    r"\brefactor\b", r"\boptimize\b.*\bcode\b",
    r"\bunit test\b", r"\bsnippet\b",
]

_MATH_PATTERNS = [
    r"\b(calculate|compute|solve|equation|formula|proof|integral|derivative|matrix|vector|probability|statistics|theorem)\b",
    r"\b\d+\s*[\+\-\*\/\^]\s*\d+",   # arithmetic expression
    r"\b(plus|minus|divided|multiplied|squared|cubed)\b",
    r"\b(algebra|calculus|geometry|trigonometry|linear algebra)\b",
    r"=\s*\?",
    r"\bhow much is\b",
]

_CREATIVE_PATTERNS = [
    r"\b(write|create|generate|compose|draft)\b.{0,30}\b(story|poem|haiku|essay|song|lyrics|blog|email|letter|caption|tagline|slogan|joke)\b",
    r"\b(poem|haiku|story|lyrics|creative)\b",
    r"\bbrainstorm\b",
    r"\b(metaphor|analogy|parable)\b",
    r"\bmarketing copy\b",
    r"\bname ideas\b",
    r"\bwhat if\b.{0,20}\b(story|imagine|world)\b",
]

_EXPLAIN_PATTERNS = [
    r"\b(explain|describe|what is|what are|how does|how do|why does|why is|tell me about|summarize|summary|define|definition|overview)\b",
    r"\b(difference between|compare|vs\.?|versus)\b",
    r"\bwhat('s| is) the\b",
    r"\bhow (to|does|do|can|should)\b",
    r"\bwhy\b",
]


def _matches(text: str, patterns: list[str]) -> bool:
    t = text.lower()
    return any(re.search(p, t, re.IGNORECASE) for p in patterns)


def classify(prompt: str) -> Category:
    """
    Return the best-fit category for *prompt*.

    Runs in O(n·m) where n = len(prompt), m = ~50 patterns — typically <1ms.
    """
    # Priority order: debug > code > math > creative > explain > general
    if _matches(prompt, _DEBUG_PATTERNS):
        return "debug"
    if _matches(prompt, _CODE_PATTERNS):
        return "code"
    if _matches(prompt, _MATH_PATTERNS):
        return "math"
    if _matches(prompt, _CREATIVE_PATTERNS):
        return "creative"
    if _matches(prompt, _EXPLAIN_PATTERNS):
        return "explain"
    return "general"


# Category metadata (for UI display)
CATEGORY_META: dict[str, dict] = {
    "code":     {"icon": "💻", "label": "Code",     "color": "#4a9eff"},
    "debug":    {"icon": "🐛", "label": "Debug",    "color": "#ff6b6b"},
    "math":     {"icon": "🔢", "label": "Math",     "color": "#ffd93d"},
    "creative": {"icon": "🎨", "label": "Creative", "color": "#c084fc"},
    "explain":  {"icon": "📖", "label": "Explain",  "color": "#6bcb77"},
    "general":  {"icon": "💬", "label": "General",  "color": "#94a3b8"},
}
