---
generated_from_state_version: 11
---

# 验证

## 当前结果

- 结果: **验收通过，需要你确认**
- 验证情况: **已完成检查，但需要你确认验证结果**
- 目标周期: 1
- 迭代: 2
- 验证器尝试次数: 1
- 完成时间: 2026-11-26T07:33:38.856Z
- 摘要: A1–A15 全部通过；A10 三入口过滤契约和真实回归已补齐并复跑 3/3，A13 最终 A=20/B=326 且归因完整。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | 同步基线与重放完整：git merge-base main v4.0.40^{} 为 f19a9d4f4；228 个同步前 fork 提交按原顺序重放，判空丢弃逐个登记，主题序列一致，patch-id 差异逐条归因为冲突停车、仅上下文位移或被上游同名实现消化。 | merge-base 与 v4.0.40 peeled commit 相同；228 个原提交按序重放，replay-map 209 identical/19 different/0 dropped，19 个差异有归因；当前 232 提交包含 228 replay+4 个同步终态提交。 |
| A2 | passed | brief.md | fork 魔改保留：IS_FORK_BUILD/forkBuild、白名单/过滤器、DevPanel、connectivity 前后端与两个命令注册、模型徽章/快捷切换、websiteUrl2 全链路、VisibleSidebarPanels、托盘左键四分支与源码护栏、跨应用导入、右键置顶置底/删除、默认第二位插入均存在且对应回归检查通过。 | fork 构建标识、白名单/过滤、DevPanel、connectivity 前后端与命令、模型徽章/快捷切换、website_url_2、VisibleSidebarPanels、托盘左键、跨应用导入、右键菜单和默认顶部插入均有源码/测试证据；Runtime 旧“第二位”措辞未改变实现。 |
| A3 | passed | brief.md | 上游能力落地：Auth Center 排序/隐藏与 Grok xAI 绑定、Plugins Antigravity 支持、API key 复制、备份上限、工具并发探测、数据库/会话/usage 性能、Host/SSRF/SQL/deeplink/SSE 安全修复、Kimi 1.5/WorkBuddy 企业/Xiaomi MiMo/xAI OAuth 用量、StringAI 预设与结构重构均在上游实现位置落地，并由上游或新增测试覆盖。 | 上游 Auth Center/Grok、Plugins/Antigravity、API key 复制、备份上限、并发探测、WAL/cache/index/reader、代理安全、usage、Skills/OpenCode/StringAI 与结构重构均在上游位置，相关测试随全量套件通过。 |
| A4 | passed | brief.md | 功能交集逐项有结论：按目标对象、执行链路、UI 位置判定上游与 fork 功能是否同域；所有需要用户选边的项目在 Build 前得到明确决定，未决定项不得由 Agent 擅自替换。 | brief/spec 按目标对象、执行链路和 UI 判定交集；Q2 已由用户选择混合显示并落实，其余为相邻并存或上游独有，Open questions 为空。 |
| A5 | passed | brief.md | 更新器域保持 fork 现状：不复活 updater 插件/依赖/能力/自动下载 UI；保留简化 UpdateContext 的 legacy 键兼容且启动不自动检查，lib/updater.ts 恒 up-to-date，check_app_update_available 白名单桩与关于页 tunecc Releases 跳转保留；上游本轮 updater 域清理不采纳，Q1=A 继续生效。 | updater 插件、依赖、capability、自动下载 UI 与安装链均未恢复；简化 UpdateContext、legacy 键、启动不检查、恒 up-to-date 桩、白名单检查与 tunecc Releases 跳转保留。 |
| A6 | passed | brief.md | stream_check 保持不可达：文件、模块声明、命令注册与 DAO 读取不恢复；仅保留既有 schema 建表/索引，不把上游 MCP connectivity 误接到 fork 逐模型测试链。 | stream_check 命令/DAO 文件不存在，模块声明、命令注册和调用链零命中；仅 schema/backup 孤儿表及 pre-sync 已有未编译 services/stream_check.rs/helper 保留，未误接 MCP connectivity。 |
| A7 | passed | brief.md | 本地化正确：8 个 locale 的上游增删改落地，fork 专属叶键不丢且保持原键序与空对象；forkOnlyLocaleKeys.ts 按 v4.0.40 重新生成；所有 locale 按对象作用域查重 dup=0；de/ko/ru/tr 与上游 tag 逐字节一致；localeParity/localeCoverage/readmeParity/CJK 检查通过。 | 复用已核验的 8 locale 结构/查重与字节比对证据：对象作用域 dup=0，de/ko/ru/tr 与 v4.0.40 一致，fork 专属键 397、移除豁免 5；localeParity/localeCoverage/readmeParity/CJK 随全量前端测试通过。本轮未改 locale。 |
| A8 | passed | brief.md | 数据库与 Provider DAO：上游 WAL、缓存、短查询索引、reader 隔离和 Provider DAO 改造完整落地；fork website_url_2 的 SELECT、解码、UPDATE/INSERT 守卫与测试保留；上游新增 Provider 字面量补齐 fork 字段；SCHEMA_VERSION 保持与上游一致，若实际出现撞号按既有规则记录。 | 上游 WAL、缓存、索引、reader 隔离、Provider DAO 与 backup 实现在位；website_url_2 的 SELECT/解码/写入守卫和测试保留；SCHEMA_VERSION=27，与上游一致。 |
| A9 | passed | brief.md | 托盘与窗口：上游重构完整落地，fork show_menu_on_left_click(false)、panel_visible 与四分支保持；tray_left_click_never_opens_the_menu 通过；上游 xAI 托盘额度与 fork 逐模型测试并存；Q2 混合契约落实为卡片账号效态/双官网分行、托盘账号优先，对应测试通过。 | 上游托盘/窗口与 xAI 额度重构在位；show_menu_on_left_click(false)、panel_visible、四分支和源码护栏保留；Q2 卡片账号/套餐/reauth 与双官网分行、托盘账号优先，相关测试与浏览器证据有效。 |
| A10 | passed | brief.md | 预设与模型能力：上游新预设目录内容落地，StringAI 等第三方预设不擅自进 fork 白名单；fork 编号→hidden→白名单过滤顺序、hidden? 字段与模型徽章/快捷切换判据保持；1M 读写兼容不回归。 | Copilot、WorkBuddy、Kimi 均按 map 原始下标→hidden→fork 白名单过滤；官方/账号预设独立于派生目录；真实 fork-build 回归覆盖 disallowed/hidden/visible 三项并确认原 ID 不漂移，Verifier 复跑 3/3 通过，相关套件 68 通过。 |
| A11 | passed | brief.md | CI 与物料：ci.yml 采纳上游结构与加速改动并保留 fork 裁剪、nextest、WSL2 restore-only 和 continue-on-error；release.yml 保持裁剪版与 macos-15；Cargo.toml 保持 tunecc repository、codegen-units=1、无 updater；依赖与锁文件一致。 | ci.yml 保留 fork 裁剪、nextest、独立 WSL2 restore-only job 与 continue-on-error；release.yml 保持裁剪版和 macos-15；Cargo 保留 tunecc repo、codegen-units=1、无 updater，锁文件检查通过。 |
| A12 | passed | brief.md | 全量检查通过：pnpm install --frozen-lockfile、pnpm typecheck、pnpm format:check、pnpm knip、pnpm test:unit、cargo fmt --check、cargo check --locked --all-targets、cargo test --all-targets。前后端重负载检查串行执行，vitest 限 2 forks，Rust 测试限 4 threads。 | 当前候选前端 typecheck/format/knip 通过，351 文件/4619 用例通过；未改 Rust，复用 cargo fmt/check/clippy/test 的真实通过证据（lib 5226+integration 224），重负载检查按约定串行且限流。 |
| A13 | passed | brief.md | 落地保真：最终态提交后运行四 ref 归一化行多重集差集（v4.0.40/v4.0.38/pre-sync-v440/HEAD）；上游侧缺失扣除 pre-sync 既有分歧后逐行归因，fork 侧缺失逐行归因，无非预期残余。 | 最终 HEAD 四 ref 原始文本行多重集复算 A=20/B=326；§4.18 已逐文件/逐类准确归因全部残余，包括 Cargo.lock、tray、misc、UpdateContext、ci、backup、ProviderCard 与 B 类版本/测试拆分等，无未知语义丢失。 |
| A14 | passed | brief.md | 四处版本一致：package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的 cc-switch 包终态均为 4.0.40-1。 | package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的 cc-switch 版本独立读取均为 4.0.40-1。 |
| A15 | passed | brief.md | 交付边界：Build/Verify 不推送、不打 tag；接受结果并归档后，按用户对 D9 的明确授权执行 force-with-lease 推送 main 和 annotated tag v4.0.40-1，不创建 PR；worktree 仅在归档完成且干净后按用户选择清理。 | 当前仅完成 Build/Verify：未 push、未创建 PR、未打 tag、未归档、未清理 worktree；D9 的 force-with-lease 与 annotated tag 授权仍绑定用户接受并归档后的动作。 |

