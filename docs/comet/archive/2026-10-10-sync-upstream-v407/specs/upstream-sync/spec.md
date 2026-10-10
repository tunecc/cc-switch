# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch main 之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.7 发布头（tag v4.0.7 = 790ed800），fork 版本号为 4.0.7-1。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.7-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q2 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 790ed800（tag v4.0.7 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == 790ed800；`git log v4.0.7..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 131 个 fork 提交（c2611266..main）按原顺序重放，外加本次同步提交与归档提交（见「重放映射」）。
- 上游 v4.0.7 之后有 2 个 post-release 提交（`0b8662a4` fix(i18n)：额度帮助与备份提示文案对齐 UI 标签；`1f786dad` docs(release)：扩充 v4.0.7 notes 的 Codex 会话压缩段落），按 Q1 决定（2026-10-10 选 A）不在本轮范围，留待下次同步。
- 同步前起点由安全分支 `pre-sync-v407`（= e26fba04）固定记录，用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- rebase 一趟完成，共 2 次冲突停车、全部解决后 `Successfully rebased and updated refs/heads/main`：同步前 `c2611266..main` 的 131 个 fork 提交全部按原顺序重放，rebase 结束后 `git rev-list --count v4.0.7..main` == 131，与重放前逐条一致——无空提交被丢弃、无重复落地、无 git 段错误。`git merge-base main upstream/main` == 790ed800；`git log --format=%an v4.0.7..main | sort -u` 只有 Tune（fork 作者），无任何上游提交落在区间内。
- 提交主题序列逐行 diff：重放前 131 条主题与重放后完全一致（无遗漏、无重复、无顺序变化）。
- patch-id 对照：131 个提交中 127 个 patch-id 与重放前完全相同，4 个不同。这 4 个中 2 个对应本轮冲突解决点，2 个是同一冲突文件的上下文位移，逐条见下；无一属于「fork 语义丢失」。
- 冲突清单（2 处，按 rebase 顺序）：
  1. 原 `34903ffd`（fork 首个版本号提交，2/131）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（新基线 4.0.7 vs fork 侧历史版本号 3.20.2-fork.1）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容（不对整文件 `--theirs`）。同提交还带着 `tailwindcss-animate` 的删除与 `codegen-units = 1` 的改动，经核对属该提交原始意图（后续 fork 提交 `bf493650` 会加回 tailwindcss-animate），非误删；`Cargo.toml` 的 `[profile.release]` 段与上游 v4.0.7 新增的 windows-sys 两个 feature 在解决后并存。
  2. 原 `51e70a35`（移除旧 stream_check 链路，74/131）：`src-tauri/Cargo.lock` 一段 `cc-switch` 版本号 → 取 fork 侧值。同提交带走的 `tauri-plugin-updater` 及其依赖子树（minisign-verify、osakit、tar、xattr、zip 4.6.1、rustls-platform-verifier 等）属 fork 关闭自动更新的既定结果；解决后全文件 `tauri-plugin-updater` 命中数为 0。
