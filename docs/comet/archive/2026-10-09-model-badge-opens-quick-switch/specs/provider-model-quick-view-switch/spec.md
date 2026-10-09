# provider-model-quick-view-switch Specification

## Purpose

主页供应商卡片的模型快捷查看与切换：卡片名称右侧显示当前模型徽章（4 app），徽章本身即「模型快捷切换」入口——点击打开 ModelQuickSwitchDialog（拉取模型 → 搜索选择 → 一键应用到所有模型角色字段 → 可选 1M 标记；claude 支持不换模型仅翻转 1M 标记）。没有配置模型的供应商在同一位置渲染占位按钮，保留同一入口。

## Requirements

### Requirement: 卡片显示当前模型

供应商卡片名称右侧 SHALL 显示当前模型徽章（小字、可截断、title 提示全名）。解析规则：

- claude：`settingsConfig.env.ANTHROPIC_DEFAULT_SONNET_MODEL`，为空回退 `ANTHROPIC_MODEL`
- codex / grokbuild：settingsConfig.config（TOML）的顶层 `model` 字段
- gemini：`settingsConfig.env.GEMINI_MODEL`
- 其余 app（claude-desktop/opencode/openclaw/hermes/pi）SHALL 不显示徽章。

Claude 卡片在显示模型名的基础上，SHALL 额外标识当前主对话模型是否开启 1M：当 claude 当前主对话模型（`ANTHROPIC_DEFAULT_SONNET_MODEL`，空则回退 `ANTHROPIC_MODEL`）的原始 env 值以 `[1M]` 结尾（大小写不敏感）时，徽章 SHALL 在模型名后显示「1M」小标记；未开启时不显示。其余 3 个核心 app（codex/grokbuild/gemini）SHALL 不显示 1M 标记（1M 语义仅 claude 有）。

#### Scenario: Claude 卡片显示模型

- **WHEN** Claude app 的供应商设置了 ANTHROPIC_DEFAULT_SONNET_MODEL
- **THEN** 卡片名称右侧显示该模型名（不含 [1M] 后缀）

#### Scenario: Claude 卡片显示 1M 开启标记

- **WHEN** Claude app 的供应商 ANTHROPIC_DEFAULT_SONNET_MODEL 原始值为 "model-x[1M]"
- **THEN** 卡片名称右侧先显示模型名 "model-x"，其后追加显示「1M」小标记

#### Scenario: Claude 未开启 1M 不显示标记

- **WHEN** Claude app 的供应商 ANTHROPIC_DEFAULT_SONNET_MODEL 原始值为 "model-x"（无 [1M]）
- **THEN** 卡片名称右侧只显示模型名 "model-x"，不显示 1M 标记

#### Scenario: 非 claude app 不显示 1M 标记

- **WHEN** 查看 codex/grokbuild/gemini app 的供应商卡片模型徽章
- **THEN** 徽章只显示模型名，不显示 1M 标记

#### Scenario: 范围外 app 不显示

- **WHEN** 查看 pi/openclaw 等 app 的供应商卡片
- **THEN** 不显示模型徽章

### Requirement: 模型徽章是模型快捷切换入口

核心 4 app（claude/codex/gemini/grokbuild）的当前模型徽章 SHALL 本身是可点击的按钮，点击后打开 ModelQuickSwitchDialog。徽章 SHALL 满足：

- 使用原生 `button` 元素，可点击、可键盘聚焦，Enter / Space 可打开弹窗；
- 有可访问名称（aria-label，语义为「模型快捷切换」+ 供应商名，与卡片其他图标按钮的命名方式一致）；
- 有可感知的 hover / focus 反馈（如浅背景 + 下划线 + 手型光标）；
- 不改动徽章的信息展示语义：title 仍为完整模型说明（claude 三角色聚合、其余 app 模型名），长模型名仍可截断，1M 小标记仍按当前状态显示；
- 点击徽章 SHALL NOT 触发卡片其他交互（拖拽、打开网站链接、右键菜单）。

#### Scenario: 点击徽章打开弹窗

- **WHEN** 用户点击核心 4 app 供应商卡片名称右侧的当前模型徽章
- **THEN** 打开该供应商的 ModelQuickSwitchDialog，弹窗内容、行为与从其他入口打开时一致

#### Scenario: 键盘可打开

- **WHEN** 用户用 Tab 聚焦模型徽章后按 Enter 或 Space
- **THEN** 打开 ModelQuickSwitchDialog

#### Scenario: 徽章信息语义不变

- **WHEN** 查看 claude 供应商（三角色模型不同）的徽章
- **THEN** 徽章显示第一个角色模型名，title 为 "Opus: x / Sonnet: y / Haiku: z" 完整说明，长名可截断；开启 1M 时仍显示「1M」小标记

#### Scenario: 点击不触发其他卡片交互

- **WHEN** 用户点击模型徽章
- **THEN** 不触发卡片拖拽、不打开网站链接、不影响卡片右键菜单，仅打开弹窗

### Requirement: 无模型时渲染占位入口

