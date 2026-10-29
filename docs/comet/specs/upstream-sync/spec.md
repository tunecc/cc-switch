# 完整目标规格：upstream-sync（v4.0.21 轮，当前基线）

> 本文件是 upstream-sync 能力的累积规格，随每轮同步整体重写；当前内容对应 fork 已同步到上游发布头 tag `v4.0.21` 的状态，取代此前的 v4.0.20 轮版本。历轮的同步范围、冲突停车清单与落地保真数字保留在各 change 的归档产物 `docs/comet/archive/<date>-sync-upstream-*/` 中。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 annotated tag `v4.0.21`（tag 对象 `2f04decf8`，剥离提交 `c4db63c60`）；fork 版本号 `4.0.20-1` → `4.0.21-1`。`upstream/main` 比 tag 多 18 个提交（最新 `144c41b96`），按「只锁已发布 tag」约定不纳入。推送与 tag 属交付步骤，按 Q1 授权在验收通过并归档之后执行。

上游 `v4.0.20..v4.0.21` 共 54 个提交、161 个文件、+12488/−1383（35 新增 / 0 删除 / 126 修改），与 fork 的重叠面为 31 个文件（fork 侧自 `v4.0.20` 起改动 470 个文件、+58802/−2766）。本轮主轴是 **Claude 官方订阅多账号切换**：授权中心可添加多个 Claude 账号，Claude 官方卡通过「登录方式」下拉绑定账号，切卡即切号（走 Claude Code 官方 `CLAUDE_CONFIG_DIR` / `claude auth login` 登录态），绑号卡与授权中心显示每个账号的套餐与剩余额度，卡片「打开终端」固定使用该卡绑定的账号并给出终端隔离提示。上游同时把「打开终端」从 ⋯ 菜单移到卡片图标按钮、Codex 模型列表支持拖拽排序、轻量模式重启后保持、Hermes「设为默认」移入 ⋯ 菜单，并带来 Codex/代理/MCP/Kimi 用量/Oh My Pi YAML/Gemini `.env` 修复、土耳其语补全、预设刷新（ClinePass、TeamoRouter、Kimi K3.1 Pro/HighSpeed、DeepSeek Flash、MiniMax Flash）、`schema-version` CI 与 v4.0.21 发布物料。本规格描述 Q1 确认后的完整同步后状态。

**上游是否重写了 fork 已有功能——本轮结论：没有重复实现，不构成「保留上游 or 保留 fork」的二选一。** 六处同域交集：

1. **Claude 官方多账号切换是全新能力**：fork 的授权中心只有上游既有的 Codex / xAI / Kimi / Copilot 托管账号，fork 侧没有任何「多 Claude 账号」或「切卡即切号」实现；`commands/claude_account.rs`、`services/claude_account/`、`services/provider/claude_official.rs`、`ClaudeOfficialSection.tsx`、`ClaudeAccountQuotaFooter.tsx`、`lib/claudePlan.ts` 在 fork 侧均为零自有语义，随上游整体落地。
2. **「打开终端」与 fork 的卡片/菜单改造同域不同项**：上游把终端入口从 ⋯ 菜单移到卡片图标按钮（编辑左侧）；fork 在同一个 ⋯ 菜单里移除的是「模型」项，并新增右键置顶/置底（右键菜单，不在 ⋯ 内）。两者互不覆盖，按上游位置放终端图标、fork 菜单改造原样保留。
3. **连通检测入口判定同域但无可见冲突**：上游把「官方 / OMO / OMO Slim 卡不显示检测连通」抽成 `supportsConnectivityCheck`；fork 的逐模型连通性入口由 `shouldShowTestEntry` 控制且仅对 claude / codex 开放，OMO（opencode）在 fork 本来就没有入口。采纳上游判定作卡片内层守卫，fork 外层守卫保留，fork 可见行为不变。
4. **卡片副标题 / 额度区叠加**：上游为绑号 Claude 官方卡新增账号行、套餐标签与额度 footer；fork 的模型徽章（标题行）、双官网链接（副标题行）与右键菜单位于不同位置。合并规则见「卡片与终端终态」。
5. **预设白名单**：上游新增 ClinePass、TeamoRouter 等第三方预设 → fork 构建按既定口径继续隐藏；Kimi 官方预设**名称不变**（只加 K3.1 Pro / HighSpeed 模型行），仍命中白名单；本轮**没有**新增 `category: "local"` 预设，`forkOfficialAllowlist` 无需增改。
6. **其他同文件项均为机械叠加**：Codex 模型列表拖拽排序（fork 未改 `CodexFormFields.tsx`）、Hermes 设为默认移入 ⋯ 菜单、轻量模式持久化（fork 托盘左键在 `tray.rs` 不同分支）、Claude Desktop Copilot URL 检测（fork 的 `rightSlot` 布局照上一轮口径承载）、`update_provider_sort_indexes` 新 DAO 函数（fork 的一键置顶/置底走同一 `updateSortOrder` 命令，自动获益）。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.21` 剥离出的提交 `c4db63c60`。
- `git merge-base main v4.0.21` == `c4db63c60`；`git log v4.0.21..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 180 个 fork 提交（`git rev-list --count v4.0.20..HEAD`，起点 `2fe1bbe47`）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径（与历轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v421`（= `2fe1bbe47`）固定记录。
- 上一轮基线 tag `v4.0.20` = `79738d9`（剥离 `85ad4969`）与 fork 发布 tag `v4.0.20-1` 保持不变。
- `upstream/main` 当前为 `144c41b96`（tag 之后 18 个提交），本轮显式排除，不同步其他上游分支。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v421/` 产物。若 Comet Runtime 又追加托管忽略块，先作为独立 chore 提交再开始重放。

