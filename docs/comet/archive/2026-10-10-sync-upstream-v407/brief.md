# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.7 发布头（tag v4.0.7 = 790ed800），fork 侧 131 个魔改提交（c2611266..main）按原顺序重放保留，无丢失、无行为回归；版本号按惯例从 4.0.6-1 升为 4.0.7-1；验收通过并用户接受结果后，按 Q2 授权的交付方式上传 origin。

# Scope

- 把本地 main rebase 到 tag v4.0.7（790ed800）：当前 merge-base c2611266 → 目标 790ed800；fork 侧 131 个提交（c2611266..main，含上一轮的同步提交、v4.0.6 归档提交与其规格修正提交）按原顺序重放。
- 基线即上游 v4.0.7 发布头。upstream/main HEAD 1f786dad 及其父 0b8662a4 共 2 个 post-release 提交（v4.0.7..upstream/main：`0b8662a4` fix(i18n) 额度帮助与备份提示文案对齐 UI 标签、`1f786dad` docs(release) 扩充 v4.0.7 notes 的 Codex 会话压缩段落）不在本次范围，留待下次同步（按 Q1 决定）。
- 上游新增 22 个提交（v4.0.6..v4.0.7），共 108 个文件、约 +4962/−371 行。按主题分组：
  - `3e566a3b` fix(pi)：火山 Agent Plan 改用自己端点并新增「火山 Coding Plan」预设（`src/config/piProviderPresets.ts` +32/−、`src/config/mcodeProviderPresets.test.ts`、`tests/config/piProviderPresets.test.ts`）。该提交与 `ef24a019` 同属上一轮 v4.0.6 同步时被列为 post-release 的 2 个提交，本轮首次进入范围。
  - `ef24a019` test(codex)：WSL 临时目录跳过 thread version SQLite fixture（`src-tauri/src/services/provider/codex_official_models.rs`）。
  - `8641cd1d` feat(codex)：读取压缩后的会话 rollout 并新增会话压缩开关（新增 `src-tauri/src/codex_rollout_file.rs`、`src-tauri/src/services/codex_session_compression.rs`；改 `src-tauri/src/codex_config.rs`、`codex_history_migration.rs`、`commands/settings.rs`、`lib.rs`、`services/backup_storage.rs`、`services/mod.rs`、`services/session_usage_codex.rs`、`session_manager/{mod,content}.rs`、`session_manager/providers/codex.rs`、`src/components/settings/CodexAuthSettings.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`src/lib/api/settings.ts`、4 个 locales、`tests/components/CodexAuthSettings.test.tsx`）。
  - `347c60c3` docs(aggregation)：中文聚合模式指南与三语手册补两个 Codex 常见问题（`docs/guides/aggregation-mode-guide-zh.md`、`docs/user-manual/{zh,en,ja}/4-proxy/4.6-aggregation.md`）。
  - `f264ce62` fix(codex) + `0fc67c3b` fix(codex)：过期客户端检测移出聚合 Stack 视图、Windows 无进程表时按 Codex 后台服务记录的进程号判断并新增 `acknowledge_codex_stale_clients` 命令（`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/codex_client_catalog.rs`、`src-tauri/src/commands/proxy.rs`、`src-tauri/src/lib.rs`、`src-tauri/Cargo.toml` 的 windows-sys 两个新 feature、`src/components/providers/CodexStaleClientsNotice.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/lib/api/proxy.ts`、`src/lib/query/proxy.ts`、`src/types/proxy.ts`、4 个 locales、`tests/components/{CodexStaleClientsNotice,SwitchModePanel}.test.tsx`、`tests/msw/handlers.ts`）。
  - `533055bb` fix(usage)：Claude 1 小时缓存写入按 1h 单价计费（`src-tauri/src/proxy/response_processor.rs`、`proxy/usage/{calculator,logger,parser}.rs`、`services/session_usage{,_codex,_gemini,_grokbuild,_mcode,_opencode,_pi}.rs`）。
  - `3da322eb` feat(pricing)：内置定价表补 Claude Sonnet 5.5 与 Haiku 5.5（`src-tauri/src/database/schema.rs` +20、`src-tauri/src/database/tests.rs` +38）。
  - `4bbdbcdd` fix(usage)：Codex 会话 rollout 导入缓存写入 token（`src-tauri/src/services/session_usage_codex.rs`、`usage_stats.rs`）。
  - `a0be6456` fix(usage)：同一供应商跨应用的用量统计行保持独立（`src-tauri/src/services/usage_stats.rs`、`src/components/usage/ProviderStatsTable.tsx`、`src/types/usage.ts`、`tests/components/{ProviderStatsTable,UsageDashboard.smoke,UsageDashboard}.test.tsx`）。
  - `2625bcf1` fix(opencode)：编辑时未改过的额外选项值类型保持原样（`src/components/providers/forms/McodeProviderForm.tsx`、`OpenCodeFormFields.tsx`、`helpers/opencodeFormUtils.ts`、`hooks/useOpencodeFormState.ts`、`tests/components/{McodeProviderForm,OpenCodeFormFields}.test.tsx`、`tests/hooks/useOpencodeFormState.test.tsx`）。
  - `00db3eef` fix(openclaw)：切换 User-Agent 时保留其他自定义请求头（`src/components/providers/forms/hooks/useOpenclawFormState.ts`、新增 `tests/components/ProviderForm.openclawHeaders.test.tsx`、`tests/hooks/useOpenclawFormState.test.ts`）。
  - `5667b287` fix(usage)：显式为 0 的 OpenAI 缓存字段视为未上报（`src-tauri/src/proxy/providers/{streaming,transform,transform_codex_chat}.rs`、`proxy/usage/parser.rs`）。
  - `eda410e5` feat(settings)：从应用页「配置目录」进入时设置页滚动到该应用条目并闪烁高亮（`src/App.tsx` +17/−、`src/components/settings/SettingsPage.tsx` +130/−、`src/components/settings/SettingsLayout.tsx`、`src/components/settings/sections/AppConfigSection.tsx`、`tests/components/SettingsDialog.test.tsx`）。
  - `84457b51` fix(codex)：保存供应商时保留 `config.toml` 顶层 base_url（`src-tauri/src/live/project/codex.rs`、`services/provider/codex_editor.rs`、`src/utils/providerConfigUtils.ts`、`tests/utils/providerConfigUtils.codex.test.ts`）。
  - `69dbb307` fix(i18n)：统一 Codex 会话历史说明只针对 CLI（4 个 locales）。
  - `e06ba573` fix(windows)：生成的批处理文件不含非 ASCII 路径（`src-tauri/src/commands/misc.rs` +112/−）。
  - `e5b1e096` fix(codex)：按「用户 + 工作区」区分同一 OpenAI 账号的官方卡片（`src-tauri/src/services/provider/{codex_direct,codex_login}.rs`）。
  - `b7d548b6` feat(quota)：额度百分比可改为显示「已用」（`src-tauri/src/settings.rs` 新增 `quota_display` 字段与 `quota_shows_used()` 访问器、`src-tauri/src/tray.rs` +56/−、新增 `src/components/quota/useQuotaDisplay.ts`、改 `src/components/quota/{QuotaLines,quotaRules}.ts`、`src/components/{UsageFooter,SubscriptionQuotaFooter,CodexOauthQuotaFooter,CodexOauthAccountQuota,CopilotQuotaFooter,XaiOauthQuotaFooter}.tsx`、`src/components/settings/auth/AccountQuota.tsx`、`src/components/settings/sections/GeneralSection.tsx` +27、`src/types.ts` +2、4 个 locales、`tests/components/{SubscriptionQuotaFooter}.test.tsx`、`tests/components/quotaRules.test.ts`）。
  - `e049660a` fix(codex)：旧的第三方会话在官方供应商下继续时报错说明原因（`src-tauri/src/proxy/forwarder.rs` +10/−）。
  - `fda103e9` chore(release) + `790ed800` docs(release)：v4.0.7 版本号四文件 + `CHANGELOG.md`、`docs/release-notes/v4.0.7-{zh,en,ja}.md`、`src/whats-new/4.0.7.json`。
- 冲突面（上游与 fork 同时改动的文件，共 24 个）：4 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/database/schema.rs`、`src-tauri/src/database/tests.rs`、`src-tauri/src/services/mod.rs`、`src-tauri/src/proxy/forwarder.rs`）、前端共享文件（`src/App.tsx`、`src/components/providers/forms/McodeProviderForm.tsx`、`src/components/settings/SettingsPage.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/config/piProviderPresets.ts`、`src/lib/api/settings.ts`、`src/types.ts`）、4 个 i18n locales。
- 本轮相对 v4.0.6 轮新增的重叠文件 4 个：`src-tauri/src/database/schema.rs`（上游 +20 Sonnet 5.5/Haiku 5.5 定价；fork 侧同文件有 `website_url_2` 列与 v18→v19 迁移段）、`src-tauri/src/database/tests.rs`（上游 +38 定价种子用例；fork 侧同文件有 v20→v21 修复迁移测试与 21 处既有改动）、`src/components/providers/forms/McodeProviderForm.tsx`（上游重构额外选项合并；fork 侧有跨应用导入接线）、`src/components/settings/SettingsPage.tsx`（上游 +130 滚动定位；fork 侧有 DevPanel 入口与挂载）。`src/config/piProviderPresets.ts`、`src/components/settings/sections/GeneralSection.tsx`、`src-tauri/src/services/mod.rs`、`src-tauri/src/proxy/forwarder.rs` 上一轮已在表中。
- 数据库 schema：上游 v4.0.7 未推进 schema（`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 20，发行说明明确「数据库结构没有变化」）；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。上游本轮只往 `schema.rs` 的定价种子表加两行模型，不动迁移链。
- 版本号从 4.0.6-1 升到 4.0.7-1（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：§4 中与本次上游改动相关的叠加语义条目（`settings.rs` 的 `quota_display` 与 fork `visible_sidebar_panels`、`commands/settings.rs` 的会话压缩开关落库与 fork 更新器移除、`lib.rs` 的三个新命令注册与 fork 三段语义、`tray.rs` 的额度「已用」与 fork 左键切换、`database/schema.rs` 的定价种子与 fork `website_url_2`、`database/tests.rs`、`services/mod.rs`、`lib/api/settings.ts` 的三个新命令与 fork 移除更新命令、`App.tsx` 的滚动定位与 fork 批量检测按钮块、`SettingsPage.tsx` 的滚动定位与 fork DevPanel、`GeneralSection.tsx` 的额度显示开关行与 fork pill 行、`McodeProviderForm.tsx` 的额外选项重构与 fork 跨应用导入、`piProviderPresets.ts` 的火山预设改写与 fork `hidden` 字段、`forwarder.rs` 与 fork connectivityTest sanitize、`Cargo.toml` 的 windows-sys feature、`README.md`/`release.yml`/locales 的白名单口径），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付（方式按 Q2）：验收通过并用户接受结果后执行 Q2 授权的动作，并把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*`、`upstream/chore/*` 等）。
- 不做部分 cherry-pick 式同步；范围是本次锁定基线与 v4.0.6 之间的全部新增提交。
- 不同步 v4.0.7..upstream/main 的 2 个 post-release 提交（按 Q1）。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q2 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路、上游 v4 已删除的组件）。
- 不引入上游 Linux deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 790ed800（tag v4.0.7 指向的提交），`git log v4.0.7..main` 只包含 fork 提交。
- A2: rebase 前 c2611266..main 的 131 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。
- A3: 24 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：白名单/裁剪类文件（`README.md`、`.github/workflows/release.yml`、`src-tauri/tauri.conf.json` 等 fork 字段、`package.json`/`Cargo.toml`/`Cargo.lock`/`pnpm-lock.yaml` 的 fork 版本号与依赖）保留 fork 侧语义；共享代码以上游 v4.0.7 为基础叠加回 fork 必要语义，且上游火山 Agent Plan 端点修正与 Coding Plan 预设、Codex 压缩会话读取与压缩开关、过期客户端检测移出 Stack 与 Windows 进程号判定、Claude 1 小时缓存写入计价、Sonnet 5.5/Haiku 5.5 定价、Codex 缓存写入导入、跨应用用量统计行独立、OpenCode 额外选项类型保持、OpenClaw 自定义头保留、显式 0 缓存字段视为未上报、设置页滚动定位应用配置条目、顶层 base_url 保留、批处理文件去非 ASCII 路径、工作区账号区分、额度「已用」显示、旧第三方会话报错说明等改动全部落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.7-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 c2611266→790ed800」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。

