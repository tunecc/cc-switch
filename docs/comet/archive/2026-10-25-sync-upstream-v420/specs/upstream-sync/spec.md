# 完整目标规格：upstream-sync（v4.0.20 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 annotated tag `v4.0.20`（tag 对象 `79738d9bf9fe846f698fe3586ba5b7b75309649c`，剥离提交 `85ad4969b3399500baaea9d46b1e08f87aba80e1`）；fork 版本号 `4.0.19-1` → `4.0.20-1`。`upstream/main` 比 tag 多 1 个提交（`de0a235ad`），按「只锁已发布 tag」约定不纳入。推送与 tag 属交付步骤，按 Q4 授权在验收通过并归档之后执行。

上游 `v4.0.19..v4.0.20` 共 39 个提交、205 个文件、+12058/−3050（13 新增 / 1 删除 / 191 修改），与 fork 的重叠面为 51 个文件（fork 侧自 `v4.0.19` 起改动 466 个文件、+56783/−2754）。本轮主轴是 **Oh My Pi（`omp`）成为第 13 个应用**：它复用 Pi 的表单、配置、当前状态、会话、MCP 与用量脚本管线，但 `models.yml` 有更严格的 schema 校验、默认模型只读自 `config.yml`；它与 fork 的「预设白名单」「跨应用导入」「模型徽章/快捷切换」三处正面相交，且上游把数据库 schema 从 22 升到 23（`mcp_servers` 加 `enabled_omp`），与 fork 已是 23 的 schema 撞车——fork 必须升到 24 并保留自己的 v21→v22 AGY、v22→v23 Kimi 幂等补齐。上游同时新增应用页拖拽排序与侧栏跟随（`settings.app_order`）、应用页已安装/未安装分组、Pi/omp 折叠高级选项与拉取模型选择弹窗、Kimi 官方账号模型编辑、托管 ChatGPT 账号浏览器登录（`prost`）、土耳其语补全、预设模型刷新（移除 EveryAPI）、Linux 窗口拖动/缩放，以及用量/托盘/会话修复。本规格描述 Q1–Q4 确认后的完整同步后状态。

**上游是否重写了 fork 已有功能——本轮结论：没有重复实现，四处同域但语义不同或只是新应用相交，均不构成二选一。**

1. 上游「应用拖拽排序 + 侧栏跟随」是应用顺序语义（`settings.app_order`），fork 的「侧栏面板可见性」是全局项显隐语义（`VisibleSidebarPanels`）；两者写不同键、改不同 UI，叠加并存。
2. 上游 Pi/omp 表单重构（折叠高级选项、拉取模型弹窗、omp 分支）与 fork 的 Pi 魔改（`websiteUrl2`、跨应用导入、白名单、`buildPiSettingsConfig` 提取）在同一文件的不同区域，叠加保留。
3. 上游 Copilot 自动协议路由（禁用「上游格式」选择并显示提示）与 fork 把该选择器移入 `EndpointField.rightSlot` 是布局差异；上游语义适配到 fork 布局，不涉及取舍。
4. omp（新应用）与 fork 三项功能相交，按 Q1–Q3 处理（见「fork 取舍清单」）。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.20` 剥离出的提交 `85ad4969`。
- `git merge-base main v4.0.20` == `85ad4969`；`git log v4.0.20..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 182 个 fork 提交（`git rev-list --count v4.0.19..HEAD`，起点 `1c10d67aa`）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径（与历轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v420`（= `1c10d67aa`）固定记录。
- 上一轮基线 tag `v4.0.19` = `319fbfd`（剥离 `d8983bb`）与 fork 发布 tag `v4.0.19-1` 保持不变。
- `upstream/main` 当前为 `de0a235ad`（tag 之后 1 个提交），本轮显式排除，不同步其他上游分支。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v420/` 产物。若 Comet Runtime 又追加托管忽略块，先作为独立 chore 提交再开始重放。

### 同步范围（v4.0.19..v4.0.20：39 提交、205 文件、+12058/−3050）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

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
- 新增 v23→v24 幂等用例：模拟上游 v23（有 omp、无 kimi）→ 24 后两表有 kimi、`mcp_servers` 保留 omp；模拟 fork v23（有 kimi、无 omp）→ 24 后 `mcp_servers` 有 omp、`skills` 仍无 omp；重复调用幂等。
- 降级：fork v24 库被上游 v4.0.20（v23）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 终态

