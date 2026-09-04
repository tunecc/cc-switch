---
change: per-model-connectivity-test
design-doc: docs/superpowers/specs/2026-09-02-per-model-connectivity-test-design.md
base-ref: 76f8072df81510255c330c77d4dffbf84fbc0188
---

# 按模型真实请求连通性测试——实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实施。步骤用复选框（`- [ ]`）。

**Goal:** 学习 ai-toolbox 的按模型真实请求连通性测试，在 cc-switch 新增后端直连测试服务 + 前端测试弹窗/批量探针徽标，并完全移除旧的 `base_url` 可达性探测。

**Architecture:** 后端新增独立 `services/connectivity_test`（reqwest 直连供应商端点、SSE 流读取、首字节/总耗时、错误识别），暴露 2 个 Tauri 命令（多模型测试 + 单模型探针），参数存入供应商 `settings_config.connectivityTest`（复用 `update_provider` 写回，不新增 DB 表）。前端新增 shadcn/ui 测试弹窗、批量探针徽标；完全移除 `stream_check` 全链路。

**Tech Stack:** Rust（reqwest / tokio / serde / futures）、Tauri v2、TypeScript / React / react-i18next、Vite / vitest、shadcn/ui + Tailwind。参照实现：ai-toolbox `connectivity_test.rs` + `ProviderConnectivityTestModal.tsx`。

## 全局约束
- 首期仅覆盖 `claude` 与 `codex` 两种 AppId；其余应用不显示测试入口。
- 测试命令**绝不**写入代理网关 / 故障转移熔断器状态；不做官方供应商（`category == "official"`）测试；不测动态端点供应商（Copilot / codex OAuth / xAI OAuth）。
- 测试参数持久化字段名 `connectivityTest`；缺省字段视为默认值（向后兼容）。
- 前端展示用 shadcn/ui（非 ai-toolbox 的 antd）；i18n 四语言同步（zh / en / ja / zh-TW）。
- 破坏性变更后置：新增功能与旧 `stream_check` 先共存，全部功能验证后单提交移除旧链路。
- 后端用直连（不经本地代理网关），与旧可达性探测口径一致。

---

## 文件结构

**新增（后端）**
- `src-tauri/src/services/connectivity_test/mod.rs` — 连通性测试服务：类型、模型解析、目标/请求构造、SSE 执行、错误识别、度量
- `src-tauri/src/services/connectivity_test/model_ids.rs` — 从 `settings_config` 提取上游模型 ID 清单（claude/codex 各自口径 + 回退）
- `src-tauri/src/services/connectivity_test/protocol.rs` — claude `/v1/messages` 与 codex `/responses` 请求体/鉴权/URL 构造、错误识别（`body_reports_error`）
- `src-tauri/src/commands/connectivity_test.rs` — Tauri 命令 `connectivity_test_provider_models` + `connectivity_probe_provider`

**新增（前端）**
- `src/lib/api/connectivity-test.ts` — 请求/响应类型 + invoke 绑定
- `src/hooks/useConnectivityTest.ts` — 弹窗测试执行状态（逐模型 running/success/error）
- `src/hooks/useConnectivityProbe.ts` — 批量探针状态（并发度 5，逐供应商更新）
- `src/components/providers/ConnectivityTestDialog.tsx` — 连通性测试弹窗（shadcn/ui）
- `src/components/providers/ConnectivityDetailDialog.tsx` — 单模型请求详情子弹窗
- `src/components/providers/ConnectivityBadge.tsx` — 卡片结果徽标（成功/失败 + 耗时）
- `src/lib/connectivityTestSettings.ts` — 参数持久化读写 + 默认值（纯函数，可单测）
- `tests/` 下对应单测

**修改（后端）**
- `src-tauri/src/services/mod.rs` — 注册 `pub mod connectivity_test;`
- `src-tauri/src/commands/mod.rs` — `mod connectivity_test;` + `pub use`
- `src-tauri/src/lib.rs` — 注册 2 个新命令（保留旧命令到任务 8）
- `src-tauri/src/services/provider/live.rs` — `sanitize_claude_settings_for_live` 增加移除 `connectivityTest`

**删除（后端，任务 8）**
- `src-tauri/src/commands/stream_check.rs`、`src-tauri/src/services/stream_check.rs`、`src-tauri/src/database/dao/stream_check.rs`（保留表结构）
- `services/mod.rs`、`commands/mod.rs`、`lib.rs` 中 stream_check 相关项；`backup.rs:449`、`database/mod.rs:152` 的 `cleanup_old_stream_check_logs` 调用

**删除（前端，任务 8）**
- `src/hooks/useStreamCheck.ts`、`src/lib/api/connectivity-check.ts`、`src/components/usage/ConnectivityCheckConfigPanel.tsx`
- `SettingsPage.tsx` 中面板引用；`ProviderList.tsx`/`ProviderCard.tsx` 旧检测按钮逻辑（Task 7 改新入口）

---

### Task 1: 后端连通性测试服务核心（类型 + 模型解析 + 协议/请求构造）
- [x] Task 1: 后端连通性测试服务核心（类型 + 模型解析 + 协议/请求构造）

