import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaudeFormFields } from "@/components/providers/forms/ClaudeFormFields";
import { Form } from "@/components/ui/form";

const copilotApiMock = vi.hoisted(() => ({
  copilotGetModels: vi.fn(),
  copilotGetModelsForAccount: vi.fn(),
}));

const modelFetchApiMock = vi.hoisted(() => ({
  fetchCodexOauthModels: vi.fn(),
  fetchModelsForConfig: vi.fn(),
  showFetchModelsError: vi.fn(),
}));

vi.mock("@/lib/api/copilot", () => ({
  copilotGetModels: copilotApiMock.copilotGetModels,
  copilotGetModelsForAccount: copilotApiMock.copilotGetModelsForAccount,
}));

vi.mock("@/lib/api/model-fetch", () => ({
  fetchCodexOauthModels: modelFetchApiMock.fetchCodexOauthModels,
  fetchModelsForConfig: modelFetchApiMock.fetchModelsForConfig,
  showFetchModelsError: modelFetchApiMock.showFetchModelsError,
}));

vi.mock("@/components/providers/forms/CopilotAuthSection", () => ({
  CopilotAuthSection: () => <div data-testid="copilot-auth-section" />,
}));

vi.mock("@/components/providers/forms/CodexOAuthSection", () => ({
  CodexOAuthSection: () => <div data-testid="codex-oauth-section" />,
}));

type ClaudeFormFieldsProps = ComponentProps<typeof ClaudeFormFields>;

const FormShell = ({ children }: PropsWithChildren) => {
  const form = useForm();

  return <Form {...form}>{children}</Form>;
};

const renderCopilotForm = (overrides: Partial<ClaudeFormFieldsProps> = {}) => {
  const props: ClaudeFormFieldsProps = {
    shouldShowApiKey: false,
    apiKey: "",
    onApiKeyChange: vi.fn(),
    category: "official",
    shouldShowApiKeyLink: false,
    websiteUrl: "",
    isCopilotPreset: true,
    usesOAuth: true,
    isCopilotAuthenticated: true,
    selectedGitHubAccountId: "gh-1",
    onGitHubAccountSelect: vi.fn(),
    isCodexOauthPreset: false,
    isCodexOauthAuthenticated: false,
    selectedCodexAccountId: null,
    onCodexAccountSelect: vi.fn(),
    codexFastMode: false,
    onCodexFastModeChange: vi.fn(),
    templateValueEntries: [],
    templateValues: {},
    templatePresetName: "",
    onTemplateValueChange: vi.fn(),
    shouldShowSpeedTest: false,
    baseUrl: "",
    onBaseUrlChange: vi.fn(),
    isEndpointModalOpen: false,
    onEndpointModalToggle: vi.fn(),
    onCustomEndpointsChange: vi.fn(),
    autoSelect: false,
    onAutoSelectChange: vi.fn(),
    showEndpointTools: true,
    shouldShowModelSelector: true,
    claudeModel: "",
    defaultHaikuModel: "",
    defaultHaikuModelName: "",
    defaultSonnetModel: "claude-sonnet",
    defaultSonnetModelName: "Claude Sonnet",
    defaultOpusModel: "",
    defaultOpusModelName: "",
    defaultFableModel: "",
    defaultFableModelName: "",
    subagentModel: "",
    onModelChange: vi.fn(),
    speedTestEndpoints: [],
    apiFormat: "anthropic",
    onApiFormatChange: vi.fn(),
    apiKeyField: "ANTHROPIC_AUTH_TOKEN",
    onApiKeyFieldChange: vi.fn(),
    isFullUrl: false,
    onFullUrlChange: vi.fn(),
    customUserAgent: "",
    onCustomUserAgentChange: vi.fn(),
    localProxyHeadersOverride: "",
    onLocalProxyHeadersOverrideChange: vi.fn(),
    localProxyBodyOverride: "",
    onLocalProxyBodyOverrideChange: vi.fn(),
    ...overrides,
  };

  return render(
    <FormShell>
      <ClaudeFormFields {...props} />
    </FormShell>,
  );
};

const renderCodexOauthForm = (overrides: Partial<ClaudeFormFieldsProps> = {}) =>
  renderCopilotForm({
    isCopilotPreset: false,
    isCopilotAuthenticated: false,
    selectedGitHubAccountId: null,
    isCodexOauthPreset: true,
    isCodexOauthAuthenticated: true,
    selectedCodexAccountId: "chatgpt-1",
    ...overrides,
  });