- 托盘左键：保持 fork 四条分支（面板样式左键 Up 且面板未显示 → `tray::toggle_main_window`；面板已显示 → `tray_panel::toggle` 收起；右键 Up → `tray_panel::toggle`；原生菜单样式左键 Up → `toggle_main_window`、右键 Up → `mark_feedback_seen` 后交系统菜单）。`show_menu_on_left_click(false)` 两处固定，`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留。
- 本轮上游 `tray.rs` 只加 `AppType::Omp => "Oh My Pi"`、删除 `TrayTexts.balance_used_up`、改写 zh-TW 三条额度失败文案，不触碰 `TrayIconEvent::Click`。
- 应用内更新器：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；上游本轮未改 updater 相关函数，不采纳任何重放带入的更新器实现。
- Windows：本轮上游未改 MSI 模板；上一轮的 `REBOOT=ReallySuppress`、`CloseApplication`、可选桌面快捷方式与 `release.yml` Property 断言保持。本轮 Windows 相关改动是 omp 安装/升级识别（`d9422e7d6`、`misc.rs` 的 bun/nix 分支）与既有 agy 后台命令不弹控制台（v4.0.19 已落地）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订：`lib.rs` 行追加「v4.0.20 只加 omp 模块/导入/`get_omp_current_state`/`kimi_oauth_models`」；`tray.rs` 行追加「v4.0.20 只加 omp 标签、删 `balance_used_up`、改 zh-TW 文案」；`database/schema.rs` 行改为「v4.0.20 的 22→23 omp 列与 fork 23 撞车，终态 24」；`commands/misc.rs` 行（上游 omp 安装器 + fork tunecc URL）；`settings.rs` 行（omp/`appOrder` + fork 侧栏面板）；`PiProviderForm.tsx` 行（omp 分支/折叠高级选项 + fork 导入/websiteUrl2/白名单）；`KimiProviderForm.tsx` 行（官方账号模型编辑 + fork 白名单）；`ProviderList.tsx` 行（`isPiFamilyApp` + fork 徽章/右键菜单）；`ProviderForm.tsx` 行（`pi || omp` 分流 + fork 导入）；`ClaudeFormFields.tsx` 行（Copilot 自动路由 + fork 的 `rightSlot` 布局）；`App.tsx` 行（应用排序/Linux 缩放 + fork 侧边面板/连通性）；`appConfig.tsx` 行（omp 六处列表/`orderAppIds`/`isPiFamilyApp` + fork 侧边面板默认值）；`Sidebar.tsx` 行（排序 + 面板过滤）。
  - locale 行登记：fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`；上游本轮新增/删除键按上游落地。
  - 新增 §4.7「v4.0.20 轮的叠加要点」：omp 三类交集（Q1–Q3 结论）、schema 24 的两步迁移、`appOrder` 与侧栏面板并存、Pi 高级选项折叠与拉取模型弹窗、Copilot 自动路由适配、`tr.json` 取上游。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 24 与 22→23（fork Kimi 幂等 + 上游 omp 列合并）/ 23→24（Kimi + omp 幂等补齐）两步、降级不兼容。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q2 结果登记 omp 同时作来源与目标、读取顶层 `baseUrl`/`apiKey`、`defaultModel` 为空、与 Pi 同形状写入。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q3 结果登记 omp 不进入快捷切换、使用上游 Pi 家族当前状态与表单模型表。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态。

### 重放映射（口径与记录要求，实测数字在 Build 阶段回填）

- 同步前 `git rev-list --count v4.0.19..pre-sync-v420` 预期 == 182。
- 重放后 `git rev-list --count v4.0.20..HEAD` 与 182 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录。
- tag `v4.0.20` 是 annotated tag：tag 对象 `79738d9`，剥离提交 `85ad4969`；`git merge-base main v4.0.20` == `85ad4969`；`git log --format='%an <%ae>' v4.0.20..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.19..pre-sync-v420` 与重放后 `v4.0.20..HEAD`）差异必须为 0 行。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期的主要停车面：`database/schema.rs`、`database/tests.rs`、`lib.rs`、`commands/misc.rs`、`settings.rs`、`tray.rs`、`services/provider/{mod,live,pi}.rs`、`PiProviderForm.tsx`、`KimiProviderForm.tsx`、`ClaudeFormFields.tsx`、`ProviderList.tsx`、`App.tsx`、`appConfig.tsx`、`Sidebar.tsx`、4 个 locale、`README.md`、4 个版本文件、`tests/components/{AppsPage,ClaudeFormFields,ProviderList,ProviderPresetSelector}.test.tsx`。
- 冲突停车清单（交互式）在 Build 阶段逐条记录；rerere 复用的解法必须逐个复核。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。

#### 本轮实测（Build 阶段回填）

- 同步前 `git rev-list --count v4.0.19..pre-sync-v420` = **182**。
- 重放后（代码终态 `HEAD` = `69ac8a2b4`）`git rev-list --count v4.0.20..HEAD` = **178** = 177 个重放提交 + 1 个本轮新增提交（`69ac8a2b4` `feat(fork): sync v4.0.20-1 with schema 24 and Oh My Pi fork semantics`）。Build 收尾的文档提交（`docs(comet): register v4.0.20 sync fidelity, schema 24 and omp Q1-Q3`，只改 Markdown）使最终 `HEAD` 的计数为 **179** = 177 个重放提交 + 2 个本轮新增提交，不改变重放映射。
- 被 git 判空丢弃的提交 = **5 个**（182 − 5 = 177）：
  - `61beb2f1e` `docs: rewrite README to document fork differences vs upstream`：README 已在前序 README 提交的冲突解决中整文件取 fork 版，重放后无 diff。
  - `c7b452455` `chore: bump fork version to 3.20.1-1 after upstream v3.20.1 rebase`：版本四文件已对齐 v4.0.20 基线（终态统一改为 `4.0.20-1`），旧版本号不重放。
  - `e1cce2606` `docs(readme): 更新日志补充连通性测试、双官网链接与托盘左键切换`：README 同上，内容已在 fork 整文件版中。
  - `51e378a24` `chore: bump fork version to 3.20.2-1 after upstream v3.20.2 rebase`：同 `c7b452455`。
  - `6f6ffa507` `chore(release): bump version to 4.0.3-2`：同 `c7b452455`（当时对应 `Cargo.lock` 版本行亦已被基线取代）。
