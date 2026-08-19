# Comet Design Handoff

- Change: ccs-home-model-display
- Phase: design
- Mode: compact
- Context hash: 7799a2ef03d949727eda21d5d9979487fae60ac8b8a649e0cf0116f3b7ebd14e

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-home-model-display/proposal.md

- Source: docs/openspec/changes/ccs-home-model-display/proposal.md
- Lines: 1-39
- SHA256: 61de28f2611691f9dee1aa50ac7328a393ef6dccdc674cec76300a6c0b8f1b73

```md
## Why

fork 主页供应商卡片目前只显示供应商名称与徽章，看不到当前用的模型，需要进编辑表单才能看/改模型。用户日常高频操作是"换模型"（同一供应商内切换模型），当前流程（编辑 → 高级选项 → 逐字段改）太重。需要在主页直接：看模型、拉取模型、一键把所选模型应用到所有角色字段（含可选 1M 标记）。

## What Changes

- **主页卡片显示当前模型**：`ProviderCard.tsx` 供应商名称右侧显示当前模型小字徽章（`text-xs text-muted-foreground` 截断样式）。模型解析按 app：
  - claude：`settingsConfig.env.ANTHROPIC_DEFAULT_SONNET_MODEL`（回退 `ANTHROPIC_MODEL`）
  - codex / grokbuild：TOML `config` 的 `model = "..."`（复用 `extractCodexModelName`）
  - gemini：`settingsConfig.env.GEMINI_MODEL`
  - 其余 app 不显示（范围外）
- **模型快捷切换弹窗**：`ProviderCard` 的悬停操作区（ProviderActions 旁或卡片角标）加"模型"按钮，点开 `ModelQuickSwitchDialog`：
  1. 显示当前模型与供应商 baseURL/apiKey
  2. "拉取模型"按钮（复用 `fetchModelsForConfig`，含错误 toast）
  3. 拉取后内嵌 `SearchableModelPicker`（复用 change #4 移植组件）选择模型
  4. "应用 1M 标记"开关（默认关，仅 claude 显示；开则写入时对支持 1M 的角色模型追加 `[1M]`，复用 `setClaudeOneMMarker` 语义）
  5. "应用"按钮：把所选模型写入该 provider 的所有模型角色字段并保存：
     - claude：`ANTHROPIC_DEFAULT_SONNET/OPUS/FABLE/HAIKU_MODEL` + `ANTHROPIC_MODEL` + `CLAUDE_CODE_SUBAGENT_MODEL`（HAIKU/SUBAGENT 不加 [1M]，其余按开关）+ 对应 `*_MODEL_NAME` 显示名（strip [1M] 后的 base）
     - codex / grokbuild：`setCodexModelName(config, model)` 重写 TOML（单模型字段）
     - gemini：`env.GEMINI_MODEL = model`
  6. 保存走 `providersApi.update(provider, appId)`，成功后 invalidate providers 查询缓存
- **仅当前使用的 provider？**：不限制——所有卡片都可切换（未激活的供应商改配置同样有意义）。
- **上游构建零影响**：此为 fork 专属功能。为便于同步上游，新组件集中在 `src/components/providers/ModelQuickSwitch/`（fork 专属目录），ProviderCard 的侵入点仅两处（模型徽章 + 按钮），其余改动零散度低。

## Capabilities

### New Capabilities
- `provider-model-quick-view-switch`: 主页供应商卡片的模型快捷查看与切换。定义模型徽章展示契约（4 app 字段解析）、快捷切换弹窗交互（拉取/搜索选择/一键应用所有角色/1M 标记开关）与写回契约。

### Modified Capabilities
<!-- 无。 -->

## Impact

- **新增**：`src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`（弹窗）；可能的字段解析工具 `src/utils/providerModelUtils.ts`（4 app 读/写模型字段，纯函数可单测）。
- **改动**：`src/components/providers/ProviderCard.tsx`（模型徽章 + 切换按钮 + 弹窗挂载）。
- **复用**：`fetchModelsForConfig`（拉取）、`SearchableModelPicker`（选择）、`extractCodexModelName`/`setCodexModelName`（TOML 读写）、`setClaudeOneMMarker`/`stripClaudeOneMMarker`/`hasClaudeOneMMarker`（1M 语义）、`providersApi.update`（保存）。
- **i18n**：`providerModel.*` 段（zh/en 必补，ja/zh-TW 一并补齐保持一致）。
- **风险**：写回 `settingsConfig` 需深拷贝不可变更新；1M 标记写入需与表单编辑语义一致（[1M] 后缀 + *_MODEL_NAME 存 base）；ProviderCard 被多 app 列表复用，按钮/徽章渲染需按 appId 守卫（仅 4 app 显示）。

```

## docs/openspec/changes/ccs-home-model-display/design.md

