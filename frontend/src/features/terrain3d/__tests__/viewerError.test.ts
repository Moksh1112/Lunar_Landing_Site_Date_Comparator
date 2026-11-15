import { describe, expect, it } from "vitest";
import { isViewerChunkError, viewerErrorHint } from "../viewerError";

describe("terrain error guidance", () => {
  it("does not misdiagnose a React initialization failure as a graphics setting", () => {
    const hint = viewerErrorHint("Cannot read properties of null (reading 'useMemo')");
    expect(hint).toContain("React code");
    expect(hint).not.toContain("acceleration");
  });
  it("distinguishes a failed lazy download from WebGL failure", () => {
    expect(isViewerChunkError("Failed to fetch dynamically imported module")).toBe(true);
    expect(isViewerChunkError("Loading chunk 42 failed")).toBe(true);
    expect(isViewerChunkError("Error creating WebGL context")).toBe(false);
    expect(viewerErrorHint("Failed to fetch dynamically imported module")).toContain("connection");
    expect(viewerErrorHint("Error creating WebGL context")).toContain("acceleration");
  });
});
