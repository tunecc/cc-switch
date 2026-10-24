# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.19`（tag 对象 `319fbfd`，剥离提交 `d8983bb`），fork 侧 178 个提交（`v4.0.18..main`，起点 `cb90a2440` = 当前 main `b893ec999` 的线性祖先）按原顺序整体重放，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.18-1` 升为 `4.0.19-1`。

上游 `v4.0.18..v4.0.19`：**47 提交、215 文件、+16010/−2351（35 新增 / 1 删除 / 179 修改）**，与 fork 的重叠面为 **47 个文件**（fork 侧自 `v4.0.18` 起改动 461 个文件）。本轮的主轴是 **Kimi Code 成为第 12 个应用**：上游把它接入 Apps 页、供应商表单（独立 `KimiProviderForm`）、授权中心（OAuth 账号/额度）、用量与会话、MCP/Skills 开关、代理与会话解析，并把数据库 schema 从 21 升到 22（`mcp_servers`/`skills` 加 `enabled_kimi`）；同时重构用量页（`UsageDataSourcesSheet` 删除，新增 `UsageSettingsSheet`/`ChecklistMenu`/`RequestLogColumnsMenu`）、给卡片更多菜单加「设为默认 + 默认模型子菜单」、新增 BuyToken/V-API 赞助商预设、给 Pi 表单补 providerKey 重复校验。

**上游是否重写了 fork 已有功能（用户要求先对比再询问）——本轮结论：没有完全重复实现，只有一处同域但不同语义、两份实现可并存，以及一个新增应用与三项 fork 功能的交集。**

1. **卡片「设为默认 / 默认模型子菜单」不是 fork 的模型快捷切换**：上游 `ProviderCardActions` 新增 `CardMenuItem.submenu`，用于 OpenCode/OpenClaw 的「选择默认模型」（应用级 default provider/model）；fork 的模型徽章 + `ModelQuickSwitchDialog` 覆盖 claude/codex/gemini/grokbuild，改的是供应商自身 settingsConfig 里的当前模型。应用集合与写入目标都不同，互不替代；本轮两者都保留。
2. **Pi 表单重复 providerKey 校验是补充而非替代**：上游新增 `pi.form.providerKeyDuplicate` 前置校验并把 providerKey 字段改为常显；fork 的 Pi 改动是预设白名单过滤与本地预设入口，两者叠加即可，无需选边。
3. **Kimi 是新增应用，与 fork 的三项功能相交，必须由用户拍板**（Q1–Q3）：
   - 预设白名单：`forkOfficialAllowlist` 是 `Record<AppId, string[]>`，`AppId` 新增 `kimi` 后必须有条目，否则 typecheck 失败（Q1）。
   - 跨应用导入：Kimi 配置形状是 `provider.{base_url,api_key}` + `models` 映射，fork 的 `readConfigFields` 不认识 kimi，会落到 `default` 分支读空字段；且上游的 Kimi 表单独立于通用表单，本身不渲染 fork 的导入入口（Q2）。
   - 模型徽章 / 快捷切换：fork 只覆盖 claude/codex/gemini/grokbuild；Kimi 的默认模型由上游「更多 → 设为默认」与表单模型表管理，没有卡片级模型切换语义（Q3）。

交付沿用上轮方式（Q4）：验收通过并归档后推 main + 打 `v4.0.19-1` tag。

