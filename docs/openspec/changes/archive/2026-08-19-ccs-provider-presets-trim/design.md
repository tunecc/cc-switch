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

## Open Questions

无。所有关键决策已定。Hermes 白名单为空规避了 isOfficial 语义歧义。
