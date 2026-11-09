# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的已发布 annotated tag `v4.0.28`（tag 对象 `9bd119930cc4fc56b46415e88215d20eeab96726`，剥离提交 `8656ebd91f3eba631837126e29df71e8353b7e43`，2026-11-08 正式发布、非 draft/prerelease；跨度内的 `v4.0.27` 于 2026-11-07 正式发布），按原顺序重放同步前 `v4.0.26..main` 的全部 fork 提交（同步前 main = `ccc035dd1`，即 origin/main，写作时实测 206 个），再叠加本轮同步终态与归档提交；fork 版本号 `4.0.26-1` → `4.0.28-1`；上游本轮的功能与修复全部落地（fork 已裁剪/已移除段除外），fork 全部魔改保留且可用，无丢失、无行为回归。

**本轮「上游是否重复实现 fork 功能」的核查结论：没有同域重复，不产生二选一。** 唯一同名域是上游 stream_check（v4.0.27 发布说明称「连通性测试」）的维护性修复 `1d6efa644`（#9253，reachability 不跟随重定向）——fork 早已整体移除 stream_check 可达链路（正式规格与历轮 Shape 在案），本轮修复落在 fork 的孤儿文件 `services/stream_check.rs` 与 `proxy/http_client.rs`，按既定豁免口径把修复落进孤儿文件、维持移除决策（D6），不构成功能二选一。其余上游新增（FTS5 会话搜索、界面密度/缩放、定价表搜索、Skills 重排、Grok Build 终端、应用页进度、Codex 会话分组适配、暂停官方登录、额度保护默认开）均与 fork 功能域不相交，逐项取证见 D2。

# 范围

