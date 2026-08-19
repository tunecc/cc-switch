## Why

fork 主页供应商卡片目前只显示供应商名称与徽章，看不到当前用的模型，需要进编辑表单才能看/改模型。用户日常高频操作是"换模型"（同一供应商内切换模型），当前流程（编辑 → 高级选项 → 逐字段改）太重。需要在主页直接：看模型、拉取模型、一键把所选模型应用到所有角色字段（含可选 1M 标记）。

## What Changes

- **主页卡片显示当前模型**：`ProviderCard.tsx` 供应商名称右侧显示当前模型小字徽章（`text-xs text-muted-foreground` 截断样式）。模型解析按 app：
  - claude：`settingsConfig.env.ANTHROPIC_DEFAULT_SONNET_MODEL`（回退 `ANTHROPIC_MODEL`）
  - codex / grokbuild：TOML `config` 的 `model = "..."`（复用 `extractCodexModelName`）
  - gemini：`settingsConfig.env.GEMINI_MODEL`
  - 其余 app 不显示（范围外）
- **模型快捷切换弹窗**：`ProviderCard` 的悬停操作区（ProviderActions 旁或卡片角标）加"模型"按钮，点开 `ModelQuickSwitchDialog`：
  1. 显示当前模型与供应商 baseURL/apiKey
  2. "拉取模型"按钮（复用 `fetchModelsForConfig`，含错误 toast）
  3. 拉取后内嵌 `SearchableModelPicker`（复用 change #4 移植组件）选择模型
  4. "应用 1M 标记"开关（默认关，仅 claude 显示；开则写入时对支持 1M 的角色模型追加 `[1M]`，复用 `setClaudeOneMMarker` 语义）
  5. "应用"按钮：把所选模型写入该 provider 的所有模型角色字段并保存：
     - claude：`ANTHROPIC_DEFAULT_SONNET/OPUS/FABLE/HAIKU_MODEL` + `ANTHROPIC_MODEL` + `CLAUDE_CODE_SUBAGENT_MODEL`（HAIKU/SUBAGENT 不加 [1M]，其余按开关）+ 对应 `*_MODEL_NAME` 显示名（strip [1M] 后的 base）
     - codex / grokbuild：`setCodexModelName(config, model)` 重写 TOML（单模型字段）
     - gemini：`env.GEMINI_MODEL = model`
  6. 保存走 `providersApi.update(provider, appId)`，成功后 invalidate providers 查询缓存
- **仅当前使用的 provider？**：不限制——所有卡片都可切换（未激活的供应商改配置同样有意义）。
- **上游构建零影响**：此为 fork 专属功能。为便于同步上游，新组件集中在 `src/components/providers/ModelQuickSwitch/`（fork 专属目录），ProviderCard 的侵入点仅两处（模型徽章 + 按钮），其余改动零散度低。

## Capabilities

### New Capabilities
- `provider-model-quick-view-switch`: 主页供应商卡片的模型快捷查看与切换。定义模型徽章展示契约（4 app 字段解析）、快捷切换弹窗交互（拉取/搜索选择/一键应用所有角色/1M 标记开关）与写回契约。

### Modified Capabilities
<!-- 无。 -->

## Impact

- **新增**：`src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`（弹窗）；可能的字段解析工具 `src/utils/providerModelUtils.ts`（4 app 读/写模型字段，纯函数可单测）。
- **改动**：`src/components/providers/ProviderCard.tsx`（模型徽章 + 切换按钮 + 弹窗挂载）。
- **复用**：`fetchModelsForConfig`（拉取）、`SearchableModelPicker`（选择）、`extractCodexModelName`/`setCodexModelName`（TOML 读写）、`setClaudeOneMMarker`/`stripClaudeOneMMarker`/`hasClaudeOneMMarker`（1M 语义）、`providersApi.update`（保存）。
- **i18n**：`providerModel.*` 段（zh/en 必补，ja/zh-TW 一并补齐保持一致）。
- **风险**：写回 `settingsConfig` 需深拷贝不可变更新；1M 标记写入需与表单编辑语义一致（[1M] 后缀 + *_MODEL_NAME 存 base）；ProviderCard 被多 app 列表复用，按钮/徽章渲染需按 appId 守卫（仅 4 app 显示）。
