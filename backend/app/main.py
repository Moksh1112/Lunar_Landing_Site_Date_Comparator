"""Azelux API app factory."""
import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import error_response, register_error_handlers
from app.api.routes_api import api_router, health_router
from app.logging_setup import configure_logging, request_id_var
from app.settings import APP_VERSION, Settings, get_settings

access_log = logging.getLogger("azelux.access")
error_log = logging.getLogger("azelux.errors")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="Azelux API", version=APP_VERSION)
    app.state.settings = settings
    register_error_handlers(app)
    app.include_router(health_router)
    app.include_router(api_router)

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex
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
