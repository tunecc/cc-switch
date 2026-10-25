# 完整目标规格：upstream-sync（v4.0.20 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 annotated tag `v4.0.20`（tag 对象 `79738d9bf9fe846f698fe3586ba5b7b75309649c`，剥离提交 `85ad4969b3399500baaea9d46b1e08f87aba80e1`）；fork 版本号 `4.0.19-1` → `4.0.20-1`。`upstream/main` 比 tag 多 1 个提交（`de0a235ad`），按「只锁已发布 tag」约定不纳入。推送与 tag 属交付步骤，按 Q4 授权在验收通过并归档之后执行。

上游 `v4.0.19..v4.0.20` 共 39 个提交、205 个文件、+12058/−3050（13 新增 / 1 删除 / 191 修改），与 fork 的重叠面为 51 个文件（fork 侧自 `v4.0.19` 起改动 466 个文件、+56783/−2754）。本轮主轴是 **Oh My Pi（`omp`）成为第 13 个应用（第 12 个 CLI 工具）**：它复用 Pi 的表单、配置、当前状态、会话、MCP 与用量脚本管线，但 `models.yml` 有更严格的 schema 校验、默认模型只读自 `config.yml`；它与 fork 的「预设白名单」「跨应用导入」「模型徽章/快捷切换」三处正面相交，且上游把数据库 schema 从 22 升到 23（`mcp_servers` 加 `enabled_omp`），与 fork 已是 23 的 schema 撞车——fork 升到 24 并保留自己的 v21→v22 AGY、v22→v23 Kimi 幂等补齐。上游同时新增应用页拖拽排序与侧栏跟随（`settings.app_order`）、应用页已安装/未安装分组、Pi/omp 折叠高级选项与拉取模型选择弹窗、Kimi 官方账号模型编辑、托管 ChatGPT 账号浏览器登录（`prost`）、土耳其语补全、预设模型刷新（移除 EveryAPI）、Linux 窗口拖动/缩放，以及用量/托盘/会话修复。

**上游是否重写了 fork 已有功能——本轮结论：没有重复实现，四处同域但语义不同或只是新应用相交，均不构成二选一。**

