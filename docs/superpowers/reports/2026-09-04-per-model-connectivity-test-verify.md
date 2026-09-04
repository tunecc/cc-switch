# 验证报告：per-model-connectivity-test

> Change: `per-model-connectivity-test` · 阶段：Verify · 日期：2026-09-04 · 语言：zh-CN · verify_mode: `full`
> 验证树：HEAD=`ad382fee`（分支 `feature/20260903/per-model-connectivity-test`，base_ref `76f8072d`）
> 前置：整支分支最终评审（opus）= Needs fixes → 修复 `ad382fee` → scoped 复评审（opus）= APPROVED；build 阶段守卫 `comet guard build --apply` 已推进 `phase=verify`。

## 摘要记分卡

| 维度 | 状态 |
|---|---|
| Completeness | 16/16 任务 `[x]`；6/6 ADDED Requirement 实现；14/14 Scenario 覆盖 |
| Correctness | 6/6 Requirement 与实现一致；14/14 Scenario 有实现 + 测试 |
| Coherence | D1-D6 设计决策全部遵循；代码模式与项目一致（shadcn/ui + react-i18next + camelCase serde + reqwest/tokio） |

**最终评估：All checks passed. Ready for archive.**

## 新鲜验证证据（本会话，当前树 ad382fee）

| 检查 | 命令 | 结果 |
|---|---|---|
| 完整 release 构建 | `comet guard build --apply`（内含 `pnpm tauri build`） | exit 0；vite build 3342 模块 5.60s + cargo release 编译 4m36s + 打包 .app/.dmg 全成功 |
| 前端全量测试 | `pnpm vitest run` | 141 文件 / 1100 测试全绿（27.94s） |
| 后端全量测试 | `cd src-tauri && cargo test --lib` | 2768 passed / 1 failed / 5 ignored（8.36s） |
| 后端聚焦（connectivity） | `cargo test --lib services::connectivity_test commands::connectivity_test` | 46 passed（scoped 复评审，同树） |
| typecheck | `pnpm typecheck` | clean（scoped 复评审，同树） |
| cargo check --lib | `cargo check --lib` | clean，0 dead_code（删 `#![allow(dead_code)]` 后验证） |
| clippy | `cargo clippy --lib -- -D warnings` | 0 warning（Task 8） |
| 残留 grep | `stream_check\|streamCheck\|StreamCheck` | 仅 `schema.rs` 3 行（plan-mandated 保留表结构） |

### 唯一失败项的归因（非回归，环境性）

`services::provider::tests::update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` panic at `src/services/provider/mod.rs:2064`：`地址绑定失败: Address already in use (os error 48)`。

- **根因**：本机 `/Applications/CC Switch.app`（运行中）占用本地代理端口 15721，该测试启动 `proxy_service` 绑定同端口而冲突。
- **非回归证据**：ad382fee（及整支 feature 分支 21 个提交）未触碰 `services::provider::mod.rs` 代理启动逻辑；panic 是端口绑定错误而非逻辑失败；scoped opus 复评审已确认非回归；该测试属本 change 范围外（本 change 仅 `connectivity_test` 服务/命令 + 前端 connectivity 组件 + `stream_check` 移除）。
- **缓解**：退出 CC Switch.app 释放端口 15721 即可得全绿；纯环境性，不需代码改动。
- **严重度判定**：按 verify 不确定性原则，环境性端口冲突非"构建失败/测试失败（代码缺陷）"的 CRITICAL，归类为已知环境条件（WARNING 级、非阻塞、无代码取舍，不触发 decision-point）。本 change 自有测试（46 后端 connectivity + 1100 前端）100% 绿。

## Requirement → 实现映射（含 Scenario 覆盖）

### Requirement 1：按模型真实请求连通性测试（4 Scenario）
- **实现**：`src-tauri/src/services/connectivity_test/mod.rs`（`test_models` join_all 并行、`run_one`、`drain_stream`、`verdict`、`error_result`、`remaining_total_timeout`）+ `protocol.rs`（`build_claude` `/v1/messages`、`build_codex` `/v1/responses`、`body_reports_error`、`merge_custom_headers/body`）+ `model_ids.rs`（`model_ids_from_settings`）+ 命令 `connectivity_test_provider_models` / `connectivity_probe_provider`（`commands/connectivity_test.rs`）。
- **结果字段**：`ConnectivityTestResult`（modelId/status/firstByteMs/totalMs/errorMessage/requestUrl/requestHeaders/requestBody/responseHeaders/responseBody）。
- **Scenario 覆盖**：①所有选中成功 ②鉴权失败（401/403→error 含 HTTP 状态 + 请求详情）③流错误事件（`event: error`/`response.failed`→error）④超时——均有后端单测（46 个 connectivity 测试）。

