# 完整目标规格：upstream-sync（v4.0.19 轮）

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 tag `v4.0.19`（annotated tag 对象 `319fbfd`，剥离提交 `d8983bb`）；fork 版本号 `4.0.18-1` → `4.0.19-1`。推送与 tag 属交付步骤，按 Q4 授权在验收通过并归档之后执行。

上游 `v4.0.18..v4.0.19` 共 47 个提交、215 个文件、+16010/−2351（35 新增 / 1 删除 / 179 修改），与 fork 的重叠面为 47 个文件（fork 侧自 `v4.0.18` 起改动 461 个文件）。本轮主轴是 **Kimi Code 成为第 12 个应用**：它与 fork 的「预设白名单」「跨应用导入」「模型徽章/快捷切换」三处正面相交，且上游把数据库 schema 从 21 升到 22（`mcp_servers`/`skills` 加 `enabled_kimi`），与 fork 已是 22 的 schema 撞车——fork 升到 23 并保留自己的 v21→v22 AGY 幂等补齐。上游同时重构了用量页（删除 `UsageDataSourcesSheet`，新增 `UsageSettingsSheet`/`ChecklistMenu`/`RequestLogColumnsMenu`）、给卡片更多菜单加「设为默认 + 默认模型子菜单」、给 Pi 表单补 providerKey 常显与重复校验。

**上游是否重写了 fork 已有功能——本轮结论：没有完全重复实现。** 上游的「设为默认/默认模型子菜单」是 OpenCode/OpenClaw 的**应用级**默认语义，fork 的模型快捷切换改的是**供应商自身 settingsConfig**，应用集合与写入目标都不同，两份实现并存；上游的 Pi providerKey 重复校验与 fork 的 Pi 预设白名单/本地预设入口互补；Kimi 是新增应用，与 fork 三项功能的交集按 Q1–Q3 处理。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.19` 剥离出的提交 `d8983bb`。
- `git merge-base main v4.0.19` == `d8983bb`；`git log v4.0.19..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 178 个 fork 提交（`git rev-list --count v4.0.18..HEAD`，起点 `b893ec999` = origin/main）按原顺序重放，外加本轮的同步终态提交、文档收尾提交与归档提交。
- 重放映射核对口径（与历轮一致）：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v419`（= `b893ec999`）固定记录。
- 上一轮基线 tag `v4.0.18` = `81096e4`（剥离 `cb90a2440`）与 fork 发布 tag `v4.0.18-1` 保持不变。
- `upstream/main` 与剥离提交一致（`v4.0.19..upstream/main` 为 0 提交），本轮不存在 tag 之后的上游提交需要排除。
- 重放开始前先提交 `.gitignore` 里 Comet Runtime 追加的托管忽略块（archive staging / runtime lock 等），使工作树干净；上游本轮不触碰 `.gitignore`。

#### 本轮实测（2026-10-24）

- 同步前 `git rev-list --count v4.0.18..pre-sync-v419` = **178**。
- 重放后（代码终态 `31dc62f48`）`git rev-list --count v4.0.19..HEAD` = **180**：178 个重放提交 + 2 个本轮新增提交（`fc69fbc83` `chore(native): ignore Comet managed runtime state`、`31dc62f48` `feat(fork): sync v4.0.19-1 with schema 23 and Kimi fork semantics`）；**无提交被 git 判空丢弃**。文档收尾与归档提交另计，不改变 178 个重放提交的 1:1 映射。
- `git merge-base main v4.0.19` == `d8983bb10b82a1ccc15ae5f44ab070902623e990`；`git log --format='%an <%ae>' v4.0.19..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 主题序列 `git log --format='%s' --reverse` 逐行 diff = **0 行**。
- patch-id 差异 = **11 处**：仅 hunk 位移 1 处（#72），冲突停车 10 处（#2、#30、#43、#69、#74、#101、#117、#128、#137、#174）；其余 167 个提交与重放前逐字相同。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 0 命中。

### 同步范围（v4.0.18..v4.0.19：47 提交、215 文件、+16010/−2351）

上游本轮改动按功能分组（详细到提交号，便于后续核对落地保真）：

