# 完整目标规格：upstream-sync（v4.0.15 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线已确认为 tag `v4.0.15` = `988b0d00`（2026-10-18 用户确认）。fork 版本号 `4.0.15-1`。推送与 tag 属交付步骤，按已确认的交付授权（沿用上轮方式）在验收通过并归档之后执行。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.15` 指向的提交 `988b0d00`。
- `git merge-base main v4.0.15` == `988b0d00`；`git log v4.0.15..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 153 个 fork 提交（`git rev-list --count v4.0.12..main`，含 v4.0.12 的同步提交 `aeef1495`、白名单提交 `a6b62b86`、三次文档更正 `00878360`/`67a06e1d`/`9de33b2e`/`579a10f2`、归档提交 `dd631750`、AppsPage 竞态修正 `473378f6`、规格登记提交 `dbb06a89` 等）按原顺序重放，外加本轮的同步提交与归档提交。
- 重放映射核对口径（与 v4.0.12 轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v415`（= `dbb06a89`）固定记录。
- 上一轮基线 tag `v4.0.12` = `51ac86f1` 与 fork 发布 tag `v4.0.12-1`（指向归档提交 `dd631750`）保持不变。

### 同步范围（v4.0.12..v4.0.15：98 提交、229 文件、+17282/−2112）

#### v4.0.13（2026-10-16，30 提交、114 文件、+7171/−1551）

- **Claude Desktop 设备级 direct/route 模式**（8 提交 `3e9eede4`→`7c763cf3`）：Desktop 并入与路由应用相同的模式面板（`MODE_APP_IDS` 扩入 Desktop）；旧映射卡启动时迁移为路由；聚合（stack）模式上 Desktop 后端与面板（`b93bf12d`、`e5508224`）；回直连二次确认（`f9e0d537`、`7c763cf3`）；映射卡拆分为 route + official direct（`58354f91`）；聚合 id 冲突解析（`e4367db5`）。删除 `src/components/providers/mode/DesktopAccessBar.tsx`（上游客改，fork 未触碰）；`Sidebar.tsx` 删 `AppNavStatus.mapping` 与 `nav.mode.mapping*` 键；locale 删 `nav.todayCost`、`nav.mode.mappingFull`。
- **Codex 审批与聚合模型**（`e70e844c`、`6aeaeb17`）：Auto Review 可选另一模型（设置键 `codexStackAutoReviewModel`）；聚合 sub-agent 模型与推理强度可选（`codexStackSubagentModel`/`codexStackSubagentReasoningEffort`）；经典子代理工具默认开启，设置键由 `codexStackClassicSubagents` 改名 `codexStackClassicTools`（`codexAuthSettings`/`commands/settings.rs`/`types.ts` 同步改名，fork 未触碰这些文件除 types.ts 重叠段）。
- **Claude 1M 扩展**（`3d46e06c`、`31038e68`、`5fd57811`）：Haiku 档可勾 1M（此前只 Sonnet/Opus/Fable/Subagent）；预设模型有 1M 窗口的预勾；Claude Desktop 预设声明 1M。快照金标 `ProviderForm.presetRows.golden.test.tsx.snap` 相应更新（kimi-k3 → kimi-k3[1M]）。
- **portable zip 直下**（`b391565f`）：新增 `open_portable_update_download` 命令（`commands/misc.rs`），About 面板 portable 分支改为直接下载对应架构 zip（`AboutSection.tsx` + `settings.ts` API）。**fork 取舍：不接入**（见「冲突解决」与 Decisions）。
- **预设**：TokenFactory（`e7a76adc`）、Modelflare（`0a6eb00e`）赞助商预设入 9 个 app；GPT 系预设上下文封顶 272K（`be0a9cf0`）；sponsor promo 文案恢复（`6f6eee0c`）。
- **修复**：Windows 原生 CSS 拖拽区（`09237ebd`）、Codex compaction 偏好保留（`16537fd3`）、分页 continuation 页解析（`67d63e3e`）、CLI 搜索路径去重（`76f99d41`）、opencode 请求时延（`81bc1bce`）、Chat 流 DONE 边界（`f318e65e`）、Codex 引号表头 base_url（`c1051f8e`）。

#### v4.0.14（2026-10-16，30 提交、100 文件、+4242/−373）

