# 完整目标规格：upstream-sync（v4.0.16 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线已确认为 tag `v4.0.16` = `4f6b5495`（annotated tag，剥离提交 `f92ff0b0`）。fork 版本号 `4.0.16-1`。推送与 tag 属交付步骤，按已确认的交付授权（沿用上轮方式）在验收通过并归档之后执行。

**上游托盘玻璃面板（`77c6dc79` 等 14 提交）已决定纳入本轮同步**（2026-10-20 用户选 B），并叠加保留 fork 的「托盘左键单击切换主窗口」语义。本规格描述纳入后的完整同步后状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.16` 指向的提交 `f92ff0b0`。
- `git merge-base main v4.0.16` == `f92ff0b0`；`git log v4.0.16..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 156 个 fork 提交（`git rev-list --count v4.0.15..main`，含 v4.0.15 的同步提交 `fc4c14f4`、重放映射登记提交 `1b657c41`、归档提交 `e0a801da` 等）按原顺序重放，外加本轮的同步提交与归档提交。
- 重放映射核对口径（与 v4.0.15 轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v416`（= `e0a801da`）固定记录。
- 上一轮基线 tag `v4.0.15` = `988b0d00` 与 fork 发布 tag `v4.0.15-1`（指向归档提交 `e0a801da`）保持不变。

### 同步范围（v4.0.15..v4.0.16：43 提交、127 文件、+8813/−556）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **托盘玻璃面板**（14 提交）：`77c6dc79`（玻璃面板替代原生菜单）、`752998a6`（「托盘样式」设置）、`940f9f93`（面板跟随用量显示币种与图表样式）、`e003829b`（默认样式为面板）、`e2af66ca`（模式名主题色）、`cd449274`（Unix 不把继承环境变量报成冲突）、`273d166b`（macOS 深色窗口可读）、`a8e17dd6`（悬停/切换即时响应）、`27c42fd1`（子面板淡入与切换关闭）、`b76e83c3`（CJK 轴刻度与 Y 轴定宽）、`01bc780f`（面板重新成为默认）、`e33a0f35`（样式测试匹配不透明填充）、`3168b00f`（revert `6fcbb054` 侧栏 Today 只显数字）。**本轮全部纳入（Q1 选 B）。**
2. **Get API Key 链接**（3 提交）：`b92de269`（编辑时也显示，`useApiKeyLink.ts` +52 行）、`68b52851`（浅蓝样式）、`e02f3a33`（Zhipu 去 `?ic=`）。
3. **GPT 上下文窗口**（3 提交）：`a94f997f`、`f3d4fe53`、`8d7a7415` + 新组件 `GptContextWindowHint.tsx`。
4. **Hermes MiniMax providerKey**（2 提交）：`0bbbb534`（`providerKey` 字段 + MiniMax cn/intl 改名）、`734c4831`（MiniMax-M3.1-Flash）。
5. **AllTokens SI 赞助商预设**（1 提交 `b89cccf9`）：6 app + 新图标 + 4 locale 描述键。fork 白名单自动拒绝。
6. **opencode 默认模型**（1 提交 `eadfc151`）：后端 `get_default_model`/`set_default_model`、前端 `getOpencodeDeclaredModels`、`ProviderList.tsx` 泛化、`App.tsx` `onSetAsDefault` 扩入 opencode。
7. **其余修复 19 提交**：`8b09732a`、`bb05f9d6`、`1e36b107`、`6c36d68a`、`8e51101e`、`2c2d6c43`、`56ac4f9a`、`3b1f11b6`、`a9a93f06`、`f3d9e8c6`、`5fa00079`、`adc223af`、`75e93281`、`8d8dc456`、`855a2eb8`（release）、`f92ff0b0`（release notes）。

### 重放映射（本轮实测）

- 同步前 `git rev-list --count v4.0.15..pre-sync-v416` == 156；rebase 一趟完成，重放后 `git rev-list --count v4.0.16..main` == 156 —— 156 条重放提交**无一条被 git 判定为空而丢弃**。
- tag `v4.0.16` 是 annotated tag：tag 对象 `4f6b5495`，剥离提交 `f92ff0b0`；`git merge-base main v4.0.16` == `f92ff0b0` ✓；`git log --format='%an <%ae>' v4.0.16..main | sort -u` 只有 `Tune`，区间内无任何上游提交 ✓。
- 提交主题序列逐行 diff（重放前 `v4.0.15..pre-sync-v416` 与重放后 `v4.0.16..main`，各 156 条）差异 **0 行** ✓。
- patch-id 对照（stdin 口径 `git show <c> | git patch-id --stable`）：**146 个与重放前完全相同，10 个不同**，逐条归类如下，无一属于「fork 语义丢失」：
  1. `#2 5c998e8c→3532fef1`（版本号与产品名）：交互式冲突停车，4 个版本与锁文件各一处版本号 hunk（新基线 `4.0.16` vs 历史值 `3.20.2-fork.1`）→ 取 fork 侧历史值（重放忠实；最终版本号由终态提交设为 `4.0.16-1`）。文件集 4=4、增删行数 14=14。
  2. `#12 70183c93→c72c3e1f`（预设 interface `hidden` 字段）：交互式冲突停车。`hermesProviderPresets.ts` 的 `HermesProviderPreset` interface —— 上游 `0bbbb534` 新增 `providerKey?: string` 与 fork 的 `hidden?: boolean` 落在同一段 → 两字段并存（`providerKey` 在前、`hidden` 在后），无重复声明。文件集 7=7；增删行 14→16（多出的 2 行即并存的 `providerKey` 注释与字段）。
  3. `#25 a6346eff→950db503`（SearchableModelPicker 移植）：增删行集合相同（126=126）、文件集相同（4=4），仅 hunk 上下文位移。
  4. `#42 a35efb82→a4f4f752`（禁用应用内更新器）：交互式冲突停车，`AboutSection.tsx` 的 import 段 —— 上游 `f3d9e8c6` 把 `appIcon`（png）换成 `ccswitchLogo`（svg），fork 删除了 `extractErrorMessage`（其唯一使用点已被 fork 移除）。解法：取上游矢量 logo（`src={ccswitchLogo}` + `draggable={false}` + `p-1`），不引入 `extractErrorMessage`，fork 的「About 不自检、不安装更新、指向 tunecc Releases」精简语义完整保留。文件集 15=15、增删行数 514=514。
  5. `#49 48d87252→ad55fb0d`（archive claude-model-quick-access）：增删行集合相同（967=967）、文件集相同（11=11），仅 hunk 位移。
  6. `#69 e5129e9a→ab34148a`（连通性测试四语言文案）：增删行集合相同（2283=2283）、文件集相同（8=8），仅上下文位移。
  7. `#74 8c164985→5db8e5e8`（stream_check 链路移除）：交互式冲突停车，`Cargo.lock` 的 `cc-switch` 条目版本号行（新基线 `4.0.16` vs 历史值 `3.20.1-1`）→ 取 fork 侧值。文件集 21=21、增删行数 980=980。
  8. `#90 942492a8→5774e116`（托盘左键切换主窗口）：**本轮最高风险叠加点**，交互式冲突停车两处（`lib.rs` 的点击处理分支与 `show_menu_on_left_click`）。解法见下方「托盘面板与 fork 左键语义的叠加」。文件集 6→7（新增 `src-tauri/src/tray_panel.rs`，为叠加所需的 `panel_visible` 辅助函数）、增删行 412→429。
  9. `#101 abd823c8→ebacd955`（跨应用导入）：增删行集合相同（3133=3133）、文件集相同（22=22），仅上下文位移。
  10. `#154 fc4c14f4→442a1970`（v4.0.15 同步终态提交）：增删行集合相同（116=116）、文件集相同（12=12），仅上下文位移。