- `git merge-base main v4.0.20` = `85ad4969b3399500baaea9d46b1e08f87aba80e1`（= `v4.0.20^{}`，annotated tag 对象 `79738d9`）；`git log --format='%an <%ae>' v4.0.20..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 主题序列 `git log --format='%s' --reverse` 逐行 diff（剔除上述 5 个判空提交后）= **0 行**。
- patch-id 差异 = **43 处**（134 个与重放前逐字相同）：其中 **34 处为冲突停车**（全部在 reflog 留下 `rebase (continue)` 记录，逐条见下）；**9 处未停车**，属 git 三方自动合并后树内容随新基线改写（文件集与增删行数相同，差异为上游 v4.0.20 同区域 locale 键改写、README 已含 fork 终态文本、`package.json` 依赖已在基线中存在、历史冲突标记随基线重排）；另有 5 个判空提交不参与 patch-id 对照。
- 未停车的 9 处：`a645e9483→016ff0485`（模型搜索 i18n 键）、`40ef6b580→4b47a59b2`（模型快捷切换弹窗）、`abb9ff81f→1cd11b65f`（快捷切换归档提交）、`8e2752094→ccfd91c40`（右键置顶/置底）、`938d7124d→f0d4457d8`（连通性 UI 四项修复）、`7b0509ff2→15eaadfa7`（侧栏批量检测开关）、`160fa5d28→f870cd06f`（恢复 `tailwindcss-animate`）、`0b2a0585d→c21a23c19`（徽章作为快捷切换入口）、`bae37059d→06092f881`（托盘左键 README）。逐个复核：文件集与增删行数相同，无 fork 语义缺失；终态冲突标记零命中。
- rerere：`rerere.enabled=true` 全程开启；`.git/rr-cache` 今日新增 71 个文件级条目，**无任何条目早于今日**（按目录创建时间核对），即无跨轮旧解法被自动套用；同一轮内的重复冲突（版本四文件、locale 片段）复用同一 preimage/postimage，34 个停车点仍逐条复核并有 reflog `rebase (continue)` 记录。

### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.19..v4.0.20` 改动过的每个文件（205 个，覆盖 51 个重叠文件的全部）取 `git diff v4.0.19 v4.0.20 -- f` 的增/删行、`git diff v4.0.19 pre-sync-v420 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。非重叠的 154 个上游文件 fork 侧缺失应为 0。
- 计算必须在全部最终态提交（版本、文案、文档、schema、omp 交集、合并）落完之后，对最终 `HEAD` 执行；`HEAD` 之后的归档提交只改 Markdown，不在 205 个文件内，故数字不变。
- 预期的刻意取舍（逐行归因，具体行数在 Build 后按实测填写）：
  - `README.md`：fork 是整文件自有的「与上游的差别」文档；上游本轮 7 增/11 删不落地，全部归因为「fork 整文件替换」。
  - 版本与锁文件：上游 `"version": "4.0.20"` 行被 fork `4.0.20-1` 取代（4 个文件各 1 行）；fork 的 `4.0.19-1` 行被本轮终态升级（属预期流转）。
  - `database/mod.rs`：上游 `SCHEMA_VERSION: i32 = 23` 被 fork 24 取代（撞号处理）；fork 的 23 行升级为 24（预期流转）。
  - `database/schema.rs`：上游 22→23 的 omp 列与 `set_user_version(conn, 23)` 保留；fork v22→v23 臂的日志/注释可能因合并改写（语义保留）；新增 23→24 臂属 fork 新增行。
  - Q1 的 omp 白名单：只在 `PiProviderForm` 的预设映射后过滤，不改上游 `ompProviderPresets.ts`/`piProviderPresets.ts` 的条目行，故不产生上游行缺失；Q2 的 `readConfigFields("omp")` 写在 fork 自有文件 `src/utils/providerImport.ts`，不产生上游行缺失。
  - 上游 Pi 表单重构把 `piProviderPresets` 的引用改为 `presets`，fork 的白名单过滤需包住 `presets`；若因 prettier 压缩造成行形态差异，逐行归因为「格式化等价」。
  - `ProviderPresetSelector.test.tsx`、`AppsPage.test.tsx`、`ClaudeFormFields.test.tsx` 等 fork 既有断言行若因上游基线改写，逐行归因为「跟随上游基线更新」。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.20 HEAD -- <file>` 只看 fork 侧新增/删除。

#### 本轮实测（Build 阶段回填）

- 实测合计：**上游新增行缺失 14 行（7 个文件），fork 新增行缺失 18 行（9 个文件）**；205 个上游文件全部参与计算（51 个重叠文件 + 154 个非重叠文件）；有缺失的文件合计 10 个（7 个上游缺失文件与 9 个 fork 缺失文件的并集），其余 195 个文件双侧缺失均为 0。计算在版本/文案/schema/omp 交集/合并提交（`69ac8a2b4`）落完之后、对代码终态 `HEAD` = `69ac8a2b4` 执行；其后的文档提交只改 `docs/**` 与 Markdown，不在 205 个文件内，故数字不变；在 Build 收尾文档提交上复算同为 **14 / 18**。
- 上游新增行缺失逐项归因：
  - `README.md` 7 行（十一工具标题行、Twelve Tools 说明、共存式工具说明、`| Oh My Pi | Coexist |` 表格行、MCP 面板说明、十二工具支持段、文档段）：fork README 整文件重写，不采纳上游表格（刻意取舍）。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行版本号 `4.0.20`：fork 用 `4.0.20-1` 取代（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `pub(crate) const SCHEMA_VERSION: i32 = 23;`：fork 终态 24（撞号处理）。
  - `src/components/providers/forms/PiProviderForm.tsx` 2 行（`presets.map((preset, index) => ({`、`[presets]`）：fork 改成两步 `presetEntries` useMemo（编号后过滤，依赖 `[presets, isOmp]`），上游把编号内联进 `presetEntries` 的写法不再逐字存在，语义保留。
- fork 新增行缺失逐项归因：
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行 `4.0.19-1`：本轮终态升级为 `4.0.20-1`（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `SCHEMA_VERSION = 23`：升为 24（预期流转）。
  - `src-tauri/src/database/schema.rs` 3 行（v22→v23 旧日志「幂等补齐 Kimi 列」、两处旧注释「已是 v23 的库重跑迁移必须是 no-op」）：合并为「Kimi 幂等 + 上游 omp 列」的 22→23 臂并新增 23→24 臂后，日志/注释改写，语义保留。
  - `src-tauri/src/services/provider/live.rs` 1 行 `use crate::database::Database;`：上游重构后该导入不再使用，`cargo check` 报 unused import，已删除（无语义）。
  - `src/components/providers/forms/ClaudeFormFields.tsx` 4 行（`category !== "cloud_provider" ? (`、`<Select value={apiFormat} onValueChange={onApiFormatChange}>`、`"Gemini Native generateContent (需转换)"`、`) : undefined`）：把选择器提取为 `apiFormatControl` 后由上游 Copilot 自动路由分支复用，格式化等价。
  - `src/components/providers/forms/PiProviderForm.tsx` 5 行（`filterForkPresets("pi", piProviderPresets).map((preset) => preset.name)`、`return piProviderPresets`、`useProviderImportSources("pi")`、`appId: "pi"`、`appId="pi"`）：Q1/Q2 改为按 `appId`/`isOmp` 动态取值（`presets`、`appId`），omp 与 Pi 共用同一实现；Pi 行为不变。
- 说明：`tr.json` 与 `v4.0.20` 逐字节一致（`cmp` 通过）；4 个 locale 的新增/删除/改写键全部按上游落地；`provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 继续为 fork 文案，不构成缺失。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 51 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.19 v4.0.20 | sort) <(git diff --name-only v4.0.19 pre-sync-v420 | sort)`；上游 205 文件 + fork 466 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.19 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（5 个）

- **`package.json`**（1/1 / 2/2）：取上游内容，版本号改为 fork `4.0.20-1`；保留 fork 的 `dev:fork` script 与已移除的 `@tauri-apps/plugin-updater` 依赖。
- **`src-tauri/Cargo.toml`**（2/1 / 3/6）：取上游 `prost = "0.14"`，版本号改为 `4.0.20-1`；保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`。
- **`src-tauri/Cargo.lock`**（25/1 / 4/174）：接受上游 `prost` 及其依赖树新增；`cc-switch` 版本行改为 `4.0.20-1`；不得出现任何 updater 相关包。
- **`src-tauri/tauri.conf.json`**（1/1 / 5/11）：取上游内容，版本号改为 `4.0.20-1`；保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true` 与 fork 移除的 `trafficLightPosition`。
- **`README.md`**（7/11 / 96/543）：fork README 是整文件自有的「与上游的差别」文档；冲突按整文件保留 fork 版；上游本轮新增/删除行不落地，属刻意取舍。

#### 后端（15 个）

- **`src-tauri/src/lib.rs`**（11/0 / 32/42）：上游只新增 `omp_config` 模块、启动时 `import_omp_providers_from_live` 调用、`get_omp_current_state` 与 `kimi_oauth_models` 命令注册；fork 的无 Updater、托盘左键、connectivity 命令注册、`stream_check` 移除三段语义原样保留。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0、`.show_menu_on_left_click(false)` 在位、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册在位、omp 命令注册在位。
- **`src-tauri/src/commands/misc.rs`**（152/10 / 6/5）：上游新增 omp 安装/升级/版本/启动与测试（`VALID_TOOLS` 12 项含 `omp`、`OMP_INSTALL_UNIX`/`OMP_INSTALL_WINDOWS_SCRIPT`、npm 包 `@oh-my-pi/pi-coding-agent`、bun/nix 渠道规则）；fork 只把 `check_for_updates`、`portable_zip_url`、`open_portable_update_download` 及测试里的 URL 指向 tunecc。冲突时逐 hunk 取上游并保留 fork 的 URL，禁止整文件取一侧；解完 grep `farion1231/cc-switch/releases` 应为 0（README/文档除外）、`tunecc/cc-switch/releases` 在位。
- **`src-tauri/src/commands/mod.rs`**（2/0 / 2/2）：上游注册 `omp` 模块；fork 的 `connectivity_test` 模块声明保留、`stream_check` 维持移除。
- **`src-tauri/src/database/dao/mcp.rs`**（6/3 / 1/1）：上游在 SELECT/INSERT/`AppType` 映射加 `enabled_omp`；fork 的 `MCP_SERVER_SELECT` `pub(crate)` 可见性保留；SELECT 列顺序以 omp 结尾、`row.get(17)` 索引正确、INSERT 18 个参数。
- **`src-tauri/src/database/mod.rs`**（1/1 / 1/4）：`SCHEMA_VERSION` 取 fork 终态 24；fork 的注释与版本校验逻辑保留。
- **`src-tauri/src/database/schema.rs`**（42/1 / 338/3）：按「数据库 schema 终态」合并；`create_tables` 的 `mcp_servers` 加 `enabled_omp`（保留 `enabled_agy`/`enabled_kimi`），`skills` 只保留 AGY/Kimi；22 臂保持 fork 修复 + AGY + Kimi；23 臂合并 fork 的 Kimi 幂等补齐与上游 omp 列（set 23）；新增 24 臂幂等补 Kimi（两表）+ omp（仅 mcp，set 24）；上游 omp 迁移测试使用 `SCHEMA_VERSION`，新增 v23→v24 用例；fork 现有迁移测试保持通过。
- **`src-tauri/src/database/tests.rs`**（30/0 / 76/0）：保留 fork 既有 schema/migrate 测试，叠加合并上游 `migration_v22_to_v23_adds_enabled_omp_to_mcp_servers_only` 与新增 v23→v24 用例；两侧测试不得互相覆盖或重复定义同名用例。
- **`src-tauri/src/deeplink/provider.rs`**（6/1 / 1/0）：上游对 omp deeplink 返回错误；fork 的 `website_url_2: None` 保留在构造器字段列表里。
- **`src-tauri/src/provider.rs`**（20/2 / 45/1）：上游加 omp 的 `provider.base_url`/`apiKey` 读取（`omp_config::provider_base_url`/`resolve_usage_api_key`）；fork 的 `website_url_2` 字段、`UniversalProvider` 构造与测试字面量保留；合并后 omp 分支与 fork 的 `website_url_2` 构造并存。
- **`src-tauri/src/proxy/providers/mod.rs`**（4/2 / 1/0）：上游把 omp 加入无适配器分支（`ProviderType::from_app_type` 与 `get_adapter` 均返回 `None`）；fork 改动保留。
- **`src-tauri/src/services/provider/live.rs`**（18/3 / 44/0）：上游加 omp 的 `provider_exists_in_live_config`/`write_live_snapshot`/common-config/import 分支；fork 的 `sanitize_claude_settings_for_live` 与测试保留；omp 不得被 Claude sanitize 误伤。
- **`src-tauri/src/services/provider/mod.rs`**（77/11 / 4/0）：上游加 `mod omp`、`import_omp_providers_from_live`、`list/add/update/delete/remove/enable` 的 omp 分支、`update_usage_script` 的 `app_type` 参数，并改写 Kimi 官方账号编辑/移除语义；fork 的 4 行测试字面量 `website_url_2: None` 保留；Kimi 官方编辑以上游为准（fork 只在表单侧做白名单）。
- **`src-tauri/src/services/provider/pi.rs`**（17/4 / 1/0）：上游加 `$NAME` apiKey 解析与 omp 用量复用；fork 的 1 行改动（测试字面量）保留。
- **`src-tauri/src/settings.rs`**（52/2 / 47/0）：上游加 `VisibleApps.omp`（既有设置缺键为 `false`、`Default` 为 `true`）、`app_order`、`omp_config_dir`、`get_omp_override_dir`、`AppType::Omp` 分支与序列化测试；fork 的 `VisibleSidebarPanels` 整段保留，两段并存。`AppType::Pi | AppType::Mcode | AppType::Kimi` 扩展为 `| AppType::Omp`，与 fork 改动合并而不是二选一。
- **`src-tauri/src/tray.rs`**（33/24 / 75/6）：上游加 `AppType::Omp => "Oh My Pi"`、删 `balance_used_up`、改 zh-TW 三条文案；fork 的 `hide_main_window`/`toggle_main_window`、`apply_tray_style` 的 `set_show_menu_on_left_click(false)` 与源码护栏不动，不得把 `native_menu_on_left_click` 带回。

