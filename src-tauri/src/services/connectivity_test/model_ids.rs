use serde_json::Value;

use crate::app_config::AppType;

/// 提取供应商可测试的上游模型 ID 清单。
///
/// 与 proxy 的 modelCatalog 口径一致（`model_capabilities.rs:model_entry_matches`）：
/// - `settings.modelCatalog.models` 数组：每条取 `model` / `id` / `name` 字段的非空串；
/// - 数组可退化为对象（key=模型 id）时取键；
/// - 无 modelCatalog 时回退：claude → `env.ANTHROPIC_MODEL`；codex → `config.model`（顶部）。
pub fn model_ids_from_settings(app_type: &AppType, settings: &Value) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let catalog = settings.get("modelCatalog");
    if let Some(models) = catalog.and_then(|c| c.get("models")) {
        collect_model_ids(models, &mut out);
    }
    if out.is_empty() {
        match app_type {
            AppType::Claude => {
                if let Some(m) = settings
                    .pointer("/env/ANTHROPIC_MODEL")
                    .and_then(Value::as_str)
                {
                    let t = m.trim();
                    if !t.is_empty() {
                        out.push(t.to_string());
                    }
                }
            }
            AppType::Codex => {
                if let Some(m) = settings
                    .get("config")
                    .and_then(Value::as_str)
                    .and_then(parse_codex_top_model)
                {
                    out.push(m);
                }
            }
            _ => {}
        }
    }
    dedup_keep_order(&mut out);
    out
}

fn collect_model_ids(models: &Value, out: &mut Vec<String>) {
    match models {
        Value::Array(arr) => {
            for entry in arr {
                if let Some(id) = entry_model_id(entry) {
                    out.push(id);
                }
            }
        }
        Value::Object(map) => {
            for key in map.keys() {
                if !key.trim().is_empty() {
                    out.push(key.clone());
                }
            }
        }
        _ => {}
    }
}

/// 单条 catalog 条目的模型 id：优先 `model`，再 `id`/`name`（与 proxy 一致）。
fn entry_model_id(entry: &Value) -> Option<String> {
    for field in ["model", "id", "name"] {
        if let Some(v) = entry.get(field).and_then(Value::as_str) {
            let t = v.trim();
            if !t.is_empty() {
                return Some(t.to_string());
            }
        }
    }
    None
}

/// codex `config.toml` 顶部 model（对齐 proxy 从 TOML 解析），仅顶层 `model = "..."`
fn parse_codex_top_model(config_text: &str) -> Option<String> {
    let doc = config_text.parse::<toml::Value>().ok()?;
    let json: serde_json::Value = serde_json::to_value(doc).ok()?;
    json.get("model")
        .and_then(Value::as_str)
        .map(|s| s.trim().to_string())
}

fn dedup_keep_order(v: &mut Vec<String>) {
    let mut seen = std::collections::HashSet::new();
    v.retain(|x| seen.insert(x.clone()));
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // claude：modelCatalog.models 各条目 id（model/id/name 字段均可），回退 ANTHROPIC_MODEL
    #[test]
    fn claude_uses_model_catalog_then_env_model() {
        let s = json!({ "modelCatalog": { "models": [
            {"model": "claude-sonnet-5"}, {"id": "claude-opus-5"}, {"name": "third"}
        ] } });
        assert_eq!(
            model_ids_from_settings(&AppType::Claude, &s),
            vec!["claude-sonnet-5", "claude-opus-5", "third"]
        );
        // 无 modelCatalog → 回退 ANTHROPIC_MODEL
        let s2 = json!({ "env": { "ANTHROPIC_MODEL": "kimi-k2.7-code" } });
        assert_eq!(
            model_ids_from_settings(&AppType::Claude, &s2),
            vec!["kimi-k2.7-code"]
        );
        // 都空 → 空 list
        assert!(model_ids_from_settings(&AppType::Claude, &json!({})).is_empty());
    }

    // codex：modelCatalog.models[].model；回退 config.toml 顶部 model（经 provider adapter 口径）；
    // 终结：settings.config 走与 proxy 相同的 model_providers 解析。此处仅验证 modelCatalog 与应用名。
    #[test]
    fn codex_uses_model_catalog_model_fields() {
        let s = json!({ "modelCatalog": { "models": [
            {"model": "gpt-5.5", "displayName": "x"}, {"model": "gpt-4.1"}
        ] } });
        assert_eq!(
            model_ids_from_settings(&AppType::Codex, &s),
            vec!["gpt-5.5", "gpt-4.1"]
        );
    }

    // 补充：catalog 退化为对象（key=模型 id）、去重、codex 顶部 model 回退、空串跳过
    #[test]
    fn claude_catalog_object_keys_are_used() {
        let s = json!({ "modelCatalog": { "models": {
            "claude-sonnet-5": { "displayName": "x" },
            "": { "displayName": "skip" }
        } } });
        assert_eq!(
            model_ids_from_settings(&AppType::Claude, &s),
            vec!["claude-sonnet-5"]
        );
    }

    #[test]
    fn codex_falls_back_to_top_level_config_model() {
        let s = json!({ "config": "model = \"gpt-5.5\"\nmodel_provider = \"custom\"\n" });
        assert_eq!(
            model_ids_from_settings(&AppType::Codex, &s),
            vec!["gpt-5.5"]
        );
        // 无 modelCatalog 且 config 非 TOML/无 model → 空
        assert!(model_ids_from_settings(&AppType::Codex, &json!({})).is_empty());
    }

    #[test]
    fn dedup_preserves_first_occurrence() {
        let s = json!({ "modelCatalog": { "models": [
            {"model": "gpt-5.5"}, {"model": "gpt-5.5"}, {"model": "gpt-4.1"}
        ] } });
        assert_eq!(
            model_ids_from_settings(&AppType::Codex, &s),
            vec!["gpt-5.5", "gpt-4.1"]
        );
    }

    #[test]
    fn non_supported_app_types_yield_empty() {
        assert!(model_ids_from_settings(&AppType::Gemini, &json!({})).is_empty());
        assert!(model_ids_from_settings(&AppType::Pi, &json!({})).is_empty());
    }

    #[test]
    fn blank_catalog_entries_are_skipped() {
        let s = json!({ "modelCatalog": { "models": [
            {"model": "  "}, {"name": "  "}, {"model": "gpt-5.5"}
        ] } });
        assert_eq!(
            model_ids_from_settings(&AppType::Codex, &s),
            vec!["gpt-5.5"]
        );
    }
}