- 4 个 patch-id 不一致的提交：`9aaa5747a`(34903ffdd)、`83a9d90d9`(51e70a357) 对应上述两个冲突点；`5ead2cca9`(eae895d5d) 与 `e15f79bc5`(cde885645) 是上下文位移——前者的 hunk 头行号因上游 `quota_display` 字段插入 `Default for AppSettings` 而后移 4 行、并把 `quota_display: None,` 变成上下文行（新增行本身逐字节相同）；后者因上游改写 `McodeProviderForm.tsx`（`mergeOpencodeExtraOptionRows`）与 4 个 locales 而导致 blob index 与 hunk 行号变化（新增行本身逐字节相同）。两者均已用 `diff <(git show <old>) <(git show <new>)` 逐行核对，只有 hunk 头与 index 行不同，无语义变化。
- fork 历史自带未清理的冲突标记：原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` blob 里本来就有 `<<<<<<< HEAD ... >>>>>>> 795d8a12`（要靠后续 fork 提交 `24febbfb`、`c3d2f317` 才清掉）。因此重放中途出现这两处标记属 fork 历史既有事实，不是本次同步缺陷；`git diff --cached --check` 会报 "leftover conflict marker"，此时不能据此判定同步失败。重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验。最终态全树 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 为 0 命中（已验证）。
- 落地保真核对（24 个上游/fork 重叠文件，A12）：20 个完全对称（上游新增行缺失 0、上游删除行缺失 0、fork 新增行缺失 0、fork 删除行缺失 0），含 `commands/misc.rs`、`commands/settings.rs`、`database/schema.rs`、`database/tests.rs`、`lib.rs`、`forwarder.rs`、`services/mod.rs`、`settings.rs`、`tray.rs`、`App.tsx`、`McodeProviderForm.tsx`、`SettingsPage.tsx`、`GeneralSection.tsx`、`piProviderPresets.ts`、4 个 locales、`lib/api/settings.ts`、`types.ts`。4 个差异全部对应刻意取舍：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 是 fork 版本号 `4.0.7-1`（上游写 `4.0.7`），只差版本号一行，与 v4.0.6 轮同类。
- 上游功能落地抽查（与上游 v4.0.7 逐文件比对）：`src-tauri/src/codex_rollout_file.rs`、`src-tauri/src/services/codex_session_compression.rs`、`src/components/quota/useQuotaDisplay.ts`、`src/components/settings/SettingsLayout.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`src/components/providers/forms/helpers/opencodeFormUtils.ts`、`src/whats-new/4.0.7.json`、`docs/release-notes/v4.0.7-*.md`、`CHANGELOG.md` 均随上游落地（会话压缩、额度已用、应用配置定位、额外选项类型保持等）。
- `.comet/config.yaml` 未被历史重放改写（重放后 blob 与同步前同为 `cebdcda66dbdcfde8b8de9331650753fb138b223`，内容仍为 `default_workflow: native` + `workflows: [native, classic]`）。
- 本轮无新增 fork 专属代码文件，白名单表只修订共享文件的叠加语义条目，并新增 5 行（`src-tauri/src/database/schema.rs`、`src-tauri/src/database/tests.rs`、`src-tauri/src/services/mod.rs`、`src/components/settings/SettingsPage.tsx` 由白名单转共享文件表、`src/components/providers/forms/McodeProviderForm.tsx`、`src/config/piProviderPresets.ts` 由「仅上游改动」进入共享文件表）。
- 同步提交（`chore: sync fork with upstream v4.0.7`）：版本号 4.0.6-1 → 4.0.7-1（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`，`Cargo.lock` 由 `cargo check` 联动）、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订（11 处 v4.0.7 语义）、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v407`）：change 目录移入 `docs/comet/archive/<date>-sync-upstream-v407`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。

### 同步范围

