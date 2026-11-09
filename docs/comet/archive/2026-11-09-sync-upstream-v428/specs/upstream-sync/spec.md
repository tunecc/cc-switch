# 完整目标规格：upstream-sync（v4.0.28 轮）

> 本文件是 `sync-upstream-v428` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.26）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-08-sync-upstream-v426/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.28`（tag 对象 `9bd119930cc4fc56b46415e88215d20eeab96726`，剥离提交 `8656ebd91f3eba631837126e29df71e8353b7e43`），fork 版本号 `4.0.26-1` → `4.0.28-1`。同步后 fork main = 上游 v4.0.28 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.26..v4.0.28` 共 63 个提交、214 个文件、+12086/−1347（35 新增 / 178 修改 / 1 重命名）。本轮横跨 v4.0.27（2026-11-07 发布）与 v4.0.28（2026-11-08 发布）两个发布点。v4.0.27 主轴是**会话正文搜索（FTS5）、界面密度与缩放、Skills 已安装页重排、定价表搜索、Grok Build 终端、供应商图标随主题**；v4.0.28 主轴是**适配 Codex 11-08 不兼容更新（会话分组、暂停官方登录、额度保护默认开）与应用页安装进度**。

**上游是否重写了 fork 已有功能——本轮结论：没有同域重复，不产生二选一。** 取证与逐项分析：

1. **同名域「连通性测试」是孤儿文件维护，不是重复实现**：上游 `1d6efa644`（#9253）修复 stream_check 的 reachability 不跟随重定向，落点 `services/stream_check.rs`（+45）与 `proxy/http_client.rs`（+13 no-redirect client helper）。fork 早已整体移除 stream_check 可达链路（`services/mod.rs` 无模块声明、`commands/stream_check.rs` 与 dao 文件不存在、`stream_check_provider` 0 命中），fork 的供应商逐模型连通性测试（`services/connectivity_test/` + 两命令注册）是独立实现。按历轮孤儿豁免口径：修复落进孤儿文件、链路保持不可达。
2. **AGY 每周 Argon 额度不碰 fork 卡片副标题**：`4aa554ad2` 改 `services/agy_account/quota.rs`、`subscription_agy.rs`、`SubscriptionQuotaFooter.tsx`、`quota/quotaRules.ts`；fork 的 ProviderCard 副标题链（Codex 账号行 → 绑号 Claude 账号行 → AGY 当前模型 → 双官网链接 → 单官网链）位于 `ProviderCard.tsx`，两者无交集。
3. **Codex 切换提示与 fork 快捷切换互不干扰**：`c7f7caf26`/`e499d1f03` 的分桶提示走 `useProviderActions.ts`（fork 零语义）与 `SwitchResult.codex_history_split` 新字段；fork 的 `ModelQuickSwitch/`、模型徽章、1M 改写（`model_mapper.rs` 的 `strip_one_m_suffix*`）保持原样；上游新函数 `map_codex_failover_model`（`e9285cf18`）是故障转移换家时的模型映射，独立于 1M 链。
4. **Linux 托盘面板修复不触 fork 左键契约**：`cb2f23891`（轻量模式不透明画布 + `linux_fix.rs` webview 配置插件）、`c88d7cc17`（TrayPanel.tsx DPR 坐标）、`6a3a7a449`（注释）只动 `tray_panel.rs` 的 Linux 分支与前端面板；`tray.rs` 本轮上游零改动，fork 的 `TrayIconEvent::Click` 四分支、`set_show_menu_on_left_click(false)`、`panel_visible()` 不受影响。
5. **37 个重叠文件全部为不同行区域的机械叠加或上游单向新增**：`lib.rs`（上游 Linux webview 插件 + FTS5 三命令注册 + 迁移注释 vs fork updater 移除/托盘语义/connectivity 注册/Reopen 复用）；`misc.rs`（上游工具进度 + Grok 终端 vs fork 4 处 tunecc URL）；`settings.rs`、`commands/settings.rs`（上游密度/会话搜索/暂停登录/额度保护/迁移完成事件 vs fork `VisibleSidebarPanels` + updater 桩）；`GeneralSection.tsx`（上游密度设置区 vs fork 面板可见性区，顶部 import 行合并取并集）；`Sidebar.tsx`（上游 3 处 `h-nav-row` vs fork 过滤段）；`ProviderCard.tsx`（上游密度 token + 图标主题，行区间 403-438 vs fork 381-387 与 445+，实测不相交）；`provider.rs`/`deeplink/provider.rs`/`UniversalProviderFormModal.tsx`（上游删 `disable_response_storage` 模板行 vs fork `website_url_2` 字段）；`services/provider/mod.rs`（上游 `SwitchResult` 新字段 vs fork 测试补列）；`forwarder.rs`（上游 37 hunks vs fork 2326 注释/4855 测试补列）；`model_mapper.rs`（上游新函数+新测试 vs fork 2 处测试补列）；`tray_panel.rs`；`capabilities/default.json`（上游加 zoom 权限 vs fork 无 updater 权限）；`tauri.conf.json`/`Cargo.toml`/`Cargo.lock`/`package.json`/`release.yml`（版本与物料）；4 个 locale、4 个预设文件、5 个测试文件（golden 快照两侧改不同条目）。
6. **预设白名单维持过滤（用户 Q1 确认，2026-11-09）**：上游解隐藏 Mistral AI 并新增 TokenPlus、Genesis；三个都不进 `forkOfficialAllowlist.ts`，fork 构建下不可见，上游构建不受影响；`forkPresetFilter.ts` 判定实现不改。
7. **上游本轮零新增 Rust 依赖**（`Cargo.lock` 仅 cc-switch 版本行），`pnpm-lock.yaml` 上游零改动；`62de0f3e9` 把 `crate-type` 收敛为 `["rlib"]`（移动端才需要 staticlib/cdylib），fork 仅发桌面版，取上游。