- 基线 tag `v4.0.19` = `319fbfd`（剥离提交 `d8983bb`）；`upstream/main` 当前与剥离提交一致（`v4.0.19..upstream/main` 为 0 提交），本轮只锁 tag。
- 版本号 `4.0.18-1` → `4.0.19-1`；上游四处版本文件本轮都只改版本行（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`），无依赖增删。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v419/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v419/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v419`（= 同步前 main `b893ec999`，该提交同时是 origin/main），仅用于回退参照、重放前后 diff 对照与落地保真四 ref 比对。
- 随上游 rebase 落地的上游新增文件 35 个（`git diff --name-status v4.0.18 v4.0.19` 的 A 项），fork 在这些文件上无自有语义，全部随上游落地。按类别：
  - Kimi 后端：`src-tauri/src/kimi_config.rs`、`kimi_session.rs`、`commands/kimi_oauth.rs`、`mcp/kimi.rs`、`proxy/session/header_tests.rs`、`services/kimi_oauth/{account,lock,mod}.rs`、`services/session_usage_kimi.rs`、`session_manager/providers/kimi.rs`、`tests/kimi_commands.rs`。
  - Kimi 前端：`src/components/KimiAccountQuotaFooter.tsx`、`KimiAccountLogin.tsx`、`forms/KimiProviderForm.tsx`、`forms/hooks/useKimiOAuth.ts`、`src/lib/api/kimiOAuth.ts`、`src/config/kimiProviderPresets.ts`（+ 同目录 `kimiProviderPresets.test.ts`）。
  - 用量页重构：`src/components/usage/{ChecklistMenu,RequestLogColumnsMenu,UsageSettingsSheet}.tsx`、`src/components/usage/settingsStyles.ts`。
  - 测试：`tests/components/{KimiAccountLogin,KimiAccountQuotaFooter,KimiAddProviderDialog,KimiProviderForm,RequestLogColumnsMenu}.test.tsx`、`tests/lib/usageRange.test.ts`。
  - 文档 / 赞助商素材：`docs/kimi-code-integration-zh.md`、`docs/release-notes/v4.0.19-{en,ja,zh}.md`、`src/whats-new/4.0.19.json`、`assets/partners/logos/{buytoken-banner.png,vapi-banner.jpg}`。
- 交付步骤（验收通过并归档后，按 Q4 授权）新增本地 annotated tag `v4.0.19-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.18-1` → `4.0.19-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动）。上游本轮无新增/移除依赖。
- 47 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.18 v4.0.19 | sort) <(git diff --name-only v4.0.18 main | sort)`；上游 215 文件 + fork 侧 461 文件）。逐文件行数口径（`git diff --numstat v4.0.18 <ref> -- <file>`，**上游 / fork**）：
  - 仓库根：`README.md` 24/13（fork 96/532，fork 为整文件自有的 148 行「与上游的差别」版，冲突时保留 fork 整文件）、`package.json` 1/1、`src-tauri/Cargo.toml` 1/1、`src-tauri/Cargo.lock` 1/1、`src-tauri/tauri.conf.json` 1/1。
  - 后端：`src-tauri/src/commands/misc.rs` 156/8（6/5）、`commands/mod.rs` 2/0（2/2）、`database/dao/mcp.rs` 6/3（1/1）、`database/mod.rs` 1/1（1/4）、`database/schema.rs` 55/1（245/2）、`deeplink/provider.rs` 5/0（1/0）、`lib.rs` 11/0（32/42）、`provider.rs` 4/0（45/1）、`proxy/forwarder.rs` 7/1（2/1）、`proxy/providers/mod.rs` 2/2（1/0）、`services/mod.rs` 2/0（2/1）、`services/provider/live.rs` 16/2（44/0）、`services/provider/mod.rs` 174/14（4/0）、`settings.rs` 6/2（47/0）、`tray.rs` 1/0（75/6）。
  - 前端：`src/App.tsx` 86/35（88/2）、`components/providers/AddProviderDialog.tsx` 10/5（1/0）、`EditProviderDialog.tsx` 8/3（2/0）、`ProviderCard.tsx` 24/5（104/1）、`ProviderList.tsx` 4/1（229/10）、`forms/ClaudeFormFields.tsx` 2/2（276/221）、`forms/PiProviderForm.tsx` 57/64（65/43）、`forms/ProviderForm.tsx` 6/2（183/43）、`forms/ProviderPresetSelector.tsx` 18/4（18/10）、`config/appConfig.tsx` 13/1（9/1）、`lib/query/mutations.ts` 22/4（63/0）、`types.ts` 2/0（14/0）。
  - 预设：`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts` 30/1、38/1、103/43、207/109、132/54、91/51（fork 侧均为 2/0 的 `hidden` 字段）。
  - 本地化：`src/i18n/locales/{en,ja,zh-TW,zh}.json` 各 74/16（fork 侧 en 328/25、ja 315/24、zh-TW 315/24、zh 327/24）。
  - 测试：`tests/components/{AppsPage,DeepLinkImportDialog,ProviderCardActions,ProviderList,ProviderPresetSelector}.test.tsx` 4/1、67/2、41/1、206/0、2/2。
  - 完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 168 个文件随 rebase 直接落地，含 Kimi 全套新增文件、用量页重构、`src/whats-new/4.0.19.json`、赞助商素材与 3 份 release notes。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（新增/更新 `database/schema.rs`、`commands/misc.rs`、`ProviderCard.tsx`、`ProviderList.tsx`、`KimiProviderForm.tsx` 等行的 v4.0.19 口径），新增 §4.6「v4.0.19 轮的叠加要点」（Kimi 交集、schema 23、白名单新条目、用量页重构）。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 23 与 21→22（fork 修复 + 上游 Kimi 列）/ 22→23（Kimi 列幂等补齐）两步。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q2 结果登记 Kimi 的纳入/排除与形状。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q3 结果登记 Kimi 的徽章/快捷切换口径。
