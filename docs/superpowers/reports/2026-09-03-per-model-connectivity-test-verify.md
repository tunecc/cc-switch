# per-model-connectivity-test 验证报告（verify 阶段）

- 日期：2026-09-04
- 分支：`feature/20260903/per-model-connectivity-test`
- 验证人：Task 9 端到端验证
- 无代码改动；仅验证。

---

## 1. 编译与静态

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 聚焦后端连通性测试 | `cd src-tauri && cargo test --lib connectivity_test` | 47 通过 / 0 失败 / 0 忽略（2727 filtered out） |
| 全量前端测试 | `pnpm vitest run` | 141 文件 / 1096 测试全部通过 |
| 前端类型检查 | `pnpm typecheck` | 干净（`tsc --noEmit` 无输出无报错） |
| 后端 clippy | `cd src-tauri && cargo clippy --lib -- -D warnings` | 干净（`Finished dev profile`，无 warning/error） |
| 后端全量 lib 测试 | `cd src-tauri && cargo test --lib` | 2768 通过 / 1 失败 / 5 忽略 |

> 说明：brief 中 `cargo test -p cc_switch_lib --lib services::connectivity_test commands::connectivity_test` 会被 cargo 判为多余位置参数（cargo 只接受一个 TESTNAME）。等价做法是单 filter `connectivity_test`（同时匹配 `services::connectivity_test` 与 `commands::connectivity_test`），或 `cargo test --lib -- services::connectivity_test commands::connectivity_test` 把两个 filter 传给 libtest。本次采用单 filter，覆盖两个模块。

全量 lib 唯一失败：

```
services::provider::tests::update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active
  panicked at src/services/provider/mod.rs:2064:14:
  start proxy service: "启动代理服务器失败: 地址绑定失败: Address already in use (os error 48)"
```

该失败为 CC Switch 应用运行占用代理端口（15721）导致 proxy bind 失败，是 Task 3 在 base commit 上 stash 验证已确认的**既有环境性失败，非 Task 1-8 回归**。其余 2768 个测试全部通过。

**结论：编译与静态全绿（仅一项既有环境性失败，已记录）。**

---

## 2. 功能验证（真实/模拟供应商）

本环境无 GUI 应用可运行、无法发起真实上游/模拟上游 HTTP 调用，下列人工场景**未在本环境执行**。以下逐项给出对应的自动化证据（手工场景 → 锁定该行为的测试），作为诚实替代，不构成"已手工验证"的声明。

