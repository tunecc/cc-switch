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
- 完成时间: 2026-10-13T05:16:44.763Z
- 摘要: 15 项验收全部独立取证通过：A1/A2 由自算 git 结构与 patch-id 对照（134 同/5 异，归类逐条吻合）；A3-A6 由 HEAD blob 抽查与 config 对照；A7 由两个提交的 stat 与内容核实；A8-A13 采信与当前 candidateId/HEAD 匹配的 6 条 Runtime passed 记录并逐条抽查日志正文（226 文件/2792 测试、17 组 test result ok、唯一 1 filtered out 即既定跳过用例）；A14 按固定四 ref 多重集算法复算得 26 全零/5 非零、上游缺 7 行 fork 缺 4 行，与规格逐行归类一致；A15 object_pairs_hook 实测 4 locale dup=0 且 fork 键段在位。最终态工作树与 HEAD 冲突标记 0 命中。验收结论：pass。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 `90fb37ff`（tag `v4.0.10` 指向的提交），`git log v4.0.10..main` 只包含 fork 提交、不含任何上游提交。 | 独立取证：git rev-parse v4.0.10=90fb37ff；git merge-base main upstream/main=90fb37ff；git rev-list --count v4.0.10..main=141（139 重放+dc3c8ac3+0338b020）；v4.0.10..main 作者唯一为 Tune，无任何上游提交；v4.0.10..upstream/main=1（d9a62313 按惯例排除，不在 main）。 |
| A2 | passed | brief.md | A2: 重放前 `v4.0.9..main` 的 139 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因；每次冲突停车逐条记录归属与解法。 | 自算重放映射：v4.0.9..pre-sync-v410=139，重放后区间去掉本轮 2 提交=139；主题序列逐行 diff=0 行差异（无遗漏/重复/乱序）；git show\|git patch-id --stable 逐条比对得 134 同/5 异，5 对与规格记录逐一对应（109ecae4→96438646、2a621f3b→1239f35b、ca8ffa4e→384241ae、94eb84c0→df6f2d9e、a479e36c→449e7902）；抽查确认 #3 增删行集合逐字节相同（仅 context 位移）、#1/#4 差异仅被删基线行 4.0.9→4.0.10，归类属实。重放区间内 tree 带冲突标记的提交实测 69 个，与规格声明一致（fork 历史既有瑕疵的忠实重放，中间提交瑕疵不影响最终交付）。 |
| A3 | passed | brief.md | A3: 31 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.10-1`、`Cargo.toml`/`Cargo.lock` 同时具备上游新增的 `png` 依赖与 `tokio` 的 `net` feature 和 fork 移除 updater 的状态、`README.md` 保留 fork 重写版，且上游「自定义图标上传与我的图标库」「深链接 pending 暂存与 `deeplink-pending` 事件、`iconUrl`、链接声明 API 格式、导入 Pi、Codex/Grok Build 链接配置保留」「首 token 时间与 Sub2API 模板」「NekoCode 预设与 OpenModel/YYLX 条目」「`claude-haiku-5-5` 别名」「`cc-switch-official` 桶迁回 openai」全部按上游语义落地。 | 自算 31 重叠文件（diff --name-only v4.0.9..v4.0.10 ∩ v4.0.9..main，实测恰 31 个）的 A14 多重集核对 26 个两侧全零，覆盖全部高危叠加面；HEAD blob 抽查：lib.rs 含 PendingDeepLink/set_pending_deeplink/deeplink-pending 且迁回调用在统一迁移前、updater 0 命中；commands/mod.rs 三行 custom_icon+connectivity_test 且无 stream_check；database/{mod,dao/mod,backup}.rs 上游 custom_icons 导出与 strip_invalid_custom_icons 在位且 stream_check 仅剩 schema.rs 建表/索引；deeplink/provider.rs+services/provider/mod.rs 的 website_url_2: None 经 A14 零缺失证实；BasicFormFields 上游 setIconDialogOpen(false)/defaultName 与 fork websiteUrl2 段并存；预设 NekoCode+hidden 并存；package.json dev:fork 在、无 plugin-updater 依赖；Cargo.toml png=0.18+tokio net 并存；版本号四处 4.0.10-1；README 为 fork 重写版。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.10-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留、上游「我的图标」的 settings 键读写随上游落地。 | 实测 package.json/tauri.conf.json/Cargo.toml/Cargo.lock(cc-switch 包) 均为 4.0.10-1；database/mod.rs SCHEMA_VERSION=21；schema.rs v20→v21 幂等修复迁移（enabled_mcode/enabled_pi/skills）完整在位；上游 custom_icons settings 键读写落地（dao/custom_icons.rs、CUSTOM_ICONS_KEY 5 文件命中）。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | 保留清单逐项取证：产品名/DevPanel（devpanel 目录+86 文件命中 fork 常量）、visible_sidebar_panels 与上游 LocalMigrations/CodexOfficialHistoryUnify 在 settings.rs 并存、模型徽章/快捷切换（ModelQuickSwitch 等）、兜底直达区 fallbackQuickAccessSection、右键一键置顶/置底（ProviderList.tsx:240）与新建第二位（mutations.ts sortIndex=1）、forkOfficialAllowlist 56 文件+8 预设 hidden 字段、connectivity_test 两命令在 lib.rs 注册、双官网链接 website_url_2 64 文件/websiteUrl2 67 文件、托盘左键 toggle_main_window+show_menu_on_left_click(false)、跨应用导入 ProviderImportEntry 36 文件、About 三处指向 tunecc Releases 且 installUpdateAndRestart/updater:default 在 src 与 src-tauri 0 命中、release.yml windows-2022+macos-14 裁剪并注释跳过上游纯 tag 发版、README fork 差异说明在位。fork 已删语义未被带回（stream_check 仅 schema.rs）。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件（`vite.config.ts` 的 `__CCS_FORK_BUILD__`、`.github/workflows/{ci,release}.yml` 裁剪、`src/config/fork*` 等）未被上游或重放改写。 | git rev-parse HEAD:.comet/config.yaml 与 pre-sync-v410:.comet/config.yaml 同为 cebdcda66dbdcfde8b8de9331650753fb138b223，内容 default_workflow: native 且 workflows 含两制；vite.config.ts/vitest.config.ts/src/config/fork*.ts/.github/workflows/{ci,release}.yml 七个白名单文件 HEAD 与 pre-sync-v410 blob 全部 SAME，vite.config.ts 含 __CCS_FORK_BUILD__。 |
| A7 | passed | brief.md | A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。 | git show dc3c8ac3 --stat：HOW_TO_REBASE_UPSTREAM.md +27/−15 行，内容实测含 v4.0.10 各叠加条目（lib.rs pending 深链接与 Reopen if-let 解法、settings.rs LocalMigrations+VisibleSidebarPanels、deeplink/provider.rs +384/−110、backup.rs strip_invalid_custom_icons、8 预设 NekoCode、locales 查重义务、Cargo png/tokio net、本轮 5 次冲突统计与 99 个仅上游文件清单）；0338b020 提交本 change brief+完整目标规格（重写为同步后状态，含重放映射与落地保真核对两节）。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | Runtime 记录 typecheck passed（exit 0，candidateId 4cecb902 与本次绑定一致，执行于 05:03Z，晚于 HEAD 0338b020 的 04:51Z 提交，工作区当前对 HEAD 干净）；日志正文确认跑了 cc-switch@4.0.10-1 的 tsc --noEmit 且无输出。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例与 fork 既有用例。 | Runtime test-unit passed（exit 0）；日志末尾实测 Test Files 226 passed (226)、Tests 2792 passed (2792)；含上游新增 IconPicker(10)/CustomIconNameDialog/AddProviderDialog(14)/ProviderPresetSelector(19)/UsageScriptModal/customIcon 用例与 fork 既有用例。 |
| A10 | passed | brief.md | A10: `pnpm format:check` 通过（fork CI 的 Frontend Checks 依次跑 typecheck → format:check → test:unit → build:renderer，手工拼接共享文件后必须本地归一化格式）。 | Runtime format-check passed（exit 0）；日志正文 'All matched files use Prettier code style!'。 |
| A11 | passed | brief.md | A11: `pnpm build:renderer` 通过。 | Runtime build-renderer passed（exit 0）；日志正文 '✓ built in 6.43s'。 |
| A12 | passed | brief.md | A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（上游新增 `png` 依赖与 fork updater 移除状态在锁文件里并存）。 | Runtime cargo-check (--all-targets) passed（exit 0，Finished dev profile，仅 1 条既有 unused import 警告）；Cargo.lock 在 dc3c8ac3 中仅版本号一行改动，当前工作区对 HEAD 无锁文件未提交改动，即 cargo check 未额外改写锁文件；锁文件 png 条目 2 处在位、tauri-plugin-updater 0 命中。 |
| A13 | passed | brief.md | A13: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | Runtime cargo-test passed（exit 0），argv 恰为 cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active（跳过列表未扩大）；日志 17 个 test result 行全部 ok、0 FAILED，主 libtest 行 3678 passed; 1 filtered out（唯一过滤即该端口冲突用例）；上游新增 import_clears_custom_icons_that_fail_validation、universal_provider_icon_is_validated_on_save_and_sync、save_settings_should_keep_the_existing_proxy_client_host 均实测 ok。 |
| A14 | passed | brief.md | A14: 落地保真核对通过：对 31 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.9`、`v4.0.10`、`pre-sync-v410`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。 | 按规格固定算法独立复算（四 ref：v4.0.9/v4.0.10/pre-sync-v410/HEAD，逐行去首尾空白、去一个行尾逗号、丢空行与 10 种纯符号行，多重集差）：重叠文件恰 31 个；26 个两侧均 0；非零恰 5 个——README.md 上游缺 3、package.json/Cargo.toml/tauri.conf.json/Cargo.lock 各上游缺 1 且 fork 缺 1；合计上游缺 7 行、fork 缺 4 行。缺失行逐条打印核实：README 3 行为 OpenModel 赞助位两行+深链接条目行（fork 重写版 README 无赞助商表，刻意取舍），其余 8 行全为 4.0.10/4.0.9-1 版本号行（终态 4.0.10-1，刻意取舍）。与规格记录逐行吻合，无未说明的非零缺失。 |
| A15 | passed | brief.md | A15: 4 个 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位（rebase 的三方合并会留下重复键且测试全绿，必须显式查重）。 | 不依赖测试，用 json.load(object_pairs_hook) 显式检测 4 个 locale：zh/en/ja/zh-TW 全部可解析且 dup_keys=0（含嵌套 inactiveFieldsHint）；fork 键段逐 key 比对：connectivityTest/connectivityCheck/searchModels/noModelsFound/websiteUrl2 四语全在位，devpanel 仅 zh/en——与规格记录一致，属 fork 既有状态非缺失。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 12046 ms |
| pnpm format:check | format:check | . | passed | 0 | 4305 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 42045 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 7448 ms |
| cargo check --all-targets | check --all-targets | src-tauri | passed | 0 | 8718 ms |
| cargo test with documented port-conflict skip | test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 102658 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck（开发期）: passed — tsc --noEmit 无输出，退出码 0
- cargo check --all-targets（开发期）: passed — Finished in 49.86s，锁文件仅版本号一行改动
- git 结构与重放核对（开发期）: passed — merge-base、rev-list 计数、主题序列 diff、patch-id 对照、标记扫描
- 四 ref 落地保真核对脚本（开发期）: passed — 31 个重叠文件，up=7 / fork=4，逐行归类已记录
- locale 重复键与 fork 键段查重（开发期）: passed — 4 个文件 dup=0
- 已知限制: A1/A2/A14/A15 属 git 结构与逐行核对，Runtime 计划只放构建与测试命令；请 Verifier 按规格「重放映射」与「落地保真核对」两段固定的口径自行复现（含脚本算法与预期数字）。
- 已知限制: 重放区间内 69 个提交的 tree 带冲突标记，来自 fork 历史自身（与重放前同序号提交的标记文件集合逐个一致），因此重放中途不能编译校验；只要求最终态工作树与 HEAD 零命中，本轮已实测为 0。
- 已知限制: pnpm test:unit 的 SessionManagerPage「switches to all apps and to time buckets」用例在本地时间 00:00–00:30 窗口必然失败（fixture 用 now-N 却断言存在「今天」分桶）；若落在该窗口请按环境因素判定，不据此改上游文件或放宽验收。
- 已知限制: cargo test 只跳过规格记录的那一条端口占用用例（15721 被本机 cc-switch 占用），其余必须全绿。
- 已知限制: 工作树仍有 docs/comet/changes/sync-upstream-v410/comet-state.yaml（Runtime 每轮改写的流程状态文件）未跟踪，验收不要求工作区为空。
- 已知限制: 交付（git push --force-with-lease origin main，随后在归档提交上创建 annotated tag v4.0.10-1 并推送触发 fork Release CI）按 Q1 授权在验收通过并归档之后执行，不是验收当时的状态。

