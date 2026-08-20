# fork-build-identity Delta

## MODIFIED Requirements

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
