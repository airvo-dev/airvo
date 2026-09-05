from __future__ import annotations

import json
import logging
from typing import Any


def log_event(logger: logging.Logger, event: str, **fields: Any) -> None:
    payload = {"event": event, **fields}
    try:
        logger.info(json.dumps(payload, ensure_ascii=False, default=str))
    except Exception:
        logger.info("%s | %s", event, fields)
