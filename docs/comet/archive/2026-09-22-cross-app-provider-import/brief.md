# 目标

在供应商表单的预设供应商区域附近，提供从其他已启用应用中**已有供应商**导入配置的能力：点一下来源应用的导入按钮，弹出该应用的供应商列表，选中后把该供应商的**名称、备注、官网链接、API Key、API 请求地址、默认（兜底）模型名、上游 API 格式**预填进当前表单，其余配置由用户自行填写。

入口同时覆盖两种场景：**新建供应商**（与预设按钮同一区域）和**编辑供应商**（表单顶部独立入口行，导入会覆盖当前已填值的对应字段）。

现状：跨应用复用同一家上游时，用户必须在每个应用里手工重填名称 / 备注 / 官网 / Key / 请求地址；仓库里已有的跨应用能力都不覆盖这个场景——统一供应商（`UniversalProvider`）是新建一份配置再同步到 claude/codex/gemini，`import_claude_desktop_providers_from_claude` 是 claude → claude-desktop 的全量落库导入，都不支持「挑一个已有供应商、预填到另一个应用的表单」。

# 范围

- `src/components/providers/forms/ProviderPresetSelector.tsx`：新增可选插槽，用于在预设按钮区域渲染来源应用导入按钮。
- 新增 `ProviderImportEntry`（来源应用按钮行 + 来源供应商选择弹窗）：按钮行按来源应用渲染「应用图标 + 应用名」按钮；弹窗列出该应用的供应商（名称、备注、请求地址摘要），并展示将要写入的字段摘要。
- 新增纯映射层 `src/utils/providerImport.ts`：读侧按 10 个应用的 `settingsConfig` 取出可迁移字段；写侧分两条路径——`buildImportedSettingsConfig`（新建，以目标应用「自定义」模板为基底重建）与 `patchImportedSettingsConfig`（编辑，在既有配置上就地覆盖导入范围内的键）；外加默认模型名与 `apiFormat` 的跨应用映射规则。
- `src/components/providers/forms/ProviderForm.tsx` 等 5 个表单：持有导入弹窗状态与 `useProviderImportApply`，新建模式把按钮行插进 `ProviderPresetSelector`，编辑模式在表单顶部渲染同一按钮行。
- i18n：zh / zh-TW / en / ja 新增导入相关文案。
- 单元测试：映射层（含各应用读写往返）、默认模型与 apiFormat 映射、弹窗交互。

# 非目标

- 不做「导入后直接保存」——导入只改当前表单状态，仍由用户确认后手动保存。
- 不做批量导入、不做多选。
- 不改后端 / Rust、不加新的 Tauri command；映射与表单写入全部在前端完成。
- 不改统一供应商（`UniversalProvider`）与其同步链路，不改 `import_claude_desktop_providers_from_claude` 等既有导入命令。
- 不迁移图标、`custom_endpoints`、用量脚本、故障转移队列、Codex `modelCatalog`、Claude 的 `ANTHROPIC_DEFAULT_*_MODEL` 分级等其余元数据。
- 不做请求地址的 `/v1` 之类自动补全。

# 验收示例

- A1: 新建供应商表单中，来源应用导入按钮出现在预设供应商区域内；按钮只对「已在设置中启用、该应用至少有 1 个供应商、且不是当前应用」的应用出现。
- A2: 编辑供应商表单中，同一组来源应用导入按钮出现在表单顶部的独立入口行。
- A3: 点击来源应用按钮后弹出该应用的供应商列表，展示名称、备注与请求地址摘要，并展示本次将写入的字段；取消不改变表单任何字段。
- A4: 编辑模式下，弹窗明确提示导入会覆盖当前表单已填写的名称 / 备注 / 官网 / 密钥 / 请求地址。
- A5: 选中来源供应商并确认后，表单的供应商名称、备注、官网链接、API Key、API 请求地址、默认模型名被替换为该来源供应商的对应值；`meta.apiFormat` 在来源取值属于目标应用支持集合时一并替换，否则保持目标应用默认值。
- A6: 导入不影响导入范围之外的表单状态：新建模式下预设选中态回到「自定义」；图标、第二个官网链接等保持导入前状态；编辑模式下 providerKey、模型表、Codex `modelCatalog`、Gemini 顶层 `config`、`env` / `options` / `auth` 中的其他键（含 Codex `auth.json` 的登录态键）全部原样存活。
- A7: 保存出的供应商 `settingsConfig` 形状与目标应用原生新建一致（claude 写 `env.ANTHROPIC_BASE_URL` / `env.ANTHROPIC_AUTH_TOKEN`；codex 写 `auth.OPENAI_API_KEY` 与 TOML `base_url`，`wire_api` 恒为 `"responses"`；gemini 写 `env.GOOGLE_GEMINI_BASE_URL` / `env.GEMINI_API_KEY`；opencode 写 `options.baseURL` / `options.apiKey`；openclaw 写 `baseUrl` / `apiKey`；hermes 写 `base_url` / `api_key`；pi 写 `baseUrl` / `apiKey`；mcode 写 `options.baseURL` / `options.apiKey`；grokbuild 写 TOML `base_url` / `api_key`）。
- A8: 来源供应商缺少某项字段（无备注、无官网链接、无 Key、无地址）时，对应表单字段留空，不写入 `undefined`、占位文本或 `null`。
- A9: 默认模型名只在 claude / codex / gemini 三者间迁移（读侧与写侧都受限，新建与编辑两条写路径对同一目标的字段集合必须一致）；来源或目标没有该字段时目标模型字段留空（Codex 删掉模板自带的 `model` 行，不填占位模型）。
- A10: 各来源 × 目标应用组合的读写映射有单元测试覆盖，至少包含 claude↔codex、claude↔gemini、codex↔claude、opencode↔claude、hermes↔codex 五组方向，以及全部 10 个应用的读取用例；编辑模式的就地覆盖路径对每个目标应用都有「保留范围外键」的断言。
- A11: API Key 不出现在弹窗 DOM、console 日志与 toast 中（弹窗只展示地址与名称摘要）。
- A12: 既有 `tests/components/ProviderPresetSelector.test.tsx`、`tests/components/AddProviderDialog.test.tsx`、`tests/components/EditProviderDialog.test.tsx` 用例不回归。

