import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}", "test/**/*.test.{js,mjs}"],
    exclude: ["node_modules", "dist"],
    restoreMocks: true,
    clearMocks: true
  }
});
