---
generated_from_state_version: 11
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 2
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-09T05:33:17.677Z
- 摘要: 36/36 项通过。快捷切换入口已从 ⋯ 更多菜单迁移到卡片模型徽章/占位按钮：ProviderCardActions 移除「模型快捷切换」项与 Boxes 图标且第二道分隔线条件收窄为四项；ProviderCard 徽章由 span 改为可键盘访问的原生 button（cursor-pointer、hover 浅背景/下划线、focus-visible ring、aria-label），title 完整模型说明、1M 小标记与截断语义不变，无模型的核心 4 app 渲染占位按钮（四语言 notSet/quickModel 已补），范围外 app 零渲染；ModelQuickSwitchDialog 与 providerModelUtils 读写契约经 git diff 确认零改动，写回/1M 由 providerModelUtils.test.ts 39 用例覆盖。Runtime 四项检查（vitest-targeted/vitest-full/typecheck/format:check）与我的定向重跑均通过，日志 mtime 晚于所有源文件、对应当前实现版本。风险：弹窗无专属 UI 测试，A23-A26/A29 靠零改动+审读确认。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: 打开核心 4 app 任一供应商卡片的 ⋯ 更多菜单，菜单项为模式项 + 复制 + 连通检测 + 配置用量查询 + 打开终端 + 删除，不含「模型快捷切换」项，也不含 Boxes 图标。 | ProviderCardActions more menu 渲染 模式项/复制/连通检测/配置用量查询/打开终端/删除；onQuickModel 项与 Boxes 导入已删除；ProviderCardActions.test 断言 labels 不含 providerModel.title 且 menu 无 svg.lucide-boxes。 |
| A2 | passed | brief.md | A2: claude / codex / gemini / grokbuild 供应商卡片名称右侧的当前模型徽章可点击（button、cursor-pointer、有 hover 反馈），点击后打开 ModelQuickSwitchDialog。 | 徽章为原生 <button type=button>，含 cursor-pointer 与 hover:bg-muted/hover:text-fg-1/hover:underline，onClick=setModelDialogOpen(true)；modelBadge 测试验证点击后出现 dialog。 |
| A3 | passed | brief.md | A3: 徽章可键盘访问：Tab 可聚焦，Enter / Space 可打开弹窗，且有可访问名称（aria-label）。 | 原生 button 可 Tab 聚焦、Enter/Space 触发 onClick，aria-label=quickModelLabel；测试分别以 Enter 与 Space 打开弹窗，getBadge 以可访问名 /的模型快捷切换$/ 定位。 |
| A4 | passed | brief.md | A4: 徽章的展示语义不变：title 仍显示完整模型说明（claude 三角色聚合 `Opus: x / Sonnet: y / Haiku: z`，其余 app 为模型名），1M 小标记仍按当前主对话模型是否带 `[1M]` 显示，长模型名仍可截断。 | title=modelBadge.title（claude 三角色聚合/其余为模型名），1M 依 modelBadge?.oneM，label 外包 truncate max-w-[200px] 保留截断；diff 显示仅 span→button、内部展示逻辑未改；测试验证 title=Opus: kimi-opus / Sonnet: kimi-sonnet / Haiku: kimi-haiku。 |
| A5 | passed | brief.md | A5: 点击徽章不触发卡片其他交互：不触发拖拽、不打开网站链接、不影响右键菜单；弹窗的打开/关闭与读写行为与从更多菜单打开时一致。 | 徽章为独立 button、onClick 仅 setModelDialogOpen(true)，未复用拖拽 listeners、卡片各级无祖先 onClick，不触发拖拽/网站/右键；弹窗为同一组件与状态；测试验证点击不开网站。 |
| A6 | passed | brief.md | A6: 没有配置模型的核心 4 app 供应商（官方直连，`env` 为空 / `config` 为空）在名称右侧渲染占位按钮，点击后打开同一个 ModelQuickSwitchDialog；占位按钮不显示 1M 小标记，样式与模型徽章一致（小字、可截断、有 hover 反馈）。 | 条件 (modelBadge \|\| isModelCapableApp(appId)) 使无模型核心 4 app 渲染占位按钮，label=providerModel.notSet，className 与徽章一致（小字/truncate/hover），modelBadge?.oneM 为 undefined 不显示 1M；测试验证 claudeOfficial(env:{}) 与 codex(config:"") 渲染“未设置模型”且点击打开弹窗。 |
| A7 | passed | brief.md | A7: 范围外 app（claude-desktop / opencode / openclaw / hermes / pi / mcode）的卡片不渲染模型徽章，也不渲染占位按钮，行为与改动前一致。 | 范围外 app 的 modelBadge 为 null 且 isModelCapableApp 为 false，渲染条件为假；测试验证 openclaw 无徽章、无占位、无弹窗。 |
| A8 | passed | brief.md | A8: `ProviderCardActions` 相关测试与全量前端 vitest、typecheck、format:check 通过。 | Runtime 四项检查全部 exit 0：vitest-targeted 14/14、vitest-full 211 文件 2519 测试、typecheck、format:check；日志 mtime(13:25-13:26) 晚于所有源文件 mtime(13:15-13:21)，对应当前实现版本；我独立重跑定向测试亦 14/14 通过。 |
| A9 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 卡片显示模型 - **WHEN** Claude app 的供应商设置了 ANTHROPIC_DEFAULT_SONNET_MODEL - **THEN** 卡片名称右侧显示该模型名（不含 [1M] 后缀） | extractModelBadgeForProvider claude 分支取 SONNET(回退 ANTHROPIC_MODEL) 并 strip [1M] 作 label；ProviderCard 渲染 modelBadge.label；该函数未改动且由既有用例覆盖。 |
| A10 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 卡片显示 1M 开启标记 - **WHEN** Claude app 的供应商 ANTHROPIC_DEFAULT_SONNET_MODEL 原始值为 "model-x[1M]" - **THEN** 卡片名称右侧先显示模型名 "model-x"，其后追加显示「1M」小标记 | oneM=hasClaudeOneMMarker(primaryRaw)，ProviderCard 在 modelBadge?.oneM 时渲染 1M 小标记；modelBadge 测试验证 SONNET=kimi-sonnet[1M] 时显示 1M。 |
| A11 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 未开启 1M 不显示标记 - **WHEN** Claude app 的供应商 ANTHROPIC_DEFAULT_SONNET_MODEL 原始值为 "model-x"（无 [1M]） - **THEN** 卡片名称右侧只显示模型名 "model-x"，不显示 1M 标记 | 无 [1M] 时 oneM=false 不渲染 1M；modelBadge 测试 plain 变体验证无 1M。 |
| A12 | passed | specs/provider-model-quick-view-switch/spec.md | 非 claude app 不显示 1M 标记 - **WHEN** 查看 codex/grokbuild/gemini app 的供应商卡片模型徽章 - **THEN** 徽章只显示模型名，不显示 1M 标记 | extractModelBadgeForProvider 仅 claude 计算 oneM，codex/grokbuild/gemini 不设 oneM；测试 codex 变体无 1M。 |
| A13 | passed | specs/provider-model-quick-view-switch/spec.md | 范围外 app 不显示 - **WHEN** 查看 pi/openclaw 等 app 的供应商卡片 - **THEN** 不显示模型徽章 | extractModelBadgeForProvider default 分支返回 null；ProviderCard 条件为假；测试 openclaw 无徽章。 |
| A14 | passed | specs/provider-model-quick-view-switch/spec.md | 点击徽章打开弹窗 - **WHEN** 用户点击核心 4 app 供应商卡片名称右侧的当前模型徽章 - **THEN** 打开该供应商的 ModelQuickSwitchDialog，弹窗内容、行为与从其他入口打开时一致 | 徽章 onClick 打开 modelDialogOpen，挂载同一 ModelQuickSwitchDialog；测试点击徽章出现 dialog。 |
| A15 | passed | specs/provider-model-quick-view-switch/spec.md | 键盘可打开 - **WHEN** 用户用 Tab 聚焦模型徽章后按 Enter 或 Space - **THEN** 打开 ModelQuickSwitchDialog | 原生 button 支持 Enter/Space；测试 focus+Enter、focus+Space 均打开弹窗。 |
| A16 | passed | specs/provider-model-quick-view-switch/spec.md | 徽章信息语义不变 - **WHEN** 查看 claude 供应商（三角色模型不同）的徽章 - **THEN** 徽章显示第一个角色模型名，title 为 "Opus: x / Sonnet: y / Haiku: z" 完整说明，长名可截断；开启 1M 时仍显示「1M」小标记 | label=roleModels[0].model（首角色），title=Opus: x / Sonnet: y / Haiku: z，truncate 保留，1M 依 primaryRaw；测试验证 title 聚合与 1M 三态。 |
| A17 | passed | specs/provider-model-quick-view-switch/spec.md | 点击不触发其他卡片交互 - **WHEN** 用户点击模型徽章 - **THEN** 不触发卡片拖拽、不打开网站链接、不影响卡片右键菜单，仅打开弹窗 | 徽章独立 button 无拖拽 listeners、无祖先 onClick；测试验证点击不开网站；右键菜单未在本次改动（Non-goal）。 |
| A18 | passed | specs/provider-model-quick-view-switch/spec.md | 无模型时占位可点击 - **WHEN** Claude Official / Google Official / OpenAI Official 等官方直连供应商（模型字段为空）展示在卡片上 - **THEN** 卡片名称右侧显示占位按钮（「未设置模型」类文案），点击后打开 ModelQuickSwitchDialog | 无模型核心 4 app 渲染占位按钮（providerModel.notSet），点击打开弹窗；测试 claudeOfficial 与 codex(config:"") 验证。 |
| A19 | passed | specs/provider-model-quick-view-switch/spec.md | 占位不显示 1M 标记 - **WHEN** 供应商模型为空，渲染占位按钮 - **THEN** 占位按钮只显示占位文案，不显示「1M」小标记 | 占位时 modelBadge 为 null，modelBadge?.oneM 为 undefined 不渲染 1M；测试验证占位内无 1M。 |
| A20 | passed | specs/provider-model-quick-view-switch/spec.md | 范围外 app 无占位 - **WHEN** 查看 pi/openclaw 等范围外 app 的供应商卡片 - **THEN** 既不显示模型徽章，也不显示占位按钮 | 范围外 app 渲染条件为假，既不渲染徽章也不渲染占位；测试 openclaw 验证。 |
| A21 | passed | specs/provider-model-quick-view-switch/spec.md | 更多菜单不含模型快捷切换 - **WHEN** 用户打开核心 4 app 任一供应商卡片的 ⋯ 更多菜单 - **THEN** 菜单中不存在「模型快捷切换」项，也不存在该项的 Boxes 图标 | ProviderCardActions 已删 onQuickModel 项与 Boxes 图标；测试断言 labels 不含 providerModel.title 且 menu.querySelector(svg.lucide-boxes) 为 null。 |
| A22 | passed | specs/provider-model-quick-view-switch/spec.md | 其余菜单项不受影响 - **WHEN** 用户打开 ⋯ 更多菜单 - **THEN** 模式项、复制、连通检测、配置用量查询、打开终端、删除按各自显示条件正常展示，分隔线位置正确 | 菜单项与两道分隔线逻辑保留（menuItems→sep→复制/检测/用量/终端→sep→删除），仅从第二道分隔线条件移除 onQuickModel；测试“shows only the usual items”与“lists them first”验证其余项与顺序正常。 |
| A23 | passed | specs/provider-model-quick-view-switch/spec.md | 拉取模型 - **WHEN** 用户在弹窗点击拉取模型（供应商已配置 baseURL+apiKey） - **THEN** 调用 fetchModelsForConfig 获取列表，成功后显示搜索选择器；失败显示对应错误 toast | ModelQuickSwitchDialog git diff 为空（零改动）；handleFetchModels 调 fetchModelsForConfig，成功 setModels+展开 picker+toast、失败 showFetchModelsError；底层 fetch 由既有用例覆盖。 |
| A24 | passed | specs/provider-model-quick-view-switch/spec.md | 弹窗盖住顶部 header - **WHEN** 用户打开模型快捷切换弹窗 - **THEN** 顶部 header（含 CC Switch 品牌行）被弹窗遮罩与弹窗内容盖住，不再透显在弹窗之上 | 弹窗零改动；DialogContent 使用 zIndex=alert（高于 header z-50），可盖住顶部 header；经代码审读确认。 |
| A25 | passed | specs/provider-model-quick-view-switch/spec.md | 当前模型与拉取按钮同行 - **WHEN** 弹窗打开 - **THEN** 「当前模型」标签与当前模型值在左侧，「获取模型列表」按钮紧随其右侧，二者位于同一行 | 弹窗零改动；当前模型标签与值在左、拉取按钮在右，同处 flex items-center justify-between 行；经代码审读确认。 |
| A26 | passed | specs/provider-model-quick-view-switch/spec.md | 1M 开关反映当前状态 - **WHEN** 供应商当前主对话模型原始值为 "model-x[1M]"，打开弹窗 - **THEN** 「应用 1M 标记」开关显示为开；供应商未开 1M 时打开弹窗，开关显示为关 | 弹窗零改动；currentOneM 由 extractModelBadgeForProvider().oneM 派生（既有测试覆盖），open 时 setOneMEnabled(currentOneM) 使开关反映当前状态；经代码审读确认。 |
| A27 | passed | specs/provider-model-quick-view-switch/spec.md | 选择模型后应用 - **WHEN** 用户选中某模型点击保存 - **THEN** 所选模型写入该供应商全部模型角色字段并保存（见写回 Requirement），弹窗关闭，卡片模型徽章与列表数据刷新 | 弹窗零改动；handleApply→applyModelToSettings→providersApi.update→invalidateQueries→onOpenChange(false)；写回契约由 providerModelUtils.test.ts 39 用例覆盖且全量通过。 |
| A28 | passed | specs/provider-model-quick-view-switch/spec.md | 仅翻转 1M 不换模型 - **WHEN** claude 供应商当前模型非空、用户未选择新模型，把 1M 开关从关切到开后点击保存 - **THEN** 支持 1M 的模型字段原地追加 `[1M]`（见写回 Requirement），各角色模型 base 与显示名字段值保持不变，弹窗关闭并刷新；从开切到关时原地剥离 `[1M]` | 弹窗零改动；未选模型走 setClaudeOneMInSettings 原地翻转 [1M]；该函数由既有测试覆盖（开追加/关剥离/幂等/HAIKU 与显示名不动）。 |
| A29 | passed | specs/provider-model-quick-view-switch/spec.md | 无可应用变化时保存禁用 - **WHEN** claude 用户未选择模型且 1M 开关状态与供应商当前状态一致 - **THEN** 保存按钮禁用 | 弹窗零改动；canApply=selectedModel\|\|oneMOnlyApply，保存按钮 disabled={!canApply\|\|isSaving}，claude 未选模型且 1M 状态一致时禁用；经代码审读确认。 |
| A30 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 一键应用含 1M - **WHEN** Claude 供应商选中 model-x 且 1M 开关开启后应用 - **THEN** SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 字段为 "model-x[1M]"，HAIKU 为 "model-x"，四个显示名字段在可覆盖时为 "model-x" | 零改动；applyModelToSettings withOneM=true 令 SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 带 [1M]、HAIKU 为 base、显示名写 base；providerModelUtils 测试“withOneM=true marks the five main fields but never HAIKU”覆盖。 |
| A31 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 应用时 Haiku 显示名同步 - **WHEN** 供应商 env 含 ANTHROPIC_DEFAULT_HAIKU_MODEL="old-haiku" 与 ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME="old-haiku"，用户应用 model-x（1M 关） - **THEN** ANTHROPIC_DEFAULT_HAIKU_MODEL 与 ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME 均为 "model-x" | 零改动；HAIKU 显示名等于旧 base 时随切换写新 base；测试“withOneM=false syncs the HAIKU display name with the new base”覆盖。 |
| A32 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 应用时保留自定义 Haiku 显示名 - **WHEN** ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME 为用户自定义值（非空且不等于旧 base / 旧 base[1M]） - **THEN** 应用新模型后该显示名保持不变 | 零改动；自定义 HAIKU 显示名保留；测试“keeps a user-customized HAIKU display name”覆盖。 |
| A33 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 仅开 1M 保留角色差异 - **WHEN** 供应商 SONNET="model-a"、OPUS="model-b"（无 [1M]），用户未选模型把 1M 开关打开后保存 - **THEN** SONNET="model-a[1M]"、OPUS="model-b[1M]"，HAIKU 与显示名字段不变 | 零改动；setClaudeOneMInSettings enable 原地追加 [1M] 且保留角色差异；测试“enable appends [1M] to the five 1M-capable fields in place”覆盖（SONNET=model-a[1M]、OPUS=model-b[1M]、HAIKU 不变）。 |
| A34 | passed | specs/provider-model-quick-view-switch/spec.md | Claude 仅关 1M - **WHEN** 供应商 SONNET="model-a[1M]"，用户未选模型把 1M 开关关闭后保存 - **THEN** SONNET="model-a"，HAIKU 与显示名字段不变 | 零改动；disable 原地剥离 [1M]；测试“disable strips existing [1M] markers in place”覆盖。 |
| A35 | passed | specs/provider-model-quick-view-switch/spec.md | Codex 应用 - **WHEN** Codex 供应商选中 model-y 后应用 - **THEN** config TOML 的 model = "model-y"，其余 TOML 字段不变 | 零改动；applyModelToSettings codex 经 setCodexModelName 写 TOML model、其余行不变；测试“replaces the TOML model while leaving other lines intact”覆盖。 |
| A36 | passed | specs/provider-model-quick-view-switch/spec.md | 改动集中 - **WHEN** 检查本 change 改动文件 - **THEN** 新逻辑在 ModelQuickSwitch/ 目录与 providerModelUtils 工具；ProviderCard 仅模型徽章渲染（含 1M 标记）、徽章/占位按钮入口与弹窗挂载；ProviderCardActions 移除模型菜单项 | git status/diff 显示改动仅 ProviderCard.tsx（徽章 span→button、占位条件、入口）、ProviderCardActions.tsx（移除菜单项）、4 语言 i18n、2 测试；ModelQuickSwitch/、providerModelUtils 及写回路径(useModelState/providerConfigUtils) 零改动；docs/comet/specs 同步属归档步骤，未在本次改动。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| vitest targeted (model badge + card actions) | vitest run tests/components/ProviderCard.modelBadge.test.tsx tests/components/ProviderCardActions.test.tsx | . | passed | 0 | 1770 ms |
| vitest full suite | vitest run | . | passed | 0 | 30363 ms |
| typecheck | typecheck | . | passed | 0 | 10134 ms |
| format check | format:check | . | passed | 0 | 3659 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — tsc --noEmit 无输出
- pnpm format:check: passed — All matched files use Prettier code style!
- pnpm vitest run tests/components/ProviderCard.modelBadge.test.tsx tests/components/ProviderCardActions.test.tsx: passed — 10 + 4 项新增/调整用例全部通过
- pnpm vitest run: passed — 211 个测试文件 / 2519 个用例全部通过，无回归
- 已知限制: 徽章/占位按钮的可点击性只覆盖核心 4 app（claude/codex/gemini/grokbuild）；范围外 app 行为零变化，与已确认规格一致。
- 已知限制: 「点击徽章不触发拖拽」由代码审读确认（dnd-kit 监听只挂在独立拖拽手柄上），测试环境未传 dragHandleProps，无对应自动化用例。
- 已知限制: 本轮为纯前端改动，未运行 Tauri 桌面端实机验证；UI 观感（hover 背景/下划线）以代码与单测为准。

