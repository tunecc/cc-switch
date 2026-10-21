# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.17`（tag 对象 `b5a1bdc7`，剥离提交 `19798e2f`），fork 侧 166 个提交（`v4.0.16..main`）按原顺序整体重放，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.16-1` 升为 `4.0.17-1`。上游 `v4.0.16..v4.0.17`（18 提交、42 文件、+1875/−168）与 fork 的重叠面为 12 个文件，其中**只有托盘左键行为这一处是「上游本轮也改了我们做过的功能」**：上游把 Windows 的托盘左键改成「收起面板并打开主界面」，与 fork 的「左键单击切换主窗口显隐」落在 `src-tauri/src/lib.rs` 的同一个 `TrayIconEvent::Click` 分支上——用户已决定**保留 fork 的左键语义**，并据此改写 4 个 locale 的 `settings.general.trayStyleHelp` 文案、修正 README §14 与 `tray-left-click-toggle` 总规格的既有漂移；交付沿用上轮方式（推 main + 打 `v4.0.17-1` tag）。

- 版本号 `4.0.16-1` → `4.0.17-1`；基线 tag `v4.0.17` = `b5a1bdc7`（剥离提交 `19798e2f`）。
- 上游只锁「已发布 tag」：`v4.0.17` 之后的 `upstream/main` 提交（`c7dceb80` feat(agy) 集成 Antigravity CLI 管理）不进入本轮。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v417/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v417/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v417`（= 同步前 main `a525de9d4`，该提交同时是 origin/main），仅用于回退参照、重放前后 diff 对照与落地保真四 ref 比对。
- 随上游 rebase 落地的上游新增文件 6 个（`git diff --name-status v4.0.16 v4.0.17` 的 A 项）：`docs/release-notes/v4.0.17-{en,ja,zh}.md`、`src/config/hermesBuiltinProviderIds.ts`、`src/whats-new/4.0.17.json`、`tests/components/ProviderForm.hermesBuiltinKey.test.tsx`、`tests/config/hermesBuiltinProviderIds.test.ts`、`tests/utils/textNormalization.test.ts`。fork 在这些文件上无自有语义，全部随上游落地。
- 交付步骤（验收通过并归档后，按 Q4 授权）新增本地 annotated tag `v4.0.17-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.16-1` → `4.0.17-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。上游 `v4.0.16..v4.0.17` 对这四处除版本号行外还改了 `Cargo.lock` 的 `mio` 条目（`1.1.1` → `1.2.1`，含 checksum 行），本轮 npm 无依赖变化。
- 12 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.16 v4.0.17|sort) <(git diff --name-only v4.0.16 HEAD|sort)`；上游 42 文件 + fork 侧 328 文件）：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、`src-tauri/src/{lib.rs,tray.rs,tray_panel.rs}`、`src/components/providers/forms/ProviderForm.tsx`、`src/i18n/locales/{en,zh,ja,zh-TW}.json`。逐文件行数口径（`git diff --numstat v4.0.16 <ref> -- <file>`）：`lib.rs` 上游 7/8、fork 28/39；`tray.rs` 上游 21/3、fork 75/6；`tray_panel.rs` 上游 144/24、fork 10/0；`ProviderForm.tsx` 上游 20/5、fork 183/43；4 个 locale 各上游 3/1、fork `en` 329/25、`zh` 328/24、`ja` 316/24、`zh-TW` 316/24。完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 30 个文件随 rebase 直接落地：`CHANGELOG.md`、3 份 release notes、后端 `src-tauri/src/{commands/mcp.rs,lightweight.rs,mcp/{codex,hermes,opencode,validation}.rs,proxy/server.rs,services/mcp.rs,services/provider/{codex_direct,codex_login}.rs,services/session_usage_codex.rs,services/webdav_sync.rs}`、`src-tauri/tests/mcp_commands.rs`、`src-tauri/wix/per-user-main.wxs`、前端 `src/components/providers/forms/ApiKeyInput.tsx`、`src/tray-panel/{TrayPanel.tsx,api.ts}`、`src/utils/textNormalization.ts`、测试 `tests/components/{ApiKeySection,TrayPanel}.test.tsx`、`tests/config/hermesMinimaxProviderKey.test.ts`。
- `src/i18n/locales/{en,zh,ja,zh-TW}.json` 的 `settings.general.trayStyleHelp`：按 Q2 决定改写为 fork 终态行为的描述（4 行，文本见完整目标规格「托盘左键与文案终态」），不取上游原文。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（`lib.rs`/`tray.rs`/`tray_panel.rs` 行追加 v4.0.17 口径，locale 行登记 `trayStyleHelp` 的 fork 专属文案），新增 §4.4「v4.0.17 轮的叠加要点」。
- `README.md` §14「托盘图标左键切换主窗口」与 `docs/comet/specs/tray-left-click-toggle/spec.md`：按 Q3 决定修正为 v4.0.16 采纳上游托盘面板之后、并经本轮 Q1 确认的终态行为。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.17`（`b5a1bdc7` → 剥离提交 `19798e2f`）：当前 merge-base `f92ff0b0`（v4.0.16）。

