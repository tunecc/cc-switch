//! 后端连通性测试服务核心。
//!
//! 按模型真实请求探测供应商连通性（claude → `/v1/messages`，codex → `/v1/responses`）。
//! 本模块包含类型定义、模型清单解析、协议/请求构造，以及直连执行器：
//! 通过全局 reqwest 客户端（`crate::proxy::http_client::get()`，已跟随系统/配置代理）
//! 直接 `POST` 上游供应商，流式读取 SSE 响应，度量首字节 / 总耗时并给出连通性判定。
//! 类型 / 解析 / 协议构造与直连执行器已被 `commands::connectivity_test` 的
//! `connectivity_test_provider_models` / `connectivity_probe_provider` 命令消费。

pub mod model_ids;
pub mod protocol;

use std::time::{Duration, Instant};

use futures::StreamExt;
use serde::{Deserialize, Serialize};

use crate::app_config::AppType;
use crate::provider::Provider;

/// 单模型连通性测试结果（camelCase 序列化，供 Tauri 命令直接返回前端）。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectivityTestResult {
    /// 被测模型 ID
    pub model_id: String,
    /// `"success"` | `"error"`
    pub status: String,
    /// 首字节耗时（毫秒）；非流式无响应体时回退为总耗时
    pub first_byte_ms: Option<u64>,
    /// 总耗时（毫秒）
    pub total_ms: Option<u64>,
    /// 错误信息（status=error 时提供）
    pub error_message: Option<String>,
    /// 实际请求 URL
    pub request_url: String,
    /// 实际请求 headers（鉴权敏感头已脱敏，不含 API key 等凭据）
    pub request_headers: serde_json::Value,
    /// 实际请求 body
    pub request_body: serde_json::Value,
    /// 响应 headers
    pub response_headers: Option<serde_json::Value>,
    /// 响应体预览（JSON 或原始文本，上限 256 KiB）
    pub response_body: Option<serde_json::Value>,
}

/// 后端连通性测试执行器（reqwest 直连 + SSE 流读取 + 度量 + 判定）。
pub struct ConnectivityTestService;

/// 响应体预览上限（与 ai-toolbox 同款：256 KiB）。
const MAX_RESPONSE_PREVIEW_BYTES: usize = 256 * 1024;

/// 剩余总超时：`total - elapsed`，耗尽返回 `None`。
///
/// 与 ai-toolbox `connectivity_test.rs:289` 语义一致。
pub fn remaining_total_timeout(total: Duration, elapsed: Duration) -> Option<Duration> {
    total
        .checked_sub(elapsed)
        .filter(|remaining| !remaining.is_zero())
}

/// 连通性判定：2xx ∧ 无流错误 ∧ 体非空 ∧ 无错误事件 → `Ok(())`；
/// 否则按优先级给出错误文案（流错误 → HTTP 状态 → 空响应 → 错误事件）。
fn verdict(status: u16, stream_error: Option<String>, body: &[u8]) -> Result<(), String> {
    let status_ok = (200..300).contains(&status);
    let body_has_content = !body.is_empty();
    let body_reports_error = protocol::body_reports_error(body);
    if status_ok && stream_error.is_none() && body_has_content && body_reports_error.is_none() {
        return Ok(());
    }
    Err(stream_error.unwrap_or_else(|| {
        if !status_ok {
            format!("HTTP {status}")
        } else if !body_has_content {
            "空响应".to_string()
        } else if let Some(desc) = body_reports_error {
            format!("错误事件: {desc}")
        } else {
            "未知错误".to_string()
        }
    }))
}

impl ConnectivityTestService {
    /// 并发测试多个模型的连通性。
    ///
    /// 生产默认并行（`futures::future::join_all`，复用 `http_client::get()` 的
    /// 共享连接池）；若并行时 reqwest 连接数/并发出现连接池问题，计划接受的降级
    /// 方案是退化为顺序执行（串行兜底）。
    pub async fn test_models(
        provider: &Provider,
        app_type: &AppType,
        model_ids: &[String],
        params: &ConnectivityTestParams,
    ) -> Vec<ConnectivityTestResult> {
        futures::future::join_all(
            model_ids
                .iter()
                .map(|model_id| run_one(provider, app_type, model_id, params, Instant::now())),
        )
        .await
    }
}

