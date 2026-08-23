# Outcome

Claude 供应商编辑表单「默认兜底模型」直达区中，「一键设置」「获取模型列表」两个按钮的右边缘改为与 `ANTHROPIC_MODEL`（兜底模型名）输入框的右边缘对齐，不再对齐到表单整行右边缘。

# Scope

- `src/components/providers/forms/ClaudeFormFields.tsx`
  - 「默认兜底模型」区块的头部行（承载 FormLabel 与两个按钮的容器）由 `flex items-center justify-between` 改为与输入行一致的网格 `grid grid-cols-1 gap-2 md:grid-cols-[1fr_minmax(0,104px)]`。
  - 标签与按钮置于第一列（`1fr`）内，仍用 `flex items-center justify-between` 排布；第二列（`104px`）留空。
  - 输入行（输入框 + 1M 勾选）网格保持不变。
  - 按钮尺寸、`size="sm"`、`h-7`、图标、文案、禁用态、`onClick` 行为全部不变。

# Non-goals

- 不改按钮功能逻辑（一键设置取值优先级、获取模型列表按供应商类型拉取、禁用条件）。
- 不改输入行网格、1M 勾选、hint 文案、高级选项折叠区及其内部内容。
- 不改 Codex / Gemini / Claude Desktop 表单。
- 不改 i18n 文案。
- 不做后端 / Rust 侧改动。
- 不引入额外的水平留白魔法值（如 `pr-[112px]`）；对齐通过复用输入行网格实现。

# Acceptance examples

- A1: md 及以上视口下，「默认兜底模型」区块头部行使用与输入行相同的 `md:grid-cols-[1fr_minmax(0,104px)]` 网格；标签在第一列左侧，两个按钮在第一列右侧（`justify-between`）。两个按钮所在容器的右边缘 = 输入框（第一列）的右边缘，而不是整行右边缘。
- A2: 移动端（`grid-cols-1`）下，头部行第一列内部仍以 `flex items-center justify-between` 排布标签与按钮，响应式行为与改动前一致；输入行（输入框 + 1M 勾选）布局不变。
- A3: 两个按钮的功能、禁用条件、图标、文案、`size="sm"` / `h-7` 外观与改动前一致；1M 勾选、hint 文案、高级选项折叠区及其内部按钮/角色表行为不受影响。
- A4: 既有 `tests/components/ClaudeFormFields.test.tsx` 用例不回归；`pnpm vitest run tests/components/ClaudeFormFields.test.tsx` 通过。

# Constraints and invariants

- 不改 env 写入语义（`useModelState.handleModelChange`、空值删除键）。
- 不改一键设置取值优先级（ANTHROPIC_MODEL → Sonnet → Opus → Fable → Haiku → Subagent）。
- OAuth 预设（Copilot / Codex OAuth / xAI）下兜底模型输入仍走各自 `renderModelInput` 分支。
- 对齐通过复用输入行网格实现，不依赖硬编码像素留白。

# Decisions

- D1（实现选择，Agent 决定）：通过让头部行复用输入行相同的 `md:grid-cols-[1fr_minmax(0,104px)]` 网格，把标签+按钮放入第一列、第二列留空，使按钮右边缘自然落在输入框右边缘，避免魔法值并保持响应式一致。

# Open questions

- [blocking] CONFIRM: 目标、范围、关键决定、验收标准与非目标的最终共享理解确认。

# Verification expectations

- `pnpm vitest run tests/components/ClaudeFormFields.test.tsx` 通过。
- 相关既有测试不回归。
- A1 的对齐关系通过阅读源码可验证（头部行与输入行使用相同网格模板，按钮在第一列 `justify-between` 右端）。
