# 完整目标规格：upstream-sync（v4.0.32 轮）

> 本文件是 `sync-upstream-v432` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.31）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-14-sync-upstream-v431/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.32`（tag 对象剥离提交 `93d2381c8730aaf0078d44cd9c060dfa8133f859`，2026-11-14 发布），fork 版本号 `4.0.31-1` → `4.0.32-1`。同步后 fork main = 上游 v4.0.32 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.31..v4.0.32` 共 26 个提交、194 个文件、+8218/−6596（21 新增 / 164 修改 / 9 删除 / 0 重命名）。发布主轴是**后台自动下载更新（默认关、确认后安装）**，另含 **IP 检测**新能力、三处结构性重构（应用能力表、托管账号身份集中化、预设模型列表去重）、panic 后锁/缓存恢复、九处代理与界面修复，以及一轮「删除无用代码、依赖与文件」的清理。

**上游是否重写了 fork 已有功能——本轮结论：一处正面对撞（应用内更新器），需用户决定；其余为 fork 零语义的新域。**

1. **fork 功能标识全量扫描零命中**：对 `v4.0.31..v4.0.32` 上游新增行（8,097 行）扫 `websiteUrl2`、`website_url_2`、`connectivity`、`TestDialog`、`QuickSwitch`、`visibleSidebarPanels`、`quickSort`、`DevPanel`、`forkBuild`、`forkOfficial`、`Allowlist`、`SearchableModel`、`ImportEntry`、`pinProvider`、`trayPanel`——仅 `connectivity`（`useMcpConnectivity.ts` 文件名）与 `trayPanel`（`TrayPanel.tsx` 文件名）各 1 命中，均为文件名本身。
2. **唯一正面对撞 = 应用内更新器**：fork 早已整体关闭应用内更新器（移除 `tauri_plugin_updater`、`install_update_and_restart` 实现、`updater:default` 能力与 `tauri.conf` 的 `plugins.updater`，关于页「检查更新」只打开 tunecc Releases 页）；上游本轮重写同一链路为「默认关的后台下载 + 确认后安装 + 托盘/面板入口」。这不是「上游顺手实现了 fork 的功能」，而是「上游重写了 fork 主动放弃的链路」。**用户已决定（2026-11-15，Q1 = A）：本轮保留 fork 现状，上游更新器域整体不采纳**，终态见「更新器域终态」。
3. **同域相邻项逐条排除**：
   - 上游 IP 检测测的是 CC Switch 自身经代理/直连的**出口 IP 与地理位置**（icanhazip/ipify 采样 + ipwho.is 查询），与 fork 的**供应商逐模型连通性测试**（模型可达性与首 token）实现、入口、数据都不重叠；fork 侧对 `icanhazip`/`ipify`/`ipwho`/「出口 IP」零命中。
   - 上游 `AppSpec` 能力表是应用元数据集中化（`localProxy`/`routeMode`/`stack`/`additive`/`skills`/`mcp`/`prompts`/`managedAccount`/`piFamily`/`editorView`），不含「模型徽章 / 连通性测试 / 跨应用导入 / 侧栏面板可见性」语义；fork 的 `MODEL_CAPABLE_APPS` 与 `shouldShowTestEntry` 保持独立判据（非目标：不反向改造）。
   - 上游 `ProviderKind::declared` 是把托官方账号身份判定从散落的 `MANAGED_OAUTH_PROVIDER_TYPES` 常量集中化，fork 用的是上游 v4.0.19 起的 `isOfficialAccount`，无自有实现，不构成二选一。
   - 上游 `tray.rs` 新增的「重启并更新到 vX」是更新器附属项；实测 diff 不含 `TrayIconEvent`/`toggle_main_window`/`native_menu_on_left_click`，fork 左键四分支不受影响。
   - 上游 `#9492` 删除的 `src/components/ui/table.tsx` 与 fork 的 `ConnectivityTestDialog` 是**文件级**冲突（上游已无引用、fork 仍在用），不是功能重复（见「被删文件与依赖终态」）。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.32` 剥离出的提交 `93d2381c8730aaf0078d44cd9c060dfa8133f859`。
- `git merge-base main v4.0.32^{}` == `3c76d3bda670297dd8c27d7d9be9b18a4c9143f5`（v4.0.31 剥离提交）；`git log v4.0.32..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 fork 提交（`git rev-list --count v4.0.31..main`，同步前 main = `c7f7c43ea`，实测 216）按原顺序重放，外加本轮的同步终态提交与归档提交；终态计数以现取命令为准，不在本规格写死。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；主题序列逐行 diff 为 0（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v432`（= `c7f7c43ea`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.31`（剥离 `3c76d3bda`）与 fork 发布 tag `v4.0.31-1` 保持不变、不改写历史。
- `upstream/main` 上 tag 之后仍有 1 个提交（写作时 `git rev-list --count v4.0.32..upstream/main` 为 1：`docs(manual): add the Antigravity Orchestrator note to the Japanese usage page`），**本轮不同步**；只锁已发布 tag。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。

