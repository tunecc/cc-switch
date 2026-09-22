# Capability: provider-cross-app-import

供应商表单中「从其他应用导入已有供应商配置」的完整行为。

## 行为规格

### 导入入口

- 入口在 `ProviderForm` 内提供，新建模式（无 `initialData`）与编辑模式（有 `initialData`）都渲染：
  - 新建模式：作为 `ProviderPresetSelector` 的可选插槽，渲染在预设按钮区的上方（标题行之下）；
  - 编辑模式：由 `ProviderForm` 在表单顶部独立渲染同一按钮行。
- 每个可用来源应用渲染一个按钮，内容为应用图标 + 应用显示名。
- 来源应用的判定同时满足三个条件：该应用在 `settings.visibleApps` 中为启用；该应用的供应商数量 ≥ 1；该应用不是当前正在编辑 / 新建的应用。任一条件不满足时不渲染对应按钮。
- 全部来源应用都不可用时，整个入口行不渲染。

### 来源选择弹窗

- 点击来源应用按钮后弹出该应用的供应商列表。
- 列表每一行展示：供应商名称、备注（为空时显示「无备注」占位）、请求地址摘要（为空时显示「未配置请求地址」）。
- 弹窗同时展示本次导入将写入的字段清单。
- 编辑模式下，弹窗额外展示一行警示：导入会覆盖当前表单已填写的名称 / 备注 / 官网 / 密钥 / 请求地址。
- 弹窗内不展示 API Key 的任何片段。
- 取消或关闭弹窗不改变表单任何字段。

### 导入写入的字段

确认后，表单以下字段被来源供应商的对应值替换：

- 供应商名称 `name`；
- 备注 `notes`；
- 官网链接 `websiteUrl`；
- API Key（按目标应用的字段名写入 `settingsConfig`）；
- API 请求地址（按目标应用的字段名写入 `settingsConfig`）；
- 默认（兜底）模型名（仅当来源与目标应用都有明确对应字段时）；
- `meta.apiFormat`（仅当来源取值属于目标应用的支持集合时）。

以下字段保持导入前状态，不由导入改变：`websiteUrl2`、`icon`、`iconColor`、预设供应商选中态（新建模式下固定回到「自定义」）、`meta` 的其余字段。

### 各应用的字段位置

| 应用 | 请求地址 | API Key | 默认模型名 |
| --- | --- | --- | --- |
| claude | `env.ANTHROPIC_BASE_URL` | `env.ANTHROPIC_AUTH_TOKEN`（存在 `ANTHROPIC_API_KEY` 时优先写该键） | `env.ANTHROPIC_MODEL` |
| claude-desktop | `env.ANTHROPIC_BASE_URL` | `env.ANTHROPIC_AUTH_TOKEN` | 无 |
| codex | TOML `[model_providers.*].base_url` | `auth.OPENAI_API_KEY` | TOML 顶层 `model` |
| gemini | `env.GOOGLE_GEMINI_BASE_URL` | `env.GEMINI_API_KEY` | `env.GEMINI_MODEL` |
| grokbuild | TOML `base_url` | TOML `api_key`（缺失时 `auth.OPENAI_API_KEY`） | 无 |
| opencode | `options.baseURL` | `options.apiKey` | 无 |
| openclaw | `baseUrl` | `apiKey` | 无 |
| hermes | `base_url` | `api_key` | 无 |
| pi | `baseUrl` | `apiKey` | 无 |
| mcode | `options.baseURL` | `options.apiKey` | 无 |

### 上游 API 格式迁移

- `meta.apiFormat` 的表达范围：`anthropic`（Anthropic Messages）、`openai_chat`（OpenAI Chat Completions）、`openai_responses`（OpenAI Responses）、`gemini_native`（Gemini Native）。
- 可迁移的目标应用：claude（四种）、codex 与 grokbuild（`openai_responses` / `openai_chat` / `anthropic`）——三者的提交路径都无条件把该字段写进 meta。
- claude-desktop 不是迁移目标：它只在 proxy 模式下持久化该字段，direct 模式会被表单覆写回 `"anthropic"`；对着一份会被丢掉的写入预告「本次将写入」比不预告更糟。
- 来源取值属于目标应用支持集合时原值迁移；不属于时（例如 `gemini_native` 迁到 Codex）保持目标应用默认值，不做猜测映射。

### 默认模型名迁移

- 只在 Claude ↔ Codex ↔ Gemini 三者之间迁移：`env.ANTHROPIC_MODEL` ↔ TOML 顶层 `model` ↔ `env.GEMINI_MODEL`。
- 读侧同样受此约束：只有 claude / codex / gemini 作为来源时才取默认模型。claude-desktop 的 env 由提交时按 baseUrl / apiKey 重建、从不落 `ANTHROPIC_MODEL`；grokbuild 的 `upstreamModel` 是客户端 profile 的真实模型名而非兜底模型。两者按「无该字段」返回空。
- 来源或目标没有该字段时，目标模型字段保持为空（Codex 删掉模板自带的 `model` 行，Claude 不落键，Gemini 保存时被丢弃），不填占位值。
- 不迁移 Claude 的 `ANTHROPIC_DEFAULT_*_MODEL` 分级、`CLAUDE_CODE_SUBAGENT_MODEL`、Codex 的 `modelCatalog` 与 reasoning 配置。

### 请求地址

- 一律原样复制来源值，不做 origin 推断、不去尾斜杠、不补 `/v1`。
- 用户可在表单中继续修改。

### 编辑模式的写入边界

编辑已有供应商时，导入只允许覆盖「请求地址 / 密钥 / 默认模型名」这三个键位，配置对象里其余一切原样保留：`providerKey`、模型表、Codex 的 `modelCatalog`、Gemini 顶层 `config`、`env` / `options` / `auth` 中的其他键（含 Codex `auth.json` 里的登录态键）。

- 新建模式才按目标应用的「自定义」模板整体重建配置。
- 编辑模式同步扁平 state 时，只调用对应字段的写入入口（`handleOpencodeBaseUrlChange` 等就地补丁类 handler，或 `resetCodexConfig` 时显式回传既有 `modelCatalog`），不调用会清空 providerKey / 模型表的 `reset*State`。
- claude 沿用既有的认证字段名（已有 `ANTHROPIC_API_KEY` 时写该键），并把表单上的认证字段单选对齐到实际落键。
- grokbuild 编辑模式不动 `profile` 与 `upstreamModel`。

## 不变量

- 导入只改当前表单状态：不写数据库、不触发 live 配置同步、不改其他供应商。
- Codex / grokbuild 的 `config` 是 TOML 文本，写入 `base_url` / `model` / `api_key` 必须走仓库已有的保注释保键序工具；禁止 parse→stringify 整文档重序列化。
- Codex 的 `wire_api` 恒为 `"responses"`，导入不得改写。
- 新建模式下目标应用的 `settingsConfig` 以该应用「自定义」预设模板为基底再写入导入字段；编辑模式在既有配置上就地覆盖导入范围内的键。两者都不得把来源应用的 `settingsConfig` 原样搬过去。
- 既有表单校验、软校验确认框与提交载荷结构不变。
- 编辑模式下导入不改变被编辑供应商的 `id`、`category`、`sortIndex`、`inFailoverQueue`。
- API Key 不出现在弹窗 DOM、console 日志与 toast 中。
