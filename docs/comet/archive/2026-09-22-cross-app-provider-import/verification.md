---
generated_from_state_version: 27
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 3
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-09-22T11:24:13.876Z
- 摘要: verdict=pass: all of A1-A12 passed. The round-4 A9 write-side fix is correct (claude-desktop has a dedicated build branch and a patch-side guard; only claude/codex/gemini carry the model in both write paths, and the dialog uses the same predicate). The round-1 (A6 edit-mode write boundary), round-2 (Codex add-mode preset-then-import) and round-3 (A9 read side) fixes all still hold, verified per app with an out-of-repo scratch harness plus the full suite re-run by me (152 files / 1320 tests pass). Regression sweep clean: source filtering, both entry points, the 10 apps' field locations, wire_api staying 'responses', TOML writes through the repo's existing prefix-preserving helpers, the source settingsConfig never copied wholesale, no DB write, no live-config sync, no invoke( in the new files, src-tauri untouched, UniversalProvider and import_claude_desktop_providers_from_claude untouched, and the API key absent from DOM, console and toast. Five non-blocking risks are listed for human judgement rather than defects I can assert; the only thing not verifiable read-only is a real Tauri app click-through.

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: 新建供应商表单中，来源应用导入按钮出现在预设供应商区域内；按钮只对「已在设置中启用、该应用至少有 1 个供应商、且不是当前应用」的应用出现。 | Add mode passes the button row into the preset region via extraActions={importEntry} (src/components/providers/forms/ProviderForm.tsx:2305-2316); the slot renders inside the region, directly above the preset grid (src/components/providers/forms/ProviderPresetSelector.tsx:402); the three filter conditions live in src/components/providers/forms/hooks/useProviderImportSources.ts:35-41,85-92; the whole row is not rendered when there is no source (src/components/providers/forms/ProviderImportEntry.tsx:136); the other four forms are wired the same way. |
| A2 | passed | brief.md | A2: 编辑供应商表单中，同一组来源应用导入按钮出现在表单顶部的独立入口行。 | Edit mode renders the same button row at the top of the form (src/components/providers/forms/ProviderForm.tsx:2318-2322, and the other four forms at 935-940 / 495-500 / 240-245 / 1334-1339); add mode is gated on !initialData everywhere, so it cannot double-render. |
| A3 | passed | brief.md | A3: 点击来源应用按钮后弹出该应用的供应商列表，展示名称、备注与请求地址摘要，并展示本次将写入的字段；取消不改变表单任何字段。 | The dialog shows name, note (with a placeholder when empty) and the request-URL summary (with a placeholder when empty) (src/components/providers/forms/ProviderImportEntry.tsx:206-251); the 'will be written' list only lists fields that actually have a value (:91-105); cancelling only clears local state and never calls onImport (:277-281,71-79). |
| A4 | passed | brief.md | A4: 编辑模式下，弹窗明确提示导入会覆盖当前表单已填写的名称 / 备注 / 官网 / 密钥 / 请求地址。 | The isEditMode warning paragraph names all five fields (src/components/providers/forms/ProviderImportEntry.tsx:197-204) and overwriteWarning exists in all four locales; tests assert it is absent in add mode and present in edit mode. |
| A5 | passed | brief.md | A5: 选中来源供应商并确认后，表单的供应商名称、备注、官网链接、API Key、API 请求地址、默认模型名被替换为该来源供应商的对应值；`meta.apiFormat` 在来源取值属于目标应用支持集合时一并替换，否则保持目标应用默认值。 | src/components/providers/forms/hooks/useProviderImportApply.ts:70-108 replaces the identity fields and injects the mapped config; apiFormat is applied only when resolveImportedApiFormat returns a value, otherwise the target default is left alone (src/utils/providerImport.ts:227-235); three end-to-end assertions land on the real submitted payload. |
| A6 | passed | brief.md | A6: 导入不影响导入范围之外的表单状态：新建模式下预设选中态回到「自定义」；图标、第二个官网链接等保持导入前状态；编辑模式下 providerKey、模型表、Codex `modelCatalog`、Gemini 顶层 `config`、`env` / `options` / `auth` 中的其他键（含 Codex `auth.json` 的登录态键）全部原样存活。 | Edit mode uses in-place patches only: resetOpencodeState / resetOpenclawState / resetHermesState are all mode === 'add' gated; resetCodexConfig is passed the existing codexCatalogModels; resetGeminiConfig is passed the existing top-level config; grokbuild never touches profile / upstreamModel; pi keeps models + providerKey. I re-ran both write paths for all 10 targets to confirm. |
| A7 | passed | brief.md | A7: 保存出的供应商 `settingsConfig` 形状与目标应用原生新建一致（claude 写 `env.ANTHROPIC_BASE_URL` / `env.ANTHROPIC_AUTH_TOKEN`；codex 写 `auth.OPENAI_API_KEY` 与 TOML `base_url`，`wire_api` 恒为 `"responses"`；gemini 写 `env.GOOGLE_GEMINI_BASE_URL` / `env.GEMINI_API_KEY`；opencode 写 `options.baseURL` / `options.apiKey`；openclaw 写 `baseUrl` / `apiKey`；hermes 写 `base_url` / `api_key`；pi 写 `baseUrl` / `apiKey`；mcode 写 `options.baseURL` / `options.apiKey`；grokbuild 写 TOML `base_url` / `api_key`）。 | All 10 targets' write locations match the spec table item by item (src/utils/providerImport.ts:247-353); codex wire_api stays 'responses'; each app's add shape matches its own custom default. |
| A8 | passed | brief.md | A8: 来源供应商缺少某项字段（无备注、无官网链接、无 Key、无地址）时，对应表单字段留空，不写入 `undefined`、占位文本或 `null`。 | Missing values become '' and the write side either skips the key (claude/claude-desktop/pi) or deletes it (setOrDelete, :358-365) or writes an empty string per template; gemini's envObjToString drops empty env keys, so GEMINI_MODEL:'' never reaches the DB. |
| A9 | passed | brief.md | A9: 默认模型名只在 claude / codex / gemini 三者间迁移（读侧与写侧都受限，新建与编辑两条写路径对同一目标的字段集合必须一致）；来源或目标没有该字段时目标模型字段留空（Codex 删掉模板自带的 `model` 行，不填占位模型）。 | Both write paths write the model only for claude/codex/gemini; claude-desktop has a dedicated branch (:260-265) plus a patch-side if (targetAppId === 'claude') guard (:400-402); grokbuild does not write upstreamModel (:292-299); the read side returns '' for 7 apps; the dialog uses the same predicate (src/components/providers/forms/ProviderImportEntry.tsx:103); codex deletes the template model line when the source has no model (src/utils/providerConfigUtils.ts:1422-1428). Verified by running both directions for all 10 targets in an out-of-repo scratch harness. |
| A10 | passed | brief.md | A10: 各来源 × 目标应用组合的读写映射有单元测试覆盖，至少包含 claude↔codex、claude↔gemini、codex↔claude、opencode↔claude、hermes↔codex 五组方向，以及全部 10 个应用的读取用例；编辑模式的就地覆盖路径对每个目标应用都有「保留范围外键」的断言。 | Read cases exist for all 10 apps; the five directions are covered (claude<->codex, claude<->gemini, codex->claude, opencode->claude, hermes->codex); each of the 10 targets has a 'preserves out-of-scope keys' assertion. The assertions are non-vacuous: reverting either round-4 fix makes them fail. |
| A11 | passed | brief.md | A11: API Key 不出现在弹窗 DOM、console 日志与 toast 中（弹窗只展示地址与名称摘要）。 | The dialog renders only name, note, URL summary and field labels; the import path emits no toast; the new code has only two console.error calls printing API error objects, which contain no provider data. |
| A12 | passed | brief.md | A12: 既有 `tests/components/ProviderPresetSelector.test.tsx`、`tests/components/AddProviderDialog.test.tsx`、`tests/components/EditProviderDialog.test.tsx` 用例不回归。 | I re-ran the full suite: 152 files / 1320 tests pass; tests/components/ProviderPresetSelector.test.tsx is purely additive and asserts the slot does not pollute the preset list; AddProviderDialog (7) and EditProviderDialog (11) pass on their own. |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm test:unit | test:unit | . | passed | 0 | 32987 ms |
| pnpm typecheck | typecheck | . | passed | 0 | 8663 ms |
| pnpm format:check | format:check | . | passed | 0 | 3069 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — tsc --noEmit 无输出
- pnpm format:check: passed — prettier --check 全部符合
- pnpm test:unit: passed — 152 文件 / 1320 用例全通过；tests/utils/providerImport.test.ts 增至 43（claude-desktop 模型守卫 + 7 个无模型字段目标一次跑遍），tests/components/ProviderForm.crossAppImport.test.tsx 增至 9（gemini 端到端）
- 已知限制: 导入只预填表单，没有在真实 app 里手点验证过（需要 pnpm tauri dev 人工确认）。
- 已知限制: claude 新建模式下若配置了通用配置片段，选中过预设再导入会把片段合并进导入后的配置（新增键而非清空，属表单既有行为），无片段的绝大多数用户不受影响。
- 已知限制: 编辑模式没有独立的二次确认框，只在弹窗内用一行警示说明会覆盖哪些字段。
- 已知限制: opencode / mcode / openclaw / hermes 的 base URL 写入沿用各表单既有入口的尾斜杠归一化；claude / codex / gemini / pi / grokbuild 的地址按原样复制。
- 已知限制: 每个供应商表单挂载时会拉取一次 settings 与各已启用应用的供应商列表；刻意不用 react-query，因为若干表单测试直接 render 而不挂 QueryClientProvider。

## 阻塞项

_无。_

## 风险与跳过的工作

- Verbatim address copying vs form-side normalization: the spec says no trailing-slash stripping, but opencode (src/components/providers/forms/hooks/useOpencodeFormState.ts:139), openclaw (useOpenclawFormState.ts:124), hermes (useHermesFormState.ts:143) and claude-desktop (ClaudeDesktopProviderForm.tsx:812-816) pass the URL through a trailing-slash-stripping input handler. The mapping layer and the visible input stay verbatim; only the persisted config is normalized — consistent with manual entry, and disclosed in the Builder's known_limits.
- The opencode add shape lacks options.setCacheKey:true and name, which its own template has (src/components/providers/forms/helpers/opencodeFormUtils.ts:35-47). All keys A7 enumerates are present.
- codex edit mode: importing with no source model deletes the TOML model line, but the existing backfill logic at save time writes the first modelCatalog row back (src/components/providers/forms/ProviderForm.tsx:1567-1575). The import layer behaves correctly.
- Test fragility: tests/components/ProviderImportEntry.test.tsx:127 relies on name: "common.cancel", a bare i18n key that only resolves because the test harness loads no translation bundle. The assertion is non-vacuous today but will break if the harness ever loads real copy.
- tests/components/ProviderForm.crossAppImport.test.tsx:451 is named 'after a preset was selected first' but does not select a preset; it only proves gemini's ordinary import-then-save path.

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | 撤回本轮候选：Builder 交接在提交时误用了占位文案（summary=probe、仅列 A1），正式产物与实现均已完成且检查通过，需要回到 Build 重新提交正确的交接供独立验收读取。 | 2026-09-22T09:02:27.511Z |
| 1 | 2 | 1 | recovery | — | Observed implementation write before src/utils/providerImport.ts | 2026-09-22T09:06:34.604Z |
| 1 | 3 | 0 | recovery | — | Native confirmed acceptance criteria changed | 2026-09-22T09:37:32.617Z |
| 2 | 1 | 1 | recovery | — | Observed implementation write before src/components/providers/forms/ProviderForm.tsx | 2026-09-22T10:10:41.575Z |
| 2 | 2 | 0 | recovery | — | Native check input changed after the candidate was built; a new Builder candidate is required before checks can run again. | 2026-09-22T10:18:54.089Z |
| 2 | 3 | 1 | recovery | — | Observed implementation write before src/utils/providerImport.ts | 2026-09-22T10:37:04.613Z |
| 2 | 4 | 0 | recovery | — | Native confirmed acceptance criteria changed | 2026-09-22T10:39:03.785Z |
| 3 | 1 | 1 | pass | — | verdict=pass: all of A1-A12 passed. The round-4 A9 write-side fix is correct (claude-desktop has a dedicated build branch and a patch-side guard; only claude/codex/gemini carry the model in both write paths, and the dialog uses the same predicate). The round-1 (A6 edit-mode write boundary), round-2 (Codex add-mode preset-then-import) and round-3 (A9 read side) fixes all still hold, verified per app with an out-of-repo scratch harness plus the full suite re-run by me (152 files / 1320 tests pass). Regression sweep clean: source filtering, both entry points, the 10 apps' field locations, wire_api staying 'responses', TOML writes through the repo's existing prefix-preserving helpers, the source settingsConfig never copied wholesale, no DB write, no live-config sync, no invoke( in the new files, src-tauri untouched, UniversalProvider and import_claude_desktop_providers_from_claude untouched, and the API key absent from DOM, console and toast. Five non-blocking risks are listed for human judgement rather than defects I can assert; the only thing not verifiable read-only is a real Tauri app click-through. | 2026-09-22T11:24:13.876Z |



## 结论

verdict=pass: all of A1-A12 passed. The round-4 A9 write-side fix is correct (claude-desktop has a dedicated build branch and a patch-side guard; only claude/codex/gemini carry the model in both write paths, and the dialog uses the same predicate). The round-1 (A6 edit-mode write boundary), round-2 (Codex add-mode preset-then-import) and round-3 (A9 read side) fixes all still hold, verified per app with an out-of-repo scratch harness plus the full suite re-run by me (152 files / 1320 tests pass). Regression sweep clean: source filtering, both entry points, the 10 apps' field locations, wire_api staying 'responses', TOML writes through the repo's existing prefix-preserving helpers, the source settingsConfig never copied wholesale, no DB write, no live-config sync, no invoke( in the new files, src-tauri untouched, UniversalProvider and import_claude_desktop_providers_from_claude untouched, and the API key absent from DOM, console and toast. Five non-blocking risks are listed for human judgement rather than defects I can assert; the only thing not verifiable read-only is a real Tauri app click-through.
