# Fork 仓库 Rebase 上游工作流

本文件描述 cc-switch fork 仓库（`tunecc/cc-switch`，origin）与上游原版（`farion1231/cc-switch`，upstream）同步的标准 rebase 流程。

- **origin**：fork 仓库，地址 `git@github-tunecc:tunecc/cc-switch.git`（即 `https://github.com/tunecc/cc-switch.git`），承载 fork 的魔改代码与 Comet change 文档。
- **upstream**：原版仓库，地址 `https://github.com/farion1231/cc-switch.git`，所有 fork 改动最终都要能 rebase 到它的 `main` 之上。

后续所有 fork 魔改 change 都按本流程与上游同步，保持 fork 始终可干净 rebase。

---

## 1. 添加 upstream remote

首次同步前需要把原版仓库加为 upstream remote（origin 已默认指向 fork）：

```bash
# 添加 upstream（原版仓库）
git remote add upstream https://github.com/farion1231/cc-switch.git

# 拉取 upstream 最新引用
git fetch upstream

# 验证
git remote -v
# origin    git@github-tunecc:tunecc/cc-switch.git (fetch/push)   <- fork
# upstream  https://github.com/farion1231/cc-switch.git (fetch)    <- 原版
```

说明：

- `origin` 是 fork（`tunecc/cc-switch`），日常推送走这里。
- `upstream` 是原版（`farion1231/cc-switch`），只 fetch、不 push。
- 一次添加永久生效，后续只需 `git fetch upstream`。

---

## 2. rebase 上游 main 标准流程

把当前 fork 分支变基到 upstream 最新 main 之上：

```bash
# 1. 拉取 upstream 最新引用
git fetch upstream

# 2. 切到要 rebase 的 fork 分支
git checkout feat/xxx

# 3. 变基到 upstream/main
git rebase upstream/main

# 4. 如有冲突，按第 3 节约定解决后继续
#    git rebase --continue

# 5. 推送回 origin（fork）
git push --force-with-lease origin feat/xxx
```

说明：

- **`--force-with-lease` 比 `--force` 安全**：它会在远端被别人更新时拒绝推送，避免覆盖协作者的新提交；`--force` 会无条件覆盖。
- rebase 前最好保证工作区干净（`git status` 无未提交改动）；如有 stash 需要先处理。
- rebase 会改写 fork 分支历史，所以必须 force push；origin 是 fork 私有分支，可以接受改写。
- rebase 完成后跑一次完整构建与测试，确认 fork 魔改仍工作。

---

## 3. 冲突处理约定

rebase 时按文件归属决定冲突解决策略：

### 3.1 fork 专属文件（见第 4 节白名单）

冲突时 **保留 fork 侧改动**：

```bash
# 保留 fork 侧（rebase 中 fork 侧即 --theirs，上游侧是 --ours）
git checkout --theirs <file>
git add <file>
git rebase --continue
```

这些文件是 fork 魔改或 Comet change 产物，与上游无对应来源或刻意分叉，一律以 fork 为准。

> 方向说明（2026-09-08 v3.20.2 同步实测修正）：`git rebase upstream/main` 重放 fork 提交时，
> `--ours` 是新基线（上游 + 已重放提交），`--theirs` 才是正在重放的 fork 提交 —— 与 merge 语义相反。
> 本文件旧版误写为 `--ours`，已修正；冲突时不确定就先看文件内容再选侧。

### 3.2 其余文件（上游共享代码）

优先取上游版本，再手动合并 fork 必要改动：

```bash
# 取上游版本（rebase 中上游即 --ours，正在重放的 fork 提交才是 --theirs）
git checkout --ours <file>

# 手动编辑该文件，把 fork 必要的改动叠加回去
# ...编辑...

git add <file>
git rebase --continue
```

说明：

- 共享代码冲突时优先对齐上游，降低长期漂移成本；fork 的魔改应尽量集中在 fork 专属文件中，避免在共享文件里散落改动。
- 解决冲突后必须 `git add` 再 `git rebase --continue`，否则 rebase 不会推进。
- 想中断 rebase 回到起点：`git rebase --abort`。
- 单次冲突处理不确定时不要盲目 `--continue`，先 `git status` 和 `git diff` 复核。

---

## 4. fork 专属文件白名单

rebase 时需 **保留 fork 侧改动** 的文件清单：

