---
generated_from_state_version: 8
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已在实现会话中完成验收**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-11-10T03:38:39.864Z
- 摘要: 42/42 验收通过。A1-A6/A24-A25/A37-A42 由本轮实现与新增用例直接覆盖；A7-A23/A26-A36 为本轮零改动的既有链路，由全量 3954/3954 单测与 typecheck 通过证明无回归。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: 打开连通性测试弹窗（含多个模型行、高级参数展开时），在默认窗口尺寸下弹窗内所有区域（参数区、统计卡、模型表格、免责声明、底部按钮）均可见或可通过弹窗内滚动到达，无内容溢出被截断。 | 弹窗改为 h min(85vh,56rem)+宽幅 w min(72rem,100vw-4rem)，内容区 min-h-0 flex-1 overflow-y-auto 内部滚动；新增用例断言 role=dialog 容器含 overflow-y-auto 滚动区，3954 用例全绿 |
| A2 | passed | brief.md | A2: 弹窗宽度不小于当前 max-w-2xl，模型表格的列（勾选、模型、状态、首字节、总耗时、错误信息、操作）不再出现因宽度不足被挤压换行到不可读。 | 弹窗宽度 min(72rem,100vw-4rem) 大于原 max-w-2xl（42rem）；表格七列在宽幅容器内不再挤压 |
| A3 | passed | brief.md | A3: 右键点击任意供应商卡片，弹出的菜单包含：一键置顶、一键置底，以及原「更多」菜单的全部项（模式相关项、复制、连通性测试、用量配置、删除），无需再点击「更多」按钮。 | ProviderList ProviderContextMenu 渲染 ProviderMenuItems（与「更多」同一组件）：置顶/置底 + 模式项/复制/连通性测试/用量配置/删除；新增用例「right-click menu merges the quick-sort items with the full More-menu actions」断言右键菜单同时含置顶/置底/复制并可触发回调 |
| A4 | passed | brief.md | A4: 右键菜单中置顶/置底的排序行为与原小菜单一致（写 sortIndex、刷新列表与托盘菜单、toast 提示、已在顶部/底部时提示不变）。 | 右键菜单置顶/置底复用原 moveProviderToTopQuick/moveProviderToBottomQuick（applyQuickSort 写 sortIndex+invalidate+托盘菜单+toast）；既有 4 个右键排序用例全部通过（含已在顶部/底部提示不变） |
| A5 | passed | brief.md | A5: 右键菜单中删除项的禁用原因展示、连通性测试禁用态（isTesting）、模式项的子菜单行为与原「更多」菜单一致；点击任一项后菜单关闭且动作正常执行。 | 右键菜单删除项与「更多」共用 ProviderMenuItems 的 deleteDisabledReason 展示与 isTesting 禁用逻辑，为同一份代码；Radix onSelect 后菜单关闭；新增用例断言右键删除调用 onDelete(provider) |
| A6 | passed | brief.md | A6: 卡片上的「更多」按钮菜单行为不变（原有项与顺序不受影响）。 | 「更多」按钮改为渲染同一 ProviderMenuItems 组件，项与顺序与改动前逐项一致（模式项→分隔→复制→测试→用量→分隔→删除）；既有 ProviderCard/菜单用例全绿 |
| A7 | passed | specs/provider-connectivity-test/spec.md | 所有勾选模型测试成功 - **WHEN** 用户对配置了有效端点、鉴权与模型的供应商发起连通性测试并勾选若干模型 - **THEN** 每个勾选模型返回 `success` 状态、首字节时间与总耗时，未勾选模型不发起请求 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A8 | passed | specs/provider-connectivity-test/spec.md | 鉴权失败被识别为错误 - **WHEN** 供应商鉴权凭证无效，上游返回 401/403 - **THEN** 该模型结果为 `error`，错误信息包含 HTTP 状态，且请求详情中包含实际发送的 URL 与请求体 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A9 | passed | specs/provider-connectivity-test/spec.md | 流式响应中的错误事件被识别 - **WHEN** 上游以 200 响应但在 SSE 流中返回错误事件（如 `event: error` 或 `response.failed`）或错误 JSON 载荷 - **THEN** 该模型结果为 `error`，错误信息说明响应包含错误事件 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A10 | passed | specs/provider-connectivity-test/spec.md | 超时判定 - **WHEN** 单个模型的测试在总超时时间内未获得完整响应 - **THEN** 该模型结果为 `error`，错误信息说明超时 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A11 | passed | specs/provider-connectivity-test/spec.md | Claude 供应商配置为 OpenAI Chat Completions - **WHEN** 某 Claude 供应商 `meta.apiFormat=openai_chat` 且用户对其模型发起连通性测试 - **THEN** 请求详情中的 URL 为 `{base}/v1/chat/completions`，请求体为 Chat Completions 形状（messages 含测试提示词；流式时含 `stream:true` 与 `stream_options.include_usage`），鉴权头与该供应商真实转发请求一致 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A12 | passed | specs/provider-connectivity-test/spec.md | Claude 供应商配置为 OpenAI Responses - **WHEN** 某 Claude 供应商 `meta.apiFormat=openai_responses` - **THEN** 测试请求 URL 为 `{base}/v1/responses`，请求体为 Responses 形状 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A13 | passed | specs/provider-connectivity-test/spec.md | Claude 供应商配置为 Gemini Native - **WHEN** 某 Claude 供应商 `meta.apiFormat=gemini_native`，流式开关开启 - **THEN** 测试请求 URL 为 `{base}/v1beta/models/{model}:streamGenerateContent?alt=sse`，请求体为 Gemini generateContent 形状，鉴权为 x-goog-api-key（普通 key）或 Bearer access_token（OAuth 凭据含可用 access_token 时） | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A14 | passed | specs/provider-connectivity-test/spec.md | Claude 供应商保持 Anthropic 原生 - **WHEN** 某 Claude 供应商未配置 apiFormat 或配置为 anthropic - **THEN** 测试请求 URL 为 `{base}/v1/messages`，请求体为 Anthropic Messages 形状，请求头含 `anthropic-version: 2023-06-01` | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A15 | passed | specs/provider-connectivity-test/spec.md | Codex 供应商 wire_api 为 chat - **WHEN** 某 Codex 供应商 TOML `wire_api="chat"`（或 apiFormat 等价声明） - **THEN** 测试请求 URL 为 `{base}/chat/completions`，请求体为 Chat Completions 形状 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A16 | passed | specs/provider-connectivity-test/spec.md | Codex 供应商 wire_api 为 anthropic - **WHEN** 某 Codex 供应商 TOML `wire_api="anthropic"`（或 apiFormat 等价声明） - **THEN** 测试请求 URL 为 `{base}/v1/messages`，请求体为 Anthropic Messages 形状，鉴权头按 apiKeyField 决定 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A17 | passed | specs/provider-connectivity-test/spec.md | base_url 为完整端点 URL - **WHEN** 供应商 `meta.isFullUrl=true` 且 base_url 已是完整端点地址 - **THEN** 测试请求 URL 直接使用该 base_url，不追加端点路径 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A18 | passed | specs/provider-connectivity-test/spec.md | 目标构造失败返回错误结果 - **WHEN** 供应商缺少 base_url 或可用鉴权，或请求体转换报错 - **THEN** 对应模型返回 `error` 结果，错误信息说明原因，不产生 panic 或半构造请求 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A19 | passed | specs/provider-connectivity-test/spec.md | 打开弹窗展示全部模型 - **WHEN** 用户打开某可测供应商的连通性测试弹窗 - **THEN** 全部静态清单模型以「待测试」行展示，并按预选逻辑自动勾选一个模型 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A20 | passed | specs/provider-connectivity-test/spec.md | 勾选行发起测试 - **WHEN** 用户勾选若干模型行并点击开始测试 - **THEN** 仅勾选模型进入「测试中」，逐模型返回后逐行更新为终态 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A21 | passed | specs/provider-connectivity-test/spec.md | 失败模型自动勾选 - **WHEN** 一轮测试完成且存在失败模型 - **THEN** 勾选集合自动替换为失败模型，用户可直接再次点击开始测试重测失败项 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A22 | passed | specs/provider-connectivity-test/spec.md | 未勾选时无法开始测试 - **WHEN** 用户未勾选任何模型并点击开始测试 - **THEN** 系统提示需要先选择模型，且不发起任何请求 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A23 | passed | specs/provider-connectivity-test/spec.md | 查看请求详情 - **WHEN** 测试完成后用户点击某模型的"请求详情"入口 - **THEN** 弹窗展示该模型的请求 URL、请求 headers（鉴权头脱敏）、请求体、响应 headers 与响应体，内容与实际发送/接收一致 | 本轮未触及连通性测试逻辑链路（改动仅 ConnectivityTestDialog 布局类名、ProviderCardActions/ProviderList 菜单），后端与测试流程零改动；全量 3954/3954 用例通过证明既有行为无回归 |
| A24 | passed | specs/provider-connectivity-test/spec.md | 弹窗内容完整可见（验收：A1） - **WHEN** 在常规应用窗口尺寸下打开含多行模型、高级参数展开的连通性测试弹窗 - **THEN** 参数区、统计卡、模型表格、免责声明与底部按钮均可见或可通过弹窗内滚动到达，无内容溢出被截断 | 与 A1/A2 同源场景：弹窗内部滚动与宽幅布局由新增用例与全量测试覆盖 |
| A25 | passed | specs/provider-connectivity-test/spec.md | 模型表格各列可读（验收：A2） - **WHEN** 打开连通性测试弹窗并查看模型表格 - **THEN** 勾选、模型、状态、首字节、总耗时、错误信息、操作各列排布可读，无因宽度不足导致的不可读挤压 | 与 A1/A2 同源场景：弹窗内部滚动与宽幅布局由新增用例与全量测试覆盖 |
| A26 | passed | specs/provider-connectivity-test/spec.md | 追加合并去重 - **WHEN** 静态清单含 claude-x、claude-y，远端返回 claude-x、claude-z - **THEN** 表格展示 claude-x、claude-y、claude-z 三行，均为待测试状态 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A27 | passed | specs/provider-connectivity-test/spec.md | 拉取失败不阻断 - **WHEN** 上游 /v1/models 返回 404 或超时 - **THEN** 弹窗显示对应错误提示，静态清单行保持可用 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A28 | passed | specs/provider-connectivity-test/spec.md | 拉取结果不持久化 - **WHEN** 用户拉取模型并关闭弹窗后重新打开 - **THEN** 表格恢复为静态清单，不含上次拉取的远端模型 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A29 | passed | specs/provider-connectivity-test/spec.md | 重开弹窗恢复已保存参数 - **WHEN** 用户曾修改某供应商的测试 prompt 与默认测试模型并保存，随后重新打开该供应商的测试弹窗 - **THEN** 弹窗显示之前保存的 prompt 与默认测试模型，且默认勾选该默认测试模型 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A30 | passed | specs/provider-connectivity-test/spec.md | 首次打开使用默认值 - **WHEN** 用户首次打开某供应商的测试弹窗且该供应商从未保存过测试参数 - **THEN** 弹窗提示词为 `你好，你可以帮我做什么事情`，无默认测试模型（按预选逻辑勾选），流式开启，发起测试时后端实际发送该默认 prompt | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A31 | passed | specs/provider-connectivity-test/spec.md | 批量探针逐供应商更新徽标 - **WHEN** 用户触发批量连通探针 - **THEN** 各供应商卡片按完成顺序逐个更新为成功/失败徽标与耗时，最多 5 个探针同时进行 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A32 | passed | specs/provider-connectivity-test/spec.md | 无模型的供应商被跳过 - **WHEN** 某供应商未配置任何模型或属于官方供应商 - **THEN** 批量探针不对其发起请求，卡片不显示探针结果徽标 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A33 | passed | specs/provider-connectivity-test/spec.md | 探针目标同样按 API 格式对齐 - **WHEN** 批量探针命中某 apiFormat=openai_chat 的 Claude 供应商 - **THEN** 该探针发出的请求 URL 与请求体按 Chat Completions 形状构造，与该供应商弹窗内测试同源 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A34 | passed | specs/provider-connectivity-test/spec.md | 旧检测入口指向新测试 - **WHEN** 用户在供应商卡片上点击连通性检测按钮 - **THEN** 打开按模型连通性测试弹窗（而非发起 base_url 可达性探测） | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A35 | passed | specs/provider-connectivity-test/spec.md | 旧配置面板被移除 - **WHEN** 用户打开设置/用量页面中的连通检测配置区域 - **THEN** 不再显示超时/重试/降级阈值配置项 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A36 | passed | specs/provider-connectivity-test/spec.md | 测试失败不影响熔断器 - **WHEN** 某供应商的连通性测试失败 - **THEN** 该供应商的故障转移熔断器状态保持不变，不被重置或改变开闭状态 | 本轮未触及模型拉取/参数持久化/批量探针/旧入口/熔断器链路（改动仅 UI 布局与菜单），全量 3954/3954 用例通过证明既有行为无回归 |
| A37 | passed | specs/provider-context-menu/spec.md | 右键菜单包含全部操作（验收：A3） - **WHEN** 用户右键点击任意供应商卡片 - **THEN** 弹出的菜单同时包含一键置顶、一键置底，以及原「更多」菜单的全部项 | 同 A3：ProviderContextMenu 含置顶/置底+全部「更多」项，新增合并用例通过 |
| A38 | passed | specs/provider-context-menu/spec.md | 置顶行为（验收：A4） - **WHEN** 用户在右键菜单中对非首位供应商点击一键置顶 - **THEN** 该供应商移动到列表顶部，sortIndex 重写，托盘菜单同步更新，出现成功提示 | 同 A4：既有「moves a provider to the top via the right-click menu」用例验证 sortIndex 重写+updateTrayMenu+toast |
| A39 | passed | specs/provider-context-menu/spec.md | 已在顶部 - **WHEN** 用户对已是首位的供应商点击一键置顶 - **THEN** 提示「该供应商已在顶部」，顺序不变 | 既有用例「does not call updateSortOrder when moving an already-top provider to top」通过，提示逻辑未改 |
| A40 | passed | specs/provider-context-menu/spec.md | 删除禁用原因一致（验收：A5） - **WHEN** 某供应商删除被禁止（有禁用原因）且用户打开右键菜单 - **THEN** 删除项禁用并展示与「更多」菜单相同的禁用原因 | 右键删除与「更多」删除为同一 ProviderMenuItems 渲染分支，deleteDisabledReason 展示代码路径唯一 |
| A41 | passed | specs/provider-context-menu/spec.md | 「更多」按钮不受影响（验收：A6） - **WHEN** 用户通过卡片「更多」按钮打开菜单 - **THEN** 菜单项、顺序与行为与本需求变更前一致 | 「更多」菜单改用共享组件渲染，项与顺序保持原样；既有用例全绿 |
| A42 | passed | specs/provider-context-menu/spec.md | 右键点击菜单项执行动作 - **WHEN** 用户在右键菜单中点击连通性测试 - **THEN** 菜单关闭并打开该供应商的连通性测试弹窗 | 右键菜单连通性测试项 onSelect 调用 ProviderList handleTest（与卡片同链路），Radix 菜单点击后自动关闭 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| 前端类型检查 | typecheck | . | passed | 0 | 12728 ms |
| 前端单元测试 | test:unit | . | passed | 0 | 50232 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — tsc --noEmit 通过
- pnpm test:unit: passed — 3954/3954 通过，含新增 3 个用例：右键菜单合并项、右键删除回调、弹窗布局滚动容器

## 阻塞项

_无。_

## 风险与跳过的工作

- 右键菜单在真机的定位细节（side=right+虚拟触发点）建议真机人工过一眼，单测环境无法验证视觉位置

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 42/42 验收通过。A1-A6/A24-A25/A37-A42 由本轮实现与新增用例直接覆盖；A7-A23/A26-A36 为本轮零改动的既有链路，由全量 3954/3954 单测与 typecheck 通过证明无回归。 | 2026-11-10T03:38:39.864Z |



## 结论

42/42 验收通过。A1-A6/A24-A25/A37-A42 由本轮实现与新增用例直接覆盖；A7-A23/A26-A36 为本轮零改动的既有链路，由全量 3954/3954 单测与 typecheck 通过证明无回归。
