## Why

本仓库是 farion1231/cc-switch 的 fork，后续会在其上叠加多个魔改功能（预设精简、表单布局、模型搜索、主页模型切换、侧边面板显隐等），且需要持续可同步上游。当前没有任何 fork 专属的构建标识与预览机制：fork 构建产物与上游完全无法区分，开发期间无法在不影响当前使用 CC Switch 的前提下集中预览魔改功能。需要先建立 fork 基础设施，作为后续所有魔改的基线。

## What Changes

- **fork 构建标识（A 层）**
  - 版本号统一加 `-fork.N` 后缀：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 三处版本一致（首个为 `3.19.2-fork.1`）。
  - `productName` 改为 `CC Switch (Fork)`（`tauri.conf.json` 与 `tauri.windows.conf.json` 的窗口标题）。
  - vite 编译期注入全局常量 `__CCS_FORK_BUILD__`（boolean），fork 仓库内恒为 `true`；新增 `src/config/forkBuild.ts` 统一导出 `IS_FORK_BUILD`，并在 `vite-env.d.ts` 声明类型。
  - macOS Overlay 标题栏在 fork 构建启动时动态设置窗口标题为 `CC Switch (Fork)`（Windows 已在 conf 写死）。
- **Dev 预览面板（B 层）**
  - 新增 `src/components/devpanel/DevPanel.tsx`，仅 `IS_FORK_BUILD` 时可用；展示 fork 信息（版本、构建模式、fork 徽章、上游同步状态占位、后续魔改功能占位区）。
  - 设置页 footer 加一个不显眼的 `Fork` 角标按钮（仅 `IS_FORK_BUILD` 可见），点击打开 DevPanel。
- **分支与文档**
  - 新建分支 `feat/fork-scaffolding`（从当前 main）。
  - 新增 `docs/HOW_TO_REBASE_UPSTREAM.md`：upstream remote 添加、rebase 流程、冲突处理约定、fork 专属文件白名单。
- **不变项**
  - `identifier`（`com.ccswitch.desktop`）保持不变，避免 deep-link `ccswitch://` 与 auto_launch 失效。
  - `auto_launch.rs` 中 `app_name = "CC Switch"` 保持不变，避免系统启动项失效。

## Capabilities

### New Capabilities
- `fork-build-identity`: fork 版构建标识与开发预览面板。定义 fork 构建在版本号、窗口标题、编译期常量上与上游可区分；定义 Dev 预览面板仅在 fork 构建下可用、入口位置与展示内容契约。

### Modified Capabilities
<!-- 无既有 spec 需修改；本仓库 specs/ 目前为空。 -->

## Impact

- **构建配置**：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/tauri.windows.conf.json`、`vite.config.ts`、`src/vite-env.d.ts`。
- **新增源码**：`src/config/forkBuild.ts`、`src/components/devpanel/DevPanel.tsx`。
- **改动源码**：`src/App.tsx` 或 `src/components/settings/SettingsPage.tsx`（注入 Fork 角标入口）；`src/main.tsx` 或 `App.tsx`（macOS 启动时设置窗口标题）。
- **文档**：`docs/HOW_TO_REBASE_UPSTREAM.md`。
- **依赖**：无新增依赖；复用 `@tauri-apps/api/window` 已有能力与现有 UI 组件（Dialog/Sheet/按钮）。
- **风险**：版本号三处必须一致；vite `define` 注入需同步 TS 声明，否则 `pnpm typecheck` 失败；不修改 identifier 与 auto_launch app_name 以维持 deep-link 与系统启动项。
