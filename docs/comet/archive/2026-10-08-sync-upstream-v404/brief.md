# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.4 发布头（tag v4.0.4 = a29a4f38），fork 全部 121 个魔改提交按原顺序重放保留，无丢失、无行为回归；版本号按惯例升为 4.0.4-1；验收通过并用户接受结果后，用 `--force-with-lease` 推送 origin/main，并创建、推送 annotated tag `v4.0.4-1`（指向归档提交）以触发 fork Release CI 出安装包。

# Scope

- 把本地 main rebase 到 tag v4.0.4（a29a4f38）：当前 merge-base d35726e2 → 目标 a29a4f38；fork 侧 121 个提交（d35726e2..main）按原顺序重放。
- 基线锁定 v4.0.4 tag；upstream/main HEAD 5ae6ad38 及其之前的 11 个 post-release 提交（v4.0.4..upstream/main：Copilot 托管账户路由、Claude Code npm 原生启用、Linux updater 修复、Grok Build 用量导入提前、四份 README/手册 v4.0 重写、issue 模板、WSL 夜间 CI 等）不在本次范围，留待下次同步。
- 上游新增 6 个提交（d35726e2..a29a4f38），共 20 个文件：
  - f61dc5f5 fix(macos)：重启后经 LaunchServices 重新拉起，窗口置前（`src-tauri/src/commands/settings.rs`、`src-tauri/src/lib.rs`）。
  - e09fdf04 feat(settings)：About 卡片 star prompt 独立可关闭条（`src/components/settings/AboutSection.tsx` + 4 个 locales）。
  - e0b36500 feat(profiles)：项目切换器默认隐藏（`src-tauri/src/settings.rs`、`src/App.tsx`、`src/components/settings/sections/GeneralSection.tsx`）。
  - 5b10d199 fix(usage)：窄窗口下速度列保持可见（`src/components/usage/RequestLogTable.tsx`）。
  - c2282a10 chore(release) v4.0.4：4 个版本文件 + `CHANGELOG.md`。
  - a29a4f38 docs(release)：v4.0.4 三语发行说明 + `src/whats-new/4.0.4.json`。
