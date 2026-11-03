# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的已发布 annotated tag `v4.0.25`（tag 对象 `5c0cc933f3619e0a31132de2005852ca65cfb2ec`，剥离提交 `a3eafa408ae679db2e3401fca767ed2b89d9a2b2`）之上，按原顺序重放同步前 `v4.0.24..main` 的全部 195 个 fork 提交（同步前 main = `37db4bbe6`，即本地 tag `v4.0.24-2` 指向的提交），再叠加本轮同步终态与归档提交；fork 版本号 `4.0.24-1` → `4.0.25-1`；上游本轮的功能与修复全部落地，fork 全部魔改保留且可用，无丢失、无行为回归。

本轮**上游确实把一个与 fork 自有功能同域的能力发布进来了**：`b8112ca5e feat(mcp): check MCP server connectivity on demand (#8348)` 随 `v4.0.25` 正式发布，而上一轮（v4.0.24）它还在 tag 之后、按「只锁已发布 tag」被明确排除并登记「待其发布后另起 change 评估」。逐项取证结论（详见 D2）：

- 上游新增的是 **MCP 服务器**连通性检测：MCP initialize 握手，走 stdio / Streamable HTTP / legacy SSE，最多 3 并发、单服务器 30 秒超时，stdio 探针在成功/失败/取消/超时时回收整个进程树，非 Windows 复用缓存的登录 shell PATH（≤10 秒）。UI 是 MCP 页的页级「Check connectivity」+ 行菜单「Test connection」，未检测显示「Not checked」，连接配置变化后结果复位。实体是新链路 `src-tauri/src/services/mcp_connectivity.rs`（316 行 + 381 行测试）+ `commands/mcp.rs` + `src/hooks/useMcpConnectivity.ts` + `UnifiedMcpPanel.tsx`，新依赖 `rmcp 0.8.5` 与 `process-wrap 8.2`。
- fork 自有的是 **AI 供应商逐模型**连通性测试：`src-tauri/src/services/connectivity_test/` 的独立 reqwest+SSE 直连执行器（不经 proxy 转发链），UI 是供应商卡片的 `ConnectivityBadge`、`ConnectivityTestDialog`/`ConnectivityDetailDialog`、页头「批量检测」（按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控），参数持久化在 `connectivityTestSettings.ts`。
- 两者目标对象、后端链路与 UI 位置都不同，上游侧**没有任何**针对供应商/逐模型的连通性实现（上游自带的 `stream_check` 仍是 fork 已移除的粗粒度链路，本轮上游**未改动** `stream_check` 相关文件，实测 `git diff --name-only v4.0.24..v4.0.25 | grep -i stream_check` 为空）。因此上游这次**不是**「重写 fork 已有的功能」，而是新增一个 fork 没有的能力；但两条链路同名同域、且都落在 `lib.rs` 的 `invoke_handler` 注册区（上一轮实测的静默失效点）。已按用户要求提出取舍，**2026-11-03 用户选择「两者都保留」**（D14）：上游 MCP 检测整条落地，fork 的供应商逐模型测试与批量检测徽标原样保留，只在注册区做并集。

其余重叠面核查（均不构成功能二选一）：`src-tauri/src/tray.rs` 与 `TrayIconEvent::Click` 本轮上游零改动（fork 左键契约无碰撞）；`tray_panel.rs` 上游只改 `place()` 签名与 `tray_panel_state` 返回形态，不触碰 fork 的 `panel_visible()`；上游给路由/stack 模式新增 `ANTHROPIC_DEFAULT_*_MODEL_DESCRIPTION` 描述键，fork 的模型徽章与快捷切换按精确键名读 `*_MODEL`，不受新兄弟键影响；上游本轮**净新增预设为 0**（只有 DIT.ai 赞助商预设与 `dit` 文案删除、Qwen 换 MaaS 域名），因此不产生上一轮 D5 那种白名单收录决定。

# Scope