| 手工场景 | 状态 | 自动化等价证据 |
| --- | --- | --- |
| 弹窗成功场景（claude/codex → 逐模型 success + firstByteMs/totalMs） | 未执行 | 后端：`src-tauri/src/services/connectivity_test/mod.rs` 的 `verdict_success_requires_2xx_body_content_and_no_error`（2xx+非空体+无错误 → Ok）、`src-tauri/src/services/connectivity_test/protocol.rs` 的 `success_json_does_not_report_error` / `sse_plain_delta_does_not_report_error`；firstByteMs/totalMs 计算位于 `run_one`（`mod.rs:204-268`）。前端：`tests/components/ConnectivityTestDialog.test.tsx` 的 "select-all enables start, runs the batch test, and renders result rows"、"opens the per-model detail dialog from a result row"；`tests/hooks/useConnectivityTest.test.ts` 的 "marks all selected models running while the invoke is pending, then maps results by modelId"。 |
| 401/403（错误 token → error，错误含 HTTP 状态，详情含实际 URL/body） | 未执行 | 后端 `verdict` 对非 2xx 返回 `HTTP {status}`（`mod.rs:63-81`），`verdict_success_requires_2xx_body_content_and_no_error` 显式断言 `verdict(401, ..).is_err()`；结果结构含 `request_url`/`request_body`/`response_body`/`response_headers` 字段，`connectivity_test_result_serializes_camel_case` 锁定序列化。前端详情渲染由 `tests/components/ConnectivityTestDialog.test.tsx` "opens the per-model detail dialog from a result row" 锁定。真实 401 网络路径未执行。 |
| 流错误（SSE `event: error` / `response.failed` → error） | 未执行 | `src-tauri/src/services/connectivity_test/protocol.rs`：`sse_event_error_reports_error`、`sse_event_response_failed_reports_error`、`sse_multiline_error_payload_reports_error`、`json_response_status_failed_reports_error`、`json_error_object_reports_error`；`verdict` 优先返回流错误（`mod.rs:70`）。真实 SSE 上游未执行。 |
| 超时（timeoutSecs=1 → error 说明超时） | 未执行 | `remaining_total_timeout_only_exposes_leftover`（`mod.rs:457`）锁定剩余总超时语义；`run_one` 中 "stream exceeded the total timeout" / "response body exceeded the total timeout" 错误文案（`mod.rs:230/258/263`）。超时路径未在 mock 服务器下执行。 |
| 参数持久化：改 prompt/默认模型并保存 → 重开恢复且默认勾选；首次打开用默认 | 未执行 | `tests/lib/connectivityTestSettings.test.ts`："returns defaults when field absent"、"preserves saved fields and defaults the rest"、"merge writes only explicit fields and does not mutate input"、"merge removes the stored block when every value equals the default"、"round-trips merged settings through get"、"falls back to defaults when the stored field is malformed"。前端弹窗：`tests/components/ConnectivityTestDialog.test.tsx` "pre-checks the persisted default test model"、"saves params through providersApi.update with merged settingsConfig"、"renders only the first matching field per catalog entry (backend parity)"；`tests/hooks/useConnectivityProbe.test.ts` "probes the saved defaultTestModelId before the first catalog model"。 |
| 批量探针：并发 ≤5、逐供应商更新徽标、官方/无模型供应商跳过 | 未执行 | `tests/hooks/useConnectivityProbe.test.ts`："keeps at most 5 probes in flight and continues the pool after a rejection"（并发上限 5）、"skips official / dynamic-endpoint / model-less providers and only probes the rest"、"clears results and never invokes for apps outside the first-phase scope"。后端过滤：`src-tauri/src/commands/connectivity_test.rs` `testable_provider_rejects_official_and_dynamic_endpoints`。入口可见性：`tests/components/connectivityEntry.test.ts`（shouldShowTestEntry 六例）。逐供应商徽标 UI 渲染无独立组件测试，由 hook 的 per-provider 结果更新覆盖。 |
| 熔断器隔离（失败测试后 failover 表/健康值不变） | 未执行 | 该行为**按构造保证**：`connectivity_test` 执行器（`run_one`）只读取共享 `http_client` 并构造请求，不写入 failover/健康状态表。最接近的自动化证据是 `services::provider::live::tests::sanitize_claude_settings_for_live_strips_internal_connectivity_test`（运行时剥离内部 connectivity_test 配置，避免影响线上供应商）。**无专门 mock 服务器下"跑一次失败测试后断言 failover 表不变"的集成测试。** |

**诚实声明：本环境未执行 GUI 场景，也未对真实/模拟上游发请求。** 上述为等价自动化证据；真实网络路径（reqwest 建连、SSE 逐块 drain、firstByteMs 实测、401 上游返回、1s 超时）仅有代码级与协议级单测，无端到端 mock-server 测试覆盖。手工场景需在可运行 GUI + 真实/模拟上游的环境下补做。

---

## 3. 回归

### 3.1 Task 8 残留断言重跑

```bash
grep -rn "stream_check\|streamCheck\|StreamCheck\|ConnectivityCheckConfigPanel\|useStreamCheck" \
  src src-tauri/src --include="*.rs" --include="*.ts" --include="*.tsx"
```

结果：仅 `src-tauri/src/database/schema.rs` 3 处计划保留的表结构引用：

```
src-tauri/src/database/schema.rs:247:  CREATE TABLE IF NOT EXISTS stream_check_logs (
src-tauri/src/database/schema.rs:255:  CREATE INDEX IF NOT EXISTS idx_stream_check_logs_provider
src-tauri/src/database/schema.rs:256:   ON stream_check_logs(app_type, provider_id, tested_at DESC)
```

**通过（旧入口全移除，无 Task 8 残留回归）。**

### 3.2 git status

