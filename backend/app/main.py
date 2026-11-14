"""Azelux API app factory."""
import logging
import re
import threading
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import error_response, register_error_handlers
from app.api.limits import LimitsMiddleware
from app.api.map_assets import router as map_asset_router
from app.api.routes_api import api_router, health_router, warm_up
from app.ephemeris import load_kernels
from app.logging_setup import configure_logging, request_id_var
from app.settings import APP_VERSION, Settings, get_settings

access_log = logging.getLogger("azelux.access")
error_log = logging.getLogger("azelux.errors")
_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{1,64}$")  # client-supplied IDs are echoed and logged


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="Azelux API", version=APP_VERSION)
    app.state.settings = settings
    if not settings.use_mock:
        try:
            load_kernels(settings.data_dir / "kernels", settings.kernel_list)
        except Exception as exc:  # noqa: BLE001 - /health must still answer without data
            error_log.error("kernel loading failed: %s", exc)
        if settings.warm_up:
            threading.Thread(target=warm_up, args=(app,), name="azelux-warm-up", daemon=True).start()
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(api_router)
    app.include_router(map_asset_router)

    app.add_middleware(LimitsMiddleware, settings=settings)  # inner to request_context and CORS

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id", "")
        if not _REQUEST_ID_RE.fullmatch(rid):
            rid = uuid.uuid4().hex
        token = request_id_var.set(rid)
        start = time.perf_counter()
        try:
            try:
                response = await call_next(request)
            except Exception as exc:  # noqa: BLE001 - last resort so no stack trace ever reaches a client
                error_log.error("unhandled exception", exc_info=exc)
                response = error_response("INTERNAL", "Internal error.")
            response.headers["X-Request-ID"] = rid
            access_log.info(
                "request",
                extra={
                    "request_id": rid,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                },
            )
            return response
        finally:
            request_id_var.reset(token)

    # Added last so it is outermost and error responses carry CORS headers too.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )
    return app


app = create_app()
