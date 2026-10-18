# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头，fork 侧 153 个魔改提交（`v4.0.12..main`，含 v4.0.12 的同步提交、白名单提交、文档更正提交、归档提交与 AppsPage 竞态修正提交）按原顺序重放保留，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.12-1` 升为 `4.0.15-1`；全部验收项通过且用户接受验收结果后，按交付授权上传 origin。

- 版本号 `4.0.12-1` → `4.0.15-1`；基线已确认为 tag `v4.0.15`（`988b0d00`），交付授权为沿用上轮方式（push main + tag v4.0.15-1 并触发 Release CI）。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v415/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v415/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v415`（= 同步前 main `dbb06a89`，该提交同时是 origin/main），仅用于回退参照与重放前后 diff 对照。
- 随上游 rebase 落地的上游新增文件 38 个（基线 tag `v4.0.15` = `988b0d00`）：后端 `src-tauri/src/proxy/providers/codex_chat_tool_history.rs`、`src-tauri/src/session_manager/hermes_wsl.rs` 与 `hermes_wsl_reader.py`；前端 `src/components/providers/OpenTerminalDialog.tsx`、`src/components/providers/mode/StackSettingsSheet.tsx`、`StackSubagentFields.tsx`、`useDesktopConfigMessages.ts`、`src/components/usage/UsageDisplaySection.tsx`、`rememberedChoice.ts`、`requestLogColumns.ts`、`src/hooks/useMoneyFormat.ts`、`src/utils/routeSwitchNotification.ts`、`src/whats-new/4.0.13.json`、`4.0.14.json`、`4.0.15.json`、新图标（alltokens/everyapi/modelflare）；测试 11 个新文件；文档 `docs/release-notes/v4.0.1{3,4,5}-{zh,en,ja}.md`（9 个）。
- 交付步骤（验收通过并归档后，按 Q2 授权）新增本地 annotated tag `v4.0.15-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.12-1` → `4.0.15-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。上游 `v4.0.12..v4.0.15` 对这四处的改动只有版本号行，本轮无新增/移除依赖。
- 49 个上游/fork 重叠文件（完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开；实测口径 `comm -12 <(git diff --name-only v4.0.12 v4.0.15|sort) <(git diff --name-only v4.0.12 main|sort)`）：4 个版本与锁文件、`.github/workflows/ci.yml`、11 个后端文件（`src-tauri/src/{lib,settings,tray}.rs`、`commands/{misc,settings}.rs`、`database/{schema,tests}.rs`、`deeplink/provider.rs`、`proxy/forwarder.rs`、`proxy/providers/{claude,mod}.rs`、`services/provider/mod.rs`）、17 个前端文件（`src/App.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src/components/shell/Sidebar.tsx`、`src/components/providers/{ProviderCard,ProviderList,AddProviderDialog,EditProviderDialog}.tsx`、`forms/{ProviderForm,ClaudeDesktopProviderForm,ClaudeFormFields}.tsx`、`src/components/settings/AboutSection.tsx`、`src/config/appConfig.tsx`、8 个 `src/config/*ProviderPresets.ts` 中的 6 个 + `gemini`/`grokBuild`）、4 个 `src/i18n/locales/*.json`、12 个测试与快照文件。
- 上游本轮改动、fork 侧未触碰的其余 180 个文件随 rebase 直接落地。上游本轮**未触碰** fork 专属白名单文件（`forkBuild`/`forkOfficialAllowlist`/`forkPresetFilter`、`devpanel/`、`tauri.{windows,dev}.conf.json`、`vite.config.ts`、`.github/workflows/release.yml` 等，实测 `git diff v4.0.12 v4.0.15` 对这些路径零命中）。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订；确有新增 fork 专属文件时才补充条目。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.15`（`988b0d00`）：当前 merge-base `51ac86f1`（v4.0.12）→ 目标 `988b0d00`。

### 删除

- 上游本轮删除 1 个文件：`src/components/providers/mode/DesktopAccessBar.tsx`（v4.0.13 把 Claude Desktop 并入设备级 direct/route 模式面板；fork 未改过该文件，随上游删除；fork `App.tsx` 对它的引入与渲染分支在冲突解决时改取上游新形态）。
- 只随上游删除代码片段与 locale 键：`nav.todayCost`、`nav.mode.mapping`/`mappingFull`（Sidebar 的 mapping 分支由上游重写，fork 该区域无自有语义，直接取上游）；`codexStackClassicSubagents` 设置键改名 `codexStackClassicTools`（fork 未触碰相关文件，随上游）。fork 已删除的 updater 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v415` 是安全参照分支）。
- 不新增 fork 专属代码文件、不改 `forkPresetFilter.ts` 判定实现与 `forkOfficialAllowlist.ts` 既有条目（上游本轮无新增 `category: "local"` 预设，白名单无须追加；TokenFactory/Modelflare/EveryAPI/AllTokens 等赞助商/云预设按 fork 既有政策默认拒绝）。
- 不创建 PR；不推送除 Q2 授权范围之外的任何远端引用。
- 不新增数据库迁移（上游 v4.0.15 仍为 `SCHEMA_VERSION = 20`，fork 保持 21）。
- 不引入新的 Rust/npm 依赖（上游本轮对 `Cargo.toml`/`package.json` 只改版本号行）。
- 不给 `tr.json` 补 fork 键（沿用 2026-10-15 Q3 决定：与上游 tag 逐字节一致）。

