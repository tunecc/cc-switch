//! 逐模型连通性测试 Tauri 命令层（多模型测试 + 单模型探针）。
//!
//! 命令层只做三件事：官方/动态端点供应商过滤（`is_probe_capable`）、按
//! `app_type` 查找供应商、从 settings 解析模型清单，然后调用
//! `services::connectivity_test::ConnectivityTestService::test_models`。
//! 不记录请求日志，也不触碰 `proxy` / `failover` / `failover_queue`
//! 任何状态（连通性探测与网关/熔断互不干扰）。

use crate::app_config::AppType;
use crate::error::AppError;
use crate::provider::Provider;
use crate::services::connectivity_test::model_ids::model_ids_from_settings;
use crate::services::connectivity_test::{
    ConnectivityTestParams, ConnectivityTestResult, ConnectivityTestService,
};
use crate::store::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// 多模型连通性测试响应（前端读取 `response.results`）。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectivityTestResponse {
    pub results: Vec<ConnectivityTestResult>,
}

/// 供应商是否可做连通性测试（探针）。
///
/// 过滤规则（纯函数，仅依据 provider 自身属性，与 app_type 无关；保留
/// `app_type` 参数以保持命令层 API 对称、便于后续按应用扩展）：
/// - 官方供应商（`category == "official"`）：官方 OAuth 端点无用户配置的探测
///   目标，不允许把运行时适配器默认值变成对第一方端点的未鉴权探测 → 不可测。
/// - 动态端点供应商（`meta.provider_type` ∈ codex_oauth / xai_oauth /
///   github_copilot）：端点随 OAuth token 动态解析 → 不可测。
/// - 其余（普通第三方）→ 可测。
///
/// 注意：刻意直接读 `meta.provider_type`，而非 `is_github_copilot()` 等助手——
/// 那些助手还会匹配 base_url 含 `githubcopilot.com` 的供应商，超出本过滤规格。
fn is_probe_capable(provider: &Provider, _app_type: &AppType) -> bool {
    if provider.category.as_deref() == Some("official") {
        return false;
    }
    !matches!(
        provider
            .meta
            .as_ref()
            .and_then(|meta| meta.provider_type.as_deref()),
        Some("codex_oauth") | Some("xai_oauth") | Some("github_copilot")
    )
}

/// 按 `app_type` + `provider_id` 查找供应商。
fn lookup_provider(
    state: &State<'_, AppState>,
    app_type: &AppType,
    provider_id: &str,
) -> Result<Provider, AppError> {
    let providers = state.db.get_all_providers(app_type.as_str())?;
    providers
        .get(provider_id)
        .cloned()
        .ok_or_else(|| AppError::Message(format!("供应商 {provider_id} 不存在")))
}

/// 按请求解析实际测试的模型集合。
///
/// `requested` 显式传入（trim 后非空）时直接采用——勾选即测试范围，集合
/// 可包含静态清单之外的模型（弹窗内从上游 /v1/models 拉取的会话级模型）；
/// 缺省或全部为空白时回退到供应商静态模型清单（与旧版行为兼容）。
fn resolve_test_model_ids(
    requested: Option<Vec<String>>,
    app_type: &AppType,
    settings: &serde_json::Value,
) -> Vec<String> {
    match requested {
        Some(ids) => {
            let trimmed: Vec<String> = ids
                .into_iter()
                .map(|id| id.trim().to_string())
                .filter(|id| !id.is_empty())
                .collect();
            if trimmed.is_empty() {
                model_ids_from_settings(app_type, settings)
            } else {
                trimmed
            }
        }
        None => model_ids_from_settings(app_type, settings),
    }
}

