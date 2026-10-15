# 目标

`tests/components/AppsPage.test.tsx` 的用例「keeps a tool locked through version refresh and remount with an expired cache」在 fork CI 的 Frontend Checks 上稳定失败（v4.0.12-1 交付后 attempt 1、attempt 2 同一条用例红），本地无法复现。失败是时序竞态，属上游自带的测试缺陷：该文件与 `src/components/apps/**` 与上游 tag `v4.0.12` 逐字节相同。目标是在 fork 侧消除这条竞态，让 fork CI 重新成为「红即真回归」的可靠信号，同时不改变用例要检验的行为。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/fix-appspage-cache-race/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/<capability>/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-fix-appspage-cache-race/`（由 Runtime 归档动作生成）。

### 修改

- `tests/components/AppsPage.test.tsx`：仅上述一条用例（`it("keeps a tool locked through version refresh and remount with an expired cache", ...)`，第 1729 行起）。竞态成因：`renderApps()`（第 162-172 行）只 `waitFor` 「appsPage.checkUpdates」这段文字出现，不等各工具行自己的查询落定；工具行的「更新」按钮要等安装探测返回后才渲染（`src/components/apps/AppsPage.tsx:337` 是按钮本体、`:579` 是 `aria-label={t("common.loading")}` 的加载态、`:621` 按状态切换文案）。用例在 `await renderApps()` 之后才 `mocks.getToolVersions.mockImplementationOnce(() => refreshed.promise)`（第 1733 行）并立刻 `fireEvent.click(updateButton("Claude Code"))`（第 1734 行）：挂载时那次首次 `getToolVersions` 如果还没发出，就会被这个 `mockImplementationOnce` 吃掉，卡片停在加载态，`updateButton()` 同步取按钮即抛 `TestingLibraryElementError`（CI 日志实测：DOM 里只有名为 `common.loading` 的 `status` 与 `disabled` 的 `appPage.moreActions`，没有 `settings.toolUpdate`）。改法：在装 `mockImplementationOnce` 之前先 `await waitFor(...)` 确认 Claude Code 行的「更新」按钮已渲染，使首次探测必然由默认 mock 完成、`once` mock 必然由点击后的刷新消费；点击之后对按钮状态的同步读取按同一口径改成显式等待。不删任何既有断言。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 fork 专属白名单表新增 `tests/components/AppsPage.test.tsx` 条目，写明「fork 只为消竞态改这一条用例的等待方式，行为断言与上游一致」，并提醒下一轮同步该文件会与上游重叠。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`：在 fork 魔改清单里记录这条 fork 侧测试改动（归档时更新）。

### 删除

- 无文件删除，不删任何断言或用例。

### 明确不建

- 不新建分支或 worktree（隔离方式 `current`，直接沿用 main）。
- 不改 `src/components/apps/**`、`useToolManagement.ts` 或任何生产代码：CI 红的是测试时序，不是应用行为。
- 不放宽或删减该用例的任何断言（首次+刷新探测次数 `toHaveLength(2)`、Claude 按钮 `toBeDisabled` 与 `aria-busy="true"`、Codex 按钮可用、批量后 `runToolLifecycleAction` 的调用次数与工具归属、末尾 `isReady("Claude Code")` 全部保留）。
- 不动该文件里其余 50 条用例，也不动 `tests/components/SessionManagerPage.test.tsx` 等已知时钟敏感用例。
- 不给上游提 issue、不创建 PR；推送远端不在本轮默认授权内。
- 不创建临时脚本或额外目录。

## 取证事实（本轮实测）

- fork CI run `38720334438`（`main` push，commit `4328937c`）：`Frontend Checks` 的 `Unit tests` 步骤失败，汇总 `Test Files 1 failed | 232 passed (233)`、`Tests 1 failed | 3065 passed (3066)`，唯一失败项就是这条用例；`gh run rerun --failed` 之后 attempt 2 在同一条用例同样失败。
- 逐字节相同：`git diff --quiet v4.0.12 HEAD -- tests/components/AppsPage.test.tsx` 通过；该文件与 `src/components/apps/**` 都在 v4.0.12 轮的「94 个仅上游改动文件」清单里；用例文本在 `v4.0.10` 就已存在。
- 上游同样红：`farion1231/cc-switch` 同期两个 PR 的 CI（run `38724111672`、`38724922846`）都在这条用例上失败。
- 本地不复现：`npx vitest run tests/components/AppsPage.test.tsx -t "keeps a tool locked..."` 连续 10 次全过；`pnpm test:unit` 全量两轮各 233 文件 / 3066 用例全过；8 份并发同文件全过（本机 12 核）。差异指向 GitHub `ubuntu-latest` + Node 20 的调度时序。
- fork 侧同类先例：提交 `1ec0fc08` 以「开关初值断言改用 waitFor」消掉 deeplink 用例在 fork CI 的 unchecked 竞态。

