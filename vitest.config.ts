import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  define: {
    __CCS_FORK_BUILD__: JSON.stringify(true),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["{src,tests}/**/*.{test,spec}.{ts,tsx,js,jsx}"],
    environment: "jsdom",
    setupFiles: ["./tests/setupGlobals.ts", "./tests/setupTests.ts"],
    globals: true,
    // 默认 5000ms 对「渲染整个供应商表单」这类 jsdom 组件测试不成立：
    // PiProviderForm 里已有一批天然跑 3.3–5.6s，CI 机器比开发机慢约 5 倍
    // （全套本地 ~33s / CI ~187s），默认值下它们稳定越线超时。
    // 30s 仍是硬边界，不会把真挂死的测试藏起来。
    testTimeout: 30000,
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
