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
- 完成时间: 2026-10-10T03:17:42.874Z
- 摘要: 12/12 全部通过。独立复算了 git 结构、重放保真（主题序列逐行 diff + patch-id 对照 + 文件级 blob 对照）、28 个重叠文件双向增删行差集、上游 9 项功能与 fork 14 项魔改的逐项 grep 取证，并独立复跑 typecheck / test:unit / cargo check / cargo test 四项检查（均 exit 0）与端口占用复核，未采信 Builder 结论。发现 3 处文档口径小瑕疵不影响实现正确性，建议归档前顺手修正。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main upstream/main` 等于 c2611266（tag v4.0.6 指向的提交），`git log v4.0.6..main` 只包含 fork 提交。 | git merge-base main upstream/main = c261126630b3416e67b407da018cc614bbbe84cd，与 git rev-parse v4.0.6^{commit} 一致；git rev-list --count v4.0.6..main = 129，git log --format=%an v4.0.6..main \| sort -u 仅 Tune（128 个重放提交 + 同步提交 0e4805ec），无上游提交落入区间。 |
| A2 | passed | brief.md | A2: rebase 前 2db86e94..main 的 128 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。 | 重放前 2db86e94..e574d8ae = 128 提交，重放后 v4.0.6..main 前 128 条主题序列逐行 diff 为空（无丢弃/重复/乱序，第 129 条为同步提交）；独立 patch-id 对照 113 相同 / 15 不同，15 个位置逐一对应规格登记的 12 处冲突解决点与上下文位移；387 个 fork 改动文件中 384 个与同步前逐字节相同，2 个为 fork 主动删除的 stream_check 文件（main 中同样不存在、表结构保留），1 个为计划内更新的 HOW_TO 文档。 |
| A3 | passed | brief.md | A3: 28 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：白名单/裁剪类文件（`README.md`、`.github/workflows/release.yml`、`src-tauri/tauri.conf.json` 等 fork 字段、`package.json`/`Cargo.toml`/`Cargo.lock`/`pnpm-lock.yaml` 的 fork 版本号与依赖）保留 fork 侧语义；共享代码以上游 v4.0.6 为基础叠加回 fork 必要语义，且上游供应商页搜索、Skills 一键全部更新、额度三色与 20% 阈值、托盘全档位标题、聚合模式经典子 agent 开关、托管账号解绑、Anthropic SSE 收尾修复、第三方目录自带模板、更新点改绿等改动全部落地。 | 独立双向差集脚本复算 28 个重叠文件：20 个四向差集全 0；8 个差异全部为规格登记的刻意取舍（4 个版本文件取 fork 4.0.6-1；release.yml 未引入上游 22 增/24 删且与 fork 侧逐字节相同；README.md 未引入上游 2 增/1 删且与 fork 侧逐字节相同；App.tsx 仅 lucide 导入排版差异，7 个图标全部导入且各使用 1 次、两个按钮 JSX 块结构完整；ProviderList.tsx extraAdd 为 fork 的 provider.websiteUrl2）。上游 9 项功能改动（供应商页搜索、Skills 全部更新、额度三色与 20% 阈值、托盘全档位标题、经典子 agent 开关、托管账号解绑、Anthropic SSE 收尾、第三方目录自带模板、更新点改绿）全部 grep 命中；61 个上游独有文件与 v4.0.6 逐字节相同。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.6-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。 | package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的 cc-switch 包版本号均为 4.0.6-1；src-tauri/src/database/mod.rs SCHEMA_VERSION = 21；schema.rs 20 => 分支的 v20→v21 幂等修复迁移（mcp_servers.enabled_mcode/enabled_pi、skills.enabled_mcode、set_user_version(21)）完整保留；database 目录相对同步前仅 dao/providers.rs +86（上游 unbind_codex_managed_accounts）。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。 | 14 项逐一 grep 取证全部命中：productName CC Switch + IS_FORK_BUILD + DevPanel（DEV_PANEL_ENABLED 门控）；VisibleSidebarPanels 前后端 + SidebarPanelPillRow；extractModelBadgeForProvider + ModelQuickSwitchDialog；ClaudeFormFields fallbackQuickAccessSection；applyQuickSort/quickMoveTop/Bottom + sortIndex 插入第二位；forkOfficialAllowlist + forkPresetFilter + hidden；connectivity_test_provider_models 命令注册 + ConnectivityTestDialog + services/connectivity_test 直连执行器；website_url_2 列/索引/v18→v19 迁移；toggle_main_window 左键分支 + show_menu_on_left_click(false)；ProviderImportEntry + useProviderImportApply；无 tauri_plugin_updater、capabilities 无 updater、updater.ts 恒 up-to-date、install_update_and_restart 空壳、AboutSection 指向 tunecc releases；release.yml fork 裁剪（windows-2022 + macos-14，跳过上游 tag）；README fork 差异说明；ci.yml/release.yml fork CI。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。 | main:.comet/config.yaml、pre-sync-v406:.comet/config.yaml、e574d8ae:.comet/config.yaml blob 同为 cebdcda66dbdcfde8b8de9331650753fb138b223；内容为 default_workflow: native + workflows [native, classic]；该文件未出现在同步 delta 中，工作树与 HEAD 一致。 |
| A7 | passed | brief.md | A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。 | 同步提交 0e4805ec 中 docs/HOW_TO_REBASE_UPSTREAM.md +17/-15，含 17 处 v4.0.6 叠加语义条目与 2 个新共享文件行（src-tauri/src/database/dao/providers.rs、src/lib/api/settings.ts）；specs/upstream-sync/spec.md 已重写为同步后完整状态（基线 c2611266、128 重放、28 重叠文件、4.0.6-1、SCHEMA_VERSION 21、12 处冲突逐条、App.tsx 合并教训）；本轮无新增 fork 专属代码文件。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过。 | 独立复跑 pnpm typecheck（tsc --noEmit）exit 0，无任何报错；运行版本 cc-switch@4.0.6-1 与候选一致。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过。 | 独立复跑 pnpm test:unit（vitest run）exit 0：Test Files 213 passed (213)，Tests 2541 passed (2541)，耗时 27.97s；运行于本地 11:09，不在 00:00-00:30 零点窗口内。 |
| A10 | passed | brief.md | A10: `cargo check` 通过。 | 独立复跑 cargo check --manifest-path src-tauri/Cargo.toml exit 0（Finished dev profile，Checking cc-switch v4.0.6-1）。 |
| A11 | passed | brief.md | A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。 | 独立复跑 cargo test --manifest-path src-tauri/Cargo.toml -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active exit 0：主测试二进制 3532 passed / 0 failed / 9 ignored / 1 filtered out，其余测试二进制全部 test result: ok，无 FAILED/panicked；lsof -nP -iTCP:15721 -sTCP:LISTEN 复核端口仍被 cc-switch PID 14998 占用，例外成立。 |
| A12 | passed | brief.md | A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 2db86e94→c2611266」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。 | 独立编写双向多重集合差集脚本复算：重叠文件集由 comm -12 <(git diff --name-only 2db86e94 e574d8ae) <(git diff --name-only 2db86e94 c2611266) 独立算得 28 个（与规格数一致）；-U0 增删行做 Counter 差集，20 个文件 upAddMiss=extraAdd=upDelMiss=extraDel=0；8 个差异文件逐条对应规格『落地保真核对』登记的刻意取舍，无未登记差异；另验证 61 个上游独有文件与 v4.0.6 逐字节相同、fork 独有文件 384/387 逐字节保留（2 个为 fork 主动删除、1 个为计划内文档更新）；最终态全树 git grep 冲突标记 0 命中。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 10180 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 29826 ms |
| cargo check | check --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 373 ms |
| cargo test with documented port skip | test --manifest-path src-tauri/Cargo.toml -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | . | passed | 0 | 32280 ms |
| baseline is ancestor of main | merge-base --is-ancestor c261126630b3416e67b407da018cc614bbbe84cd main | . | passed | 0 | 62 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — exit 0，最终态复跑
- pnpm test:unit: passed — exit 0，213 文件 / 2541 用例全绿，10:47 本地运行
- cargo check: passed — exit 0，cc-switch v4.0.6-1
- cargo test (documented port skip): passed — exit 0，3532 passed / 0 failed，端口 15721 占用已由 lsof 复核
- 已知限制: 交付（git push --force-with-lease origin main + 在归档提交上创建并推送 annotated tag v4.0.6-1）按 Q2 授权在验收通过并归档之后执行，不在本轮验收断言内；tag 必须指向归档提交，Verify 时该提交尚不存在。
- 已知限制: cargo test 沿用既有例外跳过 update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active（本机 CC Switch.app 运行占用代理端口 15721，已由 lsof 复核）。
- 已知限制: fork 历史提交 4b437070 的 src-tauri/src/database/tests.rs 与 src-tauri/src/services/provider/gemini_auth.rs blob 自带未清理冲突标记，由后续 fork 提交 24febbfb / c3d2f317 清除；重放中途 git diff --cached --check 会报 leftover conflict marker，属 fork 历史既有事实。最终态全树 grep 冲突标记为 0。
- 已知限制: fork 历史提交 9ee6f1f7 曾把 tests/components/ProviderList.test.tsx 误截断成 224 行片段（无 import/describe），由下一个 fork 提交 1f2565e6 补回；本轮按其真实语义增量（5 个右键用例 + mock）叠加到上游 v4.0.6 版本上，避免丢掉上游新增用例。
- 已知限制: fork 历史遗留死代码 src/hooks/useStreamCheck.ts 仍调用已不存在的后端命令（同步前的 lib.rs 同样未注册），本次同步未触碰该文件；保留清单里「旧 stream_check 链路已移除」仅对后端成立。

## 阻塞项

_无。_

## 风险与跳过的工作

- 文档口径小瑕疵 1（不阻塞）：specs/upstream-sync/spec.md 把 pnpm-lock.yaml 列入 28 个重叠文件，但独立算得的实际重叠集不含它（上游 v4.0.5..v4.0.6 未改该文件，fork 侧锁文件改动随重放自动保留，最终与同步前一致且无 plugin-updater 残留）。
- 文档口径小瑕疵 2（不阻塞）：spec.md 与 HOW_TO_REBASE_UPSTREAM.md 的 forwarder.rs 条目提到 fork 的 connectivityTest sanitize 隔离，但 forwarder.rs 在同步前后均无 connectivity 引用（fork 连通性测试实为 src-tauri/src/services/connectivity_test/ 独立 reqwest+SSE 直连执行器，已确认完整保留）。
- 表述不精确（不阻塞）：Builder 交接摘要称『同步区间相对上游区间多出的删除为 0』，实际存在计划内的多出删除（如版本号行、ProviderList.tsx 旧 fields 数组），A12 结论本身正确。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-10T02:59:37.053Z |
| 2 | 1 | 1 | pass | — | 12/12 全部通过。独立复算了 git 结构、重放保真（主题序列逐行 diff + patch-id 对照 + 文件级 blob 对照）、28 个重叠文件双向增删行差集、上游 9 项功能与 fork 14 项魔改的逐项 grep 取证，并独立复跑 typecheck / test:unit / cargo check / cargo test 四项检查（均 exit 0）与端口占用复核，未采信 Builder 结论。发现 3 处文档口径小瑕疵不影响实现正确性，建议归档前顺手修正。 | 2026-10-10T03:17:42.874Z |



## 结论

12/12 全部通过。独立复算了 git 结构、重放保真（主题序列逐行 diff + patch-id 对照 + 文件级 blob 对照）、28 个重叠文件双向增删行差集、上游 9 项功能与 fork 14 项魔改的逐项 grep 取证，并独立复跑 typecheck / test:unit / cargo check / cargo test 四项检查（均 exit 0）与端口占用复核，未采信 Builder 结论。发现 3 处文档口径小瑕疵不影响实现正确性，建议归档前顺手修正。