| 文件 | 保留字段 / 范围 |
| --- | --- |
| `tauri.conf.json` | `productName`（`CC Switch`，与上游一致；fork 仅靠版本号后缀区分）、`version` 等 fork 标识字段 |
| `package.json` | `version`（fork 版本号） |
| `src-tauri/Cargo.toml` | `version`（与 `package.json` 对齐的 fork 版本号） |
| `src-tauri/Cargo.lock` | `cc-switch` 包的 `version` 与 `Cargo.toml` 联动（改 `Cargo.toml` 后跑一次 `cargo check` 自动更新） |
| `vite.config.ts` | `define` 中的 `__CCS_FORK_BUILD__` 等 fork 编译期常量 |
| `vitest.config.ts` | `define` 中的 `__CCS_FORK_BUILD__` 与 `testTimeout`（jsdom 组件测试超时 30s，整文件保留） |
| `src/config/forkBuild.ts` | fork 构建配置（整文件保留） |
| `src/components/devpanel/` | fork 专属 devpanel 组件目录（整目录保留） |
| `src-tauri/tauri.windows.conf.json` | Windows 平台 title（`CC Switch`，与上游一致） |
| `src-tauri/tauri.dev.conf.json` | fork dev 预览配置：独立 identifier 与配置目录（整文件保留） |
| `src/App.tsx` | `IS_FORK_BUILD` + `isTauri` 双守卫下的 `setTitle` useEffect |
| `src/components/settings/SettingsPage.tsx` | `IS_FORK_BUILD` 守卫下的 DevPanel 入口与挂载（v4.0 起为 sections 结构，DevPanel 挂在 about 分组）。v4.0.7 起上游在本文件加了应用配置滚动定位 effect（+130 行），该文件转为共享文件，按 §3.2「取上游 + 叠加 DevPanel」处理，见下方共享文件表 |
| `src/vite-env.d.ts` | `__CCS_FORK_BUILD__` 全局类型声明 |
| `src/i18n/locales/zh.json` / `en.json` / `ja.json` / `zh-TW.json` | `devpanel` 段 + `connectivityTest` / `connectivityCheck` 等连通性测试键段（fork 新增键；上游新增键按共享合并）。注意 `devpanel` 段只存在于 zh / en 两个 locale，ja / zh-TW 同步前就没有该段，属 fork 既有状态，不要为「补齐」而手工添加。v4.0.8 起上游新增 `officialModelsReason` 九种原因 code（4 个 locale 各 +11）与 `settings.advanced.logConfig.openLog` / `openLogFailed`（4 个 locale 各 +2），并改写 en/ja 的 `quotaDisplayHelp` 与 en/ja/zh-TW 的 `codexHistoryUnify*.hint` 文案：上游新增与改写按上游执行，fork 键段不动；v4.0.9 起上游把表单说明改为 HelpTip 文案（`apiFormatHelp`、`modelMappingHint`、`fallbackModelHelp`/`fallbackModelHelpDirect`、`fallbackModelMissing`/`fallbackModelHaikuMissing`、`routeOnlySettingsHint`、`directModeFormatInUse`/`directModeFormatSwitch`，`grokBuild.inactiveFieldsHint` 去掉 `count` 参数），并删除 `advancedOptionsHint`、`apiFormatHint`、`fallbackModelHint`、`stackLayout.advancedHint` 等旧键：上游新增/改写/删除都按上游执行，fork 的 `searchModels`/`noModelsFound`、`devpanel`、`connectivityTest`/`connectivityCheck` 等键段不动；v4.0.10 起上游在 4 个 locale 各加约 50 行新键（自定义图标与「我的图标」库、深链接与站方指南文案、连接模式说明改为先讲各模式优势、`common.done` 相关删除、haiku 别名与 ja「詳細オプション」）：上游新增/改写按上游执行，fork 键段不动。**合并后必须逐文件查重**：rebase 的三方合并会在同一对象里并存 fork 旧写法与上游新写法（v4.0.9 轮实测 zh/ja/zh-TW 各留 3 条重复 `inactiveFieldsHint`，共 9 行），`JSON.parse` 只取最后一个键、vitest 与 i18n 用例全绿，靠测试发现不了，必须用 `object_pairs_hook` 之类的显式重复键检测确认 4 个文件 dup=0 |
| `tests/msw/tauriMocks.ts` | `isTauri` mock 导出 |
| `src/config/forkOfficialAllowlist.ts` | fork 官方预设白名单（整文件保留） |
| `src/config/forkPresetFilter.ts` | fork 预设过滤工具（整文件保留） |
| `tests/setupTests.ts` | `vi.mock("@/config/forkBuild")` 段（IS_FORK_BUILD=false 上游构建语义测试隔离） |
| `src-tauri/src/commands/connectivity_test.rs` | 连通性测试 Tauri 命令（整文件保留） |
| `src-tauri/src/services/connectivity_test/` | 连通性测试后端服务（整目录保留） |
| `src/components/providers/ConnectivityTestDialog.tsx` | 连通性测试弹窗（整文件保留） |
| `src/components/providers/ConnectivityDetailDialog.tsx` | 连通性测试详情弹窗（整文件保留） |
| `src/components/providers/ConnectivityBadge.tsx` | 供应商列表批量探针徽标（整文件保留） |
| `src/components/providers/connectivityEntry.ts` | 弹窗入口判定（整文件保留） |
| `src/components/usage/ConnectivityCheckConfigPanel.tsx` | 用量页连通性测试参数面板：已由 fork 提交 `6064fc1c`（refactor(health-check): drop connectivity check settings and dead batch/log paths）删除，HEAD 已无此文件。上游若重新引入同名组件，按第 3.2 节把改动移植到现存入口（`src/components/providers/ConnectivityTestDialog.tsx`、`src/hooks/useConnectivityTest.ts`、`src/lib/connectivityTestSettings.ts`），不要按本行恢复旧文件 |
| `src/hooks/useConnectivityProbe.ts` / `useConnectivityTest.ts` | 测试/探针状态 hooks（整文件保留） |
| `src/lib/api/connectivity-check.ts` / `connectivity-test.ts` | 连通性测试前端 API 绑定（整文件保留） |
| `src/lib/api/settings.ts` | fork：移除 `installUpdateAndRestart()` 绑定（关闭应用内更新器）。v4.0.6 起上游在本文件加 `codexForcesMultiAgentV2()` 绑定（+5 行）：取上游新增，fork 移除的更新绑定不得复活。v4.0.7 起上游又加三个 Codex 会话压缩命令绑定（`getCodexSessionCompression`/`setCodexSessionCompression`/`getCodexSessionsDiskUsage`，+15 行）：取上游新增，fork 移除的更新绑定仍不得复活。v4.0.8 起上游再加 `revealAppLogFile()` 绑定（+4 行，诊断日志「打开日志」按钮）：取上游新增，fork 移除的更新绑定仍不得复活 |
| `src/lib/connectivityTestSettings.ts` | 测试参数持久化纯函数（整文件保留） |
| `src/lib/providerModelIds.ts` | 供应商模型读写工具（整文件保留） |
| `src/utils/providerModelUtils.ts` | 模型徽章提取 / 快捷切换工具（整文件保留） |
| `src/components/providers/ModelQuickSwitch/` | 模型快捷切换弹窗组件（整目录保留） |
| `src/components/providers/forms/shared/SearchableModelPicker.tsx` / `SearchableModelMultiPicker.tsx` | 可搜索模型选择器（从上游移植后的 fork 版，整文件保留） |
| `tests/components/SearchableModelPickerScroll.test.tsx` / `SearchableModelMultiPicker.test.tsx` | 模型选择器测试（整文件保留） |
| `src/components/providers/forms/ProviderImportEntry.tsx` | 从其他已启用应用导入供应商配置的入口（整文件保留） |
| `src/components/providers/forms/hooks/useProviderImportApply.ts` / `useProviderImportSources.ts` | 跨应用导入的来源判定与写入 hooks（整文件保留） |
| `src/utils/providerImport.ts` / `providerCredentials.ts` / `piProviderConfig.ts` | 跨应用导入的字段映射、凭据与 Pi 配置转换（整文件保留） |
| `tests/components/ProviderImportEntry.test.tsx` / `ProviderForm.crossAppImport.test.tsx` / `tests/utils/providerImport.test.ts` | 跨应用导入测试（整文件保留） |
| `tests/components/ConnectivityTestDialog.test.tsx` 等连通性测试 | `tests/components/connectivityEntry.test.ts`、`tests/hooks/useConnectivityProbe.test.ts`、`tests/hooks/useConnectivityTest.test.ts`、`tests/lib/connectivityTestSettings.test.ts`（整文件保留） |
| `tests/lib/providerModelIds.test.ts` / `src/utils/providerModelUtils.test.ts` | 模型工具测试（整文件保留；后者的测试与被测文件同目录，不在 `tests/` 下） |
| `tests/components/ProviderCard.websiteLinks.test.tsx` / `tests/lib/providerSchema.websiteUrl2.test.ts` | 双官网链接测试（整文件保留） |
| `tests/components/AppsPage.test.tsx` | **只改一条用例**：`describe("AppsPage concurrent CLI upgrades")` 里的 `keeps a tool locked through version refresh and remount with an expired cache`。上游原文在 `await renderApps()` 之后直接装 `getToolVersions.mockImplementationOnce(...)` 再同步 `updateButton(...)`，而 `renderApps()` 只等页头文字、不等工具行的安装/版本探测落定，GitHub runner 上「更新」按钮还没渲染就取按钮 → `TestingLibraryElementError`（fork CI 与上游 CI 同一条用例同时红，本地跑不出来）。fork 的改法：装 `mockImplementationOnce` 之前、remount 之后各加一次 `await waitFor(() => expect(updateButton("Claude Code")).toBeInTheDocument())`，并把 remount 后对按钮 `toBeDisabled` / `aria-busy` / Codex `toBeEnabled` 的三条同步读取包进一个 `waitFor`；断言一条不删。**下一轮同步**：该文件其余 50 条用例直接取上游，这一条按本行重新套用等待顺序，不要整文件取上游把 fork 的稳定化丢掉，也不要把它当成同步丢语义 |
| `.github/workflows/ci.yml` / `release.yml` | fork 裁剪版 CI：仅构建 Windows x64 与 macOS arm64 unsigned（整文件保留） |
| `src-tauri/capabilities/default.json` | fork 移除 `updater:default` 权限（保留 fork 版） |
| `README.md` | fork 重写版（记录 fork 差异与构建说明，整文件保留；README_ZH/DE/JA 为共享文件按 §3.2 处理） |
| `CHANGELOG.md` | fork 更新日志（仅在 fork 侧确有改动时整文件保留；v4.0.4 同步实测 fork 在同步区间未改过该文件，直接取上游版本落地） |
| `.comet/config.yaml` | Comet 工作流配置（整文件保留） |
| `docs/superpowers/` | Superpowers 计划/报告产物（整目录保留） |
| `docs/openspec/` | OpenSpec change 产物目录（整目录保留，由协调者管理） |
| `docs/HOW_TO_REBASE_UPSTREAM.md` | 本文件本身（整文件保留） |
| `.gitignore` 的 fork 工具产物段 | 文件末尾 `# >>> Fork: Comet/Superpowers 工具产物 ...` 段（保留，不丢忽略规则） |

共享文件中的 fork 专属语义（冲突时取上游版本后必须叠加回这些改动，见 §3.2）：

