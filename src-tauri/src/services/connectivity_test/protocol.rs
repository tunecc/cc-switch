//! 协议构造：claude / codex 请求体、鉴权、URL 与错误识别。
//!
//! 只构造目标（URL + headers + body），不发送请求；执行器由后续任务实现。
//! 复用现有 adapter 的提取/构建逻辑（`extract_base_url` / `build_url`），
//! 避免复制实现。

use serde_json::{json, Value};

use super::ConnectivityTestParams;
use crate::error::AppError;
use crate::provider::Provider;
use crate::proxy::providers::{ClaudeAdapter, CodexAdapter, ProviderAdapter};

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
/// URL：`ClaudeAdapter::build_url(base, "/v1/messages")`（自动去 `/v1/v1`）；
/// 鉴权：`env.ANTHROPIC_AUTH_TOKEN` → `Authorization: Bearer`，否则
/// `env.ANTHROPIC_API_KEY` → `x-api-key`，两者皆无返回错误；
/// body：`{model, max_tokens, messages, stream}`，自定义 body 顶层浅合并。
pub fn build_claude(
    provider: &Provider,
    model: &str,
    params: &ConnectivityTestParams,
) -> Result<HttpTarget, AppError> {
    let adapter = ClaudeAdapter::new();
    let base = adapter
        .extract_base_url(provider)
        .map_err(|e| AppError::Message(format!("获取 Claude 供应商 base_url 失败: {e}")))?;
    let url = adapter.build_url(&base, "/v1/messages");

    // 鉴权：AUTH_TOKEN 优先 → Bearer；否则 API_KEY → x-api-key
    let env = provider.settings_config.get("env");
    let auth_token = env
        .and_then(|e| e.get("ANTHROPIC_AUTH_TOKEN"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let api_key = env
        .and_then(|e| e.get("ANTHROPIC_API_KEY"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let mut headers: Vec<(String, String)> = Vec::new();
    match auth_token {
        Some(token) => {
            headers.push(("Authorization".to_string(), format!("Bearer {token}")));
        }
        None => match api_key {
            Some(key) => headers.push(("x-api-key".to_string(), key.to_string())),
            None => {
                return Err(AppError::localized(
                    "connectivity_test.claude_no_auth",
                    "Claude 供应商缺少 ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_API_KEY，无法进行连通性测试",
                    "Claude provider is missing ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY, cannot run connectivity test",
                ))
            }
        },
    }
    headers.push(("Content-Type".to_string(), "application/json".to_string()));

    let prompt = params.prompt.clone().unwrap_or_else(|| "ping".to_string());
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
    merge_custom_body(&mut body, params);

    if stream {
        headers.push(("Accept".to_string(), "text/event-stream".to_string()));
    }
    merge_custom_headers(&mut headers, params);

    Ok(HttpTarget { url, headers, body })
}

/// 构造 Codex 连通性测试目标。
///
/// URL：`CodexAdapter::build_url(base, "/responses")`；
/// 鉴权：`env.OPENAI_API_KEY` → 或 `auth.OPENAI_API_KEY`（经
/// `codex_config::extract_codex_auth_api_key`）→ `Authorization: Bearer`；
/// body：`{model, input, stream, store:false}`，自定义 body 顶层浅合并。
pub fn build_codex(
    provider: &Provider,
    model: &str,
    params: &ConnectivityTestParams,
) -> Result<HttpTarget, AppError> {
    let adapter = CodexAdapter::new();
    let base = adapter
        .extract_base_url(provider)
        .map_err(|e| AppError::Message(format!("获取 Codex 供应商 base_url 失败: {e}")))?;
    let url = adapter.build_url(&base, "/responses");

    // 鉴权：env.OPENAI_API_KEY 优先，其次 auth.OPENAI_API_KEY
    let env_key = provider
        .settings_config
        .get("env")
        .and_then(|e| e.get("OPENAI_API_KEY"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let auth_key = provider
        .settings_config
        .get("auth")
        .and_then(crate::codex_config::extract_codex_auth_api_key);
    let key = match env_key.or(auth_key.as_deref()) {
        Some(k) => k,
        None => {
            return Err(AppError::localized(
                "connectivity_test.codex_no_auth",
                "Codex 供应商缺少 OPENAI_API_KEY，无法进行连通性测试",
                "Codex provider is missing OPENAI_API_KEY, cannot run connectivity test",
            ))
        }
    };

    let mut headers: Vec<(String, String)> = vec![
        ("Authorization".to_string(), format!("Bearer {key}")),
        ("Content-Type".to_string(), "application/json".to_string()),
    ];

    let prompt = params.prompt.clone().unwrap_or_else(|| "ping".to_string());
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
    merge_custom_body(&mut body, params);

    if stream {
        headers.push(("Accept".to_string(), "text/event-stream".to_string()));
    }
    merge_custom_headers(&mut headers, params);

    Ok(HttpTarget { url, headers, body })
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
    if value.get("status").and_then(Value::as_str).is_some_and(|s| s == "failed") {
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
    let message = value
        .get("message")
        .and_then(Value::as_str)
        .or_else(|| {
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
        .and_then(|value| value.get("message").and_then(Value::as_str).map(ToString::to_string))
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
        assert_eq!(header(&target.headers, "Authorization"), Some("Bearer sk-ant-token"));
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
        assert_eq!(header(&target.headers, "content-type"), Some("application/json"));
        // 流式请求需要 Accept: text/event-stream
        assert_eq!(header(&target.headers, "accept"), Some("text/event-stream"));
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
        assert_eq!(header(&target.headers, "Authorization"), Some("Bearer sk-env-key"));

        // auth.OPENAI_API_KEY 兜底
        let p2 = provider(json!({
            "config": r#"base_url = "https://api.openai.com/v1"
"#,
            "auth": { "OPENAI_API_KEY": "sk-auth-key" }
        }));
        let target2 = build_codex(&p2, "gpt-5.5", &params).unwrap();
        assert_eq!(header(&target2.headers, "Authorization"), Some("Bearer sk-auth-key"));
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
        assert_eq!(header(&target.headers, "Authorization"), Some("Bearer custom"));
        // 显式提供的 temperature 写入请求体
        assert_eq!(target.body["temperature"], 0.9);
    }

    // ---------- for_app ----------

    #[test]
    fn for_app_maps_claude_and_codex_only() {
        assert_eq!(TargetBuilder::for_app(&AppType::Claude), Some(TargetBuilder::Claude));
        assert_eq!(TargetBuilder::for_app(&AppType::Codex), Some(TargetBuilder::Codex));
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
        assert!(body_reports_error(br#"{"response":{"status":"failed","error":{"message":"failed"}}}"#).is_some());
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
