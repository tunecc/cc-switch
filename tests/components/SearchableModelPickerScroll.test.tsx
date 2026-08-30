import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableModelPicker } from "@/components/providers/forms/shared/SearchableModelPicker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// 复现「模型快捷切换」场景：SearchableModelPicker 渲染在模态 Radix Dialog 内。
// Dialog 的 overlay 包 RemoveScroll（shards 仅含 DialogContent），而 PopoverContent
// portal 到 document.body——wheel 事件会被 document 级监听 preventDefault，
// 导致 CommandList 无法用滚轮滚动。修复后捕获阶段阻断传播，滚动恢复。
const MANY_MODELS = Array.from({ length: 60 }, (_, i) => ({
  id: `model-${String(i).padStart(2, "0")}`,
  ownedBy: "vendor",
}));

describe("SearchableModelPicker wheel scroll inside modal Dialog", () => {
  it("does not let RemoveScroll preventDefault wheel events over the portaled popover list", async () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>模型快捷切换</DialogTitle>
          <SearchableModelPicker models={MANY_MODELS} onSelect={vi.fn()} />
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button"));

    const list = await screen.findByRole("listbox");
    const wheelEvent = new WheelEvent("wheel", {
      deltaY: 120,
      bubbles: true,
      cancelable: true,
    });
    list.dispatchEvent(wheelEvent);

    // 未修复时 RemoveScroll 对 shards 外的 wheel 无条件 preventDefault，
    // defaultPrevented 为 true——即滚轮滚动被吞掉的根因。
    expect(wheelEvent.defaultPrevented).toBe(false);
  });
});