- 冲突停车清单（交互式 5 次）：#2 四个版本与锁文件、#12 `hermesProviderPresets.ts`、#42 `AboutSection.tsx`、#74 `Cargo.lock`、#90 `lib.rs`。其余由 git 自动合并；自动合并结果已逐个复核（含 7 个预设文件的 `hidden` 重复声明查重、`tray.rs` 的 `note_tray_click`→`mark_feedback_seen` 改名适配、`deeplink/provider.rs` 的 `website_url_2: None` 补写）。
- rerere 记录：`package.json`、`Cargo.toml`、`tauri.conf.json`、`Cargo.lock`、`AboutSection.tsx`、`hermesProviderPresets.ts`、`lib.rs` 的 preimage 已登记（本机 `.git/rr-cache`）。
- **自动合并中发现并修复的两个静默缺陷**（无冲突标记、但会分别导致 `TS2300` 与 `TS2339`/`TS2353`）：① `claudeDesktopProviderPresets.ts` 的 `ClaudeDesktopProviderPreset` interface 被三方合并留下**两份** `hidden?: boolean`（上游 `f3d9e8c6` 前的版本在 `requiresOAuth` 后已有一份，fork 在文件末尾又加一份）→ 删除 fork 侧那份，保留上游位置的那份；② 修复 ① 时一度删错了对象，`pnpm typecheck` 报 `TS2339`/`TS2353` 后改回「保留上游位置、删除 fork 追加」的正确解法。

### 落地保真核对（35 个重叠文件，实测结果）