- **同步区间**：`v4.0.24..v4.0.25` 共 31 个提交、130 个文件、+8570/−1189（16 新增 / 2 删除 / 112 修改）。fork 侧自 `v4.0.24` 起自有改动：含文档产物 485 文件、+63590/−2801，代码面（`src`、`src-tauri`、`tests`、`.github`、`package.json`、`pnpm-lock.yaml`、两个 vite/vitest 配置、`README.md`）148 文件、+15926/−2801。**重叠面 32 个文件**（实测 `comm -12 <(git diff --name-only v4.0.24 v4.0.25|sort) <(git diff --name-only v4.0.24 main|sort)`，已排除 `docs/comet/`、`.comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`）。32 个重叠文件**全部**有 fork 语义（`git diff --quiet v4.0.24 HEAD -- <file>` 无一为空）。
- **上游本轮新增功能**：① MCP 按需连通性检测（#8348，含 #9149 的取消释放与共享探测上限、`fb241637b` 的登录 PATH fixture）；② Codex 额度提前保护（#8395，新 `proxy/codex_quota_protection.rs`、`settings/CodexQuotaProtectionSettings.tsx`、后端 `settings.rs` 的 `CodexQuotaProtection`，默认关闭）；③ 汇率自动获取（#8716，新 `services/exchange_rates.rs` + `hooks/useAutoExchangeRates.ts`）；④ Claude Code / Claude Desktop 路由与 stack 模式模型行描述为「<provider> · <upstream model> · <窗口>」（`2e2a59cc4`、`9267ec8b1`）；⑤ Codex 供应商表单子 agent 并发上限字段（#9056）；⑥ 托盘面板不等数据先显示（#9154）；⑦ Kimi 会话删除（#9157）；⑧ Skills 发现页工具栏对齐已安装页（#9125）；⑨ 本地路由浏览器请求防护（新 `proxy/browser_guard.rs`）；⑩ 内置价格表加 GPT-6.1 Terra。
- **上游本轮修复**：Codex 请求模型别名去重（#7643）、`smol-toml` 升到 1.9.1、取消的连通性检测释放并共享探测上限（#9149）、xAI 强制 web search 时发受支持的 `tool_choice`（#8664）、Pi 官方子 agent 用量导入（#8386）、Pi MCP 同步评审跟进（#7888）、minimax M3.1-Flash 原生思考档位声明（#8540）、Windows 供应商表单值闪烁（#6420）、纯文本上游剥离非文本媒体（#6274）、models.dev 经后端代理感知客户端拉取（#8739）、Windows 终端优先 PowerShell 7（#8992）、route 模式占位符不写进 `ANTHROPIC_API_KEY`（#8111）、供应商终端不携带代理与 stack 设置（`3071cae90`）、forced-v2 警告随 classic tools 关闭隐藏（`f332b472f`）。
- **上游本轮删除**：`.github/dependabot.yml`（`9119decac`）与 `assets/partners/logos/dit-banner.png`（DIT.ai 物料）；fork 对 `dependabot.yml` 无自有改动（不在重叠面内），随上游删除。
- **数据库**：上游 `src-tauri/src/database/mod.rs` 与 `SCHEMA_VERSION` 本轮零改动（`v4.0.24` 与 `v4.0.25` 均为 24），fork 保持 25，**本轮无迁移链合并、无新臂**；`database/schema.rs` 上游只新增 4 行 GPT-6.1 Terra 价格种子。
- **版本与依赖**：`package.json` 把 `smol-toml` 从 `^1.4.2` 升到 `^1.9.1`（`pnpm-lock.yaml` 随之变动）；`src-tauri/Cargo.toml` 新增运行时依赖 `rmcp = 0.8.5`（features：client、transport-async-rw、transport-sse-client-reqwest、transport-streamable-http-client-reqwest）、`process-wrap = 8.2`（tokio1），Windows target 新增 `webview2-com = 0.38` 与 `windows = 0.61`，dev-dependencies 新增 `tokio = { version = "1", features = ["test-util"] }`；四处版本文件（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`）终态统一 `4.0.25-1`。
- **本地化**：`en.json` 与 `ja.json` 各 +47/−11，`tr.json` +47/−25，`zh-TW.json` +43/−7，`zh.json` +42/−6；上游新增集中在 `mcp` 连通性段（含 `checkConnectivity`）、Codex 额度保护段、汇率自动获取、Kimi 会话删除、Skills 工具栏与 `whats-new`；上游删除赞助商文案键 `dit`（上一轮实测：重放 fork 的 connectivity 文案提交时四个 locale 会因此在末尾停车，取上游侧即可）。fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`（本轮上游未改这两键）。
- **上游新增测试**：`tests/hooks/useMcpConnectivity.test.tsx`（231 行）、`useAutoExchangeRates.test.tsx`（103）、`tests/components/CodexQuotaProtectionSettings.test.tsx`（224）、`UsageDisplaySection.test.tsx`（+207）、`TrayPanel.test.tsx`（+211）、`UnifiedMcpPanel.test.tsx`（+94）、`CodexFormFields.subagent.test.tsx`（38）、`tests/utils/errorUtils.test.ts`（27）、`tests/utils/providerConfigUtils.codex.test.ts`（78）、`tests/components/usageFormat.test.ts`（94）、`src-tauri/tests/fixtures/mcp_connectivity_server.rs`（67）与 `services/mcp_connectivity/tests.rs`（381）。
- **fork 侧文档**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果修订并新增 §4.11（v4.0.25 轮要点）；`docs/comet/specs/upstream-sync/spec.md` 归档时整体重写为本轮终态。
- **交付**：推送 `main` 与 annotated tag `v4.0.25-1` 只在验收通过、用户接受并归档之后执行，属 Archive 阶段的单独授权（本轮 Shape 只确认「沿用历轮方式」，不构成远端写授权）。

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v425/`（Runtime 已创建）：`brief.md` 与 `specs/upstream-sync/spec.md`；本轮创建 change 时未带 `--capability`/`--task`，按上一轮 D11 的决定不建立能力关联，因此不产生 `capability-association.yaml` 与 `delta.yaml`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v425/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v425`（= 同步前 main `37db4bbe6`，同时是 origin/main），仅用于回退参照与重放前后 diff 对照，不推送。
- 随上游 rebase 落地的上游新增文件 16 个：3 个 `docs/release-notes/v4.0.25-{en,zh,ja}.md`；后端 `src-tauri/src/proxy/{browser_guard,codex_quota_protection}.rs`、`src-tauri/src/services/exchange_rates.rs`、`src-tauri/src/services/mcp_connectivity.rs`（含 `mcp_connectivity/tests.rs`）、`src-tauri/tests/fixtures/mcp_connectivity_server.rs`；前端 `src/components/settings/CodexQuotaProtectionSettings.tsx`、`src/hooks/useAutoExchangeRates.ts`、`src/hooks/useMcpConnectivity.ts`、`src/whats-new/4.0.25.json`；测试 `tests/components/CodexQuotaProtectionSettings.test.tsx`、`tests/hooks/useAutoExchangeRates.test.tsx`、`tests/hooks/useMcpConnectivity.test.tsx`。
- 交付步骤（验收通过并归档、且用户另行授权后）新增本地 annotated tag `v4.0.25-1`。

