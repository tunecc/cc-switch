# 目标

fork（tunecc/cc-switch）的 main 继续同步到上游 farion1231/cc-switch 已发布 annotated tag 链 `v4.0.33` → `v4.0.34` → `v4.0.35`，最终基线为 `v4.0.35`（tag 对象 `52315d40a2f71c8c9275585c03ef1c7d5b0cb136`，剥离提交 `61c43c036ec7eb3a6950b292729d6a7094abe716`，2026-11-17 发布）。按原顺序重放 `v4.0.32..main` 的 219 个 fork 提交，fork 版本号 `4.0.32-1` → `4.0.35-1`。上游本轮功能与修复全部落地（fork 已裁剪 / 已移除段除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户本轮要求：**继续同步上游更新，保留我们自己的修改；如果我们做过的功能上游也新增了，要先询问并分析「保留上游还是保留 fork 更好」。**

本轮核查结论：三版新增域中没有需要重新做「上游 / fork」二选一的功能，唯一跨轮延续取舍是「应用内更新器」，已由用户在 v4.0.32 轮决定保留 fork 现状；上游 v4.0.34/35 只是继续增强该链路，未把它变成 fork 已有功能。fork 自有功能标识在 `v4.0.32..v4.0.35` 上游新增行中的命中仍限于共享文件里的语义相邻项，无实现重复；新能力如 Ollama Cloud 套餐额度、GitLab/Gitea/Forgejo 技能仓库、Antigravity CLI 会话删除、S3 清除配置、请求 ID 复制、Codex `/goal` 完整目标、日期范围边界、GPT-6.2 定价等在 fork 侧零对应实现。

# 范围

## 同步区间与取证

