---
generated_from_state_version: 11
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 2
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-29T11:56:03.182Z
- 摘要: 独立只读验收通过。复算确认：fork 180 个提交线性重放到上游 v4.0.21（c4db63c60）之上，主题序列 0 行差异，patch-id 170 相同 / 10 不同（7 处冲突停车 + 3 处三方自动合并，均有今日 reflog 佐证），0 个提交被判空；31 个重叠文件逐文件 numstat 与规格一致且冲突标记 0 命中；落地保真上游缺 13 行 / fork 缺 6 行，逐行归因与规格完全吻合且无未说明缺失；locale 37 新增键逐字一致、7 删除键零残留、tr.json 逐字节一致；版本 4.0.21-1、SCHEMA_VERSION 24、迁移链与列集不变；更新器保持禁用、托盘左键契约与 fork 魔改全部在位；tag 之后 18 个上游提交未进入历史。Runtime 在当前候选上的 11 项检查全部 passed 且与当前工作区/输入匹配，予以复用。发现 4 处记录口径偏差（rr-cache 计数、停车点 7 的差异面表述、IS_FORK_BUILD 计数、A3 diff 基线），均不构成语义丢失。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main v4.0.21` 等于 `c4db63c60`（tag `v4.0.21` 剥离出的提交），`git log v4.0.21..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交；`git log v4.0.20..main` 的提交数 = 180 个重放提交 + 本轮新增提交（逐条记录），主题序列逐行 diff 为 0 行（剔除被 git 判空丢弃的提交），patch-id 对照逐个归类为「完全相同 / 仅 hunk 位移 / 冲突停车」。 | 独立复算：merge-base main v4.0.21 = c4db63c60d2a1ddcb4bd9f81152b9c6126413659（= v4.0.21^{}，annotated tag 2f04decf8）；v4.0.21..main 唯一作者 Tune；v4.0.20..pre-sync-v421 = 180，v4.0.21..main = 182 = 180 重放 + 2 本轮提交（293648173 测试断言、f64e1d31f 文档）；主题序列 --reverse 逐行 diff 0 行；patch-id 170 相同 / 10 不同 = 7 处冲突停车（06956fefb→a4bda4bcb、2ef9458a5→efbdbb698、c40eeb0ad→fd2012e9c、b691aa746→00768d6bb、c21a23c19→30a512520、e4e2e1ff5→ea1a7847b、69ac8a2b4→82d44d39d）+ 3 处未停车三方合并（f6121ca0d→b47ac25bf、6d0a3b3e7→e5ebf3d5b、3ddaf9145→4ce83b404，三者 numstat 逐文件相同）。7 个停车点均有今日 reflog rebase (continue) 记录。 |
| A2 | passed | brief.md | A2: 31 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、除 `README.md` 外无整文件取一侧（高危面为 `database/dao/providers.rs`、`lib.rs`、`services/mod.rs`、`commands/misc.rs`、`commands/settings.rs`、`settings.rs`、`ProviderCard.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`App.tsx`、`mutations.ts`、4 个 locale、4 个版本与锁文件）；`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 零命中。 | 重叠面按 pre-sync 口径复算为 31 个文件，逐文件 numstat 与规格逐行一致（上游 161 文件 +12488/−1383，35 A / 126 M / 0 D；fork 470 文件 +58802/−2766）。冲突标记 git grep -I HEAD 0 命中（exit 1），工作树二次扫描同样 0 命中。两侧语义并存逐项取证：lib.rs claude_account 注册 + show_menu_on_left_click(false) + 两个 connectivity 命令；services/mod.rs claude_account 与 connectivity_test 并存；commands/settings.rs lightweight_mode 合并 + install_update_and_restart 空壳；settings.rs lightweight_mode 与 VisibleSidebarPanels 并存；dao/providers.rs update_provider_sort_indexes + website_url_2；mutations.ts/App.tsx 账号缓存失效 + fork 导入/侧栏；ProviderForm ClaudeAccountSelect；ClaudeDesktopProviderForm usesAutomaticCopilotFormat 且 fork 新增 67 行 0 缺失；commands/misc.rs tunecc URL 5 处、farion1231 releases 0 处。除 README 外无整文件取一侧。 |
| A3 | passed | brief.md | A3: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.21-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 24，迁移链（v18→v19 `website_url_2` + `enabled_mcode`、v19→v20 pi、v20→v21 fork 修复 + `enabled_agy`、v21→v22 AGY 幂等 + `enabled_kimi`、v22→v23 Kimi 幂等 + `enabled_omp`、v23→v24 幂等补列）与 `create_tables` 列集不变；`git diff v4.0.20..HEAD -- src-tauri/src/database/schema.rs src-tauri/src/database/mod.rs` 除既有 fork 内容外无新增改动。 | 四处版本号均为 4.0.21-1（package.json:3、tauri.conf.json:4、Cargo.toml:3、Cargo.lock:761）。SCHEMA_VERSION = 24（database/mod.rs:54）。迁移链 v18→v19（website_url_2 + enabled_mcode）至 v23→v24（幂等补 kimi/omp）逐臂核对在位；create_tables 列集：mcp_servers 含 enabled_agy/enabled_kimi/enabled_omp，skills 含 enabled_agy/enabled_kimi 且不含 enabled_omp。git diff pre-sync-v421 HEAD -- schema.rs database/mod.rs 为空；v4.0.20..HEAD 的差异全部来自更早轮次的 fork 内容（schema 23→24 与 stream_check 清理），本轮无新增改动。 |
| A4 | passed | brief.md | A4: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧栏面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试（两个 Tauri 命令注册在位）、双官网链接、跨应用导入、禁用应用内更新器、README fork 说明、fork CI、托盘左键切换主窗口。 | fork 魔改保留清单逐项在位：productName CC Switch、dev:fork script 与 DevPanel、IS_FORK_BUILD（8 个文件）、visibleSidebarPanels/VisibleSidebarPanels 6 文件、MODEL_CAPABLE_APPS 仍为 claude/codex/gemini/grokbuild（4 文件）、右键置顶/置底（ProviderList.tsx:226 起）与新建插入第二位（mutations.ts:123-146）、forkOfficialAllowlist 3 文件 + filterForkPresets 6 文件、两个 connectivity 命令注册在位、websiteUrl2/website_url_2 43 文件、跨应用导入 10 文件、更新器禁用、README fork 说明与 fork CI（ci.yml/release.yml）、托盘左键切换与源码护栏。4 个预设文件各保留 hidden? 字段。 |
| A5 | passed | brief.md | A5: `git grep` 取证与同步前一致：`tauri_plugin_updater`/`updater_builder` 命中 0；`tauri-plugin-updater` 未回到 `Cargo.toml`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳；`connectivity_test_provider_models`/`connectivity_probe_provider` 在 `lib.rs` 注册在位；`shouldShowTestEntry` 调用链在位。 | git grep tauri_plugin_updater\|updater_builder HEAD -- src-tauri 0 命中；tauri-plugin-updater 不在 Cargo.toml、plugin-updater 不在 package.json；createUpdaterArtifacts: false（tauri.conf.json:40）；install_update_and_restart 返回 Ok(false)（commands/settings.rs:267）；connectivity_test_provider_models/connectivity_probe_provider 在 lib.rs:1823-1824 注册；shouldShowTestEntry 在 connectivityEntry.ts:28 定义、App.tsx:373 与 ProviderList.tsx:658 接线。 |
| A6 | passed | brief.md | A6: 上游 Claude 多账号能力在 fork 落地后可用：`commands/claude_account.rs` 与 `services/claude_account/**` 模块注册、授权中心可添加账号、Claude 官方卡「登录方式」下拉绑定账号、切卡即切号、卡片副标题显示账号与套餐、卡片/授权中心显示账号额度、绑号卡「打开终端」显示隔离提示；上游新增测试（`ClaudeOfficialSection`、`ProviderCard.claudeAccount`、`useClaudeAccountQuota`、`claudePlan`）全部通过。 | commands/claude_account.rs 与 services/claude_account/{mod,cc_lock,identity,layout,login,shared,usage,tests,snapshot 下 10 个文件} 在位；services/mod.rs:4 与 commands/mod.rs:6/48 注册；lib.rs:1323/1332 初始化与 :1904-1905 命令注册。前端 ClaudeAccountSelect（ClaudeOfficialSection.tsx:340，ProviderForm.tsx:2851 接线）、ClaudeBoundAccountLine（ProviderCard.tsx:550）、ClaudeAccountQuotaFooter（ProviderCard.tsx:650）、terminalIsIsolated（OpenTerminalDialog.tsx:84，卡片 :747 接线）全部在位。Runtime 检查 V2（候选 7f6cadf0… 上执行）中 ClaudeOfficialSection 11、ProviderCard.claudeAccount 5、useClaudeAccountQuota 2、claudePlan 2 用例全部通过。 |
| A7 | passed | brief.md | A7: 卡片叠加符合合并规则：绑号 Claude 官方卡副标题显示账号行（上游语义）、未绑号卡保留 fork 双官网链接并在有套餐时追加 `· 套餐`；fork 模型徽章与快捷切换入口仍在标题行；「打开终端」为卡片图标按钮（编辑左侧），⋯ 菜单不再含终端项；右键置顶/置底仍可用。 | ProviderCard.tsx 副标题分支顺序实测为 Codex 账号行 → 绑号 Claude（:550 ClaudeBoundAccountLine，不显示官网链接）→ AGY 模型 → 未绑号 fork 双链接（:562 websiteLinks）→ 末尾追加 · {claudeDefaultPlanLabel}（:587）→ 单链接 displayUrl。终端为卡片图标按钮且位于编辑按钮之前（ProviderCardActions.tsx:156 终端、:178 编辑、:192 更多菜单）；菜单内 openTerminal 仅作图标提示文案，测试断言 :150 与 :180 确认菜单不含 provider.openTerminal、:147 注释确认模型项已移除。右键置顶/置底在 ProviderList.tsx 未改动。 |
| A8 | passed | brief.md | A8: 连通检测入口判定按上游 `supportsConnectivityCheck`（官方 / OMO / OMO Slim 隐藏）叠加 fork 的 `shouldShowTestEntry`（仅 claude/codex），fork 现有连通性测试入口行为不变，上游 `providerCapabilities.test.ts` 通过。 | supportsConnectivityCheck（providerCapabilities.ts:128）对 mcode/kimi 与 official/omo/omo-slim 返回 false，ProviderCard.tsx:731 作内层守卫 onTest && supportsConnectivityCheck；shouldShowTestEntry（connectivityEntry.ts:28）作外层门控（App.tsx:373、ProviderList.tsx:658）。providerCapabilities.test.ts 的 supportsConnectivityCheck 用例（:441 起，共 34 个用例）在 Runtime V2 中通过。 |
| A9 | passed | brief.md | A9: 预设口径不变：`forkOfficialAllowlist` 未被修改；上游新增 ClinePass / TeamoRouter 在 fork 构建（`IS_FORK_BUILD`）下不可见；Kimi 官方预设名称不变且新模型行可见；本轮无 `category: "local"` 新预设；`filterForkPresets` 判定实现不改。 | git diff pre-sync-v421 HEAD -- forkOfficialAllowlist.ts forkPresetFilter.ts 为空。ClinePass（claudeProviderPresets.ts:2347）与 TeamoRouter（:640）在上游目录中但不在白名单。Kimi 官方预设名 Kimi/Kimi Global/Kimi For Coding/Kimi For Coding Global 未变；K3.1 Pro/HighSpeed 模型行已落地（piProviderPresets.ts、piModelCatalog.ts、hermesProviderPresets.ts 5 处，kimiProviderPresets.test.ts +9 行断言）。各 app category:"local" 计数 v4.0.20→HEAD 全部不变（claude 4、claudeDesktop 4、codex 4、hermes 4、openclaw 3、opencode 3、pi 3）。 |
| A10 | passed | brief.md | A10: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键；上游本轮新增键全部在位且取值与 `v4.0.21` 逐字节一致；上游删除的键不再残留；fork 键段（连通性、导入、快捷切换、侧栏、置顶置底等）与 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 的 fork 文案全部在位；`tr.json` 与 `git show v4.0.21:src/i18n/locales/tr.json` 逐字节一致。 | 5 个 locale 用 object_pairs_hook 解析全部通过、dup=0。zh/en/ja/zh-TW 各 37 个上游新增叶键在 HEAD 全部在位且取值与 v4.0.21 逐字一致（missing/mismatch=0），7 个删除键残留=0，2 个改写键按上游落地。provider.connectivityCheck 与 settings.general.trayStyleHelp 在 4 个 locale 均等于 pre-sync-v421 且不同于上游。tr.json 与 git show v4.0.21:src/i18n/locales/tr.json 逐字节一致（cmp exit 0，326280 字节）。 |
| A11 | passed | brief.md | A11: `pnpm typecheck` 通过（零 `TS2300`，新增 `ClaudeOfficialSection`/`ClaudeAccountQuotaFooter` 类型无重复声明）。 | Runtime 检查 V1（pnpm typecheck，候选 7f6cadf0… 上于 18:49 执行，晚于最后提交 f64e1d31f 的 18:41）exit 0、14953ms，日志显示 tsc --noEmit 无输出、0 个 TS2300。 |
| A12 | passed | brief.md | A12: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`ClaudeOfficialSection`、`ProviderCard.claudeAccount`、`CodexFormFields.catalogReorder`、`useClaudeAccountQuota`、`claudePlan`、`teamorouterClaudePresets`、`claudeDesktopProviderPresets`、`ProviderCardActions`、`OpenTerminalDialog`、`AuthCenterGroups`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。 | Runtime 检查 V2（pnpm test:unit）exit 0、111066ms：277 个测试文件、3576 个用例全部通过。点名套件全部在列且通过：ClaudeOfficialSection 11、ProviderCard.claudeAccount 5、CodexFormFields.catalogReorder 7、useClaudeAccountQuota 2、claudePlan 2、teamorouterClaudePresets 5、claudeDesktopProviderPresets 1、ProviderCardActions、OpenTerminalDialog 10、AuthCenterGroups 8。日志中的 failed 字样均为用例故意触发的错误路径日志，无失败用例。 |
| A13 | passed | brief.md | A13: `pnpm format:check` 通过；`pnpm build:renderer` 通过。 | Runtime 检查 V3（pnpm format:check）exit 0，日志 'All matched files use Prettier code style!'；V4（pnpm build:renderer）exit 0、10656ms，日志 'built in 9.47s'，仅 chunk 体积提示。 |
| A14 | passed | brief.md | A14: `cargo check` 通过，`Cargo.lock` 的改动只来自 `cc-switch` 版本行 `4.0.21-1`（无新增依赖；updater 相关条目不出现）。 | Runtime 检查 V5（cargo check --all-targets，src-tauri）exit 0、74664ms，日志 'Finished dev profile' 且编译目标为 cc-switch v4.0.21-1。git diff pre-sync-v421 HEAD -- Cargo.lock 仅 cc-switch 版本行 4.0.20-1→4.0.21-1（1 增 1 删），无新增依赖、无 updater 条目。 |
| A15 | passed | brief.md | A15: `cargo test` 通过（含上游 Claude 多账号、Codex 拖拽、轻量模式、代理、MCP、Kimi/Oh My Pi、Gemini 用例，fork 的托盘左键源码护栏与迁移测试）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。 | Runtime 检查 V6（cargo test）exit 0、44931ms：18 个 test target 合计 4429 passed / 0 failed / 11 ignored。tray::tests::tray_left_click_never_opens_the_menu 通过（日志 :4230 ok）。 |
| A16 | passed | brief.md | A16: 落地保真核对通过：对 31 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.20`、`v4.0.21`、`pre-sync-v421`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数，未说明的非零缺失即视为丢语义缺陷。 | 按固定四 ref 对 161 个上游文件独立复算归一化行多重集差：上游新增行缺失 13 行/6 文件（README.md 6 行 TeamoRouter 赞助商表、四处版本文件各 1 行 4.0.21、ProviderCard.tsx 3 行未绑号+套餐独立分支），fork 新增行缺失 6 行/6 文件（四处版本各 1 行 4.0.20-1、ProviderCard.tsx 1 行副标题类名、ProviderCardActions.test.tsx 1 行 provider.openTerminal 断言），其余 155 个文件双侧为 0。逐行归因与规格「落地保真核对 → 本轮实测」完全一致，无未说明缺失。 |
| A17 | passed | brief.md | A17: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮结果修订（含 §4.8 与 `ProviderCard.tsx`/`commands/settings.rs`/`settings.rs`/`lib.rs`/`services/mod.rs`/`ProviderForm.tsx`/`ClaudeDesktopProviderForm.tsx`/`App.tsx` 等行新口径）；change 内完整目标规格与全局 `docs/comet/specs/upstream-sync/spec.md` 已更新为同步后完整状态，三处记录的数字与归属互相一致。 | docs/HOW_TO_REBASE_UPSTREAM.md 含 §4.8（:360）并覆盖 Claude 多账号、卡片副标题三选一、终端入口迁移、双层连通守卫、轻量模式、排序 DAO、预设刷新、locale、schema、重放映射与保真实测；§4 表各行（ProviderCard.tsx、commands/settings.rs、settings.rs、lib.rs、services/mod.rs、ProviderForm.tsx、ClaudeDesktopProviderForm.tsx、App.tsx、mutations.ts、dao/providers.rs、locale）均含本轮新口径。change 规格与全局 docs/comet/specs/upstream-sync/spec.md 除标题与累积说明外逐字节一致，数字 180/181/182、0 判空、7 停车、13/6 行与独立复算一致。database-schema-migrations 规格 :70 登记「v4.0.21 轮无新增迁移臂」。 |
| A18 | passed | brief.md | A18: `.comet/config.yaml` 未被修改（`default_workflow: native`、`workflows`、`artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5` 全部保持）。 | git status --short .comet/ 为空；.comet/config.yaml 相对 HEAD 无改动。关键字段保持：default_workflow: native、workflows [native, classic]、artifact_root: docs、language: zh-CN、clarification_mode: batch、max_verify_failures: 5。 |
| A19 | passed | brief.md | A19: 轻量模式持久化（上游）与 fork 托盘左键并存：设置文件新增 `lightweight_mode` 字段；面板样式左键仍切换主窗口、原生菜单样式左键仍交系统菜单，`tray_left_click_never_opens_the_menu` 护栏通过。 | settings.rs:458 lightweight_mode 字段、:686 Default false、:1228 set_lightweight_mode 在位；commands/settings.rs:47 merge_settings_for_save 保留既有 lightweight_mode 并有测试。托盘：lib.rs:1252 .show_menu_on_left_click(false) 与 tray.rs:2639 set_show_menu_on_left_click(false) 两处固定，tray.rs 相对 pre-sync-v421 零改动，源码护栏 tray_left_click_never_opens_the_menu（tray.rs:3331）在 cargo test 中通过。 |
| A20 | passed | brief.md | A20: 上游 18 个 tag 之后的提交未进入历史：`git log --oneline v4.0.21..main` 不含 `144c41b96`、`cd9c72108` 等 tag 后提交；`upstream/main` 的引用未被写入 fork 历史。 | git log v4.0.21..main 不含 144c41b96 与 cd9c72108（grep 计数 0，两者均非 main 祖先）；upstream/main 不是 main 的祖先；v4.0.21..upstream/main 恰为 18 个提交且全部未进入 fork 历史。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| typecheck | typecheck | . | passed | 0 | 14953 ms |
| unit tests | test:unit | . | passed | 0 | 111066 ms |
| format check | format:check | . | passed | 0 | 6867 ms |
| renderer build | build:renderer | . | passed | 0 | 10656 ms |
| cargo check all targets | check --all-targets | src-tauri | passed | 0 | 74664 ms |
| cargo test | test | src-tauri | passed | 0 | 44931 ms |
| conflict markers | -lc ! git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' -- src src-tauri tests docs README.md | . | passed | 0 | 128 ms |
| locale duplicate keys | -c import json,glob def hook(pairs): ks=[k for k,_ in pairs] if len(ks)!=len(set(ks)): raise SystemExit('duplicate keys') return dict(pairs) for p in glob.glob('src/i18n/locales/*.json'): json.load(open(p,encoding='utf-8'),object_pairs_hook=hook) print('locale ok') | . | passed | 0 | 71 ms |
| turkish locale byte parity | -lc cmp -s src/i18n/locales/tr.json <(git show v4.0.21:src/i18n/locales/tr.json) | . | passed | 0 | 66 ms |
| fork invariants | -lc set -e grep -q '"version": "4.0.21-1"' package.json grep -q '"version": "4.0.21-1"' src-tauri/tauri.conf.json grep -q '^version = "4.0.21-1"' src-tauri/Cargo.toml grep -q 'SCHEMA_VERSION: i32 = 24' src-tauri/src/database/mod.rs grep -q 'omp: \["Ollama", "LM Studio", "vLLM"\]' src/config/forkOfficialAllowlist.ts grep -q 'set_show_menu_on_left_click(false)' src-tauri/src/tray.rs grep -q 'supportsConnectivityCheck(appId, provider)' src/components/providers/ProviderCard.tsx grep -q 'shouldShowTestEntry' src/components/providers/connectivityEntry.ts ! git grep -q 'tauri_plugin_updater\\|updater_builder' -- src-tauri grep -q '"createUpdaterArtifacts": false' src-tauri/tauri.conf.json git diff --quiet pre-sync-v421 HEAD -- src/config/forkOfficialAllowlist.ts src/config/forkPresetFilter.ts src-tauri/src/database/schema.rs src-tauri/src/database/mod.rs | . | passed | 0 | 110 ms |
| replay mapping | -lc set -e [ "$(git merge-base main v4.0.21)" = "c4db63c60d2a1ddcb4bd9f81152b9c6126413659" ] [ "$(git log --format="%an" v4.0.21..main \| sort -u)" = "Tune" ] [ "$(git rev-list --count v4.0.20..pre-sync-v421)" = "180" ] diff <(git log --format=%s --reverse v4.0.20..pre-sync-v421) <(git log --format=%s --reverse v4.0.21..main \| head -180) > /dev/null ! git merge-base --is-ancestor upstream/main main | . | passed | 0 | 216 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — exit 0
- pnpm test:unit: passed — 277 文件 / 3576 用例通过
- pnpm format:check: passed — All matched files use Prettier code style!
- pnpm build:renderer: passed — vite build exit 0（仅 chunk 体积提示）
- cargo check: passed — src-tauri，exit 0
- cargo test: passed — 18 个 target，4429 passed / 0 failed / 11 ignored
- conflict-marker scan: passed — HEAD 上 0 命中
- locale duplicate-key + tr parity: passed — 5 个 locale dup=0；tr.json 与 v4.0.21 逐字节一致
- replay mapping: passed — 180→180 重放 + 2 本轮提交；主题序列 0 行差异；patch-id 170/10（7 停车 + 3 自动合并）
- landing fidelity multiset: passed — 上游缺失 13 行/6 文件，fork 缺失 6 行/6 文件，逐行归因
- 已知限制: README.md 采用 fork 整文件说明，上游本轮 7 增/7 删不落地（刻意取舍，已逐行归因，其中 TeamoRouter 赞助商表格 6 行计入缺失）。
- 已知限制: 四个版本文件保持 fork 版 4.0.21-1，上游 4.0.21 行按预期流转。
- 已知限制: ProviderCard.tsx 的「未绑号 + 套餐」不再有上游独立分支，由 fork 双官网链接末尾追加 `· 套餐` 承载（合并等价，3 行计入上游缺失）。
- 已知限制: SCHEMA_VERSION 保持 24 并取代上游 23；降级到上游 v4.0.21 会报数据库版本过新（与上游策略一致）。
- 已知限制: 完整前端/Rust 检查在代码终态 293648173 与文档收尾提交 f64e1d31f 上分别执行；Runtime 将在冻结候选上重跑。
- 已知限制: 时间敏感用例保持既有口径（SessionManagerPage 本地 00:00–00:30、AppsPage 缓存竞态），未新增跳过。
- 已知限制: 推送 main 与打 tag v4.0.21-1 属交付步骤，按 D1 在验收通过并归档后执行。

## 阻塞项

_无。_

## 风险与跳过的工作

- 记录口径偏差（不影响判定）：docs/HOW_TO_REBASE_UPSTREAM.md §4.8 写「.git/rr-cache 今日新增 12 个文件级条目」，change 规格写「29 个文件级条目」。实测今日新增 12 个 preimage、13 个冲突目录、29 个文件（含 postimage/thisimage）。两处口径不同但都描述同一事实，语义成立。
- 记录口径偏差（不影响判定）：规格「冲突停车清单」第 7 行（69ac8a2b4→82d44d39d）的差异面只列了 4 个版本文件，但该提交重放结果相对原提交还有 App.tsx 与 4 个 locale 的内容差异。核实为新基线已含上游 v4.0.21 内容的预期效果（三方合并带入），且这 5 个文件在 82d44d39d 的 blob 与最终 HEAD 逐字节相同，无语义丢失。
- 记录口径偏差（不影响判定）：规格与 Builder 摘要写 IS_FORK_BUILD 19 处，独立按文件计数为 8 个文件（src/src-tauri/tests 范围）。功能在位，只是计数口径不同。
- brief A3 的字面检查命令 git diff v4.0.20..HEAD -- schema.rs database/mod.rs 并非为空（450 行），但全部来自 v4.0.20 之后、pre-sync-v421 之前的既有 fork 内容；pre-sync-v421..HEAD 对这两个文件的 diff 为空，符合「除既有 fork 内容外无新增改动」的语义。
- 证据边界：A11–A15 复用 Runtime 在候选 7f6cadf03928aa37… 上于 2026-10-29 18:49–18:54 执行的 V1–V6 检查记录（全部 exit 0，晚于最后提交 f64e1d31f 的 18:41:38，inputSnapshot.complete=true），未重跑；日志已逐份抽查（typecheck 无输出、vitest 277/3576、prettier 通过、vite built、cargo check Finished、cargo test 4429/0/11）。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | 按用户确认走 Shape 重新确认：change 内完整目标规格已在 Build 回填本轮实测（重放 180→181/182、0 判空、7 处冲突停车、落地保真上游 13 行/6 文件与 fork 6 行/6 文件、Claude 多账号叠加规则），需求条目与 20 条验收文字逐字不变，仅需重新确认同一 Shape 以解除文档绑定。 | 2026-10-29T10:46:54.856Z |
| 2 | 1 | 1 | pass | — | 独立只读验收通过。复算确认：fork 180 个提交线性重放到上游 v4.0.21（c4db63c60）之上，主题序列 0 行差异，patch-id 170 相同 / 10 不同（7 处冲突停车 + 3 处三方自动合并，均有今日 reflog 佐证），0 个提交被判空；31 个重叠文件逐文件 numstat 与规格一致且冲突标记 0 命中；落地保真上游缺 13 行 / fork 缺 6 行，逐行归因与规格完全吻合且无未说明缺失；locale 37 新增键逐字一致、7 删除键零残留、tr.json 逐字节一致；版本 4.0.21-1、SCHEMA_VERSION 24、迁移链与列集不变；更新器保持禁用、托盘左键契约与 fork 魔改全部在位；tag 之后 18 个上游提交未进入历史。Runtime 在当前候选上的 11 项检查全部 passed 且与当前工作区/输入匹配，予以复用。发现 4 处记录口径偏差（rr-cache 计数、停车点 7 的差异面表述、IS_FORK_BUILD 计数、A3 diff 基线），均不构成语义丢失。 | 2026-10-29T11:56:03.182Z |



## 结论

独立只读验收通过。复算确认：fork 180 个提交线性重放到上游 v4.0.21（c4db63c60）之上，主题序列 0 行差异，patch-id 170 相同 / 10 不同（7 处冲突停车 + 3 处三方自动合并，均有今日 reflog 佐证），0 个提交被判空；31 个重叠文件逐文件 numstat 与规格一致且冲突标记 0 命中；落地保真上游缺 13 行 / fork 缺 6 行，逐行归因与规格完全吻合且无未说明缺失；locale 37 新增键逐字一致、7 删除键零残留、tr.json 逐字节一致；版本 4.0.21-1、SCHEMA_VERSION 24、迁移链与列集不变；更新器保持禁用、托盘左键契约与 fork 魔改全部在位；tag 之后 18 个上游提交未进入历史。Runtime 在当前候选上的 11 项检查全部 passed 且与当前工作区/输入匹配，予以复用。发现 4 处记录口径偏差（rr-cache 计数、停车点 7 的差异面表述、IS_FORK_BUILD 计数、A3 diff 基线），均不构成语义丢失。