#### 前端（14 个）

- **`src/App.tsx`**（174/18 / 88/2）：上游加应用排序、默认活动应用、Linux 窗口拖动/缩放、omp 分支与 Pi 家族缓存失效；fork 的窗口标题、`visibleSidebarPanels`、`useConnectivityProbe`/批量测试、`websiteUrl2` 保留。排序与面板过滤的传参一并保留。
- **`src/components/providers/AddProviderDialog.tsx`**（7/5 / 1/0）：上游改用 `isPiFamilyApp` 并加 omp 分支；fork 的 1 行改动保留。
- **`src/components/providers/EditProviderDialog.tsx`**（8/7 / 2/0）：上游改用 `isPiFamilyApp` 并加 omp 分支；fork 的 Pi 内边距等 2 行改动保留。
- **`src/components/providers/ProviderList.tsx`**（20/13 / 229/10）：上游改用 `isPiFamilyApp`、`usePiCurrentState(..., appId === "omp" ? "omp" : "pi")`、`case "omp"`、`${appId}.current.*` 文案；fork 的徽章/快捷切换、右键置顶置底、分区与空状态改动保留。fork 里按 `appId === "pi"` 判断的家族语义改为 `isPiFamilyApp`，避免 omp 落入非 Pi 分支。
- **`src/components/providers/forms/ClaudeDesktopProviderForm.tsx`**（11/1 / 85/12）：上游加 Copilot 自动路由的禁用选择与提示；fork 的 85 行改动保留，Copilot 提示叠加到对应位置。
- **`src/components/providers/forms/ClaudeFormFields.tsx`**（16/2 / 276/221）：上游在 Copilot 预设下禁用「上游格式」并显示 `copilot.automaticFormatHint`；fork 已把该选择器移入 `EndpointField.rightSlot` 并删除经典 `apiFormatField`、新增兜底模型直达区/1M 全选等。合并时把「Copilot 禁用 + 提示」适配到 `rightSlot` 的选择器与两种布局，fork 的模型控件不得回退。
- **`src/components/providers/forms/KimiProviderForm.tsx`**（107/50 / 11/4）：上游加 `officialSlot`、`kimiOAuthApi.models` 目录克隆、官方账号可编辑/移除与 “No subscription”；fork 的 `KIMI_ALLOWED_PRESET_NAMES` 白名单与「先编号再过滤」保留，`PRESETS` 仍为 `[官方账号卡, ...过滤后的目录]`。
- **`src/components/providers/forms/PiProviderForm.tsx`**（252/84 / 65/43）：上游加 `appId`/`isOmp`、omp 预设与根受控键、折叠高级选项、`FetchedModelPicker`、providerKey 查重与模型校验；fork 的 `websiteUrl2`、跨应用导入（Q2：`appId` 动态、`useProviderImportSources` 动态）、白名单过滤、`buildPiSettingsConfig` 工具提取保留。omp 的导入目标配置复用 `buildPiSettingsConfig`。
- **`src/components/providers/forms/ProviderForm.tsx`**（1/1 / 183/43）：上游把 `pi` 分流改为 `pi || omp`；fork 的 183 行改动（Kimi 早退、导入、布局等）保留。
- **`src/components/providers/forms/ProviderPresetSelector.tsx`**（3/1 / 18/10）：上游只把 `OmpProviderPreset` 加入 `AnyPreset`；fork 的 `extraActions`/`categoryHint` 与上游 `barAction` 并存。
- **`src/components/shell/Sidebar.tsx`**（5/2 / 12/2）：上游改用 `orderAppIds(settings?.appOrder)` 排序；fork 的全局项 `visibleSidebarPanels` 过滤保留。合并顺序：排序 → `visibleApps` 过滤 → 全局项面板过滤。
- **`src/config/appConfig.tsx`**（47/1 / 9/1）：上游加 omp 到六处列表、`orderAppIds`、`PI_FAMILY_APP_IDS`/`isPiFamilyApp`、omp 图标；fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS` 保留。
- **`src/lib/query/mutations.ts`**（14/12 / 63/0）：上游改用 `isPiFamilyApp` 与 `invalidatePiProviderCaches(queryClient, appId)`、omp 缓存失效；fork 的 63 行改动保留，凡 fork 侧按 `appId === "pi"` 的 Pi 家族判断改为 `isPiFamilyApp`。
- **`src/types.ts`**（6/0 / 14/0）：上游加 `VisibleApps.omp`、`Settings.appOrder`/`ompConfigDir`、`McpApps.omp`；fork 的 `websiteUrl2`、`VisibleSidebarPanels` 保留。

#### 预设（6 个）

- **`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（60/60、5/4、562/280、952/614、408/228、269/248 / 各 2/0）：目录内容整份取上游（模型刷新、EveryAPI 移除、oop/omp 派生基础）；fork 只保留各接口的 `hidden?: boolean` 两行。白名单条目（`Ollama`/`LM Studio`/`llama.cpp`/`vLLM`/官方名）在上游目录中仍逐字存在；`Ollama Cloud` 不在 fork 白名单内，继续隐藏。

