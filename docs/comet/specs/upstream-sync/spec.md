# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.10 发布头（tag `v4.0.10` = `90fb37ff`），fork 版本号为 `4.0.10-1`。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.10-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q1 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 `90fb37ff`（tag `v4.0.10` 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == `90fb37ff`；`git log v4.0.10..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 139 个 fork 提交（`v4.0.9..main`，含 v4.0.9 的同步提交 `707ad2e1`、其归档提交 `ba963986`/`a33a9e41` 与格式修正提交 `883e1547`）按原顺序重放，外加本轮的同步提交、修复提交与归档提交。
- 本轮基线不含 post-release 区间：`upstream/main` = `d9a62313`，`git rev-list --count v4.0.10..upstream/main` == 1，该提交（`d9a62313` fix(ui): panel flicker (#8201)，涉及 `UniversalProviderFormModal.tsx`、`DailyMemoryPanel.tsx`、`WorkspaceFileEditor.tsx` 与 4 个测试文件）按「只锁已发布 tag」的既定惯例排除，进入下一轮范围。
- 上一轮排除的 6 个 post-release 提交（`3302cc2d` NekoCode 预设、`04bd15c9` ja「詳細オプション」、`28dc5198` 添加/编辑页取消淡入、`68122bc4` Codex 线程模型设置、`96d636ca` OpenRouter 空额度、`99277921` 无关自动保存改用已确认目录）已随上游 `db29caef` 发版进入 v4.0.10，本轮全部纳入基线。
- 同步前起点由安全分支 `pre-sync-v410` 固定记录（= 同步前 main `883e1547`，该提交同时是 origin/main 与本地 annotated tag `v4.0.9-1` 指向的提交），用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- 固定核对口径（与上一轮一致，复核必须按它执行）：
  - 重放前后计数：`git rev-list --count v4.0.9..main`（重放前，实测 139）与 `git rev-list --count v4.0.10..main`（重放后）之差只允许来自「被 git 判定为空而丢弃」或「本轮新增的同步/修复/归档提交」，逐条说明。
  - 提交主题序列逐行 diff：`git log --format='%H %s' --reverse` 对比重放前 `v4.0.9..pre-sync-v410` 与重放后 `v4.0.10..main`，139 条主题必须无遗漏、无重复、无顺序变化。
  - patch-id 对照：`git show <c> | git patch-id --stable` 按序逐条比对，不同的提交必须逐个归类为「内容相同仅 hunk 位移」或「对应一次冲突停车」，不允许出现「fork 语义丢失」。
  - `git merge-base main upstream/main` == `90fb37ff`；`git log --format=%an v4.0.10..main | sort -u` 只有 fork 作者，区间内无任何上游提交。
- 冲突停车清单：按 rebase 顺序逐条记录「fork 侧原提交 → 新提交、区间序号、冲突文件与 hunk、采用的解法、是否漏掉任一侧语义」。
- 最终态修正：记录在同步提交里、不属于任何单个重放提交的改动（版本号、`ClaudeFormFields.tsx` 之类的最终态整理、白名单文档条目、本 change 产物）。
- 实测结果：
  - 重放前 `git rev-list --count v4.0.9..pre-sync-v410` == 139；rebase 一趟完成，重放后 `git rev-list --count v4.0.10..main` == 139（无提交被 git 判定为空而丢弃、无冗余提交被去掉、无 git commit 段错误），加本轮同步提交 `dc3c8ac3` 后区间共 140 个提交。
  - `git merge-base main upstream/main` == `90fb37ff`；`git log --format=%an v4.0.10..main | sort -u` 只有 `Tune`（fork 作者），区间内无任何上游提交。
  - 提交主题序列逐行 diff（`git log --format='%s' --reverse`，重放前 `v4.0.9..pre-sync-v410` 与重放后 `v4.0.10..main` 各 139 条）差异 0 行：无遗漏、无重复、无顺序变化。
  - patch-id 对照（`git show <c> | git patch-id --stable`，按序逐条比对）：139 个提交中 **134 个与重放前完全相同**，5 个不同，逐条归类见下；无一属于「fork 语义丢失」。
- 5 处 patch-id 差异的逐条归类（按区间序号，标注 fork 侧原提交 → 新提交；本轮交互式停车 4 次 + rerere 自动解决 1 次）：
  1. `109ecae4→96438646`（2/139，fork 首个版本号提交）：交互式冲突停车。`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 各 1 个版本号 hunk（新基线写 `4.0.10`，该提交要写入的历史值是 `3.20.2-fork.1`）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`。patch 差异仅为「被删除的行从 `4.0.9` 变成 `4.0.10`」。
  2. `2a621f3b→1239f35b`（43/139，README 重写提交）：交互式冲突停车，`README.md` 整文件保留 fork 侧（`git checkout --theirs`）。patch 差异是被删的上游行随基线变了：`e0a03184` 把 OpenModel 赞助链接改成 `?ref=cc-switch`、`502d681b` 改写深链接行的措辞。fork 重写版 README 不含赞助商表与上游功能清单，属白名单刻意取舍。
  3. `ca8ffa4e→384241ae`（62/139，connectivity_test 命令与注册）：**rerere 复用上一轮记录的解法自动解决并直接提交，未在终端停车**。增删行集合与重放前逐字节相同（脚本核对 `added/removed lines identical=True`），差异只在 hunk 上下文与行号：上游在同一带里加了 `mod custom_icon;` / `pub use custom_icon::*;`，`lib.rs` 的命令注册带从 1653 行移到 1686 行。属「内容完全相同、仅 context 位移」；复用结果仍逐个复核。
  4. `94eb84c0→df6f2d9e`（74/139，移除旧 stream_check 链路）：交互式冲突停车，只冲突在 `src-tauri/Cargo.lock` 的 `cc-switch` 版本号行（新基线 `4.0.10` vs 该提交历史值 `3.20.1-1`）→ 取 fork 侧值。解决后 `src-tauri/src` 里 `stream_check` 命中只剩 `database/schema.rs` 的建表与索引两处（表结构按 fork 既有语义保留）；`lib.rs` 的 `tauri_plugin_updater` 与 `commands/settings.rs` 的 `updater_builder` 命中数均为 0。
  5. `a479e36c→449e7902`（90/139，托盘左键切换）：交互式冲突停车，`src-tauri/src/lib.rs` 1 个 hunk。上游 v4.0.10 把 macOS 分支的 `match event { RunEvent::Reopen … }` 改成 `if let RunEvent::Reopen { .. } = event { … }`，并删掉 `RunEvent::Opened` 分支（改由 deep-link 插件的 `on_open_url` 处理，重复处理会让同一条链接触发两次导入）；fork 该提交把 Reopen body 换成 `tray::show_main_window(app_handle)`。解法：取上游的 `if let` 结构与三行注释，body 用 fork 的 `tray::show_main_window(app_handle)`（该 helper 含窗口恢复、`apply_tray_policy`、Linux nudge 与轻量模式退出，是上游内联体的超集），补两行说明注释。注意 `match` 换成 `if let` 后收尾花括号少一层：本次先多删了一个 `}`（`#[cfg(target_os = "macos")]` 块未闭合），复核结构后补回。同提交带来的托盘左键分支、`show_menu_on_left_click(false)` 与 `tray.rs` 三个 helper 由 git 自动合并落地。
- 中间提交带未清理冲突标记（继承自 fork 历史，非本轮引入）：重放区间内 **69 个提交的 tree 含冲突标记**，主要是 `src/i18n/locales/en.json`（26–73 号段）、`SettingsPage.tsx` + 4 个 locales + `tests/components/ProviderList.test.tsx`（74–76 号段）、`src-tauri/src/database/tests.rs` 与 `services/provider/gemini_auth.rs`（84–106 号段），均由后续 fork 提交清掉。抽查 26/43/62/74/84/90/105 七个位置，重放前后同一序号提交的标记文件集合**完全一致**，属历史既有瑕疵的忠实重放，不算本轮丢语义；因此重放中途不能跑 `cargo test`，只在 rebase 完成后做编译校验。最终态 `<<<<<<< ` / `>>>>>>> ` 在工作树与 HEAD 均 0 命中。
- 最终态修正（记在本轮同步提交 `dc3c8ac3` 里，不属于任何单个重放提交）：
  - 版本号四处 `4.0.9-1 → 4.0.10-1`（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`），`src-tauri/Cargo.lock` 的 `cc-switch` 包条目同步为 `4.0.10-1`；`cargo check --all-targets` 复验后 `git status` 对锁文件只显示这一行改动，即锁文件未被额外改写（上游新增的 `png` 与 `tokio` 的 `net` feature 已随重放落地，fork 移除的 `tauri-plugin-updater` 未被带回）。
  - `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表补记本轮条目（`lib.rs` 的 pending 深链接与 Reopen 解法、`commands/{mod,settings}.rs`、`database/{mod,dao/mod,backup}.rs`、`deeplink/provider.rs`、`services/provider/mod.rs`、`BasicFormFields.tsx`、`AddProviderDialog.tsx` / `EditProviderDialog.tsx` 的 `motionPreset="none"`、8 个预设文件的 NekoCode、4 个 locales 的重复键查重义务、`Cargo.toml` / `Cargo.lock` 的 `png` 与 `tokio net`、`ProviderPresetSelector` 的 82 行断言），「说明」段补 99 个仅上游改动文件清单与本轮 5 次冲突统计。
  - 本 change 产物（brief / 完整目标规格 / comet-state）随同步与归档提交进入历史。
- 本轮检查实测结果：`pnpm typecheck` 退出码 0（`tsc --noEmit` 无输出）；`cargo check --all-targets` 通过（`Finished dev profile` 49.86s，仅 1 条 `unused import: crate::database::Database`（`src/services/provider/live.rs:1499`）警告，与 `pre-sync-v410` 同一行同一内容，属既有状态而非本轮引入）。`pnpm test:unit` / `pnpm format:check` / `pnpm build:renderer` / `cargo test` 由正式检查计划执行。

#### 落地保真核对（31 个上游/fork 重叠文件，A14，可复现口径）

- **算法（固定，复核必须按它执行）**：对每个重叠文件取四份文本 —— `v4.0.9`、`v4.0.10`、`pre-sync-v410`（= 同步前 main `883e1547`）、`HEAD`（= 同步后终态）。每份文本按行归一化：去首尾空白、再去掉行尾的一个逗号、丢弃空行，然后丢弃纯符号噪声行（集合 `{`、`}`、`};`、`},`、`(`、`)`、`[`、`]`、`,`、`;`）；把归一化结果建成**多重集**（保留同名行的出现次数）。定义
  - `上游新增行缺失 = (L(v4.0.10) − L(v4.0.9)) − L(HEAD)`
  - `fork 新增行缺失 = (L(pre-sync-v410) − L(v4.0.9)) − L(HEAD)`
  两项都按多重集差计算，最后的正数计数之和即为本节数字。用 `git diff` 的 `+`/`-` 行集合、或不做多重集而去重成集合，都会得到不同数字，所以本节只用上面的算法。
- **实测结果**：31 个文件中 **26 个两侧均为 0**，5 个非零；上游新增行缺失合计 **7 行**，fork 新增行缺失合计 **4 行**，两项全部是版本号与 README 的刻意取舍，无一行属于丢语义。26 个全零文件含本轮高危叠加面：`src-tauri/src/{lib,settings}.rs`、`src-tauri/src/commands/{mod,settings}.rs`、`src-tauri/src/database/{mod,backup}.rs`、`src-tauri/src/database/dao/mod.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/services/provider/mod.rs`、`src/components/providers/{AddProviderDialog,EditProviderDialog}.tsx`、`src/components/providers/forms/BasicFormFields.tsx`、8 个 `src/config/*ProviderPresets.ts`、4 个 `src/i18n/locales/*.json`、`tests/components/{AddProviderDialog,ProviderPresetSelector}.test.tsx`。即上游本轮在这些文件里新增的行没有一行丢失，fork 的 `website_url_2: None`、`custom_icons` 键读写、`strip_invalid_custom_icons` 调用、`PendingDeepLink` 链路、fork 键段与 fork 用例也都在位。
- **7 行上游缺失逐条归类**（README 3 + 4 个版本/锁文件各 1）：
  - `README.md` 3 行：上游 `e0a03184` 把赞助商表里 OpenModel 的两行改成 `?ref=cc-switch` 推荐地址与新措辞、`502d681b` 改写深链接条目指向 ccswitch.io 生成器。fork README 是「只记录与上游差别」的重写版，整张赞助商表与上游功能清单都不存在，白名单整文件保留 fork 侧 —— 刻意取舍。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.lock` 各 1 行：上游写 `4.0.10`，终态按 fork 惯例取 `4.0.10-1` —— 刻意取舍。
- **4 行 fork 缺失逐条归类**：上述 4 个版本/锁文件各 1 行，fork 重放前的 `4.0.9-1`（含 `Cargo.lock` 的 `cc-switch` 包条目）按惯例被 `4.0.10-1` 取代 —— 刻意取舍，非语义丢失。除此之外 fork 在 31 个重叠文件里的每一行（`hidden?: boolean` 字段段、`website_url_2: None`、fork locale 键段、fork 测试用例、`rightSlot` 等）在终态都仍以原形态存在。
- **上游功能落地抽查**（与上游 v4.0.10 逐文件比对，命中文件数来自 `git grep -I -l`）：`services/provider/icon.rs` 的 `validate_icon` / `strip_invalid_custom_icons`（2 个文件命中，含 `database/backup.rs` 的导入清理调用）、`commands/custom_icon.rs` 与 `commands/mod.rs` 的 `custom_icon` 模块、`database/dao/custom_icons.rs` 与 `database/mod.rs` 的 `custom_icons` 键（10 个文件命中）、`deeplink/{codex_link,grok_link,icon_fetch}.rs` 与 `deeplink/provider.rs` 的 `iconUrl`/API 格式/Pi 导入、`lib.rs` 的 `PendingDeepLink`（9 个文件命中）与 `deeplink-pending` 事件（6 个文件命中）、`src/components/CustomIconNameDialog.tsx`（3 个文件命中）与 `src/utils/customIcon.ts`、`claude-haiku-5-5` 别名（10 个文件命中）、NekoCode 预设（21 个文件命中）、Sub2API 用量模板（20 个文件命中）、`LocalMigrations` 新字段与 `cc-switch-official` 桶迁回 openai 的迁移调用、`AddProviderDialog.tsx` / `EditProviderDialog.tsx` 的 `motionPreset="none"`、`src/whats-new/4.0.10.json`、`docs/release-notes/v4.0.10-{zh,en,ja}.md`、`CHANGELOG.md` 均随上游落地。
- **fork 语义落地抽查**（与重放前 fork main 逐文件比对）：`IS_FORK_BUILD`/DevPanel（34 个文件命中）、`visible_sidebar_panels`（32）与上游 `LocalMigrations` 字段同处 `settings.rs` 并存、`website_url_2`（62）与 `websiteUrl2`（66，含 `deeplink/provider.rs`、`services/provider/mod.rs` 与 `BasicFormFields.tsx`）、connectivity_test 命令注册（`connectivity_probe_provider` 17 个文件命中）、托盘左键切换（`toggle_main_window` 在 `lib.rs`/`tray.rs` 在位）、fork CI 矩阵、预设过滤接线（`forkOfficialAllowlist` 54 个文件命中）与 8 个预设文件的 `hidden` 字段、`EndpointField.rightSlot`（14）、`SearchableModelPicker`（51）、`hasCustomModelMapping`（10）、1M 全选（`allOneMEnabled` 11）、兜底模型直达区（`fallbackQuickAccessSection` 16）、模型徽章、双官网链接、跨应用导入接线（`ProviderImportEntry` 35）、4 个 locale 的 fork 键段（`devpanel` 只在 zh/en、`connectivityTest`/`connectivityCheck`/`searchModels`/`noModelsFound` 四个 locale 全在位）。
- **fork 删除的语义未被带回**：旧 `stream_check` 链路只剩 `database/schema.rs` 的建表与索引；`tauri_plugin_updater` / `updater_builder` 在 `lib.rs` 与 `commands/settings.rs` 命中数为 0；`installUpdateAndRestart` 与 `updater:default` 权限未复活。
- **locale 重复键查重**（A15 独立执行，不依赖测试）：4 个 locale 用 `json.load(object_pairs_hook=…)` 逐文件检测同名重复键，结果 zh / en / ja / zh-TW 全部 `dup_keys=0` 且均可解析；fork 键段按 key 逐个比对全部在位。本轮 rebase 未重现上一轮的重复键事故，但该项仍是每轮必查项。

### 同步范围

- 上游新增提交：merge-base `8845b1ef`（v4.0.9）→ `90fb37ff`（v4.0.10），共 34 个提交、130 个文件、约 +12737/−2359 行，覆盖 v4.0.10 全部发布内容：
  - 自定义供应商图标与「我的图标」库（`21203803`、`68411d82`、`4c263a85`）：新增 `src-tauri/src/commands/custom_icon.rs`（上传命令）、`src-tauri/src/services/provider/icon.rs`（png 校验、`CUSTOM_ICON_PREFIX`/`MAX_CUSTOM_ICON_LENGTH`、导入清理 `strip_invalid_custom_icons`）、`src-tauri/src/database/dao/custom_icons.rs`（图标库以 JSON 数组存 settings 表 `custom_icons` 键，`CustomIconEntry` 含 `id`/`name`/`data`/`created_at` + `serde(flatten)` 前向兼容字段）、`src/components/CustomIconNameDialog.tsx`、`src/lib/api/customIcons.ts`、`src/lib/query/customIcons.ts`、`src/utils/customIcon.ts`；`BasicFormFields.tsx` 的图标弹窗改单选即关闭（去掉「完成」按钮footer、传 `defaultName`）；`src-tauri/Cargo.toml` 新增 `png = "0.18"` 并给 `tokio` 加 `net` feature；新增用例 `tests/components/{IconPicker,ProviderIcon.customIcon,CustomIconNameDialog}.test.tsx`、`tests/fixtures/customIcon.ts`、`tests/utils/customIcon.test.ts`。供应商选中图标时 `providers.icon` 存 data URI 本身而非 id，因此图标库增删不影响已在用的供应商。
  - 深链接改造（`16e7ff1c`、`bee47fdf`、`11e1326b`、`98222d19`、`450bc039`、`db93ac20` 与 6 个文档提交）：`src-tauri/src/deeplink/provider.rs`（+384/−110，链接可声明 API 格式、可导入 Pi 供应商、激活交给用户、`iconUrl` 自带图标）；新增 `src-tauri/src/deeplink/{codex_link,grok_link,icon_fetch}.rs`（Codex 链接保留供应商配置而非重建固定模板；Grok Build 的 `session_summary` 指向当前供应商并保留链接的模型 profile；按 `iconUrl` 取图标）；`src-tauri/src/lib.rs` 把 `handle_deeplink_url` 改为把解析结果存进 `crate::deeplink::PendingDeepLink`（`set_pending_deeplink`）并发 `deeplink-pending` 事件，替代原先直接 emit `deeplink-import` / `deeplink-error`，解决前端尚未挂载时冷启动丢链接；导入的用量脚本默认启用；新增 golden 快照 `src-tauri/tests/golden/snapshots/rows/deeplink-{codex,grokbuild}-config.txt`；三语站方接入指南 `docs/guides/deeplink-site-integration-guide-{zh,en,ja}.md`。
  - 用量统计（`a0dd3b39`、`382c0e96`、`cb3c9fef`、`23c0a63f`、`96d636ca`、`68122bc4`）：统计展示首 token 时间并在无路由时估算；新增 Sub2API 用量查询模板；用量表列全部左对齐并重排请求日志列宽；Novita 空余额、OpenRouter 空额度不再判为过期；尊重 Codex 线程模型设置。
  - 预设（`3302cc2d`、`e0a03184`、`85e574b4`）：NekoCode 预设进 8 个 `src/config/*ProviderPresets.ts`（`openclaw` +58、`hermes` +38、`opencode` +46、`pi` +26、`codex` +15、`claudeDesktop` +17、`gemini` +2、`grokBuild` +2，含版本号行）；OpenModel 注册链接改指 cc-switch 推荐地址；YYLX 中文名改「鱼鱼连线」。`tests/components/ProviderPresetSelector.test.tsx` 把 Claude 可见预设行数断言从 81 改为 82。
  - 修复与文案（`c63c702c`、`28dc5198`、`04bd15c9`、`1a8c1ea3`、`9d4aff88`、`99277921`、`fac8bfd8`）：Claude Code haiku 别名升到 `claude-haiku-5-5`；添加/编辑页取消淡入；日语高级选项开关改「詳細オプション」；连接模式说明先讲各模式优势；把已退役 `cc-switch-official` 桶的会话迁回 openai（`src-tauri/src/settings.rs` 的 `LocalMigrations`/`CodexOfficialHistoryUnifyMigration` 相关字段与读写函数 +36 行，`lib.rs` 在统一迁移之前调用）；无关自动保存改用已确认目录；MSI 升级不再重建已删除的桌面快捷方式。
  - 发版（`db29caef`、`90fb37ff`）：`CHANGELOG.md` 与四处版本号（`package.json`/`Cargo.toml`/`Cargo.lock`/`tauri.conf.json`）；`docs/release-notes/v4.0.10-{zh,en,ja}.md`、`src/whats-new/4.0.10.json`、四语 README 赞助位。
- 不做部分 cherry-pick：同步范围是 `v4.0.9..v4.0.10` 的全量新增提交，一次 rebase 完成。
- 上游本轮改动不含文件删除（`git diff --name-status --diff-filter=D v4.0.9 v4.0.10` 零命中），新增 25 个文件；`.github/workflows/**` 与 `pnpm-lock.yaml` 本轮不在上游改动集内。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 31 个文件（上游 `v4.0.9..v4.0.10` 与 fork `v4.0.9..main` 同时改动）：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、`README.md`、8 个后端文件（`src-tauri/src/lib.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/mod.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/database/mod.rs`、`src-tauri/src/database/backup.rs`、`src-tauri/src/database/dao/mod.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/services/provider/mod.rs`）、3 个前端文件（`src/components/providers/{AddProviderDialog,EditProviderDialog}.tsx`、`src/components/providers/forms/BasicFormFields.tsx`）、8 个预设配置文件、4 个 i18n locales、2 个测试文件（`tests/components/{AddProviderDialog,ProviderPresetSelector}.test.tsx`）。
- 上游本轮改动、fork 侧未触碰的 99 个文件直接落上游版本，其中关键项：`src-tauri/src/deeplink/mod.rs`、`src-tauri/src/services/usage*`、`src-tauri/src/proxy/**`、`src/components/{usage,settings,icons}/**`、`src/components/providers/forms/{ClaudeFormFields,CodexFormFields,ProviderForm}.tsx`（上游本轮改动未与 fork 侧 `v4.0.9..main` 区间重叠，即 fork 自 v4.0.9 起未再改这些文件）、`CHANGELOG.md`、`README_{ZH,DE,JA}.md`、`docs/user-manual/**`、`docs/guides/**`、`docs/release-notes/**`、`src/whats-new/4.0.10.json`。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/fork{Build,OfficialAllowlist,PresetFilter}.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`（上游本轮只动四语 README 的赞助位，fork 重写版不含赞助商表，整文件保留 fork 侧）、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- `CHANGELOG.md`、`flatpak/**`、`docs/user-manual/**`、`docs/guides/**`：fork 侧未改过，随上游落地。
- 共享文件以上游 v4.0.10 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`（上游 +87/−116）：以上游形态为基础——`handle_deeplink_url` 改用 `crate::deeplink::PendingDeepLink::{Import,Error}` + `set_pending_deeplink` + emit `deeplink-pending`（不再直接 emit `deeplink-import`/`deeplink-error`），以及 `cc-switch-official` 桶迁回 openai 的迁移调用（须排在统一迁移之前）；叠加并保持 fork 三段语义——移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册（`commands::connectivity_test_provider_models` + `commands::connectivity_probe_provider`）。解决后必须 grep 确认 `tauri_plugin_updater` / `updater_builder` 命中数为 0，且 `deeplink-pending` 事件与 pending 暂存未被旧的两条 emit 覆盖。
  - `src-tauri/src/settings.rs`（上游 +36 / fork +47）：以上游 `LocalMigrations` 新增字段、`CodexOfficialHistoryUnifyMigration` 相关结构与 `clear_codex_official_history_unify_migration` 等读写函数为基础；叠加 fork 的 `VisibleSidebarPanels` 结构与 `AppSettings.visible_sidebar_panels` 字段段。两段必须并存，不得整文件取一侧。
  - `src-tauri/src/commands/mod.rs`（上游 +2 / fork +2/−2）：上游新增 `mod custom_icon;` 与 `pub use custom_icon::*;`；fork 侧新增 `mod connectivity_test;` / `pub use connectivity_test::*;` 并删除 `mod stream_check;` / `pub use stream_check::*;`。合并结果为三行上游 + fork 的 connectivity_test 两段 + 无 stream_check。
  - `src-tauri/src/commands/settings.rs`（上游 +2 / fork +7/−98）：以上游改动为基础；叠加 fork 移除的 `install_update_and_restart` 下载安装实现（命令接口留空壳，`tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构不复活）。本文件是「取上游侧易带回 updater」的高危点，解完必须 grep `updater_builder`。
  - `src-tauri/src/database/mod.rs`（上游 +1 / fork +1/−4）：上游新增 `pub use dao::custom_icons::{CustomIconEntry, CUSTOM_ICONS_KEY};`；fork 侧 `SCHEMA_VERSION = 21` 与移除的 `cleanup_old_stream_check_logs` 启动清理调用。三者并存。
  - `src-tauri/src/database/dao/mod.rs`（上游 +1 / fork 0/−1）：上游新增 `pub mod custom_icons;`，fork 删除 `pub mod stream_check;`，两者并存。
  - `src-tauri/src/database/backup.rs`（上游 +61 / fork +22/−102）：以上游为基础——`import_from_*` 的 staging 阶段调用 `crate::services::provider::icon::strip_invalid_custom_icons(&temp_conn)?`（在 `apply_schema_migrations_on_conn` 之后、`on_staging_ready()` 之前）与新增用例 `import_clears_custom_icons_that_fail_validation`；叠加 fork 移除的 `stream_check*` 备份/清理分支。不得整文件取一侧。
  - `src-tauri/src/deeplink/provider.rs`（上游 +384/−110 / fork +1）：取上游本轮重写形态，叠加保持 fork 在 `build_provider_from_request` 里的 `website_url_2: None` 一行；解完确认该行仍在（否则 Rust 结构体字面量缺字段编译失败）。
  - `src-tauri/src/services/provider/mod.rs`（上游 +67/−7 / fork +4）：取上游为基础，叠加保持 fork 在 `mod tests` 的 4 处 `Provider` 字面量里的 `website_url_2: None`。
  - `src/components/providers/forms/BasicFormFields.tsx`（上游 +3/−7 / fork +46/−21）：以上游形态为基础——图标弹窗改为「点选即选中并关闭」（删掉 `DialogClose` + `common.done` 的 footer 块、新增 `setIconDialogOpen(false)`）并给 `CustomIconNameDialog` 传 `defaultName={form.watch("name") ?? ""}`；叠加 fork 在第 189 行起的双官网链接字段段（`websiteUrl2` 输入与说明文案）。两侧改动区域不同，预期可自动合并，但必须复核 fork 字段段未被上游 footer 删除连带去掉。
  - `src/components/providers/AddProviderDialog.tsx`（上游 +1 / fork +1）与 `src/components/providers/EditProviderDialog.tsx`（上游 +1 / fork +2）：上游各加一行（图标/深链接相关 props 透传），fork 侧分别为跨应用导入接线与 `websiteUrl2` 读写；取并集，两个新增 props 都保留。
  - 8 个 `src/config/*ProviderPresets.ts`：上游各文件加 NekoCode 等条目并推进版本号行；叠加保持 fork 在预设接口上的 `hidden?: boolean` 字段段（每个文件 +2）。合并结果必须同时含上游全部新预设条目与 fork 的 `hidden` 字段；上游新预设在 fork 构建下是否可见由 `forkOfficialAllowlist` 决定，不改白名单、不手工放开。
  - 4 个 i18n locales（zh / en / ja / zh-TW，上游各 +50/−7、fork 各 +316..329/−24..25）：按上游执行新增与改写（自定义图标与「我的图标」新键、深链接与站点指南文案、连接模式说明改为先讲优势、`common.done` 相关删除、haiku 别名与 ja「詳細オプション」等）；保留 fork 的 `devpanel` 段（只存在于 zh / en）与 `connectivityTest` / `connectivityCheck`、模型快捷切换、双官网链接、跨应用导入等 fork 键段。合并后 fork 键不得缺失，也不得为「补齐」而给 ja / zh-TW 手工添加 fork 既有的 `devpanel` 段。**必须逐文件查重**：rebase 的三方合并会在同一对象里并存 fork 旧写法与上游新写法（上一轮实测 9 条重复 `inactiveFieldsHint`），`JSON.parse` 与 vitest 都不报错，只有显式查重才能发现。
  - 2 个测试文件：`tests/components/AddProviderDialog.test.tsx` 以上游 +103 的新用例（自定义图标/深链接入口）为基础，叠加 fork 的 3 行用例；`tests/components/ProviderPresetSelector.test.tsx` 以上游把 Claude 可见预设行数断言从 81 改为 82 为基础，叠加 fork 的 33 行 `extraActions` / 预设过滤用例。
  - 4 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 上游本轮改动版本号（`4.0.10`）与 Rust 依赖，取 fork 版本号 `4.0.10-1`（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）。`Cargo.toml` 必须同时具备上游新增的 `png = "0.18"`、`tokio` 的 `net` feature 与 fork 移除 `tauri-plugin-updater` 的状态；`package.json` 另保留 fork 的 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater` 依赖；`Cargo.lock` 的 `cc-switch` 包版本号取 fork 值，`png` 条目随上游落地。收尾用 `cargo check` 复验：报告锁文件未被额外改写，才算与 `Cargo.toml` 一致。
- 本轮 fork 侧未改动的共享文件随上游与重放自然落地，fork 语义保持既有状态。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.10 仍为 20；`database/{schema,tests}.rs` 都不在上游本轮改动集内，只有 `mod.rs` 与 `backup.rs` 改动）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 本轮不新增迁移步骤：上游「我的图标」库写在既有 settings 表的 `custom_icons` 键（`INSERT OR REPLACE`），不动表结构。`cc-switch-official` 桶迁回 openai 走 `settings.rs` 的迁移状态标记，也不是 schema 迁移。
- 后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- Shape 确认后编辑 brief 或 spec 会触发 Native Shape recovery：用同一个 summary 重新执行 prepare-shape-confirmation，再 `--confirmed` 回到 Build，然后原样重交 builder-handoff（candidateId 不变，Runtime 检查回执仍有效）。`acceptance_review.status` 合法值是 `implemented-with-evidence` 且 evidence 必须非空。
- Runtime 的 `verification_checks` 按 executable + argv 原样直拼执行、不经 shell：argv 里不得出现 `!`、管道、`&&`、重定向等 shell 语法，`executable` 只写程序名且不得同时塞进 `argv[0]`；需要断言式检查时写成能被普通命令表达的形式或交给 Verifier 执行。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- 重放中途不能跑 `cargo test`：fork 历史提交自身带未清理冲突标记（上一轮实测 `en.json` 的中间提交 `77458dd9` 带标记，由下一次停车清掉），只有最终态才可编译校验；最终态必须 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 零命中。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡。
- 手工拼接共享文件后必须本地跑 `pnpm format:check` 与 `pnpm build:renderer`：fork CI 的 Frontend Checks 依次执行 typecheck → format:check → test:unit → build:renderer，只跑 typecheck + test:unit 会把格式问题推到 CI（上一轮实测）。
- rebase 可在 4 个 locale JSON 留下同名重复键且测试全绿（上一轮实测 9 条 `inactiveFieldsHint`）：合并后必须显式查重，不能依赖 vitest/i18n 用例发现。
- fork 发版 tag 推送事件偶发丢失：推送后若 Actions 零排程，先取证（`git ls-remote`、`/actions/permissions`、workflows state、releases 资产数、check-suites、events），确认后删远端 tag 重推同一本地对象补触发；`release.yml` 的 concurrency 组 `cancel-in-progress: true`，不要连续并发重推。查 fork 的 Actions 运行必须显式带 `--repo tunecc/cc-switch`，否则 `gh` 会解析到 upstream 并 404。
- SSH 通道可能被本机代理以 fake-IP 接管导致 22/443 同时 `Connection closed`：不改用户的全局 `url insteadOf`，单次使用已注册的 gh HTTPS credential helper 推送。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min/1h/3h/4h/5h` 构造却断言存在「今天」分桶，本地时间落在 00:00–00:30 时必然失败。同步过程中跨越该窗口时，遇到这一项失败先查时钟窗口再查实现，不据此改动上游文件或放宽验收。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.10-1`（同步前工作树为 `4.0.9-1`，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.10 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q1 明确授权（2026-10-13 用户选择 A），执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- 随后在归档提交上创建 annotated tag `v4.0.10-1` 并 `git push origin v4.0.10-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端，不推送 `v4.0.10..upstream/main` 的 post-release 内容。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）——本轮与上游新增的 `LocalMigrations`/`CodexOfficialHistoryUnifyMigration` 字段同处 `src-tauri/src/settings.rs`，两段必须并存。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）——上游本轮把 haiku 别名改为 `claude-haiku-5-5`，别名与 fork 的快捷切换逻辑并存。
- Claude 兜底模型直达区与快捷设置按钮对齐、`hasCustomModelMapping` 收窄、`SearchableModelPicker`、API 格式选择器随端点输入框（`EndpointField.rightSlot`）、1M 全选——本轮 fork 自 v4.0.9 起未再改这些文件，随上游落地后语义保持不变。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + 8 个预设文件的 `hidden` 字段 + 表单接线）——上游本轮新增的 NekoCode 等预设因此在 fork 构建下不可见，属预期结果，不得为此改动白名单或过滤逻辑；`tests/components/ProviderPresetSelector.test.tsx` 的上游 82 行断言按上游落地。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）——本轮 `commands/mod.rs`、`dao/mod.rs`、`database/mod.rs`、`backup.rs` 四个文件都同时含上游新增与 fork 的 stream_check 移除，必须逐处确认 `stream_check` 未被带回。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移；本轮 `BasicFormFields.tsx` 的双字段段与 `deeplink/provider.rs`、`services/provider/mod.rs` 的 `website_url_2: None` 都要保留）。
- 托盘图标左键单击切换主窗口显示/隐藏（本轮同文件上游重写了深链接 pending 逻辑，两侧并存）。
- 从其他已启用应用导入供应商配置（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`McodeProviderForm.tsx` 与 `ProviderPresetSelector.extraActions`）。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册、`install_update_and_restart` 不执行安装、`Cargo.toml`/`package.json` 无 updater 依赖）——本轮 `Cargo.toml`/`Cargo.lock` 新增 `png` 依赖时必须确认 updater 条目仍为 0。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/lib.rs`（上游 `PendingDeepLink` + `deeplink-pending` 与 `cc-switch-official` 桶迁移调用 + fork 三段语义）、`src-tauri/src/settings.rs`（上游 `LocalMigrations`/`CodexOfficialHistoryUnifyMigration` + fork `VisibleSidebarPanels`）、`src-tauri/src/commands/{mod,settings}.rs`（上游 `custom_icon` 模块与 +2 改动 + fork `connectivity_test` 注册与 updater 移除）、`src-tauri/src/database/{mod,backup}.rs` 与 `database/dao/mod.rs`（上游 `custom_icons` 导出与 `strip_invalid_custom_icons` + fork SCHEMA 21、stream_check 移除）、`src-tauri/src/deeplink/provider.rs`（上游重写 +384/−110 + fork `website_url_2: None`）、`src-tauri/src/services/provider/mod.rs`（上游图标服务 + fork 4 处测试字面量）、`src/components/providers/forms/BasicFormFields.tsx`（上游图标弹窗单选关闭 + `defaultName` + fork 双官网链接字段段）、`AddProviderDialog.tsx` / `EditProviderDialog.tsx`（上游新增 props 透传 + fork 导入接线与 `websiteUrl2`）、8 个 `src/config/*ProviderPresets.ts`（上游 NekoCode 等条目 + fork `hidden` 字段与白名单默认拒绝）、4 个 locales（上游新键 + fork 键段 + 重复键查重要求）、`src-tauri/Cargo.toml` 与 `Cargo.lock`（上游 `png`/`tokio net` + fork updater 移除）、`package.json` / `tauri.conf.json`（上游 4.0.10 + fork `4.0.10-1`）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过，含上游本轮新增/改写用例（`IconPicker`、`ProviderIcon.customIcon`、`CustomIconNameDialog`、`tests/utils/customIcon.test.ts`、`UsageScriptModal`、`AddProviderDialog` 的新用例、`ProviderPresetSelector` 的 82 行断言）与 fork 既有用例。
- `pnpm format:check` 通过（手工拼接共享文件后必须用 prettier 归一化）。
- `pnpm build:renderer` 通过。
- `cargo check` 通过，并确认 `Cargo.lock` 未被额外改写。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过，含上游新增的 `import_clears_custom_icons_that_fail_validation` 与自定义图标、深链接用例。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支，也不把 `v4.0.10..upstream/main` 的 1 个 post-release 提交（`d9a62313`）纳入本轮基线。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移），也不为上游的「我的图标」新增迁移。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q1 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 `stream_check` 链路）。
- 不放开 fork 预设白名单以显示上游新增的 NekoCode 等预设。
- 不引入上游 Linux flatpak/deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = `883e1547`，安全分支 `pre-sync-v410` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- `lib.rs` / `settings.rs` / `database/backup.rs` / `commands/{mod,settings}.rs` / `BasicFormFields.tsx` / 4 个 locales 若出现「整文件取一侧」的省事解法，即视为丢语义缺陷：前四者会丢上游的 pending 深链接、图标导入清理与自定义图标命令或带回 fork 已删除的 updater / `stream_check` 链路，`BasicFormFields.tsx` 会丢 fork 的双官网链接字段，locales 会丢 fork 键段或留下重复键。
- `deeplink/provider.rs` 与 `services/provider/mod.rs` 取上游重写形态后必须确认 fork 的 `website_url_2: None` 行未被连带删除（否则结构体字面量缺字段，`cargo check` 失败）。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q1 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
