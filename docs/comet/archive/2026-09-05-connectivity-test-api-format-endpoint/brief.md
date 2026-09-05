# 目标

连通性测试的探测目标与供应商实际出站请求对齐：当 Claude/Codex 供应商配置了非默认 API 格式（如 OpenAI Chat Completions）时，测试请求应使用与真实转发链路一致的端点、请求体和鉴权，而不是固定按 Anthropic `/v1/messages`（Claude）或 `/responses`（Codex）构造。

现状问题：`services/connectivity_test/protocol.rs` 的 `build_claude` 无视 `apiFormat`（meta/`api_format`），一律 POST `{base}/v1/messages` + Anthropic body；`build_codex` 无视 wire_api，一律 POST `{base}/responses` + Responses body。用户在供应商表单把请求接口设为 OpenAI Chat Completions 后，连通性测试仍打 `/v1/messages`，与实际链路不符。

# 范围

- `src-tauri/src/services/connectivity_test/protocol.rs`：按 apiFormat/wire_api 分派目标构造，复用代理层现有转换函数与端点改写规则；鉴权头改用 adapter 的 `extract_auth` + `get_auth_headers` 与真实链路同源。
- 对应单元测试（protocol.rs / mod.rs / commands 层）。
- 必要的错误文案与 i18n key。

# 非目标

- 不修改本地代理的转发/转换实现（只读复用）。
- 不改动连通性测试的前端交互流程（现有结果详情自动展示新 URL/body）。
- 不涉及模型列表拉取（`fetch_models`）逻辑。
- 不改动 ai-toolbox 项目。

# 验收示例

- A1: Claude 供应商 `apiFormat=openai_chat` 时，测试请求 URL 为 `{base}/v1/chat/completions`，请求体为 Chat Completions 形状（含测试提示词的 messages；流式时含 `stream:true` 且注入 `stream_options.include_usage`）。
- A2: Claude 供应商 `apiFormat=openai_responses` 时，URL 为 `{base}/v1/responses`，请求体为 Responses 形状（model/input/stream）。
- A3: Claude 供应商 `apiFormat=gemini_native` 时，非流式 URL 为 `{base}/v1beta/models/{model}:generateContent`，流式为 `{base}/v1beta/models/{model}:streamGenerateContent?alt=sse`，请求体为 Gemini generateContent 形状。
- A4: Claude 供应商 `apiFormat=anthropic`（或未配置）时，URL 保持 `{base}/v1/messages` + Anthropic body，并补发 `anthropic-version: 2023-06-01`（对齐真实链路默认值）。
- A5: Codex 供应商 wire_api=chat（或 apiFormat 等价声明）时，URL 为 `{base}/chat/completions` + Chat 形状 body；wire_api=anthropic 时，URL 为 `{base}/v1/messages` + Anthropic 形状 body。
- A6: 鉴权头由 `ClaudeAdapter`/`CodexAdapter` 的 `extract_auth` + `get_auth_headers` 生成（与真实转发链路同一实现）：ANTHROPIC_AUTH_TOKEN → Bearer、ANTHROPIC_API_KEY → x-api-key、gemini 普通 key → x-goog-api-key、OpenRouter → Bearer、Codex Anthropic 网关按 apiKeyField 决定 x-api-key/Bearer。
- A7: `meta.isFullUrl=true` 时测试请求 URL 直接使用 base_url（不拼接端点路径），对齐真实链路 full-URL 模式。
- A8: 转换失败或配置缺失（无 base_url / 无鉴权等）返回明确 error 结果（含原因文案），不 panic。
- A9: 结果详情中的 request_url / request_headers（鉴权头脱敏后）/ request_body 与实际发送内容一致。
- A10: 既有判定语义（2xx / 流错误 / 空体 / 错误事件 / 总超时）与敏感头脱敏范围保持不变；既有测试全部通过，并新增上述各格式的目标构造断言。

# 约束与不变量

- apiFormat 判定复用 `get_claude_api_format`（SSOT：codex_oauth/xai_oauth 强制 openai_responses（该两类已被 `is_probe_capable` 排除）> meta.apiFormat > settings_config.api_format > openrouter_compat_mode > 默认 anthropic）；Codex 侧复用 `codex_provider_uses_chat_completions` / `codex_provider_uses_anthropic`（meta.apiFormat > settings api_format/apiFormat > TOML wire_api > base_url 形状）。
- 请求体转换复用代理层 `transform_claude_request_for_api_format`（openai_chat / openai_responses / gemini_native）与 Codex 侧转换（`responses_to_chat_completions_with_reasoning` / `responses_request_to_anthropic`），不在连通性测试里复制转换实现；会话态优化（缓存断点注入、会话历史补全、prompt cache key）不参与测试请求。
- 端点改写对齐 `rewrite_claude_transform_endpoint` 语义：openai_chat → `/v1/chat/completions`；openai_responses → `/v1/responses`；gemini_native → `/v1beta/models/{model}:generateContent`（非流式）或 `:streamGenerateContent?alt=sse`（流式）。
- 探测请求直连上游（不经本地代理），沿用现有直连执行器与超时/判定语义。
- 结果中 request_headers 的鉴权敏感头脱敏逻辑保持不变。
- 动态端点供应商（codex_oauth / xai_oauth / github_copilot）与官方供应商仍按 `is_probe_capable` 排除，不进入测试。

# 决策

- D1（对齐范围）：Claude 全部 4 种 apiFormat + Codex wire_api=chat/anthropic 一并对齐。理由：同类不匹配一次修完，Codex 侧存在与 Claude 完全相同的问题形态。
- D2（实现架构）：直连上游 + 复用代理转换层（URL/body/端点改写/鉴权与真实出站请求同源）。理由：不依赖本地代理运行、任意供应商可测；与 ai-toolbox 的差异（其走网关回环）在于 cc-switch 代理尚无「指定供应商」路由能力，改造成本远超收益。
- D3（工作区隔离）：沿用当前目录（change 已按 current 创建）。理由：本需求只动 src-tauri 后端与对应测试，与未提交的「搜索添加模型」前端改动文件集不重叠，提交时可按路径分开。

# 待解决问题

（无——三个 blocking 问题及最终共享理解均已被用户确认）

# 验证预期

- `cargo test`（src-tauri）connectivity 相关单测通过；新增各 apiFormat 的目标构造断言（URL/headers/body 形状）。
- 前端既有 `ConnectivityTestDialog` 测试不回归。
- 手动验证（可选）：对配置为 openai_chat 的真实供应商发起测试，结果详情中的 URL 应为 `/v1/chat/completions` 且能成功。