1. 上游「应用拖拽排序 + 侧栏跟随」是应用顺序语义（`settings.app_order`），fork 的「侧栏面板可见性」是全局项显隐语义（`VisibleSidebarPanels`）；写不同键、改不同 UI，叠加并存。
2. 上游 Pi/omp 表单重构（折叠高级选项、拉取模型弹窗、omp 分支）与 fork 的 Pi 魔改（`websiteUrl2`、跨应用导入、白名单、`buildPiSettingsConfig` 提取）在同一文件的不同区域，叠加保留。
3. 上游 Copilot 自动协议路由（禁用「上游格式」选择并显示提示）与 fork 把该选择器移入 `EndpointField.rightSlot` 是布局差异；上游语义适配到 fork 布局，不涉及取舍。
4. omp（新应用）与 fork 三项功能相交，按 Q1–Q3 处理（见「fork 取舍清单」）。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.20` 剥离出的提交 `85ad4969`。
- `git merge-base main v4.0.20` == `85ad4969`；`git log v4.0.20..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 182 个 fork 提交（`git rev-list --count v4.0.19..pre-sync-v420`，起点 `1c10d67aa`）按原顺序重放：177 个落地、5 个被 git 判空，另加本轮同步终态提交 `69ac8a2b4` 与归档提交。
- 同步前起点由安全分支 `pre-sync-v420`（= `1c10d67aa`）固定记录。
- 上一轮基线 tag `v4.0.19` = `319fbfd`（剥离 `d8983bb`）与 fork 发布 tag `v4.0.19-1` 保持不变。
- `upstream/main` 当前为 `de0a235ad`（tag 之后 1 个提交），本轮显式排除，不同步其他上游分支。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v420/` 产物。

### 同步范围（v4.0.19..v4.0.20：39 提交、205 文件、+12058/−3050）

上游本轮改动按功能分组（详细到提交号，便于核对落地保真）：

1. **Oh My Pi 接入（13 提交）**：`c8945d2d9`（Oh My Pi 支持）、`2afe8cdbe`（内部 app id 改为 `omp`）、`3d7cf6aa3`（移植文本级 models.yml 编辑器并共用 Pi 管线）、`a03c6c7a3`（复用 Pi 表单与管线）、`e88a9fa41`（用 Pi 会话读取器读 omp 会话）、`b34753b83`（omp 全局 prompts）、`f1d43ebaa`（README 列出 omp）、`9bacd1d17`（会话预览允许项目图片）、`d9422e7d6`（安装/升级不假定 Bun）、`d01daa0d6`（导入 Skills 时隐藏 omp）、`c6617bc23`（omp 说明移到 MCP/Skills 列）、`6e040f4c8`（providerKey 对照 omp 自己的 providers 查重）、`f67cb33dd`（匹配 omp 的 apiKey、models.json 与 schema 规则）。
2. **Pi/omp 共用表单（3 提交）**：`6c2fc74e3`（拉取模型改为弹窗选择）、`5f6426400`（少用的供应商设置收进折叠高级选项）、`dcdcbcb47`（用量查询解析 apiKey 的 `$NAME` 引用）。
3. **Kimi 与定价（4 提交）**：`c3e54a4e8`（Kimi K3.1 Pro / HighSpeed 价格）、`626529451`（编辑官方账号模型、可从 Kimi 移除）、`c91aa7740`（无 Kimi Code 套餐显示 “No subscription”）、`f395cd6be`（从子代理自有 wire log 导入 Kimi 用量）。
4. **应用顺序与 Apps 页（4 提交）**：`5bc562ce0`（应用页按已安装/未安装分组）、`b71141a86`（拖拽排序已安装应用，侧栏跟随）、`ba6a8a555`（Claude Desktop 按是否安装分组）、`72b056f6e`（余额用尽仍显示金额）。
5. **用量与托盘修复（3 提交）**：`b9f317af5`（DeepSeek 空余额不再当作套餐过期）、`28a2ebc0e`（每个 tab 显示计数且过滤变化时计数稳定）、`e68e69437`（中文额度失败文案改为「额度查询失败」）。
6. **其他修复（8 提交）**：`1a3057dc1`（Claude 会话标题跳过本地命令输出）、`e8ae28b65`（Linux 恢复窗口拖动与缩放反馈）、`7f9cd9e96`（孤儿工具结果媒体用附加标记）、`bd50984e0`（Copilot 自动协议路由在表单中体现）、`c72c82cfb`（托管 ChatGPT 账号浏览器登录）、`309c9c515`（agy 从原生 generation 恢复子代理用量模型）、`442df1db7`（下载 skill 归档带 User-Agent）、`9decd60e8`（土耳其语目录补全）。
7. **预设刷新（2 提交）**：`cae7c3754`（移除 EveryAPI 赞助商与预设）、`50a9d103d`（预设模型跟进厂商最新阵容，顶层预设名不变）。
8. **发布相关（2 提交）**：`c9e059a4d`（四处版本号 4.0.20）、`85ad4969b`（3 份 release notes + `src/whats-new/4.0.20.json`）。

新增文件 13 个：`src-tauri/src/omp_config.rs`、`commands/omp.rs`、`mcp/omp.rs`、`services/provider/omp.rs`、`session_manager/providers/omp.rs`、`proxy/providers/codex_oauth_auth/browser.rs`、`services/session_usage_agy/native_models.rs`、`src/config/ompProviderPresets.ts`、`tests/config/ompProviderPresets.test.ts`、`docs/release-notes/v4.0.20-{en,ja,zh}.md`、`src/whats-new/4.0.20.json`。删除文件 1 个：`assets/partners/logos/everyapi-banner.jpg`。

### Oh My Pi 应用终态

omp 是第 13 个应用、第 12 个 CLI 工具；行为属于「共存式（additive）」。

- **无 `current_provider_omp` 设置**：`VisibleApps.omp` 存在（既有设置文件缺该键时反序列化为 `false`，全新 `Default` 为 `true`）；`get_current_provider`/`set_current_provider` 对 omp 与 Pi/Mcode/Kimi 一样返回 `None`/空操作；当前供应商由 Pi 家族当前状态从 `~/.omp/agent/config.yml` 的默认模型解析。
- **应用注册**：`AppId` 含 `omp`；`APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`ADDITIVE_APP_IDS`/`MCP_APP_IDS`/`APP_ICON_MAP` 均含 omp；`PI_FAMILY_APP_IDS = ["pi", "omp"]` 与 `isPiFamilyApp` 供表单、列表、presentation、mutations 共用；`ProviderForm` 把 `pi || omp` 路由到 `PiProviderForm`。
- **独立表单行为**：`PiProviderForm` 用 `isOmp` 分流——预设目录取 `ompProviderPresets`；根受控键取 `OMP_ROOT_CONTROLLED_KEYS`；不写 provider 级 `name`；模型预览删除 `thinkingLevelMap`；providerKey 常显、新增时校验小写连字符格式并对照 omp 自己的 providers 查重、编辑时不可改；`models` 非空校验（omp 允许仅靠自动发现类型时留空）；请求头/兼容项/自动发现收进默认折叠的高级选项；拉取模型改为 `FetchedModelPicker` 弹窗。
- **预设目录**：`ompProviderPresets` 由 `piProviderPresets` 逐条派生，删除 omp schema 不定义的字段（provider 级 `name`、模型级 `thinkingLevelMap`、Pi 专有 compat 键），把 Pi 的 DeepSeek thinking 方言译为 omp 的 `zai`、reasoning replay 译为 omp 原生控制项。Q1 白名单只决定 fork 构建下显示哪些条目，不改上游目录文件。
- **配置读写**：agent 目录为 `~/.omp/agent`，命名 profile 为 `~/.omp/profiles/<name>/agent`；只管理 `models.yml`（或已存在的 `models.yaml`）里的显式 `providers` 条目与 `mcp.json` 里的 MCP 服务；`config.yml`（或 `config.yaml`）只读默认模型；`models.yml` 以文本级编辑，拒绝无法安全改写的文档（锚点/标签/流式风格），不重排未管理节点；`add`/`update`/`remove`/`enable`/`delete` 不触碰默认模型与登录；provider id 不可重命名。
- **卡片与列表**：`ProviderList` 用 `isPiFamilyApp(appId)` 与 `usePiCurrentState(..., "omp")`；`isInConfig` 的 `case "omp"` 按 native providers 判定；Pi 家族无「当前」项，卡片额度按上游规则显示；空状态不提供「导入」（`ProviderEmptyState` 的 `appId === "omp"` 分支）；错误文案按 `${appId}.current.*` 本地化。
- **MCP / Skills**：`McpServerSpec.apps.omp`、`McpApps.omp`、`mcp/omp.rs` 投影、数据库 `mcp_servers.enabled_omp`（Skills 无 omp 列，启用状态按原生目录现算）。
- **协议边界**：omp 不进代理适配器（`get_adapter`/`provider_type` 返回 `None`），deeplink 导入对 omp 直接报错「Oh My Pi providers must be added from the Oh My Pi provider page」。
- **Apps 页**：Oh My Pi 安装/升级（Unix `https://omp.sh/install`、Windows `https://omp.sh/install.ps1`；升级 `omp update`；识别 brew/mise/nix/bun/npm/预编译二进制，Nix 安装跳过 `omp update`）、npm 包 `@oh-my-pi/pi-coding-agent`（只支持 bun 安装）、数据目录 `~/.omp`、图标 `omp`。
- **会话/用量/Prompts**：omp 会话走 Pi 会话读取器（含项目图片预览）；用量脚本命令与 Pi 共用；omp 全局 prompts 由上游 Prompt 功能管理。
- **Q1 白名单**：fork 构建下 omp 目录只显示 `Ollama`/`LM Studio`/`vLLM` 三条；`Ollama Cloud`、Kimi 家族、第三方/聚合站/赞助商、`Meta Model API` 等条目在所有 omp 入口不可见。目录条目 `id = String(原始数组下标)`，过滤必须排在编号之后。
- **Q2 导入**：omp 同时作为来源与目标，与 Pi 完全对齐——`readConfigFields("omp", …)` 读顶层 `baseUrl`/`apiKey`，身份字段照常复制，`defaultModel` 为空；omp 表单渲染 `ProviderImportEntry`（`appId="omp"`，来源由 `useProviderImportSources("omp")` 枚举）；`buildImportedSettingsConfig("omp", …)` 复用 `buildPiSettingsConfig` 生成 `{baseUrl, api, apiKey, models: []}`，`patchImportedSettingsConfig("omp", …)` 就地覆盖 `baseUrl`/`apiKey`；omp 也可作为其他应用的导入来源。
- **Q3 模型**：omp 不进入 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗；默认模型由上游 Pi 家族当前状态与表单模型表管理。

