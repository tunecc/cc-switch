# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的已发布 annotated tag `v4.0.24`（tag 对象 `beed05c0c5d8b0aab00bd30961e64130da0b0923`，剥离提交 `c0189078aacdd80fd2462f59b345f55f62b41cf2`）之上，按原顺序重放同步前 `v4.0.22..main` 的全部 187 个 fork 提交（同步前 main = `876f4af773c09c6d97a3beddc3706ae83bf6aa49`），再叠加本轮同步终态与归档提交；fork 版本号 `4.0.22-1` → `4.0.24-1`（跨 v4.0.23 与 v4.0.24 两个上游发布）；上游两轮的功能与修复全部落地，fork 全部魔改保留且可用，无丢失、无行为回归。

本轮**上游没有重复实现 fork 的任何自有功能**，因此不产生「保留上游 or 保留 fork」的功能级二选一。取证口径（在 `v4.0.22..v4.0.24` 全量 diff 上实测）：

- 关键词命中全部为 0：`websiteUrl2` / `website_url_2` / `connectivity` / `batchTest` / `visibleSidebarPanels` / `visible_sidebar_panels` / `left_click` / `show_menu_on_left_click` / `devpanel` / `forkOfficialAllowlist` / `IS_FORK_BUILD` / `updater`。
- fork 高频魔改文件本轮上游**零改动**：`src/components/providers/ProviderCard.tsx`、`ProviderList.tsx`、`ProviderCardActions.tsx`、`src/components/shell/Sidebar.tsx`、`src/components/settings/SettingsPage.tsx`、`sections/GeneralSection.tsx`、`AboutSection.tsx`、`src/lib/api/settings.ts`、`src/config/forkOfficialAllowlist.ts`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`.github/workflows/ci.yml`。
- `src-tauri/src/lib.rs` 上游只有 3 个 hunk（`+398` 抽出 `handle_second_instance`、`-409` 回调改 `spawn_blocking`、`+1228` Linux 托盘图标 `temp_dir_path`），不触碰 fork 的三段语义（无 Updater 插件注册、托盘左键、两个 connectivity 命令注册），且本轮**没有新增任何 `invoke_handler` 注册行**。
- `src-tauri/src/tray.rs` 上游改动集中在 `provider_hint` / `provider_entry` / `collect_app_snapshot` / `panel_rows`（第 1220–2272 行区）与其测试；fork 的 `apply_tray_style` / `handle_tray_icon_event` / `toggle_main_window` / `hide_main_window` / 源码护栏在第 2666–3408 行区，两侧区域不相交。

需要用户决定的只剩两处**政策面**（不是功能重复），均已于 2026-11-02 由用户确认：上游新增的第一方官方预设 `OpenAI API` 只在 claude / claude-desktop / codex 收录（D5）；fork 专属 `release.yml` 的 macOS runner 跟着上游升到 `macos-15`（D6）。

# Scope

