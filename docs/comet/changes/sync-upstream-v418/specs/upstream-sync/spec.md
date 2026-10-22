# 完整目标规格：upstream-sync（v4.0.18 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 tag `v4.0.18`（annotated tag 对象 `81096e4`，剥离提交 `cb90a2440`）；fork 版本号 `4.0.18-1`。推送与 tag 属交付步骤，按 Q4 授权在验收通过并归档之后执行。

上游 `v4.0.17..v4.0.18` 共 39 个提交、213 个文件、+11006/−1257（31 新增 / 1 删除 / 181 修改），与 fork 的重叠面为 45 个文件。本轮主轴是 **AGY（Antigravity CLI）成为第 11 个应用**，它与 fork 的「预设白名单」「模型徽章/快捷切换」「跨应用导入」三处正面相交，且上游把数据库 schema 从 20 升到 21（`mcp_servers`/`skills` 加 `enabled_agy`），与 fork 已是 21 的 schema 撞车——fork 必须升到 22 并保留自己的 v20→v21 修复。本规格描述 Q1–Q4 确认后的完整同步后状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.18` 剥离出的提交 `cb90a2440`。
- `git merge-base main v4.0.18` == `cb90a2440`；`git log v4.0.18..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 173 个 fork 提交（`git rev-list --count v4.0.17..HEAD`，起点 `a83bb9013` = origin/main）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径（与历轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v418`（= `a83bb9013`）固定记录。
- 上一轮基线 tag `v4.0.17` = `b5a1bdc7`（剥离 `19798e2f`）与 fork 发布 tag `v4.0.17-1` 保持不变。
- `upstream/main` 当前为 `e4873bc8a`，位于 `v4.0.18` 之后，本轮不纳入。

### 同步范围（v4.0.17..v4.0.18：39 提交、213 文件、+11006/−1257）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **AGY 接入（AGY 主体）**：`c7dceb803`（整合 Antigravity CLI 管理）、`3854c6134`（API Key 供应商从终端启动而非 shell wrapper）、`b667b00a5`（卡片显示模型并归属会话用量）、`dfe100813`（prompts/密钥配置共享、恢复会话、用量定价）、`1b4cd547c`（官方卡显示登录额度）、`941267953`（会话只显示输入的 prompt、说明额度检查）、`2e22ca209`（agy 图标与 Apps 页 CLI 管理）、`fb91155a5`（接受首次运行的空 `mcp_config.json`）、`9a10e4f7a`（用 Open Terminal 取代启用按钮）、`c776fd0eb`（精简表单提示、自定义卡要求 Key）、`fdbac61c3`（授权中心后端管理官方账号）、`862718795`（授权中心 Antigravity 分组）、`0af8b7728`（官方卡绑定账号）、`5a08e230c`（直接查询每个账号额度）、`8f9525b03`（说明账号为何不适用）、`c0490b052`（授权中心显示额度）、`2c63012b9`（不启动 agy 直接查登录账号额度）、`997e78b56`（官方卡显示绑定账号额度）、`276eff8dc`（从卡片额度列打开四个窗口）、`e91689f2d`（用量页去掉 agy 专属说明）、`6fabe63ab`（会话行显示 Session log）。
2. **赞助商与预设**：`132ab9ced`（hao.ai 八个 app）、`0a41250dc`（DIT.ai 九个 app）、`8d4ec90fc`（移除 ZetaAPI 与 banner）、`e59252ee5`（EveryAPI 升为正式赞助）。
3. **UI 文案精简**：`ab5d4a12d`（删除 provider/settings 冗余提示；4 个 locale 各 −17 键，`PiProviderForm` 删除三段提示）。
4. **用量/会话/定价**：`711a4127f`（用量应用筛选只列 Apps 页可见应用）、`ea8bc2c3a`（Claude 会话按最后一次 `/cd` 归组）、`e1821b5e4`（Codex 未用量窗口隐藏重置倒计时）、`816346022`（deepseek-v4.1-flash 定价）、`c1fd26bde`（头部连接徽章紧凑且按模式着色）。
5. **Windows/Unix 稳定性**：`1ef08d5e7`（应用内更新不留系统重启）、`cdfdff5ee`（Windows 桌面快捷方式可选）、`6226f5c46`（Windows 终端不等待控制台）、`47ffdff8e`（Unix 运行时 CLI 使用登录 shell PATH）、`04d0ebf56`（Unix 启动提高文件描述符上限）、`92ec18d77`（聚合站配额锁的文档修正）。
6. **发布相关**：`4aec1aeca`（四处版本号 4.0.18、CHANGELOG）、`cb90a2440`（release notes 三份 + `src/whats-new/4.0.18.json`）。

### AGY 应用终态

AGY 是第 11 个应用，行为与 fork 既有 10 个应用不同：

- **无「当前供应商」语义**：`isCurrentFor(agy)` 恒为 `true`，卡片都显示额度；后端 `get_current_provider`/`set_current_provider` 对 Agy 走 `current_provider_agy`（上游照常实现，fork 不干预）。
- **无「启用」按钮**：卡片主操作是 Open Terminal（`buildLaunchSections`），API Key 供应商从终端启动；官方卡可绑定授权中心账号（`agy_oauth`），只有 macOS 支持切号，其他平台忽略绑定。
- **配置形状沿用 Gemini**：前端 `usesGeminiStyleForm(appId)` = `gemini || agy`；`ProviderForm` 使用 `GeminiFormFields`/`GeminiConfigEditor`，`useGeminiConfigState({ preferConfigModel: appId === "agy" })`；agy 只填 Key 不填地址是合法用法。
- **预设来源**：agy 复用 `geminiProviderPresets`，预设条目 id 前缀仍为 `gemini-<原始下标>`（与上游一致）；fork 构建下白名单为 `agy: ["Google Official"]`，只显示官方预设，第三方/赞助商被过滤（Q1）。
- **卡片模型**：agy 卡片使用上游 `extractAgyModel` 模型行（`config.model.name` → `env.GEMINI_MODEL`），显示在 fork 模型徽章之后、URL 之前；agy 不进入 `MODEL_CAPABLE_APPS`，没有模型徽章与快捷切换弹窗（Q2）。
- **跨应用导入**：agy 作为来源与目标都可用；读/建/改按 Gemini 形状（`env.GOOGLE_GEMINI_BASE_URL`/`GEMINI_API_KEY`/`GEMINI_MODEL`），`ProviderForm` 的 gemini 扁平 state 同步分支改用 `usesGeminiStyleForm(appId)`，不会写空配置（Q3）。
- **授权中心**：Antigravity 分组、账号添加/删除/切换/重新授权、额度查询、状态展示；切号仅 macOS。
- **会话/用量**：agy 会话解析（`session_manager/providers/agy.rs`）、用量归属（`session_usage_agy.rs`、`subscription_agy.rs`）、卡片与用量页展示。
- **MCP/Skills**：`McpApps.agy`、`SkillApps` 的 agy 开关，`mcp/agy.rs` 投影，数据库 `enabled_agy` 两列。
- **Apps 页**：agy 的安装/更新/打开终端（`commands/misc.rs` 的 `get_tool_versions`/安装命令/版本检查），图标 `antigravity.svg`。

fork 侧对 AGY 的三处交集按 Q1–Q3 处理（见「fork 取舍清单」）。

### 数据库 schema 终态（22）

- `SCHEMA_VERSION` == 22。
- 迁移链：
  - v18→v19：fork 的 `website_url_2` 与上游 `enabled_mcode` 并存（保持现状）。
  - v19→v20：上游 `mcp_servers.enabled_pi`（保持现状）。
  - v20→v21：fork 的 mcode/pi 幂等修复 + 上游 `enabled_agy`（两张表），set 21。
  - v21→v22：幂等补 `enabled_agy`（两张表），set 22。用于「已升级到 fork v4.0.17-1（user_version=21、无 agy 列）」的库。
- `create_tables` 的 `mcp_servers` 与 `skills` 均含 `enabled_agy BOOLEAN NOT NULL DEFAULT 0`。
- 上游迁移测试 `agy_migration_preserves_existing_flags_and_defaults_to_disabled` 的期望版本改为 22；`agy_clean_database_persists_independent_mcp_and_skill_flags` 保持；新增 v21→v22 幂等用例（模拟 fork v21 无 agy 列 → 22 补列；模拟上游 v21 有 agy 列 → 22 不变）。
- 降级：fork v22 库被上游 v4.0.18（v21）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 安装终态

- 托盘左键：保持 fork 四条分支（面板样式左键 Up 且面板未显示 → `tray::toggle_main_window`；面板已显示 → `tray_panel::toggle` 收起；右键 Up → `tray_panel::toggle`；原生菜单样式左键 Up → `toggle_main_window`、右键 Up → `mark_feedback_seen` 后交系统菜单）。`show_menu_on_left_click(false)` 两处固定，`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留。本轮上游 `lib.rs` 新增 85 行全部是 AGY 模块、账户管理器、Unix 文件描述符上限，不触碰 `TrayIconEvent::Click`；`tray.rs` 仅加 `AppType::Agy => "Antigravity"`。
- 应用内更新器：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；`commands/misc.rs` 的 `check_for_updates` 与 `portable_zip_url` 继续指 tunecc。上游在该函数内新增的 `installer_arg("REBOOT=ReallySuppress")` 不采纳（函数已空壳化）。
- Windows 安装：`src-tauri/wix/per-user-main.wxs` 随上游落地 `REBOOT=ReallySuppress`、`CloseApplication` 与可选桌面快捷方式；`.github/workflows/release.yml` 在 fork 裁剪版的 `$msi` 块内合并上游 14 行 MSI Property 断言（REBOOT 必须为 `ReallySuppress`，否则 Release 失败）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订：`lib.rs` 行追加「v4.0.18 只加 AGY 模块/账户/文件描述符，不碰托盘点击」；`tray.rs` 行追加「v4.0.18 只加 agy 标签」；新增 `database/schema.rs` 行（v4.0.18 的 20→21 agy 与 fork 21 撞车，终态 22）、`commands/misc.rs` 行（上游 AGY 命令 + fork tunecc URL）、`ProviderCard.tsx`/`ProviderList.tsx` 行（agy 模型行/终端卡与 fork 徽章/右键菜单）、`appConfig.tsx` 行（`usesGeminiStyleForm` 与 fork 侧边面板默认值）。
  - locale 行登记：fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`；上游本轮删除的 17 键与新增 47 键按上游落地。
  - 新增 §4.5「v4.0.18 轮的叠加要点」：AGY 三类交集（Q1–Q3 结论）、schema 22 的两步迁移、`usesGeminiStyleForm` 与预设 id 前缀、`AppType::Agy` 的穷举分支清单、MSI REBOOT 断言。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 22 与 20→21 / 21→22 两步、降级不兼容。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q3 结果登记 agy 的纳入/排除、支持列表与形状。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q2 结果登记 agy 不进入快捷切换、使用上游卡片模型行。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态。

### 重放映射（口径与记录要求，实测数字在 Build 阶段回填）

- 同步前 `git rev-list --count v4.0.17..pre-sync-v418` 预期 == 173。
- 重放后 `git rev-list --count v4.0.18..HEAD` 与 173 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录。
- tag `v4.0.18` 是 annotated tag：tag 对象 `81096e4`，剥离提交 `cb90a2440`；`git merge-base main v4.0.18` == `cb90a2440`；`git log --format='%an <%ae>' v4.0.18..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.17..pre-sync-v418` 与重放后 `v4.0.18..HEAD`）差异必须为 0 行。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期的主要停车面：`database/schema.rs`（SCHEMA_VERSION 与迁移臂）、`database/mod.rs`、`ProviderForm.tsx`（`usesGeminiStyleForm` 与 `entriesFor`）、`commands/settings.rs`（空壳 vs upstream hunk）、`ProviderPresetSelector.test.tsx`（预设行数）、`AppsPage.test.tsx`（getToolVersions 调用数）。
- 冲突停车清单（交互式）在 Build 阶段逐条记录；rerere 复用的解法必须逐个复核。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。

#### 本轮实测（2026-10-22，重放完成时）

- 同步前 `git rev-list --count v4.0.17..pre-sync-v418` = **173**；重放后 `git rev-list --count v4.0.18..HEAD` = **173**（无提交被 git 判空丢弃）。
- `git merge-base main v4.0.18` == `cb90a2440`；`git log --format='%an <%ae>' v4.0.18..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 主题序列 `git log --format='%s' --reverse` 逐行 diff **0 行**。
- patch-id 差异 **19 处**，其余 154 个提交与重放前逐字相同：
  - 冲突停车 14 处：#2（版本四文件）、#13（`ProviderForm.tsx` 预设过滤接线）、#20（`EndpointField.tsx`）、#41（`release.yml`）、#42（`release.yml` + `commands/settings.rs`）、#43（`README.md`）、#46（`ProviderForm.tsx` prettier）、#69（4 locale）、#74（`Cargo.lock` + `services/mod.rs`）、#84（`ProviderCard.tsx`）、#117（`database/{dao/mcp,mod,schema}.rs`）、#120（`schema.rs` fmt）、#144（v4.0.12 同步）、#154（v4.0.15 同步）。
  - 仅上下文位移 5 处：#34（侧边面板可见性）、#47（右键置顶/置底）、#72（连通性列表集成）、#79（连通性 UI 修复）、#110（v4.0.1 CI 修复）；文件集相同、增删行集合 `sort` 后 diff 为空，差异仅来自上游 AGY 分支插入导致的 hunk 行号与上下文行。
