# 完整目标规格：upstream-sync（v4.0.35 轮）

> 本文件是 `sync-upstream-v433-v435` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.32）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-15-sync-upstream-v432/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.35`（tag 对象 `52315d40a2f71c8c9275585c03ef1c7d5b0cb136`，2026-11-17 发布），fork 版本号 `4.0.32-1` → `4.0.35-1`。同步后 fork main = 上游 v4.0.35 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.32..v4.0.35` 共 112 个提交、494 个文件、+35,836/−36,029，覆盖三个发布：v4.0.33（24 提交）、v4.0.34（68 提交）、v4.0.35（20 提交）。发布主轴是**技能仓库多主机（GitLab/Gitea/Forgejo）与数据库 v27**、**模型列表获取与同步兼容性修复群**、**代理/Codex/Copilot 修复群**，以及一轮大规模结构重构（工具表、forwarder 拆分、DAO `&AppType`、设置目录表、语言表、集成测试归置）。

**上游是否重写了 fork 已有功能——本轮结论：无新的二选一；唯一延续取舍是应用内更新器，按 v4.0.32 轮 Q1 = A 保留 fork 现状。**

1. **fork 功能标识全量扫描**：对 `v4.0.32..v4.0.35` 上游新增行扫 `websiteUrl2`、`website_url_2`、`connectivity`、`TestDialog`、`QuickSwitch`、`visibleSidebarPanels`、`quickSort`、`DevPanel`、`forkBuild`、`forkOfficial`、`Allowlist`、`SearchableModel`、`ImportEntry`、`pinProvider`、`trayPanel`、`ModelQuickSwitch`、`tray_left_click` 等标识，命中仅限共享文件里的语义相邻项（`connectivity`/`trayPanel` 的文件名、`SearchableModel` 相关测试引用），无一处是上游重复实现 fork 功能。
2. **唯一跨轮延续取舍 = 应用内更新器**：上游 v4.0.34 `429cacea5`「发现新版本后立刻开始自动下载」、`b72af3d4e` 提示框重排与 v4.0.35 的相关改动，继续增强 fork 早已整体关闭的应用内更新器。这不是「上游顺手实现了 fork 的功能」，而是「上游继续改写 fork 主动放弃的链路」。**用户已决定（2026-11-15，Q1 = A）：保留 fork 现状，上游更新器域整体不采纳**，终态见「更新器域终态」。
3. **同域相邻项逐条排除**：
   - 上游 `services/mcp_connectivity.rs` 只修 panic 后锁恢复（`9a9b9c034`），测的是 MCP 服务器连通性；fork 的逐模型连通性测试测供应商模型可达性与首 token，实现、入口、数据均不重叠，两条链并存。
   - 上游 `src/config/appSpecs.ts` 新增 `officialSubscription` 能力位与后端 `AppType::spec`，是应用能力元数据集中化，不含「模型徽章 / 连通性测试 / 跨应用导入 / 侧栏面板可见性」语义；fork 的 `MODEL_CAPABLE_APPS` 与 `shouldShowTestEntry` 保持独立判据。
   - 上游 `src/config/directoryApps.ts` 与 `settings.rs::get_override_dir(&AppType)` 是配置目录覆盖项集中化，与 fork 的侧栏面板可见性不同域。
   - 上游 `src/i18n/languages.ts` 是语言列表单一事实来源，与 fork 专属 locale 键段无冲突。
   - 上游 Ollama Cloud 套餐额度（`1d68de345`）是 URL 识别 + 额度查询，不是供应商预设可见性功能；fork 的 `forkOfficialAllowlist` 判据不变。
   - 上游 `src/components/skills/repoUrl.ts` 支持 GitLab/Gitea/Forgejo 仓库，fork 无自有主机判定，直接落地。
   - 上游 `5ed281955` 删除 Antigravity CLI 会话，fork 无自有该功能，直接落地。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.35` 剥离出的提交 `61c43c036ec7eb3a6950b292729d6a7094abe716`。
- `git merge-base main v4.0.35^{}` == `61c43c036e`；`git log v4.0.35..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 fork 提交（`git rev-list --count v4.0.32..main`，同步前 main = `98b5805b6`，实测 219）按原顺序重放，外加本轮的同步终态提交与归档提交；终态计数以现取命令为准，不在本规格写死。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；主题序列逐行 diff 为 0（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v433-v435`（= `98b5805b6`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.32`（剥离 `93d2381c8`）与 fork 发布 tag `v4.0.32-1` 保持不变、不改写历史。
- `upstream/main` 上 tag 之后仍有 5 个提交，**本轮不同步**；只锁已发布 tag。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。

