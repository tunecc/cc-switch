# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的已发布 annotated tag `v4.0.26`（tag 对象 `8e975496f2e172230a509a2a5961899a926f5525`，剥离提交 `f621d4216189ef06bcc6acd3588c84937b9794e1`，2026-11-05 正式发布、非 draft/prerelease）之上，按原顺序重放同步前 `v4.0.25..main` 的全部 fork 提交（同步前 main = `7361a9d0c`，即 origin/main 与本地 tag `v4.0.25-1` 指向的提交，写作时实测 203 个），再叠加本轮同步终态与归档提交；fork 版本号 `4.0.25-1` → `4.0.26-1`；上游本轮的功能与修复全部落地，fork 全部魔改保留且可用，无丢失、无行为回归。

**本轮「上游是否重复实现 fork 功能」的核查结论：没有真正的同域重复，不产生二选一问题。** 用户要求「如果我们做的功能上游有增加了，就询问一下，分析一下」——本轮按既有三步口径逐项取证后，该条件未触发，全部重叠均为机械叠加或上游单向新增：

- **deeplink 导入扩展 ≠ fork 跨应用导入**：上游 `51b464bd3` 把 `ccswitch://` 链接导入的 app 白名单扩到 claude-desktop/mcode/kimi/dsh/omp（`deeplink/provider.rs` +251/−48）；fork 的跨应用导入是 ProviderForm 内「从其他应用已存供应商配置导入」（`ProviderImportEntry` + `useProviderImportSources`），机制、入口、数据来源完全不同。fork 在 `deeplink/provider.rs` 的全部语义只有 1 行 `website_url_2: None` 字面量，随上游重落即可。
- **ProviderCard 套餐后缀是单向新增**：上游 `626f0226f`/`cf3c86fe5`/`78971d563` 给官方卡副标题加套餐名（读额度查询缓存）、Auth Center 显示订阅套餐、Copilot 额度改称 Credits；fork 没有自己的套餐显示实现，fork 的副标题链（Codex 账号行 → 绑号 Claude 账号行 → AGY 当前模型 → 双官网链接 → 单官网链）与模型徽章原样保留，套餐后缀按上游位置叠加。
- **Codex Fast 档位是新开关**：`62688ab38` 新增卡片设置 `modelCatalog.officialSpeedTiers`（默认关），只在原生 Responses profile 的直连/route 模式生效；fork 的快捷切换与 1M 改写是 Claude 系模型 env 键链路，无对应实现。
- **窗口隐藏暂停 vs fork 托盘左键**：上游 `50a51b867` 给 lib.rs 的 4 处 show/hide 补 `main-window-visibility-changed` 事件，`windowActivity.ts` 重写为「隐藏/最小化才暂停 Query、焦点只控制心跳」；其 visibility 判定同时挂原生 `onFocusChanged`/`onResized`/`isVisible`/`isMinimized`，fork 托盘 toggle 的 show/hide 会触发原生事件，且上游自己的 `tray.rs` show/hide 路径同样不 emit 该事件——fork 不补 emit 即与上游行为一致。`tray.rs` 本轮上游只改 TrayTexts 的 `tier_premium` 文案与 `plan_line`（Copilot Credits），`TrayIconEvent::Click` 零改动，fork 左键契约无碰撞。
- **release.yml 上游修复落在 fork 已裁剪段**：`c70d61de0`（Linux AppImage 排除 libwayland）与 `7afceec14`（stapler 重试 ×2）改的都是 fork 裁剪版里不存在的段（fork 只构建 macOS/Windows、无 Linux bundle、无公证 stapler 段）；fork 裁剪版原样保留，不复活被裁段。`package.json` 的 `@tauri-apps/cli ^2.10.1 → ^2.12.4` 属共享享依赖 bump，取上游。
- **维护链重构与 fork 移除链相邻**：上游把启动期清理（`database/mod.rs`）移进 `periodic_backup_if_needed`（`backup.rs` 重构为 `backup_if_needed` + 独立清理段，备份失败也跑清理），lib.rs 定时器改 `spawn_blocking` + `MissedTickBehavior::Skip`；上游新结构仍调 `cleanup_old_stream_check_logs`——该函数在 fork 已随 stream_check 链路移除，取上游结构时去掉该调用与对应行为断言，`stream_check_logs` 表本身 fork 保留在 schema 中，上游新测试的 INSERT 仍可用。