- rerere 复用的解法已逐个复核；本轮新增/改写的冲突解法：`ProviderCard.tsx` 四分支合并（codexOfficialIdentity → agyModel → websiteLinks → displayUrl → null）并删除一处合并产生的多余 `</div>`；`ProviderForm.tsx` 的 `entriesFor` 与 `usesGeminiStyleForm` 合并、导入扁平 state 分支改用 `usesGeminiStyleForm`；`schema.rs` 的 v20→21 双臂合并 + 新增 v21→22；`settings.rs` 保留 fork 空壳、丢弃上游 `installer_arg` hunk；`README.md` 整文件取 fork 版；locale 取上游 `dit`、弃上游已删的 `etok`。


### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.17..v4.0.18` 改动过的每个文件（213 个，覆盖 45 个重叠文件的全部）取 `git diff v4.0.17 v4.0.18 -- f` 的增/删行、`git diff v4.0.17 pre-sync-v418 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。
- 计算必须在全部最终态提交（版本、文案、文档、schema、合并）落完之后，对最终 `HEAD` 执行；`HEAD` 之后的归档提交只改 Markdown，不在 213 个文件内，故数字不变。
- 预期的刻意取舍（逐行归因，具体行数在 Build 后按实测填写）：
  - 版本与锁文件：上游 `"version": "4.0.18"` 行被 fork `4.0.18-1` 取代（4 个文件各 1 行）；fork 的 `4.0.17-1` 行被本轮终态升级（属预期流转）。
  - `commands/settings.rs`：上游 9 行新增（`installer_arg` 及其注释）不落地（fork 无更新器），需逐行列出。
  - locale：上游 4 个改写键（`provider.openTerminalDialog.description`、`settings.authCenter.description`、`providerForm.partnerPromotion.everyapi`、`mode.noProvider`）按上游落地，不构成缺失；fork 的两个覆盖键本轮上游未改，不构成缺失。
  - Q1–Q3 的交集改动（如 agy 白名单、导入分支、模型口径）若涉及上游新增行，逐行说明理由并带重数。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.18 HEAD -- <file>` 只看 fork 侧新增/删除。

#### 本轮实测（2026-10-22，终态 `HEAD` = `4047eff0b`）

- 实测合计：**上游新增行缺失 27 行（8 个文件），fork 新增行缺失 15 行（12 个文件）**；213 个上游文件全部参与计算，其余 205 个上游文件双侧缺失均为 0。计算在本轮版本/文案/文档/schema 提交落完之后、终态 `HEAD` = `4047eff0b` 上进行；之后只改本规格与 Markdown 登记，不在 213 个文件内，故数字不变。
- 上游新增行缺失逐项归因：
  - `README.md` 12 行（3×`<tr>`、3×`</tr>`、hao.ai/DIT.ai/EveryAPI 各 2 行）：fork README 整文件重写不含上游赞助商表格，按 fork 版保留（刻意取舍，见「README.md」条目）。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行版本号 `4.0.18`：fork 用 `4.0.18-1` 取代（预期流转）。
  - `src-tauri/src/commands/settings.rs` 9 行（`app.updater_builder()`、`REBOOT=ReallySuppress` 注释 5 行、`#[cfg(target_os = "windows")]`、`installer_arg`、`let updater = builder`）：fork 更新器空壳化，整体不采纳（上游功能由 `release.yml` 的 MSI 打包断言兜底）。
  - `src-tauri/src/database/mod.rs` 1 行 `SCHEMA_VERSION: i32 = 21`：fork 终态 22（撞号处理）。
  - `src-tauri/src/database/schema.rs` 1 行上游断言 `assert_eq!(Database::get_user_version(&conn)?, 21)`：改用 `SCHEMA_VERSION` 常量（终态 22）。
