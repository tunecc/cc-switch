# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.6 发布头（tag v4.0.6 = c2611266），fork 侧 128 个魔改提交（2db86e94..main）按原顺序重放保留，无丢失、无行为回归；版本号按惯例从 4.0.5-1 升为 4.0.6-1；验收通过并用户接受结果后，按 Q2 授权的交付方式上传 origin。

# Scope

- 把本地 main rebase 到 tag v4.0.6（c2611266）：当前 merge-base 2db86e94 → 目标 c2611266；fork 侧 128 个提交（2db86e94..main，含上一轮的同步提交、模型徽章 change 与其归档提交、流程产物提交）按原顺序重放。
- 基线即上游 v4.0.6 发布头。upstream/main HEAD 3e566a3b 及其父 ef24a019 共 2 个 post-release 提交（v4.0.6..upstream/main：test(codex) WSL fixture 跳过、fix(pi) 火山方舟 Agent Plan 端点与 Coding Plan）不在本次范围，留待下次同步。
- 上游新增 24 个提交（v4.0.5..v4.0.6），共 89 个文件、约 +3953/−729 行。按主题分组：
  - c5efe0ba feat(providers)：供应商页页头搜索按钮（`src/components/providers/ProviderList.tsx` +166/−、`src/components/settings/sections/GeneralSection.tsx` +11、`src-tauri/src/settings.rs` +21、`src/lib/api/settings.ts` +5、`src/types.ts`、4 个 locales、`tests/components/ProviderList.test.tsx` +55、`src/utils/providerConfigUtils.ts` +37）。
  - c1cb531f feat(skills) + 033017b0 fix(skills)：Skills 一键全部更新与导入对话框解锁（`src/components/skills/UnifiedSkillsPanel.tsx` +138/−、`src/hooks/useSkills.ts` +17、`src/components/providers/forms/hooks/useManagedAuth.ts`、`tests/hooks/useImportSkillsFromApps.test.tsx`、`tests/components/UnifiedSkillsPanel.test.tsx` +101/−）。
  - 0be33a84 fix(quota) + 4629ee2f fix(tray)：额度数字恢复绿/橙/红三色、阈值 10%→20%、托盘应用行标题写全部档位（`src-tauri/src/tray.rs` +56/−、`src/components/quota/QuotaLines.tsx` +76/−、`src/components/quota/quotaRules.ts` +15、`src/components/quota/AccountQuota.tsx`、`tests/components/quotaRules.test.ts`、`tests/components/SubscriptionQuotaFooter.test.tsx`、`src/components/UsageFooter.tsx`、`src/components/quota/CodexOauthQuotaFooter` 相关）。
  - 6760cfbb feat(codex) + c37a2625 fix(proxy)：聚合模式经典子 agent 工具开关、子 agent 任务不可读时报错而非清空（`src-tauri/src/mode/controller.rs` +170/−、`src-tauri/src/mode/stack.rs`、`src-tauri/src/commands/settings.rs` +28、`src-tauri/src/settings.rs` 的 `codex_stack_classic_subagents`、`src/lib/api/settings.ts`、`src-tauri/src/lib.rs` 命令注册 +1、`src/components/settings/CodexAuthSettings.tsx` +43、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`tests/components/CodexAuthSettings.test.tsx` +65、`tests/components/SwitchModePanel.test.tsx` +23、`tests/components/Switch.test.tsx`）。
  - 4aeaccf1 fix(codex)：删除托管账号时解除 Codex 供应商绑定（`src-tauri/src/database/dao/providers.rs` +86 的 `unbind_codex_managed_accounts`、`src-tauri/src/commands/auth.rs` +26/−、`src-tauri/src/services/provider/mod.rs`）。
  - 889b797d fix(claude) + 86421718 fix(proxy)：npm 安装的 Claude Code 升级路径允许安装脚本、Anthropic SSE 终止事件前关闭未闭合 content block（`src-tauri/src/commands/misc.rs` +187/−、`src-tauri/src/proxy/forwarder.rs` +441/−、`src-tauri/src/proxy/providers/streaming.rs` +179 新文件）。
  - ae934663 fix(codex) + dc93c496 fix(codex) + b4a07943 fix(codex)：第三方目录条目改用自带经典工具模板、聚合模式官方模型保持可见、Copilot 不再持久化代表性 apiFormat（`src-tauri/src/services/provider/codex_client_catalog.rs` +227/−、`codex_official_models.rs` +342/−、`codex_direct.rs`、`src-tauri/src/codex_config.rs` +358/−、`src-tauri/src/resources/gpt5_5_template.json`、`src-tauri/src/proxy/providers/codex_compaction.rs` +72/−、`src-tauri/src/proxy/opaque_state_rectifier.rs` +219/−、`src/config/codexProviderPresets.ts` −1、`tests/utils/providerConfigUtils.baseUrl.test.ts` +53 新文件、`tests/components/ProviderForm.codexCopilot.test.tsx`）。
  - 1beb8fa8 feat(ui)：CC Switch 更新点改绿并从该点打开关于页（`src/components/shell/Sidebar.tsx` +13/−、`src/components/settings/SettingsPage.tsx` 相关、4 个 locales）。
  - 8919d05c fix(ui)：应用页显示列开关改用 action 色（`src/components/ui/switch.tsx` +18/−、`src/components/apps/AppsPage.tsx`、`src/components/mcp/formBits.tsx`、`src/components/providers/CodexStaleClientsNotice.tsx`、`tests/components/AppsPage.test.tsx`、`tests/components/CodexStaleClientsNotice.test.tsx`、`tests/components/CodexAuthSettings.test.tsx`）。
  - ffffd43c fix(codex) + 66144d58 fix(codex)：第三方压缩摘要轮保留工具定义、Stack 模式外也提示缓存账号重启（`src-tauri/src/proxy/providers/codex_compaction.rs`、`src-tauri/src/mode/controller.rs`）。
  - 42d47956 ci(release)：Linux deb/rpm 缺失时快速失败（`.github/workflows/release.yml` +46/−）。
  - 449c7e78 docs + f025ee05 docs(faq)：新增中文聚合模式指南与 5 张图、三语手册更新（`docs/guides/aggregation-mode-guide-zh.md` +168、`docs/images/aggregation-mode/**`、`docs/user-manual/**`）。
  - 18bdea7c chore(icons)：DMXAPI logo 更新（`src/icons/extracted/dmxapi.png`）。
  - 314968b6 chore(release) + c2611266 docs(release)：v4.0.6 版本号四文件 + `CHANGELOG.md` +43、`docs/release-notes/v4.0.6-{zh,en,ja}.md`、`src/whats-new/4.0.6.json`。