### 同步范围（v4.0.31..v4.0.32：26 提交、194 文件、+8218/−6596）

1. **后台自动下载更新（发布主轴）**：`2cbfa8c3c` 之后的 `chore(release)` 前的主提交群——新 `app_update.rs`（进程级内存缓存、60s 首查、6h 间隔、安装串行化、便携版/Linux 判定）、新 `AutoUpdatePrompt.tsx`、`UpdateContext` 扩展与 `app-update-ready` 事件、`AboutSection` 开关与不可用原因、`settings.auto_update_enabled`、`commands/settings.rs` 的安装链路重写、`commands/misc.rs` 的 `is_portable_mode` 委托、`lib.rs` 插件与后台循环、`tray.rs`/`tray-panel` 的「重启并更新到 vX」入口、`tauri.conf.json` 的 `plugins.updater`（上游 pubkey + `dl.ccswitch.io` / GitHub Releases 两个 endpoint）。**按 Q1 = A，本域全部不落地（终态见「更新器域终态」）。**
2. **IP 检测（新能力）**：`f670f9959`（#9449）——`services/ip_diagnostics.rs`、`components/settings/IpDiagnostics.tsx`、`lib/api/globalProxy.ts` 的检测调用、`RoutingSection.tsx` 的网络设置入口、8 语种文案；只在点击后运行，采样 icanhazip.com / ipify.org 并交 ipwho.is 查位置，指定代理时不回退直连。
3. **结构性重构**：`1863149fc`（#9495 应用能力表，新 `config/appSpecs.ts` + 后端 `AppType::spec` + `tests/config/appSpecs.json`/`appSpecs.test.ts`）、`56c5d54d8`（#9497 `provider_kind.rs` 集中托管身份判定）、`1af6aaa6c`（#9513 预设模型列表去重 + `presetModelLists.test.ts`）。
4. **panic 后恢复**：`761b4c024`（#9483 设置/配置/MCP/提示词/价格/备份锁与缓存恢复，新 `sync_utils.rs`）、`8c76bfe1e`（#9472 数据库连接锁恢复）。
5. **清理**：`7dec90e98`（#9492）删除 9 个文件与 6 个依赖（见「被删文件与依赖终态」）。
6. **代理与 Codex 修复**：`24eb40c69`（Codex 续接旧会话时密文被拒后去加密内容同家重试）、`f72c3048f`/`5494a7656`（Mistral 上游剥离 Responses 专用字段与 `reasoning_content`）、`86c749b98`（Copilot 仅 Responses 的模型改走 Responses）。
7. **其余修复与界面**：`3795de7ec`（会话文件 mtime 保留）、`e9bb11fa3`（Hermes 已删供应商可编辑删除）、`add1c5abe`（OpenClaw 新增时登记表单模型）、`ce9671589`（mise shim 计入真实安装）、`c0f640cfc`（打开终端对话框短窗口可滚动、回车直开）、`db7a0e755`（Copilot 卡显示绑定 GitHub 账号）、`f37b4ba27`（Antigravity Orchestrator 按步计价）、`bcb299979`/`70b95694c`/`2cbfa8c3c`（文案句号、locale 回退、截断体测试）。
8. **数据库**：`SCHEMA_VERSION` 连续保持 26；`schema.rs` 只加 `gemini-4-hydrogen` 定价种子（4 行 + 3 行注释）；`database/mod.rs` 只加锁恢复；**本轮无迁移链合并**。
9. **CI 与物料**：`ci.yml` 新增 `ci-gate` 汇总 job；`release.yml`/`wsl2-nightly.yml` 上游本轮零改动；`Cargo.toml` 删 `tower-http`/`http-body`；`package.json` 删 4 个 radix 依赖；`Cargo.lock`/`pnpm-lock.yaml` 同步缩减。