### 同步范围（v4.0.32..v4.0.35：112 提交、494 文件）

1. **Ollama Cloud 套餐额度**：`services/coding_plan.rs` 的 `CodingPlanProvider::OllamaCloud`、`detect_provider` 的 host 匹配、`parse_ollama_cloud_tiers`、`query_ollama_cloud`；`src/config/codingPlanProviders.ts` 的 `ollama_cloud` 条目与前后端双向 fixture；本地 `localhost:11434`/`127.0.0.1` 与相似主机不命中。
2. **Claude 官方切换 tombstone 链路**：`9bc682432`（#9247）——连接键先写空值再延时清扫、`claude-tombstones.json`、启动恢复、`AWS_*` 直删、编辑当前供应商同路径。
3. **模型列表获取**：`eb8c190ac`（Gemini Native 走 `x-goog-api-key` + `/v1beta/models`、`pageSize=1000`）、`373c223f8`（Gemini CLI 原生获取）、`85eddc467`（默认 User-Agent）。
4. **技能仓库多主机与 schema 27**：`dbc7eb713`/`8cb33413b`、`src/components/skills/repoUrl.ts`、`skill_repos.host`、`skills.repo_host`、导入/安装/更新/文档入口按站点分流、公开 https only。
5. **Antigravity / WorkBuddy**：`a6f0101b9`（Windows 切号）、`5ed281955`（删 CLI 会话并清理索引摘要）、`035bd9f12`（WorkBuddy 思考强度）。
6. **同步兼容性**：`d39705271`（WebDAV MKCOL 400）、`0ec969ca2`（真实失败原因）、`b2b0f2642`（S3 重读设置）、`98d2781c6`（国内云虚拟主机）、`f94b702af`（失效链接跳过）、`a87c79bdb`（S3 清除配置）、`65cd7ac89`（Hermes 目录同步）。
7. **代理 / Codex / Copilot 修复**：`d5dfa8305`（`required: null`）、`f7002d1e2`（空用户消息）、`a559a0e1e`/`625dff3f7`（Responses-Lite 目录与终端）、`f5ab4dfad`（auto 模式去关闭思考重试）、`058aa18cc`（Fable 5.1/5.2 ID）、`ed6d51e59`（Copilot Gemini 系统消息）、`182e1b730`（Copilot 1M）、`db54a7751`（OAuth client 0.169.0）。
8. **会话 / 用量 / 技能 / 定价**：`fe6acd377`（`/goal` 完整目标）、`e89dc9eaf`（请求 ID 复制）、`8b2f34322`（日期范围边界）、`bdbc9604b`（托管副本缺失仍可卸载）、`db09fcb88`（Hydrogen Orchestrator 计价）、`6daff81b6`（Qwen4 Max）、`fb453fb5d`（GPT-6.2 Sol/Astra）、`684c388ac`（Skill 原子替换）。
9. **结构性重构**：`e30ef18d0`/`3bd8b4572`/`66b922fce`/`f4ef3ebae`/`26831d4e7`/`176bb05ee`（工具表与子模块）、`69cdc63ce`/`3493be84a`/`09678477e`（forwarder 拆分）、`f9e40d4f0`（DAO `&AppType`）、`4f92be183`/`585f09aca`/`98e43cfb2`（配置目录表）、`3cf78371f`（语言表）、`52915b091`（集成测试单二进制）、`3630d9deb`（WebDAV/S3 命令合并）、`b2b0f2642`（auto_sync worker）、`7a5e71350`（usage HTTP 复用）。
10. **测试与一致性**：`8dc7c7040`/`57d179601`/`22fbd14b3`/`ec2b2c213`（backendConstants/languages/tools fixture 与统一 localeParity）、`5e33300b2`（文档语言数修正）、`tests/lib/registeredCommands.test.ts`。
11. **CI 与物料**：`ci.yml` 删 `CARGO_PROFILE_DEV_DEBUG` env；`Cargo.toml` 加 `[profile.dev] debug = "line-tables-only"`、删 `once_cell`、加 `Win32_Security_Credentials`；`release.yml` 上游本轮零改动。

新增文件 35 个（不含 release notes 与 whats-new），删除 4 个源码文件与 4 个手挑 locale 测试文件，`src-tauri/tests/` 下 41 个路径迁入 `src-tauri/tests/integration/`。

