# main.py — reemplazá todo el contenido con esto
import uvicorn
import webbrowser
import threading
import time
from airvo.config.settings import settings
from airvo.server import app  # importa el app centralizado

def open_browser():
    time.sleep(1.5)
    webbrowser.open(f"http://{settings.host}:{settings.port}")

if __name__ == "__main__":
    import os
    from pathlib import Path
    dist_path = Path(__file__).parent / "dashboard" / "dist"
    built = "✓ dashboard ready" if dist_path.exists() else "⚠ run: cd dashboard && npm run build"

    print(f"""
    ╔══════════════════════════════════╗
    ║   🚀 Airvo v0.3.1               ║
    ║   Server:  localhost:{settings.port}        ║
    ║   {built}
    ╚══════════════════════════════════╝
    """)

    if settings.auto_open_browser:
        threading.Thread(target=open_browser).start()

    uvicorn.run(
        "airvo.server:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level
    )