| 文件 | fork 专属语义 |
| --- | --- |
| `src-tauri/src/lib.rs` | 托盘左键单击切换主窗口显示/隐藏（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）；移除 Updater 插件注册段（fork 关闭自动更新的后端部分，v4.0.2 起随 8217f0b3 重放保留）。v4.0.4 起上游新增 macOS 重启链路（`restart_process` / `relaunch_macos_bundle`，经 LaunchServices `open -n` 回到前台）：以上游为基础，fork 的更新器移除段保持不存在即可，勿因重放复活。v4.0.5 起上游又在本文件加了 all-time 热力图命令注册、Wayland 标题栏/托盘重显链路与 WSL 夜间测试标记：以上游为准，fork 的「无 updater 插件注册 + 左键切换 + connectivity_test 命令注册」三段语义照常叠加，任何一次重放都要确认 `tauri_plugin_updater` 没有被带回。v4.0.6 起上游在本文件只加了一行 `codex_forces_multi_agent_v2` 命令注册：取上游，fork 三段语义照常叠加。v4.0.7 起上游加 `mod codex_rollout_file`、三个 Codex 会话压缩命令注册（`get/set_codex_session_compression`、`get_codex_sessions_disk_usage`）与 `acknowledge_codex_stale_clients` 注册（共 +5）：取上游，fork 三段语义照常叠加。v4.0.8 起上游又加一行 `commands::reveal_app_log_file` 注册（诊断日志「打开日志」按钮的后端命令）：取上游，fork 三段语义照常叠加；v4.0.9 起上游在本文件加了 `commands::get_proxy_client_host` 与 `commands::set_proxy_client_host` 两行注册（本地路由客户端地址）：取上游，fork 三段语义照常叠加，解完仍须 grep `tauri_plugin_updater` 为 0；v4.0.10 起上游重写深链接链路——`handle_deeplink_url` 不再直接 emit `deeplink-import` / `deeplink-error`，改为把结果写进 `crate::deeplink::PendingDeepLink` 并 `set_pending_deeplink` 后 emit `deeplink-pending`（前端未挂载时冷启动不再丢链接），同时删掉 `RunEvent::Opened` 分支（改由 deep-link 插件的 `on_open_url` 处理，重复处理会让同一条链接触发两次导入），并在统一迁移之前调用把已退役 `cc-switch-official` 桶迁回 openai 的逻辑：以上游形态为基础，fork 三段语义照常叠加。v4.0.10 轮实测 macOS 的 Reopen 分支必冲突（fork 侧是 `match event { RunEvent::Reopen { .. } => { tray::show_main_window(app_handle); } … }`，上游把 `match` 改成 `if let RunEvent::Reopen { .. } = event { … }` 并保留内联的窗口恢复 + `apply_tray_policy` + 轻量模式退出）：解法是取上游的 `if let` 结构与三行注释，body 用 fork 的 `tray::show_main_window(app_handle)`（该 helper 已含窗口恢复、`apply_tray_policy` 与轻量模式退出，是上游内联体的超集），注意 `match` 换 `if let` 后收尾花括号少一层，按行拼接容易多删一个 `}` |
| `src-tauri/src/commands/settings.rs` | fork：`restart_app` 的注释口径（保留代理状态、旧实例同步恢复 Live）随上游改动保留；v4.0.4 起该文件重启改走 `crate::restart_process(&app)`（替代 `app.restart()`），fork 无额外语义，按上游落地。v4.0.6 起上游在本文件加了 `codex_stack_classic_subagents` 开关的落库与失败回滚（+28 行）：取上游改动，同时保留 fork 移除的 `install_update_and_restart` 下载安装实现（命令接口留空壳，`tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构一并不复活）——本文件是「取上游侧易带回 updater」的高危点，解完必须 grep `updater_builder`。v4.0.7 起上游又在本文件加了 Codex 会话压缩三个命令（`get/set_codex_session_compression`、`get_codex_sessions_disk_usage`，+31 行，直接改 Codex `config.toml` 的 `[features]`）：取上游，fork 的 updater 移除语义照常保留；v4.0.9 起上游在本文件加了 `merge_settings_for_save` 的 `incoming.proxy_client_host = existing.proxy_client_host.clone()` 透传保护与单测 `save_settings_should_keep_the_existing_proxy_client_host`（+15 行）：取上游，fork 的 updater 移除语义照常保留；该单测在 `cargo test` 必须通过；v4.0.10 起上游在本文件只往两处测试的 `LocalMigrations` 字面量补 `..LocalMigrations::default()`（+2 行，配合下面 settings.rs 的新字段）：取上游，fork 的 updater 移除语义照常保留 |
| `src-tauri/src/settings.rs` | fork：`VisibleSidebarPanels` 结构 + `AppSettings.visible_sidebar_panels`（上游 v4.0.2 新增 `whats_new_seen_version` 与之共存，合并两段）。v4.0.4 起上游把 `show_profile_switcher` 改为 `#[serde(default)]` 且默认 `false`（`default_show_profile_switcher` 已删）：取上游默认值，fork 的 `visible_sidebar_panels` 字段段保持不动。v4.0.6 起上游新增两个设置字段（`show_provider_search` 默认 true、`codex_stack_classic_subagents` 默认 false）与 `codex_stack_classic_subagents()` 访问器：取上游，fork 的 `VisibleSidebarPanels` 字段段不动。v4.0.7 起上游新增 `quota_display`（`"left"`/`"used"`，缺省剩余）、`Default` 一行、`quota_shows_used()` 访问器与 normalize 过滤段（+17 行）：取上游，fork 的 `VisibleSidebarPanels` 字段段与 v4.0.6 两个字段不动；v4.0.9 起上游在本文件加了 `AppSettings.proxy_client_host` 字段、`Default` 中的 `proxy_client_host: None` 与 `get_proxy_client_host()`/`set_proxy_client_host()` 两个函数（+23 行）：取上游，fork 的 `VisibleSidebarPanels` 字段段不动，两段必须并存，不得整文件取一侧；v4.0.10 起上游在本文件加了 `LocalMigrations` 的新字段与 `CodexOfficialHistoryUnifyMigration` 相关结构、`clear_codex_official_history_unify_migration()` 等读写函数（+36 行，配合把已退役 `cc-switch-official` 桶迁回 openai）：取上游新增，fork 的 `VisibleSidebarPanels` 字段段与 `proxy_client_host` 等既有上游字段全部不动，解完确认两段字段同时存在 |
| `src-tauri/src/database/schema.rs` | fork：`website_url_2` 列（providers 建表 + `migrate_v18_to_v19` + `add_column_if_missing` 兜底）。v4.0.2 起上游 SCHEMA_VERSION=20（v19→v20 为 `mcp_servers.enabled_pi`）：合并时 v18→v19 同时保留上游 mcode 迁移与 fork website_url_2，v19→v20 取上游，`SCHEMA_VERSION` 取上游值。v4.0.2 同步的 v19 双语义合并留下历史缺口（旧 fork 构建已升到 v19 的库跳过捆绑步骤、缺 `enabled_mcode`），fork 已加 v20→v21 修复迁移幂等补齐 `mcp_servers.enabled_mcode/enabled_pi` 与 `skills.enabled_mcode`（当前 SCHEMA_VERSION=21）：后续上游若再推进 schema，fork 的 v21 步骤必须原样保留，新步骤接在 v21 之后。v4.0.7 起上游在本文件只往定价种子表加 Claude Sonnet 5.5 与 Haiku 5.5 两行（+20 行，SCHEMA_VERSION 仍为 20、迁移链未动）：取上游两行定价，fork 的 `website_url_2` 列与迁移段不动 |
| `src-tauri/src/database/tests.rs` | fork：v20→v21 修复迁移测试与 `website_url_2` 相关测试段。v4.0.7 起上游在本文件加了 `model_pricing_seed_includes_claude_sonnet_5_5_and_haiku_5_5`（+38 行）：取上游用例，fork 既有测试段不动。注意 fork 历史提交 `4b437070` 曾在该文件 blob 内留下未清理冲突标记（靠后续 fork 提交清掉），最终态必须零冲突标记 |
| `src-tauri/src/database/dao/providers.rs` | fork：`get_providers` / `get_provider` 两条 SELECT 的列清单含 `website_url_2`，`row.get(N)` 索引整体后移一位，`Provider` 构造多一个字段。v4.0.6 起上游在本文件加了 `unbind_codex_managed_accounts`（+86 行，删除托管账号时解除 Codex 供应商绑定）：上游新方法不触碰这两条查询，预期 git 自动合并；若冲突，按「上游新方法 + fork 列索引后移」手工叠加，切勿整文件取上游侧把索引改回去 |
| `src-tauri/src/database/mod.rs` | fork：移除 `cleanup_old_stream_check_logs` 启动清理调用（旧 stream_check 链路已删）；`SCHEMA_VERSION` 常量随 fork 修复迁移演进（当前 21，含 fork 专属 v20→v21 修复步骤；上游再推进时取「上游新版本与 fork v21 的较大者」并叠加双方迁移步骤）。v4.0.10 起上游在本文件加一行 `pub use dao::custom_icons::{CustomIconEntry, CUSTOM_ICONS_KEY};`（「我的图标」库以 JSON 数组存 settings 表 `custom_icons` 键，上游 `SCHEMA_VERSION` 仍为 20、没有新迁移）：取上游，fork 的 `SCHEMA_VERSION = 21` 与移除的 `cleanup_old_stream_check_logs` 启动清理调用照常保留，`stream_check` 只允许剩 `database/schema.rs` 里的建表与索引 |
| `src-tauri/src/database/dao/mod.rs` | fork：移除 `pub mod stream_check;`。v4.0.10 起上游加 `pub mod custom_icons;`（+1 行）：取上游，fork 的删除保持 |
| `src-tauri/src/database/backup.rs` | fork：移除 `stream_check*` 的备份/清理分支。v4.0.10 起上游在导入 staging 阶段（`apply_schema_migrations_on_conn` 之后、`on_staging_ready()` 之前）调用 `crate::services::provider::icon::strip_invalid_custom_icons(&temp_conn)?`，并新增用例 `import_clears_custom_icons_that_fail_validation`（+61 行：别人给的 SQL 备份 / 云端快照里坏掉的自定义图标在导入时清掉）：取上游新增，fork 移除的 `stream_check` 分支不得复活，本文件是「取上游侧易带回 stream_check」的高危点 |
| `src-tauri/src/commands/mod.rs` | fork：新增 `mod connectivity_test;` / `pub use connectivity_test::*;`，删除 `mod stream_check;` / `pub use stream_check::*;`。v4.0.10 起上游加 `mod custom_icon;` / `pub use custom_icon::*;`（+2 行，自定义图标上传命令）：两侧模块声明取并集，`stream_check` 保持删除状态 |
| `src-tauri/src/deeplink/provider.rs` | fork：`build_provider_from_request` 里一行 `website_url_2: None`。v4.0.10 起上游近乎重写本文件（+384/−110：链接可声明 API 格式、可导入 Pi 供应商、激活交给用户、`iconUrl` 自带图标，并拆出 `deeplink/{codex_link,grok_link,icon_fetch}.rs`）：取上游重写形态，解完必须确认 fork 那一行仍在（缺字段会让结构体字面量编译失败） |
| `src/components/providers/forms/BasicFormFields.tsx` | fork：双官网链接字段段（`websiteUrl2` 输入与说明文案，约 +46/−21）。v4.0.10 起上游把图标弹窗改成「点选即选中并关闭」（删 `DialogClose` + `common.done` 的 footer 块、新增 `setIconDialogOpen(false)`）并给 `CustomIconNameDialog` 传 `defaultName={form.watch("name") ?? ""}`：取上游形态，fork 的双链接字段段保留；两处区域不同、预期自动合并，但必须复核 fork 字段段没被上游删 footer 时连带去掉 |
| `src/components/settings/AboutSection.tsx` | 「检查更新」/发行说明指向 fork GitHub Releases（tunecc/cc-switch），禁用应用内更新器；v4.0.1 上游已删 RoutingActivationBrand（左上角品牌链接组件不再存在，无需叠加）。v4.0.2 起该文件含上游 whats-new 摘要入口（WhatsNewDialog + recentEntries + Sparkles 按钮），v4.0.4 起上游又把邀 Star 从行内 `<a>` 改为独立可关闭条（`Star`/`X` 图标 + `settings.starOnGithub` 键 + localStorage `ccswitch:about:starPromptDismissed`）：两者都按共享文件保留，只叠加 fork 的更新器改动（移除 isDownloading/installUpdateAndRestart/checkUpdate/resetDismiss，链接改 tunecc）。v4.0.4 同步实测：重放 fork 的 `feat: disable in-app updater` 提交时该文件必冲突，解法是保留 HEAD 侧 whats-new 与 star 条、只删 `isDownloading`，并补回被 fork 侧抹掉的 `useMemo` 导入与 `WhatsNewDialog`、`WHATS_NEW_ENTRIES/entriesUpTo` 导入，同时删除因此不再使用的 `extractErrorMessage` 导入；其后重新加回 whats-new 的 fork 提交（原 c8c8461c）在新基线下成为空提交并被 git 丢弃，属预期，不算 fork 改动丢失 |
| `src/components/shell/Sidebar.tsx` | fork：全局面板项（MCP/Skills/会话/Prompts）按 `visibleSidebarPanels` 过滤。v4.0.6 起上游给 `NavItem` 加 `dotTone`（neutral/success）并让「设置」项用 success 绿点：取上游，fork 的面板过滤不动 |
| `src/components/settings/sections/GeneralSection.tsx` | fork：侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest）。v4.0.4 起上游把「显示项目切换器」开关默认值改为 `settings.showProfileSwitcher ?? false`：取上游，fork pill 行保留。v4.0.6 起上游在同一张卡片里加了「显示供应商搜索」开关行（+11 行）：解法是「上游开关行 + fork `SidebarPanelPillRow`」并存，不要把整段取成单侧。v4.0.7 起上游又在「外观」里加了「额度显示」（剩余/已用）开关行（+27 行）：解法是上游额度显示行 + v4.0.6 搜索行 + fork pill 行三段并存 |
| `src/App.tsx` | fork：批量连通性探针状态提升（useConnectivityProbe）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、托盘同款 window-title 守卫。v4.0.4 起上游把主页面 ProfileSwitcher 门控改为 `settingsData?.showProfileSwitcher ?? false`：取上游默认值，fork 三段语义不动。v4.0.6 起上游在页头加了供应商搜索按钮（`showProviderSearch` 门控 + `Search` 图标，lucide 导入块随之改写）：解法是「上游搜索按钮块 + fork 批量检测按钮块」两个完整 JSX 块并存，lucide 导入取两边并集（上游 5 个 + fork 的 `Activity`/`Loader2`）。注意：用「按行去重」的方式合导入块会吃掉重复的 `<Button`/`}` 行而破坏 JSX 结构，必须整块拼接后再核对括号平衡。v4.0.7 起上游加 `appConfigScrollTarget` state、`openSettings(section, appConfigTarget)` 两参数化、`appConfig` 菜单项传 `activeApp`、`SettingsPage` 新 prop 与 `onSelectSettingsSection` 清空 target（+17 行）：取上游，fork 三段语义不动 |
| `src/components/settings/SettingsPage.tsx` | fork：`IS_FORK_BUILD`/`DEV_PANEL_ENABLED` 守卫下的 DevPanel 入口（about 分组末尾的 Fork 按钮）与 `<DevPanel>` 挂载。v4.0.7 起上游加 `appConfigScrollTarget` prop 与「滚动定位 + 两次描边闪烁」effect（+130 行，含 `isTextEditableTarget` 导入与 `hasSettings` 常量）：取上游 effect，fork 的 DevPanel 两段不动。v4.0.8 起上游又在诊断日志区加「打开日志」按钮（`FolderOpen` lucide 导入、`handleRevealLogFile` useCallback、`SettingsRow` 的 `actions` prop，+24 行）：取上游按钮，fork 的 DevPanel 两段仍不动，两侧 JSX 整块拼接 |
| `src/components/providers/forms/McodeProviderForm.tsx` | fork：跨应用导入接线（`ProviderImportEntry` 导入、`useProviderImportApply`/`useProviderImportSources`、`importSources`/`handleProviderImport`/`importEntry` 与预设选择器 `extraActions` 插槽、编辑模式的独立渲染块、`useCallback` 导入）。v4.0.7 起上游把额外选项的内联合并逻辑改为 `mergeOpencodeExtraOptionRows(options, draft)`（`isKnownOpencodeOptionKey` 与 `OPENCODE_EXTRA_OPTION_DRAFT_PREFIX` 两个导入被删，#7841）：解法是保留上游的新 helper 调用，同时保留 fork 的导入块与接线块，两边导入块取并集 |
| `src/config/piProviderPresets.ts` | fork：预设接口的 `hidden?: boolean` 字段段。v4.0.7 起上游把「火山Agentplan」拆成「火山 Agent Plan」（`/api/plan/v3`）与「火山 Coding Plan」（`/api/coding/v3`，`partnerPromotionKey` 改 `volcengine_codingplan`，#8044）：取上游预设改写，fork 的 `hidden` 字段与过滤判定照常生效（上游预设是否可见由 fork 白名单决定，不要手工放开） |
| `src-tauri/src/services/mod.rs` | fork：既有模块声明段。v4.0.7 起上游加 `pub mod codex_session_compression;`（+1 行）：取上游，fork 模块声明不动 |
| `src/components/providers/ProviderCardActions.tsx` | fork：右键菜单「模型」快捷切换入口（上游 v4 删除 ProviderActions 后的移植位置） |
| `src/components/providers/ProviderCard.tsx` | fork：模型徽章（extractModelBadgeForProvider）、ConnectivityBadge 探针徽标、双官网链接横排、右键菜单挂载。v4.0.6 起上游把 `extractApiUrl` 的内联实现替换为 `extractProviderBaseUrl(provider.settingsConfig) ?? fallbackText`（并删掉 `extractCodexBaseUrl` 导入）：取上游重构，fork 的徽章/双链接/右键菜单照常叠加 |
| `src/components/providers/ProviderList.tsx` | fork：右键一键置顶/置底（applyQuickSort + updateTrayMenu 刷新）、ConnectivityTestDialog、批量探针徽标接线、websiteUrl2 搜索。v4.0.6 起上游重写搜索为 `searchIndex`（名称/备注/官网/请求地址，请求地址走 `extractProviderBaseUrl`）并新增 `searchOpen`/`onSearchOpenChange` 受控 props（+166 行）：解法是取上游的 `searchIndex` 实现，再把 fork 的 `provider.websiteUrl2` 加回 text 字段数组，props 取两边并集（上游受控搜索 + fork `probeResults`）——这是「上游结构更优但不能丢 fork 字段」的典型点 |
| `src/lib/query/mutations.ts` | fork：新增供应商默认插入第二位（sortIndex 让位重写） |
| `src/components/providers/forms/ProviderForm.tsx` | fork：跨应用导入接线（ProviderImportEntry + useProviderImportApply，编辑/新建两条同步路径） |
| `src/components/providers/forms/ProviderPresetSelector.tsx` | fork：`extraActions` 插槽（跨应用导入入口行，v4 两步外壳的外层渲染） |
| `src/components/providers/forms/ClaudeFormFields.tsx` | fork：兜底模型直达区（fallbackQuickAccessSection，仅经典布局渲染）、API 格式选择器随端点输入框、1M 全选。v4.0.8 起上游在本文件让取模型列表带上供应商的本地代理 Header 覆盖（新增 `modelFetchRequestHeaders` 导入、`handleFetchModels` 传 `{requestHeaders: ...}`、`localProxyHeadersOverride` 进依赖数组，+22/−2 行）：取上游改动，fork 的兜底直达区、`hasCustomModelMapping` 与 `SearchableModelPicker`（对 `ModelDropdown` 的替换）照常叠加，两边导入块取并集；v4.0.9 起上游在本文件把说明改回 HelpTip 并把「完整 URL」开关移出（`EndpointField` 改 `help` 形态、新增 `directModeFormatNotice` prop 与 `FullUrlToggle`）：以上游形态为基础，fork 的兜底模型直达区（仅经典布局渲染，行内含 1M 勾选与获取/一键设置按钮）、`hasCustomModelMapping`、`SearchableModelPicker`、API 格式选择器（经 `rightSlot`）全部保留；上游高级选项里的 `apiFormatField` 整段与兜底模型整段由 fork 的位置取代，其 `apiFormatHelp`/`fallbackModelHelp*`/`fallbackModelMissing`/`fallbackModelHaikuMissing` 文案改在 fork 的位置渲染，不得因取上游而丢 HelpTip 与告警 |
| `src/components/providers/forms/GrokBuildProviderForm.tsx` | fork：跨应用导入接线（grokbuild config.toml 路径）、双官网链接与官方预设过滤接线。v4.0.9 起上游把 `inactiveFieldsHint` 的 `count` 参数去掉（+1/−2）：取上游文案，fork 的跨应用导入、双官网链接与预设过滤三段接线保留 |
| `src/config/forkOfficialAllowlist.ts` | 上游 v4 新增 mcode 应用后补 `mcode: []` 空白名单。v4.0.12 起按用户决定收录上游 `category: "local"` 的本机推理预设：claude / claude-desktop / codex / hermes 各加 `Ollama`、`LM Studio`、`llama.cpp`、`vLLM`，openclaw 加 `LM Studio`、`llama.cpp`、`vLLM`，opencode 加 `Ollama`、`llama.cpp`、`vLLM`，pi 加 `Ollama`、`LM Studio`、`vLLM`；gemini / grokbuild / mcode 不变。条目名必须与上游该 app 里同分类预设的 `name` 逐字一致（拼写不符会让条目静默消失），赞助商、聚合站与第三方云预设继续默认拒绝，`forkPresetFilter.ts` 的判定实现不改 |
| `src/contexts/UpdateContext.tsx` | 取消启动自检（fork 关闭自动更新） |
| `src/lib/updater.ts` | 恒返回 up-to-date（fork 关闭自动更新） |
| `src/config/*ProviderPresets.ts` ×8 | 预设接口的 `hidden?: boolean` 字段与官方预设过滤接线 v4.0.9 起上游往这 8 个文件批量加了 SoruxGPT/IKunCode/RunToken/OpenModel/BotCF/YYLX/TokenFlux 等赞助商预设（各 +84..+372，纯新增）：取上游预设条目，fork 的 `hidden` 字段与过滤判定照常生效；这些新预设在 fork 构建下由 `forkOfficialAllowlist` 默认拒绝，不要为「让它们显示」而改白名单；v4.0.10 起上游往这 8 个文件加 NekoCode 预设（`openclaw` +58、`opencode` +46、`hermes` +38、`pi` +26、`claudeDesktop` +17、`codex` +15、`gemini`/`grokBuild` 各 +2，含版本号行）、把 OpenModel 注册链接改指 `?ref=cc-switch` 推荐地址、把 YYLX 中文名改「鱼鱼连线」：同样取上游预设条目，fork 的 `hidden` 字段与过滤判定照常生效 |
| `src/lib/schemas/provider.ts` | `websiteUrl2` 第二官网链接字段 |
| `src-tauri/src/commands/misc.rs` 等后端共享文件 | 连通性测试命令注册（`src-tauri/src/lib.rs` 的 `commands::connectivity_test_provider_models`，实体在 `src-tauri/src/services/connectivity_test/`，独立 reqwest+SSE 直连执行器，不经 proxy 转发链）。v4.0.5 起上游在本文件加入 Claude Code npm 安装的 native setup（c5233fe7，#7929）：取上游改动，fork 的命令注册与 sanitize 由 git 自动合并，无额外取舍。v4.0.6 起上游在本文件让 npm 安装的 Claude Code 升级路径也允许安装脚本运行（889b797d，#7099，+187 行）：取上游，fork 语义不变。v4.0.7 起上游让生成的批处理文件不含非 ASCII 路径（e06ba573，+112 行，升级脚本自带 UTF-8 代码页切换、「打开终端」不切代码页改为不写路径）：取上游，fork 语义不变 |
| `src-tauri/src/tray.rs` | fork：`toggle_main_window` 与左键单击切换分支（约 32 行）。v4.0.5 起上游在本文件改了 Wayland 重显相关的托盘构建（36c8b87e，#7947）：两侧必须并存，此文件是 v4.0.5 轮最容易整文件取一侧而丢语义的点，解完冲突后逐行复核。v4.0.6 起上游把 `WARN_BELOW_PERCENT` 从 10.0 提到 20.0、删掉 `pick_lines`、`quota_title` 改为写全部额度档位（#8011：只留剩余最少两档时 5 小时档几乎总被挤掉）：取上游，fork 的 `toggle_main_window` 与左键分支不动。v4.0.7 起上游又让托盘应用行标题跟随 `quota_display`（剩余/已用，b7d548b6，#8024，+56 行）：取上游，fork 的左键切换分支不动；v4.0.9 起上游把 `collect_snapshots` 的端口取值从 `get_proxy_listen_sync()` 改为 `get_proxy_client_endpoint_sync()`（1 行，配合客户端地址）：取上游，fork 的左键切换分支不动 |
| `src-tauri/src/provider.rs`、`src-tauri/src/services/provider/mod.rs` | fork：`website_url_2` 字段（serde `websiteUrl2`、`UniversalProvider` 随行透传）与连通性测试相关接线。v4.0.5 起上游为 Copilot 托管账户扩展了 provider 字段与路由判定（f9db9f70，#7157）：以上游为基础，fork 的 `website_url_2` 字段与接线一行不能丢。v4.0.6 起上游又在本文件改了第三方目录自带模板、官方模型可见性（按本机实际最新版本拉取）与托管账号解绑接线（+249 行）：以上游为基础，fork 字段与接线照常叠加。v4.0.10 起上游在本文件加 `pub(crate) mod icon;`、在 `prepare_new_provider` / `add_without_switching` 等保存与同步路径调用 `icon::validate_icon(provider.icon.as_deref())?`，并新增用例 `universal_provider_icon_is_validated_on_save_and_sync`（+67/−7）：取上游，fork 在测试 `Provider` 字面量里的 4 处 `website_url_2: None` 必须仍在原位，否则 `cargo test` 编译失败 |
| `src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs` | fork：按供应商 API 格式对齐真实转发链路的转换接线，以及测试里 Provider 字面量的 `website_url_2: None`（连通性测试不走这条转发链，其实体是 `src-tauri/src/services/connectivity_test/` 的独立 reqwest+SSE 直连执行器，v4.0.6 起已确认这两个文件里没有 connectivity 引用）。v4.0.5 起上游把 `forwarder.rs` 近乎重写（f9db9f70，单文件 +1166 行）并删掉了自带的 `copilot_detection_via_*` / `copilot_detection_for_enterprise_endpoint` 测试，改用 `is_managed_copilot_request()` + 新的 `test_provider_with_type()` 构造助手：这类测试区冲突一律取上游侧（fork 在这些文件里从来只加 `website_url_2` 字段，没有自建测试），取完上游侧后要确认 `test_provider_with_type()` 里仍带 `website_url_2: None`，否则 `cargo test` 编译失败。v4.0.6 起上游又改了 Anthropic SSE 收尾（终止事件前关闭未闭合 content block，新增 `proxy/providers/streaming.rs`）、加密子 agent 任务流起始与第三方压缩保留工具定义（+441 行）：取上游，fork 的 sanitize 隔离与 `website_url_2: None` 照常叠加。v4.0.7 起上游让旧的第三方会话在官方供应商下继续时报错说明需新开会话（e049660a，+10 行）：取上游，fork 语义照常叠加；v4.0.9 起上游在本文件加了 OpenAI 格式 Claude 上游改发 `Bearer` 并合并 stack 切换的转换逻辑（+60 行，未新增测试用 `Provider` 字面量）：取上游，fork 的两处 `website_url_2: None` 仍在原位置，预期 git 自动合并 |
| `src/types.ts` | fork：`websiteUrl2`、`VisibleSidebarPanels` 等类型段。v4.0.5 起上游新增 Copilot/用量相关类型：两段并存。v4.0.6 起上游又加 `showProviderSearch`、`codexStackClassicSubagents`、`dotTone` 等类型：继续两段并存。v4.0.7 起上游加 `quotaDisplay?: "left" | "used"`（+2 行）：继续两段并存 |
| `src/components/providers/EditProviderDialog.tsx` 与 `tests/components/EditProviderDialog.test.tsx` | fork：编辑弹窗的 fork 接线与 47 行 fork 用例。v4.0.9 起上游把编辑弹窗的 `isOpen` 改为 `open && !waitingForEditorView`（首次投影就绪前保持列表可见，消掉 loading 闪屏，#8145）并新增 43 行用例：取上游门控与用例，fork 的两处 `websiteUrl2` 读写与 47 行 fork 用例叠加回；v4.0.10 起上游给两个弹窗各加一行 `motionPreset="none"`（添加/编辑页取消淡入，#8159），`AddProviderDialog.test.tsx` 另加 103 行上游用例（自定义图标 / 深链接入口）：取上游新增，fork 的 `websiteUrl2` 读写、跨应用导入接线与 fork 用例（含 claude 用例的 `await findByRole` 修复）叠加回 |
| `src/config/codexProviderPresets.ts` | fork：预设接口的 `hidden?: boolean` 与官方预设过滤接线。v4.0.5 起上游给 MoArk 预设补了模型目录与原生 Responses 格式（3af55c39，#7940）：取上游预设内容，fork 的 `hidden` 字段与过滤判定照常生效（上游新增预设是否可见由 fork 白名单决定，不要手工放开）。v4.0.6 起上游在本文件只删了 1 行：fork 的 `hidden` 字段与过滤判定照常生效 |
| `src/components/providers/forms/ProviderForm.tsx` | fork：跨应用导入接线（ProviderImportEntry + useProviderImportApply，编辑/新建两条同步路径）。v4.0.5 起上游在本文件接入 Copilot 托管账户表单路由（+87 行）：取上游骨架，fork 的导入接线与 `ProviderPresetSelector.extraActions` 插槽保留。v4.0.6 起上游在本文件又改了搜索接线与 Copilot 相关调整（+99 行）：取上游，fork 导入接线与插槽保留；v4.0.9 起上游在本文件加了 `DirectModeFormatNotice` 导入、按实际应用模式计算的 `directModeFormatNotice`、Codex sub-agent 的 `subagentModel`/`subagentReasoningEffort` state 与 props 接线（+21 行）：取上游，fork 的导入接线与 `extraActions` 插槽保留 |
| `pnpm-lock.yaml`、`src-tauri/Cargo.lock` | 锁文件冲突只针对 fork 专属条目取 fork 侧（`@tauri-apps/plugin-updater` 的 specifier / resolution / snapshot 三段，`cc-switch` 包版本号），其余上游依赖变动一律接收，不要整文件取一侧。收尾用 `pnpm install` 与 `cargo check` 复验：两者都报告锁文件未被改写，才算与 `package.json` / `Cargo.toml` 一致；v4.0.9 上游只把四处版本号各改一行（`pnpm-lock.yaml` v4.0.9 轮未被上游改动，无 fork 保留段取舍），fork 侧版本号取 `4.0.9-1`；v4.0.10 起上游 `Cargo.toml` 新增 `png = "0.18"`（校验自定义图标，tauri 经 image 已依赖同一版本）并给 `tokio` 加 `net` feature，`Cargo.lock` 随之新增条目、`cc-switch` 包版本号行改为 `4.0.10`：依赖新增一律取上游，只把版本号行取 fork 的 `4.0.10-1`，并确认 fork 移除的 `tauri-plugin-updater` 条目没有因锁文件重算被带回；`pnpm-lock.yaml` v4.0.10 轮上游未改（`package.json` 只有版本号一行） |
| `src/components/providers/forms/shared/EndpointField.tsx` | fork：`rightSlot?: ReactNode` props 与「`Input` + `rightSlot` 的 `flex flex-wrap items-center gap-2` 包裹层（`Input` 带 `min-w-0 flex-1`）」，把 API 格式选择器贴在端点输入框右侧。v4.0.9 起上游删除 `showFullUrlToggle`/`isFullUrl`/`onFullUrlChange`/`fullUrlHint` 四个 props 与内联开关（改由 `shared/FullUrlToggle.tsx` 承载）、把 `effectiveHint` 简化为直接渲染 `hint` 并新增 `help`（字段名后的 `HelpTip`）：解法是「上游 `help` 形态 + fork `rightSlot` 包裹层」并存，导入取并集（`HelpTip`/`Zap`/`ReactNode`），`Switch`/`Link2` 随上游删除 |
| `src/components/providers/forms/shared/index.ts` | fork：`SearchableModelPicker` / `SearchableModelMultiPicker` 导出。v4.0.9 起上游加 `DirectModeFormatWarning`、`FullUrlToggle` 两个值导出与 `DirectModeFormatNotice` 类型导出：取并集，两侧导出都不许丢 |
| `src/components/providers/forms/ClaudeDesktopProviderForm.tsx` | fork：跨应用导入接线、双官网链接字段与官方预设过滤接线。v4.0.9 起上游把模型模式说明改成平实语言（+4/−9）：取上游文案，fork 三段接线保留 |
| `src/components/providers/forms/PiProviderForm.tsx` | fork：跨应用导入接线、双官网链接与预设过滤。v4.0.9 起上游把取模型参数的调用形态由 `rowBaseUrl` 改为 `{ baseUrl: rowBaseUrl }`（+1/−1）：取上游，fork 接线保留 |
| `tests/components/{GrokBuildProviderForm,ProviderPresetSelector}.test.tsx` | fork：GrokBuild 20 行第二官网链接用例、预设选择器 33 行 `extraActions`/过滤用例。v4.0.9 起上游分别改了提示文案用例（+10/−8）与把 Claude 可见预设行数断言从 74 改为 81：取上游结构与断言，fork 用例叠加回；v4.0.10 起上游把该断言继续改为 82（NekoCode 预设）：取上游断言，fork 的 33 行 `extraActions`/过滤用例保留 |
| `tests/components/AddProviderDialog.test.tsx` | fork：两个 claude 用例的「common.add」按钮由同步 `getByRole` 改为 `await findByRole`（live 底到位后 step 从 pick 切 form 是第二次提交，CI 慢机器上 footer 晚一拍渲染，同步查找偶发 flaky，2026-10-06 CI 实测踩中）。上游 v4.0.3（a4d07f31）已内置等价 `findByRole` 修复：此后该文件冲突取上游版本，仅叠加回 fork 的两段 explanatory 注释 |
| `tests/components/DeepLinkImportDialog.test.tsx` | fork：把三处「开关初值」断言由同步 `expect(toggle).toBeChecked()` 改为 `await waitFor(() => expect(toggle).toBeChecked())`。v4.0.10 同步后 fork CI 实测：上游新增的 `the activate-after-import switch` 用例在 ubuntu runner 上偶发失败 2 条，`findByRole` 取到 switch 的那一帧仍是 `data-state="unchecked"`——组件初值由 `useState(false)` + `useEffect([request])` 写入，慢机器上会先渲染出 unchecked 的一帧（本地 `pnpm test:unit` 全绿、该文件连跑 10 次稳定）。只改测试断言，不动 `src/components/DeepLinkImportDialog.tsx` 的上游实现；上游若把这几行改成 `waitFor`，重放时直接取上游版本 |