1. **Kimi Code 接入（11 提交）**：`e4873bc8a`（Kimi Code 支持）、`7da255387`（官方 OAuth 登录与供应商切换）、`07265bc97`（授权中心支持多个官方账号）、`cdd2190df`（官方账号识别、删除与额度）、`c49c2be94`（授权中心用共享账号组渲染）、`44e0fc963`（多账号命名 `Kimi 订阅 <nickname>`）、`d6a232419`（卡片真实添加/删除动作）、`b61e2767c`（拉取模型列表并用 models.dev 补参数）、`8969264b9`（说明不直观的模型能力）、`b96ff6182`（请求头折叠进高级选项）、`0f7682900`（编辑器布局对齐 Pi/OpenCode）。
2. **用量页重构与修复（6 提交）**：`79ba7982a`（布局重构：删除 `UsageDataSourcesSheet`，新增 `UsageSettingsSheet`/`ChecklistMenu`/`RequestLogColumnsMenu`/`usageRange`）、`29f8bef37`（总数缩小时 clamp 请求日志页码）、`c6f85464e`（恢复趋势图/热力图原始配色）、`50e091b05`（7/14/30 天预设按日历日跨 DST 回退）、`e53ca7e82`（收紧请求日志列间距）、`e88ff5404`（Codex 父缓存计数断言按测试目录隔离）。
3. **卡片、菜单与表单（6 提交）**：`e12415b5b`（OpenCode/OpenClaw 的设为默认移入更多菜单并带默认模型子菜单）、`7cc3141ca`（共存式默认供应商用蓝色标记）、`1c52fa918`（删除被拒时重读共存式客户端状态）、`1e2559ef9`（Pi providerKey 常显并提示重复）、`03707c400`（Pi 使用共用必填星号）、`d6db0c757`（高级选项开关按下不跳动）。
4. **赞助商与预设（5 提交）**：`717172bd6`（DIT.ai 链接改 ccswitch referral）、`069c7fac1`（BuyToken 八个 app）、`91d3ed101`（V-API 九个 app）、`e85ade714`（FluxA TokenPlan 与 Shengsuanyun 赞助位互换）、`3494d0d10`（V-API backup endpoints）。
5. **其他修复（17 提交）**：`91fc2fcbf`（Codex stack comp_hash 按工具协议拆分）、`ce098caf2`（about 的 shell 版本探测脱离控制终端）、`0640c6fcc`（Codex 填充模型元数据时不禁用图片输入）、`f4e9211a1`（Escape 只关闭最上层全屏面板）、`93e33d110`（Apps 页未安装工具去掉重复错误行）、`535d12831`（OpenCode Zen/Go 旧地址匹配迁移后的 models.dev 条目）、`c8f85674f`（统一 MCP 面板显示名）、`52652a02d`（会话项目组头整行可点）、`2e1e29795`（代理识别 Codex session header 别名）、`c3ad9bb0b`（`/apps/anthropic` 地址尝试兼容模式 models 端点）、`e5b04221f`（Claude Keychain 凭据按账号选择）、`b5aa7fbbc`（agy 直查 Google 时显示 Gemini 额度）、`2fbd9c70f`（Hermes 位于 WSL 时在 WSL 内启动 dashboard）、`7ecce7c79`（Claude 客户端的加密思考转为空 thinking）、`10e0aa238`（已完成的 deeplink 导入不再关闭新链接的确认）、`9cb6b6d7f`（Windows 后台 agy 命令不弹控制台）、`bada9a4bb`（模型元数据不借用指向他厂的 vendor-hosted 条目）。
6. **发布相关（2 提交）**：`a043b1f86`（四处版本号 4.0.19）、`d8983bb10`（3 份 release notes + `src/whats-new/4.0.19.json`）。

### Kimi 应用终态

Kimi Code 是第 12 个应用、第 11 个 CLI 工具，行为属于「共存式（additive）」：

- **无 `current_provider_kimi` 设置**：`VisibleApps.kimi` 存在；`get_current_provider`/`set_current_provider` 对 Kimi 与 Pi/Mcode 一样返回 `None`/空操作；当前供应商由 `kimi_config::current_provider()` 从 `~/.kimi-code/config.toml` 的 `default_model → models[].provider` 解析。
- **独立表单**：`ProviderForm` 在 wrapper 首段分流 `if (props.appId === "kimi") return <KimiProviderForm {...props} />`；Kimi 不进入通用表单/导入 UI。表单以 JSON 编辑器 + 结构化字段编辑 `KimiProviderConfig`（`{ provider: {...}, models: {...} }`），提交时 `JSON.stringify`，由 `AddProviderDialog`/`EditProviderDialog` 解析成对象后入库。
- **预设目录**：`kimiProviderPresets` 从 `piProviderPresets` 派生，只接受有原生协议等价物的条目（排除 bedrock、`source.compat`、无模型）；Kimi 家族 4 条（`Kimi`/`Kimi Global`/`Kimi For Coding`/`Kimi For Coding Global`）+ 第三方/聚合站/赞助商 + 本机推理 3 条（`Ollama`/`LM Studio`/`vLLM`）。目录条目 `id = String(原始数组下标)`；官方账号卡是独立条目 `Kimi Official`，id `kimi-official-account`，不属于目录数组。
- **providerKey**：常显；新增时要求 `^[a-z0-9]+(-[a-z0-9]+)*$` 且不得与已有 provider 键重复（`kimi.form` 错误键由 `translateKimiProviderMutationError` 翻译）；编辑时不可改。
- **模型表**：提交要求 `models` 非空且每项 `model` 与 `max_context_size` 有效；支持 `fetchModelsForConfig` 拉取与 models.dev 元数据补全。
- **卡片与列表**：官方卡通过 `isOfficialAccount(appId, provider)` 判定，显示 `KimiAccountQuotaFooter`（按卡片 id 查授权中心账号额度）；官方卡不可复制、不可删除；`onTest` 对 Kimi 关闭；`ProviderList` 用 `kimiCurrentId`、`isInConfig`（`meta.liveConfigManaged`）与 `case "kimi"` 分支；Kimi 空状态隐藏「导入」入口。
- **添加与切换**：添加走 `providersApi.addToLiveConfig(provider.id, "kimi")`（只写 `config.toml`，不改默认模型）；切换走 `switchProvider`（App.tsx 的 `handleAddKimiProvider` 与 Kimi 专属缓存失效）。
- **授权中心**：Kimi 分组、多官方账号登录/删除/切换/额度；账号命名 `Kimi 订阅 <nickname>`（无昵称时 `Kimi Official (<id 前 8 位>)`）。
- **协议边界**：Kimi 不进代理适配器（`get_adapter`/`provider_type` 返回 `None`），deeplink 导入对 Kimi 直接报错「Add Kimi Code providers from the Kimi Code page」。
- **MCP/Skills**：`McpServerSpec.apps.kimi`/`SkillApps.kimi`、`mcp/kimi.rs` 投影、数据库 `enabled_kimi` 两列、`Unknown` 工具之外的第 11 个 CLI 工具。
- **Apps 页**：Kimi Code 安装/升级（Unix `code.kimi.com/kimi-code/install.sh` 脚本、Windows `install.ps1`；升级 `kimi upgrade --yes`）、`~/.kimi-code` 数据目录、npm 包 `@moonshot-ai/kimi-code`、图标 `kimi`。
- **会话/用量**：Kimi 会话解析（`session_manager/providers/kimi.rs`）、用量归属（`session_usage_kimi.rs`）、定价/额度展示。

