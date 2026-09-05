import json
import os
import tempfile
import threading
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


class JsonFileStore(Generic[T]):
    """Simple JSON file store with per-file lock and atomic writes."""

    def __init__(self, path: str, default_factory: Callable[[], T]):
        self.path = path
        self.default_factory = default_factory
        self._lock = threading.RLock()

    def load(self) -> T:
        with self._lock:
            try:
                if os.path.exists(self.path):
                    with open(self.path, "r", encoding="utf-8") as f:
                        return json.load(f)
            except Exception:
                pass
            return self.default_factory()

    def save(self, data: T) -> None:
        with self._lock:
            parent = os.path.dirname(self.path)
            if parent:
                os.makedirs(parent, exist_ok=True)

            fd, temp_path = tempfile.mkstemp(prefix=".airvo-tmp-", suffix=".json", dir=parent or None)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(temp_path, self.path)
            finally:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass
