---
generated_from_state_version: 8
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-11-09T07:25:02.453Z
- 摘要: 13 条验收项全部 passed：同步基线（v4.0.28 剥离提交 8656ebd91）、重放完整性（206 重放、1 判空丢弃且语义由上游同名声明保留）、CI 终态（上游重构+fork 裁剪并存）、版本四文件 4.0.28-1、35 个上游新文件落地、fork 魔改保留清单逐项在位、移除清单零命中、locale dup=0 ×5 且 tr.json 与 tag 逐字节一致、预设白名单按 D3 维持过滤、四 ref 保真复算方向 A 6 行/方向 B 12 行全部逐行归因、37 重叠文件全部有 fork 语义且非重叠 177 文件仅 http_client.rs 一处 D6 授权内的 allow(dead_code) 差异。无范围缩减、无未经授权偏离。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | 同步基线与重放完整性可核对：`git merge-base main v4.0.28^{}` 为 `f621d4216`（fork 提交全部落在 `v4.0.28` 之上），`git rev-list --count v4.0.28..HEAD` 等于 `pre-sync-v428`（= `ccc035dd1`）现取的 fork 提交数中实际重放数量加本轮新增提交，重放主题序列与 `pre-sync-v428` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。 | brief.md/spec.md 齐备：brief 含原始需求、非目标、D1-D11、13 条验收项；spec 为完整目标规格。产物位于 docs/comet/changes/sync-upstream-v428/，未建 capability-association.yaml/delta.yaml（与「明确不建」一致） |
| A2 | passed | brief.md | fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。 | git cat-file -t v4.0.28=tag(9bd119930，与 brief 记录一致)；git merge-base main 'v4.0.28^{}'=8656ebd91f3eba631837126e29df71e8353b7e43（=brief 声明的剥离提交）；git merge-base main 'v4.0.26^{}'=f621d4216（=验收示例口径）；git rev-parse 'v4.0.28^{}' 确认未拿 tag 对象当提交 |
| A3 | passed | brief.md | 两条连通性链路并存终态不变：上游 MCP 检测链与 fork 供应商逐模型测试链同时在位；`stream_check_provider` 保持 0 命中；`services/stream_check.rs` 与 `proxy/http_client.rs` 的 #9253 修复按孤儿文件落地（D6），不接线、不恢复模块声明。 | git rev-list --count v4.0.26..pre-sync-v428=206（pre-sync-v428=ccc035dd1=origin/main）；v4.0.28..HEAD=207=重放205+本轮新增2（b1824dd92、cc6b634c2）；主题序列 diff 仅 1 行丢弃(6476d125e)+2 新增，其余 0 差异；丢弃原因独立核实：6476d125e 的 save-if:false 在终态 ci.yml:247 由上游同名声明保留，语义未丢 |
| A4 | passed | brief.md | 上游 v4.0.27 新功能落地且与 fork 门控共存：FTS5 三命令注册并随上游默认关；密度/缩放设置与快捷键落地，fork 的 GeneralSection 面板可见性区、Sidebar 过滤、ProviderCard 副标题链不受密度 token 改名影响（`min-h-card`/`py-card-y`/`h-nav-row` 语义与原值对应）；定价搜索、Skills 重排、Grok Build 终端、图标随主题、右键菜单禁用、对话框拖动逐项在位。 | ci.yml 终态：concurrency PR/main 分组+CARGO_PROFILE_DEV_DEBUG:line-tables-only+fmt-check Linux 独占前置+rust-cache save-if main+pnpm/action-setup+cache:pnpm+4 shards+timeout 45m；fork 语义：schedule/workflow_dispatch 0 命中、四个 job if 为 fork 全量口径、WSL2 save-if:false+continue-on-error+LNK1327 注释；release.yml 0 处 pnpm store cache、macos-14 |
| A5 | passed | brief.md | 上游 v4.0.28 Codex 链落地：路由/聚合写内置 `openai`、切换提示分桶数量、持续迁入、迁移完成事件、暂停官方登录、额度保护默认开全部落地；fork 的快捷切换与 1M 改写（Claude 系 env 键链路）不受影响。 | 四处版本均为 4.0.28-1；Cargo.lock diff --numstat pre-sync..HEAD = 1/1 仅版本行；pnpm-lock.yaml 零 diff 且 pnpm install --frozen-lockfile 报 'Lockfile is up to date'；Cargo.toml crate-type=["rlib"]、codegen-units=1、repository=tunecc |
| A6 | passed | brief.md | 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v428` 相同；`schema.rs` 的 savepoint helper 取上游且 `stream_check_logs` 建表语句保留；`database/{schema,tests}.rs`、`dao/providers_tests.rs` 全部用例通过。 | 35 个上游新文件全部落地：release-notes v4.0.27/28、whats-new JSON、tool_lifecycle_progress.rs、session_manager/{search,search_revision}.rs、transform_codex_responses_kimi_history.rs(且 providers/mod.rs 有 pub mod 声明)、CodexPauseOfficialLogin.tsx、interfacePrefs.ts、disableContextMenu.ts、useSessionContentSearch.ts、codexHistorySplitHint.ts、genesis.svg/tokenplus.png、tests/support/mod.rs（旧 support.rs 已删）逐个 git cat-file -e 确认 |
| A7 | passed | brief.md | 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、fork 键段保留；`tr.json` 与 `v4.0.28` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。 | FTS5 三命令注册 lib.rs:1864-1866；MCP 两命令 1660-1661；settings.rs：VisibleSidebarPanels(112)、session_content_search_enabled(541)、codex_proxy_without_official_login(573)；capabilities/default.json:17 allow-set-webview-zoom；密度 token 在 tailwind.config.cjs + Sidebar.tsx 3 处 h-nav-row + ProviderCard.tsx min-h-card/py-card-y；misc.rs open_provider_terminal + App.tsx grokbuild；AGY Argon 周额度在 SubscriptionQuotaFooter.tsx |
| A8 | passed | brief.md | 预设与白名单按 D3 落地：上游 TokenPlus/Genesis/Mistral 条目随预设文件落地；fork 白名单维持过滤（三个都不收录，fork 构建下被过滤），`forkOfficialAllowlist.ts` 与 `forkPresetFilter.ts` 不改；预设编号 → 过滤 `hidden` → 过滤白名单的顺序不变。 | SCHEMA_VERSION=25（database/mod.rs:54）；schema.rs:25/35 in_savepoint 包裹 create_tables；stream_check_logs 建表保留；GeneralSection.tsx 面板可见性区与上游密度区并存 |
| A9 | passed | brief.md | CI 终态符合 D4：ci.yml 为上游重构结构 + fork 语义（push main 全量跑、无 schedule/workflow_dispatch、WSL2 restore-only + continue-on-error、fmt-check Linux 前置）；release.yml 保持 fork 裁剪版且上游 4 段 pnpm store cache 移除同步应用；macOS runner 仍 `macos-14`。 | 保留清单逐项在位：IS_FORK_BUILD/forkBuild.ts/__CCS_FORK_BUILD__、forkOfficialAllowlist.ts/forkPresetFilter.ts、devpanel、connectivity_test 服务+两命令注册(lib.rs:1860-1861)+ConnectivityBadge/useConnectivityProbe、websiteUrl2 全链路(dao/providers.rs SELECT 列序+表单+测试补列)、VisibleSidebarPanels、托盘 set_show_menu_on_left_click(false)(lib.rs:1282+tray.rs:2699)+护栏测试 tray.rs:3448、ProviderImportEntry 多表单接线、一键置顶置底(ProviderList.tsx:907)。移除清单零命中：tauri_plugin_updater/plugin-updater 仅两处登记豁免的命令桩、Cargo.lock/pnpm-lock 零 updater、stream_check 在 lib.rs/commands/mod.rs/services/mod.rs 0 命中、commands/stream_check.rs 与 dao/stream_check.rs 不存在、stream_check_provider 全仓 0 命中 |
| A10 | passed | brief.md | 后端在 fork 结构下编译通过：`cargo check --all-targets` 与 `cargo nextest run` 零失败、无新增未使用告警，且 `cargo fmt --check` 通过；上游新增 `Provider` 结构体字面量（含 `model_mapper.rs` 新测试的 `..create_provider_without_mapping()` 结构更新语法）与 fork 的 `website_url_2` 字段无缺列。 | python3 json object_pairs_hook 递归查重：en/ja/zh/zh-TW/tr 全部 dup=0；tr.json 与 v4.0.28 tag 逐字节一致(shasum 相等)；fork 键 connectivityCheck/trayStyleHelp 在位；上游新键 agyGeminiArgonWeekly/searchSessions 等在 en.json 命中 |
| A11 | passed | brief.md | 版本与锁文件终态一致：四处版本号均为 `4.0.28-1`；`Cargo.lock` 只出现 `cc-switch` 版本行变动与 crate-type 相关条目；`pnpm-lock.yaml` 终态无 `@tauri-apps/plugin-updater` 三段；`pnpm install` 与 `cargo check` 均报告锁文件未被改写。 | TokenPlus 落地 hermes/openclaw/opencode/pi/claudeDesktop 预设+piModelCatalog.ts+tokenplus.png；Genesis 落地 pi+claude/codex；mistral-large-4 落地 5 个预设文件；forkOfficialAllowlist.ts 零 tokenplus/genesis/mistral 命中（D3 过滤维持）；hidden?: fork 接口字段与预设过滤实现未改 |
| A12 | passed | brief.md | 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证性 `git fetch upstream` 不带 `--prune-tags`；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.13 反映本轮实测结论。 | python3 scripts/fidelity-v428.py 复算=方向A 6 行(release.yml 裁剪段 3；lib.rs 结构行 3)+方向B 12 行(ci.yml 6+release.yml 1+四个版本行 4+settings.rs import 合并 1)，与 brief 登记逐行一致、全部可归类、无无法归因缺失；docs/HOW_TO_REBASE_UPSTREAM.md §4.13 在位且内容与实测吻合；docs/comet/specs/ 本轮未动（spec 重写属归档阶段） |
| A13 | passed | brief.md | 落地保真核对（四 ref 行多重集口径）：在最终态提交之后，用 `v4.0.28` / `main(=pre-sync-v428)` / `HEAD` 与上游基线四个 ref 计算行多重集差集，214 个上游文件与 fork 侧 145 个代码文件全部参与，非重叠的上游文件在 fork 侧缺失为 0，重叠 37 文件的两侧缺失行逐行归因并带重数，归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 白名单条目）」一类，出现无法归类的缺失行即判定失败。 | comm -12 实测 37 个重叠文件且逐一有 fork 语义；终态 v4.0.26..HEAD 覆盖上游 214 文件全集；非重叠 177 个上游文件逐个 sha 比对仅 http_client.rs 有差异——fork 按孤儿豁免在 no_redirect_for_url 上加 #[allow(dead_code)] 注释（D6 授权口径内）；37 重叠文件无一被 byte-clone 丢 fork 语义；golden 快照 disable_response_storage 0 命中且 fork websiteUrl2 行保留；工作区无冲突标记；无远端写（origin/main 仍 ccc035dd1、tag 未建）；cargo fmt --check exit 0；Cargo.lock 仅版本行变动。已知限制：本机无 cargo-nextest，长跑检查复用 Builder 同候选 HEAD 上的全绿记录，未独立重跑 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| cargo fmt --check | fmt --check --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 2660 ms |
| four-ref fidelity recompute | scripts/fidelity-v428.py | . | passed | 0 | 13231 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- cargo fmt --check: passed — exit 0，三平台 CI 共有步骤
- cargo check --all-targets: passed — 零错误零告警（恢复 Emitter 导入 + 孤儿 helper allow 后）
- cargo test: passed — 全套 exit 0；本机未装 cargo-nextest，正式计划按 nextest 口径提交给 Runtime/Verifier
- pnpm install --frozen-lockfile: passed — 锁文件未被改写
- pnpm typecheck: passed — tsc --noEmit 零错误
- pnpm test:unit: passed — 310 文件 / 3951 用例全绿（含适配后的 Genesis 用例）
- locale dup check: passed — en/ja/zh/zh-TW/tr 按对象作用域查重 dup=0；tr.json 与 v4.0.28 tag 逐字节一致
- replay patch-id accounting: passed — 196 相同 / 9 不同（逐条归类）/ 1 判空（上游同名声明消化）
- fork preservation & removal greps: passed — 保留清单 12 项 git grep 在位；移除清单注册文件 0 命中
- four-ref fidelity (scripts/fidelity-v428.py): passed — 方向 A 本轮新增丢失 6 行、方向 B 12 行，全部归因；非重叠上游文件缺失 0
- version & lockfile terminal state: passed — 四处版本 4.0.28-1；Cargo.lock 无 updater 条目；pnpm-lock fork 的 -10 行保留且上游零改动
- 已知限制: 本机未装 cargo-nextest：后端测试以 cargo test 全套 exit 0 取证，cargo nextest run 的正式收据需由 Runtime 或独立 Verifier 以 fork CI 同口径执行后产生
- 已知限制: 长跑检查（pnpm test:unit、cargo test、cargo check）由 Builder 本机会话执行，历史收据只能当线索：Runtime 正式计划按收缩口径只含两项秒级只读检查（cargo fmt --check + 保真复算脚本），重套件由独立 Verifier 亲自执行取证（v4.0.25 轮实测的输入漂移收缩解法）
- 已知限制: 时间敏感用例的既有 flaky 边界（SessionManagerPage 00:00-00:30、AppsPage CI 并发竞态）本轮未复现异常；如 Verify 期单条红按 brief 既定口径判定

## 阻塞项

_无。_

## 风险与跳过的工作

- 本机未装 cargo-nextest：后端测试以 cargo test 全套 exit 0 取证（Builder 同候选），cargo nextest 正式收据待 fork CI 以 nextest 口径产生
- 长跑检查（pnpm test:unit 310 文件/3951 用例、cargo test）复用 Builder 在同一候选 HEAD 的全绿记录，未由 Verifier 独立重跑（brief 已授权该复用口径）
- 时间敏感用例 flaky 边界（SessionManagerPage 00:00-00:30、AppsPage CI 并发）按 brief 既定口径判定，本轮未复现异常

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 13 条验收项全部 passed：同步基线（v4.0.28 剥离提交 8656ebd91）、重放完整性（206 重放、1 判空丢弃且语义由上游同名声明保留）、CI 终态（上游重构+fork 裁剪并存）、版本四文件 4.0.28-1、35 个上游新文件落地、fork 魔改保留清单逐项在位、移除清单零命中、locale dup=0 ×5 且 tr.json 与 tag 逐字节一致、预设白名单按 D3 维持过滤、四 ref 保真复算方向 A 6 行/方向 B 12 行全部逐行归因、37 重叠文件全部有 fork 语义且非重叠 177 文件仅 http_client.rs 一处 D6 授权内的 allow(dead_code) 差异。无范围缩减、无未经授权偏离。 | 2026-11-09T07:25:02.453Z |



## 结论

13 条验收项全部 passed：同步基线（v4.0.28 剥离提交 8656ebd91）、重放完整性（206 重放、1 判空丢弃且语义由上游同名声明保留）、CI 终态（上游重构+fork 裁剪并存）、版本四文件 4.0.28-1、35 个上游新文件落地、fork 魔改保留清单逐项在位、移除清单零命中、locale dup=0 ×5 且 tr.json 与 tag 逐字节一致、预设白名单按 D3 维持过滤、四 ref 保真复算方向 A 6 行/方向 B 12 行全部逐行归因、37 重叠文件全部有 fork 语义且非重叠 177 文件仅 http_client.rs 一处 D6 授权内的 allow(dead_code) 差异。无范围缩减、无未经授权偏离。
