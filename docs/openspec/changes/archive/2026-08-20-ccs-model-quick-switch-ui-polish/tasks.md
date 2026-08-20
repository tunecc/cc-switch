# Implementation Tasks

## 1. Claude 徽章 1M 信息

- [x] 1.1 `providerModelUtils.ts`：`ModelBadgeInfo` 接口新增 `oneM?: boolean` 字段
- [x] 1.2 `extractModelBadgeForProvider` claude 分支：判断主对话模型（`ANTHROPIC_DEFAULT_SONNET_MODEL`，空回退 `ANTHROPIC_MODEL`）原始 env 值 `hasClaudeOneMMarker`，据此设 `oneM`；回退路径同样判断；其余 app 不设 `oneM`
- [x] 1.3 `ProviderCard.tsx` modelBadge 渲染块：在 `{modelBadge.label}` 后追加 `{modelBadge.oneM && <span>1M</span>}`，弱化配色 + `title` 提示「1M 已开启」

## 2. 弹窗层级修正

- [x] 2.1 `ModelQuickSwitchDialog.tsx`：`<DialogContent>` 增加 `zIndex="alert"`，使弹窗盖住顶部 header（z-50）

## 3. 弹窗紧凑布局

- [x] 3.1 `ModelQuickSwitchDialog.tsx`：`DialogContent` 的 `className` 由 `max-w-md` 改为 `max-w-sm`
- [x] 3.2 把「获取模型列表」按钮移到「当前模型」行右侧：当前模型行改 `flex items-center justify-between gap-2`，左侧当前模型（label + 值，值 `truncate min-w-0`），右侧拉取按钮 `shrink-0`
- [x] 3.3 原独立拉取按钮行删除，其内「拉取成功后已选模型 + SearchableModelPicker」块上移为新独立行
- [x] 3.4 内层容器 `space-y-4` 收紧为 `space-y-3`

## 4. i18n

- [x] 4.1 新增 `providerModel.oneMBadge`（值「1M」）与 `providerModel.oneMEnabledHint`（zh「1M 已开启」/en/ja/zh-TW 对应）到四语言文件

## 5. 验证

- [x] 5.1 `pnpm test:unit` → 132 文件 / 1016 用例全过；`pnpm typecheck` 干净；`openspec validate --strict` 通过（providerModelUtils / ProviderCard 相关测试通过）
- [x] 5.2 `pnpm dev:fork` GUI 肉眼巡检 claude 供应商（用户执行）：打开模型快捷切换弹窗确认 header 被盖住、布局紧凑、当前模型与拉取按钮同行；claude 带 `[1M]` 模型徽章显示「1M」标记
- [x] 5.3 GUI 肉眼巡检 codex/gemini/grokbuild（用户执行）：弹窗布局一致、徽章不显示 1M 标记；范围外 app 卡片无徽章无弹窗按钮（回归不变）
