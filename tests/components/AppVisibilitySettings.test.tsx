import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppVisibilitySettings } from "@/components/settings/AppVisibilitySettings";
import { DEFAULT_VISIBLE_SIDEBAR_PANELS } from "@/config/appConfig";
import type { SettingsFormState } from "@/hooks/useSettings";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const settings = {
  visibleSidebarPanels: { ...DEFAULT_VISIBLE_SIDEBAR_PANELS },
} as SettingsFormState;

describe("AppVisibilitySettings sidebar panels", () => {
  it("lists the batch test toggle and writes batchTest when clicked", () => {
    const onChange = vi.fn();
    render(<AppVisibilitySettings settings={settings} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.sidebarPanels.batchTest" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      visibleSidebarPanels: {
        ...DEFAULT_VISIBLE_SIDEBAR_PANELS,
        batchTest: false,
      },
    });
  });
});
