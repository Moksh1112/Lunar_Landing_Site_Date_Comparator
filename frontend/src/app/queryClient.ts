import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/errors";

// Never retry a 4xx: the request itself is wrong. Other failures get two retries.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
