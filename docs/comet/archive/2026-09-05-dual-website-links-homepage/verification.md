---
generated_from_state_version: 13
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 2
- 验证器尝试次数: 2
- 完成时间: 2026-09-05T15:26:13.242Z
- 摘要: 19 项验收逐项在代码与测试断言中定位到直接证据，全部 passed。覆盖前端表单/校验/卡片渲染/搜索/复制、Rust serde 契约、providers 表新列与 v18→v19 幂等迁移、DAO 全链路、统一供应商生成随行及前后端测试断言。关键项（两空格可见性、逐链接点击、双值持久化互不覆盖、清空置 NULL、同规则校验、notes 优先、按第二链接搜索、复制携带）均有实现行号 + 直接测试断言双重佐证。四条非阻塞风险记录于 risks。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1 表单双字段：所有应用的供应商编辑表单（含统一供应商表单）出现第二个官网链接输入框；两个链接独立填写；非空时第二链接必须是有效 URL 才能保存；保存后重新打开编辑对话框，两个链接各自回填。 | 共享 BasicFormFields.tsx:195-215 第二输入框覆盖全部 app 表单（ProviderForm:2177、ClaudeDesktop:885、GrokBuild:450、Pi:1353），统一表单 modal:475-489 独立双字段；zod provider.ts:41-45 非空时同第一链接规则强制 URL；回填见 EditProviderDialog.test.tsx:212 与 BasicFormFields.test.tsx:47 |
| A2 | passed | brief.md | A2 主页横排展示：主页供应商卡片上配置了两个官网链接的供应商，在同一行横排显示两个链接、中间为两个空格（空格在渲染中可见，不塌缩）；仅填一个链接时只显示该一个；两个链接都为空时维持现状（回退 API base URL / 占位文本）。 | 卡片两链接同一任务行横排 flex 不换行，中间 whitespace-pre 包两空格不塌缩（ProviderCard.tsx:642-667）；仅一链接只显示一个，双空回退 base URL/占位；测试断言两空格 textContent 与按钮数（ProviderCard.websiteLinks.test.tsx:69-132） |
| A3 | passed | brief.md | A3 点击跳转默认浏览器：点击主页卡片上任一链接，触发现有 `openExternal` 以系统默认浏览器打开对应 URL；两个链接打开各自 URL。 | 每链接独立 button onClick=onOpenWebsite(link)（ProviderCard.tsx:659）→ App.tsx:727-738 → invoke('open_external') → opener().open_url 系统默认浏览器（misc.rs:23-35）；测试每次点击携带各自 URL（test:86-100） |
| A4 | passed | brief.md | A4 持久化与兼容：`websiteUrl2` 保存进数据库，应用重启后仍存在；旧数据（只有 `websiteUrl`）升级迁移后行为与现状完全一致；数据库 schema 迁移幂等无损。 | websiteUrl2 经 DAO INSERT/UPDATE/replace 落库（dao/providers.rs:211/228/258/351），round-trip 测试 database/tests.rs:941-996；serde camelCase+skip_none 测试证明旧 JSON 无键→None（provider.rs:1132-1161）；add_column_if_missing 幂等（schema.rs:1616-1621 + create_tables_on_conn:423-424） |
| A5 | passed | brief.md | A5 通道同步：搜索框可按第二个链接匹配供应商；复制供应商时第二个链接一并复制；统一供应商生成 claude/codex/gemini 供应商时第二个链接随行。 | 搜索字段含 websiteUrl2（ProviderList.tsx:371）+专门测试（ProviderList.test.tsx:336-371）；复制透传（App.tsx:839）；统一供应商 to_claude/codex/gemini_provider 均带 website_url_2（provider.rs:807/873/909）；failover.ts:14 结构透传 |
| A6 | passed | brief.md | A6 回归不变：单链接供应商的展示与点击行为不变；notes 优先展示、卡片布局、编辑/新建/复制/搜索流程、表单内「获取 API Key」链接（仍用第一链接）等既有行为不回归。 | 单链接只渲染一个（test:113-132）；notes 优先且不可点击（ProviderCard.tsx:283-284 + test:134-145）；卡片布局/截断 title 保留；Get API Key 仍用第一链接（ProviderForm.tsx:1883 等、ClaudeDesktop:417、GrokBuild:182/463） |
| A7 | passed | brief.md | A7 测试与构建：新增前端单测（表单双字段、卡片双链接渲染与点击回调、搜索匹配第二链接）；既有相关测试更新并通过；类型检查与前端构建通过；Rust `cargo test` 通过。 | 新增前端单测存在（BasicFormFields.test.tsx:47/82、ProviderCard.websiteLinks.test.tsx、ProviderList.test.tsx:336、providerSchema.websiteUrl2.test.ts）；既有测试更新（EditProviderDialog/ClaudeDesktop/GrokBuild）；Runtime 检查 typecheck/test:unit/build:renderer/cargo 全部 exit 0 |
| A8 | passed | specs/provider-website-links/spec.md | 只填第一个链接 - **WHEN** 用户仅填写第一个官网链接并保存 - **THEN** 数据库中 `website_url` 为该值、`website_url_2` 为 NULL，行为与旧版本一致 | 仅填第一链接时前端映射 undefined→SQL None→NULL（EditProviderDialog.tsx:317、AddProviderDialog.tsx:172）；DAO round-trip 测试断言清空第二链后 website_url 保留、website_url_2=None（database/tests.rs:983-995） |
| A9 | passed | specs/provider-website-links/spec.md | 两个字段均保存 - **WHEN** 用户填写两个官网链接并保存，重启应用后读取 - **THEN** 两个链接均从数据库恢复且互不覆盖 | DAO round-trip 测试同时保存两字段再分别读回，各读各值互不覆盖（database/tests.rs:941-996，get_provider_by_id 与 get_all_providers 双路径） |
| A10 | passed | specs/provider-website-links/spec.md | 旧数据升级 - **WHEN** 仅含 `website_url` 的旧数据库升级到新 schema（v18 → v19） - **THEN** 迁移幂等无损，旧数据不变，`website_url_2` 为 NULL | 迁移链测试从旧版本走至 v19，断言 website_url_2 列存在且旧行保持 NULL 不丢（database/tests.rs:606-651）；add_column_if_missing 幂等不重建表；SCHEMA_VERSION=19（mod.rs:56）与迁移分支（schema.rs:556-560）齐备 |
| A11 | passed | specs/provider-website-links/spec.md | 填写并保存第二个链接 - **WHEN** 用户在第二个官网链接输入框填入有效 URL 并保存 - **THEN** 保存成功，重新打开编辑对话框时两个输入框分别回填各自链接 | 编辑对话框回填 websiteUrl2（EditProviderDialog.tsx:281）并随提交透传（:317），专门测试断言回填与保存一致（EditProviderDialog.test.tsx:212-250）；统一表单 editingProvider→setWebsiteUrl2（modal:74） |
| A12 | passed | specs/provider-website-links/spec.md | 第二链接校验 - **WHEN** 用户在第二个输入框填入非 URL 文本并提交 - **THEN** 表单校验失败并提示，与第一链接同语义 | provider.ts:41-45 与第一链接完全相同的 .url("请输入有效的网址") 校验；schema 测试断言非 URL 失败且报错消息相同（providerSchema.websiteUrl2.test.ts:26-39）；四种表单均 zodResolver(providerSchema) |
| A13 | passed | specs/provider-website-links/spec.md | 第二链接留空 - **WHEN** 用户清空第二个输入框并保存 - **THEN** 该字段不持久化（NULL/undefined），不影响第一链接 | 清空后映射 undefined（EditProviderDialog.tsx:317、AddProviderDialog.tsx:172、modal:204/230），DAO 测试断言更新 None 后落库 NULL、第一链接不受影响（database/tests.rs:984-995） |
| A14 | passed | specs/provider-website-links/spec.md | 两个链接横排展示 - **WHEN** 某供应商配置了两个官网链接且无备注 - **THEN** 卡片 URL 行横排显示两个链接，中间为两个可见空格；两个链接分别为独立可点击元素 | 同一行 flex（ProviderCard.tsx:644）两个独立 button，两空格置于 whitespace-pre span 可见不塌缩（:649-656）；测试断言 textContent 两空格 + 2 按钮（test:69-84） |
| A15 | passed | specs/provider-website-links/spec.md | 点击第二个链接 - **WHEN** 用户点击卡片上的第二个链接 - **THEN** 系统默认浏览器打开第二个链接的 URL（非第一个） | 第二链接 button 触发 onOpenWebsite(第二URL)；测试先点第二链接断言只以该 URL 被调、再点第一链接各自 URL（test:86-100） |
| A16 | passed | specs/provider-website-links/spec.md | 备注优先级不变 - **WHEN** 某供应商同时配置了备注和两个官网链接 - **THEN** 卡片 URL 行显示备注（不可点击），与现状一致 | websiteLinks memo 在 notes 存在时返回空（ProviderCard.tsx:283-284），回退按钮展示 notes 且不可点击；测试断言显示备注且无链接（test:134-145） |
| A17 | passed | specs/provider-website-links/spec.md | 无链接回退 - **WHEN** 某供应商两个官网链接均为空 - **THEN** 卡片展示提取的 API base URL 或占位文本，与现状一致 | 两链接皆空落入 displayUrl 分支，取 API base URL 或占位文本（extractApiUrl ProviderCard.tsx:130-176）；测试断言回退与点击（test:147-165） |
| A18 | passed | specs/provider-website-links/spec.md | 按第二链接搜索 - **WHEN** 用户在搜索框输入某供应商第二个链接的片段 - **THEN** 该供应商出现在搜索结果中 | 搜索过滤字段含 provider.websiteUrl2（ProviderList.tsx:371）；测试输入第二链接片段只命中对应供应商（ProviderList.test.tsx:336-371） |
| A19 | passed | specs/provider-website-links/spec.md | 复制供应商 - **WHEN** 用户复制配置了两个官网链接的供应商 - **THEN** 副本同时携带两个链接 | 副本显式带 websiteUrl2（App.tsx:839）经 addProvider→save_provider INSERT 落库（dao/providers.rs:258），round-trip 测试证实路径可持久化；代码链路完整 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 8680 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 28008 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 6523 ms |
| cargo test database::tests | test database::tests | src-tauri | passed | 0 | 565 ms |
| cargo test provider:: (skip pre-existing env port test) | test provider:: -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active | src-tauri | passed | 0 | 1064 ms |