- **同步区间**：`v4.0.22..v4.0.24` 共 45 个提交、137 个文件、+7570/−797（22 新增 / 0 删除 / 115 修改）。fork 侧自 `v4.0.22` 起改动 480 个文件、+61832/−2789。**重叠面 42 个文件**（实测 `comm -12 <(git diff --name-only v4.0.22 v4.0.24|sort) <(git diff --name-only v4.0.22 main|sort)`）。`upstream/main`（`b8112ca5e`）比 tag 多 5 个提交，按「只锁已发布 tag」约定**不纳入**（其中 `b8112ca5e feat(mcp): check MCP server connectivity on demand` 与 fork 的连通性测试同域，留待其发布后再评估）。
- **v4.0.23 新增**：① Kimi Code / MiniMax Code / Oh My Pi 供应商编辑器按应用原生格式显示与编辑（新组件 `src/components/providers/forms/shared/NativeConfigEditor.tsx`、新 helper `helpers/kimiToml.ts`、`helpers/yamlNode.ts`、新 hook `src/hooks/useNativeConfigPath.ts`；DeepSeek Harness 仍在 profile 补丁里用 JSON 编辑器）；② Claude Code / Claude Desktop 经路由转 OpenAI Chat / Responses 时思考档位换算扩展，两个表单新增「思考档位发法」选择器（后端 `src-tauri/src/proxy/providers/claude_reasoning.rs`、前端 `forms/ClaudeReasoningEffortField.tsx`、`ProviderMeta.claudeReasoningEffort`、`types.ts` 新类型 `ClaudeReasoningEffortMode`）；③ Claude 路由转 Gemini 原生时映射 `thinkingConfig`（`93d0bf181`）；④ 授权中心页头「全部刷新」（`src/components/settings/auth/RefreshAllQuotaButton.tsx`，经 `App.tsx` 的 `actions` 插槽进入 `AuthCenterPanel`）；⑤ Skills 发现页与已安装页统一行样式；⑥ 托盘绑号 Claude 官方卡副标题显示备注/账号而非官网；⑦ Codex 路由连 DeepSeek 的档位换算对齐官方；⑧ 预设：`OpenAI API`、13 家 Gemini CLI / Antigravity 预设、Astron MaaS 按量付费。
- **v4.0.23 修复**：Windows 轻量模式二次启动主窗口回不来（`f75cb1b6c`，`lib.rs` +58/−41）；非流式模型校验收到完整 JSON；DSH profile 符号链接同文件去重；Grok Build >50 MiB 会话逐行读取 + 字节偏移游标；Codex 分支会话父会话闲置后不导入；AGY / MiniMax Code 用量补耗时与首字时间；DSH / MiniMax / Kimi 原生用量凭据读取；Claude Desktop route 模式 Haiku 档发布 `claude-haiku-5-5`；mise shim 解析；`windows_preferred_tool_executable` PATH 择优；OpenCode Desktop 环境检查误启动；三个配置编辑器互相覆盖（#6777）；拉取模型列表在表单重渲染时保留（#9068）；provider key 输入 IME 重复字符（#9069）；图标选择器避开 macOS 红绿灯（#9076）；数据库锁等待移出 UI 线程（#9098）；400 `invalid_grant` 归类为永久失败 + `.env` 清理尊重 export 行 + 土耳其语目录补全（#9049）。
- **v4.0.24**：新增「登录时自动打开浏览器」开关（授权中心顶部，覆盖 Claude / ChatGPT / Copilot / xAI / Antigravity / Kimi / DeepSeek 与表单内发起的登录；关闭时只复制登录链接、不自动复制验证码、隐藏「重新打开登录页」按钮；Windows 下 Claude Code 只输出登录链接；默认打开且只记本机、不随云同步）——新文件 `src/lib/authLoginLink.ts`，改 `commands/auth.rs`、`services/claude_account/{layout,login,mod}.rs`、`DshAccount.tsx`、`forms/hooks/useKimiOAuth.ts`、`useManagedAuth.ts`、`settings/AuthCenterPanel.tsx`、`settings/auth/ManagedAccountsGroup.tsx`、`src/lib/api/auth.ts`；修复 GPT 5.6+ 的 sol/terra/luna/astra 保留 max 档位、DSH 导出模型 `input` 只写 text/image、WSL 托盘图标改写入 app cache dir（`c1fb9eec1`，`lib.rs` +8）、Codex Chat 供应商重开「支持思考等级」后档位恢复（`codexChatReasoning.ts`）、DSH 官方登录卡文案改「用 DeepSeek 账号登录」；预设 A6API 换域 `a6api.vip`；`8be840557` 把上游 release.yml 两个 macOS job 从 `macos-14` 改 `macos-15`。
- **上游新增测试与测试模块**：`commands/provider_concurrency_tests.rs`、`commands/startup_tests.rs`（`commands/mod.rs` 以 `#[cfg(test)]` 声明，+5 行）、`tests/components/JsonEditorExternalSync.test.tsx`、`ProviderFormSettingsConfigSnapshot.test.tsx`、`tests/lib/authLoginLink.test.ts`。
- **数据库**：上游 `src-tauri/src/database/mod.rs` 本轮零改动，`SCHEMA_VERSION` 仍为 24；fork 保持 25，**本轮无迁移链合并、无新臂**。`database/schema.rs` 上游只新增 13 行 grok 价格种子（`grok-4.6-build`、`grok-4.7-build`、`grok-4.7-build-fast`）。
- **版本与依赖**：`package.json` 新增运行时依赖 `yaml ^2.8.1`（`pnpm-lock.yaml` 随之为 vite/tailwindcss/postcss-load-config 等补 `(yaml@2.8.1)` peer 后缀，上游本轮 +25/−12）；`src-tauri/Cargo.toml` 新增 dev-dependency `tauri = { version = "2.8.2", features = ["test"] }`，`Cargo.lock` 上游只改 `cc-switch` 版本行；四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`）终态统一 `4.0.24-1`。
- **本地化**：上游 4 个既有 locale 各 +27/−3（新增 `providerForm.nativeConfig.*` 5 键、`reasoningEffort*` 5 键、`auth.openBrowser.{title,description}`、`login.copyLink/linkCopied/linkNote/linkCodeNote`、`quota.refreshAll`、`kimi.configTomlScope/configTomlSchema` 等；删除 3 处旧写法收尾；改写 `skills.installed`），`tr.json` +53/−6。fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`（上游本轮未改这两键）。
- **fork 侧文档**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果修订并新增 §4.10（v4.0.24 轮要点）；`docs/comet/specs/upstream-sync/spec.md` 归档时整体重写为本轮终态。
- **交付**：推送 `main` 与 annotated tag `v4.0.24-1` 只在验收通过、用户接受并归档之后执行，属 Archive 阶段的单独授权（本轮 Shape 只确认「沿用历轮方式」，不构成远端写授权）。

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v424/`（Runtime 已创建）：`brief.md`、`comet-state.yaml`、`capability-association.yaml`、`specs/upstream-sync/spec.md`、`specs/upstream-sync/delta.yaml`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v424/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v424`（= 同步前 main `876f4af77`，同时是 origin/main），仅用于回退参照与重放前后 diff 对照，不推送。
- 随上游 rebase 落地的上游新增文件 22 个：6 个 `docs/release-notes/v4.0.2{3,4}-{en,zh,ja}.md`；后端 `src-tauri/src/commands/{provider_concurrency_tests,startup_tests}.rs`、`src-tauri/src/proxy/providers/claude_reasoning.rs`；前端 `src/components/providers/forms/ClaudeReasoningEffortField.tsx`、`forms/helpers/{codexChatReasoning,kimiToml,yamlNode}.ts`、`forms/shared/NativeConfigEditor.tsx`、`src/components/settings/auth/RefreshAllQuotaButton.tsx`、`src/hooks/useNativeConfigPath.ts`、`src/lib/authLoginLink.ts`、`src/whats-new/4.0.23.json`、`4.0.24.json`；测试 `tests/components/{JsonEditorExternalSync,ProviderFormSettingsConfigSnapshot}.test.tsx`、`tests/lib/authLoginLink.test.ts`。
- 交付步骤（验收通过并归档、且用户另行授权后）新增本地 annotated tag `v4.0.24-1`。

