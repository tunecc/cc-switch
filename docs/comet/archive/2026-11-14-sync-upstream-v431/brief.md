# 目标

fork（tunecc/cc-switch）的 main 继续同步到上游 farion1231/cc-switch 最新已发布 annotated tag `v4.0.31`（tag 对象 `5ad4f9701aeb1e82f327445420451f6c889260e3`，剥离提交 `3c76d3bda670297dd8c27d7d9be9b18a4c9143f5`，2026-11-12 发布；本轮跨 `v4.0.29`、`v4.0.30`、`v4.0.31` 三个发布点），按原顺序重放 `v4.0.28..main` 的全部 212 个 fork 提交（作者全为 `Tune`），fork 版本号 `4.0.28-2` → `4.0.31-1`。上游本轮的功能与修复全部落地（fork 已裁剪/已移除段除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户本轮额外要求：**如果 fork 做过的功能上游也新增了，先询问并分析「保留上游还是保留 fork 更好」**。

**本轮核查结论（已按历轮三步口径取证，证据见 D2）：上游 v4.0.29–v4.0.31 没有重复实现 fork 的任何功能，本轮不产生「保留上游 / 保留 fork」二选一。** 上游本轮主轴是三个新域——受管应用 **GitHub Copilot CLI**（v4.0.29）、**隐私过滤器**（v4.0.30）、受管应用 **腾讯 WorkBuddy**（v4.0.31）——加八语种 i18n 与大量代理/会话/托盘修复，均为 fork 零语义的新域；唯一同名域仍是上游 `stream_check`（fork 早已整体移除可达链路），本轮上游为它加了 `AppType::Copilot` 分支，按既定孤儿豁免口径落进孤儿文件、维持移除决策（D4）。

# 范围

## 同步区间与取证

- **区间**：`v4.0.28..v4.0.31`，实测 85 个提交、320 个文件、+53034/−1251（76 新增 / 244 修改 / **0 删除 / 0 重命名**）。
- **fork 侧重放面**：`v4.0.28..main` 共 212 个提交（`git rev-list --count`，全部 `Tune` 作者），含 v4.0.28 轮归档提交、`connectivity-window-and-context-menu` 轮实现与两个 UI 提交（`a9631676e`、`a47247c1f`）。
- **重叠面 60 个文件**（`comm -12 <(git diff --name-only v4.0.28 v4.0.31|sort) <(git diff --name-only v4.0.28 main|sort)`）。逐文件核后均为「不同行区域的机械叠加」或「上游单向新增」，无行为碰撞；最大摩擦点是 4 个 locale、`schema.rs`、`tray.rs`、`ProviderList.tsx`、`ClaudeFormFields.tsx`、`App.tsx`、`forwarder.rs`、`services/provider/mod.rs`、`commands/misc.rs`，明细见 D7 与完整目标规格「冲突解决」。
- **上游是否齐平**：`git rev-list --count v4.0.31..upstream/main` 现取 **6**（上游 tag 之后还有 6 个未发布提交，含 `fix(providers): show bound GitHub account on Copilot provider cards`、`chore: remove unused code, dependencies, and files`、两处 panic 后锁恢复修复等）。按历轮「只锁已发布 tag」的既定口径，这 6 个不纳入本轮（D1 / Q1）。

## 上游本轮新增与主要改动（按发布点）

1. **v4.0.29（`efbec38f0`）**
   - 新受管应用 **GitHub Copilot CLI**（`bd487e839` #8753，17 提交成串）：官方登录卡（不写文件、按卡片模型/推理强度启动终端、显示额度）+ 自带 Key 供应商写 `$COPILOT_HOME/providers.json`（`copilot_config.rs`、`services/provider/copilot_direct.rs`、`commands/copilot*`）；只改自家条目、写入前整份校验；默认模型所在条目标默认、不可删；MCP/Skills/提示词同步（`mcp/copilot.rs`）；会话管理（`session_manager/providers/copilot.rs`）与用量导入（`session_usage_copilot.rs`）；deeplink 导入认 `providers.json` 写法与 `bearerToken`（`deeplink/provider.rs` +192）。
   - **i18n 七语同步**：韩语 `5a3d7f92a`（#8794）、俄语 `cdca09842`（#7788）入场，`3561af531` 起七语种同步维护；KRW 币种。
   - 代理/Codex 修复：`72e826edf` call-less 工具结果归一化、`3bde82624` Codex→Anthropic 默认 max_tokens 8192→32000、`e38a4fd13` 官方卡模型列表经路由透传（新 `proxy/codex_models_passthrough.rs`）、`5c4622690` WSL 下 catalog 只写文件名、`5d961a3a7` 路由专用卡终端置灰、`83d744b99` 额度读默认登录前先校验归属。