因此本轮全部上游功能按上游落地（fork 已裁/已移除段除外），fork 魔改一律保留，无需用户做功能级取舍。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.28` 剥离出的提交 `8656ebd91f3eba631837126e29df71e8353b7e43`。
- `git merge-base main v4.0.28^{}` == `f621d4216`（v4.0.26 剥离提交）；`git log v4.0.28..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 fork 提交（`git rev-list --count v4.0.26..main`，同步前 main = `ccc035dd1`，即 origin/main，写作时实测 206）按原顺序重放，外加本轮的同步终态提交与归档提交；终态计数以现取命令为准，不在本规格写死。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v428`（= `ccc035dd1`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.26`（剥离 `f621d4216`）与 fork 发布 tag `v4.0.26-1` 保持不变、不改写历史。
- `upstream/main` 与 `v4.0.28` 齐平（`git rev-list --count v4.0.28..upstream/main` 现取 0）；不同步其他上游分支。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。
- 重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v428/` 产物。

### 同步范围（v4.0.26..v4.0.28：63 提交、214 文件、+12086/−1347）

上游本轮改动按功能分组（提交号便于 Build 阶段核对落地保真）：

1. **FTS5 会话正文搜索（1 提交，v4.0.27）**：`deb6d5a19`（新 `session_manager/search.rs`、`search_revision.rs`；独立索引文件 `session-index.db`，不进备份不参与云同步，关闭开关即删除；新命令 `sync_session_index`/`search_session_content`/`clear_session_index` 注册进 `lib.rs` invoke_handler；前端 `useSessionContentSearch.ts`、SessionManagerPage 搜索入口（⋯ 菜单）、命中片段列表；默认关）。
2. **界面密度与缩放（1 提交）**：`4e7413c5a`（新 `src/lib/interfacePrefs.ts`：密度 compact/comfortable 与缩放 90/100/110/125%，仅本机保存；`index.css` 密度 token、`tailwind.config.cjs` 新 `min-h-card`/`py-card-y`/`h-nav-row` 等命名 token、`main.tsx` 启动应用、`lib/utils.ts`；App.tsx Ctrl/⌘ +/-/0 快捷键；GeneralSection 外观区两项设置；托盘快捷面板保持紧凑；`capabilities/default.json` 加 `core:webview:allow-set-webview-zoom`）。
3. **Codex 会话分组适配（5 提交，v4.0.28 主轴）**：`905c91485`（路由/聚合模式下本机有 ChatGPT 登录且未开统一历史时，第三方供应商也写成内置 `openai` 标识，请求经本地路由替换 Key 并剥离 ChatGPT identity headers；重试/流重试/流空闲/远程压缩等配置仍写 `custom`；`8ff9e3b50` 剥离 `chatgpt-account-id`/`organization`/`originator` 等 identity 头）、`c7f7caf26`（直连切换分桶时提示只读会话数量，`SwitchResult.codex_history_split` + `codexHistorySplitHint.ts`）、`e499d1f03`（提示并进切换成功 toast）、`2c5e5d2c2`（统一历史下每次启动持续把 openai 桶会话迁进 custom）、`6a0acf075`（后台迁移完成发 `codex-unify-migration-finished` 事件，App.tsx 提示重启 Codex）。
4. **暂停官方登录与额度保护（2 提交）**：`b0e452ff2`（新设置 `codex_proxy_without_official_login`；官方额度保护默认开启；`e6256c50d` 开关从全局设置迁到路由/聚合设置的 `CodexPauseOfficialLogin.tsx`，变更即重写 Codex 配置、失败回滚）。
5. **应用页安装进度（1 提交）**：`810775eb2`（新 `commands/tool_lifecycle_progress.rs`：单任务队列状态「排队中/运行中 + 已用时间 + 命令输出最新一行」事件流；AppsPage 行内展示、离开页面回来进度还在）。
6. **代理与 Codex 修复（8 提交）**：`e9285cf18`（故障转移换家按目标映射模型，新 `model_mapper.rs::map_codex_failover_model`）、`cac921f5d`（图片/搜索请求不换模型）、`49f2882ef`/`71dbcfa2d`（Kimi/DeepSeek 原生 Responses 工具调用历史修复，新 `transform_codex_responses_kimi_history.rs`）、`0e49c8813`（压缩被拒时去 `tool_choice` 重试）、`4a8f113f0`（熔断探测 permit 归还）、`883382f1c`（熔断日志带「应用:供应商 id」与拒绝日志）、`13af7fc94`（Codex catalog 绝对路径指针）、`5f2f527d5`（不再写 `disable_response_storage`：`provider.rs`/`deeplink/provider.rs`/预设模板/金标快照联动清理）。
7. **Skills 与杂项修复（约 10 提交）**：`65106ce6c`（已安装页重排：名称列固定 + 横向滚动、工具栏筛选、去掉页头 N 个可更新链接）、`5bfca714f`/`747b13278`/`66e4362b6`（skill 哈希忽略 `__pycache__`/`.pyc` 与旧记录换算）、`a94226b16`（仓库计数按实际分支、失败写明原因）、`92ca821e4`（软链接配置写真实文件）、`05218b118`（右键禁 WebView 默认菜单，新 `disableContextMenu.ts`）、`566448f06`（对话框打开时窗口可拖动）、`c39db7df0`（图标首字代理对）、`e66441d80`（图标随主题去白底）、`8dab4ed47`（Windows Python pi.exe 不误识别）、`f3c88da99`（models.dev 60s 超时）、`07a10b9ce`（DSH YAML 报错带文件名）、`506f3cf83`/`e1f8acf64`（usage 文件 ID 兼容）、`44e7d3ef7`（deeplink 风险分类 IPv4-compatible/SIIT/NAT64）、`4aa554ad2`（AGY 每周 Argon 额度）、`b184a88c9`（WSL uninstall unused mut）、`97e6d82ad`（Codex 状态库备份单步化）、`40b602a3f`/`4e13413ff`（文档）。
8. **数据库与性能（1 提交）**：`6f9fa06dd`（`schema.rs` 新 `in_savepoint` helper；`create_tables_on_conn` 与 `ensure_model_pricing_seeded_on_conn` 包进 savepoint，Windows 新库首启快约 6s）。
9. **预设（4 提交）**：`4ed410ad8`（TokenPlus：codex/hermes/openclaw/opencode/pi 5 目录 + `piModelCatalog.ts` + tokenplus 图标）、`cd15a1642` + `2360631f5`（Genesis：claude/codex/pi + `model-fetch` 支持，随后内联样式对齐并删除 `genesisModels.ts`）、`b9fd5d99a`（Mistral AI 默认模型 `mistral-large-4` 并在 claude/codex/claude-desktop/hermes/openclaw 解隐藏，「获取 API Key」指向 Vibe CLI 密钥页，`presetSearchAliases` 加 Vibe）。fork 白名单维持过滤（D3），三族预设不在 `forkOfficialAllowlist.ts` 中。
10. **CI、发布与文档（5 提交）**：`b3594905f`（ci.yml：concurrency 按 PR/运行分组、`CARGO_PROFILE_DEV_DEBUG: line-tables-only`、fmt-check 移到 Linux 独占前置、rust-cache `save-if: main`、pnpm 改 `pnpm/action-setup` + `setup-node cache: pnpm`、后端 `timeout-minutes: 45`；release.yml 移除 4 段 pnpm store cache）、`c65a523ca`（前端单测 4 shards）、`07798d56f`（wsl2-nightly 稳定 test root + UNC catalog 指针）、`2aeb27d8e`/`3321cb9eb`（版本号）、`26629ff49`/`8656ebd91`（release notes）、`c6a5a789f`（`tests/support.rs` → `tests/support/mod.rs` 重命名，不再单独编译成测试二进制）、`62de0f3e9`（crate-type 收敛 rlib）。

新增文件 35 个（`git diff --name-status --diff-filter=A v4.0.26 v4.0.28` 的全部 A 项），fork 侧无自有语义、随上游整体落地：6 个 release notes、2 个 whats-new JSON、后端 4 个（`tool_lifecycle_progress.rs`、`transform_codex_responses_kimi_history.rs`、`session_manager/{search,search_revision}.rs`）、前端 7 个（`CodexPauseOfficialLogin.tsx`、`useSessionContentSearch.ts`、`genesis.svg`、`tokenplus.png`、`disableContextMenu.ts`、`interfacePrefs.ts`、`codexHistorySplitHint.ts`）、测试 18 个。删除文件 0 个；重命名 1 个（`src-tauri/tests/support.rs` → `src-tauri/tests/support/mod.rs`）。

### stream_check 孤儿豁免终态（D6）

- `services/stream_check.rs` 与 `proxy/http_client.rs` 的 #9253 修复按孤儿文件落地：文件内容随上游更新（保留文件与上游形态一致），但 `services/mod.rs` 不恢复 `pub mod stream_check;`，`commands/stream_check.rs` 与 `database/dao/stream_check.rs` 保持不存在，`lib.rs`/`commands/mod.rs` 无任何 stream_check 命令注册，`stream_check_provider` 全仓 0 命中。
- `proxy/http_client.rs` 的 no-redirect helper 在 fork 内零引用（仅供孤儿 stream_check 调用），不产生编译面变化，不触发 unused 警告处理。

### CI 终态（D4）

- `ci.yml` = 上游重构结构 + fork 裁剪语义。取上游：concurrency（PR 按 `pr-<number>` 成组且可取消；push/schedule/manual 各自独立 run 组、永不取消）、顶层 `env.CARGO_PROFILE_DEV_DEBUG: line-tables-only`、paths filter 收敛为 `.github/workflows/ci.yml`、`pnpm/action-setup` + `setup-node` 的 `cache: pnpm`、`frontend-tests` 4 shards（`pnpm test:unit --shard=N/4`）、后端 fmt-check 在 Linux 独占且前置于装依赖、rust-cache `save-if: github.ref == 'refs/heads/main'`、后端 `timeout-minutes: 45`。叠加 fork：删除 `schedule` 与 `workflow_dispatch` 触发器；frontend/frontend-tests/backend/WSL2 四个 job 的 `if` 为 `github.event_name != 'pull_request' || needs.changes.outputs.<frontend|backend> == 'true'`（push main 全量跑）；后端测试保持 `cargo nextest`；WSL2 job 保持 restore-only rust-cache（`save-if: false`）与 `continue-on-error: true` 及 fork 注释。
- `release.yml` 保持 fork 裁剪版（只构建 macOS/Windows、无 Linux bundle、无公证 stapler 段、macOS runner 锁 `macos-14`、tag 守卫）；上游本轮 4 段 pnpm store cache 移除同步应用（fork 保留段中的「Get pnpm store directory」+「Setup pnpm cache」随上游删除）。
- `wsl2-nightly.yml` 取上游 `07798d56f`（fork 未裁剪该文件）。

### 构建物料终态（D5）

- `src-tauri/Cargo.toml`：`crate-type = ["rlib"]`（取上游 `62de0f3e9`）；fork 的 `version = "4.0.28-1"`、`repository = "https://github.com/tunecc/cc-switch"`、无 `tauri-plugin-updater`、`codegen-units = 1` 保留。
- `package.json`：`version = "4.0.28-1"`、`dev:fork` 脚本保留、无 `@tauri-apps/plugin-updater`；本轮上游 package.json 仅版本号。
- `src-tauri/tauri.conf.json`：版本 `4.0.28-1`（fork 侧 updater 相关裁剪保留）。
- `src-tauri/Cargo.lock`：仅 `cc-switch` 包版本行与 crate-type 相关变动，零新增依赖；`pnpm-lock.yaml`：终态无 `@tauri-apps/plugin-updater` 三段（上游本轮零改动，fork 的 -10 行保留）。

### 数据库 schema 终态（25，本轮不升级）

- 上游 `SCHEMA_VERSION` 本轮仍 24，fork 保持 25；不撞号、无迁移链合并、无新臂；`database/migration.rs` 本轮上游零改动。
- `schema.rs` 取上游 `in_savepoint` helper（SAVEPOINT/RELEASE/ROLLBACK TO 语义）与 `create_tables_on_conn`/`ensure_model_pricing_seeded_on_conn` 的 savepoint 包裹；fork 的 `stream_check_logs` 建表语句与全部迁移臂保留。
- FTS5 会话索引是独立 `session-index.db` 文件，不进 `schema.rs`、不改 user_version、不参与 WebDAV 同步与备份。

### Codex 链与 fork 快捷切换终态（D8）

- 上游会话分组适配、暂停官方登录、额度保护、切换分桶提示、迁移完成事件全部落地；`SwitchResult.codex_history_split` 新字段与 fork 测试字面量的 `website_url_2` 补列共存。
- fork 的 `ModelQuickSwitchDialog`、模型徽章、1M 改写（`strip_one_m_suffix_for_upstream` 链）保持原样；`map_codex_failover_model` 只在故障转移开启时按「目标认不认该模型」判断，与 1M 改写无调用关系。

### ProviderCard 与表单叠加终态（D9）

- 上游密度 token（`min-h-card`/`py-card-y`）与图标随主题（`bg-transparent text-fg-1`、`text-fg-2` fallback）按上游位置落地；fork 副标题优先级链、模型徽章、双官网链接、右键置顶/置底逐行保留。
- `GeneralSection.tsx`：上游密度/缩放设置区（约 128-190 行区域）与 fork 面板可见性设置区（文件尾）并存；顶部 import 合并取并集。
- `Sidebar.tsx`：上游 3 处 `h-7` → `h-nav-row` 落地；fork 的 `VisibleSidebarPanels` 过滤段不变。
- 预设文件：上游 TokenPlus/Genesis/Mistral 条目落地；fork 各文件的 `hidden?: boolean` 接口字段保留；fork 构建下由白名单过滤（D3），上游构建零过滤。

### 本地化终态（D10）

- `en/ja/zh/zh-TW`：上游本轮新增键（FTS5 搜索、密度/缩放、定价搜索、Skills 重排、Codex 分组/暂停登录、排队进度、TokenPlus/Genesis/Mistral、AGY 周额度等）逐字落地；fork 键段（`provider.connectivityCheck`、`settings.general.trayStyleHelp`、侧栏面板可见性等）保留；合并后按对象作用域显式查重 `dup=0`。
- `tr.json`：整文件随上游（本轮不在重叠面），终态与 `v4.0.28` tag 逐字节一致，不补 fork 键。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮实测结果修订；新增 §4.13「v4.0.28 轮的叠加要点」（记录 FTS5 注册区叠加、CI 合并口径、孤儿豁免、crate-type 收敛等）。
- `docs/comet/specs/upstream-sync/spec.md`：归档时整体重写为本轮终态（本文件）。
- `docs/comet/specs/database-schema-migrations/spec.md`：本轮不改（schema 仍 25、无新臂）。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 重放前后提交数之差只允许「被判空丢弃」或「本轮新增」；主题序列 diff 为 0；patch-id 差异逐条归类「冲突停车」或「仅上下文位移/被上游同名声明消化」；冲突停车清单逐条记录文件、双方语义与解法。
- `.comet/config.yaml` 在 rebase 中途被历史提交改回旧内容时，按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并纳入提交；终态与同步前一致。

### 落地保真核对（口径，最终态复算）

- 四 ref 行多重集差集：`v4.0.28` / `main(=pre-sync-v428)` / `HEAD` 与上游基线；214 个上游文件与 fork 侧 145 个代码文件全部参与；非重叠上游文件在 fork 侧缺失为 0；重叠 37 文件的两侧缺失行逐行归因并带重数；归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 白名单条目）」；出现无法归类的缺失行即判定失败。
- 复算必须在最终态提交之后进行；修复类提交会改变保真数字，规格与文档中的数字随修复刷新或改为现取口径。

### 预设 id 编号契约（延续）

- 预设条目 id 数字必须等于原始数组下标：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变。

### `.comet/config.yaml` 保护

- 该文件是 fork 专属文件且会被重放的历史提交改回旧内容；rebase 中途显式恢复并纳入提交，否则 Native Hook 拒绝写入；终态与同步前一致。

### 版本号

- 四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包）终态统一 `4.0.28-1`；本地 annotated tag `v4.0.28-1` 在验收通过、用户接受归档并单独授权交付后创建并推送。

### 交付（归档后单独授权）

- Build/Verify 不执行任何远端写操作；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.28-1` 的推送；只授权这两项远端动作，不创建 PR。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- `IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`devpanel/`、连通性测试前后端链路（`services/connectivity_test/`、`commands/connectivity_test.rs`、两个命令注册、`ConnectivityBadge`/对话框/批量检测、`useConnectivityProbe`、`shouldShowTestEntry`）、模型徽章与 `ModelQuickSwitch/`、`websiteUrl2` 全链路（`Provider`/`UniversalProvider` 字段、表单、DB 列、`SELECT` 列序与行偏移）、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏 `tray_left_click_never_opens_the_menu`、跨应用导入接线（`ProviderImportEntry`、`useProviderImportSources`/`useProviderImportApply`、`providerImport.ts`）、右键置顶/置底、DevPanel 与 fork 构建标识、tunecc 4 处 URL 与两个测试断言、无更新器（`install_update_and_restart` 桩 + `check_app_update_available` 桩）、无 `stream_check` 接线。
- 移除清单取证口径：`git grep -I -n 'tauri_plugin_updater\|plugin-updater\|install_update_and_restart' HEAD -- src-tauri/src`（实现零命中，命令桩除外）、`git grep -rn 'stream_check_provider' HEAD -- src-tauri/src/lib.rs src-tauri/src/commands/mod.rs` 零命中；保留清单以 `git grep -I -l` 逐项在位。

### 已知流程坑位（沿用 + 本轮新增）

- 沿用：取证 fetch 禁 `--prune-tags`；`.comet/config.yaml` rebase 保护；预设 id 编号契约；locale 对象作用域查重；`cargo fmt --check` 进正式检查计划；时间敏感用例 flaky 边界（SessionManagerPage 00:00–00:30、AppsPage CI 并发竞态）按「与上游逐字节比对 + 本地重复跑」判定；绝对条数会被后续提交作废，一律用现取口径。
- 本轮新增：①上游 CI 重构与 fork 裁剪合并时，`if` 条件必须覆盖上游新增的 `frontend-tests` job（fork push-main 全量语义不能漏掉新 job）；②`GeneralSection.tsx` 顶部 import 行两侧都改，rebase 预期停车，合并取并集；③`model_mapper.rs` 上游新测试用 `..create_provider_without_mapping()` 结构更新语法，不产生 `website_url_2` 缺列，但 `forwarder.rs`/`services/provider/mod.rs` 等 37 重叠文件中的任何上游新增 `Provider { … }` 字面量仍须补列；④Comet Hook 版本偏差（项目脚本落后于 CLI）在 Shape 期已用 `comet doctor --repair` + 补齐 `comet-hook-router-guard.mjs` 修复，重放中途 hook 拒绝写入时先核对 hook 脚本版本再怀疑流程。
