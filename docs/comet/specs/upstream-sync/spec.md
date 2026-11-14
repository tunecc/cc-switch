# 完整目标规格：upstream-sync（v4.0.31 轮）

> 本文件是 `sync-upstream-v431` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.28）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-09-sync-upstream-v428/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.31`（tag 对象 `5ad4f9701aeb1e82f327445420451f6c889260e3`，剥离提交 `3c76d3bda670297dd8c27d7d9be9b18a4c9143f5`，2026-11-12 发布），fork 版本号 `4.0.28-2` → `4.0.31-1`。同步后 fork main = 上游 v4.0.31 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.28..v4.0.31` 共 85 个提交、320 个文件、+53034/−1251（76 新增 / 244 修改 / 0 删除 / 0 重命名）。本轮横跨 `v4.0.29`（2026-11-10 发布）、`v4.0.30`（2026-11-12 发布）、`v4.0.31`（2026-11-12 发布）三个发布点。主轴是三个新域：**受管应用 GitHub Copilot CLI（v4.0.29）**、**隐私过滤器（v4.0.30）**、**受管应用腾讯 WorkBuddy + 八语种 i18n（v4.0.31）**，另含大量 Codex/Gemini 代理修复、会话与托盘修复、供应商编辑页提速。

**上游是否重写了 fork 已有功能——本轮结论：没有同域重复，不产生二选一。** 取证与逐项分析：

1. **fork 功能标识全量扫描零命中**：对 `v4.0.28..v4.0.31` 的新增行扫 `connectivity_test`、`stream_check_provider`、`website_url_2`、`websiteUrl2`、`ModelQuickSwitch`、`pinned_at`、`is_pinned`、`provider_import`、`ProviderImport`、`strip_one_m_suffix`、`IS_FORK_BUILD`、`VisibleSidebarPanels` 共 12 个标识——唯一命中是孤儿文件 `src-tauri/src/services/stream_check.rs` 自身被上游修改（新增 `AppType::Copilot` 分支与用例），不构成重复实现。
2. **上游新增 UI 概念扫描零命中**：`onContextMenu`（右键菜单）、`ModelBadge`、`visiblePanels`/`togglePanel`、`isPinned`/`pinnedAt`、`quickSwitch`/`quickModel`、`ProviderImport`/`importSource` 在上游新增行中均为 0 命中。
3. **同域相邻项逐条排除**：
   - 上游 Copilot / WorkBuddy 的「官方账号」是授权中心账号绑定与额度查询，fork 无同类实现。
   - 上游「一键导入链接」认 `providers.json` 写法与 `bearerToken`，属 deeplink 导入链路；fork 的跨应用导入是读取其他应用的配置文件，不同域。
   - 上游 ProviderCard 本轮改的是 **Codex OAuth 身份行**（副标题从 ChatGPT 价格页网址改为「账号 · 套餐」），fork 的副标题优先级链改的是官网链接与账号行的另一段逻辑，两者行区间不相交。
   - 上游托盘两处修复（macOS 不设 tooltip、macOS 全屏 Space 上面板可见）都不触 `TrayIconEvent::Click` 语义，`tray.rs` 本轮上游未改 `handle_tray_icon_event` 的按钮分派。
   - 上游 `stream_check` 仍为孤儿链路（见「孤儿豁免终态」）。
   - 上游八语 README 与 fork 专属改写的 `README.md` 是文件级冲突，不是功能重复。
