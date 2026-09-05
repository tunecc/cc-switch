# 目标

让每个供应商的「官网链接」支持填写两个（覆盖 Claude Code、Codex 等全部应用的供应商）：

1. 编辑表单提供第二个官网链接输入框，与现有第一个并列、各自独立填写。
2. 主页供应商卡片上，两个官网链接横排显示在同一行，中间以两个空格分隔；仅填写一个时只显示一个。
3. 点击任一链接，通过系统默认浏览器打开对应 URL。

# 范围

- 前端类型：`src/types.ts`（`Provider.websiteUrl2?`、`UniversalProvider.websiteUrl2?`）
- 主页卡片：`src/components/providers/ProviderCard.tsx`（双链接横排渲染、逐链接点击回调）
- 共享表单字段：`src/components/providers/forms/BasicFormFields.tsx`（第二个「官网链接」输入框，覆盖 claude/codex/gemini/opencode/openclaw/hermes/claude-desktop/pi/grokbuild 全部表单）
- 表单值映射：`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`AddProviderDialog.tsx`、`EditProviderDialog.tsx`（defaultValues 与提交映射 `websiteUrl2`）
- 统一供应商：`src/components/universal/UniversalProviderFormModal.tsx`（第二输入框 + 提交映射）
- 透传通道：`src/App.tsx`（复制供应商）、`src/components/providers/ProviderList.tsx`（搜索过滤字段）、`src/lib/api/failover.ts`（局部 Provider 结构透传）
- 校验：`src/lib/schemas/provider.ts`（`websiteUrl2` 非空时必须是有效 URL，与第一链接同规则）
- i18n：`src/i18n/locales/{zh,zh-TW,ja,en}.json`（第二个链接的标签与占位文案）
- Rust：`src-tauri/src/provider.rs`（`Provider.website_url_2`、`UniversalProvider.website_url_2` 及 to_claude/codex/gemini_provider 转换）
- 数据库：`src-tauri/src/database/schema.rs`（providers 表 DDL 新列 `website_url_2` + v18→v19 迁移）、`src-tauri/src/database/mod.rs`（SCHEMA_VERSION 提升）、`src-tauri/src/database/dao/providers.rs`（SELECT/INSERT/UPDATE 列）
- 测试：前端单测（表单双字段、卡片双链接渲染与点击、搜索过滤）与 Rust 测试（DAO 读写新列）

# 非目标

- 不为内置预设/官方种子供应商预填第二个链接内容（用户自填）
- 不改 deeplink 导入的 `homepage` 单链接映射
- 不改 MCP / Skills / Prompts 等其他实体各自的 homepage 字段
- 不改点击链接的打开方式本身（现有 `openExternal` 已是系统默认浏览器）
- 不支持两个以上链接

# 验收示例

- A1 表单双字段：所有应用的供应商编辑表单（含统一供应商表单）出现第二个官网链接输入框；两个链接独立填写；非空时第二链接必须是有效 URL 才能保存；保存后重新打开编辑对话框，两个链接各自回填。
- A2 主页横排展示：主页供应商卡片上配置了两个官网链接的供应商，在同一行横排显示两个链接、中间为两个空格（空格在渲染中可见，不塌缩）；仅填一个链接时只显示该一个；两个链接都为空时维持现状（回退 API base URL / 占位文本）。
- A3 点击跳转默认浏览器：点击主页卡片上任一链接，触发现有 `openExternal` 以系统默认浏览器打开对应 URL；两个链接打开各自 URL。
- A4 持久化与兼容：`websiteUrl2` 保存进数据库，应用重启后仍存在；旧数据（只有 `websiteUrl`）升级迁移后行为与现状完全一致；数据库 schema 迁移幂等无损。
- A5 通道同步：搜索框可按第二个链接匹配供应商；复制供应商时第二个链接一并复制；统一供应商生成 claude/codex/gemini 供应商时第二个链接随行。
- A6 回归不变：单链接供应商的展示与点击行为不变；notes 优先展示、卡片布局、编辑/新建/复制/搜索流程、表单内「获取 API Key」链接（仍用第一链接）等既有行为不回归。
- A7 测试与构建：新增前端单测（表单双字段、卡片双链接渲染与点击回调、搜索匹配第二链接）；既有相关测试更新并通过；类型检查与前端构建通过；Rust `cargo test` 通过。

# 约束与不变量

- `websiteUrl` 现有语义完全不变：仍是第一个链接，同时继续作为表单内「获取 API Key」链接的来源。
- 卡片 URL 行展示优先级保持现状：notes（不可点击）→ 官网链接（1/2，可点击）→ 提取的 API base URL（可点击）→ 「未配置接口地址」占位。
- 数据库新列通过 `add_column_if_missing` 幂等追加，不重建 providers 表；schema 版本 18 → 19。
- Rust serde 序列化使用 `#[serde(rename = "websiteUrl2", skip_serializing_if = "Option::is_none")]`，保持 JSON 兼容（旧版本读取新数据忽略该字段）。
- 第二链接为空时不持久化（`undefined`/`None`），不产生空字符串列值。
- UI 沿用现有组件体系（ImeSafeInput、FormField 等）与 i18n 键命名习惯。
- 两链接横排为单行布局，超长链接各自截断并带 title 提示，不换行撑破卡片。

# 决策

- D1（数据模型）：`websiteUrl` 保持为第一个链接，新增可选 `websiteUrl2`（Rust `website_url_2`、SQLite `website_url_2`）。理由：向后兼容最优——旧数据天然就是第一链接，旧版本读取新数据安全忽略第二字段，无需数据搬迁。
- D2（表单形态）：两个独立输入框（「官网链接」+「官网链接 2」），而非一个输入框内分隔符存两个 URL。理由：「填写两个」最自然的表达是两个填写位；独立字段避免分隔符解析歧义与校验复杂度。
- D3（主页展示）：两个链接横排同一行、以两个空格字符分隔（渲染上使用等价手段保证空格可见，如 `whitespace-pre` 或 `&nbsp;`），每个链接独立可点击。理由：按用户明确要求「横排放置，两个空格来间隔」。
- D4（展示优先级）：沿用现有 fallback 链，仅在「官网链接」档位从单值变为 1-2 个值。理由：最小行为变更，notes 用户与无链接用户看到的界面不变。
- D5（范围）：全部应用的供应商表单 + 统一供应商表单。理由：共享 `BasicFormFields` 使全应用覆盖近乎零成本，且用户明确说「等所有的」。
- D6（预设内容）：内置预设与官方种子不预填第二链接。理由：「可以填写两个」是能力要求，各供应商的第二个链接内容（控制台/文档/落地页）只有用户知道，不宜替用户猜测。
- D7（共享理解确认）：用户于 2026-09-05 确认目标、范围、D1–D6、验收标准与非目标，无调整。

# 待解决问题

（无）

# 验证预期

- 前端单测：双链接卡片渲染（横排、两个空格分隔、单链接/空链接回退）、点击回调携带对应 URL、表单第二字段回填与校验、搜索匹配第二链接。
- Rust 测试：DAO 读写 `website_url_2`、schema 迁移幂等（v18 库升级后旧数据不变）。
- `pnpm typecheck`（或等价 tsc）、前端构建、`cargo test` 通过。
