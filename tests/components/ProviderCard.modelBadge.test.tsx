import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProviderCard } from "@/components/providers/ProviderCard";
import type { Provider } from "@/types";
import type { AppId } from "@/lib/api";
import { createTestQueryClient } from "../utils/testQueryClient";

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => null,
}));

vi.mock("@/components/UsageFooter", () => ({ default: () => null }));
vi.mock("@/components/SubscriptionQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/CopilotQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/CodexOauthQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/XaiOauthQuotaFooter", () => ({
  default: () => null,
}));

// 用 open 透出弹窗是否打开，避免依赖真实 Dialog 的 portal 行为
vi.mock(
  "@/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog",
  () => ({
    ModelQuickSwitchDialog: ({ open }: { open: boolean }) =>
      open ? <div data-testid="model-quick-switch-dialog" /> : null,
  }),
);

vi.mock("@/lib/query/failover", () => ({
  useProviderHealth: () => ({ data: undefined }),
}));

vi.mock("@/lib/query/queries", () => ({
  useUsageQuery: () => ({ data: undefined }),
}));

function renderCard(
  provider: Provider,
  options: { appId?: AppId; onOpenWebsite?: (url: string) => void } = {},
) {
  const onOpenWebsite = options.onOpenWebsite ?? vi.fn();
  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ProviderCard
        provider={provider}
        appId={options.appId ?? "claude"}
        presentation={{
          chips: [],
          buttons: [],
          showHealth: false,
          dim: false,
          tone: "neutral",
          deleteDisabledReason: undefined,
        }}
        isCurrent={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfigureUsage={vi.fn()}
        onOpenWebsite={onOpenWebsite}
        onDuplicate={vi.fn()}
      />
    </QueryClientProvider>,
  );
  return { onOpenWebsite, ...view };
}

const claudeProvider: Provider = {
  id: "claude-1",
  name: "Kimi",
  settingsConfig: {
    env: {
      ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-opus",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-sonnet",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-haiku",
    },
  },
  websiteUrl: "https://kimi.moonshot.cn",
};

const claudeOfficial: Provider = {
  id: "claude-official",
  name: "Claude Official",
  settingsConfig: { env: {} },
  category: "official",
};

const codexProvider: Provider = {
  id: "codex-1",
  name: "Codex Third Party",
  settingsConfig: { config: 'model = "gpt-6-astra"\n' },
};

const geminiProvider: Provider = {
  id: "gemini-1",
  name: "PackyCode",
  settingsConfig: { env: { GEMINI_MODEL: "gemini-3.6-flash" } },
};

const openclawProvider: Provider = {
  id: "openclaw-1",
  name: "OpenClaw",
  settingsConfig: { env: { OPENCLAW_MODEL: "some-model" } },
};

const quickSwitchLabel = (name: string) => `${name} 的模型快捷切换`;

function getBadge() {
  return screen.getByRole("button", {
    name: /的模型快捷切换$/,
  });
}

describe("ProviderCard model badge as quick-switch entry", () => {
  it("renders the current model as a clickable button", async () => {
    const user = userEvent.setup();
    renderCard(claudeProvider);

    const badge = getBadge();
    // label 取第一个角色模型（Opus/Sonnet/Haiku 顺序）
    expect(badge).toHaveTextContent("kimi-opus");
    expect(badge).toHaveAttribute("type", "button");
    expect(screen.queryByTestId("model-quick-switch-dialog")).toBeNull();

    await user.click(badge);
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });

  it("keeps the full model explanation as the hover title", () => {
    renderCard(claudeProvider);

    expect(getBadge()).toHaveAttribute(
      "title",
      "Opus: kimi-opus / Sonnet: kimi-sonnet / Haiku: kimi-haiku",
    );
  });

  it("shows the 1M marker for claude only when the primary model carries [1M]", () => {
    const withOneM = renderCard(claudeProviderWithOneM());
    expect(within(getBadge()).getByTitle("1M 已开启")).toHaveTextContent("1M");
    withOneM.unmount();

    const plain = renderCard(claudeProviderWithoutOneM());
    expect(within(getBadge()).queryByTitle("1M 已开启")).toBeNull();
    plain.unmount();

    renderCard(codexProvider, { appId: "codex" });
    expect(within(getBadge()).queryByTitle("1M 已开启")).toBeNull();
    expect(getBadge()).toHaveTextContent("gpt-6-astra");
  });

  it("opens the dialog from the keyboard", async () => {
    const user = userEvent.setup();
    renderCard(claudeProvider);

    getBadge().focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });

  it("opens the dialog with the space key too", async () => {
    const user = userEvent.setup();
    renderCard(claudeProvider);

    getBadge().focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });

  it("renders a placeholder entry for model-capable apps with no model", async () => {
    const user = userEvent.setup();
    renderCard(claudeOfficial);

    const badge = getBadge();
    expect(badge).toHaveTextContent("未设置模型");
    expect(within(badge).queryByTitle("1M 已开启")).toBeNull();
    expect(badge).toHaveAttribute("title", quickSwitchLabel("Claude Official"));

    await user.click(badge);
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });

  it("renders a placeholder for codex providers with an empty TOML config", () => {
    renderCard(
      { id: "codex-official", name: "OpenAI Official", settingsConfig: { config: "" } },
      { appId: "codex" },
    );

    expect(getBadge()).toHaveTextContent("未设置模型");
  });

  it("does not render a badge or placeholder for out-of-scope apps", () => {
    renderCard(openclawProvider, { appId: "openclaw" });

    expect(
      screen.queryByRole("button", { name: /的模型快捷切换$/ }),
    ).toBeNull();
    expect(screen.queryByText("未设置模型")).toBeNull();
    expect(screen.queryByTestId("model-quick-switch-dialog")).toBeNull();
  });

  it("does not open the provider website when the badge is clicked", async () => {
    const user = userEvent.setup();
    const { onOpenWebsite } = renderCard(claudeProvider);

    await user.click(getBadge());

    expect(onOpenWebsite).not.toHaveBeenCalled();
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });

  it("keeps the gemini model readable and clickable", async () => {
    const user = userEvent.setup();
    renderCard(geminiProvider, { appId: "gemini" });

    const badge = getBadge();
    expect(badge).toHaveTextContent("gemini-3.6-flash");
    expect(badge).toHaveAttribute("title", "gemini-3.6-flash");

    await user.click(badge);
    expect(screen.getByTestId("model-quick-switch-dialog")).toBeInTheDocument();
  });
});

// 三角色 + 主对话模型带 [1M]
function claudeProviderWithOneM(): Provider {
  return {
    ...claudeProvider,
    id: "claude-1m",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-opus",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-sonnet[1M]",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-haiku",
      },
    },
  };
}

// 同一套角色模型但不带 [1M]
function claudeProviderWithoutOneM(): Provider {
  return {
    ...claudeProvider,
    id: "claude-no-1m",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "kimi-opus",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "kimi-sonnet",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "kimi-haiku",
      },
    },
  };
}
