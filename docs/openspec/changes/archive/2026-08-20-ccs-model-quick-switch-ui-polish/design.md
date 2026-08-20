## Context

既有「模型快捷切换」功能在 `ModelQuickSwitchDialog.tsx`、`ProviderCard.tsx`、`providerModelUtils.ts` 已落地（见 archive `2026-08-19-ccs-home-model-display`）。本次仅做 3 项 UI 收敛，不改读写语义（`getCurrentModel` / `applyModelToSettings` 不动）。

关键现状约束：
- `src/App.tsx` 的顶部 `header` 是 `fixed z-50`（`App.tsx:1282`），品牌 `CC Switch` 由 `RoutingActivationBrand` 渲染在其内（`App.tsx:1346`）。
- `DialogContent` 的 `zIndex` 由 `src/components/ui/dialog.tsx` 的 `zIndexMap` 决定：`base=z-40`、`nested=z-50`、`alert=z-[60]`、`top=z-[110]`。当前 `ModelQuickSwitchDialog` 未设 `zIndex`，默认 `base=z-40`，低于 header 的 z-50，故 header 透显在弹窗之上。
- `extractModelBadgeForProvider`（`providerModelUtils.ts:127`）已对 claude 走 Opus/Sonnet/Haiku 三角色聚合返回 `{ label, title }`，但当前 `label` 已 strip `[1M]`，未返回 1M 开关信息。
- claude 1M 语义已由 `useModelState.ts` 的 `hasClaudeOneMMarker` / `stripClaudeOneMMarker` / `setClaudeOneMMarker` 封装，可直接复用判断当前主对话模型是否带 `[1M]`。

## Goals / Non-Goals

**Goals:**
- 弹窗打开时顶部 header 被完全盖住，不透显。
- 弹窗更紧凑，当前模型与拉取按钮同行，整体留白减少。
- Claude 卡片徽章能一眼看出 1M 是否开启。

**Non-Goals:**
- 不改模型读/写语义、不改写回契约、不动后端。
- 不重构 Dialog 的 zIndex 体系（只在弹窗实例上选更高 `zIndex` 值）。
- 不改 1M 写回逻辑（`applyModelToSettings` 不动），仅在展示层补 1M 标记。

## Decisions

### D1: 弹窗 zIndex 用 `alert`（z-[60]）盖住 header
- `nested`（z-50）与 header 同层，同层时 DOM 顺序靠后的可能仍盖不住，且 header 在 React 树里先于弹窗渲染，同层不稳妥。`alert`（z-[60]）明确高于 z-50，足以盖住 header 且不与 `top`（z-[110]，用于深层确认/导入等）冲突。
- 备选：`top`（z-[110]）——该弹窗不会嵌套在更深的对话框里，用 `alert` 即够，且与项目里 ProfileSwitcher/ToolUpgradeConfirmDialog 等同级弹窗保持一致层级习惯。
- 仅改 `ModelQuickSwitchDialog` 一处 `<DialogContent>` 的 `zIndex` prop，不动 `dialog.tsx` 共享组件。

### D2: 弹窗紧凑布局——当前模型行 + 拉取按钮同行
- `DialogContent` 的 `className` 由 `max-w-md` 收紧为 `max-w-sm`。
- 「当前模型」行从独立 `div` 改为 `flex items-center justify-between`：左侧「当前模型 + 模型值」，右侧「获取模型列表」按钮。当前模型值用 `truncate min-w-0`，按钮 `shrink-0`。
- 原独立拉取按钮行删除，其内的「拉取成功后已选模型 + SearchableModelPicker」块上移为新的下一行（独立 `space-y` 项）。
- 内层容器 `space-y-4` 收紧为 `space-y-3`；`DialogHeader`/`DialogFooter` 用既有共享样式，不动。
- 拉取按钮文案保留图标 + 文案，但 `size="sm"` 维持紧凑。

### D3: Claude 徽章 1M 标记——`ModelBadgeInfo` 增加 `oneM` 字段
- `ModelBadgeInfo` 接口新增 `oneM?: boolean`（仅 claude 时可能为 `true`，其余 app 不返回该字段）。
- `extractModelBadgeForProvider` 的 claude 分支：在 strip 之前判断主对话模型（`ANTHROPIC_DEFAULT_SONNET_MODEL`，空则回退 `ANTHROPIC_MODEL`）原始值是否 `hasClaudeOneMMarker`，据此设 `oneM`。回退路径（无角色模型、用 `ANTHROPIC_MODEL`）同样判断。
- 其余 app（gemini/codex/grokbuild）不设 `oneM`（保持 `undefined`），渲染时自然不显示标记。
- `ProviderCard.tsx` 的 `modelBadge` 渲染块：在 `{modelBadge.label}` 后追加 `{modelBadge.oneM && <span ...>1M</span>}`，样式仿既有徽章但更弱化（如 `bg-primary/10 text-primary` 或与 modelBadge 徽章同色系的小标记），`title` 提示「1M 已开启」。

### D4: i18n
- 新增 `providerModel.oneMBadge`（徽章 1M 标记文案，值即「1M」，四语言同值）与 `providerModel.oneMEnabledHint`（title 提示，如 zh「1M 已开启」）。
- zh / en / ja / zh-TW 四语言齐补；既有 `providerModel.*` key 不动。

## Risks / Trade-offs

- [弹窗收窄后长模型名被截断] → 当前模型值保留 `truncate` + `title` 全名提示；SearchableModelPicker 内部宽度自适应（`w-[min(420px,calc(100vw-2rem))]`），不受弹窗收窄影响。
- [1M 标记与模型名视觉拥挤] → 标记用独立小 span、弱化配色，且仅在 claude 开启时出现；title 给完整提示。
- [zIndex 选 `alert` 在极少数嵌套场景不够] → 该弹窗不嵌套在更深层 Dialog 内（由 ProviderCard 直接挂载），`alert` 足够；若未来嵌套可升 `top`，非本次范围。
- [徽章渲染回归] → appId 守卫不变，4 app 之外零渲染；1M 标记仅在 `modelBadge.oneM` 为 `true` 时出现，新增分支有既有单测可扩充覆盖。

## Migration Plan

直接在 `main` 分支实现（属 Level 1 本地低风险纯前端 UI 改动）。回滚即还原 `ModelQuickSwitchDialog.tsx`、`ProviderCard.tsx`、`providerModelUtils.ts`、i18n 四语言文件对应改动。

## Open Questions

无。
