import { describe, expect, it } from "vitest";
import { resolveApiBase } from "../apiBase";

describe("resolveApiBase", () => {
  it("defaults to the local backend when unset", () => expect(resolveApiBase(undefined)).toBe("http://127.0.0.1:8000"));
  it("keeps an empty value as same-origin (reverse proxy), never falling back to localhost", () => expect(resolveApiBase("")).toBe(""));
  it("strips one trailing slash from an explicit origin", () => expect(resolveApiBase("https://api.example.org/")).toBe("https://api.example.org"));
});
