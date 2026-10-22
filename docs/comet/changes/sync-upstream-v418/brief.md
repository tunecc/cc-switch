# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.18`（tag 对象 `81096e4`，剥离提交 `cb90a2440`），fork 侧 173 个提交（`v4.0.17..main`，起点 `a83bb9013` = origin/main）按原顺序整体重放，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.17-1` 升为 `4.0.18-1`。

上游 `v4.0.17..v4.0.18`（39 提交、213 文件、+11006/−1257，31 新增 / 1 删除 / 181 修改）与 fork 的重叠面为 **45 个文件**。本轮的主轴是 **AGY（Antigravity CLI）成为第 11 个应用**：上游把它接入 Apps 页、供应商表单、授权中心（仅 macOS 切号）、用量与会话、MCP/Skills 开关，并把数据库 schema 从 20 升到 21（`mcp_servers`/`skills` 加 `enabled_agy`）。

这带来三类必须显式决策的交集：

1. **预设白名单**：上游 agy 复用 `geminiProviderPresets`，fork 的 `forkOfficialAllowlist` 是 `Record<AppId, string[]>`，`AppId` 新增 `agy` 后必须有条目（Q1）。
2. **卡片模型显示 / 快捷切换**：上游给 agy 卡片加了「直接显示当前模型」的一行；fork 有模型徽章与快捷切换弹窗，但只覆盖 claude/codex/gemini/grokbuild（Q2）。
3. **跨应用导入**：fork 的导入来源按 `APP_IDS` 自动枚举、目标应用无条件渲染导入入口；agy 不在 fork 的 10 个读写分支里，会落到 `default` 分支（读空字段、写 `{}`），必须决定纳入（Gemini 形状）还是排除（Q3）。

其余上游改动 fork 均无对应实现，直接随 rebase 落地：授权中心 agy 账号与额度、agy 终端启动模型、赞助商预设（DIT.ai/hao.ai/EveryAPI 新增、ZetaAPI 删除）、用量应用筛选、Unix 文件描述符上限与登录 shell PATH、Windows MSI 不自动重启与可选桌面快捷方式、Claude 会话按最后一次 `/cd` 归组、Codex 未用量窗口隐藏重置倒计时、deepseek-v4.1-flash 定价。

交付沿用上轮方式（Q4）：验收通过并归档后推 main + 打 `v4.0.18-1` tag。