```
On branch feature/20260903/per-model-connectivity-test
Untracked files:
	docs/openspec/changes/per-model-connectivity-test/.comet.yaml
	docs/openspec/changes/per-model-connectivity-test/.comet/
	docs/openspec/changes/per-model-connectivity-test/.openspec.yaml
	docs/openspec/changes/per-model-connectivity-test/design.md
	docs/openspec/changes/per-model-connectivity-test/proposal.md
	docs/openspec/changes/per-model-connectivity-test/specs/
	docs/superpowers/specs/2026-09-02-per-model-connectivity-test-design.md
```

无任何源码修改未提交；唯一未跟踪项为 comet/openspec 规划文档。**通过。**

### 3.3 git log --oneline

Task 1-8 功能提交 + 勾选提交均独立成提交，无 squash 丢失：

```
471bbd76 chore(connectivity-test): 勾选 Task 8 / OpenSpec 4.1-4.3
6493fbc5 refactor(connectivity-test): 移除旧 stream_check 可达性探测全链路（保留表结构）
9eb2aff8 chore(connectivity-test): 勾选 Task 7 / OpenSpec 2.4 3.1-3.3
cf733e8b feat(connectivity-test): 供应商列表集成（弹窗入口 + 批量探针徽标）
fdfe5161 chore(connectivity-test): 勾选 Task 6 / OpenSpec 2.2-2.3
e03a4156 fix(connectivity-test): 模型列表解析与后端对齐（每条目首个匹配，提取共享 helper）
7ae78d59 feat(connectivity-test): 连通性测试弹窗/详情/徽标组件与四语言文案
b05b87aa chore(connectivity-test): 勾选 Task 5 / OpenSpec 2.1
b4edcd60 test(connectivity-test): 锁定 toBackendParams 字段映射（customHeaders/customBody 等）
9fcfd297 feat(connectivity-test): 前端命令绑定与测试/探针状态 hooks
4725aac1 chore(connectivity-test): 勾选 Task 4 / OpenSpec 1.4
7ac6de17 feat(connectivity-test): 测试参数持久化纯函数（缺省即默认值）
26ac0011 chore(connectivity-test): 勾选 Task 3 / OpenSpec 1.3
f2310d13 feat(connectivity-test): Tauri 命令与注册，官方/动态端点过滤，sanitize 隔离私有字段
c7ec4854 chore(connectivity-test): 勾选 Task 2 / OpenSpec 1.2
4b6465f5 feat(connectivity-test): 后端直连执行器（reqwest+SSE，总/空闲超时，度量与错误识别）
6a26b754 feat(connectivity-test): 后端直连执行器（reqwest+SSE，总/空闲超时，度量与错误识别）
944e3ad7 chore(connectivity-test): 勾选 Task 1 / OpenSpec 1.1
fe4376fb fix(connectivity-test): claude 鉴权对齐 adapter 顶层 apiKey/api_key 兜底
7ead4a79 feat(connectivity-test): 新增后端连通性测试服务类型/模型解析/协议构造
```

观察项（非缺陷，供控制器确认）：`4b6465f5` 与 `6a26b754` 两条提交信息相同，疑似重复/合并产物。

**通过。**

### 3.4 已知延迟项（非验证失败）

- Task 8 延迟的孤 i18n 键 `settings.advanced.connectivityCheck.{title,description}` 在 4 个 locale（en / zh / zh-TW / ja）中仍存在（`src/i18n/locales/{en,zh,zh-TW,ja}.json`），因 SettingsPage AccordionItem 已删除而不再被使用。属于已知 cosmetic 延迟项，不影响功能，不构成验证失败。

---

## 4. 结论

四层验证整体通过。

- **编译与静态**：聚焦后端 47/47、全量前端 1096/1096、typecheck 干净、clippy `-D warnings` 干净；后端全量 lib 唯一失败为既有环境性端口占用失败（非 Task 1-8 回归）。
- **功能**：GUI 人工场景因无运行应用/真实上游未执行；逐项列出等价自动化证据，并明确标注未覆盖的真实网络路径。
- **回归**：stream_check 旧入口无残留（仅 schema.rs 3 处计划保留行）、git status 干净（仅规划文档未跟踪）、Task 1-8 独立提交齐全。

未发现需要回退到某 Task 修复的实际缺陷。

**状态：DONE**
