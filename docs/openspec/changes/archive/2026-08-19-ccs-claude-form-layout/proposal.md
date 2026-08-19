## Why

fork 版 Claude Code 供应商配置表单中，"上游格式"选择器目前放在"高级选项"折叠面板内的第一项，用户需要先展开高级选项才能切换格式；而它实际与"请求地址"（EndpointField）强相关（格式决定 URL 拼接与转换行为），应紧邻请求地址可见。同时，模型映射的"声明支持 1M"列需逐行手动勾选，常用场景（所有支持 1M 的角色一键全开）操作繁琐。

## What Changes

- **上游格式选择移位**：将 `ClaudeFormFields.tsx` 中"上游格式"（apiFormat）Select 从高级选项折叠面板（CollapsibleContent 内第一项）移到请求地址（EndpointField）右边——在 EndpointField 同一行右侧放一个紧凑的 apiFormat Select（显示条件与现有一致：`category !== "cloud_provider" && !isXaiOauthPreset`）。高级选项内原位置的 Select、FormLabel 与 apiFormatHint 长说明文字**整体移除**（老用户无需说明书，不保留）。EndpointField 的 hint（按 apiFormat 变化的 apiHint* 短提示）行为不变。
- **1M 一键全选**：模型映射表头"声明支持 1M"列（`modelOneMHeader`）旁加一个 Checkbox（或"全选"小勾），点击后把所有 `supportsOneM: true` 的角色行的 1M 勾全部点上（对每行调用 `setClaudeOneMMarker(row.model, true)`）；再次点击取消全部 1M 标记。表头勾的选中态反映"所有可 1M 行均已勾选"（全选/部分/全不选三态）。
- **上游构建零影响**：两项改动为表单布局/交互优化，不引入 IS_FORK_BUILD 守卫（上游同样受益，rebase 时作为 fork 对 ClaudeFormFields.tsx 的改动保留）。但为了便于同步上游，改动尽量集中、不重构周边代码。

## Capabilities

### New Capabilities
- `claude-form-layout`: Claude 供应商配置表单的布局契约：上游格式选择器紧邻请求地址（无长说明文字）；模型映射 1M 列支持表头一键全选/取消。

### Modified Capabilities
<!-- 无既有 spec 需修改。 -->

## Impact

- **改动文件**：`src/components/providers/forms/ClaudeFormFields.tsx`（apiFormat Select 移位 + 1M 表头全选勾）；可能 `src/components/providers/forms/shared/EndpointField.tsx`（若选择把 Select 放进 EndpointField 的 props 扩展，design 决定：推荐不动 EndpointField，在 ClaudeFormFields 内用 flex 布局并排）。
- **i18n**：新增 `providerForm.modelOneMToggleAll`（全选勾的 aria-label/title）等 key（zh/en 必补，ja/zh-TW 可选）。
- **依赖**：无新依赖；复用现有 Select/Checkbox/setClaudeOneMMarker。
- **风险**：apiFormat Select 移位后高级选项展开态判定（`hasAnyAdvancedValue` 含 `apiFormat !== "anthropic"` 条件）行为需调整——格式选择已不在高级选项内，该条件可移除（非默认格式不再强制展开高级选项）；窄屏下 EndpointField 行内 Select 的响应式布局。