## 阻塞项

_无。_

## 风险与跳过的工作

- 重放区间内 69 个中间提交的 tree 带未清理冲突标记（fork 历史既有瑕疵的忠实重放，标记文件集合与重放前同序号提交一致）；最终态工作树与 HEAD 实测 0 命中，不影响交付。
- 规格记录'加 dc3c8ac3 后区间共 140 个提交'系当时快照，现 HEAD 含 docs 提交 0338b020 后为 141，属时序演进非不符。
- 交付步骤（--force-with-lease 推 main、归档提交上建 tag v4.0.10-1 并推送）按 Q1 授权在验收通过并归档后执行，非本轮验收项，未在本验收中取证。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-13T04:54:34.402Z |
| 2 | 1 | 1 | pass | — | 15 项验收全部独立取证通过：A1/A2 由自算 git 结构与 patch-id 对照（134 同/5 异，归类逐条吻合）；A3-A6 由 HEAD blob 抽查与 config 对照；A7 由两个提交的 stat 与内容核实；A8-A13 采信与当前 candidateId/HEAD 匹配的 6 条 Runtime passed 记录并逐条抽查日志正文（226 文件/2792 测试、17 组 test result ok、唯一 1 filtered out 即既定跳过用例）；A14 按固定四 ref 多重集算法复算得 26 全零/5 非零、上游缺 7 行 fork 缺 4 行，与规格逐行归类一致；A15 object_pairs_hook 实测 4 locale dup=0 且 fork 键段在位。最终态工作树与 HEAD 冲突标记 0 命中。验收结论：pass。 | 2026-10-13T05:16:44.763Z |



## 结论

15 项验收全部独立取证通过：A1/A2 由自算 git 结构与 patch-id 对照（134 同/5 异，归类逐条吻合）；A3-A6 由 HEAD blob 抽查与 config 对照；A7 由两个提交的 stat 与内容核实；A8-A13 采信与当前 candidateId/HEAD 匹配的 6 条 Runtime passed 记录并逐条抽查日志正文（226 文件/2792 测试、17 组 test result ok、唯一 1 filtered out 即既定跳过用例）；A14 按固定四 ref 多重集算法复算得 26 全零/5 非零、上游缺 7 行 fork 缺 4 行，与规格逐行归类一致；A15 object_pairs_hook 实测 4 locale dup=0 且 fork 键段在位。最终态工作树与 HEAD 冲突标记 0 命中。验收结论：pass。