核心 4 app 的供应商在当前模型为空（官方直连 `env: {}`、codex `config: ""` 等）时，SHALL 在徽章同一位置渲染占位按钮，点击后打开同一个 ModelQuickSwitchDialog。占位按钮 SHALL：

- 与徽章同一视觉位与同一交互形态（小字、可截断、hover/focus 反馈、原生 button、aria-label）；
- label 为「未设置模型」类文案（区别于有模型时的模型名）；
- 不显示 1M 小标记（无模型即无 1M 状态）。

其余 app（claude-desktop/opencode/openclaw/hermes/pi）SHALL 不渲染徽章，也不渲染占位按钮。

#### Scenario: 无模型时占位可点击

- **WHEN** Claude Official / Google Official / OpenAI Official 等官方直连供应商（模型字段为空）展示在卡片上
- **THEN** 卡片名称右侧显示占位按钮（「未设置模型」类文案），点击后打开 ModelQuickSwitchDialog

#### Scenario: 占位不显示 1M 标记

- **WHEN** 供应商模型为空，渲染占位按钮
- **THEN** 占位按钮只显示占位文案，不显示「1M」小标记

#### Scenario: 范围外 app 无占位

- **WHEN** 查看 pi/openclaw 等范围外 app 的供应商卡片
- **THEN** 既不显示模型徽章，也不显示占位按钮

### Requirement: 更多菜单不提供模型快捷切换

卡片右侧 ⋯ 更多菜单 SHALL NOT 包含「模型快捷切换」项。菜单项集合 SHALL 为：模式相关项（聚合页「设为默认」等）→ 复制 → 连通检测 → 配置用量查询 → 打开终端 → 删除；各项的显示条件与分隔线规则按既有逻辑执行。ProviderCardActions SHALL 不再接收模型快捷切换入口参数。

#### Scenario: 更多菜单不含模型快捷切换

- **WHEN** 用户打开核心 4 app 任一供应商卡片的 ⋯ 更多菜单
- **THEN** 菜单中不存在「模型快捷切换」项，也不存在该项的 Boxes 图标

#### Scenario: 其余菜单项不受影响

- **WHEN** 用户打开 ⋯ 更多菜单
- **THEN** 模式项、复制、连通检测、配置用量查询、打开终端、删除按各自显示条件正常展示，分隔线位置正确

### Requirement: 模型快捷切换弹窗

核心 4 app 的供应商卡片 SHALL 提供模型快捷切换弹窗（ModelQuickSwitchDialog）。弹窗 SHALL 包含：当前模型显示、拉取模型按钮（复用 fetchModelsForConfig，失败 toast 错误）、拉取成功后内嵌 SearchableModelPicker 搜索选择、"应用 1M 标记"开关（仅 claude 显示）、"保存"按钮。

「应用 1M 标记」开关（仅 claude）SHALL 在弹窗打开时反映供应商当前 1M 状态：当前主对话模型（SONNET 优先，回退 ANTHROPIC_MODEL）原始值以 `[1M]` 结尾时为开，否则为关。

保存按钮 SHALL 在以下情形可用（否则禁用）：

- 用户已选择某模型（4 app 通用）；
- claude 供应商：当前模型非空，且 1M 开关状态与供应商当前 1M 状态不一致（未选模型时的仅 1M 应用）。

弹窗层叠 SHALL 盖住应用顶部 header：弹窗内容与遮罩的 z-index SHALL 高于 header（header 为 z-50），使打开弹窗时顶部 `CC Switch` 品牌行不再透显在弹窗之上。

布局 SHALL 紧凑：弹窗最大宽度 SHALL 不超过 `max-w-sm`（约 24rem）；「当前模型」与「获取模型列表」按钮 SHALL 同处一行——当前模型在左、拉取按钮在右；拉取成功后的已选模型展示与搜索选择器在下一行展示。

#### Scenario: 拉取模型

- **WHEN** 用户在弹窗点击拉取模型（供应商已配置 baseURL+apiKey）
- **THEN** 调用 fetchModelsForConfig 获取列表，成功后显示搜索选择器；失败显示对应错误 toast

#### Scenario: 弹窗盖住顶部 header

- **WHEN** 用户打开模型快捷切换弹窗
- **THEN** 顶部 header（含 CC Switch 品牌行）被弹窗遮罩与弹窗内容盖住，不再透显在弹窗之上

#### Scenario: 当前模型与拉取按钮同行

- **WHEN** 弹窗打开
- **THEN** 「当前模型」标签与当前模型值在左侧，「获取模型列表」按钮紧随其右侧，二者位于同一行

#### Scenario: 1M 开关反映当前状态

- **WHEN** 供应商当前主对话模型原始值为 "model-x[1M]"，打开弹窗
- **THEN** 「应用 1M 标记」开关显示为开；供应商未开 1M 时打开弹窗，开关显示为关

#### Scenario: 选择模型后应用

- **WHEN** 用户选中某模型点击保存
- **THEN** 所选模型写入该供应商全部模型角色字段并保存（见写回 Requirement），弹窗关闭，卡片模型徽章与列表数据刷新

#### Scenario: 仅翻转 1M 不换模型