# Scope

- **同步区间**：`v4.0.25..v4.0.26` 共 39 个提交、184 个文件、+8562/−1571（15 新增 / 0 删除 / 169 修改）。fork 侧自 `v4.0.25` 起自有改动：含文档产物 489 文件、+65529/−2795，代码面（`src`、`src-tauri`、`tests`、`.github`、`package.json`、`pnpm-lock.yaml`、vite/vitest 配置、`README.md`）148 文件、+15925/−2795。**重叠面 38 个文件**（实测 `comm -12 <(git diff --name-only v4.0.25 v4.0.26|sort) <(git diff --name-only v4.0.25 main|sort)`），38 个全部有 fork 语义（`git diff --quiet v4.0.25 HEAD -- <file>` 无一为空），但绝大多数只是版本号、`website_url_2` 字面量、fork 键段或裁剪差异，不构成行为碰撞。
- **上游本轮新增功能**：① deeplink 导入扩展至 Claude Desktop 与 Pi 系（`51b464bd3`，Claude Desktop 按链接模型名分流直连卡/四档映射卡，映射卡不声明 1M；mcode/kimi/dsh/omp 复用 Pi 单模型节点，Kimi 补 131072 窗口）；② 官方供应商卡副标题套餐名（`626f0226f`，新 `src/lib/query/accountPlans.ts` 读额度缓存）+ Auth Center 账户套餐（`cf3c86fe5`）+ Copilot 全量 capped 额度与 Credits 命名（`78971d563`，新 `copilot_responses.rs` 的一部分）；③ Codex 卡片保留官方 Fast 档位开关（`62688ab38`，`modelCatalog.officialSpeedTiers` 默认关）；④ DSH 主目录覆盖（`81a9fa79d`，`settings.dsh_config_dir` / `dshConfigDir` / `get_dsh_override_dir`）；⑤ 系统代理劫持本地路由警告（`7c250c423`，新 `proxy/loopback_probe.rs`）。
- **上游本轮性能与修复**：渲染/运行时性能四连（`ca58c0313` App.tsx 懒加载次级页与供应商编辑器、`fc9b17cbf` dao/providers 批量读端点+跳过未变保存、`50a51b867` 维护延后与隐藏窗口暂停、`cc4ce0386` 会话转录零拷贝）；`98777515d` 剩余等库锁同步命令改 async（`add_custom_icon`/`rename_custom_icon`/`set_global_proxy_url`/`rename_db_backup`/`start_mcp_connectivity_checks` 共 5 个，`commands/mod.rs` 新增 `run_db_task` helper）；proxy 链（`e78784715` classifier 重试循环停止+新 `classifier_guard.rs`、`e217bfcbb` 转发分配与failover 库读减少、`a990c81a1` IPv6 不可达时 race IPv4、`44c7fa9bc` classifier-loop 早退补 `outbound_model`、`80ad02c5f` 失败请求日志带映射后模型、`abf441fe2` Codex chat 保留 turn-start developer 消息、`38efe1099` call_id 缓存按客户端会话隔离）；Copilot Responses 复用 Grok 兼容层与去重（`02a136413`/`1adb3cbc4`）；`65f6e682a` MCP 401 显示「需要登录」；`1d9b448ef` 跟随登录卡刷新过期 Claude 登录；`e6e7831e8` Claude Desktop 自动填充菜单名跟随模型编辑（新 `updateRouteModel`）；`3cf79926d` 官方卡指向 claude.com/download；`1c2ed0669`/`2186b3052` npm bin 冲突可执行提示；`420646d8a` headless DSH 读 CC Switch 存的 key；`df3a9072a` WebDAV skills 归档保留符号链接名；`d16064bde` 会话阅读器工具栏；`0f06fed26` 对话框不用 translate 居中（1x 屏清晰）；`7a0718e15` macOS 原始输入不自动大写；`b8fa4199c` 子 agent 并发上限评审跟进；`51fce968b` 预设默认模型刷新（grok-4.7、kimi-k3.1-pro、qwen3.7-plus）；`a5100e0e6` TeamoRouter 域名 .cn→.com。
- **数据库**：上游 `SCHEMA_VERSION` 本轮仍 24（`v4.0.25` 与 `v4.0.26` 相同），fork 保持 25，**不撞号、无迁移链合并、无新臂**；`database/mod.rs` 启动清理块被上游移除（改由维护定时器首 tick 跑），`backup.rs` 重构维护结构，`dao/providers.rs` 批量端点读取（+144/−164 行级改动）不得吃掉 fork 的 `website_url_2` 列与行偏移。
- **版本与依赖**：`Cargo.toml` 本轮上游零新增依赖（仅版本号）；`package.json` 仅 `@tauri-apps/cli ^2.12.4`（`pnpm-lock.yaml` 随之）；四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`）终态统一 `4.0.26-1`。
- **本地化**：`en/ja/zh/zh-TW` 各 +20/−5 量级（ Credits 命名、套餐、deeplink、DSH、npm 提示、whats-new 等）；`tr.json` +8/−4 **不在重叠面**（fork 与上游 tag 逐字节一致），整文件随上游；fork 专属覆盖键段（`provider.connectivityCheck`、`settings.general.trayStyleHelp` 等）本轮上游未触碰。
- **预设**：净新增预设为 0——只有既有预设内的模型刷新（kimi-k3.1-pro、qwen3.7-plus、grok-4.7）与域名变更（TeamoRouter .cn→.com、claude.ai/download→claude.com/download）；`forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 不改，无收录决定。
- **fork 侧文档**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果修订并新增 §4.12（v4.0.26 轮要点）；`docs/comet/specs/upstream-sync/spec.md` 归档时整体重写为本轮终态。
- **交付**：推送 `main` 与 annotated tag `v4.0.26-1` 只在验收通过、用户接受并归档之后执行，属 Archive 阶段的单独授权（本轮 Shape 只确认「沿用历轮方式」，不构成远端写授权）。

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v426/`（Runtime 已创建）：`brief.md` 与 `specs/upstream-sync/spec.md`；不建立能力关联，不产生 `capability-association.yaml` 与 `delta.yaml`（沿用历轮决定）。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v426/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v426`（= 同步前 main `7361a9d0c`，同时是 origin/main），仅用于回退参照与重放前后 diff 对照，不推送。
- 随上游 rebase 落地的上游新增文件 15 个：3 个 `docs/release-notes/v4.0.26-{en,zh,ja}.md`；`scripts/measure-renderer.mjs`；后端 `src-tauri/src/commands/session_manager_tests.rs`、`src-tauri/src/database/dao/providers_tests.rs`、`src-tauri/src/proxy/{classifier_guard,loopback_probe}.rs`、`src-tauri/src/proxy/providers/copilot_responses.rs`；前端 `src/lib/query/accountPlans.ts`、`src/whats-new/4.0.26.json`；测试 `tests/components/npmBinCollision.test.ts`、`tests/lib/{accountPlans,copilotQuota,windowActivity}.test.ts(x)`。
- 交付步骤（验收通过并归档、且用户另行授权后）新增本地 annotated tag `v4.0.26-1`。

