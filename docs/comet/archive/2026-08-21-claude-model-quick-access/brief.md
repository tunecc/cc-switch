# Outcome

Claude 供应商编辑表单中，「默认兜底模型」(ANTHROPIC_MODEL) 及其 1M 声明不再藏在「高级选项」折叠区内，直接显示在请求地址下方，无需展开即可编辑；「一键设置」「获取模型列表」按钮随行放置，支持「先设兜底模型 → 一键应用到各模型角色」的高频流程。「声明支持 1M」表头一键勾选扩展为同时作用于默认兜底模型。

# Scope

- `src/components/providers/forms/ClaudeFormFields.tsx`
  - 布局重排：默认兜底模型区块（输入框 + 1M 勾选 + hint）移至 EndpointField（请求地址）之后、「高级选项」Collapsible 之前，按 `shouldShowModelSelector` 显示。
  - 「一键设置」「获取模型列表」按钮从高级选项内模型映射头部移至兜底模型区块头部，高级选项内不再保留重复按钮。
  - `allOneMEnabled` / `someOneMEnabled` 统计与表头「声明支持 1M」一键勾选循环加入 ANTHROPIC_MODEL（兜底模型）。
  - `hasAnyAdvancedValue` 移除 `claudeModel`：仅兜底模型有值不再自动展开高级选项。
- `tests/components/ClaudeFormFields.test.tsx` 增补用例。

# Non-goals

- 不改 Codex / Gemini / Claude Desktop 表单。
- 不改模型快捷切换弹窗（ModelQuickSwitchDialog）与 `providerModelUtils` 读写语义。
- 不改 [1M] 标记语义（Haiku 角色不参与 1M）。
- 不做后端 / Rust 侧改动。
- 工作区中用户已有的 README.md 未提交改动保留不动。

# Acceptance examples

- A1: 编辑非官方类别的 Claude 供应商时，「默认兜底模型」输入框（含 1M 勾选）渲染在请求地址字段下方、高级选项折叠区之外，无需展开即可查看和编辑。
- A2: 「一键设置」按钮位于兜底模型区块内且无需展开即可点击；点击后按既有优先级（ANTHROPIC_MODEL → Sonnet → Opus → Fable → Haiku → Subagent）取值写入全部角色（含 Subagent），Haiku 仍剥离 [1M] 标记，行为与现状一致。
- A3: 「声明支持 1M」表头一键勾选的统计（全选/半选）与切换均包含兜底模型：全选时 ANTHROPIC_MODEL 加 [1M] 标记，取消时移除；兜底模型单独勾选 1M 时表头呈半选状态。
- A4: 高级选项折叠区内不再出现默认兜底模型区块，也不重复出现「一键设置」「获取模型列表」按钮；认证字段、模型映射角色表、UA、本地代理覆盖保持原行为。
- A5: 仅兜底模型有值时打开表单，「高级选项」不自动展开。
- A6: 新增/调整的组件测试覆盖 A2、A3、A5，全部 vitest 相关用例通过。

# Constraints and invariants

- 保持既有 env 写入语义（useModelState.handleModelChange，空值删除键）。
- OAuth 预设（Copilot / Codex OAuth / xAI）下兜底模型输入仍走各自 renderModelInput 分支。
- 一键设置取值优先级不变。
- 获取模型列表按钮全局仅一份，所拉取模型列表对兜底输入与角色行输入共享。

# Decisions

- D1（2026-08-21 用户选定）：「拿出来」的范围 = 只移出「默认兜底模型」区块。兜底模型输入框 + 1M 勾选 + 「一键设置」+ 「获取模型列表」整体放到请求地址（EndpointField）正下方；「模型映射」角色表仍留在高级选项折叠区内。理由：兜底模型 + 一键设置是最高频路径，角色表仅在差异化微调时使用，留在折叠区可保持表单主体简洁。

# Open questions

- [blocking] CONFIRM: 目标、范围、关键决定、验收标准与非目标的最终共享理解确认。

# Verification expectations

- `pnpm vitest run tests/components/ClaudeFormFields.test.tsx` 通过。
- 相关既有测试不回归。