# 非目标

- 不改应用行为，也不改上游这条用例想检验的语义。
- 不追求把该文件永久剔除出重叠面；接受「今后每轮同步这一条用例可能冲突」的代价。
- 不处理与本次无关的其他 CI 历史失败。
- 不引入新的测试工具、依赖或配置（`vitest.config.ts` 与 `package.json` 不改）。

# 验收示例

- A1: 改动面受限：`git diff --name-only` 只含 `tests/components/AppsPage.test.tsx` 与 `docs/HOW_TO_REBASE_UPSTREAM.md`（归档产物除外）；`git diff v4.0.12 -- tests/components/AppsPage.test.tsx` 的 hunk 只落在这一条用例（第 1729-1782 行区间）内，该文件其余 50 条用例、`src/**` 生产代码、`vitest.config.ts`、`package.json` 零改动；用例的既有断言一条都没删。
- A2: 竞态成因被正面消除：`mocks.getToolVersions.mockImplementationOnce(...)` 之前存在一次显式等待，确认 Claude Code 行的 `settings.toolUpdate` 按钮已渲染；等待不改变首次探测只发生一次的口径（remount 后 `mock.calls` 过滤 `claude` 仍为 2 次）。
- A3: `pnpm test:unit` 全绿（233 文件 / 3066 用例，含改后的这条），且对该用例连续单跑至少 10 次全绿。
- A4: `pnpm typecheck` 与 `pnpm format:check` 通过。
- A5: 该改动推上 `main` 后，fork CI 的 `Frontend Checks` 作业通过——这是竞态真正消失的判据；本地不复现，不能只凭本地绿就宣称修好。
- A6: `docs/HOW_TO_REBASE_UPSTREAM.md` §4 把该文件登记为 fork/上游重叠文件并写明「只改这一条用例的等待方式」，归档时 `docs/comet/specs/upstream-sync/spec.md` 的 fork 魔改清单包含这一条。

# 约束与不变量

- 只改测试的等待方式，不改断言强度：不得用 `query*` + 软判断、`if (...)` 跳过、`.skip`/`.todo`，也不得靠加大 timeout 或重试掩盖失败。
- `tests/components/AppsPage.test.tsx` 目前是「与上游逐字节相同」的文件；改动必须局限在这一条用例的语句内，让下一轮同步能按 hunk 合并，并在 §4 白名单里可追溯。
- 不碰该文件其他用例，不碰 `src/components/apps/**`；若实测证明必须改生产代码才能消除竞态，停下来回用户面前重新确认范围。
- 交付边界：推送 `main` 与任何远端动作都需要用户单独授权，本 change 的默认授权只到本地提交。

# 决策

- 处置方式（2026-10-15 用户选择「在 fork 里修好这条用例」）：不等上游修复随下个 tag 落地，也不只报上游，而是在 fork 侧消掉竞态。理由：fork CI 持续红会淹没真实回归；先例 `1ec0fc08` 已确立「fork 用 waitFor 消上游测试竞态」的做法。
- 修法：用「先等待按钮出现，再安装 `mockImplementationOnce`」的顺序修正，而不是放大 timeout、加重试或弱化断言。理由：CI 日志的 DOM 显示按钮缺席由首次探测未被消费导致，顺序修正直接消除成因且不损失检验强度。
- 验证判据：以 fork CI `Frontend Checks` 通过为准（A5），本地连续单跑与全量跑（A3）作为前置条件。

# 未决问题

- 无。

# 验证期望

- `pnpm typecheck`
- `pnpm format:check`
- `pnpm test:unit`
- 对目标用例连续单跑至少 10 次：`npx vitest run tests/components/AppsPage.test.tsx -t "keeps a tool locked through version refresh and remount with an expired cache"`
- `git diff --name-only` 与 `git diff --stat v4.0.12 -- tests/components/AppsPage.test.tsx` 确认改动面只有这一条用例 + `docs/HOW_TO_REBASE_UPSTREAM.md`
- 推送 main 之后 GitHub Actions `CI` 工作流的 `Frontend Checks` 作业结论（A5；推送需用户单独授权）
