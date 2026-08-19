---
comet_change: ccs-provider-presets-trim
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-19-ccs-provider-presets-trim
status: final
---

# Design Doc: ccs-provider-presets-trim

> OpenSpec change: `ccs-provider-presets-trim`
> 产物语言：zh-CN
> 依赖 capability: fork-build-identity（IS_FORK_BUILD）

## 1. 背景与目标

fork 版需精简"添加供应商"对话框的预设列表，仅显示各 app 官方预设 + 自定义。当前仅 claudeProviderPresets 接口有 hidden 字段且 ProviderForm 的 claude 分支按 `!p.hidden` 过滤，其余 app 不过滤。需统一各 app 过滤，且便于同步上游。

**目标**：fork 构建下各 app 仅显示官方预设 + 自定义；上游构建零影响；fork 侧单白名单文件维护，rebase 冲突最小。

**非目标**：不改官方预设内容；不改已添加供应商逻辑；不删预设数据；不实现新供应商本体。

## 2. 技术决策

### D1: 白名单文件 + 工具函数（不批量改预设数据）
用 `src/config/forkOfficialAllowlist.ts` 集中维护各 app 官方预设名称集合，`src/config/forkPresetFilter.ts` 工具函数按白名单过滤。预设数据文件零改动（除接口类型补 hidden 字段）。备选散落 hidden 标记 rebase 冲突大，弃用。

### D2: 过滤层注入点
`ProviderForm.tsx` 的 `presetEntries` useMemo 各 app 分支统一调用 `filterForkPresets(appId, rawPresets)`。GrokBuild/Pi 各自 presetEntries 也调用。上游构建 IS_FORK_BUILD false → 原样返回。

### D3: 接口补 hidden 字段（仅类型）
各 app 预设接口补 `hidden?: boolean` 类型（不改数据），兼容上游未来在数据层加 hidden。

### D4: GrokBuild 官方预设特殊处理
`grokBuildOfficialPreset` 是独立常量（name "Grok Official"），不在 `grokBuildProviderPresets` 数组。过滤时保留官方条目，其余数组条目按白名单过滤后拼接。已验证 `grokBuildOfficialPreset.name === "Grok Official"`。

### D5: 无官方 app UI 兜底
已验证 `ProviderPresetSelector.tsx:411` 对 `visiblePresetEntries.length === 0` 有兜底渲染（"No matching presets." 提示），不崩溃。自定义入口（selectedPresetId === "custom" 路径）独立于预设列表，空列表时仍可用。

## 3. 实施方案

### 3.1 forkOfficialAllowlist.ts
```ts
import type { AppId } from "@/lib/api";
// 按 AppId 索引；值为保留的官方预设 name 精确字符串集合
export const forkOfficialAllowlist: Record<string, string[]> = {
  claude: ["Claude Official"],
  "claude-desktop": ["Claude Desktop Official"],
  codex: ["OpenAI Official"],
  gemini: ["Google Official"],
  grokbuild: ["Grok Official"],
  hermes: [],
  openclaw: [],
  opencode: [],
  pi: [],
};
```

### 3.2 forkPresetFilter.ts
```ts
import { IS_FORK_BUILD } from "@/config/forkBuild";
import { forkOfficialAllowlist } from "@/config/forkOfficialAllowlist";

export function filterForkPresets<T extends { name: string }>(
  appId: string,
  presets: T[],
): T[] {
  if (!IS_FORK_BUILD) return presets;
  const allow = forkOfficialAllowlist[appId] ?? [];
  if (allow.length === 0) return [];
  return presets.filter((p) => allow.includes(p.name));
}
```

### 3.3 ProviderForm.tsx 各 app 分支
codex/gemini/opencode/openclaw/hermes/claude/claude-desktop 分支：`filterForkPresets(appId, rawPresets).map(...)` 生成 presetEntries。claude 分支保留 `!p.hidden` 再叠加 fork 过滤。

### 3.4 GrokBuildProviderForm.tsx
`grokPresetEntries = [{ id: GROKBUILD_OFFICIAL_PROVIDER_ID, preset: grokBuildOfficialPreset }, ...filterForkPresets("grokbuild", grokBuildProviderPresets).map(...)]`。fork 构建下白名单过滤掉非官方数组条目，保留官方条目。

### 3.5 PiProviderForm.tsx
`filterForkPresets("pi", piProviderPresets).map(...)` → fork 构建返回空数组。

### 3.6 接口补 hidden 字段
8 个预设文件接口加 `hidden?: boolean;`（仅类型）。

## 4. 风险与缓解

- 白名单 name 精确匹配 → tasks 4.x grep 各官方预设 name 校验
- GrokBuild 官方独立常量 → D4 单独处理
- 无官方 app 空列表 → 已验证 ProviderPresetSelector 有空列表兜底
- rebase 上游新增预设 → fork 白名单不含 → fork 构建自动隐藏（符合预期）
- Hermes isOfficial 语义歧义 → 白名单为空规避

## 5. 验收

- typecheck pass / test:unit 无回归
- pnpm dev:fork 巡检：Claude/Codex/Gemini/GrokBuild/ClaudeDesktop 各仅显示对应官方；Hermes/openclaw/opencode/pi 预设空但自定义可用
- openspec validate pass

## 6. 任务分解

详见 OpenSpec `tasks.md`（5 组 12 个任务）。