- **同步区间**：`v4.0.26..v4.0.28` 共 63 个提交、214 个文件、+12086/−1347（35 新增 / 178 修改 / 1 重命名 `R100: src-tauri/tests/support.rs → src-tauri/tests/support/mod.rs`）。fork 侧自 `v4.0.26` 起自有改动：含文档产物 493 文件、+66486/−2831，代码面（`src`、`src-tauri`、`tests`、`.github`、`package.json`、`pnpm-lock.yaml`）145 文件、+15823/−2292。**重叠面 37 个文件**（实测 `comm -12 <(git diff --name-only v4.0.26 v4.0.28|sort) <(git diff --name-only v4.0.26 main|sort)`），37 个全部有 fork 语义（`git diff --quiet v4.0.26 main -- <file>` 无一为空），逐文件核对后均为「不同行区域的机械叠加」或「上游单向新增」，无行为碰撞（D2）。
- **上游 v4.0.27 新功能**：① FTS5 会话正文搜索（`deb6d5a19`，44 文件 +4630/−362：`session_manager/search.rs`、`search_revision.rs` 新文件，`session-index.db` 为独立本地文件不进备份不参与云同步；新命令 `sync_session_index`/`search_session_content`/`clear_session_index`，默认关）；② 界面密度与缩放（`4e7413c5a`：`src/lib/interfacePrefs.ts`、`index.css` 密度 token、`tailwind.config.cjs`、Ctrl/⌘ +/-/0 快捷键、`capabilities/default.json` 加 `core:webview:allow-set-webview-zoom`）；③ 定价表搜索（`158b2ba30`）；④ Skills 已安装页重排（`65106ce6c`）；⑤ Grok Build 打开终端（`894094125`：`misc.rs` 的 `open_provider_terminal`/`codex_launch`、App.tsx `onOpenTerminal` 加 grokbuild）；⑥ 供应商图标跟随主题（`e66441d80`，ProviderCard 去白底改 `text-fg-1`）；⑦ 右键禁用 WebView 默认菜单（`05218b118`，新 `src/lib/disableContextMenu.ts`）；⑧ 对话框打开时窗口可拖动（`566448f06`）。
- **上游 v4.0.28 新功能**：① Codex 会话分组适配 11-08 不兼容更新（`905c91485` 路由/聚合模式把第三方写成内置 `openai` 并剥离 ChatGPT identity headers `8ff9e3b50`；`c7f7caf26` 直连切换时提示会话分桶只读数量；`2c5e5d2c2` 统一会话历史下每次启动持续迁入 openai 桶；`6a0acf075` 后台迁移完成事件 `codex-unify-migration-finished`）；② 「暂停使用官方登录」开关迁到路由/聚合设置（`e6256c50d` + `b0e452ff2`，`codex_proxy_without_official_login`）；③ 官方额度保护默认开启；④ 应用页安装/升级排队状态与实时进度（`810775eb2`，新 `commands/tool_lifecycle_progress.rs`）。
- **上游修复**：`92ca821e4` 软链接配置写真实文件；`4a8f113f0` 熔断探测 permit 归还；`883382f1c` 熔断日志带供应商名；`e9285cf18` Codex 跨家故障转移按目标映射模型（`model_mapper.rs` 新 `map_codex_failover_model`）+ `cac921f5d` 图片/搜索请求不换模型；`49f2882ef`/`71dbcfa2d` Kimi/DeepSeek 原生 Responses 工具调用历史修复（新 `transform_codex_responses_kimi_history.rs`）；`0e49c8813` 压缩被拒时去 `tool_choice` 重试；`5f2f527d5` 不再写 `disable_response_storage`（预设模板/`provider.rs`/`deeplink/provider.rs`/金标快照联动）；`13af7fc94` Codex catalog 绝对路径指针；`5bfca714f`/`747b13278`/`66e4362b6` skill 哈希忽略 Python 字节码与迁移；`a94226b16` skills 仓库计数修复；`8dab4ed47` Windows Python `pi.exe` 误识别；`f3c88da99` models.dev 超时 15s→60s；`07a10b9ce` DSH YAML 报错带文件名；`c39db7df0` 图标首字代理对；`44e7d3ef7` deeplink 风险分类识别 IPv4-compatible/SIIT/NAT64；`4aa554ad2` AGY 每周 Argon 额度（SubscriptionQuotaFooter/quotaRules，不碰 ProviderCard 副标题）；`506f3cf83`/`e1f8acf64` usage 修复；`6f9fa06dd` 建表与定价 seed 合成 savepoint 单事务；`97e6d82ad` Codex 状态库备份单步化（`codex_history_migration.rs`）；`cb2f23891`/`c88d7cc17`/`6a3a7a449` Linux 托盘面板不透明化与 DPR 坐标；`1d6efa644` stream_check 重定向（孤儿豁免，D6）；`b184a88c9`/`c6a5a789f`/`f3c6774cf`/`07798d56f` WSL2/测试基建；`40b602a3f`/`4e13413ff` 文档。
- **数据库**：上游 `SCHEMA_VERSION` 本轮仍 24（`v4.0.28` 与 `v4.0.26` 相同），fork 保持 25，**不撞号、无迁移链合并、无新臂**；`schema.rs` 上游新增 `in_savepoint` helper 并把 `create_tables_on_conn`/`ensure_model_pricing_seeded_on_conn` 包进 savepoint（`6f9fa06dd`），取上游，fork 的 `stream_check_logs` 建表语句与迁移臂保留。
- **版本与依赖**：`Cargo.toml` 上游 `crate-type` 从 `["staticlib","cdylib","rlib"]` 改 `["rlib"]`（`62de0f3e9`，移动端才需要前两者），取上游；本轮上游零新增 Rust 依赖（`Cargo.lock` 仅 cc-switch 版本行）；`package.json` 仅版本号；`pnpm-lock.yaml` 上游零改动。四处版本文件终态统一 `4.0.28-1`。
- **本地化**：`en/ja/zh/zh-TW` 上游新增键（FTS5 搜索、密度/缩放、定价搜索、Skills 重排、Codex 分组/暂停登录、排队进度、TokenPlus/Genesis/Mistral、AGY 周额度等）逐字落地，fork 键段保留，合并后按对象作用域显式查重 `dup=0`；`tr.json` 上游本轮有改动（density/skills/tokenplus/AGY/FTS5 键）但**不在重叠面**（fork 与 `v4.0.26` tag 逐字节一致），整文件随上游，终态与 `v4.0.28` tag 逐字节一致、不补 fork 键。
- **预设**：上游净新增两个第三方预设族并解隐藏一个既有预设——TokenPlus（`4ed410ad8`，codex/hermes/openclaw/opencode/pi 5 目录 + `piModelCatalog.ts`）、Genesis（`cd15a1642` + `2360631f5` 内联样式对齐，claude/codex/pi，`genesisModels.ts` 随对齐删除）、Mistral AI 默认模型改 `mistral-large-4` 并在 claude/codex/claude-desktop/hermes/openclaw 解隐藏（`b9fd5d99a`）。**用户已确认（Q1，2026-11-09）：维持既有 fork 白名单过滤，三个都不收录**（D3）。
- **CI**：上游本轮重构 ci.yml（`b3594905f` concurrency 按 PR/运行分组、`CARGO_PROFILE_DEV_DEBUG: line-tables-only`、fmt-check 移到 Linux 独占前置、rust-cache `save-if: main`、pnpm 改 `pnpm/action-setup` + `setup-node cache: pnpm`、`c65a523ca` 前端单测 4 shards、`07798d56f` wsl2-nightly 稳定 test root）并从 release.yml 移除 4 段 pnpm store cache。与 fork 裁剪策略的合并口径见 D4。
- **fork 侧文档**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果修订并新增 §4.13（v4.0.28 轮要点）；`docs/comet/specs/upstream-sync/spec.md` 归档时整体重写为本轮终态。
- **交付**：推送 `main` 与 annotated tag `v4.0.28-1` 只在验收通过、用户接受并归档之后执行，属 Archive 阶段的单独授权（本轮 Shape 只确认「沿用历轮方式」，不构成远端写授权）。

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v428/`（Runtime 已创建）：`brief.md` 与 `specs/upstream-sync/spec.md`；不建立能力关联，不产生 `capability-association.yaml` 与 `delta.yaml`（沿用历轮决定）。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v428/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v428`（= 同步前 main `ccc035dd1`，同时是 origin/main），仅用于回退参照与重放前后 diff 对照，不推送。
- 随上游 rebase 落地的上游新增文件 35 个（全部 fork 零语义、整体落地）：6 个 `docs/release-notes/v4.0.2{7,8}-{en,ja,zh}.md`；`src/whats-new/4.0.2{7,8}.json`；后端 `src-tauri/src/commands/tool_lifecycle_progress.rs`、`src-tauri/src/proxy/providers/transform_codex_responses_kimi_history.rs`、`src-tauri/src/session_manager/{search,search_revision}.rs`；前端 `src/components/providers/mode/CodexPauseOfficialLogin.tsx`、`src/hooks/useSessionContentSearch.ts`、`src/icons/extracted/{genesis.svg,tokenplus.png}`、`src/lib/{disableContextMenu.ts,interfacePrefs.ts}`、`src/utils/codexHistorySplitHint.ts`；测试 18 个（`tests/components/` 7 个、`tests/config/` 4 个、`tests/hooks/useSessionContentSearch.test.tsx`、`tests/icons/themeAdapt.test.ts`、`tests/lib/interfacePrefs.test.ts`、`tests/utils/codexHistorySplitHint.test.ts`）。
- 交付步骤（验收通过并归档、且用户另行授权后）新增本地 annotated tag `v4.0.28-1`。

