---
generated_from_state_version: 12
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 3
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-08T13:01:29.400Z
- 摘要: 候选 655fd3a7（main=8c3c3fa5，基于 v4.0.4=a29a4f38）经独立取证：11 项验收全部通过。merge-base 与基线正确、post-release 11 个上游提交确不在 main；121 条 fork 提交按序重放为 120 条 + 已记录的 1 条空提交丢弃 + 2 条本轮提交，顺序逐位保真、无重复；14 个重叠共享文件的上游 delta 与合并后 delta 双向差集全为 0（版本文件仅 4.0.4 vs 4.0.4-1 一行差异），fork 语义（无 updater、托盘左键、connectivity_test、VisibleSidebarPanels、批量探针门控、setTitle 守卫、tunecc releases、star 可关闭条与 whats-new 并存）逐项在位且零冲突标记；四处版本号 4.0.4-1、SCHEMA_VERSION 21 与 v20→v21/v18→v19 迁移完整；.comet/config.yaml 未被改写；流程文档与目标规格已按本轮修订；4 项构建/测试为 Runtime 正式检查记录，针对当前 HEAD 与 candidateId、工作树仅 Runtime 自管状态文件脏，证据未过期，直接复用未重跑。origin/main 同步与 tag v4.0.4-1 按 Decisions 属归档后交付步骤，本轮不作断言。存在 7 条文档口径/死代码类风险，均不构成语义丢失。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 a29a4f38（tag v4.0.4 指向的提交），`git log v4.0.4..main` 只包含 fork 提交，且 5ae6ad38 等 v4.0.4 之后的 post-release 提交不在 main 历史中。 | git merge-base main upstream/main = a29a4f38 = git rev-parse v4.0.4^{commit}; git rev-list --count v4.0.4..main = 122 且 git log --format='%an <%ae>' v4.0.4..main 只有 Tune <tunecc@users.noreply.github.com>（全为 fork 提交）；git merge-base --is-ancestor 5ae6ad38 main 退出码 1，git branch --contains 5ae6ad38 为空，逐个遍历 v4.0.4..upstream/main 的 11 个 post-release 提交均非 main 祖先（无 LEAKED）。 |
| A2 | passed | brief.md | A2: rebase 前 d35726e2..main 的 121 个 fork 提交按原顺序逐一重放，无 git 自动判定的冗余跳过、无重复提交、无需合并的提交（若有，按完整目标规格「重放映射」记录并核对语义）；全部 fork 功能语义保留。 | 顺序保真：diff <(git log --reverse --format=%s d35726e2..pre-sync-v404)（121 条） <(git log --reverse --format=%s v4.0.4..main)（122 条）只有两处差异——第 112 位少一条 'feat: disable in-app updater, point users to GitHub releases'（即已记录的 c8c8461c 空提交被丢弃，同名提交在 pre 侧 2 条、main 侧 1 条），末尾多出 8723cb79 同步提交与 8c3c3fa5 文档提交；其余 120 条逐位同序、无重复。git patch-id --stable 对比：patch-id 不一致的仅 812c0a7f/9a859fd8、2ad67850/63d69211、99ebd7a5/52faaa8d、4a947514/8e6a0ac9 四对（同一 slot，内容差仅来自 4 处已记录冲突解法，其中 4a947514 与 8e6a0ac9 的唯一差异是 extractErrorMessage 导入行的归属）+ 被丢弃的 c8c8461c + 2 个新提交。c8c8461c 原改动（AboutSection +26/-1 重新加回 whats-new）内容在新基线已存在：main 侧仍有 WhatsNewDialog/WHATS_NEW_ENTRIES/entriesUpTo/useMemo 导入。规格「重放映射」第 21 行与 HOW_TO 文档 L177 均记录了该丢弃。 |
| A3 | passed | brief.md | A3: 冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3：白名单文件保留 fork 侧；14 个重叠共享文件以上游版本为基础叠加回 fork 必要语义 —— `src-tauri/src/lib.rs` 保留「移除 Updater 插件注册 + 托盘左键单击切换 + connectivity_test 命令注册」并叠加上游 macOS LaunchServices 重启改动；`src-tauri/src/commands/settings.rs` 以上游重启命令改动为基础，保持 fork 的 connectivityTest sanitize 隔离与相关命令注册；`src-tauri/src/settings.rs` 保留 fork `VisibleSidebarPanels` 字段族并叠加「项目切换器默认隐藏」新默认值；`src/App.tsx` 保留 fork 批量探针状态提升、批量检测门控与 `IS_FORK_BUILD`+`isTauri` setTitle 守卫并叠加上游项目切换器改动；`src/components/settings/AboutSection.tsx` 保留 fork「检查更新/发行说明指向 tunecc Releases + 禁用应用内更新器」并叠加上游 star prompt 独立可关闭条；`src/components/settings/sections/GeneralSection.tsx` 保留 fork 面板可见性 pill 行并叠加上游项目切换器默认值；4 个 locales 保留 fork `devpanel` 与 `connectivityTest`/`connectivityCheck` 键段并接收上游 star prompt 新键；4 个版本文件按 fork 版本号 4.0.4-1。 | 逐文件 delta 双向差集（上游 d35726e2→v4.0.4 对比 pre-sync-v404→main，-U0 增删行多重集）：commands/settings.rs、lib.rs、settings.rs、App.tsx、AboutSection.tsx、GeneralSection.tsx、RequestLogTable.tsx、CHANGELOG.md 与 4 个 src/i18n/locales/*.json 全部 upstreamAddMissing=0/extraAdd=0/upstreamDelMissing=0/extraDel=0；4 个版本文件各 1 行差异且差异就是 4.0.4 vs 4.0.4-1（预期）。fork 语义抽查在位：lib.rs 无任何 updater 引用（git grep -i updater = 0）+ tray::toggle_main_window(L1106) + show_menu_on_left_click(false)(L1134) + commands::connectivity_test_provider_models(L1642) + 上游 restart_process(L2254)/relaunch_macos_bundle(L2270)；settings.rs VisibleSidebarPanels(L93)+visible_sidebar_panels(L467) 与上游 #[serde(default)] show_profile_switcher=false(L421-424/583) 并存，default_show_profile_switcher 已按上游删除；App.tsx useConnectivityProbe(L46/345)+batchTest 门控(L352)+IS_FORK_BUILD&&isTauri setTitle 守卫(L205-208)+上游 ?? false(L1210)；AboutSection.tsx tunecc/cc-switch/releases(L104/110/135) 且无 isDownloading/installUpdateAndRestart/checkUpdate/resetDismiss 残留，保留 whats-new 按钮+WhatsNewDialog(L21/289)+star 可关闭条(Star/X/starPromptDismissed/recentEntries)；GeneralSection fork pill 行(L259-319) 与上游 showProfileSwitcher ?? false(L134) 并存；4 locales 均有 settings.starOnGithub 与 connectivityTest/connectivityCheck 键段。冲突标记：git grep -E '^(<<<<<<<\|>>>>>>>\|\\|\\|\\|\\|\\|\\|\\|) ' main -- src src-tauri package.json pnpm-lock.yaml 零命中；出现的 <<<<<<< 仅在 docs/comet 归档文档的描述性文字里，src-tauri/target 下命中的是未跟踪二进制构建产物。connectivityTest sanitize 隔离实际位于 services/provider/live.rs::sanitize_claude_settings_for_live（本轮未改动，测试 3446 passed 内含其断言）。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.4-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。 | package.json/tauri.conf.json/Cargo.toml 均 "version": 4.0.4-1，Cargo.lock 的 name="cc-switch" 段 version=4.0.4-1（上游 v4.0.4 为 4.0.4）；database/mod.rs L53 SCHEMA_VERSION=21（上游 v4.0.4 同处为 20）；schema.rs 的 20 => 分支(L586) 幂等补齐 mcp_servers.enabled_mcode/enabled_pi 与 skills.enabled_mcode 并 set_user_version(21)，18 => 分支同时保留上游 enabled_mcode 补列与 fork migrate_v18_to_v19 的 website_url_2(L571/1674)，19 => 取上游 enabled_pi。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边栏面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | git diff --name-status pre-sync-v404 main 只含上游 20 个文件（16 改 + 4 新增：3 份 v4.0.4 发行说明 + src/whats-new/4.0.4.json）+ HOW_TO 文档 + 本 change 3 个产物，说明没有任何 fork 专属文件被重放回退；逐项抽查在位：__CCS_FORK_BUILD__（forkBuild.ts/vite.config.ts:32/vitest.config.ts:7/vite-env.d.ts）与 DevPanel+DEV_PANEL_ENABLED(__CCS_DEV_PANEL__, CCS_DEV_PANEL=1)；visibleSidebarPanels（前端 4 文件 + 后端持久化）；extractModelBadge/ModelQuickSwitch；ClaudeFormFields fallback 快捷区(L251/871/972)；ProviderList 置顶/置底与插入第二位；forkOfficialAllowlist+forkPresetFilter/filterForkPresets+hidden；逐模型连通性后端 services/connectivity_test + commands/connectivity_test.rs(2 命令，mod.rs 注册) + 前端 20 文件，旧 stream_check 后端仅剩 schema.rs 建表(L251)；websiteUrl2 前端 18 / website_url_2 后端 17；tray toggle_main_window(lib.rs+tray.rs)；ProviderImportEntry(6 文件)；更新器禁用（lib.rs/capabilities 0 引用、src/lib/updater.ts checkForUpdate 恒返回 up-to-date、后端 install_update_and_restart 恒 Ok(false)）；release.yml jobs.release.if = github.repository=='tunecc/cc-switch' && contains(github.ref_name,'-') 且矩阵仅 windows-2022/macos-14；README.md 为 'CC Switch (Fork)' fork 差异说明并链接 HOW_TO 文档(L144)。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。 | git show main:.comet/config.yaml → default_workflow: native，workflows 含 native 与 classic；工作树与 main 无差异（git diff main -- .comet/config.yaml 为空），且该文件不在 pre-sync-v404→main 的改动清单里，未被历史重放改写。 |
| A7 | passed | brief.md | A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格 `specs/upstream-sync/spec.md` 已重写为同步后的完整状态。 | docs/HOW_TO_REBASE_UPSTREAM.md 在 8723cb79 内被修订并含全部 v4.0.4 条目：CHANGELOG.md(L161 fork 侧无改动取上游)、lib.rs(L172 上游 restart_process/relaunch_macos_bundle 为基础，勿复活更新器)、commands/settings.rs(L173 按上游落地)、settings.rs(L174 取上游 show_profile_switcher 默认 false)、AboutSection.tsx(L177 star 可关闭条 + fork 更新器禁用 + c8c8461c 空提交说明 + 冲突解法)、GeneralSection.tsx(L179)、App.tsx(L180)。完整目标规格 specs/upstream-sync/spec.md 已整份重写为同步后状态（含基线 a29a4f38、冲突面 14 文件、版本号 4.0.4-1、SCHEMA_VERSION 21、重放映射与 4 处冲突解法、delta 保真口径、交付时序改为归档后步骤）。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | 复用 Runtime 检查 typecheck：status=passed、exitCode=0、argv=[pnpm,typecheck]、cwd=verificationRoot、日志显示 '> cc-switch@4.0.4-1 typecheck / tsc --noEmit' 且无错误输出；运行时间 12:30:23Z 晚于候选 HEAD 8c3c3fa5(12:28:50Z)，candidateId 与本轮一致，工作树仅 Runtime 自管的 comet-state.yaml 为 M（规格已豁免），证据未过期。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过。 | 复用 Runtime 检查 test-unit：passed/exitCode=0，argv=[pnpm,test:unit]；日志 Test Files 207 passed (207)，Tests 2444 passed (2444)，无 skipped/failed，同一 candidateId 与 HEAD 之后执行。 |
| A10 | passed | brief.md | A10: `cargo check` 通过。 | 复用 Runtime 检查 cargo-check：passed/exitCode=0，argv=[cargo,check,--manifest-path,src-tauri/Cargo.toml]；日志 'Checking cc-switch v4.0.4-1' + 'Finished dev profile'，0 条 warning。 |
| A11 | passed | brief.md | A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | 复用 Runtime 检查 cargo-test：passed/exitCode=0，argv=[cargo,test,--manifest-path,src-tauri/Cargo.toml,--,'--skip',update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active]，与 brief A11/规格跳过口径逐字一致；日志 17 个测试二进制全 ok，lib 测试 3446 passed/0 failed/9 ignored/1 filtered out（跳过恰为 1 条），无 FAILED/panic。跳过项在全仓只有 services/provider/mod.rs:2160 一处同名函数，与 --skip 口径对应；9 条 ignored 与 pre-sync-v404 基线一致（s3.rs 2、session_usage_codex.rs 1 等），未扩大跳过列表。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 10617 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 29643 ms |
| cargo check | check --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 4239 ms |
| cargo test (skip known env exception) | test --manifest-path src-tauri/Cargo.toml -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | . | passed | 0 | 31281 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- git 同步结果核对: passed — merge-base == a29a4f38 == v4.0.4^{commit}；v4.0.4..main 计数 121；5ae6ad38 不在 main；工作树无冲突标记残留；.comet/config.yaml 未变
- 重叠文件增删行集合比对: passed — 12 个文件 upstream 增删行与合并后增删行双向差集为空（一行不缺、一行不丢）
- pnpm typecheck: passed — tsc --noEmit 退出 0
- pnpm test:unit: passed — 207 文件 / 2444 用例全部通过
- cargo check: passed — cc-switch v4.0.4-1 通过，Cargo.lock 版本联动完成
- cargo test (skip known env exception): passed — 退出码 0，17 个 test result 全部 0 failed，3631 passed，1 filtered out（显式跳过的环境例外用例）
- 已知限制: 交付（--force-with-lease 推送 origin/main、在归档提交上创建并推送 annotated tag v4.0.4-1）按 2026-10-08 用户决定不在本轮验收项内：归档提交在验收之后才存在，无法在 Verify 时取证；执行后由 Builder 把 main/origin/main 一致性、tag 指向与 fork Release CI 运行结果回报用户
- 已知限制: cargo test 显式跳过 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active（本机 cc-switch 运行时占用代理端口 15721 的既有环境例外，上游测试需绑定真实端口），沿用历次同步口径
- 已知限制: 同步基线锁定 tag v4.0.4（a29a4f38）；v4.0.4 之后的 11 个上游 post-release 提交（含 upstream/main HEAD 5ae6ad38）按已确认范围留在下次同步
- 已知限制: 原 c8c8461c 提交在新基线下成为空提交被 git 丢弃（内容已存在于上游与前一提交的冲突解法中），非 fork 改动丢失，已在完整目标规格「重放映射」逐条记录

## 阻塞项

_无。_

## 风险与跳过的工作

- 目标规格「重放映射」L20 括注写作 `git rev-list --count v4.0.4..main` == 120，实测为 122（120 条重放 + 同步提交 8723cb79 + 文档提交 8c3c3fa5）。实质结论（120 条按序落地、1 条空提交被丢弃）经独立核对成立，仅该数字括注漏算新增提交且未随自身重写更新，建议归档提交时一并修正，不影响行为。
- 规格/概述 L7 与 L16 以现在时描述「origin/main 与本地一致」「存在 annotated tag v4.0.4-1」；本轮按 Decisions 把推送与打 tag 移出验收项，故 main 目前领先/偏离 origin 且无该 tag 属预期，不是缺陷，但归档交付完成后才成立。
- brief A3 把 fork 的「connectivityTest sanitize 隔离」归到 src-tauri/src/commands/settings.rs；该语义实际在 services/provider/live.rs::sanitize_claude_settings_for_live（含测试），commands/settings.rs 只承载上游 restart_process 改动与 fork 更新器占位命令。语义无丢失，属描述定位不准。
- brief/spec 称「4 个 locales 保留 devpanel 键段」，实际 devpanel 仅存在于 zh.json 与 en.json；ja 与 zh-TW 在 pre-sync-v404 基线同样没有该键段（git show pre-sync-v404 对比为 0），即本轮无回归，仅文档口径偏宽。
- 旧 stream_check 前端残留：src/lib/api/connectivity-check.ts:28 仍 invoke("stream_check_provider")、src/hooks/useStreamCheck.ts 仍在，而后端命令已在 fork 历史中移除，除 tests/components/SwitchModePanel.test.tsx 的 mock 外无任何调用方（死代码）。该状态与 pre-sync-v404 完全一致（本轮未触及），不属本轮丢失，但规格「链路已移除」的表述与文件残留略有出入。
- src-tauri/src/services/provider/live.rs:1499 存在 unused import 警告（cargo test 日志首部），来自 fork 历史而非本轮改动，cargo check 通过且未列为错误。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 0 | 0 | recovery | — | Capability association revoked through comet native spec disassociate | 2026-10-08T11:03:54.854Z |
| 2 | 1 | 0 | recovery | — | Native confirmed acceptance criteria changed | 2026-10-08T11:49:41.375Z |
| 3 | 1 | 1 | pass | — | 候选 655fd3a7（main=8c3c3fa5，基于 v4.0.4=a29a4f38）经独立取证：11 项验收全部通过。merge-base 与基线正确、post-release 11 个上游提交确不在 main；121 条 fork 提交按序重放为 120 条 + 已记录的 1 条空提交丢弃 + 2 条本轮提交，顺序逐位保真、无重复；14 个重叠共享文件的上游 delta 与合并后 delta 双向差集全为 0（版本文件仅 4.0.4 vs 4.0.4-1 一行差异），fork 语义（无 updater、托盘左键、connectivity_test、VisibleSidebarPanels、批量探针门控、setTitle 守卫、tunecc releases、star 可关闭条与 whats-new 并存）逐项在位且零冲突标记；四处版本号 4.0.4-1、SCHEMA_VERSION 21 与 v20→v21/v18→v19 迁移完整；.comet/config.yaml 未被改写；流程文档与目标规格已按本轮修订；4 项构建/测试为 Runtime 正式检查记录，针对当前 HEAD 与 candidateId、工作树仅 Runtime 自管状态文件脏，证据未过期，直接复用未重跑。origin/main 同步与 tag v4.0.4-1 按 Decisions 属归档后交付步骤，本轮不作断言。存在 7 条文档口径/死代码类风险，均不构成语义丢失。 | 2026-10-08T13:01:29.400Z |



## 结论

候选 655fd3a7（main=8c3c3fa5，基于 v4.0.4=a29a4f38）经独立取证：11 项验收全部通过。merge-base 与基线正确、post-release 11 个上游提交确不在 main；121 条 fork 提交按序重放为 120 条 + 已记录的 1 条空提交丢弃 + 2 条本轮提交，顺序逐位保真、无重复；14 个重叠共享文件的上游 delta 与合并后 delta 双向差集全为 0（版本文件仅 4.0.4 vs 4.0.4-1 一行差异），fork 语义（无 updater、托盘左键、connectivity_test、VisibleSidebarPanels、批量探针门控、setTitle 守卫、tunecc releases、star 可关闭条与 whats-new 并存）逐项在位且零冲突标记；四处版本号 4.0.4-1、SCHEMA_VERSION 21 与 v20→v21/v18→v19 迁移完整；.comet/config.yaml 未被改写；流程文档与目标规格已按本轮修订；4 项构建/测试为 Runtime 正式检查记录，针对当前 HEAD 与 candidateId、工作树仅 Runtime 自管状态文件脏，证据未过期，直接复用未重跑。origin/main 同步与 tag v4.0.4-1 按 Decisions 属归档后交付步骤，本轮不作断言。存在 7 条文档口径/死代码类风险，均不构成语义丢失。
