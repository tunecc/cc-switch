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
- 完成时间: 2026-10-10T13:03:46.237Z
- 摘要: 12/12 验收项全部通过。候选实现 = 提交 3fabd91f chore: sync fork with upstream v4.0.7（工作区 /Users/tune/Downloads/ccs/cc-switch，HEAD 即该提交，工作区仅 Runtime 流程状态文件 comet-state.yaml 有改动）。Runtime 的 7 项检查（git-merge-base / git-fork-count / git-fork-authors / frontend-typecheck / frontend-unit-tests / backend-check / backend-tests）全部 exit 0，我逐条比对日志内容确认真实执行且对应当前候选，并独立复跑了其中 4 项构建测试命令，结果一致；这些检查只覆盖 A1/A2 的一部分与 A8–A11，A2/A3/A4/A5/A6/A7/A12 由我独立取证（git 结构核对、131 提交主题序列与 patch-id 对照、24 个重叠文件多重集保真复算、84 个上游专属文件 blob 逐字节比对、392 个 fork 独有文件逐字节比对、逐项语义 grep、版本号与 SCHEMA_VERSION 与迁移链核对、.comet/config.yaml blob 对照、文档 diff 核对）。核心结论：merge-base = 790ed800 = tag v4.0.7；131 个 fork 提交按原顺序完整重放（主题序列逐行一致，patch-id 127 相同 + 4 个仅上下文位移/冲突解决点差异，均已逐条核对无语义变化）；上游 v4.0.7 全部 22 个提交改动落地（84 个非重叠文件与上游逐字节相同，16 项在重叠文件内逐项命中）；fork 全部魔改语义保留（392 个 fork 独有文件逐字节未变，24 个共享文件两侧语义并存）；四处版本号 4.0.7-1、SCHEMA_VERSION 21 与 v20→v21 幂等修复迁移完整；.comet/config.yaml blob 未被重放改写；docs/HOW_TO_REBASE_UPSTREAM.md 与完整目标规格均已按本次同步结果修订；最终态全树零冲突标记；typecheck / test:unit(215 文件 2633 用例) / cargo check / cargo test(3579 passed, 0 failed) 全部通过。唯一保真差异为 4 个版本文件的 fork 版本号 4.0.7-1 vs 上游 4.0.7，属规格明确记录的刻意取舍。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 790ed800（tag v4.0.7 指向的提交），`git log v4.0.7..main` 只包含 fork 提交。 | git merge-base main upstream/main = 790ed8009df809bedaf6c31b5ced05da46bb1f1f，与 git rev-parse v4.0.7^{commit} 完全相等；git log --format=%an v4.0.7..main \| sort -u 只有 Tune（132 个提交：131 个重放 fork 提交 + 同步提交 3fabd91f），无上游提交落入区间；upstream/main 为 1f786dad，其 2 个 post-release 提交未进入范围（符合 Q1 决定）。 |
| A2 | passed | brief.md | A2: rebase 前 c2611266..main 的 131 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。 | git rev-list --count c2611266..e26fba04 = 131，git rev-list --count v4.0.7..3fabd91f~1 = 131；131 条提交的 author/email/date/subject 序列逐行 diff 完全一致（IDENTICAL），无空提交丢弃、无重复落地。patch-id 独立复算：127/131 与重放前相同，4 个不同（34903ffdd→9aaa5747a、51e70a357→83a9d90d9 为两处冲突解决点；eae895d5d→5ead2cca9、cde885645→e15f79bc5 为上下文位移）——逐一 diff <(git show old) <(git show new) 核对，差异仅为版本号行（新基线 4.0.7 vs fork 历史版本号）、hunk 头行号与 blob index 行，新增/删除行逐字节相同，语义无变化，与规格「重放映射」记录一致。全树 git grep -I -l -E '^<<<<<<< \|^>>>>>>> ' 命中 0（含 spec 点名的 tests.rs 与 gemini_auth.rs 两个历史 blob 也为 0），最终态零冲突标记。 |
| A3 | passed | brief.md | A3: 24 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：白名单/裁剪类文件（`README.md`、`.github/workflows/release.yml`、`src-tauri/tauri.conf.json` 等 fork 字段、`package.json`/`Cargo.toml`/`Cargo.lock`/`pnpm-lock.yaml` 的 fork 版本号与依赖）保留 fork 侧语义；共享代码以上游 v4.0.7 为基础叠加回 fork 必要语义，且上游火山 Agent Plan 端点修正与 Coding Plan 预设、Codex 压缩会话读取与压缩开关、过期客户端检测移出 Stack 与 Windows 进程号判定、Claude 1 小时缓存写入计价、Sonnet 5.5/Haiku 5.5 定价、Codex 缓存写入导入、跨应用用量统计行独立、OpenCode 额外选项类型保持、OpenClaw 自定义头保留、显式 0 缓存字段视为未上报、设置页滚动定位应用配置条目、顶层 base_url 保留、批处理文件去非 ASCII 路径、工作区账号区分、额度「已用」显示、旧第三方会话报错说明等改动全部落地。 | 独立计算重叠面：comm -12 <(git diff --name-only c2611266 790ed800) <(git diff --name-only c2611266 e26fba04) = 24 个文件，与规格清单逐条一致（4 版本/锁 + 9 后端共享 + 7 前端共享 + 4 locales）。上游侧：108 个上游改动文件中 84 个非重叠文件与 790ed800 逐字节相同（blob hash 相等），16 项上游改动在重叠文件内逐项 grep 命中（火山 Agent Plan /api/plan/v3 与 Coding Plan /api/coding/v3 及 volcengine_codingplan、codex_rollout_file.rs + codex_session_compression.rs + lib.rs/services/mod.rs/commands/settings.rs/lib/api/settings.ts 三处压缩命令接线、acknowledge_codex_stale_clients 注册与 Cargo.toml Win32_Foundation/Win32_System_Threading、cache_creation_1h_tokens 1h 计价、claude-sonnet-5-5/claude-haiku-5-5 定价与 model_pricing_seed_includes_claude_sonnet_5_5_and_haiku_5_5 用例、mergeOpencodeExtraOptionRows、appConfigScrollTarget/isTextEditableTarget/hasSettings、quota_display/quota_shows_used/quotaDisplay、chcp 65001 批处理去非 ASCII、top-level base_url 归一化 custom 表、旧第三方会话报错文案、codex_login.rs 按用户+workspace 认人）。fork 侧：白名单/裁剪类文件全部保留 fork 语义（package.json 无 @tauri-apps/plugin-updater 且有 dev:fork、tauri.conf.json productName=CC Switch 且无 updater bundle 键且 createUpdaterArtifacts=false、Cargo.toml repository=tunecc 且无 tauri-plugin-updater、Cargo.lock 与 pnpm-lock.yaml 的 tauri-plugin-updater/@tauri-apps/plugin-updater 命中 0、capabilities/default.json 无 updater 权限、release.yml 仅 windows-2022+macos-14 且 contains(ref_name,'-') 跳过上游 tag、README.md fork 重写版）；共享文件叠加两侧语义均验证存在（lib.rs 无 tauri_plugin_updater 且有 show_menu_on_left_click(false)+左键 Up 分支 tray::toggle_main_window+connectivity_test_provider_models、tray.rs toggle_main_window 与 note_tray_click 左键分支、settings.rs VisibleSidebarPanels+visible_sidebar_panels+show_provider_search+codex_stack_classic_subagents+quota_display、commands/settings.rs 无 updater_builder/UpdaterExt/UpdateDownloadProgress 且 install_update_and_restart 为空壳、services/mod.rs 同含 codex_session_compression 与 connectivity_test、forwarder.rs website_url_2: None、App.tsx IS_FORK_BUILD+useConnectivityProbe+batchTest 门控、McodeProviderForm.tsx 保留 mergeOpencodeExtraOptionRows 与 ProviderImportEntry/useProviderImportApply 导入接线、SettingsPage.tsx 保留 appConfigScrollTarget effect 与 DevPanel 两段、GeneralSection.tsx 上游额度显示行+v4.0.6 搜索行+fork SidebarPanelPillRow 三段并存、piProviderPresets.ts hidden?: boolean、lib/api/settings.ts 无 installUpdateAndRestart、types.ts websiteUrl2/VisibleSidebarPanels/quotaDisplay 并存、schema.rs website_url_2 6 处）。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.7-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。 | 四处版本文件实测均为 4.0.7-1：package.json "version": "4.0.7-1"、src-tauri/tauri.conf.json "version": "4.0.7-1"、src-tauri/Cargo.toml version = "4.0.7-1"、src-tauri/Cargo.lock 的 cc-switch 包 version = "4.0.7-1"（cargo check 未再改写锁文件）。src-tauri/src/database/mod.rs 第 53 行 pub(crate) const SCHEMA_VERSION: i32 = 21。v20→v21 幂等修复迁移完整保留：schema.rs 20 => 分支里对 mcp_servers 补 enabled_mcode/enabled_pi、对 skills 补 enabled_mcode 并 set_user_version(conn, 21)，注释明确指向 fork v19 双语义遗留；schema.rs 另含 migrate_v20_to_v21_repairs_missing_mcode_column_idempotently 与 migrate_v20_to_v21_is_noop_when_all_target_columns_exist 两个用例，上游 v4.0.7 未推进 schema（仍为 20、迁移链未动）。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | 整体取证：fork 在 c2611266..e26fba04 自行改动的 419 个文件中，剔除此轮 24 个重叠文件后 392 个与同步前逐字节相同（blob hash 相等），仅 3 个不同且全部有解释（docs/HOW_TO_REBASE_UPSTREAM.md 为 A7 要求更新；commands/stream_check.rs 与 database/dao/stream_check.rs 在同步前即被 fork 删除、同步后仍不存在，未被上游复活）。逐项抽查：productName=CC Switch 与 SettingsPage.tsx 的 IS_FORK_BUILD&&DEV_PANEL_ENABLED 守卫 Fork 按钮 + <DevPanel> 挂载；visible_sidebar_panels 后端字段 + GeneralSection SidebarPanelPillRow（skills/sessions/mcp/prompts/batchTest）；ProviderCard extractModelBadgeForProvider + ModelQuickSwitch/ModelQuickSwitchDialog.tsx + ProviderCardActions 右键「模型」入口；ClaudeFormFields fallbackQuickAccessSection；ProviderList applyQuickSort + mutations.ts 新建插入第二位；forkOfficialAllowlist + forkPresetFilter + piProviderPresets hidden?: boolean；connectivity_test.rs 与 services/connectivity_test/ 存在且 lib.rs 注册 connectivity_test_provider_models；schema.rs/provider.rs/types.ts/schemas/provider.ts 的 website_url_2/websiteUrl2 双官网链接与 v18→v19 迁移；tray.rs toggle_main_window + lib.rs 左键分支；McodeProviderForm/ProviderForm 跨应用导入接线；updater 全链路禁用（package.json/Cargo.toml/Cargo.lock/pnpm-lock/capabilities 均 0 命中，commands/settings.rs 空壳）；release.yml fork tag 跳过逻辑；README.md fork 差异说明；.github/workflows/ci.yml+release.yml fork 裁剪 CI。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。 | git rev-parse HEAD:.comet/config.yaml = cebdcda66dbdcfde8b8de9331650753fb138b223，与 git rev-parse e26fba04:.comet/config.yaml（同步前安全分支）完全同一 blob，工作树 git hash-object .comet/config.yaml 亦为该 hash；内容仍为 default_workflow: native + workflows: [native, classic]，未被历史重放改写。 |
| A7 | passed | brief.md | A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。 | git diff e26fba04 3fabd91f -- docs/HOW_TO_REBASE_UPSTREAM.md = 17 insertions / 12 deletions，逐条核对：§4 白名单表 SettingsPage.tsx 条目补注「v4.0.7 起转为共享文件按 §3.2 处理」、lib/api/settings.ts 补三个 Codex 会话压缩命令绑定（+15）；共享文件表新增/改写 lib.rs（+5 命令注册）、commands/settings.rs（+31 压缩命令落库）、settings.rs（quota_display +17）、database/schema.rs（Sonnet 5.5/Haiku 5.5 +20）、database/tests.rs（新用例 +38）、GeneralSection.tsx（额度显示行 +27 三段并存）、App.tsx（appConfigScrollTarget +17）、SettingsPage.tsx（滚动定位 effect +130）、McodeProviderForm.tsx（mergeOpencodeExtraOptionRows）、piProviderPresets.ts（火山拆分）、services/mod.rs（codex_session_compression +1）、commands/misc.rs（批处理去非 ASCII +112）、tray.rs（quota_display +56）、forwarder.rs（e049660a +10）、types.ts（quotaDisplay +2），与本次实测的上游改动一一对应。本轮无新增 fork 专属代码文件（392 个 fork 独有文件全部逐字节未变），未虚构白名单条目。完整目标规格 docs/comet/changes/sync-upstream-v407/specs/upstream-sync/spec.md 已重写为同步后完整状态（基线 790ed800、131 提交重放映射含冲突清单与 patch-id 对照、24 个重叠文件逐文件叠加要求、保真核对结果、版本号 4.0.7-1、SCHEMA_VERSION 21、交付步骤），非占位。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | Runtime 检查 frontend-typecheck exit 0（日志仅含 tsc --noEmit 启动行、无错误输出）；我独立复跑 pnpm typecheck 亦 exit 0。执行时本地时间 20:52，非任何已知零点窗口。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过。 | Runtime 检查 frontend-unit-tests exit 0（日志：Test Files 215 passed (215)，Tests 2633 passed (2633)，Duration 31.08s，无 failed）；我独立复跑 pnpm test:unit 同样 215 文件 / 2633 用例全部通过（Duration 30.62s）。当前本地时间 20:52（date 实测），不在 SessionManagerPage 时间分桶用例 00:00–00:30 的既有零点失败窗口内，结果有效。 |
| A10 | passed | brief.md | A10: `cargo check` 通过。 | Runtime 检查 backend-check exit 0（日志：Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.69s，缓存命中，cwd=src-tauri）；我独立复跑 cargo check 同样 exit 0（Finished in 0.64s），且未改写 Cargo.lock（git status 仅 comet-state.yaml 变动），与 Cargo.toml 的 4.0.7-1 一致。 |
| A11 | passed | brief.md | A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | Runtime 检查 backend-tests exit 0：主测试集 test result: ok. 3579 passed; 0 failed; 9 ignored; 0 measured; 1 filtered out，其余 16 个测试目标全部 ok、无 failed/panicked。我独立复跑 cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active 得到同样结果（3579 passed / 0 failed / 1 filtered out，确认 skip 生效）。例外确认属实：该用例在 src-tauri/src/services/provider/mod.rs:2286 存在（上游 790ed800 同文件 2282 行亦有），lsof -nP -iTCP:15721 -sTCP:LISTEN 显示本机 cc-switch（PID 35362）正占用 127.0.0.1:15721，属规格记录的既有环境性例外；未扩大跳过列表。 |
| A12 | passed | brief.md | A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 c2611266→790ed800」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。 | 我独立编写只读脚本按规格同法复算：对 24 个重叠文件分别取上游 c2611266→790ed800、fork c2611266→e26fba04 两份 diff 与最终树 3fabd91f 的内容做多重集比对。结果：上游新增行缺失 4、fork 新增行缺失 4，且 8 项全部落在 package.json / src-tauri/Cargo.lock / src-tauri/Cargo.toml / src-tauri/tauri.conf.json 四个版本文件，差异仅为 "version": "4.0.7" / version = "4.0.7"（上游）与 "4.0.6-1"（fork 历史值）被替换为 fork 版本号 4.0.7-1——正是规格「重放映射」明确记录的刻意取舍，与 v4.0.6 轮同类。其余 20 个文件上游新增/删除行与 fork 新增/删除行缺失均为 0，双向完全对称。另外用 3-way 多重集规则（base/up/fork/final 四态）复扫「双方均已删除的行被复活」「上游新增行缺失」「fork 新增行缺失」三类语义问题，同样只得到上述 8 项版本号差异。初版脚本曾报 forwarder.rs 与 piProviderPresets.ts 两条「上游删除行仍存在」，逐一核查确认为同一 hunk 内的行移动（forwarder.rs 的 assert 从旧位置移到新条件块、piProviderPresets.ts 的 partnerPromotionKey 从旧预设移到新预设），最终树出现次数与上游 v4.0.7 一致，非缺陷。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| git merge-base main upstream/main 等于 v4.0.7 提交 790ed800 | merge-base main upstream/main | . | passed | 0 | 66 ms |
| v4.0.7..HEAD~1 的重放 fork 提交数为 131 | rev-list --count v4.0.7..HEAD~1 | . | passed | 0 | 68 ms |
| v4.0.7..main 的作者只有 fork 作者 Tune | log --format=%an v4.0.7..main | . | passed | 0 | 69 ms |
| pnpm typecheck | typecheck | . | passed | 0 | 10623 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 31881 ms |
| cargo check | check | src-tauri | passed | 0 | 774 ms |
| cargo test（跳过 15721 端口占用例外用例） | test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 47085 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- git 结构核对（merge-base / rev-list / 主题序列 diff / patch-id 对照 / 冲突标记全树扫描）: passed — merge-base==790ed800；131 提交按序重放；主题序列 IDENTICAL；全树冲突标记 0 命中
- 重叠面增删行双向差集（24 文件）: passed — 20 文件完全对称，4 个版本文件仅差 fork 版本号
- fork 语义抽查（26 项）: passed — 产品名/DevPanel/侧边面板/模型徽章/右键排序/预设过滤/连通性测试/双官网链接/托盘左键/跨应用导入/更新器禁用/fork CI/README 全部命中
- 上游专属文件 blob 逐字节比对（13 项）: passed — 全部与 v4.0.7 逐字节相同
- pnpm install --frozen-lockfile: passed — 锁文件与 package.json 一致，未被改写
- pnpm typecheck: passed — exit 0
- pnpm test:unit: passed — 215 文件 / 2633 用例全部通过
- cargo check: passed — exit 0
- cargo test: passed — 3579 passed / 0 failed，跳过 1 个既有环境例外
- 已知限制: cargo test 跳过 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active：该上游用例需绑定真实代理端口 15721，本机 cc-switch 应用运行时该端口被占用，属上游测试设计，沿用过去 7 轮同步的既有例外并显式记录。
- 已知限制: A12 的增删行双向差集是 Python 多步脚本，不放入 Runtime 检查计划，由 Verifier 按规格同法独立复算；Builder 已在开发期跑过并记录结果。
- 已知限制: 未做视觉/交互验收（无头环境）；上游 v4.0.7 的 UI 改动（额度已用切换、设置页滚动定位闪烁、Codex 会话压缩开关）由单测与类型检查覆盖。
- 已知限制: 交付（push main、创建并推送 tag v4.0.7-1）按 Q2 授权在验收通过并归档之后执行，本轮未执行；tag 推送前的 Release CI 结果尚不存在。

