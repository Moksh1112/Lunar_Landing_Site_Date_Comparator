"""Request body cap (64 KB) and per-IP sliding-window rate limits (TRD 10.1). Pure ASGI, no dependencies."""
from __future__ import annotations

import math
import threading
import time
from collections import deque

from app.api.errors import error_response
from app.settings import Settings

MAX_BODY_BYTES = 65_536
WINDOW_S = 60.0
MAX_TRACKED_KEYS = 10_000


class SlidingWindowLimiter:
    """Thread-safe sliding window per key; memory bounded by MAX_TRACKED_KEYS."""

    def __init__(self, window_s: float = WINDOW_S, max_keys: int = MAX_TRACKED_KEYS, clock=time.monotonic) -> None:
        self.window_s = window_s
        self.max_keys = max_keys
        self._clock = clock
        self._hits: dict[tuple[str, str], deque[float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: tuple[str, str], limit: int) -> int:
        """Record a request; return 0 if allowed, else seconds until a slot frees (>= 1)."""
        now = self._clock()
        cutoff = now - self.window_s
        with self._lock:
            q = self._hits.get(key)
            if q is None:
                if len(self._hits) >= self.max_keys:
                    self._prune(cutoff)
                q = self._hits[key] = deque()
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                return max(1, math.ceil(q[0] + self.window_s - now))
            q.append(now)
            return 0

    def _prune(self, cutoff: float) -> None:
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= cutoff]:
            del self._hits[k]
        while len(self._hits) >= self.max_keys:  # still full: drop the oldest-inserted key
            del self._hits[next(iter(self._hits))]


class LimitsMiddleware:
    def __init__(self, app, settings: Settings) -> None:
        self.app = app
        self.enabled = settings.rate_limits_enabled
        self.trust_xff = settings.trust_forwarded_for
        self.rules = {
            ("POST", "/api/v1/compare"): ("compare", settings.rate_limit_compare_per_min),
            ("POST", "/api/v1/sweep"): ("sweep", settings.rate_limit_sweep_per_min),
        }
        self.limiter = SlidingWindowLimiter()

    def _client_ip(self, scope, headers: dict[bytes, bytes]) -> str:
        if self.trust_xff:
            xff = headers.get(b"x-forwarded-for", b"").decode("latin-1").split(",")[0].strip()
            if xff:
                return xff
        client = scope.get("client")
        return client[0] if client else "unknown"

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        headers = {k.lower(): v for k, v in scope.get("headers", [])}

        rule = self.rules.get((scope["method"], scope["path"].rstrip("/") or "/"))
        if self.enabled and rule is not None:
            name, limit = rule
            wait = self.limiter.hit((self._client_ip(scope, headers), name), limit)
            if wait:
                resp = error_response(
                    "RATE_LIMITED", f"Too many requests; try again in {wait} s.",
                    [{"field": "rate", "reason": f"limit {limit} per minute"}],
                )
                resp.headers["Retry-After"] = str(wait)
                await resp(scope, receive, send)
                return

        too_large = error_response(
            "RANGE_TOO_LARGE", "Request body must be 64 KB or less.",
            [{"field": "body", "reason": f"larger than {MAX_BODY_BYTES} bytes"}],
        )
        declared = headers.get(b"content-length")
        if declared is not None:
            try:
                if int(declared) > MAX_BODY_BYTES:
                    await too_large(scope, receive, send)
                    return
            except ValueError:
                pass  # malformed header: the server rejects it; streaming cap below still applies

        total = 0
        exceeded = False

        async def capped_receive():
            nonlocal total, exceeded
            message = await receive()
            if message["type"] == "http.request":
                total += len(message.get("body", b""))
                if total > MAX_BODY_BYTES:
                    exceeded = True
                    return {"type": "http.request", "body": b"", "more_body": False}
            return message

        async def guarded_send(message) -> None:
            if not exceeded:  # once over the cap, whatever the app answers is replaced by the 413
                await send(message)

        await self.app(scope, capped_receive, guarded_send)
        if exceeded:
            await too_large(scope, receive, send)
