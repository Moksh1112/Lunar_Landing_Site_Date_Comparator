// Validation evidence v1.0 (validation/README.md, validation/evidence.schema.json), imported at
// build time from validation/results/*.json. A file that does not match is shown as invalid or
// unsupported, never interpreted. A missing file is an empty state, never a pass.
import { z } from "zod";

const modules = import.meta.glob("../../../../validation/results/*.json", { eager: true, import: "default" });

const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const rowSchema = z
  .object({
    case: z.string(),
    metric: z.string(),
    actual: z.number().nullable(),
    reference: z.number().nullable(),
    unit: z.string(),
    abs_error: z.number().min(0).optional(),
    tolerance: z.number().min(0).optional(),
    status: z.enum(["pass", "fail", "not_evaluated"]),
  })
  .strict();

export const evidenceSchema = z
  .object({
    schema_version: z.literal("1.0"),
    check_id: z.enum(["V1", "V2", "V3", "V4", "V5", "V6"]),
    title: z.string().min(1),
    data_label: z.enum(["REAL", "SYNTHETIC"]),
    scope: z.enum(["spot_check", "full_check"]),
    review_status: z.enum(["owner_reported", "independently_reproduced"]),
    generated_at: z.string().regex(ISO_Z),
    producer_commit: z.string().regex(HEX40),
    command: z.string().min(1),
    sources: z
      .array(z.object({ label: z.string(), reference: z.string().min(1), sha256: z.string().regex(HEX64).optional() }).strict())
      .min(1),
    manifest_sha256: z.string().regex(HEX64).optional(),
    coverage: z.string().min(1),
    status: z.enum(["pass", "fail", "incomplete"]),
    rows: z.array(rowSchema).min(1),
    limitations: z.array(z.string()),
  })
  .strict();

export type Evidence = z.infer<typeof evidenceSchema>;

export type EvidenceFile =
  | { name: string; state: "ok"; evidence: Evidence }
  | { name: string; state: "unsupported"; reason: string }
  | { name: string; state: "invalid"; reason: string };

export function parseEvidence(name: string, data: unknown): EvidenceFile {
  const version = typeof data === "object" && data !== null ? (data as { schema_version?: unknown }).schema_version : undefined;
  if (version !== undefined && version !== "1.0")
    return { name, state: "unsupported", reason: `Schema version ${JSON.stringify(version)} is not supported (expected "1.0").` };
  const r = evidenceSchema.safeParse(data);
  if (r.success) return { name, state: "ok", evidence: r.data };
  const first = r.error.issues[0];
  return { name, state: "invalid", reason: `${first.path.join(".") || "file"}: ${first.message}` };
}

export function validationFiles(src: Record<string, unknown> = modules): EvidenceFile[] {
  return Object.entries(src)
    .map(([path, data]) => parseEvidence(path.split("/").pop() ?? path, data))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const SCOPE_TEXT = { spot_check: "Spot check", full_check: "Full check" } as const;
export const REVIEW_TEXT = { owner_reported: "Owner-reported", independently_reproduced: "Independently reproduced" } as const;
