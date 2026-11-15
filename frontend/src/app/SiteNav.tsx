import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { MAIN_NAV, PATHS, TRAILING_NAV, backFallback, hasInAppHistory, type NavItem } from "./routes";
import styles from "./SiteNav.module.css";

/** App Back: previous Azelux page when there is one, otherwise a fixed fallback (never an external site). */
export function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname, key } = useLocation();
  if (pathname === PATHS.home) return null;
  return (
    <button
      type="button"
      className={`${styles.back} ${className}`}
      onClick={() => (hasInAppHistory(key) ? navigate(-1) : navigate(backFallback(pathname), { replace: true }))}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Back
    </button>
  );
}

/** Main navigation: Home · Compare · Best Date · Simulator · Methods. Compact menu on narrow screens. */
export function SiteNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false); // compact menu
  const menuBtn = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const menuId = useId();

  // Close menus on route change.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false); menuBtn.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) { setOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);

  const link = (n: NavItem) => (
    <li key={n.to}>
      <NavLink to={n.to} end={n.end} className={styles.link}>{n.label}</NavLink>
    </li>
  );

  return (
    <nav aria-label="Main" className={styles.nav} ref={root} data-open={open}>
      <button
        ref={menuBtn}
        type="button"
        className={styles.menuBtn}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          {open ? <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />}
        </svg>
        Menu
      </button>
      <ul id={menuId} className={styles.list}>
        {MAIN_NAV.map(link)}
        {TRAILING_NAV.map(link)}
      </ul>
    </nav>
  );
}