一个后端服务模块，先搭好类型与纯函数（模型清单解析、claude/codex 请求体与鉴权、URL 构造、错误识别），全部 TDD。

**Files:**
- Create: `src-tauri/src/services/connectivity_test/mod.rs`
- Create: `src-tauri/src/services/connectivity_test/model_ids.rs`
- Create: `src-tauri/src/services/connectivity_test/protocol.rs`
- Test: 各文件内 `#[cfg(test)]`（沿用 repo 惯例）

**Interfaces:**
- Produces（后续任务依赖）:
  - `model_ids::model_ids_from_settings(app_type: &AppType, settings: &Value) -> Vec<String>` — 提取上游模型 ID
  - `protocol::ClaudeTarget` / `protocol::CodexTarget`（构造好的 URL + headers map + body）
  - `protocol::body_reports_error(&[u8]) -> Option<String>` — 从响应体识别错误（JSON `{"error":{...}}`、SSE `event: error`、`response.failed`、空体）；`Some(desc)` 表示体含错误/为空
  - `connectivity_test::ConnectivityTestParams`（`{prompt, stream, temperature, maxTokens, customHeaders, customBody, timeoutSecs}`，camelCase）

#### Step 1: 写失败测试（类型 + 模型解析）

在 `src-tauri/src/services/connectivity_test/model_ids.rs` 写测试，定义待实现的 `model_ids_from_settings` 行为：

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_config::AppType;
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
        assert_eq!(model_ids_from_settings(&AppType::Claude, &s2), vec!["kimi-k2.7-code"]);
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
}
```

在 `src-tauri/src/services/connectivity_test/mod.rs` 顶部定义即将暴露的请求参数类型（供协议构造使用）：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ConnectivityTestParams {
    pub prompt: Option<String>,
    pub stream: Option<bool>,
    pub temperature: Option<f64>,
    pub max_tokens: Option<u64>,
    pub custom_headers: Option<serde_json::Map<String, serde_json::Value>>,
    pub custom_body: Option<serde_json::Map<String, serde_json::Value>>,
    pub timeout_secs: Option<u64>,
}
impl Default for ConnectivityTestParams {
    fn default() -> Self {
        Self {
            prompt: None, stream: None, temperature: None, max_tokens: None,
            custom_headers: None, custom_body: None, timeout_secs: None,
        }
    }
}
```

#### Step 2: 运行测试确认失败

Run: `cargo test -p cc_switch_lib --lib services::connectivity_test`
Expected: FAIL（模块 / `pub mod` 尚未注册、模型解析未实现）。

#### Step 3: 注册模块并实现模型解析

在 `src-tauri/src/services/mod.rs` 增加：
```rust
pub mod connectivity_test;
```
实现 `model_ids.rs`：

```rust
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
                if let Some(m) = settings.pointer("/env/ANTHROPIC_MODEL").and_then(Value::as_str) {
                    let t = m.trim();
                    if !t.is_empty() { out.push(t.to_string()); }
                }
            }
            AppType::Codex => {
                if let Some(m) = settings.get("config").and_then(Value::as_str)
                    .and_then(|c| parse_codex_top_model(c)) {
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
                if let Some(id) = entry_model_id(entry) { out.push(id); }
            }
        }
        Value::Object(map) => {
            for key in map.keys() { if !key.trim().is_empty() { out.push(key.clone()); } }
        }
        _ => {}
    }
}

/// 单条 catalog 条目的模型 id：优先 `model`，再 `id`/`name`（与 proxy 一致）。
fn entry_model_id(entry: &Value) -> Option<String> {
    for field in ["model", "id", "name"] {
        if let Some(v) = entry.get(field).and_then(Value::as_str) {
            let t = v.trim();
            if !t.is_empty() { return Some(t.to_string()); }
        }
    }
    None
}

/// codex `config.toml` 顶部 model（对齐 proxy 从 TOML 解析），仅顶层 `model = "..."`
fn parse_codex_top_model(config_text: &str) -> Option<String> {
    let doc = config_text.parse::<toml::Value>().ok()?;
    doc.get("model").and_then(Value::as_str).map(|s| s.trim().to_string())
}

fn dedup_keep_order(v: &mut Vec<String>) {
    let mut seen = std::collections::HashSet::new();
    v.retain(|x| seen.insert(x.clone()));
}
```

#### Step 4: 运行模型解析测试通过

Run: `cargo test -p cc_switch_lib --lib services::connectivity_test`
Expected: PASS。

#### Step 5: 实现协议构造（claude / codex 请求体 + 鉴权 + URL + 错误识别）

在 `protocol.rs` 定义目标结构与构造：

```rust
use serde_json::{json, Map, Value};
use std::collections::HashMap;
use crate::error::AppError;

#[derive(Debug, Clone)]
pub struct HttpTarget {
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Value,
}
pub enum TargetBuilder { Claude, Codex }
impl TargetBuilder {
    pub fn for_app(app: &crate::app_config::AppType) -> Option<Self> {
        match app { AppType::Claude => Some(Self::Claude), AppType::Codex => Some(Self::Codex), _ => None }
    }
}
```