### 修改

- 38 个上游/fork 重叠文件（逐文件叠加要求在完整目标规格「冲突解决」中展开）：
  - 版本与物料 5 个：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`pnpm-lock.yaml`。
  - 后端 13 个：`src-tauri/src/lib.rs`（可见性事件+维护定时器，invoke_handler 本轮零改动）、`src-tauri/src/tray.rs`（TrayTexts/plan_line 的 Credits 段）、`src-tauri/src/settings.rs`（`dsh_config_dir` 三处）、`src-tauri/src/commands/misc.rs`（npm bin 提示等 +105）、`src-tauri/src/commands/mod.rs`（`run_db_task` helper）、`src-tauri/src/database/{mod,backup}.rs`（维护链重构）、`src-tauri/src/database/dao/providers.rs`（批量读+跳过未变保存）、`src-tauri/src/deeplink/provider.rs`（导入扩展）、`src-tauri/src/proxy/forwarder.rs`（+422 行级：classifier guard、loopback、IPv4 race、分配优化）、`src-tauri/src/proxy/providers/codex.rs`（Fast 档位+call_id 缓存）、`src-tauri/src/proxy/providers/mod.rs`（+1 模块声明）。
  - 前端 12 个：`src/App.tsx`（懒加载）、`src/components/providers/ProviderCard.tsx`（套餐后缀）、`src/components/providers/forms/{ProviderForm,ClaudeDesktopProviderForm}.tsx`、`src/types.ts`（`dshConfigDir` 等）、6 个 `src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`（模型刷新与域名）、4 个 `src/i18n/locales/{en,ja,zh,zh-TW}.json`。
  - 测试与文档 6 个：`tests/components/{ClaudeDesktopProviderForm,GrokBuildProviderForm}.test.tsx`、`tests/components/__snapshots__/ProviderForm.presetRows.golden.test.tsx.snap`、`tests/hooks/useAddProviderMutation.test.tsx`、`README.md`（fork 重写版整文件保留）、`.github/workflows/release.yml`（fork 裁剪版保留，上游 hunks 落在被裁段）。