## 上游本轮同步范围（v4.0.12..v4.0.15，98 提交 229 文件 +17282/−2112）

- **v4.0.13**（30 提交）：Claude Desktop 并入设备级 direct/route 模式（8 提交：`3e9eede4`、`19a3e8d4`、`b93bf12d`、`e5508224`、`e4367db5`、`58354f91`、`78d2517a`、`f9e0d537`/`7c763cf3`），迁移旧映射卡、聚合（stack）模式上线、回直连需确认；Codex「Auto Review 用另一模型」（`e70e844c`）与聚合 sub-agent 模型/推理强度选择、经典子代理工具默认开启（`6aeaeb17`，设置键 `codexStackClassicSubagents` → `codexStackClassicTools`）；Claude Haiku 档可声明 1M（`3d46e06c`）、有 1M 窗口的预设预勾 1M（`31038e68`）、Claude Desktop 预设声明 1M（`5fd57811`）；portable zip 从更新按钮直下（`b391565f`，新增 `open_portable_update_download` 命令）；TokenFactory/Modelflare 赞助商预设（`e7a76adc`、`0a6eb00e`）；GPT 上下文窗口封顶 272K；Windows 原生 CSS 拖拽区修复、Codex 引号表头、Chat 流 DONE 边界、compaction 偏好等修复。
- **v4.0.14**（30 提交）：用量看板大改（`4e20fad5`、`8f3337d9`、`0cfea5e3`、`c6daf78c`、`b194cc09`、`9d83b2e8`、`85ae0c7b`、`17960423`… ：币种与可编辑汇率、侧栏 Today 标签内容可选、请求日志列可选 + 缓存写/命中率/总耗时/状态码新列、记住上次视图）、Open Terminal 说明并记住目录（`8c2c89e0`）、`UsageDisplaySettings` 存入 `settings.json`、Gemini thought signature 往返与 skip 回退、Codex 重试/流超时键保留、Skills 大仓库（>128 MiB 落盘）、大写模型定价 `COLLATE NOCASE`、TokenFactory 去赞助化（`a96e2fcc`）、Pi 三色图标（`25310890`）、SiliconFlow CN 换 DeepSeek-V4-Flash（`722042ad`）等。
- **v4.0.15**（31 提交）：Windows 设置更新后重置修复（`8a06838d`、`97daccb6`：临时文件+rename 原子保存、宽松解析保字段、BOM/尾部容忍、坏文件备份 `.broken-<time>.bak`）；Codex 仅在 `--version` 真失败才重装（`2bcf953b`）；macOS 图标白底圆角（`dd24b1ed`）；本地路由保持 Claude JSON 会话身份（`797e0276` 稳定缓存键、`5089eb69` Gemini skip 签名回退）；Codex Chat 恶化 tool-call 历史恢复（`f9bc9a4f`）与 DeepSeek 工具回放（`2a7080f1`）；WebDAV/S3 300s 截断修复（`c696c68f`）；Windows 终端恢复用户 PATH（`ecb449f4`）；Hermes WSL 实时库读取（`d23cee4c`，新增 python3 依赖项属发行版内）；路由切换提示精细化（`5cc94b8d`，不再无条件要求重启）；Pi subagent 用量（`d1856448`）；拖拽卡片防拉伸重叠（`afbf073b`）；用量趋势图 bar/area（`73f37c4b`）；Hermes 逐模型图像输入（`ff3e33a8`）；Claude Desktop 托管 OAuth 拉模型（`5d04c12d`）；Claude Desktop 本机供应商可引导本地路由（`7344cc37`）；每 1M 模型单行（`d4f2d4e4`）；skills 分支回退仅 404（`24d87028`）；桌面堆叠聚合设置等。
- **post-release（本轮不纳入，Q1 选 A）**：`77c6dc79` 托盘玻璃面板（3.7k 行，macOS/Windows 点托盘弹出面板，替代原生菜单；与 fork 托盘左键切换主窗口直接冲突）、`73cdfbb7` 土耳其语 17 条文案修正——两者留待下一轮随新 release 纳入。

