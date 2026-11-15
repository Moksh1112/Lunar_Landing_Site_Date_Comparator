import { z } from "zod";
import { USE_MOCK } from "./client";
import { API_BASE } from "./apiBase";

const metadata = z.object({
  data_label: z.literal("REAL"),
  bounds_m: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  bounds_deg: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  source_url: z.string().url(),
  citation: z.string(),
  method: z.string(),
});
export type Basemap = z.infer<typeof metadata>;
const base = API_BASE;
export const globalMapUrl = `${base}/assets/lunar/whole-moon-context.png`;
export const hillshadeUrl = `${base}/assets/lunar/south-pole-hillshade.png`;

export async function getBasemap(signal?: AbortSignal, view: "polar" | "global" = "polar"): Promise<Basemap> {
  if (USE_MOCK) throw new Error("Real basemap is unavailable in fixture mode.");
  const response = await fetch(`${base}/assets/lunar/${view === "polar" ? "south-pole-hillshade" : "whole-moon-context"}.json`, { signal });
  if (!response.ok) throw new Error("Lunar hillshade is not installed on this server.");
  return metadata.parse(await response.json());
}