### 同步范围（v4.0.20..v4.0.21：54 提交、161 文件、+12488/−1383）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **Claude 官方多账号与授权中心（15 提交）**：`4dc05a9aa`（多账号切换）、`58fee0db2`（补齐切换缺口）、`1409bad95`（切卡即切号）、`e550adcfb`（绑号卡切号）、`1ddb14e19`（恢复/停放一致）、`3837f460d`（副标题显示账号）、`0d6386ed8`（卡上账号额度）、`b3eb2ad19`（授权中心额度）、`e29968f52`（登录失效不显示旧额度）、`ea1645f95`（额度条对齐）、`93a3e8ec8`（标题常显添加账号）、`ee83fd896`（移除「删除全部账号」菜单）、`5cc6c47fc`（切卡后重读账户）、`88c878ac9`（官方卡显示套餐）、`503957424`（授权中心头部与 main 对齐）。
2. **卡片与终端（3 提交）**：`623246868`（打开终端移到卡片图标）、`45155e9dc`（终端隔离提示）、`0c07d5095`（用量列对齐）。
3. **Codex 与用量（6 提交）**：`05034a4e4`（模型列表拖拽排序）、`71524045d`（聚合成员顺序跟随拖拽）、`0820ff73f`（托管登录刷新失败不误报过期）、`e8e1cfbff`（远程压缩用量不漏记）、`42ef63471`（侧栏切换时趋势图不跳动）、`644f56642`（Kimi 用量按请求时间）。
4. **代理与 MCP（5 提交）**：`80640b528`（Chat Completions `data` 包裹）、`96f01af07`（Azure 资源 400 重试）、`238d8a712`（`<think>` 转换回归测试）、`c2110ebb0`（MCP SSE 不支持提示）、`cfc64971f`（Codex MCP 去掉 `timeout`/`autoApprove`）。
5. **Apps / 表单 / 环境（6 提交）**：`ff31d8409`（Grok Build npm 12 postinstall）、`618af9d97`（OpenCode npm 12 postinstall）、`5f0fc2537`（Hermes 双安装计数）、`74a98fddc`（Gemini `.env` 的 `export` 行）、`ec5c5f8ad`（Claude Desktop Copilot URL 检测）、`665107753`（OpenCode OMO 不显示检测连通）。
6. **预设与文案（7 提交）**：`95e294855`（ClinePass）、`a56dddb9e`（TeamoRouter）、`d564adc35`（Kimi K3.1 Pro / HighSpeed）、`56fa007f4`（DeepSeek Flash）、`03337b7e8`（MiniMax Flash max 思考）、`6837f3617`（Claude Desktop OpenCode Go 官方地址）、`d2008fdb4`（土耳其语补全）。
7. **其他修复与 CI（6 提交）**：`e332cfdb7`（Oh My Pi `models.yml` 含 `&`/`*`/`!`）、`da0c84e4e`（轻量模式重启保持）、`882e7a6a4`（无提示词项目停用当前提示词）、`f20a2b29d`（Windows 登录 opener 常量）、`9f5adaac3`（schema-version PR 自动关闭 CI）、`9c30cde45`（issue/PR 模板 Human Note）。
8. **发布相关（2 提交）**：`cb50e6007`（四处版本号 4.0.21）、`c4db63c60`（3 份 release notes + `src/whats-new/4.0.21.json`）。

新增文件 35 个（`git diff --name-status v4.0.20 v4.0.21` 的 A 项），fork 侧无自有语义、随上游整体落地：

- Claude 多账号后端：`src-tauri/src/commands/claude_account.rs`、`src-tauri/src/services/claude_account/`（`mod`、`cc_lock`、`identity`、`layout`、`login`、`shared`、`usage`、`tests` 与 `snapshot/` 下 10 个文件）、`src-tauri/src/services/provider/claude_official.rs`。
- 代理回归测试：`src-tauri/src/proxy/tests_issue_7271.rs`。
- 前端：`src/components/ClaudeAccountQuotaFooter.tsx`、`src/components/providers/forms/ClaudeOfficialSection.tsx`、`src/lib/claudePlan.ts`。
- 测试：`tests/components/{ClaudeOfficialSection,CodexFormFields.catalogReorder,ProviderCard.claudeAccount}.test.tsx`、`tests/config/{claudeDesktopProviderPresets,teamorouterClaudePresets}.test.ts`、`tests/hooks/useClaudeAccountQuota.test.tsx`、`tests/lib/claudePlan.test.ts`。
- CI 与发布物料：`.github/workflows/schema-version.yml`、`docs/release-notes/v4.0.21-{en,ja,zh}.md`、`src/whats-new/4.0.21.json`。

上游本轮无删除文件。

### Claude 官方多账号终态

- **账号集合**：授权中心维护多个 Claude 账号（添加、重命名、移除、恢复/停放），账号元数据与登录态分离；「删除全部账号」菜单项按上游移除。账号数据由 `services/claude_account/` 管理，`cc_lock` 负责并发互斥，`snapshot/` 负责布局快照，`identity` 负责账号身份，`usage` 负责额度抓取，`login` 负责 `claude auth login` 流程。
- **绑号与切号**：Claude 官方卡的「登录方式」下拉（`ClaudeAccountSelect`）绑定某个账号；切到该卡即切换 `CLAUDE_CONFIG_DIR` 指向该账号的配置目录（切卡即切号），切换后重新读取账户信息。恢复/停放状态与账号绑定保持一致。
- **卡片展示**：绑号卡副标题显示账号行（`ClaudeBoundAccountLine`），不再显示官网链接；卡片额度区显示该账号套餐与剩余额度（`ClaudeAccountQuotaFooter` 在卡片与授权中心两处复用）；登录失效时不显示旧的缓存额度；官方卡按 `claudePlan.ts` 显示套餐标签（未绑号官方卡在官网链接后追加 `· 套餐`）。
- **终端**：绑号卡「打开终端」启动的 Claude Code 会话固定使用该卡绑定的账号目录，卡片显示终端隔离提示（`terminalIsIsolated`）；未绑定账号时保持上游默认行为。
- **缓存失效**：切卡/切号后 `managed-auth-status`、`claude_official` 相关查询失效（前端 `App.tsx`、`lib/query/mutations.ts`），Codex OAuth 额度错误也按上游触发重取。
- **fork 边界**：Claude 多账号不进入 fork 的模型徽章/快捷切换/跨应用导入/连接性测试逻辑；fork 在这些功能上的既有实现与上游新能力并存，互不改写。