### 修改

- 32 个上游/fork 重叠文件（逐文件叠加要求在完整目标规格「冲突解决」中展开）：
  - 版本与物料 5 个：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`pnpm-lock.yaml`。
  - 后端 11 个：`src-tauri/src/lib.rs`（上游 +42/−0）、`src-tauri/src/tray_panel.rs`（+48/−18）、`src-tauri/src/settings.rs`（+66/−3）、`src-tauri/src/commands/misc.rs`（+222/−14）、`src-tauri/src/commands/mod.rs`（+3/−0）、`src-tauri/src/services/mod.rs`（+2/−0）、`src-tauri/src/services/provider/mod.rs`（+9/−1）、`src-tauri/src/database/schema.rs`（+4/−0）、`src-tauri/src/proxy/forwarder.rs`（+21/−6）、`src-tauri/src/proxy/media_sanitizer.rs`（+414/−10）、`src-tauri/src/proxy/providers/claude.rs`（+97/−0）。
  - 前端 11 个：`src/components/providers/forms/ProviderForm.tsx`（+6/−0）、`src/types.ts`（+21/−0）、6 个 `src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`（上游本轮只删 DIT.ai 条目与换域，无净新增）、4 个 `src/i18n/locales/{en,ja,zh,zh-TW}.json`。
  - 测试与文档 5 个：`tests/components/AppsPage.test.tsx`（上游 +26/−0）、`tests/components/ProviderPresetSelector.test.tsx`、`tests/msw/tauriMocks.ts`、`README.md`（fork 重写版整文件保留）、`.github/dependabot.yml`（随上游删除）。
- 本轮不新增 fork 专属代码文件；`src/config/forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 不改（上游净新增预设为 0，无收录决定）。

### 删除

- 随上游删除 2 个文件：`.github/dependabot.yml`（上游 `9119decac` 移除 Dependabot 版本更新配置；fork 未改过该文件）与 `assets/partners/logos/dit-banner.png`（DIT.ai 赞助商物料）。
- 只随上游删除代码片段与 locale 键：DIT.ai 预设条目与 `dit` 赞助商文案键（5 个 locale）、`en`/`ja` 各 11 行与 `zh`/`zh-TW`/`tr` 的收尾改写。fork 已删除的 updater 链路与 `stream_check` 可达链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v425` 是安全参照分支，不是工作区）。
- 不新增数据库迁移臂、不改 `SCHEMA_VERSION`（fork 保持 25，上游本轮仍为 24，不撞号）。
- 不重新接线 `stream_check`（含上游本轮新增的 `mcp_connectivity` 也不接进 `stream_check`）、不恢复应用内更新器（`tauri-plugin-updater` / `@tauri-apps/plugin-updater` 保持移除态）。
- 不改 `forkPresetFilter.ts` 判定实现；不新增任何 fork 白名单条目。
- 不引入 `upstream/main` 上 tag 之后的提交（当前只有 `7afceec14 ci(release): retry xcrun stapler when CloudKit drops the connection`）。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。

