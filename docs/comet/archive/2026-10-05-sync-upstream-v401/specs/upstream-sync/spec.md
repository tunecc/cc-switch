# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持"始终可干净 rebase 到上游 farion1231/cc-switch main 之上"的同步状态。每次同步执行后，fork main = 上游 main 最新内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 upstream/main HEAD（本次为 4804b723，v4.0.1）。
- `git log upstream/main..main` 仅包含 fork 提交；fork 全部改动语义保留。原始 110 个提交中 106 个逐一重放，4 个按下列映射处理，另加本次同步提交：
  - `ci: stop flaky WSL2 linker job from blocking main`：上游提交（经旧同步进入 fork 历史），v4.0.1 已包含等价内容，git rebase 自动判定冗余跳过；
  - `fix: apply skills visibility guard to hermes branch toolbar button`：其门控语义已被 v4 Sidebar 全局面板过滤架构取代；
  - `feat: surface Claude fallback model as quick-access section below endpoint` 与 `feat: align fallback-model quick-set buttons with model input right edge`：因上游重写 ProviderForm 合并为一个提交重放（提交说明已注明）；
  - fork 历史中「后端直连执行器」存在同题重复提交，合并为一。
- `git merge-base main upstream/main` == upstream/main HEAD。
- origin/main 在本次授权的推送后与本地 main 一致（force-with-lease）。

### 同步范围

- 上游新增提交：merge-base 8e478b2b（v3.20.4）→ upstream/main 4804b723（v4.0.1），共 220 个提交，覆盖上游 v3.21 至 v4.0.1 全部发布内容。
- 不做部分 cherry-pick：同步范围是 upstream/main 全量新增提交，一次 rebase 完成。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- fork 专属白名单文件冲突时保留 fork 侧：`tauri.conf.json`（productName/version 等 fork 标识字段）、`package.json`（version）、`src-tauri/Cargo.toml`（version）、`src-tauri/Cargo.lock`（与版本号联动）、`vite.config.ts`（`__CCS_FORK_BUILD__` define）、`vitest.config.ts`（`__CCS_FORK_BUILD__` define 与 `testTimeout`）、`src/config/forkBuild.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/App.tsx`（IS_FORK_BUILD+isTauri 双守卫 setTitle）、`src/components/settings/SettingsPage.tsx`（DevPanel 入口）、`src/vite-env.d.ts`、locales 的 `devpanel` 与 `connectivityTest` / `connectivityCheck` 键段、`tests/msw/tauriMocks.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`tests/setupTests.ts`（forkBuild mock 段）、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`CHANGELOG.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、本流程文档自身、`.gitignore` 末尾 fork 工具产物段。
- 共享文件冲突时取上游版本，再手动叠加 fork 必要改动：`src-tauri/src/lib.rs`（托盘左键切换主窗口）、`src/components/settings/AboutSection.tsx`（检查更新指向 fork GitHub Releases）、`src/components/proxy/RoutingActivationBrand.tsx`（左上角品牌链接指向 `https://github.com/farion1231/cc-switch`）、`src/contexts/UpdateContext.tsx` 与 `src/lib/updater.ts`（关闭应用内自动更新）、`src/config/*ProviderPresets.ts` ×8（`hidden` 字段与官方预设过滤）、`src/lib/schemas/provider.ts`（`websiteUrl2`）、`src-tauri/src/commands/misc.rs` 等后端共享文件（连通性测试命令注册与 sanitize 隔离）、四个 i18n locales 的共享段。
- 冲突面规模：上游改动涉及 797 个文件、fork 改动涉及 387 个文件，重叠约 89 个文件；重叠文件中包含上游亦有改动的版本文件、locales、provider 表单与后端 service 等，逐个按上述约定解决。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本（ORIG_HEAD 指向 rebase 起点 6a54138e）。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.1-1`（同步前工作树为 3.20.4-1，重放过程途经历史版本号）。
- 同步基线为 upstream/main 4804b723（v4.0.1）；同步期间 upstream 又有 5 个 post-release 提交（至 d455dd85），不在本次已确认范围内。
- 语义：上游版本号 + `-1`（fork 在该上游版本上的第一代魔改版本），沿用既有惯例。

### 工作区未提交改动

- 同步前工作区干净；已进入 git 历史的 `vitest.config.ts` `testTimeout: 30000` 随历史重放保留。
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
- 供应商双官网链接（主页横排双链接）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 主页左上角品牌链接指向 `https://github.com/farion1231/cc-switch`。
- 上游 tag 的发版构建跳过（fork CI 裁剪）。
- README fork 差异说明与构建说明。
- CI：仅构建 Windows x64 与 macOS arm64 unsigned；禁用应用内更新器（指向 GitHub Releases）。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件，使下一次同步的冲突处理有据可依。
- `vitest.config.ts` 的保留范围包含 `testTimeout`。
- `src-tauri/Cargo.lock` 的版本联动保留范围纳入白名单说明。

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

- rebase 中断/失败：`git rebase --abort` 回到起点（6a54138e），工作区恢复原状。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