- 版本号 `4.0.17-1` → `4.0.18-1`；基线 tag `v4.0.18` = `81096e4`（剥离提交 `cb90a2440`）。
- 上游只锁「已发布 tag」：`v4.0.18` 之后的 `upstream/main` 提交（`e4873bc8a`）不进入本轮。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v418/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v418/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v418`（= 同步前 main `a83bb9013`，该提交同时是 origin/main），仅用于回退参照、重放前后 diff 对照与落地保真四 ref 比对。
- 随上游 rebase 落地的上游新增文件 31 个（`git diff --name-status v4.0.17 v4.0.18` 的 A 项），fork 在这些文件上无自有语义，全部随上游落地。按类别：
  - AGY 后端：`src-tauri/src/agy_config.rs`、`agy_smoke_tests.rs`、`commands/agy_account.rs`、`mcp/agy.rs`、`services/agy_account/{mod,oauth,keychain,quota,tests}.rs`、`services/provider/agy_direct.rs`、`services/session_usage_agy.rs`、`services/subscription_agy.rs`、`session_manager/providers/agy.rs`。
  - AGY 前端：`src/components/AgyAccountQuotaFooter.tsx`、`src/components/providers/forms/AgyOAuthSection.tsx`、`src/icons/extracted/antigravity.svg`。
  - AGY 测试：`tests/components/{AgyOAuthSection,GeminiFormFields,ProviderCard.agyModel,ProviderForm.agyLogin}.test.tsx`、`tests/config/agyLocales.test.ts`、`tests/hooks/useGeminiConfigState.test.tsx`、`tests/fixtures/sessions/agy.jsonl`。
  - 文档 / 赞助商素材：`docs/agy-integration-zh.md`、`docs/release-notes/v4.0.18-{en,ja,zh}.md`、`src/whats-new/4.0.18.json`、`assets/partners/logos/{dit-banner.png,everyapi-banner.jpg,haoai-banner.png}`。
- 交付步骤（验收通过并归档后，按 Q4 授权）新增本地 annotated tag `v4.0.18-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.17-1` → `4.0.18-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动）。上游本轮对 `Cargo.toml` 另加 `tokio` 的 `process` feature；`Cargo.lock` 对应给 tokio 依赖补 `signal-hook-registry`（该包已在锁文件中，不新增包条目）。
- 45 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.17 v4.0.18 | sort) <(git diff --name-only v4.0.17 HEAD | sort)`；上游 213 文件 + fork 侧 328 文件）。逐文件行数口径（`git diff --numstat v4.0.17 <ref> -- <file>`，上游 / fork）：
  - 版本与工作流：`package.json` 1/1、`src-tauri/Cargo.toml` 2/2、`src-tauri/Cargo.lock` 2/1、`src-tauri/tauri.conf.json` 1/1、`.github/workflows/release.yml` 14/0、`README.md` 15/5。
  - 后端：`src-tauri/src/lib.rs` 85/0、`commands/mod.rs` 2/0、`commands/settings.rs` 9/2、`commands/misc.rs` 747/166、`database/mod.rs` 1/1、`database/schema.rs` 68/0、`database/tests.rs` 1/0、`database/dao/mcp.rs` 6/3、`deeplink/provider.rs` 37/4、`provider.rs` 1/1、`proxy/providers/mod.rs` 2/2、`services/mod.rs` 4/0、`services/provider/{live,mod}.rs` 25/1、28/7、`settings.rs` 10/0、`tray.rs` 1/0。
  - 前端：`src/App.tsx` 21/4、`AppId` 相关 `src/config/appConfig.tsx` 23/0、`src/types.ts` 2/0、`src/components/providers/{AddProviderDialog,ProviderCard,ProviderList}.tsx` 2/2、51/10、15/3、`forms/ProviderForm.tsx` 45/13、`forms/PiProviderForm.tsx` 0/16、`forms/shared/EndpointField.tsx` 7/2。
  - 预设：`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts` 21/0、27/12、86/45、158/96、126/76、68/45。
  - 本地化：`src/i18n/locales/{en,zh,ja,zh-TW}.json` 各 63/27（fork 侧 `en` 330/26、`zh` 329/25、`ja`/`zh-TW` 317/25）。
  - 测试：`tests/components/{AppsPage,DeepLinkImportDialog,ProviderPresetSelector}.test.tsx` 10/1、55/0、2/2、`tests/hooks/useAddProviderMutation.test.tsx` 20/0。
  - 完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 168 个文件随 rebase 直接落地，含 AGY 全套新增文件、授权中心/用量/会话、`src-tauri/wix/per-user-main.wxs`、`src-tauri/src/services/session_usage_codex.rs`、`src/components/settings/sections/*`、赞助商素材与 README、3 份 release notes。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（新增 `database/schema.rs`、`commands/misc.rs`、`ProviderCard.tsx` 等行的 v4.0.18 口径），新增 §4.5「v4.0.18 轮的叠加要点」（AGY 交集、schema 22、白名单新条目）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 22 与 20→21（fork 修复 + agy）/ 21→22（agy 幂等补齐）两步。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q3 结果登记 agy 的纳入/排除与形状。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q2 结果登记 agy 不进入快捷切换、使用上游卡片模型行。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.18`（`81096e4` → 剥离提交 `cb90a2440`）：当前 merge-base `19798e2f`（v4.0.17）。

### 删除

- 上游本轮删除 1 个文件：`assets/partners/logos/zetaapi-banner.png`（`8d4ec90fc` 移除 ZetaAPI 赞助与预设），随上游删除。
- 上游本轮从 4 个 locale 各删除 17 个键（`tr.json` 同删 17 个），并按 `ab5d4a12d` 删掉 `PiProviderForm.tsx` 中引用 `opencode.npmPackageHint`/`baseUrlHint`/`modelsHint` 的三段提示文案；fork 侧同文件接受这些删除并保留自身改动。
- 代码片段级删除：fork 的 `install_update_and_restart` 空壳与 `native_menu_on_left_click` 零命中状态维持不变；上游添加的 `installer_arg("REBOOT=ReallySuppress")` 落在 fork 已空壳化的同一函数内，不采纳该 hunk（MSI 模板与 release.yml 的等效保障随上游落地）。
- fork 已删除的 updater 链路、`stream_check` 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式 `current`，直接沿用 main；`pre-sync-v418` 是安全参照分支）。
- 不新增 fork 专属代码文件；不改 `forkPresetFilter.ts` 判定实现；不改 `forkOfficialAllowlist` 既有条目（除 Q1 决定的新增 agy 条目）。
- 不创建 PR；不推送除 Q4 授权范围之外的任何远端引用。
- 不支持「fork v22 数据库被上游 v4.0.18（v21）打开」的降级兼容（上游自身即对更高版本报错，fork 沿用同一策略并在文档登记）。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。
- 不同步 `v4.0.18` 之后的上游 main 提交（`e4873bc8a`）。
- 不复活 fork 已删除的应用内更新器与 `stream_check` 链路；不新增赞助商/聚合站预设到 fork 白名单。

## 上游本轮同步范围（v4.0.17..v4.0.18，39 提交 213 文件 +11006/−1257）

1. **AGY（Antigravity CLI）接入**（约 24 提交，从 `c7dceb803` 到 `276eff8dc` 等）：
   - 后端：新增 `agy_config.rs`、`commands/agy_account.rs`、`services/agy_account/**`（OAuth、keychain、quota、tests）、`services/provider/agy_direct.rs`、`services/session_usage_agy.rs`、`services/subscription_agy.rs`、`session_manager/providers/agy.rs`、`mcp/agy.rs`；`app_config.rs` 增 `AppType::Agy` 与 MCP/Skills 的 agy 开关；`settings.rs` 增 `VisibleApps.agy` 与 `current_provider_agy`；`lib.rs` 注册 agy 模块、账户管理器、旧 launcher 迁移、`get_agy_models` 与账户命令；`provider.rs`/`services/provider/{mod,live}.rs`/`deeplink/provider.rs`/`proxy/providers/mod.rs`/`tray.rs`/MCP DAO 增 Agy 分支。
   - 前端：`AppId` 增 `agy`；`appConfig.tsx` 增 `APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`MCP_APP_IDS`/`APP_ICON_MAP` 条目与 `usesGeminiStyleForm()`（gemini + agy）；`ProviderForm.tsx` 全面改用 `usesGeminiStyleForm`，agy 走 Gemini 形状表单 + `preferConfigModel` + 官方卡绑定授权中心账号（仅 macOS）+ `AgyAccountSelect`；`ProviderCard.tsx` 的 `extractAgyModel`、agy 官方判定、`AgyAccountQuotaFooter`；`ProviderList.tsx` 的 `buildLaunchSections`、「打开终端」为主按钮、`isCurrentFor(agy)=true`；`AddProviderDialog.tsx` 的 gemini/agy 共用预设解析。
   - AGY 特性：11 个应用中的唯一「无当前/无启用、卡片即开终端」应用；agy 的 API Key 自定义卡只填 Key 也可用（走 Google 默认 API）；官方卡可绑定授权中心账号并查额度；授权中心新增 Antigravity 分组（切号仅 macOS）；使用量与会话归属到模型。
2. **数据库 schema 20→21**（`8f9525b03` 等）：`mcp_servers`/`skills` 加 `enabled_agy`；上游 release notes 明示 schema 升到 21，旧版打开会报「版本过新」。
3. **赞助商与预设**（`132ab9ced`/`0a41250dc`/`8d4ec90fc`/`e59252ee5`）：新增 hao.ai（8 app）、DIT.ai（9 app）、EveryAPI 升为正式赞助；删除 ZetaAPI 预设与 banner；新增 locale `providerForm.partnerPromotion.{haoai,dit}` 与 README 行。
4. **对话框关闭**（`ab5d4a12d`）：删除 4 个 locale 的 17 个冗余提示键并移除 `PiProviderForm` 三段提示、精简 provider/settings 帮助文案。
5. **用量/会话修复**（`711a4127f`、`ea8bc2c3a`、`e1821b5e4`、`6fabe63ab`、`e91689f2d`、`816346022`）：用量应用筛选只列 Apps 页可见应用；Claude 会话按最后一次 `/cd` 归组；Codex 未用量窗口隐藏重置倒计时；agy 会话行显示「Session log」、用量页去掉 agy 专属说明；deepseek-v4.1-flash 定价。
6. **Windows/Unix 稳定性**（`1ef08d5e7`、`cdfdff5ee`、`6226f5c46`、`47ffdff8e`、`04d0ebf56`、`fb91155a5`）：MSI 显式 `REBOOT=ReallySuppress` 且 release.yml 增加 Property 断言；桌面快捷方式可选；Windows 终端启动不再等待控制台；Unix 运行 CLI 用登录 shell PATH；启动时提高文件描述符软上限（封顶 10240）；agy 首次运行的空 `mcp_config.json` 可接受。
7. **发布相关**（`4aec1aeca`、`cb90a2440`）：四处版本号 `4.0.18`、CHANGELOG、3 份 release notes 与 `src/whats-new/4.0.18.json`。

# 非目标

- 不同步 upstream 其他分支与 `v4.0.18` 之后的 main 提交；不做部分 cherry-pick。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.17-1` 及更早的 fork tag。
- 不重构 fork 既有魔改以迎合上游新代码；只做叠加、契约适配与 Q1–Q3 选定的取舍。
- 不改上游 AGY 的内部实现（OAuth、额度、授权中心、终端启动、会话解析以上游为准）；fork 只决定它与自有功能的交集方式。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不给 `tr.json` 补 fork 键；不保留上游已删除的 17 个 locale 键与 `PiProviderForm` 提示。
- 不恢复应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程或 `stream_check` 链路。
- 不改 fork 的托盘左键分派（本轮上游未改托盘行为，`tray.rs` 只加 agy 标签）。
- 不改上游自带的测试与用例语义（除重放必须连接的改写与 fork 稳定性修正）。
- 不新增数据库迁移之外的结构变更；不改变 fork v20→v21 修复迁移的语义。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.18` 等于 `cb90a2440`（tag `v4.0.18` 剥离出的提交），`git log v4.0.18..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交。
- A2: 重放前 `git rev-list --count v4.0.17..pre-sync-v418` == 173；重放后 `git rev-list --count v4.0.18..HEAD` 与之的差异只来自「被 git 判定为空而丢弃」或「本轮新增提交」，逐条记录；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，冲突停车逐条记录归属与解法。
- A3: 45 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（高危面为 `database/schema.rs`、`lib.rs`、`commands/misc.rs`、`ProviderForm.tsx`、`ProviderCard.tsx`、`ProviderList.tsx`、`App.tsx`、4 个 locale、4 个版本与锁文件、`.github/workflows/release.yml`、`README.md`）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.18-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 22；迁移链：v18→v19（fork `website_url_2` + 上游 mcode 并存）、v19→v20（上游 pi）、v20→v21（fork 修复 mcode/pi + 上游 `enabled_agy`）、v21→v22（fork 幂等补齐 `enabled_agy`）全部在位；`create_tables` 的 `mcp_servers`/`skills` 含 `enabled_agy`；上游迁移测试改到 22，新增 v21→v22 用例。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤（含 Q1 的 agy 条目）、逐模型连通性测试（`lib.rs` 两个命令注册在位）、双官网链接、跨应用导入（含 Q3 的 agy 口径）、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.5、`lib.rs`/`database/schema.rs`/`commands/misc.rs`/`ProviderCard.tsx` 等行的新口径与 agy 白名单登记），全局与 change 内完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类），三处记录的数字与归属互相一致。
- A8: `pnpm typecheck` 通过（零 `TS2300`，AppId/VisibleApps/McpApps 的 agy 字段无重复声明）。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`AgyOAuthSection`、`GeminiFormFields`、`ProviderCard.agyModel`、`ProviderForm.agyLogin`、`agyLocales`、`useGeminiConfigState`、`DeepLinkImportDialog`、`AppsPage`、`ProviderPresetSelector`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自本轮允许项：`cc-switch` 版本号行 `4.0.18-1`、tokio 依赖的 `signal-hook-registry` 行；`tauri-plugin-updater` 相关条目不得出现。
- A13: `cargo test` 通过（含 fork 的托盘左键源码护栏、上游 agy 迁移/持久化用例、`src-tauri/tests/mcp_commands.rs`）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。
- A14: 落地保真核对通过：对 45 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.17`、`v4.0.18`、`pre-sync-v418`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键，fork 键段按 key 逐个比对全部在位；上游本轮 47 个新键在 4 个 locale 全部在位且取值与 `v4.0.18` 逐字节一致；上游删除的 17 个键在 4 个 locale 均不再残留（fork 无引用）；fork 专属覆盖 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 保持 fork 文案；`tr.json` 与 `git show v4.0.18:src/i18n/locales/tr.json` 逐字节一致。
- A16: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。
- A17: 上游 AGY 能力在 fork 落地后可用：11 个 `APP_IDS` 含 agy、Apps 页可安装/打开终端、agy 表单走 Gemini 形状与 `preferConfigModel`、官方卡绑定授权中心账号（仅 macOS 显示切号）、授权中心 Antigravity 分组与额度、会话/用量归属、MCP/Skills agy 开关、`enabled_agy` 持久化与迁移、上游新增测试全部通过。
- A18: Q1 的 agy 预设白名单生效：`forkOfficialAllowlist.agy === ["Google Official"]`，agy 表单预设条目 id 仍为 `gemini-<原始下标>`，`entriesFor` 保持「编号先于 hidden 过滤、先于白名单过滤」；上游 agy 预设（Google Official）在 fork 构建下可见，第三方/赞助商预设被过滤。
- A19: Q2 的 agy 卡片模型口径生效：agy 使用上游 `extractAgyModel` 模型行（含 `config.model.name` → `env.GEMINI_MODEL` 的取值顺序），不进入 fork 的 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗；4 个既有 app 的徽章与快捷切换行为不变。
- A20: Q3 的跨应用导入口径生效：agy 的读/建/改三个分支按 Gemini 形状处理（`env.GOOGLE_GEMINI_BASE_URL`/`GEMINI_API_KEY`/`GEMINI_MODEL`），`ProviderForm` 的 gemini 分支改用 `usesGeminiStyleForm(appId)`，agy 作为来源与目标都可用且不会写空配置；`useProviderImportSources` 与 `ProviderImportEntry` 对 agy 不做排除。
- A21: **fork 左键契约的源码级回归护栏通过**：`src-tauri/src/tray.rs` 的 `tray_left_click_never_opens_the_menu` 用例在重放后仍成立（`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`、`lib.rs` 的 builder 固定 `.show_menu_on_left_click(false)`），上游的 `native_menu_on_left_click` 辅助函数与其调用点在 fork 终态仍为零命中；`lib.rs` 的 `TrayIconEvent::Click` 分支保持 fork 四条分支语义。
- A22: 上游本轮稳定性与修复在 fork 落地后可用：Unix 启动提高文件描述符上限、Unix 运行时 CLI 使用登录 shell PATH、Windows 终端不再等待控制台、MSI `REBOOT=ReallySuppress`（`per-user-main.wxs`）与 release.yml 的 Property 断言、桌面快捷方式可选、Claude 会话按 `/cd` 归组、Codex 未用量窗口隐藏倒计时、deepseek-v4.1-flash 定价、用量应用筛选。
- A23: 冲突标记零命中：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 为 0（exit 1）。

# 约束与不变量

- fork 全部 173 个提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v418`（= `a83bb9013`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；`--ours` 是新基线（v4.0.18），`--theirs` 是重放的 fork 提交。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- **数据库 schema 是本轮最高风险结构面**：上游 v4.0.18 的 20→21 只加 `enabled_agy`；fork v4.0.17 已是 21 且 20→21 是 fork 的 mcode/pi 修复。终态必须同时满足：旧的 fork v21 库能升到 22 并补齐 `enabled_agy`；上游 v21 库（已有 agy）升到 22 幂等；v20 库一步走完 fork 修复 + agy；全新库 `create_tables` 含 agy。`migrate_v18_to_v19` 与 fork 的 `website_url_2` 必须保持并存。
- **AGY 的 AppId 扩散面**：`AppType::Agy` 会让 fork 修改过的穷举 `match app` 出现编译错误或漏分支——`settings.rs`、`provider.rs`、`services/provider/{live,mod}.rs`、`tray.rs`、`deeplink/provider.rs`、`proxy/providers/mod.rs`、`database/dao/mcp.rs`、`commands/mod.rs`、`services/mod.rs` 必须逐个确认 Agy 分支与 fork 语义并存；前端 `Record<AppId, …>`（`forkOfficialAllowlist`、`APP_ICON_MAP`、`DEFAULT_VISIBLE_APPS`、`VisibleApps`）必须补齐 agy，否则 typecheck 失败。
- `src/components/providers/forms/ProviderForm.tsx`：上游把 `appId === "gemini"` 全部改成 `usesGeminiStyleForm(appId)`；fork 的 `entriesFor`（编号先于 `hidden` 过滤、先于白名单过滤）必须保留，且 agy 分支要用 agy 的 appId 键做白名单、id 前缀仍为 `gemini-`。
- `src/components/providers/ProviderCard.tsx` / `ProviderList.tsx`：上游 agy 的 `extractAgyModel` 模型行、`AgyAccountQuotaFooter`、`buildLaunchSections`、`isCurrentFor(agy)=true`、更多菜单去重必须与 fork 的徽章/快捷切换/右键菜单/连接检测并存；`isModelCapableApp` 的集合按 Q2 决定。
- `src-tauri/src/commands/misc.rs`（上游 747/166）承载 AGY 的大部分命令与测试；fork 只改 6/5 行，冲突时逐 hunk 取上游并保留 fork 改动，禁止整文件取一侧。
- 4 个 locale 的三方合并必须逐文件查重（按对象作用域统计重复键）。上游本轮改动键多（各 +47/−17/~4），rebase 易把 fork 末键行与 `},` 收尾拼到同一物理行，`JSON.parse` 静默取后者、测试全绿。
- 上游 `ab5d4a12d` 删除的 17 个键必须确认 fork 代码零引用（尤其 fork 改过的 `PiProviderForm.tsx` 与设置页）；删除后 `pnpm typecheck` 与 `pnpm test:unit` 必须通过。
- `src/config/*ProviderPresets.ts`：上游新增赞助商预设、删除 ZetaAPI；fork 只加 `hidden?: boolean`。合并后 `pnpm typecheck` 零 `TS2300`；`forkOfficialAllowlist` 既有条目不因赞助商增删变化（Q1 只加 agy）。
- `.github/workflows/release.yml`：fork 的工作流是裁剪版，但包含与上游相同的 `$targetRoot/$msi/release-assets` 块；把上游 14 行 MSI Property 断言并入该块，保持 fork 的裁剪结构。
- `README.md`：接受上游 ZetaAPI 删除与 hao.ai/DIT.ai/EveryAPI 新增；fork 的构建说明与 §14 托盘说明保持不变。
- `.comet/config.yaml` 被历史重放改写时从 ORIG_HEAD 恢复并核对 native 启用状态。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态（fork 已按 `fork-test-stability` 口径修稳，本轮上游又给该文件加了一个 `waitFor`，合并时两处都保留）。
- 上游自带 CI 竞态 `services::session_usage_codex::tests::test_parent_rollout_is_cached_once_across_fork_cutoffs` 的判定顺序（与上游逐字节相同 → 上游同用例是否同样红 → 本地重复跑）继续适用；本轮该文件未被上游改动。
- 推送（按 Q4 授权）只用 `--force-with-lease`；远端被他人更新时拒绝推送并报告。
- 上游四处版本号行必须被 fork 的 `4.0.18-1` 取代，终态不得残留裸 `4.0.18`。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

# 决策

- 隔离方式：当前目录（`current`），沿用 main。理由：工作区干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去 16 轮一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（沿用历轮决策）。
- 版本号：`4.0.17-1` → `4.0.18-1`。
- 同步目标：只锁已发布 tag `v4.0.18`（`81096e4` → 剥离 `cb90a2440`）；`v4.0.18` 之后的 `upstream/main` 提交（`e4873bc8a`）留待下一轮 tag。
- 数据库 schema：fork 22。理由：上游本轮升到 21 与 fork 现有 21 正面撞车；fork 必须保留自己的 v20→v21 修复，并为「已升级到 fork v21（无 agy 列）」的库补一步 21→22。20→21 合并为「fork 修复 + enabled_agy」，21→22 幂等补 `enabled_agy`；上游测试断言改到 22，新增 v21→v22 用例。不承诺降级兼容（上游自身也不支持）。
- 上游依赖：npm 无新增/移除；Rust 侧 `Cargo.toml` 给 tokio 加 `process` feature，`Cargo.lock` 仅给 tokio 依赖补 `signal-hook-registry`（包已存在）。
- 预设白名单：上游新增的赞助商预设不进入 fork 白名单；ZetaAPI 删除后 fork 白名单无对应条目需清理。agy 条目见 Q1。
- `tr.json`：保持与上游 tag 逐字节一致，不补 fork 键。
- 托盘左键：本轮上游未改 `lib.rs` 的 `TrayIconEvent::Click`（`lib.rs` 的 85 行新增全是 AGY 模块/账户管理器/文件描述符），fork 四条分支与源码护栏原样保留；`tray.rs` 只加 `AppType::Agy => "Antigravity"` 标签。
- 应用内更新器：fork 的 `install_update_and_restart`/`check_app_update_available` 空壳保持；上游在该函数内加的 `installer_arg("REBOOT=ReallySuppress")` 不采纳（fork 无更新器）；但 MSI 模板 `per-user-main.wxs` 与 release.yml 的 REBOOT 断言照常落地——它们保护的是手动安装与 fork Release 产物。
- 赞助商内容：README 与预设文件随上游落地（删除 ZetaAPI、新增三家），fork 白名单不过滤到它们，故用户可见预设集合不变。
- 上游 locale 精简：接受删除 17 个键与 `PiProviderForm` 三段提示，接受 4 个键的上游改写（`provider.openTerminalDialog.description`、`settings.authCenter.description`、`providerForm.partnerPromotion.everyapi`、`mode.noProvider`）。
- 隔离与交付：交付按 Q4；归档提交上打 annotated tag `v4.0.18-1`。
- **Q1（2026-10-22 用户决定：`agy: ["Google Official"]`）**：`forkOfficialAllowlist` 新增 `agy: ["Google Official"]`，与 gemini 同口径。agy 预设来自 `geminiProviderPresets`，官方卡是 OAuth 登录、必须保留；第三方/赞助商仍被过滤。agy 表单的预设条目 id 仍为 `gemini-<原始下标>`，白名单键用 `agy`。
- **Q2（2026-10-22 用户决定：保留上游模型行）**：agy 卡片使用上游 `extractAgyModel` 模型行（`config.model.name` → `env.GEMINI_MODEL`），不把 agy 加入 fork 的 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗（agy 无「当前供应商」、卡片主操作是开终端）。
- **Q3（2026-10-22 用户决定：纳入，Gemini 形状）**：agy 纳入跨应用导入；读/建/改三个分支按 Gemini 形状处理（`env.GOOGLE_GEMINI_BASE_URL`/`GEMINI_API_KEY`/`GEMINI_MODEL`），`ProviderForm` 的 gemini 分支改用 `usesGeminiStyleForm(appId)` 以同步 agy 的扁平 state；`useProviderImportSources` 与 `ProviderImportEntry` 不做排除。
- **Q4（2026-10-22 用户决定：推 main + 推 tag）**：验收通过、用户接受结果并归档后，`git push --force-with-lease origin main`，在归档提交上创建 annotated tag `v4.0.18-1` 并 `git push origin v4.0.18-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。只授权这两项动作。

# 未决问题

- 无。Q1（agy 预设白名单）、Q2（agy 模型显示）、Q3（agy 跨应用导入）与 Q4（交付授权）已于 2026-10-22 由用户确认，结论记入「决策」。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`
- `cargo test`（环境性例外按 A13 口径）
- 落地保真核对脚本（四 ref 归一化行多重集，45 个重叠文件）+ locale 重复键查重 + 冲突标记零命中
- fork 左键契约源码护栏（A21）、AGY 落地（A17）、Q1–Q3 交集（A18–A20）、上游修复落地（A22）的逐条比对
- 数据库迁移用例：v20→22 全链、v21→22 补列、全新库含 agy、幂等重跑
