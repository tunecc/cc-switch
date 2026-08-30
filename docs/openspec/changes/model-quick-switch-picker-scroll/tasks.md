# 任务清单

## 1. 复现证据（RED）

- [x] 1.1 先写回归测试：Modal Dialog 内 Popover 的 CommandList 上派发 `wheel` 事件，修复前断言 `defaultPrevented === true`（复现旧 bug）；若 jsdom 行为测试不稳，退化为源码静态断言（先例 `tests/components/SelectContentScroll.test.ts`），先在修复前确认旧实现无阻断、`preventDefault` 路径存在
- [x] 1.2 运行该测试，记录真实失败输出作为复现证据（对应本 bug，而非环境/测试自身错误）：行为测试 RED——`expect(wheelEvent.defaultPrevented).toBe(false)` 失败，实际为 `true`，RemoveScroll 在 jsdom 中同样吃掉 shards 外的 wheel 事件，与真机行为一致

## 2. 实施修复

- [x] 2.1 在 `src/components/providers/forms/shared/SearchableModelPicker.tsx` 的 `PopoverContent` 上增加 `onWheelCapture={(e) => e.stopPropagation()}`
- [x] 2.2 运行项目格式化（`pnpm format` 或 prettier）：两文件 prettier 均无改动

## 3. 验证（GREEN）

- [x] 3.1 运行新增回归测试，断言转绿：`SearchableModelPickerScroll.test.tsx` 1 passed
- [x] 3.2 运行相关测试 + `tsc` 类型检查，全部通过：相关组件测试（ModelDropdown / SelectContentScroll / FullScreenPanel / ClaudeFormFields / EditProviderDialog）全绿；全量 `pnpm test:unit` 135 文件 / 1058 测试全过；`pnpm typecheck` 无错误
- [x] 3.3 根因消除自查：确认 RemoveScroll 的 `preventDefault` 路径已不再作用于该 Popover 的 wheel 事件（回归测试断言 `defaultPrevented === false` 直接验证了该路径被阻断）