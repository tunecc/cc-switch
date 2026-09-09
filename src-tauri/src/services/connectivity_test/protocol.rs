//! 协议构造：claude / codex 请求体、鉴权、URL 与错误识别。
//!
//! 只构造目标（URL + headers + body），不发送请求；执行器由后续任务实现。
//! 探测目标与供应商实际出站请求对齐：按 `apiFormat`（Claude）或 `wire_api`
//!（Codex）分派端点 / 请求体，复用代理层同一套判定、转换、端点改写与鉴权构造
//!（`get_claude_api_format`、`transform_claude_request_for_api_format`、
//! `should_convert_codex_responses_to_*`、adapter 的 `extract_auth` +
//! `get_auth_headers`），避免复制实现。

use serde_json::{json, Value};

use super::ConnectivityTestParams;
use crate::error::AppError;
use crate::provider::Provider;
use crate::proxy::gemini_url::{normalize_gemini_model_id, resolve_gemini_native_url};
use crate::proxy::model_mapper::{
    strip_one_m_suffix_for_upstream, strip_one_m_suffix_for_upstream_from_body,
};
use crate::proxy::providers::{
    claude_api_format_needs_transform, get_claude_api_format, resolve_codex_chat_reasoning_config,
    should_convert_codex_responses_to_anthropic, should_convert_codex_responses_to_chat,
    transform_claude_request_for_api_format, transform_codex_anthropic, transform_codex_chat,
    transform_gemini, ClaudeAdapter, CodexAdapter, ProviderAdapter,
};

/// 测试提示词缺省值（claude / codex 共用），与前端
/// `DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt` 保持一致。
pub const DEFAULT_TEST_PROMPT: &str = "你好，你可以帮我做什么事情";

/// 已构造好的 HTTP 目标（请求体为 JSON）。
#[derive(Debug, Clone)]
pub struct HttpTarget {
    pub url: String,
    /// `(header名, header值)` 有序对
    pub headers: Vec<(String, String)>,
    pub body: Value,
}

/// 目标协议选择器。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TargetBuilder {
    Claude,
    Codex,
}

impl TargetBuilder {
    /// 从应用类型映射协议；仅 claude / codex 支持。
    pub fn for_app(app: &crate::app_config::AppType) -> Option<Self> {
        match app {
            crate::app_config::AppType::Claude => Some(Self::Claude),
            crate::app_config::AppType::Codex => Some(Self::Codex),
            _ => None,
        }
    }
}

/// 构造 Claude 连通性测试目标。
///
/// 探测目标与真实转发链路同源（`get_claude_api_format` 判定 + 代理层转换 +
/// adapter 鉴权），按 `apiFormat` 分派：
/// - `openai_chat` → `{base}/v1/chat/completions` + Chat Completions body；
/// - `openai_responses` → `{base}/v1/responses` + Responses body；
/// - `gemini_native` → `{base}/v1beta/models/{model}:{stream}generateContent(?alt=sse)` +
///   Gemini generateContent body；
/// - `anthropic`（默认/未配置）→ `{base}/v1/messages` + Anthropic Messages body，
///   并补 `anthropic-version` / `anthropic-beta`（对齐真实链路）。
///
/// 鉴权由 `ClaudeAdapter::extract_auth` + `get_auth_headers` 产生；`meta.isFullUrl`
/// 时直接使用 base_url（不拼接端点）；会话态优化（缓存、历史补全、prompt cache key）
/// 不参与测试请求。
pub fn build_claude(
    provider: &Provider,
    model: &str,
    params: &ConnectivityTestParams,
) -> Result<HttpTarget, AppError> {
    let adapter = ClaudeAdapter::new();
    let base = adapter
        .extract_base_url(provider)
        .map_err(|e| AppError::Message(format!("获取 Claude 供应商 base_url 失败: {e}")))?;

    let prompt = params
        .prompt
        .clone()
        .unwrap_or_else(|| DEFAULT_TEST_PROMPT.to_string());
    let stream = params.stream.unwrap_or(true);
    let max_tokens = params.max_tokens.unwrap_or(1024);

    let mut body = json!({
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": [ { "type": "text", "text": prompt } ]
            }
        ],
        "stream": stream,
    });
    // temperature 为可选参数，仅在显式提供时写入请求体
    if let Some(temperature) = params.temperature {
        body["temperature"] = json!(temperature);
    }

    // 与真实转发链路一致：格式转换前剥离本地 [1m] 上下文标记（上游不识别）。
    body = strip_one_m_suffix_for_upstream_from_body(body);

    let api_format = get_claude_api_format(provider);

    // 端点改写对齐真实链路 `rewrite_claude_transform_endpoint` 语义。
    let endpoint = match api_format {
        "gemini_native" => {
            let model = transform_gemini::extract_gemini_model(&body)
                .map(|m| normalize_gemini_model_id(m).to_string())
                .unwrap_or_else(|| "unknown".to_string());
            let is_stream = body.get("stream").and_then(Value::as_bool).unwrap_or(false);
            if is_stream {
                format!("/v1beta/models/{model}:streamGenerateContent?alt=sse")
            } else {
                format!("/v1beta/models/{model}:generateContent")
            }
        }
        "openai_chat" => "/v1/chat/completions".to_string(),
        "openai_responses" => "/v1/responses".to_string(),
        _ => "/v1/messages".to_string(), // anthropic（默认 / 未配置）
    };

    // 非 anthropic 格式复用代理层转换函数得到最终协议请求体。
    if claude_api_format_needs_transform(api_format) {
        body = transform_claude_request_for_api_format(body, provider, api_format, None, None)
            .map_err(|e| AppError::Message(format!("转换 Claude 请求为 {api_format} 失败: {e}")))?;
    }

    // URL：gemini_native 走专门解析（含 full-URL 归一化）；full-URL 直接使用 base；
    // 否则用 adapter 拼接端点（自动去 `/v1/v1`）。
    let url = if api_format == "gemini_native" {
        resolve_gemini_native_url(&base, &endpoint, is_full_url(provider))
    } else if is_full_url(provider) {
        base
    } else {
        adapter.build_url(&base, &endpoint)
    };

    // 鉴权头：与真实转发链路同一 adapter 的 extract_auth + get_auth_headers。
    let auth = adapter.extract_auth(provider).ok_or_else(|| {
        AppError::localized(
            "connectivity_test.claude_no_auth",
            "Claude 供应商缺少 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY / apiKey，无法进行连通性测试",
            "Claude provider is missing ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY / apiKey, cannot run connectivity test",
        )
    })?;
    let auth_headers = adapter
        .get_auth_headers(&auth)
        .map_err(|e| AppError::Message(format!("构建 Claude 鉴权头失败: {e}")))?;
    let mut headers = auth_headers_vec(auth_headers);

    // 真实链路：Claude + anthropic 格式补 anthropic-version / anthropic-beta。
    if api_format == "anthropic" {
        headers.push(("anthropic-version".to_string(), "2023-06-01".to_string()));
        headers.push((
            "anthropic-beta".to_string(),
            "claude-code-20250219".to_string(),
        ));
    }
    headers.push(("Content-Type".to_string(), "application/json".to_string()));

    // 合并自定义 body / headers（自定义 body 作用于最终协议请求体之上）。
    merge_custom_body(&mut body, params);

    if stream {
        headers.push(("Accept".to_string(), "text/event-stream".to_string()));
    }
    merge_custom_headers(&mut headers, params);

    Ok(HttpTarget { url, headers, body })
}