### 应用排序、侧栏与 Apps 页终态

- `AppSettings.app_order: Option<Vec<String>>`（camelCase `appOrder`），缺省不序列化；`orderAppIds(saved)` 过滤未知 ID、去重，并把缺失应用按默认顺序插到它前一个应用之后。
- `Sidebar` 先按 `orderAppIds(settings?.appOrder)` 排序，再按 `visibleApps` 过滤应用项；全局项（MCP/Skills/会话/Prompts）继续按 fork 的 `visibleSidebarPanels` 过滤（未配置即显示，显式 `false` 才隐藏）。两条规则互不覆盖。
- `App.tsx` 的默认活动应用从排序后的可见应用中选择；应用页拖拽只调整 `appOrder`，不改变 `visibleApps`。
- Apps 页按「已安装 / 未安装」分组，已安装项可拖拽排序；Claude Desktop 按是否安装归组；omp 的说明从 Apps 页移到 MCP/Skills 列（`c6617bc23`）。
- Linux 窗口恢复拖动与缩放反馈：`App.tsx` 增加窗口边框拖动/缩放监听与光标样式，仅在 Linux 生效；不影响 macOS/Windows 的托盘与标题栏逻辑。

### Pi/omp 表单终态

- 预设选择、providerKey、模型表、请求头/兼容项/自动发现分成基础区与默认折叠的高级区；高级区在预设自带值时也不自动展开。
- 拉取模型改为 `FetchedModelPicker` 弹窗，Pi 与 omp 共用；omp 删除 `thinkingLevelMap` 后再写入。
- `$NAME` 形式的 apiKey 在用量查询时按环境变量解析（`dcdcbcb47`）。
- fork 的 `websiteUrl2`、`ProviderImportEntry`、白名单过滤与 `buildPiSettingsConfig` 工具提取全部保留；omp 的导入入口参数为 `appId="omp"`，来源枚举为 `"omp"`。

### Kimi、托管账号、用量与其他上游终态

