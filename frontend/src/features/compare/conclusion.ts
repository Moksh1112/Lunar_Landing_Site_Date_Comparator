import type { CompareResponse } from "../../api/types";

/**
 * One plain sentence that answers the comparison, derived only from the contract delta
 * (both_hours, A minus B). Display-only; it never adds a claim the response does not hold.
 */
export function conclusion(data: CompareResponse): string {
  const [a, b] = data.scenarios;
  const d = data.deltas.both_hours;
  if (d === null) return `${a.label} and ${b.label} cannot be compared on hours with both Sun and Earth in view.`;
  if (Math.abs(d) < 0.05) return `${a.label} and ${b.label} get the same hours with both Sun and Earth in view.`;
  const [win, lose] = d > 0 ? [a, b] : [b, a];
  return `${win.label} gets ${Math.abs(d).toFixed(1)} h more with both Sun and Earth in view than ${lose.label}.`;
}