2. **v4.0.30（`3a0b86a26`）**
   - **隐私过滤器**（`32365a547` #8951，新 `proxy/privacy_filter/{mod,pii,secrets,gitleaks.toml,tests,cases.json}` + `PrivacyFilterConfigPanel.tsx` + 设置项两命令；替换邮箱/手机/身份证/银行卡/IPv4/各类密钥为占位符，默认关，仅路由/聚合模式）。
   - 供应商编辑页提速（`d0e47b2d6` #9357，新 `EditProviderHost.tsx` + `editProviderStore.ts` + `lib/preloadOnIdle.ts`，空闲预加载编辑页）。
   - Codex OAuth 卡副标题改「账号 · 套餐」（`2abcaa6ee` #9300，ProviderCard）；Copilot 官方卡并入「已添加」组（`4a1369f26`）。
   - 修复：`a6200c1ef`/`08ec82aab` 第三方原生 Responses 上游剥离 OpenAI 私有字段、`74f0d41ce` 工具参数重复键只留最后一个、`5628bb118` 主窗口收回工作区（新 `window_fit.rs`）、`abf50589e` AGY 锁区原因、`16092b97e` AGY 用量同步跳过未变会话、`d4647fbbf` Skills 元数据后台刷新、`7d5fb6574` Gemini 流式模型归属、`af791fd0e` OMO Slim 无限重渲染、`f16a9d742` 更新摘要被压扁；定价新增 Claude Fable 5.2 / Gemini 4 Carbon。