4. **结论**：本轮全部上游功能按上游落地（fork 已裁/已移除段除外），fork 魔改一律保留，无需用户做功能级取舍。用户「上游重复则询问」的条件未触发。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.31` 剥离出的提交 `3c76d3bda670297dd8c27d7d9be9b18a4c9143f5`。
- `git merge-base main v4.0.31^{}` == `8656ebd91f3eba631837126e29df71e8353b7e43`（v4.0.28 剥离提交）；`git log v4.0.31..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 fork 提交（`git rev-list --count v4.0.28..main`，同步前 main = `a47247c1f`，写作时实测 212）按原顺序重放，外加本轮的同步终态提交与归档提交；终态计数以现取命令为准，不在本规格写死。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v431`（= `a47247c1f`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.28`（剥离 `8656ebd91`）与 fork 发布 tag `v4.0.28-1`/`v4.0.28-2` 保持不变、不改写历史。
- `upstream/main` 上 tag 之后仍有 6 个提交（写作时 `git rev-list --count v4.0.31..upstream/main` 为 6），**本轮不同步**；只锁已发布 tag。不同步其他上游分支。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。
- 重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v431/` 产物。

### 同步范围（v4.0.28..v4.0.31：85 提交、320 文件、+53034/−1251）

上游本轮改动按功能分组（提交号便于 Build 阶段核对落地保真）：

1. **GitHub Copilot CLI 受管应用（17 提交，v4.0.29 主轴）**：`bd487e839`（#8753 核心：`copilot_config.rs`、`services/provider/copilot_direct.rs`、`commands/copilot*`、`mcp/copilot.rs`、`session_manager/providers/copilot.rs`、`session_usage_copilot.rs`；官方登录卡不写文件、BYOK 卡写 `$COPILOT_HOME/providers.json`；写入前整份校验；默认模型条目不可删）、`7b657e02a`（BYOK 留在 native providers.json）、`9bd9c5167`（会话用量归到选中卡）、`657202910`（deeplink 导入为 providers.json 卡）、`8d866cef3`（列表内增删 BYOK 卡）、`0d69dd062`（接受 `bearerToken`、保留全部模型 ID）、`4d68975bf`（文件不可读时不丢已存卡）、`cf12f0100`（写入前校验输出上限与 systemMessage）、`aab0ea579`（空模型列表解释原因）、`17e20a59e`（Claude 表单回退建议 gpt-4.1/gpt-4o）、`23c57e8d8`（maxPromptTokens 由上下文窗口与输出上限派生）、`36041067b`（未绑定账号选项文案）、`f38a612c3`（Windows 跳过 VS Code copilot-shim）、`4a1369f26`（官方登录卡并入「已添加」）。
2. **隐私过滤器（3 提交，v4.0.30 主轴）**：`32365a547`（#8951 核心：`proxy/privacy_filter/{mod,pii,secrets,gitleaks.toml,tests,cases.json}`、`PrivacyFilterConfigPanel.tsx`、`get/set_privacy_filter_config` 两命令；邮箱/大陆手机号/身份证/银行卡/IPv4（回环除外）/API Key/Token/私钥/口令替换为占位符；默认关；仅路由与聚合模式；工具结果默认不处理并给子开关）、`664a46ab8`（#9460 改到发往上游前的最后一步过滤，覆盖故障转移重试与自生成压缩摘要；工具说明文字不处理）。
3. **腾讯 WorkBuddy 受管应用（7 提交，v4.0.31 主轴）**：`d0da1349f`（#8757 核心：`workbuddy_config.rs`、`workbuddyProviderPresets.ts`、`services/workbuddy_account/{mod,quota,tests}.rs`、`commands/workbuddy_account.rs`、`WorkBuddyAccountSection.tsx`、`WorkBuddyProviderForm.tsx`、`WorkBuddyOfficialSection.tsx`、`mcp/workbuddy.rs`、`session_manager/providers/workbuddy.rs`、`session_usage_workbuddy.rs`；自定义模型写 `models.json`，名称留空用厂商标签；重复模型 ID 拒绝；官方账号收录到授权中心并可切换，切换前要求完全退出 WorkBuddy）、`4587b5c0a`（积分到期时间）、`f2420dc85`（授权中心菜单直接切号）、`61bd4d422`（文案改为「切换」）、`acdab9c9a`（预设模型思考强度）、`29aed9040`（模型按厂商标签、重复 ID 标记）。
4. **八语种 i18n（5 提交）**：`5a3d7f92a`（韩语 #8794）、`cdca09842`（俄语 #7788）、`3561af531`（七语种同步维护）、`51a96e24b`（德语 → 八语种）、`3dfc92c6b`（ko/tr/ru 补 Copilot 与 max_tokens 文案）；配套 `tests/config/localeParity.test.ts`、`tests/config/readmeParity.test.ts`、`tests/i18n/koreanDetection.test.ts`、`tests/i18n/languageBoundaries.test.ts`；`README_{KO,RU,TR,ZH-TW}.md`；KRW 币种。
5. **代理与 Codex/Gemini 修复（约 20 提交）**：`72e826edf`（无 `call_id` 的工具结果对非官方原生 Responses 上游归一化为一条用户消息）、`08ec82aab`/`a6200c1ef`（第三方 Responses 上游剥离仅 OpenAI 认的 Codex 字段）、`74f0d41ce`（工具参数重复键只留最后一个）、`3bde82624`（Codex→Anthropic 默认 max_tokens 8192→32000）、`e38a4fd13`（新 `proxy/codex_models_passthrough.rs`：路由用官方卡且未开暂停登录时把官方模型列表原样交给 Codex）、`5c4622690`（WSL 下 catalog 指针只写文件名）、`4151bc33d`（Azure 资源不匹配/AES 思考记录被拒后去思考记录重试一次）、`fd9794213`（Gemini Native 跨消息工具结果合并）、`da830bfd1`（Gemini Native 中途 system 消息保位以保缓存命中）、`e91114fe2`（Gemini Native 流式用量）、`4376e5dfa`（Codex rollout 解析减分配）、`457f898c7`（Codex fork 用量序号）、`f6423b5d8`（保留官方登录开关即时生效）、`f1d438e0a`（官方同名 GPT 模型用配置的显示名）、`5e9812e07`（Mistral 工具历史省略 reasoning_content）、`0e49c8813` 类逻辑沿用、`a6200c1ef`。
6. **界面与交互修复（约 15 提交）**：`d0e47b2d6`（供应商编辑页空闲预加载：`EditProviderHost.tsx`、`editProviderStore.ts`、`lib/preloadOnIdle.ts`）、`5628bb118`（`window_fit.rs`：启动时把主窗口收回工作区）、`479e632a6`（macOS 不设托盘 tooltip，`TRAY_TOOLTIP_ENABLED`）、`063c22d8d`（macOS 面板加 `NSWindowCollectionBehaviorFullScreenAuxiliary`）、`2abcaa6ee`（Codex OAuth 卡显示「账号 · 套餐」）、`5d961a3a7`（路由专用卡的终端按钮置灰并说明原因）、`0f593e9fd`（侧栏底部项按语言宽度自适应）、`51a96e24b`（德语下侧栏不截断）、`af791fd0e`（OMO Slim 分类属性未定义时无限重渲染）、`f16a9d742`（更新摘要不再被压扁）、`3706cac35`（Linux 先试 WebView 剪贴板）、`6463262c7`（macOS 只认 `Claude.app`）、`18f856159`（Skills「立即重新同步」）、`c1bf062d2`（会话按项目分组折叠 Codex 项目外聊天）、`72fe4edf0`（请求日志状态码筛选扩充）。
7. **数据库与迁移**：`schema.rs` 新增 `24 =>`（补 `enabled_copilot` 到 `mcp_servers`/`skills`）与 `25 =>`（补 `enabled_workbuddy`，并幂等回补 `enabled_omp`/`enabled_dsh`/`enabled_copilot`）；`SCHEMA_VERSION` 24 → 26；`create_tables_on_conn` 的建表语句新增 `enabled_copilot`/`enabled_workbuddy` 两列。
8. **依赖与物料**：`Cargo.toml` 新增 `aho-corasick = "1.1"`（隐私过滤 secrets 匹配）；`Cargo.lock` 仅新增该依赖与 `cc-switch` 版本行；`package.json` 仅版本号；`pnpm-lock.yaml` 上游零改动；`tauri.conf.json` 仅版本号；`capabilities/default.json` 上游本轮零改动。
9. **CI**：`ci.yml` 仅 1 行（`README*.md` 加入 frontend paths filter）；`release.yml` 与 `wsl2-nightly.yml` 上游本轮零改动。

新增文件 76 个（`git diff --name-status --diff-filter=A v4.0.28 v4.0.31` 的全部 A 项），fork 侧无自有语义、随上游整体落地：10 个 release notes（`v4.0.2{9,30,31}-{en,ja,zh}.md`）、`docs/copilot-cli-integration-zh.md`、4 个 README（KO/RU/TR/ZH-TW）、后端 20 个、前端 30 个、测试 10 个（完整清单见 brief「目录结构 / 新建」）。删除 0、重命名 0。

### 数据库 schema 终态（26）

- `SCHEMA_VERSION = 26`。迁移链在 fork 侧必须同时满足「fork 老库（25）」与「上游老库（24/25）」两条升级路径：
  - `24 =>`：上游 v4.0.29 的 copilot 列，**并与 fork 既有的 24→25 臂合并**——同一臂内先幂等补 `mcp_servers`/`skills` 的 `enabled_dsh`，再补 `session_log_sync.parser_state`（fork 既有语义），最后补 `enabled_copilot`；全部 `add_column_if_missing`，重复执行安全。
  - `25 =>`：取上游原样——补 `enabled_workbuddy`，并幂等回补 `enabled_omp`/`enabled_dsh`/`enabled_copilot`（兼容上游早期开发版形状）。
- `create_tables_on_conn` 的 `mcp_servers`/`skills` 建表语句含 `enabled_copilot`/`enabled_workbuddy`（取上游）。
- fork 的 `stream_check_logs` 建表语句与既有迁移臂保持不变；`database/migration.rs` 上游本轮零改动。
- 升级前自动备份数据库的行为不变（`database/mod.rs` 上游仅 1 行改动）。

### 孤儿 stream_check 豁免终态（延续）

- `services/stream_check.rs` 本轮上游新增 `AppType::Copilot` 的 base URL 解析分支与用例（+20），按孤儿文件口径随文件落地；fork **不恢复** `pub mod stream_check;` 声明、`commands/stream_check.rs` 与 `database/dao/stream_check.rs` 保持不存在、`stream_check_provider` 全仓 0 命中。
- 该文件的改动在 fork 内完全不可达，不产生编译面变化，不触发 unused 告警处理。

### AppType / AppId 新增变体（Copilot、WorkBuddy）

- `AppType` 新增 `Copilot`、`WorkBuddy`；`AppId`（前端）新增 `"copilot"`、`"workbuddy"`。
- fork 侧所有穷尽匹配必须补齐：`forkOfficialAllowlist: Record<AppId, string[]>`（新增条目，见「预设白名单终态」）、`tray::app_display_name`（随上游）、`AppType::all()`/`is_additive_mode`（随上游）、`services/provider/live.rs` 的写入分支（随上游）、`config/appConfig.tsx` 的应用元数据（随上游）。
- **不**为这两个应用新增 fork 能力（Q4 已确认）：逐模型连通性测试保持只对 Claude/Codex 生效（`protocol.rs::TargetBuilder::for_app` 对 Copilot/WorkBuddy 返回 `None`，`model_ids.rs` 不新增分支）；`ModelQuickSwitch` 与模型徽章按既有 `isModelCapableApp` 门控不出现；跨应用导入来源列表不新增这两项；右键置顶/置底等通用能力按既有实现对其自然生效（属于排序索引的通用行为，非新增功能）。

### 隐私过滤器终态（上游新能力）

- 设置项 `privacy_filter`（及工具结果子开关）在「设置 → 数据 → 隐私过滤器」可开关，默认关闭；两命令 `get_privacy_filter_config` / `set_privacy_filter_config` 注册在 `lib.rs` 的 settings 命令区（fork 的其它 settings 命令注册保持原位）。
- 过滤挂点在 forwarder egress（`proxy/forwarder.rs` 发往上游前的最后一步），覆盖故障转移重试与 CC Switch 自生成的压缩摘要；工具说明文字不处理；仅在路由与聚合模式生效。
- 规则完全本地、不调用模型；替换不可逆；占位符跟随界面语言（ko/ru/de 暂用英文）。
- fork 不对其做定制；fork 的 `forwarder.rs` 既有注释与测试补列在合并后保留。

### 本地化终态（8 语种）

- 语种：`en`、`zh`、`zh-TW`、`ja`、`ko`、`ru`、`tr`、`de`。`ko`/`ru`/`de` 为上游新文件，整文件随上游、不加 fork 键。
- 既有 4 个 locale（`en`/`ja`/`zh`/`zh-TW`）上游本轮各 +161/−11 的键逐字落地；fork 键段（`connectivityTest.*`、`providerModel.*`、`devpanel.*`、`trayStyleHelp` 等 284 个 fork 专属键）保留。
- `tr.json` 本轮不在重叠面（fork 与上游 tag 逐字节一致），整文件随上游、终态与 `v4.0.31` tag 逐字节一致，**不补 fork 键**。
- 合并后对全部 8 个文件按对象作用域显式查重（`object_pairs_hook` 类），`dup=0`。
- **一致性测试口径（用户确认）**：`tests/config/localeParity.test.ts` 保留其对上游键的严格校验（每个语种键集合与 `en.json` 一致、插值变量与标签一致、非空），但跳过 fork 专属键——实现方式为读取一份**单一来源的 fork 专属键清单**（由 `en.json` 减 `v4.0.31` 的 `en.json` 生成，284 键），文件内注明重新生成方式；测试据此过滤 reference 与 translations 后再比对。`tests/config/readmeParity.test.ts` 保留，但从校验列表显式排除 fork 专属改写的 `README.md`（其余 7 份上游 README 仍逐个对齐章节层级与赞助商链接）。`koreanDetection`/`languageBoundaries` 原样取上游。
- 托盘语言映射（`tray.rs::map_locale_to_tray_language`）取上游（新增 ko/ru/de 与子标签边界处理）；前端 `getInitialLanguage` 取上游（`tests/i18n/languageBoundaries.test.ts` 覆盖）。

### CI 终态

- `ci.yml` = fork 现存结构 + 上游本轮唯一改动（`README*.md` 加入 frontend paths filter）。fork 的裁剪语义全部保留：无 `schedule`/`workflow_dispatch`、四个 job 的 fork `if` 口径（push main 全量跑）、后端 `cargo nextest`、WSL2 restore-only rust-cache 与 `continue-on-error`、fmt-check 在 Linux 独占前置。
- `release.yml` 上游本轮零改动 → 保持 fork 裁剪版：只构建 macOS + Windows、无 Linux bundle、无公证 stapler、tag 守卫、**macOS runner `macos-15`**、Windows x64 + arm64。
- `wsl2-nightly.yml` 上游本轮零改动。

### 构建物料终态

- `src-tauri/Cargo.toml`：新增 `aho-corasick = "1.1"`；fork 的 `version = "4.0.31-1"`、`repository = "https://github.com/tunecc/cc-switch"`、无 `tauri-plugin-updater`、`crate-type = ["rlib"]`、`codegen-units = 1` 保留。
- `package.json`：`version = "4.0.31-1"`、`dev:fork` 脚本保留、无 `@tauri-apps/plugin-updater`。
- `src-tauri/tauri.conf.json`：版本 `4.0.31-1`（fork 侧 updater 相关裁剪保留）。
- `src-tauri/Cargo.lock`：新增 `aho-corasick` 依赖行到 `cc-switch` 包、`cc-switch` 版本行；零其他改动。
- `pnpm-lock.yaml`：上游零改动，fork 的 -10 行（无 updater 三段）保留。

### 供应商编辑页与表单叠加终态

- 上游 `EditProviderHost.tsx` + `editProviderStore.ts` + `lib/preloadOnIdle.ts` 重构取上游；`AddProviderDialog.tsx`/`EditProviderDialog.tsx` 的上游改动（+5/−1、+3/−1）落地在其上。
- fork 在这些文件与 `ProviderForm.tsx`、`ClaudeFormFields.tsx`、`BasicFormFields.tsx`、`ClaudeDesktopProviderForm.tsx`、`ProviderPresetSelector.tsx` 上的既有改动（`websiteUrl2` 字段与校验、连通性测试配置区、跨应用导入入口、Claude 模型直达区、预设白名单过滤）在新结构上逐项重放且可用。
- `ProviderCard.tsx`：上游密度 token、图标随主题、Codex OAuth 身份行（`codexOfficialIdentity === "native_login" || isCodexOauth`）与 Copilot 配额页脚取上游；fork 的副标题优先级链、模型徽章按钮、双官网链接、右键置顶/置底、`ConnectivityBadge` 逐行保留。
- `ProviderCardActions.tsx`：上游 `IconAction` + `openTerminalDisabledReason`（路由专用卡终端置灰）取上游；fork 的右键菜单动作与置顶/置底项保留。
- `ProviderList.tsx`：上游 WorkBuddy 官方卡与 Copilot 默认卡接线、`isOfficialAccount` 判定取上游；fork 的连通性批量检测入口、卡片排序与右键动作、导入入口保留。
- `GeneralSection.tsx`：上游无本轮改动；fork 的面板可见性设置区保持不变。

### 预设白名单终态

- 上游新增 Copilot（沿用 Pi 供应商预设）与 WorkBuddy（自有预设目录）两族；两族随上游文件落地。
- `forkOfficialAllowlist.ts` 的 `Record<AppId, string[]>` 必须新增 `copilot` 与 `workbuddy` 两条（Build 期按上游目录实际 `name` 取值：只保留本机推理条目；无对应条目时为空数组，与 `mcode` 同口径）。`forkPresetFilter.ts` 判定实现不改。
- 预设条目 id 编号契约延续：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- `IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`devpanel/`、连通性测试前后端链路（`services/connectivity_test/`、`commands/connectivity_test.rs`、两个命令注册、`ConnectivityBadge`/对话框/批量检测、`useConnectivityProbe`、`shouldShowTestEntry`）、模型徽章与 `ModelQuickSwitch/`、`websiteUrl2` 全链路（`Provider`/`UniversalProvider` 字段、表单、DB 列、`SELECT` 列序与行偏移）、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏 `tray_left_click_never_opens_the_menu`、跨应用导入接线（`ProviderImportEntry`、`useProviderImportSources`/`useProviderImportApply`、`providerImport.ts`）、右键置顶/置底、DevPanel 与 fork 构建标识、tunecc 4 处 URL 与两个测试断言、无更新器（`install_update_and_restart` 桩 + `check_app_update_available` 桩）、无 `stream_check` 接线。
- 移除清单取证口径：`git grep -I -n 'tauri_plugin_updater\|plugin-updater\|install_update_and_restart' HEAD -- src-tauri/src`（实现零命中，命令桩除外）、`git grep -rn 'stream_check_provider' HEAD -- src-tauri/src/lib.rs src-tauri/src/commands/mod.rs` 零命中；保留清单以 `git grep -I -l` 逐项在位。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮实测结果修订；新增 §4.14「v4.0.31 轮的叠加要点」（Copilot/WorkBuddy 新 AppType 的穷尽匹配点、隐私过滤器 egress 挂点、DB 26 双路径迁移臂、编辑页重构叠加、八语种与 fork 键豁免、macOS runner 现状 `macos-15` 的更正）。
- `docs/comet/specs/upstream-sync/spec.md`：归档时整体重写为本轮终态（本文件）。
- `docs/comet/specs/database-schema-migrations/spec.md`：**必须更新**——schema 由 25 升到 26，新增两臂语义（本轮与历轮「schema 不变」不同）。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 重放前后提交数之差只允许「被判空丢弃」或「本轮新增」；主题序列 diff 为 0；patch-id 差异逐条归类「冲突停车」或「仅上下文位移/被上游同名声明消化」；冲突停车清单逐条记录文件、双方语义与解法。
- `.comet/config.yaml` 在 rebase 中途被历史提交改回旧内容时，按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并纳入提交；终态与同步前一致。

