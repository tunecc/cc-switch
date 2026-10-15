# 完整目标规格：fork-test-stability

## 概述

fork（tunecc/cc-switch）把「CI 绿 = 真实信号」当作维护前提：fork CI 的 `Frontend Checks` 一旦因环境时序长红，就会淹没真正的回归。本能力描述 fork 在这一侧的稳定化改动：只为消除测试时序竞态而修改上游自带用例的**等待方式**，绝不改变用例检验的行为、断言强度或生产代码。

## 稳定后状态（完整行为描述）

### `tests/components/AppsPage.test.tsx` 的 fork 侧差异

- 文件整体仍是上游版本；fork 的差异只落在一条用例：`describe("AppsPage concurrent CLI upgrades")` 里的 `it("keeps a tool locked through version refresh and remount with an expired cache")`（上游文本位于第 1729-1782 行区间）。
- 该用例的执行顺序固定为：
  1. `await renderApps()` 挂载应用页；
  2. **显式等待** Claude Code 工具行渲染出 `settings.toolUpdate` 按钮（即安装探测已落定、行不再停在 `common.loading` 加载态）；
  3. 之后才安装 `mocks.getToolVersions.mockImplementationOnce(() => refreshed.promise)`，使这个「永远先挂着」的 mock 必然被**点击后的版本刷新**消费，而不是被挂载时的首次探测消费；
  4. `fireEvent.click(updateButton("Claude Code"))` 触发刷新，随后 `waitFor` 断言卡片出现 `common.loading`（这一段沿用上游原文）；
  5. `view.unmount()`，把 `Date.now` 拨到 +11 分钟（越过 10 分钟的版本缓存 TTL）后重新 `renderApps()`；
  6. 断言挂载与刷新合计只对 `claude` 发起 2 次 `getToolVersions`（remount 不得重复探测正在刷新的工具）；
  7. 对 remount 后「按钮存在且 `toBeDisabled`、`aria-busy="true"`、Codex 按钮仍可用」的读取改成显式等待（`findBy*`/`waitFor`），因为按钮要先由 remount 的首帧渲染出来；
  8. 点击 `updateAllButton()` 后 `waitFor` 断言 `runToolLifecycleAction` 被调用 3 次、其中含 `claude` 的只有 1 次（正在刷新的工具被批量跳过）；
  9. `refreshed.resolve([...])` 后断言 `isReady("Claude Code")` 为真。
- 断言强度不得下降：步骤 6-9 的每一条既有断言（调用次数、`toBeDisabled`、`aria-busy`、Codex 可用、`isReady`）都必须保留；不允许 `query*` + 软判断、`if` 跳过、`.skip`/`.todo`、单独的 `.timeout()` 放大或重试包装。
- 该文件其余 50 条用例保持与上游逐字节相同。

### 生产代码不变

- `src/components/apps/AppsPage.tsx`、`useToolManagement.ts`、`toolUninstallCommands.ts`、`ManualUninstallDialog.tsx`、`ToolUninstallConfirmDialog.tsx` 与 `src-tauri/src/commands/{tool_uninstall,tool_node_requirement}.rs` 一律不改。竞态在测试的 mock 装配顺序与同步读取上，不在应用行为上；若将来证明必须改生产代码才能消除，本能力不接受，需另立 change 重新确认范围。
- `vitest.config.ts`、`tests/setupTests.ts`、`package.json` 不改：不通过全局超时、串行池或 mock 环境开关来掩盖时序问题。

### 文档记录

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 的 fork 专属白名单表新增 `tests/components/AppsPage.test.tsx` 条目：说明 fork 只改这一条用例的等待顺序（先等 `settings.toolUpdate` 出现再装 `mockImplementationOnce`，remount 后的按钮读取改用显式等待），其余内容与上游一致；并提醒下一轮同步该文件属上游/fork 重叠面，按 §3 合并时要保住这段 fork 语义。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md` 的 fork 魔改保留清单加入这一条，使下一轮同步的落地保真核对把该文件的 fork 差异计为「刻意保留」而非丢失。

## 成因与判定口径

- 现象（fork CI run `38720334438`，commit `4328937c`，attempt 1 与 attempt 2 同因失败）：`Frontend Checks` 的 `Unit tests` 报 `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "settings.toolUpdate"`，同屏可访问角色里只有名为 `common.loading` 的 `status` 与 `disabled` 的 `appPage.moreActions` 按钮；汇总 `Test Files 1 failed | 232 passed (233)`、`Tests 1 failed | 3065 passed (3066)`。
- 归属：该测试文件与 `src/components/apps/**` 与上游 `v4.0.12` 逐字节相同（`git diff --quiet v4.0.12 HEAD -- <文件>` 通过，属 v4.0.12 轮「94 个仅上游改动文件」），用例文本自 `v4.0.10` 即存在；上游仓库同期两个 PR 的 CI（run `38724111672`、`38724922846`）在同一条用例上失败。故属上游自带缺陷，不是 fork 同步丢语义。
- 机制：`renderApps()` 只等待「appsPage.checkUpdates」文案出现，不等待各工具行的安装探测落定；工具行的 `settings.toolUpdate` 按钮要等探测返回才渲染（`AppsPage.tsx:337` 按钮、`:579` 加载态、`:621` 文案切换）。在 GitHub `ubuntu-latest` + Node 20 的调度下，挂载时的首次 `getToolVersions` 可能晚于第 1733 行的 `mockImplementationOnce` 发出，于是被这个挂着不 resolve 的 promise 消费，卡片停在加载态，第 1734 行的同步取按钮即失败。
- 本地不可复现的取证（用于区分「环境时序」与「真回归」）：目标用例连续单跑 10 次全绿；`pnpm test:unit` 全量两轮各 233 文件 / 3066 用例全绿；8 份并发同文件全绿（本机 12 核）。
- 判定这类红口的固定顺序：先 `git diff --quiet <上游 tag> main -- <测试文件> <组件>` 证与上游逐字节相同，再 `gh run list --repo farion1231/cc-switch` / `gh run view <id> --log-failed` 看上游是否同样失败；只有「上游绿、fork 红」才需要往 fork 侧查。

## 验收映射

- A1 ← 上文「fork 侧差异」的改动面约束（只这一条用例 + §4 文档）。
- A2 ← 「执行顺序固定为」步骤 2-3、6 的装配顺序与探测次数口径。
- A3 ← 「断言强度不得下降」与本地连续单跑、全量跑证据。
- A4 ← `pnpm typecheck` / `pnpm format:check` 通过。
- A5 ← 「成因与判定口径」里的 CI 现象消失：fork CI `Frontend Checks` 通过。
- A6 ← 「文档记录」两条。

## 错误与边界

- 若修好后同一用例仍在 CI 失败：说明成因不止装配顺序，此时不得用超时或重试压掉，应带着新的 CI 证据回到范围确认（可能需要改组件的渲染时机，属另一类改动）。
- 若下一轮上游同步改写了这条用例：以本轮同步的上游文本为基础，重新套用「先等按钮、再装 `mockImplementationOnce`、remount 后显式等待」这一顺序，并在 §4 条目里更新行号区间；不得整文件取上游而丢掉 fork 的等待修正。
- 交付边界：本能力不授权任何远端动作；推送 `main` 以验证 A5 需要用户单独同意。