- 冲突面（上游与 fork 同时改动的文件，共 14 个）：4 个版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`）、后端共享文件（`src-tauri/src/commands/settings.rs`、`src-tauri/src/lib.rs`、`src-tauri/src/settings.rs`）、前端共享文件（`src/App.tsx`、`src/components/settings/AboutSection.tsx`、`src/components/settings/sections/GeneralSection.tsx`）、4 个 i18n locales。fork 侧改动密度：locales zh 20 个提交、App.tsx 8 个、GeneralSection 5 个、lib.rs 5 个、AboutSection/settings.rs 各 3 个、commands/settings.rs 1 个。
- 仅上游改动、预期无冲突的文件：`src/components/usage/RequestLogTable.tsx`、`src/whats-new/4.0.4.json`、`docs/release-notes/v4.0.4-*.md`、`CHANGELOG.md`（fork 在 d35726e2..main 内未改过该文件，与 merge-base 内容一致，直接落上游版本）。
- 数据库 schema：上游 v4.0.4 的 `SCHEMA_VERSION` 仍为 20，未改 `database/schema.rs`；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。
- 版本号从 4.0.3-2 升到 4.0.4-1（4 个版本文件一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见 A3 与完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：§3/§4 中与本次上游改动相关的叠加语义条目（AboutSection 的 star prompt 可关闭条与 fork 更新器禁用并存、GeneralSection 的项目切换器默认隐藏与 fork 面板可见性 pill 并存、App.tsx 上游改动与 fork 批量探针/setTitle 守卫并存、lib.rs/commands/settings.rs 的 macOS 重启链路），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格 `specs/upstream-sync/spec.md`（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付：验收通过并用户接受结果后，`git push --force-with-lease origin main`；随后在归档提交上创建 annotated tag `v4.0.4-1` 并 `git push origin v4.0.4-1`（tag 推送触发 fork Release CI：windows-2022 + macos-14，unsigned）。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支，也不同步 v4.0.4 之后的 11 个 post-release 提交（含 upstream/main HEAD 5ae6ad38）。
- 不做部分 cherry-pick 式同步；范围是 v4.0.4 tag 之前的全部新增提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，直接推送 main。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 a29a4f38（tag v4.0.4 指向的提交），`git log v4.0.4..main` 只包含 fork 提交，且 5ae6ad38 等 v4.0.4 之后的 post-release 提交不在 main 历史中。
- A2: rebase 前 d35726e2..main 的 121 个 fork 提交按原顺序逐一重放，无 git 自动判定的冗余跳过、无重复提交、无需合并的提交（若有，按完整目标规格「重放映射」记录并核对语义）；全部 fork 功能语义保留。
- A3: 冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3：白名单文件保留 fork 侧；14 个重叠共享文件以上游版本为基础叠加回 fork 必要语义 —— `src-tauri/src/lib.rs` 保留「移除 Updater 插件注册 + 托盘左键单击切换 + connectivity_test 命令注册」并叠加上游 macOS LaunchServices 重启改动；`src-tauri/src/commands/settings.rs` 以上游重启命令改动为基础，保持 fork 的 connectivityTest sanitize 隔离与相关命令注册；`src-tauri/src/settings.rs` 保留 fork `VisibleSidebarPanels` 字段族并叠加「项目切换器默认隐藏」新默认值；`src/App.tsx` 保留 fork 批量探针状态提升、批量检测门控与 `IS_FORK_BUILD`+`isTauri` setTitle 守卫并叠加上游项目切换器改动；`src/components/settings/AboutSection.tsx` 保留 fork「检查更新/发行说明指向 tunecc Releases + 禁用应用内更新器」并叠加上游 star prompt 独立可关闭条；`src/components/settings/sections/GeneralSection.tsx` 保留 fork 面板可见性 pill 行并叠加上游项目切换器默认值；4 个 locales 保留 fork `devpanel` 与 `connectivityTest`/`connectivityCheck` 键段并接收上游 star prompt 新键；4 个版本文件按 fork 版本号 4.0.4-1。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.4-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边栏面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格 `specs/upstream-sync/spec.md` 已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。

# Constraints and invariants

- fork 全部 121 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 失败或局面不可收拾时 `git rebase --abort` 回到起点（当前 main = ea8d6bff），工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- `rerere.enabled=true` 已开启；本次解出的冲突解法会被记录，供后续同步复用。

# Decisions

- 同步基线（Q1，2026-10-08 确认）：锁定 tag v4.0.4 = a29a4f38；v4.0.4 之后的 11 个 post-release 提交（含 upstream/main HEAD 5ae6ad38）留待下次同步。沿用 v4.0.1/v4.0.2/v4.0.3 三轮「只同步已发布 tag」惯例，冲突面从 173 个文件收敛到 20 个文件。
- 上传范围（Q2，2026-10-08 确认）：`--force-with-lease` 推送 origin/main + 创建并推送 annotated tag `v4.0.4-1`（指向归档提交），由 tag 触发 fork Release CI 构建 Windows x64 与 macOS arm64 unsigned 安装包。沿用 v4.0.2-1 / v4.0.3-1 / 4.0.3-2 的交付惯例。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。工作区干净（仅本 change 未跟踪产物），且同步必须直接改写 main 历史。
- 能力关联：撤销 `upstream-sync` capability 关联（Q3，2026-10-08 确认，用户明确要求）。该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 6 轮同步（sync-upstream / -3203 / -latest / -v401 / -v402 / -v403）的无关联惯例，完整目标规格整份重写为同步后的真相，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。`specs/upstream-sync/delta.yaml` 是关联时 Runtime 生成的残留模板，撤销关联后 `spec_changes` 为空、不再参与校验，如后续阶段仍引用它则按 Runtime 指令处理。
- 版本号：4.0.3-2 → 4.0.4-1；`-1` 表示上游 4.0.4 上的第一代 fork 构建，四处版本文件一致。- 数据库 schema：上游 v4.0.4 未推进 schema（仍为 20），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- CHANGELOG.md：fork 在本轮区间未改过该文件，取上游 v4.0.4 版本落地；白名单中「整文件保留 fork 侧」只在 fork 侧确有改动时生效。
- 冲突方向：`git rebase <基线>` 重放 fork 提交时，`--ours` 是新基线侧、`--theirs` 是正在重放的 fork 提交（文档 §3.1 已修正）；不确定时先看文件内容再选侧。
- 交付时机（2026-10-08 用户决定）：推送 main 与 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤：先 `git push --force-with-lease origin main`，再在归档提交上创建 annotated tag `v4.0.4-1` 并 `git push origin v4.0.4-1`；执行后把 `main`/`origin/main` 一致性、tag 指向和 fork Release CI 运行结果回报给用户。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源：Q2（2026-10-08 确认）已授权「推 main + 推 tag」，无需在执行前重复询问；但只授权这两项动作，不含 merge、PR 或其他远端。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
- Git 核对：`git merge-base main upstream/main`、`git rev-parse v4.0.4^{commit}`、`git log --oneline v4.0.4..main`、`git rev-list --count d35726e2..main`（重放前后）、`git branch --contains 5ae6ad38`（应无 main）、四处版本文件内容、`.comet/config.yaml` 内容、`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 与 v20→v21 迁移段
- fork 保留清单符号核对：`toggle_main_window`、`connectivity_test`、`forkOfficialAllowlist`、`website_url_2`、`VisibleSidebarPanels`、`IS_FORK_BUILD`
- 交付核对（验收通过并归档之后执行，不属于本轮验收项，结果回报给用户）：`git push --force-with-lease origin main`、`git rev-parse main origin/main`（应一致）、在归档提交上创建 annotated tag `v4.0.4-1` 并 `git push origin v4.0.4-1`、`gh run list --limit 5`（tag 推送后 fork Release CI 是否排队/运行）。
