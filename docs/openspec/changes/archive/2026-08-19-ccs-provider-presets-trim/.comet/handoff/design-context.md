# Comet Design Handoff

- Change: ccs-provider-presets-trim
- Phase: design
- Mode: compact
- Context hash: 8501189117e73a9bd6a063c2e9e35719409c31226c45e3f6b2283950ebb88310

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-provider-presets-trim/proposal.md

- Source: docs/openspec/changes/ccs-provider-presets-trim/proposal.md
- Lines: 1-29
- SHA256: f6c301408a0b7724fb01327860c41671916c4334ed471913e2d6e2d83738ec9a

```md
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

```

## docs/openspec/changes/ccs-provider-presets-trim/design.md

- Source: docs/openspec/changes/ccs-provider-presets-trim/design.md
- Lines: 1-83
- SHA256: 01c3a7080296e0676acd87afa1c835c62dbee0ee3d8b744dbb57937e458196fe

[TRUNCATED]

```md
## Context

本 change 在已归档的 `ccs-fork-scaffolding` 基础上，精简"添加供应商"对话框的预设列表。当前各 app 预设接口仅 `claudeProviderPresets` 有 `hidden?: boolean` 字段，其余无；`ProviderForm.tsx` 的 claude 分支已按 `!p.hidden` 过滤，其余 app 分支不过滤。fork 需统一各 app 的 hidden 支持，并用白名单控制只显示官方预设。

关键约束：
- 必须便于同步上游：不删除预设数据，用 `hidden: true` 标记 + 白名单过滤，rebase 上游时预设数据保持上游原样，fork 侧只动白名单与过滤层。
- 过滤层仅 `IS_FORK_BUILD` 时生效，上游构建零影响。
- 自定义添加入口始终可用。
- Hermes/openclaw/opencode/pi 无官方预设，过滤后预设列表为空，需确认 UI 自定义入口仍可用。

## Goals / Non-Goals

**Goals:**
- fork 构建下，各 app 添加供应商对话框仅显示官方预设 + 自定义。
- 上游构建行为完全不变。
- fork 侧维护单一白名单文件，rebase 上游时预设文件冲突最小化。
- 各 app 预设接口统一支持 hidden。

**Non-Goals:**
- 不改动官方预设的内容（websiteUrl/settingsConfig/apiKeyField 等）。
- 不改动已添加供应商的加载/切换/代理逻辑。
- 不删除任何预设数据（仅 hidden 标记）。
- 不实现"新供应商本体"（用户后续用自定义添加即可）。

## Decisions

### D1: 白名单文件 vs 散落 hidden 标记

用单一 `src/config/forkOfficialAllowlist.ts` 白名单文件，按 app 导出官方预设名称集合。过滤层在 IS_FORK_BUILD 时按白名单过滤。

**备选**：直接给每个非官方预设加 `hidden: true` 字段（散落标记）——但 rebase 上游时这些散落标记会让预设文件高频冲突，且每次上游新增预设都要手动加 hidden。白名单集中维护，预设文件保持上游原样（除非需补 hidden 字段定义），冲突最小。弃用散落方案。

**实现**：白名单文件导出 `Record<AppId, string[]>`，过滤层 `preset.name` 是否在白名单内。各 app 预设接口仍需补 `hidden?: boolean` 字段定义（TS 类型），但数据层不依赖 hidden 标记批量设置——过滤层直接用白名单判断。这样预设文件数据零改动（除接口类型补字段）。

### D2: 过滤层注入点

在 `ProviderForm.tsx` 的 `presetEntries` useMemo 各 app 分支，统一调用一个 fork 过滤工具函数。GrokBuild/Pi 各自的 presetEntries 构建处也调用同一函数。

**工具函数** `src/config/forkPresetFilter.ts`：
```ts
export function filterForkPresets<T extends { name: string }>(
  appId: AppId,
  presets: T[],
): T[] {
  if (!IS_FORK_BUILD) return presets;
  const allow = forkOfficialAllowlist[appId] ?? [];
  if (allow.length === 0) return []; // 无官方 → 预设为空，只支持自定义
  return presets.filter((p) => allow.includes(p.name));
}
```
各入口调用 `filterForkPresets(appId, rawPresets)`。上游构建 `IS_FORK_BUILD` false → 原样返回。

**备选**：用 `hidden: true` 标记 + 既有 `!p.hidden` 过滤——但需批量改预设数据（几百条），rebase 冲突大。D1 + D2 用白名单 + 工具函数，预设数据零改动，最优。

### D3: 各 app 预设接口补 hidden 字段

虽然 D2 不依赖数据层 hidden 标记，但为 TS 类型完整性与未来灵活性，各 app 预设接口补 `hidden?: boolean`（仅类型，不改数据）。这样上游若未来在预设数据加 hidden，fork 接口已兼容。

### D4: GrokBuild 官方预设特殊处理

`GrokBuildProviderForm.tsx` 的 `grokPresetEntries` 用 `GROKBUILD_OFFICIAL_PROVIDER_ID` + `grokBuildOfficialPreset`（独立常量）而非 `grokBuildProviderPresets` 数组里的条目。过滤时保留这个官方条目，其余按白名单过滤。白名单 grokbuild 含 `Grok Official`，需确认 `grokBuildOfficialPreset.name === "Grok Official"`。

### D5: 无官方 app 的 UI 兜底

Hermes/openclaw/opencode/pi 白名单为空，过滤后 presetEntries 为空。需确认 `ProviderPresetSelector` 在空列表时仍渲染"自定义"选项（不崩溃）。design 验证阶段确认 ProviderPresetSelector 对空 presetEntries 的处理；若自定义入口依赖预设列表非空，需兜底。

## Risks / Trade-offs

- **白名单名称必须精确匹配预设 `name` 字段** → Mitigation: tasks 中加验证步骤，grep 各官方预设的 name 字符串；若上游改名需同步白名单（rebase 时检查）。
- **GrokBuild 官方预设用独立常量不在数组** → Mitigation: D4 单独处理，过滤 grokPresetEntries 时保留官方条目。
- **无官方 app 预设空列表可能 UI 异常** → Mitigation: design 验证 ProviderPresetSelector 空列表行为，必要时兜底；本 change 范围内只保证不崩溃 + 自定义可用。
- **rebase 上游新增预设** → fork 白名单不含新预设 → fork 构建自动隐藏（符合预期），无需手动加 hidden。
- **Hermes 的 isOfficial 标记语义不明** → Mitigation: Hermes 白名单为空（无明确官方供应商预设），全部隐藏只支持自定义，规避语义歧义。

## Migration Plan

- **部署**：在 `feat/provider-presets-trim` 分支完成，本机 `pnpm dev:fork` 巡检各 app 添加供应商对话框。
- **回滚**：删除 `feat/provider-presets-trim` 分支或 checkout 回 main。
- **后续 change 依赖**：后续魔改 change 从含本 change 的 main 起步。


```