实现 claude 构造（`build_claude`）、codex 构造（`build_codex`）、错误识别 `body_reports_error`，并配与 ai-toolbox 测试对齐的单测。要点：

- **claude URL**：`ClaudeAdapter` 的 `build_url(base, "/v1/messages")` 会自动去 `/v1/v1`；base 经 `ClaudeAdapter::extract_base_url`。
- **claude 鉴权**：`env.ANTHROPIC_AUTH_TOKEN` → `Authorization: Bearer <token>`；否则 `env.ANTHROPIC_API_KEY` → `x-api-key: <key>`；两者皆无返回 `AppError`（本地化文案）。
- **claude 请求体**：`{model, max_tokens: params.max_tokens.unwrap_or(1024), messages:[{role:"user",content:[{type:"text",text:prompt}]}], stream}`；自定义 body 顶层浅合并覆盖 max_tokens 等。
- **codex URL**：base 经 `codex_config::extract_codex_base_url`；endpoint `/responses`（`CodexAdapter::build_url(base,"/responses")`）。
- **codex 鉴权**：`env.OPENAI_API_KEY` → 或 `auth.OPENAI_API_KEY`（`codex_config::extract_codex_auth_api_key`）；Bearer。
- **codex 请求体**：`{model, input:[{type:"message",role:"user",content:[{type:"input_text",text:prompt}]}], stream, store:false}`。
- **自定义**：`custom_headers` 合并进默认 headers；`custom_body` 顶层浅合并进默认 body。
- **错误识别**（返回 `Option<String>` 错误描述）：JSON `{"error":{...}}`、SSE `event: error`、`event: response.failed`、`{"type":"error"}`、空响应体。复用 ai-toolbox 的测试用例集合。

（完整构造代码在实现时按上述要点落到文件，行数约 260 行；单测覆盖 URL 去 `/v1/v1`、鉴权字段二选一、body 浅合并、错误识别各分支。）

#### Step 6: 运行协议单测通过

Run: `cargo test -p cc_switch_lib --lib services::connectivity_test`
Expected: PASS。

#### Step 7: 提交

```bash
git add src-tauri/src/services/connectivity_test src-tauri/src/services/mod.rs
git commit -m "feat(connectivity-test): 新增后端连通性测试服务类型/模型解析/协议构造"
```

---

### Task 2: 后端连通性测试执行器（reqwest 直连 + SSE 流读取 + 度量 + 结果）
- [x] Task 2: 后端连通性测试执行器（reqwest 直连 + SSE 流读取 + 度量 + 结果）

在服务模块内实现执行器，复用 ai-toolbox 的「总超时 + 空闲超时」双保险与成功判定（2xx ∧ 无流错误 ∧ 体非空 ∧ 无错误事件）。

**Files:**
- Modify: `src-tauri/src/services/connectivity_test/mod.rs`（追加执行器）
- Modify: `src-tauri/src/services/connectivity_test/protocol.rs`（暴露 `body_reports_error` 供执行器用）
- Test: `mod.rs` 内 `#[cfg(test)]`

**Interfaces:**
- Produces:
  - `connectivity_test::ConnectivityTestResult`（camelCase）：`model_id`, `status`(success|error), `first_byte_ms`, `total_ms`, `error_message`, `request_url`, `request_headers`(Value), `request_body`(Value), `response_headers`(Option<Value>), `response_body`(Option<Value>)
  - `connectivity_test::ConnectivityTestService::test_models(provider: &Provider, app_type: &AppType, model_ids: &[String], params: &ConnectivityTestParams) -> Vec<ConnectivityTestResult>` — 并行/串行执行，串行兜底；**不写**网关/熔断状态
  - 复用的 `remaining_total_timeout(total: Duration, elapsed: Duration) -> Option<Duration>`（ai-toolbox 同款）

#### Step 1: 写失败测试（结果判定与超时逻辑）

在 `mod.rs` 追加测试，覆盖判定函数与剩余超时：

```rust
#[cfg(test)]
mod tests {
    use super::*;

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
}
```

#### Step 2: 运行测试确认失败

Run: `cargo test -p cc_switch_lib --lib services::connectivity_test`
Expected: FAIL（`remaining_total_timeout` / `verdict` 未实现）。

#### Step 3: 实现执行器

在 `mod.rs` 追加（完整代码，约 220 行）：