### 卡片、终端与列表终态

- **终端入口**：卡片图标区（编辑按钮左侧）为「打开终端」按钮（`providerCard.action.openTerminal`），⋯ 菜单不再包含终端项；fork 在 ⋯ 菜单中移除「模型」项与新增右键置顶/置底的改造保持不变，右键菜单不受影响。
- **卡片副标题合并规则**：
  - 绑号 Claude 官方卡：按上游显示账号行（不显示官网链接）。
  - 未绑号卡：保留 fork 的双官网链接；有套餐时在链接后追加 `· 套餐`（上游 `claudeDefaultPlanLabel`）。
  - fork 的模型徽章（标题行）与快捷切换入口、右键置顶/置底照旧。
- **用量列**：按上游 136 宽口径对齐（带重置倒计时时 194 宽），fork 的 `max-w-[208px]` 容器与右对齐布局继续承载。
- **连通检测判定**：`supportsConnectivityCheck` 作为卡片内层守卫（官方 / OMO / OMO Slim 不显示检测连通），fork 的 `shouldShowTestEntry(appId, providerCategory?, providerType?)` 外层守卫保留（仅 claude / codex，排除 `official` 与 `NON_PROBE_PROVIDER_TYPES`），fork 可见行为不变。
- **Codex 模型列表**：模型表支持拖拽排序（`CodexFormFields`），聚合成员顺序跟随拖拽顺序；fork 未改该文件，整体取上游。
- **Hermes**：「设为默认」从卡片主体移入 ⋯ 菜单（`ProviderCardActions`），该文件 fork 侧未改，整体取上游；`tests/components/ProviderCardActions.test.tsx` 为重叠文件，按合并后语义保留 fork 既有断言。

### Codex、用量、代理、MCP、Apps 与其他上游终态

- **Codex / 用量**：托管登录刷新失败不再误报过期；远程压缩用量不漏记（`proxy/forwarder.rs` 压缩请求新增 `item_ids: false` 字段）；侧栏切换时趋势图不跳动；Kimi 用量按请求时间归属；`proxy/providers/codex.rs` 新增 `extract_codex_base_url_from_toml`（按 `model_provider` 选择表提取 base URL）。
- **代理与 MCP**：Chat Completions 响应体 `data` 包裹处理、Azure 资源 400 重试、`<think>` 转换回归测试（`proxy/tests_issue_7271.rs`）、MCP SSE 不支持提示、Codex MCP 去掉 `timeout`/`autoApprove` 字段。
- **Apps / 表单 / 环境**：Grok Build 与 OpenCode 的 npm 12 postinstall 修复、Hermes 双安装计数、Gemini `.env` 的 `export` 行处理、Claude Desktop Copilot URL 检测（`usesAutomaticCopilotFormat`：`github_copilot` 类型或 baseUrl 含 `githubcopilot.com`，排除 `codex_oauth`/`xai_oauth`；Copilot 下清空 `savedApiFormat` 的 `gemini_native`）、OpenCode OMO 不显示检测连通。
- **轻量模式**：`lightweight_mode` 持久化到设置文件并在重启后保持；`merge_settings_for_save` 保留既有值（`incoming.lightweight_mode = existing.lightweight_mode;`），与 fork 的侧栏面板设置同在 `AppSettings` 中互不覆盖。
- **其他**：Oh My Pi `models.yml` 含 `&`/`*`/`!` 时的安全处理、无提示词项目停用当前提示词、Windows 登录 opener 常量、schema-version PR 自动关闭 CI、issue/PR 模板 Human Note。
- **预设**：ClinePass、TeamoRouter 新增（fork 构建隐藏）；Kimi K3.1 Pro / HighSpeed 模型行；DeepSeek Flash；MiniMax Flash max 思考；Claude Desktop OpenCode Go 官方地址；顶层预设名不变。
- **本地化**：土耳其语补全（`tr.json` 整文件取上游）。

### 数据库 schema 终态（24）

- `SCHEMA_VERSION` == 24（fork 保持，上游仍为 23）。
- 迁移链与 `create_tables` 列集与 v4.0.20 轮完全一致，本轮不新增迁移臂：
  - v18→v19：fork 的 `website_url_2` 与上游 `enabled_mcode` 并存。
  - v19→v20：上游 `mcp_servers.enabled_pi`。
  - v20→v21：fork 的 mcode/pi 幂等修复 + 上游 `enabled_agy`（两张表），set 21。
  - v21→v22：fork 的 `enabled_agy` 幂等补齐（两张表）+ 上游 `enabled_kimi`（两张表），set 22。
  - v22→v23：fork 的 `enabled_kimi` 幂等补齐（两张表）合并上游 `enabled_omp`（仅 `mcp_servers`），set 23。
  - v23→v24：幂等补 `enabled_kimi`（两张表）与 `enabled_omp`（仅 `mcp_servers`），set 24。
- `create_tables` 的 `mcp_servers` 含 `enabled_agy`/`enabled_kimi`/`enabled_omp`；`skills` 含 `enabled_agy`/`enabled_kimi`，不含 `enabled_omp`。
- 上游本轮不新增表、不新增列（Claude 多账号状态不落数据库）。
- `git diff v4.0.20..HEAD -- src-tauri/src/database/schema.rs src-tauri/src/database/mod.rs` 除既有 fork 内容与本轮无改动外应为空。
- 降级：fork v24 库被上游 v4.0.21（v23）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 终态

