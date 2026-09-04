---
archived-with: 2026-09-04-per-model-connectivity-test
status: final
---
# 设计：按模型真实请求连通性测试

> Change: `per-model-connectivity-test` · 阶段：Design → Build · 语言：zh-CN
> 参照实现：ai-toolbox `connectivity_test.rs` + `ProviderConnectivityTestModal.tsx`
> 关联设计：`docs/openspec/changes/per-model-connectivity-test/design.md`

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

（无——原"codex wire_api: chat 占比"已调查确认：全部内置 codex 预设均为 `wire_api = "responses"`，且 Codex 0.149 起已移除 chat wire API（见 `codex_config.rs:2788`），首期只实现 Responses API，`wire_api: chat` 供应商标记为明确错误信息。）
