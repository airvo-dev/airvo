from __future__ import annotations

import threading
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """Simple in-memory sliding-window rate limiter."""

    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.RLock()

    def allow(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        if limit <= 0 or window_seconds <= 0:
            return True, 0

        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = int(max(1, window_seconds - (now - bucket[0])))
                return False, retry_after

            bucket.append(now)
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._buckets.clear()
