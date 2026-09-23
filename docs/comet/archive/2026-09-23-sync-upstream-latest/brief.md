# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的最新 main（v3.20.4，HEAD 8e478b2b），fork 全部魔改按原顺序重放保留，工作区未提交的 vitest.config.ts 改动一并保留并提交。

# Scope

- 把本地 main rebase 到 upstream/main（基线 06082e18 之后上游新增 40 个提交）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要改动。
- 保留工作区未提交的 vitest.config.ts 改动（testTimeout: 30000），与本次同步一起提交。
- 版本号从 3.20.3-1 升到 3.20.4-1。
- 把本次同步新增的 fork 专属文件补进 docs/HOW_TO_REBASE_UPSTREAM.md §4 白名单。
- 同步完成后用 --force-with-lease 推送到 origin/main。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 的其他分支。
- 不清理本地遗留分支。

# Acceptance examples

- A1: `git merge-base main upstream/main` 等于 upstream/main HEAD（8e478b2b）。
- A2: `git log upstream/main..main` 的 fork 提交与 rebase 前一一对应，数量与改动语义不丢失。
- A3: 冲突处理符合 docs/HOW_TO_REBASE_UPSTREAM.md §3，白名单文件保留 fork 侧，共享文件叠加回 fork 必要改动。
- A4: package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml 的版本号均为 3.20.4-1。
- A5: 已提交的 vitest.config.ts 含 `testTimeout: 30000`（在 git 历史中，不要求验收当下工作区为空）。
- A6: docs/HOW_TO_REBASE_UPSTREAM.md §4 补入本次同步后新增的 fork 专属文件。
- A7: `pnpm typecheck` 通过。
- A8: `pnpm test:unit` 通过。
- A9: `cargo check` 通过。
- A10: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外）。
- A11: origin/main 与本地 main 一致（--force-with-lease 推送成功）。

# Constraints and invariants

- fork 全部魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md 为准；无法安全判定的冲突暂停并记录，不盲目 --continue。
- rebase 失败时 `git rebase --abort` 回到起点（2256d8a9），工作区恢复原状。
- 推送只用 --force-with-lease，不用 --force。

# Decisions

- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。用户要求未提交改动与本次同步一起提交。
- 未提交改动：vitest.config.ts 的 `testTimeout: 30000` 保留并纳入本次提交。它把 jsdom 组件测试超时从默认 5 秒提到 30 秒，因为 PiProviderForm 等整表单测试稳定超过 5 秒。
- 推送：同步完成后用 --force-with-lease 推送到 origin/main。用户确认。
- 版本号：从 3.20.3-1 升到 3.20.4-1，沿用「上游版本 + -1」惯例。用户确认。

- 确认：用户已确认目标、范围、关键决定、验收标准与非目标，进入实现。

# Open questions

- 无。隔离方式、未提交改动处理、推送与版本号均已由用户确认。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
