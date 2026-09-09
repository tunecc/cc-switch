# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持"始终可干净 rebase 到上游 farion1231/cc-switch main 之上"的同步状态。每次同步执行后，fork main = 上游 main 最新内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 upstream/main HEAD（本次为 f3b18df1，v3.20.2）。
- `git log upstream/main..main` 仅包含 fork 提交；每个 fork 提交内容与 rebase 前一一对应（数量相等、改动语义相同）。
- `git merge-base main upstream/main` == upstream/main HEAD。
- origin/main 在授权推送后与本地 main 一致（force-with-lease）。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- fork 专属白名单文件冲突时保留 fork 侧：`tauri.conf.json`（productName/version 等 fork 标识字段）、`package.json`（version）、`src-tauri/Cargo.toml`（version）、`vite.config.ts`（`__CCS_FORK_BUILD__` define）、`src/config/forkBuild.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src/App.tsx`（IS_FORK_BUILD+isTauri 双守卫 setTitle）、`src/components/settings/SettingsPage.tsx`（DevPanel 入口）、`src/vite-env.d.ts`、locales 的 `devpanel` 段、`tests/msw/tauriMocks.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`tests/setupTests.ts`（forkBuild mock 段）、本流程文档自身、`docs/openspec|comet` 产物目录、`.gitignore` 末尾 fork 工具产物段。
- 共享文件冲突时取上游版本，再手动叠加 fork 必要改动：`src-tauri/src/commands/misc.rs`、`src-tauri/src/database/schema.rs`、`src-tauri/src/database/tests.rs`、`src-tauri/src/provider.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs`、`src-tauri/src/services/provider/live.rs`、`src/components/providers/forms/BasicFormFields.tsx`、`src/components/settings/AboutSection.tsx`、`src/contexts/UpdateContext.tsx`、`src/config/*ProviderPresets.ts` ×8、四个 i18n locales 的共享段。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`：`3.20.2-1`。
- 语义：上游版本号 + `-1`（fork 在该上游版本上的第一代魔改版本），沿用 dadde129 惯例。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch (Fork)"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、后端 AppSettings 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + 隐藏字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- README fork 差异说明与构建说明。
- CI：仅构建 Windows x64 与 macOS arm64 unsigned；禁用应用内更新器（指向 GitHub Releases）。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充上次同步后新增的 fork 专属文件：连通性测试（`src-tauri/src/services/connectivity*` 等新后端文件、`src/components/connectivity*` 等新前端文件、四语言 locales 的 connectivity 键）、双官网链接、托盘左键切换、模型快捷切换新增文件等，使下一次同步的冲突处理有据可依。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。用户已明确接受此例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不清理本地遗留分支。
- 未授权时不推送远端。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（22f5f1a1），工作区恢复原状。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录。
- 推送未被授权：本地完成态即为交付终点，A10 保持未执行并注明原因。
