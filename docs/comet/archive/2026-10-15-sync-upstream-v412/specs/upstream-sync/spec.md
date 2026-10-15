# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.12 发布头（tag `v4.0.12` = `51ac86f1`），fork 版本号为 `4.0.12-1`。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.12-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q1 授权执行，不是验收当时的状态。

本轮还包含一项由用户明确授权的产品可见变更（Q2）：`forkOfficialAllowlist` 追加全部上游 `category: "local"` 预设名称。除此之外不引入任何新的 fork 行为。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 `51ac86f1`（tag `v4.0.12` 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == `51ac86f1`；`git log v4.0.12..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 143 个 fork 提交（`v4.0.10..main`，含 v4.0.10 的同步提交 `dc3c8ac3`、其文档提交 `0338b020`、归档提交 `da31be83` 与 deeplink 测试竞态修正提交 `1ec0fc08`）按原顺序重放，外加本轮的同步提交、白名单提交、修复提交与归档提交。
- 本轮没有需要排除的 post-release 区间：`upstream/main` == `51ac86f1` == tag `v4.0.12`。上一轮排除的 `d9a62313`（fix(ui): panel flicker）已随 `3b3c3f0b` 进入 v4.0.11，本轮纳入基线。
- 同步前起点由安全分支 `pre-sync-v412` 固定记录（= 同步前 main `1ec0fc08`，该提交同时是 origin/main 与本地 tag `v4.0.10-1` 之后一次测试修正的提交），用于重放前后的 diff 对照与回退参照。
- 上一轮基线 tag `v4.0.10` = `90fb37ff` 与 fork 发布 tag `v4.0.10-1`（指向归档提交 `da31be83`）保持不变，不删除、不改指向。

#### 重放映射（固定核对口径）

- 重放前后计数：`git rev-list --count v4.0.10..main`（重放前，实测 143）与 `git rev-list --count v4.0.12..main`（重放后）之差只允许来自「被 git 判定为空而丢弃」或「本轮新增的同步/白名单/修复/归档提交」，逐条说明。
- 提交主题序列逐行 diff：`git log --format='%s' --reverse` 对比重放前 `v4.0.10..pre-sync-v412` 与重放后 `v4.0.12..main`，143 条主题必须无遗漏、无重复、无顺序变化。
- patch-id 对照：必须走 stdin，`git show <c> | git patch-id --stable` 按序逐条比对（`git patch-id --stable <hash>` 传参只返回空串，会把全部提交误判为不同）；不同的提交逐个归类为「内容相同仅 hunk 位移」或「对应一次冲突停车」，不允许出现「fork 语义丢失」。
- 区间归属核对：`git log --format=%an v4.0.12..main | sort -u` 只有 fork 作者 `Tune`，区间内无任何上游提交。
- 冲突停车清单：按 rebase 顺序逐条记录「fork 侧原提交 → 新提交、区间序号、冲突文件与 hunk、采用的解法、是否漏掉任一侧语义」；`rerere` 自动解决的停车同样记录并逐个复核。
- 最终态修正：记录在同步/白名单提交里、不属于任何单个重放提交的改动（版本号四处、`forkOfficialAllowlist` 的 local 条目、`HOW_TO_REBASE_UPSTREAM.md` 条目、本 change 产物）。
- 中间提交带未清理冲突标记属 fork 历史既有瑕疵（上一轮实测区间内 69 个提交的 tree 含标记），重放必须忠实保留，抽查若干序号的标记文件集合应与重放前一致；因此重放中途不能跑 `cargo test`，只在 rebase 完成后编译校验。
- 取证口径：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> '`（不要把 `--name-only` 放在 rev 之前，它会被当作 pathspec 造成 0 命中的假阴性）。
- 实测结果：
  - 重放前 `git rev-list --count v4.0.10..pre-sync-v412` == 143；rebase 一趟完成，重放后 `git rev-list --count v4.0.12..main` == 149 —— 143 条重放提交（无提交被 git 判定为空而丢弃、无冗余提交被去掉、无 git commit 段错误、无 signal 11）加本轮六条最终态提交：`aeef1495`（同步终态）、`a6b62b86`（Q2 白名单）、`00878360`（§4.1 的 ProviderList 归属与白名单条目记录更正）、`67a06e1d`（§4 说明段的历轮冲突统计按轮次归属）、`9de33b2e`（§4 白名单两条失效路径按现状改写）、`579a10f2`（§4 各表的历轮取舍写明所属轮次）。归档时还会追加一条归档提交，区间计数随之再加 1，逐条对应本节列出的最终态提交。
  - `git merge-base main upstream/main` == `51ac86f1`；`git log --format=%an v4.0.12..main | sort -u` 只有 `Tune`，区间内无任何上游提交。
  - 提交主题序列逐行 diff（`git log --format='%s' --reverse`，重放前 `v4.0.10..pre-sync-v412` 与重放后 `v4.0.12..main` 各 143 条）差异 0 行：无遗漏、无重复、无顺序变化。
  - patch-id 对照（`git show <c> | git patch-id --stable`，按序逐条比对；直接传 hash 只返回空串，会把 143 条全误判为不同）：**133 个与重放前完全相同**，10 个不同，逐个归类见下；无一属于「fork 语义丢失」。
- 10 处 patch-id 差异的逐条归类（交互式停车 5 次 + 自动合并造成的差异 5 次）：
  1. `#2 96438646→54e60e84`（版本号与产品名提交）：交互式冲突停车。`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 各 1 个版本号 hunk（新基线写 `4.0.12`，该提交的历史值是 `3.20.2-fork.1`）→ 只取 fork 侧版本号，保留 git 已合并的上游其余内容，不整文件 `--theirs`。差异仅为被删除的行从 `4.0.10` 变成 `4.0.12`。该提交的主题写的是 `3.19.2-fork.1`，与它自己的 diff 内容和本节实测值都不一致，属 fork 历史既有的主题陈旧文本，重放按原样忠实保留、不改写历史。
  2. `#12 5eecf51a→8c7d1ac9`（预设接口加 `hidden?: boolean`）：非停车，自动合并造成。重放前改 8 个预设文件、重放后只改 7 个——上游 `3069b556` 已给 `codexProviderPreset` 声明了逐字相同的 `// 是否在 UI 中隐藏该预设…` + `hidden?: boolean` 两行，fork 的追加在 codex 文件上成为冗余，git 直接消化。语义未丢：终态 9 个预设文件的接口都仍有该字段（`mcodeProviderPresets.ts` fork 侧本就未加）。
  3. `#13 a7e3d946→ed96be2f`（预设过滤接线）：交互式冲突停车，`ProviderForm.tsx` 2 个 hunk + `ClaudeDesktopProviderForm.tsx` 1 个 hunk。上游把 `presetEntries` 改为「先按原数组下标编号、再过滤 `hidden`」，fork 该提交是「先过滤、再编号」。解法：编号先于一切过滤，`hidden`（上游）与 fork 白名单都在编号之后过滤，白名单判定改用 `filterForkPresets(...).map(p => p.name)` 的名称集合以匹配 `filterForkPresets` 自身按 `name` 匹配的语义。两侧语义并存，且修掉「先过滤导致 id 错位」的组合缺陷（详见「预设 id 编号契约」）。
  4. `#43 1239f35b→2c0b74fc`（README 重写提交）：交互式冲突停车，`git checkout --theirs` 整文件保留 fork 侧。patch 差异是被删的上游行随基线变了：`438834fe` 加 GrooRoute Pro 赞助行、`e48b84d6` 把 AIGoCode 改到 `.net` 站点、`c21106ff` 在四语特性清单加「community-translated Turkish」。fork 重写版 README 不含赞助商表与上游功能清单，属刻意取舍。
  5. `#46 a2a7e2ab→4fa38722`、`#72 216a6d09→9cbad3a4`、`#77 bf558b02→996ef416`、`#143 1ec0fc08→7aa2…`：非停车，增删行集合与重放前逐字节相同，差异只在 hunk 上下文与行号（上游在同一带里加了工具卸载、Local 预设与新 locale 键）。属「内容完全相同、仅 context 位移」。
  6. `#74 df6f2d9e→b55f7ba0`（移除旧 stream_check 链路）：交互式冲突停车，只冲突在 `src-tauri/Cargo.lock` 的 `cc-switch` 版本号行（新基线 `4.0.12` vs 历史值 `3.20.1-1`）→ 取 fork 侧值。解决后 `stream_check` 在 `src-tauri/src` 只剩 `database/schema.rs` 的建表与索引三行（表结构按 fork 既有语义保留）；`tauri_plugin_updater` 与 `updater_builder` 命中数为 0。
  7. `#79 401ba552→f7b55902`（连通性测试 UI 四项修复）：交互式冲突停车，`ProviderList.tsx` 2 个 hunk，都是 props 相邻声明：接口处与解构处各取并集（上游 `searchSlot` + fork `probeResults`）。增删行集合与重放前相同，差异在 hunk 分组。
