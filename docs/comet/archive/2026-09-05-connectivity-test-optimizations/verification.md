---
generated_from_state_version: 7
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-09-05T03:33:37.309Z
- 摘要: 27 项验收全部通过：勾选即测试范围经前端单元素 modelIds 与后端 resolve_test_model_ids 双端落实，单一表格/统计卡/失败自动勾选/获取模型列表合并去重均与 brief 一致，默认提示词前后端同步且 merge 差异判断随新默认值切换；A9-A12/A23-A27 既有行为路径（探针命令、卡片入口、熔断器隔离、旧面板移除）经代码独立复核未受破坏，唯一 cargo 全量失败经查证为与本 change 无关的预先存在失败。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1 默认提示词：未保存过自定义提示词的供应商打开弹窗，测试提示词输入框显示 `你好，你可以帮我做什么事情`；不传 prompt 时后端实际发送的请求体 prompt 同为该值；保存过自定义提示词的供应商仍恢复其自定义值；`mergeConnectivityTestSettings` 的差异字段判断随新默认值同步（新默认值不被持久化）。 | 前端 DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt 与后端 protocol.rs DEFAULT_TEST_PROMPT 同为「你好，你可以帮我做什么事情」，build_claude/build_codex 兜底一致；getConnectivityTestSettings 恢复已存自定义值，merge 差异判断以新默认为基准且新默认不持久化（connectivityTestSettings.test.ts 8 项含新旧默认切换专项） |
| A2 | passed | brief.md | A2 单一表格形态：打开弹窗即展示该供应商静态清单全部模型行，每行含勾选框、模型 ID、状态、首字节 (ms)、总耗时 (ms)、错误信息、请求详情；初始状态为「待测试」；初始勾选遵循现有预选逻辑（defaultTestModelId → 供应商当前模型 → 清单首个）；表头带全选（含半选态）；上方独立选择区移除。 | 打开即渲染静态清单全部模型行（勾选框/ID/状态/首字节/总耗时/错误信息/请求详情七列，初始待测试），预选逻辑 defaultTestModelId→当前模型→首个有 4 个测试覆盖，表头全选含 indeterminate 半选态，旧版 modelSelection 独立选择区已从代码与 i18n 中移除（HEAD 版本有、现版无） |
| A3 | passed | brief.md | A3 获取模型列表：表格区提供「获取模型列表」操作，点击后以供应商 settingsConfig 提取的凭据（与模型快捷切换同源逻辑）调用现有 `fetch_models_for_config` 拉取上游 `/v1/models`；拉取中显示加载态；成功后远端模型按 ID 追加合并去重进表格（新行为待测试、未勾选），仅本次弹窗会话有效、不写回 settingsConfig；失败时显示与模型快捷切换同语义的错误提示（鉴权失败 / 端点不存在 / 超时 / 格式不支持 / 通用失败），静态清单行与测试不受影响；静态清单为空时仍可通过该操作拉到模型开始测试。 | handleFetchModels 经共享 extractCredentials（与 ModelQuickSwitchDialog 逐字同实现）调用 fetch_models_for_config，isFetching 加载态，按 ID 追加合并去重且不调用 providersApi.update，失败走 showFetchModelsError 五分支同语义提示，空静态清单时按钮仍可用（专项测试覆盖） |
| A4 | passed | brief.md | A4 勾选即测试范围：勾选若干模型行点「开始测试」，后端仅对勾选集合发起真实请求，未勾选模型不发送请求（修正现状「后端测全部、前端仅过滤显示」的行为）；测试中勾选行置「测试中」、勾选与开始按钮禁用；每个模型返回后立即更新该行终态（成功/失败 + 首字节/总耗时/错误信息 + 请求详情），无需等待全部模型完成。 | useConnectivityTest 每模型单元素 modelIds 独立并行 invoke，后端 resolve_test_model_ids 原样采用传入集合故未勾选模型不发送请求；anyRunning 时行勾选框/全选/开始按钮均禁用且行置测试中，每模型返回立即写该行终态（hook 测试 deferred 双模型验证流式顺序） |
| A5 | passed | brief.md | A5 测完勾选行为：一轮测试结束且存在失败模型时，勾选集合自动替换为失败模型（便于直接点「开始测试」重测）；全部成功时保持用户原勾选。 | handleStart 以本轮终态快照 filter 出失败集合替换 selected，全部成功保持原勾选；两个专项测试（auto-checks failed models / keeps the user's selection）分别覆盖两种分支 |
| A6 | passed | brief.md | A6 统计卡：表格上方显示 5 格统计（已勾选 / 运行中 / 成功 / 失败 / 待测试），数值随勾选与行状态实时变化。 | SummaryGrid 渲染已勾选/运行中/成功/失败/待测试 5 格，stats useMemo 依赖 selected.length 与 results 实时重算；测试断言初始「已勾选 1」与拉取追加后待测试计数递增 |
| A7 | passed | brief.md | A7 回归不变：默认测试模型下拉、流式开关、高级参数（温度/maxTokens/超时/自定义 Headers/Body）、「保存参数」、请求详情子弹窗、计费免责声明行为与现状一致；批量探针链路不受影响。 | 默认测试模型下拉、流式开关、温度/maxTokens/超时/Headers/Body 高级参数、保存参数（merge+providersApi.update）、请求详情子弹窗（ConnectivityDetailDialog 未改动）、计费免责声明均在且行为不变；批量探针链路（useConnectivityProbe/App.tsx/ProviderCard）不在 diff 中，connectivityProbeProvider 命令签名未变 |
| A8 | passed | brief.md | A8 测试：前端单测覆盖默认提示词值、追加合并去重、勾选再测闭环与失败自动勾选；既有 `ConnectivityTestDialog.test.tsx` 等测试随交互重构更新并通过；类型检查与前端构建通过；Rust 侧改动伴随 `cargo test` 通过。 | 单测覆盖默认提示词、追加合并去重、勾选再测闭环、失败自动勾选与统计卡数值；Runtime 检查 typecheck、test:unit（141 文件 1112 测试）、build:renderer、cargo test connectivity_test（51 项含 resolve_test_model_ids 3 项与 default_prompt_fallback 1 项）全部通过 |
| A9 | passed | specs/provider-connectivity-test/spec.md | 所有勾选模型测试成功 - **WHEN** 用户对配置了有效端点、鉴权与模型的供应商发起连通性测试并勾选若干模型 - **THEN** 每个勾选模型返回 `success` 状态、首字节时间与总耗时，未勾选模型不发起请求 | test_models 仅对传入 model_ids 并行执行，verdict 2xx+体非空+无错误事件判 success 并携带 first_byte_ms/total_ms；未勾选模型不进入任何 invoke（前端单元素集合+后端原样采用） |
| A10 | passed | specs/provider-connectivity-test/spec.md | 鉴权失败被识别为错误 - **WHEN** 供应商鉴权凭证无效，上游返回 401/403 - **THEN** 该模型结果为 `error`，错误信息包含 HTTP 状态，且请求详情中包含实际发送的 URL 与请求体 | 非 2xx 时 verdict 返回「HTTP {status}」错误信息，结果恒含实际发送的 request_url 与 request_body（401 前请求已构造发出）；verdict(401) 有 Rust 测试覆盖 |
| A11 | passed | specs/provider-connectivity-test/spec.md | 流式响应中的错误事件被识别 - **WHEN** 上游以 200 响应但在 SSE 流中返回错误事件（如 `event: error` 或 `response.failed`） - **THEN** 该模型结果为 `error`，错误信息说明响应包含错误事件 | verdict 对 200+SSE error 事件判 error，body_reports_error 识别错误事件与错误 JSON，错误信息为「错误事件: {desc}」；Rust verdict 测试含该场景 |
| A12 | passed | specs/provider-connectivity-test/spec.md | 超时判定 - **WHEN** 单个模型的测试在总超时时间内未获得完整响应 - **THEN** 该模型结果为 `error`，错误信息说明超时 | 流式与非流式路径均以 remaining_total_timeout 加 tokio::time::timeout 兜底整流读取，超时产生「stream/response body exceeded the total timeout」错误结果 |
| A13 | passed | specs/provider-connectivity-test/spec.md | 打开弹窗展示全部模型 - **WHEN** 用户打开某可测供应商的连通性测试弹窗 - **THEN** 全部静态清单模型以「待测试」行展示，并按预选逻辑自动勾选一个模型 | 打开弹窗渲染全部静态清单模型行为待测试并按预选逻辑自动勾选一个模型（弹窗测试首例即断言全选框与待测试行存在及预选勾选） |
| A14 | passed | specs/provider-connectivity-test/spec.md | 勾选行发起测试 - **WHEN** 用户勾选若干模型行并点击开始测试 - **THEN** 仅勾选模型进入「测试中」，逐模型返回后逐行更新为终态 | 仅勾选模型进入 running，逐模型返回后逐行更新终态（useConnectivityTest 测试 1 用 deferred 控制 model-a 先返回、model-b 仍 running 的时序断言） |
| A15 | passed | specs/provider-connectivity-test/spec.md | 失败模型自动勾选 - **WHEN** 一轮测试完成且存在失败模型 - **THEN** 勾选集合自动替换为失败模型，用户可直接再次点击开始测试重测失败项 | 一轮完成且存在失败模型时勾选集合自动替换为失败项可直接重测（snapshot.filter error→setSelected），专项测试断言 a 取消勾选、b 自动勾选 |
| A16 | passed | specs/provider-connectivity-test/spec.md | 未勾选时无法开始测试 - **WHEN** 用户未勾选任何模型并点击开始测试 - **THEN** 系统提示需要先选择模型，且不发起任何请求 | 开始按钮 disabled={selected.length===0\|\|anyRunning}，表格下方显示「请先选择要测试的模型」提示，handleStart 对空集合 early return 不发请求（deselect 测试断言按钮禁用） |
| A17 | passed | specs/provider-connectivity-test/spec.md | 查看请求详情 - **WHEN** 测试完成后用户点击某模型的"请求详情"入口 - **THEN** 弹窗展示该模型的请求 URL、请求 headers、请求体、响应 headers 与响应体 | 行内请求详情按钮打开 ConnectivityDetailDialog，组件渲染请求 URL/请求头/请求体/响应头/响应体五段（该组件未改动，测试 opens the per-model detail dialog 验证 URL 展示） |
| A18 | passed | specs/provider-connectivity-test/spec.md | 追加合并去重 - **WHEN** 静态清单含 claude-x、claude-y，远端返回 claude-x、claude-z - **THEN** 表格展示 claude-x、claude-y、claude-z 三行，均为待测试状态 | 拉取合并以静态清单与已追加行为 seen 集去重，静态已配置但远端不存在的模型保持可见；测试含「claude-x/claude-z 去重追加、重复拉取不产生重复行」断言 |
| A19 | passed | specs/provider-connectivity-test/spec.md | 拉取失败不阻断 - **WHEN** 上游 /v1/models 返回 404 或超时 - **THEN** 弹窗显示对应错误提示，静态清单行保持可用 | 拉取失败 catch 走 showFetchModelsError（404/超时等分类提示），静态清单行与开始按钮保持可用、拉取按钮恢复（专项测试 mockRejectedValue 验证） |
| A20 | passed | specs/provider-connectivity-test/spec.md | 拉取结果不持久化 - **WHEN** 用户拉取模型并关闭弹窗后重新打开 - **THEN** 表格恢复为静态清单，不含上次拉取的远端模型 | fetchedIds 为组件会话 state，打开时 useEffect 重置为空且拉取路径不调用 providersApi.update，保存参数 merge 亦不含拉取模型，重开恢复静态清单 |
| A21 | passed | specs/provider-connectivity-test/spec.md | 重开弹窗恢复已保存参数 - **WHEN** 用户曾修改某供应商的测试 prompt 与默认测试模型并保存，随后重新打开该供应商的测试弹窗 - **THEN** 弹窗显示之前保存的 prompt 与默认测试模型，且默认勾选该默认测试模型 | getConnectivityTestSettings 恢复已保存 prompt/defaultTestModelId 并在打开时预选该默认测试模型（pre-checks the persisted default test model 与 preserves saved fields 测试覆盖） |
| A22 | passed | specs/provider-connectivity-test/spec.md | 首次打开使用默认值 - **WHEN** 用户首次打开某供应商的测试弹窗且该供应商从未保存过测试参数 - **THEN** 弹窗提示词为 `你好，你可以帮我做什么事情`，无默认测试模型（按预选逻辑勾选），流式开启，发起测试时后端实际发送该默认 prompt | 首次打开表单取 DEFAULT（新默认提示词、stream=true、无默认测试模型按预选勾选）；发起测试 params.prompt 携带新默认值（前端测试断言 invoke 含「你好，你可以帮我做什么事情」，Rust default_prompt_fallback 保证不传时后端同值） |
| A23 | passed | specs/provider-connectivity-test/spec.md | 批量探针逐供应商更新徽标 - **WHEN** 用户触发批量连通探针 - **THEN** 各供应商卡片按完成顺序逐个更新为成功/失败徽标与耗时，最多 5 个探针同时进行 | useConnectivityProbe 手写并发池 PROBE_CONCURRENCY=5 按完成顺序逐供应商 setResults 更新徽标，App 层 header 批量检测按钮驱动 probeAll；该链路文件均不在本次 diff 中 |
| A24 | passed | specs/provider-connectivity-test/spec.md | 无模型的供应商被跳过 - **WHEN** 某供应商未配置任何模型或属于官方供应商 - **THEN** 批量探针不对其发起请求，卡片不显示探针结果徽标 | probeAll 前端过滤 official、NON_PROBE_PROVIDER_TYPES 动态端点类型与 probeModelId 为空的供应商（continue 不发起请求不显示徽标），与后端 is_probe_capable 同口径，未受本次改动影响 |
| A25 | passed | specs/provider-connectivity-test/spec.md | 旧检测入口指向新测试 - **WHEN** 用户在供应商卡片上点击连通性检测按钮 - **THEN** 打开按模型连通性测试弹窗（而非发起 base_url 可达性探测） | ProviderActions 的 Activity 按钮点击触发 onTest→ProviderList setTestProvider 打开 ConnectivityTestDialog（卡片注释明确真实请求由弹窗内 hook 触发），无 base_url 可达性探测调用 |
| A26 | passed | specs/provider-connectivity-test/spec.md | 旧配置面板被移除 - **WHEN** 用户打开设置/用量页面中的连通检测配置区域 - **THEN** 不再显示超时/重试/降级阈值配置项 | 前端 UI 无任何超时/重试/降级阈值连通检测配置项（tsx/ts 无 settings.connectivityCheck 或连通检测配置引用，旧命令无代码实现）；zh.json 等 locale 残留的死键不渲染，属既有遗留不影响验收 |
| A27 | passed | specs/provider-connectivity-test/spec.md | 测试失败不影响熔断器 - **WHEN** 某供应商的连通性测试失败 - **THEN** 该供应商的故障转移熔断器状态保持不变，不被重置或改变开闭状态 | ConnectivityTestService::run_one 全路径经共享 reqwest 客户端直连上游，服务与命令层均无 failover/circuit breaker 引用，模块文档明确不触碰 proxy/failover/failover_queue 状态 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 7913 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 20684 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 5994 ms |
| cargo test connectivity_test | test connectivity_test | src-tauri | passed | 0 | 21165 ms |