- 算法：与固定四 ref 口径一致（`v4.0.15`、`v4.0.16`、`pre-sync-v416`、`HEAD`=终态含最终态提交；归一化：去首尾空白、去行尾逗号、丢空行与纯符号噪声行；多重集差）。核对脚本 `/tmp/v416/fidelity2.js`（单进程读四 ref，避免逐文件 `git show` 超时）。
- 实测（终态 `HEAD` = `eff9ca39c`）：**上游新增行缺失合计 14 行，fork 新增行缺失合计 7 行**，全部归类如下，无一行属于丢语义。fork 缺失的 4 个版本行是重放提交携带的历史值 `4.0.15-1` 被**本 change 的终态版本号 `4.0.16-1` 取代**——同一行先按重放忠实写入 `4.0.15-1`、再由终态提交升级，属预期流转而非丢语义。上游缺失的 14 行 = 4 个版本与锁文件各 1 行（上游 `4.0.16` vs fork 终态 `4.0.16-1`）+ `lib.rs` 6 行（同一处托盘叠加改写）+ `tray.rs` 4 行（第三轮修复中按 fork 左键契约刻意删除的上游 `native_menu_on_left_click` 辅助函数：doc 注释 1 行、fn 签名 1 行、函数体 1 行、唯一调用点 1 行）。
  - `src-tauri/src/lib.rs` 上游缺失 6 行、fork 缺失 3 行（**同一处改写，非删除**）。fork 缺失的 3 行逐行列出，便于独立复算：
    1. `// 不过滤会一次点击双切。右键仍由系统弹出托盘菜单。` —— 终态改写为叠加注释的一部分，在位形态为 `// 不过滤会一次点击双切。`（后半句「右键仍由系统弹出托盘菜单」的语义由紧随其后的一段叠加注释承载）。
    2. `button: MouseButton::Left` —— 终态改为 `button: button @ (MouseButton::Left | MouseButton::Right)`（面板需要接收右键，故模式匹配必须联合两个按键；左键语义由分支内的 `if *button == MouseButton::Left` 承载，未丢失）。
    3. `// fork：左键不弹菜单（改为切换主窗口），菜单仅右键弹出。` —— 终态改写为 `// fork：左键不弹菜单（改为切换主窗口 / 面板），菜单仅右键弹出。`（补「/ 面板」反映叠加后左键在面板开着时收起面板）。
    上游缺失的 6 行同理：`button:` 与 `button @ (tauri::tray::MouseButton::Left | tauri::tray::MouseButton::Right)` 与 `if *button == tauri::tray::MouseButton::Left` 三行因终态改用导入的 `MouseButton` 短名而「缺失」（语义等价，`lib.rs` 的 `use tauri::tray::{MouseButton, MouseButtonState, ...}` 在位）；`&& !tray::native_menu_on_left_click(true)` 与 `.show_menu_on_left_click(tray::native_menu_on_left_click(native_menu))` 被 fork 的左键 toggle 与 `show_menu_on_left_click(false)` 取代（属本 change 已确认的叠加决定）。
  - `tray.rs` 上游缺失 4 行（第三轮修复的刻意取舍，逐行列出）：`/// 左键是否直接出原生菜单：用面板时不出；Windows 的习惯是左键打开主界面、右键出菜单。`、`pub fn native_menu_on_left_click(native: bool) -> bool {`、`native && cfg!(not(target_os = "windows"))`、`if let Err(e) = tray.set_show_menu_on_left_click(native_menu_on_left_click(native)) {`。该函数在 fork 侧从未存在（`pre-sync-v416` grep 命中 0），其语义（macOS 原生菜单下左键出菜单）与 fork 已确认的「左键单击不弹出托盘菜单」契约**直接矛盾**，正是第三轮验收发现的缺陷根源；删除后 `apply_tray_style` 固定传 `false`，由源码级回归护栏守住。
  - 其余 29 个文件上游缺失 0 行、fork 缺失 0 行（含 4 个 locale、7 个预设文件、`ProviderList.tsx`、`ProviderForm.tsx`、`GeneralSection.tsx`、`types.ts`、`settings.rs`、`commands/settings.rs`、`schema.rs`、`model_mapper.rs`、`deeplink/provider.rs`、`App.tsx`、`AboutSection.tsx`、`vite.config.ts`、`ProviderPresetSelector.test.tsx` 等）。
- fork 语义落地抽查（`git grep -I -l -e <模式> -- src src-tauri tests`）：`IS_FORK_BUILD`（7）、`visibleSidebarPanels`（4）、`toggle_main_window`/`hide_main_window`（2/1）、`website_url_2`（17）、`connectivity_test_provider_models`/`connectivity_probe_provider`（5/5）、`filterForkPresets`（6）、`forkOfficialAllowlist`（2）、`extraActions`（7）、`DevPanel`（3）、`__CCS_FORK_BUILD__`（2）、`allOneMEnabled`（1）、`probeResults`（2）；updater 三项零命中（`tauri_plugin_updater`/`updater_builder` 在 `src-tauri` 命中 0、`tauri-plugin-updater` 在 `Cargo.toml` 命中 0、`createUpdaterArtifacts` 为 `false`）。
- 上游功能落地抽查：托盘面板 10 个新文件在位、`macOSPrivateApi: true` + `macos-private-api` feature + 3 个 objc2 0.3/0.6 crate 在位、`vite.config.ts` 的 tray-panel rollup 输入在位（`pnpm build:renderer` 实际产出 `tray-panel-*.js`/`tray-panel-*.css`）；opencode 默认模型全链路（`opencode_config.rs` 2 命令 + `providers.ts` API + `getOpencodeDeclaredModels` + `ProviderList` 的 `defaultModel`/`defaultModelOptions` + `App.tsx` 的 `onSetAsDefault` 扩入 opencode）在位；`useApiKeyLink.ts` 的 `formBaseUrl` 反查 + 6 处 `ProviderForm` 调用点 + 1 处 `ClaudeDesktopProviderForm` 在位；Hermes `providerKey` + `cc-switch-minimax`（6 处）+ `MiniMax-M3.1-Flash`（4 处）+ `resetHermesState` 第二参在位；`GptContextWindowHint` 已导出并在 5 个表单渲染；4 locale 的 6 个上游新键（`trayStyle`×4、`alltokens_si`、`gptContextWindowHint`）全部在位；`SCHEMA_VERSION` 上游仍 20（fork 21 保持）不变。

### 托盘面板与 fork 左键语义的叠加（本轮核心改动）

上游 v4.0.16 把托盘左右键 Up 都收归面板（`tray_panel::toggle`），原生菜单模式下左键也只做 `show_main_window`（只显示、不隐藏）。fork 的已确认语义是「左键单击 toggle 主窗口显示/隐藏、右键出菜单」（见 `docs/comet/specs/tray-left-click-toggle/` 与 `docs/comet/changes/tray-left-click-toggle-window/specs/tray-left-click-toggle/spec.md`）。叠加后的终态行为：

