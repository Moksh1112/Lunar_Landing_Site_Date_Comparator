import { Link, Outlet } from "react-router";
import { BackButton, SiteNav } from "./SiteNav";
import { PATHS } from "./routes";
import { ErrorBoundary } from "./ErrorBoundary";
import { ExpertToggle } from "./ExpertToggle";
import { SyntheticBanner, useHealthQuery } from "./SyntheticBanner";
import { USE_MOCK } from "../api/client";
import styles from "./AppShell.module.css";

export function AppShell() {
  const health = useHealthQuery();
  const unreachable = !USE_MOCK && health.isError;
  return (
    <div className={styles.shell}>
      <a href="#main" className={`${styles.skip} no-print`}>
        Skip to content
      </a>
      <SyntheticBanner />
      <header className={`${styles.header} no-print`}>
        <Link to={PATHS.home} className={styles.brand} aria-label="Azelux home">
          <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 13.5 L8 11 L11 12.5 L15 9.5 L21 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className={styles.name}>Azelux</span>
        </Link>
        <BackButton className={styles.back} />
        <SiteNav />
        <ExpertToggle />
      </header>
      {unreachable && (
        <div className={styles.notice} role="status">
          API unreachable. Check that the backend is running, then reload.
        </div>
      )}
      <div className={styles.outlet} id="main" tabIndex={-1}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <footer className={styles.footer}>
        <span>Planning aid only. Not a safety certification, power prediction or radio-link guarantee.</span>
        <span className={styles.version}>App {health.data?.app_version ?? "n/a"}, contract {health.data?.contract_version ?? "n/a"}</span>
      </footer>
    </div>
  );
}
