"""
Privacy Mode — secret detection for Airvo.

Scans prompt text for sensitive patterns: API keys, passwords, tokens,
emails, private keys, connection strings, etc.

100% local — pure Python regex, zero dependencies, zero network calls.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

# ── Secret pattern definitions ────────────────────────────────────────────

@dataclass
class SecretMatch:
    kind:    str   # e.g. "OpenAI API Key"
    value:   str   # the matched value (redacted for display)
    start:   int
    end:     int
    redacted: str  # safe version to show in UI


_PATTERNS: list[tuple[str, str]] = [
    # Cloud provider API keys
    ("OpenAI API Key",       r"sk-[A-Za-z0-9]{20,60}"),
    ("Anthropic API Key",    r"sk-ant-[A-Za-z0-9\-_]{20,80}"),
    ("Groq API Key",         r"gsk_[A-Za-z0-9]{20,60}"),
    ("Google API Key",       r"AIza[0-9A-Za-z\-_]{35}"),
    ("AWS Access Key",       r"AKIA[0-9A-Z]{16}"),
    ("AWS Secret Key",       r"(?i)aws[_\-\s]?secret[_\-\s]?access[_\-\s]?key[\s:=]+[A-Za-z0-9/+=]{40}"),
    ("GitHub Token",         r"gh[pousr]_[A-Za-z0-9]{36,255}"),
    ("GitLab Token",         r"glpat-[A-Za-z0-9\-_]{20,}"),
    ("Hugging Face Token",   r"hf_[A-Za-z0-9]{20,}"),
    ("Together AI Key",      r"[0-9a-f]{64}"),   # 64-char hex — common in Together/etc
    ("Stripe Secret Key",    r"sk_live_[0-9a-zA-Z]{24,}"),
    ("Stripe Test Key",      r"sk_test_[0-9a-zA-Z]{24,}"),
    ("Twilio Auth Token",    r"AC[0-9a-fA-F]{32}"),
    ("SendGrid API Key",     r"SG\.[A-Za-z0-9\-_]{22,}\.[A-Za-z0-9\-_]{43,}"),
    ("Mailgun API Key",      r"key-[0-9a-zA-Z]{32}"),

    # Passwords in common assignment patterns
    ("Password (assignment)", r"(?i)(?:password|passwd|pwd|secret)\s*[:=]\s*[\"']?([^\s\"',;]{6,})[\"']?"),

    # Connection strings
    ("PostgreSQL DSN",       r"postgres(?:ql)?://[^:]+:[^@]+@[^\s]+"),
    ("MySQL DSN",            r"mysql://[^:]+:[^@]+@[^\s]+"),
    ("MongoDB DSN",          r"mongodb(?:\+srv)?://[^:]+:[^@]+@[^\s]+"),
    ("Redis DSN",            r"redis://:[^@]+@[^\s]+"),
    ("Generic DB URL",       r"(?i)(?:jdbc|odbc):[^:]+://[^\s]+:[^\s@]+@[^\s]+"),

    # Private keys
    ("RSA Private Key",      r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
    ("PEM Certificate",      r"-----BEGIN CERTIFICATE-----"),
    ("SSH Private Key",      r"-----BEGIN OPENSSH PRIVATE KEY-----"),

    # Tokens / JWTs
    ("JWT Token",            r"eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+"),

    # Email addresses (lower severity but still PII)
    ("Email Address",        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"),
]

# Compile once at import time
_COMPILED: list[tuple[str, re.Pattern]] = [
    (kind, re.compile(pattern))
    for kind, pattern in _PATTERNS
]

# Severity map — HIGH means force local model, MEDIUM = warn, LOW = info
_SEVERITY: dict[str, str] = {
    "OpenAI API Key":         "HIGH",
    "Anthropic API Key":      "HIGH",
    "Groq API Key":           "HIGH",
    "Google API Key":         "HIGH",
    "AWS Access Key":         "HIGH",
    "AWS Secret Key":         "HIGH",
    "GitHub Token":           "HIGH",
    "GitLab Token":           "HIGH",
    "Hugging Face Token":     "HIGH",
    "Together AI Key":        "MEDIUM",
    "Stripe Secret Key":      "HIGH",
    "Stripe Test Key":        "MEDIUM",
    "Twilio Auth Token":      "HIGH",
    "SendGrid API Key":       "HIGH",
    "Mailgun API Key":        "HIGH",
    "Password (assignment)":  "HIGH",
    "PostgreSQL DSN":         "HIGH",
    "MySQL DSN":              "HIGH",
    "MongoDB DSN":            "HIGH",
    "Redis DSN":              "HIGH",
    "Generic DB URL":         "HIGH",
    "RSA Private Key":        "HIGH",
    "PEM Certificate":        "MEDIUM",
    "SSH Private Key":        "HIGH",
    "JWT Token":              "HIGH",
    "Email Address":          "LOW",
}


def _redact(value: str) -> str:
    """Show first 4 and last 4 chars, mask the middle."""
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "*" * (len(value) - 8) + value[-4:]


def scan(text: str) -> list[SecretMatch]:
    """
    Scan *text* for sensitive patterns.

    Returns a list of SecretMatch objects ordered by position.
    Empty list = clean prompt.
    """
    if not text:
        return []

    matches: list[SecretMatch] = []
    seen_spans: list[tuple[int, int]] = []   # avoid duplicate overlapping matches

    for kind, pattern in _COMPILED:
        for m in pattern.finditer(text):
            start, end = m.start(), m.end()
            # Skip if already covered by a previous match
            if any(s <= start < e or s < end <= e for s, e in seen_spans):
                continue
            value = m.group(0)
            matches.append(SecretMatch(
                kind=kind,
                value=value,
                start=start,
                end=end,
                redacted=_redact(value),
            ))
            seen_spans.append((start, end))

    matches.sort(key=lambda x: x.start)
    return matches


def has_high_severity(matches: list[SecretMatch]) -> bool:
    """True if any match is HIGH severity — triggers force-local logic."""
    return any(_SEVERITY.get(m.kind, "MEDIUM") == "HIGH" for m in matches)


def severity(match: SecretMatch) -> str:
    return _SEVERITY.get(match.kind, "MEDIUM")


def redact_text(text: str, matches: list[SecretMatch]) -> str:
    """
    Return *text* with all matched secrets replaced by [REDACTED:kind].
    Processes matches in reverse order to preserve offsets.
    """
    for m in reversed(matches):
        text = text[:m.start] + f"[REDACTED:{m.kind}]" + text[m.end:]
    return text


def scan_messages(messages: list[dict]) -> list[SecretMatch]:
    """Scan a list of chat messages ({role, content}) for secrets."""
    all_matches: list[SecretMatch] = []
    for msg in messages:
        content = msg.get("content") or ""
        if isinstance(content, str):
            all_matches.extend(scan(content))
    return all_matches
