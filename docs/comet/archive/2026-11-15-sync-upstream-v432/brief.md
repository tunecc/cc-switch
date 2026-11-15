# 目标

fork（tunecc/cc-switch）的 main 继续同步到上游 farion1231/cc-switch 最新已发布 annotated tag `v4.0.32`（tag 对象剥离提交 `93d2381c8730aaf0078d44cd9c060dfa8133f859`，2026-11-14 发布），按原顺序重放 `v4.0.31..main` 的 216 个 fork 提交，fork 版本号 `4.0.31-1` → `4.0.32-1`。上游本轮的功能与修复全部落地（fork 已裁剪 / 已移除段除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户本轮额外要求：**如果 fork 做过的功能上游也新增了，先询问并分析「保留上游还是保留 fork 更好」**。

**本轮核查结论（已按历轮三步口径取证）：上游 v4.0.31..v4.0.32 存在一处正面对撞——「应用内更新器」。fork 早已整体关闭应用内更新器（移除 `tauri_plugin_updater`、`install_update_and_restart` 实现、`updater:default` 能力，关于页只打开 tunecc Releases 页），而上游本轮的发布主轴就是「后台自动下载更新 + 确认后再安装」。这不属于「上游顺手实现了 fork 的功能」，而是「上游重写了 fork 主动放弃的那条链路」。用户已决定：本轮保留 fork 现状，上游更新器域整体不采纳（Q1 → A）。**

其余新增域在 fork 侧零对应实现，无二选一：IP 检测（出口 IP，与 fork 的供应商逐模型连通性测试不同域）、AppSpec 能力表（能力元数据集中化，与 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry` 是互补关系）、`ProviderKind`（托管账号身份判定集中化，fork 无自有实现）、panic 后锁毒化恢复、预设模型列表去重、OpenClaw 模型登记、misc 工具探测整备。

# 范围

## 同步区间与取证

- **区间**：`v4.0.31..v4.0.32`，实测 26 个提交、194 个文件、+8218/−6596（21 新增 / 164 修改 / 9 删除 / 0 重命名）。
- **fork 侧重放面**：`v4.0.31..main` 共 216 个提交（`git rev-list --count`），含 v4.0.31 轮归档提交、`docs(sync)` 更正提交与 `chore(comet)` 配置提交。
- **重叠面 55 个文件**（`comm -12 <(git diff --name-only v4.0.31 v4.0.32|sort) <(git diff --name-only v4.0.31 HEAD|sort)`），最大摩擦点是 5 个预设文件的大重构（合计 +1648/−3791）、`settings.rs`、`tray.rs`、`lib.rs`、`commands/settings.rs`、`commands/misc.rs`、`appConfig.tsx`、`ProviderCard.tsx`、`ProviderList.tsx`、4 个既有 locale 与 6 个更新器相关前端文件。
- **上游是否齐平**：`git rev-list --count v4.0.32..upstream/main` 现取 **1**（`docs(manual): add the Antigravity Orchestrator note to the Japanese usage page`）。按历轮「只锁已发布 tag」口径，不纳入本轮。
- **同步前安全参照**：rebase 前打本地分支 `pre-sync-v432`（= 当前 main `c7f7c43ea`），不推送。

## 上游本轮改动（按主题）

1. **后台自动下载更新（本轮发布主轴，与 fork 决策正面对撞）**
   - 新 `src-tauri/src/app_update.rs`（262 行）：进程级内存缓存已下载包、`FIRST_CHECK_DELAY = 60s`、`CHECK_INTERVAL = 6h`、`status()`/`ready()`/`begin_install()` 串行化安装；便携版与 Linux 非 AppImage 判定为不可自装。
   - 新 `src/components/AutoUpdatePrompt.tsx`（128 行）+ `App.tsx` 挂载；`UpdateContext.tsx` 新增 `readyUpdate`/`autoUpdateSupported`/`routingInUse`/`refreshAutoUpdate` 与 `app-update-ready` 事件监听。
   - `AboutSection.tsx` 新增「自动下载更新」开关（默认关、设备级）与不可用原因；`settings.rs` 新增 `AppSettings.auto_update_enabled`；`lib/api/settings.ts` 新增同类绑定与 `downloadAppUpdate`/`getAutoUpdateStatus`/`installAppUpdateAndRestart`。
   - `commands/settings.rs` 的 `install_update_and_restart` 整体重写（读缓存包 / 离线退路 / 失败释放 / 撤回即弃），`commands/misc.rs` 的 `is_portable_mode` 改为委托 `app_update::is_portable()`；`lib.rs` 注册更新器插件、后台循环与两个命令。
   - `tray.rs` 新增 `TrayTexts.install_update`（8 语）与 `MenuStatus.update_ready`、`INSTALL_UPDATE_ID` 菜单项；`src/tray-panel/` 同步新增入口。
   - `tauri.conf.json` 的 `plugins.updater.endpoints` 指 `dl.ccswitch.io/latest.json` 与上游 GitHub Releases；`release.yml` 用上游签名密钥出 `.sig` 与 `latest.json`。
2. **IP 检测（新能力，fork 零语义）**：`services/ip_diagnostics.rs`（411 行，并发采样 icanhazip/ipify，用 ipwho.is 查位置，结果只在点击后产生）+ `components/settings/IpDiagnostics.tsx`（192 行）+ 全局代理 API 绑定 + 网络设置区入口 + 8 语种文案。
3. **三处结构性重构**
   - `#9495` 应用能力表：新 `src/config/appSpecs.ts`（`APP_SPECS` 单一事实来源，派生 `APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`PROXY_APP_IDS`/`MODE_APP_IDS`/`STACK_APP_IDS` 等）、后端同步维护 `AppType::spec`、`tests/config/appSpecs.json` 由后端测试生成并由 `appSpecs.test.ts` 双向比对。
   - `#9497` 托管账号身份集中化：新 `src-tauri/src/provider_kind.rs`（199 行），`MANAGED_OAUTH_PROVIDER_TYPES` 常量与多处 `provider_type` 判定改为 `ProviderKind::declared(provider)`。
   - `#9513` 预设模型列表去重：codex/hermes/openclaw/opencode/pi 五个文件把重复的模型列表收敛为 `const <preset>Models = () => [...]`，行为（含序列化字节与对象不共享）不变；新增 `tests/config/presetModelLists.test.ts` 作为护栏。