- **Kimi**：官方账号卡片可在 Kimi 表单内编辑模型（从授权中心模型目录 `kimiOAuthApi.models` 克隆）、账号名称与备注；连接信息仍只由登录决定，编辑不得把普通卡变成官方卡；可从 Kimi 移除官方账号（保留登录与卡片，可再「添加」回来）；无 Kimi Code 套餐显示 “No subscription”；K3.1 Pro / HighSpeed 进入内置定价；子代理用量从自有 wire log 导入。
- **托管 ChatGPT 账号**：新增浏览器登录（`c72c82cfb` + `codex_oauth_auth/browser.rs` + `prost = "0.14"`），由授权中心管理，不影响 fork 的更新器禁用。
- **用量/托盘**：每个用量 tab 显示计数且过滤变化时计数稳定；DeepSeek 空余额不再视为套餐过期；余额用尽仍显示金额；托盘删除 `balance_used_up` 字段，zh-TW 额度失败文案改为「額度查詢失敗」。
- **表单**：Copilot 预设下「上游格式」选择禁用并显示自动路由提示（`ClaudeFormFields` 与 `ClaudeDesktopProviderForm` 都要适配；fork 的 `EndpointField.rightSlot` 布局继续承载该选择器）。
- **其他**：agy 从原生 generation 恢复子代理用量模型；Claude 会话标题跳过本地命令输出；孤儿工具结果媒体用附加标记；下载 skill 归档带 User-Agent；土耳其语补全；预设模型刷新（顶层预设名不变，EveryAPI 删除）。

### 数据库 schema 终态（24）

- `SCHEMA_VERSION` == 24。
- 迁移链：
  - v18→v19：fork 的 `website_url_2` 与上游 `enabled_mcode` 并存（保持现状）。
  - v19→v20：上游 `mcp_servers.enabled_pi`（保持现状）。
  - v20→v21：fork 的 mcode/pi 幂等修复 + 上游 `enabled_agy`（两张表），set 21（保持现状）。
  - v21→v22：fork 的 `enabled_agy` 幂等补齐（两张表）+ 上游的 `enabled_kimi`（两张表），set 22（保持现状）。
  - v22→v23：fork 的 `enabled_kimi` 幂等补齐（两张表）**合并**上游的 `enabled_omp`（仅 `mcp_servers`），set 23。
  - v23→v24：幂等补 `enabled_kimi`（两张表）与 `enabled_omp`（仅 `mcp_servers`），set 24。用于「fork v4.0.19-1（user_version=23、有 kimi、无 omp）」与「上游 v4.0.20（user_version=23、有 omp、无 kimi）」两种库。
- `create_tables` 的 `mcp_servers` 含 `enabled_agy`/`enabled_kimi`/`enabled_omp`；`skills` 含 `enabled_agy`/`enabled_kimi`，**不含** `enabled_omp`。
- `database/dao/mcp.rs` 的 SELECT/INSERT 与 `AppType` 映射都加 `enabled_omp`；`MCP_SERVER_SELECT` 保持 fork 的 `pub(crate)` 可见性，列索引 `omp = row.get(17)`。
- 上游迁移测试（`migration_v22_to_v23_adds_enabled_omp_to_mcp_servers_only`、`kimi_*`、`agy_*`）使用 `SCHEMA_VERSION` 常量，自然跟随 24；v22 库依次经过 22→23、23→24，终态断言仍成立。
- 新增 v23→v24 幂等用例：`upstream_v23_migration_adds_kimi_flags_and_keeps_omp`、`fork_v23_migration_adds_omp_flag_and_keeps_kimi`；重复调用幂等。
- 降级：fork v24 库被上游 v4.0.20（v23）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 终态