### 修改

- 37 个上游/fork 重叠文件（逐文件叠加要求在完整目标规格「冲突解决」中展开）：
  - 版本与物料 5 个：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`.github/workflows/release.yml`。
  - 后端 13 个：`src-tauri/src/lib.rs`（Linux webview 渲染插件 + FTS5 三命令注册 + 迁移注释；fork 的 connectivity 注册、无 updater、托盘语义保留）、`src-tauri/src/commands/misc.rs`（工具生命周期进度 + Grok 终端；fork 的 tunecc URL 保留）、`src-tauri/src/commands/settings.rs`（统一会话迁移完成事件 + 暂停官方登录重写；fork 的 updater 桩保留）、`src-tauri/src/settings.rs`（密度/会话搜索/暂停登录/额度保护字段；fork 的 `VisibleSidebarPanels` 保留）、`src-tauri/src/database/schema.rs`（savepoint 批量）、`src-tauri/src/deeplink/provider.rs`（`disable_response_storage` 移除；fork 的 `website_url_2` 字面量保留）、`src-tauri/src/provider.rs`（同上模板移除；fork 的 `website_url_2` 字段保留）、`src-tauri/src/services/provider/mod.rs`（`SwitchResult.codex_history_split`；fork 测试字面量补列保留）、`src-tauri/src/proxy/forwarder.rs`（failover 模型映射等 +387/−81；fork 的注释与测试补列保留）、`src-tauri/src/proxy/model_mapper.rs`（`map_codex_failover_model`；fork 测试补列保留）、`src-tauri/src/proxy/providers/mod.rs`（kimi history 模块声明；fork 测试补列保留）、`src-tauri/src/tray_panel.rs`（Linux 不透明画布与注释；fork 的 `panel_visible()` 保留）、`src-tauri/capabilities/default.json`（zoom 权限；fork 无 updater 权限保留）。
  - 前端 12 个：`src/App.tsx`（迁移完成事件 + 缩放快捷键 + grokbuild 终端；fork 门控与标题语义保留）、`src/components/providers/ProviderCard.tsx`（密度 token + 图标主题；fork 副标题链/徽章/置顶置底保留）、`src/components/settings/sections/GeneralSection.tsx`（密度/缩放设置区；fork 面板可见性区保留）、`src/components/shell/Sidebar.tsx`（`h-nav-row` 三处；fork 过滤保留）、`src/components/universal/UniversalProviderFormModal.tsx`（`disable_response_storage` 移除；fork websiteUrl2 段保留）、`src/types.ts`（上游 Settings/会话搜索类型；fork 类型保留）、4 个 `src/i18n/locales/{en,ja,zh,zh-TW}.json`、`src/config/hermesProviderPresets.ts`、`src/config/openclawProviderPresets.ts`、`src/config/opencodeProviderPresets.ts`、`src/config/piProviderPresets.ts`（上游 TokenPlus/Genesis/Mistral 条目；fork 的 `hidden?` 接口字段保留）。
  - 测试 5 个：`tests/components/AppsPage.test.tsx`（上游排队用例；fork 等待顺序修复保留）、`tests/components/ClaudeFormFields.test.tsx`（上游 Genesis 用例；fork 用例保留）、`tests/components/ProviderPresetSelector.test.tsx`（两侧各自新增用例合并）、`tests/components/__snapshots__/ProviderForm.presetRows.golden.test.tsx.snap`（上游去 `disable_response_storage` 三处；fork `websiteUrl2` 行保留）。