- 本轮不新增 fork 专属代码文件；`src/config/forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 不改。

### 删除

- 上游本轮删除文件为 0；fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回（`schema.rs` 的 `stream_check_logs` 建表语句保留）。
- `backup.rs` 取上游新结构时去掉 `cleanup_old_stream_check_logs` 调用与对应清理行为断言（fork 已移除该函数）；`database/mod.rs` 启动清理块随上游移除。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v426` 是安全参照分支，不是工作区）。
- 不新增数据库迁移臂、不改 `SCHEMA_VERSION`（fork 保持 25，上游本轮仍为 24，不撞号）。
- 不重新接线 `stream_check`、不恢复 `cleanup_old_stream_check_logs`、不恢复应用内更新器。
- 不复活 release.yml 被裁段（Linux bundle、公证 stapler）；Release 的 macOS runner 保持 `macos-14`。
- 不改 `forkPresetFilter.ts` 判定实现；不新增任何 fork 白名单条目。
- 不引入 `upstream/main` 上 tag 之后的提交（写作时已有 skills 哈希迁移、codex catalog 指针、deeplink 风险分类、会话 FTS5 搜索等 10+ 个，一律不纳入）。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。
- 不给 fork 托盘 show/hide 路径补 `main-window-visibility-changed` emit（上游 tray.rs 同样不 emit，原生事件已覆盖；补了反而偏离上游行为）。

# Non-goals

- 不改 fork 自有功能实现与形态：两条连通性链路并存（上轮 D14）、托盘左键契约、模型徽章/快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识。
- 不改 fork CI 的裁剪策略（构建平台、tag 守卫、Release macOS runner 保持 `macos-14`）；`.github/workflows/ci.yml` 本轮上游零改动。
- 不为上游新增第三方/赞助商预设放开可见性（本轮净新增预设为 0）。
- 不做本轮之外的功能开发、重构或依赖升级；依赖变动只取上游本轮实际改动（`@tauri-apps/cli`）。
- 不在 Shape/Verify 阶段执行任何远端写操作（push、tag、PR、Release 触发）。
- 不评估上游 tag 之后的未发布提交（含会话 FTS5 搜索等），待其发布后另起轮次。

# Acceptance examples