#### 本地化（4 个）

- **`src/i18n/locales/{en,ja,zh-TW,zh}.json`**（70/9、70/9、71/10、71/10 / 328/25、315/24、315/24、327/24）：保留 fork 键段（含 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 的 fork 文案、供��商导入、模型快捷切换、onn/omp 相关 fork 键），叠加/删除上游本轮键；不得出现同名重复键。`tr.json` 不在重叠面，整文件取上游。

#### 测试（7 个）

- **`tests/components/AddProviderDialog.test.tsx`**（58/0 / 3/0）：上游 omp 用例 + fork 既有 3 行断言并存。
- **`tests/components/AppsPage.test.tsx`**（148/5 / 12/6）：上游分组/拖拽/omp 用例 + fork 的 `waitFor(updateButton(...))` 稳定性修正并存；`APP_IDS.length` 与硬编码数量按上游口径更新。
- **`tests/components/ClaudeDesktopProviderForm.test.tsx`**（7/0 / 14/0）：上游 Copilot 用例 + fork 断言并存。
- **`tests/components/ClaudeFormFields.test.tsx`**（11/0 / 140/0）：上游 Copilot 用例 + fork 的 `rightSlot`/模型控件断言并存。
- **`tests/components/EditProviderDialog.test.tsx`**（29/0 / 47/0）：上游 omp 用例 + fork 断言并存。
- **`tests/components/ProviderPresetSelector.test.tsx`**（2/2 / 33/0）：上游基线改写 + fork 的 `extraActions`/白名单断言并存。
- **`tests/components/__snapshots__/ProviderForm.presetRows.golden.test.tsx.snap`**（9/23 / 10/0）：按合并后的预设目录重新生成快照，fork 的行保持存在。

#### fork 自有文件与 omp 适配（不在重叠面）

- **`src/config/forkOfficialAllowlist.ts`**：新增 `omp: ["Ollama", "LM Studio", "vLLM"]`（Q1），其余条目不动。
- **`src/utils/providerImport.ts`**：新增 `case "omp"`（读顶层 `baseUrl`/`apiKey`，`defaultModel` 为空）与写方向 `case "omp"`（复用 `buildPiSettingsConfig`/就地覆盖 `baseUrl`/`apiKey`）（Q2）。
- **`src/components/providers/forms/PiProviderForm.tsx`** 的导入部分：`useProviderImportSources(isOmp ? "omp" : "pi")`、`useProviderImportApply({ appId })`、`<ProviderImportEntry appId={appId} …>`，编辑模式保留模型表/providerKey。
- **`src/components/providers/ProviderActions.tsx`**：fork 自有组件，把 `appId === "pi"` 的状态变更保护/删除保护改为 `isPiFamilyApp(appId)`，使 omp 获得与 Pi 一致的提示与保护。
- **`src/utils/providerModelUtils.ts`**：`MODEL_CAPABLE_APPS` 保持 `["claude","codex","gemini","grokbuild"]`（Q3），不加 omp。
- **`src/components/providers/ProviderCard.tsx` / `ProviderCardActions.tsx`**：fork 徽章按 `isModelCapableApp` 判定，omp 自动不显示；右键置顶/置底对 omp 照常可用。
- **`src/config/forkPresetFilter.ts`**：判定实现不改；omp 复用同一过滤函数。
- **`src/components/providers/forms/ProviderImportEntry.tsx`** / `hooks/useProviderImportApply.ts`：保持通用实现，靠传入的 `appId` 工作，不写 omp 特例。

#### 冲突停车清单（本轮实测 34 处，按重放顺序）

「差异面」= 该提交重放前后 `git show --numstat` 不一致的文件（冲突解决实际落点）；未列出的文件与重放前逐字相同。

