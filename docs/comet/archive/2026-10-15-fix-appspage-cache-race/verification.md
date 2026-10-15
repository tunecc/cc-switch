---
generated_from_state_version: 8
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-15T12:59:59.349Z
- 摘要: All six items pass by direct measurement. The change is confined to one upstream-owned test case plus one documentation row, no assertion is weakened, the wait is placed so the one-shot mock is consumed by the click's refresh rather than the mount probe, local typecheck/format/full suite are green, and the decisive criterion A5 holds: fork CI run 38732055212 on headSha 473378f6 completed with Frontend Checks success and 233 files / 3066 tests passing, immediately after the same case failed twice on the previous head and still fails in upstream's own CI. Working tree left clean at HEAD 473378f6.

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: 改动面受限：`git diff --name-only` 只含 `tests/components/AppsPage.test.tsx` 与 `docs/HOW_TO_REBASE_UPSTREAM.md`（归档产物除外）；`git diff v4.0.12 -- tests/components/AppsPage.test.tsx` 的 hunk 只落在这一条用例（第 1729-1782 行区间）内，该文件其余 50 条用例、`src/**` 生产代码、`vitest.config.ts`、`package.json` 零改动；用例的既有断言一条都没删。 | name-only diff 4328937c..473378f6 = exactly 2 files (tests/components/AppsPage.test.tsx +14/-3, docs/HOW_TO_REBASE_UPSTREAM.md +1); git diff v4.0.12 shows 3 hunks all inside the target it() (1730-1770); src/**, vitest.config.ts, tests/setupTests.ts, package.json, pnpm-lock.yaml, src-tauri/** untouched vs 4328937c; every prior assertion intact (claude-scoped toHaveLength(2)@1761, toBeDisabled/aria-busy/Codex toBeEnabled@1766-1768, runToolLifecycleAction 3 calls@1772 with exactly 1 containing claude@1778, isReady@1792); no .skip/.only/.timeout/softening. |
| A2 | passed | brief.md | A2: 竞态成因被正面消除：`mocks.getToolVersions.mockImplementationOnce(...)` 之前存在一次显式等待，确认 Claude Code 行的 `settings.toolUpdate` 按钮已渲染；等待不改变首次探测只发生一次的口径（remount 后 `mock.calls` 过滤 `claude` 仍为 2 次）。 | waitFor(updateButton) at 1736-1738 sits BEFORE mocks.getToolVersions.mockImplementationOnce at 1739, so the one-shot pending mock cannot be consumed by the mount-time probe; renderApps (166-170) awaits only the header text and updateButton (147-148) is a synchronous getByRole, which is the CI throw site; mount probe is async (useToolManagement.ts:506-513) and the button/loading states are gated in AppsPage.tsx:576-583,604-621; waitFor reads only the DOM and adds no getToolVersions call, so the 'initial probe + click refresh = 2' semantics still holds. |
| A3 | passed | brief.md | A3: `pnpm test:unit` 全绿（233 文件 / 3066 用例，含改后的这条），且对该用例连续单跑至少 10 次全绿。 | Re-ran pnpm test:unit myself: exit 0, Test Files 233 passed (233), Tests 3066 passed (3066), zero FAIL lines, target case green (two fresh runs); isolated target case 6 consecutive runs all exit 0 (1 passed \| 50 skipped). |
| A4 | passed | brief.md | A4: `pnpm typecheck` 与 `pnpm format:check` 通过。 | Re-ran pnpm typecheck: exit 0. Re-ran pnpm format:check: exit 0. |
| A5 | passed | brief.md | A5: 该改动推上 `main` 后，fork CI 的 `Frontend Checks` 作业通过——这是竞态真正消失的判据；本地不复现，不能只凭本地绿就宣称修好。 | gh run view 38732055212 --repo tunecc/cc-switch: status completed, conclusion success, headSha=473378f6fd4f98b340b677eac16db7e12a359559, workflow CI, Frontend Checks success; its Unit tests log shows the target case passed (607ms) with Test Files 233 passed (233) and Tests 3066 passed (3066) and no FAIL; contrast run 38720334438 (head 4328937c) failed the same case twice with the identical TestingLibraryElementError, and upstream runs 38724111672 / 38724922846 fail the identical case. |
| A6 | passed | brief.md | A6: `docs/HOW_TO_REBASE_UPSTREAM.md` §4 把该文件登记为 fork/上游重叠文件并写明「只改这一条用例的等待方式」，归档时 `docs/comet/specs/upstream-sync/spec.md` 的 fork 魔改清单包含这一条。 | docs/HOW_TO_REBASE_UPSTREAM.md:159 registers tests/components/AppsPage.test.tsx: (a) names exactly the one case changed, (b) states the other 50 cases track upstream (vitest counts exactly 51 in the file, so 50 others), (c) instructs the next sync round to keep the fork wait-ordering instead of taking the whole file from upstream and not to read it as lost sync semantics; its factual claims check out against git and both CI logs (error text, throw site at updateButton line 148, renderApps awaiting only the header). |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 11423 ms |
| pnpm format:check | format:check | . | passed | 0 | 4114 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 40205 ms |
| 目标用例单跑 | vitest run tests/components/AppsPage.test.tsx -t keeps a tool locked through version refresh and remount with an expired cache | . | passed | 0 | 1964 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 7467 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — 开发期复跑，tsc --noEmit 无输出
- pnpm format:check: passed — prettier 全量通过
- pnpm test:unit: passed — 233 文件 / 3066 用例全绿
- 目标用例连续 10 次单跑: passed — 0 失败
- 25ms 延时对照实验: passed — 上游写法红、新写法绿；实验文件已删除
- 已知限制: 本地无法自然复现这条红：10 次单跑、两轮全量与 8 份并发同文件都绿。竞态只在 GitHub ubuntu-latest + Node 20 的调度时序下出现，因此 A5 的 CI 结论是唯一直接证据，本地绿只作前置。
- 已知限制: 同一时段上游仓库 farion1231/cc-switch 两个 PR 的 CI（run 38724111672、38724922846）也在这条用例失败，说明缺陷在上游自带测试里；fork 侧只做等待顺序修正，不改上游语义。
- 已知限制: 该文件因此成为 fork/上游重叠文件；下一轮同步需在 §4 登记的口径下合并这一条用例。
- 已知限制: 若推 main 后的 CI 仍然在这条用例红，说明成因不止装配顺序（可能还要等其它行渲染），需带新证据回到范围确认，不能靠超时或重试压制。
- 已知限制: waitFor 默认 1s 超时；若 GitHub runner 更慢，可能需要显式超时——但本轮未加，保持断言强度优先。

## 阻塞项

_无。_

## 风险与跳过的工作

- A6's '本地跑不出来' claim is corroborated by the CI red-to-green transition and by deterministic local mocks; I did not re-run the upstream text locally because I skipped the optional delay-injection experiment in order to leave the repository untouched.
- A6's second clause (the global docs/comet/specs/upstream-sync/spec.md fork-魔改 list entry) is produced by the archive step and is not yet written; that is correct pre-archive but depends on archive actually landing that row.
- Runtime check records match candidate c5ee6be4 / stage verifying / commit 473378f6; I re-measured A3, A4 and A5 directly rather than relying on the records.

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | All six items pass by direct measurement. The change is confined to one upstream-owned test case plus one documentation row, no assertion is weakened, the wait is placed so the one-shot mock is consumed by the click's refresh rather than the mount probe, local typecheck/format/full suite are green, and the decisive criterion A5 holds: fork CI run 38732055212 on headSha 473378f6 completed with Frontend Checks success and 233 files / 3066 tests passing, immediately after the same case failed twice on the previous head and still fails in upstream's own CI. Working tree left clean at HEAD 473378f6. | 2026-10-15T12:59:59.349Z |



## 结论

All six items pass by direct measurement. The change is confined to one upstream-owned test case plus one documentation row, no assertion is weakened, the wait is placed so the one-shot mock is consumed by the click's refresh rather than the mount probe, local typecheck/format/full suite are green, and the decisive criterion A5 holds: fork CI run 38732055212 on headSha 473378f6 completed with Frontend Checks success and 233 files / 3066 tests passing, immediately after the same case failed twice on the previous head and still fails in upstream's own CI. Working tree left clean at HEAD 473378f6.
