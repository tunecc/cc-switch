# provider-connectivity-test Specification

## Purpose
提供按模型发起真实（最小化）请求的供应商连通性测试能力，使用户能够验证供应商配置（端点、鉴权、模型、协议）是否真正可用，取代仅探测 base_url 可达性的旧连通检测。弹窗以单一模型表格呈现「勾选 → 测试 → 结果 → 再勾选」闭环，并支持从上游实时拉取模型列表补全测试范围。探测目标（URL、请求体、鉴权头）与供应商配置的 API 格式对齐，与真实转发链路发送给上游的请求同源。

## Requirements

### Requirement: 按模型真实请求连通性测试
系统 SHALL 允许用户针对单个供应商勾选的一个或多个模型发起真实的最小化请求，并逐模型返回结果。系统 SHALL 仅对用户勾选的模型发起请求；未勾选的模型 MUST NOT 被发送请求。每个结果 MUST 包含：`success` 或 `error` 状态、首字节时间（`first_byte_ms`）、总耗时（`total_ms`）、错误信息（失败时）以及完整的请求与响应详情（URL、headers、body）。

以下任一情况 SHALL 判定为 `error`：连接失败（DNS/连接拒绝/TLS/超时）、非 2xx 响应、流式响应中出现错误事件或错误 JSON、非流式响应体为空或包含错误对象、超过总超时。

#### Scenario: 所有勾选模型测试成功
- **WHEN** 用户对配置了有效端点、鉴权与模型的供应商发起连通性测试并勾选若干模型
- **THEN** 每个勾选模型返回 `success` 状态、首字节时间与总耗时，未勾选模型不发起请求

#### Scenario: 鉴权失败被识别为错误
- **WHEN** 供应商鉴权凭证无效，上游返回 401/403
- **THEN** 该模型结果为 `error`，错误信息包含 HTTP 状态，且请求详情中包含实际发送的 URL 与请求体

#### Scenario: 流式响应中的错误事件被识别
- **WHEN** 上游以 200 响应但在 SSE 流中返回错误事件（如 `event: error` 或 `response.failed`）或错误 JSON 载荷
- **THEN** 该模型结果为 `error`，错误信息说明响应包含错误事件

#### Scenario: 超时判定
- **WHEN** 单个模型的测试在总超时时间内未获得完整响应
- **THEN** 该模型结果为 `error`，错误信息说明超时

### Requirement: 探测目标与供应商 API 格式对齐
系统 SHALL 按供应商声明的 API 格式构造连通性测试请求的 URL、请求体与鉴权头，使测试请求与真实转发链路发送给上游的请求同源（复用同一 apiFormat 判定、同一请求体转换函数、同一鉴权构造与同一端点改写规则），探测请求直连上游、不经本地代理。

- Claude 供应商 apiFormat 判定口径：`meta.apiFormat` > `settings_config.api_format` > `openrouter_compat_mode` > 默认 `anthropic`。
- Codex 供应商 wire 判定口径：`meta.apiFormat` > `settings_config.api_format`/`apiFormat` > TOML `wire_api` > base_url 形状。
- 目标端点：
  - Claude `anthropic`（默认）→ `POST {base}/v1/messages`，Anthropic Messages body，含 `anthropic-version: 2023-06-01`；
  - Claude `openai_chat` → `POST {base}/v1/chat/completions`，Chat Completions body（流式时注入 `stream_options.include_usage`）；
  - Claude `openai_responses` → `POST {base}/v1/responses`，Responses body；
  - Claude `gemini_native` → 非流式 `POST {base}/v1beta/models/{model}:generateContent`，流式 `POST {base}/v1beta/models/{model}:streamGenerateContent?alt=sse`，Gemini generateContent body；
  - Codex wire=responses（默认）→ `POST {base}/responses`，Responses body；
  - Codex wire=chat → `POST {base}/chat/completions`，Chat Completions body；
  - Codex wire=anthropic → `POST {base}/v1/messages`，Anthropic Messages body。
