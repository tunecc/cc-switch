import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import i18n from "i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider, VisibleApps } from "@/types";
import { ProviderForm } from "@/components/providers/forms/ProviderForm";
import { createTestQueryClient } from "../utils/testQueryClient";
import { setProviders, setSettings } from "../msw/state";
import zh from "@/i18n/locales/zh.json";

// 跨应用导入在 Codex 新建表单上的端到端接线：来源应用只列「已启用、有供应商、
// 不是当前应用」；确认后把名称 / 备注 / 官网 / 密钥 / 请求地址写进 Codex 自己的
// settingsConfig 形状（auth.json + config.toml）。

const claudeProvider: Provider = {
  id: "claude-relay",
  name: "Relay One",
  notes: "主力通道",
  websiteUrl: "https://relay.example.com",
  settingsConfig: {
    env: {
      ANTHROPIC_BASE_URL: "https://relay.example.com/api",
      ANTHROPIC_AUTH_TOKEN: "sk-secret-should-not-leak",
      ANTHROPIC_MODEL: "claude-sonnet-4-5",
    },
  },
  meta: { apiFormat: "anthropic" },
  sortIndex: 0,
  createdAt: 1,
};

const allAppsVisible: VisibleApps = {
  claude: true,
  "claude-desktop": true,
  codex: true,
  gemini: true,
  grokbuild: true,
  opencode: true,
  openclaw: true,
  hermes: true,
  pi: true,
  mcode: true,
};

const onlyCodexVisible: VisibleApps = {
  claude: false,
  "claude-desktop": false,
  codex: true,
  gemini: false,
  grokbuild: false,
  opencode: false,
  openclaw: false,
  hermes: false,
  pi: false,
  mcode: false,
};

beforeAll(async () => {
  // setupTests 用空 resources 初始化 i18n；这里补上真实文案，便于按可见文字断言。
  await i18n.addResourceBundle("zh", "translation", zh, true, true);
});

const renderCodexForm = () => {
  const queryClient = createTestQueryClient();
  const onSubmit = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ProviderForm
        appId="codex"
        submitLabel="添加"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    </QueryClientProvider>,
  );
  return { onSubmit };
};

