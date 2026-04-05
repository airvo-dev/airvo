from pydantic_settings import BaseSettings
from typing import List, Optional
import json
import os

# ── User config directory and file paths ─────────────────────────────────
CONFIG_DIR  = os.path.join(os.path.expanduser("~"), ".airvo")
MODELS_FILE = os.path.join(CONFIG_DIR, "models.json")
STATS_FILE  = os.path.join(CONFIG_DIR, "stats.json")
PREFS_FILE  = os.path.join(CONFIG_DIR, "prefs.json")

# ── Max chars for project context memory (~650 tokens) ───────────────────
MEMORY_MAX_CHARS = 2500

# ── Default models ────────────────────────────────────────────────────────
DEFAULT_MODELS = [
    {
        "id":       "groq/llama-3.1-8b-instant",
        "name":     "Llama 3.1 8B (Groq)",
        "provider": "groq",
        "api_key":  None,
        "base_url": None,
        "active":   True,
        "free":     True,
        "notes":    "Fast and free — great for quick tasks"
    },
    {
        "id":       "groq/llama-3.3-70b-versatile",
        "name":     "Llama 3.3 70B (Groq)",
        "provider": "groq",
        "api_key":  None,
        "base_url": None,
        "active":   True,
        "free":     True,
        "notes":    "More powerful, still free — best for complex tasks"
    },
    {
        "id":       "openai/gpt-4o",
        "name":     "GPT-4o",
        "provider": "openai",
        "api_key":  None,
        "base_url": None,
        "active":   False,
        "free":     False,
        "notes":    "Requires OpenAI API key — platform.openai.com"
    },
    {
        "id":       "anthropic/claude-sonnet-4-5",
        "name":     "Claude Sonnet",
        "provider": "anthropic",
        "api_key":  None,
        "base_url": None,
        "active":   False,
        "free":     False,
        "notes":    "Requires Anthropic API key — console.anthropic.com"
    },
    {
        "id":       "ollama/llama3",
        "name":     "Llama3 Local (Ollama)",
        "provider": "ollama",
        "api_key":  None,
        "base_url": "http://localhost:11434",
        "active":   False,
        "free":     True,
        "notes":    "100% local — requires Ollama installed"
    },
    {
        "id":       "lmstudio/local",
        "name":     "LM Studio Local",
        "provider": "lmstudio",
        "api_key":  None,
        "base_url": "http://localhost:1234/v1",
        "active":   False,
        "free":     True,
        "notes":    "100% local — requires LM Studio installed"
    }
]

# ── Default preferences ───────────────────────────────────────────────────
DEFAULT_PREFS = {
    "mode":            "parallel",
    "temperature":     0.7,
    "max_tokens":      4096,
    "max_history_messages": 10,
    "memory_enabled":  False,
    "memory_text":     "",
    "agent_model":     "",
    # ── RAG / Smart Memory ───────────────────────────────────────────────────
    "rag_enabled":      False,
    "rag_path":         "",
    "rag_max_index_mb": 200,
    "rag_max_file_kb":  500,
    "rag_top_k":        5,
    "rag_max_inject_chars": 3000,
    "rag_extensions": [
        ".py", ".js", ".ts", ".jsx", ".tsx",
        ".md", ".go", ".rs", ".java", ".cpp", ".c",
        ".html", ".css", ".json", ".yaml", ".yml", ".toml",
        ".txt", ".sh", ".rb", ".php", ".swift", ".kt",
    ],
    "rag_exclude_dirs": [
        "node_modules", ".git", "dist", "__pycache__",
        "venv", ".venv", "build", ".next", "coverage",
    ],
}


def ensure_config_dir():
    os.makedirs(CONFIG_DIR, exist_ok=True)


# ── Models ────────────────────────────────────────────────────────────────

