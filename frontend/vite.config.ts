import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// fixtures/ lives one level above frontend/; dev must be allowed to read it in mock mode.
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom", "three"] },
  // Prebundle the lazy terrain renderer with the same React runtime as the app.
  optimizeDeps: { include: ["react", "react-dom/client", "@react-three/fiber"] },
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
