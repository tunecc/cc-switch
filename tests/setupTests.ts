import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { server } from "./msw/server";
import { resetProviderState } from "./msw/state";
import "./msw/tauriMocks";

// A request without a handler fails the test that made it, instead of only
// logging while the component quietly takes its error path.
const unhandledRequests: string[] = [];

// 表单组件测试验证表单逻辑（与上游一致）；fork 预设过滤是 fork 专属行为，
// 在测试中模拟上游构建（IS_FORK_BUILD=false）让 filterForkPresets 不生效，
// 避免过滤干扰表单测试 fixture。
vi.mock("@/config/forkBuild", () => ({
  IS_FORK_BUILD: false,
}));

beforeAll(async () => {
  server.listen({
    onUnhandledRequest: (request) => {
      unhandledRequests.push(`${request.method} ${request.url}`);
    },
  });
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
  // 页面数据的本地缓存（src/lib/localCache.ts）和用量页记住的选择不能从一个用例带到下一个
  for (const key of Object.keys(localStorage)) {
    if (
      key.startsWith("cc-switch-cache:") ||
      key.startsWith("cc-switch.usage.")
    )
      localStorage.removeItem(key);
  }
  resetProviderState();
  server.resetHandlers();
  vi.clearAllMocks();
  const unhandled = unhandledRequests.splice(0);
  if (unhandled.length > 0) {
    throw new Error(
      `Requests without an MSW handler (add one to tests/msw/handlers.ts or server.use it in the test):\n${unhandled.join("\n")}`,
    );
  }
});

afterAll(() => {
  server.close();
});
