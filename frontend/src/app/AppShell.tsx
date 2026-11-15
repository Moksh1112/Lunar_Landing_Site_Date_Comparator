import { Link, Outlet } from "react-router";
import { BackButton } from "./SiteNav";
import { AppHeader } from "./AppHeader";
import { ErrorBoundary } from "./ErrorBoundary";
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
      <AppHeader />
      {unreachable && (
        <div className={styles.notice} role="status">
          API unreachable. Check that the backend is running, then reload.
        </div>
      )}
      <div className={styles.outlet} id="main" tabIndex={-1}>
        <div className={`${styles.backRow} no-print`}><BackButton /></div>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <footer className={styles.footer}>
        <Link to="/methods#limits">Methods, sources and limits</Link>
        <span className={styles.version}>App {health.data?.app_version ?? "n/a"}, contract {health.data?.contract_version ?? "n/a"}</span>
      </footer>
    </div>
  );
}