**版本与发布同步提交（18 处）**

| # | 提交（旧 → 新） | 差异面 | 解法 |
| --- | --- | --- | --- |
| 1 | `c268503d1→9ef503f51`（3.19.2-fork.1 版本 + 产品改名） | `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` | 版本行不重放旧值（基线已是 4.0.20，终态统一 `4.0.20-1`）；产品名保持 fork 终态 |
| 2 | `d97a749dc→4d85cb3b3`（v3.20.3 同步 + GitHub 链接） | 版本四文件 | 取上游内容，保留 fork 版本号与 tunecc 品牌链接；不引入旧版本值 |
| 3 | `fb1deb07f→18c6b402d`（v3.20.4） | 版本四文件 | 同上 |
| 4 | `fb7cf5d96→3c53f1280`（v4.0.1） | 版本四文件、`tauri.conf.json`、`EditProviderDialog.test.tsx` | 版本行取 `4.0.20-1`；保留 `createUpdaterArtifacts: false`、无 updater 依赖、`productName`；测试断言随上游基线 |
| 5 | `9b7d22651→bd390e62b`（v4.0.2） | 版本四文件 | 同上 |
| 6 | `dcde5d755→1ab5b17d5`（v4.0.3） | 版本四文件 | 同上 |
| 7 | `ca6b5e4cc→f308114bf`（v4.0.4） | 版本四文件 | 同上 |
| 8 | `97efe1027→6f197e708`（v4.0.5） | 版本四文件 | 同上 |
| 9 | `774219282→51582ea97`（v4.0.6） | 版本四文件 | 同上 |
| 10 | `64787a358→e51eb91db`（v4.0.7） | 版本四文件 | 同上 |
| 11 | `3645982eb→886ea6fb5`（v4.0.8） | 版本四文件 | 同上 |
| 12 | `159c83a53→7109ff201`（v4.0.9） | 版本四文件 | 同上 |
| 13 | `d6d7504ef→126f0a703`（v4.0.10） | 版本四文件 | 同上 |
| 14 | `42b1a4417→252de5d74`（v4.0.12） | 版本四文件、`PiProviderForm.tsx` | 版本同上；Pi 表单取上游重构后的结构，fork 的导入/白名单改动叠加（该提交 +1 行） |
| 15 | `9576f9a49→3947fa072`（v4.0.15） | 版本四文件、`App.tsx` | 版本同上；`App.tsx` 该行在上游基线下已不存在，无需重放 |
| 16 | `9e6b13956→29401fac9`（v4.0.16） | 版本四文件 | 同上 |
| 17 | `808ebc4fa→1534ae3eb`（v4.0.17） | 版本四文件 | 同上 |
| 18 | `195d1ef55→e4e2e1ff5`（v4.0.18） | 版本四文件 | 同上 |

**功能提交（16 处）**