- **非原生菜单模式（上游默认，面板启用）**：左键 Up 时先读 `tray_panel::panel_visible(app)` —— 面板已弹出则收起面板（沿用上游 toggle 语义，避免「左键既关面板又切窗口」的双重响应）；面板未弹出则 `tray::toggle_main_window(app)`（fork 语义）。右键 Up 走 `tray_panel::toggle`。
- **原生菜单模式（`settings.nativeTrayMenu = true`，或 Linux）**：左键 Up 走 `tray::toggle_main_window(app)`（fork 语义，替换上游的 `show_main_window`）；右键 Up 走 `tray::mark_feedback_seen()` 并交由系统弹出原生菜单。
- **`show_menu_on_left_click(false)`** 保持 fork 值：左键永不直接弹菜单，菜单只由右键触发。
- **`apply_tray_style` 的运行时切换也必须保持 fork 左键契约**（第三轮独立验收发现并修复的真实缺陷）：上游 `apply_tray_style` 里传 `tray.set_show_menu_on_left_click(native_menu_on_left_click(native))`，macOS 上用户运行时就切到「原生托盘菜单」时该值为 `true`。而 tray-icon 0.21.3 的 `on_tray_click`（`platform_impl/macos/mod.rs:476-477`）与 `on_tray_icon_event` 是**两条独立路径**：`menu_on_left_click && button == Left` 时会 `performClick` 弹出系统菜单，同时 `on_tray_icon_event` 仍会触发 fork 的 `toggle_main_window`——同一次左键既弹菜单又切主窗口，违背已确认的「左键单击不弹出托盘菜单」契约。启动态不受影响（builder 值 `false` 生效）、Windows 不受影响（`native_menu_on_left_click` 在 Windows 恒 `false`），因此六项自动检查都发现不了。解法：`apply_tray_style` 里同样固定传 `false`，与 `lib.rs` 的 builder 值一致；上游的 `native_menu_on_left_click` 辅助函数随之失去调用方，已删除（纯上游代码、无 fork 语义）。
- **悬停/点击刷新用量**（`TrayIconEvent::Enter` 分支）与 **10 秒防抖**语义随上游原位保留，未受影响。
- **反馈行（feedback）「显示过就拿掉」语义核对**：fork 原 `note_tray_click(button)` 内部按 `opens_menu` 判定（`Right` 恒真、`Left` 仅非 Windows 为真）——即**只有会弹出菜单的那次点击才置 `seen`**。fork 的左键被改为切换主窗口后本就不弹菜单，故左键在 fork 原版里也不会置 `seen`。终态把 `mark_feedback_seen()` 收进右键分支，与该判定完全一致：左键（收起面板或切换主窗口）不置 `seen`，右键（弹出原生菜单）置 `seen`。上游 `tray_panel::hide_window` 收起面板时也调 `mark_feedback_seen()`，与 fork 原语义不冲突。
- 新增辅助函数 `tray_panel::panel_visible(app) -> bool`（`src-tauri/src/tray_panel.rs:308`）：只读 `get_webview_window(PANEL_LABEL)` 的 `is_visible()`，**不负责创建窗口**（与 `ensure_window` 的副作用区分开）。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 35 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.15 v4.0.16 | sort) <(git diff --name-only v4.0.15 main | sort)`；上游 127 文件 + fork 327 文件）。逐文件叠加要求：

#### 版本与锁文件（4 个）

- **`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.lock`**：上游只改版本号行（`4.0.15`→`4.0.16`）；取 fork 版本号 `4.0.16-1`，不得整文件取一侧。`Cargo.toml` 保持 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`（上游 v4.0.16 维持 16 + 注释，fork 侧保留自己的 `= 1`——属「fork 历史提交携带的语义」，重放忠实保留）。`package.json` 保留 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`。`Cargo.lock` 的 `cc-switch` 条目版本取 fork 值；`tauri-plugin-updater` 相关条目不得回来。`tauri.conf.json` 保留 fork 的 `createUpdaterArtifacts: false` 与移除的 `trafficLightPosition`，并按上游加回 `macOSPrivateApi: true`。收尾 `cargo check` 验证锁文件改动范围：允许 `cc-switch` 版本号一行（`4.0.16-1`）与 `objc2 0.6.4`/`objc2-app-kit 0.3.2`/`objc2-foundation 0.3.2` 三条目新增；`tauri-plugin-updater` 相关条目不得出现。`Cargo.toml` 另需按上游取 `macos-private-api` feature 与 3 个 objc2 crate 依赖，但 `tauri-plugin-updater` 保持 fork 删除态。

#### 后端（10 个）

- **`src-tauri/src/tray.rs`**（上游 +485/−31 / fork +32/−0）：取上游全部——`TrayMode` 相关段落的删除、`apply_tray_style`、`native_menu_on_left_click`、`uses_native_menu` 依赖、面板接线；**叠加保持 fork 的 `hide_main_window`/`toggle_main_window` 两个 helper 与调用点**。已知必须手工处理的改名：上游把 `note_tray_click` 改名为 `mark_feedback_seen`（v4.0.16 `tray.rs:1527`），fork 的 `note_tray_click` 定义、两个调用点与两个测试断言（`tray.rs:4260,4262`）按上游新名适配，「悬停/点击刷新用量」与「反馈行显示过就拿掉」语义不丢失。高危叠加面：fork helper 位于 `apply_tray_policy` 之后，与上游删除段/新增段邻近，不得整文件取一侧。
- **`src-tauri/src/lib.rs`**（上游 +45/−18 / fork +19/−41）：取上游 `mod tray_panel;`、`open_portable_update_download` 之外的命令注册、`update_tray_menu` 的 `uses_native_menu` 早退、窗口事件对 `PANEL_LABEL` 的 denylist/最小化过滤；**叠加保持 fork 三段语义**（无 Updater 插件注册、托盘左键单击切换主窗口、connectivity_test 命令注册）。左键分支的叠加方式按 brief「决策」Q1 选定（推荐「面板开启时左键 toggle 面板、否则 toggle 主窗口」），并**必须与上游 `tray_panel::toggle`、`native_menu_on_left_click`、`show_menu_on_left_click` 三者核对后落地**。**`invoke_handler` 是无声失效高危点**：上游删掉 `commands::connectivity_test_provider_models` 与 `commands::connectivity_probe_provider` 两个注册（fork 依赖，见 `src-tauri/src/commands/connectivity_test.rs`），整段取上游会让 fork 逐模型连通性测试在运行时报未处理命令且不报编译错误——必须手工保留这两个注册，同时按上游新增 `get_opencode_default_model`/`set_opencode_default_model`。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0。
- **`src-tauri/src/commands/misc.rs`**（上游 +2/−0 的 `fnm_default_alias_dir_candidates` / fork 1+/1−）：取上游 fnm Node CLI 探测；叠加保持 fork 的 `check_for_updates` 跳转地址 `https://github.com/tunecc/cc-switch/releases`。上游 `PORTABLE_ZIP_URL` 模板含 `farion1231`——**fork 取舍（沿用 v4.0.15 轮）**：`open_portable_update_download` 命令本体保留，URL 基址与 `check_for_updates` 一律指向 tunecc。
- **`src-tauri/src/commands/settings.rs`**（上游 +9/−1 / fork +7/−98−）：取上游 `save_settings` 新增 `app: tauri::AppHandle` 参数与 `tray_style_changed` → `crate::tray::apply_tray_style(&app)` 分支；叠加保持 fork 的 updater 空壳化（`install_update_and_restart`/`check_app_update_available` 参数改 `_app`、无 `tauri_plugin_updater` import 与 `UpdateDownloadProgress`、保留命令接口但不执行安装）。
- **`src-tauri/src/settings.rs`**（上游 +14/−0 / fork +47/−0）：取上游 `AppSettings.native_tray_menu` 字段、`Default` 项与单测；叠加保持 fork 的 `VisibleSidebarPanels` 结构、`AppSettings.visible_sidebar_panels` 字段段、`Default` 项、`LocalMigrations` 实现与单测。两侧区域不同，三方合并通常自动。
- **`src-tauri/src/database/schema.rs`**（上游 +54/−4 / fork +184/−0）：上游只加 Kimi K3 / Step 5 Preview 价格修正与新 Qwen 种子行组 + 测试；fork 加的是 v20→v21 迁移段、`website_url_2` 列与测试。同文件不同区域，三方合并通常自动；停车时按 hunk 并集手工拼接。
- **`src-tauri/src/deeplink/provider.rs`**（上游 +3/−1 / fork +1−0）：取上游 `usage_enabled` 的 volcengine 默认关闭改动（`8b09732a`，`build_provider_meta` 的 `enabled: request.usage_enabled.unwrap_or(provider_id != "volcengine")`）；叠加保持 fork 的 `website_url_2: None`（`build_provider_from_request` 的 `Provider { … }` 字面量——上游没有该字段、fork 新增列，不补则编译失败，解完必须确认该行仍在）。
- **`src-tauri/src/proxy/model_mapper.rs`**（上游 +42/−0 / fork +2−0）：取上游子代理 catalog id 回映射与新测试；叠加保持 fork 两个测试 `Provider` 字面量的 `website_url_2: None`。
- **`src-tauri/src/services/provider/mod.rs`**（上游 +1−1 / fork +4−0）：取上游 1 行；叠加保持 fork 4 个测试 `Provider` 字面量的 `website_url_2: None`。
- **`src-tauri/tauri.conf.json`**：见「版本与锁文件」。

