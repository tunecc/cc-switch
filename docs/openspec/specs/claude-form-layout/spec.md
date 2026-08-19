# claude-form-layout Specification

## Purpose
定义 Claude 供应商配置表单的布局契约：上游格式选择器紧邻请求地址（不附带长说明文字）；模型映射"声明支持 1M"列支持表头一键全选/取消。
## Requirements
### Requirement: 上游格式选择器紧邻请求地址

Claude 供应商配置表单中，"上游格式"（apiFormat）Select SHALL 显示在请求地址（EndpointField）输入行的右侧（同排并显），显示条件保持 `category !== "cloud_provider" && !isXaiOauthPreset`。高级选项折叠面板内 SHALL NOT 再出现 apiFormat Select、其 FormLabel 及 apiFormatHint 长说明文字。EndpointField 的动态短提示（apiHint*，随所选格式联动）行为保持不变。

#### Scenario: apiFormat Select 显示在请求地址右侧
- **WHEN** 打开 Claude 供应商配置表单且 category 不是 cloud_provider、非 xAI OAuth 预设
- **THEN** 请求地址输入行右侧并排显示上游格式 Select

#### Scenario: 云服务商/xAI OAuth 不显示
- **WHEN** category 为 cloud_provider 或预设为 xAI OAuth
- **THEN** 请求地址右侧不显示上游格式 Select（与现有显示条件一致）

#### Scenario: 高级选项内无格式选择
- **WHEN** 展开高级选项折叠面板
- **THEN** 面板内不再出现上游格式 Select 与长说明文字

### Requirement: 1M 列表头一键全选

模型映射表头"声明支持 1M"列 SHALL 提供一个全选 Checkbox。点击勾选时，所有 `supportsOneM: true` 的角色行（sonnet/opus/fable/subagent）SHALL 全部标记 1M（`setClaudeOneMMarker(row.model, true)`）；再次点击取消时全部移除 1M 标记。`supportsOneM: false` 的行（haiku）SHALL 不受影响。全选勾的显示态 SHALL 反映三态：全部可 1M 行已勾选 → checked；部分勾选 → indeterminate；均未勾选 → unchecked。

#### Scenario: 一键全选
- **WHEN** 模型映射至少一个可 1M 角色未勾选 1M，用户点击表头全选勾
- **THEN** 所有 supportsOneM 行的 1M 标记全部加上

#### Scenario: 一键取消
- **WHEN** 所有可 1M 角色均已勾选 1M，用户再次点击表头全选勾
- **THEN** 所有 supportsOneM 行的 1M 标记全部移除

#### Scenario: 部分勾选显示半选态
- **WHEN** 部分 supportsOneM 行已勾选 1M，部分未勾
- **THEN** 表头全选勾显示 indeterminate 态

#### Scenario: 不支持 1M 的行不受影响
- **WHEN** 点击表头全选勾
- **THEN** haiku 行（supportsOneM: false）模型值不变

### Requirement: 上游构建零影响

本 change 的两项改动 SHALL 不引入 `IS_FORK_BUILD` 守卫（纯表单布局/交互优化，上游同样受益）。改动 SHALL 集中在 `ClaudeFormFields.tsx` 与必要 i18n key，不重构周边代码，便于 rebase 上游时保留。

#### Scenario: 无 fork 守卫依赖
- **WHEN** 检查本 change 改动
- **THEN** 不 import IS_FORK_BUILD/filterForkPresets，改动对上游构建同样生效

