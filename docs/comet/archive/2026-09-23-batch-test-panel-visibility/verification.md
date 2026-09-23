---
generated_from_state_version: 8
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-09-23T03:39:11.471Z
- 摘要: 批量检测顶栏入口已接入可见性开关：设置可写入并高亮 batchTest；缺字段时前后端默认 true；false 隐藏按钮并 stopProbe 清除 waiting/running；非 claude/codex 因 shouldShowTestEntry 不显示。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1 设置开关：设置页「侧边面板」开关组出现「批量检测」，与其余开关同一交互；点按后写入 `visibleSidebarPanels.batchTest` 并切换高亮状态。 | AppVisibilitySettings 有 SidebarPanelButton：active={visibleSidebarPanels.batchTest}，onClick 调 handleSidebarToggle("batchTest") 翻转该字段并 onChange 写入，variant 随 active 在 default 与 ghost 之间切换。 |
| A2 | passed | brief.md | A2 默认显示：未配置 `visibleSidebarPanels`，或已保存数据缺少 `batchTest` 字段时，claude/codex 供应商视图顶栏的批量检测按钮仍显示。 | DEFAULT_VISIBLE_SIDEBAR_PANELS.batchTest 为 true；App 用默认值与 settings 合并，缺字段仍为 true。后端 batch_test 使用 serde default_true 且 Default 为 true。claude/codex 时 shouldShowTestEntry 为 true，顶栏按钮仍显示。 |
| A3 | passed | brief.md | A3 隐藏入口：`batchTest` 为 false 时，顶栏批量检测按钮不渲染；其余面板按钮不受影响；`batchTest` 为 true 且应用支持测试时按钮显示。 | 非 hermes/openclaw 分支按钮条件为 showBatchTestEntry（shouldShowTestEntry 且 batchTest）；skills/sessions/mcp/prompts 各自看自身开关。false 不渲染，true 且支持时显示。 |
| A4 | passed | brief.md | A4 隐藏即停止：批量探测正在进行时把 `batchTest` 设为 false，正在进行的探测停止。 | useEffect 在入口隐藏且探测进行中时调用 stopProbe。stopProbe 推进代次并丢弃 waiting/running，只保留已完成项。 |
| A5 | passed | brief.md | A5 能力守卫仍在：gemini 等不支持批量测试的应用，无论 `batchTest` 取何值，顶栏都不出现批量检测按钮。 | shouldShowTestEntry 仅对 claude/codex 返回 true。其余应用 showBatchTestEntry 为 false，顶栏按钮不出现。ProviderCard 未引用 batchTest。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| 侧边面板批量检测开关测试 | exec vitest run tests/components/AppVisibilitySettings.test.tsx | . | passed | 0 | 1493 ms |
| 前端类型检查 | exec tsc --noEmit | . | passed | 0 | 8270 ms |
| 旧设置缺 batchTest 回退 true | test --manifest-path src-tauri/Cargo.toml --lib settings::tests::visible_sidebar_panels_missing_batch_test_defaults_true -- --exact | . | passed | 0 | 256 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm exec vitest run tests/components/AppVisibilitySettings.test.tsx: passed — 1 passed
- pnpm exec tsc --noEmit: passed — 无输出
- cargo test settings::tests::visible_sidebar_panels_missing_batch_test_defaults_true: passed — 1 passed
- 已知限制: A4 隐藏即停止与 A5 能力守卫叠加没有组件级测试，靠 App.tsx 中 showBatchTestEntry 条件与 effect 实现。
- 已知限制: 未启动桌面应用做手工点击验收。

## 阻塞项

_无。_

## 风险与跳过的工作

_未报告风险。_

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 批量检测顶栏入口已接入可见性开关：设置可写入并高亮 batchTest；缺字段时前后端默认 true；false 隐藏按钮并 stopProbe 清除 waiting/running；非 claude/codex 因 shouldShowTestEntry 不显示。 | 2026-09-23T03:39:11.471Z |



## 结论

批量检测顶栏入口已接入可见性开关：设置可写入并高亮 batchTest；缺字段时前后端默认 true；false 隐藏按钮并 stopProbe 清除 waiting/running；非 claude/codex 因 shouldShowTestEntry 不显示。