#### 前端（15 个）

- **`src/App.tsx`**（上游 1+/1− 的 `onSetAsDefault` 扩入 opencode / fork 83+/1− 的历史 + 本轮 0）：取上游 `activeApp === "openclaw" || activeApp === "opencode"` 的条件扩写；叠加保持 fork 的 DevPanel 门控、产品名、侧边面板入口段（`visibleSidebarPanels`）。fork 的模型徽章/快捷切换在 `ProviderCard.tsx`，与 `App.tsx` 的 `onSetAsDefault` 是两条独立链路，扩入 opencode 不影响 fork 语义。
- **`src/components/providers/ProviderList.tsx`**（上游 +26/−7 的 `defaultModel`/`defaultModelOptions` 泛化与 `opencodeDefaultModel` query / fork 229+/10− 的历史）：取上游 opencode 默认模型泛化（`getOpencodeDeclaredModels` 引入、`openclawDefault`→`defaultModel`、`openclawModels`→`defaultModelOptions`、query deps 加 `opencodeDefaultModel`）；叠加保持 fork 全部（右键置顶/置底、新建插入第二位、模型徽章、批量连通性、双官网链接、`probeResults`、`searchSlot` 并存形态）。注意上游把 openclaw 专用的 `openclawDefault`/`openclawModels` 改名泛化，fork 若引用旧名需同步。
- **`src/components/providers/forms/ProviderForm.tsx`**（上游 +9−1 / fork 183+/43− 的历史）：取上游 6 处 `useApiKeyLink` 调用的 `formBaseUrl` 传参与 `resetHermesState(config, preset.providerKey)`；叠加保持 fork 的预设过滤接线（`entriesFor` 口径：编号先于一切过滤）、跨应用导入 `extraActions`、`websiteUrl2`、连通性接线。
- **`src/components/providers/forms/ClaudeDesktopProviderForm.tsx`**（上游 +1−0 / fork 85+/12−）：取上游 1 处 `formBaseUrl: baseUrl`；叠加保持 fork 的跨应用导入与 Desktop 专属字段段。
- **`src/components/providers/forms/PiProviderForm.tsx`**（上游 +6 / fork 大量）：取上游 6 行（`useApiKeyLink` 相关或 providerKey 相关，以实际 diff 为准）；叠加保持 fork 的跨应用导入、`websiteUrl2`、`filterForkPresets`、`buildPiSettingsConfig` 提取。**注意**：fork 把 `buildPiSettingsConfig` 从本文件提取到 `src/utils/piProviderConfig.ts`，上游若仍在文件内定义该函数，需保留 fork 的提取形态。
- **`src/components/providers/forms/shared/index.ts`**（上游 +1 / fork +1）：取上游 `export { GptContextWindowHint }`；叠加保持 fork 的 `export { SearchableModelPicker }`。
- **`src/components/settings/AboutSection.tsx`**（上游 +7−2 / fork 12+/72−）：取上游 `appIcon` → `ccswitchLogo`（`@/assets/icons/logo.svg`）的引入与 `<img>` 改写、`draggable={false}` 与 `p-1`；**fork 取舍（沿用 v4.0.15 轮）**：fork 保留自身简化形态（About 不自检、不安装更新、错误 toast 精简、指向 tunecc Releases），上游 portable 直链分支不引入。`src/assets/icons/app-icon.png` 随上游删除。
- **`src/components/settings/sections/GeneralSection.tsx`**（上游 +30−0 / fork 大量）：上游在 `showProviderSearch` 行之后、`isLinux()` 的 `useAppWindowControls` 行之前插入「托盘样式」`SettingsRow` + `SegmentedControl`（`!isLinux()` 包裹，`settings.nativeTrayMenu` 读写）。取上游该段；叠加保持 fork 的 `<SidebarPanelPillRow>`（在同一 `SettingsCard` 内、`showProviderSearch` 行之后）与文件末尾的 `SidebarPanelButton`/`SidebarPanelPillRow` 两个组件定义。**注意插入点相邻**：上游段与 fork 段都紧邻 `showProviderSearch` 行，是本轮最可能整文件取一侧的点。
- **`src/components/shell/Sidebar.tsx`**（上游 +6−3 的 `3168b00f` revert / fork 12+/2−）：取上游 revert 后的 `todayTrailing`/注释形态（恢复带「今日」文案）；叠加保持 fork 的 `visibleSidebarPanels` 过滤段（props、`allGlobals` 过滤、`VisibleSidebarPanels` import）。fork 的 `globals` → `allGlobals` 改名与过滤段保持。
- **`src/types.ts`**（上游 +4 / fork 14+）：取上游 `Settings.nativeTrayMenu`、`OpenClawModel` 的 `supportsReasoningEffort?`/`supportedReasoningEfforts?` 等新字段；叠加保持 fork 的 `Provider.websiteUrl2`、`UniversalProvider.websiteUrl2`、`VisibleSidebarPanels`、`Settings.visibleSidebarPanels`。上游若新增 `HermesProviderPreset` 相关类型字段，随上游。
- **7 个 `src/config/*ProviderPresets.ts`**（`gemini`/`grokBuild`/`hermes`/`openclaw`/`opencode`/`pi` + `claude` 系列中的重叠者）：取上游全部新预设（AllTokens SI）、治理改动（Zhipu 去 `?ic=`、GPT 窗口 272K→1.05M/400K、MiniMax-M3.1-Flash、`providerKey` 字段）与 `hidden?: boolean` 上游侧声明；**叠加保持 fork 的 `hidden?: boolean` 字段声明与预设条目**。**高危**：`HermesProviderPreset.providerKey` 与 fork 的 `hidden?: boolean` 同处 `hermesProviderPresets.ts` interface，三方合并可能留下两份 `hidden?: boolean`（v4.0.12 轮实测 `TS2300: Duplicate identifier 'hidden'`），合并后必须删掉 fork 侧重复声明；同理适用于其余预设文件 interface。上游新增 AllTokens SI 预设 6 app 全部不在 fork 白名单，`filterForkPresets` 自动拒绝，无须新授权。上游新增的 GPT 窗口放大（`272000` → `400000`/`1050000`）与 MiniMax 定价/model 变更随上游。
- **4 个 `src/i18n/locales/*.json`（`zh`/`en`/`ja`/`zh-TW`）**（上游各 +7−1 / fork 各 316..330+）：按上游执行新增与改写（`settings.general.trayStyle*` 4 键 ×4、`presets.alltokens_si` ×4、`providers.gptContextWindowHint` ×4）；保留 fork 键段（`devpanel` 只 zh/en、`connectivityTest`/`connectivityCheck`/`searchModels`/`noModelsFound`、模型快捷切换、双官网链接、跨应用导入、批量检测、侧边面板）。**必须逐文件查重**（rebase 三方合并会并存新旧写法且测试全绿）。