- fork 新增行缺失逐项归因：
  - `package.json` / `Cargo.toml` / `Cargo.lock` / `tauri.conf.json` 各 1 行 `4.0.17-1`：本轮终态升级为 `4.0.18-1`（预期流转）。
  - `database/mod.rs` 1 行 `SCHEMA_VERSION = 21`：升为 22。
  - `database/schema.rs` 3 行（v21 迁移注释 2 行 + 日志 1 行）：终态日志/注释扩写为「补齐 mcode/pi 并添加 AGY 列」，语义保留。
  - `ProviderForm.tsx` 2 行（`entriesFor("gemini", …)`、`if (appId === "gemini")`）：Q3 改为 `entriesFor(appId, …)`/`usesGeminiStyleForm(appId)`，语义保留并扩展到 agy。
  - `EndpointField.tsx` 1 行 `aria-required="true"`：上游改为可配置的 `aria-required={required}`（默认 true，agy 端点可选），语义保留。
  - `src/i18n/locales/{en,ja,zh-TW,zh}.json` 各 1 行 `etok`：上游 v4.0.18 已删除的赞助商键，fork 终态不保留。
- 说明：fork 在 pre-sync 主动删除的 `streamCheck.*` 5 个 locale 键不属于本轮上游新增行（v4.0.17 即存在），不计入缺失；`tr.json` 与 `v4.0.18` 逐字节一致（key 集合 0 缺 0 余）。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 45 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.17 v4.0.18 | sort) <(git diff --name-only v4.0.17 HEAD | sort)`；上游 213 文件 + fork 328 文件）。逐文件叠加要求：

#### 版本与工作流（6 个）

- **`package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json`**：取上游内容，版本号改为 fork `4.0.18-1`；`Cargo.toml` 保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`，并采纳上游 tokio `process` feature；`package.json` 保留 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`；`tauri.conf.json` 保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true`。`Cargo.lock` 只允许 `cc-switch` 版本行与 tokio 的 `signal-hook-registry` 行变化。
- **`.github/workflows/release.yml`**：fork 文件整体保留（上游 tag 构建跳过、CI 裁剪），只在 Windows MSI 块合并上游 14 行 REBOOT 断言。
- **`README.md`**：fork README 是「仅记录与上游差别」的整文件重写（148 行，不含上游赞助商表格）：冲突按整文件保留 fork 版；上游本轮新增/删除的赞助商表行不落地，属刻意取舍（见「落地保真核对」的 README 归因）。fork 的构建说明与 §14 托盘说明原样保留。

