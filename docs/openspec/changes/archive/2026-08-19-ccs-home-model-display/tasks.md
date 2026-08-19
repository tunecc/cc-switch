## 1. 模型字段读写工具（纯函数 + 单测）

- [x] 1.1 新增 `src/utils/providerModelUtils.ts`：`getCurrentModel(appId, settingsConfig)`（claude: env.ANTHROPIC_DEFAULT_SONNET_MODEL 回退 ANTHROPIC_MODEL；codex/grokbuild: extractCodexModelName；gemini: env.GEMINI_MODEL；返回 strip [1M] 的 base；范围外 app 返回 ""）与 `applyModelToSettings(appId, settingsConfig, model, { withOneM })`（不可变深拷贝写回；claude 写 6 模型字段 + 3 显示名字段按条件覆盖 + 1M 开关语义：SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 加 [1M]、HAIKU 不加；codex/grokbuild: setCodexModelName；gemini: env.GEMINI_MODEL）
- [x] 1.2 新增 `src/utils/providerModelUtils.test.ts`：覆盖 getCurrentModel 4 app + 空回退 + [1M] strip；applyModelToSettings 的 4 app 写回、1M 开/关分支、HAIKU 不加标记、显示名覆盖条件（空/等于旧 base/自定义名保留）、TOML round-trip、不可变（原对象不变）。`pnpm test:unit` 全绿

## 2. 快捷切换弹窗

- [x] 2.1 新增 `src/components/providers/ModelQuickSwitch/ModelQuickSwitchDialog.tsx`：props { provider, appId, open, onOpenChange }。内容：当前模型显示、凭据预检（按 app 提取 baseURL/apiKey，缺失则拉取禁用+提示）、拉取按钮（fetchModelsForConfig + 成功/失败 toast）、拉取后内嵌 SearchableModelPicker、1M 开关（仅 claude，默认关）、应用按钮（选中后可用：applyModelToSettings → providersApi.update → invalidate providers 查询（key 与 ProviderList 实际一致）→ 成功/失败 toast → 关闭）
- [x] 2.2 弹窗用现有 Dialog 组件族；保存中 loading 态；provider 深拷贝不可变更新

## 3. ProviderCard 注入

- [x] 3.1 修改 `src/components/providers/ProviderCard.tsx`：名称行 h3 后加当前模型徽章（getCurrentModel，仅核心 4 app 且非空；样式弱化仿 OMO 徽章：`bg-muted text-muted-foreground text-[10px]`，截断 + title）
- [x] 3.2 修改 `src/components/providers/ProviderCard.tsx`：悬停操作区加"模型"图标按钮（仅核心 4 app），useState 控制弹窗 open，挂载 ModelQuickSwitchDialog

## 4. i18n

- [x] 4.1 四 locale 补 `providerModel.*` 段：title/currentModel/fetchModels（如复用 providerForm.fetchModels 则不重复）/apply/applyOneM/applied/noCredentials（文案见 design D5），zh/en/ja/zh-TW 齐全

## 5. 验证

- [x] 5.1 `pnpm typecheck` 通过
- [x] 5.2 `pnpm test:unit` 通过（含新增 providerModelUtils.test.ts，无回归）
- [x] 5.3 `pnpm dev:fork` 巡检：4 app 卡片显示模型徽章（含空模型不显示）；模型按钮开弹窗；拉取→搜索→选择→应用后卡片徽章与编辑表单字段更新（claude 含 1M 开关两种路径）；范围外 app 卡片无徽章无按钮行为不变
- [x] 5.4 `comet classic openspec -- validate ccs-home-model-display` 通过

## 6. 提交

- [x] 6.1 分支提交（conventional commits，可分 3-4 个提交：工具+单测 / 弹窗 / 卡片注入 / i18n）