# Constraints and invariants

- fork 全部 131 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前创建安全分支记录起点（`pre-sync-v407` = 当前 main e26fba04）；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- fork 历史自带未清理的冲突标记（原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` blob 内本就有标记）：重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验；最终态必须全树零冲突标记。
- current 工作区直接在 main 上 rebase 时，检出新基线的瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行，并按 Q2 的授权范围；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」，不得为省事整文件取一侧而丢掉任何一方（版本号、locales、`lib.rs`、`tray.rs`、`settings.rs` 属高频误删点）。
- `McodeProviderForm.tsx` 合并时保留上游的 `mergeOpencodeExtraOptionRows` 用法与 fork 的 `ProviderImportEntry`/`useProviderImportApply` 导入和接线，不得因取上游侧丢掉 `isKnownOpencodeOptionKey`/`OPENCODE_EXTRA_OPTION_DRAFT_PREFIX` 被删后 fork 仍引用它们的代码（fork 不引用，需核对）。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡（项目记忆既有教训）。

# Decisions

- 同步基线：锁定 tag v4.0.7 = 790ed800（Q1 选 A，2026-10-10）。理由：与过去 7 轮同步惯例一致，基线是已验证的发布头；v4.0.7..upstream/main 的 2 个 post-release 提交尚未进入任何发布，留待下次同步更稳。本轮因此不存在「连带 post-release」的区间。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；且同步必须直接改写 main 历史，与过去 7 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability（change 直接以完整目标规格 `specs/upstream-sync/spec.md` 形式管理）。理由：该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 6 轮同步惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：4.0.6-1 → 4.0.7-1；`-1` 表示上游 4.0.7 上的第一代 fork 构建，四处版本文件一致。
- 数据库 schema：上游 v4.0.7 未推进 schema（仍为 20，发行说明明确数据库结构无变化），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- `CHANGELOG.md`：fork 在 c2611266..main 区间未改过该文件，取上游 v4.0.7 版本落地；白名单中「整文件保留 fork 侧」只在 fork 侧确有改动时生效。
- `README.md`：fork 重写版整文件保留（上游 v4.0.7 未改该文件）。
- `.github/workflows/release.yml`：上游 v4.0.7 未改该文件，保留 fork 裁剪版（仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）。
- `Cargo.toml`：上游 `0fc67c3b` 给 windows-sys 增加 `Win32_Foundation` 与 `Win32_System_Threading` 两个 feature（Windows 进程号判定需要），取上游；版本号取 fork 侧 4.0.7-1。
- 冲突方向：`git rebase <基线>` 重放 fork 提交时，`--ours` 是新基线侧、`--theirs` 是正在重放的 fork 提交（文档 §3.1 已修正）；不确定时先看文件内容再选侧。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q2，2026-10-10 用户选择 A+B）：验收通过并用户接受结果后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.7-1` 并 `git push origin v4.0.7-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端；执行前无需重复询问。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.7^{commit}`、`git log --oneline v4.0.7..main`、`git rev-list --count`（重放前后）、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照
- 落地保真核对：按 A12 的增删行双向差集脚本逐文件比对
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线
- 上游功能落地抽查：火山 Agent Plan 端点与 Coding Plan 预设、Codex 压缩会话读取与压缩开关、Windows 过期客户端检测、Claude 1 小时缓存写入计价、Sonnet 5.5/Haiku 5.5 定价、设置页滚动定位应用配置条目、额度「已用」显示、顶层 base_url 保留、批处理文件去非 ASCII 路径、工作区账号区分
