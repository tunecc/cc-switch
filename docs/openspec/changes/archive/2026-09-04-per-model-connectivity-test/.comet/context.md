# Comet Design Handoff

- Change: per-model-connectivity-test
- Phase: design
- Mode: compact
- Context hash: b7dd3b5c75e42fbeac273ad433baa008a3900978fa136403320d3c8249eecff2

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/per-model-connectivity-test/proposal.md

- Source: docs/openspec/changes/per-model-connectivity-test/proposal.md
- Lines: 1-32
- SHA256: 6523d9da7bf15c6fa14cdc70420d26586910eee19ec0479d6a072ec177d5e7ed

```md
# 提案：按模型真实请求连通性测试（替换现有 base_url 可达性探测）

## Why

cc-switch 当前的连通性检测（`stream_check`）只探测供应商 `base_url` 的 HTTP 可达性——任何 HTTP 响应都算"可达"，因此无法发现鉴权失败、模型不存在、余额不足、协议不匹配等真实故障，"连通正常"的提示经常误导用户。参考项目 ai-toolbox 已实现按模型发起真实（小额）LLM 请求的连通性测试，能返回首字节时间、总耗时、HTTP/SSE 错误与完整请求/响应详情，诊断价值远高于可达性探测。用户要求学习该实现并用同类型功能完全替换现有连通检测。

## What Changes

- **新增** 按模型真实请求连通性测试：对供应商配置的每个模型发起真实最小化请求，返回 `success`/`error` 状态、`first_byte_ms`、`total_ms`、错误信息以及完整请求/响应详情（URL、headers、body）。
- **新增** 连通性测试弹窗：模型多选、自定义测试 prompt、默认测试模型、流式开关与高级参数（temperature、maxTokens、自定义 headers/body），测试结果以表格逐模型展示，可展开请求详情。
- **新增** 测试参数按供应商持久化（存入供应商设置，重开弹窗恢复）。
- **新增** 供应商列表批量探针：以受限并发（并发度 5）逐供应商用其默认测试模型探测，结果以状态徽标 + 耗时显示在供应商卡片上。
- **BREAKING** 移除现有轻量连通检测：`stream_check_provider` / `stream_check_all_providers` / `get_stream_check_config` / `save_stream_check_config` 命令、后端 `services::stream_check` 服务、前端 `useStreamCheck` hook、`ConnectivityCheckConfigPanel` 配置面板及对应 i18n 文案；卡片"检测"按钮改为打开新的连通性测试弹窗。
- 首期仅覆盖 `claude` 与 `codex` 两种 AppId；其余应用（gemini、grokbuild、opencode、openclaw、hermes、pi、claude-desktop）不在本次范围。
- 连通性测试刻意不触碰故障转移熔断器（与现状一致：测试结果不重置/不驱动熔断状态）。

## Capabilities

### New Capabilities

- `provider-connectivity-test`: 按模型真实请求的供应商连通性测试能力——测试弹窗、参数持久化、逐模型结果与请求详情、批量探针徽标，以及对旧可达性探测的替换。

### Modified Capabilities

（无——现有 `docs/openspec/specs/` 下没有覆盖旧 `stream_check` 的 spec，旧功能通过移除处理。）

## Impact

- **后端（src-tauri）**：新增连通性测试命令与服务模块（HTTP/SSE 请求、错误识别、超时控制）；删除 `commands/stream_check.rs`、`services/stream_check.rs` 及 DB 中 stream check 配置/日志相关读写路径；`provider` 设置结构新增测试参数（diagnostics）字段。
- **前端（src）**：新增连通性测试弹窗组件与批量探针状态管理；删除 `src/hooks/useStreamCheck.ts`、`src/lib/api/connectivity-check.ts`、`src/components/usage/ConnectivityCheckConfigPanel.tsx`；调整 `ProviderList`、`ProviderCard`/`ProviderActions` 的检测入口与徽标显示；清理相关 i18n（zh/en/ja/zh-TW）。
- **API/schema**：新增 Tauri 命令与请求/响应类型；供应商 `settings_config` 增加 diagnostics 持久化字段（向后兼容：缺省视为默认值）。
- **风险**：真实请求会产生少量上游费用/用量（每次测试为最小化请求）；无模型配置的供应商（如 `category: official`）在批量探针中跳过；Copilot 等动态端点供应商首期按不支持处理（标记为不可测试）。

```

## docs/openspec/changes/per-model-connectivity-test/design.md

