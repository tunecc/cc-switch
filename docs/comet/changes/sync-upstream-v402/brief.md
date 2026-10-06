# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 最新 main（v4.0.2，HEAD bf2fe0d0），fork 全部魔改按原顺序重放保留，无丢失、无行为回归；版本号按惯例升为 4.0.2-1。

# Scope

- 把本地 main rebase 到 upstream/main（merge-base 4804b723（v4.0.1）之后上游新增 17 个提交，覆盖 v4.0.2 全部发布内容：MCP 同步到 Pi 1.0、reasoning replay envelope 白名单修复、modelPicker 聚合模型列表取代 gateway discovery、重启提示移除、供应商表单按打开页签选布局、Codex 模型映射表接入拉取模型选择器、图标 tile 化、更新后变更摘要、model_catalog_json 键字段语义、用量区间样式、uvx time preset 等；fork 侧 111 个提交（4804b723..main）按原顺序重放）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再手动叠加 fork 必要改动。本次冲突面：上游改动 102 个文件与 fork 改动 387 个文件的重叠 23 个文件——版本文件 4 个（package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock）按 fork 版本号 4.0.2-1 处理；fork 白名单文件（.github/workflows/release.yml）整文件保留；其余共享文件（src-tauri/src/lib.rs、settings.rs、database/mod.rs、database/schema.rs、src/App.tsx、AddProviderDialog.tsx、EditProviderDialog.tsx、BasicFormFields.tsx、ProviderForm.tsx、ProviderPresetSelector.tsx、ProviderCard.tsx、AboutSection.tsx、appConfig.tsx、types.ts、4 个 i18n locales）取上游版本后叠加 fork 语义。
- schema.rs 迁移链合并：上游把 SCHEMA_VERSION 升到 20（v19→v20 为 mcp_servers.enabled_pi）；fork 的 website_url_2 迁移位于 v18→v19（migrate_v18_to_v19 + add_column_if_missing 兜底 + providers 建表语句的 website_url_2 列）。合并后 SCHEMA_VERSION=20：v18→v19 同时含上游原迁移与 fork website_url_2，v19→v20 为上游 enabled_pi，两张表的建表列各自保留。
- 上游删除 src/hooks/useStackModelsChangedHint.ts 及其测试、locales 的 provider.stackModelsChanged / mode.dialog.stackNoteRestart / proxy.stackMode.tooltip / providerForm.stackLayout.* 等键：fork 未改过这些文件/键，按上游删除重放；fork locales 只叠加自己的新增键段（devpanel、connectivityTest / connectivityCheck）。
- rebase 过程中保护 `.comet/config.yaml`：历史提交重放可能把它改回旧内容（曾导致只启用 classic、Native hook 拒绝写入），重放涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复到 rebase 前版本。
- 版本号从 4.0.1-1 升到 4.0.2-1（package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock）。
- 把本次同步新增的 fork 专属文件补进 docs/HOW_TO_REBASE_UPSTREAM.md §4 白名单（如有），并补记 Cargo.lock 版本联动条目（v4.0.1 验证发现的文档缺口）。
- 更新本 change 的完整目标规格 specs/upstream-sync/spec.md（上游 HEAD、版本号、schema 合并结果、白名单与冲突约定按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不清理本地遗留分支。
- 不手工挑选上游提交（不做 cherry-pick 式部分同步）；同步范围是 upstream/main 全量新增提交。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 bf2fe0d0becbfc8473955af66010c6b13f51b1e8（upstream/main HEAD，v4.0.2），且 `git log upstream/main..main` 只包含 fork 提交。
- A2: `git log upstream/main..main` 的提交与 rebase 前改动语义一一对应：111 个原始 fork 提交按原顺序重放（若出现 git 自动判定的冗余跳过或需合并的提交，按 spec 记录的映射处理并核对语义），外加本次同步提交；全部 fork 功能语义保留。
- A3: 冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3：白名单文件保留 fork 侧；共享文件以上游版本为基础叠加回 fork 必要改动（lib.rs 移除 Updater 插件注册 + 托盘左键切换、settings.rs VisibleSidebarPanels、database/mod.rs SCHEMA_VERSION=20 且保留移除 stream_check 清理、schema.rs v18→v19 含 website_url_2 且 v19→v20 为 enabled_pi、App.tsx 批量探针状态提升与批量检测门控与 setTitle 守卫、ProviderForm.tsx 跨应用导入与预设过滤与 websiteUrl2、ProviderPresetSelector extraActions、ProviderCard 模型徽章/探针徽标/双官网链接、BasicFormFields 双官网字段横排、AboutSection 检查更新指向 fork Releases、appConfig DEFAULT_VISIBLE_SIDEBAR_PANELS、types.ts websiteUrl2 与 VisibleSidebarPanels、4 个 i18n locales 的 devpanel/connectivityTest 键段）。
- A4: package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的版本号均为 4.0.2-1。
- A5: fork 魔改保留清单（specs/upstream-sync/spec.md）中的每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边栏面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（default_workflow: native，workflows 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md §4 已补充本次同步后新增的 fork 专属文件（如有），并补记 Cargo.lock 版本联动条目。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: origin/main 与本地 main 一致（--force-with-lease 推送成功）。用户已授权推送。

# Constraints and invariants

- fork 全部 111 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 失败或局面不可收拾时 `git rebase --abort` 回到起点（e6594a93），工作区恢复原状。
- 长重放过程中 git commit 偶发段错误（signal 11）时，先核对提交是否实际已落盘（.git/rebase-merge 状态），不盲目重放，防止同题重复提交。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。

# Decisions

- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。工作区当前干净，且同步需要直接改写 main 历史。
- 版本号：4.0.1-1 → 4.0.2-1，沿用「上游版本 + -1」惯例（fork 在该上游版本上的第一代魔改版本），与 package.json / tauri.conf.json / Cargo.toml / Cargo.lock 四处一致。
- 同步范围：upstream/main 全量 17 个提交一次 rebase，不做部分 cherry-pick；upstream/main HEAD 即 v4.0.2 发布头（无 post-release 漂移）。
- 数据库 schema 合并：SCHEMA_VERSION 取上游 20；fork website_url_2 语义并入 v18→v19 迁移与 providers 建表语句；v19→v20 为上游 enabled_pi。
- `.comet/config.yaml` 保护：重放涉及该文件或重放后，核对并被改写时从 ORIG_HEAD 恢复（项目记忆 rebase-comet）。
- 推送：授权 rebase 完成后用 `--force-with-lease` 推送到 origin/main。用户已确认（Q1：A 授权推送，2026-10-06）。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
- Git 核对命令：`git merge-base main upstream/main`、`git rev-parse upstream/main`、`git log --oneline upstream/main..main`、版本号文件内容、`.comet/config.yaml` 内容、schema.rs 的 SCHEMA_VERSION 与迁移段
