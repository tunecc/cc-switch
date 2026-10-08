# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持"始终可干净 rebase 到上游 farion1231/cc-switch main 之上"的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.4 发布头（tag v4.0.4 = a29a4f38），fork 版本号为 4.0.4-1，origin/main 与本地一致，并存在指向归档提交的 annotated tag `v4.0.4-1`。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 a29a4f38（tag v4.0.4 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == a29a4f38；`git log v4.0.4..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 121 个 fork 提交（d35726e2..main）按原顺序重放，其中 120 个逐一落地、1 个（原 c8c8461c，在新基线下已无内容的重复加回）成为空提交被 git 丢弃；外加本次同步提交与归档提交（见「重放映射」）。
- 上游 v4.0.4 之后的 11 个 post-release 提交（含 upstream/main HEAD 5ae6ad38）不在 main 历史中，留待下次同步。
- origin/main 在本次授权的 `--force-with-lease` 推送后与本地 main 一致；annotated tag `v4.0.4-1` 指向本次归档提交并已推送到 origin。

#### 重放映射

- rebase 一趟完成：同步前 `d35726e2..main` 的 121 个 fork 提交中，120 个按原顺序逐一重放（`git rev-list --count v4.0.4..main` == 120，顺序与旧历史逐条一致，已用「两侧 `%s` 序列去掉一个已知冗余提交后逐位相等」核对）。
- 唯一被丢弃的提交：原 `c8c8461c`（`feat: disable in-app updater, point users to GitHub releases`，历史第 112 个）重放后成为空提交被 git 丢弃。该提交的原意是「上游 v4.0.2 删掉 fork 的 updater 后，把上游 whats-new 摘要入口重新加回 AboutSection」；在新基线（上游 v4.0.4 已含 whats-new，且前一提交 `2ad67850` 的冲突解法已保留 whats-new 与 star 条）下其内容全部已存在，属预期冗余，不算 fork 改动丢失。同名提交的早期版本（原 `2ad67850`，历史第 42 个）仍正常重放。
- 冲突共 4 处，全部按下述解法处理并被 rerere 记录：
  1. 原 `812c0a7f`（fork 首个版本号提交）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（HEAD 侧 4.0.4 vs fork 侧 3.20.2-fork.1）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容（不对整文件 `--theirs`，避免把上游依赖/脚本改动回退）。
  2. 原 `2ad67850`（fork 禁用应用内更新器）：`src/components/settings/AboutSection.tsx` 三处冲突 → 保留 HEAD 侧的上游 whats-new 按钮 + `WhatsNewDialog` + v4.0.4 新增的独立可关闭 star 条（`Star`/`X`/`starPromptDismissed`/`recentEntries`），只按 fork 语义删除 `isDownloading`；同时补回 fork 侧误抹的 `useMemo` 导入与 `WhatsNewDialog`、`WHATS_NEW_ENTRIES/entriesUpTo` 导入，并删除因此不再使用的 `extractErrorMessage` 导入。该提交的其余 fork 改动（tunecc releases 链接、`handleCheckUpdate` 简化、`disabled={isChecking}`）由 git 自动合并落地。
  3. 原 `99ebd7a5`（移除旧 stream_check 链路）：`src-tauri/Cargo.lock` 的 `cc-switch` 包版本号冲突（4.0.4 vs 3.20.1-1）→ 取 fork 侧值。
  4. 原 `c8c8461c`（重新加回 whats-new）：`AboutSection.tsx` 冲突 → `git checkout --ours`（内容已在新基线），提交变空被丢弃。
- 落地保真核对（12 个上游/fork 重叠文件）：把「上游 d35726e2→v4.0.4 的增删行集合」与「重放后 pre-sync-v404→main 的增删行集合」逐文件对比，全部为 `upstreamAddMissing=0 extraAdd=0 upstreamDelMissing=0 extraDel=0`，即上游改动一行不缺、fork 内容一行不丢（`commands/settings.rs`、`lib.rs`、`settings.rs`、`App.tsx`、`AboutSection.tsx`、`GeneralSection.tsx`、`RequestLogTable.tsx`、4 个 locales、`CHANGELOG.md`）。
- 本次重放未触发已知坑位：无 git 段错误（signal 11）、无 Shape recovery 事件（current 工作区重放全程未出现 'Native target specification declarations changed' / 'Native Shape artifacts changed'），`.comet/config.yaml` 未被历史重放改写（重放后仍为 `default_workflow: native` + `workflows: [native, classic]`）。
- 同步提交（`chore: sync fork with upstream v4.0.4`）：版本号 4.0.3-2 → 4.0.4-1（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`，`Cargo.lock` 由 `cargo check` 联动）、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订（lib.rs/commands/settings.rs/settings.rs/App.tsx/GeneralSection.tsx/AboutSection.tsx/CHANGELOG.md 的 v4.0.4 叠加语义与冲突解法）、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v404`）：change 目录移入 `docs/comet/archive/2026-10-08-sync-upstream-v404`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。fork tag `v4.0.4-1`（annotated）指向该提交。

### 同步范围