- 本轮不新增 fork 专属代码文件；`src/config/forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 按 Q1 结论决定是否改（默认不改）。

### 删除

- 上游本轮删除文件为 0；fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回（`schema.rs` 的 `stream_check_logs` 建表语句保留；`commands/stream_check.rs`、`database/dao/stream_check.rs` 保持不存在）。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v428` 是安全参照分支，不是工作区）。
- 不新增数据库迁移臂、不改 `SCHEMA_VERSION`（fork 保持 25，上游本轮仍为 24，不撞号）。
- 不重新接线 `stream_check`、不恢复 updater。
- 不复活 release.yml 被裁段（Linux bundle、公证 stapler）；Release 的 macOS runner 保持 `macos-14`。
- 不改 `forkPresetFilter.ts` 判定实现。
- 不引入 `upstream/main` 上 tag 之后的提交（`git rev-list --count v4.0.28..upstream/main` 现取为 0，本轮无此风险；口径保留）。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。
- 不给 fork 托盘 show/hide 路径补 `main-window-visibility-changed` emit（沿用 v4.0.26 轮 D4 结论）。

# 非目标

- 不改 fork 自有功能实现与形态：两条连通性链路并存、托盘左键契约、模型徽章/快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识。
- 不改 fork CI 的裁剪策略（构建平台、tag 守卫、Release macOS runner 保持 `macos-14`）。
- 不做本轮之外的功能开发、重构或依赖升级；依赖变动只取上游本轮实际改动（crate-type 收敛为 rlib）。
- 不在 Shape/Verify 阶段执行任何远端写操作（push、tag、PR、Release 触发）。
- 不评估 `upstream/main` 上 tag 之后的未发布提交（现取 0 个）；不同步其他上游分支。
- 不把上游 FTS5 会话搜索、密度缩放等新功能接进 fork 的门控体系（fork 门控只控制入口可见性，面板内部功能随上游）。

# 验收示例