- 鉴权头 SHALL 由代理转发链路使用的同一 adapter 鉴权构造产生：`ANTHROPIC_AUTH_TOKEN` → `Authorization: Bearer`；`ANTHROPIC_API_KEY` → `x-api-key`；gemini 普通 key → `x-goog-api-key`；OpenRouter → `Authorization: Bearer`；Codex Anthropic 网关按 apiKeyField 决定 `x-api-key`（ANTHROPIC_API_KEY）或 `Authorization: Bearer`（缺省）。
- `meta.isFullUrl=true` 时 URL SHALL 直接使用 base_url（不拼接端点路径）。
- 请求体 SHALL 由代理转发层的同一转换函数产生（Claude 侧 `transform_claude_request_for_api_format`，Codex 侧 responses↔chat / responses→anthropic 转换）；会话态优化（缓存断点注入、会话历史补全、prompt cache key）MUST NOT 参与测试请求。
- 自定义 headers / 自定义 body 的浅合并语义保持：合并发生在默认（或转换后）请求之上。
- 目标构造失败（无 base_url、无可用鉴权、转换报错等）SHALL 返回该模型的 `error` 结果并给出原因，MUST NOT panic。
- 动态端点供应商（codex_oauth / xai_oauth / github_copilot）与官方供应商 MUST 仍被排除在连通性测试之外。

#### Scenario: Claude 供应商配置为 OpenAI Chat Completions
- **WHEN** 某 Claude 供应商 `meta.apiFormat=openai_chat` 且用户对其模型发起连通性测试
- **THEN** 请求详情中的 URL 为 `{base}/v1/chat/completions`，请求体为 Chat Completions 形状（messages 含测试提示词；流式时含 `stream:true` 与 `stream_options.include_usage`），鉴权头与该供应商真实转发请求一致

#### Scenario: Claude 供应商配置为 OpenAI Responses
- **WHEN** 某 Claude 供应商 `meta.apiFormat=openai_responses`
- **THEN** 测试请求 URL 为 `{base}/v1/responses`，请求体为 Responses 形状

#### Scenario: Claude 供应商配置为 Gemini Native
- **WHEN** 某 Claude 供应商 `meta.apiFormat=gemini_native`，流式开关开启
- **THEN** 测试请求 URL 为 `{base}/v1beta/models/{model}:streamGenerateContent?alt=sse`，请求体为 Gemini generateContent 形状，鉴权为 x-goog-api-key（普通 key）或 Bearer access_token（OAuth 凭据含可用 access_token 时）

#### Scenario: Claude 供应商保持 Anthropic 原生
- **WHEN** 某 Claude 供应商未配置 apiFormat 或配置为 anthropic
- **THEN** 测试请求 URL 为 `{base}/v1/messages`，请求体为 Anthropic Messages 形状，请求头含 `anthropic-version: 2023-06-01`

#### Scenario: Codex 供应商 wire_api 为 chat
- **WHEN** 某 Codex 供应商 TOML `wire_api="chat"`（或 apiFormat 等价声明）
- **THEN** 测试请求 URL 为 `{base}/chat/completions`，请求体为 Chat Completions 形状

#### Scenario: Codex 供应商 wire_api 为 anthropic
- **WHEN** 某 Codex 供应商 TOML `wire_api="anthropic"`（或 apiFormat 等价声明）
- **THEN** 测试请求 URL 为 `{base}/v1/messages`，请求体为 Anthropic Messages 形状，鉴权头按 apiKeyField 决定

#### Scenario: base_url 为完整端点 URL
- **WHEN** 供应商 `meta.isFullUrl=true` 且 base_url 已是完整端点地址
- **THEN** 测试请求 URL 直接使用该 base_url，不追加端点路径

#### Scenario: 目标构造失败返回错误结果
- **WHEN** 供应商缺少 base_url 或可用鉴权，或请求体转换报错
- **THEN** 对应模型返回 `error` 结果，错误信息说明原因，不产生 panic 或半构造请求