#### 后端（17 个）

- **`src-tauri/src/lib.rs`**（上游 +85/−0 / fork +32/−42）：上游只新增 AGY 模块声明、`raise_open_file_limit`、AgyAccountManager 初始化、旧 launcher 迁移、`get_agy_models` 与 agy 账户命令注册；fork 的无 Updater、托盘左键、connectivity 命令注册三段语义原样保留。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0、`.show_menu_on_left_click(false)` 在位、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册在位。
- **`src-tauri/src/commands/misc.rs`**（上游 +747/−166 / fork +6/−5）：上游新增 AGY 工具安装/版本/启动与测试；fork 只把 `check_for_updates`、`portable_zip_url` 及测试里的 URL 指向 tunecc。冲突时逐 hunk 取上游并保留 fork 的 4 处 URL，禁止整文件取一侧；解完 grep `farion1231/cc-switch/releases` 应为 0（README/文档除外）、`tunecc/cc-switch/releases` 在位。
- **`src-tauri/src/commands/mod.rs`**（+2/−0 / +2/−2）：上游注册 agy 命令模块；fork 的 connectivity/updater 模块声明保留。
- **`src-tauri/src/commands/settings.rs`**（+9/−2 / +7/−98）：fork 的空壳函数保留，上游 `installer_arg` hunk 不采纳；不得把 updater 插件引用带回。
- **`src-tauri/src/database/mod.rs`**（+1/−1 / +1/−4）：`SCHEMA_VERSION` 取 fork 终态 22；fork 的注释与版本校验逻辑保留。
- **`src-tauri/src/database/schema.rs`**（+68/−0 / +184/−0）：按「数据库 schema 终态」合并；`create_tables` 加 `enabled_agy`；20 臂合并 fork 修复 + agy；新增 21 臂；deepseek-v4.1-flash 定价行取上游；上游 agy 迁移测试期望改 22，新增 v21→v22 用例；fork 现有迁移测试（使用 `SCHEMA_VERSION` 常量）保持通过。
- **`src-tauri/src/database/tests.rs`**（+1/−0 / +76/−0）：上游加 `deepseek-v4.1-flash` 到定价覆盖断言；fork 的迁移/持久化测试全部保留，若断言版本则改用常量。
- **`src-tauri/src/database/dao/mcp.rs`**（+6/−3 / +1/−1）：上游加 agy MCP 开关；fork 的改动保留，Agy 分支补齐。
- **`src-tauri/src/deeplink/provider.rs`**（+37/−4 / +1/−0）：上游加 agy deeplink；fork 的 `website_url_2: None` 保留在构造器字段列表里。
- **`src-tauri/src/provider.rs`**（+1/−1 / +45/−1）：上游只改一处（agy 相关）；fork 的 `website_url_2` 字段、UniversalProvider 构造与测试保留；Agy 分支（无 enable、Gemini env）按上游。
- **`src-tauri/src/proxy/providers/mod.rs`**（+2/−2 / +1/−0）：上游加 Agy 分支；fork 改动保留。
- **`src-tauri/src/services/mod.rs`**（+4/−0 / +2/−1）：上游注册 agy 服务模块；fork 的模块声明保留。
- **`src-tauri/src/services/provider/live.rs`**（+25/−1 / +44/−0）：上游加 agy 实时配置读取；fork 的连通性/双官网相关改动保留，Agy 分支补齐（终端-only、无 enable）。
- **`src-tauri/src/services/provider/mod.rs`**（+28/−7 / +4/−0）：上游加 Agy 分支（terminal-only、无 enable、read live via agy_config、Gemini env keys）；fork 改动保留。
- **`src-tauri/src/settings.rs`**（+10/−0 / +47/−0）：上游加 `VisibleApps.agy`、`current_provider_agy` 与 get/set；fork 的 `VisibleSidebarPanels` 整段保留，两段并存。
- **`src-tauri/src/tray.rs`**（+1/−0 / +75/−6）：只加 `AppType::Agy => "Antigravity"`；fork 的 `hide_main_window`/`toggle_main_window`、`apply_tray_style` 的 `set_show_menu_on_left_click(false)` 与源码护栏不动，不得把 `native_menu_on_left_click` 带回。