### 数据库 schema 终态（27）

- `SCHEMA_VERSION = 27`（与上游一致，无撞号、无新臂）。
- `26 → 27` 迁移臂：`skill_repos` 加 `host TEXT NOT NULL DEFAULT 'github.com'`、`skills` 加 `repo_host TEXT`；都用 `add_column_if_missing` + `table_exists` 保护，老行不回填。
- `create_tables` 的 `skill_repos` 与 `skills` 含新列；`stream_check_logs` 建表、`providers.website_url_2`、fork 既有全部迁移臂保持不变。
- `database/tests.rs` 新增 `migration_v26_to_v27_adds_skill_repo_host`，并把两个 `migrate_from_json_dry_run` 用例改写为 `Database::memory()` + `migrate_from_json`（上游已删 dry-run）。

### 孤儿 stream_check 豁免终态（延续）

- 上游本轮改 `src-tauri/src/commands/stream_check.rs` 与若干 proxy 调用点，随文件落地；fork **不恢复** `pub mod stream_check;` 声明、`commands/stream_check.rs` 与 `database/dao/stream_check.rs` 保持不存在、`stream_check_provider` 全仓 0 命中。
- `src/lib/api/connectivity-check.ts` 与 `src/hooks/useStreamCheck.ts`（上游文件、fork 从未修改）仍随上游落地；必须重新确认「无组件调用 `useStreamCheck`」仍然成立，一旦上游接入 UI 即为 fork 侧运行时报错点。

### 工具生命周期与配置目录终态