### 删除

- 上游本轮**没有删除任何文件**（`git diff --name-status v4.0.16 v4.0.17` 统计：A 6 个、D 0 个、M 36 个）。
- 代码片段级删除只有 Q1 决定采用的取舍：上游 `lib.rs` 本轮新增的 `cfg!(target_os = "windows") && Left → tray_panel::hide_panel + tray::show_main_window` 分支与改写后的托盘注释行不落地（fork 左键语义保留）；上游 `native_menu_on_left_click` 辅助函数与其两处调用点继续维持 fork 上轮删除态。fork 已删除的 updater 链路、`stream_check` 链路不得被重放带回。
- 上游改写 4 个 locale 的 `trayStyleHelp` 原文（Q2 决定不采纳，按 fork 文案取代）；本轮除此之外没有 locale 键删除（实测键集合差：4 个 locale 各 +2 −0 ~1，`tr.json` 零变化）。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v417` 是安全参照分支）。
- 不新增 fork 专属代码文件；不改 `forkPresetFilter.ts` 判定实现与 `forkOfficialAllowlist.ts` 既有条目（上游本轮未新增任何预设条目，`src/config/*ProviderPresets.ts` 全部不在重叠面内；新增的 `hermesBuiltinProviderIds.ts` 是内置 provider id 判定表，不是预设卡片）。
- 不创建 PR；不推送除 Q4 授权范围之外的任何远端引用。
- 不新增数据库迁移（上游 v4.0.17 发布说明明确「The database schema is unchanged, still at 20」，fork 保持 21）。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致；实测上游本轮对 `tr.json` 的键集合零变化）。
- 不撤销 fork 的「左键单击切换主窗口」能力，不删除 `tray::toggle_main_window`/`hide_main_window`、`tray_panel::panel_visible` 与源码级回归护栏用例。
- 不同步 `v4.0.17` 之后的上游 main 提交（Antigravity CLI 管理 `c7dceb80`）。

## 上游本轮同步范围（v4.0.16..v4.0.17，18 提交 42 文件 +1875/−168）

- **托盘面板稳定性与额度显示**（6 提交）：`91ab270e`（两列跟随面板高度、右列内滚动，悬停不再跳动；Windows 按显示器 scale 换算并收窄到工作区）、`74cf8e6f`（跨显示器弹出后刷新 DPI 坐标）、`099c9761`（额度条三列对齐并显示「还有多久重置」）、`7e97b44f`（`QuotaLine.emphasis` 新字段，只给余额金额上色）、`c42e3067`（面板里余额显示绿色，用完保持警示色）、`73adfaf0`（轻量模式释放面板 WebView：新增 `tray_panel::release_if_lightweight`，`lightweight.rs:29` 与 `hide_window` 内调用）。主战场 `src-tauri/src/tray_panel.rs`（上游 +144/−24）与 `src/tray-panel/{TrayPanel.tsx,api.ts}`、`tests/components/TrayPanel.test.tsx`。
- **Hermes 内置 provider id 警告**（`f460410f`）：新增 `src/config/hermesBuiltinProviderIds.ts` 与 `isHermesBuiltinProviderId()`，`ProviderForm.tsx`（上游 +20/−5）在 provider key 命中内置 id 时显示 `hermes.form.providerKeyBuiltin` / `providerKeyBuiltinLocked` 两条新文案（4 locale 各 +2 键），不阻断保存；新测试 `tests/components/ProviderForm.hermesBuiltinKey.test.tsx`、`tests/config/hermesBuiltinProviderIds.test.ts`。
- **Windows 托盘左键回到「打开主界面」**（`91ab270e` 内的 `lib.rs` 改动，上游 release notes 单列为「On Windows, a left click on the tray icon opens the main window again」）：`lib.rs`（上游 +7/−8）把 `TrayIconEvent::Click` 分支改成 `cfg!(windows) && Left` 优先 → `tray_panel::hide_panel()` + `tray::show_main_window()`，else 非原生菜单 → `tray_panel::toggle`，else 原生菜单 → `mark_feedback_seen()`，并改写上方注释。**这是本轮唯一与 fork 既有魔改正面重叠的改动，Q1 决定保留 fork 语义、不采纳该分支。**
- **其余修复**（9 提交）：`cf312f6a`（同时勾选多个 MCP 时先取应用切换锁）、`52e87344`（只有 url 没有 type 的 MCP 服务器按远程服务器投影到 Hermes/OpenCode）、`95693d6c`（不再把过期太久的 stash 登录交回代理）、`1f1becfb`（TOML 只规范化作为字符串定界符的弯引号，`src/utils/textNormalization.ts` + 新测试）、`5cbe6700`（WebDAV 清单以 `application/octet-stream` 上传）、`2dfc848f`（Windows 子进程不再继承监听 socket）、`8cfe5644`（Codex 远端 compaction 用量从 `token_usage_record` 计数，改 `services/session_usage_codex.rs`）、`4ea66d88`（MSI 安装时清掉遗留 `portable.ini`，改 `src-tauri/wix/per-user-main.wxs`）、`9be88e3e`（`ApiKeyInput.tsx` 关闭 macOS 首字母大写/自动纠错/拼写检查）。
- **发布相关**（2 提交）：`e172f37d`（四处版本号 + `Cargo.lock` 的 `mio` 升 1.2.1 + CHANGELOG）、`19798e2f`（v4.0.17 release notes 三份 + `src/whats-new/4.0.17.json`）。

# 非目标

- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等）与 `v4.0.17` 之后的 main 提交；不做部分 cherry-pick。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.16-1` 及更早的 fork tag。
- 不改动 fork 的数据库迁移链（SCHEMA_VERSION 21 与 v20→v21 修复迁移原样保留）。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程、旧 `stream_check` 链路）。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不改任何上游共享代码的行为（除必要的 fork 改动叠加、Q1 取舍与 Q2/Q3 选定的文案与文档口径）。
- 不给 `tr.json` 补 fork 键。
- 不改上游自带的测试与用例语义（除重放必须连接的改写）。
- 不重构 fork 既有魔改以迎合上游新代码；只做叠加与必要的契约适配。
- 不改上游托盘面板内部实现（面板内容以上游为准，本轮 fork 只改左键分派与设置页说明文案）。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.17` 等于 `19798e2f`（tag `v4.0.17` 剥离出的提交），`git log v4.0.17..main` 只包含 fork 提交、不含任何上游提交。
- A2: 重放前 `v4.0.16..pre-sync-v417` 的 166 个 fork 提交按原顺序逐一重放；`git log --format='%s' --reverse` 主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）在完整目标规格「重放映射」中逐条记录；patch-id 走 stdin 对照，差异逐个归类为「仅 hunk 位移」或「冲突停车」；每次冲突停车逐条记录归属与解法。
- A3: 12 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（高危面为 `src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/tray_panel.rs`、`src/components/providers/forms/ProviderForm.tsx`、4 个 locale、4 个版本与锁文件）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.17-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试（含 `lib.rs` 的 `connectivity_test_provider_models`/`connectivity_probe_provider` 两个注册在位）、双官网链接、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.4 v4.0.17 叠加要点、`lib.rs`/`tray.rs`/`tray_panel.rs` 行的新口径与 `trayStyleHelp` 的 fork 专属文案登记），本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类），三处记录的数字与归属互相一致。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/components/ProviderForm.hermesBuiltinKey.test.tsx`、`tests/config/hermesBuiltinProviderIds.test.ts`、`tests/utils/textNormalization.test.ts`、`tests/components/TrayPanel.test.tsx`、`tests/components/ApiKeySection.test.tsx`、`tests/config/hermesMinimaxProviderKey.test.ts`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自本轮允许项：`cc-switch` 版本号行 `4.0.17-1` 与上游的 `mio 1.2.1`（含 checksum 行）；`tauri-plugin-updater` 相关条目不得出现。
- A13: `cargo test` 通过（含 fork 的托盘左键源码护栏用例与随上游改写的 `src-tauri/tests/mcp_commands.rs`、`services/session_usage_codex.rs`）；如遇与上轮同因的环境性失败，按规格固定的 skip 口径记录原因，不扩大跳过列表。
- A14: 落地保真核对通过：对 12 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.16`、`v4.0.17`、`pre-sync-v417`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键，fork 键段按 key 逐个比对全部在位；上游本轮 2 个新键（`hermes.form.providerKeyBuiltin`/`providerKeyBuiltinLocked`）在 4 个 locale 全部在位且取值与 `v4.0.17` 逐字节一致；`tr.json` 与 `git show v4.0.17:src/i18n/locales/tr.json` 逐字节一致。
- A16: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`。
- A17: 上游本轮托盘面板改动在 fork 落地后可用：`src-tauri/src/tray_panel.rs` 的 `release_if_lightweight`、`PanelPlacement` 缩放/负坐标与两列同高逻辑、`QuotaLine.emphasis` → `PanelQuotaLine.emphasis` 链路、`src/tray-panel/TrayPanel.tsx` 与 `api.ts` 的 `emphasis`/reset 倒计时渲染、`src-tauri/src/lightweight.rs` 的调用点全部在位，且 `tests/components/TrayPanel.test.tsx` 与 `src-tauri/src/tray.rs` 的 emphasis 单测通过。
- A18: 上游 Hermes 内置 provider id 警告在 fork 落地后可用：`src/config/hermesBuiltinProviderIds.ts` 与 `isHermesBuiltinProviderId` 在位、`ProviderForm.tsx` 的两条提示分支与 `data-testid="hermes-key-builtin-warning"` 在位、4 locale 两个新键被该分支引用、两个上游新测试通过；fork 的预设过滤接线（`entriesFor` 编号先于一切过滤）不受该分支改写影响。
- A19: **fork 左键契约的源码级回归护栏通过**：`src-tauri/src/tray.rs` 的 `tray_left_click_never_opens_the_menu` 用例在重放后仍成立（`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`、`lib.rs` 的 builder 固定 `.show_menu_on_left_click(false)`），上游的 `native_menu_on_left_click` 辅助函数与其调用点在 fork 终态仍为零命中。
- A20: **托盘左键终态行为等于 Q1 确认的 fork 口径**：`src-tauri/src/lib.rs` 的 `TrayIconEvent::Click` 分支为——非原生菜单（面板样式）下左键 Up 且 `tray_panel::panel_visible()` 为假时调 `tray::toggle_main_window`，面板已显示或右键 Up 时调 `tray_panel::toggle`；原生菜单样式下左键 Up 调 `tray::toggle_main_window`、右键 Up 调 `tray::mark_feedback_seen()` 后交由系统弹菜单；上游本轮的 `cfg!(target_os = "windows") && Left → hide_panel + show_main_window` 分支不在终态代码中。`tray::toggle_main_window`/`hide_main_window` 与 `tray_panel::panel_visible` 三个 helper 在位且调用关系与完整目标规格「托盘左键与文案终态」一节逐条一致。
- A21: 4 个 locale 的 `settings.general.trayStyleHelp` 等于 Q2 确认的 fork 文案（完整目标规格逐 locale 记录终态文本），文案描述与 A20 的实际行为不矛盾；`src/components/settings/sections/GeneralSection.tsx` 仍通过 `t("settings.general.trayStyleHelp")` 渲染该行。
- A22: Q3 确认的两处 fork 侧文档已修正为终态行为：`README.md` §14 不再声称「右键单击仍弹出托盘菜单」（改为按托盘样式区分：面板样式右键弹面板、原生菜单样式右键弹菜单，左键切换主窗口），`docs/comet/specs/tray-left-click-toggle/spec.md` 的「右键菜单行为保持不变」需求与场景同步改写为同一口径；两处描述与 A20 的代码行为一致。
- A23: 上游 `2dfc848f`（子进程不继承监听 socket）与 `cf312f6a`/`52e87344`（MCP 切换锁与 url-only 服务器投影）在 fork 落地后可用：`src-tauri/src/proxy/server.rs`、`src-tauri/src/commands/mcp.rs`、`src-tauri/src/services/mcp.rs`、`src-tauri/src/mcp/{codex,hermes,opencode,validation}.rs` 与 `src-tauri/tests/mcp_commands.rs` 全部等于上游 `v4.0.17` 形态（fork 未触碰这些文件，逐项 `git diff --quiet v4.0.17 HEAD -- <file>` 为空）。

# 约束与不变量

- fork 全部 166 个提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v417`（= `a525de9d4`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；无法安全判定的冲突暂停并记录。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对 `<<<<<<<` 与 `>>>>>>>` 标记零命中（取证口径 `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD`）。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- **本轮最高风险叠加面是 `src-tauri/src/lib.rs` 的托盘 `TrayIconEvent::Click` 分支**：上游把「非原生菜单 → toggle 面板；原生菜单 + 左键且非 Windows → show 主窗口」重写为「Windows 左键优先 → `hide_panel` + `show_main_window`；否则非原生菜单 → `toggle`；否则 `mark_feedback_seen`」，fork 侧是「面板可见则收起面板，否则 `toggle_main_window`；原生菜单模式左键 `toggle_main_window`」。按 Q1 采用 fork 形态，解完必须确认 A20 的四条分支逐条成立，且与 A19 的 `show_menu_on_left_click(false)` 契约同时成立。
- `src-tauri/src/tray_panel.rs` 是第二个插入点相邻冲突面：fork 在 `panel_window` 之后、`ensure_window` 之前插入 `pub fn panel_visible`（HEAD 约 306–312 行），上游在 `hide_window` 之后插入 `pub fn release_if_lightweight`（`v4.0.17` 约 400–412 行）并改写 `place`/`show_at`/`toggle`；两侧函数都必须保留，不得整文件取一侧。终态 `hide_panel` 若已无调用方（Q1 不采纳上游 Windows 分支），必须核对 `cargo check` 的 `dead_code` 告警并按上游原样保留该公开函数。
- `src/components/providers/forms/ProviderForm.tsx`：上游 hermes 提示分支（约 2545 行区）与 fork 的预设过滤/跨应用导入/双官网接线同文件（fork 183/43 vs 上游 20/5）；解完必须确认 fork 的 `entriesFor`（编号先于 `hidden` 过滤、先于白名单过滤）在四处入口未被上游分支改写吃掉。
- 4 个 locale 的三方合并必须逐文件查重（按对象作用域统计重复键）：rebase 会把 fork 末键行与 `},` 收尾拼到同一物理行，`JSON.parse` 静默取后者、测试全绿。
- `src-tauri/src/services/session_usage_codex.rs` 本轮被上游 `8cfe5644` 改写，其 `test_parent_rollout_is_cached_once_across_fork_cutoffs` 用例是**上游自带的 CI 竞态**（v4.0.15-1 轮 run 39120749476 在 ubuntu-22.04 与 windows-latest 同时失败，上游 run 39108438049 同用例同样红）。单条红必须先按既有顺序取证：①与上游 tag 逐字节 diff；②看上游同用例是否同样红；③本地重复跑取证。
- `.comet/config.yaml` 被历史重放改写时从 ORIG_HEAD 恢复并核对 native 启用状态。
- current 工作区在 main 上 rebase：检出新基线瞬间工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape；按 Runtime 返回的恢复命令处理。
- 合并两侧 JSX/Rust 禁止按行去重；合并后必须本地跑 `pnpm format:check` 与 `pnpm build:renderer`。
- 时间敏感用例在本地 00:00–00:30 窗口必失败的既有口径继续适用（`tests/components/SessionManagerPage.test.tsx` 的分桶用例）。
- 推送（按 Q4 授权）只用 `--force-with-lease`；远端被他人更新时拒绝推送并报告。
- 上游 `package.json`/`Cargo.toml`/`tauri.conf.json` 版本号行必须被 fork 的 `4.0.17-1` 取代，终态不得残留裸 `4.0.17`。
- `CHANGELOG.md` 与 `docs/release-notes/**` 随上游落地：fork 本轮在同步区间未改过这些文件（实测 `git diff --name-only v4.0.16 HEAD` 不含 `CHANGELOG.md`），按白名单口径取上游。
- Q2/Q3 的文案与文档改动属于 fork 专属文件与 fork 专属语义，必须在同步终态提交里单独成一次提交或并入终态提交，并写进 `docs/HOW_TO_REBASE_UPSTREAM.md` 的白名单表以便下一轮重放。

# 决策

- 隔离方式：当前目录（`current`），沿用 main。理由：工作区干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去 15 轮一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（该能力既有总规格为纯散文；沿用历轮决策）。
- 版本号：`4.0.16-1` → `4.0.17-1`。
- 同步目标：只锁已发布 tag `v4.0.17`（`b5a1bdc7` → 剥离 `19798e2f`）；`upstream/main` 已推进到 `c7dceb80`（feat(agy) Antigravity CLI 管理），属 `v4.0.17` 之后的 post-release 区间，留待下一轮 tag。
- 数据库 schema：上游 v4.0.17 发布说明明确 schema 不变（仍 20），fork 保持 21，不新增迁移。
- 上游依赖：npm 无新增/移除依赖；Rust 侧 `Cargo.lock` 因上游升 `mio` 到 1.2.1（`Cargo.toml` 未直接声明 mio，属传递依赖版本行变化）。
- 预设白名单：上游本轮未新增任何预设条目（`src/config/*ProviderPresets.ts` 全部不在重叠文件集合内），`forkOfficialAllowlist` 无须追加；新增的 `hermesBuiltinProviderIds.ts` 是内置 id 判定表而非预设卡片。
- 本轮上游与 fork 的功能重叠只有托盘左键一处；其余 6 组上游改动（面板稳定性/额度配色、Hermes 内置 id 警告、MCP 两项、TOML 弯引号、WebDAV、Codex compaction、MSI portable 残留、macOS API key 大写、Windows socket 继承）fork 均无对应实现，全部直接随上游落地。
- `tr.json`：保持与上游 tag 逐字节一致，不补 fork 键（沿用 2026-10-15 决定；实测本轮上游对 `tr.json` 键集合零变化）。
- **Q1（2026-10-21 用户决定：保留我们的）**：`src-tauri/src/lib.rs` 的托盘左键分派保留 fork 语义——左键单击切换主窗口显示/隐藏（macOS 与 Windows 都生效），面板样式下面板已弹出时左键先收起面板，原生菜单样式下左键切换主窗口、右键弹系统菜单，`.show_menu_on_left_click(false)` 与 `apply_tray_style` 的 `set_show_menu_on_left_click(false)` 契约不变。上游本轮新增的 `cfg!(windows) && Left → hide_panel + show_main_window` 分支不采纳，其对应注释行一并不采纳；该取舍在落地保真核对里按「刻意取舍」逐行归类。
- **Q2（2026-10-21 用户决定：按 fork 行为改写）**：`settings.general.trayStyleHelp` 在 4 个 locale 改写为 fork 终态行为的描述（左键切换主窗口、右键弹出所选样式），不取上游原文；该行自此成为 fork 专属文案，登记进 `docs/HOW_TO_REBASE_UPSTREAM.md` 的 locale 行，未来每轮同步都要重新套用。先例：fork 已把上游 `provider.connectivityCheck` 文案改写（en `Connectivity check` → `Connectivity test`）。
- **Q3（2026-10-21 用户决定：本轮一并修正）**：`README.md` §14 与 `docs/comet/specs/tray-left-click-toggle/spec.md` 修正为面板样式/原生菜单样式两种模式下的真实左键与右键行为（上一轮采纳上游托盘面板后「右键弹菜单」已不成立）。两处都是 fork 专属文件，不增加上游冲突面。
- **Q4（2026-10-21 用户决定：沿用上轮方式）**：验收通过并用户接受结果、生成归档提交后，执行 `git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.17-1` 并 `git push origin v4.0.17-1`（触发 fork Release CI）。只授权这两项动作，不含 merge、PR 或其他远端引用；执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# 未决问题

- 无。Q1（托盘左键合并口径）、Q2（`trayStyleHelp` 文案口径）、Q3（fork 侧文档漂移是否本轮修正）与 Q4（交付授权）已于 2026-10-21 由用户确认，结论记入「决策」。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`
- `cargo test`（环境性例外按 A13 口径）
- 落地保真核对脚本（四 ref 归一化行多重集，12 个重叠文件）+ locale 重复键查重 + 冲突标记零命中
- fork 左键契约源码护栏用例（A19）与 `lib.rs` 终态左键分支（A20）、4 locale 文案（A21）、两处文档（A22）的逐条比对
