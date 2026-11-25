import type { ReactElement } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CopilotProviderForm } from "@/components/providers/forms/CopilotProviderForm";
import { WorkBuddyProviderForm } from "@/components/providers/forms/WorkBuddyProviderForm";
import { KimiProviderForm } from "@/components/providers/forms/KimiProviderForm";
import { setProviders } from "../msw/state";
import { renderWithQueryClient } from "../utils/testQueryClient";

vi.mock("@/config/forkBuild", () => ({ IS_FORK_BUILD: true }));

vi.mock("@/config/copilotProviderPresets", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/config/copilotProviderPresets")>();
  const disallowed = actual.copilotProviderPresets.find(
    (preset) => preset.name === "88API",
  )!;
  const hidden = actual.copilotProviderPresets.find(
    (preset) => preset.name === "LM Studio",
  )!;
  const visible = actual.copilotProviderPresets.find(
    (preset) => preset.name === "Ollama",
  )!;
  return {
    ...actual,
    copilotProviderPresets: [
      { ...disallowed, family: undefined, providerKey: "cc-switch-disallowed" },
      {
        ...hidden,
        family: undefined,
        hidden: true,
        providerKey: "cc-switch-hidden",
      },
      { ...visible, family: undefined, providerKey: "cc-switch-visible" },
    ],
  };
});

vi.mock("@/config/workbuddyProviderPresets", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/config/workbuddyProviderPresets")>();
  const disallowed = actual.workbuddyProviderPresets.find(
    (preset) => preset.name === "OpenCode Go",
  )!;
  const hidden = actual.workbuddyProviderPresets.find(
    (preset) => preset.name === "LM Studio",
  )!;
  const visible = actual.workbuddyProviderPresets.find(
    (preset) => preset.name === "Ollama",
  )!;
  return {
    ...actual,
    workbuddyProviderPresets: [
      { ...disallowed, family: undefined, providerKey: "cc-switch-disallowed" },
      {
        ...hidden,
        family: undefined,
        hidden: true,
        providerKey: "cc-switch-hidden",
      },
      { ...visible, family: undefined, providerKey: "cc-switch-visible" },
    ],
  };
});

vi.mock("@/config/kimiProviderPresets", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/config/kimiProviderPresets")>();
  const disallowed = actual.kimiProviderPresets.find(
    (preset) => preset.name === "88API",
  )!;
  const hidden = actual.kimiProviderPresets.find(
    (preset) => preset.name === "Kimi",
  )!;
  const visible = actual.kimiProviderPresets.find(
    (preset) => preset.name === "Kimi Global",
  )!;
  return {
    ...actual,
    kimiProviderPresets: [
      { ...disallowed, family: undefined, providerKey: "cc-switch-disallowed" },
      {
        ...hidden,
        family: undefined,
        hidden: true,
        providerKey: "cc-switch-hidden",
      },
      { ...visible, family: undefined, providerKey: "cc-switch-visible" },
    ],
  };
});

vi.mock("@/components/JsonEditor", () => ({
  default: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/providers/forms/CopilotAuthSection", () => ({
  CopilotAuthSection: () => null,
}));

const renderForm = (form: ReactElement) => renderWithQueryClient(form);

beforeAll(() => {
  Element.prototype.scrollIntoView ??= vi.fn();
});

beforeEach(() => {
  setProviders("copilot", {});
  setProviders("workbuddy", {});
  setProviders("kimi", {});
});

describe("fork preset filtering", () => {
  it("keeps only visible Copilot local presets without renumbering their catalog ids", async () => {
    const user = userEvent.setup();
    renderForm(
      <CopilotProviderForm
        appId="copilot"
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "88API" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "LM Studio" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ollama" }));
    expect(screen.getByLabelText("opencode.providerKey")).toHaveValue(
      "cc-switch-visible",
    );
  });

  it("keeps only visible WorkBuddy local presets without renumbering their catalog ids", async () => {
    const user = userEvent.setup();
    renderForm(
      <WorkBuddyProviderForm
        appId="workbuddy"
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "OpenCode Go" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "LM Studio" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ollama" }));
    expect(screen.getByLabelText("opencode.providerKey")).toHaveValue(
      "cc-switch-visible",
    );
  });

  it("keeps only visible Kimi official presets without renumbering their catalog ids", async () => {
    const user = userEvent.setup();
    renderForm(
      <KimiProviderForm
        appId="kimi"
        submitLabel="Save"
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "88API" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kimi" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kimi Global" }));
    expect(screen.getByLabelText("opencode.providerKey")).toHaveValue(
      "cc-switch-visible",
    );
  });
});