- 冲突面（上游与 fork 同时改动的文件，共 28 个）：5 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、fork 重写的 `README.md` 与裁剪的 `.github/workflows/release.yml`、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/database/dao/providers.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/services/provider/mod.rs`）、前端共享文件（`src/App.tsx`、`src/components/providers/ProviderCard.tsx`、`src/components/providers/ProviderList.tsx`、`src/components/providers/forms/ProviderForm.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/components/shell/Sidebar.tsx`、`src/config/codexProviderPresets.ts`、`src/lib/api/settings.ts`、`src/types.ts`）、4 个 i18n locales、`tests/components/ProviderList.test.tsx`。
- 本轮新增 3 个相对 v4.0.5 轮的重叠文件：`src-tauri/src/commands/settings.rs`（上游 +28 新开关落库与回滚；fork 侧同文件有移除 updater 安装命令的改动）、`src-tauri/src/database/dao/providers.rs`（上游 +86 解绑；fork 侧同文件有 `website_url_2` 列索引改写）、`src/lib/api/settings.ts`（上游 +5 新命令绑定；fork 侧同文件移除 `installUpdateAndRestart`）、`tests/components/ProviderList.test.tsx`（上游 +55 搜索用例；fork 侧同文件有右键快捷排序与 failover mock 用例）。
- 数据库 schema：上游 v4.0.6 未推进 schema（`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 20，发行说明明确「数据库结构没有变化」）；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。
- 版本号从 4.0.5-1 升到 4.0.6-1（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：§4 中与本次上游改动相关的叠加语义条目（`tray.rs` 的额度阈值/全档位标题与 fork 左键切换、`settings.rs` 与 `commands/settings.rs` 的新开关与 fork 更新器移除、`database/dao/providers.rs` 的解绑与 fork `website_url_2` 列、`lib/api/settings.ts` 的新命令与 fork 移除更新命令、`ProviderList.tsx` 的搜索与 fork 右键排序/批量探针、`ProviderCard.tsx` 的 `extractProviderBaseUrl` 重构与 fork 徽章/双链接、`Sidebar.tsx` 的 dotTone 与 fork 面板过滤、`GeneralSection.tsx` 的搜索开关行与 fork pill 行、`forwarder.rs` 的 SSE/子 agent 修复与 fork connectivityTest sanitize、`codexProviderPresets.ts` 的 −1 行与 fork `hidden` 过滤、`release.yml`/`README.md`/locales 的白名单口径），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付（方式按 Q2）：验收通过并用户接受结果后执行 Q2 授权的动作，并把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*`、`upstream/chore/*` 等）。
- 不做部分 cherry-pick 式同步；范围是本次锁定基线与 v4.0.5 之间的全部新增提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q2 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路、上游 v4 已删除的组件）。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 c2611266（tag v4.0.6 指向的提交），`git log v4.0.6..main` 只包含 fork 提交。
- A2: rebase 前 2db86e94..main 的 128 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。
- A3: 28 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：白名单/裁剪类文件（`README.md`、`.github/workflows/release.yml`、`src-tauri/tauri.conf.json` 等 fork 字段、`package.json`/`Cargo.toml`/`Cargo.lock`/`pnpm-lock.yaml` 的 fork 版本号与依赖）保留 fork 侧语义；共享代码以上游 v4.0.6 为基础叠加回 fork 必要语义，且上游供应商页搜索、Skills 一键全部更新、额度三色与 20% 阈值、托盘全档位标题、聚合模式经典子 agent 开关、托管账号解绑、Anthropic SSE 收尾修复、第三方目录自带模板、更新点改绿等改动全部落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.6-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 2db86e94→c2611266」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。

# Constraints and invariants

- fork 全部 128 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前创建安全分支记录起点（`pre-sync-v406` = 当前 main e574d8ae）；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- fork 历史自带未清理的冲突标记（原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` blob 内本就有标记）：重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验；最终态必须全树零冲突标记。
- current 工作区直接在 main 上 rebase 时，检出新基线的瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行，并按 Q2 的授权范围；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」，不得为省事整文件取一侧而丢掉任何一方（版本号、locales、`lib.rs`、`tray.rs` 属高频误删点）。

# Decisions

- 同步基线：锁定 tag v4.0.6 = c2611266（Q1 选 A）。理由：与过去 4 轮同步惯例一致，基线是已验证的发布头；v4.0.6..upstream/main 的 2 个 post-release 提交尚未进入任何发布，留待下次同步更稳。本轮因此不存在「连带 post-release」的区间。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；且同步必须直接改写 main 历史，与过去 7 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability（change 直接以完整目标规格 `specs/upstream-sync/spec.md` 形式管理）。理由：该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 6 轮同步惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：4.0.5-1 → 4.0.6-1；`-1` 表示上游 4.0.6 上的第一代 fork 构建，四处版本文件一致。
- 数据库 schema：上游 v4.0.6 未推进 schema（仍为 20，发行说明明确数据库结构无变化），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- `CHANGELOG.md`：fork 在 2db86e94..main 区间未改过该文件，取上游 v4.0.6 版本落地；白名单中「整文件保留 fork 侧」只在 fork 侧确有改动时生效。
- `README.md`：fork 重写版整文件保留（上游 v4.0.6 只改了 3 行，不覆盖 fork 差异说明）。
- `.github/workflows/release.yml`：上游 42d47956 的 deb/rpm 缺失快速失败属上游 Linux 发布链路，fork 侧为裁剪版（仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）；保留 fork 语义，不被上游复活。
- 冲突方向：`git rebase <基线>` 重放 fork 提交时，`--ours` 是新基线侧、`--theirs` 是正在重放的 fork 提交（文档 §3.1 已修正）；不确定时先看文件内容再选侧。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q2，2026-10-10 用户选择 A+B）：验收通过并用户接受结果后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.6-1` 并 `git push origin v4.0.6-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端；执行前无需重复询问。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.6^{commit}`、`git log --oneline v4.0.6..main`、`git rev-list --count`（重放前后）、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照
- 落地保真核对：按 A12 的增删行双向差集脚本逐文件比对
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线
- 上游功能落地抽查：供应商页搜索按钮、Skills 全部更新、额度三色与 20% 阈值、托盘全档位标题、经典子 agent 开关、托管账号解绑、Anthropic SSE 收尾、第三方目录自带模板、更新点改绿
