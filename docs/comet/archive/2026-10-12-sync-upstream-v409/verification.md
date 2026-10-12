---
generated_from_state_version: 17
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 3
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-12T12:21:50.841Z
- 摘要: 第 2 轮独立验收结论：pass，A1–A12 全部通过。候选 ba963986 的实质保真成立且记录已可复现——我用规格固定算法对 33 个重叠文件独立复算，得到与规格一字不差的 23 个双侧全零 / 上游缺失 19 行 / fork 缺失 10 行，且 19+10 行的文件与文本逐条对得上，归类理由经代码取证属实（宿主键确由上游 v4.0.9 自身删除、apiFormatHelp/DirectModeFormatWarning 在 fork 位置渲染）。返工三项独立复核通过：4 个 locale 无任何同名重复键、16 处 inactiveFieldsHint 与 v4.0.9 逐字一致且无 {{count}} 残留、GrokBuildProviderForm.tsx 表格行只剩 1 行、fork 键段按 key 比对零缺失。Git 结构（merge-base=8845b1ef、区间 137、主题序列逐行一致、patch-id 119/16 分类精确对应、61 个上游独有文件 blob 与 v4.0.9 全同、零冲突标记、.comet/config.yaml blob 未变）、版本号四处 4.0.9-1、SCHEMA_VERSION 21 与 v20→v21 两用例、14 类 fork 魔改在位均已取证；4 条检查我全部复跑，退出码均 0（221 文件/2718 用例；cargo test 17 二进制/3794 通过/0 失败）。剩余风险仅为规格两处措辞精度、v4.0.5 遗留的 ProviderForm 表格重复行、以及交付与归档步骤尚未执行。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 8845b1ef（tag v4.0.9 指向的提交），`git log v4.0.9..main` 只包含 fork 提交。 | 独立取证：`git rev-parse v4.0.9^{commit}`=8845b1ef799aa8810b864b122de6af5f4629de10，`git merge-base main upstream/main`=同一 hash；`git merge-base --is-ancestor v4.0.9 main` 为真。`git rev-list --count v4.0.9..main`=137（135 重放 + 同步提交 707ad2e1 + 修复提交 ba963986），`git log --format=%an v4.0.9..main \| sort -u` 只有 Tune；上游区间 v4.0.8..v4.0.9 的 35 个主题与本区间主题交集为 0，区间内无上游提交。 |
| A2 | passed | brief.md | A2: rebase 前 v4.0.8..main 的 135 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。 | 重放前 `git rev-list --count v4.0.8..pre-sync-v409`=135（pre-sync-v409=cc6e7870）；紧邻同步提交之前 `git rev-list --count v4.0.9..344f8389`=135，即重放后仍是 135，无提交被判定为空丢弃、无重复落地。主题序列逐行比对（`git log --format=%s --reverse` 两份各 135 行）diff 为空且重复主题为 0。patch-id 对照（`git show \| git patch-id --stable` 逐位比对）实测 119 相同 / 16 不同，16 个正是规格列的 12 个冲突对（f0152de2→109ecae4、c26d98cd→5cf29ba8、931dad4e→0836ad02、cff23c3b→26e693be、f5d0cb45→7141f7e1、e0302059→77458dd9、6a4868e0→2a621f3b、8e9f233e→f79aba00、02d6522c→2b75eaf5、519d210d→94eb84c0、040870be→d30dafe8、336aa87c→c677dc73）加 4 个位移对；4 个位移对的增删行逐字节相同（32/32、361/361、56/56、3133/3133 行）。归类与规格「重放映射」完全一致。 |
| A3 | passed | brief.md | A3: 33 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.9-1`，`README.md` 保留 fork 重写版，共享代码以上游 v4.0.9 为基础叠加回 fork 必要语义，且上游「本地路由客户端地址（`proxy_client_host` + `get/set_proxy_client_host` 命令 + 托盘端点口径）」「OpenAI 格式 Claude 上游发 Bearer 并合并 stack 切换」「未匹配工具结果不再以 `role=tool` 发出」「xAI 原生 Responses 无 `call_id` 工具输出重写」「表单说明改 HelpTip 与完整 URL 开关移入高级选项」「模型参数展示与静默回填、取模型对话框可删除」「Codex sub-agent 默认模型与推理强度」「冷启动应用已保存语言」「macOS 本地网络权限描述」「编辑弹窗不再闪 loading」「八组赞助商预设」全部落地。 | 重叠面独立复算：`comm -12` 上游 94 个改动文件与 fork 427 个改动文件得 33 个，与规格清单逐字相同。其余 61 个上游独有文件在 HEAD 的 blob 与 v4.0.9 全部一致（61/61，0 个不同）。功能抽查到位：settings.rs `proxy_client_host` 7 处命中 + lib.rs:1604-1605 两行命令注册 + commands/settings.rs:45 透传保护与 :297 单测 + tray.rs:1959 `get_proxy_client_endpoint_sync`；claude.rs Bearer 分支（:512 is_bearer_only_mode）；transform_codex_chat 的 known_tool_call_ids；transform_codex_responses_xai_sanitize:665 `rewrite_xai_call_id_less_tool_outputs`；shared/{FullUrlToggle,DirectModeFormatWarning}.tsx 与 index.ts 导出并集（含 fork SearchableModelPicker）；EndpointField 同时有 `help?`(17) 与 `rightSlot?`(21) 且渲染 rightSlot(76)；FetchedModelPicker `remove: []` 可删除；useModelMetadataFill `silent` 静默回填；ProviderForm subagentModel/subagentReasoningEffort props(2842/2844)；i18n `syncLanguageFromSettings`(index.ts:97) + main.tsx:129；Info.plist NSLocalNetworkUsageDescription；EditProviderDialog:365 `open && !waitingForEditorView`；8 个预设文件的赞助商名各 42–70 处命中；whats-new/4.0.9.json、三语 release-notes、5 张赞助商图标与 openmodel-banner.jpg 均在 HEAD。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.9-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。 | 四处版本号实测：package.json:3、src-tauri/tauri.conf.json:4、src-tauri/Cargo.toml:3、src-tauri/Cargo.lock 的 cc-switch 包条目均为 `4.0.9-1`；`git status` 显示我自己复跑 `cargo check` 后 Cargo.lock 未被改写。src-tauri/src/database/mod.rs:53 `SCHEMA_VERSION: i32 = 21`（对照 v4.0.9 同处为 20）。fork 专属 v20→v21 幂等迁移在 schema.rs:586 的 `20 =>` 分支（补齐 mcp_servers.enabled_mcode/enabled_pi 与 skills.enabled_mcode 后 set_user_version(21)），两个用例 migrate_v20_to_v21_repairs_missing_mcode_column_idempotently(:3952) 与 migrate_v20_to_v21_is_noop_when_all_target_columns_exist(:3991) 存在且随 cargo test 通过。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | 14 类魔改逐项在位：产品名/门控（tauri.windows.conf.json:7 title `CC Switch`、forkBuild.ts IS_FORK_BUILD=__CCS_FORK_BUILD__、DEV_PANEL_ENABLED=__CCS_DEV_PANEL__、SettingsPage.tsx:532 门控渲染 DevPanel）；侧边面板可见性（settings.rs visible_sidebar_panels 3 处，与上游 proxy_client_host 同文件并存；Sidebar.tsx:49/207/250 接线）；模型徽章与快捷切换（ProviderCard.tsx:44/658 ModelQuickSwitchDialog、extractModelBadgeForProvider 2 处）；兜底模型直达区只在经典布局（1151 `if (variant === "stack")` 提前 return，1224 经典 return 才含 {fallbackQuickAccessSection}）；右键置顶/置底（ProviderList.tsx:241/306 applyQuickSort）与新建插入第二位（lib/query/mutations.ts sortIndex 让位）；官方预设过滤（forkOfficialAllowlist.ts、forkPresetFilter.ts + ProviderForm.tsx:77 filterForkPresets；8 个重叠预设文件各含 `hidden?: boolean`）；逐模型连通性测试（commands/connectivity_test.rs、lib.rs:1655-1656 两命令注册、src/lib/api/connectivity-test.ts）；双官网链接（provider.rs website_url_2 13 处、proxy/providers/claude.rs 2 处测试字面量）；托盘左键（lib.rs:1104/1116/1123 + 1138 show_menu_on_left_click(false)、tray.rs:2681 toggle_main_window；HEAD 1100-1140 与 pre-sync-v409 同区间逐行 diff 为空）；跨应用导入（ProviderForm 及 ClaudeDesktop/Pi/GrokBuild/Mcode 变体 + ProviderPresetSelector.extraActions）；禁用应用内更新器（AboutSection.tsx:104/110/135 指向 tunecc Releases、lib/updater.ts 只有 up-to-date/available 状态、capabilities/default.json 无 updater:default、Cargo.lock 与 lib.rs 的 updater 命中数均实测 0、commands/settings.rs updater_builder 0、database/mod.rs stream_check 0）；上游 tag 发版跳过（release.yml:20/216 `contains(github.ref_name, '-')`）；README 九节 fork 差异与打包范围说明；fork CI 矩阵（release.yml:27-28 windows-2022 + macos-14）。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。 | `git rev-parse HEAD:.comet/config.yaml` = cebdcda66dbdcfde8b8de9331650753fb138b223，与工作树 `git hash-object` 同值，与规格记录的同步前 blob 一致；文件内容 `default_workflow: native`、`workflows: [native, classic]`，未被 135 个历史提交重放改写。 |
| A7 | passed | brief.md | A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。 | docs/HOW_TO_REBASE_UPSTREAM.md 有 18 处 v4.0.9 条目并覆盖本轮全部重叠面：lib.rs(173)、commands/settings.rs(174)、settings.rs(175)、tray.rs(202)、ClaudeFormFields(194)、ProviderForm(208)、EndpointField(210)、shared/index(211)、ClaudeDesktop(212)、Pi(213)、GrokBuild(195，本轮新写的整段 v4.0.9 语义只剩这一行)、8 个预设(199)、4 个 locales(131)、版本/锁文件(209)；GrokBuildProviderForm.tsx 全文命中数实测为 1（返工前为 2）。完整目标规格已重写为同步后状态（217 行，含重放映射/冲突解决/落地保真核对/数据库 schema/交付段）。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | Runtime 记录属本候选：state.json 顶层 candidateId=4cdf4839-a19a-4784-988d-0617c55020e2、operationId=f524b74a-4c94-4ca9-9098-b9fb9b0170fc、4 条 checks 全 passed。日志 logs/checks/eff3ed17-*-typecheck.log 为 `cc-switch@4.0.9-1 typecheck / tsc --noEmit` 无输出退出 0。我另在 HEAD=ba963986 复跑 `pnpm typecheck`，退出码 0。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过。 | Runtime 日志 eff3ed17-*-test-unit.log：Test Files 221 passed (221)、Tests 2718 passed (2718)、exit 0。我独立复跑 `pnpm test:unit` 同样 221 文件 / 2718 用例全通过、退出码 0，与规格第 64 行声称数字一致。 |
| A10 | passed | brief.md | A10: `cargo check` 通过。 | Runtime 日志 eff3ed17-*-cargo-check.log `Finished dev profile` 退出 0；我在 src-tauri 复跑 `cargo check` 退出 0，且复跑后 `git status --porcelain` 只有 Runtime 流程文件（comet-state.yaml 修改、verification.md 删除），Cargo.lock 未被改写，说明与 Cargo.toml 的 4.0.9-1 已一致。 |
| A11 | passed | brief.md | A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | Runtime 日志 eff3ed17-*-cargo-test.log 退出 0（argv 含 `-- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`）。我复跑同一命令：17 个测试二进制、3794 passed / 0 failed、退出码 0，与规格数字一致。被跳过用例确在 src-tauri/src/services/provider/mod.rs:2286，属需绑定真实代理端口 15721 的上游用例，跳过理由已在规格「构建与测试」段显式记录，未扩大跳过列表。 |
| A12 | passed | brief.md | A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 df40d53c→8845b1ef」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。 | 按规格固定算法独立复算（四份文本 v4.0.8/v4.0.9/pre-sync-v409/HEAD，逐行 strip、去一个行尾逗号、丢空行与 10 个纯符号噪声行，建多重集，算 (L(v4.0.9)−L(v4.0.8))−L(HEAD) 与 (L(pre-sync-v409)−L(v4.0.8))−L(HEAD)）：实测 **23 个文件双侧为 0、上游缺失 19 行、fork 缺失 10 行**，与规格三个数字完全一致；23 个全零文件清单与规格逐一对应（含 lib/settings/tray/commands-settings/claude.rs、EditProviderDialog、ProviderForm 与三个变体、EndpointField、shared/index、8 个预设、3 个测试）。19 行逐条对上：README 4 行（`<tr>`、`</tr>`、OpenModel `<td width="180">…`、`<td>Thanks to OpenModel…`）、4 个版本/锁文件各 1 行 `4.0.9`、ClaudeFormFields 11 行（规格列的 11 条文本与我算出的 11 条一字不差）。10 行对上：4 个版本/锁文件各 1 行 `4.0.8-1`、4 个 locale 各 1 行 `advancedOptionsHint`、ClaudeFormFields 2 行（`category !== "cloud_provider" && !isXaiOauthPreset ? (` 与 `<p className="text-xs text-muted-foreground">`）。归类属实：advancedOptionsHint/fallbackModelHint/apiFormatHint 在 v4.0.8 有、被上游 v4.0.9 自身删除，终态 apiFormatHelp 存在，故 fork 改写失去宿主键；apiFormatHelp 以 `<HelpTip>` 实测渲染在端点行 Select 之后（ClaudeFormFields:880-890），DirectModeFormatWarning 在端点区之后（:893-894），hasAnyAdvancedValue(:270-276) 保留 `isFullUrl \|\|` 并采用 fork 的 `hasCustomModelMapping`。返工复核：4 个 locale 用 object_pairs_hook 解析后同名重复键对象数为 0，16 处（4 文件×claudeConfig/grokBuild/codexConfig/geminiConfig）inactiveFieldsHint 取值与 v4.0.9 逐字相等且不含 `{{count}}`，修复提交 ba963986 实测删除 9 条带 `{{count}}` 的重复旧行；每文件 inactiveFieldsHint 出现次数为 4，与上游相同。fork 键段按 key 逐个比对：fork 相对 v4.0.8 新增的键在 HEAD 缺失数为 0（devpanel 仍只在 zh/en，connectivityTest/connectivityCheck、searchModels/noModelsFound 全在位）。故 A12 判通过。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 11176 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 43630 ms |
| cargo check | check | src-tauri | passed | 0 | 808 ms |
| cargo test（显式跳过占用代理端口 15721 的上游用例） | test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 34213 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- 返工期：locale 重复键扫描（逐对象查重）: passed — 4 个 locale 无同名重复键；inactiveFieldsHint 四处取值与 v4.0.9 一致
- 返工期：pnpm typecheck 与 pnpm test:unit 复跑: passed — 221 文件 / 2718 用例通过
- 返工期：A12 双向差集按固定算法复算: passed — 23 个文件双侧 0；上游缺 19 行、fork 缺 10 行，逐行归类
- 已知限制: cargo test 沿用既有环境性例外：update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active 在本机 cc-switch 运行时因代理端口 15721 被占用而失败（上游测试需绑定真实端口），以 --skip 显式跳过并记录，其余全部通过。
- 已知限制: 本轮未做桌面端手工 UI 验证：rebase 后行为由 2718 个前端用例与逐项代码在位核对覆盖，未实际启动应用点击新表单。
- 已知限制: 交付（推 origin/main 与推 tag v4.0.9-1）不是验收项：tag 必须指向归档提交，Verify 时该提交尚不存在，按 Q1 授权在归档之后执行。
- 已知限制: 中间重放提交 77458dd9 的 en.json 带过一次冲突标记，最终树与 HEAD 均 0 命中，但该历史提交本身未被改写。
- 已知限制: A12 的计数依赖规格写明的归一化与多重集口径；改用 git diff 增删行口径会把 ClaudeFormFields 中被改写的 fork 行额外计入，规格已列出这些行以便对齐。

## 阻塞项

_无。_

## 风险与跳过的工作

- 规格第 14 行「重放后区间共 138 个提交」指的是含归档提交的终态，本轮验收实测为 137（135 重放 + 同步 + 修复），归档提交尚未产生；同一段与「重放映射」里「重放后 == 135」共用「重放后」一词指代不同对象，建议改为「区间终态共 138 个提交」以免下轮复核误读。
- 规格「落地保真核对」第 48 行的解释性旁注称改用 git diff 的 +/- 行口径时 ClaudeFormFields 的 fork 行「会多算出十几行」；我实测该口径下为 9 行（本口径 2 行），措辞略偏。记录口径下的三个 headline 数字与逐行归类不受影响。
- docs/HOW_TO_REBASE_UPSTREAM.md 同一张共享文件表仍有两行 `src/components/providers/forms/ProviderForm.tsx`（192 与 208）。经取证该重复是 v4.0.5 同步提交 40a32e31 引入、pre-sync-v409 已存在，非本轮返工遗漏；可在后续同步顺手合并，不构成本轮缺陷。
- 交付未执行（按 Q1 属验收通过并归档之后的步骤）：origin/main 仍指向同步前的 cc6e7870，本地 tag v4.0.9-1 尚未创建，Release CI 未触发。
- 归档步骤未完成项：全局规格 docs/comet/specs/upstream-sync/spec.md 仍是 156 行的 v4.0.8 状态，需按计划在归档时替换为本文件内容；工作树存在 Runtime 流程文件改动（comet-state.yaml 修改、verification.md 删除），符合规格约定。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-12T11:34:54.667Z |
| 2 | 1 | 1 | fail | A12 | 独立复核结论：同步本身成立。A1 基线正确（merge-base = 8845b1ef = v4.0.9，v4.0.9..main 136 个提交全为 fork 作者 Tune，post-release 6 个未纳入）；A2 重放 135→135、主题序列逐行零差异、patch-id 差异恰 16 个且与规格的 4 个 hunk 位移 + 12 次冲突停车逐一对上（4 对的增删行逐字节相同），fork 专属 394 个文件除白名单文档外零改动，最终树与 HEAD 冲突标记 0 命中；A3 重叠面我重算恰为 33 个、61 个上游独有文件与 8845b1ef 逐字节一致，上游十组功能与 16 个新增文件全部在位，README 整文件保留 fork；A4 四处版本 4.0.9-1、SCHEMA_VERSION 21（上游 20）与两个 v20→v21 迁移用例通过；A5 规格 14 类魔改逐项取证在位（含托盘左键与 pre-sync 行号内容一致、updater 命中数在 lib.rs/commands/settings.rs/Cargo.lock/package.json/capabilities 全为 0、直达区仅经典布局、EndpointField rightSlot 与上游 help 并存、fork CI 矩阵与上游 tag 跳过条件、白名单未被放开）；A6 config blob cebdcda6… 三点一致；A7 文档确实补齐本轮转共享文件的叠加语义条目并把说明段改写成 61 个文件的事实。A8/A9 我亲自复跑 typecheck 与 test:unit 均 exit 0（221 文件 / 2718 用例），A10/A11 依 Runtime 记录与日志核验（17 二进制 / 3794 通过 / 0 失败 / 1 filtered，跳过用例确为既有 15721 端口例外）。唯一不合格项是 A12：按规格自述口径独立复算得上游缺 18 行、fork 缺 17 行、两侧干净 23 个文件，与规格记录的 19/10/26 不符，且 ClaudeFormFields 的 fork 侧缺失只归类 2 行、实测 9 行（漏记的 7 行来自上游删键的两段与被改写的 const）；我已逐条确认语义未丢，故返工是纯文档修正——把该段数字改为可复现值、逐条补全归类、并修正其自身列举 23 个文件却写 26 的算术错误，然后重验 A12。 | 2026-10-12T11:53:50.901Z |
| 2 | 2 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-12T12:03:13.470Z |
| 3 | 1 | 1 | pass | — | 第 2 轮独立验收结论：pass，A1–A12 全部通过。候选 ba963986 的实质保真成立且记录已可复现——我用规格固定算法对 33 个重叠文件独立复算，得到与规格一字不差的 23 个双侧全零 / 上游缺失 19 行 / fork 缺失 10 行，且 19+10 行的文件与文本逐条对得上，归类理由经代码取证属实（宿主键确由上游 v4.0.9 自身删除、apiFormatHelp/DirectModeFormatWarning 在 fork 位置渲染）。返工三项独立复核通过：4 个 locale 无任何同名重复键、16 处 inactiveFieldsHint 与 v4.0.9 逐字一致且无 {{count}} 残留、GrokBuildProviderForm.tsx 表格行只剩 1 行、fork 键段按 key 比对零缺失。Git 结构（merge-base=8845b1ef、区间 137、主题序列逐行一致、patch-id 119/16 分类精确对应、61 个上游独有文件 blob 与 v4.0.9 全同、零冲突标记、.comet/config.yaml blob 未变）、版本号四处 4.0.9-1、SCHEMA_VERSION 21 与 v20→v21 两用例、14 类 fork 魔改在位均已取证；4 条检查我全部复跑，退出码均 0（221 文件/2718 用例；cargo test 17 二进制/3794 通过/0 失败）。剩余风险仅为规格两处措辞精度、v4.0.5 遗留的 ProviderForm 表格重复行、以及交付与归档步骤尚未执行。 | 2026-10-12T12:21:50.841Z |



## 结论

第 2 轮独立验收结论：pass，A1–A12 全部通过。候选 ba963986 的实质保真成立且记录已可复现——我用规格固定算法对 33 个重叠文件独立复算，得到与规格一字不差的 23 个双侧全零 / 上游缺失 19 行 / fork 缺失 10 行，且 19+10 行的文件与文本逐条对得上，归类理由经代码取证属实（宿主键确由上游 v4.0.9 自身删除、apiFormatHelp/DirectModeFormatWarning 在 fork 位置渲染）。返工三项独立复核通过：4 个 locale 无任何同名重复键、16 处 inactiveFieldsHint 与 v4.0.9 逐字一致且无 {{count}} 残留、GrokBuildProviderForm.tsx 表格行只剩 1 行、fork 键段按 key 比对零缺失。Git 结构（merge-base=8845b1ef、区间 137、主题序列逐行一致、patch-id 119/16 分类精确对应、61 个上游独有文件 blob 与 v4.0.9 全同、零冲突标记、.comet/config.yaml blob 未变）、版本号四处 4.0.9-1、SCHEMA_VERSION 21 与 v20→v21 两用例、14 类 fork 魔改在位均已取证；4 条检查我全部复跑，退出码均 0（221 文件/2718 用例；cargo test 17 二进制/3794 通过/0 失败）。剩余风险仅为规格两处措辞精度、v4.0.5 遗留的 ProviderForm 表格重复行、以及交付与归档步骤尚未执行。