- 同步基线与重放完整性可核对：`git merge-base main v4.0.26^{}` 为 `f621d4216`（fork 提交全部落在 `v4.0.26` 之上），`git rev-list --count v4.0.26..HEAD` 等于同步前 fork 提交（同步前实测 203，以 `pre-sync-v426` 现取为准）中实际重放的数量加本轮新增提交，重放主题序列与 `pre-sync-v426` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。
- fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键切换与源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。
- 两条连通性链路并存终态不变：上游 MCP 检测链（`services/mcp_connectivity.rs`、`commands/mcp.rs`、`useMcpConnectivity.ts`、`UnifiedMcpPanel.tsx`）与 fork 供应商逐模型测试链（`services/connectivity_test/`、两个命令注册、`ConnectivityBadge`/对话框/批量检测）同时在位；本轮上游 `65f6e682a`（401 显示需登录）与 `start_mcp_connectivity_checks` async 化落地；`stream_check_provider` 保持 0 命中。
- 维护链重构终态：启动路径（`database/mod.rs`）不再跑清理/vacuum；`backup.rs` 为上游新结构（`backup_if_needed` 私有 + `periodic_backup_if_needed` 先备份后清理、备份失败也清理）但**不含** `cleanup_old_stream_check_logs` 调用；lib.rs 定时器首 tick 跑启动维护、`spawn_blocking` + `MissedTickBehavior::Skip`；上游新增维护测试中涉及 stream_check 清理行为的断言按 fork 移除态适配，其余维护/备份用例与 fork 既有用例全部通过。
- 窗口可见性与隐藏暂停同 fork 托盘契约共存：lib.rs 4 处 `main-window-visibility-changed` emit 取上游；`windowActivity.ts` 上游重写整文件落地（fork 零语义）与 `tests/lib/windowActivity.test.ts` 通过；fork 托盘左键四分支、`set_show_menu_on_left_click(false)`、`tray_left_click_never_opens_the_menu` 护栏不变；`tray.rs` 的 Credits 文案与 `plan_line` 取上游。
- ProviderCard 套餐后缀与 fork 副标题链叠加：上游 `quotaPlanKey`/`useQuotaPlan`/`planSuffix` 与 `src/lib/query/accountPlans.ts`、Auth Center 套餐、Copilot Credits 全落地；fork 的副标题优先级链、模型徽章、双官网链接、右键置顶/置底逐行保留；`tests/lib/accountPlans.test.tsx`、`tests/lib/copilotQuota.test.tsx` 与 fork 既有用例通过。
- deeplink 扩展与 fork 跨应用导入互不干扰：上游 `deeplink/provider.rs` 的 app 白名单扩展、Claude Desktop 直连/映射卡分流、Pi 系单模型节点全部落地，新 `Provider` 字面量补 `website_url_2`；fork 的 `ProviderImportEntry`/`useProviderImportSources`/表单接线不变。
- App.tsx 懒加载与 fork 门控叠加：上游 `lazy`/`Suspense` 改造落地，fork 的 `VisibleSidebarPanels` 条件渲染与 Sidebar 过滤保持生效，被门控隐藏的面板不因此提前加载或报错。
- 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v426` 相同；`dao/providers.rs` 上游批量端点读取与跳过未变保存落地且 `website_url_2` 列与行偏移保留；`database/{schema,tests}.rs`、`dao/providers_tests.rs` 全部用例通过。
- 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、fork 键段保留；`tr.json` 与 `v4.0.26` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。
- 后端在 fork 结构下编译通过：上游新增/修改的 `Provider` 结构体字面量（含 `deeplink/provider.rs` 本轮新增处）补齐 fork 的 `website_url_2` 字段后，`cargo check --all-targets` 与 `cargo nextest run` 零失败、无新增未使用告警，且 `cargo fmt --check` 通过。
- 版本与锁文件终态一致：四处版本号均为 `4.0.26-1`；`Cargo.lock` 不出现任何 `tauri-plugin-updater` 条目，`pnpm-lock.yaml` 反映 `@tauri-apps/cli 2.12.4` 而 fork 移除的 `@tauri-apps/plugin-updater` 三段仍不存在，`pnpm install` 与 `cargo check` 均报告锁文件未被改写。
- CI 裁剪与 fork URL 保留：`.github/workflows/release.yml` 保持 fork 裁剪版（无 Linux bundle、无 stapler 段、macOS runner 仍 `macos-14`）；`git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 仍 0 命中（fork 的 4 处 tunecc URL 与两个测试断言保留）。
- 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证性 `git fetch upstream` 不带 `--prune-tags`（本轮 Shape 期实测该组合会删光 fork 专属本地 tag，已从 origin 恢复）；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.12 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径）：在最终态提交之后，用 `v4.0.26` / `main(=pre-sync-v426)` / `HEAD` 与上游基线四个 ref 计算行多重集差集，184 个上游文件与 fork 侧 148 个代码文件全部参与，非重叠的上游文件在 fork 侧缺失为 0，重叠 38 文件的两侧缺失行逐行归因并带重数，归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 白名单条目）」一类，出现无法归类的缺失行即判定失败。

