import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Provider } from "@/types";
import { ProviderImportEntry } from "@/components/providers/forms/ProviderImportEntry";
import type { ProviderImportSource } from "@/components/providers/forms/hooks/useProviderImportSources";

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <span data-testid="provider-icon" />,
}));

const claudeProvider: Provider = {
  id: "claude-2",
  name: "Relay One",
  notes: "主力通道",
  websiteUrl: "https://relay.example.com",
  settingsConfig: {
    env: {
      ANTHROPIC_BASE_URL: "https://relay.example.com/api",
      ANTHROPIC_AUTH_TOKEN: "sk-secret-should-not-render",
      ANTHROPIC_MODEL: "claude-sonnet-4-5",
    },
  },
  meta: { apiFormat: "anthropic" },
};

const codexProvider: Provider = {
  id: "codex-2",
  name: "Relay Two",
  settingsConfig: {
    auth: { OPENAI_API_KEY: "sk-secret-should-not-render" },
    config: [
      'model_provider = "custom"',
      'model = "gpt-5.6-sol"',
      "",
      "[model_providers.custom]",
      'base_url = "https://relay.example.com/v1"',
    ].join("\n"),
  },
};

const sources: ProviderImportSource[] = [
  { appId: "claude", providers: [claudeProvider] },
  { appId: "codex", providers: [codexProvider] },
];

const renderEntry = (overrides: Partial<{
  appId: Parameters<typeof ProviderImportEntry>[0]["appId"];
  isEditMode: boolean;
  onImport: (appId: string, provider: Provider) => void;
}> = {}) => {
  const onImport = overrides.onImport ?? vi.fn();
  render(
    <ProviderImportEntry
      appId={overrides.appId ?? "codex"}
      sources={sources}
      isEditMode={overrides.isEditMode ?? false}
      onImport={onImport}
    />,
  );
  return { onImport };
};

describe("ProviderImportEntry", () => {
  it("renders one button per source app", () => {
    renderEntry();
    expect(screen.getByRole("button", { name: /Claude/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Codex/ })).toBeInTheDocument();
  });

  it("renders nothing when there is no source app", () => {
    const { container } = render(
      <ProviderImportEntry
        appId="codex"
        sources={[]}
        isEditMode={false}
        onImport={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists the source providers with name, note and request URL", async () => {
    const user = userEvent.setup();
    renderEntry();

    await user.click(screen.getByRole("button", { name: /Claude/ }));

    expect(await screen.findByText("Relay One")).toBeInTheDocument();
    expect(screen.getByText("主力通道")).toBeInTheDocument();
    expect(
      screen.getByText("https://relay.example.com/api"),
    ).toBeInTheDocument();
    // 只展示来源应用自己的供应商，不把其他来源的地址带进来
    expect(
      screen.queryByText("https://relay.example.com/v1"),
    ).not.toBeInTheDocument();
  });

  it("shows a placeholder for providers without a note", async () => {
    const user = userEvent.setup();
    renderEntry();

    await user.click(screen.getByRole("button", { name: /Codex/ }));

    expect(await screen.findByText("Relay Two")).toBeInTheDocument();
    expect(screen.getByText("无备注")).toBeInTheDocument();
  });

  it("never renders the API key", async () => {
    const user = userEvent.setup();
    renderEntry();

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await screen.findByText("Relay One");
    await user.click(screen.getByText("Relay One"));

    expect(screen.queryByText(/sk-secret/)).not.toBeInTheDocument();
  });

  it("closing the dialog without confirming does not import", async () => {
    const user = userEvent.setup();
    const { onImport } = renderEntry();

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await screen.findByText("Relay One");
    await user.click(screen.getByRole("button", { name: "common.cancel" }));

    await waitFor(() =>
      expect(screen.queryByText("Relay One")).not.toBeInTheDocument(),
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  it("confirming imports the selected provider from the right app", async () => {
    const user = userEvent.setup();
    const { onImport } = renderEntry({ appId: "codex" });

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await user.click(await screen.findByText("Relay One"));
    await user.click(screen.getByRole("button", { name: "导入" }));

    await waitFor(() =>
      expect(onImport).toHaveBeenCalledWith("claude", claudeProvider),
    );
  });

  it("does not warn about overwriting in add mode", async () => {
    const user = userEvent.setup();
    renderEntry({ isEditMode: false });

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await screen.findByText("Relay One");

    expect(screen.queryByText(/覆盖/)).not.toBeInTheDocument();
  });

  it("warns about overwriting in edit mode", async () => {
    const user = userEvent.setup();
    renderEntry({ isEditMode: true });

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await screen.findByText("Relay One");

    expect(screen.getByText(/覆盖/)).toBeInTheDocument();
  });

  it("summarises only the fields that actually have a value", async () => {
    const user = userEvent.setup();
    renderEntry({ appId: "codex" });

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await user.click(await screen.findByText("Relay One"));

    const summary = screen.getByText("本次将写入").parentElement;
    expect(summary?.textContent).toContain("供应商名称");
    expect(summary?.textContent).toContain("备注");
    expect(summary?.textContent).toContain("官网链接");
    expect(summary?.textContent).toContain("API Key");
    expect(summary?.textContent).toContain("请求地址");
    expect(summary?.textContent).toContain("默认模型");
    expect(summary?.textContent).toContain("上游格式：anthropic");
  });

  it("omits the default model from the summary when the target has no such field", async () => {
    const user = userEvent.setup();
    renderEntry({ appId: "hermes" });

    await user.click(screen.getByRole("button", { name: /Claude/ }));
    await user.click(await screen.findByText("Relay One"));

    const summary = screen.getByText("本次将写入").parentElement;
    expect(summary?.textContent).not.toContain("默认模型");
    expect(summary?.textContent).toContain("当前应用不保存上游格式");
  });

  it("keeps the summary honest when the source has no upstream format", async () => {
    const user = userEvent.setup();
    renderEntry({ appId: "codex" });

    await user.click(screen.getByRole("button", { name: /Codex/ }));
    await user.click(await screen.findByText("Relay Two"));

    const summary = screen.getByText("本次将写入").parentElement;
    expect(summary?.textContent).not.toContain("备注");
    expect(summary?.textContent).toContain("来源供应商未声明上游格式");
  });
});