#### 测试（1 个重叠 + 10 个上游新增）

- **`tests/components/ProviderPresetSelector.test.tsx`**（上游 +4−4 / fork 33+）：上游因新赞助商调整断言行数；fork 过滤后行数不受影响（白名单外自动拒绝），断言改写时按 fork 语义修正并记录。
- 上游本轮新增的 10 个测试文件随 rebase 直接落地：`tests/components/{GeneralSection.trayStyle,GptContextWindowHint,TrayPanel.styles,TrayPanel,TrayPanelUsageTab,UsageFooter.tokenPlanBalance}.test.{ts,tsx}`、`tests/config/hermesMinimaxProviderKey.test.ts`、`tests/hooks/useApiKeyLink.test.tsx`、`tests/tray-panel/menuAim.test.ts`。
- **必须连带采用上游对 `tests/lib/modelMetadata.test.ts` 与 `tests/config/presetModelMetadata.test.ts` 的改写**（上游 `8d7a7415` 把 GPT 窗口封顶从一刀切窄化为只封顶借来的窗口，fork 现有断言会反向失败；fork 从未修改这两个文件与 `src/lib/modelMetadata.ts`，取上游即可）。
- **`src-tauri/src/tray.rs` 的 `note_tray_click` → `mark_feedback_seen` 改名需适配 fork 的两个测试断言**（`tray.rs:4260,4262`）。

