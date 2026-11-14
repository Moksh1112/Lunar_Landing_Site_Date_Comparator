import { z } from "zod";
import { USE_MOCK } from "./client";

const metadata = z.object({
  data_label: z.literal("REAL"),
  bounds_m: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  source_url: z.string().url(),
  citation: z.string(),
  method: z.string(),
});
export type Basemap = z.infer<typeof metadata>;
const base = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const hillshadeUrl = `${base}/assets/lunar/south-pole-hillshade.png`;

export async function getBasemap(signal?: AbortSignal): Promise<Basemap> {
  if (USE_MOCK) throw new Error("Real basemap is unavailable in fixture mode.");
  const response = await fetch(`${base}/assets/lunar/south-pole-hillshade.json`, { signal });
  if (!response.ok) throw new Error("Lunar hillshade is not installed on this server.");
  return metadata.parse(await response.json());
}