- 托盘左键：保持 fork 四条分支（面板样式左键 Up 且面板未显示 → `tray::toggle_main_window`；面板已显示 → `tray_panel::toggle` 收起；右键 Up → `tray_panel::toggle`；原生菜单样式左键 Up → `toggle_main_window`、右键 Up → `mark_feedback_seen` 后交系统菜单）。`show_menu_on_left_click(false)` 两处固定，`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留。
- 上游本轮不改 `tray.rs`；「打开终端」入口迁移只涉及卡片与菜单组件。
- 应用内更新器：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；上游本轮未改 updater 相关函数，不采纳任何重放带入的更新器实现。
- Windows：本轮上游新增 Windows 登录 opener 常量（`f20a2b29d`）、Grok Build / OpenCode npm 12 postinstall 修复；上一轮的 MSI 模板 `REBOOT=ReallySuppress`、`CloseApplication`、可选桌面快捷方式与 `release.yml` Property 断言保持。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订：`ProviderCard.tsx` 行（上游账号行/套餐/额度/终端隔离 + fork 模型徽章/双官网链接）、`commands/settings.rs` 行（上游轻量模式合并 + fork 更新器移除）、`settings.rs` 行（上游 `lightweight_mode` + fork 侧栏面板）、`lib.rs` 行（上游 `claude_account` 命令/服务注册 + fork updater/stream_check 移除与 connectivity 注册）、`services/mod.rs` 行（上游 `claude_account` 模块 + fork `connectivity_test` 模块）、`services/provider/mod.rs` 行（上游 `claude_official` 模块与 `update_provider_sort_indexes` + fork 测试字面量）、`database/dao/providers.rs` 行（上游 `update_provider_sort_indexes` + fork `website_url_2`）、`ProviderForm.tsx` 行（上游 `ClaudeAccountSelect` + fork 导入/布局）、`ClaudeDesktopProviderForm.tsx` 行（上游 Copilot URL 检测 + fork `rightSlot` 布局）、`App.tsx` 行（上游托管账号缓存失效 + fork 侧栏/连通性）、`mutations.ts` 行（上游账号缓存失效 + fork 导入/快捷切换）、4 个 locale 行。
  - locale 行登记：fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`；上游本轮新增/删除键按上游落地。
  - 新增 §4.8「v4.0.21 轮的叠加要点」：Claude 多账号与切卡即切号、卡片副标题/额度/终端图标合并规则、`supportsConnectivityCheck` 与 `shouldShowTestEntry` 双层守卫、轻量模式持久化、预设刷新与白名单口径、`tr.json` 取上游。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记「v4.0.21 轮上游 schema 仍为 23，fork 保持 24，无新增迁移臂」。

### 重放映射（口径与记录要求，实测数字在 Build 阶段回填）