# 非目标

- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等）；不做部分 cherry-pick。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.12-1` 及更早的 fork tag。
- 不改动 fork 的数据库迁移链（SCHEMA_VERSION 21 与 v20→v21 修复迁移原样保留）。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程、旧 `stream_check` 链路）。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不给 `tr.json` 补 fork 键。
- 若基线为 tag `v4.0.15`：不纳入 `upstream/main` 的 2 个 post-release 提交（托盘玻璃面板、土耳其语文案修正），下一轮随新 release 纳入。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.15` 等于 `988b0d00`（tag `v4.0.15` 指向的提交），`git log v4.0.15..main` 只包含 fork 提交、不含任何上游提交。
- A2: 重放前 `v4.0.12..main` 的 153 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）在完整目标规格「重放映射」中逐条记录；每次冲突停车逐条记录归属与解法。
- A3: 49 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（版本与锁文件、`settings.rs`、`tray.rs`、`misc.rs`、`App.tsx`、`Sidebar.tsx`、`ProviderList.tsx`、`ClaudeFormFields.tsx`、`ClaudeDesktopProviderForm.tsx`、4 个 locales、测试文件为高危面）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.15-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤（官方+本机推理白名单）、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/components/{ModeDialog,OpenTerminalDialog,StackSettingsSheet,UsageDisplaySection,AppsPage,ProviderList,ProviderPresetSelector,ClaudeFormFields,ClaudeDesktopProviderForm}.test.tsx`、`tests/components/shell/SidebarToday.test.tsx`、`tests/hooks/{useMoneyFormat,useSwitchProviderResult}.test.tsx`、`tests/utils/routeSwitchNotification.test.ts` 等）与 fork 既有用例。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（本轮唯一合法改动是 `cc-switch` 包版本号行）。
- A13: `cargo test` 通过（如遇与上轮同因的环境性失败——本机 cc-switch 占用代理端口 15721——按上轮口径显式 `--skip` 该用例并记录原因；上轮被 skip 的用例已被上游改名/重写，本轮以实际失败项为准，不扩大跳过列表）。
- A14: 落地保真核对通过：对 49 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.12`、`v4.0.15`、`pre-sync-v415`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位；`tr.json` 与 `git show v4.0.15:src/i18n/locales/tr.json` 逐字节一致。

# 约束与不变量

