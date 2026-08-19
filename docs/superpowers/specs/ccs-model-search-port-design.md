---
comet_change: ccs-model-search-port
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-19-ccs-model-search-port
status: final
---

# Design Doc: ccs-model-search-port

> OpenSpec change: `ccs-model-search-port`
> 产物语言：zh-CN
> 来源：上游 cc-switch-main 的 SearchableModelPicker 原样移植

## 1. 背景与目标

fork 的 ModelDropdown 无搜索；上游已升级为 SearchableModelPicker（Popover + cmdk，110 行）。cmdk 与 ui/command.tsx 均已存在，移植零依赖成本。目标：原样移植 + Claude 主链路（ModelInputWithFetch + Copilot 分支）换用 + 4 locale i18n 补齐。

**非目标**：其余表单的 ModelDropdown 直接引用不动（留后续增量）；不删 ModelDropdown；不加新功能。

## 2. 技术决策

### D1: 原样移植（不重写不改进）
上游组件已稳定，复制保证行为一致，未来 rebase 吸收上游其余表单改动时 diff 最小。

### D2: ownedBy null 处理
picker 内部 `ownedBy || "Other"` 归组；Copilot 映射保持 fork 现状 `ownedBy: m.vendor || null`（与上游 `|| "Other"` 行为等价，不改）。

### D3: i18n 四语言补齐
`providerForm.searchModels`（zh "搜索模型..." / en "Search models..." / ja "モデルを検索..." / zh-TW "搜尋模型..."）与 `providerForm.noModelsFound`（zh "未找到匹配模型" / en "No models found" / ja "一致するモデルが見つかりません" / zh-TW "未找到符合模型"）。

### D4: ModelInputWithFetch 传 value
换用 SearchableModelPicker 时传 `value={value}`（标记当前值，旧 ModelDropdown 无此能力）。

## 3. 实施方案

1. 复制上游 SearchableModelPicker.tsx → `src/components/providers/forms/shared/`（import 路径不变：@/components/ui/popover、@/components/ui/command、@/lib/utils、FetchedModel from @/lib/api/model-fetch）
2. ModelInputWithFetch.tsx：import 换 SearchableModelPicker；有数据分支 `<SearchableModelPicker models={fetchedModels} value={value} onSelect={onChange} />`
3. ClaudeFormFields.tsx Copilot 分支：同换；ModelDropdown import 若无他用移除
4. shared/index.ts 导出
5. i18n 4 locale 补两 key（fetchModels key 附近）

## 4. 风险与缓解

- Popover 在 Dialog 内 z-index → 上游 picker 用 z-[200] 已验证，巡检确认
- cmdk jsdom 测试兼容 → 现有测试未覆盖下拉交互，无风险
- 双组件并存期 → 可接受

## 5. 验收

typecheck / test:unit 987 无回归 / dev:fork 巡检（Claude 普通供应商 + Copilot 下拉搜索分组勾选；其余表单不变）/ openspec validate

## 6. 任务分解

详见 OpenSpec tasks.md（5 组 10 任务）。
