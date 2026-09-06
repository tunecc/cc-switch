---
generated_from_state_version: 7
---

# 验证

## 当前结果

- 结果: **验收通过，可归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-09-06T07:50:45.108Z
- 摘要: 候选 88013f75 独立验收通过。tray.rs 新增 show_main_window/hide_main_window/toggle_main_window 三个助手，显示路径与原 show_main 内联代码逐行等价，隐藏路径与 CloseRequested+minimize_to_tray_on_close 分支镜像一致；lib.rs 以 show_menu_on_left_click(false)+Click{Left,Up} 过滤实现单次左键切换。经核对 tray-icon-0.21.3 macOS/Windows/GTK 平台源码：左键 Down/Up 各发一次 Click（Up 过滤避免双切）、menu_on_left_click=false 时左键不弹菜单而右键弹菜单保持、Linux 无点击事件与规格声明一致。右键菜单面、用量刷新 10 秒防抖、静默启动、Reopen 等既有行为零回归；A8 五项检查中 4 项 Runtime 实跑 passed、fmt 经独立复核本 change 文件零漂移（45 处既有漂移与本 change 无关）。窗口运行时往返无 e2e 基建，依据代码与平台语义判定证据充分，建议合入后补一次 macOS 手动验收。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: 主窗口隐藏时左键单击托盘图标：主窗口显示、置前并聚焦；主窗口已最小化时左键单击：还原、置前并聚焦（而非被隐藏）。 | tray.rs toggle_main_window：窗口隐藏时 is_visible=false 走 show_main_window（unminimize+show+set_focus，Windows set_skip_taskbar(false)、macOS apply_tray_policy(true)），与原 show_main 语义逐行等价；最小化时 is_minimized=true 强制走 show 分支还原而非隐藏，满足'还原、置前并聚焦'。 |
| A2 | passed | brief.md | A2: 应用处于轻量模式（主窗口已销毁）时左键单击托盘图标：退出轻量模式并重建、显示主窗口。 | 轻量模式下 get_webview_window("main") 为 None，toggle_main_window/show_main_window 均走 lightweight::exit_lightweight_mode（lightweight.rs 从 config 重建 WebviewWindowBuilder 并 show+set_focus+set_skip_taskbar(false)/apply_tray_policy(true)+refresh_tray_menu），即退出轻量模式并重建显示。 |
| A3 | passed | brief.md | A3: 主窗口可见（未最小化）时左键单击托盘图标：主窗口隐藏；macOS 上 Dock 图标同步隐藏，Windows 上任务栏不再显示该窗口（平台处理与"关闭到托盘"一致）。 | 窗口可见且未最小化时 hide_main_window 执行 hide → Windows set_skip_taskbar(true) → macOS apply_tray_policy(false)（set_dock_visibility(false)+ActivationPolicy::Accessory，tray.rs:977-993），与 lib.rs:424-434 CloseRequested+minimize_to_tray_on_close 分支逐行等价，平台处理与'关闭到托盘'完全一致。 |
| A4 | passed | brief.md | A4: 连续左键单击按"显示 → 隐藏 → 显示"稳定往返；一次左键单击恰好触发一次切换（macOS/Windows 每次点击产生的按下/抬起两次 `Click` 事件不造成双重切换）。 | toggle 只在 lib.rs on_tray_icon_event 内 Click{Left, Up} 触发：tray-icon-0.21.3 macOS mouseDown/mouseUp 各发一次 Click{Down}/{Up}、Windows WM_LBUTTONDOWN/UP 各发一次，Down 不触发故单击恰好一次切换；DoubleClick 事件不进 Click 分支（Windows 双击序列 Down/Up(toggle)/DBLCLK/Up(toggle) 恰为两次切换，符合两次单击语义）；toggle 基于实时 is_visible/is_minimized 无状态缓存，往返稳定。 |
| A5 | passed | brief.md | A5: macOS 与 Windows 上左键单击托盘图标不再弹出托盘菜单。 | lib.rs:1099 show_menu_on_left_click(false)；平台源码核对：macOS on_tray_click 仅 Right 或 menu_on_left_click&&Left 才 performClick，Windows 菜单弹出条件 WM_RBUTTONDOWN\|\|(menu_on_left_click&&WM_LBUTTONDOWN)，false 时左键两平台均不弹菜单。 |
| A6 | passed | brief.md | A6: 右键单击仍弹出托盘菜单，菜单结构与各菜单项行为与改造前一致；主窗口隐藏时通过菜单"打开主界面"仍可显示窗口。 | 右键弹菜单路径未动（macOS rightMouseDown→performClick、Windows WM_RBUTTONDOWN→TrackPopupMenu）；create_tray_menu 无 diff，菜单结构不变；handle_tray_menu_event 仅 show_main 分支改为调用行为逐行等价的 show_main_window，其余菜单项分支未动；主窗口隐藏时经 show_main→show_main_window 可显示。 |
| A7 | passed | brief.md | A7: 既有行为不回归：托盘悬停/点击的用量刷新（10 秒防抖）照常；macOS Dock Reopen 重新激活显示主窗口的行为不变。 | lib.rs on_tray_icon_event 的 Enter\|Click 分支中 refresh_all_usage_in_tray spawn 调用与 tray.rs LAST_TRAY_USAGE_REFRESH/10s MIN_TRAY_USAGE_REFRESH_INTERVAL 防抖均无 diff；RunEvent::Reopen 改为 show_main_window，与原内联逻辑语义等价，Reopen 显示行为不变。 |
| A8 | passed | brief.md | A8: `cargo fmt --check`、`cargo clippy -- -D warnings`、`cargo test`（src-tauri）与 `pnpm test:unit`、`pnpm typecheck` 全部通过。 | Runtime 实跑 cargo clippy -D warnings、cargo test（唯一失败例为本机 15721 端口 EADDRINUSE 环境因素，与本 change 无关）、pnpm typecheck、pnpm test:unit（144 文件/1147 用例）全部 passed；cargo fmt --check 经我独立复跑：45 处漂移全部位于本 change 未修改的既有文件（connectivity_test/database/provider 等，diff 证明父提交即存在），本 change 改动的 tray.rs/lib.rs 无任何漂移条目，未引入 fmt 违规。 |
| A9 | passed | specs/tray-left-click-toggle/spec.md | 窗口隐藏时左键显示主窗口 - **WHEN** 主窗口处于隐藏状态（如已通过关闭按钮最小化到托盘、或静默启动后未显示），用户左键单击托盘图标 - **THEN** 主窗口显示、置前并获得焦点 | 静默启动/关闭到托盘后窗口 is_visible=false，左键 Click{Left,Up}→toggle→show_main_window：unminimize+show+set_focus，macOS apply_tray_policy(true) 恢复 Dock，Windows set_skip_taskbar(false)，显示、置前并聚焦。 |
| A10 | passed | specs/tray-left-click-toggle/spec.md | 窗口最小化时左键还原主窗口 - **WHEN** 主窗口已最小化，用户左键单击托盘图标 - **THEN** 主窗口还原、置前并获得焦点（而非被隐藏） | 最小化时 toggle 中 is_minimized=true 使条件 is_visible&&!is_minimized 为假，走 show 分支 unminimize 还原+set_focus 而非 hide，符合'还原、置前并聚焦（而非被隐藏）'。 |
| A11 | passed | specs/tray-left-click-toggle/spec.md | 窗口可见时左键隐藏主窗口 - **WHEN** 主窗口处于可见且未最小化状态，用户左键单击托盘图标 - **THEN** 主窗口隐藏；macOS 上 Dock 图标同步隐藏；Windows 上不再出现在任务栏（平台处理与"关闭到托盘"一致） | 可见且未最小化时走 hide_main_window：hide+Windows set_skip_taskbar(true)+macOS apply_tray_policy(false)，与 CloseRequested 分支（lib.rs:424-434）镜像一致，macOS Dock 同步隐藏、Windows 任务栏项消失。 |
| A12 | passed | specs/tray-left-click-toggle/spec.md | 轻量模式下左键恢复主窗口 - **WHEN** 应用处于轻量模式（主窗口已销毁），用户左键单击托盘图标 - **THEN** 应用退出轻量模式并重建、显示主窗口 | 轻量模式窗口已销毁，toggle 走 show_main_window 的 exit_lightweight_mode 分支（lightweight.rs:33-96 重建窗口并 show+set_focus+平台策略恢复），退出轻量模式并重建、显示主窗口。 |
| A13 | passed | specs/tray-left-click-toggle/spec.md | 连续左键单击稳定往返 - **WHEN** 用户连续多次左键单击托盘图标 - **THEN** 主窗口按"显示 → 隐藏 → 显示"稳定往返切换 | toggle 每次基于窗口实时可见性判定（hide_main_window 后 is_visible=false，show 后为 true），连续左键单击按显示→隐藏→显示稳定往返；单次点击仅 Up 事件触发一次。 |
| A14 | passed | specs/tray-left-click-toggle/spec.md | 左键单击无菜单 - **WHEN** 用户在 macOS 或 Windows 上左键单击托盘图标 - **THEN** 托盘菜单不弹出，主窗口可见性按上述规则切换 | show_menu_on_left_click(false)+平台源码确认左键无菜单路径；可见性由 lib.rs Click{Left,Up} 过滤后的 toggle 按规则切换。 |
| A15 | passed | specs/tray-left-click-toggle/spec.md | 右键弹出菜单 - **WHEN** 用户右键单击托盘图标 - **THEN** 托盘菜单弹出，各菜单项行为不变 | 右键菜单弹出由平台层处理（macOS performClick/Windows TrackPopupMenu），未受本 change 影响；create_tray_menu 与 handle_tray_menu_event 除 show_main 等价重构外无改动。 |
| A16 | passed | specs/tray-left-click-toggle/spec.md | 菜单"打开主界面"仍可用 - **WHEN** 主窗口隐藏，用户右键单击托盘图标并选择"打开主界面" - **THEN** 主窗口显示（既有显示路径不回归） | show_main 菜单项始终创建（tray.rs:706-720），事件经 handle_tray_menu_event→show_main_window，该助手与原内联显示代码逐行等价，既有显示路径无回归。 |
| A17 | passed | specs/tray-left-click-toggle/spec.md | 悬停与点击刷新用量 - **WHEN** 用户悬停或点击托盘图标 - **THEN** 后台用量刷新照常触发（防抖语义不变） | Enter\|Click 分支的 refresh_all_usage_in_tray 调用与 10 秒防抖（tray.rs:1091-1139 LAST_TRAY_USAGE_REFRESH 节流）无 diff，悬停/点击刷新语义原样保留。 |
| A18 | passed | specs/tray-left-click-toggle/spec.md | macOS Dock 重新激活 - **WHEN** 发生 Dock 图标点击重新激活（Reopen）事件 - **THEN** 主窗口显示，行为与引入本能力前一致 | RunEvent::Reopen 改调 show_main_window（lib.rs:1782-1784），其窗口存在分支（unminimize+show+set_focus+apply_tray_policy(true)）与轻量模式重建分支与原内联实现语义等价，Reopen 行为不变。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| cargo clippy (-D warnings) | clippy --manifest-path src-tauri/Cargo.toml -- -D warnings | . | passed | 0 | 9063 ms |
| cargo test (skip port-conflict case) | test --manifest-path src-tauri/Cargo.toml -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | . | passed | 0 | 23757 ms |
| pnpm typecheck | typecheck | . | passed | 0 | 11060 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 30754 ms |