- fork 全部 153 个魔改提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v415`（= `dbb06a89`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；无法安全判定的冲突暂停并记录。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对 `<<<<<<<` 与 `>>>>>>>` 标记零命中（取证口径 `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> '`）。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- 本轮高危叠加面：`src-tauri/src/{settings,tray}.rs`（上游 451+46- 的原子保存/UsageDisplay 与 fork `VisibleSidebarPanels` 段；上游 45+117- 删 `TrayMode::Desktop` 与 fork `hide_main_window`/`toggle_main_window` 两个 helper）、`commands/{misc,settings}.rs`（上游 Windows PATH/轮询改造与 fork releases 链接、updater 空壳）、`App.tsx`（上游删 DesktopAccessBar 分支与 fork DevPanel/面板段）、`Sidebar.tsx`（上游 Today 徽标改造 + 删 mapping 分支与 fork `visibleSidebarPanels`）、`ProviderList.tsx`、`ClaudeFormFields.tsx`（上游 Haiku 1M 与 fork 兜底直达区/1M 全选）、`ClaudeDesktopProviderForm.tsx`、`types.ts`、4 个 locales——出现「整文件取一侧」即视为丢语义缺陷。
- manifest 键删除项必须跟随上游：Sidebar 的 `status.mapping` 分支、`nav.mode.mapping*`/`nav.todayCost` 键、`DesktopAccessBar.tsx` 引入段、`codexStackClassicSubagents` 引用——fork 在这些区域无自有语义，取上游新形态（否则 typecheck 失败）。
- 上游 `AboutSection.tsx` 新增 portable 直链调用依赖 `checkUpdate` 自检；fork 已取消启动自检并保留简化 About——合并时保住 fork「不自检、不安装更新」语义，`open_portable_update_download` 命令注册随上游保留（无害），其 URL 若落地必须指向 tunecc 而非 farion1231。
- `.comet/config.yaml` 被历史重放改写时从 ORIG_HEAD 恢复并核对 native 启用状态。
- current 工作区在 main 上 rebase：检出新基线瞬间工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape；按 Runtime 返回的恢复命令处理。
-合并两侧 JSX/Rust 禁止按行去重；合并后必须本地跑 `pnpm format:check` 与 `pnpm build:renderer`；locale 重复键必须显式查重。
- 时间敏感用例 `tests/components/SessionManagerPage.test.tsx` 在本地 00:00–00:30 窗口必失败的既有口径继续适用。
- 推送（若 Q2 授权）只用 `--force-with-lease`；远端被他人更新时拒绝推送并报告。

# 决策

- 隔离方式：当前目录（`current`），沿用 main。理由：工作区干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去各轮一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（该能力既有总规格为纯散文；沿用 2026-10-15 轮决策）。
- 版本号：`4.0.12-1` → `4.0.15-1`；跳过的 4.0.13/4.0.14 不单独计代。
- 数据库 schema：上游 v4.0.13/14/15 均 `SCHEMA_VERSION = 20` 且 `database/**` 仅新增价格种子行；fork 保持 21，不新增迁移。
- 上游依赖：本轮 `Cargo.toml`/`package.json` 只有版本号行改动，合并后不得新增依赖；`Cargo.toml` 保持 fork 移除 `tauri-plugin-updater` 的状态。
- 预设白名单：上游本轮无新增 `category: "local"` 条目（各文件 local 计数 v4.0.12 = v4.0.15），`forkOfficialAllowlist` 不追加；新赞助商（TokenFactory/Modelflare/EveryAPI/AllTokens）不在白名单，fork 构建自动拒绝，无须新授权。TokenFactory 虽被上游去赞助化（`a96e2fcc`），但 fork 政策是「官方+本机推理」白名单，仍默认拒绝。
- portable 直链下载（上游 `b391565f`）的 fork 取舍：不接入前端更新入口。理由：该功能依赖 fork 已禁用的启动自检与 About 更新按钮路径，接入需恢复 fork 刻意移除的更新器 UI；fork 保留自身策略（About 指向 tunecc Releases）优于上游新行为。
- 同步基线：tag `v4.0.15` = `988b0d00`（2026-10-18 用户选择「tag v4.0.15」）。理由：锁已验证的发布头，与过去 12 轮同步惯例一致；post-release 的托盘玻璃面板（与 fork 托盘左键切换直接冲突）与土耳其语文案修正留待下一轮随新 release 纳入。
- 交付授权（2026-10-18 用户选择「沿用上轮方式」）：验收通过并用户接受结果、生成归档提交后，执行 `git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.15-1` 并 `git push origin v4.0.15-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端引用；执行前无需重复询问。
- portable 直链下载的 fork 取舍已定：不接入前端更新入口（依赖 fork 已禁用的自检链路）；`open_portable_update_download` 后端命令随上游保留注册，URL 基址指向 tunecc。

# 未决问题

- 无。Q1（同步基线）与 Q2（交付授权）已于 2026-10-18 由用户确认，结论记入「决策」。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`
- `cargo test`（环境性例外按 A13 口径）
- 落地保真核对脚本 + locale 重复键查重 + 冲突标记零命中