- **用量看板定制**（核心提交 `4e20fad5`、`8f3337d9`、`0cfea5e3`、`c6daf78c`、`b194cc09`、`9d83b2e8`、`85ae0c7b`、`17960423`、`9d83b2e8`）：新增 `UsageDisplaySettings`（`types.ts` 与 `settings.rs` 相应结构）存 `usageDisplay` 于 `settings.json`：显示币种与可编辑汇率、侧栏 Today 标签内容可选（成本/Token/请求数/命中率，空列表=隐藏）、请求日志列可选（新增缓存写、命中率、总耗时、状态码 4 列）、记住上次 tab/范围/图表指标、趋势图样式设置入 Display。`Sidebar.tsx` 的 Today 徽标相应改造（`6fcbb054` 只显数字）；`useSidebarStatus` 的 `AppNavStatus` 删 `mapping` 字段。
- **其他**：Open Terminal 说明并记住最近目录（`8c2c89e0`，新增 `OpenTerminalDialog.tsx`）；Gemini thought signature 往返与 skip 回退（`f2906db6`、`5089eb69`）；Codex 重试/流超时键保留（`898dd002`）；Skills 大仓库落盘 + 512MiB（`83f0155f`）；`COLLATE NOCASE` 定价（`e1864ac1`）；TokenFactory 去赞助化并本地化名称（`a96e2fcc`）；Pi 三色图标（`25310890`）；SiliconFlow CN 换 `deepseek-ai/DeepSeek-V4-Flash`（`722042ad`）；failover 队列去重（`8b4b92c6`）；Windows 会话组路径大小写合并（`2e03d8ce`）；dev 版本误报更新修复（`e8880e6f`）；Gemini 4 Argon 价格种子（`09bce301`，`database/schema.rs` +17 行）。

#### v4.0.15（2026-10-17，31 提交、86 文件、+5214/−380）

- **Windows 设置重置修复**（`8a06838d`、`97daccb6`；`settings.rs` +451/−46 主来源）：临时文件 + rename 原子保存；读取重试（5 次 × 200ms）、宽松解析（单字段无效仅丢该字段）、UTF-8 BOM 剥离、尾部 JSON 值只取第一个、未完整加载的文件备份 `settings.json.broken-<time>.bak` 且备份失败拒绝保存。
- **代理与会话**（`proxy/forwarder.rs` +134/−18、`proxy/providers/claude.rs` +50/−2、新增 `codex_chat_tool_history.rs`）：本地路由保持 Claude JSON 会话身份（稳定缓存键、Gemini 签名重放）；Codex Chat 恶化 tool-call 历史恢复与 DeepSeek 工具回放；Responses beta 标记保留；路由切换提示精细化（`5cc94b8d`：成功 toast 按实际生效报告、Codex/Gemini/Grok Build 仅在配置实际改变时要求重启；新增 `routeSwitchNotification.ts`）。
- **其他**：Codex 仅 `--version` 真失败才重装（`2bcf953b`；`commands/misc.rs` +368/−48 主来源之一，另含 Windows PATH 恢复 `ecb449f4`、WSL 探测 `e97fc33d`、dev 版本修复、quadratic 去重 `76f99d41`、portable 直链 `b391565f`）；macOS 图标白底圆角（`dd24b1ed`）；WebDAV/S3 超时按载荷伸缩（`c696c68f`）；Hermes WSL 实时 WAL 读取（`d23cee4c`，新增 `hermes_wsl.rs` + `hermes_wsl_reader.py`，发行版内需 python3）；Pi subagent 用量（`d1856448`）；拖拽防拉伸（`afbf073b`，`ProviderCard.tsx` 1 行）；趋势图 bar/area（`73f37c4b`）；Hermes 逐模型图像输入（`ff3e33a8`）；Claude Desktop 托管 OAuth 拉模型（`5d04c12d`，`ClaudeDesktopProviderForm.tsx` +131/−36 主来源）；DeepSeek 空钱包隐藏（`a94b592a`）；thinking level 弹层滚动（`b570f137`）；skills 分支回退仅 404（`24d87028`）；Claude Desktop 本机供应商引导本地路由（`7344cc37`）与每 1M 模型单行（`d4f2d4e4`，`services/provider/mod.rs` +95/−42 主来源）；opencode Unicode 深链接（`daf442e5`，`deeplink/provider.rs` +19/−8）。
- **发版**：`CHANGELOG.md` 三段、四处版本号、九份三语 release-notes、`src/whats-new/4.0.1{3,4,5}.json`。

#### post-release（本轮不纳入，留待下一轮随新 release）

- `77c6dc79` 托盘玻璃面板（3.7k 行：新增 `tray_panel.rs` 1108 行、`src/tray-panel/` 前端 5 文件、`capabilities/tray-panel.json`；macOS/Windows 点击托盘（左/右键 Up）弹出面板，Linux 保留原生菜单；**与 fork 托盘左键切换主窗口直接冲突**——上游把左键点击从菜单切换语义改为弹面板）。
- `73cdfbb7` 土耳其语 17 条文案修正（`tr.json` 17+17−，键不变）。

