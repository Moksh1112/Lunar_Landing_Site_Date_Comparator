import { Link } from "react-router";
import { SiteNav } from "./SiteNav";
import { PATHS } from "./routes";
import { ExpertToggle } from "./ExpertToggle";
import { ThemeToggle } from "../components/ThemeToggle";
import styles from "./AppShell.module.css";

export function AppHeader({ expert = true }: { expert?: boolean }) {
  return <header data-app-header className={`${styles.header} no-print`}>
    <Link to={PATHS.home} className={styles.brand} aria-label="Azelux home">
      <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 13.5 L8 11 L11 12.5 L15 9.5 L21 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className={styles.name}>Azelux</span>
    </Link>
    <SiteNav />
    <div className={styles.tools}><ThemeToggle />{expert && <ExpertToggle />}</div>
  </header>;
}