- 最终态修正（本轮同步与白名单提交，不属于任何单个重放提交）：
  - 版本号四处 `4.0.10-1 → 4.0.12-1`（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`），`src-tauri/Cargo.lock` 的 `cc-switch` 包条目同步；`cargo check` 复验后锁文件相对终态只有该行差异。
  - `src/config/forkOfficialAllowlist.ts`：按 Q2 追加 local 预设名称（见「预设白名单与可见性」）。
  - `ProviderForm.tsx` / `ClaudeDesktopProviderForm.tsx` / `PiProviderForm.tsx` / `GrokBuildProviderForm.tsx`：四处预设入口统一为「先按原数组下标编号，再过滤 `hidden` 与 fork 白名单」（上游 `3069b556` 的 id 契约 + fork 过滤并存）；`ProviderForm.tsx` 的六个分支改用一个局部 `entriesFor` 辅助函数表达同一口径。
  - `src/config/claudeDesktopProviderPresets.ts`：删除 rebase 三方合并留下的第二份 `hidden?: boolean`（`pnpm typecheck` 报 `TS2300: Duplicate identifier 'hidden'`）。
  - `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 的 `forkOfficialAllowlist.ts` 条目改写 + 新增 §4.1「v4.0.12 轮的叠加要点」；后续两次文档更正提交 `00878360`（§4.1 的每行卸载菜单归属改为应用页 `AppsPage.tsx`、白名单条目措辞）与 `67a06e1d`（§4 说明段末句的历轮冲突统计按 v4.0.10 / v4.0.12 分列，并补本轮 34 重叠 / 94 仅上游与三个零命中路径）。三次文档更正（`00878360`、`67a06e1d`、`9de33b2e`）都只改 `docs/HOW_TO_REBASE_UPSTREAM.md`，该文件不在 34 个重叠文件内，因此不改变「落地保真核对」的实测值；`9de33b2e` 另把 §4 白名单里两条已失效的路径按现状改写（`src/components/usage/ConnectivityCheckConfigPanel.tsx` 早由 fork 提交 `6064fc1c` 删除、`providerModelUtils` 的测试与被测文件同目录在 `src/utils/` 而非 `tests/utils/`）。
  - 本 change 产物（brief / 完整目标规格 / comet-state）随同步与归档提交进入历史。
- 本轮开发期检查实测：`pnpm typecheck` 退出码 0（`tsc --noEmit` 无输出）；`pnpm format:check` 通过（`ClaudeDesktopProviderForm.tsx` 首轮报格式问题，`prettier --write` 该文件后全绿）；定向 `vitest run` 4 个文件（`ProviderPresetSelector` / `AddProviderDialog` / `ProviderList` / `DeepLinkImportDialog`）94 用例全过；`cargo check` 与 `cargo check --all-targets` 通过，仅 1 条 `unused import: crate::database::Database`（`src/services/provider/live.rs:1499`）警告，与 `pre-sync-v412` 同一行同一内容，属既有状态。`pnpm test:unit` / `pnpm build:renderer` / `cargo test` 由正式检查计划执行。

#### 落地保真核对（34 个上游/fork 重叠文件，可复现口径）

- 算法（固定，复核必须按它执行）：对每个重叠文件取四份文本 —— `v4.0.10`、`v4.0.12`、`pre-sync-v412`（= 同步前 main `1ec0fc08`）、`HEAD`（= 同步后终态）。每份文本按行归一化：去首尾空白、再去掉行尾的一个逗号、丢弃空行，然后丢弃纯符号噪声行（集合 `{`、`}`、`};`、`},`、`(`、`)`、`[`、`]`、`,`、`;`）；把归一化结果建成多重集（保留同名行的出现次数）。定义
  - `上游新增行缺失 = (L(v4.0.12) − L(v4.0.10)) − L(HEAD)`
  - `fork 新增行缺失 = (L(pre-sync-v412) − L(v4.0.10)) − L(HEAD)`
  两项都按多重集差计算，正数计数之和即为本节数字。用 `git diff` 的 `+`/`-` 行集合、或把多重集去重成集合，都会得到不同数字，所以只用上面的算法。