Full source: docs/openspec/changes/ccs-provider-presets-trim/design.md

## docs/openspec/changes/ccs-provider-presets-trim/tasks.md

- Source: docs/openspec/changes/ccs-provider-presets-trim/tasks.md
- Lines: 1-26
- SHA256: 6f94a3b6d1e01375ec9fe9141da95fa6e38e0f0b2b926d56c3e3ddca75f6a373

```md
## 1. 白名单与过滤工具

- [ ] 1.1 新增 `src/config/forkOfficialAllowlist.ts`，导出 `forkOfficialAllowlist: Record<string, string[]>`，含 claude→["Claude Official"]、codex→["OpenAI Official"]、gemini→["Google Official"]、grokbuild→["Grok Official"]、claude-desktop→["Claude Desktop Official"]、hermes/openclaw/opencode/pi→[]。注释说明按预设 `name` 精确匹配
- [ ] 1.2 新增 `src/config/forkPresetFilter.ts`，导出 `filterForkPresets<T extends { name: string }>(appId: string, presets: T[]): T[]`：`IS_FORK_BUILD` 为 false 时原样返回；为 true 时按白名单过滤，白名单为空返回空数组。import `IS_FORK_BUILD` from `@/config/forkBuild`，import `forkOfficialAllowlist` from `@/config/forkOfficialAllowlist`

## 2. 预设接口补 hidden 字段

- [ ] 2.1 为以下预设接口补 `hidden?: boolean` 字段（仅类型，不改数据）：`codexProviderPresets.ts`、`geminiProviderPresets.ts`、`grokBuildProviderPresets.ts`、`hermesProviderPresets.ts`、`openclawProviderPresets.ts`、`opencodeProviderPresets.ts`、`piProviderPresets.ts`、`claudeDesktopProviderPresets.ts`。claude 已有无需改

## 3. ProviderForm 过滤层接入

- [ ] 3.1 修改 `src/components/providers/forms/ProviderForm.tsx` 的 `presetEntries` useMemo：各 app 分支（codex/gemini/opencode/openclaw/hermes/claude/claude-desktop）在构建 presetEntries 前调用 `filterForkPresets(appId, rawPresets)` 过滤。claude 分支保留现有 `!p.hidden` 过滤再叠加 fork 白名单（两者都生效）。确保 `appId` 传入正确（注意 claude-desktop 与 claude 的 appId 区分）
- [ ] 3.2 修改 `src/components/providers/forms/GrokBuildProviderForm.tsx` 的 `grokPresetEntries`：保留 `GROKBUILD_OFFICIAL_PROVIDER_ID` + `grokBuildOfficialPreset` 官方条目，其余 `grokBuildProviderPresets` 经 `filterForkPresets("grokbuild", ...)` 过滤后再拼接
- [ ] 3.3 修改 `src/components/providers/forms/PiProviderForm.tsx` 的 `presetEntries`：`piProviderPresets` 经 `filterForkPresets("pi", ...)` 过滤（白名单为空→返回空数组）

## 4. 验证

- [ ] 4.1 运行 `pnpm typecheck` 通过
- [ ] 4.2 运行 `pnpm test:unit` 通过，无回归（与基线一致）
- [ ] 4.3 运行 `pnpm dev:fork`，巡检各 app 添加供应商对话框：Claude 仅显示 Claude Official；Codex 仅显示 OpenAI Official；Gemini 仅显示 Google Official；GrokBuild 仅显示 Grok Official；ClaudeDesktop 仅显示 Claude Desktop Official；Hermes/openclaw/opencode/pi 预设列表为空但自定义入口可用
- [ ] 4.4 确认自定义添加供应商流程仍可用（至少在 Claude 与一个无官方 app 验证）
- [ ] 4.5 `comet classic openspec -- validate ccs-provider-presets-trim` 通过

## 5. 提交

- [ ] 5.1 在 `feat/provider-presets-trim` 分支提交所有改动（commit message 遵循 conventional commits，如 `feat(fork): trim provider presets to official-only via allowlist`）。分逻辑提交（白名单+过滤工具 / 接口字段 / 过滤层接入 / 验证）

```

## docs/openspec/changes/ccs-provider-presets-trim/specs/provider-presets-visibility/spec.md

- Source: docs/openspec/changes/ccs-provider-presets-trim/specs/provider-presets-visibility/spec.md
- Lines: 1-73
- SHA256: ebc6a6f4fbd3606894a75bfcc9c3e28b2d2b75ac87accf68698cf37fb5b08abb

```md
## Purpose

控制"添加供应商"对话框中预设列表的可见性。fork 构建仅显示各 app 官方预设 + 自定义选项；上游构建保持全部预设可见。定义 fork 白名单契约与过滤层行为，确保 fork 侧精简预设的同时便于同步上游。

## ADDED Requirements

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

```
