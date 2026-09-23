# Outcome

用户可以在「设置 → 应用可见性 → 侧边面板」里，像隐藏 Skills / 会话记录 / MCP / 提示词一样，单独隐藏主页顶栏右侧的「批量检测」入口。未配置或旧数据缺少该字段时，批量检测入口保持现状（显示）。

# Scope

- 侧边面板开关组新增「批量检测」开关，与现有四个开关同一排、同一交互（点按切换高亮/灰显）。
- `visibleSidebarPanels` 新增 `batchTest` 布尔字段，前后端默认 `true`；旧数据缺字段时回退 `true`。
- 主页供应商视图顶栏右侧的批量检测按钮，在现有 `shouldShowTestEntry(activeApp)` 之上再叠加 `visibleSidebarPanels.batchTest`。关闭后按钮不渲染，正在进行的批量探测停止。
- 四种语言（zh / zh-TW / en / ja）补齐该开关文案。

# Non-goals

- 不改供应商卡片上单个供应商的连通性测试按钮。
- 不改批量探测本身的行为、范围、结果展示。
- 不给 hermes / openclaw 专属顶栏分支加批量检测按钮（它们现在没有这个入口）。
- 不改变 Skills / 会话 / MCP / 提示词四个开关的现有行为。

# Acceptance examples

- A1 设置开关：设置页「侧边面板」开关组出现「批量检测」，与其余开关同一交互；点按后写入 `visibleSidebarPanels.batchTest` 并切换高亮状态。
- A2 默认显示：未配置 `visibleSidebarPanels`，或已保存数据缺少 `batchTest` 字段时，claude/codex 供应商视图顶栏的批量检测按钮仍显示。
- A3 隐藏入口：`batchTest` 为 false 时，顶栏批量检测按钮不渲染；其余面板按钮不受影响；`batchTest` 为 true 且应用支持测试时按钮显示。
- A4 隐藏即停止：批量探测正在进行时把 `batchTest` 设为 false，正在进行的探测停止。
- A5 能力守卫仍在：gemini 等不支持批量测试的应用，无论 `batchTest` 取何值，顶栏都不出现批量检测按钮。

# Constraints and invariants

- 默认值必须为显示，避免升级后已有用户的顶栏入口消失。
- 隐藏只作用于顶栏入口，不改变卡片内单个供应商的测试入口。
- 后端 `VisibleSidebarPanels` 用 `serde(default = "default_true")` 承接旧数据。

# Decisions

- D1 字段名用 `batchTest`，文案沿用现有 i18n `provider.batchConnectivityTest`（批量检测 / Batch test / 一括テスト / 批量檢測）。
- D2 隐藏时正在进行的批量探测停止，而不是让它在后台跑完。
- D3 这是新的用户可见能力，不并入现有 provider-connectivity-test 规格。

# Open questions

- 无。默认显示、隐藏时停止进行中的探测、不影响卡片内单供应商测试入口，均已按现有行为推断并写入 Decisions。

# Verification expectations

- 前端类型检查与相关组件/设置测试通过。
- Rust `cargo check`（或项目既有设置序列化测试）确认旧 JSON 缺 `batchTest` 时反序列化为 true。