- 上游新增提交：merge-base c2611266 → 790ed800（v4.0.7 tag），共 22 个提交、108 个文件、约 +4962/−371 行，覆盖 v4.0.7 全部发布内容：
  - `3e566a3b` fix(pi)：火山 Agent Plan 改用自己端点（`/api/plan/v3`）并新增「火山 Coding Plan」预设（原「火山Agentplan」改名并拆分，`partnerPromotionKey` 改 `volcengine_codingplan`）。文件：`src/config/piProviderPresets.ts`（+32/−）、`src/config/mcodeProviderPresets.test.ts`、`tests/config/piProviderPresets.test.ts`。
  - `ef24a019` test(codex)：WSL 临时目录跳过 thread version SQLite fixture。文件：`src-tauri/src/services/provider/codex_official_models.rs`。
  - `8641cd1d` feat(codex)：会话管理、用量统计与会话历史迁移都能读取压缩后的 rollout；「设置 → 应用配置 → Codex」新增「压缩 Codex 历史会话」开关并显示会话目录占用。文件：新增 `src-tauri/src/codex_rollout_file.rs`、`src-tauri/src/services/codex_session_compression.rs`；改 `src-tauri/src/codex_config.rs`、`codex_history_migration.rs`、`commands/settings.rs`、`lib.rs`（`mod codex_rollout_file` + 三个命令注册）、`services/backup_storage.rs`、`services/mod.rs`、`services/session_usage_codex.rs`、`session_manager/{mod,content}.rs`、`session_manager/providers/codex.rs`、`src/components/settings/CodexAuthSettings.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`src/lib/api/settings.ts`（+15 三个新绑定）、4 个 locales、`tests/components/CodexAuthSettings.test.tsx`。
  - `347c60c3` docs(aggregation)：中文聚合模式指南与三语手册补两个 Codex 常见问题（子 agent 换供应商后读不到任务、官方 5 小时额度用完后 `/model` 锁定 Luna Reserve）。文件：`docs/guides/aggregation-mode-guide-zh.md`、`docs/user-manual/{zh,en,ja}/4-proxy/4.6-aggregation.md`。
  - `f264ce62` fix(codex) + `0fc67c3b` fix(codex)：过期客户端检测移出聚合 Stack 视图；Windows 无进程表时按 Codex 后台服务记录的进程号判断运行状态，新增 `acknowledge_codex_stale_clients` 命令。文件：`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/codex_client_catalog.rs`、`src-tauri/src/commands/proxy.rs`（+13）、`src-tauri/src/lib.rs`（命令注册 +1）、`src-tauri/Cargo.toml`（windows-sys 增加 `Win32_Foundation` 与 `Win32_System_Threading`）、`src/components/providers/CodexStaleClientsNotice.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/lib/api/proxy.ts`、`src/lib/query/proxy.ts`、`src/types/proxy.ts`、4 个 locales、`tests/components/{CodexStaleClientsNotice,SwitchModePanel}.test.tsx`、`tests/msw/handlers.ts`。
  - `533055bb` fix(usage)：Claude 1 小时缓存写入按 1h 单价（输入价 2 倍）计费，不再按 5 分钟（1.25 倍）少算。文件：`src-tauri/src/proxy/response_processor.rs`、`proxy/usage/{calculator,logger,parser}.rs`、`services/session_usage{,_codex,_gemini,_grokbuild,_mcode,_opencode,_pi}.rs`。
  - `3da322eb` feat(pricing)：内置定价表补 Claude Sonnet 5.5（缓存读 0.05x = $0.10）与 Haiku 5.5（10 万 token 以内标准档）。文件：`src-tauri/src/database/schema.rs`（+20）、`src-tauri/src/database/tests.rs`（+38 新用例 `model_pricing_seed_includes_claude_sonnet_5_5_and_haiku_5_5`）。
  - `4bbdbcdd` fix(usage)：Codex 会话 rollout 导入缓存写入 token。文件：`src-tauri/src/services/session_usage_codex.rs`、`usage_stats.rs`。
  - `a0be6456` fix(usage)：同一供应商在多个应用都配置过时，用量统计行保持独立。文件：`src-tauri/src/services/usage_stats.rs`、`src/components/usage/ProviderStatsTable.tsx`、`src/types/usage.ts`、`tests/components/{ProviderStatsTable,UsageDashboard.smoke,UsageDashboard}.test.tsx`。
  - `2625bcf1` fix(opencode)：编辑额外选项时未改过的值类型保持原样，改名不能改成已有名字。文件：`src/components/providers/forms/McodeProviderForm.tsx`（内联合并逻辑改为 `mergeOpencodeExtraOptionRows`）、`OpenCodeFormFields.tsx`、`helpers/opencodeFormUtils.ts`、`hooks/useOpencodeFormState.ts`、`tests/components/{McodeProviderForm,OpenCodeFormFields}.test.tsx`、`tests/hooks/useOpencodeFormState.test.tsx`。
  - `00db3eef` fix(openclaw)：切换 User-Agent 时只改该项，保留其他自定义请求头。文件：`src/components/providers/forms/hooks/useOpenclawFormState.ts`、新增 `tests/components/ProviderForm.openclawHeaders.test.tsx`、`tests/hooks/useOpenclawFormState.test.ts`。
  - `5667b287` fix(usage)：`cache_read_input_tokens` 显式为 0 时继续看 `prompt_cache_hit_tokens`。文件：`src-tauri/src/proxy/providers/{streaming,transform,transform_codex_chat}.rs`、`proxy/usage/parser.rs`。
  - `eda410e5` feat(settings)：从应用页「配置目录」进入时设置页滚动到该应用条目并闪烁高亮两次，用户接管即停止，减少动态效果时直接跳转。文件：`src/App.tsx`（+17/−，`appConfigScrollTarget` state 与 `openSettings(section, appConfigTarget)`）、`src/components/settings/SettingsPage.tsx`（+130/−，`appConfigScrollTarget` prop 与定位 effect）、`src/components/settings/SettingsLayout.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`tests/components/SettingsDialog.test.tsx`。
  - `84457b51` fix(codex)：保存供应商时把 `config.toml` 顶层 base_url 整理进 `[model_providers.custom]`，表单不再生成顶层写法。文件：`src-tauri/src/live/project/codex.rs`、`services/provider/codex_editor.rs`、`src/utils/providerConfigUtils.ts`、`tests/utils/providerConfigUtils.codex.test.ts`。
  - `69dbb307` fix(i18n)：「统一 Codex 会话历史」说明只针对 Codex CLI。文件：4 个 locales。
  - `e06ba573` fix(windows)：生成的批处理文件不含非 ASCII 路径（升级脚本自带 UTF-8 代码页切换，「打开终端」不切）。文件：`src-tauri/src/commands/misc.rs`（+112/−）。
  - `e5b1e096` fix(codex)：按「用户 + 工作区」认 Codex 官方登录，暂存登录信息同口径；升级后自动整理暂存信息。文件：`src-tauri/src/services/provider/{codex_direct,codex_login}.rs`。
  - `b7d548b6` feat(quota)：额度百分比可显示「已用」（`quota_display`，默认「剩余」），供应商卡片、授权中心和托盘一起变；余额、Credits、重置次数仍显示剩余；颜色与提醒仍按剩余算。文件：`src-tauri/src/settings.rs`（`quota_display` 字段 + `quota_shows_used()` + normalize）、`src-tauri/src/tray.rs`（+56/−）、新增 `src/components/quota/useQuotaDisplay.ts`、改 `src/components/quota/{QuotaLines,quotaRules}.ts`、`src/components/{UsageFooter,SubscriptionQuotaFooter,CodexOauthQuotaFooter,CodexOauthAccountQuota,CopilotQuotaFooter,XaiOauthQuotaFooter}.tsx`、`src/components/settings/auth/AccountQuota.tsx`、`src/components/settings/sections/GeneralSection.tsx`（+27 额度显示开关行）、`src/types.ts`（+2）、4 个 locales、`tests/components/SubscriptionQuotaFooter.test.tsx`、`tests/components/quotaRules.test.ts`。
  - `e049660a` fix(codex)：旧的第三方会话在官方供应商下继续时，报错说明需新开会话，仅在确实未重读配置时才提示重启。文件：`src-tauri/src/proxy/forwarder.rs`（+10/−）。
  - `fda103e9` chore(release) v4.0.7：4 个版本文件 + `CHANGELOG.md`；`790ed800` docs(release)：`docs/release-notes/v4.0.7-{zh,en,ja}.md`、`src/whats-new/4.0.7.json`。
