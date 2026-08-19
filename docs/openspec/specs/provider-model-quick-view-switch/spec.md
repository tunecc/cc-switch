# provider-model-quick-view-switch Specification

## Purpose
主页供应商卡片的模型快捷查看与切换：卡片名称右侧显示当前模型徽章（4 app）；悬停操作加"模型"按钮打开快捷切换弹窗（拉取模型 → 搜索选择 → 一键应用到所有模型角色字段 → 可选 1M 标记）。
## Requirements
### Requirement: 卡片显示当前模型

供应商卡片名称右侧 SHALL 显示当前模型徽章（小字、可截断、title 提示全名）。解析规则：
- claude：`settingsConfig.env.ANTHROPIC_DEFAULT_SONNET_MODEL`，为空回退 `ANTHROPIC_MODEL`
- codex / grokbuild：settingsConfig.config（TOML）的顶层 `model` 字段
- gemini：`settingsConfig.env.GEMINI_MODEL`
- 其余 app（claude-desktop/opencode/openclaw/hermes/pi）SHALL 不显示徽章。模型为空（官方供应商未设模型）时 SHALL 不渲染徽章。

#### Scenario: Claude 卡片显示模型
- **WHEN** Claude app 的供应商设置了 ANTHROPIC_DEFAULT_SONNET_MODEL
- **THEN** 卡片名称右侧显示该模型名（不含 [1M] 后缀）

#### Scenario: 空模型不显示
- **WHEN** 供应商所有模型字段均空（如官方直连）
- **THEN** 卡片不显示模型徽章

#### Scenario: 范围外 app 不显示
- **WHEN** 查看 pi/openclaw 等 app 的供应商卡片
- **THEN** 不显示模型徽章

### Requirement: 模型快捷切换弹窗

核心 4 app 的供应商卡片 SHALL 提供"模型"操作按钮，打开 ModelQuickSwitchDialog 弹窗。弹窗 SHALL 包含：当前模型显示、拉取模型按钮（复用 fetchModelsForConfig，失败 toast 错误）、拉取成功后内嵌 SearchableModelPicker 搜索选择、"应用 1M 标记"开关（仅 claude 显示，默认关）、"应用"按钮（选择模型后可用）。

#### Scenario: 拉取模型
- **WHEN** 用户在弹窗点击拉取模型（供应商已配置 baseURL+apiKey）
- **THEN** 调用 fetchModelsForConfig 获取列表，成功后显示搜索选择器；失败显示对应错误 toast

#### Scenario: 选择模型后应用
- **WHEN** 用户选中某模型点击应用
- **THEN** 所选模型写入该供应商全部模型角色字段并保存（见写回 Requirement），弹窗关闭，卡片模型徽章与列表数据刷新

### Requirement: 模型写回契约

应用所选模型 SHALL 按 app 写回：
- **claude**：`ANTHROPIC_DEFAULT_SONNET_MODEL`、`ANTHROPIC_DEFAULT_OPUS_MODEL`、`ANTHROPIC_DEFAULT_FABLE_MODEL`、`ANTHROPIC_MODEL`、`CLAUDE_CODE_SUBAGENT_MODEL` 写为所选模型；`ANTHROPIC_DEFAULT_HAIKU_MODEL` 写为所选模型（Haiku 不支持 1M）；1M 开关开启时 SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 追加 `[1M]` 后缀（HAIKU 不加）；三个 `*_MODEL_NAME` 显示名字段写为 strip [1M] 后的 base（仅当原显示名与旧模型 base 相同或为空时覆盖，避免破坏自定义显示名）。
- **codex / grokbuild**：config TOML 顶层 `model` 字段写为所选模型（setCodexModelName）。
- **gemini**：`env.GEMINI_MODEL` 写为所选模型。
保存 SHALL 通过 providersApi.update 完成并刷新 providers 查询缓存；settingsConfig 更新 SHALL 不可变（深拷贝）。

#### Scenario: Claude 一键应用含 1M
- **WHEN** Claude 供应商选中 model-x 且 1M 开关开启后应用
- **THEN** SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 字段为 "model-x[1M]"，HAIKU 为 "model-x"，显示名字段为 "model-x"

#### Scenario: Codex 应用
- **WHEN** Codex 供应商选中 model-y 后应用
- **THEN** config TOML 的 model = "model-y"，其余 TOML 字段不变

### Requirement: fork 专属目录与上游零影响

新组件 SHALL 集中在 fork 专属目录 `src/components/providers/ModelQuickSwitch/`；ProviderCard.tsx 的改动 SHALL 限于模型徽章渲染、模型按钮与弹窗挂载（按 appId 守卫，仅核心 4 app）；模型字段读写工具 SHALL 为纯函数（可单测）。上游构建 SHALL 无行为变化（徽章/按钮按 app 守卫渲染，4 app 之外零渲染）。

#### Scenario: 改动集中
- **WHEN** 检查本 change 改动文件
- **THEN** 新逻辑在 ModelQuickSwitch/ 目录与 providerModelUtils 工具；ProviderCard 仅两处注入点