#### fork 对 Kimi 的三处取舍（Q1–Q3，2026-10-24 已确认）

- **Q1 白名单**：fork 构建下目录只显示 `Kimi`/`Kimi Global`/`Kimi For Coding`/`Kimi For Coding Global` 四条；三条本机推理预设（`Ollama`/`LM Studio`/`vLLM`）以及赞助商/聚合站/`Meta Model API` 等未列入白名单的条目在所有 Kimi 入口不可见；官方账号卡 `Kimi Official` 始终保留。过滤只作用于 `KimiProviderForm` 内**已编号的 entries**（按 `preset.name` 对照 `forkOfficialAllowlist.kimi`），不改 `kimiProviderPresets.ts` 的条目与顺序。
- **Q2 导入**：Kimi 只作跨应用导入来源。`readConfigFields("kimi", …)` 读 `settingsConfig.provider.base_url`/`provider.api_key`，身份字段（名称/备注/官网）照常复制，`defaultModel` 为空；Kimi 不作导入目标（`KimiProviderForm` 不渲染导入入口），官方账号卡作来源时连接字段为空。
- **Q3 模型**：Kimi 不进入 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换；默认模型由上游 provider 级「更多 → 设为默认」与表单模型表管理。

### 数据库 schema 终态（23）

- `SCHEMA_VERSION` == 23。
- 迁移链：
  - v18→v19：fork 的 `website_url_2` 与上游 `enabled_mcode` 并存（保持现状）。
  - v19→v20：上游 `mcp_servers.enabled_pi`（保持现状）。
  - v20→v21：fork 的 mcode/pi 幂等修复 + 上游 `enabled_agy`（两张表），set 21（保持现状）。
  - v21→v22：fork 的 `enabled_agy` 幂等补齐（两张表）**合并**上游的 `enabled_kimi`（两张表），set 22。
  - v22→v23：幂等补 `enabled_kimi`（两张表），set 23。用于「已升级到 fork v4.0.18-1（user_version=22、有 agy、无 kimi 列）」的库。
- `create_tables` 的 `mcp_servers` 与 `skills` 均含 `enabled_agy` 与 `enabled_kimi BOOLEAN NOT NULL DEFAULT 0`。
- 上游迁移测试（`kimi_migration_preserves_existing_flags_and_defaults_to_disabled`、`kimi_clean_database_persists_mcp_and_skill_flags_independently`、`agy_migration_preserves_existing_flags_and_defaults_to_disabled`、`agy_clean_database_persists_independent_mcp_and_skill_flags`）使用 `SCHEMA_VERSION` 常量，自然跟随 23；v21 库走 21→22（agy+kimi）→22→23（kimi 幂等），v20 库走 20→21（fork 修复+agy）→21→22（agy 幂等+kimi）→22→23（kimi 幂等）。
- v22→v23 幂等用例：模拟 fork v22（有 agy、无 kimi）→ 23 补 kimi；模拟上游 v22（有 kimi）→ 23 不变；重复调用幂等。
- 降级：fork v23 库被上游 v4.0.19（v22）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 终态

- 托盘左键：保持 fork 四条分支（面板样式左键 Up 且面板未显示 → `tray::toggle_main_window`；面板已显示 → `tray_panel::toggle` 收起；右键 Up → `tray_panel::toggle`；原生菜单样式左键 Up → `toggle_main_window`、右键 Up → `mark_feedback_seen` 后交系统菜单）。`show_menu_on_left_click(false)` 两处固定，`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留。本轮上游 `tray.rs` 只加 `AppType::Kimi => "Kimi Code"`；`lib.rs` 新增 11 行全部是 Kimi 模块声明、`KimiOAuthManager`、`add_provider_to_live_config` 与 `kimi_oauth_*` 命令注册，不触碰 `TrayIconEvent::Click`。
- 应用内更新器：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；上游本轮未改 updater 相关函数，不采纳任何重放带入的更新器实现。
- Windows 安装：本轮上游未改 MSI 模板；上一轮的 `REBOOT=ReallySuppress`、`CloseApplication`、可选桌面快捷方式与 `release.yml` Property 断言保持。上游本轮的 Windows 修复是 agy 后台命令不弹控制台（`9cb6b6d7f`），随上游落地。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订：`lib.rs` 行追加「v4.0.19 只加 Kimi 模块/OAuth 命令」；`tray.rs` 行追加「v4.0.19 只加 kimi 标签」；`database/schema.rs` 行改为「v4.0.19 的 21→22 Kimi 列与 fork 22 撞车，终态 23」；`commands/misc.rs` 行（上游 Kimi 安装器 + fork tunecc URL）；`ProviderForm.tsx` 行（Kimi 早退分流 + fork 导入/entriesFor）；`ProviderList.tsx`/`ProviderCard.tsx` 行（Kimi 官方额度与终端卡 vs fork 徽章/右键菜单）；`appConfig.tsx` 行（Kimi 六处列表 + fork 侧边面板默认值）；`presentation.ts` 行（`CardTone` 移除 `neutral`）。
  - locale 行登记：fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`；上游本轮删除的 8 个 usage 键与新增 52 键按上游落地。
  - 新增 §4.6「v4.0.19 轮的叠加要点」：Kimi 三类交集（Q1–Q3 结论）、schema 23 的两步迁移、Kimi 预设 id 与账号预设、`CardTone.neutral` 移除、`AuthCenterTarget` 类型、用量页重构。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 23 与 21→22（fork AGY 幂等 + 上游 Kimi 列合并）/ 22→23（Kimi 列幂等补齐）两步、降级不兼容。
