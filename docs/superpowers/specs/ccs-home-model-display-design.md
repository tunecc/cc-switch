---
comet_change: ccs-home-model-display
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-19-ccs-home-model-display
status: final
---

# Design Doc: ccs-home-model-display

> OpenSpec change: `ccs-home-model-display`
> 产物语言：zh-CN
> 依赖：SearchableModelPicker（change #4）、1M 语义工具（上游既有）、extractCodexModelName/setCodexModelName（上游既有）

## 1. 背景与目标

主页卡片看不到模型、换模型要进表单逐字段改。目标：4 app（claude/codex/gemini/grokbuild）卡片显示当前模型徽章 + 悬停"模型"按钮打开快捷切换弹窗（拉取→搜索→一键应用所有角色→可选 1M 标记）。改动集中 fork 专属目录。

**非目标**：范围外 app；表单内改动；后端命令；代理逻辑。

## 2. 技术决策

### D1: 纯函数工具 `src/utils/providerModelUtils.ts`
- `getCurrentModel(appId, settingsConfig)`：4 app 解析，返回 strip [1M] base；范围外返回 ""
- `applyModelToSettings(appId, settingsConfig, model, { withOneM })`：JSON 深拷贝不可变写回；claude 6 模型字段（SONNET/OPUS/FABLE/HAIKU/ANTHROPIC_MODEL/SUBAGENT，前 5 中除 HAIKU 外按开关加 [1M]）+ 3 显示名字段条件覆盖（空或等于旧 base/base[1M] 时写新 base，自定义名保留）；codex/grokbuild setCodexModelName；gemini env.GEMINI_MODEL
- vitest 单测全分支覆盖

### D2: 弹窗 `ModelQuickSwitchDialog`
props { provider, appId, open, onOpenChange }。凭据预检（claude: env.ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY；codex: TOML base_url + auth.OPENAI_API_KEY（bearer 亦可）；grokbuild: TOML base_url + auth；gemini: env.GOOGLE_GEMINI_BASE_URL + GEMINI_API_KEY）→ 缺失禁用拉取+提示。拉取用 fetchModelsForConfig（各 app 对应参数）；SearchableModelPicker 选择；1M Switch 仅 claude；应用 = applyModelToSettings → providersApi.update（深拷贝 provider）→ invalidate providers key（实施时对齐 ProviderList 实际 queryKey）→ toast → 关闭。

### D3: ProviderCard 注入最小化
徽章：h3 后（appId 4 app 守卫 + 非空，弱化样式仿 OMO 徽章）。按钮：悬停操作区加图标按钮（4 app 守卫），弹窗 state 在卡片内部 useState。不改 ProviderList 接口。

### D4: 不限激活/接管状态
写配置与表单保存同路径；接管中 Live 同步由后端既有逻辑处理。

### D5: i18n providerModel.* 四语言
title/currentModel/apply/applyOneM/applied/noCredentials（fetchModels 复用 providerForm 既有 key）。

## 3. 实施方案

1. providerModelUtils.ts + test（纯函数先行，TDD 式但 tdd_mode=direct——先写实现再补测试亦可，测试必须全分支）
2. ModelQuickSwitchDialog.tsx（复用 Dialog/SearchableModelPicker/Switch/toast）
3. ProviderCard.tsx 两处注入
4. i18n 4 locale
5. 验证：typecheck / test:unit（含新测试）/ dev:fork 巡检 4 app + 范围外不变 / validate

## 4. 风险与缓解

- TOML 写坏 → setCodexModelName round-trip 语义 + 单测
- 显示名覆盖破坏自定义 → 条件覆盖 + 单测
- ProviderCard 多 app 回归 → appId 守卫 + 987 既有 + 巡检范围外
- queryKey 不对 → 实施时读 ProviderList 对齐

## 5. 验收

spec 4 Requirement：徽章（4 app/空不显示/范围外不显示）/ 弹窗（拉取/选择/应用）/ 写回契约（claude 1M 分支、codex TOML、gemini env）/ 改动集中（ModelQuickSwitch/ + 工具 + ProviderCard 两注入点）。

## 6. 任务分解

详见 OpenSpec tasks.md（6 组 12 任务）。
