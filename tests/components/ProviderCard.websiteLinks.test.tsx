import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProviderCard } from "@/components/providers/ProviderCard";
import type { Provider } from "@/types";
import { createTestQueryClient } from "../utils/testQueryClient";

vi.mock("@/components/providers/ProviderActions", () => ({
  ProviderActions: () => null,
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => null,
}));

vi.mock("@/components/UsageFooter", () => ({ default: () => null }));
vi.mock("@/components/SubscriptionQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/CopilotQuotaFooter", () => ({ default: () => null }));
vi.mock("@/components/CodexOauthQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/XaiOauthQuotaFooter", () => ({ default: () => null }));
vi.mock("@/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog", () => ({
  ModelQuickSwitchDialog: () => null,
}));

vi.mock("@/lib/query/failover", () => ({
  useProviderHealth: () => ({ data: undefined }),
}));

vi.mock("@/lib/query/queries", () => ({
  useUsageQuery: () => ({ data: undefined }),
}));

function renderCard(
  provider: Provider,
  options: { onOpenWebsite?: (url: string) => void } = {},
) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ProviderCard
        provider={provider}
        appId="claude"
        isCurrent={false}
        isProxyRunning={false}
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfigureUsage={vi.fn()}
        onOpenWebsite={options.onOpenWebsite ?? vi.fn()}
        onDuplicate={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

const dualLinkProvider: Provider = {
  id: "dual-links",
  name: "Dual Links",
  settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.example.com" } },
  websiteUrl: "https://first.example.com",
  websiteUrl2: "https://second.example.com",
};

describe("ProviderCard website links", () => {
  it("renders two links horizontally separated by two visible spaces", () => {
    renderCard(dualLinkProvider);

    const row = screen.getByTestId("website-links");
    expect(row.textContent).toBe(
      "https://first.example.com  https://second.example.com",
    );

    const buttons = row.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("https://first.example.com");
    expect(buttons[1]).toHaveTextContent("https://second.example.com");
    // 长度截断保护仍在（title 提示完整 URL）
    expect(buttons[0]).toHaveAttribute("title", "https://first.example.com");
    expect(buttons[1]).toHaveAttribute("title", "https://second.example.com");
  });

  it("opens each link with its own URL via onOpenWebsite", async () => {
    const user = userEvent.setup();
    const onOpenWebsite = vi.fn();
    renderCard(dualLinkProvider, { onOpenWebsite });

    await user.click(screen.getByText("https://second.example.com"));
    expect(onOpenWebsite).toHaveBeenCalledWith("https://second.example.com");
    expect(onOpenWebsite).not.toHaveBeenCalledWith(
      "https://first.example.com",
    );

    await user.click(screen.getByText("https://first.example.com"));
    expect(onOpenWebsite).toHaveBeenCalledWith("https://first.example.com");
    expect(onOpenWebsite).toHaveBeenCalledTimes(2);
  });

  it("renders a single link when both fields hold the same URL", () => {
    renderCard({
      ...dualLinkProvider,
      websiteUrl2: "https://first.example.com",
    });

    const row = screen.getByTestId("website-links");
    expect(row.textContent).toBe("https://first.example.com");
    expect(row.querySelectorAll("button")).toHaveLength(1);
  });

  it("renders only the configured link when just one exists", () => {
    const { unmount } = renderCard({
      ...dualLinkProvider,
      websiteUrl: undefined,
    });

    const row = screen.getByTestId("website-links");
    expect(row.textContent).toBe("https://second.example.com");
    expect(row.querySelectorAll("button")).toHaveLength(1);

    unmount();

    renderCard({
      ...dualLinkProvider,
      websiteUrl2: undefined,
    });
    expect(screen.getByTestId("website-links").textContent).toBe(
      "https://first.example.com",
    );
  });

  it("keeps notes precedence over website links", () => {
    renderCard({
      ...dualLinkProvider,
      notes: "Primary work provider",
    });

    expect(screen.getByText("Primary work provider")).toBeInTheDocument();
    expect(screen.queryByTestId("website-links")).not.toBeInTheDocument();
    expect(
      screen.queryByText("https://first.example.com"),
    ).not.toBeInTheDocument();
  });

  it("falls back to the API base URL when no website links exist", async () => {
    const user = userEvent.setup();
    const onOpenWebsite = vi.fn();
    renderCard(
      {
        ...dualLinkProvider,
        websiteUrl: undefined,
        websiteUrl2: undefined,
      },
      { onOpenWebsite },
    );

    expect(screen.queryByTestId("website-links")).not.toBeInTheDocument();
    const baseButton = screen.getByText("https://api.example.com");
    expect(baseButton).toBeInTheDocument();

    await user.click(baseButton);
    expect(onOpenWebsite).toHaveBeenCalledWith("https://api.example.com");
  });
});
