# 完整目标规格：upstream-sync（v4.0.17 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线已确认为 tag `v4.0.17` = `b5a1bdc7`（annotated tag，剥离提交 `19798e2f`，该提交是 `docs(release): add v4.0.17 release notes`，属发布内容的一部分）。fork 版本号 `4.0.17-1`。推送与 tag 属交付步骤，按已确认的交付授权（Q4：沿用上轮方式）在验收通过并归档之后执行。

上游 `v4.0.16..v4.0.17` 共 18 个提交、42 个文件、+1875/−168，与 fork 的重叠面为 12 个文件。本轮唯一的「上游也改了我们做过的功能」是托盘左键分派：**用户 2026-10-21 决定保留 fork 语义**（Q1），并据此改写 4 个 locale 的 `settings.general.trayStyleHelp`（Q2）、修正 README §14 与 `tray-left-click-toggle` 总规格的既有漂移（Q3）。本规格描述该口径下的完整同步后状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.17` 剥离出的提交 `19798e2f`。
- `git merge-base main v4.0.17` == `19798e2f`；`git log v4.0.17..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 166 个 fork 提交（`git rev-list --count v4.0.16..HEAD`，起点 `a525de9d4` = origin/main，含 v4.0.16 的同步提交 `71f1d3d6`、落地保真更正提交 `1f342021`/`815d8b7e`、托盘护栏提交 `eff9ca39`、托盘修复提交 `9db7370f` 与归档提交 `a525de9d`）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径（与历轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v417`（= `a525de9d4`）固定记录。
- 上一轮基线 tag `v4.0.16` = `4f6b5495`（剥离 `f92ff0b0`）与 fork 发布 tag `v4.0.16-1` 保持不变。
- `upstream/main` 当前为 `c7dceb80`（`feat(agy): integrate Antigravity CLI management (#8268)`），位于 `v4.0.17` 之后，本轮不纳入。

### 同步范围（v4.0.16..v4.0.17：18 提交、42 文件、+1875/−168）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **托盘面板稳定性与额度显示**（6 提交）：`91ab270e`（两列跟随面板高度、右列内滚动、Windows 按 scale 换算并收窄到工作区）、`74cf8e6f`（跨显示器弹出后刷新 DPI 坐标）、`099c9761`（额度条三列对齐 + 显示距重置时间）、`7e97b44f`（`QuotaLine.emphasis` 新字段）、`c42e3067`（余额金额上绿色）、`73adfaf0`（`tray_panel::release_if_lightweight`，`lightweight.rs:29` 与 `hide_window` 调用）。主战场 `src-tauri/src/tray_panel.rs`（上游 +144/−24）、`src/tray-panel/{TrayPanel.tsx,api.ts}`、`tests/components/TrayPanel.test.tsx`、`src-tauri/src/tray.rs`（上游 +21/−3，全部是 emphasis 字段与其测试）。
2. **Windows 托盘左键打开主界面**（含在 `91ab270e`）：`src-tauri/src/lib.rs`（上游 +7/−8）重写 `TrayIconEvent::Click` 分支与上方注释。**Q1 决定不采纳，保留 fork 形态。**
3. **Hermes 内置 provider id 警告**（`f460410f`）：新增 `src/config/hermesBuiltinProviderIds.ts` + `isHermesBuiltinProviderId()`；`ProviderForm.tsx`（上游 +20/−5）加两条提示分支与 `data-testid="hermes-key-builtin-warning"`；4 locale 各 +2 键（`hermes.form.providerKeyBuiltin`、`providerKeyBuiltinLocked`）；新测试 `tests/components/ProviderForm.hermesBuiltinKey.test.tsx`、`tests/config/hermesBuiltinProviderIds.test.ts`。
4. **MCP 两项修复**：`cf312f6a`（`commands/mcp.rs`+`services/mcp.rs`：切换服务器前先取应用切换锁）、`52e87344`（`mcp/{codex,hermes,opencode,validation}.rs` + `tests/mcp_commands.rs`：只有 url 无 type 的服务器按远程服务器投影）。
5. **其余修复 6 提交**：`95693d6c`（`services/provider/codex_login.rs`：不把过期太久的 stash 登录交回代理）、`1f1becfb`（`src/utils/textNormalization.ts`：只规范化作为字符串定界符的弯引号 + `tests/utils/textNormalization.test.ts`）、`5cbe6700`（`services/webdav_sync.rs`：清单以 `application/octet-stream` 上传）、`2dfc848f`（`proxy/server.rs`：Windows 子进程不再继承监听 socket）、`8cfe5644`（`services/session_usage_codex.rs`：Codex 远端 compaction 用量从 `token_usage_record` 计数）、`4ea66d88`（`src-tauri/wix/per-user-main.wxs`：MSI 清掉遗留 `portable.ini`）、`9be88e3e`（`ApiKeyInput.tsx` + `tests/components/ApiKeySection.test.tsx`：关闭 macOS 首字母大写/自动纠错/拼写检查）。
6. **发布相关 2 提交**：`e172f37d`（四处版本号、`Cargo.lock` 的 `mio` 升 `1.2.1`、`CHANGELOG.md`）、`19798e2f`（`docs/release-notes/v4.0.17-{en,ja,zh}.md`、`src/whats-new/4.0.17.json`）。

### 托盘左键与文案终态（本轮核心取舍）

上游 v4.0.17 的 `lib.rs` 分支形态是：

```rust
if cfg!(target_os = "windows") && *button == MouseButton::Left {
    tray_panel::hide_panel(tray.app_handle());
    tray::show_main_window(tray.app_handle());
} else if !tray_panel::uses_native_menu() {
    tray_panel::toggle(tray.app_handle(), rect);
    return;
} else {
    tray::mark_feedback_seen();
}
```

fork 的终态（Q1）保持上一轮已确认的叠加形态，四条分支逐条如下：

- **面板样式（`settings.nativeTrayMenu = false`，上游默认）**：左键 Up 且 `tray_panel::panel_visible(app)` 为假 → `tray::toggle_main_window(app)`；左键 Up 且面板已显示 → `tray_panel::toggle(app, rect)`（收起面板，不切换主窗口）；右键 Up → `tray_panel::toggle(app, rect)`。
- **原生菜单样式（`settings.nativeTrayMenu = true`）**：左键 Up → `tray::toggle_main_window(app)`；右键 Up → `tray::mark_feedback_seen()` 后交由系统弹出原生菜单。
- **Linux（AppIndicator）**：不派发点击事件，走原生菜单，行为不变；设置页的「托盘样式」在 Linux 隐藏。
- **左键永不弹菜单**：`TrayIconBuilder::show_menu_on_left_click(false)`（`lib.rs`）与 `apply_tray_style` 内 `set_show_menu_on_left_click(false)`（`tray.rs`）两处固定为 `false`，由源码级回归护栏 `tray::tests::tray_left_click_never_opens_the_menu` 守住；上游的 `native_menu_on_left_click` 辅助函数在 fork 终态仍不存在（上轮已删，本轮不得被重放带回）。

不采纳的上游内容：`lib.rs` 的 Windows 左键分支 6 行中实际未落地的 **5 行**（`tray_panel::toggle(tray.app_handle(), rect);` 与 `return;` 两行在 fork 的面板分支里仍在位）与其上方改写后的托盘注释行；逐行清单见「落地保真核对」。这些在落地保真核对里作为「刻意取舍」逐行归类。

`src-tauri/src/tray_panel.rs` 的两侧插入必须并存：fork 的 `pub fn panel_visible(app) -> bool`（`panel_window` 之后、`ensure_window` 之前）与上游的 `pub fn release_if_lightweight(app: &AppHandle)`（`hide_window` 之后）。终态实测行号：`panel_visible` 在 `src-tauri/src/tray_panel.rs:349`，`release_if_lightweight` 在同文件 `:416`，两者同时存在。上游 `pub fn hide_panel`（终态 `src-tauri/src/tray_panel.rs:440`）在 fork 终态仍有 3 处调用（`src-tauri/src/tray.rs:2628` 的 `apply_tray_style` 在切到原生菜单时收起面板，另两处是 `tray_panel.rs` 自己的测试 `:1185`、`:1198`），因此不采纳上游 Windows 分支不会让它变成死代码；`cargo check` 实测零 `dead_code` 告警。

### fork 专属文案终态（Q2）

`settings.general.trayStyleHelp` 在 4 个 locale 的终态取值（逐 locale 记录，`GeneralSection.tsx` 通过 `t("settings.general.trayStyleHelp")` 渲染）：

- `en`：`What opens when you click the tray icon. Left-click toggles the main window (show or hide it); right-click opens the style you picked. Panel: each app's in-use provider, quota and usage, with search and switching. Menu: the system's native menu. Takes effect right away.`
- `zh`：`点托盘图标时弹出什么。左键单击切换主窗口的显示与隐藏；右键弹出你选择的样式。面板：各应用在用的供应商、额度和用量，可以搜索、切换。菜单：系统原生菜单。切换后立即生效。`
- `ja`：`トレイアイコンをクリックしたときに開くものです。左クリックでメインウィンドウの表示と非表示を切り替え、右クリックで選択したスタイルを開きます。パネル：各アプリの使用中のプロバイダー、クォータ、使用量を表示し、検索して切り替えられます。メニュー：システム標準のメニュー。すぐに反映されます。`
- `zh-TW`：`點系統匣圖示時彈出什麼。左鍵單擊切換主視窗的顯示與隱藏；右鍵彈出所選樣式。面板：各應用使用中的供應商、額度與用量，可以搜尋、切換。選單：系統原生選單。切換後立即生效。`

上游本轮的原文（`en`：`What opens when you click the tray icon (on Windows, left-click always opens the main window and right-click opens the selected style). …`，`zh`：`点托盘图标时弹出什么（Windows 上左键始终打开主界面，右键弹出所选样式）。…`，ja/zh-TW 同构改写）**不落地**，属 fork 专属文案改写；4 行进入落地保真的「上游缺失行」清单，逐行带重数（每 locale 1 行，共 4 行）。同一 fork 专属口径也用于本轮新落的 2 个 hermes 键：那 2 个键 fork 无自有语义，**逐字节取上游**。

### fork 侧文档终态（Q3）

- `README.md` §14「托盘图标左键切换主窗口」：删掉「右键单击仍弹出托盘菜单（打开主界面 / 官网 / 供应商与项目切换 / 轻量模式 / 退出），菜单结构与行为不变」这句在面板样式下已不成立的表述，改为按托盘样式区分——面板样式：右键弹出上游托盘面板，左键在面板已弹出时收起面板、否则切换主窗口；原生菜单样式：右键弹出原生菜单（含上述各项），左键切换主窗口；保留「仅 macOS 与 Windows 生效，Linux 不派发点击事件」与隐藏/显示的平台处理描述。
- `docs/comet/specs/tray-left-click-toggle/spec.md`：把「右键菜单行为保持不变」需求改写为「右键行为随托盘样式而定」，并把「左键单击无菜单」场景补上面板已弹出时左键先收起面板的情形；新增/改写场景与上述 README 描述逐条一致。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 白名单 locale 行登记 `trayStyleHelp` 为 fork 专属文案（写明终态文本与上游原文的差异），§4 共享文件表 `lib.rs`/`tray.rs`/`tray_panel.rs` 三行追加 v4.0.17 口径，并新增 §4.4「v4.0.17 轮的叠加要点」。

### 重放映射（本轮实测，2026-10-21）

- 同步前 `git rev-list --count v4.0.16..pre-sync-v417` == 166；重放后 `git rev-list --count v4.0.17..HEAD` == **166** —— 166 条重放提交**无一条被 git 判定为空而丢弃**，一趟 rebase 完成。
- tag `v4.0.17` 是 annotated tag：tag 对象 `b5a1bdc7`，剥离提交 `19798e2f`；`git merge-base main v4.0.17` == `19798e2f` ✓；`git log --format='%an <%ae>' v4.0.17..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`，区间内无任何上游提交 ✓。
- 提交主题序列逐行 diff（重放前 `v4.0.16..pre-sync-v417` 与重放后 `v4.0.17..HEAD`，各 166 条）差异 **0 行** ✓。
- patch-id 对照（stdin 口径 `git show <c> | git patch-id --stable`）：**163 个与重放前完全相同，3 个不同**，逐条归类如下，无一属于「fork 语义丢失」：
  1. `#2 3532fef1→fd2e5482`（版本号与产品名）：交互式冲突停车，`package.json`/`Cargo.toml`/`tauri.conf.json` 各一处版本号 hunk（新基线 `4.0.17` vs 历史值 `3.20.2-fork.1`）→ 取 fork 侧历史值（重放忠实；终态版本号由同步提交设为 `4.0.17-1`）。文件集 4=4、增删行 5/9=5/9（`git show --numstat` 口径）。
  2. `#74 5db8e5e8→bdb0d3ef`（stream_check 链路移除）：交互式冲突停车，`Cargo.lock` 的 `cc-switch` 条目版本号行（新基线 `4.0.17` vs 历史值 `3.20.1-1`）→ 取 fork 侧值。文件集 21=21、增删行 352/628=352/628。
  3. `#90 5774e116→c1124388`（托盘左键切换主窗口）：**本轮唯一的功能性取舍**，交互式冲突停车在 `lib.rs` 的 `TrayIconEvent::Click` 分支。上游本轮把该分支重写成 Windows 左键优先（见「托盘左键与文案终态」），与 fork 形态正面冲突 → 按 Q1 取 fork 形态，并把上方被上游改写的托盘注释行改写为 fork 行为描述。文件集 7=7、增删行 322/107 → 326/110（多出的 +4/−3 即上游 5 行新分支被取代与注释行改写）。
- 冲突停车清单（交互式 3 次）：#2 三个版本文件、#74 `Cargo.lock`、#90 `lib.rs`。其余 163 个提交由 git 自动合并或干净应用；自动合并结果已逐个复核（`tray.rs` 的 emphasis 字段与 fork 契约并存、`tray_panel.rs` 的 `panel_visible` 与 `release_if_lightweight` 并存、`ProviderForm.tsx` 的 hermes 分支与 fork `entriesFor` 并存、4 个 locale 零重复键）。
- rerere 记录：本轮为 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.lock`、`src-tauri/src/lib.rs` 登记了新 preimage（本机 `.git/rr-cache`）；历轮已有的 `AboutSection.tsx`、`hermesProviderPresets.ts` 等未再触发。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 命中 **0**（exit 1）✓。

### 落地保真核对（本轮实测，终态 `HEAD` = `2be37cbb2`）

- 算法（固定口径）：对上游 `v4.0.16..v4.0.17` 改动过的每个文件（42 个，覆盖 12 个重叠文件的全部）取 `git diff v4.0.16 v4.0.17 -- f` 的增/删行、`git diff v4.0.16 pre-sync-v417 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。脚本 `/tmp/v417/fidelity.js`（`node`，单进程读四 ref）。
- 实测合计：**上游新增行缺失 13 行，fork 新增行缺失 4 行**；12 个重叠文件之外的 30 个上游文件双侧缺失均为 0（上游内容完整落地）。计算在本轮的版本/文案提交与文档提交之后、终态 `HEAD` = `2be37cbb2` 上进行；`2be37cbb2` 之后只改本规格与 Markdown 登记，不在 42 个文件内，故数字不变。
- 逐文件差异（只列非零项）：
  - `package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json` 各上游缺 1 行、fork 缺 1 行。上游缺的是 `"version": "4.0.17"` / `version = "4.0.17"`（被 fork 终态 `4.0.17-1` 取代，刻意取舍）；fork 缺的是 `4.0.16-1`（重放忠实写入的上轮终态值，被本轮终态提交升级，属预期流转）。
  - `src-tauri/src/lib.rs` 上游缺 **5** 行、fork 缺 0 行（Q1 刻意不采纳，逐行列出）：`// 构建托盘：Windows 左键打开主界面，右键默认弹出面板；macOS 左右键默认都弹出面板。`、`if cfg!(target_os = "windows")`、`&& *button == tauri::tray::MouseButton::Left`、`tray_panel::hide_panel(tray.app_handle());`、`} else if !tray_panel::uses_native_menu() {`。上游该文件新增 7 行里另 2 行（`tray_panel::toggle(tray.app_handle(), rect);`、`return;`）在 fork 终态的面板分支里仍在位，故不计入缺失。fork 侧 28 行新增全部落地（fork 缺 0）。
  - `src/i18n/locales/en.json`、`zh.json`、`ja.json`、`zh-TW.json` 各上游缺 **1** 行（×4）、fork 缺 0 行：缺的都是本轮被 fork 文案取代的 `"trayStyleHelp": …` 行（Q2 刻意取舍），四条上游原文分别是 `What opens when you click the tray icon (on Windows, left-click always opens the main window and right-click opens the selected style). Panel: …`（en）、`点托盘图标时弹出什么（Windows 上左键始终打开主界面，右键弹出所选样式）。…`（zh）、`トレイアイコンをクリックしたときに開くものです（Windows では左クリックで常にメイン画面を開き、右クリックで選択した表示を開きます）。…`（ja）、`點系統匣圖示時彈出什麼（Windows 上左鍵一律開啟主視窗，右鍵彈出所選樣式）。…`（zh-TW）。同文件上游新增的 `providerKeyBuiltin` / `providerKeyBuiltinLocked` 两行与 fork 的 316..329 行新增全部落地。
- 汇总口径核对：4（版本与锁文件的上游行）+ 5（`lib.rs`）+ 4（locale）= **13** = 上游缺失合计；4（版本与锁文件的 `4.0.16-1` 行）= **4** = fork 缺失合计。两个数字都能由上面的逐行清单独立复算。
- 未落地上游行的归因：13 行里 12 行属本轮用户决定的刻意取舍（Q1 的 5 行 + Q2 的 4 行）或版本号流转（4 行），**没有任何一行属于丢上游语义**。
- 「上游内容零丢失」的直接旁证（`git diff --numstat v4.0.17 HEAD -- <file>`，只看 fork 侧新增/删除）：`src-tauri/src/tray_panel.rs` = `10/0`（只有 fork 的 `panel_visible`，上游 +144/−24 内容全部落地）；`src-tauri/src/tray.rs` = `75/6`（6 行删除即 fork 刻意移除的 `native_menu_on_left_click` 与其调用点）；`src/components/providers/forms/ProviderForm.tsx` = `183/43`（与上轮 fork 侧同量，上游 hermes 分支已在位）。
- fork 语义落地抽查（`git grep -I -c -e <模式> HEAD -- src src-tauri`）：`toggle_main_window`（3）、`hide_main_window`（2）、`panel_visible`（3）、`show_menu_on_left_click(false)`（4）、`connectivity_test_provider_models`（4）、`connectivity_probe_provider`（4）、`emphasis`（40，上游本轮新增字段）、`release_if_lightweight`（3）；`native_menu_on_left_click` 在 `src-tauri` 命中 5，逐条核对全部为注释与护栏用例的断言文本，代码调用点为 0；`tauri_plugin_updater`/`updater_builder` 在 `src-tauri` 命中 0，`tauri-plugin-updater` 在 `Cargo.lock` 命中 0，`createUpdaterArtifacts` 为 `false`。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 12 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.16 v4.0.17 | sort) <(git diff --name-only v4.0.16 HEAD | sort)`；上游 42 文件 + fork 328 文件）。逐文件叠加要求：

#### 版本与锁文件（4 个）

- **`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.lock`**：上游本轮只改版本号行（`4.0.16`→`4.0.17`），另在 `Cargo.lock` 把 `mio` 从 `1.1.1` 升到 `1.2.1`（含 checksum 行）。取 fork 版本号 `4.0.17-1`，`mio` 行取上游；不得整文件取一侧。`Cargo.toml` 保持 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`；`package.json` 保留 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`；`tauri.conf.json` 保留 fork 的 `createUpdaterArtifacts: false`、`productName: "CC Switch"` 与 `macOSPrivateApi: true`（上轮已引入）。收尾 `cargo check` 验证锁文件改动范围：只允许 `cc-switch` 版本号行 `4.0.17-1` 与 `mio 1.2.1`（含 checksum）；`tauri-plugin-updater` 相关条目不得出现。

#### 后端（3 个）

- **`src-tauri/src/lib.rs`**（上游 +7/−8 / fork +28/−39）：取上游除 `TrayIconEvent::Click` 分支以外的全部内容（本轮上游在该文件只动了托盘分支与其注释），并保留 fork 三段语义：无 Updater 插件注册、托盘左键单击切换主窗口（按「托盘左键与文案终态」的四条分支）、connectivity_test 命令注册。上游改写后的托盘注释行不采纳，注释按 fork 终态行为书写。解完 grep 确认 `tauri_plugin_updater`/`updater_builder`/`native_menu_on_left_click` 命中 0，并确认 `.show_menu_on_left_click(false)` 在位。
- **`src-tauri/src/tray.rs`**（上游 +21/−3 / fork +75/−6）：上游本轮只加 `QuotaLine.emphasis`/`PanelQuotaLine.emphasis` 字段、`plan_line` 的余额取值改写、`panel_quota` 透传与该模块测试断言——与 fork 的 `hide_main_window`/`toggle_main_window`、`apply_tray_style` 的 `set_show_menu_on_left_click(false)` 和源码护栏在不同区域，预期自动合并；停车时按「上游 emphasis + fork 左键契约」并集手工拼接，不得整文件取一侧（会把上轮删除的 `native_menu_on_left_click` 带回）。
- **`src-tauri/src/tray_panel.rs`**（上游 +144/−24 / fork +10/−0）：取上游 `place`/`show_at`/`toggle`/`release_if_lightweight`/`PanelPlacement` 全部改动与 `mod tests` 新增用例；叠加保持 fork 的 `pub fn panel_visible`（位于 `panel_window` 之后、`ensure_window` 之前）。上游的 `hide_panel` 保持原样（fork 终态有 `tray.rs:2628` 与两处测试共 3 个调用点，`cargo check` 无 `dead_code` 告警）。

#### 前端（1 个）

- **`src/components/providers/forms/ProviderForm.tsx`**（上游 +20/−5 / fork +183/−43）：取上游 hermes 提示分支（`isHermesBuiltinProviderId` 的两条 `<p>`、`data-testid="hermes-key-builtin-warning"`、`providerKeyInvalid` 分支的前置条件改写）与新 import；叠加保持 fork 的预设过滤接线（`entriesFor`：编号先于 `hidden` 过滤先于白名单过滤）、跨应用导入 `extraActions`、`websiteUrl2`、连通性接线、`formBaseUrl` 传参（上轮已落）。解完必须 grep 回查 `filterForkPresets(` 调用点数量与形态（预设 id 编号契约）。

#### 本地化（4 个）

- **`src/i18n/locales/{en,zh,ja,zh-TW}.json`**（各上游 +3/−1 / fork +316..329/24..25）：新增的 `hermes.form.providerKeyBuiltin` 与 `providerKeyBuiltinLocked` 逐字节取上游；`settings.general.trayStyleHelp` 按 Q2 用 fork 文案取代上游改写行（见「fork 专属文案终态」）；fork 键段（`devpanel` 只 zh/en、`connectivityTest`/`connectivityCheck`/`batchConnectivity*`、`searchModels`/`noModelsFound`、模型快捷切换、双官网链接、跨应用导入、侧边面板）不动。**合并后必须逐文件按对象作用域查重**（`object_pairs_hook` 口径），并核对 fork 末键行与 `},` 收尾没有被拼进同一物理行（v4.0.15 轮实测坑）。
- `src/i18n/locales/tr.json`：与 `git show v4.0.17:src/i18n/locales/tr.json` 逐字节一致（本轮上游对该文件零改动，预期随基线自然成立）。

### fork 取舍清单

1. **托盘左键分派**（2026-10-21 用户 Q1 选「保留我们的」）：保留 fork 的四条分支行为，不采纳上游本轮的 Windows `hide_panel + show_main_window` 分支与其注释改写。代价：`lib.rs` 该处 6 行 + 注释行成为每轮固定重叠面；收益：fork 已发布、有源码护栏、README 与能力规格都写明的左键契约不变。
2. **`settings.general.trayStyleHelp`**（Q2）：4 locale 改写为 fork 行为描述，不取上游原文。该 4 行自此为 fork 专属文案，登记进 `HOW_TO` 白名单 locale 行。
3. **README §14 与 `tray-left-click-toggle` 总规格**（Q3）：本轮一并修正为面板样式/原生菜单样式两种模式的真实左右键行为。
4. **portable zip 直下**（上游 v4.0.13 `b391565f`，本轮仍在）：不接入前端更新入口（沿用历轮取舍）；`open_portable_update_download` 后端命令保留注册，其 URL 基址与 `check_for_updates` 指 tunecc。
5. **`codegen-units`**：fork 保留 `= 1`（既有取舍）。
6. **`tr.json`**：与上游 tag `v4.0.17` 逐字节一致，不补 fork 键。
7. **基线确认**：tag `v4.0.17` = `b5a1bdc7`（剥离 `19798e2f`）；交付按 Q4 授权（push main + tag `v4.0.17-1`）。

### 预设 id 编号契约（延续）

预设选择项 `id` 数字 = 原始预设数组下标；fork 的白名单过滤必须发生在编号之后。上游本轮未新增预设条目（`src/config/*ProviderPresets.ts` 不在重叠面），四处入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）仍为「按原数组下标编号 → 过滤上游 `hidden` → 按白名单名称集合过滤」；本轮 `ProviderForm.tsx` 被上游改写，必须复核该文件的 `entriesFor` 形态未变。

### 本地化状态

- 语言集合 `zh`/`zh-TW`/`en`/`ja`/`tr` 不变。
- 本轮上游 4 个 locale 各 +2 键（hermes 内置 id 两条警告）+1 行改写（`trayStyleHelp`，被 fork 文案取代）；`tr.json` 零变化。
- 土耳其语下 fork 专属文案回退英文（`fallbackLng: "en"`），既有决定不变。

### 数据库 schema 状态

- `SCHEMA_VERSION` == 21（上游 v4.0.17 仍为 20，发布说明明确 schema 不变）；迁移链 v18→v19（上游 mcode + fork `website_url_2` 并存）、v19→v20（上游）、v20→v21（fork 修复迁移）原样保留。
- 上游本轮对 `src-tauri/src/database/**` 零改动（不在 42 个文件内）。

### `.comet/config.yaml` 保护

- 重放涉及该文件或 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。

### 已知流程坑位（沿用）

- Runtime `verification_checks` 的 `executable` 与 `argv` 分开填、`cwdRef` 必须是真实存在的相对目录；argv 不含程序名、不含 shell 语法。
- 长重放 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 与落盘，再 continue。
- `--ours` 是新基线，`--theirs` 是重放的 fork 提交。
- 重放中途不跑 `cargo test`；最终态冲突标记零命中（`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD`）。
- JSX/Rust 合并禁止按行去重；手工拼接后必须 `pnpm format:check` + `pnpm build:renderer`。
- locale 重复键显式查重（按对象作用域）；预设 interface 的 `hidden?: boolean` 重复声明必须删 fork 侧（本轮上游未动预设文件，预期无需处理，仍要查重确认）。
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推同一 tag 对象；查 fork Actions 必须显式 `--repo tunecc/cc-switch`。
- SSH 被 fake-IP 接管时用 gh HTTPS credential helper 推送。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态（fork 已按 `fork-test-stability` 口径修稳）。
- 上游自带 `stream_check` 前端死代码（本轮取证，属 fork 既有状态、非同步丢失）：`src/lib/api/connectivity-check.ts:28` 仍 `invoke("stream_check_provider", …)`、`src/hooks/useStreamCheck.ts` 仍在（两个文件 fork 从未修改，`git diff --quiet v4.0.17 HEAD -- <file>` 为空），而后端命令注册早已被 fork 换成 `connectivity_test_provider_models`/`connectivity_probe_provider`。实测 `git grep -I -l useStreamCheck HEAD -- src tests` 只命中该 hook 自身与 `tests/components/SwitchModePanel.test.tsx:51` 的 `vi.mock`，无任何组件调用 → 不会在运行时触发。下一轮同步要重新确认「仍无调用方」，不得为了让 grep 干净而去改这两个上游文件。
- 预设 interface 查重实测：本轮上游未改任何 `src/config/*ProviderPresets.ts`（不在 42 文件内），fork 的 `hidden?: boolean` 与上游字段无新增碰撞；仍按口径复核 7 个预设文件与 `claudeDesktopProviderPresets.ts` 的 `hidden` 声明各 1 份（`pnpm typecheck` 零 `TS2300`）。
- 上游自带 CI 竞态：`services::session_usage_codex::tests::test_parent_rollout_is_cached_once_across_fork_cutoffs`（本轮该文件被 `8cfe5644` 改写）在 v4.0.15-1 轮 fork CI 与上游 CI 同时红；单条红的判定顺序是先证与上游逐字节相同、再看上游同用例是否同样红、最后本地重复跑取证。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

### 版本号

- 四处文件 `4.0.17-1`；语义：上游版本号 + `-N`，N 为同一上游版本的 fork 构建代数。

### 交付（上传，按已确认授权 Q4）

- 交付是验收通过并生成归档提交之后的步骤：`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.17-1` 并 `git push origin v4.0.17-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。不创建 PR，不含其他远端引用。
- 执行后回报：`main`/`origin/main` 一致性、tag 指向的提交、Release run 的 status/conclusion（用 `gh api --repo tunecc/cc-switch` 复核，不信包装工具输出）。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 `__CCS_DEV_PANEL__` 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `VisibleSidebarPanels` 持久化）——与上游 `nativeTrayMenu` 同处 `types.ts`/`settings.rs`，两段并存。
- 供应商卡片模型徽章与快捷切换弹窗、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 预设文件 `hidden` 字段 + 四处表单接线的「编号先于过滤」）。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`lib.rs` 两个命令注册在位，`stream_check` 不回来）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路，含 `deeplink/provider.rs`、`proxy/model_mapper.rs`、`services/provider/mod.rs` 测试字面量里的 `website_url_2: None`）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支 + `tray_panel::panel_visible` + 源码级护栏），终态行为见「托盘左键与文案终态」。
- 跨应用导入供应商配置（5 个 Form + `ProviderPresetSelector.extraActions`）。
- 禁用应用内更新器（About 指向 tunecc Releases、启动自检取消、`install_update_and_restart` 空壳、无 updater 插件/依赖/AIP）。
- 对上游自带测试的稳定性修正（`apps-page-cache-race`、deeplink 开关初值 `waitFor` 等，按 `fork-test-stability` 能力规格重新套用）。
- 上游 tag 的发版构建跳过与 fork CI 裁剪（`.github/workflows/{ci,release}.yml` 整文件保留）。
- README fork 差异说明与构建说明（含本轮 Q3 修正后的 §14）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

- `__CCS_FORK_BUILD__` 2、`__CCS_DEV_PANEL__` 2、`DevPanel` 3、`visibleSidebarPanels` 4、`batchConnectivityTest` 4、`extractModelBadgeForProvider` 3、`ModelQuickSwitchDialog` 4、`websiteUrl2` 27、`website_url_2` 17、`filterForkPresets` 6、`forkOfficialAllowlist` 2、`ProviderImportEntry` 7、`applyQuickSort` 1、`connectivity_test_provider_models` 5、`connectivity_probe_provider` 4、`toggle_main_window` 3、`hide_main_window` 2、`panel_visible` 3、`show_menu_on_left_click(false)` 4。
- 1M 全选符号本轮实测为 `ClaudeFormFields.tsx:700-705` 的 `oneMRows`/`oneMToggleValues`/`allOneMEnabled`/`someOneMEnabled`（`oneMToggleAll` 这个猜测名在仓库里命中 0，不作为取证口径）。
- `devpanel` 键段按既有状态只存在于 `zh`/`en` 两个 locale（`ja`/`zh-TW` 命中 False，属 fork 既有状态，不补）。
- fork CI 裁剪保持：`.github/workflows/ci.yml` 与 `release.yml` 与上游 `v4.0.17` 存在差异（fork 整文件保留版），构建目标仍只有 Windows x64 与 macOS arm64 unsigned。

### 构建与测试

- `pnpm typecheck` / `pnpm test:unit` / `pnpm format:check` / `pnpm build:renderer` / `cargo check` / `cargo test`（环境性例外按 A13 口径）全部通过。

## 非目标

（同本 change brief 的「非目标」一节，此处不重复。）

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（`pre-sync-v417` = `a525de9d4`）。
- 不确定的冲突：不盲目 `--continue`，先复核；无法安全判定时暂停记录。
- 12 个重叠文件出现「整文件取一侧」即视为丢语义缺陷；特别是 `lib.rs`（整取上游会丢 fork 左键 + updater 移除 + connectivity 注册）、`tray.rs`（整取上游会带回 `native_menu_on_left_click` 并破坏 A19 护栏）、`tray_panel.rs`（整取任一侧会丢 `panel_visible` 或上游面板修复）、4 个 locale（整取上游会吃掉 fork 键段与 Q2 文案）。
- 终态必须逐条成立：`.show_menu_on_left_click(false)`（`lib.rs`）、`set_show_menu_on_left_click(false)`（`tray.rs::apply_tray_style`）、`native_menu_on_left_click` 零命中、`tray_left_click_never_opens_the_menu` 用例通过。
- 上游 `lightweight.rs` 的 `release_if_lightweight` 调用必须落地：否则 fork 侧「轻量模式仍持有面板 WebView」的缺陷不随上游修复，且 `cargo check` 会因 `tray_panel::release_if_lightweight` 未使用而失去调用方。
- `Cargo.lock` 终态只允许两类差异：`cc-switch` 版本号行与上游 `mio 1.2.1`（含 checksum）；`tauri-plugin-updater` 相关条目必须为 0。
- Q2/Q3 的文案与文档改动若被后续重放覆盖（例如 rerere 复用旧解法），终态必须重新套用并在 `HOW_TO` 白名单登记。