- 记录要求：逐文件给出两侧计数；每个非零文件把差异归入三类之一并写明理由 —— 上游自己删掉的行（如 `c760c8cb` 移除的 ClaudeAPI/code0 文案）、fork 版本号 `4.0.12-1` 这类刻意取舍、fork 用新结构取代上游实现；「被改写而非删除」的行单列。朴素地问「某行是否存在」会产生假阳性，不予采用。
- 汇总数字必须与逐文件明细自洽（只给合计数不给逐文件归类视为未通过）。
- 实测结果（`v4.0.10` / `v4.0.12` / `pre-sync-v412` / `HEAD` 四 ref，34 个重叠文件；HEAD 取本轮两个最终态提交之后）：**27 个文件两侧均为 0**，7 个非零；上游新增行缺失合计 **18 行**，fork 新增行缺失合计 **23 行**。全部差异归因如下，无一行属于丢语义。非零的 7 个文件是 `README.md`、4 个版本与锁文件、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`；其余 27 个全零文件含本轮高危叠加面：`src-tauri/src/{lib,settings}.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/tray.rs`、`src/App.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src/components/providers/ProviderList.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/components/universal/UniversalProviderFormModal.tsx`、8 个 `src/config/*ProviderPresets.ts`、4 个 locales、3 个测试文件。即上游本轮在这些文件里新增的行没有一行丢失，fork 的 `website_url_2: None`、`VisibleSidebarPanels`、`toggle_main_window`、connectivity_test 注册、tunecc releases 链接、locale fork 键段与 fork 用例都在位。
- **18 行上游缺失逐条归类**：
  - `README.md` 5 行（刻意取舍）：上游 `438834fe` 的 GrooRoute Pro 赞助 `<td>` 两行、`e48b84d6` 改址后的 AIGoCode 赞助 `<td>` 两行、`c21106ff` 在特性清单行尾追加的「plus community-translated Turkish」。fork README 是「只记录与上游差别」的重写版，整张赞助商表与上游功能清单都不存在，白名单整文件保留 fork 侧。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.lock` 各 1 行（刻意取舍）：上游写 `4.0.12`，终态按 fork 惯例取 `4.0.12-1`。
  - `ClaudeDesktopProviderForm.tsx` 2 行 + `ProviderForm.tsx` 7 行 = 9 行（**被改写而非删除**）：
    - 上游注释「先编号再过滤 hidden…」（`ProviderForm.tsx` 两行、`ClaudeDesktopProviderForm.tsx` 一行）改写为同时说明 fork 白名单过滤的同义注释；
    - 上游的 `.filter((entry) => !entry.preset.hidden)`、`.filter((entry) => !(entry.preset as CodexProviderPreset).hidden);`、`.filter((entry) => !(entry.preset as ProviderPreset).hidden);` 三行改写进同一个条件 `(!dropHidden || !entry.preset.hidden) && allowed.has(entry.preset.name)`，`hidden` 过滤逐字保留、只与 fork 过滤合并；
    - `ProviderForm.tsx` 的 `return codexProviderPresets`、`.map<PresetEntry>((preset, index) => ({`、`}))` 三行由局部 `entriesFor` 承载（`return presets` / `.map((preset, index) => ({` / `}))`），显式类型参数改由返回类型 `PresetEntry[]` 表达，「编号先于过滤」不变。
- **23 行 fork 缺失逐条归类**：
  - 4 个版本与锁文件各 1 行（刻意取舍）：fork 重放前的 `4.0.10-1` 被本轮 `4.0.12-1` 取代。
  - `ProviderForm.tsx` 18 行（fork 旧写法被新结构取代）：`return filterForkPresets(` ×5、`).map<PresetEntry>((preset, index) => ({` ×5、`return filterForkPresets("codex", codexProviderPresets).map<PresetEntry>(` ×1、`(preset, index) => ({` ×1、`providerPresets.filter((p) => !p.hidden)` ×1、app 键 `"gemini"` / `"opencode"` / `"openclaw"` / `"hermes"` / `"claude"` 各 ×1 —— 六个分支各自的「先过滤后编号」写法收敛进一个 `entriesFor`（编号 → `hidden` → 名称集合），过滤本身全部仍在生效。
  - `ClaudeDesktopProviderForm.tsx` 1 行：`(preset, index) => ({` 的旧缩进形态被改写后的链式结构取代，同属结构调整。
  - 除此之外 fork 在 34 个重叠文件里的每一行（`hidden?: boolean` 字段段、`website_url_2: None`、fork locale 键段、fork 测试用例、`rightSlot`、`toggle_main_window`、tunecc releases 链接等）在终态都仍以原形态存在。
- 上游功能落地抽查（命中文件数一律为 `git grep -I -l -e <模式> HEAD -- src src-tauri tests` 的文件数，模式逐条给出）：`prepare_tool_uninstall`（3）、`tool_node_requirement`（1，只命中 `src-tauri/src/commands/misc.rs` —— 模块文件自身不含该字符串，它经 `#[path = "tool_node_requirement.rs"] mod tool_node_requirement;`（`misc.rs:16-17`）声明并在 `misc.rs:135/329/1188` 使用）、`useUsageAutoRefresh`（3）、`"tr"`（15）、`category: "local"`（`src` 下 8 个预设文件）、`SESSION_SYNC_INTERVAL_SECS: u64 = 10 * 60`、`proxy_url_for`（2）、grooroute（10：8 个预设文件与 `src/icons/extracted/{index,metadata}.ts`；两张二进制素材 `src/icons/extracted/grooroute.jpg`、`assets/partners/logos/grooroute-banner.jpg` 存在但不计入 `git grep -I` 的文本命中）、`src/whats-new/4.0.12.json`、`docs/release-notes/v4.0.12-*.md`、`CHANGELOG.md`、`services/session_usage_codex.rs` 的分页合并与延迟跳过、`services/session_usage_pi.rs` 的速度估算、`commands/misc.rs` 的 Windows PATH 恢复均随上游落地。
- fork 语义落地抽查（同上口径：`git grep -I -l -e <模式> HEAD -- src src-tauri tests`）：`IS_FORK_BUILD`（7）、`visible_sidebar_panels`（1，`src-tauri/src/settings.rs`）与 `visibleSidebarPanels`（4：`App.tsx` / `GeneralSection.tsx` / `Sidebar.tsx` / `types.ts`）、`website_url_2`（17）与 `websiteUrl2`（27）、`connectivity_probe_provider`（5）、`toggle_main_window`（2）、`hide_main_window`（1，定义在 `tray.rs`，由 `toggle_main_window` 调用）、`rightSlot`（2）、`SearchableModelPicker`（7）、`hasCustomModelMapping`（1）、`allOneMEnabled`（1）、`fallbackQuickAccessSection`（1）、`ProviderImportEntry`（7）、4 个 locale 的 fork 键段（`devpanel` 只在 zh / en，`connectivityTest` / `connectivityCheck` / `searchModels` / `noModelsFound` 四语言全在位）。
- fork 删除的语义未被带回：`tauri_plugin_updater`、`updater_builder`、`installUpdateAndRestart`、`updater:default` 命中数全部为 0；`stream_check` 在 `src-tauri/src` 只剩 `database/schema.rs` 的建表与索引。
- 数字更正记录：独立 Verifier 在本轮验收时按同口径复算得 18/23，本节即采用该当前 HEAD 值；规格初稿写的 13/8 是最终两个提交（`aeef1495`、`a6b62b86`）之前的快照，因版本号行与 `entriesFor` 重构改变了两侧差异而失效。第 2 轮独立验收判 A7 失败后又做了一致性清扫：`ProviderList.tsx` 的归属更正原先只落到 brief 的 A3、规格「冲突解决」与 §4.1，规格的「白名单文档更新」与「错误与边界」两处残留旧说法已一并更正；并修正 `tests/components/ProviderList.test.tsx` 的上游用例描述（上游只加 4 条搜索用例，卸载与列对齐用例在 `tests/components/AppsPage.test.tsx`，`30fcd90a` 只改 `AppsPage.tsx`）、重叠面分类计数（前端 8 个而非 9 个、全零清单里的预设文件 8 个而非 7 个）、`opencode` 的 Ollama 原始下标（84 而非 89）、`src-tauri/Cargo.lock` 的路径笔误，并把「仅上游改动的 94 个文件」里的 `commands/mod.rs` 与 `database/**` 移出（上游本轮未触碰二者，两个新命令模块以 `#[path]` 声明在 `commands/misc.rs:16-19`，对外注册在 `lib.rs` 命令列表）；brief 关于 `gemini` / `grokbuild` 白名单为空的措辞也更正为「仍只保留各自官方预设」。第 3 轮独立验收判 A7 再次失败，原因是那次清扫只落到规格与 HOW_TO_REBASE_UPSTREAM，brief 的「范围」三行仍留同样三处旧说法（「9 个前端文件」而只列 8 个、把 src-tauri/src/commands/{mod,settings}.rs 列入「仅上游 94 个文件」、把「搜索/溢出菜单改造」记到 ProviderList.tsx）；现已更正，§4.1 的 ProviderList 归属更正此前只在工作树，已由 `00878360` 提交进入历史。第 4 轮清扫（文档更正提交 `67a06e1d` 之后，brief / 规格 / HOW_TO 三处同时落）：把「仅上游改动的 94 个文件」里的 `src/components/providers/forms/**` 收敛为具体 `presetGroups.ts`（上游本轮在 `forms/` 下只改 3 个文件，另两个 `ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx` 属重叠面，`ClaudeFormFields.tsx`、`CodexFormFields.tsx` 本轮上游零命中）、把 `docs/guides/**` 从两处「随上游落地」清单移出（`git diff v4.0.10 v4.0.12 -- docs/guides` 零命中）；上游规模数字按 `git diff --numstat` 实测更正，`services/session_usage_codex.rs` 由 +667 改为 +610/−57、`services/session_usage_pi.rs` 由 +240 改为 +237/−3；HOW_TO §4 说明段末句原先只写「本轮」而实为 v4.0.10 轮的停车序号（#2/#43/#62/#74/#90），现按轮次分列并补 v4.0.12 轮的 34/94 文件面与 #2/#13/#43/#74/#79 五次交互式停车；重放区间计数由 146 更新为 147（新增 `67a06e1d` 一条最终态文档提交）。第 4 轮独立验收只判 A7 失败一处，随后的第 5 轮清扫按同一 `git diff --numstat` 口径继续纠正本节其余可核数字：`services/webdav_sync/archive.rs` 的规模由 +558（那是增删行数之和）更正为 +539/−19；`tray.rs` 的「`TrayTexts` 新增 67 行」原先取的是该 hunk 的新侧长度而非新增行数，改为按 hunk 实测（该文件整体 +77/−10，`impl TrayTexts` hunk 新增 61 行，brief 与规格同步）；土耳其语回退面的「约 288 键」更正为实测 312 个叶子键并写明算法（`keys(en@HEAD)` 4416 减 `keys(tr@HEAD)` 4109，全部落在 fork 自 v4.0.10 起新增的 313 个键内）；两条落地抽查的命中数改为显式口径 `git grep -I -l -e <模式> HEAD -- src src-tauri tests` 并逐值更正（IS_FORK_BUILD 6→7、websiteUrl2 18→27、connectivity_probe_provider 4→5、SearchableModelPicker 6→7、ProviderImportEntry 6→7、useUsageAutoRefresh 2→3；补 hide_main_window 1、visible_sidebar_panels 1、visibleSidebarPanels 4、hasCustomModelMapping 1、allOneMEnabled 1、fallbackQuickAccessSection 1、prepare_tool_uninstall 3、"tr" 15、`category: "local"` 8、proxy_url_for 2 的实测值），其中 `tool_node_requirement` 的说明更正为「只命中 `commands/misc.rs`（模块文件自身不含该字符串）」、grooroute 的 10 更正为「8 个预设文件 + `src/icons/extracted/{index,metadata}.ts`，两张二进制素材不计入 `-I` 文本命中」。HOW_TO §4 白名单两条失效路径由 `9de33b2e` 按现状改写；重放区间计数由 147 更新为 148；随后 `579a10f2` 把 §4 各表里六处实指 v4.0.5 / v4.0.9 / v4.0.10 轮的「本轮」写明轮次归属（lib.rs 的 Reopen 必冲突、tray.rs 的整文件取一侧高危点、两处 pnpm-lock 未改、说明段的 v4.0.9 无冲突与 v4.0.12 重放映射引用），区间计数更新为 149。核对本节引用的全部规模数字（67 提交 / 128 文件 / +19593/−1014 / tr.json 4759 行与 4109 叶子键 / 4 个 locale 各 +36/−11 / openclaw +1322/−115 / codex +1142/−106 / hermes +717/−22 / tool_uninstall +1673 / tool_node_requirement +309 / misc.rs +375/−68 / tray.rs +77/−10 / ProviderList +115/−85 / deeplink/provider +45/−3）已逐条与 `git diff --numstat v4.0.10 v4.0.12` 一致。
- 落地保真核对脚本：`/tmp/v412/fidelity.js`（本轮执行副本，算法与上面固定口径一致；输出 `/tmp/v412/fidelity.json` 保存逐文件计数与逐行清单）。

### 同步范围

- 上游新增提交：merge-base `90fb37ff`（v4.0.10）→ `51ac86f1`（v4.0.12），共 67 个提交、128 个文件、约 +19593/−1014 行（含 `tr.json` 4759 行），覆盖 v4.0.11 与 v4.0.12 两轮发布内容：
  - 工具卸载与应用页（v4.0.11 `dbb81ea2`；v4.0.12 `f7696fa8`、`6a232cab`、`ae778b4f`、`74d43799`、`30fcd90a`、`06805090`）：新增 `src-tauri/src/commands/tool_uninstall.rs`（+1673：`prepare_tool_uninstall` 枚举每个安装并给出可执行计划或必须手删的原因，执行时重新枚举、按确认路径重新推导计划并拒绝与预览不一致者；Grok 0.2.112+ 的 `~/.grok/bin/grok-<version>`（由 `grok` 链接）识别并删除整套安装文件、保留 `config.toml` 与会话；原生卸载同时删除搜索目录中解析到同一 binary 的 launcher 符号链接；存在原生安装且 `[cli] installer = "npm"` 时把 Grok 的 npm 副本标记 `reinstalled_by_updater`）、`src-tauri/src/commands/tool_node_requirement.rs`（+309：npm 工具更新前先检查 Node 版本）、`src/components/apps/{ManualUninstallDialog,ToolUninstallConfirmDialog,toolUninstallCommands}`、`src/lib/api/settings.ts` 的 `prepareToolUninstall` 与 `runToolLifecycleAction` 的 `uninstall` 分支、卸载入口移入每行溢出菜单、应用页列对齐与布局不抖动。此处「updater」指工具 CLI 自身的更新器，与 fork 已移除的应用内更新器无关。
  - Windows CLI 生命周期（v4.0.11 `479964f2`；v4.0.12 `74d43799`）：`src-tauri/src/commands/misc.rs`（上游 +375/−68）在 CLI 生命周期命令中恢复用户 PATH、改造 `run_windows_tool_command_capture` 与 mise/node 搜索路径、扩展 `ToolVersion`、新增测试段用例。
  - 本机推理预设与 Local 分组（v4.0.12 `8686c165`、`d5b729a5`、`16964d7c`、`936aec4a`、`c6263cc9`、`8b7d71c1`）：`src/types.ts` 的 `ProviderCategory` 新增 `"local"`；`category: "local"` 条目分布为 claude、claude-desktop、codex、hermes 各 `Ollama`/`LM Studio`/`llama.cpp`/`vLLM`，openclaw `LM Studio`/`llama.cpp`/`vLLM`，opencode `Ollama`/`llama.cpp`/`vLLM`，pi `Ollama`/`LM Studio`/`vLLM`；gemini、grokbuild、mcode 无 local 条目；新增 LM Studio、llama.cpp、vLLM 图标；`openclawProviderPresets.ts`（+1322/−115）、`codexProviderPresets.ts`（+1142/−106）、`hermesProviderPresets.ts`（+717/−22）为本轮最大上游改动面。
  - 云与聚合站预设（v4.0.11 `438834fe`、`3700af35`、`3c918cd0`、`84464e7e`、`e48b84d6`；v4.0.12 `4bc74d02`、`3c2a72ca`、`0a129e94`、`ae111a4b`、`cc43c8ba`、`18935228`、`b76b22c8`、`2cde53dd`、`627e89c0`、`e779974c`、`73e07a1e`、`c85f8782`、`7adbc51d`、`ff443477`、`d1592fb1`、`23dc945e`、`453cdaf9`）：GrooRoute Pro（8 个 app + `assets/partners/logos/grooroute-banner.jpg`、`src/icons/extracted/grooroute.jpg` + 邀请链接改指 grooroute.pro）、SoruxGPT Coding Plan、AIComing、StreamLake China(Vanchin)/Codex（`src/icons/extracted/streamlake.svg`）、Cloudflare AI Gateway、Mistral AI、Fireworks、Microsoft Foundry、Hugging Face、DigitalOcean、SambaNova、Groq、Nebius Token Factory、Vercel AI Gateway、DeepInfra、Meta Model API、Baseten、Ollama Cloud、SiliconFlow（opencode）；AIGoCode 站点改址。
  - 预设治理（v4.0.12 `3069b556`、`c83cd728`、`d6d46c35`、`c760c8cb`）：隐藏 Mistral 路由型预设并保持预设 id 稳定、删除 OpenCode 自带内置项的重复预设、去掉 ClaudeAPI 与 code0 的合作标记与推广文案（含 README 条目）。
  - 土耳其语与语言回退（v4.0.12 `c21106ff`、`d1592fb1`、`5b6d317f`、`e5eeb166`）：新增 `src/i18n/locales/tr.json`（4109 个叶子键）、`src/i18n/index.ts` 注册 `tr` 与识别分支、`src/types.ts` 的 `language` 联合类型加 `"tr"`、`src-tauri/src/settings.rs` 的语言白名单过滤加 `"tr"`、`src-tauri/src/tray.rs` 的托盘土耳其语（该文件上游整体 +77/−10：新增 `map_locale_to_tray_language` 与 `TrayTexts` 的 `tr` 变体；`TrayTexts` 结构自身在 impl hunk 里新增 61 行）、`GeneralSection.tsx` 的语言选项加 `settings.languageOptionTurkish`、`tests/i18n/turkishDetection.test.ts`；系统语言不受支持时改用英文；土耳其语选项去掉「社区翻译」后缀；澄清「在应用页隐藏应用」的文案。
  - 用量统计（v4.0.11 `c05906bb`、`9719b7b3`、`c859026d`；v4.0.12 `7a8087f6`、`cc81627a`、`4958863a`）：`services/session_usage_codex.rs`（+610/−57）合并分页 Codex rollout 以解析 fork 父级、跳过未变更的延迟 rollout；coding-plan 用量对所有 app 默认启用；新增 `src/hooks/useUsageAutoRefresh.ts`（用量页打开时按所选间隔扫描会话日志）与 `tests/hooks/{useUsageAutoRefresh,useUsageEventBridge}.test.tsx`；`lib.rs` 的后台定时同步间隔由 60 秒改为 10 分钟兜底；`services/session_usage_pi.rs`（+237/−3）恢复 Pi 会话历史速度估算。
  - 深链接（v4.0.11 `b13797e3`）：导入的 coding-plan 用量默认启用，`src-tauri/src/deeplink/provider.rs` 相应改动（上游 +45/−3）。
  - 批量操作反馈（v4.0.11 `6b4c09ac`、`1ef555df`）：MCP 与 skills 批量失败显示 error/warning toast（`src/components/**`）。
  - 其他修复（v4.0.12 `b1941307`、`c11c7cf1`、`866b93b4`、`061d24c8`、`74b98ca9`、`49d529fb`、`31c6f574`、`30fcd90a`）：WSL 下 `piConfigDir` 指向 9P 时跳过被拒绝的 syscall、代理上游错误体为空时明确说明、终止响应后不再重复发出流错误、重复点击当前页仍保留未保存更改守卫（`src/App.tsx`）、skills 恢复失败后保留快照（`services/webdav_sync/archive.rs` +539/−19）、供应商搜索面板不再遮住卡片操作、搜索框移到首行末尾。
  - 发版（`3b3c3f0b`、`2635dfff`、`edf32204`、`51ac86f1`）：两轮 `CHANGELOG.md` 与四处版本号、六份三语 release-notes、`src/whats-new/4.0.11.json` 与 `4.0.12.json`。
- 不做部分 cherry-pick：同步范围是 `v4.0.10..v4.0.12` 的全量新增提交，一次 rebase 完成。
- 上游本轮**未触碰** `src-tauri/src/commands/mod.rs` 与 `src-tauri/src/database/**`（`git diff v4.0.10 v4.0.12 -- src-tauri/src/database` 零命中）：两个新命令模块是以 `#[path = "tool_uninstall.rs"] mod tool_uninstall;` / `#[path = "tool_node_requirement.rs"] mod tool_node_requirement;` 的形式声明在 `src-tauri/src/commands/misc.rs:16-19` 内，`commands/mod.rs` 本轮只带 fork 侧历史改动（`connectivity_test` 两段、无 `stream_check`），`database/**` 保持 fork 的 `SCHEMA_VERSION = 21` 与 v20→v21 修复迁移原样。`prepare_tool_uninstall` 的对外注册在 `src-tauri/src/lib.rs` 的命令列表。
- 上游本轮改动不含文件删除（`git diff --name-status --diff-filter=D v4.0.10 v4.0.12` 零命中），新增 25 个文件；`.github/workflows/**`、`pnpm-lock.yaml`、`src-tauri/src/database/**` 本轮不在上游改动集内。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 34 个文件（上游 `v4.0.10..v4.0.12` 与 fork `v4.0.10..main` 同时改动）：4 个版本与锁文件、`README.md`、6 个后端文件（`src-tauri/src/{lib,settings}.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/tray.rs`）、8 个前端文件（`src/App.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src/components/providers/ProviderList.tsx`、`src/components/providers/forms/{ClaudeDesktopProviderForm,ProviderForm}.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/components/universal/UniversalProviderFormModal.tsx`）、8 个 `src/config/*ProviderPresets.ts`、4 个 `src/i18n/locales/*.json`、3 个测试文件（`tests/components/{DeepLinkImportDialog,ProviderList,ProviderPresetSelector}.test.tsx`）。
- 上游本轮改动、fork 侧未触碰的其余 94 个文件直接落上游版本，关键项：`src-tauri/src/services/{session_usage_codex,session_usage_pi,webdav_sync/archive}.rs`、`src-tauri/src/proxy/http_client.rs`、`src/components/apps/**`（`AppsPage.tsx` 与 `ManualUninstallDialog`/`ToolUninstallConfirmDialog`/`toolUninstallCommands`/`useToolManagement`）、`src/components/providers/forms/presetGroups.ts`（`forms/` 下上游本轮只改 3 个文件，另两个 `ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx` 属重叠面；`ClaudeFormFields.tsx`、`CodexFormFields.tsx` 本轮上游未改）、`src/hooks/useUsageAutoRefresh.ts`、`src/i18n/{index.ts,locales/tr.json}`、`CHANGELOG.md`、`README_{ZH,DE,JA}.md`、`docs/{user-manual,release-notes}/**`、`src/whats-new/4.0.1{1,2}.json`。上游本轮**未触碰** `src-tauri/src/commands/{mod,settings}.rs`、`src-tauri/src/database/**` 与 `docs/guides/**`（`git diff v4.0.10 v4.0.12` 对这三个路径均零命中）；`tool_uninstall.rs`、`tool_node_requirement.rs` 两个新模块以 `#[path]` 声明在 `src-tauri/src/commands/misc.rs:16-19`，对外命令注册在 `src-tauri/src/lib.rs`。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/fork{Build,OfficialAllowlist,PresetFilter}.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/{ci,release}.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/{comet,superpowers,openspec,HOW_TO_REBASE_UPSTREAM.md}`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游 v4.0.12 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`（上游 +4/−2 / fork +19/−41）：取上游两处改动——`SESSION_SYNC_INTERVAL_SECS` 由 60 改为 `10 * 60` 并更新注释、命令注册表新增 `commands::prepare_tool_uninstall`；叠加并保持 fork 三段语义——移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册（`commands::connectivity_test_provider_models` + `commands::connectivity_probe_provider`）。解完必须 grep 确认 `tauri_plugin_updater` / `updater_builder` 命中数为 0，且上一轮落地的 `PendingDeepLink` / `deeplink-pending` 链路未被回退。
  - `src-tauri/src/settings.rs`（上游 +1/−1 / fork +47）：取上游 `AppSettings` 语言白名单 `matches!(*s, "en" | "zh" | "zh-TW" | "ja" | "tr")`；叠加保持 fork 的 `VisibleSidebarPanels` 结构与 `AppSettings.visible_sidebar_panels` 字段段与 `LocalMigrations` 相关实现。
  - `src-tauri/src/commands/misc.rs`（上游 +375/−68 / fork +1/−1）：以上游 Windows PATH 恢复与工具生命周期改造为基础；叠加 fork 把 `check_for_updates` 的跳转地址保持为 `https://github.com/tunecc/cc-switch/releases`。不得整文件取上游侧（会带回 farion1231 releases 链接）。
  - `src-tauri/src/deeplink/provider.rs`（上游 +45/−3 / fork +1）：取上游 coding-plan 用量默认启用改动，叠加保持 fork 在 `build_provider_from_request` 里的 `website_url_2: None` 一行；解完确认该行仍在（否则 Rust 结构体字面量缺字段编译失败）。
  - `src-tauri/src/proxy/forwarder.rs`（上游 +3/−3 / fork +2/−1）：取上游 `super::http_client::proxy_url_for(&url)` 与 `get_for_url(&url)`（上游地址是本机时直连、不送进代理）；叠加保持 fork 的 `parse_custom_user_agent` 注释措辞（已去掉 `stream_check`）与 `mod tests` 里 `Provider` 字面量的 `website_url_2: None`。
  - `src-tauri/src/tray.rs`（上游 +77/−10 / fork +32）：取上游土耳其语托盘文案与 `map_locale_to_tray_language` / `TrayTexts` 扩展；叠加保持 fork 的 `hide_main_window`（Windows `set_skip_taskbar(true)`、macOS `apply_tray_policy(app,false)`）与 `toggle_main_window`（可见且未最小化→隐藏，否则还原聚焦）两个 helper。两侧都位于 `apply_tray_policy` 之后与 `TrayTexts` 定义处，属高危叠加面，不得整文件取一侧；上游 `mod tests` 的新增断言也必须与 fork helper 并存。
  - `src/App.tsx`（上游 +2 / fork +83/−1）：取上游「再点当前页不离开：不弹确认、不清掉编辑页未保存登记」（`if (currentViewRef.current === page) return;`）；叠加保持 fork 的 DevPanel 门控、产品名与侧边面板入口段。
  - `src/types.ts`（上游 +4/−1 / fork +14）：取上游 `ProviderCategory` 的 `"local"`、`Settings.language` 的 `"tr"`、`OpenClawModel.compat` 的 `supportsTools` / `toolSchemaProfile`；叠加保持 fork 的 `Provider.websiteUrl2`、`UniversalProvider.websiteUrl2`、`VisibleSidebarPanels` 接口与 `Settings.visibleSidebarPanels` 字段。
  - `src/lib/api/settings.ts`（上游 +38/−1 / fork +0/−4）：取上游 `get_tool_versions` 返回类型新增 `update_blocked_by_node`、`runToolLifecycleAction` 的 `"uninstall"` 分支与 `uninstallPlan` 参数、新增 `prepareToolUninstall`；叠加保持 fork 已删除的 `installUpdateAndRestart`（不得被上游或重放带回）。
  - `src/components/providers/ProviderList.tsx`（上游 +115/−85 / fork +229/−10）：以上游新增的 `searchSlot`（搜索框可由页头挂载位置渲染，null 时先不画）、`focusSearch` 复用（打开时滚动回视口并选中）与「搜索框放在列表上方第一行最右端、不遮挡卡片、打开时卡片不下移」为基础；叠加保持 fork 的右键置顶/置底菜单项、新建插入第二位、模型徽章与批量连通性入口、双官网链接渲染。两侧都在同一 `DropdownMenu`/context menu 区域，出现「整文件取一侧」即视为丢语义缺陷；解完逐项复核菜单条目并集。
  - `src/components/providers/forms/ProviderForm.tsx`（上游 +10/−6 / fork +185/−28）：取上游 `ProviderFormFull` 的两处改动；叠加保持 fork 的跨应用导入入口（`extraActions`）、预设过滤接线（`filterForkPresets`）、`websiteUrl2` 字段与连通性测试接线。
  - `src/components/providers/forms/ClaudeDesktopProviderForm.tsx`（上游 +7/−4 / fork +74/−5）：取上游第 352 行附近的改动；叠加保持 fork 的跨应用导入与 Claude Desktop 专属字段段。
  - `src/components/settings/sections/GeneralSection.tsx`（上游 +1 / fork +112/−1）：取上游 `LANGUAGES` 新增 `{ value: "tr", labelKey: "settings.languageOptionTurkish" }`；叠加保持 fork 的侧边面板可见性设置段（含 prompts 面板、pill toggles、批量检测开关）与其他 fork 段。
  - `src/components/universal/UniversalProviderFormModal.tsx`（上游 +3/−3 / fork +25）：取上游 `useEffect` → `useLayoutEffect`（打开面板不显示空/旧字段）；叠加保持 fork 的 `websiteUrl2` 读写与跨应用导入段。
  - 8 个 `src/config/*ProviderPresets.ts`（fork 各 +2）：以上游新增条目与治理结果为基础（local 分组、各云预设、Mistral 路由隐藏、OpenCode 内置项去重、ClaudeAPI/code0 文案移除）；叠加保持 fork 在预设接口上的 `hidden?: boolean` 字段段。合并结果必须同时含上游全部新预设条目与 fork 的 `hidden` 字段。
  - 4 个 i18n locales（zh / en / ja / zh-TW，上游各 +36/−11、fork 各 +316..329/−24..25）：按上游执行新增与改写（工具卸载全套键、Local 预设相关文案、`settings.languageOptionTurkish` 与「社区翻译」措辞调整、隐藏应用说明、ClaudeAPI/code0 文案删除）；保留 fork 的 `devpanel` 段（只存在于 zh / en）与 `connectivityTest` / `connectivityCheck`、模型快捷切换、双官网链接、跨应用导入、批量检测等 fork 键段。**必须逐文件查重**：rebase 的三方合并会在同一对象里并存 fork 旧写法与上游新写法（上一轮实测 9 条重复 `inactiveFieldsHint`），`JSON.parse` 与 vitest 都不报错，只有显式查重才能发现。
  - 3 个测试文件：`tests/components/ProviderList.test.tsx`（上游 +311/−1 / fork +277/−5）以上游新增的 4 条搜索用例（`searchSlot` 渲染、槽位未挂载时先不画、首行分组标题旁保持可见、无分组标题时仅搜索状态加行）为基础，叠加 fork 的右键置顶/置底、模型徽章、批量连通性用例；`tests/components/ProviderPresetSelector.test.tsx`（上游 +39/−8 / fork +33）以上游用例为基础并叠加 fork 的 `extraActions` / 预设过滤用例，上游因新增预设而调整的行数断言按上游落地、若 fork 过滤影响断言则按 fork 语义修正并在规格记录；`tests/components/DeepLinkImportDialog.test.tsx`（上游 +104/−2 / fork +4/−3）两侧用例并集。
  - 4 个版本与锁文件：上游本轮改动只有版本号行（`4.0.10` → `4.0.12`），取 fork 版本号 `4.0.12-1`（只取版本号值，不对整文件 `--theirs`）。`Cargo.toml` 必须保持 fork 移除 `tauri-plugin-updater` 的状态且不含新增依赖；`package.json` 保留 fork 的 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`；`Cargo.lock` 的 `cc-switch` 包版本号取 fork 值。收尾用 `cargo check` 复验：锁文件相对终态只允许 `cc-switch` 版本号一行差异。

### 预设 id 编号契约（上游新语义与 fork 过滤的并存）

- 上游 `3069b556` 固定了一条契约：预设选择项 `id`（形如 `claude-90`）里的数字是**原始预设数组的下标**，`AddProviderDialog` 与 `useProviderCategory` 用它回查 `xxxProviderPresets[presetIndex]`。因此任何过滤都必须发生在编号之后。
- fork 的过滤若先于编号，被过滤掉的项会使之后所有条目的下标错位；Q2 把本机推理条目加入白名单后，这些条目位于原数组第 72..94 位（如 `opencode` 的 Ollama 在 84、`codex` 的 LM Studio 在 92），错位会让选中预设填入另一家供应商的配置。终态要求：四处预设入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）一律「按原数组下标编号 → 过滤上游 `hidden`（仅上游对该 app 有该过滤时）→ 按 `filterForkPresets` 结果的 `name` 集合过滤」。
- 白名单判定改用名称集合而非对象引用，与 `filterForkPresets` 自身「按 `name` 精确匹配、同名条目全部保留」的语义一致，不引入新的可见性差异。
- 该并存关系由本轮 `#13` 冲突停车与最终态修正建立，`pnpm typecheck` 与 `vitest` 的预设相关用例（`ProviderPresetSelector`、`AddProviderDialog`、`ProviderList`、`DeepLinkImportDialog` 共 94 用例）通过为其证据。

### 预设白名单与可见性（Q2）

- `src/config/forkOfficialAllowlist.ts` 的最终状态（按 2026-08-19 `provider-presets-visibility` 既有契约扩展，仅追加名称、不改结构）：
  - `claude`: `["Claude Official", "Ollama", "LM Studio", "llama.cpp", "vLLM"]`
  - `claude-desktop`: `["Claude Desktop Official", "Ollama", "LM Studio", "llama.cpp", "vLLM"]`
  - `codex`: `["OpenAI Official", "Ollama", "LM Studio", "llama.cpp", "vLLM"]`
  - `gemini`: `["Google Official"]`（上游无 local 条目）
  - `grokbuild`: `["Grok Official"]`（上游无 local 条目）
  - `hermes`: `["Ollama", "LM Studio", "llama.cpp", "vLLM"]`（原为 `[]`）
  - `openclaw`: `["LM Studio", "llama.cpp", "vLLM"]`（原为 `[]`）
  - `opencode`: `["Ollama", "llama.cpp", "vLLM"]`（原为 `[]`）
  - `pi`: `["Ollama", "LM Studio", "vLLM"]`（原为 `[]`）
  - `mcode`: `[]`（上游无该分类条目）
- 名称必须逐字取自上游 `v4.0.12` 各预设文件里 `category: "local"` 条目的 `name` 字段；`filterForkPresets` 的判定实现（`IS_FORK_BUILD` 门控、空数组返回 `[]`、按 `name` 精确匹配）保持不变。
- 行为后果：fork 构建下 hermes / openclaw / opencode / pi 四个 app 从「只显示自定义」变为「显示上表的本机推理预设 + 自定义」；claude / claude-desktop / codex 的预设选择器在官方预设之外多出本机推理条目；赞助商、聚合站与第三方云预设仍默认拒绝。上游构建（`IS_FORK_BUILD` 为 false）不受任何影响。
- 该文件不在上游改动集内，改动作为本轮独立提交落在 rebase 之后，不参与冲突解决。
- 实测：追加的每个名称都能在对应 app 的预设数组里命中，且原数组下标为 claude / claude-desktop 90..93、codex 91..94、hermes 84..87、openclaw 83..85、opencode 84..86、pi 72..74（官方条目都在下标 0），这正是「编号必须先于过滤」的原因。`gemini` 只命中 `Google Official@0`；`grokbuild` 的 `Grok Official` 仍是独立导出的 `grokBuildOfficialPreset` 常量、不在 `grokBuildProviderPresets` 数组内，所以该 app 的过滤结果继续为空并由常量单独入列 —— 与同步前一致，不属本轮变更；`mcode` 保持空白名单。

### 本地化状态

- 语言集合为 `zh` / `zh-TW` / `en` / `ja` / `tr`；`src/i18n/index.ts`、`src/types.ts`、`src-tauri/src/settings.rs`、`GeneralSection.tsx`、`tray.rs` 五处的语言分支/白名单/选项全部取上游状态。
- `src/i18n/locales/tr.json` 与 `git show v4.0.12:src/i18n/locales/tr.json` 逐字节一致（Q3 决定：不补 fork 专属键）。土耳其语下 fork 专属文案由 `i18n` 的 `fallbackLng: "en"` 回退英文，属预期结果；回退面实测 312 个叶子键（`keys(en@HEAD) − keys(tr@HEAD)`，en@HEAD 4416 / tr@HEAD 4109，其中 312 个正是 fork 自 v4.0.10 起新增的键，fork 新增共 313 个、有 1 个与上游同名键重合）。
- 4 个既有 locale 的 fork 键段逐个 key 比对全部在位，且无同名重复键。
- 实测：`zh` / `en` / `ja` / `zh-TW` / `tr` 五个文件均可解析且逐对象作用域重复键计数为 0；`tr.json` 与 `git show v4.0.12:src/i18n/locales/tr.json` 逐字节相同（fork 侧零改动）。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.11 与 v4.0.12 均为 20，`src-tauri/src/database/**` 不在上游本轮改动集内）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 本轮不新增迁移步骤：上游的工具卸载、本机推理预设与土耳其语都不涉及表结构。
- 后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续。
- Shape 确认后编辑 brief 或 spec 会触发 Native Shape recovery：用同一个 summary 重新执行 prepare-shape-confirmation，再 `--confirmed` 回到 Build，然后原样重交 builder-handoff。
- Runtime 的 `verification_checks` 按 executable + argv 原样直拼执行、不经 shell：argv 里不得出现 `!`、管道、`&&`、重定向等 shell 语法，`executable` 只写程序名且不得同时塞进 `argv[0]`。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- 重放中途不能跑 `cargo test`：fork 历史提交自身带未清理冲突标记，只有最终态才可编译校验；最终态必须对 `<<<<<<<` 与 `>>>>>>>` 零命中。
- 合并两侧 JSX/Rust 禁止按行去重，必须整块拼接后核对括号平衡。
- 手工拼接共享文件后必须本地跑 `pnpm format:check` 与 `pnpm build:renderer`：fork CI 的 Frontend Checks 依次执行 typecheck → format:check → test:unit → build:renderer。
- rebase 可在 4 个 locale JSON 留下同名重复键且测试全绿：合并后必须显式查重。
- fork 发版 tag 推送事件偶发丢失：推送后若 Actions 零排程，先取证再删远端 tag 重推同一本地对象补触发；查 fork 的 Actions 运行必须显式带 `--repo tunecc/cc-switch`。
- SSH 通道可能被本机代理以 fake-IP 接管导致 22/443 同时 `Connection closed`：不改用户全局 `url insteadOf`，单次使用已注册的 gh HTTPS credential helper 推送。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 在本地 00:00–00:30 窗口必然失败；遇到该失败先查时钟窗口再查实现。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.12-1`（同步前工作树为 `4.0.10-1`，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.12 的第一代 fork 构建取 `-1`，被跳过的 4.0.11 不单独计代。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q1 明确授权（2026-10-15 用户选择 A），执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- 随后在归档提交上创建 annotated tag `v4.0.12-1` 并 `git push origin v4.0.12-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。
- 不创建 PR，不同步其他分支或远端引用。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）——本轮与上游 `Settings.language` 的 `"tr"` 同处 `src/types.ts`、与 `GeneralSection.tsx` 的 `LANGUAGES` 新增条目同文件，两段必须并存。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）。
- Claude 兜底模型直达区与快捷设置按钮对齐、`hasCustomModelMapping` 收窄、`SearchableModelPicker`、API 格式选择器随端点输入框（`EndpointField.rightSlot`）、1M 全选。
- 供应商右键置顶/置底、新建供应商插入第二位——本轮 `ProviderList.tsx` 上游重排了搜索框位置与聚焦逻辑（每行溢出菜单的卸载入口在应用页 `AppsPage.tsx`，不在本文件），fork 菜单项必须与上游改动并存。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 8 个预设文件的 `hidden` 字段 + 表单接线）——判定实现不变，条目按 Q2 追加本机推理预设；上游新增的赞助商/聚合站/第三方云预设继续默认拒绝。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、多语言文案、旧 `stream_check` 链路已移除仅保留表结构）——本轮 `forwarder.rs` 与 `misc.rs` 同时含上游改动与 fork 语义，必须确认 `stream_check` 未被带回。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移；本轮 `types.ts`、`UniversalProviderFormModal.tsx`、`ProviderForm.tsx`、`deeplink/provider.rs`、`forwarder.rs` 测试字面量的 fork 段都要保留）。
- 托盘图标左键单击切换主窗口显示/隐藏（本轮同文件上游新增土耳其语托盘文案，两侧并存）。
- 从其他已启用应用导入供应商配置（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`McodeProviderForm.tsx` 与 `ProviderPresetSelector.extraActions`）。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册、`install_update_and_restart` 不执行安装且前端 `installUpdateAndRestart` API 已删除、`Cargo.toml`/`package.json` 无 updater 依赖）——本轮 `lib.rs` 新增 `prepare_tool_uninstall` 注册时必须确认 updater 相关命中仍为 0。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格按本轮结果修订：`src-tauri/src/lib.rs`（上游 `SESSION_SYNC_INTERVAL_SECS` 10 分钟与 `prepare_tool_uninstall` 注册 + fork 三段语义）、`src-tauri/src/settings.rs`（上游语言白名单加 `tr` + fork `VisibleSidebarPanels`）、`src-tauri/src/commands/misc.rs`（上游 Windows PATH 恢复与生命周期改造 + fork releases 链接）、`src-tauri/src/tray.rs`（上游土耳其语托盘 + fork 两个 helper）、`src-tauri/src/proxy/forwarder.rs`（上游 `proxy_url_for`/`get_for_url` + fork 注释与测试字面量）、`src/App.tsx`（上游当前页守卫 + fork DevPanel/面板段）、`src/types.ts`（上游 `local`/`tr`/`compat` 字段 + fork 双链接与侧边面板类型）、`src/lib/api/settings.ts`（上游 `prepareToolUninstall` 与 `uninstall` 分支 + fork 删除 `installUpdateAndRestart`）、`src/components/providers/ProviderList.tsx`（上游 `searchSlot`/`focusSearch` 搜索框位置与聚焦 + fork 右键置顶置底与徽章；每行卸载溢出菜单在 `src/components/apps/AppsPage.tsx`，其用例在 `tests/components/AppsPage.test.tsx`，都不属 ProviderList）、`ProviderForm.tsx` / `ClaudeDesktopProviderForm.tsx` / `GeneralSection.tsx` / `UniversalProviderFormModal.tsx`、8 个预设文件（上游 local 与云预设 + fork `hidden` 字段 + Q2 白名单条目）、4 个 locales（上游新键 + fork 键段 + 重复键查重要求）、`src/config/forkOfficialAllowlist.ts` 的 local 条目契约、`src/i18n/locales/tr.json` 保持上游逐字节一致的口径。
- 本轮无新增 fork 专属代码文件；不虚构条目。
- §4 的「说明」段原先把历轮仅上游文件与冲突统计串成一段，末句的「本轮」实为 v4.0.10 轮；现按 v4.0.8 / v4.0.9 / v4.0.10 / v4.0.12 分列归属，v4.0.12 轮补记重叠面 34、仅上游 94、五次交互式停车序号（#2/#13/#43/#74/#79）与该轮上游零命中的 `commands/{mod,settings}.rs`、`database/**`、`docs/guides/**` 路径。§4.1 新增口径段与 §4 白名单表格同时收录「预设 id 必须按原数组下标编号」这条上游新契约。

### 构建与测试

- `pnpm typecheck` 通过。
- `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/hooks/useUsageAutoRefresh.test.tsx`、`tests/hooks/useUsageEventBridge.test.tsx`、`tests/i18n/turkishDetection.test.ts`、`tests/components/{UsagePage,DailyMemoryPanel,UsagePanelMotion,WorkspaceFileEditor,AppsPage,ProviderList,ProviderPresetSelector,DeepLinkImportDialog}.test.tsx`、`tests/config/codexReasoningLevelPresets.test.ts`、`tests/i18n/syncLanguageFromSettings.test.ts`）与 fork 既有用例。
- `pnpm format:check` 通过（手工拼接共享文件后必须用 prettier 归一化）。
- `pnpm build:renderer` 通过。
- `cargo check` 通过，并确认 `Cargo.lock` 未被额外改写（只允许 `cc-switch` 版本号一行）。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此）。验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过，含上游新增的工具卸载与 Windows PATH 用例。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加与 Q2 明确授权的白名单条目）。
- 不新增功能（Q2 的白名单条目属可见性配置，不新增代码路径）。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等）。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.10-1` 及更早的 fork tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q1 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 前端 API、旧 `stream_check` 链路）。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不给 `tr.json` 补 fork 键（Q3）。
- 不引入上游 Linux flatpak/deb/rpm 发布链路。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = `1ec0fc08`，安全分支 `pre-sync-v412` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态。
- `lib.rs` / `settings.rs` / `tray.rs` / `ProviderList.tsx` / `misc.rs` / `types.ts` / `lib/api/settings.ts` / 4 个 locales 若出现「整文件取一侧」的省事解法，即视为丢语义缺陷：会丢上游的工具卸载命令注册、PATH 恢复、土耳其语托盘与语言白名单、ProviderList 的搜索框位置与聚焦改造，或带回 fork 已删除的 updater / `stream_check` / farion1231 releases 链接，或丢 fork 的双官网链接、侧边面板与预设过滤语义。
- `deeplink/provider.rs`、`forwarder.rs` 取上游形态后必须确认 fork 的 `website_url_2: None` 行未被连带删除（否则结构体字面量缺字段，`cargo check` 失败）。
- 白名单追加的名称必须与上游 `category: "local"` 条目的 `name` 逐字一致；拼写不符会使该 app 的本机推理预设静默消失。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q1 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；其他失败按真实缺陷处理，不扩大跳过列表。