/// 构造 Codex 连通性测试目标。
///
/// 探测目标与真实转发链路同源，按 wire_api 判定分派：
/// - native responses（默认）→ `{base}/responses` + Responses body；
/// - chat → `{base}/chat/completions` + Chat Completions body；
/// - anthropic → `{base}/v1/messages` + Anthropic Messages body（补
///   `anthropic-version`；模型带 `[1m]` 时补 `context-1m` beta 头）。
///
/// 鉴权由 `CodexAdapter::extract_auth`（按 apiKeyField 决定 x-api-key / Bearer）+
/// `get_auth_headers` 产生；`meta.isFullUrl` 或 base 已是完整端点时直接使用
/// base_url；会话态优化（模型替换 / 历史补全 / prompt cache key）不参与。
pub fn build_codex(
    provider: &Provider,
    model: &str,
    params: &ConnectivityTestParams,
) -> Result<HttpTarget, AppError> {
    let adapter = CodexAdapter::new();
    let base = adapter
        .extract_base_url(provider)
        .map_err(|e| AppError::Message(format!("获取 Codex 供应商 base_url 失败: {e}")))?;

    // wire 判定（逻辑端点统一按 /responses），对齐真实转发链路。
    let codex_responses_to_chat = should_convert_codex_responses_to_chat(provider, "/responses");
    let codex_responses_to_anthropic =
        should_convert_codex_responses_to_anthropic(provider, "/responses");

    let prompt = params
        .prompt
        .clone()
        .unwrap_or_else(|| DEFAULT_TEST_PROMPT.to_string());
    let stream = params.stream.unwrap_or(true);

    let mut body = json!({
        "model": model,
        "input": [
            {
                "type": "message",
                "role": "user",
                "content": [ { "type": "input_text", "text": prompt } ]
            }
        ],
        "stream": stream,
        "store": false,
    });
    // temperature 为可选参数，仅在显式提供时写入请求体
    if let Some(temperature) = params.temperature {
        body["temperature"] = json!(temperature);
    }

    // [1m]：非 anthropic 转换路径在转换前剥离；anthropic 路径保留标记到转换后
    // 再剥，以便注入 context-1m beta 头（对齐真实链路）。
    let mut codex_anthropic_one_m = false;

    let (mut body, endpoint) = if codex_responses_to_chat {
        body = strip_one_m_suffix_for_upstream_from_body(body);
        let reasoning_config = resolve_codex_chat_reasoning_config(provider, &body);
        body = transform_codex_chat::responses_to_chat_completions_with_reasoning(
            body,
            reasoning_config.as_ref(),
        )
        .map_err(|e| AppError::Message(format!("转换 Codex 请求为 Chat Completions 失败: {e}")))?;
        (body, "/chat/completions")
    } else if codex_responses_to_anthropic {
        // 注入 per-provider 输出上限（若配置），对齐真实链路。
        if let Some(max_out) = provider
            .meta
            .as_ref()
            .and_then(|meta| meta.max_output_tokens)
            .filter(|v| *v > 0)
        {
            body["max_output_tokens"] = Value::from(max_out);
        }
        const DEFAULT_CODEX_ANTHROPIC_MAX_TOKENS: u64 = 8192;
        let mut body = transform_codex_anthropic::responses_request_to_anthropic(
            body,
            DEFAULT_CODEX_ANTHROPIC_MAX_TOKENS,
        )
        .map_err(|e| {
            AppError::Message(format!("转换 Codex 请求为 Anthropic Messages 失败: {e}"))
        })?;
        if let Some(model) = body.get("model").and_then(Value::as_str) {
            let stripped = strip_one_m_suffix_for_upstream(model);
            if stripped != model {
                codex_anthropic_one_m = true;
                body["model"] = Value::String(stripped.to_string());
            }
        }
        (body, "/v1/messages")
    } else {
        // Native responses：端点 /responses，body 原样（responses 形状）。
        let body = strip_one_m_suffix_for_upstream_from_body(body);
        (body, "/responses")
    };

    // URL：full-URL 或 base 已是完整端点 → 直接用 base；否则 adapter 拼接。
    let codex_chat_base_is_full_endpoint =
        codex_responses_to_chat && base_url_is_full_endpoint(&base, "/chat/completions");
    let codex_anthropic_base_is_full_endpoint =
        codex_responses_to_anthropic && base_url_is_full_endpoint(&base, "/v1/messages");
    let url = if is_full_url(provider)
        || codex_chat_base_is_full_endpoint
        || codex_anthropic_base_is_full_endpoint
    {
        base
    } else {
        adapter.build_url(&base, endpoint)
    };

    // 鉴权头：CodexAdapter::extract_auth（apiKeyField 感知）+ get_auth_headers。
    let auth = adapter.extract_auth(provider).ok_or_else(|| {
        AppError::localized(
            "connectivity_test.codex_no_auth",
            "Codex 供应商缺少 OPENAI_API_KEY，无法进行连通性测试",
            "Codex provider is missing OPENAI_API_KEY, cannot run connectivity test",
        )
    })?;
    let auth_headers = adapter
        .get_auth_headers(&auth)
        .map_err(|e| AppError::Message(format!("构建 Codex 鉴权头失败: {e}")))?;
    let mut headers = auth_headers_vec(auth_headers);

    if codex_responses_to_anthropic {
        headers.push(("anthropic-version".to_string(), "2023-06-01".to_string()));
        if codex_anthropic_one_m {
            headers.push((
                "anthropic-beta".to_string(),
                "context-1m-2025-08-07".to_string(),
            ));
        }
        if !stream {
            headers.push(("Accept".to_string(), "application/json".to_string()));
        }
    }
    headers.push(("Content-Type".to_string(), "application/json".to_string()));

    // 合并自定义 body / headers（自定义 body 作用于最终协议请求体之上）。
    merge_custom_body(&mut body, params);

    if stream {
        headers.push(("Accept".to_string(), "text/event-stream".to_string()));
    }
    merge_custom_headers(&mut headers, params);

    Ok(HttpTarget { url, headers, body })
}