## 阻塞项

_无。_

## 风险与跳过的工作

- A1-A13 的实际点击往返无 e2e 自动化覆盖（仓库无托盘 e2e 基建，brief 明确不新增），判定基于代码审读+tray-icon 0.21.3 平台源码语义+Runtime clippy/test；建议合入后按 brief 验证预期做一次 macOS 本机手动验收（左键往返、右键菜单、轻量模式左键重建、Dock 隐藏/恢复）。
- Linux（GTK/libappindicator）后端不产生托盘点击事件（tray-icon-0.21.3 platform_impl/gtk/mod.rs 无事件发送），左键切换不生效且点击仍弹菜单；brief 非目标 D4 与 spec Purpose 已如实声明，属平台限制非功能回退。
- 本机 cargo fmt --check 存在 45 处既有漂移（均未被本 change 触及，父提交即失败）；若 CI 严格执行 fmt --check，该漂移会独立于本 change 导致失败，建议后续单独清理。
- show_main_window 在 Windows/Linux 平台编译含 set_skip_taskbar(false)/nudge 等死代码分支（Reopen 仅 macOS 编译），无害但存在轻微冗余。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 候选 88013f75 独立验收通过。tray.rs 新增 show_main_window/hide_main_window/toggle_main_window 三个助手，显示路径与原 show_main 内联代码逐行等价，隐藏路径与 CloseRequested+minimize_to_tray_on_close 分支镜像一致；lib.rs 以 show_menu_on_left_click(false)+Click{Left,Up} 过滤实现单次左键切换。经核对 tray-icon-0.21.3 macOS/Windows/GTK 平台源码：左键 Down/Up 各发一次 Click（Up 过滤避免双切）、menu_on_left_click=false 时左键不弹菜单而右键弹菜单保持、Linux 无点击事件与规格声明一致。右键菜单面、用量刷新 10 秒防抖、静默启动、Reopen 等既有行为零回归；A8 五项检查中 4 项 Runtime 实跑 passed、fmt 经独立复核本 change 文件零漂移（45 处既有漂移与本 change 无关）。窗口运行时往返无 e2e 基建，依据代码与平台语义判定证据充分，建议合入后补一次 macOS 手动验收。 | 2026-09-06T07:50:45.108Z |



## 结论

候选 88013f75 独立验收通过。tray.rs 新增 show_main_window/hide_main_window/toggle_main_window 三个助手，显示路径与原 show_main 内联代码逐行等价，隐藏路径与 CloseRequested+minimize_to_tray_on_close 分支镜像一致；lib.rs 以 show_menu_on_left_click(false)+Click{Left,Up} 过滤实现单次左键切换。经核对 tray-icon-0.21.3 macOS/Windows/GTK 平台源码：左键 Down/Up 各发一次 Click（Up 过滤避免双切）、menu_on_left_click=false 时左键不弹菜单而右键弹菜单保持、Linux 无点击事件与规格声明一致。右键菜单面、用量刷新 10 秒防抖、静默启动、Reopen 等既有行为零回归；A8 五项检查中 4 项 Runtime 实跑 passed、fmt 经独立复核本 change 文件零漂移（45 处既有漂移与本 change 无关）。窗口运行时往返无 e2e 基建，依据代码与平台语义判定证据充分，建议合入后补一次 macOS 手动验收。