### Requirement: 连通性测试弹窗与单一模型表格
系统 SHALL 提供连通性测试弹窗，主体为测试参数区与单一模型表格：

- 打开弹窗即展示该供应商静态模型清单的全部模型行，每行 MUST 包含：勾选框、模型 ID、状态（待测试/测试中/成功/失败）、首字节时间、总耗时、错误信息与请求详情入口。
- 表格表头 SHALL 提供全选勾选框，支持半选（indeterminate）态。
- 初始勾选逻辑：已保存的默认测试模型（存在于清单中时）→ 供应商当前模型 → 清单首个模型。
- 测试参数区包含：测试提示词、默认测试模型选择、流式开关，以及高级参数（temperature、maxTokens、超时秒数、自定义 headers、自定义 body 的 JSON 编辑）。
- 未勾选任何模型时 MUST 阻止开始测试并提示。
- 测试进行中勾选框与开始按钮 MUST 禁用；每个模型的请求返回后 SHALL 立即更新该行终态（成功/失败、首字节、总耗时、错误信息），不等待其余模型完成。
- 一轮测试结束且存在失败模型时，勾选集合 SHALL 自动替换为清单内的失败模型；全部成功时保持用户原勾选。
- 表格上方 SHALL 显示统计卡：已勾选 / 运行中 / 成功 / 失败 / 待测试，数值随勾选与行状态实时变化。

#### Scenario: 打开弹窗展示全部模型
- **WHEN** 用户打开某可测供应商的连通性测试弹窗
- **THEN** 全部静态清单模型以「待测试」行展示，并按预选逻辑自动勾选一个模型

#### Scenario: 勾选行发起测试
- **WHEN** 用户勾选若干模型行并点击开始测试
- **THEN** 仅勾选模型进入「测试中」，逐模型返回后逐行更新为终态

#### Scenario: 失败模型自动勾选
- **WHEN** 一轮测试完成且存在失败模型
- **THEN** 勾选集合自动替换为失败模型，用户可直接再次点击开始测试重测失败项

#### Scenario: 未勾选时无法开始测试
- **WHEN** 用户未勾选任何模型并点击开始测试
- **THEN** 系统提示需要先选择模型，且不发起任何请求

#### Scenario: 查看请求详情
- **WHEN** 测试完成后用户点击某模型的"请求详情"入口
- **THEN** 弹窗展示该模型的请求 URL、请求 headers（鉴权头脱敏）、请求体、响应 headers 与响应体，内容与实际发送/接收一致

### Requirement: 弹窗内获取上游模型列表
系统 SHALL 在模型表格区提供「获取模型列表」操作：

- 点击后以该供应商已保存配置中提取的凭据（与模型快捷切换功能同链路、同凭据提取逻辑）调用上游 `/v1/models` 拉取模型列表；拉取过程中操作显示加载态。
- 拉取成功后，远端模型 SHALL 按模型 ID 追加合并去重进表格（新行为「待测试」且未勾选）；静态清单中已配置但远端不存在的模型保持可见可测。
- 拉取到的模型仅在本弹窗会话内有效，MUST NOT 写回供应商配置。
- 拉取失败时 SHALL 显示与模型快捷切换同语义的错误提示（鉴权失败 / 端点不存在或未开放 / 超时 / 响应格式不支持 / 通用失败），且本地静态清单的勾选与测试不受影响。
- 静态清单为空时该操作 SHALL 仍可用，拉取成功后即可开始测试。

#### Scenario: 追加合并去重
- **WHEN** 静态清单含 claude-x、claude-y，远端返回 claude-x、claude-z
- **THEN** 表格展示 claude-x、claude-y、claude-z 三行，均为待测试状态

#### Scenario: 拉取失败不阻断
- **WHEN** 上游 /v1/models 返回 404 或超时
- **THEN** 弹窗显示对应错误提示，静态清单行保持可用

