import { useQuery } from "@tanstack/react-query";
import { getSites } from "../api/client";
import type { LibrarySite } from "../api/types";
import styles from "./siteSource.module.css";

/** Library site for an id from the cached /sites response (null for custom points or unknown ids). */
export function findSite(sites: LibrarySite[] | undefined, siteId: string | null | undefined): LibrarySite | null {
  if (!siteId || !sites) return null;
  return sites.find((s) => s.site_id === siteId) ?? null;
}

/** Only http(s) links are rendered as links; anything else is shown as text (CONTRACT source_url is a plain string). */
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/** F1: "every site shows its coordinate source". Renders nothing for custom coordinates. */
export function SiteSource({ siteId, compact = false }: { siteId: string | null | undefined; compact?: boolean }) {
  const sites = useQuery({ queryKey: ["sites"], queryFn: getSites, enabled: !!siteId });
  if (!siteId) return null;
  const site = findSite(sites.data?.sites, siteId);
  if (!site) return sites.isPending ? null : <span className={styles.source}>Coordinate source unavailable for {siteId}.</span>;
  const href = safeHref(site.source_url);
  return (
    <span className={`${styles.source} ${compact ? styles.compact : ""}`}>
      <span className={styles.label}>Coordinate source:</span> {site.source_note}
      {href ? (
        <>
          {" "}
          <a href={href} target="_blank" rel="noopener noreferrer">
            {new URL(href).hostname}
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </>
      ) : (
        site.source_url && <> ({site.source_url})</>
      )}
      {!site.verified && <span className={styles.unverified}> Unverified (SYNTHETIC).</span>}
    </span>
  );
}