- `pub struct ConnectivityTestService;`
- `pub fn remaining_total_timeout(total: Duration, elapsed: Duration) -> Option<Duration>` — 与 ai-toolbox `connectivity_test.rs:289` 同款：`total.checked_sub(elapsed).filter(|r| !r.is_zero())`
- `fn verdict(status: u16, stream_error: Option<String>, body: &[u8]) -> Result<(), String>` — 判定：`(200..300).contains(&status) && stream_error.is_none() && !body.is_empty() && protocol::body_reports_error(body).is_none()`；否则按优先级给错误文案（stream error / `HTTP {status}` / 空响应 / 错误事件）
- `async fn run_one(provider, app_type, model_id, params, started) -> ConnectivityTestResult`：
  - 空 model_id → error（"Missing model"，与 ai-toolbox 一致）
  - 构造 target（`TargetBuilder`），发 `POST`（`crate::proxy::http_client::get()`，`.timeout(total_timeout)`）
  - 建连 + 收响应头计时 → 记 `first_byte_ms`（非流式无 body 时回退 total）
  - 流式（`params.stream` 默认 true，或响应 `content-type: text/event-stream`）：用 `bytes_stream()` + `futures_util::StreamExt`，**空闲超时** = timeout_secs（同 ai-toolbox idle），外层 `tokio::time::timeout(remaining_total_timeout(...))` 兜底总超时
  - 累积预览 body（上限 256 KiB，ai-toolbox 同款）
  - 填充 `request_url/request_headers/request_body/response_headers/response_body`
- `pub async fn test_models(...) -> Vec<ConnectivityTestResult>` — 先用 `futures::future::join_all` 并行跑每个 model；若并行中遇 reqwest 连接数/并发问题，可降级为顺序（生产默认并行，复用 `crate::proxy::http_client::get()` 的共享连接池）
- 超时语义：`timeout_secs`（默认 30）覆盖建连+首字节+整流；空目标/无鉴权 → error result（不 panic）

#### Step 4: 运行单测通过

Run: `cargo test -p cc_switch_lib --lib services::connectivity_test`
Expected: PASS。

#### Step 5: 提交

```bash
git add src-tauri/src/services/connectivity_test
git commit -m "feat(connectivity-test): 后端直连执行器（reqwest+SSE，总/空闲超时，度量与错误识别）"
```

---

### Task 3: Tauri 命令 + lib.rs 注册 + 鉴权/模型源复用
- [x] Task 3: Tauri 命令 + lib.rs 注册 + 鉴权/模型源复用

暴露 2 个命令：多模型测试（弹窗用）与单模型探针（批量徽标用），注册到 `lib.rs`；命令层做官方/动态端点供应商过滤，**不写**网关/熔断状态。

**Files:**
- Create: `src-tauri/src/commands/connectivity_test.rs`
- Modify: `src-tauri/src/commands/mod.rs`（`mod connectivity_test;` + `pub use connectivity_test::*;`）
- Modify: `src-tauri/src/lib.rs`（在 `commands::stream_check_provider` 附近新增 2 条 `invoke_handler` 项；旧命令保留到 Task 8 再删）
- Modify: `src-tauri/src/services/provider/live.rs`（`sanitize_claude_settings_for_live` 增加 `obj.remove("connectivityTest")`——internal-only，绝不写 Claude settings.json）

**Interfaces:**
- Consumes: `ConnectivityTestService::test_models`、`model_ids_from_settings`、`ConnectivityTestParams`
- Produces:
  - `#[tauri::command] pub async fn connectivity_test_provider_models(state, app_type: AppType, provider_id: String, params: Option<ConnectivityTestParams>) -> Result<ConnectivityTestResponse, AppError>`
    - `ConnectivityTestResponse { results: Vec<ConnectivityTestResult> }`
  - `#[tauri::command] pub async fn connectivity_probe_provider(state, app_type: AppType, provider_id: String, model_id: String, timeout_secs: Option<u64>) -> Result<ConnectivityTestResult, AppError>` — 批量徽标用单模型探测

#### Step 1: 写失败测试（过滤与命令逻辑纯函数）