# Non-goals

- 不改动 fork 自有连通性测试的实现与形态（D14 已确认两条链路并存，不做功能级替换）；不改 fork 的托盘左键契约、模型徽章/快捷切换、双官网链接、侧栏面板可见性、跨应用导入、右键置顶/置底、DevPanel 与 fork 构建标识。
- 不改 fork CI 的裁剪策略（构建哪些平台、tag 守卫条件、Release 的 macOS runner 保持 `macos-14`，按项目记录不跟上游再动）；`.github/workflows/ci.yml` 与 `release.yml` 本轮上游零改动。
- 不为上游新增的第三方/赞助商预设放开可见性（本轮上游净新增预设为 0），也不为「消除上游字样」改写 fork 已移除链路。
- 不做本轮之外的功能开发、重构或依赖升级；`Cargo.toml`/`package.json` 的依赖新增只取上游本轮实际改动。
- 不在 Shape/Verify 阶段执行任何远端写操作（push、tag、PR、Release 触发）。

# Acceptance examples

- 同步基线与重放完整性可核对：`git merge-base main v4.0.25^{}` 为 `a3eafa408`（即 fork 提交全部落在 `v4.0.25` 之上），`git rev-list --count v4.0.25..HEAD` 等于同步前 195 个 fork 提交中实际重放的数量加本轮新增提交，重放主题序列与 `pre-sync-v425` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。
- fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键切换与源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。
- 上游 MCP 按需连通性检测与 fork 的供应商逐模型连通性测试按 D14（两者并存）同时生效且互不干扰：上游侧 `services/mcp_connectivity.rs`（含 `tests.rs`）、`commands/mcp.rs` 两个命令、`useMcpConnectivity.ts`、`UnifiedMcpPanel.tsx` 接线与 `mcp_connectivity_server.rs` fixture、`tests/hooks/useMcpConnectivity.test.tsx`、`tests/components/UnifiedMcpPanel.test.tsx` 用例齐备；`lib.rs` 的 `invoke_handler` 同时含上游的 `start/cancel_mcp_connectivity_checks` 与 fork 的 `connectivity_test_provider_models`/`connectivity_probe_provider` 四个注册，且 `stream_check_provider` 保持 0 命中；两条链路的 locale 键段（上游 `mcp` 段与 fork `connectivityTest`/`provider.connectivityCheck`）互不覆盖。
- Codex 额度提前保护与汇率自动获取两条新链路完整落地：`proxy/codex_quota_protection.rs`、`settings.rs` 的 `CodexQuotaProtection`（默认 `enabled: false`、阈值 95/98、1..=99 校验）、`CodexQuotaProtectionSettings.tsx` 与上游用例，以及 `services/exchange_rates.rs`、`useAutoExchangeRates.ts`、`tests/hooks/useAutoExchangeRates.test.tsx` 与 `tests/msw/handlers.ts` 接线全部生效；fork 的 `settings.rs` `VisibleSidebarPanels` 字段段与上游新增并存。
- 托盘新行为与 fork 左键契约共存：上游 `tray_panel.rs` 的 `place()` 新增 `texts` 参数、`PanelPlacement.texts` 与 `tray_panel_state` 只返回 `PanelModel` 的改造取上游，`src/tray-panel/TrayPanel.tsx` 与 `api.ts` 整文件随上游；fork 的 `panel_visible()` 插入仍在位，`TrayIconEvent::Click` 四分支、`set_show_menu_on_left_click(false)` 与 `tray_left_click_never_opens_the_menu` 护栏不变（本轮上游未触碰点击处理），`tests/components/TrayPanel.test.tsx` 上游新增用例与既有全量用例通过。
- 路由/stack 模式模型描述新键与 fork 模型徽章共存：`live/project/claude.rs`、`mode/{contract,controller,stack}.rs`、`claude_desktop_config.rs` 写出的 `ANTHROPIC_DEFAULT_*_MODEL_DESCRIPTION` 与 `stack::provider_model_description` 落地，`src/utils/providerModelUtils.ts` 仍按精确键名读 `*_MODEL` 而不把描述键当模型字段，fork 快捷切换改写档位后上游描述随 live 配置重写刷新（不残留过期 provider 名）。
- 浏览器请求防护不影响 fork 链路：`proxy/browser_guard.rs` + `proxy/server.rs` 的 Origin/Host 校验取上游后，fork 的连通性测试（后端 reqwest+SSE 直连、不经浏览器、不带 Origin）与 DevPanel 仍工作，`pnpm test:unit` 与后端测试无因该防护新增的失败。
- 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v425` 相同（本轮不新增臂），`schema.rs` 的 GPT-6.1 Terra 价格种子落地，`database/{schema,tests}.rs` 全部用例通过且上游用例断言不含 `24`。
- 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、改写按上游、DIT.ai 的 `dit` 文案键零残留，fork 键段与 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 保留；`tr.json` 与 `v4.0.25` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。
- 后端在 fork 结构下编译通过：上游新增的 `Provider` 结构体字面量（含 `media_sanitizer.rs`、`codex_quota_protection.rs`、`mcp_connectivity` 测试等本轮新增处）补齐 fork 的 `website_url_2` 字段后，`cargo check --all-targets` 与 `cargo nextest run` 零失败、无新增未使用告警，且 `cargo fmt --check` 通过。
- 版本与锁文件终态一致：四处版本号均为 `4.0.25-1`，`git diff --numstat pre-sync-v425 HEAD` 对四个文件符合本轮口径；`Cargo.lock` 不出现任何 `tauri-plugin-updater` 条目且含上游新增的 `rmcp`、`process-wrap`、`webview2-com`、`windows` 与 dev `tokio` test-util 依赖树，`pnpm-lock.yaml` 反映 `smol-toml` 1.9.1 而 fork 移除的 `@tauri-apps/plugin-updater` 三段仍不存在，`pnpm install` 与 `cargo check` 均报告锁文件未被改写。
- 上游物料删除与 fork 保留面一致：`.github/dependabot.yml` 与 `assets/partners/logos/dit-banner.png` 随上游不存在；`git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 仍 0 命中（fork 的 4 处 tunecc URL 与两个测试断言保留）；`.github/workflows/{ci,release}.yml` 保持 fork 裁剪版且 Release 的 macOS runner 仍为 `macos-14`。
- 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.11 反映本轮实测结论。
- 落地保真核对（四 ref 行多重集口径）：在最终态提交之后，用 `v4.0.25` / `main(=pre-sync-v425)` / `HEAD` 与上游基线四个 ref 计算行多重集差集，130 个上游文件与 fork 侧 148 个代码文件全部参与，非重叠的 98 个上游文件在 fork 侧缺失为 0，重叠 32 文件的两侧缺失行逐行归因并带重数，归因只允许「刻意取舍（版本行 / fork 专属文案 / D14 与依赖决定 / 白名单条目）」一类，出现无法归类的缺失行即判定失败。