新增文件 21 个（`git diff --name-status --diff-filter=A v4.0.31 v4.0.32` 的全部 A 项），其中更新器域 4 个（`app_update.rs`、`AutoUpdatePrompt.tsx`、`AutoUpdatePrompt.test.tsx`、`UpdateContext.autoUpdate.test.tsx`）按 Q1 = A 不落地，其余 17 个随上游整体落地：`provider_kind.rs`、`sync_utils.rs`、`services/ip_diagnostics.rs`、`services/session_usage_agy/orchestrator_tests.rs`、`IpDiagnostics.tsx`、`appSpecs.ts`、`appSpecs.json`、`appSpecs.test.ts`、`presetModelLists.test.ts`、`openclawProviderPresets.test.ts`、`ProviderForm.openclawSuggestedDefaults.test.tsx`、`ProviderCard.copilotAccount.test.tsx`、3 份 release notes、`whats-new/4.0.32.json`。删除 9、重命名 0。

### 数据库 schema 终态（26，无迁移）

- `SCHEMA_VERSION = 26`（与上游一致，无撞号、无新臂）；fork 的 `stream_check_logs` 建表与全部既有迁移臂保持不变。
- `schema.rs` 的定价种子新增 `gemini-4-hydrogen`（`1.50/7.50/0.075/0`）取上游；`is_in_savepoint` 等既有结构不动。
- 连接锁恢复（`database/mod.rs`）取上游：任务 panic 持有锁后连接仍可复用，不再需要重启应用。

### 孤儿 stream_check 豁免终态（延续）

- 上游本轮改 `src-tauri/src/commands/stream_check.rs`（+93）与若干 proxy 调用点，随文件落地；fork **不恢复** `pub mod stream_check;` 声明、`commands/stream_check.rs` 与 `database/dao/stream_check.rs` 保持不存在、`stream_check_provider` 全仓 0 命中。
- `src/lib/api/connectivity-check.ts` 与 `src/hooks/useStreamCheck.ts`（上游文件、fork 从未修改）仍随上游落地；必须重新确认「无组件调用 `useStreamCheck`」仍然成立，一旦上游接入 UI 即为 fork 侧运行时报错点。

### 应用能力表终态（AppSpecs）

- `src/config/appSpecs.ts` 整文件取上游：`APP_SPECS` 是应用能力与默认顺序的单一事实来源；`appConfig.tsx` 的 `APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`PROXY_APP_IDS`/`MODE_APP_IDS`/`STACK_APP_IDS`/`ADDITIVE_APP_IDS`/`MCP_APP_IDS` 改为派生。
- fork 在 `appConfig.tsx`/`types.ts` 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS` 与 `VisibleSidebarPanels` 段保留；`orderAppIds` 语义不变（未知 id 忽略、缺的插回默认位置）。
- `tests/config/appSpecs.json` 由后端测试生成、`appSpecs.test.ts` 双向比对：前后端能力表必须逐项一致。
- fork 的 `MODEL_CAPABLE_APPS`（`src/utils/providerModelUtils.ts`）与 `shouldShowTestEntry`（`connectivityEntry.ts`）**不**迁入 AppSpecs，判据保持不变。