3. **v4.0.31（`3c76d3bda`）**
   - 新受管应用 **腾讯 WorkBuddy**（`d0da1349f` #8757 + `4587b5c0a`/`f2420dc85`/`61bd4d422`/`acdab9c9a`/`29aed9040`）：自定义模型写 `models.json`（`workbuddy_config.rs`、`workbuddyProviderPresets.ts`）、官方账号收录与切换（`services/workbuddy_account/{mod,quota,tests}.rs`、`commands/workbuddy_account.rs`、`WorkBuddyAccountSection.tsx`、`WorkBuddyQuotaFooter.tsx`）、MCP/Skills/提示词同步（`mcp/workbuddy.rs`）、会话与用量（`session_manager/providers/workbuddy.rs`、`session_usage_workbuddy.rs`）。
   - **德语**入场（`51a96e24b`），八语种界面 + 八语 README（`c0a8d87b1`）；新增 `tests/config/localeParity.test.ts`、`tests/config/readmeParity.test.ts`、`tests/i18n/languageBoundaries.test.ts`、`tests/i18n/koreanDetection.test.ts`。
   - 隐私过滤器改到 egress 出口过滤（`664a46ab8` #9460）；Codex rollout 解析优化（`4376e5dfa`）；Skills「立即重新同步」（`18f856159` + `useSkillsResync.ts`）；会话按项目分组折叠 Codex 项目外聊天（`c1bf062d2`）；请求日志状态码筛选扩充（`72fe4edf0`）。
   - 修复：`4151bc33d` Azure 资源不匹配/AES 思考记录拒绝后去思考重试、`fd9794213` Gemini 跨消息工具结果合并、`da830bfd1` Gemini Native 中途 system 消息保位（缓存命中）、`e91114fe2` Gemini Native 流式用量、`479e632a6` macOS 不设托盘悬停提示、`063c22d8d` macOS 全屏 Space 上面板可见、`f6423b5d8` 保留官方登录开关即时生效、`f1d438e0a` GPT 同名模型显示名、`6463262c7` macOS 只认 Claude.app、`3706cac35` Linux 剪贴板、`36041067b` Copilot 未绑定账号文案、`457f898c7` Codex fork 用量序号、`86aeb47a6` skill symlink 报错带 OS 错误、`cf341a8ae` `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` 随供应商写入、`cf319bcf3` DSH 兼容编辑器、`0f593e9fd` 侧栏底部项按语言宽度自适应、`23c57e8d8` Copilot maxPromptTokens 派生、`60a68363f` clippy 测试代码 lint。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v431/{brief.md,specs/upstream-sync/spec.md}`；不建立能力关联、不产生 `capability-association.yaml` 与 `delta.yaml`（沿用历轮决定）。
- 归档时由 Runtime 生成 `docs/comet/archive/<date>-sync-upstream-v431/`。
- rebase 前新增本地安全参照分支 `pre-sync-v431`（= 同步前 main `a47247c1f`），不推送。
- 随上游落地的新增文件 76 个（全部 fork 零语义、整体落地）：10 个 `docs/release-notes/v4.0.2{9,30,31}-{en,ja,zh}.md`、`docs/copilot-cli-integration-zh.md`、`README_{KO,RU,TR,ZH-TW}.md`；后端 20 个（`copilot_config.rs`、`workbuddy_config.rs`、`window_fit.rs`、`mcp/{copilot,workbuddy}.rs`、`proxy/privacy_filter/*` 6 个、`proxy/codex_models_passthrough.rs`、`proxy/providers/codex_responses_arguments.rs`、`services/provider/copilot_direct.rs`、`services/session_usage_{copilot,workbuddy}.rs`、`services/workbuddy_account/{mod,quota,tests}.rs`、`session_manager/providers/{copilot,workbuddy}.rs`、`commands/workbuddy_account.rs`、`tests/{copilot,workbuddy}_commands.rs`）；前端 30 个（`EditProviderHost.tsx`、`editProviderStore.ts`、`preloadOnIdle.ts`、Copilot/WorkBuddy 表单与配额组件、`PrivacyFilterConfigPanel.tsx`、`WorkBuddyAccountSection.tsx`、`useSkillsResync.ts`、`copilotProviderPresets.ts`、`workbuddyProviderPresets.ts`、`i18n/locales/{ko,ru,de}.json`、`whats-new/4.0.{29,30,31}.json` 等）；测试 10 个。
- 交付步骤（验收通过、归档且用户另行授权后）新增本地 annotated tag `v4.0.31-1`。

### 修改

- 60 个重叠文件，按类别：
  - 版本与物料 5 个：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`（唯一依赖变动新增 `aho-corasick = "1.1"`）、`.github/workflows/ci.yml`（上游仅 1 行：`README*.md` 进 frontend paths filter）。
  - 后端 18 个：`lib.rs`（Copilot/WorkBuddy 命令注册、`window_fit`/`copilot_config`/`workbuddy_config` 模块、隐私两命令、`refresh_local_skill_metadata`、托盘 tooltip 条件化、`is_chinese_locale` 分隔符解析；fork 的无 updater、connectivity 两注册、`show_menu_on_left_click(false)`、`Reopen` 复用保留）、`commands/misc.rs`（+286：Copilot 终端启动/工具探测/`--allow-all`；fork 的 tunecc URL 保留）、`commands/mod.rs`、`commands/settings.rs`、`settings.rs`（隐私过滤设置 + `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`；fork 的 `VisibleSidebarPanels` 保留）、`database/schema.rs`（**+427：24→25 补 copilot 列、25→26 补 workbuddy 列并幂等回补 omp/dsh/copilot**；fork 的 `stream_check_logs` 与既有臂保留）、`database/{mod,tests}.rs`、`database/dao/mcp.rs`、`deeplink/provider.rs`、`provider.rs`、`proxy/forwarder.rs`（+909：隐私过滤器 egress 挂点、Responses 字段剥离、思考重试）、`proxy/providers/{claude,codex,mod}.rs`、`services/mod.rs`（+3 模块声明）、`services/provider/{live,mod}.rs`（Copilot/WorkBuddy 的 live 写入分支 + `imports_default_config`）、`tray.rs`（+303/−71：新 AppType 文案、八语 locale 映射、`TRAY_TOOLTIP_ENABLED`）、`tray_panel.rs`（macOS FullScreenAuxiliary；fork 的 `panel_visible()` 保留）。
  - 前端 22 个：`App.tsx`（+78/−45）、`ProviderList.tsx`（+28：WorkBuddy 官方卡与 Copilot 默认卡接线）、`ProviderCard.tsx`（+81/−16）、`ProviderCardActions.tsx`（`IconAction` + `openTerminalDisabledReason`）、`AddProviderDialog.tsx`、`EditProviderDialog.tsx`、`forms/{BasicFormFields,ClaudeDesktopProviderForm,ClaudeFormFields,ProviderForm,ProviderPresetSelector}.tsx`、`settings/{SettingsPage,sections/GeneralSection}.tsx`、`shell/Sidebar.tsx`、`config/appConfig.tsx`（+47：Copilot/WorkBuddy 应用元数据）、6 个预设文件（`gemini/grokBuild/hermes/openclaw/opencode/pi`，上游均只 1 行）、`i18n/locales/{en,ja,zh,zh-TW}.json`（各 +161）、`lib/api/settings.ts`、`lib/query/mutations.ts`、`types.ts`。
  - 测试 5 个：`tests/components/{AppsPage,GrokBuildProviderForm,ProviderCardActions,ProviderList,ProviderPresetSelector}.test.tsx`。
- fork 侧文档：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测修订并追加 §4.14（v4.0.31 轮要点，含 macOS runner 已改 `macos-15` 的现状更正）；归档时把 `docs/comet/specs/upstream-sync/spec.md` 整体重写为本轮终态。

### 删除

- 上游本轮删除文件 0、重命名 0。fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回（`schema.rs` 的 `stream_check_logs` 建表保留；`commands/stream_check.rs`、`database/dao/stream_check.rs` 保持不存在；`services/mod.rs` 不恢复 `pub mod stream_check;`）。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离 `current`，直接沿用 main）。
- 不引入 `upstream/main` 上 tag 之后的 6 个提交。
- 不重新接线 `stream_check`、不恢复 updater（`tauri_plugin_updater` / `@tauri-apps/plugin-updater` / `install_update_and_restart` 实现）。
- 不复活 `release.yml` 被裁段（Linux bundle、公证 stapler）；macOS runner 维持 fork 现状 `macos-15`（v4.0.24 轮的 `macos-14` 结论已被 GitHub 下线 macos-14 反转，不得回退）。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不为上游新增的第三方预设族改写 fork 白名单判定实现；只按既有白名单结构为新 app 补条目（D5）。

# 非目标

- 不改 fork 自有功能实现与形态：逐模型连通性测试链、托盘左键契约、模型徽章与快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识、`forkOfficialAllowlist`/`forkPresetFilter` 判定逻辑。
- 不把 fork 专属能力扩展成新应用的新功能：Copilot CLI / WorkBuddy 只做「能添加、能切换、能开终端、能同步 MCP/Skills/提示词」的编译与门控级适配，逐模型连通性测试、模型徽章快捷切换、跨应用导入来源不扩展到这两个应用（Q4 已确认）。
- 不做本轮之外的功能开发、重构或依赖升级；Rust 依赖变动只取上游（`aho-corasick`），前端依赖上游本轮零改动（`pnpm-lock.yaml` 零 diff）。
- 不对上游新增的隐私过滤器做 fork 侧定制（随上游落地、默认关）。

# 决策

- **D1｜同步目标与工作区**：锁已发布 tag `v4.0.31^{}` = `3c76d3bda`，不纳入 `upstream/main` 的 6 个 tag 后提交（口径与历轮一致：只同步已发布版本）。工作区 `current`，沿用 main 与当前目录；`pre-sync-v431` 只作回退参照分支，不是工作区。
- **D2｜「上游是否重复实现 fork 功能」核查：没有，不产生二选一**。取证步骤：①`git log --grep` 与 `git diff` 全量词表扫描 fork 功能标识（`connectivity_test`/`stream_check`/`website_url_2`/`websiteUrl2`/`ModelQuickSwitch`/`pinned_at`/`provider_import`/`ProviderImport`/`strip_one_m_suffix`/`IS_FORK_BUILD`/`VisibleSidebarPanels`）——上游新增行 0 命中（唯一命中是孤儿文件 `services/stream_check.rs` 自身被修改）；②按功能名扫上游新增 UI 概念（`onContextMenu`/`ModelBadge`/`visiblePanels`/`isPinned`/`quickSwitch`/`ProviderImport`）——0 命中；③逐项排除同域相邻：上游 Copilot/WorkBuddy「官方账号」与 fork 无关；上游「一键导入链接」是 deeplink 导入、与 fork 的跨应用配置导入不同域；上游八语 README 与 fork README.md（fork 专属改写）是文件级冲突非功能重复；上游 `stream_check` 为孤儿链路（D4）；上游 ProviderCard 副标题改的是 Codex OAuth 身份行（非 fork 的官网链接优先级链）；上游托盘两处修复不触 `TrayIconEvent::Click` 语义。**结论：用户「上游重复则询问」的条件本轮未触发。**
- **D3｜数据库版本必须合并（本轮硬约束）**：fork 现为 25、上游本轮 24→25（`enabled_copilot`）→26（`enabled_workbuddy`，并幂等回补 `enabled_omp`/`enabled_dsh`/`enabled_copilot`）。终态取上游 `SCHEMA_VERSION = 26`，把 fork 既有 `24→25` 臂（DSH 列 + `session_log_sync.parser_state`）合并进上游 `24→25` 臂（补 copilot 列，全部 `add_column_if_missing` 幂等），新增 `25→26` 臂取上游原样；两条幂等臂保证老库（fork 25 / 上游 25）都能升到 26。
- **D4｜孤儿 stream_check 豁免延续**：上游本轮为 `stream_check.rs` 新增 `AppType::Copilot` 分支与用例（+20），随文件落地；fork 不恢复模块声明与命令注册，`stream_check_provider` 保持 0 命中。
- **D5｜预设白名单**：上游新增 Copilot（沿用 Pi 目录）与 WorkBuddy（自有目录）预设族。fork 白名单按既有结构为新 app 补条目（`copilot`/`workbuddy` 只留本机推理条目或无官方时的空数组，具体 `name` 在 Build 期按上游目录实际取值），过滤顺序（编号 → 过滤上游 `hidden` → 过滤 fork 白名单）不变，`forkPresetFilter.ts` 判定不改。按 Q4 结论，白名单条目是「编译与门控级适配」的必要部分（`Record<AppId, string[]>` 穷尽要求），不属于 fork 能力扩展。
- **D6｜CI 与物料**：`ci.yml` 取上游 1 行（`README*.md` 进 frontend paths filter）+ fork 裁剪语义全保留；`release.yml` 上游本轮零改动 → 保持 fork 版（macOS `macos-15`、Windows x64/arm64、无 Linux bundle、无公证）；`wsl2-nightly.yml` 上游本轮零改动。四处版本 `4.0.31-1`；`Cargo.lock` 只增 `aho-corasick` 与 cc-switch 版本行；`pnpm-lock.yaml` 终态仍无 updater 三段。
- **D7｜ProviderCard / 表单 / 编辑页重构叠加**：上游 `EditProviderHost` + `editProviderStore` + `preloadOnIdle` 重构取上游；fork 对 `AddProviderDialog`/`EditProviderDialog`/`ProviderForm`/`ClaudeFormFields` 的 `websiteUrl2`、连通性测试区、导入入口等改动在新结构上重放（本轮最大人工合并面）；上游 ProviderCard 副标题身份行改动取上游，fork 官网链接优先级链、模型徽章、置顶/置底保留。
- **D8｜本地化与一致性测试**：4 个既有 locale 上游新增与改写逐字取上游、fork 键段保留；`ko`/`ru`/`de` 整文件随上游；合并后按对象作用域显式查重 `dup=0`。一致性测试按已确认口径处理：`localeParity.test.ts` 保留并要求 skip 一份 fork 专属键单一来源清单（284 键，Build 期生成 + 注明重新生成方式），`readmeParity.test.ts` 保留并从列表排除 fork 专属改写的 `README.md`；`koreanDetection`/`languageBoundaries` 原样取上游。
- **D9｜交付授权延后**：Build/Verify 不推送、不打 tag；归档完成后单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.31-1` 推送；不创建 PR。

## 已确认的用户决定（2026-11-14）

- **Q1 同步目标 → 只到 v4.0.31 tag**。`upstream/main` 上 6 个未发布提交不纳入本轮，留待其发布后另起一轮（写入 D1 约束）。
- **Q2 八语种一致性 → 给上游测试加 fork 键豁免**。保留 `localeParity.test.ts` 检上游键的一致性强度，只把 fork 专属键排除在校验外：先落地一份 fork 专属键单一来源清单（284 键，Build 期从 `en.json` 减上游 `v4.0.31` 的 `en.json` 生成），测试读该清单跳过这些键；清单需注明重新生成方式，避免后续漂移。不新增非中文翻译、不改既有 6 个语种文件（`tr` 仍与上游 tag 逐字节一致）。
- **Q3 八语 README 一致性 → 让测试跳过 `README.md`**。`readmeParity.test.ts` 只校验上游那 7 份 README（`README_ZH`/`ZH-TW`/`JA`/`KO`/`TR`/`RU`/`DE`），`README.md` 以 fork 专属改写为由显式排除并写明原因；不整份移除该测试。
- **Q4 新应用覆盖 → 只做编译级适配**。Copilot CLI / WorkBuddy 只保证：能添加与切换、能开终端、能同步 MCP/Skills/提示词、会话与用量可读、预设白名单有条目、所有 `AppType` 穷尽匹配与前端门控编译通过；**不**把 fork 的逐模型连通性测试（现仅 Claude/Codex）、模型徽章快捷切换、跨应用导入来源扩展到这两个新应用。D5 与「非目标」按此口径执行。

# 验收示例

- 同步基线与重放完整性可核对：`git merge-base main v4.0.31^{}` 为 `8656ebd91`（v4.0.28 剥离提交），`git rev-list --count v4.0.28..HEAD` = 212（重放）+ 本轮新增提交数（现取口径），重放主题序列与 `pre-sync-v431`（= `a47247c1f`）一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移」。
- fork 全部魔改在终态仍然在位：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项 `git grep -I` 取证并跑对应测试。
- 上游三个新域落地：Copilot CLI 与 WorkBuddy 作为受管应用可用（添加/切换/终端/MCP/Skills/会话/用量）、隐私过滤器可开关且默认关、八语种界面可切换；三者后端命令均在 `lib.rs` 注册到正确位置。
- 上游 v4.0.28 之后的代理与 Codex 修复落地：Responses 私有字段剥离、工具参数重复键合并、思考记录拒绝后重试、Gemini 跨消息工具结果合并与 system 消息保位、Codex→Anthropic 默认 32000、官方卡模型列表透传、`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` 随供应商写入逐项在位。
- 数据库终态可复算：`SCHEMA_VERSION = 26`；`24→25` 臂同时含 fork 的 DSH/`parser_state` 与上游的 copilot 列，`25→26` 臂含 workbuddy 列与幂等回补；fork 的 `stream_check_logs` 建表与全部既有迁移臂保留；`database::{schema,tests}.rs` 全用例通过。
- 本地化与一致性测试终态：8 个语种文件的上游键按 `localeParity` 校验一致（fork 专属键经单一来源豁免清单 skip，清单与 `en.json` 减上游 `v4.0.31` 的差集逐键相等）；`readmeParity` 只校验上游 7 份 README 且显式排除 fork 的 `README.md`；4 个既有 locale 的上游新增键逐字落地、fork 键段保留；`tr.json` 与上游 tag 逐字节一致；按对象作用域显式查重 `dup=0`；`koreanDetection`/`languageBoundaries` 用例通过。
- 新应用只做编译与门控级适配（Q4）：Copilot CLI / WorkBuddy 的 `AppType` 穷尽匹配、`forkOfficialAllowlist` 条目、前端门控与白名单过滤全部通过；逐模型连通性测试与 `ModelQuickSwitch` 对这两个应用按既有 `shouldShowTestEntry`/`isModelCapableApp` 门控保持不出现，未新增协议适配。
- CI 与物料终态：`ci.yml` = 上游单行改动 + fork 裁剪语义全保留；`release.yml` 保持 fork 版且 macOS runner 为 `macos-15`；四处版本号 `4.0.31-1`；`Cargo.lock` 只出现 `aho-corasick` 与 cc-switch 版本行。
- 后端在新结构下编译与测试通过：`cargo check --all-targets`、`cargo fmt --check`、`cargo nextest run`、`pnpm typecheck`、`pnpm test:unit` 全绿；上游新增的 `Provider { … }` 字面量与 fork 的 `website_url_2` 无缺列。
- 交付边界与配置保护：Build/Verify 期间零远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证 fetch 不带 `--prune-tags`；`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.14 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径，脚本随 Build 落地）：`v4.0.31` / `v4.0.28`（基线） / `pre-sync-v431` / `HEAD` 四 ref 计算差集，320 个上游文件与 fork 侧代码文件全部参与，非重叠上游文件缺失为 0，重叠 60 文件的两侧缺失行逐行归因并带重数，出现无法归类的缺失行即判定失败。