- **WHEN** claude 供应商当前模型非空、用户未选择新模型，把 1M 开关从关切到开后点击保存
- **THEN** 支持 1M 的模型字段原地追加 `[1M]`（见写回 Requirement），各角色模型 base 与显示名字段值保持不变，弹窗关闭并刷新；从开切到关时原地剥离 `[1M]`

#### Scenario: 无可应用变化时保存禁用

- **WHEN** claude 用户未选择模型且 1M 开关状态与供应商当前状态一致
- **THEN** 保存按钮禁用

### Requirement: 模型写回契约

应用 SHALL 按 app 写回（深拷贝不可变，原 settingsConfig 不被修改）：

- **claude（已选模型）**：`ANTHROPIC_DEFAULT_SONNET_MODEL`、`ANTHROPIC_DEFAULT_OPUS_MODEL`、`ANTHROPIC_DEFAULT_FABLE_MODEL`、`ANTHROPIC_MODEL`、`CLAUDE_CODE_SUBAGENT_MODEL` 写为所选模型；`ANTHROPIC_DEFAULT_HAIKU_MODEL` 写为所选模型（Haiku 不支持 1M）；1M 开关开启时 SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 追加 `[1M]` 后缀（HAIKU 不加）。四个 `*_MODEL_NAME` 显示名字段（SONNET/OPUS/FABLE/HAIKU）写为 strip [1M] 后的 base——仅当原显示名为空、等于旧模型 base 或等于旧 base[1M] 时覆盖，其余视为用户自定义名保留。
- **claude（未选模型，仅翻转 1M）**：对 `ANTHROPIC_DEFAULT_SONNET_MODEL`、`ANTHROPIC_DEFAULT_OPUS_MODEL`、`ANTHROPIC_DEFAULT_FABLE_MODEL`、`ANTHROPIC_MODEL`、`CLAUDE_CODE_SUBAGENT_MODEL` 原地设置/剥离 `[1M]` 标记（开=追加、关=剥离、幂等、空值保持为空）；`ANTHROPIC_DEFAULT_HAIKU_MODEL` 与四个 `*_MODEL_NAME` 显示名字段不变，各角色模型 base 不变。
- **codex / grokbuild**：config TOML 顶层 `model` 字段写为所选模型（setCodexModelName）。
- **gemini**：`env.GEMINI_MODEL` 写为所选模型。

保存 SHALL 通过 providersApi.update 完成并刷新 providers 查询缓存；仅 1M 生效路径 SHALL 给出区别于模型应用的 toast 文案（"已更新 1M 标记（模型保持不变）"语义）。

#### Scenario: Claude 一键应用含 1M

- **WHEN** Claude 供应商选中 model-x 且 1M 开关开启后应用
- **THEN** SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 字段为 "model-x[1M]"，HAIKU 为 "model-x"，四个显示名字段在可覆盖时为 "model-x"

#### Scenario: Claude 应用时 Haiku 显示名同步

- **WHEN** 供应商 env 含 ANTHROPIC_DEFAULT_HAIKU_MODEL="old-haiku" 与 ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME="old-haiku"，用户应用 model-x（1M 关）
- **THEN** ANTHROPIC_DEFAULT_HAIKU_MODEL 与 ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME 均为 "model-x"

#### Scenario: Claude 应用时保留自定义 Haiku 显示名

- **WHEN** ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME 为用户自定义值（非空且不等于旧 base / 旧 base[1M]）
- **THEN** 应用新模型后该显示名保持不变

#### Scenario: Claude 仅开 1M 保留角色差异

- **WHEN** 供应商 SONNET="model-a"、OPUS="model-b"（无 [1M]），用户未选模型把 1M 开关打开后保存
- **THEN** SONNET="model-a[1M]"、OPUS="model-b[1M]"，HAIKU 与显示名字段不变

#### Scenario: Claude 仅关 1M

- **WHEN** 供应商 SONNET="model-a[1M]"，用户未选模型把 1M 开关关闭后保存
- **THEN** SONNET="model-a"，HAIKU 与显示名字段不变

#### Scenario: Codex 应用

- **WHEN** Codex 供应商选中 model-y 后应用
- **THEN** config TOML 的 model = "model-y"，其余 TOML 字段不变

### Requirement: fork 专属目录与上游零影响

弹窗 SHALL 集中在 fork 专属目录 `src/components/providers/ModelQuickSwitch/`；卡片侧改动 SHALL 限于模型徽章渲染（含 1M 标记）、徽章/占位按钮作为入口、弹窗挂载与更多菜单项移除（均按 appId 守卫，仅核心 4 app）；模型字段读写工具 SHALL 为纯函数（可单测）。上游构建 SHALL 无行为变化（徽章/占位按钮/入口按 app 守卫渲染，4 app 之外零渲染）。

#### Scenario: 改动集中

- **WHEN** 检查本 change 改动文件
- **THEN** 新逻辑在 ModelQuickSwitch/ 目录与 providerModelUtils 工具；ProviderCard 仅模型徽章渲染（含 1M 标记）、徽章/占位按钮入口与弹窗挂载；ProviderCardActions 移除模型菜单项