- 把本地 main rebase 到 tag `v4.0.19`（`319fbfd` → 剥离提交 `d8983bb`）：当前 merge-base `cb90a2440`（v4.0.18）。
- `.gitignore`：当前工作树里 Comet Runtime 追加的托管忽略块（archive staging / runtime lock 等）需在 rebase 前作为独立 chore 提交，使工作树干净；上游本轮不触碰 `.gitignore`，不会与重放冲突。

### 删除

- 上游本轮删除 1 个文件：`src/components/usage/UsageDataSourcesSheet.tsx`（被 `UsageSettingsSheet` 取代），随上游删除；fork 侧对该文件零自有语义。
- 上游本轮从 4 个 locale 各删除 8 个键（`usage.syncStatus.auto`、`usage.syncStatus.off`、`usage.syncStatus.tipAuto`、`usage.refreshMenu.seconds`、`usage.display.logColumnsSummary`、`usage.tabs.settings`、`usage.sortedByRequests`、`usage.detail.sourceSession`），`tr.json` 因本身缺少其中之一而只反映 7 个删除；fork 代码不得残留对这些键的引用。
- 代码片段级删除：fork 的 `install_update_and_restart` 空壳与 `native_menu_on_left_click` 零命中状态维持不变；上游本轮未改动 updater 相关函数。
- fork 已删除的 updater 链路、`stream_check` 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式 `current`，直接沿用 main；`pre-sync-v419` 是安全参照分支）。
- 不新增 fork 专属代码文件；不改 `forkPresetFilter.ts` 判定实现；不改 `forkOfficialAllowlist` 既有条目（除 Q1 决定的新增 kimi 条目）。
- 不创建 PR；不推送除 Q4 授权范围之外的任何远端引用。
- 不支持「fork v23 数据库被上游 v4.0.19（v22）打开」的降级兼容（上游自身即对更高版本报错，fork 沿用同一策略并在文档登记）。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。
- 本轮 `upstream/main` 与 tag 剥离提交一致，不存在「tag 之后的上游提交」，因此无额外排除项；仍不同步其他上游分支。
- 不复活 fork 已删除的应用内更新器与 `stream_check` 链路；不新增赞助商/聚合站预设到 fork 白名单。
- 不在 Q3 选 A 时给 Kimi 增加 fork 专属的模型快捷切换通路或文案。

## 上游本轮同步范围（v4.0.18..v4.0.19，47 提交 215 文件 +16010/−2351）