# Constraints and invariants

- 只锁已发布 annotated tag：同步目标必须是 `v4.0.25^{}` 剥离出的提交（`a3eafa408`），不得拿 tag 对象 sha（`5c0cc933f`）当提交 sha 做 merge-base 核对；`upstream/main` 上 tag 之后的提交（`7afceec14`）不纳入。
- 冲突解决遵循 `docs/HOW_TO_REBASE_UPSTREAM.md` §3：fork 专属文件保留 fork 侧（rebase 中为 `--theirs`），共享文件取上游（`--ours`）后再叠加 fork 语义；版本与锁文件禁止 `git checkout --ours` 整体取侧（`--ours` 是上游，会清掉 fork 字段，v4.0.20 轮已实测踩中）。
- `.comet/config.yaml` 是 fork 专属文件且会被重放的历史提交改回旧内容，rebase 中途必须显式恢复并纳入提交，否则 Native Hook 会拒绝写入。
- 预设条目 id 数字必须等于原始数组下标：编号 → 过滤上游 `hidden` → 过滤 fork 白名单的顺序不得改变（v4.0.12 起契约）。
- fork 的 `Provider` 结构含 `website_url_2`，上游新增的任何 `Provider { … }` 字面量（含测试 helper，本轮高危处是 `media_sanitizer.rs`、`codex_quota_protection.rs`、`mcp_connectivity/tests.rs`）必须补该字段，否则 `cargo check --all-targets` 失败。
- fork 移除链路不得复活：`tauri_plugin_updater` / `@tauri-apps/plugin-updater` / `install_update_and_restart` 实现 / `stream_check` 模块声明与命令注册 / `cleanup_old_stream_check_logs`。
- `lib.rs` 的 `invoke_handler` 与 `commands/mod.rs`、`services/mod.rs` 的模块声明是静默失效高危点：上游本轮在同一区域新增 `start/cancel_mcp_connectivity_checks` 与 `pub mod mcp_connectivity;`，取上游时不得吃掉 fork 的两个 connectivity 注册与 `mod connectivity_test;`，也不得带回 `stream_check`。
- `tr.json` 与上游 tag 逐字节一致、不补 fork 键；4 个既有 locale 合并后必须按对象作用域显式查重（`object_pairs_hook` 类），`JSON.parse` 静默取最后一个键、测试全绿也不能作为无重复的证据。
- 落地保真复算必须在最终态提交之后进行，差异行必须带重数与文件归属；修复类提交会改变保真数字，规格与文档中的数字须随修复刷新。
- 正式检查计划必须包含 `cargo fmt --check --manifest-path src-tauri/Cargo.toml`（fork CI 三平台都有该步，本地 check/test 察觉不到超宽语句）。
- 时间敏感用例的既有 flaky 边界（`SessionManagerPage` 分桶在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例在 CI 并发下竞态）按「与上游逐字节比对 + 本地重复跑」判定，不登记为同步丢语义；`tests/components/AppsPage.test.tsx` 只重新套用 fork 的那一条等待顺序用例，其余取上游。
- 归档、merge、push、PR 与工作区清理各自需要的授权互不代替；本轮工作区为 `current`，归档不需要收尾方式选择。