### 修改

- 42 个上游/fork 重叠文件（逐文件叠加要求在完整目标规格「冲突解决」中展开）：
  - 版本与锁文件 6 个：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`pnpm-lock.yaml`、`.github/workflows/release.yml`。
  - 后端 11 个：`src-tauri/src/{lib,tray,provider}.rs`、`src-tauri/src/commands/{misc,mod}.rs`、`src-tauri/src/database/schema.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/media_sanitizer.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs`、`src-tauri/src/services/provider/mod.rs`。
  - 前端 16 个：`src/App.tsx`、`src/types.ts`、`src/components/providers/forms/{BasicFormFields,ClaudeDesktopProviderForm,ClaudeFormFields,KimiProviderForm,McodeProviderForm,PiProviderForm,ProviderForm}.tsx`、`forms/shared/index.ts`、6 个 `src/config/*ProviderPresets.ts`（claude/claude-desktop 不在重叠面；重叠为 `gemini`、`grokBuild`、`hermes`、`openclaw`、`opencode`、`pi`）、4 个 `src/i18n/locales/{en,ja,zh,zh-TW}.json`。
  - 测试 3 个：`tests/components/{BasicFormFields,ClaudeFormFields,ProviderPresetSelector}.test.tsx`。
- `src/config/forkOfficialAllowlist.ts`（fork 专属整文件保留）：按 D5 在 `claude`、`"claude-desktop"`、`codex` 三个键各追加一条 `"OpenAI API"`，`openclaw` / `opencode` / `mcode` 保持不含该条目；本轮不新建 fork 专属代码文件。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 表与 §4.10 按本轮实测结果更新。
- 把本地 main rebase 到 tag `v4.0.24`：当前 merge-base `b76426741`（= `v4.0.22^{}`）→ 目标 `c0189078a`（= `v4.0.24^{}`）。

