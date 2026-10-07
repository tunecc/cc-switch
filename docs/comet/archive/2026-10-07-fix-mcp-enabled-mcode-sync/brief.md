# 目标

修复「MCP 列表不加载，报 `数据库错误: no such column: enabled_mcode`」：老 fork 构建（website-links 时代，SCHEMA_VERSION=19）升级过的数据库在 v4.0.2+ 代码下永远不会获得 `enabled_mcode` 列。新增 v20→v21 幂等修复迁移补齐缺失列，让任意历史版本的库都能迁到当前 schema 并正常加载 MCP 列表。同时把 main 同步到 upstream/main（唯一 post-release 提交 d35726e2），fork 魔改全量保留。

根因（已查证，结论：上游无问题，是 fork 在 v4.0.2 同步 rebase 解决冲突时引入的历史版本缺口）：

1. 同步前 fork：website-links 提交（9c182cd4 的前身）把 `website_url_2` 作为 v18→v19 迁移，`SCHEMA_VERSION=19`；用户数据库已升到 v19（有 `website_url_2`，无 `enabled_mcode`）。
2. v4.0.2 同步 rebase：上游 #7383（MiniMax Code）的 v18→v19（`enabled_mcode`）与 fork 的 v18→v19（`website_url_2`）编号冲突，解决时合并为同一步；上游 #7862（Pi）为 v19→v20。
3. 后果：已在 v19 的库在新代码下只执行 19→20（加 pi），捆绑步骤被跳过，`enabled_mcode` 永远缺失；MCP 列表 SELECT 报 no such column。schema.rs 在 v4.0.2→v4.0.3 之间无改动，与「最近同步后出现」的感知吻合（库早已处于坏状态，本次同步只是让用户升级到了含 mcode 查询的构建）。

# 范围

- `src-tauri/src/database/schema.rs`：新增迁移步骤 `20 =>`（v20→v21）：为 `mcp_servers` 幂等补齐 `enabled_mcode`、`enabled_pi`，为 `skills` 幂等补齐 `enabled_mcode`；现有 v18→v19 捆绑步骤保持不变（≤18 的库仍走原链路）。
- `src-tauri/src/database/mod.rs`：`SCHEMA_VERSION` 20 → 21。
- 新增迁移单测：覆盖 v19 起点（旧 fork 库，缺 mcode）与 v20 起点（v4.0.2+ 已迁移库，缺 mcode）两条修复路径，迁移后执行 MCP 列表 SELECT 验证可查询且旧数据保留。
- 更新 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 `schema.rs` 共享文件行：补记 v21 修复迁移，防止下次同步丢失。
- 上游同步：按 `docs/HOW_TO_REBASE_UPSTREAM.md` §2 把 main rebase 到 upstream/main（当前唯一新增提交 d35726e2，test-only：hermes scan-limit fixture 批量插入），fork 侧 117 个提交按原顺序重放，rerere 复用既有解法，`.comet/config.yaml` 按记忆坑位保护。
- 顺序：先 rebase 同步再实现修复，使全部验收在最终合并态上一次性完成。
- 版本号维持 4.0.3-1：上游无新发布（无新 tag），仅 post-release 测试提交。

# 非目标

- 不改 MCP 列表 UI 与 DAO 查询语句。
- 不改上游共享代码的行为（除上述 schema 修复与手册补记）。
- 不新增 fork 功能，不更新 forkOfficialAllowlist。
- 不推送 origin/main：current 工作区归档不执行 push；如需推送由用户另行授权（rebase 改写历史需 `--force-with-lease`）。
- 不清理本地遗留分支、不同步 upstream 其他分支。

# 验收示例