## 检查

| Agent 报告的检查 | 结果 | 执行与证据 |
| --- | --- | --- |
| verify-a10-focused-regression | passed | Verifier 在 worktree 独立复跑 pnpm exec vitest run tests/components/ForkPresetFiltering.test.tsx --maxWorkers=2 --minWorkers=1：1 文件/3 用例通过；同时核对三个表单均在 map 原下标后执行 hidden 与 fork 白名单过滤。 |
| verify-git-lineage-replay | passed | HEAD=6fddf7983758；merge-base HEAD v4.0.40^{}=f19a9d4f4f08bda03106a7be87c77cbcdf55b019，与 peeled tag 相同；pre-count=228，head-count=232；replay-map.tsv=228 行，209 identical/19 different/dropped=0。 |
| verify-a13-four-reference-fidelity | passed | 最终 HEAD 运行 python3 scripts/fidelity-v439-v440.py 得 A=20/B=326；§4.18 明确使用 UTF-8 原文 splitlines、不做空白或符号归一化，A 按文件、B 按类别完整归因，无未归因残余。 |
| verify-source-boundaries-and-q2 | passed | updater 插件/依赖/capability 零命中；stream_check 仅保留 schema/backup 孤儿表与未编译 services/stream_check.rs/helper，commands/DAO 文件和模块/命令/调用链不可达；ProviderCard websiteLinks 为独立兄弟行，tray 保留 show_menu_on_left_click(false)、panel_visible 与左键护栏。 |
| reuse-full-frontend-checks | passed | 复用当前候选 Builder 的真实结果：pnpm typecheck、format:check、knip 通过；pnpm test:unit --maxWorkers=2 --minWorkers=1 为 351 文件/4619 用例通过；A10 相关既有测试 68 通过。本轮 Verify 未重复重负载套件。 |
| reuse-backend-checks | passed | 本轮未改 Rust；复用此前真实通过的 cargo fmt --check、cargo check --locked --all-targets、cargo clippy --locked --all-targets -- -D warnings、cargo test --locked --all-targets -- --test-threads=4（lib 5226 passed/14 ignored，integration 224 passed）。 |
| verify-versions-cleanliness-delivery | passed | package.json、tauri.conf.json、Cargo.toml、Cargo.lock 的 cc-switch 版本均为 4.0.40-1；git diff --check 通过；git status --short 仅有正式 Native 产物 docs/comet/changes/ 未跟踪；本地无 v4.0.40-1 tag；未 push/PR/archive。 |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- a10-test-first-red: passed — 在实现前新增 tests/components/ForkPresetFiltering.test.tsx 并运行聚焦测试：Copilot、WorkBuddy、Kimi 三项均按预期失败，失败原因是 disallowed/hidden 预设仍被渲染，证明回归能捕获缺陷。
- a10-focused-green: passed — 最小实现后运行 pnpm exec vitest run tests/components/ForkPresetFiltering.test.tsx --maxWorkers=2 --minWorkers=1：3 passed；真实渲染断言确认不允许和 hidden 项不出现，可见项选择后保留原目录 ID cc-switch-visible。
- a10-related-preset-tests: passed — 运行 CopilotProviderForm、WorkBuddyProviderForm、KimiProviderForm 与 ProviderForm.presetRows.golden 相关测试：68 passed。
- pnpm-typecheck: passed — 在最终候选运行 pnpm typecheck，成功。
- pnpm-format-check: passed — 在最终候选运行 pnpm format:check，成功。
- pnpm-knip: passed — 在最终候选运行 pnpm knip，成功。
- pnpm-unit-tests: passed — 在最终候选运行 pnpm test:unit --maxWorkers=2 --minWorkers=1：351 个测试文件、4619 个用例全部通过。
- backend-checks-reused: passed — 复用同一同步候选的既有 Rust 证据；本轮未改 Rust 源码。此前真实通过 cargo fmt --check、cargo check --locked --all-targets、cargo clippy --locked --all-targets -- -D warnings、cargo test --locked --all-targets -- --test-threads=4（lib 5226 passed/14 ignored；integration 224 passed）。
- git-lineage-replay-and-cleanliness: passed — merge-base HEAD v4.0.40^{}=f19a9d4f4f08bda03106a7be87c77cbcdf55b019；v4.0.40..HEAD=232=228 replay+4 overlay/docs；replay-map.tsv 228 行，209 identical/19 different/0 dropped，主题与顺序一致。git status --short 仅有正式 Native 产物目录 docs/comet/changes/ 未跟踪，所有已跟踪文件干净。
- four-reference-fidelity: passed — 在最终 HEAD 6fddf7983 运行 python3 scripts/fidelity-v439-v440.py：方向 A=20、方向 B=326。与上一轮相比仅新增 Kimi 原白名单判断并入 hidden 守卫这一行，已归入过滤顺序补强；其余 A/B 残余在 §4.18 逐文件归因，无未知残余。
- versions-and-delivery-boundary: passed — package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的 cc-switch 版本均为 4.0.40-1；本地无 v4.0.40-1 tag。当前只提交 Build 候选，未 push、未创建 PR、未归档、未清理 worktree。
- 已知限制: pre-sync-v440 已存在的小写 [1m] 展示名同步只识别大写旧值 ${oldBase}[1M]；本轮未改变该既存行为。
- 已知限制: pre-sync-v440 已存在的批量探测运行中停止按钮禁用、可见停止分支不可达；本轮未改变该既存行为。

