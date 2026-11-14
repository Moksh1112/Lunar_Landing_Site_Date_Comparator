import { NavLink, Outlet } from "react-router";
import { ErrorBoundary } from "./ErrorBoundary";
import { ExpertToggle } from "./ExpertToggle";
import { SyntheticBanner, useHealthQuery } from "./SyntheticBanner";
import { USE_MOCK } from "../api/client";
import styles from "./AppShell.module.css";

const NAV = [
  { to: "/", label: "Compare", end: true },
  { to: "/best-date", label: "Best date" },
  { to: "/methods", label: "Methods" },
  { to: "/report", label: "Report" },
];

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
        <div className={styles.brand}>
          <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 13.5 L8 11 L11 12.5 L15 9.5 L21 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className={styles.name}>Azelux</span>
          <span className={styles.tagline}>Lunar site and date comparator</span>
        </div>
        <nav aria-label="Main" className={styles.nav}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={styles.link}>
              {n.label}
            </NavLink>
          ))}
        </nav>
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
        <span>
          Planning and education aid. Not a safety certification, power (watt) prediction or guaranteed radio link.
        </span>
        <span className={styles.version}>App {health.data?.app_version ?? "n/a"}, contract 1.0</span>
      </footer>
    </div>
  );
}
