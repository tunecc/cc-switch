# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持"始终可干净 rebase 到上游 farion1231/cc-switch main 之上"的同步状态。每次同步执行后，fork main = 上游 main 最新内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 upstream/main HEAD（本次为 bf2fe0d0，v4.0.2）。
- `git log upstream/main..main` 仅包含 fork 提交；fork 全部改动语义保留。原始 111 个提交（4804b723..main）全部按原顺序逐一重放（无冗余跳过、无合并），外加 2 个本次同步提交（见「重放映射」）。

#### 重放映射

- `feat: disable in-app updater, point users to GitHub releases`（原 8217f0b3）：重放为 f8001dea 后，发现 AboutSection.tsx 冲突时整文件取 fork 侧丢失了上游 v4.0.2 新增的 whats-new 摘要入口（WhatsNewDialog + recentEntries + Sparkles 按钮）；追加 fa9db600 修复提交补回 whats-new 区块并保留 fork 更新器语义。该文件最终形态 = 上游 v4.0.2 AboutSection + fork 更新器改动。
- 同步提交（chore: sync fork with upstream v4.0.2）：版本号 4.0.2-1、白名单文档更新（Cargo.lock 版本联动条目、AboutSection whats-new 处理指引、schema.rs/settings.rs/lib.rs/database/mod.rs 共享语义条目）、schema 迁移链合并核对。
- `git merge-base main upstream/main` == upstream/main HEAD。
- origin/main 在本次授权的推送后与本地 main 一致（force-with-lease）。

### 同步范围

