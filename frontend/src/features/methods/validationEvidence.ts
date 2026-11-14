// TRD 7.5: validation results are imported at build time from validation/results/*.json (P6).
// Their schema is not in CONTRACT v1.0, so the page lists files without interpreting fields.
const modules = import.meta.glob("../../../../validation/results/*.json", { eager: true, import: "default" });

export type EvidenceFile = { name: string; data: unknown };

export function validationFiles(src: Record<string, unknown> = modules): EvidenceFile[] {
  return Object.entries(src)
    .map(([path, data]) => ({ name: path.split("/").pop() ?? path, data }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