- Source: docs/openspec/changes/per-model-connectivity-test/design.md
- Lines: 1-78
- SHA256: 432b8239b65c1e3ec4b52aa640bda64a8a8dee4db14d54f9e82a4088a610c212

```md
# 设计：按模型真实请求连通性测试

## Context

cc-switch 现有连通检测由 `src-tauri/src/services/stream_check.rs`（532 行，仅 HEAD/GET 探测）+ `commands/stream_check.rs`（4 个 Tauri 命令）+ 前端 `useStreamCheck` hook 与 `ConnectivityCheckConfigPanel` 组成，只探测 `base_url` 可达。本次以 ai-toolbox 的 `connectivity_test.rs` + `ConnectivityTestModal.tsx` 为参照实现，用按模型真实请求测试完全替换。

关键现状约束：

- 供应商模型清单来源是 `settings_config.modelCatalog`（claude/codex 均已使用，前端 `EditProviderDialog`/`ModelQuickSwitch` 消费）。
- claude 供应商鉴权/端点在 `settings_config.env`（`ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY`）；codex 在 `settings_config.config.toml` 的 `model_providers`（`base_url` + `wire_api`）与 `auth.OPENAI_API_KEY`。
- cc-switch 前端使用 shadcn/ui + Tailwind + react-i18next（非 ai-toolbox 的 antd），因此参考实现需移植到本项目 UI 体系。
- 后端已有代理网关（`proxy/`）与故障转移熔断器；测试命令不得写入任何网关/熔断状态。

## Goals / Non-Goals

**Goals:**

- 新增独立的后端连通性测试服务：直接向供应商端点发真实最小化请求（claude → `/v1/messages`，codex → `/v1/responses`），不经由本地代理网关转发。
- 前端新增测试弹窗（模型多选、prompt、默认测试模型、高级参数）、按供应商参数持久化、列表批量探针徽标。
- 完全移除旧可达性探测的代码路径与 UI。

**Non-Goals:**

- 不支持 claude/codex 以外的 AppId（gemini、grokbuild、opencode、openclaw、hermes、pi、claude-desktop）——UI 入口在这些应用下不显示。
- 不实现 ai-toolbox 的"失败模型一键移除"（本次未选入范围）。
- 不接入代理网关路由/故障转移逻辑；不记录请求日志到 usage/计费统计。
- 不做官方供应商（`category: official`）与动态端点供应商（GitHub Copilot）的测试。

## Decisions

### D1：直连供应商端点，而非复用代理网关

ai-toolbox 的 gateway 连通测试是把请求打进**本地网关**再路由到上游，目的是验证网关协议转换。cc-switch 的需求是验证"供应商本身可用"，且旧探测也是直连；新增一个独立的 `services/connectivity_test` 模块（reqwest 直连 + SSE 流读取），不依赖 `proxy/` 运行时。

备选：复用本地代理网关（如 ai-toolbox）——否决：引入网关依赖，测试语义变成"网关+上游"联合可用性，且网关未启用时不可用。

### D2：模型来源与请求体构造

- 模型清单：读 `settings_config.modelCatalog` 中每个条目的上游模型 ID（与 `ModelQuickSwitch` 相同口径）；无 `modelCatalog` 时回退到 `env.ANTHROPIC_MODEL`（claude）/ codex config 的 `model` 字段。
- claude 请求体：`{model, max_tokens: 1024, messages:[{role:"user",content:[{type:"text",text:prompt}]}], stream}`，headers 取供应商 env token；codex 请求体：Responses API `{model, input:[...], stream, store:false}`。
- 用户自定义 headers 与 body 覆盖：自定义 headers 合并进默认 headers；自定义 body 作为顶层对象**浅合并**进默认请求体（与 ai-toolbox 行为一致），允许覆盖 `max_tokens` 等。

### D3：成功/失败判定与度量

与 ai-toolbox 对齐：`2xx && 无流错误 && 响应体非空 && 响应体无错误事件/错误 JSON` 才算 success。`first_byte_ms` 取首个非空 chunk；`total_ms` 取整体耗时；总超时（默认 30 秒，可在弹窗内调整）覆盖建连+首字节+整流。错误识别覆盖：JSON `{"error":{...}}`、SSE `event: error`、`response.failed`、空响应。

### D4：参数持久化位置

测试参数存入供应商 `settings_config` 的新字段 `connectivityTest`（含 `prompt`、`defaultTestModelId`、`stream`、`temperature`、`maxTokens`、`headers`、`body`、`timeoutSecs`），复用现有供应商更新命令（`update_provider` 写回 `settings_config`），不新增 DB 表。缺省字段视为默认值，天然向后兼容。

备选：独立 DB 表——否决：需要迁移且与"参数属于供应商"的语义割裂；ai-toolbox 也是存在供应商设置里。

### D5：批量探针实现

前端新增 `probeAllProviders`：对每个可测试供应商取 `defaultTestModelId`（无则取模型清单第一个；两者皆无 → 跳过），以后端单模型请求并发执行（前端控制并发度 5），结果写入内存状态（不持久化），渲染为卡片徽标（复用 `ProviderHealthBadge` 的色彩语义，但为独立组件 `ConnectivityBadge`，避免与熔断健康徽标混淆）。官方供应商与 Copilot 类型跳过。

### D6：旧功能移除清单

删除：`commands/stream_check.rs`、`services/stream_check.rs`、DB 中 `stream_check_config`/`stream_check_log` 的读写方法（保留表结构，不做破坏性 schema 删除）、前端 `useStreamCheck.ts`、`connectivity-check.ts`、`ConnectivityCheckConfigPanel.tsx`、i18n 的 `streamCheck.*` 与相关配置文案。卡片按钮行为改为打开新弹窗（claude/codex 应用下）；其余应用隐藏检测入口。

## Risks / Trade-offs

- [真实请求产生上游费用/用量] → 请求最小化（1 条短 prompt、max_tokens 1024、可选单模型）；批量探针只测默认模型；弹窗提示计费免责声明（对齐 ai-toolbox 的 disclaimer）。
- [SSE 流读取挂起] → 总超时 + 空闲超时双保险（对齐 ai-toolbox 的 `remaining_total_timeout` + idle timeout 模式）。
- [modelCatalog 缺失或格式各异] → 回退到 `ANTHROPIC_MODEL`/codex `model` 字段；仍无则标记该供应商不可测试并在弹窗空态提示。
- [Codex 端点需要 Responses API 而部分中转只支持 chat/completions] → 首期按 Responses API 实现（与 ai-toolbox 一致）；`wire_api: chat` 的供应商标记为测试失败并给出明确错误信息，后续版本再考虑 chat 兼容。
- [删除旧命令是破坏性变更] → 无外部调用方（仅本应用前端消费）；i18n 与引用点全量替换后编译验证。
- [徽标状态是内存态] → 切换页面后清空属预期行为（与 ai-toolbox 一致），不做持久化。

## Migration Plan

1. 后端新增 `services/connectivity_test` 与命令，前端并行开发弹窗与批量探针（旧功能仍可用）。
2. 全部功能验证后，单提交内删除旧 `stream_check` 全链路并更新引用点。
3. 回滚策略：整体为可逆的 git 提交；若上线后发现问题，revert 相应提交即回到旧可达性探测。

## Open Questions

（无——原"codex wire_api: chat 占比"已调查确认：全部内置 codex 预设均为 `wire_api = "responses"`，且 Codex 0.149 起已移除 chat wire API（见 `codex_config.rs:2788`），首期只实现 Responses API，`wire_api: chat` 供应商按明确错误信息处理。）

```