def load_models() -> List[dict]:
    ensure_config_dir()
    if not os.path.exists(MODELS_FILE):
        save_models(DEFAULT_MODELS)
        return DEFAULT_MODELS
    with open(MODELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_models(models: List[dict]):
    ensure_config_dir()
    with open(MODELS_FILE, "w", encoding="utf-8") as f:
        json.dump(models, f, indent=2, ensure_ascii=False)


# ── Preferences ───────────────────────────────────────────────────────────

def load_prefs() -> dict:
    ensure_config_dir()
    if not os.path.exists(PREFS_FILE):
        save_prefs(DEFAULT_PREFS)
        return DEFAULT_PREFS.copy()
    with open(PREFS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {**DEFAULT_PREFS, **data}


def save_prefs(prefs: dict):
    ensure_config_dir()
    with open(PREFS_FILE, "w", encoding="utf-8") as f:
        json.dump(prefs, f, indent=2, ensure_ascii=False)


# ── Stats ─────────────────────────────────────────────────────────────────

def load_stats() -> dict:
    ensure_config_dir()
    if not os.path.exists(STATS_FILE):
        return {}
    with open(STATS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_stats(stats: dict):
    ensure_config_dir()
    with open(STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)


def record_usage(model_id: str, tokens_used: int):
    """Increment request count and token usage for a model"""
    stats = load_stats()
    if model_id not in stats:
        stats[model_id] = {"requests": 0, "tokens": 0}
    stats[model_id]["requests"] += 1
    stats[model_id]["tokens"]   += tokens_used
    save_stats(stats)


class Settings(BaseSettings):
    # ── Server ────────────────────────────────────────────
    host:              str   = "localhost"
    port:              int   = 5000
    log_level:         str   = "info"
    auto_open_browser: bool  = True

    # ── Model behavior defaults (overridden by prefs.json) ────────────────
    max_parallel_models: int   = 3
    default_mode:        str   = "parallel"
    max_tokens:          int   = 4096
    temperature:         float = 0.7
    timeout:             int   = 30

    # ── System prompt ─────────────────────────────────────
    system_prompt: str = "You are an expert software development assistant."

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # ── Models ────────────────────────────────────────────

    def get_models(self) -> List[dict]:
        return load_models()

    def get_active_models(self) -> List[dict]:
        return [m for m in self.get_models() if m.get("active")]

    def get_model_by_id(self, model_id: str) -> Optional[dict]:
        for m in self.get_models():
            if m["id"] == model_id:
                return m
        return None

    def add_model(self, model: dict):
        models = self.get_models()
        for i, m in enumerate(models):
            if m["id"] == model["id"]:
                models[i] = model
                save_models(models)
                return
        models.append(model)
        save_models(models)

    def update_model(self, model_id: str, updates: dict):
        models = self.get_models()
        for m in models:
            if m["id"] == model_id:
                m.update(updates)
                break
        save_models(models)

    def delete_model(self, model_id: str):
        models = [m for m in self.get_models() if m["id"] != model_id]
        save_models(models)

    def toggle_model(self, model_id: str, active: bool):
        self.update_model(model_id, {"active": active})

    def set_api_key(self, model_id: str, api_key: str):
        self.update_model(model_id, {"api_key": api_key})

    # ── Preferences ───────────────────────────────────────

    def get_prefs(self) -> dict:
        return load_prefs()

    def update_prefs(self, updates: dict):
        current = load_prefs()
        current.update(updates)
        save_prefs(current)

    def get_temperature(self) -> float:
        return load_prefs().get("temperature", self.temperature)

    def get_max_tokens(self) -> int:
        return load_prefs().get("max_tokens", self.max_tokens)

    def get_memory_prompt(self) -> Optional[str]:
        """Returns memory text to inject into system prompt, or None if disabled.
        Sanitizes control characters to prevent prompt injection via memory text."""
        prefs = load_prefs()
        if not prefs.get("memory_enabled") or not prefs.get("memory_text", "").strip():
            return None
        text = prefs["memory_text"].strip()
        if len(text) > MEMORY_MAX_CHARS:
            text = text[:MEMORY_MAX_CHARS]
        # Remove null bytes and other dangerous control characters
        # Keep newlines (\n), tabs (\t) and carriage returns (\r) as they're valid
        text = "".join(
            ch for ch in text
            if ch in ("\n", "\t", "\r") or (ord(ch) >= 32 and ord(ch) != 127)
        )
        return text if text.strip() else None

    # ── Stats ─────────────────────────────────────────────

    def get_stats(self) -> dict:
        return load_stats()

    def record_usage(self, model_id: str, tokens_used: int):
        record_usage(model_id, tokens_used)

    def reset_stats(self):
        save_stats({})

    # ── Last request tracking ──────────────────────────────

    def record_last_request(self, req_type: str, mode: str = None, model: str = None):
        record_last_request(req_type, mode, model)

    def get_last_request(self) -> dict:
        return get_last_request()


# ── In-memory last-request tracker (not persisted to disk) ───────────────
_last_request: dict = {
    "type":              None,   # "tool_call" | "multi" | "single"
    "mode":              None,   # "parallel" | "race" | "vote" | "review" | None
    "model":             None,   # model name (single / tool_call only)
    "count":             0,      # total requests served since startup
    "tool_bypass_count": 0,      # times tool-call bypass was triggered
}


def record_last_request(req_type: str, mode: str = None, model: str = None):
    _last_request["type"]  = req_type
    _last_request["mode"]  = mode
    _last_request["model"] = model
    _last_request["count"] += 1
    if req_type == "tool_call":
        _last_request["tool_bypass_count"] += 1


def get_last_request() -> dict:
    return dict(_last_request)


# ── Global settings instance ──────────────────────────────────────────────
settings = Settings()