### 托管账号身份与预设去重终态

- `provider_kind.rs` 整文件取上游；`tray.rs` 的 `MANAGED_OAUTH_PROVIDER_TYPES` 常量删除、改 `ProviderKind::declared(provider)`，其余调用点（provider 表单门控、卡片官方判定、live 写入分支）全部随上游替换，终态零残留该常量。
- 五个预设文件（codex/hermes/openclaw/opencode/pi）取上游去重后形态：重复模型列表收敛为 `const <preset>Models = () => [...]`，导出的预设序列化结果与此前逐字节一致、不共享对象。
- fork 在每个预设 interface 上的 `hidden?: boolean` 保留一份；预设 id 编号契约不变：编号 → 过滤上游 `hidden` → 过滤 `filterForkPresets` 白名单。若上游去重引入的常量块与 fork 追加行相邻，取上游结构后只补 `hidden?: boolean` 声明，不引入第二份。

### 本地化终态（8 语种）

- 8 个 locale 的上游新增/改写逐字取上游（新增集中在 `ipDiagnostics.*`、`autoUpdate.*`、`tray.installUpdate`、`settings.about.autoUpdate*` 等）；fork 键段（`connectivityTest.*`、`providerModel.*`、`devpanel.*`、`trayStyleHelp` 等）保留。
- `tr.json` 与 `v4.0.32` tag **逐字节一致**、不补 fork 键。
- `src/config/forkOnlyLocaleKeys.ts` 的 `FORK_ONLY_LOCALE_KEYS` 按新基线重新生成（`en.json` 减 `git show v4.0.32:src/i18n/locales/en.json`），更新后必须仍由生成结果驱动、注明重新生成方式；`FORK_REMOVED_LOCALE_KEYS`（5 个 `streamCheck.*`）不变。
- `localeParity`/`readmeParity` 口径不变：只豁免 fork 专属键与 fork 专属改写的 `README.md`，上游键校验强度不变。
- 合并后对全部 8 个文件按对象作用域显式查重，`dup=0`。

### 被删文件与依赖终态

- 上游删除的 9 个文件中，**`src/components/ui/table.tsx` 例外保留**（fork 的 `ConnectivityTestDialog.tsx` 仍用其 6 个组件；该文件只依赖 `react` 与 `cn`）。保留后它成为 fork 专属文件，下一轮同步进入 §3.1 白名单。
- 其余 8 个删除文件随上游删除且 fork 侧零引用：`ui/{accordion,card,scroll-area,tabs,toggle-row}.tsx`、`common/ListItemRow.tsx`、`hooks/useDebouncedValue.ts`、`scripts/measure-renderer.mjs`。
- 前端依赖删 `@radix-ui/react-{accordion,checkbox,scroll-area,tabs}`（`ui/checkbox.tsx` 上游已改写为原生 input，无需该包）；Rust 依赖删 `tower-http`/`http-body`（fork 的连通性测试不使用）。
- 终态 `pnpm install --frozen-lockfile` 与 `cargo check --all-targets` 均通过，且 `pnpm-lock.yaml`/`Cargo.lock` 不出现 updater 三段。

### 更新器域终态（Q1 = A：保留 fork 现状，整体不采纳）

