## Why

fork 的模型选择下拉（ModelDropdown）是简单列表无搜索；上游 cc-switch-main 已升级为 SearchableModelPicker（Popover + cmdk Command 可搜索、按 ownedBy 供应商分组排序、当前值打勾）。供应商模型列表动辄几十上百个，无搜索的滚动选择效率低。移植上游搜索选择器提升所有表单的模型选择体验。

## What Changes

- **新增 `src/components/providers/forms/shared/SearchableModelPicker.tsx`**：从上游 `/Users/tune/Downloads/cc-switch-main/src/components/providers/forms/shared/SearchableModelPicker.tsx` 原样移植（110 行：Popover 触发按钮 + CommandInput 搜索 + 按 ownedBy 分组、组内按 id 排序 + 当前值 Check 勾选）。
- **`ModelInputWithFetch.tsx`**：`ModelDropdown` 替换为 `SearchableModelPicker`（多传 `value` prop 标记当前值）。此组件被 ClaudeFormFields/CodexFormFields（ModelInputWithFetch 使用方 Gemini/Claude）等复用。
- **`ClaudeFormFields.tsx` Copilot 分支**：`ModelDropdown` 替换为 `SearchableModelPicker`（与上游 renderModelInput 对齐，ownedBy 回退 "Other"）。
- **`shared/index.ts`**：导出 `SearchableModelPicker`。
- **保留 `ModelDropdown.tsx` 与其余引用**：Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop 表单仍直接用 ModelDropdown（上游对应文件也已换用 SearchableModelPicker，但那是上游对这些文件的更大范围改动）。本 change 仅最小移植核心组件与 Claude 主链路，其余表单换用留作后续增量（减小单 change 冲突面）。
- **依赖**：`cmdk@^1.1.1` 已在 package.json，`src/components/ui/command.tsx` 已存在，无新依赖。
- **i18n**：上游 picker 用 `providerForm.searchModels` / `noModelsFound` key——检查我们 locale 是否已有（上游 key 我们可能缺失则补 zh/en/ja/zh-TW）。

## Capabilities

### New Capabilities
- `model-search-picker`: 模型选择支持搜索过滤与供应商分组。定义 SearchableModelPicker 组件契约（搜索、分组、当前值标记）与接入范围（ModelInputWithFetch 全部使用方 + Claude Copilot 分支）。

### Modified Capabilities
<!-- 无。 -->

## Impact

- **新增**：`src/components/providers/forms/shared/SearchableModelPicker.tsx`。
- **改动**：`ModelInputWithFetch.tsx`（换组件）、`ClaudeFormFields.tsx`（Copilot 分支换组件）、`shared/index.ts`（导出）、locale 文件（若缺 searchModels/noModelsFound key 则补）。
- **不变**：ModelDropdown.tsx 保留；其余直接引用 ModelDropdown 的表单不动。
- **风险**：SearchableModelPicker 的 Popover 层级（z-index）与 Dialog 嵌套表现需巡检；cmdk 已有依赖无供应链风险；上游组件原样移植降低实现风险。