## 阻塞项

_无。_

## 风险与跳过的工作

- ModelQuickSwitchDialog 无专属组件级 UI 测试：A23-A26/A29 的弹窗内联行为（拉取接线、z-index、同行布局、1M 开关初始化、保存禁用）依靠“组件零改动(git diff) + 代码审读 + 底层库/providerModelUtils 既有测试”确认，而非针对该弹窗的自动化场景测试。此为既有状况，非本次改动引入，且写回/1M 数据层已由 providerModelUtils.test.ts 覆盖。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | Native Shape artifacts changed | 2026-10-09T05:19:41.251Z |
| 2 | 1 | 1 | pass | — | 36/36 项通过。快捷切换入口已从 ⋯ 更多菜单迁移到卡片模型徽章/占位按钮：ProviderCardActions 移除「模型快捷切换」项与 Boxes 图标且第二道分隔线条件收窄为四项；ProviderCard 徽章由 span 改为可键盘访问的原生 button（cursor-pointer、hover 浅背景/下划线、focus-visible ring、aria-label），title 完整模型说明、1M 小标记与截断语义不变，无模型的核心 4 app 渲染占位按钮（四语言 notSet/quickModel 已补），范围外 app 零渲染；ModelQuickSwitchDialog 与 providerModelUtils 读写契约经 git diff 确认零改动，写回/1M 由 providerModelUtils.test.ts 39 用例覆盖。Runtime 四项检查（vitest-targeted/vitest-full/typecheck/format:check）与我的定向重跑均通过，日志 mtime 晚于所有源文件、对应当前实现版本。风险：弹窗无专属 UI 测试，A23-A26/A29 靠零改动+审读确认。 | 2026-10-09T05:33:17.677Z |



## 结论

36/36 项通过。快捷切换入口已从 ⋯ 更多菜单迁移到卡片模型徽章/占位按钮：ProviderCardActions 移除「模型快捷切换」项与 Boxes 图标且第二道分隔线条件收窄为四项；ProviderCard 徽章由 span 改为可键盘访问的原生 button（cursor-pointer、hover 浅背景/下划线、focus-visible ring、aria-label），title 完整模型说明、1M 小标记与截断语义不变，无模型的核心 4 app 渲染占位按钮（四语言 notSet/quickModel 已补），范围外 app 零渲染；ModelQuickSwitchDialog 与 providerModelUtils 读写契约经 git diff 确认零改动，写回/1M 由 providerModelUtils.test.ts 39 用例覆盖。Runtime 四项检查（vitest-targeted/vitest-full/typecheck/format:check）与我的定向重跑均通过，日志 mtime 晚于所有源文件、对应当前实现版本。风险：弹窗无专属 UI 测试，A23-A26/A29 靠零改动+审读确认。