- 上游新增提交：merge-base d35726e2 → a29a4f38（v4.0.4 tag），共 6 个提交，覆盖 v4.0.4 全部发布内容：
  - f61dc5f5 fix(macos)：重启经 LaunchServices 重新拉起，窗口置前（`src-tauri/src/commands/settings.rs`、`src-tauri/src/lib.rs`）。
  - e09fdf04 feat(settings)：About 卡片 star prompt 独立可关闭条（`src/components/settings/AboutSection.tsx` + 4 个 locales）。
  - e0b36500 feat(profiles)：项目切换器默认隐藏（`src-tauri/src/settings.rs`、`src/App.tsx`、`src/components/settings/sections/GeneralSection.tsx`）。
  - 5b10d199 fix(usage)：窄窗口下速度列保持可见（`src/components/usage/RequestLogTable.tsx`）。
  - c2282a10 chore(release) v4.0.4：4 个版本文件 + `CHANGELOG.md`。
  - a29a4f38 docs(release)：v4.0.4 三语发行说明（`docs/release-notes/v4.0.4-{en,ja,zh}.md`）+ `src/whats-new/4.0.4.json`。
- 不做部分 cherry-pick：同步范围是 v4.0.4 tag 前的全量新增提交，一次 rebase 完成。
- 上游本次无删除、无重命名文件；新增文件（3 份发行说明、`src/whats-new/4.0.4.json`）随 rebase 干净进入。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 14 个文件：4 个版本文件 + `src-tauri/src/commands/settings.rs`、`src-tauri/src/lib.rs`、`src-tauri/src/settings.rs`、`src/App.tsx`、`src/components/settings/AboutSection.tsx`、`src/components/settings/sections/GeneralSection.tsx`、4 个 i18n locales。
- 仅上游改动、无 fork 改动的文件直接落上游版本：`src/components/usage/RequestLogTable.tsx`、`src/whats-new/4.0.4.json`、`docs/release-notes/v4.0.4-*.md`、`CHANGELOG.md`（fork 在 d35726e2..main 内未改过 `CHANGELOG.md`，与 merge-base 内容一致；白名单中"整文件保留 fork 侧"仅在 fork 侧确有改动时生效）。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：4 个版本文件的 fork 版本号、`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：上游 macOS 重启链路改动为基础；叠加 fork —— 移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册。
  - `src-tauri/src/commands/settings.rs`：上游重启命令改动为基础；保持 fork 的 connectivityTest sanitize 隔离与相关命令注册。
  - `src-tauri/src/settings.rs`：上游「项目切换器默认隐藏」的新默认值/字段为基础；叠加 fork 的 `VisibleSidebarPanels` 结构与 `AppSettings.visible_sidebar_panels`，两段并存。
  - `src/App.tsx`：上游项目切换器相关改动为基础；叠加 fork —— 批量连通性探针状态提升（`useConnectivityProbe`）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、`IS_FORK_BUILD` + `isTauri` 双守卫的 `setTitle` useEffect。
  - `src/components/settings/AboutSection.tsx`：上游 star prompt 独立可关闭条为基础并保留 whats-new 摘要入口；叠加 fork —— 「检查更新」/发行说明指向 fork GitHub Releases（tunecc/cc-switch）、禁用应用内更新器（移除 `isDownloading`/`installUpdateAndRestart`/`checkUpdate` 链路）。
  - `src/components/settings/sections/GeneralSection.tsx`：上游项目切换器默认值展示为基础；叠加 fork 的侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest）与 DevPanel 相关入口。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游新增 star prompt 键与删改键按上游执行；保留 fork 的 `devpanel` 段与 `connectivityTest` / `connectivityCheck` 键段。
  - 4 个版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`）：fork 侧 4.0.4-1。
- 本轮上游未改动 fork 预设文件、provider 表单链路、tray.rs、database/schema.rs、capabilities 与 CI 文件；这些文件上的 fork 语义随重放原样保留，不需要重新叠加。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 上游 v4.0.4 未推进 schema（仍为 20），本轮不新增迁移步骤；后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少 docs/comet/specs 全局规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）放在 handoff 提交前完成并接受最后一次确认。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- 能力关联撤销后，Runtime 在 `new` 时生成的 `specs/<capability>/delta.yaml` 模板仍留在 change 目录，会让 Shape 准备持续失败（`Native full target Spec does not match delta result`，即使 `spec_changes` 已为空）；须删除该残留模板后才能 `prepare-shape-confirmation`。本轮已删除。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.4-1`（同步前工作树为 4.0.3-2，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.4 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- 随后在归档提交上创建 annotated tag `v4.0.4-1` 并 `git push origin v4.0.4-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。
- 不创建 PR，不同步其他分支或远端。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + `hidden` 字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除）。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`AboutSection.tsx`（上游 star prompt 可关闭条与 fork 更新器禁用并存）、`GeneralSection.tsx` 与 `src-tauri/src/settings.rs`（上游项目切换器默认隐藏与 fork `VisibleSidebarPanels` 并存）、`src/App.tsx`（上游项目切换器改动与 fork 批量探针/setTitle 守卫并存）、`src-tauri/src/lib.rs` 与 `src-tauri/src/commands/settings.rs`（上游 macOS LaunchServices 重启链路与 fork 更新器移除/connectivity_test 注册并存）、`CHANGELOG.md`（本轮 fork 侧无改动，取上游版本）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不同步 v4.0.4 之后的 11 个 post-release 提交（含 upstream/main HEAD 5ae6ad38）。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，直接推送 main 与 tag。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = ea8d6bff），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