#### 前端（15 个）

- **`src/App.tsx`**（+21/−4 / +88/−2）：上游加 agy 路由/导入；fork 的 DevPanel、侧边面板、连接徽章改动保留。
- **`src/lib/api/types.ts` / `src/types.ts` / `src/config/appConfig.tsx`**（2/0、23/0、9/1）：`AppId` 加 agy；`VisibleApps`/`McpApps` 加 agy；`APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`MCP_APP_IDS`/`APP_ICON_MAP` 加 agy 与 `usesGeminiStyleForm`；fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS` 保留。
- **`src/components/providers/AddProviderDialog.tsx`**（+2/−2 / +1/−0）：`appId === "gemini" || appId === "agy"` 取上游；fork 改动保留。
- **`src/components/providers/ProviderCard.tsx`**（+51/−10 / +104/−1）：上游加 `extractAgyModel` 模型行、agy 官方判定、`AgyAccountQuotaFooter`、agy 官方订阅列表；fork 的模型徽章、快捷切换、连接徽章、双官网链接保留。按 Q2，agy 不进入 `isModelCapableApp`；上游 agy 模型行的插入位置在 fork 的模型徽章之后、URL 之前。
- **`src/components/providers/ProviderList.tsx`**（+15/−3 / +229/−10）：上游加 `buildLaunchSections`、`isCurrentFor(agy)=true`、更多菜单去重；fork 的右键置顶/置底、快捷排序、连接检测、apply 逻辑保留。
- **`src/components/providers/forms/ProviderForm.tsx`**（+45/−13 / +183/−43）：上游把 `appId === "gemini"` 全部改为 `usesGeminiStyleForm(appId)`，加 `preferConfigModel`、`AgyAccountSelect`、agy 官方绑定；fork 的 `entriesFor`（编号先于 hidden、先于白名单）、`extraActions`、`websiteUrl2`、连通性接线保留。agy 分支的白名单键用 `agy`、id 前缀 `gemini-`；导入的 `syncAppState` 的 gemini 分支改为 `usesGeminiStyleForm`（按 Q3）。
- **`src/components/providers/forms/PiProviderForm.tsx`**（+0/−16 / +65/−43）：接受上游删除三段提示；fork 的 Pi 表单改动全部保留。
- **`src/components/providers/forms/shared/EndpointField.tsx`**（+7/−2 / +16/−9）：上游改动与 fork 改动并存。
- **`src/config/geminiProviderPresets.ts`**（+21/−0 / +2/−0）：DIT.ai 等赞助商预设取上游；fork 的 `hidden?: boolean` 保留。
- **`src/config/{grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（各自上游改动 / fork +2/−0）：全部取上游赞助商增删；fork 的 `hidden?: boolean` 保留；不得把 ZetaAPI 带回。
- **`src/i18n/locales/{en,zh,ja,zh-TW}.json`**（各 +63/−27 / fork +330..317/−26..25）：47 个新键、17 个删除键、4 个改写键全部取上游；fork 专属键段保留；`provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 继续覆盖为 fork 文案。合并后逐文件按对象作用域查重，并核对 fork 末键行与 `},` 收尾未被拼进同一物理行。

