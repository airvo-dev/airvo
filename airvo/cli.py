import os
import sys
import json
import shutil
import subprocess
import threading
import time
import webbrowser
from pathlib import Path

import typer
import uvicorn

# ── CLI app ────────────────────────────────────────────────────────────────
app = typer.Typer(
    name="airvo",
    help="Airvo — Your AI. Your Rules.",
    add_completion=False,
)

# ── Paths ──────────────────────────────────────────────────────────────────
CONFIG_DIR    = Path.home() / ".airvo"
MODELS_FILE   = CONFIG_DIR / "models.json"
CONTINUE_DIR  = Path.home() / ".continue"
CONTINUE_FILE = CONTINUE_DIR / "config.yaml"

# ── Continue.dev config template ──────────────────────────────────────────
CONTINUE_CONFIG = """\
name: Local Config
version: 1.0.0
schema: v1
models:
  - name: Airvo
    provider: openai
    model: airvo-auto
    apiBase: http://localhost:5000/v1
    apiKey: local
    roles:
      - chat
      - edit
      - apply
  - name: Airvo Autocomplete
    provider: openai
    model: airvo-auto
    apiBase: http://localhost:5000/v1
    apiKey: local
    roles:
      - autocomplete
"""

CONTINUE_MARKETPLACE_URL = (
    "https://marketplace.visualstudio.com/items?itemName=Continue.continue"
)


def print_banner(host: str, port: int, dashboard_ready: bool):
    """Print startup banner with server info"""
    dashboard_status = "✓ dashboard ready" if dashboard_ready else "⚠ dashboard not built"
    typer.echo(f"""
    ╔══════════════════════════════════════╗
    ║   🚀 Airvo v0.3.0                   ║
    ║                                      ║
    ║   Server:    http://{host}:{port}      ║
    ║   Dashboard: http://{host}:{port}      ║
    ║   {dashboard_status:<36}║
    ╚══════════════════════════════════════╝
    """)


def detect_continue_dev() -> bool:
    """
    Detect if continue.dev is installed in VS Code by checking
    the extensions directory for a folder starting with 'continue.'
    Returns True if found, False otherwise.
    """
    home = Path.home()

    if sys.platform == "win32":
        vscode_ext_dirs = [
            home / ".vscode" / "extensions",
            home / "AppData" / "Roaming" / "Code" / "User" / "extensions",
        ]
    elif sys.platform == "darwin":
        vscode_ext_dirs = [
            home / ".vscode" / "extensions",
            home / "Library" / "Application Support" / "Code" / "User" / "extensions",
        ]
    else:  # Linux
        vscode_ext_dirs = [
            home / ".vscode" / "extensions",
            home / ".config" / "Code" / "User" / "extensions",
        ]

    for ext_dir in vscode_ext_dirs:
        if ext_dir.exists():
            for entry in ext_dir.iterdir():
                if entry.is_dir() and entry.name.lower().startswith("continue."):
                    return True

    return False


def ensure_continue_config():
    """
    Write continue.dev config.yaml if it doesn't exist yet.
    If it exists but doesn't have the Airvo entry, append it.
    Also warns if continue.dev extension is not detected in VS Code.
    """
    CONTINUE_DIR.mkdir(parents=True, exist_ok=True)

    if not CONTINUE_FILE.exists():
        # First time — write the full config
        CONTINUE_FILE.write_text(CONTINUE_CONFIG, encoding="utf-8")
        typer.echo("  ✓ continue.dev config created at ~/.continue/config.yaml")
    else:
        # Check if Airvo entry already exists
        existing = CONTINUE_FILE.read_text(encoding="utf-8")
        if "apiBase: http://localhost:5000/v1" in existing:
            typer.echo("  ✓ continue.dev config already has Airvo entry")
        else:
            # Append Airvo models to existing config
            airvo_entry = """
  # Airvo — added automatically
  - name: Airvo
    provider: openai
    model: airvo-auto
    apiBase: http://localhost:5000/v1
    apiKey: local
    roles:
      - chat
      - edit
      - apply
"""
            with open(CONTINUE_FILE, "a", encoding="utf-8") as f:
                f.write(airvo_entry)
            typer.echo("  ✓ Airvo entry added to existing continue.dev config")

    # ── Detect if continue.dev is installed in VS Code ────────────────────
    if detect_continue_dev():
        typer.echo("  ✓ continue.dev detected in VS Code")
    else:
        typer.echo("")
        typer.echo("  ⚠ continue.dev not detected in VS Code")
        typer.echo("    To use Airvo inside your editor, install the extension:")
        typer.echo(f"    → {CONTINUE_MARKETPLACE_URL}")
        typer.echo("")


def ensure_models_config():
    """Create ~/.airvo/models.json with defaults if it doesn't exist"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not MODELS_FILE.exists():
        typer.echo("  ✓ Created ~/.airvo/models.json with default models")
    else:
        typer.echo("  ✓ ~/.airvo/models.json found")


def open_browser_delayed(url: str, delay: float = 1.5):
    """Open browser after a short delay to let the server start"""
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


# ── Main command: airvo start ─────────────────────────────────────────────
@app.command()
def start(
    host: str        = typer.Option("localhost", "--host", "-h", help="Server host"),
    port: int        = typer.Option(5000,        "--port", "-p", help="Server port"),
    no_browser: bool = typer.Option(False, "--no-browser", help="Don't open browser automatically"),
    reload: bool     = typer.Option(False, "--reload",     help="Enable hot reload (development)"),
):
    """
    Start the Airvo server — sets up continue.dev and opens the dashboard.
    """
    typer.echo("\n  Starting Airvo...\n")

    # Step 1 — ensure user config exists
    ensure_models_config()

    # Step 2 — auto-configure and detect continue.dev
    ensure_continue_config()

    # Step 3 — check if dashboard is built
    package_dir     = Path(__file__).parent
    dist_path       = package_dir / "dashboard" / "dist"
    dev_dist_path   = Path.cwd() / "dashboard" / "dist"
    dashboard_ready = dist_path.exists() or dev_dist_path.exists()

    print_banner(host, port, dashboard_ready)

    if not dashboard_ready:
        typer.echo("  ⚠ Dashboard not found. To build it:")
        typer.echo("    cd dashboard && npm run build\n")

    # Step 4 — open browser
    if not no_browser:
        open_browser_delayed(f"http://{host}:{port}")

    # Step 5 — start the server
    typer.echo(f"  Server running at http://{host}:{port}\n")
    typer.echo("  Press Ctrl+C to stop.\n")

    uvicorn.run(
        "airvo.server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="warning",
    )


# ── Config command: airvo config ──────────────────────────────────────────
@app.command()
def config(
    telegram_token: str = typer.Option(None, "--telegram-token", help="Telegram bot token"),
    show: bool          = typer.Option(False, "--show", help="Show current config"),
):
    """
    Configure Airvo settings and integrations.
    """
    config_file = CONFIG_DIR / "config.json"
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    current = {}
    if config_file.exists():
        with open(config_file, "r") as f:
            current = json.load(f)

    if show:
        typer.echo(json.dumps(current, indent=2))
        return

    if telegram_token:
        current["telegram_token"] = telegram_token
        with open(config_file, "w") as f:
            json.dump(current, f, indent=2)
        typer.echo("  ✓ Telegram token saved to ~/.airvo/config.json")
        return

    typer.echo("  Use --show to see current config or --telegram-token to set a token.")


# ── Version command: airvo version ────────────────────────────────────────
@app.command()
def version():
    """Show Airvo version"""
    typer.echo("  Airvo v0.3.0")


# ── Entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    app()
