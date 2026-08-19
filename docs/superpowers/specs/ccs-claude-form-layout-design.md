---
comet_change: ccs-claude-form-layout
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-19-ccs-claude-form-layout
status: final
---

# Design Doc: ccs-claude-form-layout

> OpenSpec change: `ccs-claude-form-layout`
> 产物语言：zh-CN
> 不依赖 IS_FORK_BUILD（纯表单优化，上游同样受益）

## 1. 背景与目标

ClaudeFormFields.tsx 的 apiFormat Select 藏在高级选项内且附带长说明；1M 需逐行勾选。目标：格式 Select 移到请求地址右侧（无长说明），1M 表头加一键全选勾。改动集中，便于 rebase。

**非目标**：不改 EndpointField shared 组件；不动模型角色/字段映射逻辑；不引入 fork 守卫。

## 2. 技术决策

### D1: flex 并排包装，不动 EndpointField
EndpointField 外包 `flex flex-wrap items-start gap-2`：左 flex-1 EndpointField，右 `w-[150px] shrink-0` apiFormat Select。EndpointField 是 6+ 表单共用 shared 组件，不加 props。备选 rightSlot prop 影响面大，弃用。

### D2: hasAnyAdvancedValue 移除 apiFormat 条件
格式选择移出高级选项后，`(!isXaiOauthPreset && apiFormat !== "anthropic")` 不再构成"高级项有值"。xAI OAuth 强制折叠逻辑保留。

### D3: 移除 apiFormatHint 长说明；保留 apiHint* 动态短提示
高级选项内 apiFormat Select + FormLabel + apiFormatHint 整块删。EndpointField hint（apiHint* 随格式联动的状态反馈）保留。apiFormatHint i18n key 不删（避免 i18n diff 扩大）。

### D4: 1M 全选勾放表头"声明支持 1M"列
表头第四列内嵌 Checkbox，三态（全选 checked / 部分 indeterminate / 全无 false）。点击 toggle 全开/全关 supportsOneM 行（sonnet/opus/fable/subagent），haiku 不动。批量调 onModelChange(row.modelField, setClaudeOneMMarker(row.model, next))。仅 md+ 可见（表头 hidden md:grid），移动端行内勾选兜底。

### D5: Radix Checkbox 支持 indeterminate
ui/Checkbox 基于 Radix，`checked="indeterminate"` 原生支持。

## 3. 实施方案

### 3.1 apiFormat 移位（ClaudeFormFields.tsx）
```tsx
{shouldShowSpeedTest && (
  <div className="flex flex-wrap items-start gap-2">
    <div className="min-w-0 flex-1">
      <EndpointField ...原 props 不变... />
    </div>
    {category !== "cloud_provider" && !isXaiOauthPreset && (
      <Select value={apiFormat} onValueChange={onApiFormatChange}>
        <SelectTrigger id="apiFormat" className="w-[150px] shrink-0" aria-label={t("providerForm.apiFormat", { defaultValue: "上游格式" })}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>...4 SelectItem 不变...</SelectContent>
      </Select>
    )}
  </div>
)}
```
高度对齐：SelectTrigger 默认 h-9 与 Input h-9 对齐；上方 label 差异用 mt 补偿（EndpointField 有 FormLabel 行，SelectTrigger 加 `mt-[26px]` 或对齐微调，实施时目测调整）。

### 3.2 删除高级选项内 apiFormat 块
811-852 行整块（div.space-y-2 含 FormLabel + Select + apiFormatHint p）删除。

### 3.3 hasAnyAdvancedValue 调整
移除 `(!isXaiOauthPreset && apiFormat !== "anthropic") ||`。

### 3.4 1M 全选（表头第四列）
```tsx
<span className="flex items-center gap-1.5">
  {(() => {
    const oneMRows = modelRoleRows.filter((r) => r.supportsOneM);
    const all = oneMRows.every((r) => hasClaudeOneMMarker(r.model));
    const any = oneMRows.some((r) => hasClaudeOneMMarker(r.model));
    return (
      <Checkbox
        checked={all ? true : any ? "indeterminate" : false}
        onCheckedChange={() => {
          for (const row of oneMRows) {
            onModelChange(row.modelField, setClaudeOneMMarker(row.model, !all));
          }
        }}
        aria-label={t("providerForm.modelOneMToggleAll", { defaultValue: "一键全选 1M" })}
      />
    );
  })()}
  {t("providerForm.modelOneMHeader", { defaultValue: "声明支持 1M" })}
</span>
```

### 3.5 i18n
zh: `"modelOneMToggleAll": "一键全选 1M"`；en: `"Toggle all 1M"`。插在 providerForm 段 modelOneMHeader 附近。

## 4. 风险与缓解

- 窄屏挤压 → flex-wrap 换行，Select 占满下一行
- 非默认格式供应商编辑时高级选项不再自动展开 → 可接受（格式常驻可见）
- Select 与 Input 垂直对齐 → 实施时目测微调 margin
- 表头全选移动端不可见 → 行内勾选兜底

## 5. 验收

typecheck / test:unit 987 无回归 / dev:fork 巡检（Select 位置、切换、全选三态、haiku 不变）/ openspec validate

## 6. 任务分解

详见 OpenSpec tasks.md（4 组 10 任务）。
