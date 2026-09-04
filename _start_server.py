import logging
import sys

import uvicorn

from airvo.port_utils import is_port_in_use

# Send ALL logs (including our [TPM-GUARD] warnings) to a file for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(r"C:\AIRVO\airvo\server.log", mode="w", encoding="utf-8"),
        logging.StreamHandler(sys.stderr),
    ],
)

HOST = "127.0.0.1"
PORT = 8765

if is_port_in_use(HOST, PORT):
    print(f"Airvo already running on http://{HOST}:{PORT}; skipping startup.")
    raise SystemExit(0)

uvicorn.run('airvo.server:app', host=HOST, port=PORT, log_level='info')
