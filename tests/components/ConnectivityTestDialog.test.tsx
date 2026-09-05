import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ConnectivityTestDialog from "@/components/providers/ConnectivityTestDialog";
import { providersApi } from "@/lib/api/providers";
import {
  connectivityTestProviderModels,
  type ConnectivityTestResult,
} from "@/lib/api/connectivity-test";
import { fetchModelsForConfig, showFetchModelsError } from "@/lib/api/model-fetch";
import { DEFAULT_CONNECTIVITY_TEST_SETTINGS } from "@/lib/connectivityTestSettings";
import type { Provider } from "@/types";

// 弹窗经由 useConnectivityTest 消费该模块；mock 后可在测试中控制逐模型结果
vi.mock("@/lib/api/connectivity-test", () => ({
  connectivityTestProviderModels: vi.fn(),
  connectivityProbeProvider: vi.fn(),
}));

// 获取模型列表走 model-fetch；mock 掉拉取与 toast 错误分支
vi.mock("@/lib/api/model-fetch", () => ({
  fetchModelsForConfig: vi.fn(),
  showFetchModelsError: vi.fn(),
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

  it("shows the new default prompt on first open", () => {
    render(
      <ConnectivityTestDialog
        provider={provider}
        appId="claude"
        open
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/测试提示词/)).toHaveValue(
      DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt,
    );
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

  beforeEach(() => {
    vi.mocked(connectivityTestProviderModels).mockReset();
    vi.mocked(fetchModelsForConfig).mockReset();
  });

  it("runs the per-model test for the selection and auto-checks failed models", async () => {
    // 每模型一次独立 invoke：按 modelIds 单元素返回对应结果
    vi.mocked(connectivityTestProviderModels).mockImplementation(
      async (_appId, _providerId, _params, modelIds) => {
        const id = modelIds?.[0] ?? "a";
        return {
          results: [
            id === "a"
              ? makeResult({ modelId: "a", status: "success", firstByteMs: 120, totalMs: 340 })
              : makeResult({ modelId: "b", status: "error", totalMs: 500, errorMessage: "boom" }),
          ],
        };
      },
    );

    openDialog();

    // 单一表格：打开即展示全部静态清单模型行（初始待测试）
    expect(screen.getByRole("checkbox", { name: "全选" })).toBeInTheDocument();
    expect(screen.getAllByText("待测试").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("checkbox", { name: "全选" }));
    const startButton = screen.getByRole("button", { name: /start/i });
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText("成功")).toBeInTheDocument();
    });
    // 逐模型独立 invoke（勾选即测试范围），新默认提示词随参数下发
    expect(connectivityTestProviderModels).toHaveBeenCalledWith(
      "claude",
      "p1",
      expect.objectContaining({
        prompt: "你好，你可以帮我做什么事情",
        stream: true,
      }),
      ["a"],
    );
    expect(connectivityTestProviderModels).toHaveBeenCalledWith(
      "claude",
      "p1",
      expect.objectContaining({ stream: true }),
      ["b"],
    );
    expect(screen.getAllByRole("button", { name: "请求详情" })).toHaveLength(2);
    expect(screen.getAllByText("失败").length).toBeGreaterThan(0);
    expect(screen.getByText("boom")).toBeInTheDocument();

    // 测完自动勾选失败项：b 失败 → 勾选集合替换为 [b]
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "a" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "b" })).toBeChecked();
    });
  });

  it("keeps the user's selection when every tested model succeeds", async () => {
    vi.mocked(connectivityTestProviderModels).mockImplementation(
      async (_appId, _providerId, _params, modelIds) => ({
        results: [
          makeResult({ modelId: modelIds?.[0] ?? "a", status: "success", totalMs: 10 }),
        ],
      }),
    );

    openDialog();

    // 打开时预选 a；仅测 a
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    await waitFor(() => {
      expect(screen.getByText("成功")).toBeInTheDocument();
    });
    expect(screen.getByRole("checkbox", { name: "a" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "b" })).not.toBeChecked();
  });

  it("opens the per-model detail dialog from a result row", async () => {
    vi.mocked(connectivityTestProviderModels).mockImplementation(
      async () => ({
        results: [
          makeResult({
            modelId: "a",
            status: "success",
            totalMs: 340,
            requestHeaders: { "x-api-key": "sk-***" },
            requestBody: { model: "a", prompt: "你好，你可以帮我做什么事情" },
            responseHeaders: { "content-type": "application/json" },
            responseBody: { ok: true },
          }),
        ],
      }),
    );

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
    // 空静态清单仍可拉取远端模型
    expect(screen.getByRole("button", { name: "获取模型列表" })).toBeEnabled();
  });

  it("appends fetched remote models to the table, deduped, as untested rows", async () => {
    vi.mocked(fetchModelsForConfig).mockResolvedValue([
      { id: "a", ownedBy: "relay" },
      { id: "c", ownedBy: "relay" },
    ]);

    openDialog();

    // 统计卡初始：已勾选 1（预选 a）；待测试 = 行状态 2 行 + 统计卡标签 1
    expect(screen.getByText("已勾选").parentElement).toHaveTextContent("1");
    expect(screen.getAllByText("待测试")).toHaveLength(3);

    expect(screen.queryByRole("checkbox", { name: "c" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "获取模型列表" }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "c" })).toBeInTheDocument();
    });
    // 拉取的行初始未勾选、待测试；重复拉取不产生重复行
    expect(screen.getByRole("checkbox", { name: "c" })).not.toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: "a" })).toHaveLength(1);
    // 追加 c 后待测试行 +1
    await waitFor(() => {
      expect(screen.getAllByText("待测试")).toHaveLength(4);
    });

    // 再次拉取：与静态清单 + 已追加行去重
    fireEvent.click(screen.getByRole("button", { name: "获取模型列表" }));
    await waitFor(() => {
      expect(fetchModelsForConfig).toHaveBeenCalledTimes(2);
    });
    expect(screen.getAllByRole("checkbox", { name: "c" })).toHaveLength(1);
  });

  it("shows the shared fetch error and keeps local rows usable when fetching fails", async () => {
    vi.mocked(fetchModelsForConfig).mockRejectedValue(
      new Error("All candidates failed: HTTP 404"),
    );

    openDialog();

    fireEvent.click(screen.getByRole("button", { name: "获取模型列表" }));

    // 失败走共享错误提示（与模型快捷切换同语义），静态清单行不受影响
    await waitFor(() => {
      expect(showFetchModelsError).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("checkbox", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeEnabled();
    // 拉取按钮恢复可用
    expect(screen.getByRole("button", { name: "获取模型列表" })).toBeEnabled();
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