- 托盘左键：保持 fork 四条分支（面板样式左键 Up 且面板未显示 → `tray::toggle_main_window`；面板已显示 → `tray_panel::toggle` 收起；右键 Up → `tray_panel::toggle`；原生菜单样式左键 Up → `toggle_main_window`、右键 Up → `mark_feedback_seen` 后交系统菜单）。`show_menu_on_left_click(false)` 两处固定，`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留。
- 本轮上游 `tray.rs` 只加 `AppType::Omp => "Oh My Pi"`、删除 `TrayTexts.balance_used_up`、改写 zh-TW 三条额度失败文案，不触碰 `TrayIconEvent::Click`。
- 应用内更新器：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；上游本轮未改 updater 相关函数，不采纳任何重放带入的更新器实现。
- Windows：本轮上游未改 MSI 模板；上一轮的 `REBOOT=ReallySuppress`、`CloseApplication`、可选桌面快捷方式与 `release.yml` Property 断言保持。本轮 Windows 相关改动是 omp 安装/升级识别（`d9422e7d6`、`misc.rs` 的 bun/nix 分支）与既有 agy 后台命令不弹控制台（v4.0.19 已落地）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订（`lib.rs`、`tray.rs`、`database/schema.rs`、`database/mod.rs`、`commands/misc.rs`、`settings.rs`、`services/provider/*`、`App.tsx`、`Sidebar.tsx`、`ProviderList.tsx`、`ClaudeFormFields.tsx`、`ProviderForm.tsx`、`PiProviderForm.tsx`、`KimiProviderForm.tsx`、`appConfig.tsx`、locale、版本与锁文件）。
  - 新增 §4.7「v4.0.20 轮的叠加要点」：omp 三类交集（Q1–Q3 结论）、schema 24 的两步迁移、`appOrder` 与侧栏面板并存、Pi 高级选项折叠与拉取模型弹窗、Copilot 自动路由适配、`tr.json` 取上游、`--ours` 陷阱、本轮重放与保真实测数字。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 24 与 22→23（fork Kimi 幂等 + 上游 omp 列合并）/ 23→24（Kimi + omp 幂等补齐）两步、降级不兼容。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q2 结果登记 omp 同时作来源与目标、读取顶层 `baseUrl`/`apiKey`、`defaultModel` 为空、与 Pi 同形状写入。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q3 结果登记 omp 不进入快捷切换、使用上游 Pi 家族当前状态与表单模型表。
- 本文件即全局能力规格，归档时保持为 v4.0.20 同步后的完整状态。

### 重放映射（实测）

- 同步前 `git rev-list --count v4.0.19..pre-sync-v420` = **182**。
- 重放后（代码终态 `HEAD` = `69ac8a2b4`）`git rev-list --count v4.0.20..HEAD` = **178** = 177 个重放提交 + 1 个本轮新增提交（`69ac8a2b4` `feat(fork): sync v4.0.20-1 with schema 24 and Oh My Pi fork semantics`）；其后的 Build 收尾文档提交（只改 Markdown）使最终 `HEAD` 的计数为 **179** = 177 + 2 个本轮新增提交，不改变重放映射。
- 被 git 判空丢弃 = **5 个**：`61beb2f1e`（README 重写）、`c7b452455`（3.20.1-1 版本号）、`e1cce2606`（README 更新日志）、`51e378a24`（3.20.2-1 版本号）、`6f6ffa507`（4.0.3-2 版本号）。原因：README 已在前序冲突解决中整文件取 fork 版；版本文件已对齐 v4.0.20 基线，旧版本号不重放。
- `git merge-base main v4.0.20` = `85ad4969b3399500baaea9d46b1e08f87aba80e1`（= `v4.0.20^{}`，annotated tag 对象 `79738d9`）；`git log --format='%an <%ae>' v4.0.20..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 主题序列（剔除 5 个判空提交）逐行 diff = **0 行**。
- patch-id（stdin 口径）：**134 相同 / 43 不同**。43 个不同中 **34 个为冲突停车**（均有 reflog `rebase (continue)` 记录，见下），**9 个未停车**、属 git 三方自动合并后树内容随新基线改写（文件集与增删行数相同；`a645e9483`/`40ef6b580`/`abb9ff81f`/`8e2752094`/`938d7124d`/`7b0509ff2`/`160fa5d28`/`0b2a0585d`/`bae37059d`）。
- rerere：`rerere.enabled=true` 全程开启；`.git/rr-cache` 今日新增 71 个文件级条目，无任何条目早于今日（无跨轮旧解法被自动套用）；同一轮内重复冲突复用同一 preimage/postimage，34 个停车点仍逐条复核。
- 冲突标记：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` = **0 命中**。重放中途不跑 `cargo test`（fork 历史提交自带冲突标记，最终态清除）。

### 落地保真核对（实测）

口径：对上游 `v4.0.19..v4.0.20` 改动过的每个文件（205 个，覆盖 51 个重叠文件）取 `git diff v4.0.19 v4.0.20 -- f` 的增/删行、`git diff v4.0.19 pre-sync-v420 -- f` 的 fork 增行，与最终 `HEAD` 内容；行 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行后做多重集差。

- 计算在 `69ac8a2b4`（版本/文案/schema/omp 交集/合并全部落地）之后执行；文档提交只改 Markdown，不在 205 个文件内，在 Build 收尾文档提交上复算同为 **14 / 18**。
- **上游新增行缺失 14 行（7 个文件）**：
  - `README.md` 7 行（十一工具标题、Twelve Tools 说明、共存式工具说明、`| Oh My Pi | Coexist |` 表格行、MCP 面板说明、十二工具支持段、文档段）：fork README 整文件重写，刻意取舍。
  - 四个版本文件各 1 行 `4.0.20`：fork 用 `4.0.20-1` 取代（预期流转）。
  - `database/mod.rs` 1 行 `SCHEMA_VERSION: i32 = 23`：fork 终态 24（撞号处理）。
  - `PiProviderForm.tsx` 2 行（`presets.map((preset, index) => ({`、`[presets]`）：fork 改为两步 `presetEntries` useMemo（编号后过滤，依赖 `[presets, isOmp]`），语义保留。
- **fork 新增行缺失 18 行（9 个文件）**：
  - 四个版本文件各 1 行 `4.0.19-1`：升级为 `4.0.20-1`（预期流转）。
  - `database/mod.rs` 1 行 `SCHEMA_VERSION = 23`：升为 24。
  - `database/schema.rs` 3 行（旧 22→23 日志与两处旧注释）：合并为「Kimi 幂等 + omp 列」并新增 23→24 臂后改写，语义保留。
  - `services/provider/live.rs` 1 行 `use crate::database::Database;`：上游重构后不再使用，已删除（无语义）。
  - `ClaudeFormFields.tsx` 4 行：选择器提取为 `apiFormatControl` 后由 Copilot 分支复用，格式化等价。
  - `PiProviderForm.tsx` 5 行：Q1/Q2 改为按 `appId`/`isOmp` 动态取值，Pi 行为不变。
- 有缺失的文件合计 10 个（7 个上游缺失文件与 9 个 fork 缺失文件的并集）；其余 195 个文件（含 154 个非重叠上游文件）双侧缺失均为 0。
- 旁证：`tr.json` 与 `v4.0.20` 逐字节一致（`cmp` 通过）；4 个 locale 新增键逐字落地、删除键零残留；`provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 继续为 fork 文案。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面 51 个文件（`comm -12 <(git diff --name-only v4.0.19 v4.0.20 | sort) <(git diff --name-only v4.0.19 pre-sync-v420 | sort)`；上游 205 文件 + fork 466 文件）。要点：

- **版本与仓库根**：`package.json`/`Cargo.toml`/`Cargo.lock`/`tauri.conf.json` 取上游内容后改版本 `4.0.20-1`，保留 fork 移除 updater 依赖、`repository` 指 tunecc、`codegen-units = 1`、`createUpdaterArtifacts: false`、`macOSPrivateApi: true`；`Cargo.lock` 接受 `prost` 依赖树，不得出现 updater 包。`README.md` 整文件保留 fork 版（刻意取舍）。
- **后端**：`lib.rs` 取上游 omp 模块/导入/命令注册，保留 fork 的无 Updater、托盘左键四分支、connectivity 命令注册与 `stream_check` 移除；`commands/misc.rs` 逐 hunk 取上游 omp 安装器并保留 4 处 tunecc URL；`settings.rs` 的 `app_order`/`omp_config_dir`/`VisibleApps.omp` 与 fork `VisibleSidebarPanels` 并存；`database/schema.rs` 按 schema 24 合并；`database/dao/mcp.rs` 加 `enabled_omp` 且保持 `MCP_SERVER_SELECT pub(crate)` 与列索引后移；`services/provider/{mod,live,pi}.rs` 取上游 omp 分支并保留 fork 的 `website_url_2`/`sanitize_claude_settings_for_live`/测试字面量；`tray.rs` 只加 omp 标签与文案删改，托盘左键不动；`provider.rs`/`deeplink/provider.rs`/`proxy/providers/mod.rs` 按上游加 omp 读取与拒绝分支，保留 `website_url_2`。
- **前端**：`App.tsx`/`Sidebar.tsx` 应用排序与 fork 面板过滤并存；`ProviderList.tsx`/`mutations.ts`/`ProviderActions.tsx` 的 Pi 家族判据改为 `isPiFamilyApp`；`ClaudeFormFields.tsx` 把 Copilot 提示适配到 `rightSlot`；`PiProviderForm.tsx` 取上游折叠高级选项/FetchedModelPicker/isOmp，叠加 fork 的导入、`websiteUrl2`、白名单；`ProviderForm.tsx` 用 `pi || omp` 分流；`ProviderPresetSelector.tsx` 的 `barAction` 与 fork `extraActions`/`categoryHint` 并存；`appConfig.tsx`/`types.ts` 加 omp 与 `appOrder`，保留 fork 面板默认值；`KimiProviderForm.tsx` 取上游官方账号编辑，保留 fork 白名单与编号顺序。
- **预设**：6 个 `*ProviderPresets.ts` 目录整份取上游（模型刷新、EveryAPI 移除），fork 只保留 `hidden?: boolean`；`ompProviderPresets.ts` 整体取上游，Q1 只在渲染层过滤。
- **本地化**：4 个 locale 保留 fork 键段并叠加/删除上游本轮键，按对象作用域查重；`tr.json` 整文件取上游、逐字节一致。
- **测试**：上游新增/改写用例（omp 预设、Pi 表单、AppsPage、KimiProviderForm、ClaudeFormFields、ProviderList、Add/EditProviderDialog、ProviderPresetSelector、ClaudeDesktopProviderForm、`ProviderForm.presetRows.golden`）与 fork 既有断言并存；`AppsPage` 的 `waitFor` 稳定性修正按 fork 口径重新套用。

#### 冲突停车清单（34 处）

| 类别 | 提交（旧 → 新） | 差异面与解法 |
| --- | --- | --- |
| 版本/同步 ×18 | `9ef503f51`、`d97a749dc→4d85cb3b3`、`fb1deb07f→18c6b402d`、`fb7cf5d96→3c53f1280`、`9b7d22651→bd390e62b`、`dcde5d755→1ab5b17d5`、`ca6b5e4cc→f308114bf`、`97efe1027→6f197e708`、`774219282→51582ea97`、`64787a358→e51eb91db`、`3645982eb→886ea6fb5`、`159c83a53→7109ff201`、`d6d7504ef→126f0a703`、`42b1a4417→252de5d74`、`9576f9a49→3947fa072`、`9e6b13956→29401fac9`、`808ebc4fa→1534ae3eb`、`195d1ef55→e4e2e1ff5` | 版本四文件：不重放旧版本号，取 fork 终态 `4.0.20-1`；保留 `createUpdaterArtifacts: false`、无 updater 依赖、`productName`；其余上游配置取上游。`v4.0.12` 另含 `PiProviderForm`（取上游重构结构 + fork 叠加），`v4.0.1` 另含 `tauri.conf.json` 与 `EditProviderDialog.test.tsx`（随上游基线），`v4.0.15` 的 `App.tsx` 行在基线下已不存在 |
| 功能 ×16 | `0b924aed3→2dc43860b` | `PiProviderForm.tsx`：白名单过滤套在上游预设 entries 上（编号先于过滤） |
| | `acae67672→1cc4ef658` | `ClaudeFormFields.tsx`：选择器提取为 `apiFormatControl`，放入 `rightSlot` 并承接 Copilot 分支 |
| | `60d053fea→e6e0f39b0` | `ClaudeFormFields.tsx`：宽度调整叠加在上游基线，增删行数相同 |
| | `1dee8168b→c84372d45` | `EndpointField.tsx`：`rightSlot` 插槽保留；`ClaudeFormFields` 使用点已在前一提交合并落地 |
| | `c059d5192→6d0a3b3e7` | `App.tsx`、`Sidebar.tsx`：面板显隐与 `orderAppIds(appOrder)` 并存 |
| | `2eec77be3→1877e0a0a` | `settings.rs`：`visible_sidebar_panels` 与 `app_order` 并存 |
| | `4406c6dbc→04dd3fafd` | 版本三文件：无 updater 插件/依赖/权限，更新命令空壳 |
| | `32f5d36ec→14c48ebd2` | `README.md`：已是 fork 整文件版，无 diff |
| | `8a410d5b3→2ef9458a5` | `README.md`：整文件取 fork 版（96/539） |
| | `ede15f059→06fe0f366` | 4 个 locale：保留 fork 键段，叠加上游新键并查重 |
| | `0d5061a24→c13b3c325` | `Cargo.lock`：要删的 stream_check 依赖在基线下已不存在 |
| | `9325cf6e3→c40eeb0ad` | `EditProviderDialog.test.tsx`：断言随上游基线少 1 行 |
| | `a4a0cebea→b2679aeeb` | `PiProviderForm.tsx`：导入入口叠加到重构表单，`appId` 参数化 |
| | `bec254cfc→983872308` | `dao/mcp.rs`、`database/schema.rs`：`enabled_omp` 接在 `enabled_kimi` 之后；迁移臂按 schema 24 合并 |
| | `bc2073b63` | `ClaudeFormFields.tsx`：对合并后内容重新 prettier 归一 |
| | `31dc62f48→2544d7ca2` | `database/mod.rs`、`database/schema.rs`、版本四文件：`SCHEMA_VERSION` 取 24，合并 22→23 并新增 23→24 臂 |

### fork 取舍清单

| 功能 | 上游本轮 | fork 处理 | 理由 |
| --- | --- | --- | --- |
| 应用顺序（拖拽/侧栏跟随） | 新增 `app_order` | 全量保留，与侧栏面板可见性并存 | 语义不同，互不替代 |
| 侧栏面板可见性 | 无 | 保留 `VisibleSidebarPanels` | fork 魔改，不与应用顺序冲突 |
| 模型徽章/快捷切换 | 无（只有应用级默认模型） | 保留，覆盖 claude/codex/gemini/grokbuild | omp 按 Q3 排除 |
| 跨应用导入 | 无 | 保留，omp 按 Q2 同时为来源与目标 | 与 Pi 对齐 |
| 官方预设白名单 | 无 | 保留，omp 按 Q1 仅本机推理三条 | 延续 fork 收敛口径 |
| Pi/omp 折叠高级选项与拉取模型弹窗 | 新增 | 全量保留，fork 的 Pi 魔改叠加 | 不同区域 |
| Copilot 自动协议路由 | 新增 | 保留上游语义，适配 fork 的 `rightSlot` 布局 | 布局差异，不取舍 |
| Kimi 官方账号模型编辑 | 新增 | 全量保留，fork 白名单叠加 | 不同区域 |
| 托管 ChatGPT 浏览器登录 | 新增 | 全量保留（含 `prost`） | 新能力 |
| 应用内更新器 | 无 | 继续禁用 | fork 契约 |
| 托盘左键 | 无（只加 omp 标签/文案） | 保留 fork 四条分支 | fork 契约 |
| README | 7/11 | 保留 fork 整文件 | fork 文档口径 |

### 预设 id 编号契约（延续 + omp 特例）

- Pi/Kimi/omp 的目录条目 `id` 一律为**原始数组下标**的字符串；白名单过滤必须发生在 `map((preset, index) => ({ id: String(index), preset }))` 之后，不得先过滤再编号。
- Kimi 的官方账号卡是独立条目 `kimi-official-account`，不属于目录数组；omp 没有独立的官方账号卡。
- omp 预设目录由 `piProviderPresets.map(toOmpPreset)` 派生，派生不得改变数组长度或顺序，因此下标与 Pi 目录一一对应。

### 本地化状态

- 4 个既有 locale 只增删上游本轮键，fork 专属键与文案原样保留；同一对象作用域不得出现同名重复键。
- `tr.json` 整文件取上游（土耳其语补全），不补 fork 键，与 `v4.0.20` 逐字节一致。
- 新增的 omp 相关 UI 文案全部来自上游 locale 键；fork 不新造 omp 文案（导入/白名单复用既有键）。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5`。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v420`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理。
- **`--ours` 是新基线**：rebase 中版本文件冲突禁止 `git checkout --ours`（那是上游 v4.0.20），本轮曾因此把 fork 字段清成上游版；应手工保留 fork 字段并改版本号，或从 `pre-sync-v420` 取回。
- `rerere` 可能把旧轮解法复用到新基线：复用后逐个复核，尤其是 `database/schema.rs` 与 4 个 locale。
- locale JSON 合并后可能出现同名重复键：locale JSON 会静默取后者、TS interface 会报 TS2300；合并后必须做对象作用域查重。
- `database/schema.rs` 的迁移臂按版本号分支，合并时不要改变既有臂的版本号；新增臂只加在末尾，`SCHEMA_VERSION` 与最后一个 `set_user_version` 必须同为 24。
- 上游 `database/tests.rs` 的 v22→v23 用例在 fork 24 下会多走一步 23→24；断言使用 `SCHEMA_VERSION` 常量，不要改回硬编码。
- `PiProviderForm.tsx` 的上游重构与 fork 改动面都很大；先取上游版本，再逐段回填 fork 的 `websiteUrl2`/导入/白名单/工具提取，避免整文件取一侧。
- `ClaudeFormFields.tsx` 的 fork 已删除经典 `apiFormatField`；上游的 Copilot 补丁若引用该变量，必须改写为 `rightSlot` 内的选择器，不得把旧布局带回来。
- `ompProviderPresets` 是运行期派生，不要在 fork 侧复制一份目录；白名单只在渲染层过滤。
- `tr.json` 不要因为 fork 缺键而回写；逐字节一致是本轮验收项。
- 上游新增的 `VisibleApps.omp` 使用 `#[serde(default)]`（既有设置缺键为 false），不要改成 `default_true`。
- `src-tauri/src/commands/misc.rs` 是上游大改动 + fork 小改动的组合面，最容易「整文件取一边」丢 URL 或丢 omp；解完必须双向 grep。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态；两者与上游逐字节相同。
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推同一 tag 对象；查 fork Actions 必须显式 `--repo tunecc/cc-switch`。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

### 版本号

- `4.0.20-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目；语义为「上游版本号 + `-N`」。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.20-1`。

### 交付（按 Q4 授权，2026-10-25 已确认）

- 验收通过、用户接受结果并归档后：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.20-1` 并 `git push origin v4.0.20-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.20-1` 核对远端指向，并用 `gh api --repo tunecc/cc-switch` 复核 Release run 的 status/conclusion。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 `__CCS_DEV_PANEL__` 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `VisibleSidebarPanels` 持久化）——与上游 `app_order`/`VisibleApps.omp` 同处 `types.ts`/`settings.rs`，多段并存。
- 供应商卡片模型徽章与快捷切换弹窗（claude/codex/gemini/grokbuild；omp 按 Q3 排除）、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 预设文件 `hidden` 字段 + 表单接线的「编号先于过滤」；Q1 新增 omp 三条）。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`lib.rs` 两个命令注册在位，`stream_check` 不回来；omp 维持上游的测试入口关闭）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路，含 `deeplink/provider.rs`、`proxy/model_mapper.rs`、`services/provider/mod.rs` 测试字面量里的 `website_url_2: None`）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支 + `tray_panel::panel_visible` + 源码级护栏）。
- 跨应用导入供应商配置（5 个 Form + `ProviderPresetSelector.extraActions`；Q2 决定 omp 同时为来源与目标）。
- 禁用应用内更新器（About 指向 tunecc Releases、启动自检取消、`install_update_and_restart` 空壳、无 updater 插件/依赖/AIP）。
- 对上游自带测试的稳定性修正（`apps-page-cache-race`、deeplink 开关初值 `waitFor` 等）。
- 上游 tag 的发版构建跳过与 fork CI 裁剪（`.github/workflows/{ci,release}.yml` 整文件保留，MSI REBOOT 断言保持）。
- README fork 差异说明与构建说明。
- omp 落地（上游能力全部可用：Apps 页安装/升级、Pi 家族表单/当前状态、会话/用量/prompts、MCP/Skills 开关、`enabled_omp` 迁移与持久化、deeplink 拒绝、无代理适配器）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

- `forkOfficialAllowlist`：3 个文件。
- `filterForkPresets`：6 个文件。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：4 个文件（列表不含 omp）。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：6 个文件。
- `websiteUrl2`/`website_url_2`：43 个文件。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：6 个文件。
- `ProviderImportEntry`/`readImportableProviderFields`：10 个文件。
- `tauri_plugin_updater`/`updater_builder`：0。
- `native_menu_on_left_click`：1 个文件（`tray.rs`，仅注释与护栏断言字符串；函数定义与调用点为 0）。