# Decisions

- **D1｜基线、区间与工作区**：同步基线锁定 annotated tag `v4.0.25`（tag 对象 `5c0cc933f…`，剥离提交 `a3eafa408…`），单发布跨度（31 提交 / 130 文件），fork 版本号 `4.0.24-1` → `4.0.25-1`；不纳入 `upstream/main` 的 tag 后提交 `7afceec14`。工作区用 `current`，沿用 main 与当前目录（本轮开始时工作区干净、无其他 active Native change、用户未要求并行，与 v4.0.12 至 v4.0.24 历轮一致）；`pre-sync-v425` 只作回退参照分支，不是工作区。
- **D2｜上游是否重写 fork 功能：本轮有一处同域新增，已由用户决定为并存（D14）**。按项目既有三步口径取证：①`git diff v4.0.24 v4.0.25` 逐文件与 fork 侧形态比对；②只有 fork 在该文件零语义（`git diff --quiet v4.0.24 HEAD -- <file>` 为空）才自动取上游——实测 32 个重叠文件**全部**有 fork 语义，但其中绝大多数只是版本号、`website_url_2` 字面量或 fork 键段，不构成行为碰撞；③真正的功能级相邻只有一处：上游 `#8348` 的 MCP 服务器连通性检测与 fork 自有的供应商逐模型连通性测试同属「连通性检测」域，且上一轮明确约定「待其发布后另起 change 评估」，它在 `v4.0.25` 发布，故本轮提出并交用户选择。逐项比对结论：目标对象（MCP 服务器 vs AI 供应商模型）、执行链路（MCP initialize 握手 vs 独立 reqwest+SSE 直连）、UI 位置（MCP 页 vs 供应商卡与页头批量检测）三者均不同，上游没有实现 fork 的逐模型测试，fork 也没有 MCP 检测；剩余风险只在 `lib.rs`/`commands/mod.rs`/`services/mod.rs` 的注册区叠加，属机械合并。
- **D3｜上游其余新功能与 fork 的关系：不构成二选一，全部取上游**。`0b274ec3e`/`c17de413e`（用量与汇率）、`aa42a93d5`（Codex 额度保护）、`a9e607c39`（子 agent 并发上限）、`4cf15aeac`（Kimi 会话删除）、`42f7d0e01`（Skills 工具栏）、`f8f487b1d`（托盘先显示后填数据）、`e6d0bf61a`（浏览器请求防护）、`4a0baf691`（非文本媒体剥离）、`f02528179`（GPT-6.1 Terra 价格）、`2e2a59cc4`/`9267ec8b1`（路由模型描述）在 fork 侧均无对应自有实现：实测 `src/components/mcp/UnifiedMcpPanel.tsx`、`src/tray-panel/TrayPanel.tsx`、`src/utils/providerConfigUtils.ts`、用量/会话/Skills 相关文件 fork 语义为零（`git diff --quiet v4.0.24 HEAD -- <file>`），整文件随上游。
- **D4｜托盘链路**：上游 `tray_panel.rs` 的 `place()` 加 `texts` 参数、`PanelPlacement.texts` 新字段、`tray_panel_state` 去掉 `TrayPanelState` 包装只返回 `PanelModel`，以及 `TrayPanel.tsx`/`api.ts` 的「先显示后填」全部取上游；fork 的 `panel_visible()`（10 行插入）保留。实测本轮上游 `src-tauri/src/tray.rs` 的 `TrayIconEvent::Click` 零改动，因此不存在 v4.0.17 / v4.0.22 那种点击分支级碰撞；fork 的左键「切换主窗口、永不弹菜单」四分支、`set_show_menu_on_left_click(false)` 与源码护栏 `tray_left_click_never_opens_the_menu` 保持不变，上游 `native_menu_on_left_click` 保持删除态。
- **D5｜schema：不撞号、不新增臂**：上游 `database/mod.rs` 本轮零改动，`SCHEMA_VERSION` 仍为 24（`v4.0.24` 与 `v4.0.25` 相同），fork 保持 25；本轮没有迁移链合并，`schema.rs` 只取上游新增的 GPT-6.1 Terra 价格种子（+4/−0）。上游新增的 `Provider` 结构体字面量必须补 fork 的 `website_url_2`，否则 `cargo check --all-targets` 编译失败。
- **D6｜预设与白名单：本轮无收录决定**：上游本轮在 `src/config/` 的净新增预设为 0（`git diff v4.0.24..v4.0.25 -- src/config/ | grep '^\+ *name:'` 为空），只有 DIT.ai 赞助商预设与 `dit` 文案删除、Qwen 按量付费/Token Plan 换 MaaS 域名；`forkOfficialAllowlist.ts` 的条目集合不含 DIT.ai 与 Qwen，因此不产生上一轮 D5 那种「是否收录新第一方官方预设」的决定。白名单与 `forkPresetFilter.ts` 判定实现不改。
- **D7｜上游删除的物料随上游删除**：`.github/dependabot.yml`（fork 未改过该文件，属共享文件按 §3.2 取上游）与 `assets/partners/logos/dit-banner.png` 随上游移除；`.github/workflows/{ci,release}.yml` 本轮上游零改动，fork 裁剪版原样保留，Release 的 macOS runner 继续锁 `macos-14`（项目记录：`macos-15` 标签在本仓库两次约 15 分钟 cancelled、`runner: null`、零日志，上游再动 runner 标签时不跟改）。
- **D8｜`lib.rs`/`commands/mod.rs`/`services/mod.rs` 注册区叠加**：模块声明与命令注册取并集——上游新增 `pub mod mcp_connectivity;`、`commands::start_mcp_connectivity_checks` / `cancel_mcp_connectivity_checks`（以及 `#8348` 的 `#[cfg(test)]` 声明）全部落地；fork 的 `mod connectivity_test;`、两个 connectivity 注册、无 Updater 插件注册、托盘左键语义与 `stream_check` 移除原样保留；解完必须 `git grep -I -n 'tauri_plugin_updater\|stream_check_provider' HEAD -- src-tauri/src/lib.rs` 为 0 命中，并确认四个注册（上游 2 + fork 2）同时在位。
- **D9｜依赖与锁文件**：`Cargo.toml` 的 `rmcp`、`process-wrap`、Windows target 的 `webview2-com`/`windows`、dev-dependencies 的 `tokio` test-util，以及 `package.json` 的 `smol-toml ^1.9.1` 一律取上游；四处版本改 `4.0.25-1`；`Cargo.lock` 只允许 `cc-switch` 版本行与上游新依赖树，`pnpm-lock.yaml` 只取上游依赖变动、fork 移除的 `@tauri-apps/plugin-updater` 三段不得被带回；收尾用 `pnpm install` 与 `cargo check` 复验两者都报告锁文件未被改写。
- **D10｜本地化**：5 个 locale 的上游新增（`mcp` 连通性段、Codex 额度保护段、汇率自动获取、Kimi 会话删除、Skills 工具栏、`whats-new`）与改写逐字取上游，上游删除的 `dit` 赞助商文案键零残留；fork 专属覆盖 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 保留（上游本轮未改这两键）；`tr.json`（+47/−25）整文件取上游、与 tag 逐字节一致、不补 fork 键；合并后 5 个文件按对象作用域查重 `dup=0`。
- **D11｜`AppsPage.test.tsx` 与 `ProviderPresetSelector.test.tsx`**：`AppsPage.test.tsx` 上游 +26 行（`#8348` 带来）其余用例取上游，只有 `keeps a tool locked through version refresh and remount with an expired cache` 按 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 那一行重新套用 fork 的等待顺序，不整文件取上游；`ProviderPresetSelector.test.tsx` 的上游断言数字取上游（该用例在 `IS_FORK_BUILD=false` 下跑），fork 的 `extraActions`/过滤用例叠加回。
- **D12｜`commands/misc.rs` 的 fork URL**：上游本轮 +222/−14（`#8348` 的 misc 接线、PowerShell 7 择优等）整段取上游；fork 的 `check_for_updates` / `portable_zip_url` 4 处 tunecc URL 与两个测试断言保持，解完 `git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 必须 0 命中。
- **D13｜文档与交付授权延后**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 表按本轮结果增改共享文件行并追加 §4.11「v4.0.25 轮的叠加要点」，归档时把 `docs/comet/specs/upstream-sync/spec.md` 整体重写为 v4.0.25 完整状态；本轮不改 `docs/comet/specs/database-schema-migrations/spec.md`（schema 仍为 25、无新臂），除非实测出现例外。Build/Verify 不推送、不打 tag；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.25-1` 的推送。只授权这两项远端动作，不创建 PR。
- **D14｜连通性两条链路并存**（2026-11-03 用户选择 A「两者都保留」）。上游 `#8348` 的 MCP 服务器按需连通性检测整条按上游落地：`src-tauri/src/services/mcp_connectivity.rs`（含 `tests.rs`）、`commands/mcp.rs` 的 `start/cancel_mcp_connectivity_checks`、`commands/misc.rs` 接线、`services/mod.rs` 的 `pub mod mcp_connectivity;`、`lib.rs` 两个命令注册、`src/hooks/useMcpConnectivity.ts`、`src/lib/api/mcp.ts`、`UnifiedMcpPanel.tsx`（fork 在该文件零语义，整文件随上游）、`src-tauri/tests/fixtures/mcp_connectivity_server.rs`、`Cargo.toml` 的 `rmcp`/`process-wrap` 依赖、5 个 locale 的 `mcp` 新增段与上游新增测试；#9149 的取消释放与共享探测上限、`fb241637b` 的登录 PATH wrapper fixture 同时取上游。fork 自有的供应商逐模型连通性测试（`services/connectivity_test/`、`commands/connectivity_test.rs`、两个命令注册、`ConnectivityTestDialog`/`ConnectivityDetailDialog`/`ConnectivityBadge`、`useConnectivityTest`/`useConnectivityProbe`、`connectivityTestSettings.ts` 与 `connectivityTest`/`provider.connectivityCheck` 键段）实现与形态完全不改、不合并、不删除。两条链路只在 `lib.rs`/`commands/mod.rs`/`services/mod.rs` 的注册区相邻，按 D8 取并集；不做任何「统一命名/统一入口」的额外改造。