#### 测试（4 个）

- **`tests/components/AppsPage.test.tsx`**（+10/−1 / +12/−6）：上游把 `getToolVersions` 期望从 9 改为 10（agy）并加一个 `waitFor`；fork 的过期缓存竞态修正保留，两处并存。
- **`tests/components/DeepLinkImportDialog.test.tsx`**（+55/−0 / +4/−3）：上游加 agy deeplink 用例；fork 改动保留。
- **`tests/components/ProviderPresetSelector.test.tsx`**（+2/−2 / +33/−0）：上游把 Claude 预设行数从 106 改为 107；fork 的行数断言与过滤用例按上游基线更新，保持 fork 侧断言口径（fork 构建下白名单过滤后的行数）。
- **`tests/hooks/useAddProviderMutation.test.tsx`**（+20/−0 / +215/−3）：上游加 agy 用例；fork 的导入/预设用例保留。

### fork 取舍清单

1. **agy 预设白名单（Q1，2026-10-22 已确认）**：`forkOfficialAllowlist` 新增 `agy: ["Google Official"]`；agy 预设来自 `geminiProviderPresets`，官方卡必须保留，第三方/赞助商继续被过滤；白名单键用 `agy`、id 前缀用 `gemini-`。
2. **agy 模型显示与快捷切换（Q2，2026-10-22 已确认）**：保留上游 `extractAgyModel` 卡片模型行，不把 agy 加入 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换（agy 无当前供应商、卡片主操作是终端）。
3. **agy 跨应用导入（Q3，2026-10-22 已确认）**：纳入，读/建/改按 Gemini 形状；`ProviderForm` 的 gemini 分支改 `usesGeminiStyleForm`，`useProviderImportSources` 与 `ProviderImportEntry` 不对 agy 排除。
4. **portable zip 直下**（上游 v4.0.13 `b391565f`，本轮仍在）：不接入前端更新入口；`open_portable_update_download` 后端命令保留注册，URL 基址与 `check_for_updates` 指 tunecc。
5. **应用内更新器**：继续禁用（空壳、无插件/依赖/AIP、`createUpdaterArtifacts: false`）；上游的 `installer_arg` hunk 不采纳。
6. **托盘左键**：保持 fork 四条分支与源码护栏；上游本轮未改该分支。
7. **`codegen-units`**：fork 保留 `= 1`。
8. **`tr.json`**：与上游 tag `v4.0.18` 逐字节一致，不补 fork 键。
9. **基线确认**：tag `v4.0.18` = `81096e4`（剥离 `cb90a2440`）；交付按 Q4 授权（push main + tag `v4.0.18-1`）。

