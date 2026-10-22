# database-schema-migrations Specification

## Purpose
保证 cc-switch 数据库（`~/.cc-switch/cc-switch.db`）从任何历史 `user_version`（0 至当前 `SCHEMA_VERSION`）都能无损迁移到当前 schema：迁移链按版本递增执行、每步幂等可重入、迁移失败整体回滚（savepoint）、升级前自动备份。fork 侧特别不变量：v4.0.2 同步 rebase 曾把 fork 的 v18→v19（`website_url_2`）与上游的 v18→v19（`enabled_mcode`）合并为一步，导致已处于 v19 的老 fork 库跳过 mcode 列——修复迁移必须兜住这条被跳过的路径，使 MCP / Skills 列表查询在任何升级路径下都能执行。另一条不变量来自 v4.0.18：上游把 v20→v21 定义为新增 AGY 列，而 fork 的 v21 是 mcode/pi 修复迁移（同号不同内容），因此 v21→v22 必须幂等补齐 AGY 列，同时服务「上游 v21（已有 agy 列）」与「fork v4.0.17-1 v21（无 agy 列）」两种库。

## Requirements

### Requirement: v21 修复迁移补齐 fork 升级路径缺失列并添加 AGY 列
应用 SHALL 提供 v20→v21 修复迁移：对 `mcp_servers` 表幂等补齐 `enabled_mcode`、`enabled_pi`、`enabled_agy` 列（`BOOLEAN NOT NULL DEFAULT 0`），对 `skills` 表幂等补齐 `enabled_mcode`、`enabled_agy` 列。迁移 MUST 使用 `add_column_if_missing`（列已存在时不报错、不改动），MUST 保留全部既有行数据，且 MUST 与既有 v18→v19 捆绑步骤、v19→v20 步骤并存（低版本库仍走原链路后进入本步）。本步完成后 `user_version` SHALL 为 21。

#### Scenario: 旧 fork v19 库补齐 mcode 列
- **WHEN** `user_version=19` 且 `mcp_servers` 缺 `enabled_mcode` 列、缺 `enabled_pi` 列（模拟老 fork 构建升级过的库），表中已有数据行
- **THEN** 迁移完成后 `user_version` 等于 `SCHEMA_VERSION`（22），两列与 `enabled_agy` 存在且旧行保留（默认值 0），MCP 列表 SELECT（含全部 enabled_* 列）在该库上执行成功

#### Scenario: v20 库补齐 mcode 列
- **WHEN** `user_version=20` 且 `mcp_servers` / `skills` 缺 `enabled_mcode` 列（v4.0.2+ 已迁移但缺列的库）
- **THEN** 迁移完成后 `user_version` 等于 22，两个表的 `enabled_mcode` 与 `enabled_agy` 均存在，既有数据不变

#### Scenario: 列已存在时迁移幂等
- **WHEN** 库已含全部目标列（如全新建库）执行 v20→v21 迁移
- **THEN** 迁移无错误完成，列定义与数据不受影响

### Requirement: v21→v22 幂等补齐 AGY 列
应用 SHALL 提供 v21→v22 迁移：对 `mcp_servers` 与 `skills` 表幂等补齐 `enabled_agy`（`BOOLEAN NOT NULL DEFAULT 0`），随后把 `user_version` 设为 22。该步骤 MUST 同时覆盖两种 v21 库：上游 v4.0.18 的 v21（已带 agy 列，步骤为 no-op）与 fork v4.0.17-1 的 v21（无 agy 列，补列）。`SCHEMA_VERSION` SHALL 为 22。

#### Scenario: fork v21 库补 AGY 列
- **WHEN** 库 `user_version=21` 且 `mcp_servers`/`skills` 缺 `enabled_agy`（fork v4.0.17-1 升级过的库）
- **THEN** 迁移完成后 `user_version=22`，两表 `enabled_agy` 存在、旧行默认值为 0；重复执行迁移不报错、不重复加列

#### Scenario: 上游 v21 库升级
- **WHEN** 库 `user_version=21` 且已含 `enabled_agy`（上游 v4.0.18 建/升的库）
- **THEN** 迁移完成后 `user_version=22`，既有 agy 开关值原样保留

### Requirement: 迁移链全路径可达
迁移链 SHALL 覆盖 0 至 `SCHEMA_VERSION` 的每个中间版本且无缺口：任意 `user_version < SCHEMA_VERSION` 的库启动应用后 MUST 迁移到当前版本；`user_version > SCHEMA_VERSION`（例如 fork v22 库被上游 v21 构建打开）MUST 拒绝启动并提示升级应用（既有行为不变，降级不兼容）。

#### Scenario: v19 起点全链路迁移
- **WHEN** `user_version=19` 的任意合法 schema（fork 或上游形态）执行迁移
- **THEN** 依次经过 v20、v21、v22 步骤，最终 `user_version` 等于 `SCHEMA_VERSION`，过程中不因列已存在/不存在而失败

### Requirement: fork 迁移合并语义文档化
`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表中 `schema.rs` 行 SHALL 记录 v21 修复迁移与 21→22 幂等迁移的存在与动机（v19 双语义历史缺口、v4.0.18 的 v21 撞号），使后续上游同步 rebase 解决 schema.rs 冲突时不丢失这些步骤。

#### Scenario: 手册含修复迁移条目
- **WHEN** 查看 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件语义表与 §4.5
- **THEN** `schema.rs` 行与 §4.5 包含 v21 修复迁移（mcp_servers.enabled_mcode/enabled_pi、skills.enabled_mcode）、v21→v22 AGY 补列及 v19 双语义/v21 撞号背景说明

