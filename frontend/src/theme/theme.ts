import { create } from "zustand";

export type Theme = "light" | "dark";
export function initialTheme(saved: string | null, prefersDark: boolean): Theme {
  return saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
}

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set) => ({
  theme: "dark",
  toggle: () => set(s => {
    const theme = s.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("azelux-theme", theme); } catch { /* Storage may be disabled. */ }
    return { theme };
  }),
}));

export function initializeTheme() {
  let saved: string | null = null;
  try { saved = localStorage.getItem("azelux-theme"); } catch { /* Use system preference. */ }
  const theme = initialTheme(saved, matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = theme;
  useTheme.setState({ theme });
}