### 落地保真核对（口径，最终态复算）

- 四 ref 行多重集差集：`v4.0.31` / `v4.0.28`（基线） / `pre-sync-v431` / `HEAD`；320 个上游文件与 fork 侧代码文件全部参与；非重叠上游文件在 fork 侧缺失为 0；重叠 60 文件的两侧缺失行逐行归因并带重数；归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 白名单条目）」；出现无法归类的缺失行即判定失败。
- 复算必须在最终态提交之后进行；修复类提交会改变保真数字，规格与文档中的数字随修复刷新或改为现取口径。

### 版本号

- 四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包）终态统一 `4.0.31-1`；本地 annotated tag `v4.0.31-1` 在验收通过、用户接受归档并单独授权交付后创建并推送。

### 交付（归档后单独授权）

- Build/Verify 不执行任何远端写操作；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.31-1` 的推送；只授权这两项远端动作，不创建 PR。

### `.comet/config.yaml` 保护

- 该文件是 fork 专属文件且会被重放的历史提交改回旧内容；rebase 中途显式恢复并纳入提交，否则 Native Hook 拒绝写入；终态与同步前一致。

### 已知流程坑位（沿用 + 本轮新增）

- 沿用：取证 fetch 禁 `--prune-tags`；`.comet/config.yaml` rebase 保护；预设 id 编号契约；locale 对象作用域查重；`cargo fmt --check` 进正式检查计划；时间敏感用例 flaky 边界（SessionManagerPage 00:00–00:30、AppsPage CI 并发竞态）按「与上游逐字节比对 + 本地重复跑」判定；绝对条数会被后续提交作废，一律用现取口径。
- 本轮新增：①新增 `AppType::Copilot`/`WorkBuddy` 会让 fork 侧所有穷尽 `match`/`Record<AppId, …>` 编译失败，`cargo check --all-targets` 与 `pnpm typecheck` 必须全量跑，不能只跑定向文件；②DB 本轮**必须**合并为 26，两条老库路径（fork 25 / 上游 25）都要能从 `25 =>` 出去，`migration` 幂等性要实测；③八语种一致性测试与 fork 专属 284 键的豁免清单必须由生成结果驱动，手写易漂移；④`readmeParity` 必须排除 fork 的 `README.md`，否则 8 语 README 会在 fork 上永久红；⑤Comet Hook 版本偏差（项目侧脚本落后 CLI）在 Shape 期已用 `comet update --current-project --skip-self-update --yes --scope project` 刷新项目侧 skills/hooks 修复；重放中途 hook 拒绝写入时先核对项目侧 hook 是否仍落后。