### 预设 id 编号契约（延续）

预设选择项 `id` 数字 = 原始预设数组下标；fork 的白名单过滤必须发生在编号之后。上游本轮把 gemini 分支改为 `usesGeminiStyleForm`（agy 共用 `gemini-` 前缀），四处入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）仍为「按原数组下标编号 → 过滤上游 `hidden` → 按白名单名称集合过滤」；`ProviderForm.tsx` 的 `entriesFor` 必须同时服务 gemini 与 agy，且 agy 用 `agy` 键查白名单、`gemini-` 前缀编号。上游本轮未新增预设条目（`src/config/*ProviderPresets.ts` 只有赞助商增删，属既有名字集合变化），`forkOfficialAllowlist` 既有条目无须追加；新增的 `hidden` 声明查重仍需复核。

### 本地化状态

- 语言集合 `zh`/`zh-TW`/`en`/`ja`/`tr` 不变。
- 上游本轮 4 个 locale 各 +47 键、−17 键、~4 键（`tr.json` +0/−17/~1），全部取上游；fork 专属键段保留（`en` 330/26、`zh` 329/25、`ja`/`zh-TW` 317/25 的 fork 侧行数只增不减）。
- fork 专属覆盖 2 键：`provider.connectivityCheck`（Connectivity test）与 `settings.general.trayStyleHelp`（左键切换主窗口/右键弹所选样式），上游本轮未改这两键，继续覆盖。
- 土耳其语下 fork 专属文案回退英文（`fallbackLng: "en"`），既有决定不变。

### `.comet/config.yaml` 保护

- 重放涉及该文件或 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。

### 已知流程坑位（沿用）

