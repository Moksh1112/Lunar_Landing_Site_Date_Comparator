import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link, Outlet, useLocation } from "react-router";
import PillNav from "../components/reactbits/PillNav";
import { ErrorBoundary } from "./ErrorBoundary";
import { ExpertToggle } from "./ExpertToggle";
import { SyntheticBanner, useHealthQuery } from "./SyntheticBanner";
import { USE_MOCK } from "../api/client";
import styles from "./AppShell.module.css";

const NAV = [
  { href: "/", label: "Compare" },
  { href: "/best-date", label: "Best date" },
  { href: "/methods", label: "Methods" },
  { href: "/report", label: "Report" },
];

/** PillNav renders `href`; route it through the client-side router. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(({ href = "/", ...rest }, ref) => (
  <Link ref={ref} to={href} {...rest} />
));
RouterLink.displayName = "RouterLink";

export function AppShell() {
  const health = useHealthQuery();
  const { pathname } = useLocation();
  const unreachable = !USE_MOCK && health.isError;
  return (
    <div className={styles.shell}>
      <a href="#main" className={`${styles.skip} no-print`}>
        Skip to content
      </a>
      <SyntheticBanner />
      <header className={`${styles.header} no-print`}>
        <Link to="/landing" className={styles.brand} aria-label="Azelux simulator home">
          <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 13.5 L8 11 L11 12.5 L15 9.5 L21 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className={styles.name}>Azelux</span>
        </Link>
        <PillNav
          className={styles.nav}
          items={NAV}
          activeHref={pathname}
          linkComponent={RouterLink}
          theme="light"
          layout="joined"
          size="sm"
          surface="none"
          itemStyle="plain"
          indicator="pill"
          highlightColor="#f5f5f5"
          highlightTextColor="#0a0a0a"
          intro={false}
          bounce={0}
          collapse="auto"
        />
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
