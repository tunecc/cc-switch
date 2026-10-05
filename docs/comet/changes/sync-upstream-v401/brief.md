# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 最新 main（v4.0.1，HEAD 4804b723），fork 全部魔改按原顺序重放保留，无丢失、无行为回归；版本号按惯例升为 4.0.1-1。

# Scope

- 把本地 main rebase 到 upstream/main（merge-base 8e478b2b 之后上游新增 220 个提交，跨越 v3.20.4 → v4.0.1；fork 侧 110 个提交按原顺序重放）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再手动叠加 fork 必要改动。实测上游改动 797 个文件与 fork 改动 387 个文件的重叠面约 89 个文件（含 package.json、Cargo.toml/tauri.conf.json、4 个 i18n locales、src-tauri/src/lib.rs、src/App.tsx、src/components/proxy/RoutingActivationBrand.tsx、8 个 ProviderPresets、src/lib/schemas/provider.ts、.github/workflows、README 等），逐个按约定解决。
- rebase 过程中保护 `.comet/config.yaml`：历史提交重放可能把它改回旧内容（曾导致只启用 classic、Native hook 拒绝写入），重放涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复到 rebase 前版本。
- 版本号从 3.20.4-1 升到 4.0.1-1（package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock）。
- 把本次同步新增的 fork 专属文件补进 docs/HOW_TO_REBASE_UPSTREAM.md §4 白名单（如有）。
- 更新本 change 的完整目标规格 specs/upstream-sync/spec.md（上游 HEAD、版本号、白名单与冲突约定按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不清理本地遗留分支。
- 不手工挑选上游提交（不做 cherry-pick 式部分同步）；同步范围是 upstream/main 全量新增提交。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 4804b723d49aca7f85218a95e9030005ec395d9f（upstream/main HEAD），且 `git log upstream/main..main` 只包含 fork 提交。
- A2: `git log upstream/main..main` 的提交与 rebase 前改动语义一一对应：110 个原始提交中 106 个逐一重放，4 个按 spec 记录的映射处理（1 个冗余跳过、1 个被新架构取代、2 个合并重放），外加本次同步提交；全部 fork 功能语义保留。
- A3: 冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3：白名单文件保留 fork 侧；共享文件以上游版本为基础叠加回 fork 必要改动（src-tauri/src/lib.rs 托盘左键切换、AboutSection 检查更新指向 fork Releases、RoutingActivationBrand 品牌链接指向 fork GitHub、UpdateContext/updater 关闭自动更新、8 个 ProviderPresets 的 hidden 字段与接线、provider.ts 的 websiteUrl2、i18n locales 的 devpanel/connectivityTest 键段等）。
- A4: package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的版本号均为 4.0.1-1。
- A5: fork 魔改保留清单（specs/upstream-sync/spec.md）中的每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边栏面板可见性、模型徽章与快捷切换、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（default_workflow: native，workflows 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md §4 已补充本次同步后新增的 fork 专属文件（如有）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: origin/main 与本地 main 一致（--force-with-lease 推送成功）。用户已授权推送。

# Constraints and invariants

- fork 全部 110 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 失败或局面不可收拾时 `git rebase --abort` 回到起点（6a54138e），工作区恢复原状。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。

# Decisions

- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。工作区当前干净，且同步需要直接改写 main 历史。
- 版本号：3.20.4-1 → 4.0.1-1，沿用 spec 记载的「上游版本 + -1」惯例（fork 在该上游版本上的第一代魔改版本），与 package.json / tauri.conf.json / Cargo.toml / Cargo.lock 四处一致。
- 同步范围：unstream/main 全量 220 个提交一次 rebase，不做部分 cherry-pick。
- `.comet/config.yaml` 保护：rebase 涉及该文件或重放后，核对并被改写时从 ORIG_HEAD 恢复（依据项目记忆 rebase-comet：历史提交重放会把它改回旧内容导致 Native hook 拒绝写入）。
- 已提交的 vitest.config.ts `testTimeout: 30000` 随历史重放保留，验收不要求工作区在验收当下为空（comet-state.yaml 与 verification.md 是 Runtime 每轮验收都会改写的流程状态文件）。
- 推送：授权 rebase 完成后用 `--force-with-lease` 推送到 origin/main。用户确认（Q1：授权推送）。

# Open questions

- 无。推送方式（--force-with-lease 推送 origin/main）已由用户确认，其余决定均按既有惯例与流程文档确定。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
- Git 核对命令：`git merge-base main upstream/main`、`git rev-parse upstream/main`、`git log --oneline upstream/main..main`、版本号文件内容、`.comet/config.yaml` 内容