- 上游本轮更新器域的部件**一律不落地**：`src-tauri/src/app_update.rs`、`src/components/AutoUpdatePrompt.tsx`、`lib.rs` 的 `tauri_plugin_updater` 插件注册与 `spawn_background_loop`、`commands/settings.rs` 的新安装链路（缓存包/离线退路/撤回即弃）、`AppSettings.auto_update_enabled` 与 `lib/api/settings.ts` 的对应绑定、`tauri.conf.json` 的 `plugins.updater`（上游 pubkey 与 endpoints）、`UpdateContext` 的自动更新字段与 `app-update-ready` 监听、`AboutSection` 的「自动下载更新」开关、`tray.rs` 的 `TrayTexts.install_update`/`MenuStatus.update_ready`/`INSTALL_UPDATE_ID` 菜单项、`src/tray-panel/` 的「重启并更新到 vX」入口、`tests/{components/AutoUpdatePrompt,contexts/UpdateContext.autoUpdate}.test.tsx`。
- fork 现状保留：`install_update_and_restart` 与 `check_app_update_available` 两个空壳命令、`lib/updater.ts` 恒返回 `up-to-date`、`UpdateContext` 现有字段、`AboutSection` 的「检查更新 = 打开 tunecc Releases 页」、无 `updater:default` 能力、无 updater 依赖。
- `commands/misc.rs` 的 `is_portable_mode` 保留 fork 自带实现，**不得**改为 `crate::app_update::is_portable()`（该模块不存在会编译失败）。
- 取证：`git grep -I -n 'tauri_plugin_updater\|plugin-updater\|app_update' HEAD -- src-tauri/src src` 零命中（`install_update_and_restart`/`check_app_update_available` 两个桩名除外，逐条说明）；`git grep -n 'autoUpdateEnabled\|auto_update_enabled\|latest.json' HEAD -- src src-tauri` 零命中。
- 禁止半套：编译通过但「检查更新」指向上游 Releases、或按钮点了没反应，都不接受。

### CI 终态

- `ci.yml` = fork 现有结构 + 上游新增的 `ci-gate` job（`needs: [changes, frontend, frontend-tests, backend, backend-windows-wsl2]`、`if: always()`、`permissions: {}`、逐项要求 `success|skipped`）。fork 裁剪语义全部保留：无 `schedule`/`workflow_dispatch`、四个 job 的 fork `if`、后端 `cargo nextest`、WSL2 restore-only rust-cache 与 `continue-on-error`、`CARGO_PROFILE_DEV_DEBUG` 等。
- `release.yml` 上游本轮零改动 → 保持 fork 裁剪版：只构建 Windows x64 与 macOS arm64 unsigned、tag 守卫、MSI `REBOOT=ReallySuppress` 断言、**macOS runner `macos-15`**、`$dest` 不带 `$assetSuffix`。按 Q1 = A，不引入签名步骤与 `latest.json` 产物。

### 构建物料终态

- `package.json`：`version = "4.0.32-1"`、`dev:fork` 脚本保留、无 `@tauri-apps/plugin-updater`、4 个 radix 依赖随上游删除。
- `src-tauri/Cargo.toml`：`version = "4.0.32-1"`、`repository` 指 tunecc、`codegen-units = 1`、无 `tauri-plugin-updater`、无 `tower-http`/`http-body`。
- `src-tauri/tauri.conf.json`：版本 `4.0.32-1`；无 `plugins.updater`（Q1 = A，上游该段不落地）。
- `src-tauri/Cargo.lock`：只允许删除 `tower-http`/`http-body` 树与 `cc-switch` 版本行改动。
- `pnpm-lock.yaml`：只允许删除 4 个 radix 包；终态无 updater 三段。

### 预设白名单终态