- Source: docs/openspec/changes/ccs-home-model-display/design.md
- Lines: 1-50
- SHA256: eae8fde1f274b07090d7b8adc0c92e1877636ba81d0bdbb51916ea7493518d51

```md
## Context

ProviderCard.tsx（约 500 行）是全 app 共用的卡片组件，名称行在 426-435 行（h3 后跟徽章 span 序列）。providersApi.update(provider, appId) 已有。模型字段：claude JSON env（useModelState 已定义全部字段名）、codex/grokbuild TOML config（extractCodexModelName/setCodexModelName 既有）、gemini env.GEMINI_MODEL。SearchableModelPicker（change #4）已可用于选择。1M 语义 setClaudeOneMMarker/strip/has 已有。

## Goals / Non-Goals

**Goals:** 4 app 卡片模型徽章；主页快捷切换弹窗（拉取/搜索/一键应用/1M 开关）；改动集中 fork 专属目录；纯函数工具可单测。
**Non-Goals:** 范围外 app 的模型显示/切换；表单内改动（change #3/#4 已做）；代理/切换供应商逻辑；不新增后端命令（纯前端 invoke 既有 API）。

## Decisions

### D1: 字段读写工具纯函数化 `src/utils/providerModelUtils.ts`
- `getCurrentModel(appId, settingsConfig): string`——4 app 解析（claude: SONNET→ANTHROPIC_MODEL 回退；codex/grokbuild: extractCodexModelName；gemini: GEMINI_MODEL），返回 strip [1M] 的 base
- `applyModelToSettings(appId, settingsConfig, model, opts: { withOneM?: boolean }): settingsConfig`——不可变写回（结构化深拷贝 JSON.parse(JSON.stringify) 或手写浅拷贝各层），1M 开关仅 claude 生效
- 显示名覆盖条件：`*_MODEL_NAME` 为空或等于旧模型 base（或旧 base+[1M]）时才写新 base，否则保留用户自定义名
- vitest 单测覆盖 4 app 读/写 + 1M 分支 + 显示名条件（新测试文件 providerModelUtils.test.ts）

### D2: 弹窗组件 `ModelQuickSwitchDialog`
- props：`{ provider, appId, open, onOpenChange }`
- 内部：拉取状态/结果（fetchModelsForConfig，claude 需从 settingsConfig.env 提取 ANTHROPIC_BASE_URL+ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY；codex/grokbuild 从 TOML 提取 base_url（extractCodexBaseUrl 已有）+ auth.OPENAI_API_KEY/bearer；gemini env.GOOGLE_GEMINI_BASE_URL+GEMINI_API_KEY）——探测各 app 凭据字段为空时拉取按钮禁用并提示
- 1M 开关：Switch 组件，仅 appId === "claude" 渲染，默认关
- 保存：`providersApi.update({ ...provider, settingsConfig: applyModelToSettings(...) }, appId)` + `queryClient.invalidateQueries(["providers", appId])`（确认 ProviderList 用的查询 key，实施时对齐）
- 成功 toast；失败 toast 错误

### D3: ProviderCard 注入点最小化
- 徽章：名称行 h3 后加 `{modelBadge}`（appId 守卫 4 app + 非空），样式仿现有 OMO 徽章（更弱化：`bg-muted text-muted-foreground`）
- 按钮：卡片悬停操作区（与 ProviderActions 同排或 ProviderActions 内加项）加"模型"图标按钮（Zap/Boxes icon），onClick 开弹窗；按 appId 守卫
- 弹窗挂载：卡片根内 `{dialog}`，state 提升到 ProviderCard 内部（useState open）——不改 ProviderList 接口

### D4: 与代理接管/激活状态的关系
不限制激活/接管状态——写配置即可，切换供应商时生效（与表单编辑语义一致）。正在接管的 Live 配置由后端同步逻辑处理（与表单保存同路径）。

### D5: i18n
`providerModel.*`：title（模型快捷切换）、currentModel、fetchModels（复用 providerForm.fetchModels 已有 key 则不重复）、apply、applyOneM（"应用 1M 标记"）、fetchFailed、applied（"已切换模型"）、noCredentials（"请先在编辑表单配置 API Key 与请求地址"）。zh/en/ja/zh-TW 四语言齐补。

## Risks / Trade-offs

- 写回破坏 TOML 格式 → setCodexModelName 既有 round-trip 语义，工具单测覆盖
- 显示名覆盖破坏自定义名 → D1 条件覆盖仅保守路径 + 单测
- ProviderCard 多 app 复用回归 → appId 守卫 + 987 既有测试 + 手动巡检范围外 app 不变
- invalidateQueries key 不对 → 实施时读 ProviderList/queries 实际 key 对齐
- 凭据缺失拉取 400 → D2 预检禁用+提示

## Migration Plan

feat/home-model-display 分支实施，dev:fork 巡检 4 app（拉取/切换/1M）+ 范围外 app 不变。回滚删分支。

## Open Questions

无。

```