1. **Kimi Code 接入（第 12 个应用）**：新增 `kimi_config.rs`、`kimi_session.rs`、`commands/kimi_oauth.rs`、`mcp/kimi.rs`、`services/kimi_oauth/**`、`services/session_usage_kimi.rs`、`session_manager/providers/kimi.rs`、`proxy/session/header_tests.rs`；`provider.rs`/`services/provider/{mod,live}.rs`/`proxy`/`settings.rs`/`tray.rs`/MCP DAO 增 Kimi 分支；`settings.rs` 增 `VisibleApps.kimi`；`lib.rs` 注册 Kimi 模块与 OAuth 命令、`commands::add_provider_to_live_config`。
   - 前端：`AppId` 增 `kimi`（`APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`MCP_APP_IDS`/`ADDITIVE_APP_IDS`/`APP_ICON_MAP`）；`ProviderForm.tsx` 首行分流 `if (appId === "kimi") return <KimiProviderForm .../>`；新增 `KimiProviderForm`（预设目录 + 官方账号预设 `Kimi Official`、providerKey 常显与重复提示、模型表 + `fetchModelsForConfig` + 元数据补全、提交要求非空有效 `models`）、`KimiAccountLogin`、`KimiAccountQuotaFooter`、`useKimiOAuth`、`kimiOAuth` API；`ProviderList` 的 `kimiCurrentId`、`isInConfig`（`meta.liveConfigManaged`）、Kimi 空状态隐藏导入；`ProviderCard` 的官方卡额度、官方卡禁复制/禁删、`onTest` 对 Kimi 关闭。
   - 预设：`kimiProviderPresets.ts` 从 `piProviderPresets` 派生，只接受有原生协议等价物的条目（排除 bedrock、`source.compat`、无模型）；Kimi 家族 4 条（`Kimi`/`Kimi Global`/`Kimi For Coding`/`Kimi For Coding Global`，`category: cn_official`）+ 第三方/聚合站/赞助商 + 本机推理 3 条（`Ollama`/`LM Studio`/`vLLM`）。
2. **用量页重构**：删除 `UsageDataSourcesSheet`，新增 `UsageSettingsSheet`（价格汇总/管理价格入口）、`ChecklistMenu`、`RequestLogColumnsMenu`、`usageRange` 工具；新增 `usage.pageSize`/`trend.*`/`syncStatus.syncing|tip`/`settings.*` 等 52 个键，删除 8 个旧键。
3. **卡片更多菜单与默认模型**：`presentation.ts` 去掉 `neutral` CardTone（共存式应用默认项改用 `direct`），`CardMenuItem` 增 `submenu`；OpenCode/OpenClaw 的「设为默认」改为带默认模型子菜单；`ProviderCardActions` 渲染子菜单。
4. **Pi 表单**：providerKey 字段改为常显，非编辑模式下对已存在的 providerKey 做前置重复校验（`pi.form.providerKeyDuplicate`）。
5. **赞助商与预设**：新增 BuyToken、V-API 两条赞助商/聚合站预设与 banner，更新 providerPreset 登录提示键（`providerPreset.loginWith.kimi`）。
6. **数据库 schema 21→22**：`mcp_servers`/`skills` 加 `enabled_kimi`；迁移臂只用 `add_column_if_missing`，全新库 `create_tables` 同步加列。
7. **发布相关**：四处版本号 `4.0.19`、CHANGELOG、3 份 release notes、`src/whats-new/4.0.19.json`。

# 非目标

- 不同步 upstream 其他分支；不做部分 cherry-pick。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.18-1` 及更早的 fork tag。
- 不重构 fork 既有魔改以迎合上游新代码；只做叠加、契约适配与 Q1–Q3 选定的取舍。
- 不改上游 Kimi 的内部实现（OAuth、额度、授权中心、会话/用量、配置读写以上游为准）；fork 只决定它与自有功能的交集方式。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不给 `tr.json` 补 fork 键；不保留上游已删除的 8 个 usage locale 键。
- 不恢复应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程或 `stream_check` 链路。
- 不改 fork 的托盘左键分派（本轮上游 `tray.rs` 只加 Kimi 标签）。
- 不改上游自带的测试与用例语义（除重放必须连接的改写与 fork 稳定性修正）。
- 不新增数据库迁移之外的结构变更；不改变 fork v20→v21 修复迁移与 v21→v22 AGY 补齐迁移的语义。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.19` 等于 `d8983bb`（tag `v4.0.19` 剥离出的提交），`git log v4.0.19..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交。
- A2: 重放前 `git rev-list --count v4.0.18..pre-sync-v419` == 178；重放后 `git rev-list --count v4.0.19..HEAD` 与之的差异只来自「被 git 判定为空而丢弃」或「本轮新增提交」，逐条记录；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，冲突停车逐条记录归属与解法。
- A3: 47 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（高危面为 `database/schema.rs`、`lib.rs`、`commands/misc.rs`、`services/provider/mod.rs`、`ProviderForm.tsx`、`ProviderCard.tsx`、`ProviderList.tsx`、`App.tsx`、4 个 locale、4 个版本与锁文件、`README.md`）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.19-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 23；迁移链：v18→v19（fork `website_url_2` + 上游 mcode 并存）、v19→v20（上游 pi）、v20→v21（fork 修复 mcode/pi + 上游 `enabled_agy`）、v21→v22（fork 幂等补 `enabled_agy` + 上游 `enabled_kimi` 合并为一步）、v22→v23（幂等补 `enabled_kimi`）全部在位；`create_tables` 的 `mcp_servers`/`skills` 含 `enabled_kimi`；上游迁移测试改到 23，新增 v22→v23 用例。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤（含 Q1 的 kimi 条目）、逐模型连通性测试（`lib.rs` 两个命令注册在位，且 Kimi 维持上游的测试入口关闭）、双官网链接、跨应用导入（含 Q2 的 Kimi 口径）、禁用应用内更新器、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.6、`lib.rs`/`database/schema.rs`/`commands/misc.rs`/`ProviderCard.tsx`/`ProviderList.tsx` 等行的新口径与 kimi 白名单登记），全局与 change 内完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类），三处记录的数字与归属互相一致。
- A8: `pnpm typecheck` 通过（零 `TS2300`，AppId/`VisibleApps`/`forkOfficialAllowlist`/`APP_ICON_MAP` 的 kimi 字段无重复声明）。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`KimiProviderForm`、`KimiAccountLogin`、`KimiAccountQuotaFooter`、`KimiAddProviderDialog`、`RequestLogColumnsMenu`、`usageRange`、`ProviderCardActions`、`ProviderList`、`DeepLinkImportDialog`、`AppsPage`、`kimiProviderPresets`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自 `cc-switch` 版本号行 `4.0.19-1`；`tauri-plugin-updater` 相关条目不得出现。
- A13: `cargo test` 通过（含 fork 的托盘左键源码护栏、上游 Kimi 迁移/持久化用例、`src-tauri/tests/kimi_commands.rs`）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。
- A14: 落地保真核对通过：对 47 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.18`、`v4.0.19`、`pre-sync-v419`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数（`README.md` 的整文件 fork 版本、`4.0.19-1` 版本号行属已知取舍），未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键，fork 键段按 key 逐个比对全部在位；上游本轮 52 个新键在 4 个 locale 全部在位且取值与 `v4.0.19` 逐字节一致；上游删除的 8 个键在 4 个 locale 均不再残留（fork 无引用）；fork 专属覆盖 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 保持 fork 文案；`tr.json` 与 `git show v4.0.19:src/i18n/locales/tr.json` 逐字节一致（上游 `tr` 自身比 `en` 少 16 个新增键、少 1 个删除键，不补）。
- A16: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。
- A17: 上游 Kimi 能力在 fork 落地后可用：12 个 `APP_IDS` 含 kimi、Apps 页可安装/打开 Kimi Code、Kimi 表单可用（官方账号登录 + 预设目录 + 模型表/拉取模型）、授权中心 Kimi 分组与额度、Kimi 会话/用量归属、MCP/Skills kimi 开关、`enabled_kimi` 持久化与迁移、上游新增测试全部通过；Kimi 官方卡不可复制/不可删、非官方卡无连通性测试入口（与上游一致）。
- A18: Q1 的 Kimi 预设白名单生效：`forkOfficialAllowlist.kimi` 严格等于 `["Kimi", "Kimi Global", "Kimi For Coding", "Kimi For Coding Global"]`；Kimi 表单的预设目录按名称过滤，官方账号卡 `Kimi Official`（id `kimi-official-account`）始终保留；目录预设 id 仍为 `String(原始数组下标)`，过滤不得改变编号；三条本机推理预设（`Ollama`/`LM Studio`/`vLLM`）以及赞助商/聚合站/`Meta Model API` 等未列入白名单的 Kimi 预设在 fork 构建的所有 Kimi 入口均不可见；其他 app 的白名单不变。
- A19: Q2 的跨应用导入口径生效：Kimi 仅作为导入来源——`readImportableProviderFields("kimi", …)` 读出 `provider.base_url`/`provider.api_key`，身份字段（名称/备注/官网）照常复制，`defaultModel` 为空且 `targetSupportsDefaultModel("kimi") === false`；`KimiProviderForm` 不渲染 `ProviderImportEntry`，Kimi 不作为导入目标；官方账号卡作为来源时连接字段为空、身份字段仍可复制；其余 11 个应用的导入行为不变。
- A20: Q3 的 Kimi 卡片模型口径生效：Kimi 不进入 fork 的 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗，卡片维持上游「更多 → 设为默认」与表单模型表；4 个既有 app 的徽章与快捷切换行为不变。
- A21: **fork 左键契约的源码级回归护栏通过**：`src-tauri/src/tray.rs` 的 `tray_left_click_never_opens_the_menu` 用例在重放后仍成立（`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`、`lib.rs` 的 builder 固定 `.show_menu_on_left_click(false)`），上游的 `native_menu_on_left_click` 辅助函数与其调用点在 fork 终态仍为零命中；`lib.rs` 的 `TrayIconEvent::Click` 分支保持 fork 四条分支语义；`tray.rs` 只新增 `AppType::Kimi => "Kimi Code"` 标签。
- A22: 上游用量页重构在 fork 落地后可用：`UsageDataSourcesSheet.tsx` 已删除且无引用，`UsageSettingsSheet`/`ChecklistMenu`/`RequestLogColumnsMenu`/`usageRange` 在位，用量页分页、趋势粒度、同步状态与新设置面板工作；8 个删除键无残留引用。
- A23: 上游本轮其余改动在 fork 落地后可用：Kimi 安装器（`KIMI_INSTALL_*`/npm 命令）、卡片更多菜单默认模型子菜单（OpenCode/OpenClaw）、Pi providerKey 常显与重复校验、BuyToken/V-API 赞助商预设与 locale、`providerPreset.loginWith.kimi`、`src/whats-new/4.0.19.json` 与 release notes。
- A24: 冲突标记零命中：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 为 0（exit 1）。

# 约束与不变量

- fork 全部 178 个提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v419`（= `b893ec999`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；`--ours` 是新基线（v4.0.19），`--theirs` 是重放的 fork 提交。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- 重放前先提交 `.gitignore` 的 Comet Runtime 托管忽略块（上游不触碰该文件），保证 rebase 起始工作树干净；不得丢弃该块。
- **数据库 schema 是本轮最高风险结构面**：上游 v4.0.19 的 21→22 只加 `enabled_kimi`；fork v4.0.18 已是 22 且 21→22 是 fork 的 AGY 幂等补齐。终态必须同时满足：旧 fork v22 库（有 AGY、无 Kimi）升到 23 并补齐 `enabled_kimi`；上游 v22 库（有 Kimi、无 AGY 前置）升到 23 不会漏；v21 库一步走完 fork AGY 补齐 + 上游 Kimi 列；v20 库走完 fork 修复 + AGY + Kimi；全新库 `create_tables` 含 `enabled_agy` 与 `enabled_kimi`。`migrate_v18_to_v19` 与 fork 的 `website_url_2` 必须保持并存。
- **Kimi 的 AppId 扩散面**：`AppType::Kimi` 会让 fork 修改过的穷举 `match app` 出现编译错误或漏分支——`settings.rs`、`provider.rs`、`services/provider/{live,mod}.rs`、`tray.rs`、`deeplink/provider.rs`、`proxy/forwarders`、`database/dao/mcp.rs`、`commands/mod.rs`、`services/mod.rs` 必须逐个确认 Kimi 分支与 fork 语义并存；前端 `Record<AppId, …>`（`forkOfficialAllowlist`、`APP_ICON_MAP`、`DEFAULT_VISIBLE_APPS`、`VisibleApps`）必须补齐 kimi，否则 typecheck 失败。
- `src/components/providers/forms/ProviderForm.tsx`：上游在函数首行分流 Kimi（`return <KimiProviderForm .../>`），fork 的 `entriesFor` 与导入入口在通用表单内；Kimi 的白名单过滤必须在 `KimiProviderForm` 内单独接线，不能依赖 `entriesFor`。Kimi 目录预设 id 是 `String(原始下标)`，过滤必须保持原编号。
- `src/components/providers/ProviderCard.tsx` / `ProviderList.tsx`：上游 Kimi 的官方额度 footer、`kimiCurrentId`、`isInConfig`（`meta.liveConfigManaged`）、官方卡禁复制/禁删、`onTest` 关闭必须与 fork 的徽章/快捷切换/右键菜单/连接检测/双官网链接并存；fork 的 `buildAdditiveSections` 叠加段不得覆盖上游 Kimi 专属分支。
- `src-tauri/src/commands/misc.rs`（上游 156/8）承载 Kimi 安装器与工具枚举，fork 只改 6/5 行，冲突时逐 hunk 取上游并保留 fork 改动，禁止整文件取一侧。
- `src-tauri/src/services/provider/mod.rs`（上游 174/14）与 `live.rs`（上游 16/2）承载 Kimi 配置读写；fork 的 `sanitize_claude_settings_for_live` 与测试必须保留，Kimi 分支不得被 fork 的 Claude 专用逻辑误伤。
- 4 个 locale 的三方合并必须逐文件查重（按对象作用域统计重复键）。上游本轮改动键多（各 +52/−8，上游 74/16），rebase 易把 fork 末键行与 `},` 收尾拼到同一物理行，`JSON.parse` 静默取后者、测试全绿。
- 上游删除的 8 个 usage 键必须确认 fork 代码零引用；删除后 `pnpm typecheck` 与 `pnpm test:unit` 必须通过。
- `src/config/*ProviderPresets.ts`：上游新增 BuyToken/V-API 赞助商预设；fork 只加 `hidden?: boolean`。合并后 `pnpm typecheck` 零 `TS2300`；`forkOfficialAllowlist` 既有条目不因赞助商增删变化（Q1 只加 kimi）。
- `README.md`：fork 是整文件自有的 148 行「与上游的差别」文档，冲突时整文件取 fork；上游的 README 增删行不采纳，作为已知取舍在落地保真核对中逐行归因（不是丢语义）。
- `.comet/config.yaml` 被历史重放改写时从 ORIG_HEAD 恢复并核对 native 启用状态。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态（fork 已按 `fork-test-stability` 口径修稳）。本轮上游又改了 `AppsPage.test.tsx`（4/1），合并时两处都保留。
- 上游自带 CI 竞态 `services::session_usage_codex::tests::test_parent_rollout_is_cached_once_across_fork_cutoffs` 的判定顺序（与上游逐字节相同 → 上游同用例是否同样红 → 本地重复跑）继续适用；本轮 `src-tauri/src/services/session_usage_codex.rs` 未被上游改动。
- 推送（按 Q4 授权）只用 `--force-with-lease`；远端被他人更新时拒绝推送并报告。
- 上游四处版本号行必须被 fork 的 `4.0.19-1` 取代，终态不得残留裸 `4.0.19`。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