命令层把「可测试性过滤」抽成可测纯函数，测试先写：

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn testable_provider_rejects_official_and_dynamic_endpoints() {
        // official → 不可测
        let official = provider_with(category("official"));
        assert!(!is_probe_capable(&official, &AppType::Codex));
        // codex_oauth → 不可测（动态端点）
        let oauth = provider_with(meta_type("codex_oauth"));
        assert!(!is_probe_capable(&oauth, &AppType::Codex));
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
}
```

#### Step 2: 运行测试确认失败

Run: `cargo test -p cc_switch_lib --lib commands::connectivity_test`
Expected: FAIL。

#### Step 3: 实现命令

- `fn is_probe_capable(provider: &Provider, app_type: &AppType) -> bool`：
  - `provider.category.as_deref() == Some("official")` → false
  - `provider.meta.provider_type` ∈ {`codex_oauth`, `xai_oauth`, `github_copilot`} → false
  - 其余 true
- `connectivity_test_provider_models`：查 `state.db.get_all_providers(app_type.as_str())` 找 provider；不可测 → `AppError::Message`；`model_ids_from_settings` 取模型（空 → `AppError::Message("供应商没有可测试的模型")`）；`params` 为空时用 `ConnectivityTestParams::default()`；`ConnectivityTestService::test_models(...).await`；返回 response
- `connectivity_probe_provider`：查 provider；不可测 → 直接 error result；用传入 `model_id` 单模型执行（`model_ids = &[model_id]`，`timeout_secs` 覆盖默认 30）
- 两者都不 `save_stream_check_log`、不触碰 `proxy` / `failover` 任何状态

#### Step 4: 注册命令 + sanitize + 运行测试

- `commands/mod.rs` 加 `mod connectivity_test; pub use connectivity_test::*;`
- `lib.rs` `invoke_handler` 加两个新命令
- `live.rs:170` 的 `sanitize_claude_settings_for_live` 里追加 `obj.remove("connectivityTest");`
- Run: `cargo test -p cc_switch_lib --lib commands::connectivity_test` → PASS
- Run: `cargo check -p cc_switch_lib 2>&1 | tail -5` → 无错误

#### Step 5: 提交

```bash
git add src-tauri/src/commands/connectivity_test.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src-tauri/src/services/provider/live.rs
git commit -m "feat(connectivity-test): Tauri 命令与注册，官方/动态端点过滤，sanitize 隔离私有字段"
```

---

### Task 4: 测试参数持久化（前端纯函数 + update 复用）
- [x] Task 4: 测试参数持久化（前端纯函数 + update 复用）

前端侧新增参数持久化读写纯函数（写回供应商 `settings_config.connectivityTest`，复用 `providersApi.update`），供弹窗使用。

**Files:**
- Create: `src/lib/connectivityTestSettings.ts`
- Test: `tests/lib/connectivityTestSettings.test.ts`

**Interfaces:**
- Produces:
  - `interface ConnectivityTestSettings { prompt: string; defaultTestModelId?: string; stream: boolean; temperature?: number; maxTokens?: number; headers?: Record<string,string>; body?: Record<string,unknown>; timeoutSecs: number; }`
  - `DEFAULT_CONNECTIVITY_TEST_SETTINGS: ConnectivityTestSettings`（prompt `"ping"`，stream true，timeoutSecs 30）
  - `getConnectivityTestSettings(settingsConfig: Record<string,any>): ConnectivityTestSettings` — 缺省补默认值
  - `mergeConnectivityTestSettings(settingsConfig: Record<string,any>, next: ConnectivityTestSettings): Record<string,any>` — 深拷贝并写 `connectivityTest`（缺省默认值跳过不写）
  - `settingsConfigConnectivityTest(settingsConfig) : ConnectivityTestSettings` 别名（同 get）

#### Step 1: 写失败测试

`tests/lib/connectivityTestSettings.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import {
  getConnectivityTestSettings,
  mergeConnectivityTestSettings,
  DEFAULT_CONNECTIVITY_TEST_SETTINGS,
} from "@/lib/connectivityTestSettings";

