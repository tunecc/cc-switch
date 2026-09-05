import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableModelMultiPicker } from "@/components/providers/forms/shared/SearchableModelMultiPicker";
import type { FetchedModel } from "@/lib/api/model-fetch";

// 测试环境 i18n 资源为空，t() 落到 defaultValue——文案断言用中文默认值。
// cmdk 在 jsdom 中会调用 scrollIntoView（jsdom 未实现），先 mock 掉。
Element.prototype.scrollIntoView = vi.fn();
// 列表顺序：vendor 字典序分组（anthropic < openai），组内按 id 字典序。
const MODELS: FetchedModel[] = [
  { id: "claude-opus-4.6", ownedBy: "anthropic" },
  { id: "claude-sonnet-5", ownedBy: "anthropic" },
  { id: "o4-mini", ownedBy: "openai" },
];

interface PickerProps {
  models: FetchedModel[];
  existingIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (ids: string[]) => void;
  disabled?: boolean;
}

const renderPicker = (overrides: Partial<PickerProps> = {}) => {
  const props: PickerProps = {
    models: MODELS,
    existingIds: [],
    open: true,
    onOpenChange: () => {},
    onAdd: () => {},
    ...overrides,
  };
  return render(<SearchableModelMultiPicker {...props} />);
};

describe("SearchableModelMultiPicker", () => {
  it("renders fetched models grouped by vendor", () => {
    renderPicker();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("anthropic")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-5")).toBeInTheDocument();
  });

  it("marks models already in the table as added and uncheckable", () => {
    renderPicker({ existingIds: ["claude-sonnet-5"] });
    expect(screen.getByText("已在列表")).toBeInTheDocument();
    // 已在表格中的模型不渲染勾选框（表格里那行才有）
    expect(
      screen.queryByRole("checkbox", { name: "claude-sonnet-5" }),
    ).not.toBeInTheDocument();
    // 其余模型正常可勾选
    expect(
      screen.getByRole("checkbox", { name: "claude-opus-4.6" }),
    ).toBeInTheDocument();
  });

  it("reports checked models via onAdd in list order and closes the picker", () => {
    const onAdd = vi.fn();
    const onOpenChange = vi.fn();
    renderPicker({ onAdd, onOpenChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "o4-mini" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "claude-sonnet-5" }));
    expect(screen.getByText("已选 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加到测试" }));
    // 输出顺序 = 分组排序后的列表顺序（anthropic 组在前）
    expect(onAdd).toHaveBeenCalledWith(["claude-sonnet-5", "o4-mini"]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("filters models by the search input", () => {
    renderPicker();
    fireEvent.change(screen.getByPlaceholderText("搜索模型..."), {
      target: { value: "sonnet" },
    });
    expect(screen.getByText("claude-sonnet-5")).toBeInTheDocument();
    expect(screen.queryByText("o4-mini")).not.toBeInTheDocument();
  });

  it("keeps the add button disabled until something is checked", () => {
    renderPicker();
    expect(screen.getByRole("button", { name: "添加到测试" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "o4-mini" }));
    expect(screen.getByRole("button", { name: "添加到测试" })).toBeEnabled();
  });

  it("disables the add button while a test round is running", () => {
    renderPicker({ disabled: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "o4-mini" }));
    expect(screen.getByRole("button", { name: "添加到测试" })).toBeDisabled();
  });

  it("disables the trigger button when no models have been fetched", () => {
    renderPicker({ models: [] });
    expect(screen.getByRole("button", { name: "搜索添加" })).toBeDisabled();
  });
});
