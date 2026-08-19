## Context

ProviderCard.tsx（约 500 行）是全 app 共用的卡片组件，名称行在 426-435 行（h3 后跟徽章 span 序列）。providersApi.update(provider, appId) 已有。模型字段：claude JSON env（useModelState 已定义全部字段名）、codex/grokbuild TOML config（extractCodexModelName/setCodexModelName 既有）、gemini env.GEMINI_MODEL。SearchableModelPicker（change #4）已可用于选择。1M 语义 setClaudeOneMMarker/strip/has 已有。

## Goals / Non-Goals

**Goals:** 4 app 卡片模型徽章；主页快捷切换弹窗（拉取/搜索/一键应用/1M 开关）；改动集中 fork 专属目录；纯函数工具可单测。
**Non-Goals:** 范围外 app 的模型显示/切换；表单内改动（change #3/#4 已做）；代理/切换供应商逻辑；不新增后端命令（纯前端 invoke 既有 API）。

## Decisions

### D1: 字段读写工具纯函数化 `src/utils/providerModelUtils.ts`
- `getCurrentModel(appId, settingsConfig): string`——4 app 解析（claude: SONNET→ANTHROPIC_MODEL 回退；codex/grokbuild: extractCodexModelName；gemini: GEMINI_MODEL），返回 strip [1M] 的 base
- `applyModelToSettings(appId, settingsConfig, model, opts: { withOneM?: boolean }): settingsConfig`——不可变写回（结构化深拷贝 JSON.parse(JSON.stringify) 或手写浅拷贝各层），1M 开关仅 claude 生效
- 显示名覆盖条件：`*_MODEL_NAME` 为空或等于旧模型 base（或旧 base+[1M]）时才写新 base，否则保留用户自定义名
- vitest 单测覆盖 4 app 读/写 + 1M 分支 + 显示名条件（新测试文件 providerModelUtils.test.ts）

### D2: 弹窗组件 `ModelQuickSwitchDialog`
- props：`{ provider, appId, open, onOpenChange }`
- 内部：拉取状态/结果（fetchModelsForConfig，claude 需从 settingsConfig.env 提取 ANTHROPIC_BASE_URL+ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY；codex/grokbuild 从 TOML 提取 base_url（extractCodexBaseUrl 已有）+ auth.OPENAI_API_KEY/bearer；gemini env.GOOGLE_GEMINI_BASE_URL+GEMINI_API_KEY）——探测各 app 凭据字段为空时拉取按钮禁用并提示
- 1M 开关：Switch 组件，仅 appId === "claude" 渲染，默认关
- 保存：`providersApi.update({ ...provider, settingsConfig: applyModelToSettings(...) }, appId)` + `queryClient.invalidateQueries(["providers", appId])`（确认 ProviderList 用的查询 key，实施时对齐）
- 成功 toast；失败 toast 错误

### D3: ProviderCard 注入点最小化
- 徽章：名称行 h3 后加 `{modelBadge}`（appId 守卫 4 app + 非空），样式仿现有 OMO 徽章（更弱化：`bg-muted text-muted-foreground`）
- 按钮：卡片悬停操作区（与 ProviderActions 同排或 ProviderActions 内加项）加"模型"图标按钮（Zap/Boxes icon），onClick 开弹窗；按 appId 守卫
- 弹窗挂载：卡片根内 `{dialog}`，state 提升到 ProviderCard 内部（useState open）——不改 ProviderList 接口

### D4: 与代理接管/激活状态的关系
不限制激活/接管状态——写配置即可，切换供应商时生效（与表单编辑语义一致）。正在接管的 Live 配置由后端同步逻辑处理（与表单保存同路径）。

### D5: i18n
`providerModel.*`：title（模型快捷切换）、currentModel、fetchModels（复用 providerForm.fetchModels 已有 key 则不重复）、apply、applyOneM（"应用 1M 标记"）、fetchFailed、applied（"已切换模型"）、noCredentials（"请先在编辑表单配置 API Key 与请求地址"）。zh/en/ja/zh-TW 四语言齐补。

## Risks / Trade-offs

- 写回破坏 TOML 格式 → setCodexModelName 既有 round-trip 语义，工具单测覆盖
- 显示名覆盖破坏自定义名 → D1 条件覆盖仅保守路径 + 单测
- ProviderCard 多 app 复用回归 → appId 守卫 + 987 既有测试 + 手动巡检范围外 app 不变
- invalidateQueries key 不对 → 实施时读 ProviderList/queries 实际 key 对齐
- 凭据缺失拉取 400 → D2 预检禁用+提示

## Migration Plan

feat/home-model-display 分支实施，dev:fork 巡检 4 app（拉取/切换/1M）+ 范围外 app 不变。回滚删分支。

## Open Questions

无。