describe("connectivityTestSettings", () => {
  it("returns defaults when field absent", () => {
    const s = getConnectivityTestSettings({ env: {} });
    expect(s.prompt).toBe("ping");
    expect(s.stream).toBe(true);
    expect(s.timeoutSecs).toBe(30);
    expect(s.defaultTestModelId).toBeUndefined();
  });

  it("preserves saved fields and defaults the rest", () => {
    const s = getConnectivityTestSettings({
      connectivityTest: { prompt: "hi", stream: false, timeoutSecs: 20 },
    });
    expect(s).toMatchObject({ prompt: "hi", stream: false, timeoutSecs: 20, maxTokens: undefined });
  });

  it("merge writes only explicit fields and does not mutate input", () => {
    const input = { env: { ANTHROPIC_MODEL: "x" } };
    const next = mergeConnectivityTestSettings(input, { prompt: "hi", stream: true, timeoutSecs: 20 });
    expect(input).not.toHaveProperty("connectivityTest");
    expect(next).toHaveProperty("connectivityTest.prompt", "hi");
    expect(next.connectivityTest.maxTokens).toBeUndefined();
  });
});
```

#### Step 2: 运行测试确认失败

Run: `pnpm vitest run tests/lib/connectivityTestSettings.test.ts`
Expected: FAIL。

#### Step 3: 实现纯函数

按接口定义实现（约 70 行）；写回时仅写入非缺省的显式字段，`headers`/`body` 保留对象。

#### Step 4: 运行测试通过

Run: `pnpm vitest run tests/lib/connectivityTestSettings.test.ts`
Expected: PASS。

#### Step 5: 提交

```bash
git add src/lib/connectivityTestSettings.ts tests/lib/connectivityTestSettings.test.ts
git commit -m "feat(connectivity-test): 测试参数持久化纯函数（缺省即默认值）"
```

---

### Task 5: 前端 API 层 + useConnectivityTest / useConnectivityProbe hooks
- [x] Task 5: 前端 API 层 + useConnectivityTest / useConnectivityProbe hooks

前端命令绑定与两类状态管理 hook（弹窗逐模型、批量探针并发 5）。

**Files:**
- Create: `src/lib/api/connectivity-test.ts`
- Create: `src/hooks/useConnectivityTest.ts`
- Create: `src/hooks/useConnectivityProbe.ts`
- Test: `tests/hooks/useConnectivityTest.test.ts`（mock invoke）

**Interfaces:**
- Consumes: 后端 2 命令（Task 3 类型）；`ConnectivityTestSettings`（Task 4）
- Produces:
  - `src/lib/api/connectivity-test.ts`：`export type ConnectivityTestStatus = "success"|"error"`；`export interface ConnectivityTestResult { modelId; status; firstByteMs?: number; totalMs?: number; errorMessage?: string; requestUrl: string; requestHeaders: Record<string,string>; requestBody: unknown; responseHeaders?: Record<string,string>; responseBody?: unknown; }`；`export interface ConnectivityTestResponse { results: ConnectivityTestResult[] }`；`export async function connectivityTestProviderModels(appId, providerId, params?): Promise<ConnectivityTestResponse>`（invoke `connectivity_test_provider_models`）；`export async function connectivityProbeProvider(appId, providerId, modelId, timeoutSecs?): Promise<ConnectivityTestResult>`（invoke `connectivity_probe_provider`）
  - `useConnectivityTest(provider, appId)`：
    - state：`results: Record<modelId, {status:"waiting"|"running"|"success"|"error"|result}>`
    - `runTest(modelIds, params)` → 更新逐模型 running → 并行 invoke → 写结果
    - `reset()`
  - `useConnectivityProbe(appId)`：
    - state：`results: Record<providerId, {status; totalMs?; errorMessage?}>`
    - `probeAll(providers: Provider[])` → 过滤可测供应商（前端侧轻量判断：`category==="official"` 跳过；`meta.provider_type ∈ {codex_oauth, xai_oauth, github_copilot}` 跳过；仅 claude/codex app 才测）→ 并发度 5（手写并发池）逐 `connectivityProbeProvider` → 按完成顺序更新
    - `clear()`

#### Step 1: 写失败测试（hook 状态流）

`tests/hooks/useConnectivityTest.test.ts`：mock `@tauri-apps/api/core` 的 `invoke`，断言 `runTest` 依序置 running 再写 result，`reset` 清空。

#### Step 2: 运行测试确认失败

Run: `pnpm vitest run tests/hooks/useConnectivityTest.test.ts`
Expected: FAIL。

#### Step 3: 实现 API + hooks

按接口实现（约 160 行）。并发池：`let next=0; const workers = Array.from({length: Math.min(5, items.length)}, run)`；每个 worker 循环取 `next++` 项执行并 `setResults` 增量更新。

#### Step 4: 运行测试通过

Run: `pnpm vitest run tests/hooks/useConnectivityTest.test.ts`
Expected: PASS。

#### Step 5: 提交

```bash
git add src/lib/api/connectivity-test.ts src/hooks/useConnectivityTest.ts src/hooks/useConnectivityProbe.ts tests/hooks/useConnectivityTest.test.ts
git commit -m "feat(connectivity-test): 前端命令绑定与测试/探针状态 hooks"
```

---

### Task 6: 前端弹窗 + 详情 + 徽标组件（shadcn/ui）
- [x] Task 6: 前端弹窗 + 详情 + 徽标组件（shadcn/ui）

三个组件：测试弹窗（模型多选/prompt/默认测试模型/流式/高级参数/结果表格/免责）、单模型详情子弹窗、卡片徽标。

**Files:**
- Create: `src/components/providers/ConnectivityTestDialog.tsx`
- Create: `src/components/providers/ConnectivityDetailDialog.tsx`
- Create: `src/components/providers/ConnectivityBadge.tsx`
- Modify: `src/i18n/locales/{zh,en,ja,zh-TW}.json`（新增 `connectivityTest.*` 文案）
- Test: `tests/components/ConnectivityTestDialog.test.tsx`（渲染与「未选模型不可开始」）

**Interfaces:**
- Consumes: `useConnectivityTest`（Task 5）、`getConnectivityTestSettings`/`mergeConnectivityTestSettings`（Task 4）、`providersApi.update`
- Produces:
  - `ConnectivityTestDialog({ provider, appId, open, onOpenChange })`：
    - 模型多选（checkbox 列表 + 全选）；`defaultTestModelId` 存在时默认勾选该模型；`modelIds` 空 → 空态提示「无模型可测试」
    - prompt 输入；流式 Switch；「高级参数」折叠（temperature、maxTokens 数字输入；headers/body 的 JSON textarea，非法 JSON 时保存/开始前校验并提示）
    - 「开始测试」disabled 于 `selected.length===0`；计费免责声明（对齐 ai-toolbox disclaimer）
    - 结果表格：模型、状态（等待/运行中/成功/失败 + 色彩）、firstByteMs、totalMs、错误信息；每行「请求详情」按钮 → `ConnectivityDetailDialog`
    - 「保存参数」走 `providersApi.update`（完整入参是 `Provider`）：写回时保留原 provider 其余字段，仅改 `settingsConfig.connectivityTest` → `providersApi.update({ ...provider, settingsConfig: mergeConnectivityTestSettings(provider.settingsConfig, next) }, appId, provider.id)`；打开时用 `getConnectivityTestSettings` 恢复
  - `ConnectivityDetailDialog({ result, open, onOpenChange })`：只读展示 request URL/headers/body、response headers/body（JSON 美化；超长截断）
  - `ConnectivityBadge({ status, totalMs?, errorMessage?, running })`：成功绿 / 失败红圆点 + 耗时文本；`running` 时旋转 spinner；复用 tailwind 色彩（不引入 antd）

#### Step 1: 写失败测试

`tests/components/ConnectivityTestDialog.test.tsx`（render + 未选模型禁用 + 全选）：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ConnectivityTestDialog from "@/components/providers/ConnectivityTestDialog";

const provider = {
  id: "p1", name: "Relay", settingsConfig: {
    env: { ANTHROPIC_BASE_URL: "https://relay/v1", ANTHROPIC_AUTH_TOKEN: "k" },
    modelCatalog: { models: [{ model: "a" }, { model: "b" }] },
  },
};

describe("ConnectivityTestDialog", () => {
  it("renders model checkboxes and blocks start when none selected", () => {
    render(<ConnectivityTestDialog provider={provider} appId="claude" open onOpenChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeDisabled();
  });
});
```