### 删除

- 上游本轮 `v4.0.22..v4.0.24` **未删除任何文件**（`--diff-filter=D` 实测 0 条），本轮不存在「随上游删文件」的动作。
- 只随上游删除代码片段与 locale 键：4 个 locale 各 3 处旧写法收尾（`skills.installed` 改写、`login.reopen` / `quota.refreshAria` 追加逗号）、`mcodeProviderPresets` 与 `openclawProviderPresets` 等预设目录内上游自身改写行。fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v424` 是安全参照分支，不是工作区）。
- 不新增数据库迁移臂、不改 `SCHEMA_VERSION`（fork 保持 25，上游本轮仍为 24，不撞号）。
- 不重新接线 `stream_check`、不恢复应用内更新器（`tauri-plugin-updater` / `@tauri-apps/plugin-updater` 保持移除态）。
- 不改 `forkPresetFilter.ts` 判定实现；除 D5 的三条 `OpenAI API` 外不新增任何白名单条目。
- 不引入 `upstream/main` 上 tag 之后的 5 个提交（含 `b8112ca5e` 的 MCP 按需连通性检测）。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。
- 不新建 fork 专属代码文件；本轮无新增 fork 专属组件需求。

# Non-goals

- 不评估、不实现「上游取代 fork 自有功能」的功能级替换：本轮取证已确认上游未重复实现 fork 功能（见 Outcome），唯一同域的未发布 `b8112ca5e` 明确排除在范围外。
- 不改 fork 的托盘左键契约、连通性测试形态、模型徽章/快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识；不改 fork CI 的裁剪策略（构建哪些平台、tag 守卫条件），D6 只把 Release 的 macOS runner 镜像从 `macos-14` 换成 `macos-15`。
- 不为上游新增的第三方/赞助商/Gemini CLI 转发预设放开可见性（D5 的三条之外一律不放开），也不为「消除上游字样」改写 fork 已移除链路。
- 不做本轮之外的功能开发、重构或依赖升级；`Cargo.toml`/`package.json` 的依赖新增只取上游本轮实际改动。
- 不在 Shape/Verify 阶段执行任何远端写操作（push、tag、PR、Release 触发）。

# Acceptance examples

- 同步基线与重放完整性可核对：`git merge-base main v4.0.24^{}` 为 `c0189078a`（即 fork 提交全部落在 `v4.0.24` 之上），`git rev-list --count v4.0.24..HEAD` 等于同步前 187 个 fork 提交中实际重放的数量加本轮新增提交，重放主题序列与 `pre-sync-v424` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。
- fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键切换与源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。
- 上游 v4.0.23 原生格式编辑器在本轮终态完整生效：`NativeConfigEditor`、`kimiToml`、`yamlNode`、`useNativeConfigPath` 与 Kimi/Mcode/omp 三个表单接线随上游落地，fork 的跨应用导入入口、白名单过滤与「先编号再过滤」顺序在同一表单内继续生效，上游新增的 `JsonEditorExternalSync`、`ProviderFormSettingsConfigSnapshot` 用例与既有表单用例全绿。
- 思考档位链路完整落地且不破 fork 表单布局：`claude_reasoning.rs`、`ClaudeReasoningEffortField`、`ProviderMeta.claudeReasoningEffort`、`types.ts` 的 `ClaudeReasoningEffortMode` 与前端接线齐备，字段在 fork 的 `EndpointField.rightSlot` 布局形态下渲染且不丢上游 HelpTip，`93d0bf181` 的 Gemini 映射与 `2122f7da3`、`39183b59a` 的档位换算与上游新增用例同时通过。
- 授权中心两项新能力落地：「全部刷新」经 `App.tsx` 的 `actions` 插槽进入授权中心页头，「登录时自动打开浏览器」开关及其只复制链接分支（`authLoginLink.ts`、`useManagedAuth`、`ManagedAccountsGroup`、`commands/auth.rs`、`claude_account/*`）与上游新增用例 `tests/lib/authLoginLink.test.ts`、`tests/hooks/useManagedAuth.test.tsx` 全部生效；fork 的 `App.tsx` 三段语义（批量探针、页头门控、window-title 守卫）同时保留。
- 托盘契约与上游新行为共存：上游的 `provider_hint` 备注 → 绑号账号 → 官网域名三级取值落地，fork 的左键「切换主窗口、永不弹菜单」四分支、`set_show_menu_on_left_click(false)` 与 `tray_left_click_never_opens_the_menu` 护栏不变，`lib.rs` 的 `handle_second_instance` + `spawn_blocking` 与 Linux 托盘 `temp_dir_path` 取上游，且 `tauri_plugin_updater` / `updater_builder` 仍为 0 命中、两个 connectivity 命令注册仍在位。
- 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v424` 相同（本轮不新增臂），`schema.rs` 的 13 行 grok 价格种子落地，`database/{schema,tests}.rs` 全部用例通过且上游用例断言不含 `24`。
- 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、3 处改写按上游、fork 键段与 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 保留；`tr.json` 与 `v4.0.24` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。
- 预设目录与白名单按政策终态生效：上游 22 处预设新增/改写（含 `OpenAI API`、13 家 Gemini CLI / Antigravity、Astron MaaS、A6API 换域）整份落地；`forkOfficialAllowlist` 按 D5 的条目集合生效、其余新预设继续隐藏；预设 id 仍按原始数组下标编号且过滤排在编号之后；上游 `ProviderPresetSelector.test.tsx` 的可见行数断言取上游且 fork 用例（`extraActions`/过滤）同时通过。
- 后端在 fork 结构下编译通过：上游新增的 `Provider` 结构体字面量（至少 `src-tauri/src/proxy/providers/claude_reasoning.rs` 的测试 helper）补齐 fork 的 `website_url_2` 字段后，`cargo check --all-targets` 与 `cargo nextest run`（含上游新增 `provider_concurrency_tests`、`startup_tests`）零失败、无新增未使用告警。
- 版本与锁文件终态一致：四处版本号均为 `4.0.24-1`，`git diff --numstat pre-sync-v424 HEAD` 对四个文件符合本轮口径；`Cargo.lock` 不出现任何 `tauri-plugin-updater` 条目且含上游 `tauri` test dev-dependency，`pnpm-lock.yaml` 含 `yaml@2.8.1` 而 fork 移除的 `@tauri-apps/plugin-updater` 三段仍不存在，`pnpm install` 与 `cargo check` 均报告锁文件未被改写。
- 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.10 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径）：在最终态提交之后，用 `v4.0.24` / `main(=pre-sync-v424)` / `HEAD` 与上游基线四个 ref 计算行多重集差集，137 个上游文件与 480 个 fork 文件全部参与，非重叠的 95 个上游文件在 fork 侧缺失为 0，重叠 42 文件的两侧缺失行逐行归因并带重数，归因只允许「刻意取舍（版本行 / fork 专属文案 / 白名单条目 / D5、D6 决定）」一类，出现无法归类的缺失行即判定失败。

# Constraints and invariants

- 只锁已发布 annotated tag：同步目标必须是 `v4.0.24^{}` 剥离出的提交（`c0189078a`），不得拿 tag 对象 sha（`beed05c0`）当提交 sha 做 merge-base 核对；`upstream/main` 上 tag 之后的提交一律不纳入。
- 冲突解决遵循 `docs/HOW_TO_REBASE_UPSTREAM.md` §3：fork 专属文件保留 fork 侧（rebase 中为 `--theirs`），共享文件取上游（`--ours`）后再叠加 fork 语义；版本与锁文件禁止 `git checkout --ours` 整体取侧（`--ours` 是上游，会清掉 fork 字段，v4.0.20 轮已实测踩中）。
- `.comet/config.yaml` 是 fork 专属文件且会被重放的历史提交改回旧内容，rebase 中途必须显式恢复并纳入提交，否则 Native Hook 会拒绝写入。
- 预设条目 id 数字必须等于原始数组下标：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变（v4.0.12 起契约）。
- fork 的 `Provider` 结构含 `website_url_2`，上游新增的任何 `Provider { … }` 字面量（含测试 helper）必须补该字段，否则 `cargo check --all-targets` 失败。
- fork 移除链路不得复活：`tauri_plugin_updater` / `@tauri-apps/plugin-updater` / `install_update_and_restart` 实现 / `stream_check` 模块声明与命令注册 / `cleanup_old_stream_check_logs`。
- `tr.json` 与上游 tag 逐字节一致、不补 fork 键；4 个既有 locale 合并后必须按对象作用域显式查重（`object_pairs_hook` 类），`JSON.parse` 静默取最后一个键、测试全绿也不能作为无重复的证据。
- 落地保真复算必须在最终态提交之后进行，差异行必须带重数与文件归属；修复类提交会改变保真数字，规格与文档中的数字须随修复刷新。
- 时间敏感用例的既有 flaky 边界（`SessionManagerPage` 分桶在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例在 CI 并发下竞态）按「与上游逐字节比对 + 本地重复跑」判定，不登记为同步丢语义。
- 归档、merge、push、PR 与工作区清理各自需要的授权互不代替；本轮工作区为 `current`，归档不需要收尾方式选择。

# Decisions

- **D1｜基线、区间与工作区**：同步基线锁定 annotated tag `v4.0.24`（tag 对象 `beed05c0…`，剥离提交 `c0189078a…`），一次跨 `v4.0.23` 与 `v4.0.24` 两个发布（45 提交 / 137 文件），fork 版本号 `4.0.22-1` → `4.0.24-1`；不纳入 `upstream/main` 的 5 个 tag 后提交。工作区用 `current`，沿用 main 与当前目录（本轮开始时工作区干净、无其他 active Native change、用户未要求并行，与 v4.0.12 至 v4.0.22 历轮一致）；`pre-sync-v424` 只作回退参照分支，不是工作区。
- **D2｜上游是否重写 fork 功能：没有，不构成二选一**（按用户要求逐项核实）。上游两轮的新增都落在 fork 没有自有实现的域：原生格式配置编辑器（Kimi/Mcode/omp）、思考档位换算与「怎么发」选择器、授权中心「全部刷新」与「登录时自动打开浏览器」、Skills 行样式、托盘副标题账号行、Grok 价格、预设与赞助商物料。取证：`v4.0.22..v4.0.24` 全量 diff 对 `websiteUrl2`/`website_url_2`/`connectivity`/`batchTest`/`visibleSidebarPanels`/`visible_sidebar_panels`/`left_click`/`show_menu_on_left_click`/`devpanel`/`forkOfficialAllowlist`/`IS_FORK_BUILD`/`updater` 全部 0 命中；`ProviderCard.tsx`、`ProviderList.tsx`、`ProviderCardActions.tsx`、`Sidebar.tsx`、`SettingsPage.tsx`、`GeneralSection.tsx`、`AboutSection.tsx`、`src/lib/api/settings.ts`、`forkOfficialAllowlist.ts`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`.github/workflows/ci.yml` 本轮上游零改动。因此全部上游功能按上游落地，fork 魔改一律保留，不存在「取上游还是保 fork」的功能替换。
- **D3｜托盘与窗口链路**：上游 `provider_hint` 的「备注 → 绑号 Claude 账号 → 官网域名」三级取值、`lib.rs` 抽出的 `handle_second_instance` + `spawn_blocking`（Windows 轻量模式二次启动修复）、Linux 托盘 `temp_dir_path` 全部取上游。fork 的左键「切换主窗口、永不弹菜单」四分支、`set_show_menu_on_left_click(false)` 与源码护栏 `tray_left_click_never_opens_the_menu` 保持不变——本轮上游未修改托盘点击处理，不存在 v4.0.17 / v4.0.22 那种点击分支级碰撞（上游 `tray.rs` 改动在第 1220–2272 行区，fork 改动在第 2666–3408 行区，不相交）。
- **D4｜schema：不撞号、不新增臂**：上游 `src-tauri/src/database/mod.rs` 本轮零改动，`SCHEMA_VERSION` 仍为 24，fork 保持 25；本轮没有迁移链合并，`schema.rs` 只取上游新增的 13 行 grok 价格种子（`grok-4.6-build`、`grok-4.7-build`、`grok-4.7-build-fast`）。上游新增的 `Provider` 结构体字面量（至少 `proxy/providers/claude_reasoning.rs` 的测试 helper）必须补 fork 的 `website_url_2`，否则 `cargo check --all-targets` 编译失败。
- **D5｜fork 预设白名单收录 `OpenAI API`：仅 claude / claude-desktop / codex**（2026-11-02 用户选择 A）。上游把第一方官方预设 `OpenAI API`（`platform.openai.com` / `api.openai.com`、`category: "cn_official"`）加进了 claude、claude-desktop、codex、openclaw、opencode、mcode 六个目录；fork 只在 `claude`、`"claude-desktop"`、`codex` 三个键追加 `"OpenAI API"`，与这三个应用既有的厂商官方卡（`Claude Official` / `Claude Desktop Official` / `OpenAI Official`）同口径。`openclaw` / `opencode` 是聚合式目录、fork 在其中只保留本机推理条目，`mcode` 目前无官方预设，三者的 `OpenAI API` 条目继续由白名单隐藏、不放开。条目名必须与上游 `name` 字段逐字一致（`"OpenAI API"`），拼写不符会让条目静默消失。其余上游新增预设（13 家 Gemini CLI / Antigravity 转发、Astron MaaS、A6API 换域等）继续在 fork 构建下隐藏。
- **D6｜fork Release 的 macOS runner 升到 macos-15**（2026-11-02 用户选择 A）。`.github/workflows/release.yml` 是 fork 专属裁剪文件（§3.1 整文件保留），本轮按用户决定在其 matrix 中把 `os: macos-14` 改为 `os: macos-15`，与上游 `8be840557` 一致，以缓解项目记录中的 macos-14 排队约 15 分钟被取消且无日志的问题。除此之外该文件的其他 fork 裁剪内容（`if: github.repository == 'tunecc/cc-switch' && contains(github.ref_name, '-')` 守卫、只构建 Windows x64 与 macOS arm64 unsigned、`$dest` 不带上游 `$assetSuffix`、MSI `REBOOT=ReallySuppress` 断言）全部保持，不引入上游的 macos-binary / macos-release 两个 job 结构。`.github/workflows/ci.yml` 本轮上游零改动，保持与上游一致的 cargo nextest 口径。
- **D7｜ClaudeFormFields 新字段的渲染位置**：上游「思考档位发法」字段的语义（`ProviderMeta.claudeReasoningEffort`、auto/passthrough/off、`isDirty` 追加该条件）全部取上游，渲染位置适配 fork 既有布局——fork 已把 API 格式选择器移入 `EndpointField.rightSlot` 并按 `apiFormatControl` / `copilotFormatFallback` 双点复用。这与 v4.0.20 轮 Copilot 自动协议提示的处理口径一致，属不改变用户可见语义的实现选择。
- **D8｜fork 魔改与上游同文件的叠加面**：`McodeProviderForm`（fork 导入入口只在 `appId === "mcode"` 渲染）叠加上游 +95/−26 的原生编辑器与 `dsh`/`mcode` 双服形态；`KimiProviderForm` 的 `KIMI_ALLOWED_PRESET_NAMES` 与「先编号再过滤」必须继续作用在上游改写后的 `PRESETS`（上游 hunk `@@ -100,6 +105,9 @@ const PRESETS = [` 与 fork 的过滤块相邻，预期停车）；`PiProviderForm`（上游 +63/−2）叠加 fork 的跨应用导入与白名单；`ProviderForm`（上游 +95/−23）叠加 fork 的 `entriesFor`、`extraActions`、`websiteUrl2`、连通性接线；`BasicFormFields` 上游只重写图标选择器区（`Dialog` → `FullScreenPanel`），fork 的 `websiteUrl2` 字段段（第 185 行起）保留；`shared/index.ts` 两侧导出取并集；`App.tsx` 上游只加 `RefreshAllQuotaButton` 的 import 与 `actions` 插槽，fork 三段语义不动；`commands/misc.rs` 上游 8 个 hunk 全在 Windows 工具路径/mise shim 区（第 2338 行起与测试区），fork 的 4 处 tunecc URL（`:82`、`:102-116`）与测试断言（`:6813`、`:6817`）不得被覆盖；`ProviderPresetSelector.test.tsx` 的上游断言数字（Claude 可见预设 111 → 112）取上游，fork 的 `extraActions`/过滤用例叠加回。
- **D9｜本地化**：4 个既有 locale 各 +27/−3 的上游新增（`providerForm.nativeConfig.*`、`reasoningEffort*`、`auth.openBrowser.*`、`login.copyLink`/`linkCopied`/`linkNote`/`linkCodeNote`、`quota.refreshAll`、`kimi.configTomlScope`/`configTomlSchema` 等）、改写（`skills.installed`、`login.reopen` / `quota.refreshAria` 收尾）与删除逐字取上游；fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`（上游本轮未改这两键）；`tr.json`（上游 +53/−6）整文件取上游、与 tag 逐字节一致、不补 fork 键；合并后 5 个文件按对象作用域显式查重 `dup=0`。
- **D10｜文档与交付授权延后**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 表按本轮结果增改共享文件行并追加 §4.10「v4.0.24 轮的叠加要点」，归档时把 `docs/comet/specs/upstream-sync/spec.md` 整体重写为 v4.0.24 完整状态；本轮不改 `docs/comet/specs/database-schema-migrations/spec.md`（schema 仍为 25、无新臂），除非实测出现例外。Build/Verify 不推送、不打 tag；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.24-1` 的推送。只授权这两项远端动作，不创建 PR。
- **D11｜规格记录方式：撤销本 change 的 upstream-sync 能力关联**（2026-11-02 用户选择 A）。本 change 创建时带入了 `--capability upstream-sync` 关联草稿，当前版 Runtime 因此要求 `specs/upstream-sync/delta.yaml` 与完整目标规格匹配，而 delta 只能改写带 `## Requirement: <稳定 ID>` 标记的需求段、会把历轮整体重写的全局规格正文当作不可改动的 legacy 保留，与本项目 33 轮「change 的 spec.md 即本轮完整终态、归档时整体重写 `docs/comet/specs/upstream-sync/spec.md`」的约定冲突。用户明确选择撤销关联：本轮沿用历轮文档做法，不采用累加式需求段。关联已由 Runtime 撤销（`comet native spec disassociate`，只撤销本 change 的关联草稿，不改全局规格与代码）；后续同步轮创建 change 时不带 `--capability`/`--task` 即可避免再次撞上。

# Open questions

已完成的核实与决定（用户提出的「上游若重复实现 fork 功能则分析并询问」）：本轮上游没有重复实现 fork 的任何自有功能（D2），因此不存在功能级二选一；两处政策面均已确认——上游新增的第一方官方预设 `OpenAI API` 只在 claude / claude-desktop / codex 收录（D5，2026-11-02 用户选择 A），fork Release 的 macOS runner 跟着上游升到 macos-15（D6，2026-11-02 用户选择 A）。`upstream/main` 上 tag 之后的 `b8112ca5e feat(mcp): check MCP server connectivity on demand` 与 fork 的连通性测试同域，但它未随发布进入任何 tag，按「只锁已发布 tag」排除在本轮范围外，待其发布后另起 change 评估。

# Verification expectations

- 定向检查（Build 期）：`cargo check --all-targets`、按受影响模块 `cargo nextest run`、`pnpm typecheck`、`pnpm test:unit` 的定向子集、locale 重复键显式查重脚本、`git grep -I` 保留清单取证。
- 正式检查计划（Verify 期，随 Builder 交接提交给 Runtime 执行）：
  1. `pnpm install --frozen-lockfile` 与 `pnpm typecheck`（锁文件与类型一致性）；
  2. `pnpm test:unit`（前端全量单测，含上游新增用例与 fork 用例）；
  3. `cargo check --all-targets --manifest-path src-tauri/Cargo.toml`（含 `website_url_2` 字面量与未使用告警）；
  4. `cargo nextest run --manifest-path src-tauri/Cargo.toml`（后端全量，含 `tray_left_click_never_opens_the_menu`、schema 用例、上游新增 `provider_concurrency_tests` / `startup_tests`）；
  5. locale 查重与逐字节核对脚本（4 个既有 locale `dup=0`、`tr.json` 与 tag 一致、上游新增键齐备）；
  6. fork 保留清单与移除清单的 `git grep` 取证脚本（updater / stream_check 零命中，connectivity 注册与 fork 链路与白名单在位）；
  7. 版本四文件与两个锁文件的 `git diff --numstat pre-sync-v424 HEAD` 核对；
  8. 四 ref 落地保真复算脚本（在最终态提交之后运行，输出逐行归因清单）。
- 已知不可靠信号：管道后的退出码、后台任务通知文本、未 grep 验证的符号名不得作为通过证据；时间敏感用例（`SessionManagerPage` 分桶、`AppsPage` 过期缓存竞态）出现单条红时先按上游同用例比对与本地重跑判定，不得直接记为通过。
- Verifier 需独立判断全部验收项，不只复跑命令；与当前候选实现匹配的成功检查记录可复用，失败/阻塞/未执行/超时不得算通过。