### 4.1 v4.0.12 轮的叠加要点（2026-10-15 同步实测）

上游 `v4.0.10..v4.0.12`（67 个提交、128 个文件）与 fork 的重叠面 34 个文件，除上表已有条目外的新增口径：

- **预设 id 必须按原数组下标编号**（上游 `3069b556` 新契约）：`AddProviderDialog` / `useProviderCategory` 用 `id` 里的下标回查**原始**预设数组。`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx` 四处一律 `.map(编号)` → 再过滤 `hidden`（上游）→ 再按 `filterForkPresets` 的名称集合过滤（fork）。先过滤后编号会让被过滤项之后的预设全部错位（本机推理条目在原数组第 72..94 位，错位后选中即填错配置）。
- `src-tauri/src/lib.rs`：上游 `SESSION_SYNC_INTERVAL_SECS` 60 → `10 * 60`（页面打开时的加扫交给前端 `useUsageAutoRefresh`）与命令注册表新增 `commands::prepare_tool_uninstall`；fork 三段（无 Updater 插件、托盘左键切换、connectivity_test 注册）继续并存。
- `src-tauri/src/settings.rs`：上游语言白名单 `matches!(… , "en" | "zh" | "zh-TW" | "ja" | "tr")`；fork `VisibleSidebarPanels` 段不动。
- `src-tauri/src/tray.rs`：上游加土耳其语托盘文案与 `map_locale_to_tray_language` 分支（+77/−10）；fork `hide_main_window` / `toggle_main_window` 两个 helper 并存，本文件是本轮最容易整文件取一侧的点。
- `src-tauri/src/commands/misc.rs`：上游 Windows CLI 生命周期恢复用户 PATH、`run_windows_tool_command_capture` 与 mise/node 搜索路径改造（+375/−68）；fork 只有 `check_for_updates` 跳 `https://github.com/tunecc/cc-switch/releases` 一行，不得整文件取上游。
- `src-tauri/src/proxy/forwarder.rs`：上游 `proxy_url_for(&url)` / `get_for_url(&url)`（上游是本机地址时直连）；fork 的 `parse_custom_user_agent` 注释与测试字面量 `website_url_2: None` 保留。
- `src/lib/api/settings.ts`：上游 `runToolLifecycleAction` 增加 `"uninstall"` 与 `uninstallPlan` 参数、新增 `prepareToolUninstall`、`getToolVersions` 返回加 `update_blocked_by_node`；fork 删除的 `installUpdateAndRestart` 仍不得复活。
- `src/components/providers/ProviderList.tsx`：上游新增 `searchSlot`（搜索框位置由页头挂载，`null` 时先不画）、`focusSearch`（打开时滚回视口并选中）与「搜索框放在列表上方第一行最右端，不遮挡卡片、打开时卡片不下移」（+115/−85）；fork 右键置顶/置底、模型徽章、批量探针徽标、`websiteUrl2` 搜索全部保留。每行溢出菜单的**卸载入口在应用页 `AppsPage.tsx`**，不要记到本文件。
- `src/types.ts`：上游 `ProviderCategory` 加 `"local"`、`Settings.language` 加 `"tr"`、`OpenClawModel.compat` 加 `supportsTools` / `toolSchemaProfile`；fork `websiteUrl2`、`VisibleSidebarPanels` 段并存。
- `src/App.tsx`：上游「再点当前页不离开」守卫（`if (currentViewRef.current === page) return;`）；`GeneralSection.tsx` 的 `LANGUAGES` 加 `tr` 选项；`UniversalProviderFormModal.tsx` 的 `useEffect` → `useLayoutEffect`。
- `src/config/*ProviderPresets.ts`：上游批量新增本机推理 Local 分组与十余个云/赞助商预设，并对 `claudeDesktopProviderPresets.ts` 自带 `hidden?: boolean`。**三方合并会在同一 interface 里留下 fork 与上游两份 `hidden?: boolean`**（本轮实测 `TS2300: Duplicate identifier 'hidden'`），合并后必须删掉 fork 侧重复声明；同理 `codexProviderPresets.ts` 的 fork 追加行会因上游已有同名声明而被 git 判为冗余提交内容（重放后该提交的改动文件数从 8 变 7，属正常）。
- `src/i18n/locales/**`：上游 4 个 locale 各 +36/−11（工具卸载键组 `toolUninstall*` / `manualUninstall*`、`settings.languageOptionTurkish`、隐藏应用说明、ClaudeAPI/code0 文案删除）；新增 `tr.json`（4109 键）**保持与上游逐字节一致、不补 fork 键**，土耳其语下 fork 专属文案由 `fallbackLng: "en"` 回退英文。4 个既有 locale 的重复键查重照旧必做（本轮实测 dup=0）。
- 版本与锁文件：上游本轮对 `package.json` / `Cargo.toml` / `tauri.conf.json` / `Cargo.lock` 的改动**只有版本号行**，无新增依赖；`Cargo.lock` 终态只允许 `cc-switch` 条目版本号一行差异（`cargo check` 复验）。