- `commands/misc.rs` 取上游 `ToolSpec` 表与 5 个 `tool_*` 子模块；fork 的 4 处 tunecc URL 与两个测试断言保持 `https://github.com/tunecc/cc-switch/releases`，`git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 必须 0 命中。
- `settings.rs` 取上游 `get_override_dir(&AppType)` 与 `LANGUAGES` 常量；fork 的 `VisibleSidebarPanels` 字段段、`S3SyncSettings.preset` 等上游新段并存。
- `src/config/directoryApps.ts`、`src/i18n/languages.ts` 整文件取上游；`tests/config/languages.json` 与 `tests/config/backendConstants.json` 由后端生成/共用，前端测试双向比对。

### 本地化终态（8 语种）

- 8 个 locale 的上游新增/改写/删除逐字取上游（新增含 `skills.repo.httpsOnly`、`settings.s3Sync.clear*`、`usage.detail.copyRequestId*`、`workbuddy.form.thinkingEffort*`、`sessionManager.reader.event.goal*`、`providerForm.copilotOneM*`、`autoUpdate.downloadedInline`/`downloadingInline`）。
- `tr.json` 与 `v4.0.35` tag **逐字节一致**、不补 fork 键。
- `src/config/forkOnlyLocaleKeys.ts` 的 `FORK_ONLY_LOCALE_KEYS` 按新基线重新生成（`en.json` 减 `git show v4.0.35:src/i18n/locales/en.json`，实测 395 键），更新后必须仍由生成结果驱动、注明重新生成方式；`FORK_REMOVED_LOCALE_KEYS` 收录 5 个 `streamCheck.*`、9 个 `autoUpdate.*`（含 v4.0.34 新增 2 个）。
- `localeParity`/`readmeParity` 口径不变：只豁免 fork 专属键与 fork 专属改写的 `README.md`，上游键校验强度不变；统一后的 `localeParity` 还要校验「代码里字面量 key 在 en.json 有定义」。
- 合并后对全部 8 个文件按对象作用域显式查重，`dup=0`。

### 上游删除 API 与死代码终态

- `commands/lightweight.rs`、`proxy/providers/models/{mod,anthropic,openai}.rs`、`tests/config/{agyLocales,managementListLocales,toolManagementLocales,xaiOauthLocales}.test.ts` 随上游删除，fork 侧零引用。
- 上游删除的 `getClaudeCodeConfigPath`/`getAppConfigPath`/`getAutoLaunchStatus`、`getGeminiPresetByName`/`getGeminiPresetByUrl`、`migrate_from_json_dry_run`、`replace_provider_id`：fork 侧零引用的随上游删除；`database/tests.rs` 的 dry-run 用例随上游改写；`replace_provider_id` 需在 Build 阶段实测 `git grep`，零调用才删，有调用则改 `&AppType` 签名保留。
- `registeredCommands.test.ts` 终态必须零 stale wrapper：前端 `invoke` 的每个命令名都在后端 `invoke_handler` 注册表里。

### 更新器域终态（Q1 = A：保留 fork 现状，整体不采纳）

- 上游本轮更新器域的部件**一律不落地**：`src-tauri/src/app_update.rs` 的 `enabled` 字段与 `AutoUpdateStatus.enabled`、`UpdateContext` 的 `autoUpdateDownloading`/`startAutoDownload` 与「发现新版本立即下载」effect、`AboutSection` 的内联下载状态与 `startAutoDownload` 调用、`AutoUpdatePrompt.tsx` 重排、`lib/api/settings.ts` 的 `downloadAppUpdate` 绑定、`app-update-ready` 事件的新增载荷语义。
- fork 现状保留：`install_update_and_restart` 与 `check_app_update_available` 两个空壳命令、`lib/updater.ts` 恒返回 `up-to-date`、`UpdateContext` 现有字段、`AboutSection` 的「检查更新 = 打开 tunecc Releases 页」、无 `updater:default` 能力、无 updater 依赖。
- `commands/misc.rs` 的 `is_portable_mode` 保留 fork 自带实现，**不得**改为 `crate::app_update::is_portable()`（该模块不存在会编译失败）。
- 取证：`git grep -I -n 'tauri_plugin_updater\|plugin-updater\|app_update' HEAD -- src-tauri/src src` 零命中（`install_update_and_restart`/`check_app_update_available` 两个桩名除外，逐条说明）；`git grep -n 'autoUpdateEnabled\|auto_update_enabled\|latest.json' HEAD -- src src-tauri` 零命中。
- 禁止半套：编译通过但「检查更新」指向上游 Releases、或按钮点了没反应，都不接受。

### CI 终态

- `ci.yml` = fork 现有结构（删 `CARGO_PROFILE_DEV_DEBUG` env）+ 上游其余改动；fork 裁剪语义全部保留：无 `schedule`/`workflow_dispatch`、四个 job 的 fork `if`、后端 `cargo nextest`、WSL2 restore-only rust-cache 与 `continue-on-error`。
- `release.yml` 上游本轮零改动 → 保持 fork 裁剪版：只构建 Windows x64 与 macOS arm64 unsigned、tag 守卫、MSI `REBOOT=ReallySuppress` 断言、**macOS runner `macos-15`**、`$dest` 不带 `$assetSuffix`。按 Q1 = A，不引入签名步骤与 `latest.json` 产物。

### 构建物料终态

- `package.json`：`version = "4.0.35-1"`、`dev:fork` 脚本保留、无 `@tauri-apps/plugin-updater`。
- `src-tauri/Cargo.toml`：`version = "4.0.35-1"`、`repository` 指 tunecc、`codegen-units = 1`、`[profile.dev] debug = "line-tables-only"`、无 `tauri-plugin-updater`、无 `once_cell`。
- `src-tauri/tauri.conf.json`：版本 `4.0.35-1`；无 `plugins.updater`（Q1 = A，上游该段不落地）。
- `src-tauri/Cargo.lock`：只允许本轮上游依赖变动（`once_cell` 移除、`windows-sys` feature、其他上游传递依赖）与 `cc-switch` 版本行改动；不得出现 `tauri-plugin-updater`。
- `pnpm-lock.yaml`：上游本轮无改动，终态无 updater 三段。

### 预设白名单终态

- 上游本轮净新增预设族为 0（Pi 预设只是把重复模型列表收敛为 `claude55Models()`/`gpt6Models()` 并修正旧显示名，`geminiProviderPresets` 删两个未用导出）；`forkOfficialAllowlist.ts` 预期零改动，若因上游条目改名产生悬空条目，按上游 `name` 逐字修正，不新增可见预设。
- 过滤顺序与判定实现不改：编号 → 过滤上游 `hidden` → 过滤 `filterForkPresets` 白名单。
- `src/config/{codex,gemini,hermes,pi}ProviderPresets.ts` 取上游内容，fork 各 interface 的 `hidden?: boolean` 保留一份。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- `IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`devpanel/`、连通性测试前后端链路（`services/connectivity_test/`、`commands/connectivity_test.rs`、两个命令注册、`ConnectivityBadge`/对话框/批量检测、`useConnectivityProbe`、`shouldShowTestEntry`）、模型徽章与 `ModelQuickSwitch/`、`websiteUrl2` 全链路（含 `database/dao/providers.rs` 两条 SELECT 与 UPDATE 守卫）、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏 `tray_left_click_never_opens_the_menu`、跨应用导入接线、右键置顶/置底、tunecc 4 处 URL 与两个测试断言、无 `stream_check` 接线。
- 更新器域取证按 Q1 = A 执行：`tauri_plugin_updater`/`plugin-updater`/`app_update`/`auto_update_enabled`/`AutoUpdatePrompt` 在 `src-tauri/src` 与 `src` 零命中（`install_update_and_restart`/`check_app_update_available` 两个既有空壳除外）；`capabilities/default.json` 无 `updater:default`。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮实测修订（新增 `appSpecs.officialSubscription`、DAO `&AppType`、工具表拆分、forwarder 拆分、schema 27、locale 基线刷新、删除 API 边界、更新器域取舍），新增 §4.16「v4.0.33–v4.0.35 轮的叠加要点」。
- `docs/comet/specs/upstream-sync/spec.md`：归档时整体重写为本轮终态（本文件）。
- `docs/comet/specs/database-schema-migrations/spec.md`：本轮 schema 26→27，确认终态描述为 27。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 重放前后提交数之差只允许「被判空丢弃」或「本轮新增」；主题序列 diff 为 0；patch-id 差异逐条归类「冲突停车」或「仅上下文位移/被上游同名声明消化」；冲突停车清单逐条记录文件、双方语义与解法。
- `.comet/config.yaml` 在 rebase 中途被历史提交改回旧内容时，按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并纳入提交；终态与同步前一致。

