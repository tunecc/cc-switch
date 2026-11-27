# 完整目标规格：upstream-sync（v4.0.43 轮）

> 本文件描述 `sync-upstream-v441-v443` 完成后的 upstream-sync 完整状态。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮完整状态保存在 `docs/comet/archive/2026-11-26-sync-upstream-v440/`。

## 概述

fork `tunecc/cc-switch` 保持可干净 rebase 到上游已发布版本之上的同步状态。本轮将 main 从 `v4.0.40` 推进到 `v4.0.43`，peeled 基线为 `754fed72d428c66c1e6ed45f38601ac25ded90c6`（annotated tag 对象 `2119227f82a296e5664d063d9ae598a9fe92b73f`），fork 版本从 `4.0.40-1` 更新为 `4.0.43-1`。

同步前 `v4.0.40..main` 的 233 个 fork 提交按原顺序重放，不 cherry-pick、不 merge；上游 62 个提交、372 个文件（+34,618/−6,857）的变更全部落地，但 fork 已明确关闭的 updater、stream_check、release 裁剪域不恢复。同步后保留 fork 全部自有功能与用户可见行为。

## Git 与重放终态

- main 的 merge-base 与 `v4.0.43^{}` 精确等于 `754fed72d`。
- `v4.0.43..main` 只包含重放后的 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 提交与本轮终态提交。
- 安全参照 `pre-sync-v441-v443` 指向同步前 `e4d607a1827ca639869fe781a32da74af19c120b`，仅本地保存，不推送。
- 233 个同步前提交的主题序列与 pre-sync 一致；被 Git 判空丢弃的提交逐个登记；patch-id 差异只允许归类为冲突停车、仅上下文位移或被上游同名实现消化。
- `.comet/config.yaml` 在 rebase 中途若被历史提交改回旧内容，从 `ORIG_HEAD` 恢复并纳入提交；终态与同步前一致。
- 只锁已发布 tag，不纳入 `v4.0.43` 后 `upstream/main` 的 2 个提交（`d26be6ecb` ZCode 应用支持、`1963028ee` Codex 工具 schema 兼容）；fetch 不 prune tag。

## 上游能力与修复终态

以下能力保持上游实现位置、数据模型与 UI 入口，不额外复制一套 fork 版本：

1. **CodeBuddy 应用**：官方账号登录/切换/额度（Auth Center 分组、账户行整理、Credits 到期提示、国内/国际版站点）、`~/.codebuddy/models.json` 表单与预设、MCP/Skills/Prompts/会话/用量/代理协议接入、工具安装与托盘显示名。
2. **Copilot VS Code Copilot 插件同步**：`copilot_vscode` 设备级设置、目标探测、同步状态、优先失败提示与设置 UI。
3. **GitHub Copilot Auto 路由**：虚拟模型 `copilot-fusion-auto`（Claude/Codex/Claude Desktop 模型列表与 Codex 目录）、按账号 Auto 支持探测与 `/auto` 解析复用、Free 账号 Auto。
4. **Grok 官方卡订阅等级**（Q1=A 取上游）：`GrokBoundAccountLine` 使用 `plan` prop；`query_grokbuild_quota_with_managed_fallback(state, with_plan=true)` 与 `get_grok_subscription_quota_with_plan` 让 Grok CLI 凭据路径也查询套餐；`quotaPlanKey` 对绑定 Grok 卡受 `!grokBoundAccountId || usageEnabled` 门控；绑定卡 `XaiOauthQuotaFooter` 使用 `autoQueryInterval = meta.usage_script.autoQueryInterval ?? 5`。
5. **授权中心「自动查询额度」开关**：`officialQuotaManualOnly`、手动空闲文案 `quota.manualIdle`、全部刷新绕过缓存、启动读设置前不查询。
6. **托盘 Antigravity 账号**：agy 账号分区与按账号额度、切号反馈、macOS 菜单栏图标位置保持、Dock 图标固定。
7. **ProviderCard 账号行隔离**：账号副标题抽到 `ProviderCardAccountLines.tsx`，按应用隔离 managed-auth 查询，修复 agy 徽标/邮箱泄漏、pending 绑定不进入云快照、agy 账号变更与 Auth Center 同步。
8. **后台任务提示与网络错误分类**：`backgroundTaskNotice`、`NetworkErrorKind`/`classify_error_chain`；models.dev 同步失败提示落地，更新检查提示路径在 fork 不触发（见更新器域终态）。
9. **前端性能与密度**：i18n 语言包按需加载、托盘用量页懒加载、隐藏托盘唤醒暂停、侧栏收起宽度按紧凑/舒适密度。
10. **安全与代理**：DB/SQL 权限、备份文件名、CONNECT 代理、deeplink 风险规则加固；全局代理配置原子发布；上游连接复用；故障转移不覆盖手选路由；Chat reasoning item id；Gemini 长期工具签名。
11. **Apps 页与工具链**：OpenCode 2 版本线识别、Pi 自更新锚定、Linux 系统终端、登录 shell 工具链环境转发、插件所属项目与 React key 修复、Skills Pi 列说明。
12. **用量/会话/其他**：TPS 语义 TTFT 与状态守卫、Claude 会话耗时按实际请求时间、用量应用筛选顺序、legacy Codex fork usage 恢复、OpenCode 2.4 会话、Gemini `.env` 引号、OpenClaw 块注释、env 删除保留换行、Codex Fast 档说明与锁定、设置页防闪。