## 阻塞项

_无。_

## 风险与跳过的工作

- cargo test 沿用规格记录的既有环境性例外：跳过 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active（该上游用例需绑定真实代理端口 15721，本机 cc-switch 运行时占用该端口，lsof 已实测确认）。属上游测试设计，非本次同步缺陷；未扩大跳过列表，其余 3579 个用例全部通过。
- 未做视觉/交互验收（无头环境）。上游 v4.0.7 的 UI 改动（额度「已用」切换、设置页滚动定位两次描边闪烁、Codex 会话压缩开关与目录占用显示）由 pnpm typecheck、2633 个单测与 cargo test 覆盖，代码层已确认落地，但未经人眼确认渲染效果。
- 交付步骤（git push --force-with-lease origin main、创建并推送 annotated tag v4.0.7-1 及 Release CI 结果）按 Q2 授权在验收通过并用户接受结果、生成归档提交之后执行，本轮未执行；tag 必须指向归档提交，Verify 时该提交尚不存在，因此相关断言在验收当时不可取证（规格已明确记录此边界）。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-10T12:47:45.071Z |
| 2 | 1 | 1 | pass | — | 12/12 验收项全部通过。候选实现 = 提交 3fabd91f chore: sync fork with upstream v4.0.7（工作区 /Users/tune/Downloads/ccs/cc-switch，HEAD 即该提交，工作区仅 Runtime 流程状态文件 comet-state.yaml 有改动）。Runtime 的 7 项检查（git-merge-base / git-fork-count / git-fork-authors / frontend-typecheck / frontend-unit-tests / backend-check / backend-tests）全部 exit 0，我逐条比对日志内容确认真实执行且对应当前候选，并独立复跑了其中 4 项构建测试命令，结果一致；这些检查只覆盖 A1/A2 的一部分与 A8–A11，A2/A3/A4/A5/A6/A7/A12 由我独立取证（git 结构核对、131 提交主题序列与 patch-id 对照、24 个重叠文件多重集保真复算、84 个上游专属文件 blob 逐字节比对、392 个 fork 独有文件逐字节比对、逐项语义 grep、版本号与 SCHEMA_VERSION 与迁移链核对、.comet/config.yaml blob 对照、文档 diff 核对）。核心结论：merge-base = 790ed800 = tag v4.0.7；131 个 fork 提交按原顺序完整重放（主题序列逐行一致，patch-id 127 相同 + 4 个仅上下文位移/冲突解决点差异，均已逐条核对无语义变化）；上游 v4.0.7 全部 22 个提交改动落地（84 个非重叠文件与上游逐字节相同，16 项在重叠文件内逐项命中）；fork 全部魔改语义保留（392 个 fork 独有文件逐字节未变，24 个共享文件两侧语义并存）；四处版本号 4.0.7-1、SCHEMA_VERSION 21 与 v20→v21 幂等修复迁移完整；.comet/config.yaml blob 未被重放改写；docs/HOW_TO_REBASE_UPSTREAM.md 与完整目标规格均已按本次同步结果修订；最终态全树零冲突标记；typecheck / test:unit(215 文件 2633 用例) / cargo check / cargo test(3579 passed, 0 failed) 全部通过。唯一保真差异为 4 个版本文件的 fork 版本号 4.0.7-1 vs 上游 4.0.7，属规格明确记录的刻意取舍。 | 2026-10-10T13:03:46.237Z |



