---
generated_from_state_version: 22
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 2
- 迭代: 6
- 验证器尝试次数: 1
- 完成时间: 2026-10-11T01:39:05.494Z
- 摘要: 12/12 全部独立复核通过。核心数字全部自己重算：merge-base = df40d53c、fork 提交数 133 前后一致、主题序列逐行 diff 完全相同、patch-id 130/133 相同且 3 处差异均核对为版本号替换与上下文位移（无 fork 语义丢失）、A12 双向差集 34 文件全为 0、四处版本号 4.0.8-1、SCHEMA_VERSION 21 且 v20→v21 幂等修复迁移完整、.comet/config.yaml blob cebdcda6 与同步前一致、四项构建测试独立执行全部通过（typecheck / 2644 单测 / cargo check / 3771 cargo 测试）。fork 魔改语义逐项抽查无丢失：lib.rs 无 tauri_plugin_updater、托盘左键切换与两条 connectivity_test 命令注册并存；settings.ts 无 installUpdateAndRestart 复活；SettingsPage 上游打开日志按钮 + v4.0.7 滚动定位 effect + fork DevPanel 两段三者并存；ClaudeFormFields 上游 Header 覆盖取模型 + fork 兜底直达区/SearchableModelPicker 并存；4 locales 上游 officialModelsReason 九 code 与 openLog/openLogFailed 落地、fork connectivityTest 键段保留、devpanel 段 ja/zh-TW 缺失确认为同步前既有状态。上游六类功能全部落地并抽查通过。交付尚未执行（origin/main = 809d4e4b、本地无 v4.0.8-1 tag），符合规格「交付在归档后执行」的定位，不计为验收失败。工作区未提交改动仅 version 三文件 + Cargo.lock + 白名单文档 + change 产物，与规格一致。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 df40d53c（tag v4.0.8 指向的提交），`git log v4.0.8..main` 只包含 fork 提交。 | git merge-base main upstream/main = df40d53c36b604e044b4d5b9091aeb961aa56990，与 upstream/main、v4.0.8^{commit} 三者一致；git rev-list --count v4.0.8..main = 133；git log --format='%an <%ae>' v4.0.8..main \| sort -u 只有 Tune <176898395+tunecc@users.noreply.github.com>；git rev-list --merges --count v4.0.8..main = 0（线性历史）；逐条 git merge-base --is-ancestor df40d53c 验证 133 个提交全部为 df40d53c 后代，无上游提交落在区间内。 |
| A2 | passed | brief.md | A2: rebase 前 v4.0.7..main 的 133 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。 | 独立重算：git rev-list --count v4.0.7..pre-sync-v408 = 133、v4.0.8..HEAD = 133；git log --reverse --format='%s' 两侧逐行 diff 完全一致（无遗漏/重复/顺序变化）。自己用 git show \| git patch-id --stable 重算 133+133 个 patch-id：130 个相同，3 个不同，与规格一致。逐个 diff 三对 patch：9aaa5747→f0152de2 与 83a9d90d→519d210d 的新增行逐字节相同，唯一差异是被替换的版本号删除行（4.0.7→4.0.8，因新基线版本号不同）；00b2807c→ecae8f66 为上下文位移（SettingsPage 增加 24 行导致 hunk header 行号偏移），新增/删除行逐字节相同。三对的文件级 blob diff 进一步确认：519d210d 相对 83a9d90d 在 SettingsPage 只多出 FolderOpen 导入、handleRevealLogFile useCallback 与 actions/Button 三段（共 24 行），无 fork 行丢失。空提交扫描：两侧均无 0 文件变更提交，也无 merge 提交，规格「无空提交被丢弃」成立。 |
| A3 | passed | brief.md | A3: 12 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.8-1`（`Cargo.lock` 的 fork 条目、`package.json`/`Cargo.toml`/`tauri.conf.json` 的 version），共享代码以上游 v4.0.8 为基础叠加回 fork 必要语义，且上游「取模型列表带上 Header 覆盖」「OpenCode 表单用请求头拉取模型」「诊断日志打开日志按钮」「官方模型列表不可用原因与自动恢复」「桌面版 Codex CLI 兜底」「暗色文字降亮」等改动全部落地。 | 12 个重叠文件全部经 git diff v4.0.7 pre-sync-v408 证实 fork 侧确有改动（package.json 25 行、Cargo.toml 36、tauri.conf.json 49、Cargo.lock 332、lib.rs 105、ClaudeFormFields 584、SettingsPage 58、settings.ts 15、4 locales 各 572-591）。共享文件叠加逐项核对：lib.rs 上游 +1（commands::reveal_app_log_file 注册）+ fork 三段语义（tauri_plugin_updater 0 命中、show_menu_on_left_click(false) 与 TrayIconEvent::Click 左键 Up 调 tray::toggle_main_window 在 1110/1138 行、connectivity_test_provider_models 与 connectivity_probe_provider 两条命令注册在 1653-1654）三者并存；SettingsPage 上游「打开日志」按钮（FolderOpen 导入、handleRevealLogFile、SettingsRow actions prop，+24）、v4.0.7 滚动定位 effect（isTextEditableTarget/hasSettings/appConfigScrollTarget）与 fork DevPanel 两段（IS_FORK_BUILD&&DEV_PANEL_ENABLED 守卫的 Fork 按钮 532-543、<DevPanel> 挂载 601-603）三者并存；ClaudeFormFields 上游 modelFetchRequestHeaders 导入与 {requestHeaders: modelFetchRequestHeaders(localProxyHeadersOverride)} 传参（341 行）+ localProxyHeadersOverride 进依赖数组（358 行）与 fork fallbackQuickAccessSection、hasCustomModelMapping、SearchableModelPicker 并存；settings.ts 上游 revealAppLogFile（+4）且 fork 移除的 installUpdateAndRestart 未复活（0 命中）。版本/锁文件只差版本号一行：worktree diff 显示 package.json/Cargo.toml/tauri.conf.json/Cargo.lock 各 1+/1-，且唯一改动为 4.0.7-1→4.0.8-1；Cargo.lock 的 cc-switch 条目 dependencies 相对上游少 tauri-plugin-updater（fork 移除自动更新的既定结果），上游 zip 2.4.2 在同步前同为一个无依赖方的孤立条目。上游六类改动全部落地（见 A12 与 spec 抽查）：取模型 Header 覆盖、OpenCode 请求头拉取、打开日志按钮、officialModelsReason 原因与 noticeReasons 自动恢复、桌面版 Codex CLI 兜底、暗色文字降亮。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.8-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。 | 四处版本号均为 4.0.8-1：package.json:3、src-tauri/Cargo.toml:3、src-tauri/tauri.conf.json:4、src-tauri/Cargo.lock 的 cc-switch 条目 version。SCHEMA_VERSION 在 src-tauri/src/database/mod.rs:53 仍为 21（上游 df40d53c 为 20）。schema.rs 的 20 => 分支（v20→v21 幂等修复迁移）完整保留：mcp_servers 幂等补齐 enabled_mcode/enabled_pi、skills 幂等补齐 enabled_mcode，并保留 v18→v19 双语义合并（上游 mcode + fork website_url_2）与 v19→v20 取上游 enabled_pi。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | 规格「fork 魔改保留清单」共 13 个 bullet（brief 的 A5 表述把「上游 tag 发版跳过」与「fork CI 裁剪」拆开故读作 14 项；规格自身与上一轮归档规格一致为 13 项），逐项核对：1 产品名 CC Switch（tauri.conf.json productName）+ DevPanel（src/components/devpanel/DevPanel.tsx 存在，IS_FORK_BUILD/DEV_PANEL_ENABLED 门控在 SettingsPage 532/601）；2 侧边面板可见性（settings.rs visible_sidebar_panels 3 处、Sidebar.tsx visibleSidebarPanels 3 处）；3 模型徽章与快捷切换（ProviderCard.tsx extractModelBadgeForProvider 2 处、ModelQuickSwitch/ModelQuickSwitchDialog.tsx 存在）；4 Claude 兜底直达区（fallbackQuickAccessSection 2 处、hasCustomModelMapping 在 253 行）；5 右键置顶/置底（ProviderList.tsx applyQuickSort 5 处）与新建插入第二位（mutations.ts sortIndex 9 处）；6 官方预设过滤（forkOfficialAllowlist.ts 含 mcode: [] 段、forkPresetFilter 被 4 个表单 import）；7 逐模型连通性测试（services/connectivity_test/ 三文件、commands/connectivity_test.rs、ConnectivityTestDialog/ConnectivityDetailDialog/ConnectivityBadge/connectivityEntry.ts、useConnectivityProbe/useConnectivityTest、connectivity-check.ts/connectivity-test.ts/connectivityTestSettings.ts 及 5 个测试文件全部在树；4 个 locale 均有 connectivityTest 键段；旧 stream_check 命令链路已删而 stream_check_logs 表结构保留在 schema.rs:251）；8 双官网链接（dao/providers.rs website_url_2 13 处、schemas/provider.ts websiteUrl2）；9 托盘左键切换（tray.rs toggle_main_window + lib.rs 1138 show_menu_on_left_click(false)）；10 跨应用导入（ProviderImportEntry.tsx、providerImport.ts、useProviderImportApply 被 4 个表单接线）；11 禁用应用内更新器（capabilities/default.json updater 0 命中、AboutSection.tsx 指向 tunecc/cc-switch releases、lib.rs 与 commands/settings.rs 的 tauri_plugin_updater 均 0 命中、install_update_and_restart 仅存空壳不执行安装、settings.ts installUpdateAndRestart 0 命中）；12 上游 tag 发版跳过 + fork CI 裁剪（release.yml 仅 windows-2022/macos-14、unsigned）；13 README fork 说明（README.md 标题 CC Switch (Fork) 与基于 farion1231 的说明）。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。 | git hash-object .comet/config.yaml = cebdcda66dbdcfde8b8de9331650753fb138b223，与 HEAD tree 中该文件 blob 及规格记录值一致；git diff pre-sync-v408 HEAD -- .comet/config.yaml 为空（历史重放未改写）；内容仍为 default_workflow: native、workflows: [native, classic]、ambient_resume: true、native.artifact_root: docs。 |
| A7 | passed | brief.md | A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。 | docs/HOW_TO_REBASE_UPSTREAM.md 工作树 diff 恰为 5 个共享文件行追加 v4.0.8 语义（src/i18n/locales 四语言行、src/lib/api/settings.ts、src-tauri/src/lib.rs、src/components/settings/SettingsPage.tsx、src/components/providers/forms/ClaudeFormFields.tsx）+ 末尾 1 条「仅上游改动、fork 侧从未触碰的文件不进入上表」说明，共 6 个新增行。逐条读内容并与实际代码核对：lib.rs 行称上游 v4.0.8 加一行 commands::reveal_app_log_file 注册（实际 df40d53c diff 为 +1，注册在 1414 行）；settings.ts 行称上游加 revealAppLogFile() 绑定 +4 行（实际 +4，112-114 行）；SettingsPage 行称上游加「打开日志」按钮（FolderOpen 导入、handleRevealLogFile、actions prop，+24 行，实际 +24）；ClaudeFormFields 行称上游让取模型带上本地代理 Header 覆盖（modelFetchRequestHeaders 导入、requestHeaders 传参、localProxyHeadersOverride 进依赖，+22/−2，实际 +20/−2）；locales 行称上游新增 officialModelsReason 九种 code（4 locale 各 +11）与 openLog/openLogFailed（各 +2）并改写 en/ja quotaDisplayHelp 与 en/ja/zh-TW codexHistoryUnify*.hint，实际各 locale +13/+15/+15/+14 与之一致，且 devpanel 段只存在于 zh/en 的说明准确（git show pre-sync-v408:src/i18n/locales/ja.json \| grep -c devpanel = 0，确属既有状态）。change 产物 specs/upstream-sync/spec.md 已按同步后状态重写（基线 df40d53c、133 提交、12 重叠文件、重放映射、版本号 4.0.8-1、上游 10 提交范围逐条列出）；全局规格 docs/comet/specs/upstream-sync/spec.md 与 change 规格内容一致（仅版本轮次表述不同）。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | 独立执行 pnpm typecheck（tsc --noEmit），退出码 0，无任何诊断输出。Runtime 检查 c4 同样 passed。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过。 | 独立执行 pnpm test:unit：Test Files 217 passed (217)，Tests 2644 passed (2644)，0 failed。Runtime 检查 c5 同样 passed。 |
| A10 | passed | brief.md | A10: `cargo check` 通过。 | 独立执行 cargo check（cwd src-tauri）：Finished dev profile，退出码 0。Runtime 检查 c6 同样 passed。 |
| A11 | passed | brief.md | A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | 独立执行 cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active（cwd src-tauri）：各 test result 汇总 passed=3771，failed=0，仅 1 filtered out（即被显式跳过的代理端口占用用例），9 ignored。Runtime 检查 c7 同样 passed。 |
| A12 | passed | brief.md | A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 790ed800→df40d53c」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。 | 自己写脚本重算，未复用 Builder 数字。对 34 个上游/fork 重叠文件（git diff --name-only 790ed800 df40d53c 与 pre-sync-v408 HEAD 的交集，其中 12 个为规格定义的「冲突面」、22 个为上游独有改动文件），用 git diff -U0 分别取「上游 790ed800→df40d53c」与「同步前 pre-sync-v408→同步后」两份 diff 的增/删行集合（按行 strip 后取集合）双向求差：上游新增行缺失合计 0、上游删除行缺失合计 0、fork 新增行丢失合计 0、fork 删除行丢失合计 0，34/34 文件双向差集全为 0。同时用 HEAD 版本与含工作树的版本各算一遍（后者覆盖未提交的版本号三文件与 Cargo.lock、白名单文档），结果均为 0 差异。22 个上游独有文件再逐一 git diff df40d53c HEAD 比对：全部 0 行差异（字节级与上游一致），含 codex_config.rs、commands/config.rs、mode/{controller,stack}.rs、services/provider/{codex_direct,codex_official_models}.rs、forms/{CodexFormFields,OpenCodeFormFields}.tsx、mode/SwitchModePanel.tsx、types/proxy.ts、index.css、lib/api/model-fetch.ts、design-system.html、CHANGELOG.md、release-notes/v4.0.8-* 与 v4.0.7-*、whats-new/4.0.8.json、5 个测试文件。4 个版本/锁文件的差异为刻意取舍且已记录在规格与 §4：只取 fork 版本号 4.0.8-1（上游写 4.0.8），各仅版本号一行。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| git-structure-verify | rev-parse v4.0.8^{commit} main upstream/main | . | passed | 0 | 13 ms |
| fork-commits-only | log --format=%an v4.0.8..main | . | passed | 0 | 69 ms |
| no-conflict-markers | diff --cached --check | . | passed | 0 | 14 ms |
| frontend-typecheck | typecheck | . | passed | 0 | 10771 ms |
| frontend-unit-tests | test:unit | . | passed | 0 | 36220 ms |
| rust-check | check | src-tauri | passed | 0 | 277 ms |
| rust-tests | test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 33291 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- replay-integrity: passed — 重放前后 git rev-list --count 均为 133；主题序列逐行 diff 为空；patch-id 130/133 相同，3 个差异逐一核对增删行。
- zero-conflict-markers: passed — 最终态 git grep -I '^<<<<<<< |^>>>>>>> ' 工作树与 HEAD 树均为 0 命中；add 前逐文件断言零标记。
- frontend-typecheck: passed — pnpm typecheck 无错误输出。
- frontend-unit-tests: passed — pnpm test:unit：217 个测试文件、2644 个用例全部通过。
- rust-check: passed — cargo check Finished dev profile；Cargo.lock 版本号联动为 4.0.8-1。
- rust-tests: passed — cargo test -- --skip <端口例外> 汇总 3771 passed / 0 failed。
- overlap-fidelity-diff: passed — 12 个重叠文件双向差集：8 个四项计数全 0，4 个版本文件各仅 1 行 fork 版本号差异。
- 已知限制: rebase 已改写 main 历史，origin/main 仍指向 809d4e4b（v4.0.7-1）；推送到 origin 属 Q1 授权的交付步骤，须等验收通过并归档后执行，不在本轮候选内。
- 已知限制: 本地 tag v4.0.8-1 尚未创建，同样属交付步骤。
- 已知限制: cargo test 的 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active 沿用既有例外跳过（本机 cc-switch 运行时占用代理端口 15721），属上游测试设计。
- 已知限制: fork 历史提交 83a9d90d 自身 tree 带未清理冲突标记（SettingsPage 6 处、4 locales 各 2 处、ProviderList.test 1 处），由后续 fork 提交 00b2807c 清掉；这是 fork 历史既有事实，最终态全树为 0 命中。
- 已知限制: A12 的 4 个版本文件各有 1 行刻意差异（fork 版本号 4.0.8-1 vs 上游 4.0.8），已在完整目标规格记录。
- 已知限制: 交付步骤需访问 GitHub 远端（force-with-lease 推送与 tag 推送），未在本轮验证。

## 阻塞项

_无。_

## 风险与跳过的工作

_未报告风险。_

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-11T01:05:29.210Z |
| 2 | 1 | 0 | recovery | — | Builder handoff Runtime checks failed: c3 | 2026-10-11T01:09:07.223Z |
| 2 | 2 | 0 | recovery | — | Builder handoff Runtime checks failed: c3 | 2026-10-11T01:10:36.821Z |
| 2 | 3 | 0 | recovery | — | Builder handoff Runtime checks failed: c3 | 2026-10-11T01:12:05.470Z |
| 2 | 4 | 0 | recovery | — | Builder handoff Runtime checks failed: c3 | 2026-10-11T01:13:40.137Z |
| 2 | 5 | 0 | recovery | — | Builder handoff Runtime checks failed: c3 | 2026-10-11T01:15:34.155Z |
| 2 | 5 | 0 | recovery | — | 修正 Builder 检查计划的工具错误并回到 Build 重交。同步实现本身已完成且四项构建检查真实通过；唯一失败的 c3 是我把断言式命令 '! git grep ...' 写进 argv，而 Runtime 按 executable + argv 直拼执行、不经 shell，导致该命令永远 exit 1（记录为 git ! git grep ...）。实现无需改动，需求与范围不变。重交时 c3 改为 'git diff --cached --check'（已实测：干净树 exit 0，人为插入冲突标记 exit 2 并能打印 leftover conflict marker）。 | 2026-10-11T01:18:22.619Z |
| 2 | 6 | 1 | pass | — | 12/12 全部独立复核通过。核心数字全部自己重算：merge-base = df40d53c、fork 提交数 133 前后一致、主题序列逐行 diff 完全相同、patch-id 130/133 相同且 3 处差异均核对为版本号替换与上下文位移（无 fork 语义丢失）、A12 双向差集 34 文件全为 0、四处版本号 4.0.8-1、SCHEMA_VERSION 21 且 v20→v21 幂等修复迁移完整、.comet/config.yaml blob cebdcda6 与同步前一致、四项构建测试独立执行全部通过（typecheck / 2644 单测 / cargo check / 3771 cargo 测试）。fork 魔改语义逐项抽查无丢失：lib.rs 无 tauri_plugin_updater、托盘左键切换与两条 connectivity_test 命令注册并存；settings.ts 无 installUpdateAndRestart 复活；SettingsPage 上游打开日志按钮 + v4.0.7 滚动定位 effect + fork DevPanel 两段三者并存；ClaudeFormFields 上游 Header 覆盖取模型 + fork 兜底直达区/SearchableModelPicker 并存；4 locales 上游 officialModelsReason 九 code 与 openLog/openLogFailed 落地、fork connectivityTest 键段保留、devpanel 段 ja/zh-TW 缺失确认为同步前既有状态。上游六类功能全部落地并抽查通过。交付尚未执行（origin/main = 809d4e4b、本地无 v4.0.8-1 tag），符合规格「交付在归档后执行」的定位，不计为验收失败。工作区未提交改动仅 version 三文件 + Cargo.lock + 白名单文档 + change 产物，与规格一致。 | 2026-10-11T01:39:05.494Z |



## 结论

12/12 全部独立复核通过。核心数字全部自己重算：merge-base = df40d53c、fork 提交数 133 前后一致、主题序列逐行 diff 完全相同、patch-id 130/133 相同且 3 处差异均核对为版本号替换与上下文位移（无 fork 语义丢失）、A12 双向差集 34 文件全为 0、四处版本号 4.0.8-1、SCHEMA_VERSION 21 且 v20→v21 幂等修复迁移完整、.comet/config.yaml blob cebdcda6 与同步前一致、四项构建测试独立执行全部通过（typecheck / 2644 单测 / cargo check / 3771 cargo 测试）。fork 魔改语义逐项抽查无丢失：lib.rs 无 tauri_plugin_updater、托盘左键切换与两条 connectivity_test 命令注册并存；settings.ts 无 installUpdateAndRestart 复活；SettingsPage 上游打开日志按钮 + v4.0.7 滚动定位 effect + fork DevPanel 两段三者并存；ClaudeFormFields 上游 Header 覆盖取模型 + fork 兜底直达区/SearchableModelPicker 并存；4 locales 上游 officialModelsReason 九 code 与 openLog/openLogFailed 落地、fork connectivityTest 键段保留、devpanel 段 ja/zh-TW 缺失确认为同步前既有状态。上游六类功能全部落地并抽查通过。交付尚未执行（origin/main = 809d4e4b、本地无 v4.0.8-1 tag），符合规格「交付在归档后执行」的定位，不计为验收失败。工作区未提交改动仅 version 三文件 + Cargo.lock + 白名单文档 + change 产物，与规格一致。
