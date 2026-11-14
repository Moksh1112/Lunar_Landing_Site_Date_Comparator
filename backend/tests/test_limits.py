"""Rate limits and body cap (mock mode, no data needed)."""
import json

from fastapi.testclient import TestClient

from app.api.limits import SlidingWindowLimiter
from app.main import create_app
from app.settings import Settings


def _client(**kw) -> TestClient:
    return TestClient(create_app(Settings(use_mock=True, **kw)))


def test_compare_31st_request_rate_limited(compare_body):
    c = _client()
    for _ in range(30):
        assert c.post("/api/v1/compare", json=compare_body).status_code == 200
    r = c.post("/api/v1/compare", json=compare_body)
    assert r.status_code == 429
    err = r.json()["error"]
    assert err["code"] == "RATE_LIMITED"
    assert err["details"] == [{"field": "rate", "reason": "limit 30 per minute"}]
    assert 1 <= int(r.headers["Retry-After"]) <= 60
    assert "X-Request-ID" in r.headers


def test_sweep_7th_request_rate_limited(sweep_body):
    c = _client()
    for _ in range(6):
        assert c.post("/api/v1/sweep", json=sweep_body).status_code == 200
    r = c.post("/api/v1/sweep", json=sweep_body)
    assert r.status_code == 429 and r.json()["error"]["code"] == "RATE_LIMITED"
    assert "Retry-After" in r.headers


def test_limits_are_per_route(compare_body, sweep_body):
    c = _client()
    for _ in range(6):
        c.post("/api/v1/sweep", json=sweep_body)
    assert c.post("/api/v1/compare", json=compare_body).status_code == 200


def test_disabled_flag_no_429(sweep_body):
    c = _client(rate_limits_enabled=False)
    assert all(c.post("/api/v1/sweep", json=sweep_body).status_code == 200 for _ in range(10))


def test_get_endpoints_not_limited():
    c = _client()
    assert all(c.get("/health").status_code == 200 for _ in range(50))


def test_x_forwarded_for_ignored_by_default(sweep_body):
    c = _client()
    for i in range(6):
        c.post("/api/v1/sweep", json=sweep_body, headers={"X-Forwarded-For": f"10.0.0.{i}"})
    r = c.post("/api/v1/sweep", json=sweep_body, headers={"X-Forwarded-For": "10.9.9.9"})
    assert r.status_code == 429


def test_x_forwarded_for_used_when_trusted(sweep_body):
    c = _client(trust_forwarded_for=True)
    for _ in range(6):
        c.post("/api/v1/sweep", json=sweep_body, headers={"X-Forwarded-For": "10.0.0.1"})
    assert c.post("/api/v1/sweep", json=sweep_body, headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 429
    assert c.post("/api/v1/sweep", json=sweep_body, headers={"X-Forwarded-For": "10.0.0.2"}).status_code == 200


def test_body_over_64kb_rejected(compare_body):
    c = _client()
    compare_body["scenarios"][0]["label"] = "x" * 70_000
    r = c.post("/api/v1/compare", content=json.dumps(compare_body), headers={"Content-Type": "application/json"})
    assert r.status_code == 413
    assert r.json() == {"error": {
        "code": "RANGE_TOO_LARGE", "message": "Request body must be 64 KB or less.",
        "details": [{"field": "body", "reason": "larger than 65536 bytes"}]}}


def test_streamed_body_over_64kb_rejected(compare_body):
    c = _client()

    def chunks():
        yield b'{"pad": "'
        for _ in range(8):
            yield b"x" * 10_000
        yield b'"}'

    r = c.post("/api/v1/compare", content=chunks(), headers={"Content-Type": "application/json"})
    assert r.status_code == 413 and r.json()["error"]["code"] == "RANGE_TOO_LARGE"


def test_normal_body_still_accepted(compare_body):
    assert _client().post("/api/v1/compare", json=compare_body).status_code == 200


def test_limiter_window_expiry_and_bounded_memory():
    now = [0.0]
    lim = SlidingWindowLimiter(window_s=60, max_keys=5, clock=lambda: now[0])
    assert lim.hit(("a", "x"), 1) == 0
    assert lim.hit(("a", "x"), 1) > 0
    now[0] = 61
    assert lim.hit(("a", "x"), 1) == 0
    for i in range(20):
        lim.hit((f"ip{i}", "x"), 1)
    assert len(lim._hits) <= 5