每项由上游新增/更新测试或本轮新增回归覆盖；fork 不把同名功能迁移到另一入口。

## 功能交集判定终态

- 以目标对象、执行链路、UI 位置三个维度判断是否同一用户可见功能；功能名或关键词相同不等于同域。
- **Q1=A 已确认（2026-11-27）**：Grok 官方卡套餐显示取上游实现，删除 fork 的 `planLabel` 重复实现；fork 的双官网链接兄弟行与账号行布局保留，账号/套餐内容不与 `websiteLinks` 争用同一渲染段。
- 上游 ProviderCard 账号行抽取是结构重构，fork 在同一文件保留 `websiteLinks`、模型徽章、连通性徽标与右键菜单挂载；上游 agy 泄漏修复与隔离测试随之落地。
- 上游 `native_menu_on_left_click(native)` 与 fork `show_menu_on_left_click(false)` 的托盘左键契约沿用既有决定：保留 fork 左键切换主窗口/面板语义。
- 上游 stream_check 网络错误分类只落在共享 `proxy/error.rs` 与孤儿 `services/stream_check.rs`；fork 的逐模型连通性测试是独立执行链，不接入上游分类。
- 上游 Copilot Auto 虚拟模型进入 fork 的可搜索模型选择器；数据形态与组件各自保留，不做两套用户入口。
- 上游后台更新检查失败提示与 fork 关闭应用内更新器按 Q1=A 处理，不恢复自动检查。
- 对任何新出现的同域项，在 Build 前展示保 fork、取上游、混合三种方案的用户可见差异与维护代价，等待用户明确选择；未选择前不擅自替换。

## fork 魔改保留终态

以下功能在同步后必须仍存在且对应测试或源码护栏通过：