## docs/openspec/changes/per-model-connectivity-test/tasks.md

- Source: docs/openspec/changes/per-model-connectivity-test/tasks.md
- Lines: 1-32
- SHA256: d401a0ca7c711ad196aa00e3915d7a9760f74c2c34d4475e93d125ccdb43aeaf

```md
# 任务清单：按模型真实请求连通性测试

## 1. 后端：连通性测试服务与命令

- [ ] 1.1 新增 `services/connectivity_test` 模块：类型定义（请求/结果/配置）、模型清单解析（modelCatalog → ANTHROPIC_MODEL / codex model 回退）、claude（/v1/messages）与 codex（/v1/responses）请求体构造、自定义 headers/body 浅合并
- [ ] 1.2 实现直连探测执行：reqwest 请求、SSE 流读取（总超时 + 空闲超时）、first_byte_ms/total_ms 度量、错误识别（非 2xx、`event: error`、`response.failed`、错误 JSON、空响应）与单元测试
- [ ] 1.3 新增命令 `connectivity_test_provider_models`（单供应商多模型并行/串行测试）与 `connectivity_probe_provider`（批量探针用的单模型探测），注册到 `lib.rs`，确认不写入网关/熔断状态
- [ ] 1.4 测试参数持久化：`settings_config.connectivityTest` 字段读写（prompt/defaultTestModelId/stream/temperature/maxTokens/headers/body/timeoutSecs，缺省即默认值），复用供应商更新路径

## 2. 前端：连通性测试弹窗

- [ ] 2.1 新增 `src/lib/api/connectivity-test.ts`（新命令绑定与类型）；新增 `useConnectivityTest` hook（测试执行、结果状态管理）
- [ ] 2.2 新增测试弹窗组件（shadcn/ui）：模型多选/全选、prompt 输入、默认测试模型选择、流式开关、高级参数（temperature/maxTokens、自定义 headers/body JSON 编辑）
- [ ] 2.3 结果表格与详情：逐模型状态（等待/运行中/成功/失败）、首字节/总耗时、汇总统计、请求详情子弹窗（URL/headers/请求体/响应）；实现"未选模型不可开始"与计费免责提示
- [ ] 2.4 参数恢复：打开弹窗时读取已持久化的测试参数并恢复（含默认勾选默认测试模型），保存时写回供应商

## 3. 前端：批量探针徽标

- [ ] 3.1 新增批量探针状态管理（并发度 5，逐供应商更新），官方供应商与无模型/动态端点供应商跳过
- [ ] 3.2 新增 `ConnectivityBadge` 徽标组件（成功/失败/错误 + 耗时），接入 `ProviderList`/`ProviderCard`；列表头新增"批量检测"入口
- [ ] 3.3 卡片原检测按钮（claude/codex）改为打开测试弹窗；其余应用隐藏检测入口

## 4. 移除旧可达性探测

- [ ] 4.1 后端删除：`commands/stream_check.rs`、`services/stream_check.rs`、DB 中 stream check 配置/日志读写方法、`lib.rs` 命令注册（保留表结构）
- [ ] 4.2 前端删除：`useStreamCheck.ts`、`connectivity-check.ts`、`ConnectivityCheckConfigPanel.tsx` 及其在设置/用量页的引用
- [ ] 4.3 i18n 清理与新增：删除 `streamCheck.*` 与旧配置面板文案，新增连通性测试相关文案（zh、en、ja、zh-TW 四种语言）

## 5. 验证

- [ ] 5.1 编译与静态检查：`pnpm typecheck`/`cargo check`/`cargo clippy`、相关单测全绿
- [ ] 5.2 功能验证：真实/模拟供应商的弹窗测试（成功、401、流错误、超时场景）、参数持久化恢复、批量探针徽标、旧入口全部移除无残留引用

```

