## Purpose

为供应商表单的模型选择提供搜索过滤与供应商分组能力。定义 SearchableModelPicker 组件契约（搜索、按 ownedBy 分组排序、当前值标记）与接入范围（ModelInputWithFetch 使用方 + Claude Copilot 分支）。

## ADDED Requirements

### Requirement: 模型选择器支持搜索过滤

模型选择下拉 SHALL 提供搜索输入框，用户输入关键词时按模型 id 与供应商名（ownedBy）实时过滤（大小写不敏感子串匹配）。无匹配时 SHALL 显示"未找到匹配模型"空态。

#### Scenario: 搜索过滤模型
- **WHEN** 用户在模型选择下拉的搜索框输入关键词
- **THEN** 列表仅显示 id 或供应商名包含该关键词（不区分大小写）的模型

#### Scenario: 无匹配空态
- **WHEN** 搜索关键词无任何匹配模型
- **THEN** 显示"未找到匹配模型"提示

### Requirement: 模型按供应商分组排序

模型列表 SHALL 按 ownedBy（供应商）分组显示，组名按字母排序，组内模型按 id 字母排序。ownedBy 为空时归入"Other"组。

#### Scenario: 分组展示
- **WHEN** 拉取到的模型含多个供应商（ownedBy）
- **THEN** 列表按供应商分组，组名与组内条目均字母排序，无供应商信息的模型归入 Other

### Requirement: 当前值标记

当前选中的模型 id SHALL 在下拉中以勾选标记（Check icon）标识。点击某模型条目 SHALL 回调 onSelect(model.id) 并关闭下拉。

#### Scenario: 当前值打勾
- **WHEN** 下拉打开且某模型 id 等于当前 value
- **THEN** 该条目显示勾选标记

#### Scenario: 选择并关闭
- **WHEN** 用户点击某模型条目
- **THEN** onSelect 回调收到该模型 id，下拉关闭

### Requirement: 接入范围

SearchableModelPicker SHALL 接入：`ModelInputWithFetch`（有模型数据时的下拉）与 `ClaudeFormFields` 的 Copilot 分支。ModelDropdown 组件与其余表单的直接引用 SHALL 保持不变（本 change 不动，留后续增量）。

#### Scenario: ModelInputWithFetch 下拉可搜索
- **WHEN** 普通供应商拉取模型成功后点击模型输入旁的下拉按钮
- **THEN** 显示可搜索的分组列表（SearchableModelPicker）

#### Scenario: 其余表单不变
- **WHEN** 打开 Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop 表单的模型下拉
- **THEN** 仍为原 ModelDropdown 行为（本 change 范围外）

### Requirement: i18n 支持

组件 SHALL 使用 i18n key `providerForm.searchModels`（搜索占位文案）与 `providerForm.noModelsFound`（无匹配空态文案），4 个 locale（zh/en/ja/zh-TW）均 SHALL 有翻译。

#### Scenario: 四语言文案存在
- **WHEN** 检查 4 个 locale 文件的 providerForm 段
- **THEN** searchModels 与 noModelsFound 均有非空翻译