# Constraints and invariants

- 只锁已发布 annotated tag：同步目标必须是 `v4.0.26^{}` 剥离出的提交（`f621d4216`），不得拿 tag 对象 sha（`8e975496f`）当提交 sha 做 merge-base 核对；`upstream/main` 上 tag 之后的提交不纳入。
- 取证性 fetch 禁止 `--prune-tags`：本轮 Shape 期 `git fetch upstream --tags --prune --prune-tags` 实测删除全部 fork 专属本地 tag（`v4.0.17-1`…`v4.0.25-1`），已从 origin 重新 fetch 恢复并核对无缺失；后续只允许 `git fetch upstream --tags`（不带 prune）或 `git fetch upstream tag <name>`。
- 冲突解决遵循 `docs/HOW_TO_REBASE_UPSTREAM.md` §3：fork 专属文件保留 fork 侧（rebase 中为 `--theirs`），共享文件取上游（`--ours`）后再叠加 fork 语义；版本与锁文件禁止 `git checkout --ours` 整体取侧。
- `.comet/config.yaml` 是 fork 专属文件且会被重放的历史提交改回旧内容，rebase 中途必须显式恢复并纳入提交，否则 Native Hook 会拒绝写入。
- 预设条目 id 数字必须等于原始数组下标：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变。
- fork 的 `Provider` 结构含 `website_url_2`，上游新增的任何 `Provider { … }` 字面量（本轮高危处是 `deeplink/provider.rs` 的导入扩展）必须补该字段，否则 `cargo check --all-targets` 失败。
- fork 移除链路不得复活：`tauri_plugin_updater` / `@tauri-apps/plugin-updater` / `install_update_and_restart` 实现 / `stream_check` 模块声明与命令注册 / `cleanup_old_stream_check_logs` 函数与调用。
- 本轮 `lib.rs` 的 `invoke_handler` 上游零改动，但重放仍可能在该区停车；解完必须确认 fork 两个 connectivity 注册与上游两个 mcp connectivity 注册同时在位、`stream_check_provider` 0 命中；`commands/mod.rs` 取上游 `run_db_task` 并保留 fork 声明。
- `tr.json` 与上游 tag 逐字节一致、不补 fork 键；4 个既有 locale 合并后必须按对象作用域显式查重（`object_pairs_hook` 类），`JSON.parse` 静默取最后一个键不能作为无重复的证据。
- 落地保真复算必须在最终态提交之后进行，差异行必须带重数与文件归属；修复类提交会改变保真数字，规格与文档中的数字须随修复刷新或改为现取口径。
- 正式检查计划必须包含 `cargo fmt --check --manifest-path src-tauri/Cargo.toml`（fork CI 三平台都有该步）。
- 时间敏感用例的既有 flaky 边界（`SessionManagerPage` 分桶在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例在 CI 并发下竞态）按「与上游逐字节比对 + 本地重复跑」判定，不登记为同步丢语义。
- 归档、merge、push、PR 与工作区清理各自需要的授权互不代替；本轮工作区为 `current`，归档不需要收尾方式选择。

# Decisions

