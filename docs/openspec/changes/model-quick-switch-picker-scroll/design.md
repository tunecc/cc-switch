# 修复方案：Popover 捕获阶段阻断 wheel 传播

## 方案

在 `src/components/providers/forms/shared/SearchableModelPicker.tsx` 的 `PopoverContent` 上增加一个捕获阶段的 wheel 传播阻断：

```tsx
<PopoverContent
  align="end"
  className="w-[min(420px,calc(100vw-2rem))] p-0 z-[200]"
  onWheelCapture={(e) => e.stopPropagation()}
>
```

## 机制

- Radix Portal 把 `PopoverContent` 挂到 `document.body`，位于 `ModelQuickSwitchDialog` 的 `RemoveScroll` 锁定容器与 shards 之外。
- react-remove-scroll 在 `document` 上挂非被动 bubble 阶段 `wheel` 监听，对「锁定容器 + shards 之外」的 wheel 事件无条件 `preventDefault()`，吃掉原生滚动。
- React 合成事件的 `onWheelCapture` 在捕获阶段触发；对合成事件调用 `stopPropagation()` 会调用底层原生事件的 `stopPropagation()`，在事件冒泡到 document 之前终止传播，RemoveScroll 的 document 监听因此收不到该事件，不再 `preventDefault()`。
- 浏览器对该 wheel 事件的原生默认行为（滚动 `CommandList`）不受 `stopPropagation` 影响（未被 `preventDefault`），列表正常滚动。
- 滚动到达列表边界后，由于传播已被阻断，事件不会冒泡到 dialog 内容区域，避免滚轮穿透滚动底层——这是仓库已有的同款处理思路（`SessionManagerPage.tsx:807` 的 `onWheel` 阻断）。

## 适用范围

- 仅作用于该 Popover 上的 wheel 事件，不影响键盘导航、点击选择、搜索过滤。
- 编辑表单内的 `SearchableModelPicker`（FullScreenPanel，无 RemoveScroll）行为不受影响，仍可正常滚动；额外收益是该处滚轮不再穿透。
- 不引入新依赖，不改组件 API，不改 spec 验收场景。

## 验证手段

新增回归测试，复现「模态 Dialog 内 Popover 的 CommandList 上 wheel 事件被 preventDefault」的旧行为，修复后断言 `event.defaultPrevented === false`。jsdom 对 React 合成事件 + Portal 的支持有限，若行为测试不稳定则退回仓库既有先例的源码静态断言（`tests/components/SelectContentScroll.test.ts` 的同款写法），断言修复元素存在。