| # | 提交（旧 → 新） | 差异面 | 解法 |
| --- | --- | --- | --- |
| 19 | `0b924aed3→2dc43860b`（官方预设过滤接线） | `PiProviderForm.tsx` | 白名单过滤套在上游重构后的预设 entries 上（编号先于过滤），+1 行 |
| 20 | `acae67672→1cc4ef658`（接口格式选择器移到请求地址旁） | `ClaudeFormFields.tsx` | 选择器提取为 `apiFormatControl` 并放入 `EndpointField.rightSlot`；同时承接上游 Copilot 自动路由分支 |
| 21 | `60d053fea→e6e0f39b0`（加宽格式选择器） | `ClaudeFormFields.tsx` | 类名/宽度调整叠加在上游基线上，文件集与增删行数相同 |
| 22 | `1dee8168b→c84372d45`（选择器移入 `rightSlot`） | `EndpointField.tsx` | `rightSlot` 插槽改动保留；`ClaudeFormFields` 的使用点已在前一提交合并落地，本提交不再重复 |
| 23 | `c059d5192→6d0a3b3e7`（侧栏面板显隐） | `App.tsx`、`Sidebar.tsx` | 保留 `visibleSidebarPanels` 过滤；与上游 `orderAppIds(appOrder)` 并存（先排序再按面板过滤） |
| 24 | `2eec77be3→1877e0a0a`（后端持久化面板设置） | `settings.rs` | `visible_sidebar_panels` 字段与上游 `app_order` 字段并存于 `AppSettings`/`Default` |
| 25 | `4406c6dbc→04dd3fafd`（禁用应用内更新器） | 版本三文件 | 无 updater 插件/依赖/权限；`install_update_and_restart` 空壳；版本行保持 fork 值 |
| 26 | `32f5d36ec→14c48ebd2`（归档改名 change） | `README.md` | README 已是 fork 整文件版，该行无 diff |
| 27 | `8a410d5b3→2ef9458a5`（README 构建说明） | `README.md` | 整文件取 fork README（96/539），上游 v4.0.20 的 README 改写不采纳 |
| 28 | `ede15f059→06fe0f366`（连通性组件 + 四语言文案） | `src/i18n/locales/{en,ja,zh-TW,zh}.json` | 保留 fork connectivity/devpanel 键段，叠加上游 v4.0.20 新增键并按对象作用域查重（各 locale +8 行新增） |
| 29 | `0d5061a24→c13b3c325`（移除 stream_check） | `src-tauri/Cargo.lock` | 该提交原要删除的 stream_check 依赖在 v4.0.20 基线下已不存在，重放无 diff |
| 30 | `9325cf6e3→c40eeb0ad`（双官网链接） | `tests/components/EditProviderDialog.test.tsx` | 断言随上游基线少 1 行，功能行不变 |
| 31 | `a4a0cebea→b2679aeeb`（跨应用导入） | `PiProviderForm.tsx` | 导入入口叠加到上游重构表单：`FetchedModelPicker` 导入块与 `ProviderImportEntry` 并存，`appId` 参数化 |
| 32 | `bec254cfc→983872308`（v20→v21 修复迁移） | `database/dao/mcp.rs`、`database/schema.rs` | `MCP_SERVER_SELECT` 保留 `pub(crate)` 并把 `enabled_omp` 接在 `enabled_kimi` 之后；schema 迁移臂按 schema 终态合并（语义见「数据库 schema 终态」） |
| 33 | `bc2073b63`（prettier 归一 ClaudeFormFields） | `ClaudeFormFields.tsx` | 对合并后的最新内容重新归一（68/80） |
| 34 | `31dc62f48→2544d7ca2`（v4.0.19-1 同步提交） | `database/mod.rs`、`database/schema.rs`、版本四文件 | `SCHEMA_VERSION` 取 24；旧 v22→v23 臂被合并为「Kimi 幂等 + omp 列」，并新增 23→24 臂；版本行由后续 `69ac8a2b4` 统一为 `4.0.20-1` |

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
- `tr.json` 整文件取上游（土耳其语补全），不补 fork 键。
- 新增的 omp 相关 UI 文案全部来自上游 locale 键；fork 不新造 omp 文案（导入/白名单复用既有键）。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5`。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v420`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理。
- `rerere` 可能把 v4.0.19 轮的解法复用到新基线：复用后逐个复核，尤其是 `database/schema.rs` 与 4 个 locale。
- locale JSON 合并后可能出现同名重复键：locale JSON 会静默取后者、TS interface 会报 TS2300；合并后必须做对象作用域查重。
- `database/schema.rs` 的迁移臂按版本号分支，合并时不要改变既有臂的版本号；新增臂只加在末尾，`SCHEMA_VERSION` 与最后一个 `set_user_version` 必须同为 24。
- 上游 `database/tests.rs` 的 v22→v23 用例在 fork 24 下会多走一步 23→24；断言使用 `SCHEMA_VERSION` 常量，不要改回硬编码。
- `PiProviderForm.tsx` 的上游重构与 fork 改动面都很大；先取上游版本，再逐段回填 fork 的 `websiteUrl2`/导入/白名单/工具提取，避免整文件取一侧。
- `ClaudeFormFields.tsx` 的 fork 已删除经典 `apiFormatField`；上游的 Copilot 补丁若引用该变量，必须改写为 `rightSlot` 内的选择器，不得把旧布局带回来。
- `ompProviderPresets` 是运行期派生，不要在 fork 侧复制一份目录；白名单只在渲染层过滤。
- `tr.json` 不要因为 fork 缺键而回写；逐字节一致是本轮验收项。
- 上游新增的 `VisibleApps.omp` 使用 `#[serde(default)]`（既有设置缺键为 false），不要改成 `default_true`，否则老用户会突然多出一个应用。

### 版本号

- `4.0.20-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.20-1`。

### 交付（按 Q4 授权）

- 验收通过、用户接受结果并归档后：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.20-1` 并 `git push origin v4.0.20-1`。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.20-1` 核对远端指向；Release CI 仅 Windows x64 与 macOS arm64 unsigned。

### fork 魔改保留清单（同步后必须仍然存在且可用）

1. 产品名 CC Switch、DevPanel（`dev:fork`）与 fork 构建标记 `IS_FORK_BUILD`。
2. 侧栏面板可见性（`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS`、`GeneralSection` 开关）。
3. 模型徽章与快捷切换（claude/codex/gemini/grokbuild；omp 按 Q3 排除）。
4. Claude 兜底模型直达区、1M 全选与角色模型映射的「非高级」判定。
5. 供应商右键置顶/置底、新建插入第二位。
6. 官方预设白名单（`forkOfficialAllowlist` + `filterForkPresets`；omp 按 Q1 仅本机推理三条）。
7. 逐模型连通性测试（`connectivity_test_provider_models`/`connectivity_probe_provider`、`shouldShowTestEntry`）。
8. 双官网链接（`websiteUrl`/`websiteUrl2` 后端字段与前端展示）。
9. 跨应用导入（`providerImport.ts`、`ProviderImportEntry`、各表单入口；omp 按 Q2 既是来源也是目标）。
10. 禁用应用内更新器（无插件/依赖/权限，`install_update_and_restart` 空壳）。
11. README 的 fork 说明与 fork CI。
12. 托盘左键切换主窗口与源码护栏。
13. 测试稳定性修正（AppsPage 的 `waitFor` 等）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

- `forkOfficialAllowlist`：3 个文件（`src/config/forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`PiProviderForm.tsx` 等接线）。
- `filterForkPresets`：6 个文件（过滤函数 + 5 处表单/测试接线）。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：4 个文件（`providerModelUtils.ts` 与卡片/动作/测试），列表仍为 claude/codex/gemini/grokbuild，不含 omp。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：6 个文件（前端设置、侧栏、类型、后端 `settings.rs`、测试）。
- `websiteUrl2`/`website_url_2`：43 个文件（后端迁移/DAO/构造器、deeplink、前端双链接、测试）。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：6 个文件（`lib.rs` 注册、命令与服务、前端 API、hooks）。
- `ProviderImportEntry`/`readImportableProviderFields`：10 个文件（组件、hooks、`providerImport.ts` 与各表单/测试）。
- `tauri_plugin_updater`/`updater_builder`：0。
- `native_menu_on_left_click`：1 个文件（`src-tauri/src/tray.rs`，仅注释与护栏断言的字符串常量；函数定义与调用点均为 0）。