/// 将 adapter 的 `(HeaderName, HeaderValue)` 鉴权头转为测试目标使用的 `(String, String)`。
fn auth_headers_vec(headers: Vec<(http::HeaderName, http::HeaderValue)>) -> Vec<(String, String)> {
    headers
        .into_iter()
        .map(|(name, value)| {
            (
                name.to_string(),
                value.to_str().unwrap_or_default().to_string(),
            )
        })
        .collect()
}

/// `meta.isFullUrl` 生效条件（与真实转发链路一致）：动态端点供应商强制排除。
fn is_full_url(provider: &Provider) -> bool {
    provider
        .meta
        .as_ref()
        .and_then(|meta| meta.is_full_url)
        .unwrap_or(false)
        && !provider.is_codex_oauth()
        && !provider.is_xai_oauth()
}

/// base_url 是否已是完整端点 URL（忽略空白 / `?query` / `#fragment` / 尾 `/`）。
///
/// 与真实转发链路 `forwarder::base_url_is_full_endpoint` 同语义；forwarder 模块
/// 为私有，此处以纯 URL 形状谓词对齐，避免双拼端点（如 `.../v1/messages/v1/messages`）。
fn base_url_is_full_endpoint(base_url: &str, endpoint_suffix: &str) -> bool {
    let trimmed = base_url.trim();
    let path = match trimmed.split_once(['?', '#']) {
        Some((head, _)) => head,
        None => trimmed,
    };
    path.trim_end_matches('/')
        .to_ascii_lowercase()
        .ends_with(endpoint_suffix)
}

/// 自定义 body：顶层对象浅合并进默认请求体（覆盖同名键，保留其余默认字段）。
fn merge_custom_body(body: &mut Value, params: &ConnectivityTestParams) {
    if let Some(custom) = &params.custom_body {
        if let Some(obj) = body.as_object_mut() {
            for (key, value) in custom {
                obj.insert(key.clone(), value.clone());
            }
        }
    }
}