### fork 取舍清单

1. **托盘玻璃面板**（2026-10-20 用户选 B）：完整纳入，并叠加保留 fork 的「托盘左键单击切换主窗口」语义。需引入 `tray_panel.rs`、`src/tray-panel/**`、`capabilities/tray-panel.json`、`src/tray-panel.html`、`vite.config.ts` 的 tray-panel rollup 输入、`Cargo.toml` 的 `macos-private-api` + 3 objc2 crate、`tauri.conf.json` 的 `macOSPrivateApi`、`settings.rs`/`commands/settings.rs`/`lib.rs`/`tray.rs`/`GeneralSection.tsx`/4 locale 中面板相关段、5 个面板测试文件。**不得为之恢复** fork 已移除的 `tauri-plugin-updater`（上游 `Cargo.toml` 同时含 updater 依赖与 objc2 0.3 依赖，只取 objc2 部分）。
2. **portable zip 直下**（上游 v4.0.13 `b391565f`，本轮仍在）：不接入前端更新入口（沿用 v4.0.15 轮取舍）；`open_portable_update_download` 后端命令保留注册，其 URL 基址与 `check_for_updates` 指 tunecc。
3. **`codegen-units`**：fork 保留 `= 1`（既有取舍），上游维持 16 + 注释。
4. **`tr.json`**：与上游 tag `v4.0.16` 逐字节一致，不补 fork 键；上游 `73cdfbb7`（v4.0.15 轮 post-release）+ 本轮 `cd449274` 等相关文案改写全部随上游。
5. 基线确认：tag `v4.0.16` = `4f6b5495`；交付授权沿用上轮方式（push main + tag `v4.0.16-1`）。

### 预设 id 编号契约（延续）

预设选择项 `id` 数字 = 原始预设数组下标；过滤发生在编号之后。本轮上游新增 AllTokens SI 预设使部分数组增长，fork 白名单（`filterForkPresets`）在编号后按 name 集合过滤——四处预设入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）仍为「按原数组下标编号 → 过滤 `hidden` → 白名单 name 集合过滤」。

### 本地化状态

- 语言集合 `zh`/`zh-TW`/`en`/`ja`/`tr` 不变。
- `tr.json` 与 `git show v4.0.16:src/i18n/locales/tr.json` 逐字节一致（既有决定：不补 fork 键）；土耳其语下 fork 专属文案回退英文。
- 本轮上游 4 个 locale 各 +7−1（`trayStyle*` 4、`alltokens_si` 1、`gptContextWindowHint` 1）。

### 数据库 schema 状态

- `SCHEMA_VERSION` == 21（上游 v4.0.16 仍为 20）；迁移链 v18→v19（上游 mcode + fork `website_url_2` 并存）、v19→v20（上游）、v20→v21（fork 修复迁移）原样保留。
- 上游本轮对 `database/**` 的改动仅价格种子（Kimi K3 / Step 5 Preview 修正 + 新 Qwen 行组）与测试，不涉及表结构。
- 后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 重放涉及该文件或 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。

### 已知流程坑位（沿用）

- Runtime `verification_checks` argv 不含 executable 前缀、不得含 shell 语法。
- 长重放 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 与落盘，再 continue。
- `--ours` 是新基线，`--theirs` 是重放的 fork 提交。
- 重放中途不跑 `cargo test`；最终态冲突标记零命中（`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> '`）。
- JSX/Rust 合并禁止按行去重；手工拼接后必须 `pnpm format:check` + `pnpm build:renderer`。
- locale 重复键显式查重。
- 预设 interface 的 `hidden?: boolean` 重复声明必须删 fork 侧（v4.0.12 轮实测 `TS2300`）。
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推；查 fork Actions 显式 `--repo tunecc/cc-switch`。
- SSH 被 fake-IP 接管时用 gh HTTPS credential helper 推送。
- 时间敏感用例本地 00:00–00:30 窗口必失败的口径继续适用。
- 单条 CI 红的判定顺序（v4.0.12 轮口径）：①与上游 tag 逐字节 diff ②看上游同用例是否同样红 ③本地重复跑取证。

