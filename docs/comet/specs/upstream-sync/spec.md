# 完整目标规格：upstream-sync（v4.0.40 轮）

> 本文件描述 `sync-upstream-v440` 完成后的 upstream-sync 完整状态。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮完整状态保存在 `docs/comet/archive/2026-11-22-sync-upstream-v436-v438/`。

## 概述

fork `tunecc/cc-switch` 保持可干净 rebase 到上游已发布版本之上的同步状态。本轮将 main 从 `v4.0.38` 推进到 `v4.0.40`，peeled 基线为 `f19a9d4f4f08bda03106a7be87c77cbcdf55b019`，fork 版本从 `4.0.38-1` 更新为 `4.0.40-1`。

同步前 `v4.0.38..main` 的 228 个 fork 提交按原顺序重放，不 cherry-pick、不 merge；上游 72 个提交、326 个文件的变更全部落地，但 fork 已明确关闭的 updater、stream_check、release 裁剪域不恢复。同步后保留 fork 全部自有功能与用户可见行为。

## Git 与重放终态

- main 的 merge-base 与 `v4.0.40^{}` 精确等于 `f19a9d4f4`。
- `v4.0.40..main` 只包含重放后的 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 提交与本轮终态提交。
- 安全参照 `pre-sync-v440` 指向同步前 `c1cfc415c21cbd453fb52d8cca010668e0d7f8a3`，仅本地保存，不推送。
- 228 个同步前提交的主题序列与 pre-sync 一致；被 Git 判空丢弃的提交逐个登记；patch-id 差异只允许归类为冲突停车、仅上下文位移或被上游同名实现消化。
- `.comet/config.yaml` 在 rebase 中途若被历史提交改回旧内容，从 `ORIG_HEAD` 恢复并纳入提交；终态与同步前一致。
- 只锁已发布 tag，不纳入 `v4.0.40` 后 `upstream/main` 的 18 个提交；fetch 不 prune tag。CodeBuddy、Copilot CLI 复用、legacy Codex fork usage 恢复、全局代理原子发布与设置页防闪等均属于该未发布区间。

## 上游能力与修复终态

以下能力保持上游实现位置、数据模型与 UI 入口，不额外复制一套 fork 版本：

1. Auth Center 账号排序/隐藏、供应商副标题托管官方账号、Grok Build 官方卡绑定 xAI 账号与 xAI OAuth 托盘额度。
2. Plugins 页面启用与 Antigravity 支持、远端版本检查、占用中重装提示、CLI 缺失时避免创建配置目录，以及仅有桌面应用时使用 bundled Codex CLI。
3. API key 复制、备份目录可选大小上限、工具版本并发探测与安装状态先显示、overlay 防闪。
4. 数据库/会话/usage 性能：短查询索引与 WAL reader 隔离、WAL 与 proxy 热路径缓存、QuickJS 阻塞 worker、并行扫描共享游标、IPC 取消过期搜索、缓存命中率和隐私扫描优化。
5. 代理安全与可靠性：连接级 Host 校验、SQL import trigger/view/大小/时限限制、usage_script SSRF/OOM/JS 注入防护、deeplink 凭据外泄字段拦截、SSE pending/缓冲限制、首字节超时、Chat chunked thinking、并行工具调用重排、GPT-6.2 Codex OAuth prompt caching。
6. Kimi 1.5 usage、WorkBuddy 企业 usage、Xiaomi MiMo/Token Plan、xAI OAuth 额度与官方账号副标题、Antigravity T3/ACP 会话与首 token 速度。
7. Skills Discover 同重名去重、OpenCode Desktop bundled CLI 不走 npm 升级、deep link 合并失败不弹确认框、additive 应用 remove-from-live 收敛。
8. StringAI 完整赞助预设与 OpenCode Go DeepSeek effort 修正。
9. 上游测试重构、CI 加速、Vitest workspace、Codex TOML 与 SkillService 拆分、bin 测试目标裁剪、objc2 0.5/app-kit 0.2 清理与 profile.dev.package 优化。