/// 自定义 headers：按名（大小写不敏感）覆盖默认 headers，其余追加。
fn merge_custom_headers(headers: &mut Vec<(String, String)>, params: &ConnectivityTestParams) {
    let Some(custom) = &params.custom_headers else {
        return;
    };
    for (key, value) in custom {
        let value_str = match value {
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        if let Some(slot) = headers
            .iter_mut()
            .find(|(name, _)| name.eq_ignore_ascii_case(key))
        {
            slot.1 = value_str;
        } else {
            headers.push((key.clone(), value_str));
        }
    }
}

/// 从响应体识别错误（`Some(desc)` 表示体含错误或为空）。
///
/// 覆盖：JSON `{"error":{...}}`、`{"type":"error"}`、`{"response":{status:failed,...}}`、
/// SSE `event: error` / `event: response.failed` / `data: {"type":"error",...}`、空体。
pub fn body_reports_error(body: &[u8]) -> Option<String> {
    if body.is_empty() {
        return Some("empty response".to_string());
    }
    if let Ok(value) = serde_json::from_slice::<Value>(body) {
        return json_reports_error(&value);
    }
    let text = String::from_utf8_lossy(body);
    sse_text_reports_error(&text)
}

fn is_error_event(event: &str) -> bool {
    matches!(event.trim(), "error" | "response.failed")
}

fn json_reports_error(value: &Value) -> Option<String> {
    if value.get("error").is_some_and(|error| !error.is_null()) {
        return Some(describe_error(value));
    }
    if value
        .get("type")
        .and_then(Value::as_str)
        .is_some_and(is_error_event)
    {
        return Some(describe_error(value));
    }
    if value
        .get("event")
        .and_then(Value::as_str)
        .is_some_and(is_error_event)
    {
        return Some(describe_error(value));
    }
    if value
        .get("status")
        .and_then(Value::as_str)
        .is_some_and(|s| s == "failed")
    {
        return Some(describe_error(value));
    }
    if let Some(response) = value.get("response") {
        if response.get("error").is_some_and(|error| !error.is_null())
            || response
                .get("status")
                .and_then(Value::as_str)
                .is_some_and(|status| status == "failed")
        {
            return Some(describe_error(response));
        }
    }
    None
}

/// 提取错误描述：优先取 `message`，其次 `error.message`。
fn describe_error(value: &Value) -> String {
    let message = value.get("message").and_then(Value::as_str).or_else(|| {
        value
            .get("error")
            .and_then(|error| error.get("message"))
            .and_then(Value::as_str)
    });
    match message {
        Some(msg) if !msg.trim().is_empty() => format!("error: {}", msg.trim()),
        _ => "error".to_string(),
    }
}

fn sse_text_reports_error(text: &str) -> Option<String> {
    let mut rest = text;
    while let Some((index, delimiter_len)) = find_sse_block_delimiter(rest.as_bytes()) {
        let block = &rest[..index + delimiter_len];
        if let Some(desc) = sse_block_reports_error(block) {
            return Some(desc);
        }
        rest = &rest[index + delimiter_len..];
    }
    if !rest.trim().is_empty() {
        return sse_block_reports_error(rest);
    }
    None
}

fn find_sse_block_delimiter(buffer: &[u8]) -> Option<(usize, usize)> {
    let lf = buffer.windows(2).position(|window| window == b"\n\n");
    let crlf = buffer.windows(4).position(|window| window == b"\r\n\r\n");
    match (lf, crlf) {
        (Some(lf), Some(crlf)) if crlf < lf => Some((crlf, 4)),
        (Some(lf), _) => Some((lf, 2)),
        (None, Some(crlf)) => Some((crlf, 4)),
        (None, None) => None,
    }
}

fn sse_block_reports_error(block: &str) -> Option<String> {
    let event = sse_event_name(block);
    if event.as_deref().is_some_and(is_error_event) {
        return Some(describe_sse(block, event.as_deref()));
    }
    let payload = sse_data_payload(block)?;
    let value: Value = serde_json::from_str(payload.trim()).ok()?;
    json_reports_error(&value)
}

fn sse_event_name(block: &str) -> Option<String> {
    block.lines().find_map(|line| {
        line.strip_prefix("event:")
            .map(str::trim)
            .filter(|event| !event.is_empty())
            .map(ToString::to_string)
    })
}

fn sse_data_payload(block: &str) -> Option<String> {
    let mut lines = Vec::new();
    for line in block.lines() {
        let Some(data) = line.strip_prefix("data:") else {
            continue;
        };
        lines.push(data.trim_start().to_string());
    }
    (!lines.is_empty()).then(|| lines.join("\n"))
}

fn describe_sse(block: &str, event: Option<&str>) -> String {
    let event_desc = event.unwrap_or("unknown");
    let detail = sse_data_payload(block)
        .as_deref()
        .and_then(|payload| serde_json::from_str::<Value>(payload).ok())
        .and_then(|value| {
            value
                .get("message")
                .and_then(Value::as_str)
                .map(ToString::to_string)
        })
        .map(|message| format!(": {}", message.trim()))
        .unwrap_or_default();
    format!("sse {event_desc}{detail}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_config::AppType;
    use crate::provider::Provider;
    use serde_json::json;

    fn provider(settings: serde_json::Value) -> Provider {
        Provider::with_id("test".to_string(), "Test".to_string(), settings, None)
    }

    fn header<'a>(headers: &'a [(String, String)], name: &str) -> Option<&'a str> {
        headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| v.as_str())
    }

    // ---------- claude ----------

    #[test]
    fn claude_url_dedups_v1_from_base_and_endpoint() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com/v1",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://api.anthropic.com/v1/messages");
    }

    #[test]
    fn claude_url_converts_https_host_no_path() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://api.anthropic.com/v1/messages");
    }

    #[test]
    fn claude_auth_prefers_auth_token_bearer() {
        // 两个 env 都配置时，AUTH_TOKEN 优先 → Authorization: Bearer，不出现 x-api-key
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token",
                "ANTHROPIC_API_KEY": "sk-ant-api-key"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "Authorization"),
            Some("Bearer sk-ant-token")
        );
        assert!(header(&target.headers, "x-api-key").is_none());
    }

    #[test]
    fn claude_auth_falls_back_to_api_key() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_API_KEY": "sk-ant-api-key"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(header(&target.headers, "x-api-key"), Some("sk-ant-api-key"));
        assert!(header(&target.headers, "Authorization").is_none());
    }

    #[test]
    fn claude_missing_auth_is_error() {
        let p = provider(json!({ "env": { "ANTHROPIC_BASE_URL": "https://api.anthropic.com" } }));
        let params = ConnectivityTestParams::default();
        assert!(build_claude(&p, "claude-sonnet-5", &params).is_err());
    }

    #[test]
    fn claude_auth_falls_back_to_top_level_api_key() {
        // 顶层 settings_config.apiKey（非 env 内）也应可用作鉴权
        let p = provider(json!({
            "env": { "ANTHROPIC_BASE_URL": "https://api.anthropic.com" },
            "apiKey": "sk-ant-top-level"
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "x-api-key"),
            Some("sk-ant-top-level")
        );
        assert!(header(&target.headers, "Authorization").is_none());
    }

    #[test]
    fn claude_auth_falls_back_to_top_level_api_key_snake() {
        // 顶层 settings_config.api_key（蛇形）同样可兜底
        let p = provider(json!({
            "base_url": "https://api.anthropic.com",
            "api_key": "sk-ant-top-snake"
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "x-api-key"),
            Some("sk-ant-top-snake")
        );
    }

    #[test]
    fn claude_auth_falls_back_to_openrouter_env_key() {
        // env.OPENROUTER_API_KEY（对齐 adapter 兜底口径第 3 级）→ x-api-key
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "OPENROUTER_API_KEY": "sk-or-key"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(header(&target.headers, "x-api-key"), Some("sk-or-key"));
    }

    #[test]
    fn claude_auth_falls_back_to_openai_or_gemini_env_key() {
        // env.OPENAI_API_KEY 兜底
        let p = provider(json!({
            "env": { "ANTHROPIC_BASE_URL": "https://api.anthropic.com", "OPENAI_API_KEY": "sk-oa-key" }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(header(&target.headers, "x-api-key"), Some("sk-oa-key"));

        // env.GEMINI_API_KEY 兜底
        let p2 = provider(json!({
            "env": { "ANTHROPIC_BASE_URL": "https://api.anthropic.com", "GEMINI_API_KEY": "sk-gm-key" }
        }));
        let target2 = build_claude(&p2, "claude-sonnet-5", &params).unwrap();
        assert_eq!(header(&target2.headers, "x-api-key"), Some("sk-gm-key"));
    }

    #[test]
    fn claude_auth_prefers_env_auth_token_over_top_level_key() {
        // env.AUTH_TOKEN 优先于顶层 apiKey（级别 1 > 级别 4）
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            },
            "apiKey": "sk-ant-top-level"
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "Authorization"),
            Some("Bearer sk-ant-token")
        );
        assert!(header(&target.headers, "x-api-key").is_none());
    }

    #[test]
    fn claude_body_shape_and_defaults() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(false),
            temperature: None,
            max_tokens: None,
            custom_headers: None,
            custom_body: None,
            timeout_secs: None,
        };
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.body["model"], "claude-sonnet-5");
        assert_eq!(target.body["max_tokens"], 1024);
        assert_eq!(target.body["stream"], false);
        assert_eq!(target.body["messages"][0]["role"], "user");
        assert_eq!(target.body["messages"][0]["content"][0]["type"], "text");
        assert_eq!(target.body["messages"][0]["content"][0]["text"], "hello");
    }

    #[test]
    fn default_prompt_fallback_matches_frontend_default() {
        // params.prompt 缺省时前后端使用同一默认提示词
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let claude = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            claude.body["messages"][0]["content"][0]["text"],
            json!(DEFAULT_TEST_PROMPT)
        );

        let c = provider(codex_provider_base());
        let codex = build_codex(&c, "gpt-5.5", &params).unwrap();
        assert_eq!(
            codex.body["input"][0]["content"][0]["text"],
            json!(DEFAULT_TEST_PROMPT)
        );
    }

    #[test]
    fn claude_custom_body_shallow_merges_and_overrides() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams {
            prompt: None,
            stream: None,
            temperature: Some(0.5),
            max_tokens: Some(256),
            custom_headers: None,
            custom_body: Some(
                serde_json::from_str(r#"{ "max_tokens": 512, "stop": ["END"] }"#).unwrap(),
            ),
            timeout_secs: None,
        };
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        // custom_body 顶层浅合并，覆盖默认 max_tokens
        assert_eq!(target.body["max_tokens"], 512);
        assert_eq!(target.body["stop"][0], "END");
        // 未覆盖的默认字段仍然存在
        assert_eq!(target.body["model"], "claude-sonnet-5");
        // 显式提供的 temperature 写入请求体
        assert_eq!(target.body["temperature"], 0.5);
    }

    #[test]
    fn claude_custom_headers_merged() {
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams {
            prompt: None,
            stream: Some(true),
            temperature: None,
            max_tokens: None,
            custom_headers: Some(
                serde_json::from_str(r#"{ "X-Test": "abc", "Content-Type": "application/json" }"#)
                    .unwrap(),
            ),
            custom_body: None,
            timeout_secs: None,
        };
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(header(&target.headers, "X-Test"), Some("abc"));
        assert_eq!(
            header(&target.headers, "content-type"),
            Some("application/json")
        );
        // 流式请求需要 Accept: text/event-stream
        assert_eq!(header(&target.headers, "accept"), Some("text/event-stream"));
    }

    // ---------- 探测目标与 API 格式对齐（A1-A7） ----------

    fn provider_with_meta(
        settings: serde_json::Value,
        meta: crate::provider::ProviderMeta,
    ) -> Provider {
        let mut p = provider(settings);
        p.meta = Some(meta);
        p
    }

    fn claude_provider_with_format(api_format: &str) -> Provider {
        let mut meta = crate::provider::ProviderMeta::default();
        meta.api_format = Some(api_format.to_string());
        provider_with_meta(
            json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://relay.example.com",
                    "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
                }
            }),
            meta,
        )
    }

    #[test]
    fn claude_openai_chat_targets_chat_completions() {
        // A1: apiFormat=openai_chat → /v1/chat/completions + Chat Completions 形状
        let p = claude_provider_with_format("openai_chat");
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(true),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "gpt-5.4", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/v1/chat/completions");
        assert_eq!(target.body["model"], "gpt-5.4");
        assert_eq!(target.body["stream"], true);
        assert_eq!(target.body["messages"][0]["role"], "user");
        assert_eq!(target.body["messages"][0]["content"], "hello");
        // 流式注入 stream_options.include_usage（与真实链路转换一致）
        assert_eq!(target.body["stream_options"]["include_usage"], true);
        // 非 anthropic 格式不带 anthropic 头
        assert!(header(&target.headers, "anthropic-version").is_none());
        assert!(header(&target.headers, "anthropic-beta").is_none());
        // 鉴权与真实链路同源：AUTH_TOKEN → Bearer
        assert_eq!(
            header(&target.headers, "authorization"),
            Some("Bearer sk-ant-token")
        );
    }

    #[test]
    fn claude_openai_responses_targets_responses_endpoint() {
        // A2: apiFormat=openai_responses → /v1/responses + Responses 形状
        let p = claude_provider_with_format("openai_responses");
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(true),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "gpt-5.4", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/v1/responses");
        assert_eq!(target.body["model"], "gpt-5.4");
        assert_eq!(target.body["stream"], true);
        assert_eq!(target.body["input"][0]["role"], "user");
        // max_tokens 转换为 Responses 的 max_output_tokens
        assert_eq!(target.body["max_output_tokens"], 1024);
        assert!(header(&target.headers, "anthropic-version").is_none());
    }

    #[test]
    fn claude_gemini_native_targets_model_method_url() {
        // A3: gemini_native → /v1beta/models/{model}:{method}；普通 key → x-goog-api-key
        let mut meta = crate::provider::ProviderMeta::default();
        meta.api_format = Some("gemini_native".to_string());
        let p = provider_with_meta(
            json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com",
                    "GEMINI_API_KEY": "gem-key"
                }
            }),
            meta,
        );

        let non_stream = ConnectivityTestParams {
            stream: Some(false),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "gemini-2.5-pro", &non_stream).unwrap();
        assert_eq!(
            target.url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
        );
        // Gemini generateContent 形状：contents + generationConfig；model 只出现在 URL
        assert!(target.body.get("model").is_none());
        assert_eq!(target.body["contents"][0]["role"], "user");
        assert_eq!(target.body["generationConfig"]["maxOutputTokens"], 1024);
        assert_eq!(header(&target.headers, "x-goog-api-key"), Some("gem-key"));

        let stream_params = ConnectivityTestParams::default(); // stream=true
        let target = build_claude(&p, "gemini-2.5-pro", &stream_params).unwrap();
        assert_eq!(
            target.url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse"
        );
    }

    #[test]
    fn claude_gemini_native_normalizes_models_prefix_in_url() {
        // `models/` 资源名形式归一化，避免 /v1beta/models/models/... 双前缀
        let mut meta = crate::provider::ProviderMeta::default();
        meta.api_format = Some("gemini_native".to_string());
        let p = provider_with_meta(
            json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com",
                    "GEMINI_API_KEY": "gem-key"
                }
            }),
            meta,
        );
        let non_stream = ConnectivityTestParams {
            stream: Some(false),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "models/gemini-2.5-pro", &non_stream).unwrap();
        assert_eq!(
            target.url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
        );
    }

    #[test]
    fn claude_gemini_native_oauth_uses_bearer_access_token() {
        // A6: GeminiCli OAuth 凭据（含可用 access_token）→ Bearer access_token
        let mut meta = crate::provider::ProviderMeta::default();
        meta.api_format = Some("gemini_native".to_string());
        let p = provider_with_meta(
            json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com",
                    "GEMINI_API_KEY": r#"{"access_token":"ya-token"}"#
                }
            }),
            meta,
        );
        let params = ConnectivityTestParams {
            stream: Some(false),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "gemini-2.5-pro", &params).unwrap();
        assert_eq!(
            header(&target.headers, "authorization"),
            Some("Bearer ya-token")
        );
        assert!(header(&target.headers, "x-goog-api-key").is_none());
    }

    #[test]
    fn claude_anthropic_format_sends_anthropic_version_and_beta() {
        // A4: 默认 anthropic 格式补 anthropic-version / anthropic-beta（对齐真实链路）
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://api.anthropic.com/v1/messages");
        assert_eq!(
            header(&target.headers, "anthropic-version"),
            Some("2023-06-01")
        );
        assert_eq!(
            header(&target.headers, "anthropic-beta"),
            Some("claude-code-20250219")
        );
    }

    #[test]
    fn claude_settings_api_format_fallback_is_respected() {
        // 旧版 settings_config.api_format 兜底口径同样生效
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://relay.example.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            },
            "api_format": "openai_chat"
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "gpt-5.4", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/v1/chat/completions");
    }

    #[test]
    fn claude_openrouter_base_url_uses_bearer_auth() {
        // A6: OpenRouter → Authorization: Bearer（与真实链路 adapter 策略一致）
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
                "ANTHROPIC_AUTH_TOKEN": "sk-or-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "authorization"),
            Some("Bearer sk-or-token")
        );
        assert!(header(&target.headers, "x-api-key").is_none());
    }

    #[test]
    fn claude_full_url_uses_base_url_directly() {
        // A7: meta.isFullUrl=true → 直接使用 base_url，不拼接端点路径
        let mut meta = crate::provider::ProviderMeta::default();
        meta.is_full_url = Some(true);
        let p = provider_with_meta(
            json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://relay.example.com/custom/messages",
                    "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
                }
            }),
            meta,
        );
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/custom/messages");
    }

    #[test]
    fn claude_one_m_marker_stripped_for_upstream() {
        // 与真实链路一致：转换前剥离 [1m] 标记（上游不识别）
        let p = provider(json!({
            "env": {
                "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
                "ANTHROPIC_AUTH_TOKEN": "sk-ant-token"
            }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_claude(&p, "claude-sonnet-5[1m]", &params).unwrap();
        assert_eq!(target.body["model"], "claude-sonnet-5");
    }

    #[test]
    fn claude_openai_chat_custom_body_merges_over_transformed_body() {
        // 自定义 body 浅合并发生在转换后的最终协议请求体之上
        let p = claude_provider_with_format("openai_chat");
        let params = ConnectivityTestParams {
            custom_body: Some(serde_json::from_str(r#"{ "max_tokens": 7 }"#).unwrap()),
            ..ConnectivityTestParams::default()
        };
        let target = build_claude(&p, "gpt-5.4", &params).unwrap();
        assert_eq!(target.body["max_tokens"], 7);
        assert_eq!(target.body["model"], "gpt-5.4");
        assert_eq!(target.body["stream_options"]["include_usage"], true);
    }

    // ---------- codex ----------

    fn codex_provider_base() -> serde_json::Value {
        json!({
            "config": r#"model_provider = "custom"
base_url = "https://api.openai.com/v1"

[model_providers.custom]
wire_api = "responses"
"#,
            "auth": { "OPENAI_API_KEY": "sk-codex-key" }
        })
    }

    #[test]
    fn codex_url_uses_responses_endpoint() {
        let p = provider(codex_provider_base());
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(target.url, "https://api.openai.com/v1/responses");
    }

    #[test]
    fn codex_auth_from_env_preferred_then_auth() {
        // env.OPENAI_API_KEY 优先
        let p = provider(json!({
            "config": r#"base_url = "https://api.openai.com/v1"
        "#,
            "env": { "OPENAI_API_KEY": "sk-env-key" },
            "auth": { "OPENAI_API_KEY": "sk-auth-key" }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "Authorization"),
            Some("Bearer sk-env-key")
        );

        // auth.OPENAI_API_KEY 兜底
        let p2 = provider(json!({
            "config": r#"base_url = "https://api.openai.com/v1"
        "#,
            "auth": { "OPENAI_API_KEY": "sk-auth-key" }
        }));
        let target2 = build_codex(&p2, "gpt-5.5", &params).unwrap();
        assert_eq!(
            header(&target2.headers, "Authorization"),
            Some("Bearer sk-auth-key")
        );
    }

    #[test]
    fn codex_missing_auth_is_error() {
        let p = provider(json!({
            "config": r#"base_url = "https://api.openai.com/v1"
        "#
        }));
        let params = ConnectivityTestParams::default();
        assert!(build_codex(&p, "gpt-5.5", &params).is_err());
    }

    #[test]
    fn codex_missing_base_url_is_error() {
        let p = provider(json!({ "auth": { "OPENAI_API_KEY": "sk-codex-key" } }));
        let params = ConnectivityTestParams::default();
        assert!(build_codex(&p, "gpt-5.5", &params).is_err());
    }

    #[test]
    fn codex_body_shape_and_defaults() {
        let p = provider(codex_provider_base());
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(true),
            temperature: None,
            max_tokens: None,
            custom_headers: None,
            custom_body: None,
            timeout_secs: None,
        };
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(target.body["model"], "gpt-5.5");
        assert_eq!(target.body["stream"], true);
        assert_eq!(target.body["store"], false);
        assert_eq!(target.body["input"][0]["type"], "message");
        assert_eq!(target.body["input"][0]["role"], "user");
        assert_eq!(target.body["input"][0]["content"][0]["type"], "input_text");
        assert_eq!(target.body["input"][0]["content"][0]["text"], "hello");
    }

    #[test]
    fn codex_custom_body_and_headers_merged() {
        let p = provider(codex_provider_base());
        let params = ConnectivityTestParams {
            prompt: None,
            stream: None,
            temperature: Some(0.9),
            max_tokens: None,
            custom_headers: Some(
                serde_json::from_str(r#"{ "Authorization": "Bearer custom" }"#).unwrap(),
            ),
            custom_body: Some(serde_json::from_str(r#"{ "store": true }"#).unwrap()),
            timeout_secs: None,
        };
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(target.body["store"], true);
        // 自定义 header 覆盖默认 Authorization
        assert_eq!(
            header(&target.headers, "Authorization"),
            Some("Bearer custom")
        );
        // 显式提供的 temperature 写入请求体
        assert_eq!(target.body["temperature"], 0.9);
    }

    #[test]
    fn codex_chat_wire_targets_chat_completions() {
        // A5: TOML wire_api="chat" → /chat/completions + Chat Completions 形状
        let p = provider(json!({
            "config": r#"model_provider = "custom"
base_url = "https://relay.example.com/v1"

[model_providers.custom]
wire_api = "chat"
"#,
            "auth": { "OPENAI_API_KEY": "sk-key" }
        }));
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(true),
            ..ConnectivityTestParams::default()
        };
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/v1/chat/completions");
        assert_eq!(target.body["model"], "gpt-5.5");
        assert_eq!(target.body["stream"], true);
        assert_eq!(target.body["messages"][0]["role"], "user");
        assert_eq!(target.body["messages"][0]["content"], "hello");
        // 流式注入 stream_options.include_usage（与真实链路转换一致）
        assert_eq!(target.body["stream_options"]["include_usage"], true);
        // 非默认 wire 不带 anthropic 头
        assert!(header(&target.headers, "anthropic-version").is_none());
        // 鉴权仍为 Bearer
        assert_eq!(
            header(&target.headers, "authorization"),
            Some("Bearer sk-key")
        );
    }

    #[test]
    fn codex_anthropic_wire_targets_messages_and_x_api_key() {
        // A5/A6: wire_api="anthropic" → /v1/messages + Anthropic 形状；
        // apiKeyField=ANTHROPIC_API_KEY → x-api-key
        let mut meta = crate::provider::ProviderMeta::default();
        meta.api_key_field = Some("ANTHROPIC_API_KEY".to_string());
        let p = provider_with_meta(
            json!({
                "config": r#"model_provider = "custom"
base_url = "https://relay.example.com"

[model_providers.custom]
wire_api = "anthropic"
"#,
                "auth": { "OPENAI_API_KEY": "sk-anthropic-key" }
            }),
            meta,
        );
        let params = ConnectivityTestParams {
            prompt: Some("hello".to_string()),
            stream: Some(true),
            ..ConnectivityTestParams::default()
        };
        let target = build_codex(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/v1/messages");
        assert_eq!(target.body["model"], "claude-sonnet-5");
        assert_eq!(target.body["messages"][0]["role"], "user");
        assert_eq!(target.body["messages"][0]["content"][0]["type"], "text");
        assert_eq!(target.body["messages"][0]["content"][0]["text"], "hello");
        // max_tokens 必填：默认 8192（对齐真实链路）
        assert_eq!(target.body["max_tokens"], 8192);
        assert_eq!(target.body["stream"], true);
        // apiKeyField=ANTHROPIC_API_KEY → x-api-key，Bearer 不出现
        assert_eq!(
            header(&target.headers, "x-api-key"),
            Some("sk-anthropic-key")
        );
        assert!(header(&target.headers, "authorization").is_none());
        // anthropic-version 补默认值（无 beta，除非 [1m] / 伪装）
        assert_eq!(
            header(&target.headers, "anthropic-version"),
            Some("2023-06-01")
        );
        assert!(header(&target.headers, "anthropic-beta").is_none());
    }

    #[test]
    fn codex_anthropic_wire_defaults_to_bearer_and_json_accept() {
        // 无 apiKeyField → 缺省 Bearer；非流式补 Accept: application/json（对齐真实链路）
        let p = provider(json!({
            "config": r#"model_provider = "custom"
base_url = "https://relay.example.com"

[model_providers.custom]
wire_api = "anthropic"
"#,
            "auth": { "OPENAI_API_KEY": "sk-anthropic-token" }
        }));
        let params = ConnectivityTestParams {
            stream: Some(false),
            ..ConnectivityTestParams::default()
        };
        let target = build_codex(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(
            header(&target.headers, "authorization"),
            Some("Bearer sk-anthropic-token")
        );
        assert!(header(&target.headers, "x-api-key").is_none());
        // 非流式补 Accept: application/json，且不带 text/event-stream
        assert_eq!(header(&target.headers, "Accept"), Some("application/json"));
        assert_eq!(target.body["stream"], false);
    }

    #[test]
    fn codex_anthropic_one_m_marker_stripped_with_beta_header() {
        // 模型带 [1m] → 转换后剥离标记并补 context-1m beta 头（对齐真实链路）
        let p = provider(json!({
            "config": r#"model_provider = "custom"
base_url = "https://relay.example.com"

[model_providers.custom]
wire_api = "anthropic"
"#,
            "auth": { "OPENAI_API_KEY": "sk-anthropic-token" }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "claude-sonnet-5[1m]", &params).unwrap();
        assert_eq!(target.body["model"], "claude-sonnet-5");
        assert_eq!(
            header(&target.headers, "anthropic-beta"),
            Some("context-1m-2025-08-07")
        );
        assert_eq!(
            header(&target.headers, "anthropic-version"),
            Some("2023-06-01")
        );
    }

    #[test]
    fn codex_anthropic_max_output_tokens_meta_is_injected() {
        // per-provider 输出上限 meta.maxOutputTokens 参与转换（对齐真实链路）
        let mut meta = crate::provider::ProviderMeta::default();
        meta.max_output_tokens = Some(2048);
        let p = provider_with_meta(
            json!({
                "config": r#"model_provider = "custom"
base_url = "https://relay.example.com"

[model_providers.custom]
wire_api = "anthropic"
"#,
                "auth": { "OPENAI_API_KEY": "sk-anthropic-token" }
            }),
            meta,
        );
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.body["max_tokens"], 2048);
    }

    #[test]
    fn codex_full_url_uses_base_url_directly() {
        // A7: meta.isFullUrl=true → 直接使用 base_url，不拼接端点路径
        let mut meta = crate::provider::ProviderMeta::default();
        meta.is_full_url = Some(true);
        let p = provider_with_meta(
            json!({
                "config": r#"base_url = "https://relay.example.com/openai/v1/responses""#,
                "auth": { "OPENAI_API_KEY": "sk-key" }
            }),
            meta,
        );
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "gpt-5.5", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/openai/v1/responses");
    }

    #[test]
    fn codex_anthropic_base_already_full_endpoint_is_not_doubled() {
        // 防御：未开 isFullUrl 但 base 已是 /v1/messages 完整端点 → 不双拼
        let p = provider(json!({
            "config": r#"model_provider = "custom"
base_url = "https://relay.example.com/api/v1/messages"

[model_providers.custom]
wire_api = "anthropic"
"#,
            "auth": { "OPENAI_API_KEY": "sk-anthropic-token" }
        }));
        let params = ConnectivityTestParams::default();
        let target = build_codex(&p, "claude-sonnet-5", &params).unwrap();
        assert_eq!(target.url, "https://relay.example.com/api/v1/messages");
    }

    // ---------- for_app ----------

    #[test]
    fn for_app_maps_claude_and_codex_only() {
        assert_eq!(
            TargetBuilder::for_app(&AppType::Claude),
            Some(TargetBuilder::Claude)
        );
        assert_eq!(
            TargetBuilder::for_app(&AppType::Codex),
            Some(TargetBuilder::Codex)
        );
        assert_eq!(TargetBuilder::for_app(&AppType::Gemini), None);
        assert_eq!(TargetBuilder::for_app(&AppType::OpenCode), None);
    }

    // ---------- body_reports_error ----------

    #[test]
    fn empty_body_reports_error() {
        assert_eq!(body_reports_error(b""), Some("empty response".to_string()));
    }

    #[test]
    fn json_error_object_reports_error() {
        assert!(body_reports_error(br#"{"error":{"message":"failed"}}"#).is_some());
        assert!(body_reports_error(br#"{"type":"error","error":{"message":"x"}}"#).is_some());
    }

    #[test]
    fn sse_event_error_reports_error() {
        let body = b"event: error\ndata: {\"type\":\"error\",\"message\":\"failed\"}\n\n";
        assert!(body_reports_error(body).is_some());
    }

    #[test]
    fn sse_event_response_failed_reports_error() {
        let body = b"event: response.failed\ndata: {\"type\":\"response.failed\",\"response\":{\"status\":\"failed\",\"error\":{\"message\":\"failed\"}}}\n\n";
        assert!(body_reports_error(body).is_some());
    }

    #[test]
    fn json_response_status_failed_reports_error() {
        assert!(body_reports_error(
            br#"{"response":{"status":"failed","error":{"message":"failed"}}}"#
        )
        .is_some());
    }

    #[test]
    fn sse_plain_delta_does_not_report_error() {
        let body = b"data: {\"type\":\"response.output_text.delta\",\"delta\":\"hi\"}\n\n";
        assert_eq!(body_reports_error(body), None);
    }

    #[test]
    fn success_json_does_not_report_error() {
        assert_eq!(
            body_reports_error(br#"{"id":"msg_123","content":[{"type":"text","text":"hi"}]}"#),
            None
        );
    }

    #[test]
    fn sse_multiline_error_payload_reports_error() {
        // 参考 ai-toolbox：多行 data: 载荷的 error
        let body = concat!(
            "event: response.failed\n",
            "data: {\"type\":\"response.failed\",\n",
            "data: \"response\":{\"status\":\"failed\",\n",
            "data: \"error\":{\"message\":\"boom\"}}}\n\n"
        );
        assert!(body_reports_error(body.as_bytes()).is_some());
    }
}
