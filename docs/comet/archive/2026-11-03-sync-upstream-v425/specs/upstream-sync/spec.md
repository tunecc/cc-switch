# 完整目标规格：upstream-sync（v4.0.25 轮）

> 本文件是 `sync-upstream-v425` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.24）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-02-sync-upstream-v424/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.25`（tag 对象 `5c0cc933f3619e0a31132de2005852ca65cfb2ec`，剥离提交 `a3eafa408ae679db2e3401fca767ed2b89d9a2b2`），fork 版本号 `4.0.24-1` → `4.0.25-1`。同步后 fork main = 上游 v4.0.25 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.24..v4.0.25` 共 31 个提交、130 个文件、+8570/−1189（16 新增 / 2 删除 / 112 修改）。本轮主轴是**连通性检测、额度与用量自动化、以及本地路由的安全边界**：上游正式发布 MCP 服务器按需连通性检测（#8348，含 #9149 的取消释放与共享探测上限）；新增 Codex 额度提前保护（#8395）与汇率自动获取（#8716）；Claude Code / Claude Desktop 的路由与 stack 模式模型行改为「<供应商> · <上游模型> · <窗口>」描述；托盘面板不再等数据先显示（#9154）；本地路由加浏览器请求防护（Origin/Host 校验）；纯文本上游剥离非文本媒体（#6274）；xAI 强制 web search 时发受支持的 `tool_choice`（#8664）；route 模式占位符不再写进 `ANTHROPIC_API_KEY`（#8111）；Windows 禁用 WebView2 常规自动填充以消除表单值闪烁（#6420）；Codex 表单新增子 agent 并发上限（#9056）；Kimi 会话删除（#9157）；Skills 发现页工具栏对齐已安装页（#9125）；models.dev 改走后端代理感知客户端（#8739）；Windows 终端优先 PowerShell 7（#8992）；供应商终端不再携带代理与 stack 设置；预设物料为净删除（DIT.ai 赞助商撤出、Qwen 换 MaaS 域名）；内置价格表加 GPT-6.1 Terra；`smol-toml` 升到 1.9.1；上游删除 `.github/dependabot.yml`。

**上游是否重写了 fork 已有功能——本轮结论：有一处同域新增（MCP 服务器连通性检测），已由用户决定为两条链路并存。** 取证与逐项分析：

1. **上一轮的预告在本轮兑现**：v4.0.24 归档规格明确登记「`b8112ca5e feat(mcp): check MCP server connectivity on demand (#8348)` 与 fork 的连通性测试同域，但不在任何已发布 tag 内，待其发布后另起 change 评估」。该提交现已随 `v4.0.25` 发布，故本轮按约定评估并交用户决定。
2. **逐项比对不是同一功能**：目标对象——上游是 MCP 服务器，fork 是 AI 供应商的逐模型；执行链路——上游走 MCP initialize 握手（stdio / Streamable HTTP / legacy SSE，≤3 并发、单服务器 30 秒超时、stdio 探针回收整个进程树、非 Windows 复用 ≤10 秒的登录 shell PATH 缓存），fork 走 `services/connectivity_test/` 的独立 reqwest+SSE 直连执行器（不经 proxy 转发链）；UI 位置——上游在 MCP 页页级「Check connectivity」与每行菜单「Test connection」，fork 在供应商卡 `ConnectivityBadge`、`ConnectivityTestDialog`/`ConnectivityDetailDialog` 与页头「批量检测」（按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控）。上游没有实现 fork 的逐模型测试，fork 也没有 MCP 检测。
3. **fork 侧关键词命中核查**：`v4.0.24..v4.0.25` 全量 diff 对 `websiteUrl2` / `website_url_2` / `batchTest` / `visibleSidebarPanels` / `visible_sidebar_panels` / `devpanel` / `forkOfficialAllowlist` / `IS_FORK_BUILD` / `show_menu_on_left_click` 的命中数均为 0；`connectivity` 只命中上游新增的 `mcp` 段与 `mcp_connectivity` 模块名，不落在 fork 的 `connectivityTest`/`provider.connectivityCheck` 键段或 `services/connectivity_test/` 目录。
4. **fork 高频魔改文件本轮上游零改动**：`src/components/providers/ProviderCard.tsx`、`ProviderList.tsx`、`ProviderCardActions.tsx`、`src/components/shell/Sidebar.tsx`、`src/components/settings/SettingsPage.tsx`、`sections/GeneralSection.tsx`、`AboutSection.tsx`、`src/lib/api/settings.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/providers/ModelQuickSwitch/`、`src/utils/providerModelUtils.ts`、`src/utils/providerImport.ts`、`src/components/providers/forms/ProviderImportEntry.tsx`、`src-tauri/src/services/connectivity_test/`、`src-tauri/src/commands/connectivity_test.rs`、`.github/workflows/ci.yml`、`.github/workflows/release.yml`。
5. **`src-tauri/src/tray.rs` 与 `TrayIconEvent::Click` 本轮上游零改动**（实测 `git diff v4.0.24..v4.0.25 -- src-tauri/src/tray.rs | grep -E 'TrayIconEvent|native_menu_on_left_click|toggle_main_window'` 为空），因此不存在 v4.0.17 / v4.0.22 那种点击分支级碰撞；fork 的左键契约与源码护栏原样保留。
6. **托盘面板新行为不触碰 fork 插入点**：上游 `tray_panel.rs`（+48/−18）只改 `place()` 签名（新增 `texts` 参数）、`PanelPlacement` 新增 `texts` 字段、删除 `TrayPanelState` 包装让 `tray_panel_state` 直接返回 `crate::tray::PanelModel`，以及相应测试；fork 的 `panel_visible()`（10 行，插在 `panel_window` 之后、`ensure_window` 之前）不在这些位置。
7. **路由/stack 模型描述与 fork 的模型徽章不重复**：上游在 live 配置里新增写 `ANTHROPIC_DEFAULT_*_MODEL_DESCRIPTION`（`live/project/claude.rs`、`mode/{contract,controller,stack}.rs`、`claude_desktop_config.rs`），作用对象是 Claude Code 的 `/model` 菜单与 Claude Desktop 的模型副标题；fork 的模型徽章与快捷切换（`src/utils/providerModelUtils.ts`）按**精确键名**读 `ANTHROPIC_DEFAULT_{SONNET,OPUS,FABLE,HAIKU}_MODEL`（及其 `_NAME` 别名），不枚举 env 键，因此描述键不会被误当模型字段、徽章取值不受影响。
8. **上游本轮净新增预设为 0**：`git diff v4.0.24..v4.0.25 -- src/config/ | grep '^\+\s+name:'` 无命中，只有 DIT.ai 赞助商预设（6 个目录的 `DIT.ai` 条目与 `dit` 文案键）删除、Qwen 按量付费与 Token Plan 换 MaaS 域名、以及 `hermes`/`openclaw`/`opencode`/`pi` 的相应删行。`forkOfficialAllowlist.ts` 的条目集合不含 DIT.ai 与 Qwen，因此本轮不产生 v4.0.24 轮 D5 那种「是否收录新第一方官方预设」的决定。