- 上游新增提交：merge-base 4804b723（v4.0.1）→ upstream/main bf2fe0d0（v4.0.2），共 17 个提交，覆盖 v4.0.2 全部发布内容：MCP 服务器同步到 Pi 1.0 内建 MCP（#7862）、reasoning replay envelope 字段白名单修复（#7876）、聚合模型经 modelPicker 写入 settings.json 取代 gateway discovery、Claude Code 聚合变更重启提示移除（useStackModelsChangedHint 删除）、供应商表单布局按打开页签选取（modeView）、Codex 模型映射表接入拉取模型选择器、reasoning levels 列宽修复、图标 tile 化（ProviderIconBox）、更新后变更摘要（whats-new）、model_catalog_json 作为普通键字段、聚合受阻时切回 CC Switch 模型目录、用量日期区间样式（#7864）、time preset 改用 uvx（#7863）、DeepSeek V4.1 Flash 预设固定 image input（#7865）。
- 不做部分 cherry-pick：同步范围是 upstream/main 全量新增提交，一次 rebase 完成。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- fork 专属白名单文件冲突时保留 fork 侧：`tauri.conf.json`（productName/version 等 fork 标识字段）、`package.json`（version）、`src-tauri/Cargo.toml`（version）、`src-tauri/Cargo.lock`（与版本号联动）、`vite.config.ts`（`__CCS_FORK_BUILD__` define）、`vitest.config.ts`（`__CCS_FORK_BUILD__` define 与 `testTimeout`）、`src/config/forkBuild.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/App.tsx` 的 setTitle 守卫段（该文件其余按共享处理）、`src/components/settings/SettingsPage.tsx`（DevPanel 入口）、`src/vite-env.d.ts`、locales 的 `devpanel` 与 `connectivityTest` / `connectivityCheck` 键段、`tests/msw/tauriMocks.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`tests/setupTests.ts`（forkBuild mock 段）、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`CHANGELOG.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、本流程文档自身、`.gitignore` 末尾 fork 工具产物段。
- 共享文件冲突时取上游版本，再手动叠加 fork 必要改动。本次重叠 23 个文件中的共享文件及叠加语义：
  - `src-tauri/src/lib.rs`：移除 Updater 插件注册段（fork 禁用应用内更新器的后端部分）+ 托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）。
  - `src-tauri/src/settings.rs`：`VisibleSidebarPanels` 结构、`AppSettings.visible_sidebar_panels` 字段与 Default 实现；叠加上游新增 `whats_new_seen_version`。
  - `src-tauri/src/database/mod.rs`：SCHEMA_VERSION 取上游 20；保留 fork 已移除的 stream_check 日志清理调用（旧 stream_check 链路在 fork 已删除）。
  - `src-tauri/src/database/schema.rs`：合并迁移链——v18→v19 同时包含上游原迁移与 fork website_url_2（`migrate_v18_to_v19` + `add_column_if_missing` 兜底 + providers 建表语句的 `website_url_2 TEXT` 列），v19→v20 为上游 `mcp_servers.enabled_pi`（建表列保留）；SCHEMA_VERSION=20。
  - `src/App.tsx`：批量探针状态提升（useConnectivityProbe）、页头「批量检测」按钮（`visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控）、IS_FORK_BUILD+isTauri setTitle 守卫；叠加上游对 Add/Edit 对话框的 modeView 透传。
  - `AddProviderDialog.tsx` / `EditProviderDialog.tsx`：上游 modeView / onStackLayoutChange 透传为基础，叠加 fork 接线。
  - `ProviderForm.tsx`：上游 modeView / onStackLayoutChange / preferFullForm 移除为基础；叠加 fork：filterForkPresets 预设过滤、ProviderImportEntry + useProviderImportSources/Apply 跨应用导入（新建/编辑两条同步路径）、websiteUrl2 字段、Codex 自定义模板 seeding 一次性 effect（seededCodexTemplateFor，防止导入值被模板覆盖）。
  - `ProviderPresetSelector.tsx`：上游 icon tile 渲染为基础；叠加 fork extraActions 插槽（跨应用导入入口行）。
  - `ProviderCard.tsx`：上游 icon tile（ProviderIconBox）为基础；叠加 fork 模型徽章（extractModelBadgeForProvider）、ConnectivityBadge 探针徽标、双官网链接横排、右键菜单挂载。
  - `BasicFormFields.tsx`：上游 icon 按钮 tile 化为基础；叠加 fork 双官网链接字段横排（websiteUrl + websiteUrl2 的 grid 双列）。
  - `AboutSection.tsx`：上游 whats-new 更新摘要为基础；叠加 fork「检查更新」/发行说明指向 tunecc/cc-switch Releases、禁用应用内更新器。
  - `src/config/appConfig.tsx`：上游为基础；叠加 `DEFAULT_VISIBLE_SIDEBAR_PANELS`。
  - `src/types.ts`：上游 stack/proxy 类型改动为基础；叠加 websiteUrl2、VisibleSidebarPanels。
  - 4 个 i18n locales：上游新增键（provider.stackSavedLive、mode.toast.enteredStackLive、provider.formSubtitleStack、codexConfig.defaultReasoningLevelTip、whatsNew 段等）与删除键（provider.stackModelsChanged、mode.dialog.stackNoteRestart、proxy.stackMode.tooltip、providerForm.stackLayout.*）按上游执行；保留 fork 的 devpanel、connectivityTest / connectivityCheck 键段。
  - 版本文件（package.json、tauri.conf.json、Cargo.toml、Cargo.lock）：fork 侧 4.0.2-1。
  - `.github/workflows/release.yml`：fork 白名单整文件保留（裁剪 CI + 跳过上游纯版本 tag）。
- 上游删除 `src/hooks/useStackModelsChangedHint.ts` 及其测试、`src/icons/extracted/fenno-icon.webp`：fork 未修改这些文件，按上游删除重放。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本（ORIG_HEAD 指向 rebase 起点 e6594a93）。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.2-1`（同步前工作树为 4.0.1-1，重放过程途经历史版本号）。
- 同步基线为 bf2fe0d0（v4.0.2 发布头，tag v4.0.2 指向该提交）。同步进行期间 upstream 远端前进 1 个 post-release 提交（bf2fe0d0..cf567ca6，`fix(claude): project CLAUDE_CODE_AUTO_MODE_SERVER from provider env into settings.json`），按已确认范围锁定 v4.0.2 基线，不在本次同步中，留待下次同步。
- 语义：上游版本号 + `-1`（fork 在该上游版本上的第一代魔改版本），沿用既有惯例。

### 工作区未提交改动

- 同步前工作区干净（Comet 流程状态文件除外）；已进入 git 历史的 `vitest.config.ts` `testTimeout: 30000` 随历史重放保留。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。
- 该改动把 jsdom 组件测试超时从默认 5 秒提到 30 秒：PiProviderForm 等「渲染整个供应商表单」的测试稳定超过 5 秒，30 秒仍是硬边界，不会掩盖真正挂死的测试。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 AppSettings 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + 隐藏字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、website_url_2 列与 v18→v19 迁移）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 主页左上角品牌链接指向 `https://github.com/farion1231/cc-switch`。
- 上游 tag 的发版构建跳过（fork CI 裁剪）。
- README fork 差异说明与构建说明。
- CI：仅构建 Windows x64 与 macOS arm64 unsigned；禁用应用内更新器（指向 GitHub Releases）。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- `src-tauri/Cargo.lock` 的版本联动保留范围补入白名单说明（v4.0.1 验证发现的微小文档缺口）。
- `src-tauri/src/database/schema.rs` 的 fork 迁移合并语义（website_url_2 在 v18→v19）补入共享文件表，供下次同步参考。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不清理本地遗留分支。
- 不做部分 cherry-pick 式同步。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（e6594a93），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
