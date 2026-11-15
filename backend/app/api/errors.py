"""Single place that maps every failure to the contract error shape."""
import logging
from typing import Any

import orjson
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.terrain.interface import TerrainUnavailable

logger = logging.getLogger("azelux.errors")

STATUS_BY_CODE = {
    "INVALID_INPUT": 400,
    "NOT_FOUND": 404,
    "RANGE_TOO_LARGE": 413,
    "NOT_IN_COVERAGE": 422,
    "RATE_LIMITED": 429,
    "INTERNAL": 500,
    "UPSTREAM_UNAVAILABLE": 503,
}


class OrjsonResponse(Response):
    media_type = "application/json"

    def render(self, content: Any) -> bytes:
        return orjson.dumps(content)


class ApiError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        details: list[dict[str, str]] | None = None,
        http: int | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or []
        self.http = http or STATUS_BY_CODE[code]


def error_response(code: str, message: str, details: list[dict[str, str]] | None = None,
                   http: int | None = None) -> OrjsonResponse:
    body = {"error": {"code": code, "message": message, "details": details or []}}
    return OrjsonResponse(body, status_code=http or STATUS_BY_CODE[code])


def _format_loc(loc: tuple[Any, ...]) -> str:
    parts = list(loc)
    if parts and parts[0] in ("body", "query", "path"):
        parts = parts[1:]
    if parts and isinstance(parts[0], int):  # malformed JSON body: loc is ("body", <char offset>)
        return "body"
    out = ""
    for part in parts:
        if isinstance(part, int):
            out += f"[{part}]"
        else:
            out += f".{part}" if out else str(part)
    return out or "body"


def _details(errors: list[Any]) -> list[dict[str, str]]:
    details = []
    for err in errors:
        reason = str(err.get("msg", "invalid value"))
        reason = reason.removeprefix("Value error, ")
        if err.get("type") == "extra_forbidden":
            reason = "unknown field"
        details.append({"field": _format_loc(tuple(err.get("loc", ()))), "reason": reason})
    return details


def _invalid(errors: list[Any]) -> OrjsonResponse:
    details = _details(errors)
    first = details[0] if details else None
    message = "Invalid input." if first is None else f"Invalid input: {first['field']} {first['reason']}."
    return error_response("INVALID_INPUT", message, details)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> OrjsonResponse:
        return error_response(exc.code, exc.message, exc.details, exc.http)

    @app.exception_handler(TerrainUnavailable)
    async def _terrain_unavailable(_: Request, exc: TerrainUnavailable) -> OrjsonResponse:
        return error_response(
            "INTERNAL",
            "Terrain data is not available on this server for points inside south-pole DEM coverage "
            f"(south of 80.7 S): {exc.reason}. No result was computed.",
            http=500,
        )

    @app.exception_handler(RequestValidationError)
    async def _request_validation(_: Request, exc: RequestValidationError) -> OrjsonResponse:
        return _invalid(list(exc.errors()))

    @app.exception_handler(ValidationError)
    async def _validation(_: Request, exc: ValidationError) -> OrjsonResponse:
        return _invalid(list(exc.errors()))

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> OrjsonResponse:
        if exc.status_code == 404:
            return error_response("NOT_FOUND", "Resource not found.")
        if exc.status_code == 405:
            return error_response("INVALID_INPUT", "Method not allowed for this path.", http=405)
        if exc.status_code < 500:
            return error_response("INVALID_INPUT", "Request could not be processed.", http=exc.status_code)
        return error_response("INTERNAL", "Internal error.", http=exc.status_code)

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> OrjsonResponse:
        logger.error("unhandled exception", exc_info=exc)
        return error_response("INTERNAL", "Internal error.")
