## 1. 分支与基础设施

- [x] 1.1 从当前 main 创建分支 `feat/fork-scaffolding`，确认 `git status` 干净、`git log` 与 origin/main 一致
- [x] 1.2 新增 `docs/HOW_TO_REBASE_UPSTREAM.md`，包含四节：upstream remote 添加、rebase 上游 main 标准流程、冲突处理约定、fork 专属文件白名单（tauri.conf.json 的 productName/version、package.json version、Cargo.toml version、vite.config.ts 的 define、src/config/forkBuild.ts、src/components/devpanel/、docs/HOW_TO_REBASE_UPSTREAM.md 本身、docs/openspec/）。同时在 `.gitignore` 增加 Comet/Superpowers 工具产物忽略段（`.agents/ .amazonq/ .cline/ .cursor/ .windsurf/ skills-lock.json` 等 30+ 个多平台 skills 镜像目录，以及 `/.github/hooks/ /instructions/ /prompts/ /skills/`），使 fork 仓库只保留魔改代码与 Comet change 文档

## 2. A 层：fork 构建版本号与 productName

- [x] 2.1 统一修改版本号与 productName：`package.json` 的 `version`、`src-tauri/Cargo.toml` 的 `version`、`src-tauri/tauri.conf.json` 的 `version` 均改为 `3.19.2-fork.1`；`tauri.conf.json` 的 `productName` 改为 `CC Switch (Fork)`；`src-tauri/tauri.windows.conf.json` 的窗口 `title` 改为 `CC Switch (Fork)`。校验三处版本号字符串完全相同；不修改 `identifier`（`com.ccswitch.desktop`）与 `src-tauri/src/auto_launch.rs` 的 `app_name`（`CC Switch`）。提交（commit: `feat(fork): bump version to 3.19.2-fork.1 and rename product to CC Switch (Fork)`）

## 3. A 层：编译期常量与统一访问层

- [x] 3.1 注入编译期 fork 常量：`vite.config.ts` 增加 `define: { __CCS_FORK_BUILD__: JSON.stringify(true) }`；`src/vite-env.d.ts` 增加 `declare const __CCS_FORK_BUILD__: boolean;`；新增 `src/config/forkBuild.ts` 导出 `export const IS_FORK_BUILD = __CCS_FORK_BUILD__ as boolean;`。运行 `pnpm typecheck` 确认无 `__CCS_FORK_BUILD__` 未定义错误。提交（commit: `feat(fork): inject __CCS_FORK_BUILD__ compile-time constant`）

## 4. A 层：macOS 窗口标题动态设置

- [x] 4.1 macOS 窗口标题动态设置：在 `src/App.tsx` 初始化处（或 `src/main.tsx`），当 `IS_FORK_BUILD` 为 true 时调用 `getCurrentWindow().setTitle("CC Switch (Fork)")`，import 来源为 `@tauri-apps/api/window`（项目已用），不引入新依赖。确认 Windows 路径已由 `tauri.windows.conf.json` 写死 title，无需前端处理。运行 `pnpm typecheck` 通过。提交（commit: `feat(fork): set macOS window title to CC Switch (Fork) on startup`）

## 5. B 层：Dev 预览面板与入口

- [x] 5.1 新增 DevPanel 组件与设置页入口：新增 `src/components/devpanel/DevPanel.tsx`，仅当 `IS_FORK_BUILD` 为 true 时渲染内容；展示 fork 版本号、构建模式、fork 标识徽章、上游同步状态占位、后续魔改功能占位区；用现有 Dialog/Sheet 组件承载。在 `src/components/settings/SettingsPage.tsx` 的 footer 区域加一个 `Fork` 角标按钮，仅当 `IS_FORK_BUILD` 为 true 时渲染，点击打开 DevPanel。为 DevPanel 与角标添加 i18n key（`devpanel.*`，至少补 zh 与 en）。运行 `pnpm typecheck` 通过。提交（commit: `feat(fork): add DevPanel and settings footer entry`）

## 6. 验证与收尾

- [x] 6.1 运行 `pnpm typecheck` 通过
- [x] 6.2 运行 `pnpm test:unit` 通过，确认未破坏现有测试（987/987 pass，与基线 fd14f9c4 一致）
- [x] 6.3 运行 `pnpm dev:renderer`（vite dev server，3000 端口）确认前端启动无错；forkBuild 模块编译期常量 `IS_FORK_BUILD = true` 正确注入。完整 `pnpm tauri dev`（Rust 1.95 toolchain 编译）留待用户本机验证（本机无 rustup，仅有 Homebrew rustc 1.97，无法满足 rust-toolchain.toml pin 1.95）
- [x] 6.4 确认原版功能不受影响：供应商切换、Skills/MCP/Sessions、代理等入口仍可见可用（手动巡检）— 用户本机 `pnpm dev:fork` 巡检通过：fork dev 版独立窗口 `CC Switch (Fork Dev)` 启动正常，独立配置目录隔离（CC_SWITCH_TEST_HOME），原版 CC Switch 不受影响
- [x] 6.5 `comet classic openspec -- validate ccs-fork-scaffolding` 通过
- [x] 6.6 在 `feat/fork-scaffolding` 分支确认所有改动已提交（commit message 遵循项目 conventional commits 风格）