# Open questions

已完成的核实与决定（用户提出的「上游若重复实现 fork 功能则分析并询问」）：本轮唯一同域的上游新增是随 `v4.0.25` 正式发布的 MCP 服务器按需连通性检测（#8348，上一轮还排在 tag 之后、明确约定待其发布后评估）。实测与 fork 自有的供应商逐模型连通性测试在目标对象、后端链路与 UI 位置上均不同，上游并未实现 fork 的逐模型测试。2026-11-03 用户选择「两者都保留」，结论记入 D14，没有剩余的未决项。

# Verification expectations

- 定向检查（Build 期）：`cargo check --all-targets`、`cargo fmt --check`、按受影响模块 `cargo nextest run`、`pnpm typecheck`、`pnpm test:unit` 的定向子集、locale 重复键显式查重脚本、`git grep -I` 保留清单与移除清单取证。
- 正式检查计划（Verify 期，随 Builder 交接提交给 Runtime 执行）：
  1. `pnpm install --frozen-lockfile` 与 `pnpm typecheck`（锁文件与类型一致性）；
  2. `pnpm test:unit`（前端全量单测，含上游新增 `useMcpConnectivity`、`useAutoExchangeRates`、`CodexQuotaProtectionSettings`、`TrayPanel`、`UnifiedMcpPanel` 用例与 fork 用例）；
  3. `cargo check --all-targets --manifest-path src-tauri/Cargo.toml`（含 `website_url_2` 字面量与未使用告警）；
  4. `cargo fmt --check --manifest-path src-tauri/Cargo.toml`（fork CI 三平台独立步骤）；
  5. `cargo nextest run --manifest-path src-tauri/Cargo.toml`（后端全量，含 `tray_left_click_never_opens_the_menu`、schema 用例、上游新增 `mcp_connectivity::tests` 与 `services/mcp_connectivity` fixture）；
  6. locale 查重与逐字节核对脚本（4 个既有 locale `dup=0`、`tr.json` 与 tag 一致、上游新增键齐备、`dit` 键零残留）；
  7. fork 保留清单与移除清单的 `git grep` 取证脚本（updater / `stream_check` 零命中，四个连通性相关命令注册与 fork 链路、白名单在位）；
  8. 版本四文件与两个锁文件的 `git diff --numstat pre-sync-v425 HEAD` 核对；
  9. 四 ref 落地保真复算脚本（在最终态提交之后运行，输出逐行归因清单）。
- 已知不可靠信号：管道后的退出码、后台任务通知文本、未 grep 验证的符号名不得作为通过证据；时间敏感用例（`SessionManagerPage` 分桶、`AppsPage` 过期缓存竞态）出现单条红时先按上游同用例比对与本地重跑判定，不得直接记为通过。
- Verifier 需独立判断全部验收项，不只复跑命令；与当前候选实现匹配的成功检查记录可复用，失败/阻塞/未执行/超时不得算通过。