### 落地保真核对（口径，最终态复算）

- 四 ref 行多重集差集：`v4.0.35` / `v4.0.32`（基线） / `pre-sync-v433-v435` / `HEAD`；494 个上游文件与 fork 侧代码文件全部参与；非重叠上游文件在 fork 侧缺失为 0；重叠 55 文件的两侧缺失行逐行归因并带重数；归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 更新器域取舍 / 被删文件 / 锁文件重算）」；出现无法归类的缺失行即判定失败。
- 复算脚本 `scripts/fidelity-v433-v435.py` 随 Build 落地，可重复执行、不含硬编码条数；复算必须在最终态提交之后进行。

### 版本号

- 四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包）终态统一 `4.0.35-1`；本地 annotated tag `v4.0.35-1` 在验收通过、用户接受归档并单独授权交付后创建并推送。

### 交付（归档后单独授权）

- Build/Verify 不执行任何远端写操作；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.35-1` 的推送；只授权这两项远端动作，不创建 PR。

### `.comet/config.yaml` 保护

- 该文件是 fork 专属文件且会被重放的历史提交改回旧内容；rebase 中途显式恢复并纳入提交，否则 Native Hook 拒绝写入；终态与同步前一致。

### 已知流程坑位（沿用 + 本轮新增）

- 沿用：取证 fetch 禁 `--prune-tags`；`.comet/config.yaml` rebase 保护；预设 id 编号契约；locale 对象作用域查重；`cargo fmt --check` 进正式检查计划；绝对条数一律用现取口径；时间敏感用例 flaky 边界按「与上游逐字节比对 + 本地重复跑」判定。
- 本轮新增：①上游 DAO 全量改 `&AppType`，fork 的 `commands/connectivity_test.rs` 与 `lib.rs` 两处 `get_all_providers("...")` 必须同步适配，漏一处编译失败；②上游删了一批「前端 wrapper 还在、后端命令已删」的 API，`registeredCommands.test.ts` 会把 fork 的 stale wrapper 测红，收尾必须实测零引用后删除；③`migrate_from_json_dry_run` 被上游删除，fork `database/tests.rs` 两个用例要按上游改写成 `Database::memory()`；④schema 本轮不撞号（双方都是 26），直接采用 27，不要习惯性再造 fork 修复臂；⑤`forkOnlyLocaleKeys.ts` 必须按 v4.0.35 重新生成，且 `FORK_REMOVED_LOCALE_KEYS` 要补 v4.0.34 新增的两个 `autoUpdate` 键；⑥`ci.yml` 的 `CARGO_PROFILE_DEV_DEBUG` env 被上游移到 `Cargo.toml`，不能只取一侧导致调试信息配置丢失或重复；⑦上游把集成测试整体迁进 `src-tauri/tests/integration/`，fork 侧如有路径引用要同步，且新 `main.rs` 与既有 `support` 模块布局要一致。
