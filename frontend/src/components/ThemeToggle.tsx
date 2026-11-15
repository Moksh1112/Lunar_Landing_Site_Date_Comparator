import { useTheme } from "../theme/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button type="button" role="switch" aria-checked={theme === "dark"} className="theme-toggle" onClick={toggle} aria-label="Dark theme" title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
    <span className="theme-track" aria-hidden="true"><span className="theme-thumb" />
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
    </svg>
    </span>
    <span className="theme-label">{theme === "dark" ? "Dark" : "Light"}</span>
  </button>;
}
