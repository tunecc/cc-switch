# 模型快捷切换弹窗：模型列表鼠标滚轮无法滚动

## Why（问题描述）

「模型快捷切换」弹窗（`ModelQuickSwitchDialog`）点击拉取模型后，搜索下拉框（`SearchableModelPicker` 的 Popover）里已正确渲染全部模型（滚动几何正常：`CommandList` 为 `max-h-[300px] overflow-y-auto`），但鼠标滚轮完全无法上下滚动列表；键盘上下键仍可移动选中项（cmdk 的 `scrollIntoView` 不受影响）。全局 CSS 隐藏了滚动条（`* { scrollbar-width: none }` + `::-webkit-scrollbar { display: none }`），滚轮是列表唯一的滚动方式，因此该 bug 直接导致长列表只能靠键盘浏览。

同一组件在供应商编辑表单里（FullScreenPanel 内）滚动正常，只在快捷切换弹窗（Radix Dialog）内失效。

## 根因分析

从依赖源码（`@radix-ui/react-dialog`、`react-remove-scroll@2.7.1`）逐层确认：

1. `ModelQuickSwitchDialog` 是模态 Radix Dialog。`DialogContent` 的 overlay 被包进 `RemoveScroll`，且仅注册了 `shards: [contentRef]`（即 DialogContent 自身元素）。
2. `SearchableModelPicker` 的 `PopoverContent` 通过 Radix Portal 挂到 `document.body` —— 位于 RemoveScroll 锁定容器之外，也不在任何 shard 内。
3. react-remove-scroll 在 `document` 上挂了一个非被动 bubble 阶段的 `wheel` 监听（`SideEffect.js` 的 `shouldPrevent`）。对目标不在锁定内容、也不在 shards 内的 wheel 事件，它会无条件 `event.preventDefault()`（`shouldStop = !noIsolation`，默认 `noIsolation: false`）。
4. 结果：滚轮滚到 Popover 内的 CommandList 时，原生滚动默认行为被 document 级监听吃掉，列表纹丝不动。

编辑表单场景不受影响，因为 FullScreenPanel 用的是手动 `body.overflow=hidden` 锁，没有 RemoveScroll。

## What Changes（修复目标）

- 修复目标：模态 Dialog 内打开的模型搜索下拉框，鼠标滚轮可正常上下滚动列表；滚到列表边界时不把滚动穿透给底层页面。
- 手段：在 `SearchableModelPicker` 的 `PopoverContent` 上加 `onWheelCapture={(e) => e.stopPropagation()}`，在捕获阶段拦截 wheel 的传播，使 document 级 RemoveScroll 监听收不到该事件（不触发 preventDefault），而原生滚动默认行为保留。这与仓库既有先例一致（`SessionManagerPage.tsx:807` 的 `onWheel={(e) => e.stopPropagation()}`）。

## Capabilities

不新增 capability，不改变任何已有 spec 的验收场景（`model-search-picker` 与 `provider-model-quick-view-switch` 两个现有 spec 均未断言滚轮行为），因此无需 delta spec。本次是纯行为 bug 修复。

## Impact

- 影响文件：`src/components/providers/forms/shared/SearchableModelPicker.tsx`（1 行修复）+ 新增回归测试。
- 风险：低。只影响滚轮事件在该 Popover 上的传播；键盘、点击选择、搜索过滤均不受影响。编辑表单内的同一组件无 RemoveScroll 干扰，行为不变（额外收益：阻止了滚轮从列表穿透滚动底层面板）。
