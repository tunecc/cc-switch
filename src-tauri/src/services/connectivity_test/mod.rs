//! 后端连通性测试服务核心。
//!
//! 按模型真实请求探测供应商连通性（claude → `/v1/messages`，codex → `/v1/responses`）。
//! 本模块只负责类型定义、模型清单解析与协议/请求构造；实际发送请求由后续任务实现。
#![allow(dead_code)] // 供后续任务的执行器消费，Task 1 阶段尚未被外部调用

pub mod model_ids;
pub mod protocol;

use serde::{Deserialize, Serialize};

/// 连通性测试请求参数（camelCase 序列化，缺省字段视为默认值）。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
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

impl Default for ConnectivityTestParams {
    fn default() -> Self {
        Self {
            prompt: None,
            stream: None,
            temperature: None,
            max_tokens: None,
            custom_headers: None,
            custom_body: None,
            timeout_secs: None,
        }
    }
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
}
