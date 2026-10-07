# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持"始终可干净 rebase 到上游 farion1231/cc-switch main 之上"的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 v4.0.3 tag 指向的提交（8596a233，本次同步基线）。
- `git log v4.0.3..main` 仅包含 fork 提交；fork 全部改动语义保留。原始 115 个提交（bf2fe0d0..main）全部按原顺序逐一重放（无冗余跳过、无合并），外加本次同步提交（见「重放映射」，同步后按实际补记）。
- `git merge-base main upstream/main` == 8596a233（v4.0.3）；upstream/main HEAD d35726e2（post-release hermes 测试提交）不在 main 历史中，留待下次同步。
- origin/main 在本次授权的推送后与本地 main 一致（force-with-lease）。

#### 重放映射

- rebase 一次通过：115/115 提交全部重放，无 git 自动跳过、无额外修复提交、无重复提交（`git rev-list --count v4.0.3..main` == 115，与 rebase 前 bf2fe0d0..main 计数一致）。
- 冲突仅两处，均按白名单保 fork 侧（rebase 中 `--theirs`）：780400d4（首个 fork 版本号提交，package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json 三文件版本号冲突）与 096d6ba9（stream_check 移除提交，src-tauri/Cargo.lock 的 cc-switch 包版本号冲突）。其余 113 个提交全部自动合并（含 lib.rs、App.tsx、ProviderForm.tsx、locales、预设文件、AddProviderDialog.test.tsx 等共享文件——fork 与上游 v4.0.3 改动区域不重叠，3-way 自动合并即为「上游版本 + fork 叠加」语义）。
- rerere 已记录两处冲突解法供下次同步复用。
- 本次重放未触发已知坑位：无 git 段错误（signal 11）、无 Shape recovery 事件（current 工作区 rebase 全程未触发 'Native target specification declarations changed'）、`.comet/config.yaml` 未被历史重放改写。
- 同步提交（chore: sync fork with upstream v4.0.3）：版本号 4.0.2-1 → 4.0.3-1（package.json / tauri.conf.json / Cargo.toml / Cargo.lock，Cargo.lock 经 `cargo check` 联动）、白名单文档 AddProviderDialog.test.tsx 条目修订（上游 a4d07f31 已内置等价 findByRole 修复）、本 change 产物（brief / spec / comet-state）。
- AddProviderDialog.test.tsx 最终形态：上游 a4d07f31 版本（13 处 `await screen.findByRole`）+ fork 两段 explanatory 注释（重放的 91a26bbc，原 670821d8）——重放时无冲突，fork 注释随提交自动保留。

### 同步范围

