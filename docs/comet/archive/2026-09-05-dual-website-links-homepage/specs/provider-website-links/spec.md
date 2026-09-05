# provider-website-links Specification

## Purpose
为每个供应商提供最多两个官网链接的存储、编辑与主页展示能力：用户可为任意应用的供应商填写第一个与第二个官网链接；主页供应商卡片将已配置的官网链接横排显示在同一行（以两个空格分隔），点击任一链接经系统默认浏览器打开。第一个链接同时保留其既有用途（表单内「获取 API Key」链接来源）。

## Requirements

### Requirement: 供应商双官网链接数据模型
供应商实体 SHALL 支持两个可选的官网链接字段：`websiteUrl`（第一个，既有字段，语义不变）与 `websiteUrl2`（第二个，新增）。两个字段 MUST 独立持久化于 cc-switch 数据库 `providers` 表（列 `website_url`、`website_url_2`），不写入任何应用的 live 配置。字段为空时 MUST NOT 持久化为空字符串。

#### Scenario: 只填第一个链接
- **WHEN** 用户仅填写第一个官网链接并保存
- **THEN** 数据库中 `website_url` 为该值、`website_url_2` 为 NULL，行为与旧版本一致

#### Scenario: 两个字段均保存
- **WHEN** 用户填写两个官网链接并保存，重启应用后读取
- **THEN** 两个链接均从数据库恢复且互不覆盖

#### Scenario: 旧数据升级
- **WHEN** 仅含 `website_url` 的旧数据库升级到新 schema（v18 → v19）
- **THEN** 迁移幂等无损，旧数据不变，`website_url_2` 为 NULL

### Requirement: 编辑表单第二个官网链接输入框
所有应用的供应商编辑表单（claude / codex / gemini / opencode / openclaw / hermes / claude-desktop / pi / grokbuild 及统一供应商表单）SHALL 在现有「官网链接」输入框之外提供第二个官网链接输入框。第二链接为可选；非空时 MUST 通过与第一链接相同的 URL 校验；保存后重新打开编辑对话框时两个链接 MUST 各自回填。表单内「获取 API Key」链接 SHALL 继续使用第一个链接。

#### Scenario: 填写并保存第二个链接
- **WHEN** 用户在第二个官网链接输入框填入有效 URL 并保存
- **THEN** 保存成功，重新打开编辑对话框时两个输入框分别回填各自链接

#### Scenario: 第二链接校验
- **WHEN** 用户在第二个输入框填入非 URL 文本并提交
- **THEN** 表单校验失败并提示，与第一链接同语义

#### Scenario: 第二链接留空
- **WHEN** 用户清空第二个输入框并保存
- **THEN** 该字段不持久化（NULL/undefined），不影响第一链接

### Requirement: 主页卡片双链接横排展示
主页供应商卡片的 URL 展示行 SHALL 按现有优先级取值：备注（不可点击）→ 官网链接 → 提取的 API base URL → 「未配置接口地址」占位。取到官网链接档位时：

- 已配置的官网链接（第一个、第二个）SHALL 在同一行内横排展示，相邻两个链接之间 MUST 以两个空格分隔且空格可见（渲染不塌缩）。
- 仅第一个链接存在时只显示第一个；仅第二个存在时只显示第二个；两个都不存在时回退到 base URL / 占位（与现状一致）。
- 每个链接 SHALL 独立可点击：点击后调用现有外部打开链路（`openExternal`）以系统默认浏览器打开该链接自身的 URL。
- 链接超长时各自截断并保留 title 提示；整行保持单行布局，不撑破卡片。

#### Scenario: 两个链接横排展示
- **WHEN** 某供应商配置了两个官网链接且无备注
- **THEN** 卡片 URL 行横排显示两个链接，中间为两个可见空格；两个链接分别为独立可点击元素

#### Scenario: 点击第二个链接
- **WHEN** 用户点击卡片上的第二个链接
- **THEN** 系统默认浏览器打开第二个链接的 URL（非第一个）

#### Scenario: 备注优先级不变
- **WHEN** 某供应商同时配置了备注和两个官网链接
- **THEN** 卡片 URL 行显示备注（不可点击），与现状一致

#### Scenario: 无链接回退
- **WHEN** 某供应商两个官网链接均为空
- **THEN** 卡片展示提取的 API base URL 或占位文本，与现状一致

### Requirement: 附带通道同步
搜索过滤 SHALL 将两个官网链接均纳入匹配字段；复制供应商 SHALL 一并复制第二个链接；统一供应商生成 claude / codex / gemini 供应商时第二个链接 SHALL 随行复制。

#### Scenario: 按第二链接搜索
- **WHEN** 用户在搜索框输入某供应商第二个链接的片段
- **THEN** 该供应商出现在搜索结果中

#### Scenario: 复制供应商
- **WHEN** 用户复制配置了两个官网链接的供应商
- **THEN** 副本同时携带两个链接
