import { describe, expect, it } from "vitest";
import { matchRoutes } from "react-router";
import { MAIN_NAV, PATHS, TRAILING_NAV, backFallback, hasInAppHistory, legacyTarget } from "../routes";
import { routeObjects } from "../routeObjects";

const leaf = (path: string) => matchRoutes(routeObjects, path)?.at(-1)?.route;

describe("route map", () => {
  it("opens the full tour directly at Home", async () => {
    const load = leaf("/")?.lazy;
    if (typeof load !== "function") throw new Error("Home has no page loader");
    const module = await load();
    const { LandingPage } = await import("../../features/landing/LandingPage");
    expect(module.Component).toBe(LandingPage);
  });
  it("serves every final route, with home and compare as different pages", () => {
    for (const p of Object.values(PATHS)) expect(leaf(p)?.path ?? (leaf(p)?.index ? "/" : undefined), p).toBeDefined();
    expect(leaf("/")).not.toBe(leaf("/compare"));
  });
  it("redirects legacy links with query and hash kept", () => {
    expect(legacyTarget("/landing", "?mock=compare:error")).toBe("/learn/simulator?mock=compare:error");
    expect(legacyTarget("/landing/tour", "", "#h-sim")).toBe("/learn/tour#h-sim");
    expect(legacyTarget("/tour/")).toBe("/learn/tour");
    expect(legacyTarget("/compare")).toBeNull();
    for (const p of ["/landing", "/landing/tour", "/tour"]) expect(leaf(p)?.path).toBe(p);
  });
  it("sends unknown paths to the 404 route", () => {
    expect(leaf("/nope/deeper")?.path).toBe("*");
  });
});

describe("back control", () => {
  it("uses deterministic fallbacks on direct entry", () => {
    expect(backFallback("/learn/tour")).toBe("/");
    expect(backFallback("/learn/simulator")).toBe("/");
    expect(backFallback("/best-date")).toBe("/compare");
    expect(backFallback("/terrain")).toBe("/compare");
    expect(backFallback("/methods")).toBe("/compare");
    expect(backFallback("/report")).toBe("/compare");
    expect(backFallback("/compare")).toBe("/");
  });
  it("only goes back in history after in-app navigation", () => {
    expect(hasInAppHistory("default")).toBe(false);
    expect(hasInAppHistory("x7k2p")).toBe(true);
  });
});

describe("navigation", () => {
  it("lists Home · Compare · Best Date · Learn (tour, simulator) · Methods", () => {
    expect([...MAIN_NAV, ...TRAILING_NAV].map((n) => n.to)).toEqual(["/", "/compare", "/best-date", "/terrain", "/learn/simulator", "/methods"]);
  });
});