- 同步基线与重放完整性可核对：`git merge-base main v4.0.28^{}` 为 `f621d4216`（fork 提交全部落在 `v4.0.28` 之上），`git rev-list --count v4.0.28..HEAD` 等于 `pre-sync-v428`（= `ccc035dd1`）现取的 fork 提交数中实际重放数量加本轮新增提交，重放主题序列与 `pre-sync-v428` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。
- fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。
- 两条连通性链路并存终态不变：上游 MCP 检测链与 fork 供应商逐模型测试链同时在位；`stream_check_provider` 保持 0 命中；`services/stream_check.rs` 与 `proxy/http_client.rs` 的 #9253 修复按孤儿文件落地（D6），不接线、不恢复模块声明。
- 上游 v4.0.27 新功能落地且与 fork 门控共存：FTS5 三命令注册并随上游默认关；密度/缩放设置与快捷键落地，fork 的 GeneralSection 面板可见性区、Sidebar 过滤、ProviderCard 副标题链不受密度 token 改名影响（`min-h-card`/`py-card-y`/`h-nav-row` 语义与原值对应）；定价搜索、Skills 重排、Grok Build 终端、图标随主题、右键菜单禁用、对话框拖动逐项在位。
- 上游 v4.0.28 Codex 链落地：路由/聚合写内置 `openai`、切换提示分桶数量、持续迁入、迁移完成事件、暂停官方登录、额度保护默认开全部落地；fork 的快捷切换与 1M 改写（Claude 系 env 键链路）不受影响。
- 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v428` 相同；`schema.rs` 的 savepoint helper 取上游且 `stream_check_logs` 建表语句保留；`database/{schema,tests}.rs`、`dao/providers_tests.rs` 全部用例通过。
- 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、fork 键段保留；`tr.json` 与 `v4.0.28` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。
- 预设与白名单按 D3 落地：上游 TokenPlus/Genesis/Mistral 条目随预设文件落地；fork 白名单维持过滤（三个都不收录，fork 构建下被过滤），`forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 不改；预设编号 → 过滤 `hidden` → 过滤白名单的顺序不变。
- CI 终态符合 D4：ci.yml 为上游重构结构 + fork 语义（push main 全量跑、无 schedule/workflow_dispatch、WSL2 restore-only + continue-on-error、fmt-check Linux 前置）；release.yml 保持 fork 裁剪版且上游 4 段 pnpm store cache 移除同步应用；macOS runner 仍 `macos-14`。
- 后端在 fork 结构下编译通过：`cargo check --all-targets` 与 `cargo nextest run` 零失败、无新增未使用告警，且 `cargo fmt --check` 通过；上游新增 `Provider` 结构体字面量（含 `model_mapper.rs` 新测试的 `..create_provider_without_mapping()` 结构更新语法）与 fork 的 `website_url_2` 字段无缺列。
- 版本与锁文件终态一致：四处版本号均为 `4.0.28-1`；`Cargo.lock` 只出现 `cc-switch` 版本行变动与 crate-type 相关条目；`pnpm-lock.yaml` 终态无 `@tauri-apps/plugin-updater` 三段；`pnpm install` 与 `cargo check` 均报告锁文件未被改写。
- 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证性 `git fetch upstream` 不带 `--prune-tags`；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.13 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径，可复算脚本 `scripts/fidelity-v428.py`）：在最终态提交之后，用 `v4.0.28` / `v4.0.26`(基线) / `pre-sync-v428` / `HEAD` 四个 ref 计算行多重集差集。**方向 A（上游侧）先扣除 `pre-sync-v428` 既有的历轮分歧，只归因「本轮新增丢失」＝ 6 行**（现取为准）：`release.yml` 3 行（`''`/`with:`/`shell: bash`——whats-new-check job、pinned toolchain、Windows arm64/Linux matrix、Linux 系统依赖段随 fork 裁剪版整体不保留，属「裁剪段」）、`lib.rs` 3 行（`}`/`{`/`}`——updater 插件注册段、tray 构建注释、stream_check 注册行、Reopen 内联块等 fork 令牌替代的连带结构行，属「移除链路/专属文案」）。**非重叠的上游文件缺失为 0；历轮既有分歧（locale 69-70 行等）不计入本轮。方向 B（fork 侧）＝ 12 行**：ci.yml 6 行与 release.yml 1 行（fork 旧 CI 形态被 D4 合并形态替换的登记行：旧 concurrency 分组、无 `|| 'true'` 输出、旧英文注释、pnpm store cache 步骤、LNK1327 旧注释——语义均已按合并形态在位）、四个版本文件各 1 行（`4.0.26-1` → `4.0.28-1` 预期版本流转）、`commands/settings.rs` 1 行（`use tauri::AppHandle;` → `{AppHandle, Emitter}` 合并等价）。出现无法归类的缺失行即判定失败。

