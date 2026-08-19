# Verification Report: ccs-home-model-display

> change: ccs-home-model-display
> verify_mode: full
> 产物语言：zh-CN
> 验证日期：2026-08-19

## 1. 验证范围

主页供应商卡片模型徽章（与上游 extractModelBadge 对齐）+ 模型快捷切换弹窗（拉取/搜索选择/一键应用所有角色/1M 标记开关，仅核心 4 app）。覆盖 spec `provider-model-quick-view-switch` 的 4 个 Requirement。

## 2. 验证命令与结果

### 2.1 类型检查
- `pnpm typecheck` → EXIT 0

### 2.2 单元测试
- `pnpm test:unit` → 132 文件，1016/1016 通过（987 基线 + 新增 29 个 providerModelUtils 测试，无回归）

### 2.3 OpenSpec 验证
- `comet classic openspec -- validate ccs-home-model-display` → valid

### 2.4 本机 dev 模式巡检（用户手动，含 1 轮徽章样式对齐迭代）
- `pnpm dev:fork` → 通过：
  - 4 app（Claude/Codex/Gemini/GrokBuild）卡片显示模型徽章（text-xs 字号与上游一致、Claude 三角色聚合）
  - 悬停菜单"模型"入口开弹窗；拉取→搜索选择→应用→徽章与表单字段更新
  - 1M 开关（Claude）两路径；范围外 app 无徽章无按钮
  - 徽章最初字体偏小 → 对齐上游 extractModelBadge（ef3afc34）后用户确认通过

## 3. Spec Requirement 合规

| Requirement | 状态 | 证据 |
|---|---|---|
| 1. 卡片显示当前模型 | PASS | extractModelBadgeForProvider：claude 三角色聚合 title/label + ANTHROPIC_MODEL 回退、gemini GEMINI_MODEL、codex/grokbuild TOML；空地不渲染；范围外 app null；text-xs 样式与上游一致 |
| 2. 快捷切换弹窗 | PASS | 凭据预检（claude env/codex TOML+auth/gemini env/grokbuild config api_key）、拉取 fetchModelsForConfig + 错误 toast、SearchableModelPicker、1M Switch 仅 claude、应用后 invalidate + toast + 关闭；open:false 重置状态 |
| 3. 模型写回契约 | PASS | claude 6 字段（withOneM 时 SONNET/OPUS/FABLE/ANTHROPIC_MODEL/SUBAGENT 加 [1M]，HAIKU 不加）+ 显示名条件覆盖（空/旧 base/旧 base[1M]→新 base，自定义保留）；codex/grokbuild setCodexModelName round-trip；gemini env.GEMINI_MODEL；深拷贝不可变（单测锁定） |
| 4. fork 专属目录与上游零影响 | PASS | ModelQuickSwitch/ 新目录；ProviderCard 仅徽章+按钮+挂载两注入点，isModelCapableApp 守卫核心 4 app，范围外零渲染；ProviderActions onQuickModel 可选 |

## 4. 最终 code review 结论

- review_mode: standard → PASS_WITH_SUGGESTIONS
- IMPORTANT（grokbuild 弹窗预检读 auth.OPENAI_API_KEY 但 grokbuild settingsConfig 无 auth 字段 → 拉取恒禁用）→ final-fix 修复（commit 325dcee5：改读 config TOML 的 api_key，复用 parseGrokBuildConfig）
- SUGGESTION-1（弹窗未透传 isFullUrl/apiFormat 多绕候选探测）→ 接受：主流程与主表单一致、失败有兜底，无功能缺口
- SUGGESTION-3/4、NIT-1/2 → 接受：行为与上游一致/符合 spec/非阻塞

## 5. 提交清单（5 commits，分支 feat/home-model-display）

- d50ed883 feat(fork): add provider model read/write utils with tests（含 29 单测）
- 3702b554 feat(fork): add model quick switch dialog
- 2a62477f feat(fork): show current model badge and quick-switch entry on provider cards
- ef3afc34 feat(fork): align model badge with upstream extractModelBadge
- 325dcee5 fix(fork): read grokbuild api key from config TOML in quick switch dialog

## 6. 验证结论

**PASS** — 4 Requirement 满足，写回契约逐字段核对无缺陷，typecheck/test:unit 1016/1016/validate 通过，用户巡检通过（含徽章样式对齐确认）。IMPORTANT 已 final-fix。可进入归档。