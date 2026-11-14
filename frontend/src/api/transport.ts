export type ApiEndpoint = "health" | "sites" | "compare" | "sweep" | "skyline" | "terrain-tile";

export type ApiRequest = {
  endpoint: ApiEndpoint;
  method: "GET" | "POST";
  path: string;
  query?: Record<string, number | string>;
  body?: unknown;
  timeoutMs: number;
};

export interface Transport {
  send(req: ApiRequest): Promise<unknown>;
}
