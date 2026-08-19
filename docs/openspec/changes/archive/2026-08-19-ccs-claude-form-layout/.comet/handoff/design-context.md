# Comet Design Handoff

- Change: ccs-claude-form-layout
- Phase: design
- Mode: compact
- Context hash: 86a5cedf9636ee3b3a03624f8d3b430478df5469b0c3b3c2e09cb92d78d47464

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-claude-form-layout/proposal.md

- Source: docs/openspec/changes/ccs-claude-form-layout/proposal.md
- Lines: 1-24
- SHA256: a3fc0c2f358ac41752d52377d2bce329a6d1f484fe190ee21474249b8300193b

```md
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

```

## docs/openspec/changes/ccs-claude-form-layout/design.md

- Source: docs/openspec/changes/ccs-claude-form-layout/design.md
- Lines: 1-60
- SHA256: 74d36b789f50ffef68ef172aa920c48352b2ef29de350d87a62d6efe16a84498

```md
## Context

`ClaudeFormFields.tsx` 当前结构：EndpointField（约 736-761 行）单独渲染 Base URL 输入；apiFormat Select 在高级选项 CollapsibleContent 内第一项（约 811-852 行），含 FormLabel 与 apiFormatHint 长说明；模型映射表头在约 962-984 行（`hidden md:grid` 四列，"声明支持 1M"列无交互）；1M 逐行勾选在行内（约 1036-1049 行），已有 `handleRoleOneMChange` 调 `setClaudeOneMMarker(row.model, enabled)`。

`hasAnyAdvancedValue`（约 237-247 行）含 `(!isXaiOauthPreset && apiFormat !== "anthropic")` 条件，控制高级选项默认展开。

## Goals / Non-Goals

**Goals:**
- apiFormat Select 与请求地址同排（右侧），无长说明文字。
- 1M 表头全选勾（三态），一键全开/全关 supportsOneM 行。
- 改动集中，便于 rebase 上游。

**Non-Goals:**
- 不改 EndpointField 组件本身（不加 props）。
- 不动模型角色行数、字段映射逻辑。
- 不引入 IS_FORK_BUILD 守卫（上游同样受益）。

## Decisions

### D1: apiFormat Select 并排方式——ClaudeFormFields 内 flex 包装，不动 EndpointField

在 EndpointField 外层包一个 `flex items-start gap-2` 容器：左列 flex-1 放 EndpointField，右列放 apiFormat Select（`w-[150px]` 左右紧凑宽度，SelectTrigger 与输入框高度对齐）。不扩展 EndpointField props（它是 shared 组件，其他 6+ 表单共用，加 props 会污染）。

**备选**：给 EndpointField 加 `rightSlot` ReactNode prop——更通用但改动 shared 组件，影响面大，本 change 用不上。弃用。

### D2: apiFormat Select 移位后高级选项展开态判定调整

`hasAnyAdvancedValue` 移除 `(!isXaiOauthPreset && apiFormat !== "anthropic")` 条件（格式选择已不在高级选项内，非默认格式不再构成"高级项有值"信号）。xAI OAuth 的 `advancedExpanded` 强制 false 逻辑保留。

### D3: 移除 apiFormatHint 长说明；保留 apiHint* 动态短提示

高级选项内 apiFormat Select + FormLabel + apiFormatHint 整块移除。EndpointField 的 hint prop（随 apiFormat 变化的 apiHint* 短提示）保留不动——它是选中格式后的状态反馈。apiFormatHint 的 i18n key 不删（上游数据保留，避免 i18n 文件 diff 扩大；只是不再引用）。

### D4: 1M 全选勾放表头"声明支持 1M"列

表头第四列（`modelOneMHeader` span）内嵌 Checkbox：checked = 所有 supportsOneM 行均已 1M；indeterminate = 部分；点击 toggle 全开/全关。全开时对每行 `onModelChange(row.modelField, setClaudeOneMMarker(row.model, true))`；全关时 `setClaudeOneMMarker(row.model, false)`。仅对 supportsOneM 行操作。显示名称（displayNameField）不需更新（1M 标记不进显示名称，stripClaudeOneMMarker 语义已有）。

全选勾仅在 md+ 表头可见（表头本身 `hidden md:grid`）；移动端无表头，行内勾选仍可用（可接受，fork 桌面场景为主）。

**备选**：全选按钮放"模型映射"标题行（一键设置旁）——与"声明支持 1M"列语义距离远，且一键设置已是批量操作易混淆。弃用，放表头列内语义最准。

### D5: Checkbox indeterminate 支持

项目 ui/Checkbox 基于 Radix，支持 `checked="indeterminate"`。直接传三态值。

## Risks / Trade-offs

- 窄屏（<md）时并排 Select 可能挤压 → Mitigation: flex-wrap，窄屏 Select 换行到下一行占满宽；本表单主要桌面使用。
- hasAnyAdvancedValue 条件移除后，已存在的非默认 apiFormat 供应商编辑时高级选项不再默认展开 → 可接受（格式 Select 现在常驻可见，用户不需要进高级选项看格式）。
- apiFormatHint i18n key 保留未引用 → 无风险，减小 i18n diff。
- 表头全选勾在移动端不可见 → 可接受，行内勾选兜底。

## Migration Plan

在 `feat/claude-form-layout` 分支实施，`pnpm dev:fork` 巡检。回滚 = 删分支。

## Open Questions

无。

```

