## 1. 组件移植

- [x] 1.1 新增 `src/components/providers/forms/shared/SearchableModelPicker.tsx`：从上游 `/Users/tune/Downloads/cc-switch-main/src/components/providers/forms/shared/SearchableModelPicker.tsx` 原样复制（110 行：Popover 触发 + CommandInput 搜索 + ownedBy 分组排序 + Check 当前值 + onSelect 关闭），import 路径适配（@/components/ui/*、@/lib/utils、FetchedModel 类型不变）

## 2. 接入

- [x] 2.1 修改 `src/components/providers/forms/shared/ModelInputWithFetch.tsx`：`ModelDropdown` 替换为 `SearchableModelPicker`（`<SearchableModelPicker models={fetchedModels} value={value} onSelect={onChange} />`），import 更新
- [x] 2.2 修改 `src/components/providers/forms/ClaudeFormFields.tsx` Copilot 分支（renderModelInput 内）：`<ModelDropdown models={copilotFetchedModels} onSelect={updateValue} />` 替换为 `<SearchableModelPicker models={copilotFetchedModels} value={value} onSelect={updateValue} />`，import 从 shared 引入 SearchableModelPicker（该文件已有 shared import 块，加入即可；ModelDropdown import 若不再使用则移除）
- [x] 2.3 修改 `src/components/providers/forms/shared/index.ts`：导出 `SearchableModelPicker`

## 3. i18n

- [x] 3.1 四个 locale 的 providerForm 段补 `searchModels` 与 `noModelsFound`：zh "搜索模型..."/"未找到匹配模型"、en "Search models..."/"No models found"、ja "モデルを検索..."/"一致するモデルが見つかりません"、zh-TW "搜尋模型..."/"未找到符合模型"。插在 fetchModels 相关 key 附近

## 4. 验证

- [x] 4.1 运行 `pnpm typecheck` 通过
- [x] 4.2 运行 `pnpm test:unit` 通过（987/987 无回归）
- [x] 4.3 运行 `pnpm dev:fork` 巡检：Claude 普通供应商填 baseURL+apiKey 拉取模型后，模型输入旁下拉打开为可搜索列表（输入关键词过滤、按供应商分组、当前值打勾、选择后回填关闭）；Copilot 预设下拉同样可搜索
- [x] 4.4 确认其余表单（Hermes/OpenClaw/OpenCode/Pi/Codex/ClaudeDesktop）模型下拉行为不变
- [x] 4.5 `comet classic openspec -- validate ccs-model-search-port` 通过

## 5. 提交

- [x] 5.1 分支提交（conventional commits）：可分 2 个提交——组件移植+接入 / i18n
