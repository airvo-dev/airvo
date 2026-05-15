"""
Model Confidence Score — 0-100 heuristic score based on uncertainty signals in text.

How it works:
  - Scans response text for phrases that indicate uncertainty, hedging, contradiction,
    refusal, or strong self-assertion.
  - Each matched pattern adds or subtracts from a base score of 85.
  - Score is clamped to [0, 100].

Signals detected:
  HIGH UNCERTAINTY  → score drops  (e.g. "I'm not sure", "I might be wrong")
  MEDIUM UNCERTAINTY→ smaller drop  (e.g. "typically", "generally", "may")
  CONTRADICTION     → large drop   (e.g. "on the other hand", "however")
  REFUSAL           → score → 0    (e.g. "I cannot", "I don't have access")
  HIGH CONFIDENCE   → small boost  (e.g. "definitely", "the answer is")

100% local — no network calls, pure regex on the response text.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

# ── Signal patterns ───────────────────────────────────────────────────────
# (pattern, weight)  — negative = lowers confidence, positive = raises it

_SIGNALS: list[tuple[re.Pattern, int, str]] = [
    # Strong uncertainty
    (re.compile(r"\bi'?m not (?:sure|certain|aware)\b", re.I),          -20, "uncertain"),
    (re.compile(r"\bi (?:might|may) be wrong\b", re.I),                 -20, "uncertain"),
    (re.compile(r"\bi(?:'m| am) (?:unsure|uncertain)\b", re.I),         -20, "uncertain"),
    (re.compile(r"\bI (?:don't|do not) know\b", re.I),                  -18, "uncertain"),
    (re.compile(r"\bit'?s (?:unclear|unknown|hard to say)\b", re.I),    -18, "uncertain"),
    (re.compile(r"\bI (?:can't|cannot) (?:confirm|verify|guarantee)\b", re.I), -15, "uncertain"),
    (re.compile(r"\bI(?:'m| am) not (?:100%|completely) (?:sure|certain)\b", re.I), -15, "uncertain"),
    # Hedging / approximation
    (re.compile(r"\b(?:probably|likely|possibly|perhaps|maybe)\b", re.I), -8, "hedge"),
    (re.compile(r"\b(?:approximately|roughly|around|about)\b", re.I),    -5, "hedge"),
    (re.compile(r"\b(?:typically|generally|usually|often|sometimes)\b", re.I), -4, "hedge"),
    (re.compile(r"\b(?:might|may|could|should) (?:be|work|help)\b", re.I), -5, "hedge"),
    (re.compile(r"\bI (?:think|believe|assume|suspect)\b", re.I),        -6, "hedge"),
    (re.compile(r"\bto (?:my|the best of my) knowledge\b", re.I),       -6, "hedge"),
    (re.compile(r"\bas far as I(?:'m| am) aware\b", re.I),              -6, "hedge"),
    # Contradiction / nuance
    (re.compile(r"\b(?:however|on the other hand|that said|but|although|nevertheless)\b", re.I), -3, "nuance"),
    (re.compile(r"\bIt depends\b", re.I),                                -8, "nuance"),
    # Outdated knowledge
    (re.compile(r"\bmy (?:training|knowledge) (?:cut.?off|data)\b", re.I), -12, "stale"),
    (re.compile(r"\bas of (?:my|the) (?:last|training)\b", re.I),       -10, "stale"),
    (re.compile(r"\bI (?:don't|do not) have (?:access|real.?time)\b", re.I), -10, "stale"),
    # Refusal / inability
    (re.compile(r"\bI (?:can't|cannot|won't|will not|am unable to)\b", re.I), -15, "refusal"),
    (re.compile(r"\bI (?:don't|do not) have (?:the ability|permission)\b", re.I), -15, "refusal"),
    # High confidence signals (positive)
    (re.compile(r"\b(?:definitely|certainly|absolutely|clearly|obviously)\b", re.I), +6, "confident"),
    (re.compile(r"\bthe (?:answer|solution|result) is\b", re.I),         +5, "confident"),
    (re.compile(r"\bhere(?:'s| is) (?:the|a) (?:solution|answer|fix|code)\b", re.I), +4, "confident"),
    (re.compile(r"\byou (?:can|should|need to)\b", re.I),                +2, "confident"),
]

_BASE_SCORE = 85


@dataclass
class ConfidenceResult:
    score: int                       # 0-100
    label: str                       # "high" | "medium" | "low" | "very_low"
    signals: list[dict]              # matched signals for transparency
    word_count: int


def score(text: str) -> ConfidenceResult:
    """
    Compute confidence score for a model response.
    Returns ConfidenceResult with score, label, and matched signals.
    """
    if not text or not text.strip():
        return ConfidenceResult(score=0, label="very_low", signals=[], word_count=0)

    word_count = len(text.split())
    # Normalize: very short responses get a penalty
    base = _BASE_SCORE
    if word_count < 10:
        base -= 15

    total_delta = 0
    matched: list[dict] = []

    for pattern, weight, kind in _SIGNALS:
        hits = pattern.findall(text)
        if hits:
            # Cap repeated hits of same pattern to avoid runaway scores
            capped = min(len(hits), 3)
            delta  = weight * capped
            total_delta += delta
            matched.append({
                "kind":    kind,
                "weight":  weight,
                "count":   len(hits),
                "example": hits[0] if isinstance(hits[0], str) else hits[0][0],
            })

    raw = base + total_delta
    final = max(0, min(100, raw))

    if final >= 80:
        label = "high"
    elif final >= 60:
        label = "medium"
    elif final >= 35:
        label = "low"
    else:
        label = "very_low"

    return ConfidenceResult(
        score=final,
        label=label,
        signals=matched,
        word_count=word_count,
    )


def score_dict(text: str) -> dict:
    """Same as score() but returns a plain dict (JSON-serializable)."""
    r = score(text)
    return {
        "score":      r.score,
        "label":      r.label,
        "word_count": r.word_count,
        "signals":    r.signals,
    }
