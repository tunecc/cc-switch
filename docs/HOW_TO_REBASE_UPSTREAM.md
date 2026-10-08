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
| `src-tauri/src/lib.rs` | 托盘左键单击切换主窗口显示/隐藏（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）；移除 Updater 插件注册段（fork 关闭自动更新的后端部分，v4.0.2 起随 8217f0b3 重放保留）。v4.0.4 起上游新增 macOS 重启链路（`restart_process` / `relaunch_macos_bundle`，经 LaunchServices `open -n` 回到前台）：以上游为基础，fork 的更新器移除段保持不存在即可，勿因重放复活 |
| `src-tauri/src/commands/settings.rs` | fork：`restart_app` 的注释口径（保留代理状态、旧实例同步恢复 Live）随上游改动保留；v4.0.4 起该文件重启改走 `crate::restart_process(&app)`（替代 `app.restart()`），fork 无额外语义，按上游落地 |
| `src-tauri/src/settings.rs` | fork：`VisibleSidebarPanels` 结构 + `AppSettings.visible_sidebar_panels`（上游 v4.0.2 新增 `whats_new_seen_version` 与之共存，合并两段）。v4.0.4 起上游把 `show_profile_switcher` 改为 `#[serde(default)]` 且默认 `false`（`default_show_profile_switcher` 已删）：取上游默认值，fork 的 `visible_sidebar_panels` 字段段保持不动 |
| `src-tauri/src/database/schema.rs` | fork：`website_url_2` 列（providers 建表 + `migrate_v18_to_v19` + `add_column_if_missing` 兜底）。v4.0.2 起上游 SCHEMA_VERSION=20（v19→v20 为 `mcp_servers.enabled_pi`）：合并时 v18→v19 同时保留上游 mcode 迁移与 fork website_url_2，v19→v20 取上游，`SCHEMA_VERSION` 取上游值。v4.0.2 同步的 v19 双语义合并留下历史缺口（旧 fork 构建已升到 v19 的库跳过捆绑步骤、缺 `enabled_mcode`），fork 已加 v20→v21 修复迁移幂等补齐 `mcp_servers.enabled_mcode/enabled_pi` 与 `skills.enabled_mcode`（当前 SCHEMA_VERSION=21）：后续上游若再推进 schema，fork 的 v21 步骤必须原样保留，新步骤接在 v21 之后 |
| `src-tauri/src/database/mod.rs` | fork：移除 `cleanup_old_stream_check_logs` 启动清理调用（旧 stream_check 链路已删）；`SCHEMA_VERSION` 常量随 fork 修复迁移演进（当前 21，含 fork 专属 v20→v21 修复步骤；上游再推进时取「上游新版本与 fork v21 的较大者」并叠加双方迁移步骤） |
| `src/components/settings/AboutSection.tsx` | 「检查更新」/发行说明指向 fork GitHub Releases（tunecc/cc-switch），禁用应用内更新器；v4.0.1 上游已删 RoutingActivationBrand（左上角品牌链接组件不再存在，无需叠加）。v4.0.2 起该文件含上游 whats-new 摘要入口（WhatsNewDialog + recentEntries + Sparkles 按钮），v4.0.4 起上游又把邀 Star 从行内 `<a>` 改为独立可关闭条（`Star`/`X` 图标 + `settings.starOnGithub` 键 + localStorage `ccswitch:about:starPromptDismissed`）：两者都按共享文件保留，只叠加 fork 的更新器改动（移除 isDownloading/installUpdateAndRestart/checkUpdate/resetDismiss，链接改 tunecc）。v4.0.4 同步实测：重放 fork 的 `feat: disable in-app updater` 提交时该文件必冲突，解法是保留 HEAD 侧 whats-new 与 star 条、只删 `isDownloading`，并补回被 fork 侧抹掉的 `useMemo` 导入与 `WhatsNewDialog`、`WHATS_NEW_ENTRIES/entriesUpTo` 导入，同时删除因此不再使用的 `extractErrorMessage` 导入；其后重新加回 whats-new 的 fork 提交（原 c8c8461c）在新基线下成为空提交并被 git 丢弃，属预期，不算 fork 改动丢失 |
| `src/components/shell/Sidebar.tsx` | fork：全局面板项（MCP/Skills/会话/Prompts）按 `visibleSidebarPanels` 过滤 |
| `src/components/settings/sections/GeneralSection.tsx` | fork：侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest）。v4.0.4 起上游把「显示项目切换器」开关默认值改为 `settings.showProfileSwitcher ?? false`：取上游，fork pill 行保留 |
| `src/App.tsx` | fork：批量连通性探针状态提升（useConnectivityProbe）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、托盘同款 window-title 守卫。v4.0.4 起上游把主页面 ProfileSwitcher 门控改为 `settingsData?.showProfileSwitcher ?? false`：取上游默认值，fork 三段语义不动 |
| `src/components/providers/ProviderCardActions.tsx` | fork：右键菜单「模型」快捷切换入口（上游 v4 删除 ProviderActions 后的移植位置） |
| `src/components/providers/ProviderCard.tsx` | fork：模型徽章（extractModelBadgeForProvider）、ConnectivityBadge 探针徽标、双官网链接横排、右键菜单挂载 |
| `src/components/providers/ProviderList.tsx` | fork：右键一键置顶/置底（applyQuickSort + updateTrayMenu 刷新）、ConnectivityTestDialog、批量探针徽标接线、websiteUrl2 搜索 |
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
| `src-tauri/src/commands/misc.rs` 等后端共享文件 | 连通性测试命令注册、`connectivityTest` sanitize 隔离 |
| `tests/components/AddProviderDialog.test.tsx` | fork：两个 claude 用例的「common.add」按钮由同步 `getByRole` 改为 `await findByRole`（live 底到位后 step 从 pick 切 form 是第二次提交，CI 慢机器上 footer 晚一拍渲染，同步查找偶发 flaky，2026-10-06 CI 实测踩中）。上游 v4.0.3（a4d07f31）已内置等价 `findByRole` 修复：此后该文件冲突取上游版本，仅叠加回 fork 的两段 explanatory 注释 |

说明：

- 这些文件 rebase 冲突时按第 3.1 节保留 fork 侧。
- 上游 v4.0 删除的组件（`ProviderActions.tsx`、`RoutingActivationBrand.tsx`、`AppVisibilitySettings.tsx`、`SkillStorageLocationSettings.tsx` 等）：fork 的对应改动按第 3.2 节移植到新位置（ProviderCardActions / AboutSection / GeneralSection），不要按白名单复活旧文件。
- `.gitignore` 整体不是 fork 专属，但其末尾的 fork 工具产物段需保留；其余 `.gitignore` 改动按共享文件处理。
- 白名单随 fork 魔改范围扩展而更新；新增 fork 专属文件时同步补充本表。
