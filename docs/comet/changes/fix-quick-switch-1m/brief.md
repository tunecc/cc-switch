# 目标

修复主页供应商卡片「模型快捷切换」弹窗的两个缺陷：

1. claude 供应商快捷切换模型（未开 1M）后，`ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`（Haiku 显示名）不随切换更新，残留旧模型名，与已更新的 `ANTHROPIC_DEFAULT_HAIKU_MODEL` 不一致。
2. claude 供应商未开 1M 时，想在快捷切换弹窗里只开启 1M、不修改模型，无法生效：保存按钮被"必须先选择模型"卡死；且弹窗打开时 1M 开关恒为关，不反映供应商当前 1M 状态（当前已开 1M 时重新应用会静默剥掉标记）。

# 范围

- `src/utils/providerModelUtils.ts`：显示名同步映射补齐 HAIKU 条目；新增"仅翻转 [1M] 标记"纯函数（原地 set/strip，不改变各角色模型 base）。
- `src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`：1M 开关按供应商当前状态初始化；claude 下未选模型时允许仅凭 1M 状态变化保存（走原地翻转路径）；保存按钮可用条件相应调整。
- `src/utils/providerModelUtils.test.ts`：补 HAIKU 显示名同步断言、翻转函数单测；修正受影响的骨架断言。
- i18n 四语言（zh-CN / en / zh-TW / ja）：仅 1M 生效时的 toast 文案。
- `docs/openspec/specs/provider-model-quick-view-switch/spec.md`：归档时同步写回契约与新增场景。

# 非目标

- codex / gemini / grokbuild 的快捷切换行为不变（仍须选择模型）。
- 统一供应商（Universal Provider）的模型同步、生成逻辑不动。
- 后端（src-tauri）不改：update → live 同步链路已验证正常。
- 编辑表单（ClaudeFormFields）的角色行/一键设置逻辑不动。

# 验收示例

- A1: claude 供应商 env 含四个 `*_MODEL_NAME`（值=旧模型 base），快捷切换到新模型（1M 关）后，四个 NAME 字段均为新模型 base；用户自定义显示名（非空且不等于旧 base / 旧 base[1M]）保留不变。
- A2: 供应商当前主对话模型带 `[1M]` 时打开弹窗，1M 开关为开；不带时为关。
- A3: 当前模型非空、未选择新模型、把 1M 开关从关切到开后保存：SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 原地追加 `[1M]`；HAIKU 字段与四个 NAME 字段值不变；各角色原有模型 base 不变（如 opus 与 sonnet 不同，切换后仍不同）。
- A4: 未选择新模型、把 1M 开关从开切到关后保存：上述五个支持 1M 的字段原地剥离 `[1M]`，其余字段不变。
- A5: 未选择新模型且 1M 开关状态与当前一致时，保存按钮不可用（无可应用的变化）。
- A6: 选择模型后应用的现有行为不变：全角色写为所选模型（1M 开则主字段加标记），四个显示名字段按"空/旧 base/旧 base[1M] 覆盖、自定义保留"同步。
- A7: 仅 1M 生效的保存给出成功 toast；保存后弹窗关闭、卡片徽章与列表刷新（现有 invalidateQueries 行为保持）。
- A8: providerModelUtils 新增/调整的单测与现有前端测试全绿。

# 约束与不变量

- `applyModelToSettings` 保持纯函数、深拷贝不可变语义；HAIKU 模型字段恒不带 `[1M]`。
- 新翻转函数同样纯函数、深拷贝；空字符串字段不添加标记；`[1M]` 匹配大小写不敏感（复用 useModelState 工具）。
- 弹窗写回仍走 providersApi.update + invalidateQueries；不新增后端命令。
- 翻转语义与编辑表单的 `handleRoleOneMChange`（逐行 setClaudeOneMMarker）一致。

# 决策

- D1（Bug1 修复方式）：把 `ANTHROPIC_DEFAULT_HAIKU_MODEL: "ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME"` 加入显示名同步映射，沿用既有"空/旧 base/旧 base[1M] 覆盖、自定义保留"语义。理由：HAIKU 模型字段本就被快捷切换覆写为新 base，显示名同步缺失是实现遗漏；表单中 Haiku 行同样有显示名字段。
- D2（Bug2 修复方式）：未选模型时的 1M 切换采用"原地翻转"而非"以当前主模型整体重写"。理由：忠实于"不修改模型"——保留各角色差异（如 opus≠sonnet），且与表单逐行翻转语义一致；整体重写会把所有角色统一成 SONNET 的模型，属于隐性行为变化。
- D3（1M 开关初始状态）：打开弹窗时从供应商当前状态初始化（复用徽章 oneM 判定：SONNET 优先、回退 ANTHROPIC_MODEL 的原始值是否以 [1M] 结尾）。理由：开关必须反映现状，否则已开 1M 的供应商重新应用会静默剥掉标记。
- D4（保存按钮可用条件）：claude 下（已选模型）或（当前模型非空且 1M 状态相对当前有变化）时可用；其余 app 维持"必须选模型"。理由：无可应用的变化时禁用，避免误导性的空保存。
- D5（toast 文案）：仅 1M 生效路径使用独立文案"已更新 1M 标记（模型保持不变）"，四语言补齐。

# 待解决问题

（无。修复范围已经用户确认：①显示名同步补齐 Haiku（空/旧base/旧base[1M] 覆盖、自定义保留）；②快捷切换弹窗支持不选模型仅翻转 1M（原地翻转、不改各角色模型）、开关按当前状态初始化、无可应用变化时保存禁用。）

# 验证预期

- `pnpm vitest run src/utils/providerModelUtils.test.ts`（及全量前端 vitest）通过。
- 新增单测覆盖：HAIKU 显示名同步（覆盖/保留两分支）、翻转函数（开/关/幂等/空字段/深拷贝不可变）。
- 弹窗行为以代码审读 + 单测为准（无既有弹窗挂载测试基建，不新增 e2e）。