4. **panic 后状态恢复（#9472 / #9483）**：新 `src-tauri/src/sync_utils.rs`（123 行，隔离进程运行毒化用例）、`database/mod.rs` 连接锁恢复、`settings.rs` 与配置文件读写锁改为可去毒化、`backup.rs`/`mcp`/`prompt`/`model_pricing` 等调用点同步。
5. **清理（#9492）**：删除 9 个文件——`src/components/ui/{accordion,card,scroll-area,table,tabs,toggle-row}.tsx`、`src/components/common/ListItemRow.tsx`、`src/hooks/useDebouncedValue.ts`、`scripts/measure-renderer.mjs`；`package.json` 移除 `@radix-ui/react-{accordion,checkbox,scroll-area,tabs}`，`Cargo.toml` 移除 `tower-http`/`http-body`（`ui/checkbox.tsx` 改写为原生 input）。
6. **修复**：`#9476` Codex 经路由续接旧会话时「先 200 后解密失败」去加密内容同家重试；`#9507` Mistral 上游剥离 Responses 专用字段与 `reasoning_content`；`#9473` Copilot 仅 Responses 的模型改走 Responses；`#9471` 改写普通会话文件保留 mtime；`#9470` Hermes 已删供应商可编辑删除；`#9474` OpenClaw 新增时登记表单模型；`#9515` mise shim 计入真实安装；`#9478` 打开终端对话框内容可滚动、回车直开；`#9228` Copilot 卡显示绑定 GitHub 账号；`#9436`/`#9494` 文案与 Antigravity Orchestrator 分步计价（新增 `gemini-4-hydrogen` 定价种子，无迁移）。
7. **CI**：`ci.yml` 新增 `ci-gate` 汇总 job（`needs: [changes, frontend, frontend-tests, backend, backend-windows-wsl2]`，逐项要求 `success|skipped`），fork 裁剪版作业名与上游一致，可直接采纳；`release.yml` 上游本轮**零改动**。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v432/{brief.md,specs/upstream-sync/spec.md}`；沿用历轮决定，不建立能力关联、不产生 `capability-association.yaml` 与 `delta.yaml`。
- 归档时由 Runtime 生成 `docs/comet/archive/<date>-sync-upstream-v432/`。
- rebase 前新增本地安全参照分支 `pre-sync-v432`（= `c7f7c43ea`），不推送。
- 本轮落地保真复算脚本 `scripts/fidelity-v432.py`（沿用 `fidelity-v431.py` 的四 ref 口径，可重复执行、不含硬编码条数）。
- 随上游落地的新增文件（按 Q1 = A 排除 4 个更新器域新文件后）：`provider_kind.rs`、`sync_utils.rs`、`services/ip_diagnostics.rs`、`session_usage_agy/orchestrator_tests.rs`、`IpDiagnostics.tsx`、`appSpecs.ts`、`appSpecs.json`、`appSpecs.test.ts`、`presetModelLists.test.ts`、`openclawProviderPresets.test.ts`、`ProviderForm.openclawSuggestedDefaults.test.tsx`、`ProviderCard.copilotAccount.test.tsx`、3 份 release notes、`whats-new/4.0.32.json`。不落地：`app_update.rs`、`AutoUpdatePrompt.tsx`、`AutoUpdatePrompt.test.tsx`、`UpdateContext.autoUpdate.test.tsx`。
- 交付步骤（验收通过、归档且用户另行授权后）新增本地 annotated tag `v4.0.32-1`。

### 修改

- 55 个重叠文件，按类别：
  - 版本与物料 5 个：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`、`pnpm-lock.yaml`（上游净删依赖 4 个前端 + 2 个 Rust）。
  - 后端 21 个：`lib.rs`、`commands/{misc,settings}.rs`、`commands/stream_check.rs`（孤儿）、`database/{backup,mod,schema,tests}.rs`、`deeplink/provider.rs`、`provider.rs`、`proxy/{forwarder,http_client}.rs`、`proxy/providers/{claude,codex,claude_reasoning,mod}.rs`、`services/{mod,omo}.rs`、`services/provider/{live,mod}.rs`、`settings.rs`、`tray.rs`。
  - 前端 24 个：`App.tsx`、`components/providers/{AddProviderDialog,EditProviderDialog,ProviderCard,ProviderList}.tsx`、`components/providers/forms/ProviderForm.tsx`、`components/settings/{AboutSection,SettingsPage}.tsx`、`config/appConfig.tsx`、5 个预设文件、`contexts/UpdateContext.tsx`、`lib/updater.ts`、`lib/api/settings.ts`、`lib/query/mutations.ts`、`types.ts`、4 个既有 locale。
  - 测试 2 个：`tests/components/{AppsPage,ProviderList}.test.tsx`。
