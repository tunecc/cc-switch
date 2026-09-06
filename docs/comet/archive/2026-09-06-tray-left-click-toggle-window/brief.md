# 目标

托盘图标左键单击切换主窗口显示/隐藏：主窗口未显示（已隐藏或已最小化）时左键单击显示并聚焦主窗口；主窗口可见时再次左键单击将其隐藏到托盘。右键单击保持现状（弹出托盘菜单）。

# 范围

- `src-tauri/src/tray.rs`：新增主窗口显示/隐藏/切换助手——显示路径复用现有"打开主界面"（`show_main`）语义（unminimize + show + set_focus，Windows `set_skip_taskbar(false)`、macOS `apply_tray_policy(true)`、Linux nudge、轻量模式退出重建）；隐藏路径镜像"关闭到托盘"（`CloseRequested` 且 `minimize_to_tray_on_close`）分支（hide，Windows `set_skip_taskbar(true)`、macOS `apply_tray_policy(false)`）。`show_main` 菜单事件改为复用显示助手。
- `src-tauri/src/lib.rs`：托盘构建处 `show_menu_on_left_click(true)` 改为 `false`；`on_tray_icon_event` 中识别左键 `Click`（`MouseButton::Left` 且 `button_state` 为 `Up`）并调用切换助手；macOS `RunEvent::Reopen` 复用显示助手；Enter/Click 触发的用量刷新逻辑保持不变。

# 非目标

- 右键菜单内容与各菜单项行为不变；不调整菜单构建、`TrayTexts` 国际化。
- 不新增托盘行为相关设置项：左键切换作为默认行为直接启用，无开关。
- Linux 平台的左键切换：tray-icon 0.21.3 的 GTK/appindicator 后端不产生 `TrayIconEvent::Click`，技术上无法实现；Linux 上点击托盘仍弹菜单，行为保持现状。
- 不改变关闭按钮（`CloseRequested`）、静默启动、轻量模式菜单开关等既有显示/隐藏路径的语义。

# 验收示例

- A1: 主窗口隐藏时左键单击托盘图标：主窗口显示、置前并聚焦；主窗口已最小化时左键单击：还原、置前并聚焦（而非被隐藏）。
- A2: 应用处于轻量模式（主窗口已销毁）时左键单击托盘图标：退出轻量模式并重建、显示主窗口。
- A3: 主窗口可见（未最小化）时左键单击托盘图标：主窗口隐藏；macOS 上 Dock 图标同步隐藏，Windows 上任务栏不再显示该窗口（平台处理与"关闭到托盘"一致）。
- A4: 连续左键单击按"显示 → 隐藏 → 显示"稳定往返；一次左键单击恰好触发一次切换（macOS/Windows 每次点击产生的按下/抬起两次 `Click` 事件不造成双重切换）。
- A5: macOS 与 Windows 上左键单击托盘图标不再弹出托盘菜单。
- A6: 右键单击仍弹出托盘菜单，菜单结构与各菜单项行为与改造前一致；主窗口隐藏时通过菜单"打开主界面"仍可显示窗口。
- A7: 既有行为不回归：托盘悬停/点击的用量刷新（10 秒防抖）照常；macOS Dock Reopen 重新激活显示主窗口的行为不变。
- A8: `cargo fmt --check`、`cargo clippy -- -D warnings`、`cargo test`（src-tauri）与 `pnpm test:unit`、`pnpm typecheck` 全部通过。

# 约束与不变量

- 切换只响应 `MouseButton::Left` 且 `button_state` 为 `Up` 的 `Click` 事件；`TrayIconEvent::Enter`/`Click` 触发的用量刷新（含防抖）保持原样。
- 隐藏路径与 `CloseRequested`（`minimize_to_tray_on_close`）分支的平台处理一致：Windows `set_skip_taskbar(true)`、macOS `apply_tray_policy(app, false)`；显示路径与 `show_main`/Reopen 一致：Windows `set_skip_taskbar(false)`、`unminimize + show + set_focus`、Linux nudge、macOS `apply_tray_policy(app, true)`。
- 不新增依赖；不改托盘图标、tooltip、菜单构建与 `TRAY_ID`。

# 决策

- D1（切换语义）：采用字面可见性切换——窗口可见（无论是否聚焦）即隐藏，隐藏或最小化即显示+聚焦。理由：与用户描述"单击显示、再次单击隐藏"完全一致，行为确定可预测；"仅可见且聚焦才隐藏"的变体依赖窗口焦点判定，而点击托盘时宿主焦点状态在 macOS 上不可靠，可能破坏核心往返语义。
- D2（隐藏路径平台处理）：隐藏时镜像"关闭到托盘"处理（Windows `set_skip_taskbar(true)`、macOS 隐藏 Dock 图标），显示时镜像"打开主界面"处理。理由：与项目既有"窗口隐藏 ⇔ Dock/任务栏隐藏"约定（静默启动、关闭到托盘）一致，避免隐藏后任务栏残留。
- D3（无设置开关）：左键切换默认启用，不增加设置项。理由：用户未要求配置；右键菜单仍提供"打开主界面"等全部功能，无需退路开关。
- D4（平台范围）：左键切换仅承诺 macOS 与 Windows。理由：Linux GTK/appindicator 后端不产生托盘点击事件（tray-icon 0.21.3 平台实现），无法拦截左键；Linux 保持现状属于平台限制而非功能回退。

# 待解决问题

（无。目标、范围、关键决定 D1–D4、验收 A1–A8 与非目标已于 2026-09-06 经用户确认。）

# 验证预期

- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`、`cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`、`cargo test --manifest-path src-tauri/Cargo.toml` 通过（与 CI 一致）。
- 前端无改动：`pnpm test:unit`、`pnpm typecheck` 通过（确认不受影响）。
- macOS 本机手动验收：A1–A7 中可本机观察的项（左键往返切换、右键菜单、菜单"打开主界面"、轻量模式左键重建、Dock 隐藏/恢复）；Windows 平台差异以代码审读 + CI 三平台 `cargo test` 为准。
- 切换助手逻辑以代码审读 + 既有托盘单测（`cargo test`）为准；窗口行为无既有 e2e 基建，不新增 e2e。
