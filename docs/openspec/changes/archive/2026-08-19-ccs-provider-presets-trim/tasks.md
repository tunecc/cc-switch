## 1. 白名单与过滤工具

- [x] 1.1 新增 `src/config/forkOfficialAllowlist.ts`，导出 `forkOfficialAllowlist: Record<string, string[]>`，含 claude→["Claude Official"]、codex→["OpenAI Official"]、gemini→["Google Official"]、grokbuild→["Grok Official"]、claude-desktop→["Claude Desktop Official"]、hermes/openclaw/opencode/pi→[]。注释说明按预设 `name` 精确匹配
- [x] 1.2 新增 `src/config/forkPresetFilter.ts`，导出 `filterForkPresets<T extends { name: string }>(appId: string, presets: T[]): T[]`：`IS_FORK_BUILD` 为 false 时原样返回；为 true 时按白名单过滤，白名单为空返回空数组。import `IS_FORK_BUILD` from `@/config/forkBuild`，import `forkOfficialAllowlist` from `@/config/forkOfficialAllowlist`

## 2. 预设接口补 hidden 字段

- [x] 2.1 为以下预设接口补 `hidden?: boolean` 字段（仅类型，不改数据）：`codexProviderPresets.ts`、`geminiProviderPresets.ts`、`grokBuildProviderPresets.ts`、`hermesProviderPresets.ts`、`openclawProviderPresets.ts`、`opencodeProviderPresets.ts`、`piProviderPresets.ts`、`claudeDesktopProviderPresets.ts`。claude 已有无需改

## 3. ProviderForm 过滤层接入

- [x] 3.1 修改 `src/components/providers/forms/ProviderForm.tsx` 的 `presetEntries` useMemo：各 app 分支（codex/gemini/opencode/openclaw/hermes/claude/claude-desktop）在构建 presetEntries 前调用 `filterForkPresets(appId, rawPresets)` 过滤。claude 分支保留现有 `!p.hidden` 过滤再叠加 fork 白名单（两者都生效）。确保 `appId` 传入正确（注意 claude-desktop 与 claude 的 appId 区分）
- [x] 3.2 修改 `src/components/providers/forms/GrokBuildProviderForm.tsx` 的 `grokPresetEntries`：保留 `GROKBUILD_OFFICIAL_PROVIDER_ID` + `grokBuildOfficialPreset` 官方条目，其余 `grokBuildProviderPresets` 经 `filterForkPresets("grokbuild", ...)` 过滤后再拼接
- [x] 3.3 修改 `src/components/providers/forms/PiProviderForm.tsx` 的 `presetEntries`：`piProviderPresets` 经 `filterForkPresets("pi", ...)` 过滤（白名单为空→返回空数组）

## 4. 验证

- [x] 4.1 运行 `pnpm typecheck` 通过
- [x] 4.2 运行 `pnpm test:unit` 通过，无回归（987/987 与基线一致；修复：setupTests.ts mock IS_FORK_BUILD=false 让表单测试在上游构建语义运行，避免 fork 过滤干扰 fixture）
- [x] 4.3 运行 `pnpm dev:fork`，巡检各 app 添加供应商对话框：Claude 仅显示 Claude Official；Codex 仅显示 OpenAI Official；Gemini 仅显示 Google Official；GrokBuild 仅显示 Grok Official；ClaudeDesktop 仅显示 Claude Desktop Official；Hermes/openclaw/opencode/pi 预设列表为空但自定义入口可用 — 用户本机巡检通过
- [x] 4.4 确认自定义添加供应商流程仍可用（至少在 Claude 与一个无官方 app 验证） — 用户本机巡检通过
- [x] 4.5 `comet classic openspec -- validate ccs-provider-presets-trim` 通过

## 5. 提交

- [x] 5.1 在 `feat/provider-presets-trim` 分支提交所有改动（commit message 遵循 conventional commits，如 `feat(fork): trim provider presets to official-only via allowlist`）。分逻辑提交（白名单+过滤工具 / 接口字段 / 过滤层接入 / 验证）— 已分 3 个提交：87a2008a（白名单+过滤工具）、3d0f18be（接口字段）、121c5a4c（过滤层接入）+ f87ff7a2（测试修复）