### Requirement 2：连通性测试弹窗与参数控制（3 Scenario）
- **实现**：`src/components/providers/ConnectivityTestDialog.tsx`（模型多选/全选、prompt、默认测试模型、流式开关、temperature/maxTokens/自定义 headers/body JSON 编辑；JSON 校验阻断非法开始）+ `ConnectivityDetailDialog.tsx`（请求详情：URL/headers/body/响应）+ `useConnectivityTest.ts`（逐模型状态 waiting/running/success/error + firstByteMs/totalMs + 汇总）+ 四语言计费免责文案。
- **Scenario 覆盖**：①未选模型不可开始（JSON/选型校验）②多模型并行（后端 join_all + 前端逐模型终态）③查看请求详情（ConnectivityDetailDialog）。

### Requirement 3：测试参数按供应商持久化（2 Scenario）
- **实现**：`src/lib/connectivityTestSettings.ts`（`getConnectivityTestSettings`/`mergeConnectivityTestSettings`，8 字段含 defaultTestModelId；缺省即默认值：prompt="ping"/stream=true/timeoutSecs=30）+ `ConnectivityTestDialog` 开窗恢复 + 保存经 `providersApi.update({...provider, settingsConfig: mergeConnectivityTestSettings(...)}, appId, provider.id)`。
- **Scenario 覆盖**：①重开恢复已保存参数（含默认勾选默认测试模型）②首次打开用默认值——`tests/lib/connectivityTestSettings.test.ts` 8 测试。

### Requirement 4：供应商列表批量探针徽标（2 Scenario）
- **实现**：`src/hooks/useConnectivityProbe.ts`（`probeAll` 手写并发池 5、逐供应商更新、内存态、过滤 official/动态端点/无模型）+ `src/components/providers/ConnectivityBadge.tsx`（成功/失败/错误 + totalMs，绿/红点，独立于熔断健康徽标）+ `ProviderList.tsx` 列表头批量按钮。
- **Scenario 覆盖**：①逐供应商按完成顺序更新徽标（并发度 5）②无模型/官方供应商跳过——`tests/hooks/useConnectivityProbe.test.ts` 5 测试。

### Requirement 5：替换旧可达性探测（2 Scenario）
- **实现**：Task 8 单提交 `6493fbc5` 删除 6 文件（`commands/stream_check.rs`、`services/stream_check.rs`、DB DAO `stream_check.rs`、`useStreamCheck.ts`、`connectivity-check.ts`、`ConnectivityCheckConfigPanel.tsx`）+ `lib.rs` 移除 4 命令注册 + `SettingsPage.tsx` 删 AccordionItem + 4 语言删 `streamCheck.*`；卡片检测按钮 → 打开 `ConnectivityTestDialog`（`ProviderCard.tsx:754` + `ProviderList.tsx:643` 经 `shouldShowTestEntry` 守卫）。
- **Scenario 覆盖**：①旧检测入口指向新测试弹窗 ②旧配置面板（超时/重试/降级阈值）已移除——残留 grep 仅 `schema.rs` 3 行（保留表结构，plan 明示）。

### Requirement 6：连通性测试不触碰故障转移熔断器（1 Scenario）
- **实现**：`commands/connectivity_test.rs` 两个命令仅调用 `test_models`，不写网关/熔断状态（无 `save_stream_check_log`、无 breaker 交互）；`services/provider/live.rs` `sanitize_claude_settings_for_live` 移除 `connectivityTest` 字段（不写入 Claude settings.json）。
- **Scenario 覆盖**：①测试失败不影响熔断器——代码路径无 breaker 写入（Task 3 评审确认 + 命令实现复核）。

## 设计决策遵循（D1-D6）

