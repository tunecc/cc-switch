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
| `src/components/settings/SettingsPage.tsx` | `IS_FORK_BUILD` 守卫下的 DevPanel 入口与挂载（v4.0 起为 sections 结构，DevPanel 挂在 about 分组） |
| `src/vite-env.d.ts` | `__CCS_FORK_BUILD__` 全局类型声明 |
| `src/i18n/locales/zh.json` / `en.json` / `ja.json` / `zh-TW.json` | `devpanel` 段 + `connectivityTest` / `connectivityCheck` 等连通性测试键段（fork 新增键；上游新增键按共享合并） |
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
| `src/components/usage/ConnectivityCheckConfigPanel.tsx` | 用量页连通性测试参数面板（整文件保留） |
| `src/hooks/useConnectivityProbe.ts` / `useConnectivityTest.ts` | 测试/探针状态 hooks（整文件保留） |
| `src/lib/api/connectivity-check.ts` / `connectivity-test.ts` | 连通性测试前端 API 绑定（整文件保留） |
| `src/lib/api/settings.ts` | fork：移除 `installUpdateAndRestart()` 绑定（关闭应用内更新器）。v4.0.6 起上游在本文件加 `codexForcesMultiAgentV2()` 绑定（+5 行）：取上游新增，fork 移除的更新绑定不得复活 |
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
| `tests/lib/providerModelIds.test.ts` / `tests/utils/providerModelUtils.test.ts` | 模型工具测试（整文件保留） |
| `tests/components/ProviderCard.websiteLinks.test.tsx` / `tests/lib/providerSchema.websiteUrl2.test.ts` | 双官网链接测试（整文件保留） |
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
| `src-tauri/src/lib.rs` | 托盘左键单击切换主窗口显示/隐藏（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）；移除 Updater 插件注册段（fork 关闭自动更新的后端部分，v4.0.2 起随 8217f0b3 重放保留）。v4.0.4 起上游新增 macOS 重启链路（`restart_process` / `relaunch_macos_bundle`，经 LaunchServices `open -n` 回到前台）：以上游为基础，fork 的更新器移除段保持不存在即可，勿因重放复活。v4.0.5 起上游又在本文件加了 all-time 热力图命令注册、Wayland 标题栏/托盘重显链路与 WSL 夜间测试标记：以上游为准，fork 的「无 updater 插件注册 + 左键切换 + connectivity_test 命令注册」三段语义照常叠加，任何一次重放都要确认 `tauri_plugin_updater` 没有被带回。v4.0.6 起上游在本文件只加了一行 `codex_forces_multi_agent_v2` 命令注册：取上游，fork 三段语义照常叠加 |
| `src-tauri/src/commands/settings.rs` | fork：`restart_app` 的注释口径（保留代理状态、旧实例同步恢复 Live）随上游改动保留；v4.0.4 起该文件重启改走 `crate::restart_process(&app)`（替代 `app.restart()`），fork 无额外语义，按上游落地。v4.0.6 起上游在本文件加了 `codex_stack_classic_subagents` 开关的落库与失败回滚（+28 行）：取上游改动，同时保留 fork 移除的 `install_update_and_restart` 下载安装实现（命令接口留空壳，`tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构一并不复活）——本文件是「取上游侧易带回 updater」的高危点，解完必须 grep `updater_builder` |
| `src-tauri/src/settings.rs` | fork：`VisibleSidebarPanels` 结构 + `AppSettings.visible_sidebar_panels`（上游 v4.0.2 新增 `whats_new_seen_version` 与之共存，合并两段）。v4.0.4 起上游把 `show_profile_switcher` 改为 `#[serde(default)]` 且默认 `false`（`default_show_profile_switcher` 已删）：取上游默认值，fork 的 `visible_sidebar_panels` 字段段保持不动。v4.0.6 起上游新增两个设置字段（`show_provider_search` 默认 true、`codex_stack_classic_subagents` 默认 false）与 `codex_stack_classic_subagents()` 访问器：取上游，fork 的 `VisibleSidebarPanels` 字段段不动 |
| `src-tauri/src/database/schema.rs` | fork：`website_url_2` 列（providers 建表 + `migrate_v18_to_v19` + `add_column_if_missing` 兜底）。v4.0.2 起上游 SCHEMA_VERSION=20（v19→v20 为 `mcp_servers.enabled_pi`）：合并时 v18→v19 同时保留上游 mcode 迁移与 fork website_url_2，v19→v20 取上游，`SCHEMA_VERSION` 取上游值。v4.0.2 同步的 v19 双语义合并留下历史缺口（旧 fork 构建已升到 v19 的库跳过捆绑步骤、缺 `enabled_mcode`），fork 已加 v20→v21 修复迁移幂等补齐 `mcp_servers.enabled_mcode/enabled_pi` 与 `skills.enabled_mcode`（当前 SCHEMA_VERSION=21）：后续上游若再推进 schema，fork 的 v21 步骤必须原样保留，新步骤接在 v21 之后 |
| `src-tauri/src/database/dao/providers.rs` | fork：`get_providers` / `get_provider` 两条 SELECT 的列清单含 `website_url_2`，`row.get(N)` 索引整体后移一位，`Provider` 构造多一个字段。v4.0.6 起上游在本文件加了 `unbind_codex_managed_accounts`（+86 行，删除托管账号时解除 Codex 供应商绑定）：上游新方法不触碰这两条查询，预期 git 自动合并；若冲突，按「上游新方法 + fork 列索引后移」手工叠加，切勿整文件取上游侧把索引改回去 |
| `src-tauri/src/database/mod.rs` | fork：移除 `cleanup_old_stream_check_logs` 启动清理调用（旧 stream_check 链路已删）；`SCHEMA_VERSION` 常量随 fork 修复迁移演进（当前 21，含 fork 专属 v20→v21 修复步骤；上游再推进时取「上游新版本与 fork v21 的较大者」并叠加双方迁移步骤） |
| `src/components/settings/AboutSection.tsx` | 「检查更新」/发行说明指向 fork GitHub Releases（tunecc/cc-switch），禁用应用内更新器；v4.0.1 上游已删 RoutingActivationBrand（左上角品牌链接组件不再存在，无需叠加）。v4.0.2 起该文件含上游 whats-new 摘要入口（WhatsNewDialog + recentEntries + Sparkles 按钮），v4.0.4 起上游又把邀 Star 从行内 `<a>` 改为独立可关闭条（`Star`/`X` 图标 + `settings.starOnGithub` 键 + localStorage `ccswitch:about:starPromptDismissed`）：两者都按共享文件保留，只叠加 fork 的更新器改动（移除 isDownloading/installUpdateAndRestart/checkUpdate/resetDismiss，链接改 tunecc）。v4.0.4 同步实测：重放 fork 的 `feat: disable in-app updater` 提交时该文件必冲突，解法是保留 HEAD 侧 whats-new 与 star 条、只删 `isDownloading`，并补回被 fork 侧抹掉的 `useMemo` 导入与 `WhatsNewDialog`、`WHATS_NEW_ENTRIES/entriesUpTo` 导入，同时删除因此不再使用的 `extractErrorMessage` 导入；其后重新加回 whats-new 的 fork 提交（原 c8c8461c）在新基线下成为空提交并被 git 丢弃，属预期，不算 fork 改动丢失 |
| `src/components/shell/Sidebar.tsx` | fork：全局面板项（MCP/Skills/会话/Prompts）按 `visibleSidebarPanels` 过滤。v4.0.6 起上游给 `NavItem` 加 `dotTone`（neutral/success）并让「设置」项用 success 绿点：取上游，fork 的面板过滤不动 |
| `src/components/settings/sections/GeneralSection.tsx` | fork：侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest）。v4.0.4 起上游把「显示项目切换器」开关默认值改为 `settings.showProfileSwitcher ?? false`：取上游，fork pill 行保留。v4.0.6 起上游在同一张卡片里加了「显示供应商搜索」开关行（+11 行）：解法是「上游开关行 + fork `SidebarPanelPillRow`」并存，不要把整段取成单侧 |
| `src/App.tsx` | fork：批量连通性探针状态提升（useConnectivityProbe）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、托盘同款 window-title 守卫。v4.0.4 起上游把主页面 ProfileSwitcher 门控改为 `settingsData?.showProfileSwitcher ?? false`：取上游默认值，fork 三段语义不动。v4.0.6 起上游在页头加了供应商搜索按钮（`showProviderSearch` 门控 + `Search` 图标，lucide 导入块随之改写）：解法是「上游搜索按钮块 + fork 批量检测按钮块」两个完整 JSX 块并存，lucide 导入取两边并集（上游 5 个 + fork 的 `Activity`/`Loader2`）。注意：用「按行去重」的方式合导入块会吃掉重复的 `<Button`/`}` 行而破坏 JSX 结构，必须整块拼接后再核对括号平衡 |
| `src/components/providers/ProviderCardActions.tsx` | fork：右键菜单「模型」快捷切换入口（上游 v4 删除 ProviderActions 后的移植位置） |
| `src/components/providers/ProviderCard.tsx` | fork：模型徽章（extractModelBadgeForProvider）、ConnectivityBadge 探针徽标、双官网链接横排、右键菜单挂载。v4.0.6 起上游把 `extractApiUrl` 的内联实现替换为 `extractProviderBaseUrl(provider.settingsConfig) ?? fallbackText`（并删掉 `extractCodexBaseUrl` 导入）：取上游重构，fork 的徽章/双链接/右键菜单照常叠加 |
| `src/components/providers/ProviderList.tsx` | fork：右键一键置顶/置底（applyQuickSort + updateTrayMenu 刷新）、ConnectivityTestDialog、批量探针徽标接线、websiteUrl2 搜索。v4.0.6 起上游重写搜索为 `searchIndex`（名称/备注/官网/请求地址，请求地址走 `extractProviderBaseUrl`）并新增 `searchOpen`/`onSearchOpenChange` 受控 props（+166 行）：解法是取上游的 `searchIndex` 实现，再把 fork 的 `provider.websiteUrl2` 加回 text 字段数组，props 取两边并集（上游受控搜索 + fork `probeResults`）——这是「上游结构更优但不能丢 fork 字段」的典型点 |
| `src/lib/query/mutations.ts` | fork：新增供应商默认插入第二位（sortIndex 让位重写） |
| `src/components/providers/forms/ProviderForm.tsx` | fork：跨应用导入接线（ProviderImportEntry + useProviderImportApply，编辑/新建两条同步路径） |
| `src/components/providers/forms/ProviderPresetSelector.tsx` | fork：`extraActions` 插槽（跨应用导入入口行，v4 两步外壳的外层渲染） |
| `src/components/providers/forms/ClaudeFormFields.tsx` | fork：兜底模型直达区（fallbackQuickAccessSection，仅经典布局渲染）、API 格式选择器随端点输入框、1M 全选 |
| `src/components/providers/forms/GrokBuildProviderForm.tsx` | fork：跨应用导入接线（grokbuild config.toml 路径） |
| `src/config/forkOfficialAllowlist.ts` | 上游 v4 新增 mcode 应用后补 `mcode: []` 空白名单 |
| `src/contexts/UpdateContext.tsx` | 取消启动自检（fork 关闭自动更新） |
| `src/lib/updater.ts` | 恒返回 up-to-date（fork 关闭自动更新） |
| `src/config/*ProviderPresets.ts` ×8 | 预设接口的 `hidden?: boolean` 字段与官方预设过滤接线 |
| `src/lib/schemas/provider.ts` | `websiteUrl2` 第二官网链接字段 |
| `src-tauri/src/commands/misc.rs` 等后端共享文件 | 连通性测试命令注册（`src-tauri/src/lib.rs` 的 `commands::connectivity_test_provider_models`，实体在 `src-tauri/src/services/connectivity_test/`，独立 reqwest+SSE 直连执行器，不经 proxy 转发链）。v4.0.5 起上游在本文件加入 Claude Code npm 安装的 native setup（c5233fe7，#7929）：取上游改动，fork 的命令注册与 sanitize 由 git 自动合并，无额外取舍。v4.0.6 起上游在本文件让 npm 安装的 Claude Code 升级路径也允许安装脚本运行（889b797d，#7099，+187 行）：取上游，fork 语义不变 |
| `src-tauri/src/tray.rs` | fork：`toggle_main_window` 与左键单击切换分支（约 32 行）。v4.0.5 起上游在本文件改了 Wayland 重显相关的托盘构建（36c8b87e，#7947）：两侧必须并存，此文件是本轮最容易整文件取一侧而丢语义的点，解完冲突后逐行复核。v4.0.6 起上游把 `WARN_BELOW_PERCENT` 从 10.0 提到 20.0、删掉 `pick_lines`、`quota_title` 改为写全部额度档位（#8011：只留剩余最少两档时 5 小时档几乎总被挤掉）：取上游，fork 的 `toggle_main_window` 与左键分支不动 |
| `src-tauri/src/provider.rs`、`src-tauri/src/services/provider/mod.rs` | fork：`website_url_2` 字段（serde `websiteUrl2`、`UniversalProvider` 随行透传）与连通性测试相关接线。v4.0.5 起上游为 Copilot 托管账户扩展了 provider 字段与路由判定（f9db9f70，#7157）：以上游为基础，fork 的 `website_url_2` 字段与接线一行不能丢。v4.0.6 起上游又在本文件改了第三方目录自带模板、官方模型可见性（按本机实际最新版本拉取）与托管账号解绑接线（+249 行）：以上游为基础，fork 字段与接线照常叠加 |
| `src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs` | fork：按供应商 API 格式对齐真实转发链路的转换接线，以及测试里 Provider 字面量的 `website_url_2: None`（连通性测试不走这条转发链，其实体是 `src-tauri/src/services/connectivity_test/` 的独立 reqwest+SSE 直连执行器，v4.0.6 起已确认这两个文件里没有 connectivity 引用）。v4.0.5 起上游把 `forwarder.rs` 近乎重写（f9db9f70，单文件 +1166 行）并删掉了自带的 `copilot_detection_via_*` / `copilot_detection_for_enterprise_endpoint` 测试，改用 `is_managed_copilot_request()` + 新的 `test_provider_with_type()` 构造助手：这类测试区冲突一律取上游侧（fork 在这些文件里从来只加 `website_url_2` 字段，没有自建测试），取完上游侧后要确认 `test_provider_with_type()` 里仍带 `website_url_2: None`，否则 `cargo test` 编译失败。v4.0.6 起上游又改了 Anthropic SSE 收尾（终止事件前关闭未闭合 content block，新增 `proxy/providers/streaming.rs`）、加密子 agent 任务流起始与第三方压缩保留工具定义（+441 行）：取上游，fork 的 sanitize 隔离与 `website_url_2: None` 照常叠加 |
| `src/types.ts` | fork：`websiteUrl2`、`VisibleSidebarPanels` 等类型段。v4.0.5 起上游新增 Copilot/用量相关类型：两段并存。v4.0.6 起上游又加 `showProviderSearch`、`codexStackClassicSubagents`、`dotTone` 等类型：继续两段并存 |
| `src/components/providers/EditProviderDialog.tsx` 与 `tests/components/EditProviderDialog.test.tsx` | fork：编辑弹窗的 fork 接线与 47 行 fork 用例。v4.0.5 起上游为 Copilot 能力新增 props 与用例：取上游结构，fork 用例与改动叠加回 |
| `src/config/codexProviderPresets.ts` | fork：预设接口的 `hidden?: boolean` 与官方预设过滤接线。v4.0.5 起上游给 MoArk 预设补了模型目录与原生 Responses 格式（3af55c39，#7940）：取上游预设内容，fork 的 `hidden` 字段与过滤判定照常生效（上游新增预设是否可见由 fork 白名单决定，不要手工放开）。v4.0.6 起上游在本文件只删了 1 行：fork 的 `hidden` 字段与过滤判定照常生效 |
| `src/components/providers/forms/ProviderForm.tsx` | fork：跨应用导入接线（ProviderImportEntry + useProviderImportApply，编辑/新建两条同步路径）。v4.0.5 起上游在本文件接入 Copilot 托管账户表单路由（+87 行）：取上游骨架，fork 的导入接线与 `ProviderPresetSelector.extraActions` 插槽保留。v4.0.6 起上游在本文件又改了搜索接线与 Copilot 相关调整（+99 行）：取上游，fork 导入接线与插槽保留 |
| `pnpm-lock.yaml`、`src-tauri/Cargo.lock` | 锁文件冲突只针对 fork 专属条目取 fork 侧（`@tauri-apps/plugin-updater` 的 specifier / resolution / snapshot 三段，`cc-switch` 包版本号），其余上游依赖变动一律接收，不要整文件取一侧。收尾用 `pnpm install` 与 `cargo check` 复验：两者都报告锁文件未被改写，才算与 `package.json` / `Cargo.toml` 一致 |
| `tests/components/AddProviderDialog.test.tsx` | fork：两个 claude 用例的「common.add」按钮由同步 `getByRole` 改为 `await findByRole`（live 底到位后 step 从 pick 切 form 是第二次提交，CI 慢机器上 footer 晚一拍渲染，同步查找偶发 flaky，2026-10-06 CI 实测踩中）。上游 v4.0.3（a4d07f31）已内置等价 `findByRole` 修复：此后该文件冲突取上游版本，仅叠加回 fork 的两段 explanatory 注释 |

说明：

- 这些文件 rebase 冲突时按第 3.1 节保留 fork 侧。
- 上游 v4.0 删除的组件（`ProviderActions.tsx`、`RoutingActivationBrand.tsx`、`AppVisibilitySettings.tsx`、`SkillStorageLocationSettings.tsx` 等）：fork 的对应改动按第 3.2 节移植到新位置（ProviderCardActions / AboutSection / GeneralSection），不要按白名单复活旧文件。
- `.gitignore` 整体不是 fork 专属，但其末尾的 fork 工具产物段需保留；其余 `.gitignore` 改动按共享文件处理。
- 白名单随 fork 魔改范围扩展而更新；新增 fork 专属文件时同步补充本表。
