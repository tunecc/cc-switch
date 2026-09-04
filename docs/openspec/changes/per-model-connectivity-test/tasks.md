# 任务清单：按模型真实请求连通性测试

## 1. 后端：连通性测试服务与命令

- [x] 1.1 新增 `services/connectivity_test` 模块：类型定义（请求/结果/配置）、模型清单解析（modelCatalog → ANTHROPIC_MODEL / codex model 回退）、claude（/v1/messages）与 codex（/v1/responses）请求体构造、自定义 headers/body 浅合并
- [x] 1.2 实现直连探测执行：reqwest 请求、SSE 流读取（总超时 + 空闲超时）、first_byte_ms/total_ms 度量、错误识别（非 2xx、`event: error`、`response.failed`、错误 JSON、空响应）与单元测试
- [x] 1.3 新增命令 `connectivity_test_provider_models`（单供应商多模型并行/串行测试）与 `connectivity_probe_provider`（批量探针用的单模型探测），注册到 `lib.rs`，确认不写入网关/熔断状态
- [x] 1.4 测试参数持久化：`settings_config.connectivityTest` 字段读写（prompt/defaultTestModelId/stream/temperature/maxTokens/headers/body/timeoutSecs，缺省即默认值），复用供应商更新路径

## 2. 前端：连通性测试弹窗

- [x] 2.1 新增 `src/lib/api/connectivity-test.ts`（新命令绑定与类型）；新增 `useConnectivityTest` hook（测试执行、结果状态管理）
- [x] 2.2 新增测试弹窗组件（shadcn/ui）：模型多选/全选、prompt 输入、默认测试模型选择、流式开关、高级参数（temperature/maxTokens、自定义 headers/body JSON 编辑）
- [x] 2.3 结果表格与详情：逐模型状态（等待/运行中/成功/失败）、首字节/总耗时、汇总统计、请求详情子弹窗（URL/headers/请求体/响应）；实现"未选模型不可开始"与计费免责提示
- [x] 2.4 参数恢复：打开弹窗时读取已持久化的测试参数并恢复（含默认勾选默认测试模型），保存时写回供应商

## 3. 前端：批量探针徽标

- [x] 3.1 新增批量探针状态管理（并发度 5，逐供应商更新），官方供应商与无模型/动态端点供应商跳过
- [x] 3.2 新增 `ConnectivityBadge` 徽标组件（成功/失败/错误 + 耗时），接入 `ProviderList`/`ProviderCard`；列表头新增"批量检测"入口
- [x] 3.3 卡片原检测按钮（claude/codex）改为打开测试弹窗；其余应用隐藏检测入口

## 4. 移除旧可达性探测

- [x] 4.1 后端删除：`commands/stream_check.rs`、`services/stream_check.rs`、DB 中 stream check 配置/日志读写方法、`lib.rs` 命令注册（保留表结构）
- [x] 4.2 前端删除：`useStreamCheck.ts`、`connectivity-check.ts`、`ConnectivityCheckConfigPanel.tsx` 及其在设置/用量页的引用
- [x] 4.3 i18n 清理与新增：删除 `streamCheck.*` 与旧配置面板文案，新增连通性测试相关文案（zh、en、ja、zh-TW 四种语言）

## 5. 验证

- [ ] 5.1 编译与静态检查：`pnpm typecheck`/`cargo check`/`cargo clippy`、相关单测全绿
- [ ] 5.2 功能验证：真实/模拟供应商的弹窗测试（成功、401、流错误、超时场景）、参数持久化恢复、批量探针徽标、旧入口全部移除无残留引用