### 版本号

- 四处文件 `4.0.16-1`；语义：上游版本号 + `-N`，N 为同一上游版本的 fork 构建代数。

### 交付（上传，按已确认授权）

- 交付是验收通过并生成归档提交之后的步骤。默认沿用上轮授权形态：`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.16-1` 并 `git push origin v4.0.16-1`（触发 fork Release CI）。不创建 PR。
- 授权范围（沿用上轮）：验收通过并用户接受结果、生成归档提交后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.16-1` 并 `git push origin v4.0.16-1`；不含 merge、PR 或其他远端引用。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端持久化）——与上游 `nativeTrayMenu` 同处 `types.ts`/`settings.rs`，两段并存。
- 供应商卡片模型徽章与快捷切换弹窗、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选——与上游 Haiku 1M 同处 `ClaudeFormFields.tsx`，并存。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 8 个预设文件的 `hidden` 字段 + 表单接线）——上游新赞助商预设（AllTokens SI）自动被拒。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`forwarder.rs`/`misc.rs` 两侧语义并存，`stream_check` 不回来）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支）。该语义需按 brief「决策」Q1 选定的叠加方式与上游面板共存，不得失效——这是本轮最高风险的叠加点。
- 跨应用导入供应商配置（5 个 Form + `ProviderPresetSelector.extraActions`）。
- 禁用应用内更新器（About 指向 tunecc Releases、启动自检取消、`install_update_and_restart` 空壳、无 updater 插件/依赖/AIP）。
- 对上游自带测试的稳定性修正（`apps-page-cache-race`，按 `fork-test-stability` 能力规格重新套用）。
- 上游 tag 的发版构建跳过（fork CI 裁剪）。
- README fork 差异说明与构建说明。

### 构建与测试

- `pnpm typecheck` / `pnpm test:unit` / `pnpm format:check` / `pnpm build:renderer` / `cargo check` / `cargo test`（环境性例外按 A13 口径）全部通过。

## 非目标

（同本 change brief 的非目标一节，此处不重复。）

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（`pre-sync-v416` = `e0a801da`）。
- 不确定的冲突：不盲目 `--continue`，先复核；无法安全判定时暂停记录。
- `lib.rs`/`settings.rs`/`tray.rs`/`misc.rs`/`commands/settings.rs`/`App.tsx`/`GeneralSection.tsx`/`AboutSection.tsx`/`Sidebar.tsx`/`ProviderList.tsx`/`ProviderForm.tsx`/7 个预设文件/4 个 locales 出现「整文件取一侧」即视为丢语义缺陷。
- `deeplink/provider.rs`、`model_mapper.rs`、`services/provider/mod.rs` 取上游形态后必须确认 `website_url_2: None` 行仍在（后者两者在测试字面量中）。
- 合并后 updater 命中数（`tauri_plugin_updater`/`updater_builder`）必须为 0；`tauri-plugin-updater` 不得回到 `Cargo.toml`。
- 托盘面板落地取证：`tray_panel`、`PANEL_LABEL`、`uses_native_menu`、`tray-panel`、`nativeTrayMenu`、`macOSPrivateApi`、`objc2-app-kit-03` 在 `src-tauri/src`、`src`、`src-tauri/capabilities`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 的命中数必须 > 0（逐项核对在位）。
- fork 左键切换语义取证：`src-tauri/src/tray.rs` 的 `hide_main_window`/`toggle_main_window` 两个 helper 在位、`src-tauri/src/lib.rs` 的左键分支在位且实际调用 `toggle_main_window`（或与面板 toggle 的正确组合），`show_menu_on_left_click` 的取值不破坏右键出菜单。
- `lib.rs` 的 `invoke_handler` 必须同时含 `commands::connectivity_test_provider_models`、`commands::connectivity_probe_provider`（fork）与 `commands::get_opencode_default_model`、`commands::set_opencode_default_model`（上游）。
- `src-tauri/src/tray.rs` 的 `note_tray_click` 已被上游改名为 `mark_feedback_seen`；fork 侧的定义、两个调用点与两个测试断言必须适配，否则 `cargo check` 失败。
- `tests/lib/modelMetadata.test.ts` 与 `tests/config/presetModelMetadata.test.ts` 必须随上游改写（GPT 窗口封顶语义收窄），保留 fork 旧断言即视为缺陷。
- 上游 `8d7a7415` 之后 `src/lib/modelMetadata.ts` 的 `capGptContextWindow` 只作用于「从 models.dev 借来的窗口」；fork 不得为恢复旧的一刀切行为而改回该文件。
- `src-tauri/src/tray.rs::apply_tray_style` 的 `set_show_menu_on_left_click` 必须固定传 `false`（不得回退上游的 `native_menu_on_left_click(native)`）：macOS 运行时就切原生菜单时会把左键也改成出菜单，与 `on_tray_icon_event` 的 fork 左键分支叠加成「既弹菜单又切主窗口」。该路径启动态与 Windows 均不触发，只有 macOS + 运行时就切 + 左键三个条件同时满足才复现，自动检查无法发现。
