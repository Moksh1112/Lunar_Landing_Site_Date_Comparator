import { afterEach, describe, expect, it, vi } from "vitest";
import { initialTheme, initializeTheme, useTheme } from "./theme";

afterEach(() => { vi.unstubAllGlobals(); useTheme.setState({ theme: "dark" }); });

describe("theme preference", () => {
  it("uses the system preference only when no valid saved choice exists", () => {
    expect(initialTheme(null, false)).toBe("light");
    expect(initialTheme("invalid", true)).toBe("dark");
    expect(initialTheme("light", true)).toBe("light");
    expect(initialTheme("dark", false)).toBe("dark");
  });
  it("applies and persists the selected theme across the app", () => {
    const dataset: Record<string, string> = {};
    const setItem = vi.fn();
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("localStorage", { getItem: () => "dark", setItem });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    initializeTheme();
    expect(dataset.theme).toBe("dark");
    useTheme.getState().toggle();
    expect(dataset.theme).toBe("light");
    expect(useTheme.getState().theme).toBe("light");
    expect(setItem).toHaveBeenCalledWith("azelux-theme", "light");
  });
  it("keeps the toggle working when browser storage is disabled", () => {
    const dataset: Record<string, string> = {};
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("localStorage", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("blocked"); } });
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    initializeTheme();
    expect(dataset.theme).toBe("dark");
    expect(() => useTheme.getState().toggle()).not.toThrow();
    expect(dataset.theme).toBe("light");
  });
});
