# Capability: claude-provider-model-quick-access

Claude 供应商编辑表单的模型配置直达区。

## 行为规格

### 默认兜底模型直达区

- 当 `shouldShowModelSelector` 为 true 时，在请求地址（EndpointField）之后、「高级选项」折叠区之前渲染「默认兜底模型」区块：
  - `ANTHROPIC_MODEL` 输入框（复用 renderModelInput，支持 OAuth 预设分支与获取到的模型列表下拉）；
  - 「1M」勾选框，控制 `ANTHROPIC_MODEL` 的 `[1M]` 标记；
  - 「一键设置」按钮：按 ANTHROPIC_MODEL → Sonnet → Opus → Fable → Haiku → Subagent 优先级取第一个非空值，写入全部模型角色（含 Subagent 与显示名称字段）；Haiku 剥离 `[1M]`；无任何可用值时禁用；
  - 「获取模型列表」按钮：按供应商类型（普通 / Copilot / Codex OAuth / xAI OAuth）拉取，结果由兜底输入与各角色行共享；
  - 兜底模型 hint 文案保持不变。
- 高级选项折叠区内不再渲染默认兜底模型区块及「一键设置」「获取模型列表」按钮。

### 区块头部按钮对齐

- 「默认兜底模型」区块头部行（承载 FormLabel 与「一键设置」「获取模型列表」按钮的容器）使用与输入行相同的网格 `grid grid-cols-1 gap-2 md:grid-cols-[1fr_minmax(0,104px)]`。
- 标签与两个按钮置于第一列（`1fr`）内，内部以 `flex items-center justify-between` 排布：标签在第一列左侧，按钮在第一列右侧。
- 第二列（`104px`）留空，使按钮所在第一列的右边缘与下方输入框（第一列）的右边缘对齐。
- md 及以上视口下，两个按钮的右边缘对齐到 `ANTHROPIC_MODEL` 输入框的右边缘，而非表单整行右边缘。
- 移动端（`grid-cols-1`）下，头部行第一列内部 `justify-between` 排布不变，响应式行为与改动前一致。
- 按钮尺寸（`size="sm"` / `h-7`）、图标、文案、禁用条件与 `onClick` 行为不受对齐调整影响。

### 声明支持 1M 的一键勾选

- 表头「声明支持 1M」的统计与切换范围 = Sonnet、Opus、Fable、Subagent、ANTHROPIC_MODEL（兜底模型）。
- Haiku 角色不参与 1M。
- 全部参与项带 `[1M]` 时表头为全选；部分带时为半选；点击表头按 `!allOneMEnabled` 统一设置或移除标记。

### 高级选项自动展开

- `hasAnyAdvancedValue` 不再计入 `ANTHROPIC_MODEL`；仅兜底模型有值时不自动展开高级选项。
- 其余自动展开条件（角色模型、认证字段非默认、UA、本地代理覆盖）保持不变。

## 不变量

- env 写入语义不变：空值删除键、`ANTHROPIC_SMALL_FAST_MODEL` 清理逻辑不变。
- 一键设置取值优先级不变。
- `useModelState` / `providerModelUtils` 读写语义不变。
- 对齐通过复用输入行网格实现，不引入硬编码像素留白。
