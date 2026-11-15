import { afterEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { HomeMoon } from "../HomeMoon";

const lifecycle = vi.hoisted(() => ({
  effect: null as (() => (() => void) | undefined) | null,
  host: { clientWidth: 400, appendChild: vi.fn() },
  render: vi.fn(),
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useRef: () => ({ current: lifecycle.host }),
  useState: () => [true],
  useEffect: (effect: () => (() => void) | undefined) => { lifecycle.effect = effect; },
}));
vi.mock("three", async importOriginal => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: class {
    domElement = { setAttribute: vi.fn(), remove: vi.fn() };
    capabilities = { getMaxAnisotropy: () => 1 };
    render = lifecycle.render;
    setPixelRatio() {}
    setSize() {}
    dispose() {}
  },
}));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); lifecycle.render.mockClear(); });

it("renders the completed texture with reduced motion, and ignores completion after cleanup", () => {
  vi.stubGlobal("document", {});
  vi.stubGlobal("window", { devicePixelRatio: 1, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  let complete!: () => void;
  vi.spyOn(THREE.TextureLoader.prototype, "load").mockImplementation((_url, onLoad) => {
    const texture = new THREE.Texture<HTMLImageElement>();
    complete = () => onLoad?.(texture);
    return texture;
  });
  HomeMoon();
  const cleanup = lifecycle.effect!();
  expect(lifecycle.render).toHaveBeenCalledTimes(1);
  complete();
  expect(lifecycle.render).toHaveBeenCalledTimes(2);
  cleanup!();
  complete();
  expect(lifecycle.render).toHaveBeenCalledTimes(2);
});