#### Scenario: 拉取结果不持久化
- **WHEN** 用户拉取模型并关闭弹窗后重新打开
- **THEN** 表格恢复为静态清单，不含上次拉取的远端模型

### Requirement: 测试参数按供应商持久化
系统 SHALL 将连通性测试参数（prompt、默认测试模型、流式开关、temperature、maxTokens、自定义 headers、自定义 body）持久化到对应供应商，并在重新打开该供应商的测试弹窗时恢复这些参数。参数缺失时 MUST 使用默认值：默认 prompt 为 `你好，你可以帮我做什么事情`、未设置默认测试模型、流式开启。持久化仅保存与默认值的差异字段。

#### Scenario: 重开弹窗恢复已保存参数
- **WHEN** 用户曾修改某供应商的测试 prompt 与默认测试模型并保存，随后重新打开该供应商的测试弹窗
- **THEN** 弹窗显示之前保存的 prompt 与默认测试模型，且默认勾选该默认测试模型

#### Scenario: 首次打开使用默认值
- **WHEN** 用户首次打开某供应商的测试弹窗且该供应商从未保存过测试参数
- **THEN** 弹窗提示词为 `你好，你可以帮我做什么事情`，无默认测试模型（按预选逻辑勾选），流式开启，发起测试时后端实际发送该默认 prompt

### Requirement: 供应商列表批量探针徽标
系统 SHALL 支持在供应商列表上以受限并发（并发度 5）对所有可测试供应商逐个发起探针，使用各供应商的默认测试模型；探针结果以状态徽标（成功/失败/错误）加总耗时显示在对应供应商卡片上。没有可用模型的供应商（含官方供应商与无用户配置探测目标的类型）以及端点依赖运行时动态解析的供应商类型（如 GitHub Copilot）SHALL 被跳过，不发起请求、不显示探针徽标。探针请求的目标构造 SHALL 与按模型连通性测试同一套 API 格式对齐逻辑。

#### Scenario: 批量探针逐供应商更新徽标
- **WHEN** 用户触发批量连通探针
- **THEN** 各供应商卡片按完成顺序逐个更新为成功/失败徽标与耗时，最多 5 个探针同时进行

#### Scenario: 无模型的供应商被跳过
- **WHEN** 某供应商未配置任何模型或属于官方供应商
- **THEN** 批量探针不对其发起请求，卡片不显示探针结果徽标

#### Scenario: 探针目标同样按 API 格式对齐
- **WHEN** 批量探针命中某 apiFormat=openai_chat 的 Claude 供应商
- **THEN** 该探针发出的请求 URL 与请求体按 Chat Completions 形状构造，与该供应商弹窗内测试同源

### Requirement: 替换旧可达性探测
系统 SHALL 移除旧的 base_url 可达性探测功能：单个与批量可达性检查命令、超时/重试/降级阈值配置面板，以及卡片上的旧检测行为。供应商卡片与列表中原"检测连通性"入口 MUST 改为打开按模型连通性测试弹窗或批量探针。旧功能的用户可见配置项（超时、重试次数、降级阈值）不再保留。

#### Scenario: 旧检测入口指向新测试
- **WHEN** 用户在供应商卡片上点击连通性检测按钮
- **THEN** 打开按模型连通性测试弹窗（而非发起 base_url 可达性探测）

#### Scenario: 旧配置面板被移除
- **WHEN** 用户打开设置/用量页面中的连通检测配置区域
- **THEN** 不再显示超时/重试/降级阈值配置项

### Requirement: 连通性测试不触碰故障转移熔断器
连通性测试结果（无论成功或失败）SHALL NOT 重置、推进或影响故障转移熔断器状态；熔断器仅由真实转发流量驱动。

#### Scenario: 测试失败不影响熔断器
- **WHEN** 某供应商的连通性测试失败
- **THEN** 该供应商的故障转移熔断器状态保持不变，不被重置或改变开闭状态
