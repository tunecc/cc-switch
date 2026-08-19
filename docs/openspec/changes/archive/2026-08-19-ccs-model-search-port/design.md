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