- **区间**：`v4.0.32..v4.0.35`，实测 112 个提交、494 个文件、+35,836/−36,029。其中 v4.0.33 24 个提交、v4.0.34 68 个提交、v4.0.35 20 个提交。
- **fork 侧重放面**：`v4.0.32..main` 共 219 个提交（`git rev-list --count`），含 v4.0.32 轮归档提交、`docs(sync)` 更正提交与 `chore(comet)` 配置提交。
- **重叠面 55 个文件**（`comm -12 <(git diff --name-only v4.0.32 v4.0.35|sort) <(git diff --name-only v4.0.32 main|sort)`）。最大摩擦面：`src-tauri/src/database/dao/providers.rs` 的 `&AppType` 全量签名改造、`src-tauri/src/commands/misc.rs` 的工具表重构、`src-tauri/src/commands/mod.rs`、`src-tauri/src/lib.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`src/contexts/UpdateContext.tsx`、`src/lib/api/settings.ts`、`src/components/settings/AboutSection.tsx`、5 个既有 locale、`src/config/{codex,gemini,hermes,pi}ProviderPresets.ts`、`src/config/appSpecs.ts`、`src/components/providers/ProviderCard.tsx`。
- **上游是否齐平**：`git rev-list --count v4.0.35..upstream/main` 现取 **5**（`fix(usage): keep sub-micro-dollar costs when backfilling missing prices`、`fix(test): pass AppType to get_provider_by_id in billing multiplier tests`、`fix(codex): pick up new official models sooner in stack mode`、`feat(provider): add opt-in reference cost multiplier (#9656)`、`fix(usage): collect OpenCode usage from mixed V1/V2 databases (#8363)`）。按历轮「只锁已发布 tag」口径，不纳入本轮。
- **同步前安全参照**：rebase 前打本地分支 `pre-sync-v433-v435`（= 当前 main `98b5805b6f561f6a8d33b9f845ba76e34af8a85a`），不推送。
- **取证性 fetch**：只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。

## 上游本轮改动（按主题）

1. **Ollama Cloud 套餐额度（v4.0.33）**：`services/coding_plan.rs` 识别 `ollama.com` 主机并读 `GET https://ollama.com/api/balance`，现行套餐映射月度档、旧套餐映射 5 小时与每周档；`src/config/codingPlanProviders.ts` 加 `ollama_cloud`；本地 `localhost:11434` 与相似主机不命中；新增/一键导入的 Ollama Cloud 供应商默认开启用量查询。
2. **Claude 官方切换后已开会话跟随（v4.0.33）**：切换时先把要删的地址、凭据和模型映射写成空值，约 10 秒后在应用写锁下清扫；`claude-tombstones.json` 记录待清扫项，正常退出保留至少 3 秒，启动时恢复未完成的清扫；`ANTHROPIC_MODEL` 不跟随，`AWS_*` 等透传键仍直接删除。
3. **模型列表获取修复（v4.0.33/34）**：Claude Code / Claude Desktop 的 Gemini Native 卡改走 `google-generative-ai` 请求头与 `/v1beta/models`；Google 格式请求 `pageSize=1000`；模型获取默认带 `cc-switch` User-Agent；Gemini CLI 自己的供应商也改原生 Gemini 方式获取。
4. **技能仓库多主机（v4.0.34）**：新增 `src/components/skills/repoUrl.ts`，管理技能仓库支持 GitLab、Gitea、Forgejo 与自建实例；`skill_repos.host` 与 `skills.repo_host` 记录站点，数据库迁移 `26 → 27`；浏览、安装、更新与文档入口去仓库所在站点；只支持公开 https 仓库。
5. **Antigravity 与 WorkBuddy（v4.0.33/34）**：授权中心 Antigravity 账号切换支持 Windows；会话管理可删除 Antigravity CLI 会话并清理索引/摘要；WorkBuddy 手动添加模型可配置思考强度、可关闭思考。
6. **S3 / WebDAV 同步增强（v4.0.33/34）**：WebDAV 容忍 NAS 对 MKCOL 回 400 并复查目录；上传失败区分请求构造与发送失败并脱敏；S3 自动同步在排队期间重读设置；阿里云 OSS / 腾讯云 COS / 华为云 OBS 自动改用虚拟主机风格地址；S3 设置新增「清除配置」；Skills 失效符号链接/目录联接不再让同步整体失败。
7. **代理与 Codex 修复（v4.0.33/34/35）**：Codex 工具定义 `required: null` 归一化；Codex 压缩上下文后空用户消息清理；Responses-Lite 缺目录时跟随直连 GPT-6 官方设置；Claude auto 模式遇上游拒绝关闭思考时去掉该字段同家重试一次；路由模式下 Fable 5.1/5.2 写对应模型 ID；Copilot 仅在有 1M 模型时提供 1M；Copilot Gemini 长会话中段系统消息按原位作为用户消息发送；Codex ChatGPT 账号卡按 OAuth client version 0.169.0 获取 GPT-6.2；会话管理显示 Codex `/goal` 完整目标；请求详情请求 ID 增加复制按钮。
8. **用量与定价（v4.0.33/35）**：Hydrogen Orchestrator 按基础模型计价并回补近 30 天；新增 Qwen4 Max 与 GPT-6.2 Sol/Astra 定价；自定义日期范围限制在首条用量记录到今天之间。
9. **结构性重构与清理**：工具生命周期拆分到 `commands/{tool_discovery,tool_lifecycle_command,tool_process,tool_version}.rs` 并用 `ToolSpec` 表描述；终端启动移到 `commands/terminal_launch.rs`；`proxy/forwarder.rs` 拆成 11 个 submodule；新增 `services/{auto_sync,usage_http}.rs`、`mcp/json_file.rs`、`frontend_parity_tests.rs`、`test_support.rs`；DAO 改收 `&AppType`；`settings.rs` 用 `get_override_dir(&AppType)` 与 `LANGUAGES` 常量；前端新增 `src/i18n/languages.ts`、`src/config/directoryApps.ts`；集成测试迁入 `src-tauri/tests/integration/`；新增 `tests/config/{backendConstants,languages,tools}.json/test.ts`、`tests/lib/registeredCommands.test.ts`；删除 `commands/lightweight.rs`、`proxy/providers/models/*` 与 4 个手挑 locale 测试。
10. **数据库**：`SCHEMA_VERSION` 上游 `26 → 27`（v4.0.34）；`skill_repos` 加 `host TEXT NOT NULL DEFAULT 'github.com'`、`skills` 加 `repo_host TEXT`；已有行不回填，靠默认值与 NULL 语义读作 GitHub。`create_tables` 的 `stream_check_logs` 与 fork 既有迁移臂保持不变。
11. **CI 与物料**：`ci.yml` 删除 `CARGO_PROFILE_DEV_DEBUG` env（上游移到 `Cargo.toml` 的 `[profile.dev] debug = "line-tables-only"`）；`Cargo.toml` 删 `once_cell`、加 `Win32_Security_Credentials` 与 `[profile.dev]`；`release.yml` 上游本轮零改动，保持 fork 裁剪版与 macOS `macos-15`。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v433-v435/{brief.md,specs/upstream-sync/spec.md}`；沿用历轮决定，不建立能力关联、不产生 `capability-association.yaml` 与 `delta.yaml`。
- 归档时由 Runtime 生成 `docs/comet/archive/<date>-sync-upstream-v433-v435/`。
- rebase 前新增本地安全参照分支 `pre-sync-v433-v435`，不推送。
- 本轮落地保真复算脚本 `scripts/fidelity-v433-v435.py`，沿用 `fidelity-v432.py` 的四 ref 口径（`v4.0.35` / `v4.0.32` / `pre-sync-v433-v435` / `HEAD`），可重复执行、不含硬编码条数。
- 随上游落地的新增文件：Rust 侧 `commands/{terminal_launch,tool_discovery,tool_lifecycle_command,tool_process,tool_version}.rs`、`proxy/forwarder/{copilot,diagnostics,endpoint,headers,managed_auth,opencode,request_body,response_check,send,tests}.rs`、`services/{auto_sync,usage_http}.rs`、`mcp/json_file.rs`、`frontend_parity_tests.rs`、`test_support.rs`、`tests/integration/main.rs`；前端侧 `src/components/skills/repoUrl.ts`、`src/config/directoryApps.ts`、`src/i18n/languages.ts`；测试侧 `tests/components/{UsageDateRangePicker,sessions/reader/describeEvent,skillRepoUrl}.test.tsx`、`tests/config/{backendConstants,languages,tools}.json/test.ts`、`tests/lib/registeredCommands.test.ts`、上游 release notes 与 `src/whats-new/{4.0.33,4.0.34,4.0.35}.json`。
- 交付步骤（验收通过、归档且用户另行授权后）新增本地 annotated tag `v4.0.35-1`。

### 修改

- 55 个重叠文件，按类别：
  - 版本与物料：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`（`pnpm-lock.yaml` 上游本轮无改动，终态不应引入 updater 三段）。
  - 后端：`lib.rs`、`commands/{mod,misc,settings}.rs`、`commands/stream_check.rs`（孤儿文件随上游）、`database/{backup,mod,schema,tests}.rs`、`database/dao/{mod,providers}.rs`、`provider.rs`、`services/{mod,omo,provider/{live,mod,pi}}.rs`、`settings.rs`、`tray.rs`、`tray_panel.rs`、`proxy/{forwarder,http_client,media_sanitizer}.rs`、`proxy/providers/{claude,claude_reasoning,codex,gemini}.rs`，以及随上游重构自动合并的其他 proxy / usage / mcp / sync 文件。
  - 前端：`src/App.tsx`（若 fork 侧改动与上游相交）、`src/components/providers/ProviderCard.tsx`、`src/components/AutoUpdatePrompt.tsx`（fork 侧已删除，不复活）、`src/components/settings/AboutSection.tsx`、`src/contexts/UpdateContext.tsx`、`src/lib/api/settings.ts`、`src/lib/updater.ts`、`src/types.ts`、`src/config/{appSpecs,codex,gemini,hermes,pi}ProviderPresets.ts`、`src/i18n/locales/{en,zh,zh-TW,ja,ko,ru,de,tr}.json`。
  - 测试：`tests/components/{AppsPage,ClaudeFormFields,ProviderList}.test.tsx`、`tests/config/{localeCoverage,localeParity}.test.ts`、`tests/setupTests.ts`、`tests/contexts/UpdateContext.autoUpdate.test.tsx`（fork 侧已删除，不复活）。
- fork 侧文档：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测修订，并新增 §4.16「v4.0.33–v4.0.35 轮的叠加要点」；归档时把 `specs/upstream-sync/spec.md` 重写为本轮终态。

### 删除

- 上游删除的 4 个源码文件随上游删除且 fork 侧零引用：`src-tauri/src/commands/lightweight.rs`、`src-tauri/src/proxy/providers/models/{mod,anthropic,openai}.rs`。
- 上游删除的 4 个测试文件随上游删除：`tests/config/{agyLocales,managementListLocales,toolManagementLocales,xaiOauthLocales}.test.ts`，其校验由统一 `localeParity` / 新 fixture 承接。
- fork 已删除的更新器链路与 `stream_check` 可达链路不得被重放带回。

### 明确不建

- 不引入 `upstream/main` 上 `v4.0.35` 之后的 5 个提交。
- 不重新接线 `stream_check`；不复活 `release.yml` 被裁段；macOS runner 维持 `macos-15`。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不为上游新增第三方预设改写 `forkOfficialAllowlist` 判定实现（本轮上游无新增需要收录的官方/本机预设族）。
- 不改 fork 自有功能形态，也不做本轮之外的功能开发、重构或依赖升级。

# 非目标

- 不改 fork 自有功能实现与形态：逐模型连通性测试链、托盘左键契约、模型徽章与快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识、`forkOfficialAllowlist`/`forkPresetFilter` 判定逻辑。
- 不把上游 `appSpecs` 能力表反向用于改写 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry`。
- 不对上游 Ollama Cloud、多主机技能仓库、Antigravity CLI 会话删除、S3 清除配置、请求 ID 复制等新能力做 fork 侧定制。
- 不因上游重构删除 fork 仍在用但上游判定为死代码的 API；只删除 fork 侧同样零引用且不影响 fork 用例的项。

# 决策

- **D1｜同步目标与工作区**：最终锁已发布 tag `v4.0.35^{}` = `61c43c036e`，不纳入 `upstream/main` 的 5 个 tag 后提交。工作区 `current`，沿用 main 与当前目录；`pre-sync-v433-v435` 只作回退参照。
- **D2｜「上游是否重复实现 fork 功能」核查**：按历轮三步口径执行——先用 `git diff v4.0.32 v4.0.35` 逐文件比对并读实现，再全量扫描上游新增行对 fork 功能标识（`websiteUrl2`/`website_url_2`/`QuickSwitch`/`visibleSidebarPanels`/`quickSort`/`DevPanel`/`forkBuild`/`forkOfficial`/`SearchableModel`/`ProviderImportEntry`/`ConnectivityTestDialog`/`ModelQuickSwitch`/`tray_left_click` 等），最后按功能名逐项排除同域相邻。结论：
  - **应用内更新器**：唯一跨轮延续取舍。上游 v4.0.34/35 继续增强「后台自动下载更新」（发现新版本立即下载、内联下载状态、提示框重排），fork 早已整体关闭该链路。沿用 2026-11-15 用户决定 **Q1 = A：保留 fork 现状，上游更新器域整体不采纳**，终态见 Spec「更新器域终态」。
  - **MCP 连通性检测 vs fork 逐模型连通性测试**：上游 `services/mcp_connectivity.rs` 测 MCP 服务器连通性，fork 测供应商模型可达性与首 token；实现、入口、数据不重叠，本轮上游只修其 panic 后锁恢复，两条链并存、不合流。
  - **技能仓库多主机 vs fork**：fork 无自有技能仓库主机判定，`repoUrl.ts` 是全新能力，直接落地。
  - **Antigravity CLI 会话删除 vs fork 会话管理魔改**：fork 无自有 Antigravity 会话删除逻辑，直接落地。
  - **Ollama Cloud 套餐额度 vs fork 官方预设白名单**：Ollama Cloud 是 URL 识别 + 套餐额度查询，不是供应商预设可见性功能；fork 的 `forkOfficialAllowlist` 判据不变。
- **D3｜数据库**：上游 `SCHEMA_VERSION` 从 26 到 27，fork 当前也是 26，本轮直接采用上游迁移臂，终态 `SCHEMA_VERSION = 27`，不制造 fork 专属版本号；`skill_repos.host` 用列默认值、`skills.repo_host` 用 NULL 语义，不回填历史行；fork 的 `stream_check_logs` 建表、`website_url_2` 列与全部既有迁移臂原样保留；`database/tests.rs` 增补 `migration_v26_to_v27_adds_skill_repo_host` 与既有 v24→v25/v25→v26 断言。
- **D4｜DAO `&AppType` 签名改造**：`database/dao/providers.rs` 等文件整段取上游，`app_type: &str` 改为 `app_type: &AppType`；fork 侧调用点同步适配（`commands/connectivity_test.rs` 的 `get_all_providers(app_type.as_str())`、`lib.rs` 的 `get_all_providers("opencode")` 等），不得保留旧签名编译绕过；所有新增/改写 `Provider { … }` 字面量必须补 `website_url_2: None`。
- **D5｜上游删除 API 与 fork 死代码边界**：上游删除 `getClaudeCodeConfigPath`/`getAppConfigPath`/`getAutoLaunchStatus`、`getGeminiPresetByName`/`getGeminiPresetByUrl`、`migrate_from_json_dry_run`、`replace_provider_id`、`commands/lightweight.rs` 等。凡 fork 侧零引用、且不影响 fork 用例的，随上游删除；`database/tests.rs` 中两个 `migrate_from_json_dry_run` 用例按上游改写为 `Database::memory()` + `migrate_from_json`；`replace_provider_id` 若 fork 侧确认零调用则删除，若有调用则改签名保留，禁止留无调用死代码。
- **D6｜孤儿 `stream_check` 豁免延续**：上游本轮改 `commands/stream_check.rs`，随文件落地；fork 不恢复模块声明、命令注册与 dao 文件，`stream_check_provider` 保持 0 命中；`src/lib/api/connectivity-check.ts` 与 `src/hooks/useStreamCheck.ts` 的无调用方状态重新确认。
- **D7｜本地化**：8 个 locale 的上游新增/改写/删除逐字取上游（新增含 `skills.repo.httpsOnly`、`settings.s3Sync.clear*`、`usage.detail.copyRequestId*`、`workbuddy.form.thinkingEffort*`、`sessionManager.reader.event.goal*`、`providerForm.copilotOneM*`）；`tr.json` 与 `v4.0.35` tag 逐字节一致、不补 fork 键；`src/config/forkOnlyLocaleKeys.ts` 的 `FORK_ONLY_LOCALE_KEYS` 按新基线重新生成（`en.json` 减 `git show v4.0.35:src/i18n/locales/en.json`，实测 395 键），`FORK_REMOVED_LOCALE_KEYS` 继续收录 `autoUpdate.*` 与 `streamCheck.*`（上游 `autoUpdate` 新增 `downloadedInline`/`downloadingInline` 也要进移除清单，否则 `localeParity` 会红）；合并后 8 个文件按对象作用域显式查重 `dup=0`。
- **D8｜CI 与物料**：`ci.yml` 采纳上游删除 `CARGO_PROFILE_DEV_DEBUG` env，fork 裁剪语义（无 schedule/workflow_dispatch、四个 job 的 fork `if`、后端 `cargo nextest`、WSL2 restore-only rust-cache 与 `continue-on-error`）全保留；`Cargo.toml` 采纳 `[profile.dev] debug = "line-tables-only"`、删 `once_cell`、加 `Win32_Security_Credentials`，同时保持 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`；`release.yml` 保持 fork 版且 macOS runner 为 `macos-15`；四处版本号 `4.0.35-1`。
- **D9｜测试结构迁移**：`src-tauri/tests/*.rs` 随上游迁入 `src-tauri/tests/integration/`，fork 侧对集成测试的路径引用（若有）同步改路径，不改上游用例语义；新增 `registeredCommands.test.ts` 会校验前端 `invoke` 名与后端注册，收尾必须零 stale wrapper。
- **D10｜交付授权延后**：Build/Verify 不推送、不打 tag；归档完成后单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.35-1` 推送；不创建 PR。

## 已确认的用户决定（沿用）

- **Q1 更新器取舍 → 保留 fork 现状（A）**（2026-11-15，v4.0.32 轮确认）。上游 v4.0.34/35 对自动下载更新的增强整体不采纳：不引入 `app_update.rs` 的新字段与 `enabled` 状态、`AutoUpdatePrompt.tsx` 重排、`UpdateContext` 的 `autoUpdateDownloading`/`startAutoDownload`、`AboutSection` 的内联下载状态、`lib/api/settings.ts` 的 `downloadAppUpdate` 绑定复活。fork 的 `lib/updater.ts` 恒返回 up-to-date、关于页「检查更新」指向 tunecc Releases、`capabilities/default.json` 无 `updater:default`、`commands/misc.rs` 的 `is_portable_mode` 保留 fork 自带实现全部不变。理由：fork 发布链路是裁剪版（无签名密钥、无 `latest.json`、macOS 未签名、无 R2 镜像），恢复该链路属于独立工程。

# Open questions

（无。同步目标、更新器取舍、数据库合并口径与交付授权边界均已确认；「上游是否重复实现 fork 功能」的核查结论见 D2，无新的二选一。）

# 验收示例

- 同步基线与重放完整性可核对：`git merge-base main v4.0.35^{}` 为 `61c43c036e`，`git rev-list --count v4.0.32..HEAD` = 219 + 本轮新增提交数（现取口径），重放主题序列与 `pre-sync-v433-v435`（= `98b5805b6`）一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移」。
- fork 全部魔改在终态仍然在位：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键置顶/置底，逐项 `git grep -I` 取证并跑对应测试。
- 上游本轮新能力落地：Ollama Cloud 套餐额度（host 识别、现行/旧套餐映射、本地不命中）、技能仓库多主机与 `26 → 27` 迁移、Antigravity Windows 切号与 CLI 会话删除、WorkBuddy 思考强度、S3 清除配置与国内云虚拟主机地址、WebDAV MKCOL 400 兼容、请求 ID 复制、Codex `/goal` 完整目标、日期范围边界、GPT-6.2/Qwen4 Max 定价，逐项有上游测试或新增测试通过。
- 上游重构后结构正确：`commands/misc.rs` 的 `ToolSpec` 表与 5 个 tool_* 子模块、`proxy/forwarder.rs` 的 11 个 submodule、`services/auto_sync.rs`、`src/i18n/languages.ts`、`tests/integration/` 迁移、`backendConstants`/`languages`/`tools` 三个双向 fixture 全部落地且测试通过。
- 更新器域终态严格符合 Q1 = A：`app_update` 模块、`AutoUpdatePrompt`、`tauri_plugin_updater` 依赖与插件注册、`capabilities/default.json` 的 `updater:default`、`tauri.conf.json` 的 `plugins.updater`、`settings.auto_update_enabled`、`AutoUpdatePrompt`/`UpdateContext.autoUpdate` 测试、`tray` 的「重启并更新」项全部缺席（`git grep` 零命中，两个既有空壳命令除外）；`lib/updater.ts` 仍恒返回 up-to-date；`commands/misc.rs` 的 `is_portable_mode` 仍用 fork 自带实现。
- 数据库终态：`SCHEMA_VERSION = 27`；`skill_repos.host` 默认 `github.com`、`skills.repo_host` 可为 NULL；fork 既有 `website_url_2`、`stream_check_logs` 与全部迁移臂保留；v26→v27 与既有迁移用例通过。
- 后端与前端在新结构下全绿：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm test:unit`、`cargo check --all-targets`、`cargo fmt --check`、`cargo nextest run`（或 `cargo test`）全部通过；上游新增 `Provider { … }` 字面量均带 `website_url_2: None`；`registeredCommands` 与三个 fixture 测试无 stale 命令。
- 本地化终态：8 个语种文件按 `localeParity` 校验一致（fork 专属键经单一来源豁免清单 skip，清单与「`en.json` 减上游 v4.0.35 的 `en.json`」逐键相等）；`readmeParity` 仍只校验上游 7 份 README；`tr.json` 与 tag 逐字节一致；按对象作用域显式查重 `dup=0`。
- 交付边界与配置保护：Build/Verify 期间零远端写操作；`.comet/config.yaml` 终态与 `pre-sync-v433-v435` 一致；取证 fetch 不带 `--prune-tags`；`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.16 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径，脚本 `scripts/fidelity-v433-v435.py` 随 Build 落地）：`v4.0.35` / `v4.0.32` / `pre-sync-v433-v435` / `HEAD` 四 ref 计算差集，494 个上游文件与 fork 侧代码文件全部参与，非重叠上游文件缺失为 0，重叠 55 文件的两侧缺失行逐行归因并带重数，出现无法归类的缺失行即判定失败。