- 不做部分 cherry-pick：同步范围是 v4.0.7 tag 前的全量新增提交，一次 rebase 完成。
- 上游本轮在 `docs/user-manual/**` 与 `docs/guides/**` 更新的文档不在 fork 白名单，随上游落地。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 24 个文件：4 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/database/schema.rs`、`src-tauri/src/database/tests.rs`、`src-tauri/src/services/mod.rs`、`src-tauri/src/proxy/forwarder.rs`）、前端共享文件（`src/App.tsx`、`src/components/providers/forms/McodeProviderForm.tsx`、`src/components/settings/SettingsPage.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/config/piProviderPresets.ts`、`src/lib/api/settings.ts`、`src/types.ts`）、4 个 i18n locales。
- 相对 v4.0.6 轮新增进入共享文件表的 4 个文件及其叠加要求：
  - `src-tauri/src/database/schema.rs`：以上游 Sonnet 5.5 / Haiku 5.5 两行定价种子（+20）为基础；叠加 fork 侧既有改动——`providers` 建表的 `website_url_2` 列、`migrate_v18_to_v19` 与 `add_column_if_missing` 兜底、fork 定价种子段。两侧必须并存，不得因取上游侧丢掉 fork 列定义。
  - `src-tauri/src/database/tests.rs`：以上游新用例 `model_pricing_seed_includes_claude_sonnet_5_5_and_haiku_5_5`（+38）为基础；叠加 fork 侧 v20→v21 修复迁移测试与其余既有改动。注意 fork 历史提交 `4b437070` 曾在该文件 blob 内留下未清理冲突标记（靠后续 fork 提交清掉），最终态必须零冲突标记。
  - `src/components/providers/forms/McodeProviderForm.tsx`：以上游把额外选项内联合并逻辑改为 `mergeOpencodeExtraOptionRows(options, draft)` 为基础（`isKnownOpencodeOptionKey` 与 `OPENCODE_EXTRA_OPTION_DRAFT_PREFIX` 两个导入被删）；叠加 fork 的跨应用导入接线（`ProviderImportEntry` 导入、`useProviderImportApply`/`useProviderImportSources`、`importSources`/`handleProviderImport`/`importEntry` 与两处渲染、`useCallback` 导入）。解法是保留上游的新 helper 调用，同时保留 fork 的导入块与接线块；两边导入块取并集。
  - `src/components/settings/SettingsPage.tsx`：以上游 `appConfigScrollTarget` prop 与定位 effect（+130）为基础；叠加 fork 的 DevPanel——`IS_FORK_BUILD`/`DEV_PANEL_ENABLED` 导入、`devPanelOpen` state、about 分组末尾的 Fork 按钮、文件末尾的 `<DevPanel>` 挂载。上游还在本文件加了 `isTextEditableTarget` 导入与 `hasSettings` 常量，均属上游侧照常落地。
- 仅上游改动、无 fork 改动的文件直接落上游版本：`src-tauri/src/codex_rollout_file.rs`（新）、`src-tauri/src/services/codex_session_compression.rs`（新）、`src-tauri/src/codex_config.rs`、`codex_history_migration.rs`、`services/backup_storage.rs`、`services/session_usage_codex.rs`、`session_manager/**`、`commands/proxy.rs`、`mode/{controller,stack}.rs`、`live/project/codex.rs`、`services/provider/{codex_client_catalog,codex_direct,codex_login,codex_editor}.rs`、`proxy/response_processor.rs`、`proxy/usage/**`、`proxy/providers/{streaming,transform,transform_codex_chat}.rs`、`services/usage_stats.rs`、`services/session_usage*.rs`、`src/components/quota/useQuotaDisplay.ts`（新）、`src/components/quota/{QuotaLines,quotaRules}.ts`、`src/components/{UsageFooter,SubscriptionQuotaFooter,CodexOauthQuotaFooter,CodexOauthAccountQuota,CopilotQuotaFooter,XaiOauthQuotaFooter}.tsx`、`src/components/settings/auth/AccountQuota.tsx`、`src/components/settings/SettingsLayout.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`src/components/providers/CodexStaleClientsNotice.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/components/providers/forms/{OpenCodeFormFields.tsx,helpers/opencodeFormUtils.ts,hooks/useOpencodeFormState.ts,hooks/useOpenclawFormState.ts}`、`src/components/usage/ProviderStatsTable.tsx`、`src/types/usage.ts`、`src/types/proxy.ts`、`src/lib/api/proxy.ts`、`src/lib/query/proxy.ts`、`src/utils/providerConfigUtils.ts`、`CHANGELOG.md`（fork 在本轮区间未改动）、`docs/guides/**`、`docs/release-notes/v4.0.7-*.md`、`docs/user-manual/**`、`src/whats-new/4.0.7.json`、上游新增与更新的测试。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游 v4.0.7 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：以上游本轮 `mod codex_rollout_file`、三个 Codex 会话压缩命令注册与 `acknowledge_codex_stale_clients` 注册（共 +5）为基础；叠加并保持 fork —— 移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册；不得因重放复活 updater 链路。
  - `src-tauri/src/tray.rs`：以上游本轮额度「已用/剩余」显示改动（+56/−）为基础；叠加 fork 的左键单击切换逻辑（`toggle_main_window` 与左键 Up 分支）。此文件连续多轮是「最容易整文件取一侧而丢语义」的点，解完冲突后必须逐行复核合并结果。
  - `src-tauri/src/settings.rs`：以上游 `quota_display` 字段（`#[serde(default, skip_serializing_if)]`）、`Default` 一行、`quota_shows_used()` 访问器与 normalize 过滤段（+17）为基础；叠加 fork 的 `VisibleSidebarPanels` 结构 + `AppSettings.visible_sidebar_panels` 字段段，并保留 v4.0.6 起的 `show_provider_search` 与 `codex_stack_classic_subagents`。
  - `src-tauri/src/commands/settings.rs`：以上游 Codex 会话压缩三个命令的落库与失败回滚（+31）为基础；叠加 fork 侧既有改动——移除 `install_update_and_restart` 的下载安装实现（保留命令接口兼容旧前端）、移除 `tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构、`Emitter` 导入相应调整。两侧必须并存，不得因取上游侧而复活 updater 链路；解完必须 grep `updater_builder`。
  - `src-tauri/src/commands/misc.rs`：以上游批处理文件去非 ASCII 路径的改动（+112/−）为基础；保持 fork 的连通性测试命令注册与 `connectivityTest` sanitize 隔离。
  - `src-tauri/src/services/mod.rs`：以上游 `pub mod codex_session_compression;`（+1）为基础；fork 侧同文件的既有模块声明照常保留。
  - `src-tauri/src/proxy/forwarder.rs`：以上游旧第三方会话报错说明的改动（+10/−）为基础；叠加 fork 的 connectivityTest sanitize 隔离与测试里 Provider 字面量的 `website_url_2: None`。上游测试区若重构，取上游侧后必须确认 `test_provider_with_type()` 内仍带 `website_url_2: None`，否则 `cargo test` 编译失败。
  - `src/App.tsx`：以上游 `appConfigScrollTarget` state、`openSettings(section, appConfigTarget)` 两参数化、`appConfig` 菜单项传 `activeApp`、`SettingsPage` 新 prop、`onSelectSettingsSection` 清空 target（+17/−）为基础；叠加 fork 的批量连通性探针状态提升（useConnectivityProbe）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、托盘同款 window-title 守卫、`IS_FORK_BUILD` + `isTauri` 双守卫下的 `setTitle` useEffect。lucide 导入块与 JSX 按钮块按需取并集，禁止按行去重。
  - `src/components/providers/forms/McodeProviderForm.tsx`：见上「新增进入共享文件表」条目。
  - `src/components/settings/SettingsPage.tsx`：见上「新增进入共享文件表」条目。
  - `src/components/settings/sections/GeneralSection.tsx`：以上游「额度显示」（剩余/已用）开关行（+27）为基础；叠加 fork 的侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest），并保留 v4.0.6 起的「显示供应商搜索」开关行。三段开关行并存，不得整段取成单侧。
  - `src/config/piProviderPresets.ts`：以上游火山 Agent Plan / Coding Plan 预设改写（+32/−）为基础；fork 的预设接口 `hidden?: boolean` 字段段（本轮 fork 在该文件只加这 2 行）照常生效（上游预设是否可见由 fork 白名单决定，不要手工放开）。
  - `src/lib/api/settings.ts`：以上游三个 Codex 会话压缩命令绑定（`getCodexSessionCompression`/`setCodexSessionCompression`/`getCodexSessionsDiskUsage`，+15）为基础；叠加 fork 侧移除的 `installUpdateAndRestart()`（fork 关闭应用内更新器，该方法不得复活）。
  - `src/types.ts`：以上游 `quotaDisplay` 类型（+2）为基础；叠加 fork 的 `websiteUrl2`、`VisibleSidebarPanels`、`showProviderSearch`、`codexStackClassicSubagents` 等类型段。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游新增键（额度显示、Codex 会话压缩、过期客户端检测、应用配置定位、会话历史说明收窄等）与删改键按上游执行；保留 fork 的 `devpanel` 段与 `connectivityTest` / `connectivityCheck` 等 fork 键段，合并后 fork 键不得缺失。
  - 5 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 取 fork 版本号 4.0.7-1（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）；`pnpm-lock.yaml` 与 `src-tauri/Cargo.lock` 以上游依赖变动为基础，只针对 fork 专属条目取 fork 侧（`@tauri-apps/plugin-updater` 的 specifier / resolution / snapshot 三段，`cc-switch` 包版本号）。`Cargo.toml` 的 windows-sys 两个新 feature 取上游。收尾用 `pnpm install` 与 `cargo check` 复验：两者都报告锁文件未被改写，才算与 `package.json` / `Cargo.toml` 一致。
  - `README.md`：保留 fork 重写版（上游 v4.0.7 未改该文件）。
  - `.github/workflows/release.yml`：保留 fork 裁剪版（上游 v4.0.7 未改该文件）。
- 本轮 fork 侧未改动的共享文件随上游与重放自然落地，fork 语义保持既有状态。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.7 仍为 20，发行说明明确「数据库结构没有变化」）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 上游 v4.0.7 未改动 `src-tauri/src/database/mod.rs`，本轮不新增迁移步骤；`schema.rs` 的改动只是定价种子表加两行模型，不动迁移链。后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。同步前该文件 blob 为 `cebdcda66dbdcfde8b8de9331650753fb138b223`。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- Shape 确认后编辑 brief 或 spec 会触发 Native Shape recovery：用同一个 summary 重新执行 prepare-shape-confirmation，再 `--confirmed` 回到 Build，然后原样重交 builder-handoff（candidateId 不变，Runtime 检查回执仍有效）。`acceptance_review.status` 合法值是 `implemented-with-evidence` 且 evidence 必须非空。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- Builder 交接的检查计划字段须用 Runtime 形态 `{id,name,executable,argv,cwdRef,timeoutMs,repeatable}`；`executable` 只写程序名，不要把程序名同时塞进 `argv[0]`。
- 重放中途不能跑 `cargo test`：fork 历史提交 `4b437070` 的两个 blob 自带未清理冲突标记，只有最终态才可编译校验。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡。
- fork 发版 tag 推送事件偶发丢失：推送后若 Actions 零排程，先取证（`git ls-remote`、`/actions/permissions`、workflows state、releases 资产数、check-suites、events），确认后删远端 tag 重推同一本地对象补触发；`release.yml` 的 concurrency 组 `cancel-in-progress: true`，不要连续并发重推。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.7-1`（同步前工作树为 4.0.6-1，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.7 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q2 明确授权，执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- Q2 已授权发布（2026-10-10 用户选择 A+B）：随后在归档提交上创建 annotated tag `v4.0.7-1` 并 `git push origin v4.0.7-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + `hidden` 字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册、`install_update_and_restart` 不执行安装）。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/settings.rs`（上游 `quota_display` + fork `visible_sidebar_panels`）、`src-tauri/src/commands/settings.rs`（上游 Codex 会话压缩命令落库 + fork 更新器命令移除）、`src-tauri/src/lib.rs`（上游 `codex_rollout_file` 模块与四个新命令注册 + fork 三段语义）、`src-tauri/src/tray.rs`（上游额度「已用」 + fork 左键切换）、`src-tauri/src/commands/misc.rs`（上游批处理去非 ASCII 路径 + fork 连通性测试）、`src-tauri/src/database/schema.rs`（上游 Sonnet 5.5/Haiku 5.5 定价种子 + fork `website_url_2` 列）、`src-tauri/src/database/tests.rs`、`src-tauri/src/services/mod.rs`、`src-tauri/src/proxy/forwarder.rs`、`src/App.tsx`（上游滚动定位 + fork 批量检测按钮块）、`src/components/settings/SettingsPage.tsx`（上游滚动定位 effect + fork DevPanel）、`src/components/settings/sections/GeneralSection.tsx`（上游额度显示开关行 + fork pill 行 + v4.0.6 搜索开关行）、`src/components/providers/forms/McodeProviderForm.tsx`（上游 `mergeOpencodeExtraOptionRows` 重构 + fork 跨应用导入接线）、`src/config/piProviderPresets.ts`（上游火山预设改写 + fork `hidden` 字段）、`src/lib/api/settings.ts`（上游三个新命令绑定 + fork 移除更新命令）、`src/types.ts`、4 个 locales、`README.md` 与 `.github/workflows/release.yml`（白名单保留 fork 侧，上游本轮未改动）、`CHANGELOG.md`（本轮 fork 侧无改动，取上游版本）、`src-tauri/Cargo.toml`（上游 windows-sys 新 feature + fork 版本号）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。
- 上游测试的零点窗口（既有实测记录，不改变任何验收要求）：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min / 1h / 3h / 4h / 5h` 构造会话，却断言存在「今天」分桶；本地时间落在 00:00–00:30 时 `now - 30min` 已属于前一天，该桶不存在，用例必然失败。同步过程中跨越零点时，遇到该单项失败先查时钟窗口再查实现，不要据此改动上游文件或放宽 A9。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不做部分 cherry-pick 式同步。
- 不同步 v4.0.7..upstream/main 的 2 个 post-release 提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q2 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路）。
- 不引入上游 Linux deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = e26fba04，安全分支 `pre-sync-v407` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q2 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
