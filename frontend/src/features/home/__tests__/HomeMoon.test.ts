import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as THREE from "three";
import { mountMoonScene } from "../moonScene3d";

const lifecycle = vi.hoisted(() => ({
  host: { clientWidth: 400, appendChild: vi.fn() },
  render: vi.fn(),
}));
vi.mock("three", async importOriginal => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: class {
    domElement = { setAttribute: vi.fn(), remove: vi.fn() };
    capabilities = { getMaxAnisotropy: () => 1 };
    render = lifecycle.render;
    setPixelRatio() {}
    setSize() {}
    compileAsync() { return Promise.resolve(); }
    dispose() {}
    forceContextLoss() {}
  },
}));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); lifecycle.render.mockClear(); });

beforeEach(() => {
  vi.stubGlobal("document", {});
  vi.stubGlobal("window", { devicePixelRatio: 1, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("createImageBitmap", vi.fn());
});

it("renders the completed bitmap with reduced motion after shader compilation", async () => {
  let complete!: () => void;
  const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
  vi.spyOn(THREE.ImageBitmapLoader.prototype, "load").mockImplementation((_url, onLoad) => {
    complete = () => onLoad?.(bitmap);
  });
  const cleanup = mountMoonScene(lifecycle.host as unknown as HTMLElement)!;
  await Promise.resolve();
  expect(lifecycle.render).toHaveBeenCalledTimes(1);
  complete();
  expect(lifecycle.render).toHaveBeenCalledTimes(2);
  cleanup();
  await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledOnce());
});

it("ignores late bitmap completion after cleanup and closes its image", async () => {
  let complete!: () => void;
  const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
  vi.spyOn(THREE.ImageBitmapLoader.prototype, "load").mockImplementation((_url, onLoad) => {
    complete = () => onLoad?.(bitmap);
  });
  const cleanup = mountMoonScene(lifecycle.host as unknown as HTMLElement)!;
  cleanup();
  complete();
  await Promise.resolve();
  await Promise.resolve();
  expect(lifecycle.render).not.toHaveBeenCalled();
  expect(bitmap.close).toHaveBeenCalledOnce();
});
