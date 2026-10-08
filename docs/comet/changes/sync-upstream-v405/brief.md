# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.5 发布头（tag v4.0.5 = 2db86e94，与 upstream/main HEAD 为同一提交），fork 侧 124 个魔改提交（a29a4f38..main）按原顺序重放保留，无丢失、无行为回归；版本号按惯例从 4.0.4-1 升为 4.0.5-1；验收通过并用户接受结果后，按 Q1 授权的交付方式上传 origin。

# Scope

- 把本地 main rebase 到 tag v4.0.5（2db86e94）：当前 merge-base a29a4f38 → 目标 2db86e94；fork 侧 124 个提交（a29a4f38..main，含上一轮的同步提交、流程产物提交与归档提交）按原顺序重放。
- 基线即 upstream/main HEAD：v4.0.5 之后上游无 post-release 提交，本次不存在「留待下次同步」的区间。
- 上游新增 20 个提交（v4.0.4..v4.0.5），共 193 个文件、约 +10229/−4789 行。按主题分组：
  - f9db9f70 feat(codex)：GitHub Copilot 托管账户与 Responses/Chat 路由（`src-tauri/src/proxy/forwarder.rs` +1166、`providers/codex.rs`、`providers/claude.rs`、`providers/mod.rs`、`copilot_auth.rs`、`copilot_model_map.rs`、`copilot_optimizer.rs`、`proxy/handlers.rs`、`provider.rs`、`commands/provider.rs`、`codex_config.rs`；前端 `CodexFormFields.tsx` +315、`ProviderForm.tsx`、`EditProviderDialog.tsx`、`useDraftEditorProjection.ts`、`apps/useToolManagement.ts`、`types.ts`、`lib/api/copilot.ts`、`lib/api/providers.ts`；新增 `tests/components/CodexFormFields.copilotCapabilities.test.ts`、`CodexFormFields.modelFetch.test.tsx`、`ProviderForm.codexCopilot.test.tsx`、`tests/fixtures/copilot-endpoint-cases.json`）。
  - 5d24fdf9 feat(usage)：全时段热力图展示全部历史（`commands/usage.rs`、`services/usage_stats.rs`、`lib.rs` 命令注册、`UsageHeatmap.tsx`、4 个 locales、`lib/api/usage.ts`、`lib/query/usage.ts`）。
  - 3af55c39 / e40ebb6e fix(codex)：MoArk 预设模型目录与原生 Responses 格式、隐藏模板下显式配置模型列表（`codex_config.rs`、`src/config/codexProviderPresets.ts`、`tests/config/moarkProviderPresets.test.ts`）。
  - 02759c67 fix(proxy)：转换后的 function tools 标记 non-strict（`proxy/providers/transform_responses.rs`）。
  - 36c8b87e fix(linux)：Wayland 首次显示与托盘重新显示时恢复标题栏控件（`src-tauri/src/lib.rs`、`lightweight.rs`、`linux_fix.rs`、`tray.rs`、`Cargo.toml`、`Cargo.lock`、3 份 FAQ 手册）。
  - d90de1ba fix(updater)：Linux 包自动更新（`package.json`、`pnpm-lock.yaml`、`.github/workflows/release.yml`）。
  - c5233fe7 fix(apps)：Claude Code npm 安装启用原生 setup（`commands/misc.rs`、`apps/useToolManagement.ts`）。
  - a40adef3 fix(usage)：Grok Build 会话用量 60s 后导入（`services/session_usage_grokbuild.rs`）。
  - b1752e1c / 5ae6ad38 / 7d800c4d / faae0e4d ci：release latest.json 签名校验、WSL2 夜间测试链（`release.yml`、`src-tauri/src/lib.rs` 测试标记）。
  - 5dd824c7 / efd236a4 / 01ee685d / 2db86e94 / cf02f670 / a7f66764 docs 与 release：四份 README v4.0 重写、用户手册 v4.0 重写与图片清理、v4.0.4/v4.0.5 发行说明与 `src/whats-new/4.0.5.json`、v4.0.5 版本号四文件 + `CHANGELOG.md`、issue 模板列出十个应用。