## 阻塞项

_无。_

## 风险与跳过的工作

- 统一供应商表单对第一、第二链接均不做 URL 校验——与第一链接现状同为无校验，满足"与第一链接相同语义"的解读；按最严字面解读则统一表单存在缺口，属解读歧义而非功能缺陷
- A10 暂无自 user_version=18 单库起步的隔离测试；证据来自 v1→v19 整链迁移测试叠加 add_column_if_missing 幂等机制，低风险
- A19 无 websiteUrl2 随复制的专门单测，证据为 App.tsx:839 代码链路 + DAO round-trip；建议后续补一条集成单测加固
- 测试合集 exit 0 结果取自 Runtime 检查报告（Verifier 只读未重跑）；已独立核对新增/更新测试断言均针对对应验收行为

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | recovery | — | 回 Build：并行 code review 发现 gemini_auth.rs 的 packycode 认证类型检测只读 provider.website_url 未读新字段 website_url_2，统一供应商生成 gemini 供应商携带第二链接时会误判认证方式；需补上 website_url_2 的 packycode 检测。同时核对 ProviderCard 卡片 URL 行展示优先级在仅第二链接时是否按规格保持基址回退一致性。 | 2026-09-05T13:31:34.394Z |
| 1 | 2 | 2 | pass | — | 19 项验收逐项在代码与测试断言中定位到直接证据，全部 passed。覆盖前端表单/校验/卡片渲染/搜索/复制、Rust serde 契约、providers 表新列与 v18→v19 幂等迁移、DAO 全链路、统一供应商生成随行及前后端测试断言。关键项（两空格可见性、逐链接点击、双值持久化互不覆盖、清空置 NULL、同规则校验、notes 优先、按第二链接搜索、复制携带）均有实现行号 + 直接测试断言双重佐证。四条非阻塞风险记录于 risks。 | 2026-09-05T15:26:13.242Z |



## 结论

19 项验收逐项在代码与测试断言中定位到直接证据，全部 passed。覆盖前端表单/校验/卡片渲染/搜索/复制、Rust serde 契约、providers 表新列与 v18→v19 幂等迁移、DAO 全链路、统一供应商生成随行及前后端测试断言。关键项（两空格可见性、逐链接点击、双值持久化互不覆盖、清空置 NULL、同规则校验、notes 优先、按第二链接搜索、复制携带）均有实现行号 + 直接测试断言双重佐证。四条非阻塞风险记录于 risks。