describe("Codex add form: cross-app import", () => {
  beforeEach(() => {
    setProviders("claude", { [claudeProvider.id]: claudeProvider });
    setProviders("gemini", {});
    setSettings({ commonConfigConfirmed: true, visibleApps: allAppsVisible });
  });

  it("offers a source button for enabled apps but not for the current app", async () => {
    renderCodexForm();

    expect(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "从 Codex 导入" }),
    ).not.toBeInTheDocument();
    // gemini 没有供应商，不出现按钮
    expect(
      screen.queryByRole("button", { name: "从 Gemini 导入" }),
    ).not.toBeInTheDocument();
  });

  it("hides every source button when only the current app is enabled", async () => {
    setSettings({
      commonConfigConfirmed: true,
      visibleApps: onlyCodexVisible,
    });
    renderCodexForm();

    expect(await screen.findByText("预设供应商")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /导入/ }),
    ).not.toBeInTheDocument();
  });

  it("fills the Codex shape from the selected Claude provider", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderCodexForm();

    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    const name = await screen.findByLabelText("供应商名称");
    await waitFor(() => expect(name).toHaveValue("Relay One"));
    expect(screen.getByLabelText("备注")).toHaveValue("主力通道");
    expect(screen.getByLabelText("官网链接")).toHaveValue(
      "https://relay.example.com",
    );

    await user.click(screen.getByRole("button", { name: "添加" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0] as {
      name: string;
      notes?: string;
      websiteUrl?: string;
      settingsConfig: string;
      presetCategory?: string;
      meta?: { apiFormat?: string };
    };
    expect(submitted.name).toBe("Relay One");
    expect(submitted.notes).toBe("主力通道");
    expect(submitted.websiteUrl).toBe("https://relay.example.com");
    // 「自定义」不写入 category，与手工点自定义预设的既有语义一致
    expect(submitted.presetCategory).toBeUndefined();
    expect(submitted.meta?.apiFormat).toBe("anthropic");

    const parsed = JSON.parse(submitted.settingsConfig) as {
      auth?: Record<string, string>;
      config?: string;
    };
    expect(parsed.auth?.OPENAI_API_KEY).toBe("sk-secret-should-not-leak");
    expect(parsed.config).toContain(
      'base_url = "https://relay.example.com/api"',
    );
    expect(parsed.config).toContain('model = "claude-sonnet-4-5"');
    expect(parsed.config).toContain('wire_api = "responses"');
  });

  it("never renders the API key anywhere in the dialog", async () => {
    const user = userEvent.setup();
    renderCodexForm();

    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    await screen.findByText("Relay One");

    expect(document.body.textContent).not.toContain("sk-secret-should-not-leak");
  });
  it("imports into an existing Codex provider without changing its id or category", async () => {
    const user = userEvent.setup();
    setProviders("codex", {
      "codex-relay": {
        id: "codex-relay",
        name: "Old Codex Relay",
        settingsConfig: {
          auth: { OPENAI_API_KEY: "sk-old" },
          config: [
            'model_provider = "custom"',
            'model = "gpt-5.6-sol"',
            "",
            "[model_providers.custom]",
            'base_url = "https://old.example.com/v1"',
            'wire_api = "responses"',
          ].join("\n"),
        },
        category: "third_party",
        sortIndex: 0,
        createdAt: 1,
      },
    });
    const queryClient = createTestQueryClient();
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <ProviderForm
          appId="codex"
          providerId="codex-relay"
          submitLabel="保存"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          initialData={{
            name: "Old Codex Relay",
            notes: "旧备注",
            websiteUrl: "https://old.example.com",
            settingsConfig: {
              auth: { OPENAI_API_KEY: "sk-old" },
              config: [
                'model_provider = "custom"',
                'model = "gpt-5.6-sol"',
                "",
                "[model_providers.custom]",
                'base_url = "https://old.example.com/v1"',
                'wire_api = "responses"',
              ].join("\n"),
            },
            category: "third_party",
          }}
        />
      </QueryClientProvider>,
    );

    // 编辑模式的入口在表单顶部，不在预设区域内
    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    expect(screen.getAllByText(/覆盖/).length).toBeGreaterThan(0);
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    const name = await screen.findByLabelText("供应商名称");
    await waitFor(() => expect(name).toHaveValue("Relay One"));

    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0] as {
      name: string;
      notes?: string;
      settingsConfig: string;
      presetCategory?: string;
      meta?: { apiFormat?: string };
    };

    expect(submitted.name).toBe("Relay One");
    // 导入不得往提交载荷里塞分类；EditProviderDialog 用 ...provider 保留原分类
    expect(submitted.presetCategory).toBeUndefined();
    expect(submitted.meta?.apiFormat).toBe("anthropic");

    const parsed = JSON.parse(submitted.settingsConfig) as {
      auth?: Record<string, string>;
      config?: string;
    };
    expect(parsed.auth?.OPENAI_API_KEY).toBe("sk-secret-should-not-leak");
    expect(parsed.config).toContain('base_url = "https://relay.example.com/api"');
  });
  it("edit mode preserves providerKey, model catalog and extra env keys", async () => {
    const user = userEvent.setup();
    const existingConfig = [
      'model_provider = "custom"',
      'model = "gpt-5.6-sol"',
      'model_reasoning_effort = "high"',
      "",
      "[model_providers.custom]",
      'base_url = "https://old.example.com/v1"',
      'wire_api = "responses"',
    ].join("\n");
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProviderForm
          appId="codex"
          providerId="codex-relay"
          submitLabel="保存"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          initialData={{
            name: "Old Codex Relay",
            notes: "旧备注",
            websiteUrl: "https://old.example.com",
            settingsConfig: {
              auth: { OPENAI_API_KEY: "sk-old", auth_mode: "chatgpt" },
              config: existingConfig,
              modelCatalog: { models: [{ model: "gpt-5.6-sol" }] },
            },
            category: "third_party",
          }}
        />
      </QueryClientProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    // 模型目录与登录态键都不在导入范围内，必须原样存活
    await waitFor(() =>
      expect(screen.getByLabelText("供应商名称")).toHaveValue("Relay One"),
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const parsed = JSON.parse(
      (onSubmit.mock.calls[0][0] as { settingsConfig: string }).settingsConfig,
    );
    expect(parsed.modelCatalog).toEqual({ models: [{ model: "gpt-5.6-sol" }] });
    expect(parsed.auth.auth_mode).toBe("chatgpt");
    expect(parsed.auth.OPENAI_API_KEY).toBe("sk-secret-should-not-leak");
    expect(parsed.config).toContain('base_url = "https://relay.example.com/api"');
    // 来源有模型时覆盖目标模型；保留 TOML 其余行
    expect(parsed.config).toContain('model = "claude-sonnet-4-5"');
    expect(parsed.config).toContain('model_reasoning_effort = "high"');
    expect(parsed.config).toContain('wire_api = "responses"');
  });
  it("keeps the import when a preset was selected first in add mode", async () => {
    // 回归用例：先在 Codex 新建表单里选中一个非「自定义」预设，再执行导入。
    // 早先 resetPresetSelection() 把 selectedPresetId 拨回 "custom"，会触发
    // 一个监听 selectedPresetId 的 effect 用自定义模板重建 codex 扁平 state，
    // 把刚写入的导入值冲掉；而 Codex 保存路径只认扁平 state，于是导入值
    // 静默丢失（名称/备注/官网因为走 form.reset 反而活着）。
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProviderForm
          appId="codex"
          submitLabel="添加"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      </QueryClientProvider>,
    );

    // 预设按钮的可访问名称里混了图标的 <title>，按按钮文字点更稳
    await user.click(await screen.findByText("Kimi", { selector: "span" }));
    await waitFor(() =>
      expect(screen.getByLabelText("API 请求地址")).toHaveValue(
        "https://api.moonshot.cn/v1",
      ),
    );

    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    await waitFor(() =>
      expect(screen.getByLabelText("供应商名称")).toHaveValue("Relay One"),
    );
    expect(screen.getByLabelText("API 请求地址")).toHaveValue(
      "https://relay.example.com/api",
    );

    await user.click(screen.getByRole("button", { name: "添加" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0] as {
      name: string;
      notes?: string;
      websiteUrl?: string;
      settingsConfig: string;
    };
    const parsed = JSON.parse(submitted.settingsConfig) as {
      auth?: Record<string, string>;
      config?: string;
    };
    expect(submitted.name).toBe("Relay One");
    expect(submitted.notes).toBe("主力通道");
    expect(submitted.websiteUrl).toBe("https://relay.example.com");
    expect(parsed.auth?.OPENAI_API_KEY).toBe("sk-secret-should-not-leak");
    expect(parsed.config).toContain('base_url = "https://relay.example.com/api"');
    expect(parsed.config).toContain('model = "claude-sonnet-4-5"');
    expect(parsed.config).toContain('wire_api = "responses"');
  });
  it("claude add mode keeps the import after a preset was selected first", async () => {
    // 同类回归：claude 新建表单选中预设后再导入。claude 没有监听
    // selectedPresetId 的 state 重建 effect（useCommonConfigSnippet 只做片段
    // 合并、不清空），所以导入值必须完整到达保存载荷。
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    setProviders("codex", {
      "codex-relay": {
        id: "codex-relay",
        name: "Relay Two",
        settingsConfig: {
          auth: { OPENAI_API_KEY: "sk-secret-should-not-leak" },
          config: [
            'model_provider = "custom"',
            'model = "gpt-5.6-sol"',
            "",
            "[model_providers.custom]",
            'base_url = "https://relay.example.com/v1"',
            'wire_api = "responses"',
          ].join("\n"),
        },
        meta: { apiFormat: "openai_responses" },
        sortIndex: 0,
        createdAt: 1,
      },
    });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProviderForm
          appId="claude"
          submitLabel="添加"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      </QueryClientProvider>,
    );

    await user.click(await screen.findByText("Kimi", { selector: "span" }));
    // 预设已生效（名称被预填）作为后续导入的前置状态
    await waitFor(() =>
      expect(screen.getByLabelText("供应商名称")).not.toHaveValue(""),
    );

    await user.click(
      await screen.findByRole("button", { name: "从 Codex 导入" }),
    );
    await user.click(await screen.findByText("Relay Two"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    await waitFor(() =>
      expect(screen.getByLabelText("供应商名称")).toHaveValue("Relay Two"),
    );
    expect(screen.getByLabelText("API Key")).toHaveValue(
      "sk-secret-should-not-leak",
    );

    await user.click(screen.getByRole("button", { name: "添加" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0] as {
      name: string;
      settingsConfig: string;
      meta?: { apiFormat?: string };
    };
    const parsed = JSON.parse(submitted.settingsConfig) as {
      env?: Record<string, string>;
    };
    expect(submitted.name).toBe("Relay Two");
    expect(parsed.env?.ANTHROPIC_AUTH_TOKEN).toBe("sk-secret-should-not-leak");
    expect(parsed.env?.ANTHROPIC_BASE_URL).toBe("https://relay.example.com/v1");
    expect(parsed.env?.ANTHROPIC_MODEL).toBe("gpt-5.6-sol");
    // 来源（codex）声明的是 openai_responses，claude 支持该取值
    expect(submitted.meta?.apiFormat).toBe("openai_responses");
  });
  it("gemini add mode keeps the import after a preset was selected first", async () => {
    // gemini 没有监听 selectedPresetId 的 state 重建 effect，但第三轮验收只
    // 追过代码、没有实证；这里补上端到端观察。
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ProviderForm
          appId="gemini"
          submitLabel="添加"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      </QueryClientProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "从 Claude 导入" }),
    );
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    await waitFor(() =>
      expect(screen.getByLabelText("供应商名称")).toHaveValue("Relay One"),
    );
    await user.click(screen.getByRole("button", { name: "添加" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submitted = onSubmit.mock.calls[0][0] as {
      name: string;
      settingsConfig: string;
    };
    const parsed = JSON.parse(submitted.settingsConfig) as {
      env?: Record<string, string>;
    };
    expect(submitted.name).toBe("Relay One");
    expect(parsed.env?.GOOGLE_GEMINI_BASE_URL).toBe(
      "https://relay.example.com/api",
    );
    expect(parsed.env?.GEMINI_API_KEY).toBe("sk-secret-should-not-leak");
    expect(parsed.env?.GEMINI_MODEL).toBe("claude-sonnet-4-5");
  });
});