因此本轮除 D14（两条连通性链路并存）外，全部上游功能按上游落地，fork 魔改一律保留。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.25` 剥离出的提交 `a3eafa408ae679db2e3401fca767ed2b89d9a2b2`。
- `git merge-base main v4.0.25^{}` == `a3eafa408`；`git log v4.0.25..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 195 个 fork 提交（`git rev-list --count v4.0.24..main`，同步前 main = `37db4bbe6`，即 fork tag `v4.0.24-2` 指向的提交，起点为上一轮归档后的文档提交）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v425`（= `37db4bbe6`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.24`（剥离 `c0189078a`）与 fork 发布 tag `v4.0.24-1` / `v4.0.24-2` 保持不变、不改写历史。
- `upstream/main` 当前为 `7afceec14`（比 tag 多 1 个提交：`ci(release): retry xcrun stapler when CloudKit drops the connection`），按「只锁已发布 tag」约定本轮不纳入；不同步其他上游分支（`feat/session-content-search`、`fix/omp-skills-disabled-extensions`、`feat/omp-native-logins`、`feat/skills-toolbar-unify`、`feat/skills-row-layout`、`fix/tray-claude-account-email`、`chore/human-note-templates`、`ci/schema-version-guard`、`codex/perf-proxy-hot-path`、dependabot 分支等）。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v425/` 产物。

### 同步范围（v4.0.24..v4.0.25：31 提交、130 文件、+8570/−1189）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **MCP 服务器按需连通性检测（3 提交）**：`b8112ca5e`（#8348：MCP 页页级「Check connectivity」检测所有已启用服务器、行菜单「Test connection」检测单个；打开页面不自动跑；未检测显示「Not checked」；该服务器连接配置变化后结果复位；MCP initialize 握手走 stdio / Streamable HTTP / legacy SSE；最多 3 并发、单服务器 30 秒超时；stdio 探针在成功/失败/取消/超时时回收整个进程树；非 Windows 复用缓存的登录 shell PATH，上限 10 秒，让 GUI 启动也能找到 npx/uvx；修 #4498）、`eb6ba2689`（#9149：释放已取消的连通性检测并共享探测上限）、`fb241637b`（登录 PATH fixture 改走 wrapper 脚本）。
2. **Codex 额度提前保护（1 提交）**：`aa42a93d5`（#8395：新 `proxy/codex_quota_protection.rs`、`settings.rs` 的 `CodexQuotaProtection`（`enabled` 默认 false、`five_hour_threshold` 默认 95、`weekly_threshold` 默认 98、`validate()` 要求 1..=99 整数）、设置页 `CodexQuotaProtectionSettings.tsx`、`forwarder.rs` 在 POST 到官方 Codex 路由前 `admit(token, headers)`、响应头经 `observe_response` 回灌下一次判定；未知用量永不阻塞，关掉不改变任何行为）。
3. **汇率自动获取（1 提交）**：`c17de413e`（#8716：新 `services/exchange_rates.rs`（`fetch_exchange_rates`，1 美元折目标币种）与 `src/hooks/useAutoExchangeRates.ts`；`types.ts` 加 `rateSource`（`"auto"` / `"manual"`，缺省 manual，只有用户主动选自动才联网）、`autoExchangeRates`（与手填 `exchangeRates` 分开，切回手动不丢手填值）、`rateFetchedAt`、`rateProvider` 与 `FetchedExchangeRates` 接口；`tests/msw/tauriMocks.ts` 加 `isTauri: () => false`）。
4. **路由与 stack 模式的模型描述（2 提交）**：`9267ec8b1`（Claude Desktop：本地 `/claude-desktop/v1/models` 为每一项返回描述「<供应商> · <上游模型> · <窗口>」，route profile 置 `modelDiscoveryEnabled = true`；有 `inferenceModels` 列表时 Desktop 保留列表、只从 discovery 取名称与描述，模型列表仍完全由 CC Switch 控制；discovery 失败时副标题退回 Desktop 自带文案）、`2e2a59cc4`（Claude Code：路由契约额外写 `ANTHROPIC_DEFAULT_*_MODEL_DESCRIPTION`（仅对被标记 1M 的上游附带窗口），行上已有描述则优先，未配置的 fable 档不写；stack 模式选择器行用同一格式，与 Claude Desktop 共用 `stack::provider_model_description`；Codex 保持「<模型> · <窗口>」；供应商名进入路由契约，因此既有路由模式用户升级后 `settings.json` 被重写一次）。
5. **托盘面板先显示后填数据（1 提交）**：`f8f487b1d`（#9154：`PanelTexts` 随方位（`PanelPlacement.texts`）而不是随数据下发，`place()` 多一个 `texts` 参数；`tray_panel_state` 去掉 `TrayPanelState` 包装只返回 `PanelModel`；前端先按方位显示头部与底栏，热开复用上次内容，数据到达后再填——启动期会话用量导入会按文件整事务占库几秒到一分钟，不再让面板空白等待；新增 `placement_carries_the_panel_texts_in_the_shape_the_frontend_reads` 用例）。
6. **本地路由的安全与正确性（4 提交）**：`e6d0bf61a`（新 `proxy/browser_guard.rs` + `proxy/server.rs`：拒绝任何带 `Origin` 头的请求（CLI 客户端从不发 Origin；`/claude-desktop/*` 保留自己的 gateway token 校验），loopback 监听上只接受公网 DNS 指不过来的 `Host`——IP 字面量、`localhost`、保留的 `.localhost`/`.local`/`.internal` 后缀（覆盖 `host.docker.internal`）以及用户配置的客户端地址；只检查头，转发的请求本身不变；防 no-cors `text/plain` POST 刷额度与 DNS rebinding 读取响应）、`4a0baf691`（#6274：纯文本上游除图片外还剥离 file/audio 媒体块，`media_sanitizer.rs` +414/−10，`forwarder.rs` 的 `replaced_images` 改名 `replaced_media`、日志改为「Replaced N unsupported media block(s)」）、`5ba95160c`（#8664：发往 xAI 的 Responses 请求把托管搜索的 `tool_choice` 改成受支持的字符串形式，`claude_responses_targets_xai` 同时看 `is_xai_oauth()` 与 `env.ANTHROPIC_BASE_URL`/`base_url`/`baseURL`/`apiEndpoint` 是否含 `api.x.ai`；OpenAI 自己的 `{"type":"web_search"}` 不动）、`686ba51ef`（#8111：route 模式的本地占位符留在 `ANTHROPIC_AUTH_TOKEN`，不再作为 `ANTHROPIC_API_KEY` 出现，`services/provider/mod.rs` 的断言随之改写）。
7. **Codex 表单与提示（2 提交）**：`a9e607c39`（#9056：供应商表单新增子 agent 并发上限字段，`codexAgentMaxThreads` / `multiAgentV2Total` / `onAgentMaxThreadsChange` 经 `ProviderForm.tsx`（+6/−0）接进 Codex 字段区，新增 `tests/components/CodexFormFields.subagent.test.tsx`）、`f332b472f`（classic tools 一关就隐藏 forced-v2 警告）。
8. **用量与模型目录（3 提交）**：`0b274ec3e`（#7643：Codex 请求模型别名去重，`src/utils/providerConfigUtils.ts` 与 `tests/utils/providerConfigUtils.codex.test.ts`、`tests/components/usageFormat.test.ts`）、`69b41cdbe`（#8386：导入 Pi 官方子 agent 用量）、`5c14e9172`（#8739：`src/lib/modelsDev.ts` 改走后端代理感知客户端拉 models.dev，修复纯代理环境下的同步失败，`ModelsDevAutoSyncPanel`/`modelsDevAutoSync` 用例同步更新）。
9. **会话与 Skills（2 提交）**：`4cf15aeac`（#9157：实现 Kimi 会话删除并更新相关提示）、`42f7d0e01`（#9125：Skills 发现页工具栏与已安装页对齐）。
10. **Pi MCP 同步跟进（1 提交）**：`1cc2c7321`（#7888 的评审后续修复）。
11. **表单稳定性（1 提交）**：`153db16e5`（#6420：Windows 上给主窗关闭 WebView2 常规自动填充，避免存储建议覆盖受控表单值；经 `on_webview_ready` 插件钩子实现，因此也覆盖轻量模式重建的窗口；非 Windows 行为不变。`lib.rs` +38、`Cargo.toml` 加 `webview2-com = "0.38"` 与 `windows = "0.61"`）。
12. **终端（2 提交）**：`3071cae90`（供应商终端不携带代理与 stack 设置）、`9bd8fe510`（#8992：Windows 首选终端为 PowerShell 时优先 `pwsh`）。
13. **Pi 兼容声明（1 提交）**：`b696f8901`（#8540：minimax M3.1-Flash 在 Pi 中声明原生思考档位，`piThinkingProfiles.ts` +13）。
14. **预设物料（2 提交）**：`aa379e091`（撤出 DIT.ai 赞助商与其在 6 个目录中的预设、`dit` 文案键与横幅图）、`0103f4c87`（Qwen 按量付费与 Token Plan 迁到新的 MaaS 域名）。
15. **内置价格（1 提交）**：`f02528179`（#9151：`schema.rs` 加 `gpt-6.1-terra` 一行 4 行代码（含注释），价 1 / 5 / 0.05 / 1.25）。
16. **依赖（1 提交）**：`ef7b77dee`（#9155：`smol-toml` `^1.4.2` → `^1.9.1`，`pnpm-lock.yaml` 随之 5/5）。
17. **CI、发布与文档（3 提交）**：`9119decac`（删除 `.github/dependabot.yml`）、`05824df30`（版本号 4.0.25）、`a3eafa408`（`docs/release-notes/v4.0.25-{en,zh,ja}.md`）。

新增文件 16 个（`git diff --name-status --diff-filter=A v4.0.24 v4.0.25` 的全部 A 项），fork 侧无自有语义、随上游整体落地：

- 后端：`src-tauri/src/proxy/browser_guard.rs`、`src-tauri/src/proxy/codex_quota_protection.rs`、`src-tauri/src/services/exchange_rates.rs`、`src-tauri/src/services/mcp_connectivity.rs`、`src-tauri/src/services/mcp_connectivity/tests.rs`、`src-tauri/tests/fixtures/mcp_connectivity_server.rs`。
- 前端：`src/components/settings/CodexQuotaProtectionSettings.tsx`、`src/hooks/useAutoExchangeRates.ts`、`src/hooks/useMcpConnectivity.ts`、`src/whats-new/4.0.25.json`。
- 前端测试：`tests/components/CodexQuotaProtectionSettings.test.tsx`、`tests/hooks/useAutoExchangeRates.test.tsx`、`tests/hooks/useMcpConnectivity.test.tsx`。
- 文档：`docs/release-notes/v4.0.25-{en,ja,zh}.md`。

删除文件 2 个：`.github/dependabot.yml`（`9119decac`；fork 从未修改该文件，不在重叠面，随上游删除）与 `assets/partners/logos/dit-banner.png`（DIT.ai 物料）。

### MCP 连通性检测与 fork 逐模型连通性测试终态（并存，D14）

- **上游 MCP 侧**：MCP 页有页级「检测连通性」按钮（检测所有已启用服务器）与每行菜单的「测试连接」（检测单个）；打开页面不触发任何检测；未检测的行显示「未检测」；某台服务器的连接配置一旦变化，它的结果复位。执行走 MCP initialize 握手，支持 stdio、Streamable HTTP 与 legacy SSE 三种传输；同时最多 3 个检测、单台 30 秒超时；stdio 探针在成功、失败、取消与超时四种路径都回收整个进程树；非 Windows 上复用缓存的登录 shell PATH（缓存获取上限 10 秒），使 GUI 启动也能找到 `npx` / `uvx`。实体：`services/mcp_connectivity.rs`（含 `tests.rs`）、`commands/mcp.rs` 的 `start_mcp_connectivity_checks` / `cancel_mcp_connectivity_checks`、`commands/mod.rs` 的 `#[cfg(not(target_os = "windows"))] pub(crate) use misc::{login_shell_path, merge_path_segments, CommandDeadline};`、`lib.rs` 两个命令注册、`services/mod.rs` 的 `pub mod mcp_connectivity;`、`src/hooks/useMcpConnectivity.ts`、`src/lib/api/mcp.ts`、`UnifiedMcpPanel.tsx`（fork 零语义，整文件随上游）、5 个 locale 的 `mcp` 新增段（含 `checkConnectivity`）与上游新增测试。`Cargo.toml` 的 `rmcp = 0.8.5`（client + transport-async-rw + transport-sse-client-reqwest + transport-streamable-http-client-reqwest）与 `process-wrap = 8.2`（tokio1）取上游。
- **fork 侧不变**：`services/connectivity_test/`（`mod.rs`/`model_ids.rs`/`protocol.rs`）的独立 reqwest+SSE 直连执行器、`commands/connectivity_test.rs` 与 `lib.rs` 的 `connectivity_test_provider_models` / `connectivity_probe_provider` 注册、`ConnectivityTestDialog` / `ConnectivityDetailDialog` / `ConnectivityBadge` / `connectivityEntry.ts`（`shouldShowTestEntry` 仍只放行 claude/codex）、`useConnectivityTest` / `useConnectivityProbe`、`connectivityTestSettings.ts`、`lib/api/connectivity-test.ts` / `connectivity-check.ts`、`lib/api/failover.ts`，以及 `connectivityTest` / `provider.connectivityCheck` 键段——实现、形态与入口全部不改、不合并、不删除。
- **两条链路的边界**：不共用后端服务、不共用命令、不共用 hooks、不共用 locale 键；页头「批量检测」仍只驱动逐模型探针，MCP 页按钮仍只驱动 MCP 握手。不做任何「统一命名 / 统一入口 / 共用上限与超时」的额外改造。
- **注册区叠加是静默失效高危点**（上一轮实测）：`lib.rs` 的 `invoke_handler` 必须同时含上游 2 个与 fork 2 个连通性相关注册，且 `stream_check_provider` 保持 0 命中；`commands/mod.rs` 与 `services/mod.rs` 的模块声明取并集，`stream_check` 维持删除态。

### Codex 额度提前保护终态

- 设置页新增 Codex 额度保护区块（`CodexQuotaProtectionSettings.tsx`）：开关 + 5 小时窗口阈值 + 周窗口阈值，默认关闭、默认阈值 95 / 98，取值必须是 1..=99 的整数（后端 `validate()` 拒绝越界）。
- 转发链只在 POST 且走 Codex 官方路由时取 bearer token（`codex_bearer_access_token`，取不到即报 `AuthError`）并调用 `admit`；官方响应（含错误响应）自带的用量头经 `observe_response` 回灌给下一次判定，不额外发一次查询。
- 未知用量永不阻塞：`enabled: false` 时行为与本轮之前完全一致。
- fork 边界：`src-tauri/src/settings.rs` 的 `VisibleSidebarPanels` 字段段（fork +47/−0）与上游 `CodexQuotaProtection` 结构、`Default` 条目、normalize 段并存（上游 +66/−3），两段都必须存在，不得整文件取一侧。

### 汇率自动获取与用量终态

- 用量页的汇率来源可选「自动获取 / 手动填写」，缺省手动，只有用户主动选自动才联网；自动取到的值存 `autoExchangeRates`（按币种），与手填 `exchangeRates` 分开，切回手动不丢手填值；`rateFetchedAt` 与 `rateProvider` 用于显示新鲜度与实际数据源署名。
- 后端 `services/exchange_rates.rs` 的 `fetch_exchange_rates` 返回「1 美元折多少目标币种」、时间与源。
- 前端 hook `useAutoExchangeRates.ts` 以 `isTauri` 为发真实请求的前提（`tests/msw/tauriMocks.ts` 本轮加 `isTauri: () => false`，fork 已有的 `isTauri` mock 段（fork +2/−0）与上游新增并存，取并集）。
- 其余用量改动全部取上游：Codex 请求模型别名去重（#7643，`providerConfigUtils.ts` +171/−?、`src/utils/errorUtils.ts` +20）、Pi 官方子 agent 用量导入（#8386）、`UsageDisplaySection` 与 `usageFormat` 用例扩充、models.dev 改走后端代理感知客户端（#8739）。fork 在 `providerConfigUtils.ts`、`errorUtils.ts`、`modelsDev.ts`、用量组件上零语义，整文件随上游。

### 路由与 stack 模式模型描述终态

- Claude Code 路由模式：`/model` 选择器每个档位除模型名外还显示「<供应商> · <上游模型> · <窗口>」，窗口只对被标记 1M 的上游出现；行上已有描述则以上游写的内容为准，未配置的 fable 档不写描述。
- Claude Desktop：本地 `/claude-desktop/v1/models` 为每一项返回同格式描述，route profile 打开 `modelDiscoveryEnabled`；存在 `inferenceModels` 时 Desktop 保留列表、只从 discovery 取名称与描述，列表仍由 CC Switch 完全控制；discovery 失败时副标题退回 Desktop 自带文案。
- stack 模式复用 `stack::provider_model_description`；Codex 保持「<模型> · <窗口>」（其显示名已带供应商，`/status` 与状态行只显示显示名）。
- 供应商名进入路由契约，既有路由模式用户升级后 `settings.json` 被重写一次（`mode/contract.rs` 契约版本变更）。
- **fork 徽章不受影响的依据与要求**：`src/utils/providerModelUtils.ts` 与 `src/lib/providerModelIds.ts` 按精确键名读 `ANTHROPIC_DEFAULT_{SONNET,OPUS,FABLE,HAIKU}_MODEL` 及 `_NAME` 别名，不枚举 env 键，因此新增的 `_MODEL_DESCRIPTION` 不会进入徽章或快捷切换的候选；fork 的 1M 全选与角色模型映射「非高级」判定不变。快捷切换改写档位后走同一条 live 配置重写链路，因此上游生成的描述与新的模型取值保持一致，不残留过期供应商名。

### 托盘面板与左键契约终态

- **上游新行为**：面板先按方位显示头部与底栏（文案随 `PanelPlacement.texts` 下发，不再等数据），热开复用上一次内容，数据到达后填充；`tray_panel_state` 只返回 `crate::tray::PanelModel`；`place()` 多 `texts` 参数；`src/tray-panel/TrayPanel.tsx`（+112/−?）与 `src/tray-panel/api.ts`（+7/−?）fork 零语义，整文件随上游；`tests/components/TrayPanel.test.tsx` 上游新增 211 行用例取上游。
- **fork 契约不变**：`tray_panel::panel_visible()` 仍在 `panel_window` 之后、`ensure_window` 之前；`tray.rs::handle_tray_icon_event` 的四条分支（面板样式且左键 Up 且面板未显示 → `toggle_main_window`；面板样式其余情况 → `tray_panel::toggle(rect)` 并返回；原生菜单样式左键 Up → `toggle_main_window`；原生菜单样式右键 Up → `mark_feedback_seen` 后交系统菜单）、`apply_tray_style` 的 `set_show_menu_on_left_click(false)`、`hide_main_window` / `toggle_main_window` 与源码护栏 `tray::tests::tray_left_click_never_opens_the_menu` 全部保持；`native_menu_on_left_click` 保持删除态；`lib.rs` 托盘 builder 的 `.show_menu_on_left_click(false)` 与 `.on_tray_icon_event(tray::handle_tray_icon_event)` 保持。
- 本轮上游未触碰 `TrayIconEvent::Click`，因此「先显示后填数据」与左键切换不矛盾：可见性判定仍只看窗口是否可见，与数据是否到位无关。

### 本地路由防护与其他代理终态

- `proxy/browser_guard.rs` + `proxy/server.rs`（+68）：带 `Origin` 头的请求一律拒绝（`/claude-desktop/*` 仍走 gateway token 校验）；loopback 监听上 `Host` 只接受 IP 字面量、`localhost`、`.localhost`/`.local`/`.internal` 结尾的保留名，以及设置里的客户端地址（`proxy_client_host`，fork 沿用上游实现）。只检查头，转发内容不变。
- fork 侧不受影响的依据：逐模型连通性测试与批量探针都在后端用 reqwest 直连供应商 API，不经浏览器、不带 `Origin`；DevPanel 不向本地路由发 HTTP 请求（`src/components/devpanel/DevPanel.tsx` 无 `fetch`）；`src/config/userAgentPresets.ts` 与 `forwarder.rs` 的 `parse_custom_user_agent` 语义属请求改写，与入站防护不相干。
- 纯文本上游剥离 file/audio（不只是 image），marker 与日志文案随上游改名；xAI 托管搜索的 `tool_choice` 只在确实发往 xAI 时改成字符串形式；route 模式占位符不再出现在 `ANTHROPIC_API_KEY`。
- Codex 表单新增子 agent 并发上限字段；classic tools 关闭后立即隐藏 forced-v2 警告。
- Windows 主窗禁用 WebView2 常规自动填充（`disable_windows_general_autofill` + `windows-general-autofill` 插件钩子），fork 无 Updater 插件注册的语义不变——本文件是「取上游易带回 updater」的高危点，解完必须 grep `tauri_plugin_updater` / `updater_builder` 为 0 命中。

### 终端、会话、Skills 与预设物料终态

- 供应商终端不携带代理与 stack 设置；Windows 首选终端为 PowerShell 时优先 `pwsh`。fork 在相关文件的自有语义为 0，随上游。
- Kimi 会话删除（#9157）与 Skills 发现页工具栏对齐（#9125）落地上游实现；fork 在会话与 Skills 文件上零语义（不在重叠面），整文件随上游；`SKILLS_APP_IDS` 等 fork 既有接线不变。
- minimax M3.1-Flash 在 Pi 声明原生思考档位（`piThinkingProfiles.ts` +13）。
- 预设目录净删除面：DIT.ai 在 `hermes`（4/36）、`openclaw`（14/64）、`opencode`（15/53）、`pi`（7/26）、`gemini`（0/21）、`grokBuild`（0/11）等目录中的条目与 Qwen 换域改写全部取上游；fork 在各 `*ProviderPresets.ts` 保留接口上的 `hidden?: boolean` 两行，不改 `forkPresetFilter.ts` 判定。
- **fork 白名单本轮零改动**：`forkOfficialAllowlist.ts` 不含 DIT.ai 与 Qwen 条目，删除不产生悬空条目；上游净新增预设为 0，不新增任何收录；既有条目集合（含上一轮 D5 的 claude / claude-desktop / codex 三条 `"OpenAI API"`）保持。
- 内置价格表加 `gpt-6.1-terra`（`schema.rs` 上游 +4/−0）。
- `.github/dependabot.yml` 随上游删除；`.github/workflows/ci.yml` 与 `release.yml` 本轮上游零改动，fork 裁剪版整文件保留，Release 的 macOS job 继续锁 `macos-14`（项目记录：`macos-15` 标签在本仓库两次约 15 分钟 cancelled、`runner: null`、零日志）。

### 数据库 schema 终态（25，本轮不升级）

- `SCHEMA_VERSION` == 25。上游 `v4.0.24..v4.0.25` 未改动 `src-tauri/src/database/mod.rs`，`v4.0.24` 与 `v4.0.25` 的上游常量同为 24，**本轮不存在版本号碰撞**，fork 不需要再升位、不需要新增迁移臂。
- 迁移链维持上一轮终态：v18→v19（fork `website_url_2` + 上游 `enabled_mcode`）；v19→v20（`enabled_pi`）；v20→v21（fork mcode/pi 幂等修复 + `enabled_agy`）；v21→v22（`enabled_agy` 幂等 + `enabled_kimi`）；v22→v23（`enabled_kimi` 幂等 + `enabled_omp` 仅 `mcp_servers`）；v23→v24（`enabled_kimi`/`enabled_omp` 幂等 + `enabled_dsh` 两表 + `session_log_sync.parser_state`）；v24→v25（幂等补 `enabled_dsh` 两表与 `parser_state`）。
- `database/schema.rs` 本轮上游唯一改动是定价种子表的 `gpt-6.1-terra`（+4/−0），与 fork 的迁移臂（fork 侧 +564/−5）不相交。
- MCP 连通性检测、Codex 额度保护、汇率自动获取都**不新增表、列或迁移**：新设置进 `settings` 的 JSON，探测状态只在内存。
- 降级策略不变（fork v25 库被上游 v4.0.25 的 v24 打开报「数据库版本过新」）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果增改：`lib.rs` 行（上游 `disable_windows_general_autofill` + `windows-general-autofill` 插件钩子 + 两个 mcp 连通性命令注册 + fork 三段语义）、`commands/mod.rs` 行（上游 `#[cfg(not(windows))] pub(crate) use misc::{login_shell_path, merge_path_segments, CommandDeadline}` + fork `connectivity_test` 保留 / `stream_check` 维持移除）、`services/mod.rs` 行（上游 `pub mod exchange_rates;` / `pub mod mcp_connectivity;` + fork 模块声明）、`services/provider/mod.rs` 行（上游 `claude_editor::switch_drops` 复导出与 route 模式 `ANTHROPIC_API_KEY` 断言改写 + fork 4 处 `website_url_2: None`）、`settings.rs` 行（上游 `CodexQuotaProtection` + fork `VisibleSidebarPanels` 并存）、`tray_panel.rs` 行（上游 `place()` 加 `texts`、`PanelPlacement.texts`、`tray_panel_state` 返回 `PanelModel` + fork `panel_visible()` 并存）、`database/schema.rs` 行（上游 `gpt-6.1-terra` 种子、schema 不升位）、`proxy/forwarder.rs` 与 `proxy/media_sanitizer.rs` 行（媒体剥离改名与范围扩大）、`proxy/providers/claude.rs` 行（`claude_responses_targets_xai` 与 xAI `tool_choice` 改写）、`commands/misc.rs` 行（上游 222 行 MCP/终端/工具改动 + fork 4 处 tunecc URL）、`src/types.ts` 行（上游汇率与额度保护类型 + fork 两段并存）、`tests/msw/tauriMocks.ts` 行（上游 `isTauri: () => false` + fork mock 段并集）、6 个 `*ProviderPresets.ts` 行（本轮为净删除面）、4 个 locale 行、`ProviderForm.tsx` 行（上游 Codex 子 agent 6 行接线）、`tests/components/{AppsPage,ProviderPresetSelector}.test.tsx` 行。
  - §4 白名单表补：`forkOfficialAllowlist.ts` 行登记「本轮上游净新增预设为 0、无新增收录，DIT.ai/Qwen 不在白名单故删除无悬空」；`.github/` 行登记「上游删除 `.github/dependabot.yml`，fork 随上游；两个 workflow 本轮上游零改动，Release 继续锁 `macos-14`」。
  - 新增 §4.11「v4.0.25 轮的叠加要点（2026-11-03 同步实测）」：同域新增（MCP 连通性）与 fork 逐模型测试的并存边界、注册区并集、托盘先显示后填数据与左键契约、路由模型描述与 fork 徽章的键名边界、schema 不撞号、上游新增 `Provider` 字面量补 `website_url_2` 的排查面、重放与保真实测数字。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：本轮登记「上游 v4.0.25 未推进 schema，fork 保持 25、无新臂」；若 Build 实测出现例外则按实测改写。
- fork 自有能力规格（连通性测试、模型快捷切换、双官网链接、侧栏面板、托盘左键、跨应用导入、fork 测试稳定性、fork 预设白名单）本轮不改，除非合并暴露出与终态不符的描述。`README.md` 中关于「连通性测试」的段落需在终态复核是否需要补一句「MCP 服务器另有上游自带检测」，但 README 是 fork 整文件自有，改写与否不构成本轮的保真缺失项。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 同步前 `git rev-list --count v4.0.24..pre-sync-v425` 预期 == 195。
- 重放后 `git rev-list --count v4.0.25..HEAD` 与 195 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录被丢弃提交的主题与判空原因。
- tag `v4.0.25` 是 annotated tag：tag 对象 `5c0cc933f…`，剥离提交 `a3eafa408…`；`git merge-base main v4.0.25^{}` == `a3eafa408…`；`git log --format='%an <%ae>' v4.0.25..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.24..pre-sync-v425` 与重放后 `v4.0.25..HEAD`）差异必须为 0 行（剔除被判空丢弃的提交后比较）。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期停车面：四个版本与两个锁文件、`README.md`、`src-tauri/Cargo.toml`、`src-tauri/src/lib.rs`、`commands/{mod,misc}.rs`、`services/mod.rs`、`services/provider/mod.rs`、`settings.rs`、`tray_panel.rs`、`database/schema.rs`、`proxy/forwarder.rs`、`proxy/media_sanitizer.rs`、`proxy/providers/claude.rs`、`src/types.ts`、`forms/ProviderForm.tsx`、6 个 `*ProviderPresets.ts`、4 个 locale、`tests/msw/tauriMocks.ts`、`tests/components/{AppsPage,ProviderPresetSelector}.test.tsx`。
- 冲突停车清单（交互式）在 Build 阶段逐条记录；rerere 复用的解法必须逐个复核，尤其版本四文件、locale 与 `lib.rs`。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。

### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.24..v4.0.25` 改动过的每个文件（130 个，覆盖 32 个重叠文件）取 `git diff v4.0.24 v4.0.25 -- f` 的增/删行、`git diff v4.0.24 pre-sync-v425 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。非重叠的 98 个上游文件在 fork 侧缺失必须为 0。
- 计算必须在全部最终态提交（版本、文案、白名单核对、文档、表单合并、测试断言修正）落完之后，对最终代码终态 `HEAD` 执行；其后的归档提交只改 Markdown，不在 130 个文件内，故数字不变。差异行必须带重数与文件归属。
- 预期的刻意取舍（逐行归因，具体行数在 Build 后按实测记录到归档产物与 `verification.md`）：
  - `README.md`：fork 整文件自有的「与上游的差别」文档；上游本轮 0/5（DIT.ai 相关行删除）不落地，归因为「fork 整文件替换」。
  - 版本与锁文件：上游 `4.0.25` 行被 fork `4.0.25-1` 取代（`package.json`、`tauri.conf.json`、`Cargo.toml`、`Cargo.lock` 各 1 行）；fork 的 `4.0.24-1` 行被本轮终态升级（属预期流转）。
  - `src-tauri/Cargo.toml` / `Cargo.lock`：上游新增 `rmcp`、`process-wrap`、Windows target 的 `webview2-com`/`windows`、dev 的 `tokio` test-util 全部落地；fork 移除的 `tauri-plugin-updater`、`repository = tunecc`、`codegen-units = 1` 保持（`Cargo.lock` 终态相对上游只允许 fork 侧既有差异）。
  - `pnpm-lock.yaml`：上游 `smol-toml` 1.9.1 相关 5/5 全部落地；fork 移除的 `@tauri-apps/plugin-updater` 三段（fork 侧 0/10）不得出现。
  - `.github/dependabot.yml`：随上游删除，fork 无自有语义，不算缺失。
  - `src-tauri/src/settings.rs`：fork 的 `VisibleSidebarPanels` 47 行保留，上游 `CodexQuotaProtection` 与 3 行删除按上游；两段并存，不产生上游缺失。
  - `src-tauri/src/tray_panel.rs`：fork 的 `panel_visible()` 10 行保留，上游 `place()`/`PanelPlacement.texts`/`tray_panel_state` 改造全部落地；`TrayPanelState` 结构删除按上游。
  - `src-tauri/src/lib.rs`：上游 `disable_windows_general_autofill` + 插件钩子 + 两个 mcp 注册全部落地；fork 的无 Updater 段保持不存在（属上一轮已归因的刻意删除），connectivity 两个注册与托盘语义保留。
  - `database/schema.rs`：fork 的 564/5 迁移臂保留、上游 4 行 `gpt-6.1-terra` 种子落地；`SCHEMA_VERSION` 仍为 fork 25（上游 24 不落地，属历轮已归因的版本号流转）。
  - 6 个预设文件：目录内容整份取上游（本轮为 DIT.ai 删除与 Qwen 换域），fork 各保留 `hidden?: boolean` 两行，不产生上游缺失。
  - 4 个 locale：上游各 47/47/43/42 行新增与 11/11/7/6 行删除全部按上游落地；fork 键段（`connectivityTest`/`connectivityCheck`/`devpanel`/导入/快捷切换/侧栏/置顶置底，及 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 两条专属文案）不产生上游缺失；上游删除的 `dit` 键必须零残留。
  - `tests/msw/tauriMocks.ts`：上游 `isTauri: () => false` 与 fork 的 mock 段（各 2/0）取并集，两侧都不许丢。
  - `tests/components/AppsPage.test.tsx`：上游新增 26 行取上游；fork 的 12/6 中只有 §4 白名单那一行描述的 `waitFor` 稳定化用例按 fork 终态，逐行归因为「测试稳定化等价」。
  - `ProviderPresetSelector.test.tsx`：上游 2/2 改写取上游（该用例在 `IS_FORK_BUILD=false` 下跑），fork 的 33 行 `extraActions`/白名单用例保留。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.25 HEAD -- <file>` 只看 fork 侧新增/删除。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 32 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.24 v4.0.25 | sort) <(git diff --name-only v4.0.24 main | sort)`，已排除 `docs/comet/`、`.comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`；上游 130 文件 + fork 代码面 330 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.24 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（6 个）

- **`package.json`**（2/2 / 2/2）：取上游内容（`smol-toml` `^1.9.1`），版本号改为 fork `4.0.25-1`；保留 fork 的 `dev:fork` script 与已移除的 `@tauri-apps/plugin-updater` 依赖。
- **`src-tauri/Cargo.toml`**（7/1 / 3/6）：取上游内容（`rmcp`、`process-wrap`、Windows target 的 `webview2-com`/`windows`、dev `tokio` test-util），版本号改为 `4.0.25-1`；保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`。
- **`src-tauri/Cargo.lock`**（115/3 / 5/175）：`cc-switch` 条目改为 `4.0.25-1`；上游新增依赖树（rmcp 及其传输栈、process-wrap、webview2-com、windows、tokio test-util）按上游落地；终态不得出现任何 updater 相关包。收尾用 `cargo check` 复验锁文件未被改写。
- **`src-tauri/tauri.conf.json`**（1/1 / 5/11）：取上游内容，版本号改为 `4.0.25-1`；保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true` 与 fork 移除的 `trafficLightPosition` 与 `updater` 段。
- **`pnpm-lock.yaml`**（5/5 / 0/10）：接受上游 `smol-toml` 1.9.1 的 resolution 变动；fork 专属的 `@tauri-apps/plugin-updater` 三段维持为不存在；**禁止整文件取一侧**。收尾用 `pnpm install` 复验锁文件未被改写。
- **`README.md`**（0/5 / 96/544）：fork README 是整文件自有的「与上游的差别」文档；冲突按整文件保留 fork 版，上游本轮 5 行删除（DIT.ai 相关）不落地，属刻意取舍。

#### 后端（11 个）

- **`src-tauri/src/lib.rs`**（42/0 / 9/30）：上游四处 hunk 全取——`disable_windows_general_autofill` 函数（第 110 行区）、`builder = builder.plugin(windows-general-autofill)`（第 482 行区，紧接 `let mut builder = tauri::Builder::default();`）、两个 mcp 连通性命令注册（第 1660 行区）、`invoke_handler` 收尾（第 1851 行区）。fork 的无 Updater 段（该文件不得出现 `tauri_plugin_updater` / `updater_builder`）、`connectivity_test_provider_models` / `connectivity_probe_provider` 两个注册、`stream_check_provider` 删除态、托盘 builder `.show_menu_on_left_click(false)` 与 `.on_tray_icon_event(tray::handle_tray_icon_event)` 原样保留。**本文件是本轮最容易整文件取一侧的后端文件**：上游在 builder 链上新增插件块，fork 在同一条链上删掉了 updater 块。解完必须逐条 grep 取证（见「本地化状态」后的取证清单）。
- **`src-tauri/src/tray_panel.rs`**（48/18 / 10/0）：上游改 `place()` 签名与全部调用点（含测试的 `PanelTexts::from_language("en")` 实参）、`PanelPlacement` 加 `texts` 字段、删 `TrayPanelState` 并让 `tray_panel_state` 返回 `crate::tray::PanelModel`、`show_at` 传 `PanelTexts::current()`、新增 `placement_carries_the_panel_texts_in_the_shape_the_frontend_reads` 用例——全部取上游；fork 的 `panel_visible()`（10 行，插在 `panel_window` 之后、`ensure_window` 之前）必须仍在位。出现「整文件取一侧」即丢 fork 左键判定或丢上游先显示能力。
- **`src-tauri/src/settings.rs`**（66/3 / 47/0）：上游新增 `CodexQuotaProtection` 结构、`Default`、`validate()` 与设置字段接入，删 3 行旧写法；fork 的 `VisibleSidebarPanels` 结构与 `AppSettings.visible_sidebar_panels` 字段段一行不动。两段必须并存，禁止整文件取一侧。
- **`src-tauri/src/commands/misc.rs`**（222/14 / 6/5）：上游 222 行是 MCP 检测所需的登录 shell PATH / `merge_path_segments` / `CommandDeadline` 与终端改动（pwsh 优先、供应商终端不带代理与 stack 设置）；fork 只有 4 处 tunecc URL（`:82`、`:102`–`:116` 三处）与两个测试断言。逐 hunk 取上游并保留 fork 的 URL，禁止整文件取一侧；解完 `git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 必须 0 命中。
- **`src-tauri/src/commands/mod.rs`**（3/0 / 2/2）：上游新增 `#[cfg(not(target_os = "windows"))] pub(crate) use misc::{login_shell_path, merge_path_segments, CommandDeadline};`；fork 的 `mod connectivity_test;` / `pub use connectivity_test::*;` 保留、`stream_check` 维持移除。两侧声明取并集。
- **`src-tauri/src/services/mod.rs`**（2/0 / 2/1）：上游新增 `pub mod exchange_rates;` 与 `pub mod mcp_connectivity;`；fork 的 `pub mod connectivity_test;` 保留、`pub mod stream_check;` 维持删除。取并集。
- **`src-tauri/src/services/provider/mod.rs`**（9/1 / 4/0）：上游复导出 `claude_editor::{switch_drops, SwitchDrops}`、把 route 模式断言改为 `ANTHROPIC_AUTH_TOKEN` 承载占位符且 `ANTHROPIC_API_KEY` 不出现（#8111）；fork 的 4 处测试 `Provider` 字面量 `website_url_2: None` 必须仍在原位，否则 `cargo test` 编译失败。
- **`src-tauri/src/database/schema.rs`**（4/0 / 564/5）：上游只在定价种子表加 `gpt-6.1-terra`（含 3 行注释）；fork 的 `website_url_2`、v20→v25 各臂与 `create_tables` 列集不动。本轮无迁移臂变化，`SCHEMA_VERSION` 保持 25。
- **`src-tauri/src/proxy/forwarder.rs`**（21/6 / 2/1）：上游把 `replaced_images` 改名 `replaced_media`、扩大剥离范围到 file/audio、改日志文案，并接入 `codex_quota_protection::admit` / `observe_response` 与 bearer token 取值；fork 的 `parse_custom_user_agent` 注释与测试字面量 `website_url_2: None` 保留。
- **`src-tauri/src/proxy/media_sanitizer.rs`**（414/10 / 1/0）：上游本轮最大单文件改动（非文本媒体剥离的完整实现与用例）整段取上游；fork 的 1 行改动保留。
- **`src-tauri/src/proxy/providers/claude.rs`**（97/0 / 2/0）：上游新增 `claude_responses_targets_xai` 与 xAI 托管搜索 `tool_choice` 改写、`xai_oauth_forced_web_search_uses_string_tool_choice` 用例；fork 的 2 行改动保留。

#### 前端（11 个）

- **`src/types.ts`**（21/0 / 14/0）：上游新增汇率相关四个可选字段（`rateSource`、`autoExchangeRates`、`rateFetchedAt`、`rateProvider`）、`FetchedExchangeRates` 接口与 `codexQuotaProtection` 字段；fork 的 `websiteUrl2`、`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS` 类型段并存，两段都必须存在。
- **`src/components/providers/forms/ProviderForm.tsx`**（6/0 / 183/43）：上游加 Codex 子 agent 并发上限的三项 state/handler 与三项 props 接线；fork 的 Kimi 早退、跨应用导入、`extraActions`、`entriesFor`（编号先于 hidden、先于白名单）、`websiteUrl2`、连通性接线保留。
- **`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（0/21、0/11、4/36、14/64、15/53、7/26 / 各 2/0）：目录内容整份取上游（DIT.ai 条目撤出、Qwen 换 MaaS 域名、hermes/openclaw/opencode/pi 的相应改写）；fork 只保留各接口的 `hidden?: boolean` 两行；查重确认 `hidden` 只有一份。
- **`src/i18n/locales/{en,ja,zh-TW,zh}.json`**（47/11、47/11、43/7、42/6 / 330/26、317/25、317/25、329/25）：保留 fork 键段（`connectivityTest`/`connectivityCheck`、`devpanel`、供应商导入、模型快捷切换、侧栏面板、置顶置底，以及 fork 专属文案 `provider.connectivityCheck`、`settings.general.trayStyleHelp`），叠加上游本轮新增（MCP 连通性段含 `checkConnectivity`、Codex 额度保护段、汇率自动获取、Kimi 会话删除、Skills 工具栏、`whats-new`）与删除（DIT.ai 的 `dit` 赞助商文案键——上一轮实测该删除会让 fork 的 connectivity 文案提交在文件末尾停车，取上游侧即可）；合并后按对象作用域显式查重，`dup=0` 才算通过。
- **`tests/msw/tauriMocks.ts`**（2/0 / 2/0）：上游新增 `isTauri: () => false`（含注释行），fork 的 `isTauri` mock 段保留——两处都落在同一对象字面量区域，必须取并集而不是单侧。
- **`tests/components/AppsPage.test.tsx`**（26/0 / 12/6）：上游新增 26 行取上游；fork 只保留 `keeps a tool locked through version refresh and remount with an expired cache` 一条的 `waitFor` 等待顺序（§4 白名单行描述），其余用例整文件随上游，不得把 fork 的稳定化丢掉，也不得把上游新增用例丢掉。
- **`tests/components/ProviderPresetSelector.test.tsx`**（2/2 / 33/0）：上游 2 行改写取上游（可见预设断言在 `IS_FORK_BUILD=false` 下跑，fork 构建的可见性由白名单决定）；fork 的 33 行 `extraActions`/过滤用例叠加回。

#### 本地化（`tr.json`，不在重叠面）

- **`src/i18n/locales/tr.json`**（47/25 / 0/0）：fork 从未修改该文件，整文件取上游并与 `git show v4.0.25:src/i18n/locales/tr.json` 逐字节一致，不补 fork 键；土耳其语下 fork 专属文案由 `fallbackLng: "en"` 回退英文。

#### fork 自有文件（不在重叠面，仅需核对不被上游形态带偏）

- **`src/config/forkOfficialAllowlist.ts`**：零改动。上游净新增预设为 0，删除的 DIT.ai 与 Qwen 条目不在白名单任何键中，因此既不新增也不产生悬空条目；既有的 `"OpenAI API"` 三条与其它条目保持。
- **`src/config/forkPresetFilter.ts`**：判定实现不改；预设目录继续在「编号之后过滤」。
- **`src/components/providers/connectivityEntry.ts`**：`shouldShowTestEntry` 判定不变（仍只放行 claude/codex），不因上游 MCP 检测放开或改名。
- **`src-tauri/src/commands/connectivity_test.rs`**、**`src-tauri/src/services/connectivity_test/`**：不在上游本轮改动面，保持不动；上游新增的 `services/mcp_connectivity.rs` 与之并列存在，不合流、不共用模块。
- **`src/hooks/useConnectivityTest.ts`**、**`useConnectivityProbe.ts`**、**`src/lib/api/connectivity-test.ts`**、**`connectivity-check.ts`**、**`connectivityTestSettings.ts`**、**`lib/api/failover.ts`**：保持不动；`connectivity-check.ts` 内上游自带的 `invoke("stream_check_provider")` 仍是死代码（本轮上游未改该文件），不为其改写。
- **`src/utils/providerImport.ts`**、**`ProviderImportEntry.tsx`**、**`hooks/useProviderImportApply.ts`**、**`useProviderImportSources.ts`**：不在上游本轮改动面，保持不动。
- **`src/utils/providerModelUtils.ts`**、**`src/lib/providerModelIds.ts`**、**`src/components/providers/ModelQuickSwitch/`**：不在上游本轮改动面；上游新增的 `_MODEL_DESCRIPTION` 键不得进入徽章/快捷切换的读取集合。
- **`src-tauri/src/commands/stream_check.rs`**、**`src-tauri/src/database/dao/stream_check.rs`**、**`src-tauri/src/services/stream_check.rs`**：仍是孤儿文件，上游本轮未改（`git diff --name-only v4.0.24..v4.0.25 | grep -i stream_check` 为空）；继续不删除、不接线。
- **`docs/HOW_TO_REBASE_UPSTREAM.md`、`.comet/config.yaml`、`src/config/forkBuild.ts`、`src/components/devpanel/`、`tauri.{windows,dev}.conf.json`、`vite.config.ts`、`vitest.config.ts`、`.github/workflows/ci.yml`、`.github/workflows/release.yml`、`src-tauri/capabilities/default.json`、`src/lib/api/settings.ts`、`src/contexts/UpdateContext.tsx`、`src/lib/updater.ts`**：上游本轮零改动（`.github/` 下只删了 `dependabot.yml`），fork 侧整文件保留。

#### 冲突停车清单（Build 阶段实测记录）

「差异面」= 该提交重放前后 `git show --numstat` 不一致的文件（冲突解决实际落点）；未列出的提交与重放前逐字相同。预期停车面见「重放映射」；实际清单在 Build 阶段逐条记录，rerere 复用必须复核。

### fork 取舍清单

| 功能 | 上游本轮 | fork 处理 | 理由 |
| --- | --- | --- | --- |
| MCP 服务器按需连通性检测 | 新增 | 全量落地，与 fork 逐模型连通性测试并存（D14，2026-11-03 用户选择 A） | 上一轮约定「待发布后评估」；目标对象、链路与 UI 均不同，上游没有实现 fork 的逐模型测试 |
| 逐模型连通性测试与批量检测徽标 | 无 | 保留，实现与形态不改 | fork 魔改契约；不因上游出现同域功能而合并入口或改名 |
| Codex 额度提前保护 | 新增 | 全量落地；`settings.rs` 与 `types.ts` 两段并存 | fork 无该能力；默认关闭不改变既有行为 |
| 汇率自动获取 | 新增 | 全量落地 | fork 在用量与汇率文件上零语义 |
| 路由/stack 模式模型描述 | 新增 | 全量落地 | 描述写给 Claude Code/Desktop 自己的选择器；fork 徽章按精确键名读 `*_MODEL`，不受影响 |
| 托盘面板先显示后填数据 | 改写 | 全量取上游，fork `panel_visible()` 保留 | 上游本轮未触碰 `TrayIconEvent::Click`，左键契约与新行为不矛盾 |
| 浏览器请求防护（Origin/Host） | 新增 | 全量取上游 | fork 的探针在后端 reqwest 直连，不经浏览器、不带 Origin |
| 非文本媒体剥离（file/audio） | 扩展 | 全量取上游，fork 1 行保留 | fork 在该文件只有 1 行自有语义 |
| xAI 托管搜索 `tool_choice` | 修复 | 全量取上游，fork 2 行保留 | fork 未实现该转换路径 |
| route 模式占位符不进 `ANTHROPIC_API_KEY` | 修复 | 全量取上游，fork 4 处字面量保留 | fork 未实现该判定 |
| Windows 禁用 WebView2 常规自动填充 | 新增 | 全量取上游 | fork 只在该区域删过 updater 注册，解完必须确认无 updater 复活 |
| Codex 子 agent 并发上限字段 | 新增 | 全量取上游，fork 接线保留 | fork 未实现该字段 |
| Kimi 会话删除 / Skills 工具栏对齐 | 新增/改写 | 全量取上游 | fork 在会话与 Skills 文件上零语义 |
| models.dev 走后端代理感知客户端 | 修复 | 全量取上游 | fork 未改 `modelsDev.ts` |
| PowerShell 7 优先 / 终端不带代理与 stack 设置 | 修复 | 全量取上游 | fork 未实现该链路 |
| DIT.ai 预设与文案、Qwen 换域 | 删除/改写 | 目录整份取上游 | fork 白名单不含这两家，删除无悬空 |
| GPT-6.1 Terra 价格 | 新增 | 取上游 | 种子表行，与 fork 迁移臂不相交 |
| `rmcp` / `process-wrap` / `webview2-com` / `windows` / dev `tokio` / `smol-toml 1.9.1` | 新增/升级 | 取上游 | 构建依赖变动一律取上游 |
| 删除 `.github/dependabot.yml` | 删除 | 随上游删除 | fork 未改过该文件（共享文件按 §3.2） |
| schema | 未推进（上游仍 24） | fork 保持 25，不新增臂 | 本轮不撞号 |
| 模型徽章/快捷切换、双官网链接、跨应用导入、侧栏面板、托盘左键、右键置顶/置底、DevPanel、禁用更新器、fork 预设白名单 | 无 | 保留 | fork 魔改契约，上游本轮零触碰 |
| README | 0/5 | 保留 fork 整文件 | fork 文档口径 |

### 预设 id 编号契约（延续）

- 预设目录条目 `id` 一律为**原始数组下标**的字符串；白名单过滤必须发生在 `map((preset, index) => ({ id: String(index), preset }))` 之后，不得先过滤再编号。
- 本轮上游在这 6 个目录做的是删除与换域改写，会改变数组长度与下标；fork 只在渲染层过滤，`id` 仍按上游数组原位编号。fork 不新增、不删除目录条目，因此 `ProviderPresetSelector` 的可见行数断言取上游。
- DSH / omp 目录由 Pi 目录派生，编号按派生后的数组下标；DSH 账号预设 `dsh-official-account` 与 Kimi 官方账号卡是独立条目，不占目录编号，`KIMI_ALLOWED_PRESET_NAMES` 过滤只作用在目录部分。

### 本地化状态

- 4 个既有 locale 只增删上游本轮键（en/ja 各 +47/−11、zh-TW +43/−7、zh +42/−6），fork 专属键与文案原样保留；同一对象作用域不得出现同名重复键（JSON 会静默取后者、测试与 typecheck 全绿也发现不了，必须显式查重）。
- 上游删除的 `dit` 赞助商文案键必须在终态零残留；fork 的 `connectivityTest`/`connectivityCheck` 键段与被删键相邻时，重放会在文件末尾停车，按上游侧取并补回 fork 键段。
- `tr.json` 整文件取上游（上游本轮 +47/−25），逐字节与 `git show v4.0.25:src/i18n/locales/tr.json` 一致，不补 fork 键。
- MCP 连通性、Codex 额度保护、汇率自动获取、Kimi 会话删除、Skills 工具栏的新增 UI 文案全部来自上游 locale 键；fork 不新造文案，也不为两条连通性链路做命名统一。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`archive_confirmation: automatic`、`max_verify_failures: 5`。
- rebase 中途该文件会被 fork 历史提交改回旧内容：出现时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并 `git add`，不得让 Native Hook 因配置被改写而拒绝写入。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v425`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理未提交工作。
- `rerere` 可能把往轮的解法复用到新基线：复用后逐个复核，尤其版本四文件、`lib.rs`、`tray_panel.rs`、`settings.rs`、6 个预设文件、4 个 locale 与 `tests/msw/tauriMocks.ts`。
- locale JSON 合并后可能出现同名重复键：合并后必须做对象作用域查重；TS 侧的重复 `hidden?: boolean` 会报 `TS2300`，上游已有声明时 fork 追加那份会被 git 判为冗余，属正常。
- **上游新增的 `Provider` 结构体字面量必须补 `website_url_2`**：本轮的排查面不只是已知一处——`media_sanitizer.rs`（+414）、`codex_quota_protection.rs`、`mcp_connectivity/tests.rs`（381 行）、`live/project/claude.rs`（250 行改写）、`proxy/providers/claude.rs`（+97）与 `services/provider/mod.rs` 都可能出现新的 `Provider { … }`。Build 阶段必须对新落地的每个字面量做全量排查（`git grep -n 'Provider {' -- src-tauri`），不能只改已知一处；漏字段会让 `cargo check --all-targets` 报 E0063。
- **`lib.rs` 是本轮最容易整文件取一侧的后端文件**：上游在 builder 链上新增 `windows-general-autofill` 插件块（紧接 `let mut builder = ...`），而 fork 正是在 builder 链上删掉了 updater 块；上游还在 `invoke_handler` 区新增两个 mcp 注册，而 fork 在同一区把 `stream_check_provider` 换成了两个 connectivity 注册。解完必须按下面的取证清单逐项 grep。
- **`tray_panel.rs` 两侧插入点相邻**：fork 的 `panel_visible()` 与上游的 `place()`/`show_at`/命令改造在同一文件不同区域，「整文件取一侧」要么丢 fork 左键判定、要么丢上游的先显示能力；上游删除 `TrayPanelState` 后，前端 `api.ts` 的类型也必须随上游，不得保留 fork 侧旧包装。
- **`settings.rs` / `types.ts` 是「两段并存」型文件**：上游的 `CodexQuotaProtection` / 汇率类型与 fork 的 `VisibleSidebarPanels` / `websiteUrl2` 段落不同但同文件，必须逐段核对同时存在，不接受整文件取侧。
- **`tests/msw/tauriMocks.ts` 两侧都改 `isTauri` 区域**：上游新增 `isTauri: () => false` 与 fork 的 mock 段在同一对象字面量，取并集而不是单侧，否则要么上游汇率用例拿不到 false、要么 fork 的测试隔离丢失。
- **`commands/misc.rs` 上游改动面 222 行、fork 只有 tunecc URL**：逐 hunk 取上游，禁止整文件取一侧；解完跑 tunecc/farion1231 两条 grep 取证。
- **版本与锁文件禁止 `git checkout --ours`**：rebase 中 `--ours` 是上游基线，会把 fork 的 `repository = tunecc`、`codegen-units = 1`、移除的 updater 依赖一并覆盖（v4.0.20 轮实测踩中）。
- `pnpm-lock.yaml` 的 `smol-toml` 升级涉及 resolution 与 peer 条目，必须让 `pnpm install --frozen-lockfile` 复验，不接受「手工补一行」。
- **schema 本轮不撞号是结论不是默认**：若上游在 Build 期间被证实推进了 `SCHEMA_VERSION`，按「上游新版本与 fork 当前值取较大者并叠加双方迁移步骤」处理并回到 Shape 更新本节。
- **`stream_check` 孤儿边界延续**：上游本轮新增的 `mcp_connectivity` 与 `stream_check` 无关，不因此重新接线；上游自带的前端 `src/lib/api/connectivity-check.ts` 与 `src/hooks/useStreamCheck.ts` 仍可能写着 `stream_check_provider`，本轮必须重新确认没有任何组件调用它（`git grep -I -l useStreamCheck HEAD -- src tests` 只应命中该 hook 自身与 `tests/components/SwitchModePanel.test.tsx` 的 `vi.mock`）。
- 上游 `.github/workflows/*` 本轮零改动，`.github/` 下只有 `dependabot.yml` 被上游删除；fork 的 `ci.yml` 保持与上游一致的 cargo nextest 口径，`release.yml` 的 Release macOS job 继续锁 `macos-14`。
- **正式检查计划必须含 `cargo fmt --check --manifest-path src-tauri/Cargo.toml`**：fork CI 三平台都有该独立步骤，本轮上游新增 800+ 行 Rust（`media_sanitizer.rs`、`mcp_connectivity.rs`、`browser_guard.rs`、`codex_quota_protection.rs`），只要有一处超宽语句就会三平台同时红，而本地 check/test 全绿察觉不到（v4.0.22 与 v4.0.24 两轮实测栽在同一处）。
- 时间敏感用例：`SessionManagerPage` 分桶用例在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例只在 CI 并发下竞态，两者与上游逐字节相同（本轮上游给 `AppsPage.test.tsx` 又加了 26 行），单条红按既有取证顺序判定，不登记为同步丢语义。

### 版本号

- `4.0.25-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.25-1`（单个上游发布对应一个 fork tag）。

### 交付（归档后单独授权）

- 验收通过、用户接受结果并归档后，向用户单独请求授权；获准后执行：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.25-1` 并 `git push origin v4.0.25-1`。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.25-1` 核对远端指向（`gh` 命令一律带 `-R tunecc/cc-switch`，`gh api` 把仓库写进 endpoint path）；Release CI 仅 Windows x64 与 macOS arm64 unsigned，macOS job 继续使用 `macos-14` runner。若 tag push 事件零 run，按既有取证流程删远端 tag 重推同一对象补触发；若 Release 的 macOS job 约 15 分钟 cancelled 且零日志，按项目记录用 `gh run rerun --failed` 重跑。

### fork 魔改保留清单（同步后必须仍然存在且可用）

1. 产品名 CC Switch、DevPanel（`dev:fork`）与 fork 构建标记 `IS_FORK_BUILD`。
2. 侧栏面板可见性（`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS`、`GeneralSection` 开关）。
3. 模型徽章与快捷切换（`MODEL_CAPABLE_APPS` 仍为 claude/codex/gemini/grokbuild；新增的上游 `_MODEL_DESCRIPTION` 键不得进入徽章读取集合）。
4. Claude 兜底模型直达区、1M 全选与角色模型映射的「非高级」判定。
5. 供应商右键置顶/置底、新建插入第二位。
6. 官方预设白名单（`forkOfficialAllowlist` + `filterForkPresets`；本轮条目集合零改动，DIT.ai/Qwen 无悬空，第三方与赞助商预设继续隐藏）。
7. 逐模型连通性测试（`connectivity_test_provider_models`/`connectivity_probe_provider`、`shouldShowTestEntry`、批量探针徽标与页头入口）与上游 MCP 检测并存（D14）。
8. 双官网链接（`websiteUrl`/`websiteUrl2` 后端字段与前端展示；未绑号卡仍显示）。
9. 跨应用导入（`providerImport.ts`、`ProviderImportEntry`、各表单入口，仍只在支持的 `appId` 渲染）。
10. 禁用应用内更新器（无插件/依赖/权限，`install_update_and_restart` 空壳；上游本轮新增的 `windows-general-autofill` 插件块不等于 updater，必须区分）。
11. README 的 fork 说明与 fork CI（Release 仅两平台 + `macos-14` runner）。
12. 托盘左键切换主窗口与源码护栏（全平台一致）。
13. 测试稳定性修正（AppsPage 的 `waitFor`、DeepLinkImportDialog 的 `waitFor` 等）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests`）

- `forkOfficialAllowlist`：过滤函数、白名单表与各表单/测试接线均在；`claude`/`claude-desktop`/`codex` 三键仍含逐字 `"OpenAI API"`；不新增条目。
- `filterForkPresets`：过滤函数 + 预设入口/测试接线均在。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：列表仍为 claude/codex/gemini/grokbuild。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：前端设置、侧栏、类型、后端 `settings.rs`、测试均在，且与上游 `CodexQuotaProtection` 同文件并存。
- `websiteUrl2`/`website_url_2`：后端迁移/DAO/构造器、deeplink、前端双链接、上游本轮新增测试字面量（`media_sanitizer.rs`、`mcp_connectivity/tests.rs`、`codex_quota_protection.rs`、`live/project/claude.rs`、`services/provider/mod.rs`）、测试均在。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：`lib.rs` 注册、命令与服务、前端 API、hooks 均在；同时 `start_mcp_connectivity_checks`/`cancel_mcp_connectivity_checks` 两个上游注册也在位（四个注册并存）。
- `ProviderImportEntry`/`readImportableProviderFields`：组件、hooks、`providerImport.ts` 与各表单/测试均在。
- `KIMI_ALLOWED_PRESET_NAMES`：`KimiProviderForm` 中 `.map` 编号在 `.filter` 之前。
- `panel_visible` + `tray_left_click_never_opens_the_menu`：两者均在且通过；`native_menu_on_left_click` 仅可能出现在注释/护栏字符串中，函数定义与调用点为 0。
- `tauri_plugin_updater`/`updater_builder`：0 命中；`tauri-plugin-updater` 不在 `Cargo.toml`、`plugin-updater` 不在 `package.json` 与 `pnpm-lock.yaml`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳；`windows-general-autofill` 插件块存在但不得被误当作 updater 注册恢复。
- `stream_check`：后端仍只在 `database/schema.rs` 的建表/索引与孤儿文件中出现；`services/mod.rs`、`commands/mod.rs`、`lib.rs` 不声明或注册；`mcp_connectivity` 不得引入 `stream_check` 依赖。
- 上游物料：`.github/dependabot.yml` 与 `assets/partners/logos/dit-banner.png` 不存在；`git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 0 命中；locale 中 `dit` 赞助商键 0 残留。