describe("ClaudeFormFields", () => {
  beforeEach(() => {
    copilotApiMock.copilotGetModels.mockResolvedValue([]);
    copilotApiMock.copilotGetModelsForAccount.mockResolvedValue([]);
    modelFetchApiMock.fetchCodexOauthModels.mockResolvedValue([]);
    modelFetchApiMock.fetchModelsForConfig.mockResolvedValue([]);
  });

  it("不会在 Copilot 表单打开时自动获取模型列表", () => {
    renderCopilotForm();

    expect(copilotApiMock.copilotGetModels).not.toHaveBeenCalled();
    expect(copilotApiMock.copilotGetModelsForAccount).not.toHaveBeenCalled();
  });

  it("点击获取模型列表后才请求当前 Copilot 账号的模型", async () => {
    renderCopilotForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "providerForm.fetchModels",
      }),
    );

    await waitFor(() => {
      expect(copilotApiMock.copilotGetModelsForAccount).toHaveBeenCalledWith(
        "gh-1",
      );
    });
    expect(copilotApiMock.copilotGetModels).not.toHaveBeenCalled();
  });

  it("不会在 Codex OAuth 表单打开时自动获取模型列表", () => {
    renderCodexOauthForm();

    expect(modelFetchApiMock.fetchCodexOauthModels).not.toHaveBeenCalled();
  });

  it("点击获取模型列表后才请求当前 Codex OAuth 账号的模型", async () => {
    renderCodexOauthForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "providerForm.fetchModels",
      }),
    );

    await waitFor(() => {
      expect(modelFetchApiMock.fetchCodexOauthModels).toHaveBeenCalledWith(
        "chatgpt-1",
      );
    });
  });

  it("一键设置会同时写入 Subagent 模型", () => {
    const onModelChange = vi.fn();
    renderCopilotForm({
      claudeModel: "shared-model[1M]",
      defaultSonnetModel: "",
      defaultSonnetModelName: "",
      onModelChange,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "一键设置",
      }),
    );

    expect(onModelChange).toHaveBeenCalledWith(
      "CLAUDE_CODE_SUBAGENT_MODEL",
      "shared-model[1M]",
    );
  });

  it("兜底模型区块渲染在高级选项之外，无需展开即可编辑", () => {
    const onModelChange = vi.fn();
    renderCopilotForm({
      claudeModel: "fallback-model",
      defaultSonnetModel: "",
      defaultSonnetModelName: "",
      onModelChange,
    });

    // 折叠状态下的高级选项内容不应渲染（Radix Collapsible 关闭时卸载内容）
    expect(screen.queryByText("providerForm.modelMappingLabel")).toBeNull();

    // 兜底模型输入框直接可达（Copilot 分支的输入框无 id，按值定位）
    expect(screen.getByDisplayValue("fallback-model")).toBeInTheDocument();

    // 一键设置、获取模型列表按钮均在折叠区外
    expect(
      screen.getByRole("button", { name: "一键设置" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "providerForm.fetchModels" }),
    ).toBeInTheDocument();
  });

  it("仅兜底模型有值时高级选项不自动展开", () => {
    renderCopilotForm({
      claudeModel: "fallback-model",
      defaultSonnetModel: "",
      defaultSonnetModelName: "",
    });

    // 高级选项处于折叠状态：折叠区内内容未渲染
    expect(screen.queryByText("providerForm.authField")).toBeNull();
  });

  it("角色模型与兜底模型一致（一键设置后的状态）时高级选项不自动展开", () => {
    renderCopilotForm({
      claudeModel: "shared-model[1M]",
      defaultHaikuModel: "shared-model",
      defaultHaikuModelName: "shared-model",
      defaultSonnetModel: "shared-model[1M]",
      defaultSonnetModelName: "shared-model",
      defaultOpusModel: "shared-model[1M]",
      defaultOpusModelName: "shared-model",
      defaultFableModel: "shared-model[1M]",
      defaultFableModelName: "shared-model",
      subagentModel: "shared-model[1M]",
    });

    // 一键设置产出的是均匀映射，不算高级配置：高级选项保持折叠
    expect(
      screen.getByRole("button", { name: /advancedOptionsToggle|高级选项/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("任一角色模型与兜底模型不同时高级选项自动展开", () => {
    renderCopilotForm({
      claudeModel: "fallback-model",
      defaultHaikuModel: "fallback-model",
      defaultSonnetModel: "custom-sonnet",
      defaultOpusModel: "fallback-model",
      defaultFableModel: "fallback-model",
      subagentModel: "fallback-model",
    });

    // 存在差异化映射：高级选项自动展开
    expect(
      screen.getByRole("button", { name: /advancedOptionsToggle|高级选项/ }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("一键设置把兜底模型写入全部角色，Haiku 剥离 1M 标记", () => {
    const onModelChange = vi.fn();
    renderCopilotForm({
      claudeModel: "shared-model[1M]",
      defaultSonnetModel: "",
      defaultSonnetModelName: "",
      onModelChange,
    });

    fireEvent.click(screen.getByRole("button", { name: "一键设置" }));

    // 兜底模型优先取值，写入各角色；ANTHROPIC_MODEL 本身不在写入范围（现状语义）
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "shared-model[1M]",
    );
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME",
      "shared-model",
    );
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_OPUS_MODEL",
      "shared-model[1M]",
    );
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      "shared-model",
    );
    expect(onModelChange).toHaveBeenCalledWith(
      "CLAUDE_CODE_SUBAGENT_MODEL",
      "shared-model[1M]",
    );
  });

  it("兜底模型勾选 1M 后，表头一键勾选呈半选并写入全部角色", () => {
    const onModelChange = vi.fn();
    renderCopilotForm({
      claudeModel: "fallback-model[1M]",
      defaultSonnetModel: "sonnet-model",
      defaultSonnetModelName: "",
      onModelChange,
    });

    // 兜底模型带 [1M]：输入框值展示剥离后的 base
    expect(screen.getByDisplayValue("fallback-model")).toBeInTheDocument();

    // 表头 1M 一键勾选处于半选状态（仅兜底带标记）
    const toggleAll = screen.getByRole("checkbox", {
      name: "一键全选 1M",
    });
    expect(toggleAll).toHaveProperty("indeterminate", true);

    fireEvent.click(toggleAll);

    // 全选切换：所有支持 1M 的角色与兜底模型都加 [1M]
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "sonnet-model[1M]",
    );
    expect(onModelChange).toHaveBeenCalledWith(
      "ANTHROPIC_MODEL",
      "fallback-model[1M]",
    );
    expect(onModelChange).not.toHaveBeenCalledWith(
      "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      expect.stringContaining("[1M]"),
    );
  });
});