# Constraints and invariants

- 只锁已发布 annotated tag：同步目标必须是 `v4.0.28^{}` 剥离出的提交（`8656ebd91`），不得拿 tag 对象 sha（`9bd119930`）当提交 sha 做 merge-base 核对；`upstream/main` 上 tag 之后的提交不纳入（现取 0）。
- 取证性 fetch 禁止 `--prune-tags`（v4.0.26 轮实测会删光 fork 专属本地 tag）；只允许 `git fetch upstream --tags`（不带 prune）或 `git fetch upstream tag <name>`。
- 冲突解决遵循 `docs/HOW_TO_REBASE_UPSTREAM.md` §3：fork 专属文件保留 fork 侧（rebase 中为 `--theirs`），共享文件取上游（`--ours`）后再叠加 fork 语义；版本与锁文件禁止 `git checkout --ours` 整体取侧。
- `.comet/config.yaml` 是 fork 专属文件且会被重放的历史提交改回旧内容，rebase 中途必须显式恢复并纳入提交，否则 Native Hook 会拒绝写入。
- 预设条目 id 数字必须等于原始数组下标：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变。
- fork 的 `Provider`/`UniversalProvider` 结构含 `website_url_2`，上游新增的任何 `Provider { … }` 字面量必须补该字段或走结构更新语法，否则 `cargo check --all-targets` 失败。
- fork 移除链路不得复活：`tauri_plugin_updater` / `@tauri-apps/plugin-updater` / `install_update_and_restart` 实现 / `stream_check` 模块声明与命令注册（`services/mod.rs` 无 `pub mod stream_check;`、`commands/stream_check.rs` 与 dao 文件保持不存在）。
- 本轮 `lib.rs` 重放停车点解完后必须确认 fork 两个 connectivity 注册与上游 FTS5 三个注册同时在位、`stream_check_provider` 0 命中。
- `tr.json` 与上游 tag 逐字节一致、不补 fork 键；4 个既有 locale 合并后必须按对象作用域显式查重（`object_pairs_hook` 类），`JSON.parse` 静默取最后一个键不能作为无重复的证据。
- 落地保真复算必须在最终态提交之后进行，差异行必须带重数与文件归属；修复类提交会改变保真数字，规格与文档中的数字须随修复刷新或改为现取口径（历轮教训：绝对条数会被后续提交作废）。
- 正式检查计划必须包含 `cargo fmt --check --manifest-path src-tauri/Cargo.toml`（fork CI 三平台都有该步）。
- 时间敏感用例的既有 flaky 边界（`SessionManagerPage` 分桶在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例在 CI 并发下竞态）按「与上游逐字节比对 + 本地重复跑」判定，不登记为同步丢语义。
- 归档、merge、push、PR 与工作区清理各自需要的授权互不代替；本轮工作区为 `current`，归档不需要收尾方式选择。

# Decisions