/// 多模型连通性测试（测试弹窗用）。
///
/// 逐模型真实请求探测供应商连通性，返回全部被测模型的结果列表；
/// 不记录请求日志，不影响网关/熔断状态。
#[tauri::command]
pub async fn connectivity_test_provider_models(
    state: State<'_, AppState>,
    app_type: AppType,
    provider_id: String,
    params: Option<ConnectivityTestParams>,
    model_ids: Option<Vec<String>>,
) -> Result<ConnectivityTestResponse, AppError> {
    let provider = lookup_provider(&state, &app_type, &provider_id)?;
    if !is_probe_capable(&provider, &app_type) {
        return Err(AppError::Message(format!(
            "供应商 {} 不支持连通性测试",
            provider.name
        )));
    }

    let model_ids = resolve_test_model_ids(model_ids, &app_type, &provider.settings_config);
    if model_ids.is_empty() {
        return Err(AppError::Message("供应商没有可测试的模型".to_string()));
    }

    let params = params.unwrap_or_default();
    let results =
        ConnectivityTestService::test_models(&provider, &app_type, &model_ids, &params).await;
    Ok(ConnectivityTestResponse { results })
}

/// 单模型连通性探测（供应商列表批量徽标用）。
///
/// 对指定 `model_id` 发一次真实请求并返回单条结果；`timeout_secs` 缺省时由
/// 服务层默认 30 秒。不记录请求日志，不触碰网关/熔断状态。
#[tauri::command]
pub async fn connectivity_probe_provider(
    state: State<'_, AppState>,
    app_type: AppType,
    provider_id: String,
    model_id: String,
    timeout_secs: Option<u64>,
) -> Result<ConnectivityTestResult, AppError> {
    let provider = lookup_provider(&state, &app_type, &provider_id)?;
    if !is_probe_capable(&provider, &app_type) {
        return Err(AppError::Message(format!(
            "供应商 {} 不支持连通性测试",
            provider.name
        )));
    }

    let params = ConnectivityTestParams {
        timeout_secs,
        ..Default::default()
    };
    let mut results =
        ConnectivityTestService::test_models(&provider, &app_type, &[model_id], &params).await;
    results
        .pop()
        .ok_or_else(|| AppError::Message("探测未返回结果".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_config::AppType;
    use crate::provider::{Provider, ProviderMeta};
    use serde_json::json;

    #[test]
    fn testable_provider_rejects_official_and_dynamic_endpoints() {
        // official → 不可测（官方 OAuth 端点无用户配置的探测目标）
        let official = provider_with(category("official"));
        assert!(!is_probe_capable(&official, &AppType::Codex));
        // codex_oauth → 不可测（动态端点）
        let oauth = provider_with(meta_type("codex_oauth"));
        assert!(!is_probe_capable(&oauth, &AppType::Codex));
        // xai_oauth → 不可测（动态端点）
        let xai = provider_with(meta_type("xai_oauth"));
        assert!(!is_probe_capable(&xai, &AppType::GrokBuild));
        // github_copilot → 不可测
        let cop = provider_with(meta_type("github_copilot"));
        assert!(!is_probe_capable(&cop, &AppType::Claude));
        // 普通第三方 claude/codex → 可测
        let ok = provider_with(settings(json!({
            "env": { "ANTHROPIC_BASE_URL": "https://relay.example/v1", "ANTHROPIC_AUTH_TOKEN": "k" },
            "modelCatalog": { "models": [ { "model": "claude-sonnet-5" } ] }
        })));
        assert!(is_probe_capable(&ok, &AppType::Claude));
    }

    #[test]
    fn probe_capability_ignores_base_url_shape_and_unknown_types() {
        // base_url 含 githubcopilot.com 但 meta.provider_type 为空 → 仍可测
        // （过滤严格基于 meta.provider_type，与 is_github_copilot() 助手不同）
        let url_shaped = provider_with(settings(json!({
            "env": { "ANTHROPIC_BASE_URL": "https://api.githubcopilot.com" }
        })));
        assert!(is_probe_capable(&url_shaped, &AppType::Claude));

        // 未知 provider_type（如 custom relay 元数据）→ 可测
        let unknown = provider_with(meta_type("custom"));
        assert!(is_probe_capable(&unknown, &AppType::Claude));

        // 无 meta 无 category → 可测
        let plain = provider_with(settings(json!({})));
        assert!(is_probe_capable(&plain, &AppType::Claude));
    }

    #[test]
    fn resolve_test_model_ids_uses_requested_set_verbatim() {
        // 显式传入（含静态清单之外的会话级模型）→ 原样采用（勾选即测试范围）
        let settings = json!({
            "modelCatalog": { "models": [ { "model": "a" } ] }
        });
        let resolved = resolve_test_model_ids(
            Some(vec!["a".into(), "remote-only".into()]),
            &AppType::Claude,
            &settings,
        );
        assert_eq!(resolved, vec!["a".to_string(), "remote-only".to_string()]);
    }

    #[test]
    fn resolve_test_model_ids_trims_and_drops_blank_entries() {
        let resolved = resolve_test_model_ids(
            Some(vec!["  a  ".into(), "   ".into(), "".into(), "b".into()]),
            &AppType::Claude,
            &json!({}),
        );
        assert_eq!(resolved, vec!["a".to_string(), "b".to_string()]);
    }

    #[test]
    fn resolve_test_model_ids_falls_back_to_settings_when_absent_or_blank() {
        let settings = json!({
            "modelCatalog": { "models": [ { "model": "a" }, { "model": "b" } ] }
        });
        // None → 静态清单
        assert_eq!(
            resolve_test_model_ids(None, &AppType::Claude, &settings),
            vec!["a".to_string(), "b".to_string()]
        );
        // Some(空) / Some(全空白) → 同样回退静态清单（兼容旧调用方）
        assert_eq!(
            resolve_test_model_ids(Some(vec![]), &AppType::Claude, &settings),
            vec!["a".to_string(), "b".to_string()]
        );
        assert_eq!(
            resolve_test_model_ids(Some(vec!["  ".into()]), &AppType::Claude, &settings),
            vec!["a".to_string(), "b".to_string()]
        );
    }

    #[test]
    fn connectivity_test_response_serializes_results_camel_case() {
        let response = ConnectivityTestResponse {
            results: vec![ConnectivityTestResult {
                model_id: "claude-sonnet-5".to_string(),
                status: "success".to_string(),
                first_byte_ms: Some(120),
                total_ms: Some(480),
                error_message: None,
                request_url: "https://relay.example/v1/messages".to_string(),
                request_headers: json!({}),
                request_body: json!({ "model": "claude-sonnet-5" }),
                response_headers: Some(json!({})),
                response_body: Some(json!({})),
            }],
        };
        let value = serde_json::to_value(&response).unwrap();
        assert!(value.get("results").is_some());
        assert_eq!(value["results"][0]["modelId"], json!("claude-sonnet-5"));
        assert_eq!(value["results"][0]["firstByteMs"], json!(120));
    }

    // ---------- 测试辅助 ----------

    /// 供应商属性覆盖（category / meta.provider_type / settings）。
    #[derive(Default)]
    struct ProviderOverrides {
        category: Option<String>,
        meta_type: Option<String>,
        settings: Option<serde_json::Value>,
    }

    fn category(value: &str) -> ProviderOverrides {
        ProviderOverrides {
            category: Some(value.to_string()),
            ..Default::default()
        }
    }

    fn meta_type(value: &str) -> ProviderOverrides {
        ProviderOverrides {
            meta_type: Some(value.to_string()),
            ..Default::default()
        }
    }

    fn settings(value: serde_json::Value) -> ProviderOverrides {
        ProviderOverrides {
            settings: Some(value),
            ..Default::default()
        }
    }

    fn provider_with(overrides: ProviderOverrides) -> Provider {
        let mut provider = Provider::with_id(
            "test-provider".to_string(),
            "Test Provider".to_string(),
            overrides.settings.unwrap_or_else(|| json!({})),
            None,
        );
        provider.category = overrides.category;
        if let Some(provider_type) = overrides.meta_type {
            provider.meta = Some(ProviderMeta {
                provider_type: Some(provider_type),
                ..Default::default()
            });
        }
        provider
    }
}