- fork 侧文档：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测修订并追加 §4.15（v4.0.32 轮要点）；归档时把 `specs/upstream-sync/spec.md` 重写为本轮终态。

### 删除

- 上游删除 9 个文件，其中 **`src/components/ui/table.tsx` 必须例外保留**：fork 的 `src/components/providers/ConnectivityTestDialog.tsx` 是唯一仍在引用它的文件（`Table`/`TableBody`/`TableCell`/`TableHead`/`TableHeader`/`TableRow` 六组件），该文件只依赖 `react` 与 `lib/utils` 的 `cn`，无被删依赖。其余 8 个删除文件在 fork 侧零引用（已逐一 `git grep` 核实），随上游删除。
- 上游删除的 4 个 radix 前端依赖与 2 个 Rust 依赖在 fork 侧零引用（`ui/checkbox.tsx` 上游已改写为原生 input），随上游删除。
- fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回（按 Q1 结论执行）。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离 `current`，沿用 main）。
- 不引入 `upstream/main` 上 tag 之后的 1 个提交。
- 不重新接线 `stream_check`；不复活 `release.yml` 被裁段（Linux bundle、公证 stapler）；macOS runner 维持 fork 现状 `macos-15`。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不为上游新增第三方预设改写 fork 白名单判定实现（本轮上游净新增预设族为 0，`forkOfficialAllowlist` 预期零改动）。

