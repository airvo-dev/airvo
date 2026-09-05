import logging
import os

from fastapi import APIRouter
from airvo.storage import JsonFileStore

router = APIRouter()
logger = logging.getLogger(__name__)

_BENCH_SUITES_FILE = os.path.join(os.path.expanduser("~"), ".airvo", "bench_suites.json")
_bench_store = JsonFileStore(_BENCH_SUITES_FILE, default_factory=dict)


def _load_bench_suites() -> dict:
    data = _bench_store.load()
    return data if isinstance(data, dict) else {}


def _save_bench_suites(data: dict) -> None:
    try:
        _bench_store.save(data)
    except Exception as exc:
        logger.warning("[Bench] Failed to save suites: %s", exc)


@router.get("/api/bench/suites", tags=["Benchmarks"], summary="Get custom benchmark suites",
    description="Returns all user-defined benchmark suites stored in ~/.airvo/bench_suites.json.")
async def get_bench_suites():
    return _load_bench_suites()


@router.put("/api/bench/suites", tags=["Benchmarks"], summary="Save custom benchmark suites",
    description="Persists all user-defined benchmark suites to ~/.airvo/bench_suites.json.")
async def put_bench_suites(data: dict):
    _save_bench_suites(data)
    return {"ok": True}