#### Step 2: 运行测试确认失败

Run: `pnpm vitest run tests/components/ConnectivityTestDialog.test.tsx`
Expected: FAIL（组件不存在）。

#### Step 3: 实现组件 + i18n

- 组件按接口实现（约 420 行 + 详情 120 行 + 徽标 60 行）；复用 `ui/{checkbox,switch,select,input,textarea,table,button,dialog,scroll-area,collapsible,tooltip}.tsx`
- i18n：四语言新增 `connectivityTest` 块（modelSelection/prompt/defaultTestModel/stream/advancedParams/temperature/maxTokens/customHeaders/customBody/start/saveParams/running/success/failed/waiting/requestDetails/selectModelFirst/disclaimer/noTestableModels）

#### Step 4: 运行测试 + typecheck

Run: `pnpm vitest run tests/components/ConnectivityTestDialog.test.tsx` → PASS
Run: `pnpm typecheck` → 无类型错误

#### Step 5: 提交

```bash
git add src/components/providers/ConnectivityTestDialog.tsx src/components/providers/ConnectivityDetailDialog.tsx src/components/providers/ConnectivityBadge.tsx src/i18n/locales
git commit -m "feat(connectivity-test): 连通性测试弹窗/详情/徽标组件与四语言文案"
```

---

### Task 7: 供应商列表集成（替换检测入口 + 批量探针徽标）
- [ ] Task 7: 供应商列表集成（替换检测入口 + 批量探针徽标）

把新弹窗与批量探针接入 `ProviderList`/`ProviderCard`/`ProviderActions`，替换旧「检测连通」按钮行为与旧批量检查。

**Files:**
- Modify: `src/components/providers/ProviderList.tsx`
- Modify: `src/components/providers/ProviderCard.tsx`
- Modify: `src/components/providers/ProviderActions.tsx`
- Modify: `src/i18n/locales/{zh,en,ja,zh-TW}.json`（`provider.connectivityCheck` 文案微调为打开弹窗语义）

**Interfaces:**
- Consumes: `ConnectivityTestDialog`、`ConnectivityBadge`、`useConnectivityProbe`（Task 5/6）
- Produces:
  - `ProviderList`：
    - 移除 `useStreamCheck` 引用与 `handleTest` 旧逻辑；新增 `testProvider` state（`{provider, open}`）与 `useConnectivityTest`/`useConnectivityProbe`
    - 列表头（搜索框旁）新增「批量检测」按钮（`onClick=probeAll(providers)`，running 时禁用）
    - `ProviderCard` 传 `onTest={() => setTestProvider(provider)}`（claude/codex 应用下）；`onTest` 传入的 provider 交给 `ConnectivityTestDialog`
    - `ConnectivityBadge` 渲染在卡片徽章区（`ProviderHealthBadge` 旁）：`probeResults[provider.id]`
  - `ProviderCard` / `ProviderActions`：
    - `onTest` 保持按钮（icon Activity），行为改为打开弹窗；`isTesting` 改由 `useConnectivityTest` 的 running 状态驱动（非旧 `isChecking`）
    - 隐藏条件：`appId` 非 claude/codex 时不渲染检测按钮（其余应用不显示检测入口）；`category==="official"` 仍隐藏

#### Step 1: 失败测试（纯渲染/入口判定）

给「检测入口是否渲染」抽纯函数并测试：

```ts
// src/components/providers/connectivityEntry.ts
export function shouldShowTestEntry(appId: AppId, providerCategory?: string): boolean {
  return (appId === "claude" || appId === "codex") && providerCategory !== "official";
}
```

`tests/components/connectivityEntry.test.ts`：claude+第三方 → true；codex+official → false；gemini → false。

#### Step 2: 运行测试确认失败

Run: `pnpm vitest run tests/components/connectivityEntry.test.ts`
Expected: FAIL。

#### Step 3: 接入 ProviderList/Card/Actions

