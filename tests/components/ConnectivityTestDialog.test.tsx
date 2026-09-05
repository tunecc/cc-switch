import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConnectivityTestDialog from "@/components/providers/ConnectivityTestDialog";
import { providersApi } from "@/lib/api/providers";
import {
  connectivityTestProviderModels,
  type ConnectivityTestResult,
} from "@/lib/api/connectivity-test";
import type { Provider } from "@/types";

// 弹窗经由 useConnectivityTest 消费该模块；mock 后可在测试中控制整批结果
vi.mock("@/lib/api/connectivity-test", () => ({
  connectivityTestProviderModels: vi.fn(),
  connectivityProbeProvider: vi.fn(),
}));

// 「保存参数」直接调用 providersApi.update，mock 掉 invoke 链路
vi.mock("@/lib/api/providers", () => ({
  providersApi: {
    update: vi.fn(),
  },
}));

const provider = {
  id: "p1",
  name: "Relay",
  settingsConfig: {
    env: { ANTHROPIC_BASE_URL: "https://relay/v1", ANTHROPIC_AUTH_TOKEN: "k" },
    modelCatalog: { models: [{ model: "a" }, { model: "b" }] },
  },
};

describe("ConnectivityTestDialog", () => {
  it("auto-selects the first catalog model when no current model is resolvable", () => {
    render(
      <ConnectivityTestDialog
        provider={provider}
        appId="claude"
        open
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "a" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "b" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled();
  });

  it("blocks start after the user deselects the auto-selected model", () => {
    render(
      <ConnectivityTestDialog
        provider={provider}
        appId="claude"
        open
        onOpenChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "a" }));
    expect(screen.getByRole("button", { name: /start/i })).toBeDisabled();
  });
});

const makeResult = (
  overrides: Partial<ConnectivityTestResult>,
): ConnectivityTestResult => ({
  modelId: "a",
  status: "success",
  requestUrl: "https://relay/v1/messages",
  requestHeaders: {},
  requestBody: {},
  ...overrides,
});

describe("ConnectivityTestDialog behaviors", () => {
  const openDialog = (p: Provider = provider) =>
    render(
      <ConnectivityTestDialog
        provider={p}
        appId="claude"
        open
        onOpenChange={() => {}}
      />,
    );

  it("select-all enables start, runs the batch test, and renders result rows", async () => {
    vi.mocked(connectivityTestProviderModels).mockResolvedValue({
      results: [
        makeResult({
          modelId: "a",
          status: "success",
          firstByteMs: 120,
          totalMs: 340,
        }),
        makeResult({
          modelId: "b",
          status: "error",
          totalMs: 500,
          errorMessage: "boom",
        }),
        // 后端会对供应商全部模型发请求：选中列表之外的多余结果应被忽略
        makeResult({ modelId: "c", status: "success", totalMs: 1 }),
      ],
    });

    openDialog();

    fireEvent.click(screen.getByRole("checkbox", { name: "全选" }));
    const startButton = screen.getByRole("button", { name: /start/i });
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText("成功")).toBeInTheDocument();
    });
    expect(connectivityTestProviderModels).toHaveBeenCalledWith(
      "claude",
      "p1",
      expect.objectContaining({ prompt: "ping", stream: true }),
    );
    expect(screen.getAllByRole("button", { name: "请求详情" })).toHaveLength(2);
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.queryByText("c")).not.toBeInTheDocument();
  });

  it("opens the per-model detail dialog from a result row", async () => {
    vi.mocked(connectivityTestProviderModels).mockResolvedValue({
      results: [
        makeResult({
          modelId: "a",
          status: "success",
          totalMs: 340,
          requestHeaders: { "x-api-key": "sk-***" },
          requestBody: { model: "a", prompt: "ping" },
          responseHeaders: { "content-type": "application/json" },
          responseBody: { ok: true },
        }),
      ],
    });

    openDialog();

    // "a" 已随打开自动勾选，直接开始
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    const detailButton = await screen.findByRole("button", {
      name: "请求详情",
    });
    fireEvent.click(detailButton);

    await waitFor(() => {
      expect(screen.getByText("https://relay/v1/messages")).toBeInTheDocument();
    });
  });

  it("pre-checks the persisted default test model", () => {
    const withDefault = {
      ...provider,
      settingsConfig: {
        ...provider.settingsConfig,
        connectivityTest: { defaultTestModelId: "b" },
      },
    };

    openDialog(withDefault);

    expect(screen.getByRole("checkbox", { name: "b" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "a" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled();
  });

  it("pre-checks the provider's current model (env.ANTHROPIC_MODEL) when no default is saved", () => {
    const withCurrent = {
      ...provider,
      settingsConfig: {
        ...provider.settingsConfig,
        env: {
          ...provider.settingsConfig.env,
          ANTHROPIC_MODEL: "b",
        },
      },
    };

    openDialog(withCurrent);

    expect(screen.getByRole("checkbox", { name: "b" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "a" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled();
  });

  it("pre-checks the codex config.toml model for codex providers", () => {
    const codexProvider = {
      ...provider,
      id: "cx",
      settingsConfig: {
        config: 'model = "gpt-5-codex"',
        modelCatalog: { models: [{ model: "gpt-5-codex" }, { model: "o4-mini" }] },
      },
    };

    render(
      <ConnectivityTestDialog
        provider={codexProvider}
        appId="codex"
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "gpt-5-codex" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "o4-mini" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled();
  });

  it("renders only the first matching field per catalog entry (backend parity)", () => {
    const aliased = {
      ...provider,
      settingsConfig: {
        modelCatalog: {
          models: [{ model: "x", id: "x-id", name: "X" }, { name: "y" }],
        },
      },
    };

    openDialog(aliased);

    expect(screen.getByRole("checkbox", { name: "x" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "y" })).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "X" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "x-id" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when the provider has no testable models", () => {
    const noModels = {
      ...provider,
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://relay/v1" } },
    };

    openDialog(noModels);

    expect(screen.getByText("无模型可测试")).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "全选" }),
    ).not.toBeInTheDocument();
  });

  it("blocks start when the custom headers JSON is invalid", () => {
    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "高级参数" }));
    fireEvent.change(screen.getByLabelText(/自定义请求头/), {
      target: { value: "{oops" },
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "全选" }));
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(connectivityTestProviderModels).not.toHaveBeenCalled();
    expect(screen.getByText(/不是有效的 JSON/)).toBeInTheDocument();
  });

  it("saves params through providersApi.update with merged settingsConfig", async () => {
    vi.mocked(providersApi.update).mockResolvedValue(true);

    openDialog();

    fireEvent.change(screen.getByLabelText(/测试提示词/), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存参数" }));

    await waitFor(() => {
      expect(providersApi.update).toHaveBeenCalledTimes(1);
    });
    expect(providersApi.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        settingsConfig: expect.objectContaining({
          env: provider.settingsConfig.env,
          modelCatalog: provider.settingsConfig.modelCatalog,
          connectivityTest: { prompt: "hello" },
        }),
      }),
      "claude",
      "p1",
    );
  });
});
