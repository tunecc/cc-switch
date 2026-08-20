## Why

fork 打包出来的 app 名称（`productName` 与窗口标题）当前为 `CC Switch (Fork)`，但用户希望安装后看到的应用名就是 `CC Switch`，不要 `(Fork)` 后缀。窗口标题同理应显示 `CC Switch`。`identifier`（`com.ccswitch.desktop`）与 `auto_launch` 的 `app_name`（`CC Switch`）本就不带后缀、需保持不变，避免 deep-link `ccswitch://` 与系统启动项失效。

## What Changes

- `src-tauri/tauri.conf.json` 的 `productName` 由 `CC Switch (Fork)` 改为 `CC Switch`。
- `src-tauri/tauri.windows.conf.json` 的窗口 `title` 由 `CC Switch (Fork)` 改为 `CC Switch`。
- `src/App.tsx` macOS Overlay 启动时 `setTitle` 由 `"CC Switch (Fork)"` 改为 `"CC Switch"`。
- `src-tauri/tauri.dev.conf.json` 的 `productName` 与窗口 `title`（`CC Switch (Fork Dev)`）保持不变——dev 预览环境需与本机正式版区分，避免误操作正式版数据。
- `identifier` `com.ccswitch.desktop`、`auto_launch.rs` 中 `app_name "CC Switch"`、版本号 fork 后缀（`-fork.N` 或当前 `-1`）、`IS_FORK_BUILD` 编译期常量等**不变**；版本号仍可区分 fork 与上游。

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `fork-build-identity`：「Fork 窗口标题区分」Requirement 的可区分手段由「窗口/应用名显示 `CC Switch (Fork)`」改为「应用名统一为 `CC Switch`，仅靠版本号 fork 后缀与 `IS_FORK_BUILD` 行为区分」。`identifier` 与 `auto_launch` 不变的约束保留。

## Impact

- 受影响文件：`src-tauri/tauri.conf.json`、`src-tauri/tauri.windows.conf.json`、`src/App.tsx`；同步更新既有 spec `docs/openspec/specs/fork-build-identity/spec.md`、`docs/HOW_TO_REBASE_UPSTREAM.md` 白名单注释、README 相关措辞。
- 无新增/删除依赖、无后端命令变更、无 schema 变更、无 public API 变更。
- deep-link `ccswitch://`、系统启动项、本机已有正式版安装不受影响（identifier / app_name 不变）。
- macOS 卸载重装后应用名变化：旧 `CC Switch (Fork)` 安装会被新 `CC Switch` 覆盖（同 identifier），属预期。