## 结论

12/12 验收项全部通过。候选实现 = 提交 3fabd91f chore: sync fork with upstream v4.0.7（工作区 /Users/tune/Downloads/ccs/cc-switch，HEAD 即该提交，工作区仅 Runtime 流程状态文件 comet-state.yaml 有改动）。Runtime 的 7 项检查（git-merge-base / git-fork-count / git-fork-authors / frontend-typecheck / frontend-unit-tests / backend-check / backend-tests）全部 exit 0，我逐条比对日志内容确认真实执行且对应当前候选，并独立复跑了其中 4 项构建测试命令，结果一致；这些检查只覆盖 A1/A2 的一部分与 A8–A11，A2/A3/A4/A5/A6/A7/A12 由我独立取证（git 结构核对、131 提交主题序列与 patch-id 对照、24 个重叠文件多重集保真复算、84 个上游专属文件 blob 逐字节比对、392 个 fork 独有文件逐字节比对、逐项语义 grep、版本号与 SCHEMA_VERSION 与迁移链核对、.comet/config.yaml blob 对照、文档 diff 核对）。核心结论：merge-base = 790ed800 = tag v4.0.7；131 个 fork 提交按原顺序完整重放（主题序列逐行一致，patch-id 127 相同 + 4 个仅上下文位移/冲突解决点差异，均已逐条核对无语义变化）；上游 v4.0.7 全部 22 个提交改动落地（84 个非重叠文件与上游逐字节相同，16 项在重叠文件内逐项命中）；fork 全部魔改语义保留（392 个 fork 独有文件逐字节未变，24 个共享文件两侧语义并存）；四处版本号 4.0.7-1、SCHEMA_VERSION 21 与 v20→v21 幂等修复迁移完整；.comet/config.yaml blob 未被重放改写；docs/HOW_TO_REBASE_UPSTREAM.md 与完整目标规格均已按本次同步结果修订；最终态全树零冲突标记；typecheck / test:unit(215 文件 2633 用例) / cargo check / cargo test(3579 passed, 0 failed) 全部通过。唯一保真差异为 4 个版本文件的 fork 版本号 4.0.7-1 vs 上游 4.0.7，属规格明确记录的刻意取舍。