## 阻塞项

_无。_

## 风险与跳过的工作

- i18n 各 locale 的 settings 命名空间残留旧连通检测配置死键（connectivityCheck title/description），无 UI 消费不影响行为，属可清理的遗留债
- 默认测试模型下拉选项含会话内拉取模型：保存远端模型 ID 为默认测试模型后，下次打开（未拉取时）不参与预选回退（Builder 已披露，不违反验收文字）
- 一轮 N 个勾选模型即 N 次独立 Tauri 命令调用（每次内部单模型并行），符合 D5 逐模型一请求决策，但并发行为依赖后端 join_all 与共享连接池的稳定性

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 27 项验收全部通过：勾选即测试范围经前端单元素 modelIds 与后端 resolve_test_model_ids 双端落实，单一表格/统计卡/失败自动勾选/获取模型列表合并去重均与 brief 一致，默认提示词前后端同步且 merge 差异判断随新默认值切换；A9-A12/A23-A27 既有行为路径（探针命令、卡片入口、熔断器隔离、旧面板移除）经代码独立复核未受破坏，唯一 cargo 全量失败经查证为与本 change 无关的预先存在失败。 | 2026-09-05T03:33:37.309Z |



## 结论

27 项验收全部通过：勾选即测试范围经前端单元素 modelIds 与后端 resolve_test_model_ids 双端落实，单一表格/统计卡/失败自动勾选/获取模型列表合并去重均与 brief 一致，默认提示词前后端同步且 merge 差异判断随新默认值切换；A9-A12/A23-A27 既有行为路径（探针命令、卡片入口、熔断器隔离、旧面板移除）经代码独立复核未受破坏，唯一 cargo 全量失败经查证为与本 change 无关的预先存在失败。