/// 执行单个模型的连通性测试请求。
async fn run_one(
    provider: &Provider,
    app_type: &AppType,
    model_id: &str,
    params: &ConnectivityTestParams,
    started: Instant,
) -> ConnectivityTestResult {
    // 空/纯空白 model_id → error（与 ai-toolbox 一致）
    if model_id.trim().is_empty() {
        return error_result(model_id, "Missing model", &started);
    }

    // 协议选择：仅 claude / codex 支持
    let Some(builder) = protocol::TargetBuilder::for_app(app_type) else {
        return error_result(
            model_id,
            &format!("{} 不支持连通性测试", app_type.as_str()),
            &started,
        );
    };

    // 构造 target（URL + headers + body）；错误不 panic，转 error result
    let target = match builder {
        protocol::TargetBuilder::Claude => {
            protocol::build_claude(provider, model_id, params)
        }
        protocol::TargetBuilder::Codex => {
            protocol::build_codex(provider, model_id, params)
        }
    };
    let target = match target {
        Ok(target) => target,
        Err(e) => {
            return error_result(model_id, &e.to_string(), &started);
        }
    };

    let request_headers = headers_to_value(&target.headers);
    let request_body = serde_json::to_value(&target.body).unwrap_or(serde_json::Value::Null);
    let request_url = target.url.clone();

    let timeout_secs = params.timeout_secs.unwrap_or(30).max(1);
    let total_timeout = Duration::from_secs(timeout_secs);

    // 构造请求：按 target.headers 构建 header map；非法 header 直接作为错误返回，不 panic。
    let mut header_map = reqwest::header::HeaderMap::new();
    for (name, value) in &target.headers {
        let header_name = match reqwest::header::HeaderName::from_bytes(name.as_bytes()) {
            Ok(name) => name,
            Err(_) => {
                return error_result(
                    model_id,
                    &format!("非法请求头名: {name}"),
                    &started,
                )
            }
        };
        let header_value = match reqwest::header::HeaderValue::from_str(value) {
            Ok(value) => value,
            Err(_) => {
                return error_result(
                    model_id,
                    &format!("非法请求头值: {name}"),
                    &started,
                )
            }
        };
        header_map.insert(header_name, header_value);
    }

    let client = crate::proxy::http_client::get();
    let request = client
        .post(&target.url)
        .timeout(total_timeout)
        .headers(header_map)
        .body(target.body.to_string());
    let response = match request.send().await {
        Ok(response) => response,
        Err(e) => {
            return error_result(model_id, &e.to_string(), &started);
        }
    };

    let status = response.status().as_u16();
    let is_streaming = params.stream.unwrap_or(true)
        || response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .map(|ct| ct.contains("text/event-stream"))
            .unwrap_or(false);
    let response_headers = headers_to_value(
        &response
            .headers()
            .iter()
            .map(|(name, value)| (name.to_string(), value.to_str().unwrap_or_default().to_string()))
            .collect::<Vec<(String, String)>>(),
    );

    let mut first_byte_ms: Option<u64> = None;
    let mut stream_error: Option<String> = None;
    let mut preview: Vec<u8> = Vec::new();
    let mut drained: Option<Vec<u8>> = None;

    if is_streaming {
        // 空闲超时 = timeout_secs（同 ai-toolbox idle），外层再套总超时兜底
        let idle_timeout = Duration::from_secs(timeout_secs);
        let mut body_stream = response.bytes_stream();
        match remaining_total_timeout(total_timeout, started.elapsed()) {
            Some(remaining) => {
                match tokio::time::timeout(remaining, async {
                    drain_stream(
                        &mut body_stream,
                        &mut first_byte_ms,
                        &mut preview,
                        &mut stream_error,
                        started,
                        idle_timeout,
                    )
                    .await
                })
                .await
                {
                    Ok(_) => {}
                    Err(_) => {
                        stream_error = Some("stream exceeded the total timeout".to_string());
                    }
                }
            }
            None => {
                stream_error = Some("stream exceeded the total timeout".to_string());
            }
        }
        // 流式成功但从未收到任何块（如非流式空响应）→ 首字节回退为总耗时
        if stream_error.is_none() && first_byte_ms.is_none() {
            first_byte_ms = Some(elapsed_ms(&started));
        }
    } else {
        // 非流式：读取完整 body；reqwest 的请求级 `.timeout()` 只覆盖建连+响应头，
        // 这里再用剩余总超时兜底 body 读取（对齐"timeout_secs 覆盖整流"语义）
        match remaining_total_timeout(total_timeout, started.elapsed()) {
            Some(remaining) => {
                match tokio::time::timeout(remaining, response.bytes()).await {
                    Ok(Ok(bytes)) => {
                        drained = Some(bytes.to_vec());
                        if first_byte_ms.is_none() {
                            first_byte_ms = Some(elapsed_ms(&started));
                        }
                    }
                    Ok(Err(e)) => {
                        stream_error = Some(e.to_string());
                    }
                    Err(_) => {
                        stream_error = Some("response body exceeded the total timeout".to_string());
                    }
                }
            }
            None => {
                stream_error = Some("response body exceeded the total timeout".to_string());
            }
        }
    }

    let total_ms = elapsed_ms(&started);
    let body: Vec<u8> = if is_streaming {
        preview
    } else {
        drained.unwrap_or_default()
    };

    let result = verdict(status, stream_error, &body);
    let status_str = if result.is_ok() { "success" } else { "error" };

    ConnectivityTestResult {
        model_id: model_id.to_string(),
        status: status_str.to_string(),
        first_byte_ms,
        total_ms: Some(total_ms),
        error_message: result.err(),
        request_url,
        request_headers,
        request_body,
        response_headers: Some(response_headers),
        response_body: Some(parse_json_or_raw(&body)),
    }
}