- 冲突面（上游与 fork 同时改动的文件，共 25 个）：4 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、fork 重写的 `README.md` 与裁剪的 `.github/workflows/release.yml`、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/provider.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs`、`src-tauri/src/services/provider/mod.rs`）、前端共享文件（`src/types.ts`、`src/components/providers/EditProviderDialog.tsx`、`src/components/providers/forms/ProviderForm.tsx`、`src/config/codexProviderPresets.ts`）、4 个 i18n locales、`tests/components/EditProviderDialog.test.tsx`。
- fork 侧在重叠文件上的改动密度（v4.0.4..main）：locales 各 339–351 行、`ProviderForm.tsx` 213 行、`README.md` 577 行（fork 重写）、`release.yml` 810 行（fork 裁剪）、`Cargo.lock` 178 行、`lib.rs` 58 行、`tray.rs` 32 行（托盘左键切换）、`provider.rs` 46 行、`EditProviderDialog.test.tsx` 47 行、`types.ts` 14 行；`forwarder.rs`、`codexProviderPresets.ts`、`commands/misc.rs`、`services/provider/mod.rs`、`providers/{claude,codex,mod}.rs`、`EditProviderDialog.tsx`、`package.json`、`pnpm-lock.yaml`、`tauri.conf.json`、`Cargo.toml` 均为个位数到十几行。
- 仅上游改动、预期无冲突的文件：`UsageHeatmap.tsx`、`src/lib/{api,query}/usage.ts`、`codex_config.rs`、`copilot_*.rs`、`transform_responses.rs`、`linux_fix.rs`、`lightweight.rs`、`session_usage_grokbuild.rs`、`commands/{usage,provider}.rs`、`useDraftEditorProjection.ts`、`apps/useToolManagement.ts`、`lib/api/copilot.ts`、`README_ZH/DE/JA.md`、`CHANGELOG.md`、`docs/release-notes/v4.0.5-*.md`、`docs/user-manual/**`、`.github/ISSUE_TEMPLATE/**`、`src/whats-new/4.0.5.json`、上游新增测试与 fixture。
- 数据库 schema：上游 v4.0.5 未改动 `src-tauri/src/database/**`，`SCHEMA_VERSION` 仍为 20；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。
- 版本号从 4.0.4-1 升到 4.0.5-1（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见 A3 与完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：§3/§4 中与本次上游改动相关的叠加语义条目（`lib.rs` 的 macOS/Wayland 与托盘链路、`tray.rs` 的 Wayland 修复与 fork 左键切换、`codexProviderPresets.ts` 的 MoArk 目录与 fork `hidden` 过滤、`ProviderForm.tsx`/`types.ts` 的 Copilot 改动与 fork 跨应用导入/双官网语义、`forwarder.rs`/`provider.rs`/`providers/*` 的 Copilot 路由与 fork connectivityTest 语义、`commands/misc.rs` 的 npm native setup 与 fork 命令注册、`release.yml`/`README.md`/locales 的白名单口径），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格 `specs/upstream-sync/spec.md`（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付（Q1 已授权，方式 A）：验收通过并用户接受结果后，`git push --force-with-lease origin main`；再在归档提交上创建 annotated tag `v4.0.5-1` 并 `git push origin v4.0.5-1`（tag 推送触发 fork Release CI：windows-2022 + macos-14，unsigned），随后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*`、`upstream/chore/*` 等）。
- 不做部分 cherry-pick 式同步；范围是 v4.0.5 tag 之前的全部新增提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q1 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路、上游 v4 已删除的组件）。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 2db86e94（tag v4.0.5 指向的提交，也是 upstream/main HEAD），`git log v4.0.5..main` 只包含 fork 提交。
- A2: rebase 前 a29a4f38..main 的 124 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。
- A3: 25 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：白名单/裁剪类文件（`README.md`、`.github/workflows/release.yml`、`src-tauri/tauri.conf.json` 等 fork 字段、`package.json`/`Cargo.toml`/`Cargo.lock`/`pnpm-lock.yaml` 的 fork 版本号与依赖）保留 fork 侧语义；共享代码以上游 v4.0.5 为基础叠加回 fork 必要语义，且上游 Copilot 托管账户路由、all-time 热力图、MoArk 模型目录、Wayland 标题栏修复、npm native setup 等改动全部落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.5-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格 `specs/upstream-sync/spec.md` 已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 a29a4f38→2db86e94」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。

# Constraints and invariants

- fork 全部 124 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前创建安全分支记录起点（`pre-sync-v405` = 当前 main ed82e862）；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- current 工作区直接在 main 上 rebase 时，检出新基线的瞬间工作树短暂缺少 `docs/comet/specs/upstream-sync/spec.md`，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行，并按 Q1 的授权范围；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」，不得为省事整文件取一侧而丢掉任何一方（版本号、locales、`lib.rs`、`tray.rs` 属高频误删点）。

# Decisions

- 同步基线：锁定 tag v4.0.5 = 2db86e94。本轮 upstream/main HEAD 与该 tag 提交同一，无 post-release 提交需要排除，因此不需要像 v4.0.4 轮那样声明「留待下次同步」的区间。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；且同步必须直接改写 main 历史，与过去 7 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability（change 直接以完整目标规格 `specs/upstream-sync/spec.md` 形式管理）。理由：该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 6 轮同步惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：4.0.4-1 → 4.0.5-1；`-1` 表示上游 4.0.5 上的第一代 fork 构建，四处版本文件一致。
- 数据库 schema：上游 v4.0.5 未推进 schema（仍为 20），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- `CHANGELOG.md`：fork 在 a29a4f38..main 区间未改过该文件，取上游 v4.0.5 版本落地；白名单中「整文件保留 fork 侧」只在 fork 侧确有改动时生效。
- `README.md`：fork 重写版整文件保留（上游 5dd824c7 的四份 README v4.0 重写中，`README_ZH/DE/JA.md` 为共享文件按 §3.2 取上游）。
- `.github/workflows/release.yml`：上游 b1752e1c/d90de1ba 新增 deb/rpm 签名校验与 Linux 包自动更新链路，fork 侧为裁剪版（仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）；保留 fork 语义，不被上游复活。
- 冲突方向：`git rebase <基线>` 重放 fork 提交时，`--ours` 是新基线侧、`--theirs` 是正在重放的 fork 提交（文档 §3.1 已修正）；不确定时先看文件内容再选侧。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q1，2026-10-08 用户选择 A）：验收通过并用户接受结果后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.5-1` 并 `git push origin v4.0.5-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端；执行前无需重复询问。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git log --oneline v4.0.5..main`、`git rev-list --count`、版本号四文件 grep、`SCHEMA_VERSION` grep
- 落地保真核对：按 A12 的增删行双向差集脚本逐文件比对
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线
