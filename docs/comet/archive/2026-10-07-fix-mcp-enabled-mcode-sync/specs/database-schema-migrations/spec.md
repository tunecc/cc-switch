# database-schema-migrations Specification

## Purpose
保证 cc-switch 数据库（`~/.cc-switch/cc-switch.db`）从任何历史 `user_version`（0 至当前 `SCHEMA_VERSION`）都能无损迁移到当前 schema：迁移链按版本递增执行、每步幂等可重入、迁移失败整体回滚（savepoint）、升级前自动备份。fork 侧特别不变量：v4.0.2 同步 rebase 曾把 fork 的 v18→v19（`website_url_2`）与上游的 v18→v19（`enabled_mcode`）合并为一步，导致已处于 v19 的老 fork 库跳过 mcode 列——修复迁移必须兜住这条被跳过的路径，使 MCP / Skills 列表查询在任何升级路径下都能执行。

## Requirements

### Requirement: v21 修复迁移补齐 fork 升级路径缺失列
应用 SHALL 提供 v20→v21 修复迁移：对 `mcp_servers` 表幂等补齐 `enabled_mcode`、`enabled_pi` 列（`BOOLEAN NOT NULL DEFAULT 0`），对 `skills` 表幂等补齐 `enabled_mcode` 列。迁移 MUST 使用 `add_column_if_missing`（列已存在时不报错、不改动），MUST 保留全部既有行数据，且 MUST 与既有 v18→v19 捆绑步骤、v19→v20 步骤并存（低版本库仍走原链路后进入本步）。`SCHEMA_VERSION` SHALL 从 20 升为 21。

#### Scenario: 旧 fork v19 库补齐 mcode 列
- **WHEN** `user_version=19` 且 `mcp_servers` 缺 `enabled_mcode` 列、缺 `enabled_pi` 列（模拟老 fork 构建升级过的库），表中已有数据行
- **THEN** 迁移完成后 `user_version` 等于 `SCHEMA_VERSION`（21），两列存在且旧行保留（默认值 0），MCP 列表 SELECT（含全部 enabled_* 列）在该库上执行成功

#### Scenario: v20 库补齐 mcode 列
- **WHEN** `user_version=20` 且 `mcp_servers` / `skills` 缺 `enabled_mcode` 列（v4.0.2+ 已迁移但缺列的库）
- **THEN** 迁移完成后 `user_version` 等于 21，两个表的 `enabled_mcode` 均存在，既有数据不变

#### Scenario: 列已存在时迁移幂等
- **WHEN** 库已含全部目标列（如全新建库）执行 v20→v21 迁移
- **THEN** 迁移无错误完成，列定义与数据不受影响

### Requirement: 迁移链全路径可达
迁移链 SHALL 覆盖 0 至 `SCHEMA_VERSION` 的每个中间版本且无缺口：任意 `user_version < SCHEMA_VERSION` 的库启动应用后 MUST 迁移到当前版本；`user_version > SCHEMA_VERSION` 的库 MUST 拒绝启动并提示升级应用（既有行为不变）。

#### Scenario: v19 起点全链路迁移
- **WHEN** `user_version=19` 的任意合法 schema（fork 或上游形态）执行迁移
- **THEN** 依次经过 v20、v21 步骤，最终 `user_version` 等于 `SCHEMA_VERSION`，过程中不因列已存在/不存在而失败

### Requirement: fork 迁移合并语义文档化
`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表中 `schema.rs` 行 SHALL 记录 v21 修复迁移的存在与动机（v19 双语义历史缺口），使后续上游同步 rebase 解决 schema.rs 冲突时不丢失该步骤。

#### Scenario: 手册含修复迁移条目
- **WHEN** 查看 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件语义表
- **THEN** `schema.rs` 行包含 v21 修复迁移（mcp_servers.enabled_mcode/enabled_pi、skills.enabled_mcode）及 v19 双语义背景说明