/// 流式 drain：空闲超时逐块读取；首块（非空）记录首字节；预览体上限 256 KiB。
async fn drain_stream<S>(
    body_stream: &mut S,
    first_byte_ms: &mut Option<u64>,
    preview: &mut Vec<u8>,
    stream_error: &mut Option<String>,
    started: Instant,
    idle_timeout: Duration,
) -> Result<(), ()>
where
    S: futures::Stream<Item = Result<bytes::Bytes, reqwest::Error>> + Unpin,
{
    loop {
        let next_chunk = tokio::time::timeout(idle_timeout, body_stream.next())
            .await
            .map_err(|_| {
                *stream_error = Some(format!(
                    "stream was idle for {} seconds",
                    idle_timeout.as_secs()
                ));
            })?;
        let Some(chunk_result) = next_chunk else {
            break;
        };
        let chunk = chunk_result.map_err(|e| {
            *stream_error = Some(e.to_string());
        })?;
        if chunk.is_empty() {
            continue;
        }
        if first_byte_ms.is_none() {
            *first_byte_ms = Some(elapsed_ms(&started));
        }
        let remaining_preview_bytes = MAX_RESPONSE_PREVIEW_BYTES.saturating_sub(preview.len());
        if remaining_preview_bytes > 0 {
            preview.extend_from_slice(&chunk[..chunk.len().min(remaining_preview_bytes)]);
        }
    }
    Ok(())
}

/// 敏感 header 名匹配：大小写不敏感；命中则不进结果（防止 API key 等凭据泄漏）。
fn is_sensitive_header(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    matches!(
        lower.as_str(),
        "authorization" | "proxy-authorization" | "x-api-key" | "cookie" | "set-cookie"
    ) || lower.contains("api_key")
        || lower.contains("apikey")
        || lower.contains("api-key")
}

/// `Vec<(String, String)>` → JSON 对象；敏感 header（鉴权/密钥/cookie）被剔除。
fn headers_to_value(headers: &[(String, String)]) -> serde_json::Value {
    let mut object = serde_json::Map::new();
    for (name, value) in headers {
        if is_sensitive_header(name) {
            continue;
        }
        object.insert(name.clone(), serde_json::Value::String(value.clone()));
    }
    serde_json::Value::Object(object)
}