### 重放映射（本轮实测）

- 同步前 `git rev-list --count v4.0.12..pre-sync-v415` == 153；rebase 一趟完成，重放后 `git rev-list --count v4.0.15..main` == 154 —— 153 条重放提交（无提交被 git 判定为空而丢弃）加本轮 1 条最终态提交 `fc4c14f4`（同步终态：版本号、ClaudeFormFields 1M 适配、About 取舍、locale 收尾修复、HOW_TO §4.2）。归档时还会追加归档提交。
- tag `v4.0.15` 是 annotated tag：tag 对象 `988b0d00`，剥离提交 `79e754ab`；`git merge-base main v4.0.15` == `79e754ab` ✓；`git log --format=%an v4.0.15..main | sort -u` 只有 `Tune`，区间内无任何上游提交 ✓。
- 提交主题序列逐行 diff（重放前 `v4.0.12..pre-sync-v415` 与重放后 `v4.0.15..main` 前 153 条）差异 0 行 ✓。
- patch-id 对照（stdin 口径 `git show <c> | git patch-id --stable`）：**142 个与重放前完全相同，11 个不同**，逐条归类如下，无一属于「fork 语义丢失」：
  1. `#2 54e60e84→5c998e8c`（版本号与产品名）：交互式冲突停车，三处版本号 hunk（新基线 `4.0.15` vs 历史值 `3.20.2-fork.1`）→ 取 fork 侧值。
  2. `#12 656bc7e8→74c3d324`（预设接口 `hidden` 字段）：增删行集合完全相同，仅 hunk 上下文位移（上游在同一带里新增预设）。
  3. `#34 0b3fc30f→5cb00085`（侧边面板可见性接线）：交互式冲突停车，`App.tsx` 的 appConfig import 六行 —— 取并集（上游 `isModeAppId` + fork `DEFAULT_VISIBLE_SIDEBAR_PANELS`/`isProxyAppId`）；终态又因上游删除 `isProxyAppId` 的全部使用点（Desktop 特判被 modeAppId 取代）在最终态提交去掉该 import（TS6133），fork 面板语义无损（`visibleSidebarPanels` 4 处使用在位）。
  4. `#42 e7190379→054b9a4f`（禁用应用内更新器）：交互式冲突停车，`AboutSection.tsx` 的 `handleCheckUpdate` 与 deps 数组 —— 取 fork 侧「检查更新 = 打开 tunecc Releases」（上游 portable 直链依赖 fork 已移除的 checkUpdate 链路，属既定取舍）；上游新增的 `settings.portableUpdateHint` 不引入。
  5. `#46 332ec4ea→42b49d8d` 与 `#47 a248d6a2→39991aa3`（prettier 归一 / 右键置顶置底）：增删行集合相同，仅上下文位移。
  6. `#49 45a3f4e9→c98c6503`（archive 提交带 ClaudeFormFields）：交互式冲突停车。上游 `3d46e06c` 删除 `ModelRoleRow.supportsOneM`（Haiku 也可声明 1M），fork 的一键全选 `oneMRows = filter(row => row.supportsOneM)` 失效。解法（最终态提交落地）：`oneMRows = modelRoleRows` 全量、一键设置按钮不再剥离 Haiku 的 `[1M]`、fork 用例断言 Haiku 从 `shared-model` 改为 `shared-model[1M]` —— 与上游新契约对齐，fork 一键全选语义保留（终态 `allOneMEnabled`/一键全选 1M 复选框在位，12 用例全过）。
  7. `#69 8cec2aa9→c61e3583`（连通性测试四语言文案）：交互式冲突停车，4 个 locale 的 provider 描述段 —— 取两侧键并集（上游新赞助商 modelflare/everyapi/alltokens/openmodel/grooroute + fork `etok`）；rebase 三方合并把 fork 末键行与 `},` 收尾拼进同一物理行（`JSON.parse`/vitest 不报错），最终态提交 + prettier 修复。
  8. `#74 3d98ff03→fb94190b`（stream_check 链路移除）：`Cargo.lock` 版本号行冲突（新基线 `4.0.15` vs 历史值 `3.20.1-1`）→ 取 fork 侧值。
  9. `#144 7b4b929a→02a1c34d`（v4.0.12 同步终态提交）：增删行集合相同，仅上下文位移。
  10. `#151 24daee2b→f7db4a46`（AppsPage 竞态修正）：交互式冲突停车 —— 上游给「全部更新」前新加 `waitFor(Codex/Gemini enabled)`，fork 的竞态修正把 Claude 断言包进 `waitFor`。合并取两者：`waitFor { Claude disabled + aria-busy + Codex enabled + Gemini enabled }`，fork 修正的三个 waitFor 点（装 mock 前等按钮、remount 后等按钮、断言包 waitFor）全部在位（`fork-test-stability` 能力要求满足）。