说明：

- 这些文件 rebase 冲突时按第 3.1 节保留 fork 侧。
- 上游 v4.0 删除的组件（`ProviderActions.tsx`、`RoutingActivationBrand.tsx`、`AppVisibilitySettings.tsx`、`SkillStorageLocationSettings.tsx` 等）：fork 的对应改动按第 3.2 节移植到新位置（ProviderCardActions / AboutSection / GeneralSection），不要按白名单复活旧文件。
- `.gitignore` 整体不是 fork 专属，但其末尾的 fork 工具产物段需保留；其余 `.gitignore` 改动按共享文件处理。
- 白名单随 fork 魔改范围扩展而更新；新增 fork 专属文件时同步补充本表。
- 仅上游改动、fork 侧从未触碰的文件不进入上表，随上游直接落地即可。v4.0.8 轮这类文件包括 `src-tauri/src/codex_config.rs`、`src-tauri/src/commands/config.rs`、`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/{codex_direct,codex_official_models}.rs`、`src/components/providers/forms/{CodexFormFields,OpenCodeFormFields}.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`src/index.css`、`src/lib/api/model-fetch.ts`、`docs/design-system.html`、`CHANGELOG.md`、`docs/release-notes/v4.0.8-*` 与 `v4.0.7-*`、`src/whats-new/4.0.8.json`、`tests/components/{CodexFormFields,OpenCodeFormFields,SwitchModePanel}.test.tsx`、`tests/components/CodexFormFields.modelFetch.test.tsx`、`src/lib/api/model-fetch.test.ts`。v4.0.9 上游未改 `pnpm-lock.yaml`、`.github/workflows/*`、`src-tauri/capabilities/default.json`、`src/App.tsx`、`src/components/providers/ProviderCard.tsx`、`ProviderList.tsx`、`src/components/settings/AboutSection.tsx`、`src/components/settings/sections/GeneralSection.tsx` 与 `src-tauri/src/database/{mod,schema,tests}.rs`，故这些 fork 高频文件在 v4.0.9 轮无冲突，`SCHEMA_VERSION` 上游仍为 20、fork 保持 21。v4.0.9 轮这类仅上游改动的文件共 61 个，含 `src-tauri/Info.plist`（macOS 本地网络权限说明）、`src/i18n/index.ts` 与 `src/main.tsx`（冷启动应用已保存语言）、`src/lib/{api,query}/proxy.ts` 与 `src/components/settings/sections/RoutingSection.tsx`（客户端地址行）、`src/components/providers/forms/{CodexFormFields,CodexConfigSections,FetchedModelPicker,ClaudeStackModelsField}.tsx`、`forms/hooks/useCodexConfigState.ts`、`src/utils/providerConfigUtils.ts`、`src/hooks/useModelMetadataFill.ts`、`src/config/{claudeProviderPresets,presetSearchAliases}.ts`、`src/icons/extracted/*` 与 5 张赞助商图标、`CHANGELOG.md`、`README_{DE,JA,ZH}.md`、`flatpak/README.md`、`docs/user-manual/*/4-proxy/4.1-service.md`、`docs/release-notes/v4.0.9-*.md`、`src/whats-new/4.0.9.json` 与上游新增/改写的测试用例。v4.0.10 轮这类仅上游改动的文件共 99 个，含 `src-tauri/src/deeplink/mod.rs` 与新增的 `deeplink/{codex_link,grok_link,icon_fetch}.rs`、`src-tauri/src/commands/custom_icon.rs`、`src-tauri/src/database/dao/custom_icons.rs`、`src-tauri/src/services/provider/icon.rs`、`src-tauri/src/proxy/**`（含 haiku 别名升到 `claude-haiku-5-5`）、`src-tauri/src/services/usage*`（首 token 时间、Sub2API 模板、Novita/OpenRouter 空额度、Codex 线程模型）、`src/components/{usage,settings,icons}/**`、`src/components/CustomIconNameDialog.tsx`、`src/lib/{api,query}/customIcons.ts`、`src/utils/customIcon.ts`、`src/components/providers/forms/{ClaudeFormFields,CodexFormFields,ProviderForm}.tsx`（fork 自 v4.0.9 起未再改，随上游落地）、`CHANGELOG.md`、`README_{DE,JA,ZH}.md`、`docs/user-manual/**`、`docs/guides/deeplink-site-integration-guide-{zh,en,ja}.md`、`docs/release-notes/v4.0.10-*.md`、`src/whats-new/4.0.10.json` 与上游新增的图标/深链接/用量用例。v4.0.10 轮上游未改 `.github/workflows/*`、`pnpm-lock.yaml`、`src-tauri/capabilities/default.json`、`src-tauri/src/database/{schema,tests}.rs`，`SCHEMA_VERSION` 上游仍为 20、fork 保持 21；上游把「我的图标」写在 settings 表 `custom_icons` 键而非新表，因此该轮没有迁移链合并。v4.0.10 轮实测发生 5 次冲突（重放区间序号 #2 版本号提交、#43 README 重写提交、#62 connectivity_test 命令注册提交、#74 stream_check 移除提交的 `Cargo.lock`、#90 托盘左键提交的 `lib.rs`），其中 #62 由 rerere 复用上一轮记录的解法自动解决并直接提交、未在终端停车，复核后确认它的 patch 差异只是上下文位移（上游在同一带里加了 `mod custom_icon;` / `pub use custom_icon::*;` 与行号偏移，增删行集合完全相同）；其余 4 次为交互式停车，需人工判定。复用结果仍逐个复核过。v4.0.12 轮的重叠面 34 个文件、仅上游改动 94 个文件，该轮上游同样未改 `.github/workflows/*`、`pnpm-lock.yaml`、`src-tauri/capabilities/default.json`、`src-tauri/src/database/**`、`src-tauri/src/commands/{mod,settings}.rs` 与 `docs/guides/**`（新命令模块走 `commands/misc.rs:16-19` 的 `#[path]` 声明，`SCHEMA_VERSION` 上游仍为 20、fork 保持 21，因此该轮也没有迁移链合并）；实测 5 次交互式停车（区间序号 #2 版本号提交、#13 预设过滤接线的 `ProviderForm.tsx`/`ClaudeDesktopProviderForm.tsx`、#43 README 重写提交、#74 `Cargo.lock` 版本号行、#79 `ProviderList.tsx` 的 props 声明），另有 5 处 patch-id 差异属「增删行集合相同、仅上下文位移」或「被上游同名声明消化」，逐条归类见 v4.0.12 轮 change 规格的「重放映射」。