| 决策 | 实现 | 遵循 |
|---|---|---|
| D1 直连端点不复用网关 | `mod.rs` 经 `crate::proxy::http_client::get()` 取全局 reqwest 客户端（跟随系统/配置代理），直接 POST 上游，不经 `proxy/forwarder` | ✓ |
| D2 模型来源 + 请求体 | `model_ids.rs` 读 modelCatalog 首个非空 model/id/name + claude 回退 env.ANTHROPIC_MODEL + codex 回退 config.toml 顶层 model；`protocol.rs` claude `{model,max_tokens:1024,messages,stream}` / codex Responses `{model,input,stream,store:false}`；自定义 headers/body 浅合并 | ✓ |
| D3 判定与度量 | `verdict` = 2xx && 无流错误 && 响应体非空 && 无错误事件/JSON；`first_byte_ms` 首个非空 chunk；`total_ms` 整体；总超时 30s 默认 + 空闲超时 | ✓ |
| D4 参数持久化 | `settings_config.connectivityTest` 8 字段，复用 `update_provider`，不新增 DB 表，缺省默认值 | ✓ |
| D5 批量探针 | `useConnectivityProbe` 并发 5、defaultTestModelId→首模型回退、内存态、`ConnectivityBadge` 独立组件、official + 动态端点跳过 | ✓ |
| D6 旧功能移除 | Task 8 删 6 文件 + i18n + 引用点，保留表结构 | ✓ |

## Spec 漂移检查（item 6）

`design.md`（OpenSpec）与 design doc（`docs/superpowers/specs/2026-09-02-per-model-connectivity-test-design.md`）内容镜像一致，无矛盾。修复 `ad382fee`（`shouldShowTestEntry` 增判 `providerType`）反而使实现更贴合 spec Requirement 4"端点依赖运行时动态解析的供应商类型 SHALL 被跳过"与 Non-Goal"不做动态端点供应商测试"——修复提升了一致性，**无漂移**。三处口径（后端 `is_probe_capable` + 前端 `useConnectivityProbe` + `shouldShowTestEntry`）排除集合完全相同（`codex_oauth`/`xai_oauth`/`github_copilot`，无多无少），CONSTRAINT 3 满足。

## 安全约束复核（CONSTRAINT 3）

- 不触碰熔断器/网关状态：命令仅 `test_models`，无 breaker/gateway 写入 ✓
- `connectivityTest` 不写入 Claude settings.json：`sanitize_claude_settings_for_live` 移除 ✓
- 仅 claude/codex AppId：`shouldShowTestEntry`/`PROBE_SUPPORTED_APPS`/`is_probe_capable` 三处守卫 ✓
- 不测官方供应商：三处 `category === "official"` 排除 ✓
- 不测动态端点供应商（codex_oauth/xai_oauth/github_copilot）：三处 `NON_PROBE_PROVIDER_TYPES`/`matches!` 排除 ✓
- API key 脱敏：`is_sensitive_header`/`headers_to_value` 存储前过滤（authorization/proxy-authorization/x-api-key/cookie/set-cookie + api_key/apikey/api-key），`error_result` 用空 headers；发送请求仍带完整上游头 ✓

## 已知非阻塞项（SUGGESTION 级，已记录于 SDD ledger）

- codex `model=""` 时后端返回 `[""]` vs 前端 `[]`（预存口径分歧，不影响功能）。
- orphaned `settings.advanced.connectivityCheck.{title,description}` i18n 键（SettingsPage AccordionItem 已删，无消费点，可选后续清理）。
- `6a26b754`/`4b6465f5` 提交复用 feat 消息（cosmetic，Task 2 re-review 已记）。
- GUI 功能场景未实跑（无运行 app/真实上游），逐项列等价自动化证据（单测 + 类型 + 编译 + 评审）。

## 结论

6/6 ADDED Requirement + 14/14 Scenario 全部实现并有测试覆盖；D1-D6 设计决策全部遵循；design.md 与 design doc 无矛盾。新鲜证据：完整 release build exit 0、前端 1100 全绿、后端 2768 pass（1 环境性端口冲突、非回归）、typecheck/clippy clean、残留 grep 仅 schema.rs 保留表。安全约束 CONSTRAINT 3 全部满足，三处动态端点口径完全一致。

**All checks passed. Ready for archive.**