- 冲突停车清单（交互式 9 次）：#2 `package.json`/`Cargo.toml`/`tauri.conf.json`、#3 `App.tsx`（import 并集）、#7 `AboutSection.tsx`（取舍：fork 简化语义）、#34 `App.tsx`（同上）、#42 `AboutSection.tsx`（deps 数组）、#49 `ClaudeFormFields.tsx`+`ClaudeFormFields.test.tsx`（1M 契约适配 + 双方用例并集）、#69 4 locale（键并集）、#74 `Cargo.lock`、#151 `AppsPage.test.tsx`（waitFor 并集）。其余由 git 自动合并或 rerere 复用；复用结果已逐个复核。
- rerere 记录：`package.json`、`Cargo.toml`、`tauri.conf.json`、`Cargo.lock`、`App.tsx`、`AboutSection.tsx`、4 locale、`AppsPage.test.tsx` 的 preimage 已登记。

### 落地保真核对（48 个重叠文件，实测结果）

- 算法：与固定四 ref 口径一致（`v4.0.12`、`v4.0.15`、`pre-sync-v415`、HEAD=终态含最终态提交；归一化：去首尾空白、去行尾逗号、丢空行与纯符号噪声行；多重集差）。核对脚本 `/tmp/v415/fidelity.js`；locale 4 项以工作树（prettier 修复后）复算。
- 实测：**上游新增行缺失合计 18 行，fork 新增行缺失合计 7 行**，全部归类如下，无一行属于丢语义：
  - 4 个版本与锁文件各 2 行（刻意取舍）：上游 `4.0.15` vs fork 终态 `4.0.15-1`；fork 重放前的 `4.0.12-1` 被取代。
  - `src/App.tsx` 上游缺失 1 行（被改写而非删除）：上游单行 `import { APP_IDS, DEFAULT_VISIBLE_APPS, isModeAppId }` 改写为四行合并 import 块（含 fork `DEFAULT_VISIBLE_SIDEBAR_PANELS`）——`isModeAppId` 逐字保留，仅换行形态。
  - `AboutSection.tsx` 上游缺失 11 行（刻意取舍，brief 已授权）：上游 portable 直链分支依赖 fork 已移除的 `checkUpdate`/`resetDismiss`/`installUpdateAndRestart` 自检链路；fork 保留「打开 tunecc Releases」简化语义；`open_portable_update_download` 后端命令与 `settings.ts` API 随上游在位。
  - `ClaudeFormFields.tsx` fork 缺失 2 行（fork 旧写法被上游新契约取代）：`oneMRows = filter(row => row.supportsOneM)` 与注释行改为全量 `modelRoleRows`（上游 Haiku 1M 契约），一键全选语义保留。
  - `ClaudeFormFields.test.tsx` fork 缺失 1 行（同上）：Haiku 快速设置断言 `shared-model` → `shared-model[1M]`。
  - `AppsPage.test.tsx` 上游缺失 2 行（被改写而非删除）：上游两行注释改写进 fork 的 `waitFor` 合并块语义（「等探测完再点全部更新」的行为由 `waitFor { Codex + Gemini enabled }` 承载）。
  - 4 个 locale 的 fork `etok` 键与上游全部新键在终态 0 缺失（prettier 修复物理行粘连后复算全零）。
