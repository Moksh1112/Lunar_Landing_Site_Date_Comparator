import { NavLink, Outlet } from "react-router";
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
      <SyntheticBanner />
      <header className={styles.header}>
        <span className={styles.brand}>Azelux</span>
        <nav aria-label="Main">
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
          API unreachable
        </div>
      )}
      <div className={styles.outlet}>
        <Outlet />
      </div>
      <footer className={styles.footer}>
        <span>
          Planning and education aid. Not a safety certification, power (watt) prediction or guaranteed radio link.
        </span>
        <span>
          app {health.data?.app_version ?? "n/a"} · contract 1.0
        </span>
      </footer>
    </div>
  );
}