## docs/openspec/changes/ccs-home-model-display/tasks.md

- Source: docs/openspec/changes/ccs-home-model-display/tasks.md
- Lines: 1-29
- SHA256: 891298e9b7d7cafe597e672f705bcb014db39294a40645d7551c26ec88b108c8

```md
## 1. 模型字段读写工具（纯函数 + 单测）

- [ ] 1.1 新增 `src/utils/providerModelUtils.ts`：`getCurrentModel(appId, settingsConfig)`（claude: env.ANTHROPIC_DEFAULT_SONNET_MODEL 回退 ANTHROPIC_MODEL；codex/grokbuild: extractCodexModelName；gemini: env.GEMINI_MODEL；返回 strip [1M] 的 base；范围外 app 返回 ""）与 `applyModelToSettings(appId, settingsConfig, model, { withOneM })`（不可变深拷贝写回；claude 写 6 模型字段 + 3 显示名字段按条件覆盖 + 1M 开关语义：SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 加 [1M]、HAIKU 不加；codex/grokbuild: setCodexModelName；gemini: env.GEMINI_MODEL）
- [ ] 1.2 新增 `src/utils/providerModelUtils.test.ts`：覆盖 getCurrentModel 4 app + 空回退 + [1M] strip；applyModelToSettings 的 4 app 写回、1M 开/关分支、HAIKU 不加标记、显示名覆盖条件（空/等于旧 base/自定义名保留）、TOML round-trip、不可变（原对象不变）。`pnpm test:unit` 全绿

## 2. 快捷切换弹窗

- [ ] 2.1 新增 `src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`：props { provider, appId, open, onOpenChange }。内容：当前模型显示、凭据预检（按 app 提取 baseURL/apiKey，缺失则拉取禁用+提示）、拉取按钮（fetchModelsForConfig + 成功/失败 toast）、拉取后内嵌 SearchableModelPicker、1M 开关（仅 claude，默认关）、应用按钮（选中后可用：applyModelToSettings → providersApi.update → invalidate providers 查询（key 与 ProviderList 实际一致）→ 成功/失败 toast → 关闭）
- [ ] 2.2 弹窗用现有 Dialog 组件族；保存中 loading 态；provider 深拷贝不可变更新

## 3. ProviderCard 注入

- [ ] 3.1 修改 `src/components/providers/ProviderCard.tsx`：名称行 h3 后加当前模型徽章（getCurrentModel，仅核心 4 app 且非空；样式弱化仿 OMO 徽章：`bg-muted text-muted-foreground text-[10px]`，截断 + title）
- [ ] 3.2 修改 `src/components/providers/ProviderCard.tsx`：悬停操作区加"模型"图标按钮（仅核心 4 app），useState 控制弹窗 open，挂载 ModelQuickSwitchDialog

## 4. i18n

- [ ] 4.1 四 locale 补 `providerModel.*` 段：title/currentModel/fetchModels（如复用 providerForm.fetchModels 则不重复）/apply/applyOneM/applied/noCredentials（文案见 design D5），zh/en/ja/zh-TW 齐全

## 5. 验证

- [ ] 5.1 `pnpm typecheck` 通过
- [ ] 5.2 `pnpm test:unit` 通过（含新增 providerModelUtils.test.ts，无回归）
- [ ] 5.3 `pnpm dev:fork` 巡检：4 app 卡片显示模型徽章（含空模型不显示）；模型按钮开弹窗；拉取→搜索→选择→应用后卡片徽章与编辑表单字段更新（claude 含 1M 开关两种路径）；范围外 app 卡片无徽章无按钮行为不变
- [ ] 5.4 `comet classic openspec -- validate ccs-home-model-display` 通过

## 6. 提交

- [ ] 6.1 分支提交（conventional commits，可分 3-4 个提交：工具+单测 / 弹窗 / 卡片注入 / i18n）

```

## docs/openspec/changes/ccs-home-model-display/specs/provider-model-quick-view-switch/spec.md

- Source: docs/openspec/changes/ccs-home-model-display/specs/provider-model-quick-view-switch/spec.md
- Lines: 1-61
- SHA256: 1a026fc530c00e9066d4ac1ff7a94577c16b56bd1e2e17b9bf73021485c207a9

```md
## Purpose

主页供应商卡片的模型快捷查看与切换：卡片名称右侧显示当前模型徽章（4 app）；悬停操作加"模型"按钮打开快捷切换弹窗（拉取模型 → 搜索选择 → 一键应用到所有模型角色字段 → 可选 1M 标记）。

## ADDED Requirements

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

```