- fork 语义落地抽查（`git grep -I -l -e <模式> HEAD -- src src-tauri tests` 或终态文件核对）：`IS_FORK_BUILD`（7）、`visibleSidebarPanels`（App.tsx 4 / Sidebar 3）、`toggle_main_window`/`hide_main_window`（tray.rs 各 1，`lib.rs` 左键分支在位）、`website_url_2`/`websiteUrl2` 全链路、`connectivity_test_provider_models`+`connectivity_probe_provider`（lib.rs 2）、`extraActions`（5 个 Form + Selector 4）、`forkOfficialAllowlist`（6 个 local 条目官方名 + 空名单）、DevPanel（`src/components/devpanel/DevPanel.tsx` + `__CCS_FORK_BUILD__` define）、`tauri_plugin_updater`/`updater_builder` 命中 0、`stream_check` 仅剩 `database/schema.rs` 表结构、AppsPage 竞态修正三点在位、README fork 重写版、fork CI 裁剪、`.comet/config.yaml` native+classic。
- 上游功能落地抽查：Desktop 设备级模式（`isModeAppId`/ModeTabs、`DesktopAccessBar` 已删）、`UsageDisplaySettings`（types + settings.rs + UsageDisplaySection + 测试）、`open_portable_update_download`（misc.rs + lib.rs 注册）、Hermes WSL（`hermes_wsl.rs` + `hermes_wsl_reader.py` + CI python3 步骤——fork ci.yml 为白名单文件保留裁剪版，上游 WSL 步骤不适用）、`codex_chat_tool_history.rs`、`routeSwitchNotification.ts`、`useMoneyFormat.ts`、11 个上游新测试文件、`gemini-4-argon` 价格种子、`SCHEMA_VERSION` 上游仍 20（fork 21 保持）均随上游落地。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 49 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.12 v4.0.15 | sort) <(git diff --name-only v4.0.12 main | sort)`；上游 229 文件 + fork 444 文件）。逐文件叠加要求：

- **4 个版本与锁文件**：上游只改版本号行（`4.0.12`→`4.0.15`）；取 fork 版本号 `4.0.15-1`，不得整文件取一侧。`Cargo.toml` 保持 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`（上游本轮恢复了 `codegen-units = 16` + 注释，fork 侧保留自己的 `= 1`——fork 侧该行是 v4.0.12 轮之前的既有取舍，属「fork 历史提交携带的语义」，重放忠实保留）；`package.json` 保留 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`；`Cargo.lock` 的 `cc-switch` 条目版本取 fork 值、`tauri-plugin-updater` 相关条目不得回来；`tauri.conf.json` 保留 fork 的 `createUpdaterArtifacts: false` 与移除的 `trafficLightPosition`。收尾 `cargo check` 验证锁文件只允许 `cc-switch` 版本号一行差异。
- **`.github/workflows/ci.yml`**（上游 13+ / fork 31+57−）：fork 裁剪版（去 schedule/workflow_dispatch、去 WSL job 大段、去 Hermes WSL live 测试步骤）是既有取舍；上游新增 `additional-packages: python3` 与 Hermes WSL 测试步骤属上游增强。fork CI 无 WSL 矩阵与 Hermes live 测试，上游这两段在 fork 版本中无挂载点——按白名单惯例整文件保留 fork 侧（该文件在 fork 白名单清单内）。
- **`src-tauri/src/lib.rs`**（上游 1+ / fork 19+41−）：取上游 `commands::open_portable_update_download` 注册；叠加保持 fork 三段语义（移除 Updater 插件注册、托盘左键单击切换主窗口、connectivity_test 命令注册）。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0。
- **`src-tauri/src/settings.rs`**（上游 451+/46− / fork 47+）：取上游全部——`UsageDisplaySettings` 结构与 `AppSettings.usage_display` 字段、`codex_stack_classic_tools`/`codex_stack_subagent_model`/`codex_stack_subagent_reasoning_effort`/`codex_stack_auto_review_model` 字段（替代 `codex_stack_classic_subagents`）、原子保存 `write_settings_to_path`、宽松加载 `load_settings_from_path`/`parse_settings_lenient`/`read_settings_bytes`/`backup_settings_file` 与配套常量、语言白名单（含 `tr`）；叠加保持 fork 的 `VisibleSidebarPanels` 结构、`AppSettings.visible_sidebar_panels` 字段段与 `LocalMigrations` 实现。两侧区域不同（上游 diff 无 `visible_sidebar` 命中，已验证）。
- **`src-tauri/src/commands/misc.rs`**（上游 368+/48− / fork 1+/1−）：以上游 Windows PATH 恢复（`ecb449f4`）、Codex 重装判定（`2bcf953b`）、WSL 探测（`e97fc33d`）、dev 版本修复（`e8880e6f`）、quadratic 去重（`76f99d41`）、portable 直链（`b391565f`）为基础；叠加保持 fork 的 `check_for_updates` 跳转地址 `https://github.com/tunecc/cc-switch/releases`。上游新增的 `PORTABLE_ZIP_URL` 模板含 `farion1231`——**fork 取舍**：保留 `open_portable_update_download` 命令本体（lib.rs 注册随上游），但其 URL 基址与 `check_for_updates` 一律指向 tunecc；否则选中 portable 直链时落点错仓库。
- **`src-tauri/src/commands/settings.rs`**（上游 18+/9− / fork 7+/98−）：取上游 `stack_settings_changed` 聚合（`codex_stack_classic_tools` + 三个新字段的回滚逻辑）；叠加保持 fork 的 updater 空壳化（`install_update_and_restart`/`check_app_update_available` 参数改 `_app`、移除 `tauri_plugin_updater` import 与 `UpdateDownloadProgress`、`install_update_and_restart` 保留命令接口但不执行安装）。
- **`src-tauri/src/database/{schema,tests}.rs`**（上游 +17/+26 / fork +184/+76）：上游只加 Gemini 4 Argon 价格种子一行组与测试；fork 加的是 v20→v21 迁移段与测试。同文件不同区域，三方合并通常自动；停车时按 hunk 并集手工拼接。
- **`src-tauri/src/deeplink/provider.rs`**（上游 19+/8− / fork 1+）：取上游 opencode Unicode 深链接修复；叠加保持 fork 的 `website_url_2: None`（结构体字面量缺字段会编译失败，解完必须确认该行仍在）。
- **`src-tauri/src/proxy/forwarder.rs`**（上游 134+/18− / fork 2+/1−）：取上游四处修复（Codex Responses beta 标记、Gemini skip 签名回退、底层错误原因、stack 模式后端）；叠加保持 fork 的 `parse_custom_user_agent` 注释措辞与测试 `Provider` 字面量的 `website_url_2: None`。
- **`src-tauri/src/proxy/providers/{claude,mod}.rs`**（上游 50+/2− 与 1+ / fork 各 1+）：取上游 JSON 会话身份修复；叠加 fork 的 import/字段行。
- **`src-tauri/src/services/provider/mod.rs`**（上游 95+/42− / fork 4+）：取上游 Desktop 设备级模式、`switch_desktop_direct`、`desktop_needs_routing_error`、`RouteSwitchResult` 等；叠加 fork 4 行。**注意**：上轮被 skip 的环境性用例 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 已被上游改名为 `update_claude_desktop_route_provider_rewrites_profile_in_route_mode`——本轮 cargo test 的 skip 口径按实际失败项重新评估，不得沿用已不存在的名字。
- **`src-tauri/src/tray.rs`**（上游 45+/117− / fork 32+）：取上游删 `TrayMode::Desktop`/`mode_mapping`/`mapping_suffix`/`desktop_unavailable` 与土耳其语文案段调整；叠加保持 fork 的 `hide_main_window`/`toggle_main_window` 两个 helper 与调用点。高危叠加面：fork helper 位于 `apply_tray_policy` 之后，与上游删除段邻近，不得整文件取一侧。
- **`src/App.tsx`**（上游 28+/54− / fork 83+/1−）：取上游删 DesktopAccessBar 分支/引入、`mapping` 导航标签、Desktop 特判简化；叠加保持 fork 的 DevPanel 门控、产品名、侧边面板入口段（`visibleSidebarPanels`，`App.tsx:239-361`、传参 `:1630`）。
- **`src/types.ts`**（上游 25+/2− / fork 14+）：取上游 `UsageDisplaySettings` 接口、`Settings.usageDisplay`、`codexStackClassicTools` 等四个键替换 `codexStackClassicSubagents`；叠加保持 fork 的 `Provider.websiteUrl2`、`UniversalProvider.websiteUrl2`、`VisibleSidebarPanels`、`Settings.visibleSidebarPanels`。
- **`src/lib/api/settings.ts`**（上游 4+ / fork 0+/4−）：取上游 `openPortableUpdateDownload`；保持 fork 已删除的 `installUpdateAndRestart`（不得带回）。
- **`src/components/shell/Sidebar.tsx`**（上游 104+/27− / fork 12+/2−）：取上游 Today 徽标改造（`sidebarTodayItems`、双值行、tooltip 化）与 `AppNavStatus.mapping` 分支删除；叠加保持 fork 的 `visibleSidebarPanels` 过滤段（props、`allGlobals` 过滤）。fork 的 mapping 分支代码无自有语义，随上游删除。
- **`src/components/providers/ProviderList.tsx`**（上游 9+/11− / fork 229+/10−）：取上游删 Desktop 映射段（`19a3e8d4` 的 9− 主来源）与 `switchMode` 测试适配；叠加保持 fork 全部（右键置顶/置底、新建插入第二位、模型徽章、批量连通性、双官网链接、`probeResults`、`searchSlot`并存形态）。
- **`src/components/providers/ProviderCard.tsx`**（上游 1+/1− / fork 104+/1−）：取上游拖拽 `z-10` 移除；叠加 fork 徽章/双链接。
- **`AddProviderDialog.tsx`/`EditProviderDialog.tsx`**（上游各删 1 行 `motionPreset="none"` / fork 各 1-2+）：取上游删行；叠加 fork 行。
- **`forms/ProviderForm.tsx`**（上游 26+/3− / fork 183+/43−）：取上游 Auto Review 字段、openclaw UA 同步、Unicode 深链接相关改动；叠加保持 fork 的预设过滤接线（`entriesFor` 口径：编号先于一切过滤）、跨应用导入 `extraActions`、`websiteUrl2`、连通性接线。预设 id 编号契约（原数组下标编号 → 过滤）不变。
- **`forms/ClaudeDesktopProviderForm.tsx`**（上游 131+/36− / fork 85+/12−）：取上游托管 OAuth 拉模型（`5d04c12d` 全部）；叠加保持 fork 的跨应用导入与 Desktop 专属字段段。
- **`forms/ClaudeFormFields.tsx`**（上游 17+/35− / fork 279+/224−）：取上游 Haiku 1M（`3d46e06c`）；叠加保持 fork 的兜底模型直达区、快捷设置对齐、`SearchableModelPicker` 接线、双官网链接、1M 全选（`allOneMEnabled`）等。**高危**：fork 最大改动文件之一，两侧都在模型行/1M 复选框区域。
- **`src/components/settings/AboutSection.tsx`**（上游 14+/2− / fork 12+/60−）：**fork 取舍点**。上游把 portable 分支 `checkUpdates()` 换成 `openPortableUpdateDownload(...)`，依赖 fork 已移除的 `checkUpdate`/`hasUpdate` 自检链路。fork 保留自身简化版（About 不自检、不装更新、错误 toast 精简），上游新行 `settings.portableUpdateHint` 文案键不引入（fork 无 portable 更新 UI）。合并取 fork 形态为准、对上游 14+ 中与 fork 段正交的部分（如 `updateInfo?.availableVersion` 依赖数组项）按 fork 现状不需要的不引入。
- **`src/config/appConfig.tsx`**（上游 21+/2− / fork 9+/1−）：取上游 `MODE_APP_IDS` 扩入 Desktop 等原型改动；叠加保持 fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS`。
- **`src/config/*ProviderPresets.ts`（6 个重叠 + gemini/grokBuild）**（上游累计数百行 / fork 各 2+）：取上游全部新预设与治理；叠加保持 fork 的 `hidden?: boolean` 字段段。上游 local 条目计数 v4.0.12 = v4.0.15，forkOfficialAllowlist 不追加（见 Decisions）。
- **4 个 locales（zh/en/ja/zh-TW）**（上游各 111+/29− / fork 各 316..329+/24..25−）：按上游执行新增与改写（UsageDisplay/Today 徽标/路由切换提示/Hermes 图像输入/Desktop OAuth 拉模型/趋势图样式/新赞助商等全套键 + 删除 `nav.todayCost`、`nav.mode.mapping*`、`codexStackClassicSubagents*` 旧键）；保留 fork 键段（`devpanel` 只 zh/en、`connectivityTest`/`connectivityCheck`/`searchModels`/`noModelsFound`、模型快捷切换、双官网链接、跨应用导入、批量检测、侧边面板）。**必须逐文件查重**（rebase 三方合并会并存新旧写法且测试全绿）。
- **3 个测试文件 + 快照**：
  - `tests/components/AppsPage.test.tsx`（上游 9+/2− / fork 14+/3−）：上游改 `renderApps` 等待条件（`aria-hidden false`，两者兼容——fork 的 `waitFor(updateButton...)` 仍成立）与「全部更新」前等 Codex/Gemini 按钮可用；fork 的版本缓存用例修正（装 `mockImplementationOnce` 前先等按钮、remount 后同样先等、断言包 `waitFor`）按 `fork-test-stability` 能力规格重新套用，不得整文件取上游把修正丢掉。
  - `tests/components/ProviderList.test.tsx`（上游 1+ / fork 277+/5−）：上游 1 行 `switchMode={switchMode()}`；两侧并集。
  - `tests/components/ProviderPresetSelector.test.tsx`（上游 2+/2− / fork 33+）：上游 101→105 行断言因新赞助商落地 —— fork 过滤后行数不受影响（白名单外自动拒绝），断言改写时按 fork 语义修正并记录。
  - `tests/components/ClaudeDesktopProviderForm.test.tsx`（上游 70+ / fork 14+）：上游 2 条 OAuth 拉模型用例 + fork 用例并集。
  - `tests/components/ClaudeFormFields.test.tsx`（上游 29+/1− / fork 140+）：上游 Haiku 1M 用例 + fork 用例并集。
  - `tests/components/DeepLinkImportDialog.test.tsx`（上游 111+/1− / fork 4+/3−）：两侧并集。
  - `tests/components/__snapshots__/ProviderForm.presetRows.golden.test.tsx.snap`（上游 4+/4−）：取上游（kimi-k3[1M] 金标）。
  - `tests/setupTests.ts`（上游 6+/2− / fork 7+）：取上游 `cc-switch.usage.` localStorage 清理；叠加保持 fork 的 `IS_FORK_BUILD` mock 段。

### fork 取舍清单（2026-10-18 已确认的决定）

1. **portable zip 直下**（`b391565f`）：不接入前端更新入口；`open_portable_update_download` 后端命令保留注册（随上游、无害），其便携 zip URL 基址与 `check_for_updates` 指 tunecc。About 面板保持 fork 简化形态（不自检、不安装更新、无 `settings.portableUpdateHint` 文案键）。
2. **托盘玻璃面板**（`77c6dc79`）：**本轮不纳入**（Q1 选 tag v4.0.15，post-release 两提交留待下一轮）。下一轮若纳入，需处理与 fork 托盘左键切换主窗口的直接冲突（上游把左键 Up 改为弹面板），以「右键弹面板、左键保持切换主窗口」为 fork 语义叠加，实现成本需独立评估。
3. **`codegen-units`**：fork 保留 `= 1`（既有取舍），上游本轮改回 16 + 注释说明发布编译提速——随 fork 提交重放自然保留。
4. 基线确认：tag `v4.0.15` = `988b0d00`；交付授权沿用上轮方式（push main + tag `v4.0.15-1` 触发 Release CI）。

### 预设 id 编号契约（延续）

预设选择项 `id` 数字 = 原始预设数组下标；过滤发生在编号之后。本轮上游新增赞助商预设使 claude 数组增长（101→105 行金标），fork 白名单 （`filterForkPresets`）在编号后按 name 集合过滤——终态四处预设入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）仍为「按原数组下标编号 → 过滤 `hidden` → 白名单 name 集合过滤」。

### 本地化状态

- 语言集合 `zh`/`zh-TW`/`en`/`ja`/`tr` 不变；5 处语言分支/白名单/选项保持上游状态。
- `tr.json` 与 `git show v4.0.15:src/i18n/locales/tr.json` 逐字节一致（既有决定：不补 fork 键）；土耳其语下 fork 专属文案回退英文。


### 数据库 schema 状态

- `SCHEMA_VERSION` == 21（上游 v4.0.13/14/15 均为 20）；迁移链 v18→v19（上游 mcode + fork `website_url_2` 并存）、v19→v20（上游）、v20→v21（fork 修复迁移）原样保留。
- 上游本轮对 `database/**` 的改动仅价格种子（`gemini-4-argon` 行组 + 测试），不涉及表结构。
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
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推；查 fork Actions 显式 `--repo tunecc/cc-switch`。
- SSH 被 fake-IP 接管时用 gh HTTPS credential helper 推送。
- 时间敏感用例本地 00:00–00:30 窗口必失败的口径继续适用。
- 单条 CI 红的判定顺序（v4.0.12 轮口径）：①与上游 tag 逐字节 diff ②看上游同用例是否同样红 ③本地重复跑取证。

### 版本号

- 四处文件 `4.0.15-1`；语义：上游版本号 + `-N`，N 为同一上游版本的 fork 构建代数；跳过的 4.0.13/4.0.14 不单独计代。

### 交付（上传，按已确认授权）

- 交付是验收通过并生成归档提交之后的步骤。默认沿用上轮授权形态：`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.15-1` 并 `git push origin v4.0.15-1`（触发 fork Release CI）。不创建 PR。
- 授权范围（2026-10-18 用户确认沿用上轮方式）：验收通过并用户接受结果、生成归档提交后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.15-1` 并 `git push origin v4.0.15-1`；不含 merge、PR 或其他远端引用。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端持久化）——与上游 `UsageDisplaySettings` 同处 `types.ts`/`settings.rs`，两段并存。
- 供应商卡片模型徽章与快捷切换弹窗、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选——与上游 Haiku 1M 同处 `ClaudeFormFields.tsx`，并存。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 8 个预设文件的 `hidden` 字段 + 表单接线）——上游新赞助商预设自动被拒。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`forwarder.rs`/`misc.rs` 两侧语义并存，`stream_check` 不回来）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支）。
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

- rebase 中断/失败：`git rebase --abort` 回到起点（`pre-sync-v415` = `dbb06a89`）。
- 不确定的冲突：不盲目 `--continue`，先复核；无法安全判定时暂停记录。
- `lib.rs`/`settings.rs`/`tray.rs`/`misc.rs`/`commands/settings.rs`/`App.tsx`/`Sidebar.tsx`/`ClaudeFormFields.tsx`/`ProviderList.tsx`/`ClaudeDesktopProviderForm.tsx`/4 个 locales 出现「整文件取一侧」即视为丢语义缺陷。
- `deeplink/provider.rs`、`forwarder.rs` 取上游形态后必须确认 `website_url_2: None` 行仍在。
- 合并后 updater 命中数（`tauri_plugin_updater`/`updater_builder`）必须为 0。
- 推送只用 `--force-with-lease`；tag 推送触发公开发布流水线，只在验收通过、用户接受结果并按已确认授权后执行。