# 决策

- 隔离方式：当前目录（`current`），沿用 main。理由：工作区除 Comet 产物外干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去轮次一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（沿用历轮决策）。
- 版本号：`4.0.18-1` → `4.0.19-1`。
- 同步目标：只锁已发布 tag `v4.0.19`（`319fbfd` → 剥离 `d8983bb`）；`upstream/main` 与剥离提交一致，无 tag 后提交需要排除。
- 数据库 schema：fork 23。理由：上游本轮升到 22 与 fork 现有 22 正面撞车；fork 必须保留自己的 v20→v21 与 v21→v22 修复，并为「已升级到 fork v22（有 AGY、无 Kimi 列）」的库补一步 22→23。21→22 合并为「fork 幂等补 AGY + 上游 Kimi 列」，22→23 幂等补 `enabled_kimi`；上游测试断言改到 23，新增 v22→v23 用例。不承诺降级兼容（上游自身也不支持）。
- 上游依赖：npm 与 Cargo 均无新增/移除；四个版本文件只改版本行。
- 预设白名单：上游新增的赞助商/聚合站预设不进入 fork 白名单；Kimi 条目见下方 Q1 决定。
- `tr.json`：保持与上游 tag 逐字节一致，不补 fork 键（上游 `tr` 自身缺少部分 Kimi/赞助商键）。
- 托盘左键：本轮上游 `tray.rs` 只加 `AppType::Kimi => "Kimi Code"`，`lib.rs` 的 11 行新增全是 Kimi 模块/命令注册；fork 四条分支与源码护栏原样保留。
- 应用内更新器：fork 的 `install_update_and_restart`/`check_app_update_available` 空壳保持；上游本轮未改动 updater 相关函数，不采纳任何重放带入的更新器实现。
- README：保留 fork 整文件自有版本；上游 README 的赞助商与功能说明增删不采纳，在保真核对中归因为「fork 整文件替换」。
- 卡片模型：上游的「更多 → 设为默认/默认模型子菜单」是共存式应用的应用级语义，与 fork 的供应商级模型快捷切换并存；不因本轮上游改动移除 fork 徽章/快捷切换（Kimi 口径见 Q3）。
- 隔离与交付：交付按 Q4；归档提交上打 annotated tag `v4.0.19-1`。
- **Q1（2026-10-24 用户决定：Kimi 官方 4 条，本机 3 条在所有地方隐藏）**：`forkOfficialAllowlist.kimi = ["Kimi", "Kimi Global", "Kimi For Coding", "Kimi For Coding Global"]`。三条本机推理预设（`Ollama`/`LM Studio`/`vLLM`）在 Kimi 的所有预设入口一律不可见（表单目录、添加入口及任何派生列表）；其他应用的既有本机推理白名单不变（该决定只针对 Kimi）。
- **Q2（2026-10-24 用户决定：仅作导入来源）**：新增 `readConfigFields("kimi", ...)` 读取 `provider.base_url`/`provider.api_key`，身份字段（名称/备注/官网）照常复制，`defaultModel` 为空；Kimi 不作为导入目标，`KimiProviderForm` 不渲染 `ProviderImportEntry`，上游空状态隐藏导入的行为保持。
- **Q3（2026-10-24 用户决定：不扩展）**：Kimi 不进入 `MODEL_CAPABLE_APPS`，不加模型徽章/快捷切换弹窗；卡片维持上游「更多 → 设为默认」与表单模型表管理。
- **Q4（2026-10-24 用户决定：推 main + 推 tag）**：验收通过、用户接受结果并归档后，`git push --force-with-lease origin main`，在归档提交上创建 annotated tag `v4.0.19-1` 并 `git push origin v4.0.19-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。只授权这两项动作。

# 未决问题

- 无。Q1（Kimi 预设白名单）、Q2（Kimi 跨应用导入）、Q3（Kimi 模型徽章/快捷切换）与 Q4（交付授权）已于 2026-10-24 由用户确认，结论记入「决策」。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`
- `cargo test`（环境性例外按 A13 口径）
- 落地保真核对脚本（四 ref 归一化行多重集，47 个重叠文件）+ locale 重复键查重 + 冲突标记零命中
- fork 左键契约源码护栏（A21）、Kimi 落地（A17）、Q1–Q3 交集（A18–A20）、用量页重构（A22）、上游其余改动（A23）的逐条比对
- 数据库迁移用例：v20→23 全链、v21→22 合并臂、v22→23 补列、全新库含 AGY/Kimi、幂等重跑