- `docs/comet/specs/provider-cross-app-import/spec.md`：登记 Kimi 仅作来源、读取 `provider.base_url`/`provider.api_key`、`defaultModel` 为空、不作目标。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：登记 Kimi 不进入快捷切换、使用上游 provider 级「设为默认」与表单模型表。
- 本规格即 `docs/comet/specs/upstream-sync/spec.md`：已更新为本轮同步后的完整状态。

### 落地保真核对（实测，2026-10-24，代码终态 `HEAD` = `31dc62f48`）

- 算法（固定口径）：对上游 `v4.0.18..v4.0.19` 改动过的每个文件（215 个，覆盖 47 个重叠文件的全部）取 `git diff v4.0.18 v4.0.19 -- f` 的增/删行、`git diff v4.0.18 pre-sync-v419 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。
- 实测合计：**上游新增行缺失 30 行（7 个文件），fork 新增行缺失 9 行（7 个文件）**；215 个上游文件全部参与计算，其余 208 个上游文件双侧缺失均为 0。计算在版本/文案/schema/合并提交落完之后、代码终态 `HEAD` = `31dc62f48` 上进行；其后的文档提交只改 `docs/**` 与 Markdown，不在 215 个文件内，故数字不变。
- 上游新增行缺失逐项归因：
  - `README.md` 22 行（Kimi/十一工具说明 8 行、BuyToken/DIT.ai/V-API/FluxA/Shengsuanyun 赞助商行 10 行、表格结构行 4 行）：fork README 整文件重写，不采纳上游表格（刻意取舍）。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行版本号 `4.0.19`：fork 用 `4.0.19-1` 取代（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `SCHEMA_VERSION: i32 = 22`：fork 终态 23（撞号处理）。
  - `src/components/providers/forms/KimiProviderForm.tsx` 3 行（`...kimiProviderPresets.map((preset, index) => ({`、`id: String(index)`、`preset`）：fork 在 `.map` 之后插入 Q1 的 `.filter(...)`，prettier 将上游三行压成一行 `map((preset, index) => ({ id: String(index), preset }))`；编号仍先于过滤，语义保留。
- fork 新增行缺失逐项归因：
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行 `4.0.18-1`：本轮终态升级为 `4.0.19-1`（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `SCHEMA_VERSION = 22`：升为 23。
  - `src-tauri/src/database/schema.rs` 3 行（v21→v22 旧日志、旧断言 `22`、旧注释「已是 v22 的库重跑迁移必须是 no-op」）：合并为「AGY + Kimi」后日志/注释改写、断言改用 `SCHEMA_VERSION`，语义保留并新增 v22→v23 幂等补齐。
  - `src/components/providers/forms/ProviderPresetSelector.tsx` 1 行 `category?: ProviderCategory; // 当前选中的分类`：上游 v4.0.19 改写接口（新增 `barAction`）时该行尾注释消失，属性本身仍在，无行为影响。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.19 HEAD -- <file>` 只看 fork 侧新增/删除。
- 本地化旁证：`tr.json` 与 `v4.0.19` 逐字节一致（`cmp` 通过）；4 个 locale 的 52 个新增叶键全部逐字落地、8 个删除键零残留、3 个改写键逐字取上游；`provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 继续为 fork 文案，不构成缺失。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 47 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.18 v4.0.19 | sort) <(git diff --name-only v4.0.18 pre-sync-v419 | sort)`；上游 215 文件 + fork 461 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.18 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（5 个）

- **`package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json`**（均 1/1）：取上游内容，版本号改为 fork `4.0.19-1`；`Cargo.toml` 保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`；`package.json` 保留 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater`；`tauri.conf.json` 保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true`。上游本轮无依赖增删，`Cargo.lock` 只允许 `cc-switch` 版本行变化。
- **`README.md`**（24/13 / fork 96/532）：fork README 是「仅记录与上游差别」的整文件重写（148 行）：冲突按整文件保留 fork 版；上游本轮新增/删除行不落地，属刻意取舍（见「落地保真核对」的 README 归因）。fork 的构建说明与 §14 托盘说明原样保留。

#### 后端（15 个）

- **`src-tauri/src/lib.rs`**（+11/−0 / +32/−42）：上游只新增 `kimi_config`/`kimi_session` 模块声明、`KimiOAuthManager` 初始化、`add_provider_to_live_config` 与 `kimi_oauth_*` 命令注册；fork 的无 Updater、托盘左键、connectivity 命令注册三段语义原样保留。grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0、`.show_menu_on_left_click(false)` 在位、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册在位、Kimi 命令注册在位。
- **`src-tauri/src/commands/misc.rs`**（+156/−8 / +6/−5）：上游新增 Kimi 安装/升级/版本/启动与测试（`VALID_TOOLS` 11 项含 `kimi`、`KIMI_INSTALL_UNIX/WINDOWS_SCRIPT`、npm 包与版本检查）；fork 只把 `check_for_updates`、`portable_zip_url` 及测试里的 URL 指向 tunecc。逐 hunk 取上游并保留 fork 的 4 处 URL，禁止整文件取一侧；grep `farion1231/cc-switch/releases`（src-tauri）为 0、`tunecc/cc-switch/releases` 在位。
- **`src-tauri/src/commands/mod.rs`**（+2/−0 / +2/−2）：上游注册 `kimi_oauth` 模块；fork 的 connectivity/updater 模块声明保留。
- **`src-tauri/src/settings.rs`**（+6/−2 / +47/−0）：上游加 `VisibleApps.kimi`、`get_current_provider`/`set_current_provider` 的 `AppType::Kimi` 分支（`None`/空操作）；fork 的 `VisibleSidebarPanels` 整段保留，两段并存。上游把 `AppType::Pi | AppType::Mcode` 扩为 `| AppType::Kimi`，fork 若改过同一 match 分支需合并而不是二选一。
- **`src-tauri/src/tray.rs`**（+1/−0 / +75/−6）：只加 `AppType::Kimi => "Kimi Code"`；fork 的 `hide_main_window`/`toggle_main_window`、`apply_tray_style` 的 `set_show_menu_on_left_click(false)` 与源码护栏不动，不得把 `native_menu_on_left_click` 带回。
- **`src-tauri/src/provider.rs`**（+4/−0 / +45/−1）：上游加 Kimi 的 `provider.base_url`/`provider.api_key` 读取；fork 的 `website_url_2` 字段、`UniversalProvider` 构造与测试字面量保留；合并后 Kimi 分支与 fork 的 `website_url_2` 构造并存。
- **`src-tauri/src/services/provider/mod.rs`**（+174/−14 / +4/−0）：上游加 Kimi 原生 provider 路径与重复 providerKey 守卫（`save_native_provider` 等）；fork 的 4 行测试字面量 `website_url_2: None` 保留；Kimi 分支不得被 fork 的 Claude 专用逻辑改写。
- **`src-tauri/src/services/provider/live.rs`**（+16/−2 / +44/−0）：上游加 Kimi 的 `provider_exists_in_live_config`/`write_live_snapshot`/common-config 分支；fork 的 `sanitize_claude_settings_for_live` 与测试保留，Kimi 不得被 Claude sanitize 误伤。
- **`src-tauri/src/services/mod.rs`**（+2/−0 / +2/−1）：上游注册 `kimi_oauth`/`session_usage_kimi` 模块；fork 的模块声明保留。
- **`src-tauri/src/database/mod.rs`**（+1/−1 / +1/−4）：`SCHEMA_VERSION` 取 fork 终态 23；fork 的注释与版本校验逻辑保留。
- **`src-tauri/src/database/schema.rs`**（+55/−1 / +245/−2）：按「数据库 schema 终态」合并；`create_tables` 两表加 `enabled_kimi`（保留 `enabled_agy`）；20 臂保持 fork 修复 + agy；21 臂合并 fork 的 agy 幂等补齐与上游 Kimi 列（set 22）；新增 22 臂幂等补 `enabled_kimi`（set 23）；上游 Kimi/AGY 迁移测试使用 `SCHEMA_VERSION` 常量，保持通过；新增 v22→v23 用例；fork 现有迁移测试保持通过。
- **`src-tauri/src/database/dao/mcp.rs`**（+6/−3 / +1/−1）：上游在 SELECT/INSERT/`AppType` 映射加 `enabled_kimi`；fork 的改动保留，Agy 分支与 Kimi 分支并存，SELECT 列顺序与 `row.get(16)` 索引正确。
- **`src-tauri/src/deeplink/provider.rs`**（+5/−0 / +1/−0）：上游对 Kimi deeplink 返回错误；fork 的 `website_url_2: None` 保留在构造器字段列表里。
- **`src-tauri/src/proxy/providers/mod.rs`**（+2/−2 / +1/−0）：上游把 Kimi 加入无适配器分支；fork 改动保留。
- **`src-tauri/src/proxy/forwarder.rs`**（+7/−1 / +2/−1）：上游只改 Codex session header 别名测试；fork 的改动保留，两处并存。

#### 前端（12 个）

- **`src/App.tsx`**（+86/−35 / +88/−2）：上游加 Kimi 的添加/切换处理器、授权中心目标、用量设置接线与 `translateKimiProviderMutationError`；fork 的 DevPanel、侧边面板、连接徽章改动保留。
- **`src/components/providers/AddProviderDialog.tsx`**（+10/−5 / +1/−0）：上游让 Kimi 跳过预设选择、加 `accountLogin` 状态与 `AuthCenterTarget`；fork 改动保留。上游把 `ManagedAuthProvider` 换成 `AuthCenterTarget`，不得从 fork 侧带回旧类型。
- **`src/components/providers/EditProviderDialog.tsx`**（+8/−3 / +2/−0）：上游把 Kimi 加入 live-snapshot 排除列表并改用 `AuthCenterTarget`；fork 改动保留。
- **`src/components/providers/ProviderCard.tsx`**（+24/−5 / +104/−1）：上游加 Kimi 官方额度 footer、`isOfficialAccount` 判定、`onTest` 关闭与官方卡禁复制/禁删；fork 的模型徽章、快捷切换、连接徽章、双官网链接保留。**上游同时从 `CardTone` 移除 `neutral`（`presentation.ts` 不在重叠面、整体取上游），本文件的 `TONE_CLASS` 必须删掉 `neutral` 条目**，否则 typecheck 失败。按 Q3，Kimi 不进入 `isModelCapableApp`。
- **`src/components/providers/ProviderList.tsx`**（+4/−1 / +229/−10）：上游加 `case "kimi"`（`meta.liveConfigManaged`）、`kimiCurrentId`、Kimi 空状态隐藏导入；fork 的右键置顶/置底、快捷排序、连接检测、apply 逻辑保留。
- **`src/components/providers/forms/ProviderForm.tsx`**（+6/−2 / +183/−43）：上游在 wrapper 首段加 `if (props.appId === "kimi") return <KimiProviderForm {...props} />;` 与 `AuthCenterTarget`、`onAccountLoginChange`；fork 的 `entriesFor`（编号先于 hidden、先于白名单）、`extraActions`、`websiteUrl2`、连通性接线保留。Kimi 早退必须在 fork 通用表单逻辑之前，Kimi 因此天然没有导入入口（Q2）。
- **`src/components/providers/forms/PiProviderForm.tsx`**（+57/−64 / +65/−43）：上游把 providerKey 改为常显、加非编辑态重复校验与共用必填星号；fork 的 Pi 预设白名单/本地预设入口/表单改动全部保留。
- **`src/components/providers/forms/ClaudeFormFields.tsx`**（+2/−2 / +276/−221）：上游只改两处按钮 class；fork 的布局、兜底模型直达区与 1M 全选保留。
- **`src/components/providers/forms/ProviderPresetSelector.tsx`**（+18/−4 / +18/−10）：上游加 `KimiProviderPreset` 到 `AnyPreset` 联合、`barAction` 属性；fork 的 `extraActions`、导入入口、预设过滤接线保留；两个属性并存。
- **`src/config/appConfig.tsx`**（+13/−1 / +9/−1）：上游在 `APP_IDS`/`DEFAULT_VISIBLE_APPS`/`SKILLS_APP_IDS`/`ADDITIVE_APP_IDS`/`MCP_APP_IDS`/`APP_ICON_MAP` 加 `kimi`；fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS` 保留。
- **`src/lib/query/mutations.ts`**（+22/−4 / +63/−0）：上游加 Kimi 错误翻译、缓存失效与 add-to-live 分支；fork 的导入/预设 mutation 逻辑保留。
- **`src/types.ts`**（+2/−0 / +14/−0）：上游加 `VisibleApps.kimi` 与 `McpServerSpec.kimi`；fork 的 `websiteUrl2`/`VisibleSidebarPanels` 保留，两段并存。

#### 预设（6 个）

- **`src/config/geminiProviderPresets.ts`**（30/1 / fork 2/0）：取上游 V-API 赞助商预设；fork 的 `hidden?: boolean` 保留。
- **`src/config/{grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（38/1、103/43、207/109、132/54、91/51 / fork 各 2/0）：全部取上游 BuyToken/V-API、FluxA 位置调整与 V-API backup endpoints；fork 的 `hidden?: boolean` 保留；不得把 ZetaAPI 带回。
- **`src/config/kimiProviderPresets.ts`** 是上游新增文件（不在重叠面），整体取上游；Q1 的白名单过滤在 `KimiProviderForm` 内完成，不改该文件的条目。

#### 本地化（4 个）

- **`src/i18n/locales/{en,zh,ja,zh-TW}.json`**（各 +74/−16 / fork en 328/25、ja 315/24、zh-TW 315/24、zh 327/24）：52 个新键、8 个删除键、3 个改写键（`usage.syncStatus.justNow`/`minutesAgo`/`tipOff`）全部取上游；fork 专属键段保留；`provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 继续覆盖为 fork 文案。合并后逐文件按对象作用域查重，并核对 fork 末键行与 `},` 收尾未被拼进同一物理行。
- `tr.json` 不属重叠面，与上游 `v4.0.19` 逐字节一致（上游 tr 自身缺 10 个新键、1 个删除键）。

#### 测试（5 个）

- **`tests/components/AppsPage.test.tsx`**（+4/−1 / +12/−6）：上游把 `getToolVersions` 期望从硬编码 10 改为 `TOOL_NAMES.length`；fork 的过期缓存竞态修正保留，两处并存（`TOOL_NAMES.length` 现在为 11）。
- **`tests/components/DeepLinkImportDialog.test.tsx`**（+67/−2 / +4/−3）：上游加 Kimi deeplink 拒绝用例；fork 的 `waitFor` 初值修正保留。
- **`tests/components/ProviderCardActions.test.tsx`**（+41/−1 / +34/−0）：上游加 `submenu` 用例并去掉 `neutral` 断言；fork 的用例保留。
- **`tests/components/ProviderList.test.tsx`**（+206/−0 / +277/−5）：上游加 Kimi 列表/空状态用例；fork 的右键/连接检测用例保留。
- **`tests/components/ProviderPresetSelector.test.tsx`**（+2/−2 / +33/−0）：上游把 Claude 可见预设行数从 107 改为 109；fork 的行数断言与过滤用例按上游基线更新，保持 fork 侧断言口径（fork 构建下白名单过滤后的行数）。

### fork 取舍清单

1. **Kimi 预设白名单（Q1，2026-10-24 已确认）**：`forkOfficialAllowlist` 新增 `kimi: ["Kimi", "Kimi Global", "Kimi For Coding", "Kimi For Coding Global"]`；三条本机推理预设（`Ollama`/`LM Studio`/`vLLM`）在 Kimi 的所有入口不可见；官方账号卡 `Kimi Official` 始终保留；目录 id 仍为 `String(原始下标)`，过滤必须发生在编号之后；其他 app 的白名单与本机推理条目不变。
2. **Kimi 跨应用导入（Q2，2026-10-24 已确认）**：Kimi 仅作导入来源；`readConfigFields("kimi", …)` 读 `provider.base_url`/`provider.api_key`，`defaultModel` 为空；身份字段照常复制；Kimi 不作导入目标（`KimiProviderForm` 不渲染 `ProviderImportEntry`，上游空状态隐藏导入保持）。
3. **Kimi 模型显示与快捷切换（Q3，2026-10-24 已确认）**：不把 Kimi 加入 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换；保留上游 provider 级「更多 → 设为默认」与表单模型表。
4. **上游卡片「设为默认/默认模型子菜单」**：OpenCode/OpenClaw 的应用级默认语义，与 fork 的供应商级模型快捷切换并存，两者都保留。
5. **Pi providerKey 重复校验**：上游新增的前置校验与 fork 的 Pi 预设白名单/本地预设入口互补，两者都保留。
6. **portable zip 直下**（上游 v4.0.13 `b391565f`，本轮仍在）：不接入前端更新入口；`open_portable_update_download` 后端命令保留注册，URL 基址与 `check_for_updates` 指 tunecc。
7. **应用内更新器**：继续禁用（空壳、无插件/依赖/AIP、`createUpdaterArtifacts: false`）。
8. **托盘左键**：保持 fork 四条分支与源码护栏；上游本轮只加 Kimi 标签。
9. **`codegen-units`**：fork 保留 `= 1`。
10. **`tr.json`**：与上游 tag `v4.0.19` 逐字节一致，不补 fork 键。
11. **README**：保留 fork 整文件自有版本；上游 README 增删不采纳，在保真核对中归因为「fork 整文件替换」。
12. **基线确认**：tag `v4.0.19` = `319fbfd`（剥离 `d8983bb`）；交付按 Q4 授权（push main + tag `v4.0.19-1`）。

### 预设 id 编号契约（延续 + Kimi 特例）

- 预设选择项 `id` 数字 = 原始预设数组下标；fork 的白名单过滤必须发生在编号之后。既有四处入口（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`）仍为「按原数组下标编号 → 过滤上游 `hidden` → 按白名单名称集合过滤」。
- **Kimi 特例**：`KimiProviderForm` 的 `PRESETS` 是「账号预设 `kimi-official-account` + `kimiProviderPresets.map((preset, index) => ({ id: String(index), preset }))`」。fork 的 Q1 过滤必须作用在**已编号的 entries** 上（按 `preset.name` 对照 `forkOfficialAllowlist.kimi`），不得先过滤数组再编号；`kimiProviderPresets[Number(presetId)]` 的查找依赖原始下标。账号预设不参与目录白名单过滤，始终显示。
- 上游本轮未给既有 app 新增预设条目（`src/config/*ProviderPresets.ts` 只有赞助商增删与位置调整，属既有名字集合变化），`forkOfficialAllowlist` 既有条目无须追加；`kimiProviderPresets.ts` 是新增文件，Q1 只加 Kimi 条目。新增的 `hidden` 声明查重仍需复核。

### 本地化状态

- 语言集合 `zh`/`zh-TW`/`en`/`ja`/`tr` 不变。
- 上游本轮 4 个 locale 各 +52 键、−8 键、3 个改写键（行数 74/16）；`tr.json` +42/−7/3（行数 63/14，本身比 `en` 少 10 个新键、少 1 个删除键）。全部取上游；fork 专属键段保留（fork 侧相对 `v4.0.18` 的增删行数：`en` 328/25、`ja` 315/24、`zh-TW` 315/24、`zh` 327/24，只增不减）。
- fork 专属覆盖 2 键：`provider.connectivityCheck`（Connectivity test）与 `settings.general.trayStyleHelp`（左键切换主窗口/右键弹所选样式），上游本轮未改这两键，继续覆盖。
- 土耳其语下 fork 专属文案回退英文（`fallbackLng: "en"`），既有决定不变。

### `.comet/config.yaml` 保护

- 重放涉及该文件或 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。

### 已知流程坑位

- Runtime `verification_checks` 的 `executable` 与 `argv` 分开填、`cwdRef` 必须是真实存在的相对目录；argv 不含程序名、不含 shell 语法。
- 长重放 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 与落盘，再 continue。
- `--ours` 是新基线，`--theirs` 是重放的 fork 提交。
- 重放中途不跑 `cargo test`；最终态冲突标记零命中。
- JSX/Rust 合并禁止按行去重；手工拼接后必须 `pnpm format:check` + `pnpm build:renderer`。
- **`CardTone` 移除 `neutral`**：上游 `presentation.ts` 整体取上游后，`ProviderCard.tsx` 的 `TONE_CLASS` 必须删 `neutral` 条目；`ProviderCardActions.tsx` 的 `DOT` 上游已改为 `Record<CardTone | "muted">`，不要恢复旧类型。
- **`AuthCenterTarget`**：上游在 Add/Edit 对话框、`ProviderForm`、`AuthCenterPanel` 用 `AuthCenterTarget`，表单字段仍用 `ManagedAuthProvider`；不要因为 fork 旧代码把 `AuthCenterTarget` 改回 `ManagedAuthProvider`。
- **Kimi `settingsConfig` 是对象**：表单提交时序列化成 JSON 字符串，`AddProviderDialog`/`EditProviderDialog` 再 `JSON.parse` 后入库；Q2 的读取分支按对象读 `provider.base_url`/`provider.api_key`。
- **Kimi 白名单过滤位置**：只在 `KimiProviderForm` 的已编号 entries 上过滤；不得改 `kimiProviderPresets.ts` 的条目顺序或编号。
- locale 重复键显式查重（按对象作用域）；预设 interface 的 `hidden?: boolean` 重复声明必须删 fork 侧。
- 上游删除的 8 个 usage 键必须确认 fork 代码零引用（尤其 fork 改过的用量/设置页）；删除后 `pnpm typecheck` 与 `pnpm test:unit` 必须通过。
- `src-tauri/src/commands/misc.rs` 是上游大改动 + fork 小改动的组合面，最容易「整文件取一边」丢 URL 或丢 Kimi；解完必须双向 grep。
- `src-tauri/src/services/provider/mod.rs`（上游 174/14）与 `live.rs`（上游 16/2）承载 Kimi 配置读写；fork 的 `sanitize_claude_settings_for_live` 与测试必须保留。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx` 分桶用例本地 00:00–00:30 必失败；`tests/components/AppsPage.test.tsx` 的过期缓存用例只在 CI 并发下竞态。
- 上游自带 CI 竞态 `services::session_usage_codex::tests::test_parent_rollout_is_cached_once_across_fork_cutoffs` 的判定顺序（与上游逐字节相同 → 上游同用例是否同样红 → 本地重复跑）继续适用；本轮该文件未被上游改动。
- fork 发版 tag 推送事件偶发丢失：推送后 Actions 零排程先取证再重推同一 tag 对象；查 fork Actions 必须显式 `--repo tunecc/cc-switch`。
- SSH 被 fake-IP 接管时用 gh HTTPS credential helper 推送。
- 落地保真数字必须在最终态提交之后复算；更正归属时把规格、brief、`HOW_TO` 三处一起扫干净并留「数字更正记录」。

### 版本号

- 四处文件 `4.0.19-1`；语义：上游版本号 + `-N`，N 为同一上游版本的 fork 构建代数。

### 交付（按 Q4 授权，2026-10-24 已确认）

- 交付是验收通过、用户接受结果并生成归档提交之后的步骤：`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.19-1` 并 `git push origin v4.0.19-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。不创建 PR，不含其他远端引用。
- 执行后回报：`main`/`origin/main` 一致性、tag 指向的提交、Release run 的 status/conclusion（用 `gh api --repo tunecc/cc-switch` 复核，不信包装工具输出）。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__`、DevPanel 及 `__CCS_DEV_PANEL__` 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `VisibleSidebarPanels` 持久化）——与上游 `VisibleApps.kimi` 同处 `types.ts`/`settings.rs`，两段并存。
- 供应商卡片模型徽章与快捷切换弹窗（claude/codex/gemini/grokbuild，Kimi 按 Q3 排除）、Claude 兜底模型直达区与快捷设置按钮对齐、`SearchableModelPicker`、1M 全选。
- 供应商右键置顶/置底、新建插入第二位（`ProviderList.tsx`）。
- 官方预设过滤（`forkOfficialAllowlist` + `forkPresetFilter` + 预设文件 `hidden` 字段 + 四处表单接线的「编号先于过滤」；Q1 新增 kimi 条目，并在 `KimiProviderForm` 已编号 entries 上过滤）。
- 逐模型连通性测试（后端执行器、Tauri 命令、持久化、前端接线；`lib.rs` 两个命令注册在位，`stream_check` 不回来；Kimi 维持上游的测试入口关闭）。
- 供应商双官网链接（`website_url_2`/`websiteUrl2` 全链路，含 `deeplink/provider.rs`、`proxy/model_mapper.rs`、`services/provider/mod.rs` 测试字面量里的 `website_url_2: None`）。
- 托盘左键单击切换主窗口（`tray.rs` 两个 helper + `lib.rs` 左键分支 + `tray_panel::panel_visible` + 源码级护栏）。
- 跨应用导入供应商配置（5 个 Form + `ProviderPresetSelector.extraActions`；Q2 决定 Kimi 仅作来源）。
- 禁用应用内更新器（About 指向 tunecc Releases、启动自检取消、`install_update_and_restart` 空壳、无 updater 插件/依赖/AIP）。
- 对上游自带测试的稳定性修正（`apps-page-cache-race`、deeplink 开关初值 `waitFor` 等，按 `fork-test-stability` 能力规格重新套用；本轮 AppsPage 断言改为 `TOOL_NAMES.length` 后仍保留 fork 修正）。
- 上游 tag 的发版构建跳过与 fork CI 裁剪（`.github/workflows/{ci,release}.yml` 整文件保留，上一轮的 MSI REBOOT 断言保持）。
- README fork 差异说明与构建说明（§14 托盘说明保持上轮终态）。
- Kimi 落地（上游能力全部可用：Apps 页安装/终端、官方账号登录、授权中心/额度、会话/用量、MCP/Skills 开关、`enabled_kimi` 迁移与持久化）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests` 命中文件数）

逐项取证并记录：`__CCS_FORK_BUILD__`、`__CCS_DEV_PANEL__`、`DevPanel`、`visibleSidebarPanels`、`batchConnectivityTest`、`extractModelBadgeForProvider`、`ModelQuickSwitchDialog`、`websiteUrl2`、`website_url_2`、`toggle_main_window`、`hide_main_window`、`panel_visible`、`show_menu_on_left_click(false)`、`connectivity_test_provider_models`、`connectivity_probe_provider`、`filterForkPresets(`、`ProviderImportEntry`、`forkOfficialAllowlist`、`readImportableProviderFields`、`enabled_kimi`；并确认 `native_menu_on_left_click` 仅存注释/护栏断言、`tauri_plugin_updater`/`updater_builder` 在 `src-tauri` 为 0、`tauri-plugin-updater` 在 `Cargo.lock` 为 0、`createUpdaterArtifacts` 为 `false`、`MODEL_CAPABLE_APPS` 不含 `kimi`。
