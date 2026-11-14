import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// fixtures/ lives one level above frontend/; dev must be allowed to read it in mock mode.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: { allow: [".."] },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