# 约束与不变量

- 导入只改当前表单状态，不写数据库、不触发 live 配置同步、不改其他供应商。
- Codex / grokbuild 的 `config` 是 TOML 文本，写入 `base_url` / `model` / `api_key` 必须走仓库已有的保注释保键序工具（`setCodexBaseUrl`、`setCodexModelName`、`parseGrokBuildConfig` 对应写入路径），禁止 parse→stringify 整文档重序列化。
- 新建模式下目标应用的配置以该应用「自定义」预设模板为基底再写入导入字段；编辑模式在既有配置上就地覆盖。两者都不得把来源应用的 `settingsConfig` 原样搬过去。
- 请求地址一律原样复制，不做 origin / `/v1` 推断补全。
- 不改变既有表单校验、软校验确认框与提交载荷结构；`meta` 只覆盖 `apiFormat`，其余 meta 字段由表单既有逻辑决定。
- 编辑模式下导入不得改变被编辑供应商的 `id`、`category`、`sortIndex`、`inFailoverQueue`。

# 决策

- D1（用户决定）：入口作用范围为「新建 + 编辑」两种表单都提供；不另做独立的快捷切换功能。
- D9（验收后补充，Agent 决定）：编辑模式的写入边界收敛为「只覆盖请求地址 / 密钥 / 默认模型名三个键位，配置对象其余部分原样保留」。独立验收指出原实现会在编辑态整份重置应用扁平 state，把 opencode / openclaw / hermes 的 providerKey 与模型表清空（提交被硬拒且输入框在已锁定时 disabled，用户无法回填）、把 Codex 的 modelCatalog、Gemini 的扩展 config、pi 的模型表一并丢掉。因此映射层拆成 `buildImportedSettingsConfig`（新建，按模板重建）与 `patchImportedSettingsConfig`（编辑，就地覆盖）两条路径。
- D10（验收后补充，Agent 决定）：默认模型名的读侧与写侧都限制在 claude / codex / gemini。读侧原实现会从 claude-desktop 的 `env.ANTHROPIC_MODEL`（该键实际从不落盘）和 grokbuild 的 `upstreamModel`（是客户端 profile 真实模型名，不是兜底模型）取值；写侧原实现把 claude 与 claude-desktop 共用一支，导致新建 claude-desktop 时也写下 `ANTHROPIC_MODEL`——弹窗没预告过这个键，用户会在 JSON 编辑器里看到来路不明的值。现已拆成独立分支，两条写路径对同一目标的字段集合一致。
- D11（验收后补充，Agent 决定）：`meta.apiFormat` 的迁移目标排除 claude-desktop。它只在 proxy 模式下持久化该字段，direct 模式会被表单覆写回 `"anthropic"`；对着一份反正会被丢掉的写入预告「本次将写入」比不预告更糟。
- D2（用户决定）：只迁移默认 / 兜底模型名，不迁移完整模型配置。理由：模型 ID 跟着厂商走，同一家上游换应用后不一定还对；目标表单本就有「获取模型列表」从上游拉取；填错不报错、只在请求时静默失败。
- D3（用户决定）：请求地址原样复制，不按目标应用习惯补全。
- D4（用户决定）：来源与目标覆盖全部 10 个应用（claude / claude-desktop / codex / gemini / grokbuild / opencode / openclaw / hermes / pi / mcode）。
- D5（用户决定 + Agent 补充）：上游 API 格式（`meta.apiFormat`）一起迁移；当来源取值不属于目标应用的支持集合时（例如 Claude 的 `gemini_native` 迁到 Codex），保持目标应用默认值，不猜映射。
- D6（实现选择，Agent 决定）：导入入口作为可选插槽接入 `ProviderPresetSelector`，编辑模式由 `ProviderForm` 在表单顶部复用同一按钮行组件，避免两套入口逻辑。
- D7（实现选择，Agent 决定）：来源应用列表从 `settings.visibleApps` 过滤，排除当前应用与供应商数为 0 的应用。数据一次性 effect 拉取，刻意不用 react-query——若干表单测试直接 render 而不挂 `QueryClientProvider`，挂 query 会让它们直接崩。
- D8（实现选择，Agent 决定）：编辑模式下的覆盖风险在弹窗内用一行警示文案说明，不额外加二次确认框。

# 待解决问题

（无。Shape 已由用户确认进入 Build；D9–D11 是独立验收不通过后由 Agent 补充的实现侧修正，未改变用户已确认的目标与范围。）

# 验证预期

- `pnpm vitest run` 全量通过，新增映射层与弹窗用例。
- `pnpm typecheck` 通过。
- `pnpm format:check` 通过。
- `pnpm build:renderer` 通过（改动仅前端）。
- A1–A6、A8、A9、A11 由组件测试与源码阅读验证；A7、A10 由映射层往返测试验证；A12 由既有测试套件验证。