- `IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、DevPanel 与 fork 构建标识。
- `services/connectivity_test/`、`commands/connectivity_test.rs`、两个 Tauri 命令注册、`ConnectivityBadge`/对话框/批量检测、`useConnectivityProbe`、`shouldShowTestEntry`。
- 模型徽章与 `ModelQuickSwitch/`、1M 表头快捷勾选与 `[1M]`/`[1m]` 大小写兼容读取。
- `websiteUrl2`/`website_url_2` 全链路：类型、schema、表单、卡片、搜索、Provider serde、DAO SELECT/解码/写入守卫、deeplink 与测试字面量。
- `VisibleSidebarPanels` 与 Sidebar 过滤、批量检测侧栏开关。
- 托盘 `show_menu_on_left_click(false)`、`panel_visible`、左键四分支、`toggle_main_window` 与 `tray_left_click_never_opens_the_menu` 源码护栏。
- 跨应用导入 `ProviderImportEntry`/hooks/mapping、右键完整菜单（含置顶置底/删除）、默认顶部插入。
- tunecc Releases 链接、fork 裁剪 CI/release 与 `macos-15`、无应用内 updater、无 `stream_check` 可达链路。

不得用上游 `appSpecs` 反向改写 fork 的模型能力判据，也不得因 knip/测试重构删除 fork 仍在使用的 API。

## 数据库与 Provider DAO 终态

- 完整采纳上游数据库 WAL、proxy 热路径缓存、短查询索引、reader 隔离与 Provider DAO 改造；SCHEMA_VERSION 与上游一致。若出现撞号，按既有「较大版本号 + 双方幂等迁移臂」规则处理并记录。
- CodeBuddy 相关表/列/索引（会话、用量、MCP/Skills 开关）与上游一致；legacy Codex fork usage 恢复的迁移幂等。
- `website_url_2` 保留在共享 SELECT、行解码、UPDATE/INSERT 守卫、结构体与迁移中，列序与 `row.get` 索引一致。
- 上游新增 `Provider` 字面量补 `website_url_2: None`；fork 调用点按上游 API 签名迁移，不保留编译绕过。
- 不可读供应商行保护、原生命名同步与相关数据库测试随上游通过。

## 本地化终态（8 语种）

- `en/ja/zh-TW/zh` 接纳上游新增、改写、删除（CodeBuddy、Copilot VS Code、自动额度、后台任务、`streamCheck.hint.*`、`quota.manualIdle` 等）；fork 专属叶键按 pre-sync 的嵌套路径与原键序插回。
- `de/ko/ru/tr` 与 `v4.0.43` 对应文件逐字节一致，不补 fork 键。
- JSON 结构化合并保留空对象 `{}`，重点核对 `providerPreset.version` 与 `prompts.confirm`；8 个文件按对象作用域显式查重 dup=0。
- `src/config/forkOnlyLocaleKeys.ts` 以新基线重新生成 `FORK_ONLY_LOCALE_KEYS`；`FORK_REMOVED_LOCALE_KEYS` 保持既有 5 个 `streamCheck.*`，不因上游新增 `streamCheck.hint.*` 放宽其它上游键校验。
- localeParity、localeCoverage、readmeParity、代码字面量 key 与 CJK JSX 检查通过。

## 预设与模型能力终态

- 上游预设目录的模型、域名、分类与条目全部落地；fork `hidden?: boolean` 只保留一份。
- 预设 id 仍按原数组下标编号，顺序为 map 编号 → hidden 过滤 → `filterForkPresets` 白名单过滤。
- **Q2=A 已确认（2026-11-27）**：CodeBuddy 在 fork 构建下只显示官方登录卡（单独常量，不参与白名单目录过滤）与自定义；`forkOfficialAllowlist.codebuddy = []`，DeepSeek/Xiaomi MiMo/LongCat 三个 `cn_official` 预设不显示。
- StringAI 等新第三方赞助预设不擅自加入 fork 白名单；本机推理与官方卡的可见性只按既有用户决定处理。
- 白名单条目名与上游预设 `name` 逐字一致；过滤判定实现不重写。
- fork 模型徽章、快捷切换与 1M 行为不因上游 Auth Center/Plugins/预设新增而改变。

## 更新器域终态（Q1=A）

- 不恢复 `tauri_plugin_updater`、updater capability、自动下载 UI、UpdateContext 自动更新链或上游 Releases 安装链路。
- 保留 fork 简化 `UpdateContext.tsx`：legacy 键兼容、启动不自动检查，`lib/updater.ts` 恒返回 up-to-date；不恢复自动下载 UI 或上游 Releases 安装链。
- 上游 `UpdateContext` 的 `notifyBackgroundTaskFailed("updateCheck")` 改动不接入 fork 的更新检查路径；`backgroundTask.updateCheckFailed.*` 文案随上游保留但不触发。
- 保留 `check_app_update_available` 白名单桩和关于页打开 tunecc Releases 的简化行为。
- 上游 models.dev 同步失败提示（`backgroundTask.modelsDevSyncFailed.*`、关闭自动同步动作）按上游落地。
- 终态检查 updater 标识零命中（白名单桩按清单逐条说明），不得半套。

## stream_check 终态

- `commands/stream_check.rs`、模块声明、命令注册与 DAO 读取保持不存在/零命中；保留既有 schema 建表/索引，以及 pre-sync 已存在但未编译的孤儿 `services/stream_check.rs`/helper。
- 不把上游 MCP connectivity、网络错误分类或新 proxy health check 接到 fork 逐模型测试链。
- fork connectivity 后端继续独立 reqwest+SSE 直连，不经 proxy 转发链。

## 托盘、窗口与上游账户额度终态

- 上游窗口/托盘重构完整落地，包括托盘 Antigravity 账号分区、按账号额度、macOS 菜单栏图标位置保持与 Dock 修复。
- fork `show_menu_on_left_click(false)`、`panel_visible`、四分支与轻量模式行为保持。
- `tray_left_click_never_opens_the_menu`、tray 相关 Rust 测试通过。
- Auth Center 账户绑定/排序隐藏/自动额度开关不改变 fork 托盘左键契约或逐模型测试入口。
- 上游 `provider_hint` 的「备注 > 托管官方账号 > 官网」优先级保持；CodeBuddy 加入应用显示名与快照遍历。

## CodeBuddy 集成终态

- 新 `AppId`/`AppType::Codebuddy` 在 fork 的穷尽匹配处全部补齐：`forkOfficialAllowlist`（空数组）、`tray::app_display_name`、`services/provider/live.rs` 写入分支、`appConfig.tsx`、`ProviderList` 的 `liveConfigManaged`、`VisibleApps`/`McpApps`/Skills/Prompts/用量/会话列表与测试字面量。
- 官方登录卡（`CodeBuddy Official Sign-in`）单独常量与表单入口，不参与 fork 目录过滤；账号切换、额度与 Cards 显示按上游。
- MCP/Skills/Prompts 开关与后端命令按上游注册；不引入 updater 或 stream_check 依赖。

## CI、依赖与发布物料终态

- 本轮上游 `.github` 无改动；`ci.yml` 保持 fork 裁剪（无 schedule/workflow_dispatch、四 job fork `if`、cargo nextest、WSL2 restore-only rust-cache 与 continue-on-error）。
- `release.yml` 保持 fork 裁剪版：Windows x64 与 macOS arm64 unsigned、tag 守卫、MSI REBOOT 断言、`macos-15`、`$dest` 不带上游 assetSuffix；不引入签名或 latest.json。
- `Cargo.toml` 保留 tunecc repository、codegen-units=1、无 updater；采纳上游本轮新增依赖（`upstream_pool`/`copilot_auto`/`codebuddy` 所需）。
- `pnpm-lock.yaml`/`Cargo.lock` 与 manifests 一致，不出现 updater 条目；`pnpm install --frozen-lockfile` 与 `cargo check --locked --all-targets` 通过。
- 版本四处 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包统一为 `4.0.43-1`。

## 检查与落地保真终态

- 前端：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm format:check`、`pnpm knip`、`pnpm test:unit`。
- 后端：`cargo fmt --check`、`cargo check --locked --all-targets`、`cargo test --all-targets`。
- 重负载检查串行执行；本地 vitest 限 2 forks，Rust 测试限 4 threads，避免资源争用。
- 最终态提交后运行 `scripts/fidelity-v441-v443.py`，四 ref 为 `v4.0.43`、`v4.0.40`、`pre-sync-v441-v443`、`HEAD`。
- 上游方向缺失扣除 pre-sync 既有分歧后逐行归因；fork 方向缺失逐行归因。允许版本流转、fork 专属文案、刻意裁剪、被上游重构等价替代、格式化/测试拆分和无引用删除；不允许无法归因的语义丢失。
- 保真结果、重放判空、patch-id 差异、冲突停车与残余行归因记录在本轮 Spec/brief 或验证材料；计数均以最终 HEAD 现取为准。

## 文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测补充，新增 v4.0.41–v4.0.43 叠加要点。
- `docs/comet/specs/upstream-sync/spec.md` 在归档时由本文件整体重写。
- 上游 release notes（v4.0.41–v4.0.43）、whats-new 与 `docs/copilot-vscode-sync-zh.md` 随上游；fork README.md 保留 fork 专属内容并按终态补 CodeBuddy 行与 Grok 套餐口径。

## 交付终态

- Build/Verify 不推送、不打 tag；等待用户接受本轮验收结果。
- 用户已于 2026-11-27 授权（Q3=A）：接受结果并归档后，使用 `git push --force-with-lease origin main` 推送 fork main，并在归档提交创建、推送 annotated tag `v4.0.43-1` 触发 Release CI。
- 不创建 PR，不使用 `--force`；推送与 tag 是归档后的独立动作，不能把 SDK 归档完成当作远端交付完成。
- 用户已于 2026-11-27 选择（Q4=A）：归档完成、交付核对且两个 worktree 干净后，清理本轮 `sync-upstream-v441-v443` 与已取消的 `sync-upstream-v443` worktree/分支；主目录未跟踪文件保持不动。