每项由上游新增/更新测试或本轮新增回归覆盖；fork 不把同名功能迁移到另一入口。

## 功能交集判定终态

- 以目标对象、执行链路、UI 位置三个维度判断是否同一用户可见功能；功能名或关键词相同不等于同域。
- 上游 MCP connectivity 与 fork 逐模型供应商模型测试是不同目标、执行器、数据与 UI，两条链并存。
- 上游 Auth Center 官方账号切换与 fork 模型快捷切换不争夺同一状态或 UI；fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry` 判据保持独立。
- 上游 API key 复制按钮位于供应商表单，不替代 fork 的模型徽章/快捷切换或 connectivity。
- **Q2 已确认（2026-11-25，A 混合）**：上游 Grok 绑定账号/xAI OAuth 账号副标题与 fork 双官网链接在 `ProviderCard` 分行显示，账号/套餐/reauth 与 `websiteLinks` 同时可见；托盘 `provider_hint` 保持单一字符串槽位并采用账号优先。上游「账号替代 URL」测试改为混合契约，fork 双官网测试保留并增加账号并存覆盖。
- 对任何其他无法排除的同域项，在 Build 前展示保 fork、取上游、混合三种方案的用户可见差异和维护代价，等待用户明确选择；未选择前不擅自替换。
- 最终交集结论与用户决定记录在 brief 的 Decisions/Open questions；Spec 不预填未发生的选择。

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
- `website_url_2` 保留在共享 SELECT、行解码、UPDATE/INSERT 守卫、结构体与迁移中，列序与 `row.get` 索引一致。
- 上游新增 `Provider` 字面量补 `website_url_2: None`；fork 调用点按上游 API 签名迁移，不保留编译绕过。
- 不可读供应商行保护、原生命名同步与相关数据库测试随上游通过。

## 本地化终态（8 语种）

- `en/ja/zh-TW/zh` 接纳上游新增、改写、删除；fork 专属叶键按 pre-sync 的嵌套路径与原键序插回。
- `de/ko/ru/tr` 与 `v4.0.40` 对应文件逐字节一致，不补 fork 键。
- JSON 结构化合并保留空对象 `{}`，重点核对 `providerPreset.version` 与 `prompts.confirm`；8 个文件按对象作用域显式查重 dup=0。
- `src/config/forkOnlyLocaleKeys.ts` 以新基线重新生成 `FORK_ONLY_LOCALE_KEYS`，并复核 `FORK_REMOVED_LOCALE_KEYS`。
- localeParity、localeCoverage、readmeParity、代码字面量 key 与 CJK JSX 检查通过；fork 豁免只覆盖真实 fork 键，不弱化上游新键校验。

## 预设与模型能力终态

- 上游预设目录的模型、域名、分类与条目全部落地；fork `hidden?: boolean` 只保留一份。
- 预设 id 仍按原数组下标编号，顺序为 map 编号 → hidden 过滤 → `filterForkPresets` 白名单过滤。
- StringAI 等新第三方赞助预设不擅自加入 fork 白名单；本机推理与官方卡的可见性只按既有用户决定处理，新增其它可见性必须先询问。
- 白名单条目名与上游预设 `name` 逐字一致；过滤判定实现不重写。
- fork 模型徽章、快捷切换与 1M 行为不因上游 Auth Center/Plugins/预设新增而改变。

## 更新器域终态（Q1=A）

- 不恢复 `tauri_plugin_updater`、updater capability、自动下载 UI、UpdateContext 自动更新链或上游 Releases 安装链路。
- 上游 `UpdateContext.tsx` 只删除从未写入的 legacy dismissed-version key，按 Q1=A 不采纳这项 updater 域清理；`commands/settings.rs` 删除无效 allow 注释属于非功能性清理，可落地。
- 保留 fork 简化 `UpdateContext.tsx`：legacy 键兼容、启动不自动检查，`lib/updater.ts` 恒返回 up-to-date；不恢复自动下载 UI 或上游 Releases 安装链。
- 保留 `check_app_update_available` 白名单桩和关于页打开 tunecc Releases 的简化行为。
- 上游 `commands/settings.rs` 的非 updater 改动正常落地，但 updater import/实现不复活。
- 终态检查 updater 标识零命中（白名单桩按清单逐条说明），不得半套。

## stream_check 终态

- `commands/stream_check.rs`、模块声明、命令注册与 DAO 读取保持不存在/零命中；保留既有 schema 建表/索引，以及 pre-sync 已存在但未编译的孤儿 `services/stream_check.rs`/helper。
- 不把上游 MCP connectivity 或新 proxy health check 接到 fork 逐模型测试链。
- fork connectivity 后端继续独立 reqwest+SSE 直连，不经 proxy 转发链。

## 托盘、窗口与上游账户额度终态

- 上游窗口/托盘重构完整落地，包括上游新增的 xAI OAuth 额度展示。
- fork `show_menu_on_left_click(false)`、`panel_visible`、四分支与轻量模式行为保持。
- `tray_left_click_never_opens_the_menu`、tray 相关 Rust 测试通过。
- Auth Center 账户绑定/排序隐藏不改变 fork 托盘左键契约或逐模型测试入口。

## CI、依赖与发布物料终态

- `ci.yml` 采纳上游结构和加速改动，保留 fork 无 schedule/workflow_dispatch、四 job fork `if`、cargo nextest、WSL2 restore-only rust-cache 与 continue-on-error。
- `release.yml` 保持 fork 裁剪版：Windows x64 与 macOS arm64 unsigned、tag 守卫、MSI REBOOT 断言、`macos-15`、`$dest` 不带上游 assetSuffix；不引入签名或 latest.json。
- `Cargo.toml` 保留 tunecc repository、codegen-units=1、无 updater；采纳 objc2 0.5/app-kit 0.2 清理、bin test=false 与 profile.dev.package。
- `pnpm-lock.yaml`/`Cargo.lock` 与 manifests 一致，不出现 updater 条目；`pnpm install --frozen-lockfile` 与 `cargo check --locked --all-targets` 通过。
- 版本四处 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包统一为 `4.0.40-1`。

## 检查与落地保真终态

- 前端：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm format:check`、`pnpm knip`、`pnpm test:unit`。
- 后端：`cargo fmt --check`、`cargo check --locked --all-targets`、`cargo test --all-targets`。
- 重负载检查串行执行；本地 vitest 限 2 forks，Rust 测试限 4 threads，避免资源争用。
- 最终态提交后运行 `scripts/fidelity-v439-v440.py`，四 ref 为 `v4.0.40`、`v4.0.38`、`pre-sync-v440`、`HEAD`。
- 上游方向缺失扣除 pre-sync 既有分歧后逐行归因；fork 方向缺失逐行归因。允许版本流转、fork 专属文案、刻意裁剪、被上游重构等价替代、格式化/测试拆分和无引用删除；不允许无法归因的语义丢失。
- 保真结果、重放判空、patch-id 差异、冲突停车与残余行归因记录在本轮 Spec/brief 或验证材料；计数均以最终 HEAD 现取为准。

## 文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测补充，新增 v4.0.39–v4.0.40 叠加要点。
- `docs/comet/specs/upstream-sync/spec.md` 在归档时由本文件整体重写。
- 上游 release notes、README 翻译与 whats-new 随上游；fork README.md 保留 fork 专属内容。

## 交付终态

- Build/Verify 不推送、不打 tag；等待用户接受本轮验收结果。
- 用户已于 2026-11-25 授权：接受结果并归档后，使用 `git push --force-with-lease origin main` 推送 fork main，并在归档提交创建、推送 annotated tag `v4.0.40-1` 触发 Release CI。
- 不创建 PR，不使用 `--force`；推送与 tag 是归档后的独立动作，不能把 SDK 归档完成当作远端交付完成。
- 独立 worktree 仅在归档完成、交付核对且工作区干净后清理；主目录未跟踪文件保持不动。
