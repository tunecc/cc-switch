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