- A1: 新增单测证明 v19 起点修复路径：构造 `user_version=19`、`mcp_servers` 缺 `enabled_mcode` 的库（模拟旧 fork 构建升过的库），`apply_schema_migrations` 后 `user_version == SCHEMA_VERSION(21)`，`enabled_mcode`、`enabled_pi` 列存在，迁移前插入的行数据保留，且 `dao/mcp.rs` 的 MCP 列表 SELECT 能在该库上执行成功。
- A2: 新增单测证明 v20 起点路径：`user_version=20`、缺 `enabled_mcode` 的库迁移到 21 后列补齐；`skills` 表缺 `enabled_mcode` 时同样补齐。
- A3: 既有迁移与备份单测不回归：`cargo test` 通过（沿用既有例外：`--skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`）。
- A4: `cargo check` 通过。
- A5: `pnpm typecheck` 通过。
- A6: `pnpm test:unit` 通过。
- A7: rebase 后 `git merge-base main upstream/main` 等于 upstream/main HEAD（d35726e2），`git branch --contains d35726e2` 包含 main；`git log upstream/main..main` 仅含 fork 提交，与 rebase 前 fork 提交一一对应（原顺序重放，允许 git 判定的等价去重），另加本次修复提交。
- A8: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A9: `docs/HOW_TO_REBASE_UPSTREAM.md` §4 的 `schema.rs` 行已补记 v21 修复迁移语义；fork 专属文件抽查（`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/components/devpanel/`）在 rebase 后仍存在。

# 约束与不变量

- 修复迁移必须幂等（`add_column_if_missing`），不得改动或丢失任何既有行数据。
- 保持不变量「任意 `user_version < SCHEMA_VERSION` 的库都能一路迁移到当前版本」；本次修复正是对该不变量曾被破坏处（v19 双语义）的补丁。
- rebase 按 `docs/HOW_TO_REBASE_UPSTREAM.md` 执行：fork 专属文件保留 fork 侧，共享文件取上游版本叠加 fork 必要改动；不确定的冲突不盲目 `--continue`；局面不可收拾时 `git rebase --abort` 回到起点。
- `.comet/config.yaml` 与 `docs/comet/**` 流程产物按 fork 侧保留；重放改写 `.comet/config.yaml` 时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 已知流程坑位：current 工作区 rebase 检出新基线瞬间可能触发 Shape recovery（工作树短暂缺少 docs/comet/specs），按 Runtime 返回的恢复命令处理。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对提交是否实际落盘（.git/rebase-merge 状态），不盲目重放。

# 决策

- 修复方式：v20→v21 版本递增修复迁移，而非「每次启动幂等补列」或回滚重排 v19。理由：沿用代码库既有迁移惯例（版本递增 + savepoint 原子性 + 迁移前自动备份），不动上游历史迁移语义，风险最低；重排 v19 会让已到 v20 的库再次跳过，等号两侧都无法安全插入。
- 缺失列范围：同时补 `enabled_mcode` 与 `enabled_pi`（mcp_servers）及 `enabled_mcode`（skills）——错误只报了第一个缺失列，pi 在同一批编号冲突窗口内，一并幂等兜底成本为零。
- 同步范围：upstream/main 全量一次 rebase（当前仅 d35726e2），不做 cherry-pick；上游无新发布，版本号维持 4.0.3-1，不产生 4.0.4-1。
- 执行顺序：先同步后修复，验收一次性覆盖最终态，避免修复后 rebase 触发二次全量验证。
- 隔离方式：current（工作区干净、无并行意图、无其他 active change）。
- 推送：不在本 change 内执行；用户要求推送时另行授权后 `--force-with-lease`。

# 未决问题

- 无。

# 验证预期

- `cargo check`（src-tauri）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
- `pnpm typecheck`
- `pnpm test:unit`
- Git 核对：`git merge-base main upstream/main`、`git branch --contains d35726e2`、`git log --oneline upstream/main..main | wc -l`、`git diff <rebase前HEAD> main -- src/config/forkBuild.ts`（应为空）、`.comet/config.yaml` 内容
- 迁移单测：新增用例（v19 起点、v20 起点）断言 user_version、列存在、数据保留、MCP SELECT 可执行