- Runtime `verification_checks` 的 `executable` 与 `argv` 分开填、`cwdRef` 必须是真实存在的相对目录；argv 不含程序名、不含 shell 语法。
- 长重放 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 与落盘，再 continue。
- `--ours` 是新基线，`--theirs` 是重放的 fork 提交。
- 重放中途不跑 `cargo test`；最终态冲突标记零命中。
- JSX/Rust 合并禁止按行去重；手工拼接后必须 `pnpm format:check` + `pnpm build:renderer`。
- locale 重复键显式查重（按对象作用域）；预设 interface 的 `hidden?: boolean` 重复声明必须删 fork 侧（上游本轮未新增预设字段，仍需查重确认）。
- `src-tauri/src/commands/misc.rs` 是上游大改动 + fork 小改动的组合面，最容易「整文件取一边」丢 URL 或丢 AGY；解完必须双向 grep。
- 上游 `8cfe5644`（v4.0.17）的 `session_usage_codex` CI 竞态在本轮仍可能出现；判定顺序：与上游逐字节相同 → 上游同用例是否同样红 → 本地重复跑。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态。
- 上游自带 `stream_check` 前端死代码（`src/lib/api/connectivity-check.ts`、`src/hooks/useStreamCheck.ts`）属 fork 既有状态，不得为了让 grep 干净而修改；下一轮继续确认「仍无调用方」。
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推同一 tag 对象；查 fork Actions 必须显式 `--repo tunecc/cc-switch`。
- SSH 被 fake-IP 接管时用 gh HTTPS credential helper 推送。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

### 版本号

- 四处文件 `4.0.18-1`；语义：上游版本号 + `-N`，N 为同一上游版本的 fork 构建代数。

### 交付（上传，按 Q4 授权，2026-10-22 已确认）

- 交付是验收通过、用户接受结果并生成归档提交之后的步骤：`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.18-1` 并 `git push origin v4.0.18-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。不创建 PR，不含其他远端引用。
- 执行后回报：`main`/`origin/main` 一致性、tag 指向的提交、Release run 的 status/conclusion（用 `gh api --repo tunecc/cc-switch` 复核，不信包装工具输出）。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 `__CCS_DEV_PANEL__` 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `VisibleSidebarPanels` 持久化）——与上游 `VisibleApps.agy`/`current_provider_agy` 同处 `types.ts`/`settings.rs`，两段并存。
- 供应商卡片模型徽章与快捷切换弹窗（claude/codex/gemini/grokbuild，agy 按 Q2 排除）、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 预设文件 `hidden` 字段 + 四处表单接线的「编号先于过滤」；Q1 新增 agy 条目）。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`lib.rs` 两个命令注册在位，`stream_check` 不回来）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路，含 `deeplink/provider.rs`、`proxy/model_mapper.rs`、`services/provider/mod.rs` 测试字面量里的 `website_url_2: None`）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支 + `tray_panel::panel_visible` + 源码级护栏）。
- 跨应用导入供应商配置（5 个 Form + `ProviderPresetSelector.extraActions`；Q3 决定 agy 的纳入方式）。
- 禁用应用内更新器（About 指向 tunecc Releases、启动自检取消、`install_update_and_restart` 空壳、无 updater 插件/依赖/AIP）。
- 对上游自带测试的稳定性修正（`apps-page-cache-race`、deeplink 开关初值 `waitFor` 等，按 `fork-test-stability` 能力规格重新套用）。
- 上游 tag 的发版构建跳过与 fork CI 裁剪（`.github/workflows/{ci,release}.yml` 整文件保留，release.yml 只并入 MSI REBOOT 断言）。
- README fork 差异说明与构建说明（§14 托盘说明保持上轮 Q3 终态）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

Build 阶段逐项取证并记录：`__CCS_FORK_BUILD__`、`__CCS_DEV_PANEL__`、`DevPanel`、`visibleSidebarPanels`、`batchConnectivityTest`、`extractModelBadgeForProvider`、`ModelQuickSwitchDialog`、`websiteUrl2`、`website_url_2`、`toggle_main_window`、`hide_main_window`、`panel_visible`、`show_menu_on_left_click(false)`、`connectivity_test_provider_models`、`connectivity_probe_provider`、`filterForkPresets(`、`ProviderImportEntry`；并确认 `native_menu_on_left_click` 仅存注释/护栏断言、`tauri_plugin_updater`/`updater_builder` 在 `src-tauri` 为 0、`tauri-plugin-updater` 在 `Cargo.lock` 为 0、`createUpdaterArtifacts` 为 `false`。
