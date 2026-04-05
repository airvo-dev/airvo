import uvicorn, logging, sys

# Send ALL logs (including our [TPM-GUARD] warnings) to a file for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(r"C:\AIRVO\airvo\server.log", mode="w", encoding="utf-8"),
        logging.StreamHandler(sys.stderr),
    ],
)

uvicorn.run('airvo.server:app', host='127.0.0.1', port=8765, log_level='info')
