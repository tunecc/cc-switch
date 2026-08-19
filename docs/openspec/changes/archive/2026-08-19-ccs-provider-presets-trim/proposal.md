## Why

fork 版 cc-switch 的"添加供应商"对话框当前显示上游全部预设（Claude 70+、Codex 70+、Gemini 20+、GrokBuild 30+ 等），fork 只想保留各 app 的官方预设（Claude Official / OpenAI Official / Google Official / Grok Official / Claude Desktop Official），其余预设隐藏只保留官方选项 + 自定义。这能简化添加流程，并与后续魔改（自定义供应商为主）一致。同时必须便于同步上游：不删除预设数据，用 `hidden: true` 标记 + fork 白名单过滤，rebase 上游时 fork 侧只动白名单与过滤层，预设数据本身保持上游原样。

## What Changes

- **各 app 预设接口新增 `hidden?: boolean` 字段**（仅 `claudeProviderPresets` 已有，其余需补）：`codexProviderPresets`、`geminiProviderPresets`、`grokBuildProviderPresets`、`hermesProviderPresets`、`openclawProviderPresets`、`opencodeProviderPresets`、`piProviderPresets`、`claudeDesktopProviderPresets`。
- **新增 fork 白名单文件** `src/config/forkOfficialAllowlist.ts`：导出各 app 保留的官方预设名称集合（Claude→`Claude Official`、Codex→`OpenAI Official`、Gemini→`Google Official`、GrokBuild→`Grok Official`、ClaudeDesktop→`Claude Desktop Official`；Hermes/openclaw/opencode/pi 无官方则空集合）。
- **预设过滤层**：在 `ProviderForm.tsx` 的 `presetEntries` 构建处（各 app 分支）应用 fork 白名单过滤——仅 IS_FORK_BUILD 时，非白名单预设标记 `hidden`（或直接过滤掉），上游构建 IS_FORK_BUILD 不存在则保持原行为（全部显示）。
- **GrokBuildProviderForm.tsx / PiProviderForm.tsx**：各自的 presetEntries 构建处同样应用 fork 白名单。
- **`hidden: true` 标记**：为各 app 非白名单预设加 `hidden: true` 字段（保留数据，不删除），过滤层按 `hidden` 过滤。这样上游更新预设时，fork 只需维护白名单，预设文件本身的 hidden 标记按白名单批量设置（可加一个脚本或直接编辑）。
- **不改动**：官方预设本身的内容；自定义添加供应商流程（"自定义"选项始终可用）；供应商卡片、切换、代理等现有功能。

## Capabilities

### New Capabilities
- `provider-presets-visibility`: 控制添加供应商对话框中预设列表的可见性。fork 构建仅显示各 app 官方预设 + 自定义；上游构建保持全部预设。定义 fork 白名单契约与过滤层行为。

### Modified Capabilities
<!-- 无既有 spec 需修改。本仓库 specs/ 目前仅 fork-build-identity。 -->

## Impact

- **预设接口**：8 个预设文件（codex/gemini/grokBuild/hermes/openclaw/opencode/pi/claudeDesktop）的接口加 `hidden?: boolean`；claude 已有。
- **预设数据**：各 app 非官方预设加 `hidden: true`（批量标记）。
- **新增**：`src/config/forkOfficialAllowlist.ts`。
- **过滤层**：`src/components/providers/forms/ProviderForm.tsx`（presetEntries 各 app 分支）、`src/components/providers/forms/GrokBuildProviderForm.tsx`、`src/components/providers/forms/PiProviderForm.tsx`。
- **依赖**：复用 `IS_FORK_BUILD`（来自 fork-build-identity capability）。
- **风险**：过滤层必须仅 IS_FORK_BUILD 时生效，上游构建零影响；白名单名称必须与预设 `name` 字段精确匹配；Hermes 等无官方的 app 过滤后预设列表为空，需确认 UI 仍可用（自定义入口）。
