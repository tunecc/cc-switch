---
generated_from_state_version: 38
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 8
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-15T09:30:55.222Z
- 摘要: Replayed-history structure, patch-id mapping, the 34-file landing-fidelity audit (27 zero / 18 upstream-missing / 23 fork-missing, all lines attributed), locale duplicate/identity checks, all version and fork-semantics greps, the Q2 allowlist with the original-index id contract, and all six build/test checks (re-run by me on this exact candidate) verify; the prior A7 figure defects are fixed and no refuting contradiction was found, leaving only three wording/staleness imprecisions listed as risks.

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 `51ac86f1`（tag `v4.0.12` 指向的提交），`git log v4.0.12..main` 只包含 fork 提交、不含任何上游提交。 | git merge-base main upstream/main = 51ac86f1 (tag v4.0.12); rev-list v4.0.12..main = 149, git log --format=%an unique = Tune, 0 hashes shared with upstream refs, c1051f8e not an ancestor of main. |
| A2 | passed | brief.md | A2: 重放前 `v4.0.10..main` 的 143 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因；每次冲突停车逐条记录归属与解法。 | diff of git log --format=%s --reverse v4.0.10..pre-sync-v412 vs first 143 of v4.0.12..main = 0 lines; stdin patch-id: 133 same / 10 diff; my add/remove-multiset re-analysis matches every spec class (#2 only version line, #12 8->7 files, #13 restructure, #43 README, #74 lock line, #46/#72/#77/#79/#143 context-only); 69 marker-bearing trees before == 69 after; HEAD tree has 0 markers. |
| A3 | passed | brief.md | A3: 34 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.12-1` 且未被引入新依赖；`src-tauri/src/tray.rs` 同时具备上游土耳其语托盘文案与 fork 的 `hide_main_window`/`toggle_main_window`；`src-tauri/src/commands/misc.rs` 以上游 Windows PATH 与工具生命周期改造为基础并保留 fork 的 1 行改动；`src/components/providers/ProviderList.tsx` 以上游的 `searchSlot` 挂载位置、`focusSearch` 复用与搜索框不再遮挡卡片为基础，并保留 fork 的右键置顶/置底与新建插入第二位；`src/App.tsx`、`GeneralSection.tsx`、`UniversalProviderFormModal.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src-tauri/src/{lib,settings}.rs`、`deeplink/provider.rs`、`proxy/forwarder.rs` 与 8 个预设文件、4 个 locales、3 个测试文件按规格逐文件要求叠加，两侧语义并存、无整文件取一侧。 | Recomputed fidelity: 27/34 overlap files zero-missing both sides incl. tray/misc/lib/settings/deeplink/forwarder/App/types/ProviderList/GeneralSection/Universal/8 presets/4 locales/3 tests; tray.rs has map_locale_to_tray_language tr branch + hide_main_window(2728)/toggle_main_window(2745); ProviderList searchSlot/focusSearch 9 hits + fork 置顶/置底 8; no whole-file single-side. |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.12-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。 | package.json/tauri.conf.json/Cargo.toml/Cargo.lock all 4.0.12-1; Cargo.lock vs v4.0.12 = cc-switch version line + fork updater-dep removal; SCHEMA_VERSION: i32 = 21 (database/mod.rs:54); v20->v21 branch at schema.rs:586-593 with 2 idempotency tests passing in cargo test. |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | CC Switch productName + __CCS_FORK_BUILD__(7 files)/__CCS_DEV_PANEL__ + devpanel/DevPanel; visible_sidebar_panels 1 + visibleSidebarPanels 4; rightSlot, allOneMEnabled, fallbackQuickAccessSection, SearchableModelPicker 7, hasCustomModelMapping; ProviderList applyQuickSort pin; filterForkPresets wired in 5 forms; connectivity cmds lib.rs:1689-1690; website_url_2 17; toggle_main_window 2; AboutSection/misc.rs:81 tunecc; CI windows-2022+macos-14 only; fork README. |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件（`vite.config.ts` 的 `__CCS_FORK_BUILD__`、`.github/workflows/{ci,release}.yml` 裁剪、`src/config/fork*` 等）未被上游或重放改写。 | git diff pre-sync-v412 HEAD -- .comet/config.yaml = 0 lines, blob has default_workflow: native + [native, classic]; vite.config.ts/vitest.config.ts/workflows/capabilities/devpanel/setupTests/vite-env.d.ts/tauri.{windows,dev}.conf.json/updater.ts/UpdateContext.tsx byte-unchanged; only shared src/config presets plus the authorized forkOfficialAllowlist.ts moved. |
| A7 | passed | brief.md | A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。 | Every re-measurable figure reproduces: 67 commits/128 files/+19593-1014/0 deletions/25 added/34 overlap/94 upstream-only; archive +539-19, tray +77-10 with TrayTexts hunk adding 61, ProviderList +115-85/fork +229-10, misc +375-68, deeplink +45-3, codex +610-57, pi +237-3, presets +1322/-1142/-717, locales +36/-11, tr 4759 lines/4109 leaves, en 4416 -> gap 312 within 313 fork keys; all 21 grep counts exact; the two dead whitelist paths removed and all remaining whitelist paths exist; all bare 「本轮」 now inside §4.1 or round-labelled; 174 cited hashes all resolve, no fabrications. |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | Re-ran pnpm typecheck on this candidate: exit 0 (tsc --noEmit silent). |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/hooks/useUsageAutoRefresh.test.tsx`、`tests/hooks/useUsageEventBridge.test.tsx`、`tests/i18n/turkishDetection.test.ts`、`tests/components/{UsagePage,DailyMemoryPanel,UsagePanelMotion,WorkspaceFileEditor,AppsPage}.test.tsx`、`tests/config/codexReasoningLevelPresets.test.ts`）与 fork 既有用例。 | Re-ran pnpm test:unit: 233 files / 3066 tests passed; turkishDetection, useUsageAutoRefresh, useUsageEventBridge, UsagePage, DailyMemoryPanel, UsagePanelMotion, WorkspaceFileEditor, AppsPage, codexReasoningLevelPresets, ProviderList/PresetSelector/DeepLinkImportDialog all executed. |
| A10 | passed | brief.md | A10: `pnpm format:check` 通过（fork CI 的 Frontend Checks 依次跑 typecheck → format:check → test:unit → build:renderer，手工拼接共享文件后必须本地归一化格式）。 | Re-ran pnpm format:check: 'All matched files use Prettier code style!' exit 0. |
| A11 | passed | brief.md | A11: `pnpm build:renderer` 通过。 | Re-ran pnpm build:renderer: exit 0, 'built in 6.65s' (only chunk-size warning). |
| A12 | passed | brief.md | A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（本轮唯一合法改动是 `cc-switch` 包版本号行）。 | Re-ran cargo check in src-tauri: exit 0; git status --porcelain src-tauri/Cargo.lock empty -> lock untouched; cargo check --all-targets shows the single pre-existing unused-import warning at live.rs:1499, same line/content as pre-sync-v412. |
| A13 | passed | brief.md | A13: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录），含上游新增的工具卸载与 PATH 恢复用例。 | Re-ran cargo test with the agreed --skip: 3932 passed, 0 failed, 9 ignored, 1 filtered out; 24 commands::misc::tool_uninstall::tests and tool_node_requirement::tests ran; windows_lifecycle_restores_user_path... is #[cfg(target_os=windows)] so compile-only here. |
| A14 | passed | brief.md | A14: 落地保真核对通过：对 34 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.10`、`v4.0.12`、`pre-sync-v412`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。 | Independent /tmp/verifier-r5/fidelity.py per the fixed algorithm: 34 files, 27 zero both sides, upstream-missing 18, fork-missing 23; non-zero = README 5 (GrooRoute x2, AIGoCode x2, Turkish feature line), 4x1 version + 4x1 fork version, ProviderForm up 7/fork 18, ClaudeDesktop up 2/fork 1 -- exactly the spec's per-line attribution; the four doc commits only touch docs/HOW_TO_REBASE_UPSTREAM.md (git show --stat), which is not in the 34. |
| A15 | passed | brief.md | A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位（rebase 的三方合并会留下重复键且测试全绿，必须显式查重）；新增的 `src/i18n/locales/tr.json` 与 `git show v4.0.12:src/i18n/locales/tr.json` 逐字节一致（Q3：不补 fork 键）。 | object_pairs_hook duplicate scan: dup=0 for zh/en/ja/zh-TW and tr; fork-added keys per locale (313/313/303/303) all present at HEAD with 0 missing; devpanel only zh/en; providerForm.searchModels/noModelsFound + provider.connectivityCheck in all four; tr.json identical to git show v4.0.12:src/i18n/locales/tr.json (297431 bytes). |
| A16 | passed | brief.md | A16: 上游本轮新增能力全部落地且可用：工具卸载（含选择安装副本、Grok 布局、手动命令对话框、Node 版本检查）、本机推理 Local 分组与新预设数据、土耳其语界面与托盘、用量按所选间隔自动刷新、Codex rollout 分页合并与延迟跳过、Pi 速度估算、MCP/skills 批量失败 toast、Windows CLI PATH 恢复；fork 已删除的 updater 与 `stream_check` 实现未被任何一项带回。 | tool_uninstall.rs(+1673)/tool_node_requirement.rs(+309) declared via #[path] at misc.rs:16-19 and prepare_tool_uninstall registered at lib.rs:1704; ManualUninstallDialog/ToolUninstallConfirmDialog/toolUninstallCommands present, uninstall refs only in AppsPage.tsx (32) not ProviderList (0); ProviderCategory "local" + local entries in 7 preset files + icons; tr registered in i18n/index.ts, settings.rs whitelist, tray.rs; useUsageAutoRefresh; codex c05906bb parent-merge + 9719b7b3 unchanged-skip; 4958863a Pi speed; batch error/warning toasts; PATH restore at misc.rs:2321/393; tauri_plugin_updater/updater_builder/installUpdateAndRestart/updater:default = 0 hits in src/src-tauri/tests; stream_check only schema.rs:251/259. |
| A17 | passed | brief.md | A17: 按 Q2 追加白名单条目后可见性正确：fork 构建下 claude、claude-desktop、codex、hermes 的本机推理可选条目为 `Ollama`/`LM Studio`/`llama.cpp`/`vLLM`，openclaw 为 `LM Studio`/`llama.cpp`/`vLLM`，opencode 为 `Ollama`/`llama.cpp`/`vLLM`，pi 为 `Ollama`/`LM Studio`/`vLLM`；`gemini`/`grokbuild` 仍只显示各自的官方预设、`mcode` 仍只显示自定义；赞助商与聚合站预设仍被默认拒绝；`IS_FORK_BUILD` 为 false 时过滤不生效，预设列表与上游完全一致。 | forkOfficialAllowlist.ts equals the spec's ten lists verbatim; parsed original-array indices confirm local names at claude/claude-desktop 90-93, codex 91-94, hermes 84-87, openclaw 83-85, opencode 84-86, pi 72-74 with official at 0; gemini only Google Official, grokBuild array has no 'Grok Official' (constant added separately), mcode []; filterForkPresets returns presets unchanged when !IS_FORK_BUILD; ProviderForm/ClaudeDesktop/Pi/GrokBuild all .map((preset,index)) before hidden+name-set filtering, matching AddProviderDialog/useProviderCategory presets[presetIndex] lookups. |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 14256 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 64527 ms |
| pnpm format:check | format:check | . | passed | 0 | 4544 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 7681 ms |
| cargo check（src-tauri，复验 Cargo.lock 只随 cc-switch 版本号变动） | check | src-tauri | passed | 0 | 951 ms |
| cargo test（显式跳过代理端口 15721 占用用例） | test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 41480 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck（开发期）: passed — tsc --noEmit 无输出。首轮报 claudeDesktopProviderPresets 重复 hidden 声明（TS2300）与四处预设入口的类型不匹配，改为「按原数组下标编号 → 过滤 hidden → 按白名单名称集合过滤」并删除重复声明后通过。
- pnpm test:unit（开发期全量）: passed — 233 个测试文件 / 3066 个用例全部通过（2026-10-15 11:03，56.85s），含上游新增的 useUsageAutoRefresh / useUsageEventBridge / turkishDetection / UsagePage / AppsPage 与 fork 既有用例。
- pnpm format:check（开发期）: passed — 首轮 ClaudeDesktopProviderForm.tsx 被判不合 prettier 规范（手工拼接的 filter 条件换行），npx prettier --write 该文件后复检 All matched files use Prettier code style!。
- cargo check（开发期，src-tauri）: passed — Finished dev profile 25.04s；src-tauri/Cargo.lock 相对终态只有 cc-switch 版本号一行差异，证明上游本轮未增删依赖且 fork 移除 tauri-plugin-updater 未被带回。
- cargo check --all-targets（开发期，src-tauri）: passed — 仅 1 条既有 unused import 警告（src/services/provider/live.rs:1499），与 pre-sync-v412 同一行同一内容，属既有状态而非本轮引入。
- 落地保真与 locale 查重脚本（开发期）: passed — 四 ref 归一化行多重集脚本（/tmp/v412/fidelity.js → fidelity.json）在当前 HEAD（含 aeef1495、a6b62b86）复算：34 个重叠文件 27 个两侧全零、上游缺 18 行 / fork 缺 23 行，逐行归类已写入规格；/tmp/v412/locales.js：5 个 locale 可解析、逐对象作用域 dupKeys=0、tr.json 与上游逐字节一致。规格初稿的 13/8 是这两个提交之前的快照，已在「数字更正记录」里说明来历。Verifier 应按固定口径独立复算。
- 已知限制: cargo test 的跳过项是既有环境性例外：上游用例 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active 在本机 cc-switch 运行时因代理端口 15721 被占用而失败（需绑定真实端口），其余测试必须全部通过。
- 已知限制: 时间敏感用例 tests/components/SessionManagerPage.test.tsx 的「切换时间分桶」在本地 00:00–00:30 窗口必然失败（fixture 用相对 now 构造却断言「今天」桶）；本轮 test:unit 在 11:03 运行未触发，若 Verifier 在该窗口重跑遇到此失败应先查时钟窗口。
- 已知限制: tr.json 按 Q3 决定不补 fork 专属键，土耳其语界面下 fork 功能文案显示英文（fallbackLng=en），属预期结果。
- 已知限制: grokbuild 的白名单条目 Grok Official 是数组外的 grokBuildOfficialPreset 常量，filterForkPresets 对该 app 仍返回空，官方条目由常量单独入列 —— 与同步前一致，非本轮引入。
- 已知限制: 交付（git push --force-with-lease origin main 与 annotated tag v4.0.12-1）不是验收项：tag 必须指向归档提交，只能在验收通过并归档之后按 Q1 授权执行。

## 阻塞项

_无。_

## 风险与跳过的工作

- spec.md L17/L82 and HOW_TO section 4.1 state upstream/main == 51ac86f1; a fetch at 16:20:08 moved it to c1051f8e (reflog proves it was true through the 10:37 rebase), so a future round reading this line could mis-judge the post-release range.
- spec.md L74 labels the 8 'category: "local"' hit files as '8 个预设文件'; the 8th file is src/config/forkOfficialAllowlist.ts (doc comment), only 7 are *ProviderPresets.ts -- count right, noun loose.
- src/lib/api/connectivity-check.ts:28 still invokes the removed backend command stream_check_provider (byte-identical to pre-sync-v412, not a replay regression); the docs' 'stream_check 只剩 schema.rs' claim is scoped to src-tauri/src and does not hold repo-wide.
- Leaf-key counts depend on the empty-object convention: naive counters give en 4417 / tr 4111 versus the documented 4416 / 4109; reconcile methods before re-comparing.
- The '5 次交互式停车' stop log is not reconstructible from git objects; I verified only that the 10 patch-id diffs exist and each matches its documented classification and file/hunk description.
- Evidence-limited on this host: windows_lifecycle_restores_user_path_for_npm_and_its_child is #[cfg(target_os="windows")] (compile-only), and A17 has no vitest coverage because tests/setupTests.ts pins IS_FORK_BUILD=false (static evidence only).
- No archive commit exists yet, so the range count is 149 and docs/comet/changes/sync-upstream-v412/ is untracked; it becomes 150 once archived.

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-15T03:09:38.297Z |
| 2 | 1 | 1 | pass | — | 17 项验收全部通过。候选实现把 fork main 干净地 rebase 到 v4.0.12（merge-base 与 tag 解引用提交相同，区间内 145 个提交作者全为 Tune、无上游提交），143 个 fork 提交按原顺序逐条重放：主题序列逐行 0 差异、patch-id（走 stdin）133 同 / 10 异且 10 处全部对得上 5 次 reflog 佐证的交互式停车与 5 次纯上下文位移/冗余消化，无 fork 语义丢失。34 个重叠文件按规格固定口径独立复算为 27 个文件两侧全零，高危叠加面（tray.rs 土耳其语+fork 两个 helper、misc.rs Windows PATH+tunecc releases、ProviderList 上游搜索面板+fork 置顶置底与探针、settings.ts prepareToolUninstall 且 installUpdateAndRestart 命中 0、lib.rs 10*60+prepare_tool_uninstall+fork 三段）两侧语义并存；四处版本号 4.0.12-1、锁文件只有版本号一行差异、SCHEMA_VERSION 21 与 v20→v21 修复迁移完整；.comet/config.yaml 与全部 fork 专属白名单文件逐 blob 未变；5 个 locale 逐作用域重复键 0、fork 键段逐个在位、tr.json 与上游逐字节一致；Q2 白名单 25 个 local 条目名称与上游逐字一致、四处预设入口一律「先按原数组下标编号再过滤」，上游 id 契约与 fork 过滤正确并存。Runtime 的 6 项检查（typecheck / test:unit 233 文件 3066 用例 / format:check / build:renderer / cargo check / cargo test 3932 通过 0 失败带 1 项已登记跳过）时间戳晚于两个候选提交、工作树对 HEAD 干净，日志与结论一致。唯一需要在归档前修正的是完整目标规格「落地保真核对」与「重放映射」的陈旧计数（应为 18/23 与 145），属文档数字而非实现缺陷。 | 2026-10-15T03:42:51.146Z |
| 2 | 1 | 1 | recovery | — | Native confirmed acceptance criteria changed | 2026-10-15T03:52:52.325Z |
| 3 | 1 | 1 | fail | A7 | 候选实现本身可复核为高保真：A1/A2 的 143→145 区间、逐行主题序列 0 差异、patch-id 133 同/10 异及 10 处位置与归类、A14 的 34 文件/27 全零/18 与 23 及每一行的归属、A15 的五语零重复键与 tr.json 逐字节一致、A17 的白名单名称与原始下标（含四处编号先于过滤）与上游 3069b556 契约、A3 的 34 个重叠文件里 29 个「相对上游的差异恰等于 fork 自身差异」，全部由我独立复算命中；Runtime 6 项检查（candidateId 577a3ea8、operationId 77515c46）均 passed 且日志支持结论，A8–A13 通过。规格「数字更正记录」声称的两处更正确实成立：按同一口径在 7aa22a95（最终两个提交之前）复算恰得 13/8，在 aeef1495/a6b62b86 得 18/23，ProviderList 的上游改动确属 searchSlot/focusSearch（31c6f574、49d529fb），每行溢出菜单卸载属 AppsPage.tsx 的 f7696fa8，且 ProviderList.tsx 对 uninstall 零命中。但更正只做了一半：spec.md:119、211、243 仍保留被推翻的旧归属（另有 61/99 的枚举标签 off-by-one、125 的 opencode 下标 89 应为 84、100 的 commands/mod.rs 与 database/** 归属错乱），使正式规格与 brief A3、§4.1 自相矛盾，故 A7 判 failed，整体 verdict = fail；需要的修复全部是文档措辞，不需改动已验证的代码。 | 2026-10-15T04:48:08.372Z |
| 3 | 2 | 0 | recovery | — | Native confirmed acceptance criteria changed | 2026-10-15T04:55:15.378Z |
| 4 | 1 | 1 | fail | A7 | 候选实现本身经独立复算全绿：A1/A2 的 143→145 区间、主题序列 0 差异、patch-id 133 同/10 异与 10 处归类、A14 的 34 文件/27 全零/上游 18 行/fork 23 行及每一行归属、A15 的五语零重复键与 tr.json 逐字节一致、A17 的 local 条目名称与原始下标（含四处编号先于过滤）与上游 id 回查契约、A16 的 94 个仅上游文件与 HEAD 零差异，全部命中；Runtime 6 项检查针对当前 candidateId 146ab49a 与 operationId f63606c0 均 passed 且日志支持 A8–A13。唯一失败项仍是 A7：第 3 轮把更正做进了完整目标规格与 §4.1，但同属本 change 正式产物的 brief.md 三行（27「9 个前端文件」、28 把 commands/{mod,settings}.rs 算进 94、29 ProviderList 的「溢出菜单改造」）仍保留被实测推翻的旧说法，且与 spec.md:77「数字更正记录」自称已更正的表述互相矛盾；§4.1 的那 1 行更正尚未提交。需要的修复全部是文档措辞，不需改动已验证的代码。 | 2026-10-15T05:21:47.630Z |
| 4 | 2 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-15T05:25:51.296Z |
| 5 | 0 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-15T05:36:26.025Z |
| 6 | 1 | 1 | recovery | — | Native Shape artifacts changed | 2026-10-15T08:21:53.064Z |
| 7 | 0 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-15T08:34:01.592Z |
| 8 | 1 | 1 | pass | — | Replayed-history structure, patch-id mapping, the 34-file landing-fidelity audit (27 zero / 18 upstream-missing / 23 fork-missing, all lines attributed), locale duplicate/identity checks, all version and fork-semantics greps, the Q2 allowlist with the original-index id contract, and all six build/test checks (re-run by me on this exact candidate) verify; the prior A7 figure defects are fixed and no refuting contradiction was found, leaving only three wording/staleness imprecisions listed as risks. | 2026-10-15T09:30:55.222Z |



## 结论

Replayed-history structure, patch-id mapping, the 34-file landing-fidelity audit (27 zero / 18 upstream-missing / 23 fork-missing, all lines attributed), locale duplicate/identity checks, all version and fork-semantics greps, the Q2 allowlist with the original-index id contract, and all six build/test checks (re-run by me on this exact candidate) verify; the prior A7 figure defects are fixed and no refuting contradiction was found, leaving only three wording/staleness imprecisions listed as risks.
