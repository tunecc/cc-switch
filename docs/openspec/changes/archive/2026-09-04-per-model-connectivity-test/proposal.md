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