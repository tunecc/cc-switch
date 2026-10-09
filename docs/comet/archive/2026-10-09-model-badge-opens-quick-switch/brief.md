# Outcome

重构版主页供应商卡片的「模型快捷切换」入口从 ⋯ 更多菜单迁移到卡片上的当前模型徽章：

1. ⋯ 更多菜单中的「模型快捷切换」（Boxes 图标）项被移除，不再是卡片操作入口。
2. 核心 4 app（claude / codex / gemini / grokbuild）供应商卡片名称右侧的当前模型徽章变为可点击按钮，点击它打开 ModelQuickSwitchDialog 弹窗；弹窗行为与原来从更多菜单打开完全一致（拉取模型、搜索选择、1M 开关、写回契约、toast 全部不变）。

# Scope

- `src/components/providers/ProviderCardActions.tsx`：移除 ⋯ 更多菜单里的「模型快捷切换」项（`Boxes` 图标 + `providerModel.title`），以及随之无用的 `onQuickModel` prop、类型声明、渲染分支与分隔线条件；清理不再使用的 `Boxes` 导入。
- `src/components/providers/ProviderCard.tsx`：模型徽章由 `<span>` 改为可点击 `<button type="button">`，点击打开 ModelQuickSwitchDialog；保留 1M 小标记、title 全名提示与既有截断样式；补 hover / focus / aria 可访问性。
- 没有配置模型的核心 4 app 供应商（官方直连等）按 Q1 结论渲染占位按钮，点击打开同一个弹窗；占位按钮的 label / title / aria-label 文案需四语言补齐。
- `src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`：不改。
- `docs/comet/changes/model-badge-opens-quick-switch/specs/provider-model-quick-view-switch/spec.md`：本次变更的完整目标规格（入口位置、可点击交互、无模型时的占位入口）。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：归档时按项目惯例把完整目标规格同步写回已发布能力规格。
- 测试：`tests/components/ProviderCardActions.test.tsx` 断言更多菜单不再含该条目；新增 ProviderCard 徽章点击测试（含无模型形态与范围外 app）。
- i18n：如需新增徽章 aria-label / 占位文案，四语言（zh-CN / en / zh-TW / ja）补齐。

# Non-goals

- 不改 ModelQuickSwitchDialog 的任何行为：拉取模型、搜索选择、「应用 1M 标记」开关、写回契约、toast 文案。
- 不改模型徽章的解析规则（`extractModelBadgeForProvider`）与 1M 判定（`hasClaudeOneMMarker`）。
- 不为范围外 app（claude-desktop / opencode / openclaw / hermes / pi / mcode）添加模型徽章或快捷切换入口。
- 不改卡片其他操作按钮、右键「一键置顶 / 置底」菜单、编辑表单内的模型字段交互。

# Acceptance examples

- A1: 打开核心 4 app 任一供应商卡片的 ⋯ 更多菜单，菜单项为模式项 + 复制 + 连通检测 + 配置用量查询 + 打开终端 + 删除，不含「模型快捷切换」项，也不含 Boxes 图标。
- A2: claude / codex / gemini / grokbuild 供应商卡片名称右侧的当前模型徽章可点击（button、cursor-pointer、有 hover 反馈），点击后打开 ModelQuickSwitchDialog。
- A3: 徽章可键盘访问：Tab 可聚焦，Enter / Space 可打开弹窗，且有可访问名称（aria-label）。
- A4: 徽章的展示语义不变：title 仍显示完整模型说明（claude 三角色聚合 `Opus: x / Sonnet: y / Haiku: z`，其余 app 为模型名），1M 小标记仍按当前主对话模型是否带 `[1M]` 显示，长模型名仍可截断。
- A5: 点击徽章不触发卡片其他交互：不触发拖拽、不打开网站链接、不影响右键菜单；弹窗的打开/关闭与读写行为与从更多菜单打开时一致。
- A6: 没有配置模型的核心 4 app 供应商（官方直连，`env` 为空 / `config` 为空）在名称右侧渲染占位按钮，点击后打开同一个 ModelQuickSwitchDialog；占位按钮不显示 1M 小标记，样式与模型徽章一致（小字、可截断、有 hover 反馈）。
- A7: 范围外 app（claude-desktop / opencode / openclaw / hermes / pi / mcode）的卡片不渲染模型徽章，也不渲染占位按钮，行为与改动前一致。
- A8: `ProviderCardActions` 相关测试与全量前端 vitest、typecheck、format:check 通过。

# Constraints and invariants

- 入口迁移不得改变弹窗行为：徽章点击与原来的更多菜单项走同一个 `setModelDialogOpen(true)`，弹窗读写语义、挂载位置不变。
- 徽章可点击性只覆盖会渲染徽章或占位按钮的情形（`extractModelBadgeForProvider` 返回非 null 的 4 个 app，以及同为这 4 个 app 但模型为空的占位按钮）；范围外 app 零变化。
- 徽章与占位按钮仍是卡片信息位：不改截断、title、1M 小标记的既有语义；占位按钮不显示 1M 小标记。
- 点击徽章不得触发卡片其他交互：用独立 `button` + 自身 onClick，必要时 stopPropagation，避免影响拖拽手柄与链接按钮。
- 徽章与占位按钮必须键盘可达（button 元素 + aria-label），不引入只支持鼠标的入口。
- `modelDialogOpen` 状态继续留在 ProviderCard，弹窗挂载点不变，不提升到 ProviderList。

# Decisions

- D1（入口唯一化）：快捷切换入口只保留卡片上的模型徽章 / 占位按钮一处，更多菜单项整项删除。
- D2（徽章交互形态）：徽章改为 `<button type="button">`，hover 加浅背景 + 下划线、cursor-pointer，title 维持完整模型说明；不在徽章内新增 Boxes 图标（用户明确要求把该图标从更多菜单取消，不在别处补回）。
- D3（状态归属）：`modelDialogOpen` 继续留在 ProviderCard，弹窗挂载点不变（卡片底部），避免提升到 ProviderList。
- D4（a11y）：用原生 button 获得键盘与读屏支持，aria-label 用 `providerModel.title`（「模型快捷切换」）+ 供应商名，与卡片其他图标按钮的命名方式一致。
- D5（Q1 结论：无模型时渲染占位按钮）：模型为空但 app 在核心 4 app 内时，徽章位置渲染占位按钮，label 用「未设置模型」类文案，title / aria-label 与模型徽章一致（打开模型快捷切换）。理由：官方直连供应商（Claude / Google / OpenAI Official）默认 `env: {}` 或 `config: ""`，本来不渲染徽章；若只在有徽章时可点击，这些供应商将彻底失去卡片上的快捷切换入口，只能进编辑表单改模型，属于能力回退。占位按钮保持小字、可截断、有 hover 反馈，与模型徽章同一视觉位。

# Open questions

（无。Q1 已由用户确认：无模型时渲染占位按钮。）

# Verification expectations

- `pnpm vitest run` 全量通过；至少覆盖 `tests/components/ProviderCardActions.test.tsx`、新增的 ProviderCard 徽章测试、`src/utils/providerModelUtils.test.ts`。
- `pnpm typecheck`、`pnpm format:check` 通过。
- 代码审读确认：徽章点击不触发拖拽与网站链接；更多菜单分隔线条件在只剩部分次要操作时仍正确。