- 上游新增提交：merge-base bf2fe0d0（v4.0.2）→ 8596a233（v4.0.3 tag），共 31 个提交，覆盖 v4.0.3 全部发布内容：Claude 快捷开关 auto mode 服务端检查（146f3196，网关默认关）、删除 Teammates（cac218f3）与 max effort（997a34fe）快捷开关、快捷开关帮助提示（65e79de8）与手册条目（f3e3a955）、CLAUDE_CODE_AUTO_MODE_SERVER 投影（cf567ca6）、备份位置与体积展示（3144c820）、OpenCode Zen 预设（8569ddd7）、MoArk 预设（d4a24107）、OpenCode Go 推荐码删除（58a9e8e2）、MiMo 预设默认模型修正（f68fe30f）、预设收录文档（d68f008f / 3c3b9493）、LF/CRLF 混合 SSE 分隔（edff2d76）、OpenCode Go 网关客户端身份（243cd9a9）、Claude effort 映射下限（14003822）、缓存 token 计入统计（bc4d1a50）、模型统计成功率与速度（c615c3ee）、session-log 供应商本地化名（dd07b8f4）与短标签（6f4d365b）、usage-stat 写库 spawn_blocking（34759f69）、Skills 已装列表全选（a776a3b1）、导入技能部署到勾选应用（d7f615f0）、Codex Credits 余额（fc8d884b）、MCP/Prompts 全页编辑器与未保存确认（a4d07f31）、供应商切换与路由模式日志（beff557e）、OpenCode 原生 v2 供应商 JSON 编辑器往返（3af74823）、WebKit 用量页抖动（04638fd4）、测试 HOME 覆盖优先（eef7efdc）、版本发布提交（014a33a4）与发行说明（8596a233）。
- 不做部分 cherry-pick：同步范围是 v4.0.3 tag 前的全量新增提交，一次 rebase 完成。
- 上游本次无删除、无重命名文件；新增文件（backup_storage.rs、BackupStorageSection.tsx、providerLabel.ts、statsColumns.tsx、unsavedChanges.ts、whats-new/4.0.3.json、新测试与发行说明）随 rebase 干净进入。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- fork 专属白名单文件冲突时保留 fork 侧：`tauri.conf.json`（productName/version 等 fork 标识字段）、`package.json`（version）、`src-tauri/Cargo.toml`（version）、`src-tauri/Cargo.lock`（与版本号联动）、`vite.config.ts`（`__CCS_FORK_BUILD__` define）、`vitest.config.ts`（`__CCS_FORK_BUILD__` define 与 `testTimeout`）、`src/config/forkBuild.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/App.tsx` 的 setTitle 守卫段（该文件其余按共享处理）、`src/components/settings/SettingsPage.tsx`（DevPanel 入口）、`src/vite-env.d.ts`、locales 的 `devpanel` 与 `connectivityTest` / `connectivityCheck` 键段、`tests/msw/tauriMocks.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`tests/setupTests.ts`（forkBuild mock 段）、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`CHANGELOG.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、本流程文档自身、`.gitignore` 末尾 fork 工具产物段。
- 共享文件冲突时取上游版本，再手动叠加 fork 必要改动。本次重叠 31 个文件中的共享文件及叠加语义：
  - `src-tauri/src/lib.rs`：上游新增命令/服务注册（backup_storage、quota、usage 等）为基础；叠加 fork：移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册。
  - `src-tauri/src/provider.rs`：上游改动为基础；叠加 fork `website_url_2` 字段族（Provider / UniversalProvider 的字段、构造初始化、转换透传、serde camelCase 与 skip_none 测试）。
  - `src-tauri/src/proxy/forwarder.rs`：上游 SSE 分隔 / OpenCode Go 身份 / effort 下限改动（+340 行）为基础；叠加 fork 的 UA 口径注释修正（stream_check 已删，路径口径为两条）。
  - `src-tauri/src/services/mod.rs`：上游新增 `backup_storage` mod 与 fork 的 `connectivity_test` mod 并存；fork 移除的 stream_check mod 保持移除。
  - `src-tauri/src/services/provider/live.rs` / `provider/mod.rs`：上游改动为基础；叠加 fork 连通性测试获取模型接线。
  - `src-tauri/src/tray.rs`：上游改动（+1 行）为基础；叠加 fork `show_main_window` / `hide_main_window` / `toggle_main_window` 函数与左键分支。
  - `src/App.tsx`：上游全页编辑器路由等改动（+90 行）为基础；叠加 fork：批量探针状态提升（useConnectivityProbe）、页头「批量检测」按钮（`visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控）、IS_FORK_BUILD+isTauri setTitle 守卫。
  - `AddProviderDialog.tsx` / `EditProviderDialog.tsx`：上游改动为基础，叠加 fork 接线。
  - `forms/ProviderForm.tsx`：上游改动为基础；叠加 fork：filterForkPresets 预设过滤、ProviderImportEntry + useProviderImportSources/Apply 跨应用导入、websiteUrl2 字段、Codex 模板 seeding 一次性 effect。
  - `universal/UniversalProviderFormModal.tsx`：上游改动为基础；叠加 fork websiteUrl2 支持。
  - `lib/api/settings.ts`：上游新增设置 API 为基础；保持 fork 移除的更新相关 API。
  - `src/types.ts`：上游类型改动为基础；叠加 websiteUrl2、VisibleSidebarPanels。
  - 预设文件 ×7（claudeDesktop / codex / hermes / openclaw / opencode / pi）：上游预设内容（OpenCode Zen、MoArk、推荐码删除、MiMo 默认值）为基础；叠加 fork 的 `hidden` 语义与接口字段；fork 构建下新预设由 forkOfficialAllowlist 自动过滤，不新增白名单条目。
  - 4 个 i18n locales：上游新增键（快捷开关提示、备份、用量、编辑器、配额等）与删除键按上游执行；保留 fork 的 devpanel、connectivityTest / connectivityCheck 键段。
  - `tests/components/AddProviderDialog.test.tsx`：上游 a4d07f31 已含与 fork 670821d8 等价的 getByRole→findByRole 竞态修复，取上游版本后叠加回 fork 的两段 explanatory 注释。
  - `tests/components/ProviderPresetSelector.test.tsx`、golden snapshot：上游改动为基础；叠加 fork 预设过滤测试与快照条目。
  - 版本文件（package.json、tauri.conf.json、Cargo.toml、Cargo.lock）：fork 侧 4.0.3-1。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本（ORIG_HEAD 指向 rebase 起点 670821d8）。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少 docs/comet/specs 全局规格文件，Runtime 可能两次判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）放在 handoff 提交前完成并接受最后一次确认。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.3-1`（同步前工作树为 4.0.2-1，重放过程途经历史版本号）。
- 同步基线为 8596a233（v4.0.3 发布头，tag v4.0.3 指向该提交）。upstream/main HEAD d35726e2 为 post-release 提交，按已确认范围锁定 v4.0.3 基线，不在本次同步中，留待下次同步。
- 语义：上游版本号 + `-1`（fork 在该上游版本上的第一代魔改版本），沿用既有惯例。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物（docs/comet/changes/sync-upstream-v403/）随最终同步/归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

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
- 共享文件表中与新上游改动相关的叠加语义如有变化（lib.rs 新命令注册、forwarder.rs、App.tsx 全页编辑器等），按需修订对应条目。

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
- 不同步 post-release 提交 d35726e2。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（670821d8），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
