# provider-presets-visibility Specification

## Purpose
控制"添加供应商"对话框中预设列表的可见性。fork 构建仅显示各 app 官方预设 + 自定义选项；上游构建保持全部预设可见。定义 fork 白名单契约与过滤层行为，确保 fork 侧精简预设的同时便于同步上游。
## Requirements
### Requirement: 预设接口支持 hidden 标记

各 app 预设接口（`claudeProviderPresets` 已有，其余 `codex`/`gemini`/`grokBuild`/`hermes`/`openclaw`/`opencode`/`pi`/`claudeDesktop`）SHALL 支持 `hidden?: boolean` 字段。`hidden: true` 的预设 SHALL 在预设列表构建时被过滤掉，不显示在"添加供应商"对话框的预设选择器中。`hidden` 字段 MUST 不影响已添加的供应商（仅影响预设选择器可见性）。

#### Scenario: hidden 预设不在选择器显示
- **WHEN** 某预设的 `hidden` 为 true
- **THEN** 该预设不出现在"添加供应商"对话框的预设选择器列表中

#### Scenario: hidden 不影响已添加供应商
- **WHEN** 某预设被标记 hidden 但用户此前已基于它添加了供应商
- **THEN** 已添加的供应商配置不受影响，仍可正常使用、编辑、切换

### Requirement: Fork 官方预设白名单

fork 仓库 SHALL 维护 `src/config/forkOfficialAllowlist.ts`，导出各 app 保留的官方预设名称集合：
- `claude` → `["Claude Official"]`
- `codex` → `["OpenAI Official"]`
- `gemini` → `["Google Official"]`
- `grokbuild` → `["Grok Official"]`
- `claude-desktop` → `["Claude Desktop Official"]`
- `hermes` / `openclaw` / `opencode` / `pi` → `[]`（无官方预设，过滤后为空）

白名单匹配 SHALL 按预设的 `name` 字段精确字符串匹配。

#### Scenario: 白名单包含官方预设
- **WHEN** 读取 fork 白名单
- **THEN** claude 白名单含 `Claude Official`，codex 含 `OpenAI Official`，gemini 含 `Google Official`，grokbuild 含 `Grok Official`，claude-desktop 含 `Claude Desktop Official`

#### Scenario: 无官方 app 白名单为空
- **WHEN** 读取 hermes/openclaw/opencode/pi 的白名单
- **THEN** 该集合为空数组

### Requirement: 过滤层仅 fork 构建生效

预设过滤 SHALL 仅在 `IS_FORK_BUILD` 为 true 时应用白名单过滤。当 `IS_FORK_BUILD` 为 false（上游构建）时，预设选择器 MUST 显示全部预设（不按白名单过滤），行为与上游一致。

#### Scenario: fork 构建仅显示白名单预设
- **WHEN** 在 fork 构建（`IS_FORK_BUILD` 为 true）下打开"添加供应商"对话框
- **THEN** 预设选择器仅显示该 app 白名单内的预设 + 自定义选项

#### Scenario: 上游构建显示全部预设
- **WHEN** 在上游构建（`IS_FORK_BUILD` 为 false）下打开"添加供应商"对话框
- **THEN** 预设选择器显示该 app 全部预设（含非官方），行为与上游一致

### Requirement: 各 app 预设入口统一过滤

预设过滤 SHALL 覆盖所有 app 的预设入口：`ProviderForm.tsx` 的 `presetEntries` 构建处（claude/codex/gemini/hermes/openclaw/opencode/claude-desktop 分支）、`GrokBuildProviderForm.tsx` 的 `grokPresetEntries`、`PiProviderForm.tsx` 的 `presetEntries`。各入口 SHALL 在 IS_FORK_BUILD 时按白名单 + hidden 过滤。

#### Scenario: Claude app 过滤生效
- **WHEN** 在 fork 构建下，Claude app 打开添加供应商对话框
- **THEN** 预设列表仅含 `Claude Official`

#### Scenario: GrokBuild app 过滤生效
- **WHEN** 在 fork 构建下，GrokBuild app 打开添加供应商对话框
- **THEN** 预设列表仅含 `Grok Official`

#### Scenario: Pi app 过滤后为空
- **WHEN** 在 fork 构建下，Pi app（白名单为空）打开添加供应商对话框
- **THEN** 预设列表为空，仅显示自定义选项

### Requirement: 自定义供应商入口始终可用

无论是否 fork 构建、无论白名单是否为空，"自定义"供应商添加入口 MUST 始终可用。过滤不得移除自定义添加能力。

#### Scenario: 白名单为空时自定义仍可用
- **WHEN** 在 fork 构建下，某 app 白名单为空（如 pi）打开添加供应商对话框
- **THEN** 预设列表为空，但用户仍可通过"自定义"选项手动添加供应商

