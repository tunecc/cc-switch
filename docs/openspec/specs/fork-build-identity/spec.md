# fork-build-identity Specification

## Purpose
定义 fork 版 cc-switch 在构建产物、窗口标题、编译期常量上与上游可区分，并提供仅 fork 构建可用的开发预览面板，作为后续魔改功能的集中预览入口。
## Requirements
### Requirement: Fork 构建版本号标识

fork 构建 SHALL 在 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 三处使用一致的版本号，且版本号 MUST 以 `-fork.N` 后缀标记（N 为从 1 起的整数），使 fork 构建产物与上游可通过版本号区分。

#### Scenario: 三处版本号一致且带 fork 后缀
- **WHEN** 检查 fork 构建的版本号配置
- **THEN** `package.json` 的 `version`、`src-tauri/Cargo.toml` 的 `version`、`src-tauri/tauri.conf.json` 的 `version` 三者字符串完全相同，且匹配 `^\d+\.\d+\.\d+-fork\.\d+$`

### Requirement: Fork 窗口标题区分

fork 构建的安装产物名与窗口标题 MUST 显示为 `CC Switch`（不带 `(Fork)` 后缀），与上游应用名保持一致，便于用户在系统中识别。可区分性 SHALL 仅通过版本号 fork 后缀（`-fork.N`，见「Fork 构建版本号标识」Requirement）与 `IS_FORK_BUILD` 编译期常量门控的 fork 专属行为提供，不依赖应用名/窗口标题文字区分。macOS Overlay 标题栏 SHALL 在启动时动态设置窗口标题为 `CC Switch`；Windows Visible 标题栏 SHALL 在 `tauri.windows.conf.json` 写死 `CC Switch`。`identifier`（`com.ccswitch.desktop`）与 `auto_launch` 的 `app_name`（`CC Switch`）MUST 保持不变，避免 deep-link `ccswitch://` 与系统启动项失效。dev 预览构建（`tauri.dev.conf.json`）SHALL 保留 `CC Switch (Fork Dev)` 标识，与本机正式版安装区分。

#### Scenario: macOS 窗口标题

- **WHEN** 在 macOS 上启动 fork 构建
- **THEN** 窗口标题显示为 `CC Switch`（不含 `(Fork)` 后缀）

#### Scenario: Windows 窗口标题

- **WHEN** 在 Windows 上启动 fork 构建
- **THEN** 窗口标题显示为 `CC Switch`（不含 `(Fork)` 后缀）

#### Scenario: 安装产物名

- **WHEN** 打包 fork 构建产物
- **THEN** 应用 `productName` 为 `CC Switch`，安装后系统显示的应用名为 `CC Switch`

#### Scenario: identifier 与启动项不变

- **WHEN** 检查 fork 构建配置
- **THEN** `identifier` 仍为 `com.ccswitch.desktop`，`auto_launch.rs` 中 `app_name` 仍为 `CC Switch`

#### Scenario: dev 预览构建仍区分

- **WHEN** 运行 `pnpm dev:fork` 启动 dev 预览构建
- **THEN** `productName` 与窗口标题为 `CC Switch (Fork Dev)`，与本机正式版安装区分

### Requirement: Fork 编译期常量

fork 构建 SHALL 通过 vite `define` 注入编译期全局常量 `__CCS_FORK_BUILD__`（boolean），在 fork 仓库内恒为 `true`。前端 SHALL 通过 `src/config/forkBuild.ts` 导出的 `IS_FORK_BUILD` 访问该常量，不得在业务代码中直接引用裸常量。TypeScript 类型声明 MUST 同步声明 `__CCS_FORK_BUILD__: boolean`，保证 `pnpm typecheck` 通过。

#### Scenario: 常量在 fork 构建为 true
- **WHEN** 编译期解析 `__CCS_FORK_BUILD__`
- **THEN** 其值为 `true`，且 `IS_FORK_BUILD` 导出为 `true`

#### Scenario: 类型声明存在
- **WHEN** 运行 `pnpm typecheck`
- **THEN** 不出现 `__CCS_FORK_BUILD__` 未定义的类型错误

### Requirement: Dev 预览面板仅 fork 可用

Dev 预览面板（DevPanel）SHALL 仅在 `IS_FORK_BUILD` 为 `true` 时渲染并暴露入口。面板入口 SHALL 放置在设置页 footer 的一个不显眼 `Fork` 角标按钮上，点击后打开 DevPanel。面板 SHALL 展示 fork 信息：版本号、构建模式、fork 标识徽章、上游同步状态占位、后续魔改功能占位区。当 `IS_FORK_BUILD` 为 `false` 时，入口与面板 MUST 不可见且不可达。

#### Scenario: fork 构建显示入口与面板
- **WHEN** 在 fork 构建的设置页 footer 点击 `Fork` 角标
- **THEN** DevPanel 打开并展示 fork 信息

#### Scenario: 上游构建不显示入口
- **WHEN** 在 `IS_FORK_BUILD` 为 `false` 的构建中查看设置页
- **THEN** footer 不出现 `Fork` 角标，DevPanel 不可达

### Requirement: 上游同步工作流文档

fork 仓库 SHALL 包含 `docs/HOW_TO_REBASE_UPSTREAM.md`，说明 upstream remote 添加、rebase 上游 main 的标准流程、冲突处理约定、fork 专属文件白名单（tauri.conf.json 的 productName/version、package.json version、Cargo.toml version、vite.config.ts 的 define、src/config/forkBuild.ts、src/components/devpanel/）。

#### Scenario: 文档存在且覆盖必要章节
- **WHEN** 检查 `docs/HOW_TO_REBASE_UPSTREAM.md`
- **THEN** 文档包含 upstream remote 添加、rebase 流程、冲突处理约定、fork 专属文件白名单四个部分

