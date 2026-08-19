## 1. apiFormat Select 移位

- [x] 1.1 修改 `src/components/providers/forms/ClaudeFormFields.tsx`：将 EndpointField（约 736-761 行）外层包 flex 容器（`flex flex-wrap items-start gap-2`），左列 flex-1 放 EndpointField，右列（`w-[150px] shrink-0`）放 apiFormat Select（含 4 个 SelectItem，显示条件 `category !== "cloud_provider" && !isXaiOauthPreset`），SelectTrigger 高度与输入框对齐。保持 apiFormat/onApiFormatChange props 用法不变
- [x] 1.2 移除高级选项折叠面板内的 apiFormat 块（约 811-852 行）：Select + FormLabel + apiFormatHint `<p>` 整块删除
- [x] 1.3 调整 `hasAnyAdvancedValue`（约 237-247 行）：移除 `(!isXaiOauthPreset && apiFormat !== "anthropic")` 条件（格式已不在高级选项内）；保留其余条件与 xAI OAuth 强制折叠逻辑

## 2. 1M 表头一键全选

- [x] 2.1 修改 `src/components/providers/forms/ClaudeFormFields.tsx` 模型映射表头（约 962-984 行）：第四列"声明支持 1M"span 内嵌 Checkbox，三态：allOneM = modelRoleRows.filter(r=>r.supportsOneM).every(r=>hasClaudeOneMMarker(r.model))；anyOneM = some(...)；checked = allOneM 或（anyOneM ? "indeterminate" : false）。点击 toggle：allOneM ? 全关 : 全开，对每 supportsOneM 行 onModelChange(row.modelField, setClaudeOneMMarker(row.model, !allOneM))
- [x] 2.2 添加 i18n key：`providerForm.modelOneMToggleAll`（zh: "一键全选 1M"、en: "Toggle all 1M"）到 `src/i18n/locales/zh.json` 与 `en.json`（用作 Checkbox aria-label/title）。ja/zh-TW 可选补充

## 3. 验证

- [x] 3.1 运行 `pnpm typecheck` 通过
- [x] 3.2 运行 `pnpm test:unit` 通过（987/987 无回归）
- [x] 3.3 运行 `pnpm dev:fork` 巡检：添加/编辑 Claude 供应商，请求地址右侧可见上游格式 Select 并可切换（4 选项）；展开高级选项无格式选择与说明文字；模型映射表头"声明支持 1M"列有全选勾，点击全开 sonnet/opus/fable/subagent（haiku 不变），再点全关；部分勾选显示半选态 — 用户巡检通过（含两轮布局修正：Select 宽 280px → EndpointField rightSlot 重构 → 对齐方向纠正）
- [x] 3.4 确认已存在非默认格式供应商编辑时功能正常（格式 Select 常驻可见可改）— 用户巡检通过
- [x] 3.5 `comet classic openspec -- validate ccs-claude-form-layout` 通过

## 4. 提交

- [x] 4.1 在 `feat/claude-form-layout` 分支提交（conventional commits）。分 2 个提交 + 3 个布局修正提交：81562460（apiFormat 移位）、3ac4c876（1M 全选）、5e45db33（Select 加宽）、bb623b77（EndpointField rightSlot 重构：Select 与输入同行对齐、hint 占满整行）、6ec40b2c（全选勾对齐方向纠正）