/// JSON 解析优先，失败回退为原始文本字符串。
fn parse_json_or_raw(body: &[u8]) -> serde_json::Value {
    if body.is_empty() {
        return serde_json::Value::Null;
    }
    serde_json::from_slice::<serde_json::Value>(body)
        .unwrap_or_else(|_| serde_json::Value::String(String::from_utf8_lossy(body).to_string()))
}

/// 从 `started` 起的经过毫秒数（u64 截断）。
fn elapsed_ms(started: &Instant) -> u64 {
    started.elapsed().as_millis().min(u128::from(u64::MAX)) as u64
}

/// 构造错误结果：仅填充 model_id / status / error_message / 度量与空请求元数据。
fn error_result(
    model_id: &str,
    error_message: &str,
    started: &Instant,
) -> ConnectivityTestResult {
    ConnectivityTestResult {
        model_id: model_id.to_string(),
        status: "error".to_string(),
        first_byte_ms: None,
        total_ms: Some(elapsed_ms(started)),
        error_message: Some(error_message.to_string()),
        request_url: String::new(),
        request_headers: serde_json::json!({}),
        request_body: serde_json::json!({}),
        response_headers: None,
        response_body: None,
    }
}

/// 连通性测试请求参数（camelCase 序列化，缺省字段视为默认值）。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ConnectivityTestParams {
    /// 测试用的用户提示词
    pub prompt: Option<String>,
    /// 是否启用流式请求
    pub stream: Option<bool>,
    /// 采样温度
    pub temperature: Option<f64>,
    /// 最大生成 token 数
    pub max_tokens: Option<u64>,
    /// 自定义请求头（浅合并进默认 headers）
    pub custom_headers: Option<serde_json::Map<String, serde_json::Value>>,
    /// 自定义请求体（顶层浅合并进默认 body）
    pub custom_body: Option<serde_json::Map<String, serde_json::Value>>,
    /// 总超时（秒）
    pub timeout_secs: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn params_defaults_are_all_none() {
        let p = ConnectivityTestParams::default();
        assert!(p.prompt.is_none());
        assert!(p.stream.is_none());
        assert!(p.temperature.is_none());
        assert!(p.max_tokens.is_none());
        assert!(p.custom_headers.is_none());
        assert!(p.custom_body.is_none());
        assert!(p.timeout_secs.is_none());
    }

    #[test]
    fn params_round_trips_camel_case() {
        let p = ConnectivityTestParams {
            prompt: Some("hi".to_string()),
            stream: Some(true),
            temperature: Some(0.7),
            max_tokens: Some(256),
            custom_headers: None,
            custom_body: None,
            timeout_secs: Some(15),
        };
        let json = serde_json::to_value(&p).unwrap();
        assert_eq!(json["maxTokens"], serde_json::Value::from(256));
        assert_eq!(json["timeoutSecs"], serde_json::Value::from(15));
        assert!(json.get("custom_headers").is_none());

        let back: ConnectivityTestParams = serde_json::from_value(json).unwrap();
        assert_eq!(back.prompt.as_deref(), Some("hi"));
        assert_eq!(back.stream, Some(true));
        assert_eq!(back.max_tokens, Some(256));
    }

    #[test]
    fn params_deserialize_missing_fields_as_none() {
        let back: ConnectivityTestParams = serde_json::from_value(serde_json::json!({})).unwrap();
        assert_eq!(back, ConnectivityTestParams::default());
    }

    // ---------- Task 2: 执行器判定与剩余超时 ----------

    #[test]
    fn remaining_total_timeout_only_exposes_leftover() {
        assert_eq!(
            remaining_total_timeout(Duration::from_secs(30), Duration::from_secs(12)),
            Some(Duration::from_secs(18))
        );
        assert_eq!(
            remaining_total_timeout(Duration::from_secs(30), Duration::from_secs(30)),
            None
        );
        assert_eq!(
            remaining_total_timeout(Duration::from_secs(30), Duration::from_secs(31)),
            None
        );
    }

    #[test]
    fn verdict_success_requires_2xx_body_content_and_no_error() {
        // 2xx + 体非空 + 无错误事件 → success
        assert!(verdict(200, None, &b"data: {\"a\":1}\n\n"[..]).is_ok());
        // 401 → error
        assert!(verdict(401, None, &b"{\"error\":{}}"[..]).is_err());
        // 200 + 空体 → error
        assert!(verdict(200, None, &b""[..]).is_err());
        // 200 + SSE error event → error
        assert!(verdict(200, None, &b"event: error\ndata: {}\n\n"[..]).is_err());
        // 流式读取错误 → error
        assert!(verdict(200, Some("stream idle".to_string()), &b"x"[..]).is_err());
    }

    #[test]
    fn headers_to_value_redacts_sensitive_headers() {
        // Authorization / x-api-key / Cookie 等鉴权敏感头必须被剔除
        let input: Vec<(String, String)> = vec![
            ("Authorization".into(), "Bearer sk-secret".into()),
            ("x-api-key".into(), "sk-secret".into()),
            ("Cookie".into(), "session=abc".into()),
            ("Proxy-Authorization".into(), "Basic abc".into()),
            ("Set-Cookie".into(), "sid=123".into()),
            ("X-Custom-API-Key".into(), "sk-lookup".into()),
            ("X-Api_Key-Extra".into(), "sk-other".into()),
            ("Content-Type".into(), "application/json".into()),
            ("X-Request-Id".into(), "req-1".into()),
        ];
        let value = headers_to_value(&input);
        let object = value.as_object().unwrap();
        for name in [
            "Authorization",
            "x-api-key",
            "Cookie",
            "Proxy-Authorization",
            "Set-Cookie",
            "X-Custom-API-Key",
            "X-Api_Key-Extra",
        ] {
            assert!(
                object.keys().all(|k| !k.eq_ignore_ascii_case(name)),
                "敏感 header 不应出现在结果中: {name}"
            );
        }
        assert_eq!(object.get("Content-Type").unwrap(), "application/json");
        assert_eq!(object.get("X-Request-Id").unwrap(), "req-1");
    }

    #[test]
    fn request_headers_do_not_include_api_key() {
        // 以真实协议构造的 claude target 为例：Authorization/x-api-key 必须被脱敏
        let provider = crate::provider::Provider::with_id(
            "p".to_string(),
            "P".to_string(),
            serde_json::json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://api.anthropic.com/v1",
                    "ANTHROPIC_AUTH_TOKEN": "sk-ant-secret-token"
                }
            }),
            None,
        );
        let params = ConnectivityTestParams::default();
        let target =
            protocol::build_claude(&provider, "claude-sonnet-5", &params).unwrap();
        let request_headers = headers_to_value(&target.headers);
        let json = serde_json::to_value(&request_headers).unwrap();
        assert!(json.get("Authorization").is_none());
        assert!(json.get("x-api-key").is_none());
        assert!(json.get("authorization").is_none());
        // 非敏感头（content-type / accept）仍保留（protocol 以原始大小写写入）
        assert_eq!(json["Content-Type"], "application/json");
        assert_eq!(json["Accept"], "text/event-stream");
    }

    #[test]
    fn connectivity_test_result_serializes_camel_case() {
        let result = ConnectivityTestResult {
            model_id: "model-1".to_string(),
            status: "success".to_string(),
            first_byte_ms: Some(12),
            total_ms: Some(512),
            error_message: None,
            request_url: "https://api.example.com/v1/messages".to_string(),
            request_headers: serde_json::json!({ "x-api-key": "sk-test" }),
            request_body: serde_json::json!({ "model": "model-1" }),
            response_headers: Some(serde_json::json!({ "content-type": "text/event-stream" })),
            response_body: Some(serde_json::json!({ "id": "msg_1" })),
        };
        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["firstByteMs"], serde_json::Value::from(12));
        assert_eq!(json["totalMs"], serde_json::Value::from(512));
        assert_eq!(json["errorMessage"], serde_json::Value::Null);
        assert_eq!(json["requestUrl"], "https://api.example.com/v1/messages");
        assert!(json.get("first_byte_ms").is_none());

        let back: ConnectivityTestResult = serde_json::from_value(json).unwrap();
        assert_eq!(back.model_id, "model-1");
        assert_eq!(back.first_byte_ms, Some(12));
        assert_eq!(back.total_ms, Some(512));
        assert_eq!(back.status, "success");
    }
}
