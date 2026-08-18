import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { server } from "./msw/server";
import { resetProviderState } from "./msw/state";
import "./msw/tauriMocks";

// 表单组件测试验证表单逻辑（与上游一致）；fork 预设过滤是 fork 专属行为，
// 在测试中模拟上游构建（IS_FORK_BUILD=false）让 filterForkPresets 不生效，
// 避免过滤干扰表单测试 fixture。
vi.mock("@/config/forkBuild", () => ({
  IS_FORK_BUILD: false,
}));

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "warn" });
  await i18n.use(initReactI18next).init({
    lng: "zh",
    fallbackLng: "zh",
    resources: {
      zh: { translation: {} },
      en: { translation: {} },
    },
    interpolation: {
      escapeValue: false,
    },
  });
});

afterEach(() => {
  cleanup();
  resetProviderState();
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});
