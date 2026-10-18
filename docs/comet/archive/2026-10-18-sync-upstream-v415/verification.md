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
- 完成时间: 2026-10-18T10:47:02.661Z
- 摘要: 独立验收 15/15 全部通过（VERDICT: pass）。rebase 后 merge-base = v4.0.15 剥离提交 79e754ab，区间内仅 fork 作者；153 重放提交主题序列零差异；高危叠加面两侧语义并存；四处版本 4.0.15-1、SCHEMA_VERSION=21；fork 魔改 14 项保留清单全在位；typecheck/test:unit(3228)/format/build:renderer/cargo check/cargo test(约4040) 全绿零跳过；48 文件落地保真复算的 17+7 行缺失全部落在声明取舍内；locale 零重复键、tr.json 与上游逐字节一致。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main v4.0.15` 等于 `988b0d00`（tag `v4.0.15` 指向的提交），`git log v4.0.15..main` 只包含 fork 提交、不含任何上游提交。 | merge-base main v4.0.15 == 79e754ab == git rev-parse 'v4.0.15^{}'（annotated tag 对象 988b0d00 剥离后提交）；git log --format='%an <%ae>' v4.0.15..main \| sort -u 仅 Tune；rev-list 155（153 重放 + sync 终态 fc4c14f4 + 规格登记 1b657c41）。 |
| A2 | passed | brief.md | A2: 重放前 `v4.0.12..main` 的 153 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）在完整目标规格「重放映射」中逐条记录；每次冲突停车逐条记录归属与解法。 | 153 条主题序列 v4.0.12..pre-sync-v415 vs v4.0.15..main 前 153 条 逐行 diff 0 行；第 154/155 条为终态提交；patch-id 抽样 #10/#100/archive 对 SAME，#2 差异与 spec 停车归类一致。 |
| A3 | passed | brief.md | A3: 49 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（版本与锁文件、`settings.rs`、`tray.rs`、`misc.rs`、`App.tsx`、`Sidebar.tsx`、`ProviderList.tsx`、`ClaudeFormFields.tsx`、`ClaudeDesktopProviderForm.tsx`、4 个 locales、测试文件为高危面）。 | 高危面两侧语义并存实证：settings.rs（usage_display×5 + VisibleSidebarPanels×6 + 原子/宽松加载）、misc.rs（tunecc :82 + 上游 PORTABLE :103）、lib.rs（updater 0 命中、portable 注册、connectivity 注册）、types.ts 四组字段、App/Sidebar visibleSidebarPanels、ProviderList 右键菜单+searchSlot、AboutSection fork 简化版、setupTests IS_FORK_BUILD mock、金标 kimi-k3[1M]。无整文件取一侧。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.15-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。 | 四处版本号均 4.0.15-1；SCHEMA_VERSION=21（mod.rs:54）；v20→v21 迁移段（schema.rs:593）与其幂等测试（schema.rs:3969）在位。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤（官方+本机推理白名单）、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | fork 魔改保留清单 14 项逐一 grep 实证在位：产品名/DevPanel/可见面板/模型徽章与快捷切换/兜底直达区/右键置顶置底/预设过滤/连通性测试/双官网/托盘左键/跨应用导入/updater 全禁（依赖与权限零命中、空壳命令、About 指 tunecc）/release.yml 裁剪/README。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。 | .comet/config.yaml default_workflow native + workflows [native, classic]；上游 diff 对 vite.config.ts、src/config/fork*、release.yml 等fork 专属文件零命中；这些文件工作树与 pre-sync-v415 逐个 git diff --quiet 一致。 |
| A7 | passed | brief.md | A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。 | HOW_TO 新增 §4.2 v4.0.15 轮叠加要点（fc4c14f4）；spec 重写为同步后完整状态，重放映射/落地保真/停车清单/取舍清单已逐节核对原文。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | pnpm typecheck exit 0（tsc --noEmit 无输出）。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/components/{ModeDialog,OpenTerminalDialog,StackSettingsSheet,UsageDisplaySection,AppsPage,ProviderList,ProviderPresetSelector,ClaudeFormFields,ClaudeDesktopProviderForm}.test.tsx`、`tests/components/shell/SidebarToday.test.tsx`、`tests/hooks/{useMoneyFormat,useSwitchProviderResult}.test.tsx`、`tests/utils/routeSwitchNotification.test.ts` 等）与 fork 既有用例。 | pnpm test:unit 244 文件 3228 用例全过 0 failed，含上游本轮 11 个新测试文件与 fork 用例。 |
| A10 | passed | brief.md | A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。 | pnpm format:check 全绿（All matched files use Prettier code style!）。 |
| A11 | passed | brief.md | A11: `pnpm build:renderer` 通过。 | pnpm build:renderer ✓（6.77s）。 |
| A12 | passed | brief.md | A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（本轮唯一合法改动是 `cc-switch` 包版本号行）。 | cargo check exit 0；前后 git diff Cargo.lock 为空（锁文件未被改写，仅 cc-switch 版本号行已随终态提交）。 |
| A13 | passed | brief.md | A13: `cargo test` 通过（如遇与上轮同因的环境性失败——本机 cc-switch 占用代理端口 15721——按上轮口径显式 `--skip` 该用例并记录原因；上轮被 skip 的用例已被上游改名/重写，本轮以实际失败项为准，不扩大跳过列表）。 | cargo test 全量约 4040 passed / 0 failed；9 个 ignored 均为上游既有 #[ignore]（WSL/真实 key/性能/S3），非新增 skip；上轮改名用例已随上游通过，无环境性失败。 |
| A14 | passed | brief.md | A14: 落地保真核对通过：对 49 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.12`、`v4.0.15`、`pre-sync-v415`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。 | 48 重叠文件四 ref 多重集独立复算：上游缺失 17 行 / fork 缺失 7 行，逐一对应 spec 声明的授权取舍或改写（版本号×4、App.tsx import 改写、About 已授权取舍、supportsOneM 适配], AppsPage 注释改写），其余 39 文件 0 缺失。 |
| A15 | passed | brief.md | A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位；`tr.json` 与 `git show v4.0.15:src/i18n/locales/tr.json` 逐字节一致。 | 5 locale object_pairs_hook 解析零重复键；zh/en 各 284 fork 新增键全在位；tr.json 与 git show v4.0.15 逐字节一致（sha256 相同）。 |

## 检查

_没有记录 Runtime 检查。_

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — tsc --noEmit 无输出
- pnpm format:check: passed — prettier 修复 locale 粘连后全绿
- pnpm test:unit: passed — 3228/3228（244 文件）
- pnpm build:renderer: passed — vite build 6.14s
- cargo check: passed — Cargo.lock 仅版本号一行
- cargo test: passed — 4040/4040，无环境性 skip
- A14 落地保真核对: passed — /tmp/v415/fidelity.js 48 文件 18/7 全归类
- locale 重复键查重: passed — 5 locale object_pairs_hook 零重复
- 冲突标记零命中: passed — git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' 零命中
- 已知限制: upstream/main 的 2 个 post-release 提交（77c6dc79 托盘玻璃面板、73cdfbb7 土耳其语文案）未纳入，按 2026-10-18 用户决定留待下一轮
- 已知限制: portable zip 直链不接入前端（既定取舍）；open_portable_update_download 命令随上游保留注册，其 URL 基址仍指上游仓库，接入前端时才需改指 tunecc
- 已知限制: fork CI 未本地运行（推送后由 GitHub Actions 观察）

## 阻塞项

_无。_

## 风险与跳过的工作

- origin/main 未推送：push 属归档后交付步骤，本验收不含
- AboutSection 上游缺失行数复算 10 vs spec 11：归一化后 '}, [' 行的计数口径差异，同一授权取舍语义集，无语义出入
- misc.rs portable zip URL 模板仍指上游仓库：前端无调用点（既定取舍：命令保留、入口不接入），About 与 check_for_updates 均 指 tunecc

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-18T10:28:13.723Z |
| 2 | 1 | 1 | pass | — | 独立验收 15/15 全部通过（VERDICT: pass）。rebase 后 merge-base = v4.0.15 剥离提交 79e754ab，区间内仅 fork 作者；153 重放提交主题序列零差异；高危叠加面两侧语义并存；四处版本 4.0.15-1、SCHEMA_VERSION=21；fork 魔改 14 项保留清单全在位；typecheck/test:unit(3228)/format/build:renderer/cargo check/cargo test(约4040) 全绿零跳过；48 文件落地保真复算的 17+7 行缺失全部落在声明取舍内；locale 零重复键、tr.json 与上游逐字节一致。 | 2026-10-18T10:47:02.661Z |



## 结论

独立验收 15/15 全部通过（VERDICT: pass）。rebase 后 merge-base = v4.0.15 剥离提交 79e754ab，区间内仅 fork 作者；153 重放提交主题序列零差异；高危叠加面两侧语义并存；四处版本 4.0.15-1、SCHEMA_VERSION=21；fork 魔改 14 项保留清单全在位；typecheck/test:unit(3228)/format/build:renderer/cargo check/cargo test(约4040) 全绿零跳过；48 文件落地保真复算的 17+7 行缺失全部落在声明取舍内；locale 零重复键、tr.json 与上游逐字节一致。