按接口实现（约 120 行改动）。保留 `ProviderHealthBadge`（熔断健康徽标）不动；`ConnectivityBadge` 是独立组件，两者并存。

#### Step 4: 运行测试 + typecheck + 手工验证点

Run: `pnpm vitest run tests/components/connectivityEntry.test.ts` → PASS
Run: `pnpm typecheck` → 无错误
手工验证（开发者运行 app）：claude 供应商点检测 → 打开弹窗；列表头批量检测 → 徽标逐个更新；gemini 无检测按钮。

#### Step 5: 提交

```bash
git add src/components/providers src/i18n/locales
git commit -m "feat(connectivity-test): 供应商列表集成（弹窗入口 + 批量探针徽标）"
```

---

### Task 8: 移除旧可达性探测（单提交破坏性变更）
- [ ] Task 8: 移除旧可达性探测（单提交破坏性变更）

全部新功能验证后，删除旧 `stream_check` 全链路与配置面板，清理引用与 i18n。

**Files:**
- Delete: `src-tauri/src/commands/stream_check.rs`、`src-tauri/src/services/stream_check.rs`、`src-tauri/src/database/dao/stream_check.rs`
- Delete: `src/hooks/useStreamCheck.ts`、`src/lib/api/connectivity-check.ts`、`src/components/usage/ConnectivityCheckConfigPanel.tsx`
- Modify（移除引用）:
  - `src-tauri/src/services/mod.rs`：删 `pub mod stream_check;`
  - `src-tauri/src/commands/mod.rs`：删 `mod stream_check; pub use stream_check::*;`
  - `src-tauri/src/lib.rs`：删 4 个 `commands::stream_check_*` invoke 项
  - `src-tauri/src/database/dao/mod.rs`：删 `pub mod stream_check;`
  - `src-tauri/src/database/backup.rs:449` 与 `src-tauri/src/database/mod.rs:152`：删 `cleanup_old_stream_check_logs(7)` 调用（保留 `stream_check_logs` 表结构，不做 DROP）
  - `src/components/settings/SettingsPage.tsx`：删 `ConnectivityCheckConfigPanel` import 与 `<ConnectivityCheckConfigPanel/>`（line ~482）
  - `src/i18n/locales/*.json`：删 `streamCheck.*` 块与 `provider.connectivityCheck` 旧文案
- Test: `tests/` 全量 + 残留引用 grep 断言

#### Step 1: 写失败测试（残留引用断言）

```bash
# 预期：0 命中
! grep -rn "stream_check\|streamCheck\|StreamCheck\|ConnectivityCheckConfigPanel\|useStreamCheck" src src-tauri/src --include="*.rs" --include="*.ts" --include="*.tsx"
```

#### Step 2: 执行删除

按 Files 清单删除文件并移除引用；`settings_config` 中旧 `stream_check` 相关历史数据不迁移（缺省视为默认值）。

#### Step 3: 全量验证

Run: `pnpm typecheck`
Run: `pnpm vitest run`
Run: `cargo check -p cc_switch_lib 2>&1 | tail -5`
Run: `cargo clippy -p cc_switch_lib -- -D warnings 2>&1 | tail -8`
Expected: 全部通过；grep 残留为 0。

#### Step 4: 提交（单提交）

```bash
git add -A
git commit -m "refactor(connectivity-test): 移除旧 stream_check 可达性探测全链路（保留表结构）"
```

---

### Task 9: 端到端验证（5.1 / 5.2）
- [ ] Task 9: 端到端验证（5.1 / 5.2）

对齐 tasks.md 第 5 组，做编译/静态/功能/回归四层验证。

**Files:**
- 验证脚本/命令；无代码改动（发现问题则回到对应 Task 修复）

#### Step 1: 编译与静态

```bash
cargo test -p cc_switch_lib --lib services::connectivity_test commands::connectivity_test
pnpm vitest run
pnpm typecheck
cargo clippy -p cc_switch_lib -- -D warnings 2>&1 | tail -8
```
Expected: 全绿。

#### Step 2: 功能验证（真实/模拟供应商）

- 弹窗测试成功场景（有效 claude/codex 供应商 → 逐模型 success + firstByteMs/totalMs）
- 401/403（错误 token → error，错误信息含 HTTP 状态，详情含实际 URL/body）
- 流错误（SSE `event: error` / `response.failed` → error）
- 超时（把 timeoutSecs 调到 1 → error 说明超时）
- 参数持久化：改 prompt/默认测试模型并保存 → 重开弹窗恢复且默认勾选该模型；首次打开用默认值
- 批量探针：并发 ≤5、逐供应商更新徽标、官方/无模型供应商跳过无徽标
- 熔断器隔离：跑一次失败测试后确认熔断器状态不变（`failover` 表 / 健康值未变）

#### Step 3: 回归

- 旧入口全部移除无残留（Task 8 断言重跑）
- `git status` 干净、提交历史含 Task 1–8 各独立提交

#### Step 4: 结论

汇总验证结果到 `docs/superpowers/reports/2026-09-03-per-model-connectivity-test-verify.md`，按 verify 阶段要求输出。

---