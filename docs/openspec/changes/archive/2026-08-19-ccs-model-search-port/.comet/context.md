# Comet Design Handoff

- Change: ccs-model-search-port
- Phase: design
- Mode: compact
- Context hash: 9162ef4a00fed77cda94be2e3933891f666c903a541ace8028200dca9534bc51

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-model-search-port/proposal.md

- Source: docs/openspec/changes/ccs-model-search-port/proposal.md
- Lines: 1-28
- SHA256: dfba03b1c4f84f769c041890e819d2d55e0ef8bdcda5158b648f315a2451eb35

```md
## Why

fork 的模型选择下拉（ModelDropdown）是简单列表无搜索；上游 cc-switch-main 已升级为 SearchableModelPicker（Popover + cmdk Command 可搜索、按 ownedBy 供应商分组排序、当前值打勾）。供应商模型列表动辄几十上百个，无搜索的滚动选择效率低。移植上游搜索选择器提升所有表单的模型选择体验。

## What Changes

- **新增 `src/components/providers/forms/shared/SearchableModelPicker.tsx`**：从上游 `/Users/tune/Downloads/cc-switch-main/src/components/providers/forms/shared/SearchableModelPicker.tsx` 原样移植（110 行：Popover 触发按钮 + CommandInput 搜索 + 按 ownedBy 分组、组内按 id 排序 + 当前值 Check 勾选）。
- **`ModelInputWithFetch.tsx`**：`ModelDropdown` 替换为 `SearchableModelPicker`（多传 `value` prop 标记当前值）。此组件被 ClaudeFormFields/CodexFormFields（ModelInputWithFetch 使用方 Gemini/Claude）等复用。
- **`ClaudeFormFields.tsx` Copilot 分支**：`ModelDropdown` 替换为 `SearchableModelPicker`（与上游 renderModelInput 对齐，ownedBy 回退 "Other"）。
- **`shared/index.ts`**：导出 `SearchableModelPicker`。
- **保留 `ModelDropdown.tsx` 与其余引用**：Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop 表单仍直接用 ModelDropdown（上游对应文件也已换用 SearchableModelPicker，但那是上游对这些文件的更大范围改动）。本 change 仅最小移植核心组件与 Claude 主链路，其余表单换用留作后续增量（减小单 change 冲突面）。
- **依赖**：`cmdk@^1.1.1` 已在 package.json，`src/components/ui/command.tsx` 已存在，无新依赖。
- **i18n**：上游 picker 用 `providerForm.searchModels` / `noModelsFound` key——检查我们 locale 是否已有（上游 key 我们可能缺失则补 zh/en/ja/zh-TW）。

## Capabilities

### New Capabilities
- `model-search-picker`: 模型选择支持搜索过滤与供应商分组。定义 SearchableModelPicker 组件契约（搜索、分组、当前值标记）与接入范围（ModelInputWithFetch 全部使用方 + Claude Copilot 分支）。

### Modified Capabilities
<!-- 无。 -->

## Impact

- **新增**：`src/components/providers/forms/shared/SearchableModelPicker.tsx`。
- **改动**：`ModelInputWithFetch.tsx`（换组件）、`ClaudeFormFields.tsx`（Copilot 分支换组件）、`shared/index.ts`（导出）、locale 文件（若缺 searchModels/noModelsFound key 则补）。
- **不变**：ModelDropdown.tsx 保留；其余直接引用 ModelDropdown 的表单不动。
- **风险**：SearchableModelPicker 的 Popover 层级（z-index）与 Dialog 嵌套表现需巡检；cmdk 已有依赖无供应链风险；上游组件原样移植降低实现风险。

```

## docs/openspec/changes/ccs-model-search-port/design.md

- Source: docs/openspec/changes/ccs-model-search-port/design.md
- Lines: 1-47
- SHA256: 41687a861c955c430b99c32f047736cdf0af5b8c8dde246a400b6b11f60c2351