## docs/openspec/changes/per-model-connectivity-test/specs/provider-connectivity-test/spec.md

- Source: docs/openspec/changes/per-model-connectivity-test/specs/provider-connectivity-test/spec.md
- Lines: 1-81
- SHA256: 81d8985499cac6f3efc46b8202cd53734fc578bf5531f62ba06b8833830ee4ce

[TRUNCATED]

```md
## Purpose

提供按模型发起真实（最小化）请求的供应商连通性测试能力，使用户能够验证供应商配置（端点、鉴权、模型、协议）是否真正可用，取代仅探测 base_url 可达性的旧连通检测。

## ADDED Requirements

### Requirement: 按模型真实请求连通性测试
系统 SHALL 允许用户针对单个供应商的一个或多个模型发起真实的最小化请求，并逐模型返回结果。每个结果 MUST 包含：`success` 或 `error` 状态、首字节时间（`first_byte_ms`）、总耗时（`total_ms`）、错误信息（失败时）以及完整的请求与响应详情（URL、headers、body）。

以下任一情况 SHALL 判定为 `error`：连接失败（DNS/连接拒绝/TLS/超时）、非 2xx 响应、流式响应中出现错误事件或错误 JSON、非流式响应体为空或包含错误对象、超过总超时。

#### Scenario: 所有选中模型测试成功
- **WHEN** 用户对配置了有效端点、鉴权与模型的供应商发起连通性测试并选中若干模型
- **THEN** 每个模型返回 `success` 状态、首字节时间与总耗时

#### Scenario: 鉴权失败被识别为错误
- **WHEN** 供应商鉴权凭证无效，上游返回 401/403
- **THEN** 该模型结果为 `error`，错误信息包含 HTTP 状态，且请求详情中包含实际发送的 URL 与请求体

#### Scenario: 流式响应中的错误事件被识别
- **WHEN** 上游以 200 响应但在 SSE 流中返回错误事件（如 `event: error` 或 `response.failed`）
- **THEN** 该模型结果为 `error`，错误信息说明响应包含错误事件

#### Scenario: 超时判定
- **WHEN** 单个模型的测试在总超时时间内未获得完整响应
- **THEN** 该模型结果为 `error`，错误信息说明超时

### Requirement: 连通性测试弹窗与参数控制
系统 SHALL 提供连通性测试弹窗，包含：模型多选（含全选）、自定义测试 prompt、默认测试模型选择、流式开关，以及高级参数（temperature、maxTokens、自定义 headers、自定义 body 的 JSON 编辑）。未选中任何模型时 MUST 阻止开始测试并提示。测试进行中选中状态与结果表格实时更新，每个模型显示状态（等待/运行中/成功/失败）、首字节时间与总耗时。

#### Scenario: 未选模型时无法开始测试
- **WHEN** 用户打开测试弹窗但未选中任何模型并点击开始测试
- **THEN** 系统提示需要先选择模型，且不发起任何请求

#### Scenario: 部分模型并行测试
- **WHEN** 用户选中多个模型并开始测试
- **THEN** 各模型请求并行发起，表格中每个模型独立显示各自的状态与耗时

#### Scenario: 查看请求详情
- **WHEN** 测试完成后用户点击某模型的"请求详情"入口
- **THEN** 弹窗展示该模型的请求 URL、请求 headers、请求体、响应 headers 与响应体

### Requirement: 测试参数按供应商持久化
系统 SHALL 将连通性测试参数（prompt、默认测试模型、流式开关、temperature、maxTokens、自定义 headers、自定义 body）持久化到对应供应商，并在重新打开该供应商的测试弹窗时恢复这些参数。参数缺失时 MUST 使用默认值（默认 prompt、未设置默认测试模型、流式开启）。

#### Scenario: 重开弹窗恢复已保存参数
- **WHEN** 用户曾修改某供应商的测试 prompt 与默认测试模型并保存，随后重新打开该供应商的测试弹窗
- **THEN** 弹窗显示之前保存的 prompt 与默认测试模型，且默认勾选该默认测试模型

#### Scenario: 首次打开使用默认值
- **WHEN** 用户首次打开某供应商的测试弹窗且该供应商从未保存过测试参数
- **THEN** 弹窗使用默认 prompt，无默认测试模型（不预选），流式开启

### Requirement: 供应商列表批量探针徽标
系统 SHALL 支持在供应商列表上以受限并发（并发度 5）对所有可测试供应商逐个发起探针，使用各供应商的默认测试模型；探针结果以状态徽标（成功/失败/错误）加总耗时显示在对应供应商卡片上。没有可用模型的供应商（含官方供应商与无用户配置探测目标的类型）以及端点依赖运行时动态解析的供应商类型（如 GitHub Copilot）SHALL 被跳过，不发起请求、不显示探针徽标。

#### Scenario: 批量探针逐供应商更新徽标
- **WHEN** 用户触发批量连通探针
- **THEN** 各供应商卡片按完成顺序逐个更新为成功/失败徽标与耗时，最多 5 个探针同时进行

#### Scenario: 无模型的供应商被跳过
- **WHEN** 某供应商未配置任何模型或属于官方供应商
- **THEN** 批量探针不对其发起请求，卡片不显示探针结果徽标

### Requirement: 替换旧可达性探测
系统 SHALL 移除旧的 base_url 可达性探测功能：单个与批量可达性检查命令、超时/重试/降级阈值配置面板，以及卡片上的旧检测行为。供应商卡片与列表中原"检测连通性"入口 MUST 改为打开按模型连通性测试弹窗或批量探针。旧功能的用户可见配置项（超时、重试次数、降级阈值）不再保留。

#### Scenario: 旧检测入口指向新测试
- **WHEN** 用户在供应商卡片上点击连通性检测按钮
- **THEN** 打开按模型连通性测试弹窗（而非发起 base_url 可达性探测）

#### Scenario: 旧配置面板被移除
- **WHEN** 用户打开设置/用量页面中的连通检测配置区域
- **THEN** 不再显示超时/重试/降级阈值配置项

### Requirement: 连通性测试不触碰故障转移熔断器
连通性测试结果（无论成功或失败）SHALL NOT 重置、推进或影响故障转移熔断器状态；熔断器仅由真实转发流量驱动。

#### Scenario: 测试失败不影响熔断器
- **WHEN** 某供应商的连通性测试失败

```

Full source: docs/openspec/changes/per-model-connectivity-test/specs/provider-connectivity-test/spec.md