- 上游本轮净新增预设族为 0（`#9513` 是去重，`#9474` 是 OpenClaw 表单登记修复）；`forkOfficialAllowlist.ts` 预期零改动，若因上游条目改名产生悬空条目，按上游 `name` 逐字修正，不新增可见预设。
- 过滤顺序与判定实现不改。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- `IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`devpanel/`、连通性测试前后端链路（`services/connectivity_test/`、`commands/connectivity_test.rs`、两个命令注册、`ConnectivityBadge`/对话框/批量检测、`useConnectivityProbe`、`shouldShowTestEntry`）、模型徽章与 `ModelQuickSwitch/`、`websiteUrl2` 全链路（含 `database/dao/providers.rs` 两条 SELECT 与 UPDATE 守卫）、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏 `tray_left_click_never_opens_the_menu`、跨应用导入接线、右键置顶/置底、tunecc 4 处 URL 与两个测试断言、无 `stream_check` 接线。
- 更新器域取证按 Q1 = A 执行：`tauri_plugin_updater`/`plugin-updater`/`app_update`/`auto_update_enabled`/`AutoUpdatePrompt` 在 `src-tauri/src` 与 `src` 零命中（`install_update_and_restart`/`check_app_update_available` 两个既有空壳除外）；`capabilities/default.json` 无 `updater:default`。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮实测修订（新增 `ui/table.tsx` 保留条目、`appSpecs`/`provider_kind` 叠加口径、预设去重、locale 基线刷新、更新器域取舍），新增 §4.15「v4.0.32 轮的叠加要点」。
- `docs/comet/specs/upstream-sync/spec.md`：归档时整体重写为本轮终态（本文件）。
- `docs/comet/specs/database-schema-migrations/spec.md`：本轮 schema 不变，仅需确认终态描述仍为 26。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 重放前后提交数之差只允许「被判空丢弃」或「本轮新增」；主题序列 diff 为 0；patch-id 差异逐条归类「冲突停车」或「仅上下文位移/被上游同名声明消化」；冲突停车清单逐条记录文件、双方语义与解法。
- `.comet/config.yaml` 在 rebase 中途被历史提交改回旧内容时，按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并纳入提交；终态与同步前一致。

### 落地保真核对（口径，最终态复算）

- 四 ref 行多重集差集：`v4.0.32` / `v4.0.31`（基线） / `pre-sync-v432` / `HEAD`；194 个上游文件与 fork 侧代码文件全部参与；非重叠上游文件在 fork 侧缺失为 0；重叠 55 文件的两侧缺失行逐行归因并带重数；归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 更新器域取舍 / 被删文件）」；出现无法归类的缺失行即判定失败。
- 复算脚本 `scripts/fidelity-v432.py` 随 Build 落地，可重复执行、不含硬编码条数；复算必须在最终态提交之后进行。

### 版本号

- 四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包）终态统一 `4.0.32-1`；本地 annotated tag `v4.0.32-1` 在验收通过、用户接受归档并单独授权交付后创建并推送。

### 交付（归档后单独授权）

- Build/Verify 不执行任何远端写操作；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.32-1` 的推送；只授权这两项远端动作，不创建 PR。

### `.comet/config.yaml` 保护

- 该文件是 fork 专属文件且会被重放的历史提交改回旧内容；rebase 中途显式恢复并纳入提交，否则 Native Hook 拒绝写入；终态与同步前一致。

### 已知流程坑位（沿用 + 本轮新增）

- 沿用：取证 fetch 禁 `--prune-tags`；`.comet/config.yaml` rebase 保护；预设 id 编号契约；locale 对象作用域查重；`cargo fmt --check` 进正式检查计划；绝对条数一律用现取口径；时间敏感用例 flaky 边界按「与上游逐字节比对 + 本地重复跑」判定。
- 本轮新增：①上游整轮「删除无用文件/依赖」会带走 fork 仍在用的 `ui/table.tsx`，收尾必须复跑 `git grep` 确认 fork 侧零悬空引用；②更新器域必须整体取舍，`commands/misc.rs` 的 `is_portable_mode` 与 `tray.rs` 的 `install_update` 文案是两处「只取上游半截就编译失败或功能哑火」的高危点；③`forkOnlyLocaleKeys.ts` 的键清单必须按新 tag 重新生成，不能沿用上一轮 284 键；④预设去重会把 5 个文件的行号整体重排，重放冲突要按「上游结构 + 只补 `hidden?: boolean`」处理，不要整文件取 fork 侧；⑤`appSpecs.json` 由后端测试生成，`cargo test` 未跑过就提交会让 `appSpecs.test.ts` 红。