```md
## Context

上游 cc-switch-main（旧 fork 副本）已把 ModelDropdown 升级为 SearchableModelPicker（110 行，Popover + cmdk Command）。我们 fork 的 cmdk@^1.1.1 与 ui/command.tsx 均已存在，移植零依赖成本。ModelInputWithFetch 被 Claude（Codex OAuth/xAI OAuth/普通供应商）与 Gemini 表单使用；Claude Copilot 分支单独内联了下拉。ModelDropdown 在 Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop 仍有直接引用（本 change 保留）。

## Goals / Non-Goals

**Goals:**
- 上游 SearchableModelPicker 原样移植（最小 diff，便于未来 rebase 直接吸收上游其余表单改动）。
- Claude 主链路（ModelInputWithFetch + Copilot 分支）换用。
- 4 locale i18n key 补齐。

**Non-Goals:**
- 不改其余表单的 ModelDropdown 直接引用（留后续增量 change，上游已有对应改动可届时参考）。
- 不删除 ModelDropdown.tsx。
- 不做模型收藏/记忆等新功能。

## Decisions

### D1: 原样移植而非重写

上游组件 110 行已稳定（上游多表单使用），原样复制保证行为一致；未来 rebase 上游对其余表单的换用改动时 diff 最小。不做"顺手改进"。

### D2: ownedBy null 处理差异

上游 SearchableModelPicker 内部 `const vendor = model.ownedBy || "Other"`（null 归 Other）。我们 fork 的 Copilot 分支映射时用 `ownedBy: m.vendor || null`——保持我们的映射不变，分组归 Other 由 picker 内部处理（上游 renderModelInput 把 Copilot 映射改成 `|| "Other"` 是其内部冗余，我们不改，行为等价）。

### D3: i18n key 按上游 defaultValue 补四语言

上游用 `t("providerForm.searchModels", { defaultValue: "搜索模型..." })` / `t("providerForm.noModelsFound", { defaultValue: "未找到匹配模型" })`。我们 4 locale 均缺，补：zh "搜索模型..."/"未找到匹配模型"、en "Search models..."/"No models found"、ja "モデルを検索..."/"一致するモデルが見つかりません"、zh-TW "搜尋模型..."/"未找到符合模型"。

### D4: ModelInputWithFetch 换用传 value

上游 `ModelInputWithFetch` 调 SearchableModelPicker 时传 `value={value}` 标记当前值（旧 ModelDropdown 无 value prop）。照搬。

## Risks / Trade-offs

- Popover 在 Dialog 内的层级/z-index——上游 picker 用 `z-[200]`，上游已在 Dialog 场景验证过，风险低；巡检确认。
- cmdk Command 在 jsdom 测试的兼容——现有测试未覆盖模型下拉交互，无测试风险。
- ModelDropdown 与 SearchableModelPicker 并存期——可接受，组件小无维护负担。

## Migration Plan

feat/model-search-port 分支实施，pnpm dev:fork 巡检 Claude 普通供应商（拉取模型后下拉搜索）与 Copilot。回滚删分支。

## Open Questions

无。

```

## docs/openspec/changes/ccs-model-search-port/tasks.md

- Source: docs/openspec/changes/ccs-model-search-port/tasks.md
- Lines: 1-25
- SHA256: f2d631e9f897040cd80fe0cef97b610741a8aab8c03f4e3e5f942a3646a05f06

```md
## 1. 组件移植

- [ ] 1.1 新增 `src/components/providers/forms/shared/SearchableModelPicker.tsx`：从上游 `/Users/tune/Downloads/cc-switch-main/src/components/providers/forms/shared/SearchableModelPicker.tsx` 原样复制（110 行：Popover 触发 + CommandInput 搜索 + ownedBy 分组排序 + Check 当前值 + onSelect 关闭），import 路径适配（@/components/ui/*、@/lib/utils、FetchedModel 类型不变）

## 2. 接入

- [ ] 2.1 修改 `src/components/providers/forms/shared/ModelInputWithFetch.tsx`：`ModelDropdown` 替换为 `SearchableModelPicker`（`<SearchableModelPicker models={fetchedModels} value={value} onSelect={onChange} />`），import 更新
- [ ] 2.2 修改 `src/components/providers/forms/ClaudeFormFields.tsx` Copilot 分支（renderModelInput 内）：`<ModelDropdown models={copilotFetchedModels} onSelect={updateValue} />` 替换为 `<SearchableModelPicker models={copilotFetchedModels} value={value} onSelect={updateValue} />`，import 从 shared 引入 SearchableModelPicker（该文件已有 shared import 块，加入即可；ModelDropdown import 若不再使用则移除）
- [ ] 2.3 修改 `src/components/providers/forms/shared/index.ts`：导出 `SearchableModelPicker`

## 3. i18n

- [ ] 3.1 四个 locale 的 providerForm 段补 `searchModels` 与 `noModelsFound`：zh "搜索模型..."/"未找到匹配模型"、en "Search models..."/"No models found"、ja "モデルを検索..."/"一致するモデルが見つかりません"、zh-TW "搜尋模型..."/"未找到符合模型"。插在 fetchModels 相关 key 附近

## 4. 验证

- [ ] 4.1 运行 `pnpm typecheck` 通过
- [ ] 4.2 运行 `pnpm test:unit` 通过（987/987 无回归）
- [ ] 4.3 运行 `pnpm dev:fork` 巡检：Claude 普通供应商填 baseURL+apiKey 拉取模型后，模型输入旁下拉打开为可搜索列表（输入关键词过滤、按供应商分组、当前值打勾、选择后回填关闭）；Copilot 预设下拉同样可搜索
- [ ] 4.4 确认其余表单（Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop）模型下拉行为不变
- [ ] 4.5 `comet classic openspec -- validate ccs-model-search-port` 通过

## 5. 提交

- [ ] 5.1 分支提交（conventional commits）：可分 2 个提交——组件移植+接入 / i18n

```

## docs/openspec/changes/ccs-model-search-port/specs/model-search-picker/spec.md

- Source: docs/openspec/changes/ccs-model-search-port/specs/model-search-picker/spec.md
- Lines: 1-57
- SHA256: ec75398f57c118924d380997984ce6095709a4aa3111e6f2b9808b477f166a02

```md
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

```