- **D1｜基线、区间与工作区**：同步基线锁定 annotated tag `v4.0.28`（tag 对象 `9bd119930…`，剥离提交 `8656ebd91…`），单发布跨度（63 提交 / 214 文件，含 v4.0.27 + v4.0.28 两个发布点），fork 版本号 `4.0.26-1` → `4.0.28-1`；不纳入 `upstream/main` 的 tag 后提交（现取 0）。工作区用 `current`，沿用 main 与当前目录（本轮开始时工作区干净、无其他 active Native change、用户未要求并行，与历轮一致）；`pre-sync-v428` 只作回退参照分支，不是工作区。
- **D2｜上游是否重写 fork 功能：本轮没有，不产生二选一**。按三步口径取证：①`git diff v4.0.26 v4.0.28` 逐文件与 fork 侧形态比对；②37 个重叠文件全部有 fork 语义，但均为不同行区域的机械叠加（明细：`lib.rs` 上游 Linux webview 插件/FTS5 注册/迁移注释 vs fork updater 移除/托盘语义/connectivity 注册/Reopen 复用；`misc.rs` 上游工具进度+Grok 终端 vs fork 4 处 tunecc URL；`settings.rs` 上游密度/会话搜索/暂停登录/额度保护 vs fork `VisibleSidebarPanels`；`GeneralSection.tsx` 上游密度区 vs fork 面板可见性区（顶部 import 行可能停车，合并取并集）；`Sidebar.tsx` 上游 3 处 `h-nav-row` vs fork 过滤段；`ProviderCard.tsx` 上游密度 token+图标主题 vs fork 副标题链/徽章/置顶置底（行区间实测不相交：上游 403-438 vs fork 381-387 与 445+）；`provider.rs`/`deeplink/provider.rs`/`UniversalProviderFormModal.tsx` 上游删 `disable_response_storage` 模板行 vs fork `website_url_2` 字段（不同区域）；`services/provider/mod.rs` 上游 `SwitchResult` 新字段 vs fork 测试补列；`forwarder.rs` 上游 37 hunks vs fork 2 处（2326 注释/4855 测试，不相交）；`model_mapper.rs` 上游新函数+新测试 vs fork 2 处测试补列（不相交）；`tray_panel.rs` 上游 Linux 不透明 vs fork `panel_visible()`；golden 快照两侧改不同条目）；③同域逐项排除——上游 stream_check 修复是 fork 已移除链路的孤儿文件维护（D6），AGY 每周额度落在 `SubscriptionQuotaFooter`/`quotaRules` 不碰 ProviderCard 副标题，上游切换 toast 提示（`useProviderActions.ts`，fork 零语义）与 fork `ModelQuickSwitch` 无关，Linux 托盘修复不触 `TrayIconEvent::Click`（`tray.rs` 本轮上游零改动）。用户「上游重复则询问」的条件本轮未触发。
- **D3｜预设与白名单：维持过滤，都不收录（用户 Q1 确认，2026-11-09）**：上游本轮解隐藏 Mistral AI（5 个目录）并新增 TokenPlus、Genesis 两个第三方预设族。三个都不进 `forkOfficialAllowlist.ts`——fork 构建下不可见（编号 → 过滤 `hidden` → 过滤白名单的既有顺序天然过滤它们），上游构建不受影响；`forkPresetFilter.ts` 判定实现不改。用户日后想用这些预设时仍可自定义添加。
- **D4｜CI 合并：上游重构结构 + fork 裁剪语义**。取上游：concurrency（PR 按 PR 号成组可取消、main 每次运行独立组不取消）、`CARGO_PROFILE_DEV_DEBUG`、paths filter 收敛到 `ci.yml`、`pnpm/action-setup` + `setup-node cache: pnpm`、`frontend-tests` 4 shards、后端 fmt-check Linux 独占前置、rust-cache `save-if: main`、后端 `timeout-minutes: 45`；再叠加 fork 语义：删除 `schedule` 与 `workflow_dispatch`（fork 无定时全量），frontend/frontend-tests/backend/WSL2 四个 job 的 `if` 改为 `github.event_name != 'pull_request' || needs.changes.outputs.* == 'true'`（push main 全量跑，fork 已知缓存语义），后端测试保持 `cargo nextest`，WSL2 job 保持 restore-only rust-cache 与 `continue-on-error: true`。release.yml 取上游 4 段 pnpm store cache 移除，其余保持 fork 裁剪版。`07798d56f` 的 wsl2-nightly 修改取上游（fork 未裁剪该文件）。
- **D5｜构建物料**：`Cargo.toml` 取上游 `crate-type = ["rlib"]`（`62de0f3e9`；fork 仅发桌面版，staticlib/cdylib 只服务移动端，收敛后每次构建少链一个 dylib）；fork 的 `codegen-units = 1`、`repository = tunecc`、无 `tauri-plugin-updater` 依赖保留；`Cargo.lock` 仅版本行与 crate-type 相关变动；四处版本号统一 `4.0.28-1`。
- **D6｜stream_check 孤儿豁免**：`1d6efa644` 的 `services/stream_check.rs`（+45）与 `proxy/http_client.rs`（+13，no-redirect client helper）按孤儿文件落地——fork 保留文件但不恢复 `pub mod stream_check;` 声明与任何命令注册；`http_client.rs` 非孤儿，改动正常生效（其 helper 仅供 stream_check 调用，fork 内零引用，不产生编译面变化）。历轮「上游修复落在 fork 已移除链路」的豁免流程适用，验收项按「文件落地 + 链路不可达」双条件核对。
- **D7｜schema：不撞号、不新增臂**：上游 `SCHEMA_VERSION` 仍 24，fork 保持 25；`schema.rs` 取上游 `in_savepoint` 批量化（建表 + 定价 seed 合成单事务），fork 的 `stream_check_logs` 建表语句与全部迁移臂保留；FTS5 索引是独立 `session-index.db` 文件，不进 `schema.rs`、不改 user_version。
- **D8｜Codex 链与 fork 快捷切换互不干扰**：上游会话分桶提示走 `useProviderActions`（fork 零语义）与 `SwitchResult.codex_history_split`（新字段，fork 的 `website_url_2` 测试补列不受影响）；fork 的 `ModelQuickSwitchDialog`、模型徽章、1M 改写（`model_mapper.rs` 的 `strip_one_m_suffix*` 链）保持原样，上游新函数 `map_codex_failover_model` 独立于该链。
- **D9｜ProviderCard 与表单叠加**：上游密度 token（`min-h-card`/`py-card-y`）与图标随主题（`bg-transparent text-fg-1`）按上游位置落地；fork 副标题优先级链、模型徽章、双官网链接、右键置顶/置底逐行保留；`GeneralSection.tsx` 顶部 import 合并取并集，fork 面板可见性 UI 段（文件尾）与上游密度设置区（128-190 行区域）互不覆盖。
- **D10｜本地化**：4 个既有 locale 上游新增与改写逐字取上游、fork 键段保留；`tr.json` 本轮不在重叠面，整文件随上游、与 `v4.0.28` tag 逐字节一致、不补 fork 键；合并后 5 个文件按对象作用域查重 `dup=0`。
- **D11｜文档与交付授权延后**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 表按本轮结果增改并追加 §4.13「v4.0.28 轮的叠加要点」；归档时把 `docs/comet/specs/upstream-sync/spec.md` 整体重写为 v4.0.28 完整状态；本轮不改 `docs/comet/specs/database-schema-migrations/spec.md`（schema 仍 25、无新臂）。Build/Verify 不推送、不打 tag；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.28-1` 的推送。只授权这两项远端动作，不创建 PR。

# Open questions

本轮无未决项。用户要求的「上游若重复实现 fork 功能则分析并询问」已按三步口径执行，结论为本轮无同域重复（见 D2 与 Outcome 逐项取证），不产生二选一；Q1（预设白名单）已由用户确认维持过滤、都不收录（D3）。

# Verification expectations

- 定向检查（Build 期）：`cargo check --all-targets`、`cargo fmt --check`、按受影响模块 `cargo nextest run`、`pnpm typecheck`、`pnpm test:unit` 的定向子集、locale 重复键显式查重脚本、`git grep -I` 保留清单与移除清单取证。
- 正式检查计划（Verify 期，随 Builder 交接提交给 Runtime 执行）：
  1. `pnpm install --frozen-lockfile` 与 `pnpm typecheck`；
  2. `pnpm test:unit`（前端全量单测，含上游新增 interfacePrefs、codexHistorySplitHint、会话搜索、TokenPlus/Genesis、themeAdapt、ProviderIcon、PricingConfigPanel、ModalDragStrip、RepoManagerPanelCount 用例与 fork 用例）；
  3. `cargo check --all-targets --manifest-path src-tauri/Cargo.toml`；
  4. `cargo fmt --check --manifest-path src-tauri/Cargo.toml`；
  5. `cargo nextest run --manifest-path src-tauri/Cargo.toml`（后端全量，含托盘护栏、schema 用例、savepoint 重构后的 database 用例、上游新增 session_manager/search 相关与 kimi history transform 用例）；
  6. locale 查重与逐字节核对脚本（4 个既有 locale `dup=0`、`tr.json` 与 tag 一致、上游新增键齐备）；
  7. fork 保留清单与移除清单的 `git grep` 取证脚本（updater / `stream_check` 零命中，两个 connectivity 命令注册与 fork 链路、白名单、FTS5 三命令注册在位）；
  8. 版本四文件与两个锁文件的 `git diff --numstat pre-sync-v428 HEAD` 核对；
  9. 四 ref 落地保真复算脚本（在最终态提交之后运行，输出逐行归因清单）。
- 已知不可靠信号：管道后的退出码、后台任务通知文本、未 grep 验证的符号名不得作为通过证据；时间敏感用例出现单条红时先按上游同用例比对与本地重跑判定。
- Verifier 需独立判断全部验收项，不只复跑命令；与当前候选实现匹配的成功检查记录可复用，失败/阻塞/未执行/超时不得算通过。
