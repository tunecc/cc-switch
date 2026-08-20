## Why

模型快捷切换弹窗（`ModelQuickSwitchDialog`）当前有两个 UI 问题影响体验：一是打开时顶部 `CC Switch` 品牌所在的 header（fixed、z-50）透显在弹窗之上，视觉上「压住」弹窗顶部；二是弹窗整体偏大偏空，功能项少却占用过多空间。此外 Claude 供应商卡片当前模型徽章只显示模型名，没有反映 1M 是否开启，用户无法一眼看出当前主对话模型是否带 `[1M]` 标记。本次在既有 fork 功能上做三项纯前端 UI 收敛，让弹窗更克制、徽章信息更完整。

## What Changes

- 弹窗层级修正：给 `ModelQuickSwitchDialog` 的 `DialogContent` 设置高于 header（z-50）的 `zIndex`（使用 `nested` z-50 不足以盖住同层 header，改用 `alert` z-[60]），使 header 不再透显在弹窗之上。
- 弹窗紧凑化：缩小 `max-w`（由 `max-w-md` 收紧为 `max-w-sm`）、收紧内部 `space-y` 与 padding；将「获取模型列表」按钮从独立一行移到「当前模型」行的右侧，与当前模型同行展示。
- Claude 徽章增加 1M 标记：`extractModelBadgeForProvider` 对 claude 增加返回当前主对话模型是否带 `[1M]` 标记的信息；`ProviderCard` 的 `modelBadge` 渲染在模型名后追加「1M」小标记（仅 claude 且开启时）。
- i18n：补齐 `providerModel.*` 新增文案（1M 徽章标签）的 zh / en / ja / zh-TW 四语言。

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `provider-model-quick-view-switch`：弹窗层级与紧凑布局变更（弹窗 SHALL 盖住顶部 header、SHALL 收紧尺寸与按钮排布），Claude 卡片模型徽章 SHALL 在模型名后显示 1M 开启标记。

## Impact

- 纯前端改动，无新增后端命令、无 schema 变更、无 public API 变更、不跨模块。
- 受影响文件：`src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`、`src/components/providers/ProviderCard.tsx`、`src/utils/providerModelUtils.ts`、`src/i18n/locales/{zh,en,ja,zh-TW}.json`。
- 行为影响范围：模型快捷切换弹窗与 4 个核心 app（claude/codex/gemini/grokbuild）的卡片徽章渲染；范围外 app 不受影响（既有 appId 守卫不变）。
- 写回语义与读模型语义不变（`applyModelToSettings` / `getCurrentModel` 不改），仅徽章展示信息与弹窗布局调整。
