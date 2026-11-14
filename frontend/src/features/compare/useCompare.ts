import { useMutation } from "@tanstack/react-query";
import { postCompare } from "../../api/client";
import type { ApiError } from "../../api/errors";
import type { CompareRequest, CompareResponse } from "../../api/types";

/** Compare mutation. Consumers disable the submit button while isPending; inputs stay put on error. */
export function useCompare() {
  return useMutation<CompareResponse, ApiError, CompareRequest>({ mutationFn: postCompare });
}