- **D1｜基线、区间与工作区**：同步基线锁定 annotated tag `v4.0.26`（tag 对象 `8e975496f…`，剥离提交 `f621d4216…`），单发布跨度（39 提交 / 184 文件），fork 版本号 `4.0.25-1` → `4.0.26-1`；不纳入 `upstream/main` 的 tag 后提交。工作区用 `current`，沿用 main 与当前目录（本轮开始时工作区干净、无其他 active Native change、用户未要求并行，与历轮一致）；`pre-sync-v426` 只作回退参照分支，不是工作区。
- **D2｜上游是否重写 fork 功能：本轮没有，不产生二选一**。按三步口径取证：①`git diff v4.0.25 v4.0.26` 逐文件与 fork 侧形态比对；②38 个重叠文件全部有 fork 语义，但无语义级功能碰撞；③相邻域逐项排除——deeplink 链接导入（上游）vs 表单内跨应用导入（fork）机制不同；ProviderCard 套餐后缀/Auth Center 套餐/Copilot Credits 为上游单向新增，fork 无自有套餐显示；Codex Fast 档位开关 fork 无对应；`tray.rs` 的 `TrayIconEvent::Click` 本轮零改动；窗口隐藏暂停的原生事件链覆盖 fork 托盘 toggle 且上游 tray.rs 同样不 emit。用户「上游重复则询问」的条件本轮未触发，结论随 Shape 一并确认。
- **D3｜维护链重构取上游结构、去掉 fork 已移除调用**：`database/mod.rs` 启动清理块随上游移除；`backup.rs` 取上游 `backup_if_needed` + 独立清理段新结构，但去掉 `cleanup_old_stream_check_logs(7)` 调用（fork 已删该函数）与上游新测试中对应的清理行为断言；`stream_check_logs` 建表语句保留，上游新测试的 INSERT/SELECT 不受影响；lib.rs 维护定时器取上游 `spawn_blocking` + `MissedTickBehavior::Skip` 首 tick 模式。
- **D4｜窗口可见性事件**：lib.rs 4 处 emit 与 `windowActivity.ts` 重写整文件取上游；fork 托盘 `show_main_window`/`hide_main_window` 不补 emit（上游 tray.rs 同位置也不 emit，原生 `onFocusChanged`/`onResized` 已驱动 visibility 刷新），保持与上游行为逐点一致。
- **D5｜schema：不撞号、不新增臂**：上游 `SCHEMA_VERSION` 仍 24，fork 保持 25；`dao/providers.rs` 取上游批量端点读取与跳过未变保存，fork 的 `website_url_2` 列、SELECT 列序与行偏移逐行叠加保留。
- **D6｜预设与白名单：本轮无收录决定**：净新增预设为 0，只有既有预设模型刷新与域名变更；白名单与 `forkPresetFilter.ts` 不改。
- **D7｜CI 与物料**：release.yml 上游两个 hunks（Linux libwayland 排除、stapler 重试）落在 fork 已裁剪段，fork 裁剪版整文件保留、不复活被裁段；macOS runner 继续锁 `macos-14`；`package.json` 的 `@tauri-apps/cli ^2.12.4` 取上游；`README.md` fork 重写版整文件保留。
- **D8｜命令 async 化与注册区**：上游 5 个命令 sync→async 与 `commands/mod.rs` 的 `run_db_task` 取上游；fork 的两个 connectivity 命令与注册不变；`proxy/providers/mod.rs` 与 `proxy/mod.rs` 模块声明取并集（上游新增 `copilot_responses`、`classifier_guard`、`loopback_probe`）。
- **D9｜ProviderCard 与表单叠加**：套餐后缀按上游位置叠加进 fork 副标题链（套餐读额度缓存，不与 fork 的账号行/双官网链接争用同一渲染段）；`ClaudeDesktopProviderForm.tsx` 的 `updateRouteModel` 取上游，fork 的导入入口、白名单过滤、`websiteUrl2` 段保留；`ProviderForm.tsx` 的 `codexOfficialSpeedTiers` 接线取上游，fork 的导入入口与预设过滤保留。
- **D10｜本地化**：4 个既有 locale 上游新增与改写逐字取上游、fork 键段保留；`tr.json` 本轮不在重叠面，整文件随上游、与 tag 逐字节一致、不补 fork 键；合并后 5 个文件按对象作用域查重 `dup=0`。
- **D11｜版本与锁文件**：四处版本改 `4.0.26-1`；`Cargo.lock` 只允许 `cc-switch` 版本行变动（上游本轮零新增 Rust 依赖）；`pnpm-lock.yaml` 只取上游 `@tauri-apps/cli` 变动，fork 移除的 `@tauri-apps/plugin-updater` 三段不得被带回；收尾用 `pnpm install` 与 `cargo check` 复验锁文件未被改写。
- **D12｜文档与交付授权延后**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 表按本轮结果增改并追加 §4.12「v4.0.26 轮的叠加要点」；归档时把 `docs/comet/specs/upstream-sync/spec.md` 整体重写为 v4.0.26 完整状态；本轮不改 `docs/comet/specs/database-schema-migrations/spec.md`（schema 仍 25、无新臂）。Build/Verify 不推送、不打 tag；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.26-1` 的推送。只授权这两项远端动作，不创建 PR。
- **D13｜测试文件叠加**：`ClaudeDesktopProviderForm.test.tsx`（上游 +49）、`GrokBuildProviderForm.test.tsx`（上游 ±4）、golden snapshot（上游 ±2）、`useAddProviderMutation.test.tsx`（上游 ±1）均取上游 hunks 并保留 fork 新增用例；`AppsPage.test.tsx` 本轮上游零改动，fork 的等待顺序用例不动。

# Open questions

本轮无未决项。用户要求的「上游若重复实现 fork 功能则分析并询问」已按三步口径执行，结论为本轮无同域重复（见 D2 与 Outcome 逐项取证），不产生二选一；结论随最终 Shape 确认一并提交用户。

# Verification expectations

- 定向检查（Build 期）：`cargo check --all-targets`、`cargo fmt --check`、按受影响模块 `cargo nextest run`、`pnpm typecheck`、`pnpm test:unit` 的定向子集、locale 重复键显式查重脚本、`git grep -I` 保留清单与移除清单取证。
- 正式检查计划（Verify 期，随 Builder 交接提交给 Runtime 执行）：
  1. `pnpm install --frozen-lockfile` 与 `pnpm typecheck`；
  2. `pnpm test:unit`（前端全量单测，含上游新增 `accountPlans`、`copilotQuota`、`windowActivity`、`npmBinCollision` 用例与 fork 用例）；
  3. `cargo check --all-targets --manifest-path src-tauri/Cargo.toml`；
  4. `cargo fmt --check --manifest-path src-tauri/Cargo.toml`；
  5. `cargo nextest run --manifest-path src-tauri/Cargo.toml`（后端全量，含托盘护栏、schema 用例、维护链重构后的 backup/database 用例、上游新增 `providers_tests`、`session_manager_tests`）；
  6. locale 查重与逐字节核对脚本（4 个既有 locale `dup=0`、`tr.json` 与 tag 一致、上游新增键齐备）；
  7. fork 保留清单与移除清单的 `git grep` 取证脚本（updater / `stream_check` / `cleanup_old_stream_check_logs` 零命中，四个连通性相关命令注册与 fork 链路、白名单在位）；
  8. 版本四文件与两个锁文件的 `git diff --numstat pre-sync-v426 HEAD` 核对；
  9. 四 ref 落地保真复算脚本（在最终态提交之后运行，输出逐行归因清单）。
- 已知不可靠信号：管道后的退出码、后台任务通知文本、未 grep 验证的符号名不得作为通过证据；时间敏感用例出现单条红时先按上游同用例比对与本地重跑判定。
- Verifier 需独立判断全部验收项，不只复跑命令；与当前候选实现匹配的成功检查记录可复用，失败/阻塞/未执行/超时不得算通过。