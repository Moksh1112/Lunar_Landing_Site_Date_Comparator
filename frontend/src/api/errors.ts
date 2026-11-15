import type { ApiErrorBody, ApiErrorCode } from "./types";

// Contract codes come from the API; NETWORK / TIMEOUT / BAD_RESPONSE are client-only and never sent by it.
export type ClientErrorCode = "NETWORK" | "TIMEOUT" | "BAD_RESPONSE";
export type ErrorCode = ApiErrorCode | ClientErrorCode;
export type ErrorDetail = { field: string; reason: string };

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly details: ErrorDetail[];
  readonly status: number;
  readonly origin: "api" | "client";

  constructor(init: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
    status?: number;
    origin: "api" | "client";
  }) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.details = init.details ?? [];
    this.status = init.status ?? 0;
    this.origin = init.origin;
  }

  static fromBody(body: ApiErrorBody, status: number): ApiError {
    return new ApiError({
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
      status,
      origin: "api",
    });
  }

  static client(code: ClientErrorCode, message: string, status = 0): ApiError {
    return new ApiError({ code, message, status, origin: "client" });
  }
}

// Contract HTTP status per error code (docs/CONTRACT.md error table).
export const STATUS_FOR_CODE: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  NOT_IN_COVERAGE: 422,
  RANGE_TOO_LARGE: 413,
  UPSTREAM_UNAVAILABLE: 503,
  INTERNAL: 500,
  RATE_LIMITED: 429,
};