## docs/openspec/changes/ccs-claude-form-layout/tasks.md

- Source: docs/openspec/changes/ccs-claude-form-layout/tasks.md
- Lines: 1-22
- SHA256: 4bfd4969d305dca7556ab590d92cd84c16e4c1efca98543c42e77aedb410a602

```md
## 1. apiFormat Select 移位

- [ ] 1.1 修改 `src/components/providers/forms/ClaudeFormFields.tsx`：将 EndpointField（约 736-761 行）外层包 flex 容器（`flex flex-wrap items-start gap-2`），左列 flex-1 放 EndpointField，右列（`w-[150px] shrink-0`）放 apiFormat Select（含 4 个 SelectItem，显示条件 `category !== "cloud_provider" && !isXaiOauthPreset`），SelectTrigger 高度与输入框对齐。保持 apiFormat/onApiFormatChange props 用法不变
- [ ] 1.2 移除高级选项折叠面板内的 apiFormat 块（约 811-852 行）：Select + FormLabel + apiFormatHint `<p>` 整块删除
- [ ] 1.3 调整 `hasAnyAdvancedValue`（约 237-247 行）：移除 `(!isXaiOauthPreset && apiFormat !== "anthropic")` 条件（格式已不在高级选项内）；保留其余条件与 xAI OAuth 强制折叠逻辑

## 2. 1M 表头一键全选

- [ ] 2.1 修改 `src/components/providers/forms/ClaudeFormFields.tsx` 模型映射表头（约 962-984 行）：第四列"声明支持 1M"span 内嵌 Checkbox，三态：allOneM = modelRoleRows.filter(r=>r.supportsOneM).every(r=>hasClaudeOneMMarker(r.model))；anyOneM = some(...)；checked = allOneM 或（anyOneM ? "indeterminate" : false）。点击 toggle：allOneM ? 全关 : 全开，对每 supportsOneM 行 onModelChange(row.modelField, setClaudeOneMMarker(row.model, !allOneM))
- [ ] 2.2 添加 i18n key：`providerForm.modelOneMToggleAll`（zh: "一键全选 1M"、en: "Toggle all 1M"）到 `src/i18n/locales/zh.json` 与 `en.json`（用作 Checkbox aria-label/title）。ja/zh-TW 可选补充

## 3. 验证

- [ ] 3.1 运行 `pnpm typecheck` 通过
- [ ] 3.2 运行 `pnpm test:unit` 通过（987/987 无回归）
- [ ] 3.3 运行 `pnpm dev:fork` 巡检：添加/编辑 Claude 供应商，请求地址右侧可见上游格式 Select 并可切换（4 选项）；展开高级选项无格式选择与说明文字；模型映射表头"声明支持 1M"列有全选勾，点击全开 sonnet/opus/fable/subagent（haiku 不变），再点全关；部分勾选显示半选态
- [ ] 3.4 确认已存在非默认格式供应商编辑时功能正常（格式 Select 常驻可见可改）
- [ ] 3.5 `comet classic openspec -- validate ccs-claude-form-layout` 通过

## 4. 提交

- [ ] 4.1 在 `feat/claude-form-layout` 分支提交（conventional commits，如 `feat(form): move api format select next to endpoint and add 1M toggle-all`）。可分 2 个提交：apiFormat 移位 / 1M 全选

```

## docs/openspec/changes/ccs-claude-form-layout/specs/claude-form-layout/spec.md

- Source: docs/openspec/changes/ccs-claude-form-layout/specs/claude-form-layout/spec.md
- Lines: 1-49
- SHA256: 212c7c3bd5302aacc241cddbce425b41e85dbf19c8d89822cd5a76583e90bc88

```md
## Purpose

定义 Claude 供应商配置表单的布局契约：上游格式选择器紧邻请求地址（不附带长说明文字）；模型映射"声明支持 1M"列支持表头一键全选/取消。

## ADDED Requirements

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

```