# 非目标

- 不改 fork 自有功能实现与形态：逐模型连通性测试链、托盘左键契约、模型徽章与快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识、`forkOfficialAllowlist`/`forkPresetFilter` 判定逻辑。
- 不把上游 AppSpecs 能力表反向用于改写 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry`（只取上游集中化结构，不动 fork 能力判据）。
- 不对上游 IP 检测做 fork 侧定制（随上游落地、只在点击时运行）。
- 不做本轮之外的功能开发、重构或依赖升级；版本号以外的物料改动只取上游。

# 决策

- **D1｜同步目标与工作区**：锁已发布 tag `v4.0.32^{}` = `93d2381c8`，不纳入 `upstream/main` 的 1 个 tag 后提交。工作区 `current`，沿用 main 与当前目录；`pre-sync-v432` 只作回退参照。
- **D2｜「上游是否重复实现 fork 功能」核查**：全量词表扫描上游新增行（8,097 行）对 fork 的 12 个功能标识零命中（`websiteUrl2`/`website_url_2`/`QuickSwitch`/`visibleSidebarPanels`/`quickSort`/`DevPanel`/`forkBuild`/`forkOfficial`/`SearchableModel`/`ImportEntry`/`TestDialog` 全 0；`connectivity`/`trayPanel` 各 1 命中均为文件名本身）。再按功能名逐项排除同域相邻：①**应用内更新器 = 唯一正面对撞**（见 Q1，不是上游新增了 fork 的功能，而是上游重写 fork 主动放弃的链路）；②IP 检测 vs fork 逐模型连通性测试——前者测 CC Switch 自身出口 IP、后者测供应商模型可达性，实现与入口均不重叠；③AppSpec 能力表 vs fork 的模型能力判据——上游是能力元数据集中化，不含「模型徽章/连通性/跨应用导入」语义；④`ProviderKind` vs fork——fork 无托管身份自有实现（用的是上游 v4.0.19 起的 `isOfficialAccount`），本轮只是把判定集中化；⑤`tray.rs` 的「重启并更新到 vX」是更新器附属项，不触 `TrayIconEvent::Click`（实测 diff 无该符号），fork 左键四分支不受影响。
- **D3｜数据库**：上游 `SCHEMA_VERSION` 连续保持 26，本轮 `database/schema.rs` 只加 `gemini-4-hydrogen` 定价种子行、`database/mod.rs` 只加锁恢复，**无迁移链合并**；fork 的 `stream_check_logs` 建表与全部既有臂原样保留。
- **D4｜孤儿 stream_check 豁免延续**：上游本轮改 `commands/stream_check.rs`（+93）与 `proxy` 相关调用点，随文件落地；fork 不恢复模块声明、命令注册与 dao 文件，`stream_check_provider` 保持 0 命中，`src/lib/api/connectivity-check.ts` 与 `useStreamCheck.ts` 的无调用方状态重新确认。
- **D5｜`ui/table.tsx` 保留为 fork 专属文件**：因 fork 的 `ConnectivityTestDialog` 仍在用（上游删除理由是「上游自己已无引用」），保留该文件与 `components/ui/` 其余删除解耦；不为此改写 fork 弹窗实现。下一轮同步起该文件进入 §3.1 白名单。
- **D6｜CI 与物料**：`ci.yml` 采纳上游 `ci-gate` 汇总 job（fork 作业名与 `needs` 完全一致，无需裁剪），fork 既有裁剪语义（无 schedule/workflow_dispatch、四个 job 的 fork `if`、WSL2 `continue-on-error` + LNK1327 注释、nextest、rust-cache `shared-key: backend`）全保留；`release.yml` 维持 fork 版（macOS `macos-15`、Windows x64 + macOS arm64 unsigned、MSI `REBOOT=ReallySuppress` 断言）；四处版本 `4.0.32-1`；`Cargo.lock` 只允许删除 `tower-http`/`http-body` 树与版本号行；`pnpm-lock.yaml` 只允许删除 4 个 radix 包，终态不得出现 updater 三段。
- **D7｜预设模型列表去重重构叠加**：五个预设文件取上游去重后形态（纯结构、序列化字节等价），fork 各 interface 的 `hidden?: boolean` 与「编号 → 过滤 `hidden` → 过滤白名单」顺序不变；`presetModelLists.test.ts` 原样取上游；若上游新 `const xxxModels = () => [...]` 与 fork 追加行冲突，取上游结构后只补 `hidden?: boolean` 字段声明。
- **D8｜本地化与一致性测试**：8 个 locale 的上游新增/改写逐字取上游、fork 键段保留；`tr.json` 与 tag 逐字节一致、不补 fork 键；`src/config/forkOnlyLocaleKeys.ts` 的 `FORK_ONLY_LOCALE_KEYS` 按新基线重新生成（`en.json` 减 `git show v4.0.32:src/i18n/locales/en.json`），`FORK_REMOVED_LOCALE_KEYS`（5 个 `streamCheck.*`）不变；`localeParity`/`readmeParity` 口径不变；合并后按对象作用域显式查重 `dup=0`。
- **D9｜AppSpecs 与 ProviderKind 取上游**：`appSpecs.ts` 整文件取上游，`appConfig.tsx` 以 `APP_IDS` 派生形态落地并与 fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS`/`VisibleSidebarPanels` 并存；`provider_kind.rs` 整文件取上游并替换全部调用点；fork 的类型段（`websiteUrl2`、侧栏面板）保留。
- **D10｜交付授权延后**：Build/Verify 不推送、不打 tag；归档完成后单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.32-1` 推送；不创建 PR。
- **D11｜更新器域整体不采纳（Q1 = A）**：上游更新器链路在本轮当作「fork 已明确移除的链路」处理，等同历轮的 `stream_check` 豁免：相关 hunk 一律不落地，`commands/settings.rs` 与 `commands/misc.rs` 是两处「取上游侧会带回更新器」的高危点，解完必须 `git grep -I -n 'tauri_plugin_updater\|plugin-updater\|app_update' HEAD -- src-tauri/src src` 零命中（命令桩与 `pip` 类同名无关命中除外，逐条说明）。`tray.rs` 的 `TrayTexts.install_update` 与 `MenuStatus.update_ready` 两处随本决策不引入；其余 `tray.rs` 上游改动（`ProviderKind` 替换）取上游。

## 已确认的用户决定（2026-11-15）

- **Q1 更新器取舍 → 保留 fork 现状（A）**。上游 v4.0.32 的「默认关 + 确认后安装」后台自动下载更新整体不采纳：不引入 `app_update.rs`、`AutoUpdatePrompt.tsx`、`lib.rs` 的更新器插件与后台循环、`commands/settings.rs` 的新安装链路、`settings.auto_update_enabled`、`tauri.conf.json` 的 `plugins.updater`、`UpdateContext` 的自动更新扩展、`AboutSection` 的「自动下载更新」开关、`tray.rs`/`tray-panel` 的「重启并更新到 vX」入口。fork 的 `install_update_and_restart`/`check_app_update_available` 空壳、`lib/updater.ts` 恒返回 up-to-date、`capabilities/default.json` 无 `updater:default` 全部保留；`commands/misc.rs` 的 `is_portable_mode` 保留 fork 自带实现（不得引用不存在的 `app_update::is_portable`）。理由：fork 的发布链路是裁剪版（无签名密钥、无 `latest.json`、macOS 未签名、无 R2 镜像），恢复该链路需要改造发布基础设施，属于独立工程，不塞进同步轮。后续如需要，另起 change 评估（本次未承诺启动）。

# Open questions

（无。Q1 已由用户确认。）

# 验收示例

- 同步基线与重放完整性可核对：`git merge-base main v4.0.32^{}` 为 `3c76d3bda`（v4.0.31 剥离提交），`git rev-list --count v4.0.31..HEAD` = 216 + 本轮新增提交数（现取口径），重放主题序列与 `pre-sync-v432`（= `c7f7c43ea`）一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移」。
- fork 全部魔改在终态仍然在位：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键置顶/置底，逐项 `git grep -I` 取证并跑对应测试。
- 上游本轮新能力落地：IP 检测（网络设置入口、仅点击时采样、8 语种文案）、AppSpec 能力表（`appSpecs.test.ts` 与后端 `appSpecs.json` 双向一致）、`ProviderKind`（全部旧常量判定被替换、无残留 `MANAGED_OAUTH_PROVIDER_TYPES` 引用）、panic 后锁恢复（`settings`/`database`/配置文件锁毒化用例通过）、预设去重护栏（`presetModelLists.test.ts` 通过）。
- 更新器域终态严格符合 Q1 = A：`app_update` 模块、`AutoUpdatePrompt`、`tauri_plugin_updater` 依赖与插件注册、`capabilities/default.json` 的 `updater:default`、`tauri.conf.json` 的 `plugins.updater`、`settings.auto_update_enabled`、`AutoUpdatePrompt`/`UpdateContext.autoUpdate` 两个测试、`tray` 的「重启并更新」项与 `tray-panel` 入口全部缺席（`git grep` 零命中，两个既有空壳命令除外）；`lib/updater.ts` 仍恒返回 up-to-date、关于页「检查更新」仍指向 tunecc Releases；`commands/misc.rs` 的 `is_portable_mode` 仍用 fork 自带实现。
- 被删文件与依赖的 fork 侧影响可复算：`components/ui/table.tsx` 在位且 `ConnectivityTestDialog` 六组件导入解析通过；其余 8 个删除文件与 6 个删除依赖在 `src`/`tests` 零引用。
- 本地化终态：8 个语种文件的上游键按 `localeParity` 校验一致（fork 专属键经单一来源豁免清单 skip，清单与「`en.json` 减上游 v4.0.32 的 `en.json`」逐键相等）；`readmeParity` 仍只校验上游 7 份 README；`tr.json` 与 tag 逐字节一致；按对象作用域显式查重 `dup=0`。
- CI 与物料终态：`ci.yml` 含 `ci-gate` 且 fork 裁剪语义全保留；`release.yml` 保持 fork 版且 macOS runner 为 `macos-15`；四处版本号 `4.0.32-1`。
- 后端与前端在新结构下全绿：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm test:unit`、`cargo check --all-targets`、`cargo fmt --check`、`cargo nextest run`（或 `cargo test`）全部通过；上游新增的 `Provider { … }` 字面量均带 fork 的 `website_url_2`。
- 交付边界与配置保护：Build/Verify 期间零远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证 fetch 不带 `--prune-tags`；`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.15 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径，脚本 `scripts/fidelity-v432.py` 随 Build 落地）：`v4.0.32` / `v4.0.31`（基线） / `pre-sync-v432` / `HEAD` 四 ref 计算差集，194 个上游文件与 fork 侧代码文件全部参与，非重叠上游文件缺失为 0，重叠 55 文件的两侧缺失行逐行归因并带重数，出现无法归类的缺失行即判定失败。