- 同步前 `git rev-list --count v4.0.20..pre-sync-v421` 预期 == 180。
- 重放后 `git rev-list --count v4.0.21..HEAD` 与 180 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录。
- tag `v4.0.21` 是 annotated tag：tag 对象 `2f04decf8`，剥离提交 `c4db63c60`；`git merge-base main v4.0.21` == `c4db63c60`；`git log --format='%an <%ae>' v4.0.21..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.20..pre-sync-v421` 与重放后 `v4.0.21..HEAD`）差异必须为 0 行。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期的主要停车面：版本四文件、`README.md`、`src-tauri/src/lib.rs`、`commands/misc.rs`、`commands/settings.rs`、`settings.rs`、`services/provider/mod.rs`、`services/mod.rs`、`database/dao/providers.rs`、`proxy/forwarder.rs`、`proxy/providers/codex.rs`、`App.tsx`、`ProviderCard.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`mutations.ts`、4 个预设文件、4 个 locale、`tests/components/{ClaudeDesktopProviderForm,ProviderCardActions,ProviderPresetSelector}.test.tsx`。
- 冲突停车清单（交互式）在 Build 阶段逐条记录；rerere 复用的解法必须逐个复核。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。

#### 本轮实测（Build 阶段回填）

- 同步前 `git rev-list --count v4.0.20..pre-sync-v421` = **180**。
- 重放后（代码终态 `HEAD` = `293648173`）`git rev-list --count v4.0.21..HEAD` = **181** = 180 个重放提交 + 1 个本轮新增提交（`293648173` `test(fork): 更多菜单断言随 v4.0.21 终端入口迁移`）。Build 收尾的文档提交（只改 `docs/**` 与 Markdown）使最终 `HEAD` 计数为 **182** = 180 + 2，不改变重放映射。
- 被 git 判空丢弃的提交 = **0 个**（180 → 180，本轮无提交被丢弃）。
- 主题序列 `git log --format='%s' --reverse` 逐行 diff（`v4.0.20..pre-sync-v421` vs `v4.0.21..HEAD` 剔除本轮新增提交后）= **0 行**。
- `git merge-base main v4.0.21` = `c4db63c60d2a1ddcb4bd9f81152b9c6126413659`（= `v4.0.21^{}`，annotated tag 对象 `2f04decf8`）；`git log --format='%an <%ae>' v4.0.21..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- patch-id 差异 = **10 处**（170 个与重放前逐字相同）：其中 **7 处为冲突停车**（全部在 reflog 留下今日的 `rebase (continue)` 记录，逐条见下）；**3 处未停车**，属 git 三方自动合并后树内容随新基线上下文位移（文件集与增删行数完全相同）：
  - `f6121ca0d→b47ac25bf`（徽章对齐上游 `extractModelBadge`）
  - `6d0a3b3e7→e5ebf3d5b`（侧栏面板显隐）
  - `3ddaf9145→4ce83b404`（连通性测试列表集成）
- rerere：全程开启；本轮 29 个文件级条目为今日新增，rebase 输出中没有任何 `Resolved '…' using previous resolution`，7 个停车点全部手工解决并逐条复核。

### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.20..v4.0.21` 改动过的每个文件（161 个，覆盖 31 个重叠文件的全部）取 `git diff v4.0.20 v4.0.21 -- f` 的增/删行、`git diff v4.0.20 pre-sync-v421 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。非重叠的 130 个上游文件 fork 侧缺失应为 0。
- 计算必须在全部最终态提交（版本、文案、文档、schema、Claude 多账号交集、合并）落完之后，对最终 `HEAD` 执行；`HEAD` 之后的归档提交只改 Markdown，不在 161 个文件内，故数字不变。
- 预期的刻意取舍（逐行归因，具体行数在 Build 后按实测填写）：
  - `README.md`：fork 是整文件自有的「与上游的差别」文档；上游本轮 7 增/7 删不落地，全部归因为「fork 整文件替换」。
  - 版本与锁文件：上游 `"version": "4.0.21"` 行被 fork `4.0.21-1` 取代（4 个文件各 1 行）；fork 的 `4.0.20-1` 行被本轮终态升级（属预期流转）。
  - `src-tauri/src/database/mod.rs` 不在本轮上游改动面，不应产生任何缺失。
  - `ProviderCard.tsx`：绑号卡副标题走上游账号行、未绑号卡走 fork 双官网链接（上游 `claudeDefaultPlanLabel` 的 `displayUrl` 分支在未绑号时由 fork 链接承载，逐行归因为「合并等价」）。
  - `ProviderForm.tsx` / `ClaudeDesktopProviderForm.tsx`：上游新块叠加到 fork 布局，若因布局差异造成行形态改写，逐行归因为「布局等价」。
  - 4 个 locale：上游新增 37 键、删除 7 键、改写 2 键全部按上游落地；fork 键段不产生上游缺失。
  - 4 个预设文件：目录内容整份取上游，fork 各保留 `hidden?: boolean` 两行，不产生上游行缺失。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.21 HEAD -- <file>` 只看 fork 侧新增/删除。

#### 本轮实测（Build 阶段回填）

- 实测合计：**上游新增行缺失 13 行（6 个文件），fork 新增行缺失 6 行（6 个文件）**；161 个上游文件全部参与计算（31 个重叠文件 + 130 个非重叠文件），其余 155 个文件双侧缺失均为 0。计算在版本/文案/schema/Claude 多账号交集/合并与测试断言修正（`293648173`）落完之后、对代码终态 `HEAD` = `293648173` 执行；其后的文档提交只改 `docs/**` 与 Markdown，不在 161 个文件内，故数字不变。
- 上游新增行缺失逐项归因：
  - `README.md` 6 行（TeamoRouter 赞助商表格行 5 行 + `<tr>` 标签 1 行）：fork README 整文件重写，不采纳上游赞助商表（刻意取舍）。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行版本号 `4.0.21`：fork 用 `4.0.21-1` 取代（预期流转）。
  - `src/components/providers/ProviderCard.tsx` 3 行（`) : displayUrl && claudeDefaultPlanLabel ? (`、`"inline-flex min-w-0 items-center overflow-hidden text-start"`、`<span className="-ms-1 shrink-0">· {claudeDefaultPlanLabel}</span>`）：按 D3，未绑号卡保留 fork 的 `websiteLinks` 分支并在末尾追加同一个套餐后缀，上游该独立分支不逐字存在，语义保留（合并等价）。
- fork 新增行缺失逐项归因：
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行 `4.0.20-1`：本轮终态升级为 `4.0.21-1`（预期流转）。
  - `src/components/providers/ProviderCard.tsx` 1 行（fork 原 `className="flex min-w-0 max-w-full items-center overflow-hidden text-left text-caption"`）：合并上游 `mt-0.5`/`text-fg-2` 后类名改写，视觉口径与上游对齐（合并等价）。
  - `tests/components/ProviderCardActions.test.tsx` 1 行（`"provider.openTerminal"`）：上游把终端入口移到卡片图标按钮，fork 的菜单项断言同步移除并新增「不在菜单中」断言（刻意取舍，见 A7）。
- 说明：`tr.json` 与 `v4.0.21` 逐字节一致（`cmp` 通过）；4 个 locale 的 37 个新增键/7 个删除键/2 个改写键全部按上游落地，fork 键段保留，按对象作用域查重为 0 重复。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 31 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.20 v4.0.21 | sort) <(git diff --name-only v4.0.20 HEAD | sort)`；上游 161 文件 + fork 470 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.20 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（5 个）

- **`package.json`**（1/1 / 2/2）：取上游内容，版本号改为 fork `4.0.21-1`；保留 fork 的 `dev:fork` script 与已移除的 `@tauri-apps/plugin-updater` 依赖。
- **`src-tauri/Cargo.toml`**（1/1 / 3/6）：取上游内容，版本号改为 `4.0.21-1`；保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`。
- **`src-tauri/Cargo.lock`**（1/1 / 5/175）：本轮上游无新增依赖，只有 `cc-switch` 版本行；`cc-switch` 条目改为 `4.0.21-1`；不得出现任何 updater 相关包。
- **`src-tauri/tauri.conf.json`**（1/1 / 5/11）：取上游内容，版本号改为 `4.0.21-1`；保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true` 与 fork 移除的 `trafficLightPosition`。
- **`README.md`**（7/7 / 96/539）：fork README 是整文件自有的「与上游的差别」文档；冲突按整文件保留 fork 版；上游本轮新增/删除行不落地，属刻意取舍。

#### 后端（10 个）

- **`src-tauri/src/lib.rs`**（30/2 / 32/42）：上游注册 `claude_account` 命令与服务（`commands/claude_account`、`services/claude_account`）以及相关初始化；fork 的无 Updater、托盘左键、connectivity 命令注册、`stream_check` 移除四段语义原样保留。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0、`.show_menu_on_left_click(false)` 在位、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册在位、`claude_account` 命令注册在位。
- **`src-tauri/src/commands/misc.rs`**（308/31 / 6/5）：上游新增 Grok Build / OpenCode npm 12 postinstall 处理、Hermes 双安装计数、Gemini `.env` `export` 行、Windows 登录 opener 常量等；fork 只把 `check_for_updates`、`portable_zip_url`、`open_portable_update_download` 及测试里的 URL 指向 tunecc。冲突时逐 hunk 取上游并保留 fork 的 URL，禁止整文件取一侧；解完 grep `farion1231/cc-switch/releases` 应为 0（README/文档除外）、`tunecc/cc-switch/releases` 在位。
- **`src-tauri/src/commands/mod.rs`**（2/0 / 2/2）：上游注册 `claude_account` 模块；fork 的 `connectivity_test` 模块声明保留、`stream_check` 维持移除。
- **`src-tauri/src/commands/settings.rs`**（14/0 / 7/105）：上游在 `merge_settings_for_save` 增加 `incoming.lightweight_mode = existing.lightweight_mode;` 与对应测试；fork 移除的约 105 行更新器代码（`install_update_and_restart` 空壳保留）不得带回。冲突时取上游合并逻辑 + 保留 fork 的更新器移除。
- **`src-tauri/src/database/dao/providers.rs`**（21/0 / 41/32）：上游新增 `update_provider_sort_indexes`（事务内逐个更新 `sort_index`）；fork 的 `website_url_2` 列读写与测试字面量保留。两者并存，不得整文件取一侧。
- **`src-tauri/src/proxy/forwarder.rs`**（3/1 / 2/1）：上游压缩请求新增 `item_ids: false` 字段；fork 的注释与测试字面量保留。
- **`src-tauri/src/proxy/providers/codex.rs`**（49/0 / 1/0）：上游新增 `extract_codex_base_url_from_toml`（按 `model_provider` 选择表）与测试；fork 的 `website_url_2: None` 测试字面量保留。
- **`src-tauri/src/services/mod.rs`**（1/0 / 2/1）：上游新增 `pub(crate) mod claude_account;`；fork 的 `connectivity_test` 模块声明保留。
- **`src-tauri/src/services/provider/mod.rs`**（8/9 / 4/0）：上游新增 `pub(crate) mod claude_official;`，并把排序更新改为调用 `db.update_provider_sort_indexes(app_type.as_str(), &updates)`；fork 的 4 行测试字面量 `website_url_2: None` 保留。`updateSortOrder` 命令语义不变，fork 一键置顶/置底自动走新实现。
- **`src-tauri/src/settings.rs`**（13/0 / 47/0）：上游新增 `lightweight_mode` 字段（含 Default/序列化）；fork 的 `VisibleSidebarPanels`、`website_url_2` 等设置整段保留，两段并存。

#### 前端（5 个）

- **`src/App.tsx`**（17/0 / 83/1）：上游新增 `managed-auth-status`/`claude_official` 缓存失效与 Codex OAuth 额度错误重取；fork 的窗口标题、`visibleSidebarPanels`、`useConnectivityProbe`/批量测试、`websiteUrl2` 保留。
- **`src/components/providers/ProviderCard.tsx`**（70/8 / 104/1）：上游新增 `ClaudeBoundAccountLine`（绑号时优先于官网链接）、`claudeDefaultPlanLabel`（未绑号时 `displayUrl · 套餐`）、`ClaudeAccountQuotaFooter`（额度列）、`terminalIsIsolated`（终端隔离提示）；fork 的模型徽章（标题行）、双官网链接、右键菜单、`max-w-[208px]` 额度容器与 `onTest` 外层守卫保留。合并顺序：绑号 → 上游账号行；未绑号 → fork 双链接 + 套餐后缀；两处额度 footer 不得重复渲染。
- **`src/components/providers/forms/ClaudeDesktopProviderForm.tsx`**（23/5 / 85/12）：上游新增 `usesAutomaticCopilotFormat`（`github_copilot` 或 baseUrl 含 `githubcopilot.com`，排除 `codex_oauth`/`xai_oauth`）与 Copilot 下清空 `savedApiFormat` 的 `gemini_native`；fork 的 85/12 `rightSlot` 布局改动保留，Copilot 检测适配到该布局。
- **`src/components/providers/forms/ProviderForm.tsx`**（26/1 / 183/43）：上游为 Claude 官方卡新增 `ClaudeAccountSelect`（登录方式下拉）与 `selectedClaudeAccountId` 状态；fork 的 183/43 改动（Kimi 早退、跨应用导入、布局）保留，账号下拉叠加到官方卡分支。
- **`src/lib/query/mutations.ts`**（6/0 / 63/0）：上游在 Claude 切卡后失效 `managed-auth-status` 等账号缓存；fork 的 63 行改动（导入、快捷切换）保留。

#### 预设（4 个）

- **`src/config/{hermes,openclaw,opencode,pi}ProviderPresets.ts`**（122/53、235/160、146/46、119/149 / 各 2/0）：目录内容整份取上游（模型刷新、ClinePass/TeamoRouter、Kimi K3.1 Pro/HighSpeed、DeepSeek Flash、MiniMax Flash、Claude Desktop OpenCode Go）；fork 只保留各接口的 `hidden?: boolean` 两行。白名单条目（`Ollama`/`LM Studio`/`llama.cpp`/`vLLM`/官方名）在上游目录中仍逐字存在；ClinePass、TeamoRouter 不在 fork 白名单内，继续隐藏。

#### 本地化（4 个）

- **`src/i18n/locales/{en,ja,zh-TW,zh}.json`**（47/11 / 328/25、315/24、315/24、327/24）：保留 fork 键段（含 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 的 fork 文案、供应商导入、模型快捷切换等），叠加上游本轮 37 个新增键（`authCenter.claude.*` 14、`provider.form.claudeAccount.*` 17、`mcpPage.drawer.sse*` 4、`provider.openTerminalIsolated`、`providerCard.action.openTerminal`）、删除上游 7 个键（`authCenter.agy.login`、`authCenter.groupMenu`、`authCenter.pending.login`、`authCenter.removeAll`、`codexOauth.loginWithChatGPT`、`providerCard.reason.currentCannotRemove`、`providerCard.status.current`）、按上游改写 2 个键（`provider.openTerminal`、`providerForm.partnerPromotion.teamorouter`）；不得出现同名重复键。`tr.json` 不在重叠面，整文件取上游。

#### 测试（3 个）

- **`tests/components/ClaudeDesktopProviderForm.test.tsx`**（169/0 / 14/0）：上游 Copilot URL 检测用例 + fork 既有 14 行断言并存。
- **`tests/components/ProviderCardActions.test.tsx`**（46/0 / 34/0）：上游终端图标/菜单用例 + fork 的菜单改造断言并存；fork 断言的 ⋯ 菜单项集合按合并后内容调整，但「不含模型项」「不含终端项」两条均须成立。
- **`tests/components/ProviderPresetSelector.test.tsx`**（2/2 / 33/0）：上游基线改写 + fork 的 `extraActions`/白名单断言并存。

#### fork 自有文件（不在重叠面，仅需核对不被上游形态带偏）

- **`src/config/forkOfficialAllowlist.ts`**：本轮不增改（无新增 `category: "local"` 预设；Kimi 官方预设名不变）。
- **`src/config/forkPresetFilter.ts`**：判定实现不改；4 个预设目录继续在「编号后过滤」。
- **`src/components/providers/connectivityEntry.ts`**：`shouldShowTestEntry` 判定不变，作为外层守卫与上游 `supportsConnectivityCheck` 叠加。
- **`src-tauri/src/commands/connectivity_test.rs`**、**`src-tauri/src/services/connectivity_test/`**：不在上游本轮改动面，保持不动。
- **`src/utils/providerImport.ts`**、**`ProviderImportEntry.tsx`**、`hooks/useProviderImportApply.ts`：不在上游本轮改动面，保持不动。

#### 冲突停车清单（本轮实测 7 处，按重放顺序）

「差异面」= 该提交重放前后 `git show --numstat` 不一致的文件（冲突解决实际落点）；未列出的提交与重放前逐字相同（另有 3 处未停车但 patch-id 不同，见「重放映射」实测）。

| # | 提交（旧 → 新） | 差异面 | 解法 |
| --- | --- | --- | --- |
| 30 | `06956fefb→a4bda4bcb`（模型徽章与快捷切换入口） | `ProviderCardActions.tsx` | 保留上游 `openTerminalIsolated` 与终端图标按钮，叠加 fork 的 `onQuickModel` 与分隔线条件；⋯ 菜单不再有终端项 |
| 49 | `2ef9458a5→efbdbb698`（README fork 构建说明） | `README.md` | 整文件取 fork（与 `pre-sync-v421` 逐字节相同，148 行） |
| 82 | `c40eeb0ad→fd2012e9c`（双官网链接） | `ProviderCard.tsx` | 未绑号卡保留 fork 的 `websiteLinks` 横排双链接，末尾追加 `claudeDefaultPlanLabel` 的 `· 套餐`；绑号卡走上游账号行 |
| 106 | `b691aa746→00768d6bb`（v4.0.1 CI 修复） | `ProviderCardActions.tsx` | 该提交重新加入的终端菜单项在 v4.0.21 已按上游移除，取 HEAD 侧（无终端项） |
| 123 | `c21a23c19→30a512520`（徽章作快捷切换入口，菜单移除模型项） | `ProviderCardActions.tsx`、`src/i18n/locales/{en,ja,zh-TW,zh}.json` | 按提交本意移除 `onQuickModel` 与模型菜单项；locale 中上游 `providerCard.action.openTerminal` 与 fork `providerCard.action.quickModel` 两键都保留 |
| 169 | `e4e2e1ff5→ea1a7847b`（v4.0.18 同步） | `ProviderCard.tsx` | 保留 `claudeDefaultPlanLabel` 追加块 |
| 178 | `69ac8a2b4→82d44d39d`（v4.0.20-1 同步） | `package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json` | 版本行统一为 `4.0.21-1`；该提交其余 15 个文件按原内容落地 |

### fork 取舍清单

| 功能 | 上游本轮 | fork 处理 | 理由 |
| --- | --- | --- | --- |
| Claude 官方多账号切换 | 新增 | 全量保留，与 fork 卡片/菜单改造叠加 | 全新能力，无 fork 对应实现 |
| 打开终端入口（卡片图标） | 新增 | 取上游位置；fork 的 ⋯ 菜单改造保留 | 不同菜单项，互不覆盖 |
| 连通检测判定（`supportsConnectivityCheck`） | 新增 | 取上游作内层守卫，fork 外层守卫保留 | 语义兼容，可见行为不变 |
| 卡片账号行/套餐/额度 | 新增 | 绑号卡走上游，未绑号卡保留 fork 双链接 + 套餐后缀 | 合并规则见 D3 |
| Codex 模型拖拽排序 | 新增 | 全量保留（fork 未改该文件） | 无冲突 |
| 轻量模式持久化 | 新增 | 全量保留，与 fork 侧栏面板设置并存 | 不同设置键 |
| Hermes 设为默认移入 ⋯ 菜单 | 新增 | 全量保留（fork 未改该文件） | 无冲突 |
| `update_provider_sort_indexes` | 新增 | 全量保留，fork 一键置顶/置底自动复用 | 同一 `updateSortOrder` 命令 |
| 模型徽章/快捷切换 | 无 | 保留 | fork 魔改契约 |
| 双官网链接 | 无 | 保留（未绑号卡） | fork 魔改契约 |
| 跨应用导入 | 无 | 保留 | fork 魔改契约 |
| 官方预设白名单 | 新增 ClinePass/TeamoRouter | 保留白名单，新条目继续隐藏 | 延续 fork 收敛口径 |
| 逐模型连通性测试 | 无 | 保留 | fork 魔改契约 |
| 应用内更新器 | 无 | 继续禁用 | fork 契约 |
| 托盘左键 | 无（本轮不改 `tray.rs`） | 保留 fork 四条分支 | fork 契约 |
| README | 7/7 | 保留 fork 整文件 | fork 文档口径 |

### 预设 id 编号契约（延续）

- 预设目录条目 `id` 一律为**原始数组下标**的字符串；白名单过滤必须发生在 `map((preset, index) => ({ id: String(index), preset }))` 之后，不得先过滤再编号。
- 本轮上游新增 ClinePass / TeamoRouter 等条目会改变数组下标，但 fork 只在渲染层过滤，`id` 仍按上游数组原位编号；fork 不新增、不删除目录条目。
- Kimi 的官方账号卡是独立条目 `kimi-official-account`，不属于目录数组。

### 本地化状态

- 4 个既有 locale 只增删上游本轮键，fork 专属键与文案原样保留；同一对象作用域不得出现同名重复键（JSON 会静默取后者，TS interface 会报 TS2300）。
- `tr.json` 整文件取上游（土耳其语补全），逐字节与 `git show v4.0.21:src/i18n/locales/tr.json` 一致，不补 fork 键。
- 新增的 Claude 多账号 / 终端图标相关 UI 文案全部来自上游 locale 键；fork 不新造文案。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5`。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v421`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理。
- `rerere` 可能把往轮的解法复用到新基线：复用后逐个复核，尤其是版本四文件、`lib.rs`、4 个 locale。
- locale JSON 合并后可能出现同名重复键：合并后必须做对象作用域查重；上游本轮删除的 7 个键不得残留引用（`authCenter.removeAll`、`providerCard.status.current` 等）。
- `ProviderCard.tsx` 是最高危面：上游新增账号行/额度 footer/终端隔离提示，fork 有模型徽章与双官网链接；账号行与官网链接是互斥分支，额度 footer 不得与 fork 额度列重复渲染。
- `commands/settings.rs` 的 fork 侧是「删除更新器」，上游是「合并轻量模式」；冲突时逐 hunk 处理，不得把 `install_update_and_restart` 的安装实现带回来。
- `commands/misc.rs` 上游改动面 308 行；fork 只有 tunecc URL，逐 hunk 取上游 + 保留 URL，禁止整文件取一侧。
- `services/provider/mod.rs` 的排序更新改为 `db.update_provider_sort_indexes`；fork 的 `updateSortOrder` 命令与前端 `applyQuickSort` 不需改动，但测试断言若引用旧 DAO 调用需按新实现调整。
- `proxy/providers/codex.rs` 的 `extract_codex_base_url_from_toml` 是新增函数，fork 的唯一改动是测试字面量；合并时不要把 fork 版本误当基线。
- `tr.json` 不要因为 fork 缺键而回写；逐字节一致是本轮验收项。
- 上游 `ProviderCardActions.tsx` 被本轮修改但不在重叠面：fork 侧对该文件无改动，直接取上游；`tests/components/ProviderCardActions.test.tsx` 在重叠面，断言按合并后语义调整。

### 版本号

- `4.0.21-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.21-1`。

### 交付（按 Q1 授权）

- 验收通过、用户接受结果并归档后：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.21-1` 并 `git push origin v4.0.21-1`。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.21-1` 核对远端指向；Release CI 仅 Windows x64 与 macOS arm64 unsigned。

### fork 魔改保留清单（同步后必须仍然存在且可用）

1. 产品名 CC Switch、DevPanel（`dev:fork`）与 fork 构建标记 `IS_FORK_BUILD`。
2. 侧栏面板可见性（`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS`、`GeneralSection` 开关）。
3. 模型徽章与快捷切换（claude/codex/gemini/grokbuild）。
4. Claude 兜底模型直达区、1M 全选与角色模型映射的「非高级」判定。
5. 供应商右键置顶/置底、新建插入第二位。
6. 官方预设白名单（`forkOfficialAllowlist` + `filterForkPresets`；ClinePass/TeamoRouter 继续隐藏）。
7. 逐模型连通性测试（`connectivity_test_provider_models`/`connectivity_probe_provider`、`shouldShowTestEntry`）。
8. 双官网链接（`websiteUrl`/`websiteUrl2` 后端字段与前端展示；未绑号卡仍显示）。
9. 跨应用导入（`providerImport.ts`、`ProviderImportEntry`、各表单入口）。
10. 禁用应用内更新器（无插件/依赖/权限，`install_update_and_restart` 空壳）。
11. README 的 fork 说明与 fork CI。
12. 托盘左键切换主窗口与源码护栏。
13. 测试稳定性修正（AppsPage 的 `waitFor` 等）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

- `forkOfficialAllowlist`：3 个文件（`src/config/forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、表单接线）。
- `filterForkPresets`：6 个文件（过滤函数 + 5 处表单/测试接线）。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：4 个文件（`providerModelUtils.ts` 与卡片/动作/测试），列表仍为 claude/codex/gemini/grokbuild。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：6 个文件（前端设置、侧栏、类型、后端 `settings.rs`、测试）。
- `websiteUrl2`/`website_url_2`：43 个文件（后端迁移/DAO/构造器、deeplink、前端双链接、测试）。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：6 个文件（`lib.rs` 注册、命令与服务、前端 API、hooks）。
- `ProviderImportEntry`/`readImportableProviderFields`：10 个文件（组件、hooks、`providerImport.ts` 与各表单/测试）。
- `terminalIsIsolated`/`openTerminalIsolated`：8 个文件（上游终端隔离提示链路，含卡片与菜单）。
- `tauri_plugin_updater`/`updater_builder`：**0**；`tauri-plugin-updater` 不在 `Cargo.toml`、`plugin-updater` 不在 `package.json`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳（`src-tauri/src/commands/settings.rs:267`）。
- `native_menu_on_left_click`：1 个文件（`src-tauri/src/tray.rs`，仅注释与护栏断言的字符串常量；函数定义与调用点均为 0）。