## 阻塞项

- **user**: Verification passed; user acceptance is required before Archive. — next: `await-user`

## 风险与跳过的工作

- pre-sync 已存在的小写 [1m] 展示名同步限制，本轮未改变。
- pre-sync 已存在的批量探测运行中停止按钮不可用，本轮未改变。
- Release CI 需在用户接受并归档后推送 tag 才会触发。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | execution-error | — | Verify 未通过：A10 预设过滤顺序在 Copilot/WorkBuddy/Kimi 三个入口不完整；A13 保真归因文本需按实际 hunk 修正。其余 A1–A9、A11–A12、A14–A15 均有通过证据。当前候选未推送、未打 tag、未归档，需回 Build 修复后重新交接。 | 2026-11-25T17:50:09.088Z |
| 1 | 1 | 2 | fail | A10, A13 | Verify 未通过：A10 预设过滤顺序在 Copilot/WorkBuddy/Kimi 三个入口不完整；A13 保真归因文本需按实际 hunk 修正。其余 A1–A9、A11–A12、A14–A15 均有通过证据。当前候选未推送、未打 tag、未归档，需回 Build 修复后重新交接。 | 2026-11-25T17:51:57.771Z |
| 1 | 2 | 1 | pass | — | A1–A15 全部通过；A10 三入口过滤契约和真实回归已补齐并复跑 3/3，A13 最终 A=20/B=326 且归因完整。 | 2026-11-26T07:33:38.856Z |



## 结论

A1–A15 全部通过；A10 三入口过滤契约和真实回归已补齐并复跑 3/3，A13 最终 A=20/B=326 且归因完整。
