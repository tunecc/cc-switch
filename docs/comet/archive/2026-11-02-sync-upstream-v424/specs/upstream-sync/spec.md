# 完整目标规格：upstream-sync（v4.0.24 轮，当前基线）

> 本文件是 upstream-sync 能力的累积规格，随每轮同步整体重写；当前内容对应 fork 已同步到上游发布头 tag `v4.0.24` 的状态，取代此前的 v4.0.22 轮版本。历轮的同步范围、冲突停车清单与落地保真数字保留在各 change 的归档产物 `docs/comet/archive/<date>-sync-upstream-*/` 中。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 annotated tag `v4.0.24`（tag 对象 `beed05c0c5d8b0aab00bd30961e64130da0b0923`，剥离提交 `c0189078aacdd80fd2462f59b345f55f62b41cf2`），一次跨 `v4.0.23` 与 `v4.0.24` 两个上游发布；fork 版本号 `4.0.22-1` → `4.0.24-1`。`upstream/main` 比 tag 多 5 个提交（最新 `b8112ca5e`），按「只锁已发布 tag」约定不纳入。推送与 tag 属交付步骤，在验收通过并归档之后单独取得用户授权再执行。

上游 `v4.0.22..v4.0.24` 共 45 个提交、137 个文件、+7570/−797（22 新增 / 0 删除 / 115 修改），与 fork 的重叠面为 42 个文件（fork 相对该基线的自有改动面为 480 个文件、+61832/−2789）。本轮主轴是**供应商配置编辑体验与思考档位链路**：Kimi Code / MiniMax Code / Oh My Pi 的供应商编辑器改为按应用原生格式显示与编辑（`NativeConfigEditor` + `kimiToml.ts` + `yamlNode.ts` + `useNativeConfigPath.ts`，新 npm 依赖 `yaml`）；Claude Code / Claude Desktop 经路由转 OpenAI Chat / Responses 时思考档位的换算大幅扩展（后端新增 `proxy/providers/claude_reasoning.rs`、`ProviderMeta.claude_reasoning_effort`，前端新增 `ClaudeReasoningEffortField` 与「自动/原样发送/不发送」选择），并新增 Claude → Gemini 原生的 `thinkingConfig` 映射。上游同时带来授权中心两项新能力（页头「全部刷新」、以及「登录时自动打开浏览器」开关——关掉后只复制登录链接）、用量修复（AGY / MiniMax Code 耗时与首字、Grok Build 超 50 MiB 逐行读取 + 字节游标、Codex 分支会话闲置后导入、原生用量凭据读取）、代理与会话修复（OpenRouter 纯文本 DeepSeek 的图像预处理与 404 反应式重试、非流式模型校验返回完整 JSON）、窗口与托盘修复（Windows 轻量模式二次启动主窗口回不来、WSL 托盘图标改写入缓存目录、绑号 Claude 卡在托盘显示账号）、Skills 行样式统一、DSH 三项修复（符号链接去重、导出模型 `input` 只写文字/图片、官方登录卡文案）、Claude Desktop route 模式 Haiku 档改 `claude-haiku-5-5`、启动数据库锁等待移出 UI 线程、Windows 工具 PATH 择优与 mise shim 解析、预设物料（第一方 `OpenAI API`、13 家 Gemini CLI / Antigravity、Astron MaaS、A6API 换域）以及 release CI 的 macOS runner 升级。

**上游是否重写了 fork 已有功能——本轮结论：没有重复实现，不构成「保留上游 or 保留 fork」的二选一。** 取证与逐项分析：

1. **关键词全 0 命中**：`v4.0.22..v4.0.24` 全量 diff 对 `websiteUrl2`、`website_url_2`、`connectivity`、`batchTest`、`visibleSidebarPanels`、`visible_sidebar_panels`、`left_click`、`show_menu_on_left_click`、`devpanel`、`forkOfficialAllowlist`、`IS_FORK_BUILD`、`updater` 的命中数均为 0。
2. **fork 高频魔改文件本轮上游零改动**：`ProviderCard.tsx`、`ProviderList.tsx`、`ProviderCardActions.tsx`、`Sidebar.tsx`、`SettingsPage.tsx`、`sections/GeneralSection.tsx`、`AboutSection.tsx`、`src/lib/api/settings.ts`、`src/config/forkOfficialAllowlist.ts`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`.github/workflows/ci.yml`、`src/components/providers/forms/ProviderImportEntry.tsx`、`src/utils/providerImport.ts`、`src/utils/providerModelUtils.ts`、`src/components/providers/ModelQuickSwitch/`、`src/services/connectivity_test/`。
3. **授权中心「全部刷新」不与 fork 的批量连通性检测重合**：前者是页头对已登录账号额度的批量查询（`RefreshAllQuotaButton` 经 `App.tsx` 的 `actions` 插槽进入 `AuthCenterPanel`），后者是逐供应商逐模型的协议探测（`connectivity_test_provider_models` / `connectivity_probe_provider`、`shouldShowTestEntry` 只放行 claude/codex）。目标、后端链路与 UI 位置都不同，两者并存。
4. **上游的新「编辑器」不重复 fork 的跨应用导入**：`NativeConfigEditor` 编辑的是「配置文件里这一家的部分」，fork 的跨应用导入是把别的应用的字段映射进表单；两者写在同一批表单文件里但职责不同，合并要求见「冲突解决」。
5. **`lib.rs` 三个 hunk 不触碰 fork 三段语义**：上游只抽出 `handle_second_instance`（`+398`）、把 single_instance 回调改为 `spawn_blocking`（`-409`）与给 Linux 托盘加 `temp_dir_path`（`+1228`）；本轮没有新增任何 `invoke_handler` 注册行。
6. **`tray.rs` 两侧区域不相交**：上游改动在 `provider_hint` / `provider_entry` / `collect_app_snapshot` / `panel_rows`（第 1220–2272 行区）与其测试；fork 改动在 `apply_tray_style` / `handle_tray_icon_event` / `toggle_main_window` / `hide_main_window` / 源码护栏（第 2666–3408 行区）。
7. **唯一同域的未发布改动排除在外**：`upstream/main` 的 `b8112ca5e feat(mcp): check MCP server connectivity on demand (#8348)` 与 fork 的连通性测试同域，但它不在任何已发布 tag 内，按约定不纳入本轮；待其发布后另起 change 评估。

因此本轮全部上游功能按上游落地，fork 魔改一律保留。需要用户决定的两处均为政策面而非功能重复，且已确认：**D5 白名单只在 claude / claude-desktop / codex 收录上游新增的第一方官方预设 `OpenAI API`**；**D6 fork 专属 `release.yml` 的 macOS runner 跟着上游升到 `macos-15`**。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.24` 剥离出的提交 `c0189078aacdd80fd2462f59b345f55f62b41cf2`。
- `git merge-base main v4.0.24^{}` == `c0189078a`；`git log v4.0.24..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 187 个 fork 提交（`git rev-list --count v4.0.22..main`，同步前 main = `876f4af773c09c6d97a3beddc3706ae83bf6aa49`，起点为上一轮归档提交）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v424`（= `876f4af773c09c6d97a3beddc3706ae83bf6aa49`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.22`（tag 对象 `ab9205961…`，剥离 `b76426741…`）与 fork 发布 tag `v4.0.22-1` 保持不变；本轮同时经过的 `v4.0.23`（tag 对象 `dcb3d3be8…`，剥离 `8be840557…`）只作为区间中间点，不是基线。
- `upstream/main` 当前为 `b8112ca5e`（tag 之后 5 个提交：MCP 按需连通性检测、PowerShell 7 优先、Codex 子 agent 并发上限字段、route 模式占位不进 `ANTHROPIC_API_KEY`、移除 Dependabot 配置），本轮显式排除，不同步其他上游分支。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v424/` 产物。

### 同步范围（v4.0.22..v4.0.24：45 提交、137 文件、+7570/−797）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **供应商原生格式编辑器（4 提交）**：`3d4a3da31`（Kimi `[providers.<key>]` + `[models."..."]`、MiniMax Code 的 `custom_provider.<key>`、Oh My Pi 的 `models.yml` `providers.<key>`；标题显示实际文件路径，跟随目录覆盖与 `KIMI_CODE_HOME` 一类变量；草稿格式错误、写了别家节点或 `default_model` 等全局设置时拒绝保存并在改好前锁住上方表单字段；编辑器内注释不保存；DSH 仍在 profile 补丁里用 JSON 编辑器）、`3817c2b25`（三个配置编辑器互相覆盖 #6777）、`7569b27af`（表单重渲染时保留拉取到的模型列表 #9068）、`6d6ee68fc`（provider key 输入框 IME 组字重复字符 #9069）。
2. **思考档位链路（4 提交）**：`2122f7da3`（Claude 转 OpenAI 路由给非白名单模型也发档位：认得出的按支持档位发，认不出的最多发 high，关思考不发；两个表单新增「思考档位发法」选择器与 `ProviderMeta.claude_reasoning_effort`）、`93d0bf181`（Claude 转 Gemini 原生映射 `thinkingConfig`：2.5 用 1024/8192/24576 预算、关思考时 Flash/Flash-Lite 发 0、Pro 发 128；3 及以上发 low/medium/high）、`39183b59a`（GPT 5.6+ 不带后缀或带 sol/terra/luna/astra 后缀保留 max，pro/codex/mini 等仍发 xhigh）、`7e02e494d`（Codex Chat 供应商关掉再打开「支持思考等级」后档位恢复，已保存供应商无需重编辑 #8998）。
3. **授权中心（2 提交）**：`12078d5bf`（页头「全部刷新」，一次重查页面上所有账号额度，DeepSeek 为余额，各行照常显示更新中 #9073）、`734ed4a17`（「登录时自动打开浏览器」开关：覆盖 Claude/ChatGPT/Copilot/xAI/Antigravity/Kimi/DeepSeek 与添加表单内发起的登录；关闭时只复制登录链接、不自动复制验证码、隐藏「重新打开登录页」按钮并可再复制一次；Windows 下让 Claude Code 只输出登录链接；默认打开，只记本机、不随云同步）。
4. **窗口、托盘与图标（4 提交）**：`f75cb1b6c`（Windows 轻量模式二次启动主窗口回不来：把 single_instance 回调工作交给 `handle_second_instance` 在后台线程执行，并用静态 `SERIAL` Mutex 串行化，避免两个实例各建一个窗口 #9090）、`c1fb9eec1`（Linux 托盘图标写入 app cache 目录，避开 WSL 不可写的 `XDG_RUNTIME_DIR`）、`ba3d80d87`（托盘绑号 Claude 官方卡副标题改为「备注 > 绑定账号（邮箱，无邮箱取组织名）> 官网域名」，账号不在本机时退回官网，含 `labels_on_disk`）、`d837968fc`（图标选择器避开 macOS 红绿灯 #9076）。
5. **用量（9 提交）**：`779063c1c`（Antigravity 耗时与首字时间）、`46ea443da`（MiniMax Code 耗时与首字时间）、`959e4a955`（原生用量查询读 MiniMax Code 与 Kimi 凭据）、`a9ec21a97`（官方余额查询读 DSH 凭据 #9108）、`258c367fa`（Grok Build `updates.jsonl` 逐行读取、8 MiB 单行上限、去掉 50 MiB 整文件跳过，用 `session_log_sync.last_byte_offset` 续读，旧游标跳过已导入事件；seed `grok-4.6-build`/`4.7-build`/`4.7-build-fast` 价格 #9026/#6660）、`c71886677`（Codex 分支会话在父会话闲置后恢复导入 #9093）、`e35eef5d4` 与 `4e31203c6`（bounded fork token 合计断言与其重构 #9105/#9106）、`300453be2`（OpenRouter 上纯文本 DeepSeek V4 Flash 0731 的图像预处理与 404 反应式重试 #6194）。
6. **代理与会话正确性（2 提交）**：`a77417da7`（经路由连 OpenAI 格式上游且上游对非流式请求也返回 SSE 时，切换模型不再报「Unable to validate model」，非流式请求收到完整 JSON #9097/#9095）、`832fbe65a`（codex-oauth 替换用例重试过期 keep-alive 请求）。
7. **DSH（3 提交）**：`c3adab304`（profile 路径指向同一文件时去重，修符号链接下编辑供应商/MCP 一律报冲突 #9101/#9100）、`14ddd7b55`（导出模型的 `input` 只写 text/image，避免选了 PDF 输入模型后第三方供应商全部不显示 #9116）、`1f21c2892`（官方登录卡文案改「用 DeepSeek 账号登录」#9058）。
8. **应用、工具与配置（3 提交）**：`fcd8f3bd4`（定位 claude CLI 时解析 mise shim；Windows `windows_preferred_tool_executable` 用 `where` 按 PATH 顺序列出候选并跳过 App Execution Alias / GUI 可执行文件）、`e49d12a5f`（环境检查不再启动 OpenCode Desktop #7027）、`91a76cfd5`（启动时的数据库锁等待移出 UI 线程，新增 `lock_native_provider_operations` 与 `provider_concurrency_tests.rs`、`startup_tests.rs` #9098）。
9. **Skills 与 Claude Desktop（2 提交）**：`43a06937c`（发现页与已安装页统一行样式：仓库名用小号等宽字放名称旁、不显示目录路径、「打开文档」移到最右、「已安装 · N 个应用」改为「已安装 ›」、从发现页跳转时该行黄色闪两下 #9081）、`54115a8c7`（Claude Desktop route 模式 Haiku 档发布 `claude-haiku-5-5`，上游本身是旧版 Haiku 时不改，直连模式不受影响 #9096）。
10. **其它修复（1 提交）**：`9941a6455`（400 `invalid_grant` 归类为永久失败、清理 `.env` 时尊重 export 行、补全土耳其语目录 #9049）。
11. **预设与赞助商（5 提交）**：`5c8f4e2e4`（`OpenAI API` 第一方按量预设进 claude / claude-desktop / codex / openclaw / opencode / mcode 六个目录；mcode 因目录由 Pi 派生，改为新增一份 mcode 专用源列表并走同一映射）、`bd89109ec`（13 家供应商的 Gemini CLI / Antigravity 预设 #9089）、`645f8fa10`（讯飞 Astron MaaS 按量付费的 Claude Code 预设 #9036）、`889e50ac7`（A6API 换域 `a6api.vip`）、`1ddacbd8e`（Kimi K3.1 Pro 横幅与文案刷新）。
12. **CI、文档与发布（8 提交）**：`8be840557`（上游 release.yml 两个 macOS job `macos-14` → `macos-15`）、`66d530d6e` 与 `1f12a3d4f`（v4.0.23 三份 release notes）、`57169e4bc`（版本号 4.0.23）、`c0189078a` 与 `1f12a3d4f`（v4.0.24 三份 release notes）、`6532c5a96`（版本号 4.0.24）、`c0189078a`（4.0.24 notes 提交）。

新增文件 22 个（`git diff --name-status --diff-filter=A v4.0.22 v4.0.24` 的全部 A 项），fork 侧无自有语义、随上游整体落地：

- 后端：`src-tauri/src/commands/provider_concurrency_tests.rs`、`src-tauri/src/commands/startup_tests.rs`、`src-tauri/src/proxy/providers/claude_reasoning.rs`。
- 前端：`src/components/providers/forms/ClaudeReasoningEffortField.tsx`、`forms/helpers/codexChatReasoning.ts`、`forms/helpers/kimiToml.ts`、`forms/helpers/yamlNode.ts`、`forms/shared/NativeConfigEditor.tsx`、`src/components/settings/auth/RefreshAllQuotaButton.tsx`、`src/hooks/useNativeConfigPath.ts`、`src/lib/authLoginLink.ts`、`src/whats-new/4.0.23.json`、`src/whats-new/4.0.24.json`。
- 前端测试：`tests/components/JsonEditorExternalSync.test.tsx`、`tests/components/ProviderFormSettingsConfigSnapshot.test.tsx`、`tests/lib/authLoginLink.test.ts`。
- 文档：`docs/release-notes/v4.0.23-{en,ja,zh}.md`、`docs/release-notes/v4.0.24-{en,ja,zh}.md`。

上游本轮**未删除任何文件**（`--diff-filter=D` 实测 0 条），因此不存在「随上游删文件」的动作；fork 自有文件与既有孤儿文件（`src-tauri/src/services/stream_check.rs`）维持上一轮终态。

### 供应商配置编辑终态

- **原生格式编辑器**：Kimi Code 显示并编辑 `config.toml` 里的 `[providers.<key>]` 与其 `[models."..."]` 表；MiniMax Code 显示 YAML 的 `custom_provider.<key>`；Oh My Pi 显示 `models.yml` 的 `providers.<key>`。标题为实际文件路径，跟随目录覆盖与 `KIMI_CODE_HOME` 一类环境变量；只允许写当前这一家的节点，写了别家节点或 `default_model` 这类全局设置时提示并拒绝保存，草稿有格式错误时上方表单字段暂时不可编辑；编辑器内注释不保存。DeepSeek Harness 因供应商在 profile 补丁里，仍使用 JSON 编辑器。
- **fork 叠加边界**：三个表单里 fork 的跨应用导入入口（`ProviderImportEntry` + `useProviderImportApply`/`useProviderImportSources`）、官方预设白名单过滤与「先按原始数组下标编号、再过滤」的顺序必须继续生效；`McodeProviderForm` 的导入入口仍只在 `appId === "mcode"` 渲染（导入映射未覆盖 dsh 方言）；`KimiProviderForm` 的 `KIMI_ALLOWED_PRESET_NAMES` 过滤仍作用在已编号的 entries 上。
- **编辑器互不覆盖**：上游 `3817c2b25` 修的是同一表单内多个配置编辑器互相覆盖草稿的问题；fork 不重复实现该逻辑，整段取上游，并由新增的 `JsonEditorExternalSync`、`ProviderFormSettingsConfigSnapshot` 用例守护。

### 思考档位终态

- **Claude → OpenAI Chat / Responses 路由**：认得出的上游按它支持的档位发（DeepSeek 发 low/high/max，OpenRouter 最高 xhigh）；认不出的上游只发 low/medium/high，选 xhigh/max 时发 high；Kimi/GLM/Qwen/MiniMax 这类不收该参数的接口不发；GPT-3.5/GPT-4/Llama/Mistral 不发；关闭思考时不发。GPT 5.6+ 不带后缀或带 sol/terra/luna/astra 后缀保留 max，pro/codex/mini 等后缀仍按 xhigh。
- **表单**：Claude Code 与 Claude Desktop 在 OpenAI Chat / Responses 两种格式下多出「思考档位」发法选择器（自动（推荐）/ 原样发送 / 不发送），持久化为 `ProviderMeta.claude_reasoning_effort`（缺省 = 自动），并把该值计入表单 dirty 判定；托管账号卡与 `cloud_provider`、xAI OAuth、Codex OAuth、Copilot 预设不显示该项。fork 侧渲染位置适配 fork 既有布局（API 格式选择器在 `EndpointField.rightSlot`，并有 `copilotFormatFallback` 兜底渲染点），语义全部取上游。
- **Claude → Gemini 原生**：2.5 系列按 low/medium/high 映射 1024/8192/24576 思考预算，关闭思考时 Flash 与 Flash-Lite 发 0、Pro 不能关发 128；Gemini 3 及以后发档位字符串（Pro 无 medium 时发 high），这些模型不能关思考、关闭时发支持的最低档；认不出的模型、图片与语音类模型、名字已带档位的中转别名不发；请求本身没有思考设置时不发。
- **Codex Chat**：关掉再打开「支持思考等级」后档位恢复发送（含以前保存过的供应商），`codexChatReasoning.ts` 修复 `enabled` 与 `effort param` 组合为 `none` 的重建路径。
- **Codex 路由连 DeepSeek** 的档位换算对齐官方：minimal/low → low，medium/high/xhigh → high，max → max。

### 授权中心与登录终态

- 页头「全部刷新」按钮一次重新查询页面上所有账号的额度（DeepSeek 为余额），各行照常显示更新中；该组件经 `App.tsx` 的 `actions` 插槽进入 `AuthCenterPanel`。
- 「登录时自动打开浏览器」开关位于授权中心顶部，覆盖 Claude、ChatGPT、Copilot、xAI、Antigravity、Kimi、DeepSeek 的账号登录与添加供应商表单里发起的登录；关闭后点登录只复制登录链接，需输入验证码的登录不再自动复制验证码，等待登录时可再点「复制登录链接」，「重新打开登录页」按钮不显示；Windows 上让 Claude Code 只输出登录链接。开关默认打开，只存本机、不随 WebDAV 云同步。
- 上游 `labels_on_disk`（Claude 账号磁盘标签查询）随上游落地，供托盘副标题使用。
- **fork 边界**：fork 的批量连通性检测（页头「批量检测」按钮 + `useConnectivityProbe` + `ConnectivityTestDialog`/`ConnectivityBadge`）与授权中心两项新能力并存，互不覆盖：前者探测供应商协议的逐模型可用性，后者刷新托管账号额度。

### 用量、额度与会话终态

- Antigravity 与 MiniMax Code 的用量记录补上耗时与首字时间，历史导入记录同样补齐。
- Grok Build 会话日志改为逐行读取（单行 8 MiB 上限），删除 50 MiB 整文件跳过；用 `session_log_sync.last_byte_offset` 从字节偏移续读，长会话活跃时只解析新增部分；旧游标跳过已导入事件而不是重复导入。
- Codex 分支会话在父会话闲置一段时间后仍能导入；bounded fork 的 token 合计有断言守护并返回 `bool`。
- 原生用量/余额查询读取 MiniMax Code、Kimi 与 DSH 的凭据。
- OpenRouter 上纯文本的 DeepSeek V4 Flash 0731：发送前替换 `input_image`，并对 OpenRouter 的「no image endpoint」404 做反应式重试（`media_sanitizer.rs` 与 `forwarder.rs`），另含 404 判定与「无关 404 不重试」用例。
- 400 `invalid_grant` 归类为永久失败；清理 `.env` 时尊重 export 行。
- **fork 边界**：fork 的额度容器宽度、模型徽章与双官网链接不变；`UsageFooter` 的上游语义（按 `usage_script` 配置无条件取值）沿上一轮终态。

### 代理与会话正确性终态

- 经路由连 OpenAI 格式上游、且上游对非流式请求也返回 SSE 时，模型校验请求收到完整 JSON 而不是 SSE 文本，`Unable to validate model` 不再出现。
- Codex OAuth 替换用例重试过期的 keep-alive 请求，消除该用例自身的偶发红。
- `proxy/providers/mod.rs` 新增 `mod claude_reasoning;` 声明随上游落地。

### 窗口、托盘与 Skills 终态

- **单实例与轻量模式**：`lib.rs` 的 single_instance 回调只做日志与调度，实际工作交给新的 `handle_second_instance`，经 `tauri::async_runtime::spawn_blocking` 在后台线程执行并用静态 `SERIAL` Mutex 串行化（Windows 上该回调跑在处理 `WM_COPYDATA` 的窗口过程里，同步重建窗口会被 WebView2 卡死）；`handle_second_instance` 内依次退出轻量模式、处理 `ccswitch://` 链接、`unminimize`/`show`/`set_focus`，Windows 重置 `skip_taskbar`，Linux 走 `linux_fix::nudge_main_window`。
- **Linux 托盘图标**：`tray_builder.temp_dir_path(app.path().app_cache_dir()?.join("tray-icon"))`，避开 WSL 上不存在或不可写的 `XDG_RUNTIME_DIR`（`Permission denied` 导致启动即退）。
- **托盘副标题**：`provider_hint` 取值顺序为备注 → 绑定的 Claude 账号标签 → 官网域名；账号不在本机时退回官网；面板行（`panel_rows`）的 hint 改从快照的 `ProviderEntry` 取，保证托盘与面板一致。
- **fork 托盘契约不变**：`handle_tray_icon_event` 内 fork 的四条分支（面板样式且左键 Up 且面板未显示 → `toggle_main_window`；面板样式其余情况 → `tray_panel::toggle(rect)` 并返回；原生菜单样式左键 Up → `toggle_main_window`；原生菜单样式右键 Up → `mark_feedback_seen` 后交系统菜单）、`apply_tray_style` 的 `set_show_menu_on_left_click(false)`、`hide_main_window`/`toggle_main_window`/`panel_visible` 与源码护栏 `tray::tests::tray_left_click_never_opens_the_menu` 全部保持；`native_menu_on_left_click` 保持删除态。
- **Skills**：发现页与已安装页统一行样式（仓库名小号等宽字、不显示目录路径、「打开文档」最右、「已安装 ›」、跳转时该行闪两下）。
- **应用内更新器**：继续禁用，上游本轮未触碰 updater 相关代码。

### DSH、Claude Desktop 与应用管理终态

- DSH profile 路径按真实路径去重，符号链接指向同一文件时不再一律报冲突；导出模型的 `input` 只写 text/image；官方登录卡文案改「用 DeepSeek 账号登录」。
- Claude Desktop route 模式 Haiku 档发布 `claude-haiku-5-5`（上游本身为旧版 Haiku 时不改），直连模式不受影响。
- 定位 `claude` CLI 时解析 mise shim；Windows 的 PATH 默认值用 `where` 按顺序列出候选并跳过 App Execution Alias 与桌面 GUI 可执行文件，继续往后找真实 CLI。
- 环境检查不再启动 OpenCode Desktop。
- 启动阶段的数据库锁等待移出 UI 线程：`services/provider/mod.rs` 新增 `lock_native_provider_operations` 并在多个 `ProviderService` 入口调用。

### 卡片、列表与预设终态

- **ProviderCard / ProviderList / Sidebar**：本轮上游零改动，fork 的模型徽章、双官网链接、右键置顶/置底、`ConnectivityBadge` 接线、`onTest` 守卫、空态与搜索语义全部沿上一轮终态保持。
- **预设目录**：`gemini`（+290/−4，13 家 Gemini CLI / Antigravity 预设）、`openclaw`（+53/−3）、`opencode`（+32/−3）、`claude`（+58/−3，`OpenAI API` 与 Astron MaaS）、`codex`（+21/−4）、`pi`/`hermes`/`grokBuild`（各 3–4 行改写，A6API 换域等）内容整份取上游；`claudeDesktop`（+17/3）与 `mcode`（+28/−1，新增 mcode 专用源列表）不在重叠面、随上游直接落地；`presetFamilies`（+2/0）与 `presetSearchAliases`（+1/0）同。fork 各保留接口上的 `hidden?: boolean` 两行，不改 `forkPresetFilter.ts` 判定。
- **fork 白名单（D5）**：`src/config/forkOfficialAllowlist.ts` 在 `claude`、`"claude-desktop"`、`codex` 三个键各追加逐字条目 `"OpenAI API"`；`openclaw`、`opencode`、`mcode`、`gemini`、`agy`、`hermes`、`pi`、`omp`、`dsh`、`grokbuild`、`kimi` 键不增条目。上游同名条目在这三个目录中的 `name` 必须逐字为 `OpenAI API`，否则条目静默消失。其余上游新增预设（13 家 Gemini CLI / Antigravity 转发、Astron MaaS 等第三方与赞助商）在 fork 构建下继续被白名单隐藏。
- **预设 id 编号**：本轮上游新增条目改变数组长度与下标，fork 仍只在渲染层过滤，`id` 一律为原始数组下标字符串；上游 `ProviderPresetSelector.test.tsx` 的 Claude 可见预设行数断言（111 → 112）取上游，fork 的 `extraActions`/白名单用例叠加回。

### 数据库 schema 终态（25，本轮不升级）

- `SCHEMA_VERSION` == 25。上游 `v4.0.22..v4.0.24` 未改动 `src-tauri/src/database/mod.rs`，上游仍为 24，**本轮不存在版本号碰撞**，fork 不需要再升位、不需要新增迁移臂。
- 迁移链维持上一轮终态：v18→v19（fork `website_url_2` + 上游 `enabled_mcode`）；v19→v20（`enabled_pi`）；v20→v21（fork mcode/pi 幂等修复 + `enabled_agy`）；v21→v22（`enabled_agy` 幂等 + `enabled_kimi`）；v22→v23（`enabled_kimi` 幂等 + `enabled_omp` 仅 `mcp_servers`）；v23→v24（`enabled_kimi`/`enabled_omp` 幂等 + `enabled_dsh` 两表 + `session_log_sync.parser_state`）；v24→v25（幂等补 `enabled_dsh` 两表与 `parser_state`）。
- `schema.rs` 本轮上游唯一改动是 13 行 grok 价格种子（`grok-4.6-build` 2/6/0.50、`grok-4.7-build` 2/6/0.50、`grok-4.7-build-fast` 4/12/1），落在定价种子表内，与 fork 的迁移臂不相交。
- Grok Build 的字节偏移续读复用既有 `session_log_sync.last_byte_offset` 列，**不新增列**；`parser_state` 沿用上一轮。
- 降级策略不变（fork v25 库被上游 v4.0.24 的 v24 打开报「数据库版本过新」）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果增改：`lib.rs` 行（上游 `handle_second_instance` + `spawn_blocking` + Linux `temp_dir_path` + fork 三段语义）、`tray.rs` 行（上游 `provider_hint`/`provider_entry`/`panel_rows` 与 `claude_account::labels_on_disk` + fork 左键契约与护栏，两侧区域不相交）、`commands/mod.rs` 行（上游两个 `#[cfg(test)]` 测试模块 + fork `connectivity_test`/`stream_check` 口径）、`database/schema.rs` 行（上游 grok 价格种子、schema 不升位）、`provider.rs` 行（上游 `ProviderMeta.claude_reasoning_effort` + fork `website_url_2`）、`services/provider/mod.rs` 行（上游 `lock_native_provider_operations` + fork 测试字面量）、`proxy/providers/{claude,codex,mod}.rs` 与 `proxy/forwarder.rs`、`proxy/media_sanitizer.rs` 行、`commands/misc.rs` 行（上游 Windows PATH 择优与 mise shim + fork 4 处 tunecc URL）、`App.tsx` 行（上游 `RefreshAllQuotaButton` 的 `actions` 插槽 + fork 三段语义）、`types.ts` 行（上游 `ClaudeReasoningEffortMode` + fork `websiteUrl2`/`VisibleSidebarPanels` 并存）、六个 `*ProviderPresets.ts` 行、4 个 locale 行、`tests/components/{BasicFormFields,ClaudeFormFields,ProviderPresetSelector}.test.tsx` 行。
  - `forkOfficialAllowlist` 行登记本轮新增的 `OpenAI API` 三条与「聚合式目录不放开」的口径；`.github/workflows/release.yml` 行登记 macOS runner 由 `macos-14` 升到 `macos-15`（D6）且裁剪结构不变。
  - 新增 §4.10「v4.0.24 轮的叠加要点（2026-11-02 同步实测）」：跨两版本区间、原生格式编辑器与 fork 导入/白名单的叠加、思考档位的 fork 布局适配、授权中心两项新能力与 fork 批量检测的并存、托盘副标题与左键契约、schema 不撞号、`claude_reasoning.rs` 测试字面量补 `website_url_2`、重放与保真实测数字。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：本轮登记「上游 v4.0.23/v4.0.24 未推进 schema，fork 保持 25、无新臂」；若 Build 实测出现例外则按实测改写。
- fork 自有能力规格（连通性测试、模型快捷切换、双官网链接、侧栏面板、托盘左键、跨应用导入、fork 测试稳定性）本轮不改，除非合并暴露出与终态不符的描述。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 同步前 `git rev-list --count v4.0.22..pre-sync-v424` 预期 == 187。
- 重放后 `git rev-list --count v4.0.24..HEAD` 与 187 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录被丢弃提交的主题与判空原因。
- tag `v4.0.24` 是 annotated tag：tag 对象 `beed05c0…`，剥离提交 `c0189078a…`；`git merge-base main v4.0.24^{}` == `c0189078a…`；`git log --format='%an <%ae>' v4.0.24..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.22..pre-sync-v424` 与重放后 `v4.0.24..HEAD`）差异必须为 0 行（剔除被判空丢弃的提交后比较）。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期停车面：四个版本与锁文件、`README.md`、`src-tauri/Cargo.toml`、`src-tauri/src/lib.rs`、`commands/mod.rs`、`services/provider/mod.rs`、`provider.rs`、`database/schema.rs`、`src/App.tsx`、`src/types.ts`、`forms/ProviderForm.tsx`、`forms/KimiProviderForm.tsx`、`forms/McodeProviderForm.tsx`、`forms/PiProviderForm.tsx`、`forms/ClaudeFormFields.tsx`、`forms/BasicFormFields.tsx`、`forms/shared/index.ts`、6 个 `*ProviderPresets.ts`、4 个 locale、`tests/components/{BasicFormFields,ClaudeFormFields,ProviderPresetSelector}.test.tsx`。
- 冲突停车清单（交互式）在 Build 阶段逐条记录；rerere 复用的解法必须逐个复核，尤其版本四文件、locale 与 `lib.rs`。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。

### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.22..v4.0.24` 改动过的每个文件（137 个，覆盖 42 个重叠文件）取 `git diff v4.0.22 v4.0.24 -- f` 的增/删行、`git diff v4.0.22 pre-sync-v424 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。非重叠的 95 个上游文件在 fork 侧缺失必须为 0。
- 计算必须在全部最终态提交（版本、文案、文档、白名单、表单合并、测试断言修正）落完之后，对最终代码终态 `HEAD` 执行；其后的归档提交只改 Markdown，不在 137 个文件内，故数字不变。差异行必须带重数与文件归属。
- 预期的刻意取舍（逐行归因，具体行数在 Build 后按实测记录到归档产物与 `verification.md`）：
  - `README.md`：fork 整文件自有的「与上游的差别」文档；上游本轮 4/4 行改动（Kimi 横幅与文案）不落地，归因为「fork 整文件替换」。
  - 版本与锁文件：上游 `4.0.24` 行被 fork `4.0.24-1` 取代（4 个文件各 1 行）；fork 的 `4.0.22-1` 行被本轮终态升级（属预期流转）。
  - `.github/workflows/release.yml`：fork 是 90/794 的裁剪版整文件，上游 2/2 只体现为 fork 自身把 `macos-14` 改 `macos-15`（D6）；上游的 `macos-binary`/`macos-release` 两个 job 结构不落地。
  - `src-tauri/Cargo.toml` / `Cargo.lock`：上游新增 dev-dependency `tauri = { version = "2.8.2", features = ["test"] }` 按上游落地，fork 移除的 updater 行不得出现。
  - `pnpm-lock.yaml`：上游新增 `yaml@2.8.1` 与 peer 后缀改写全部落地；fork 移除的 `@tauri-apps/plugin-updater` 三段不得出现。
  - `src/components/providers/forms/*.tsx`：上游的原生编辑器与思考档位字段落地；fork 的导入接线、白名单过滤与 `rightSlot` 布局保留。行形态因 fork 布局改写处逐行归因为「布局等价」（尤其 `ClaudeFormFields` 的 300/235 改写面与 `KimiProviderForm` 的编号→过滤块）。
  - `tray.rs` / `lib.rs`：上游的账号副标题、单实例后台线程与 Linux 托盘目录落地；fork 的四条左键分支与护栏不变，两侧区域不相交，不产生上游行缺失。
  - `database/schema.rs`：fork 的 560/5 迁移臂保留、上游 13 行价格种子落地；`SCHEMA_VERSION` 仍为 fork 25（上游 24 不落地，属上一轮已归因的版本号流转）。
  - 6 个预设文件：目录内容整份取上游，fork 各保留 `hidden?: boolean` 两行，不产生上游行缺失。
  - 4 个 locale：上游各 27 行新增、3 行改写/删除全部按上游落地；fork 键段不产生上游缺失；`tr.json` 与上游逐字节一致。
  - `src/components/providers/forms/ClaudeFormFields.tsx`：上游的 `reasoningEffort !== "auto" ||` dirty 行按 fork 布局口径不采纳（1 行），字段的显示条件与渲染本身完整落地，逐行归因为「布局等价」。
  - `.github/workflows/release.yml`：上游的 `runs-on: macos-15` 两行来自 `macos-binary`/`macos-release` 两个 job，fork 裁剪版没有这两个 job，改为把 matrix 的 `- os: macos-14` 写成 `- os: macos-15`（D6），逐行归因为「裁剪版等价」。
  - `README.md`：fork 是整文件自有的「与上游的差别」文档；上游本轮 4 行改动（A6API 换域、Kimi K3.1 Pro 横幅与文案）不落地，归因为「fork 整文件替换」。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.24 HEAD -- <file>` 只看 fork 侧新增/删除。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 42 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.22 v4.0.24 | sort) <(git diff --name-only v4.0.22 main | sort)`；上游 137 文件 + fork 480 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.22 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（6 个）

- **`package.json`**（2/1 / 2/2）：取上游内容（新增 `"yaml": "^2.8.1"`），版本号改为 fork `4.0.24-1`；保留 fork 的 `dev:fork` script 与已移除的 `@tauri-apps/plugin-updater` 依赖。
- **`src-tauri/Cargo.toml`**（2/1 / 3/6）：取上游内容，版本号改为 `4.0.24-1`；采纳上游新增 dev-dependency `tauri = { version = "2.8.2", features = ["test"] }`；保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`。
- **`src-tauri/Cargo.lock`**（1/1 / 5/175）：`cc-switch` 条目改为 `4.0.24-1`；`tauri` 的 dev test feature 不引入新包（`tauri` 已在依赖树），终态相对上游只允许 fork 侧既有差异；不得出现任何 updater 相关包。收尾用 `cargo check` 复验锁文件未被改写。
- **`src-tauri/tauri.conf.json`**（1/1 / 5/11）：取上游内容，版本号改为 `4.0.24-1`；保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true` 与 fork 移除的 `trafficLightPosition`。
- **`pnpm-lock.yaml`**（25/12 / 1/10）：接受上游 `yaml@2.8.1` 条目与 vite/tailwindcss/postcss-load-config 等 peer 后缀改写；只把 fork 专属的 `@tauri-apps/plugin-updater` 三段维持为不存在；禁止整文件取一侧。收尾用 `pnpm install` 复验锁文件未被改写。
- **`README.md`**（4/4 / 96/544）：fork README 是整文件自有的「与上游的差别」文档；冲突按整文件保留 fork 版，上游本轮 Kimi 横幅/文案 4 行不落地，属刻意取舍。

#### 后端（11 个）

- **`src-tauri/src/commands/misc.rs`**（249/22 / 6/5）：上游 8 个 hunk 全在 `tool_executable_candidates`、`windows_runnable_sibling_for_extensionless_tool` 之后（新增 `windows_preferred_tool_executable` / `windows_preferred_path_default`）、`resolve_path_default`、`locate_default_tool`（新增 `mise_shim_target`）与测试区；fork 只有 4 处 tunecc URL（`:82`、`:102`–`:116` 三处）与两个测试断言（`:6813`、`:6817`）。逐 hunk 取上游并保留 fork 的 URL，禁止整文件取一侧；解完 `git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 必须 0 命中。
- **`src-tauri/src/commands/mod.rs`**（5/0 / 2/2）：上游新增 `#[cfg(test)] mod provider_concurrency_tests;` 与 `#[cfg(test)] mod startup_tests;`；fork 的 `mod connectivity_test;` / `pub use connectivity_test::*;` 保留、`stream_check` 维持移除。两侧模块声明取并集。
- **`src-tauri/src/database/schema.rs`**（13/0 / 560/5）：上游只在 grok 定价种子表加 3 条（13 行）；fork 的 `website_url_2`、v20→v25 各臂与 `create_tables` 列集不动。本轮无迁移臂变化，`SCHEMA_VERSION` 保持 25。
- **`src-tauri/src/lib.rs`**（66/41 / 9/30）：上游三个 hunk（`handle_second_instance` 抽出、single_instance 回调改 `spawn_blocking`、Linux 托盘 `temp_dir_path`）全部取上游；fork 的无 Updater 段、connectivity 两个命令注册、`stream_check` 移除与托盘 builder 挂载原样保留。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 0 命中、`.show_menu_on_left_click(false)` 在位、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册在位、`.on_tray_icon_event(tray::handle_tray_icon_event)` 在位、`temp_dir_path` 在位、`handle_second_instance` 被回调引用。
- **`src-tauri/src/provider.rs`**（8/0 / 45/1）：上游在 `ProviderMeta` 加 `claude_reasoning_effort` 字段（含 serde 与注释）；fork 的 `website_url_2`（serde `websiteUrl2`）与 `UniversalProvider` 随行透传等 45 行保留，两段并存。
- **`src-tauri/src/proxy/forwarder.rs`**（19/1 / 2/1）：上游新增 OpenRouter no-image 404 的反应式重试判定与用例；fork 的 `parse_custom_user_agent` 注释与测试字面量 `website_url_2: None` 保留。
- **`src-tauri/src/proxy/media_sanitizer.rs`**（61/1 / 1/0）：上游新增 `is_unsupported_image_error` 对 OpenRouter 404 的识别与「发送前替换 `input_image`」用例组；fork 的 1 行改动保留。
- **`src-tauri/src/proxy/providers/claude.rs`**（57/0 / 2/0）：上游在 `transform_claude_request_for_api_format` 的三处分支接入思考档位换算并加两个用例；fork 的 2 行改动保留。
- **`src-tauri/src/proxy/providers/codex.rs`**（67/7 / 1/0）：上游改 `zen_catalog_effort_levels`、`infer_codex_chat_reasoning_config` 并加 `test_resolve_codex_chat_reasoning_repairs_enabled_none_effort_param`；fork 的 1 行改动保留。
- **`src-tauri/src/proxy/providers/mod.rs`**（1/0 / 1/0）：两侧模块声明取并集（上游 `mod claude_reasoning;` + fork 既有 1 行）。
- **`src-tauri/src/services/provider/mod.rs`**（21/4 / 4/0）：上游新增 `lock_native_provider_operations` 与 7 处调用点；fork 的 4 处测试 `Provider` 字面量 `website_url_2: None` 必须仍在原位，否则 `cargo test` 编译失败。
- **`src-tauri/src/tray.rs`**（53/5 / 88/11）：上游改 `provider_hint`（加 `app` 与 `claude_accounts` 参数）、`provider_entry`、`collect_app_snapshot`（Claude 时取 `labels_on_disk`）、`panel_rows` 的 hint 来源并加 `claude_bound_card_hint_shows_account_unless_noted` 用例；fork 的 `apply_tray_style`、`handle_tray_icon_event` 四条分支、`hide_main_window`/`toggle_main_window`、`set_show_menu_on_left_click(false)` 与护栏 `tray_left_click_never_opens_the_menu` 原样保留。两侧区域不相交，预期 git 自动合并，但必须逐行复核 handler 未被上游形态改写。

#### 前端（16 个）

- **`src/App.tsx`**（2/0 / 83/1）：上游加 `RefreshAllQuotaButton` 的 import 与 `AuthCenterPanel` 的 `actions` prop 两行；fork 的窗口标题、`visibleSidebarPanels`、`useConnectivityProbe`/批量测试、`websiteUrl2` 三段语义保留。
- **`src/types.ts`**（5/0 / 14/0）：上游新增 `ProviderMeta.claudeReasoningEffort?` 与 `ClaudeReasoningEffortMode`；fork 的 `websiteUrl2`、`VisibleSidebarPanels` 等类型段并存。
- **`src/components/providers/forms/BasicFormFields.tsx`**（29/61 / 46/21）：上游把图标选择器从 `Dialog` + `DialogTrigger`/`DialogContent` 改为 `FullScreenPanel`（删 `Button`/`ArrowLeft`/`Dialog*` 导入）；fork 的 `websiteUrl2` 字段段（第 185 行起）保留，解完复核 fork 段未被上游删 footer 时连带去掉，`ImeSafeInput` 等上游导入不删。
- **`src/components/providers/forms/ClaudeFormFields.tsx`**（21/0 / 300/235）：上游加 `ClaudeReasoningEffortField` 导入、两个 props（`reasoningEffort` / `onReasoningEffortChange`）、dirty 判定一行与渲染块；fork 的 300/235 改写（兜底模型直达区、`hasCustomModelMapping`、`SearchableModelPicker`、API 格式选择器进 `EndpointField.rightSlot`、`apiFormatControl` / `copilotFormatFallback` 双渲染点、1M 全选）保留。适配口径（D7）：字段的显示条件（非 `cloud_provider`、非 xAI/Codex OAuth/Copilot 预设、`apiFormat` 为 openai_chat/openai_responses）逐字取上游，但渲染位置提到 `endpointSection` 外层、与 `shouldShowSpeedTest` 无关——留在端点区内会让上游新增的 `classic/stack 布局只在转成 OpenAI 格式时显示思考档位` 两条用例（fixture 传 `shouldShowSpeedTest: false`）取不到 `combobox[name=思考档位]`；同时**不采纳上游的 `reasoningEffort !== "auto" ||` dirty 行**，因为 fork 的字段不在高级选项面板内、不应驱动其自动展开（与 fork 早先删除 `apiFormat !== "anthropic"` 同一口径），该 1 行进落地保真的上游缺失清单。
- **`src/components/providers/forms/ClaudeDesktopProviderForm.tsx`**（35/0 / 85/12）：上游加思考档位字段接线；fork 的跨应用导入、双官网链接、预设过滤与 `rightSlot` 适配保留。
- **`src/components/providers/forms/KimiProviderForm.tsx`**（58/42 / 11/4）：上游接入 TOML 原生编辑器（`kimiToml.ts`）、改 `PRESETS` 附近与编辑器区（hunk `@@ -100,6 +105,9 @@ const PRESETS = [` 与 fork 的编号→过滤块相邻，预期停车）；fork 的 `KIMI_ALLOWED_PRESET_NAMES` 与「先 `.map` 编号再 `.filter`」顺序必须仍在位，`PRESETS` 终态仍为 `[官方账号卡, ...过滤后的目录]`。解完 typecheck 确认编号仍先于过滤。
- **`src/components/providers/forms/McodeProviderForm.tsx`**（95/26 / 61/5）：上游接入 YAML 原生编辑器与 `useNativeConfigPath`；fork 的导入接线保留且仍只在 `appId === "mcode"` 渲染，`dsh` 目录继续套 `filterForkPresets` 且编号按原始数组下标。
- **`src/components/providers/forms/PiProviderForm.tsx`**（63/2 / 68/43）：上游接入 `models.yml` 原生编辑器；fork 的跨应用导入（动态 `appId`）、双官网链接、预设过滤与 `buildPiSettingsConfig` 提取保留；预设编号仍先于白名单过滤。
- **`src/components/providers/forms/ProviderForm.tsx`**（95/23 / 183/43）：上游为两个 Claude 表单接上思考档位 state/props 并调整表单结构；fork 的 Kimi 早退、跨应用导入、`extraActions`、`entriesFor`（编号先于 hidden、先于白名单）、`websiteUrl2`、连通性接线保留。
- **`src/components/providers/forms/shared/index.ts`**（1/0 / 1/0）：上游新增 `NativeConfigEditor` 导出，fork 的 `SearchableModelPicker`/`SearchableModelMultiPicker` 导出保留，取并集，两侧导出都不许丢。
- **`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（290/4、4/4、3/3、53/3、32/3、3/3 / 各 2/0）：目录内容整份取上游（13 家 Gemini CLI / Antigravity、`OpenAI API`、Astron MaaS、A6API 换域等）；fork 只保留各接口的 `hidden?: boolean` 两行；查重确认 `hidden` 只有一份（上游已有声明时删 fork 追加那份，否则 `TS2300`）。
- **`src/i18n/locales/{en,ja,zh-TW,zh}.json`**（各 27/3 / 330/26、317/25、317/25、329/25）：保留 fork 键段（`connectivityTest`/`connectivityCheck`、`devpanel`、供应商导入、模型快捷切换、侧栏面板、置顶置底，以及 fork 专属文案 `provider.connectivityCheck`、`settings.general.trayStyleHelp`），叠加上游本轮 27 行新增与 3 行改写/删除（`providerForm.nativeConfig.*`、`reasoningEffort*`、`auth.openBrowser.*`、`login.copyLink`/`linkCopied`/`linkNote`/`linkCodeNote`、`quota.refreshAll`、`kimi.configTomlScope`/`configTomlSchema`、`skills.installed` 改写）；合并后按对象作用域显式查重，`dup=0` 才算通过。
- **`tests/components/BasicFormFields.test.tsx`**（76/2 / 3/0）：上游新增/改写图标选择器用例（`FullScreenPanel` 形态）；fork 的 3 行改动叠加回。
- **`tests/components/ClaudeFormFields.test.tsx`**（29/0 / 140/0）：上游新增思考档位字段用例；fork 的 140 行用例保留，断言按 fork 的实际渲染位置调整。
- **`tests/components/ProviderPresetSelector.test.tsx`**（42/3 / 33/0）：上游加 `dshAccountPreset`/`DSH_ACCOUNT_PRESET_ID`/`tr` 导入、`TwoSteps` 的 `appId` 参数与 Claude 可见预设 111 → 112 断言；fork 的 33 行 `extraActions`/白名单用例叠加回。

#### 本地化（`tr.json`，不在重叠面）

- **`src/i18n/locales/tr.json`**（53/6 / 0/0）：fork 从未修改该文件，整文件取上游并与 `git show v4.0.24:src/i18n/locales/tr.json` 逐字节一致，不补 fork 键；土耳其语下 fork 专属文案由 `fallbackLng: "en"` 回退英文。

#### fork 自有文件（不在重叠面，仅需核对不被上游形态带偏）

- **`src/config/forkOfficialAllowlist.ts`**：按 D5 在 `claude`、`"claude-desktop"`、`codex` 各加 `"OpenAI API"`（逐字与上游 `name` 一致）；其余键不变，`mcode` 保持空数组（其条目名与注释按 D5 的边界保持现状）。
- **`src/config/forkPresetFilter.ts`**：判定实现不改；预设目录继续在「编号之后过滤」。
- **`src/components/providers/connectivityEntry.ts`**：`shouldShowTestEntry` 判定不变（仍只放行 claude/codex）。
- **`src-tauri/src/commands/connectivity_test.rs`**、**`src-tauri/src/services/connectivity_test/`**：不在上游本轮改动面，保持不动。
- **`src/utils/providerImport.ts`**、**`ProviderImportEntry.tsx`**、**`hooks/useProviderImportApply.ts`**、**`hooks/useProviderImportSources.ts`**：不在上游本轮改动面，保持不动。
- **`tests/components/AppsPage.test.tsx`**：上游本轮未改该文件，fork 的 `waitFor` 稳定化用例（§4 白名单行）保持，不整文件取上游。
- **`docs/HOW_TO_REBASE_UPSTREAM.md`、`.comet/config.yaml`、`src/config/forkBuild.ts`、`src/components/devpanel/`、`tauri.{windows,dev}.conf.json`、`vite.config.ts`、`vitest.config.ts`、`.github/workflows/ci.yml`、`src-tauri/capabilities/default.json`**：上游本轮零改动，fork 侧整文件保留。

#### 冲突停车清单（Build 阶段实测记录）

「差异面」= 该提交重放前后 `git show --numstat` 不一致的文件（冲突解决实际落点）；未列出的提交与重放前逐字相同。预期停车面见「重放映射」；实际清单在 Build 阶段逐条记录，rerere 复用必须复核。

### fork 取舍清单

| 功能 | 上游本轮 | fork 处理 | 理由 |
| --- | --- | --- | --- |
| Kimi/Mcode/omp 原生格式编辑器 | 新增 | 全量落地，fork 导入/白名单/编号顺序叠加 | 全新能力，fork 无对应实现 |
| 思考档位换算与「怎么发」选择器 | 新增 | 全量落地，渲染提到端点区门外（与 `shouldShowSpeedTest` 无关），不采纳其 dirty 行（D7） | fork 无该能力；字段不在高级面板内就不该驱动其展开 |
| 授权中心「全部刷新」/「登录时自动打开浏览器」 | 新增 | 全量落地，与 fork 批量连通性检测并存 | 账号额度刷新与逐模型协议探测不是同一件事 |
| Claude→Gemini `thinkingConfig` 映射 | 新增 | 全量落地 | fork 未实现代理该转换路径 |
| 授权中心「全部刷新」 | 新增 | 全量落地，与 fork 批量连通性检测并存 | 目标与链路不同，不重复 |
| 「登录时自动打开浏览器」开关 | 新增 | 全量落地 | fork 无对应实现；只存本机不影响 fork 设置键 |
| 托盘绑号 Claude 账号副标题 | 新增 | 取上游 `provider_hint` 三级取值 | fork 未实现该逻辑；卡片双链接不受影响 |
| Windows 轻量模式二次启动修复 | 修复 | 取上游（`handle_second_instance` + `spawn_blocking`） | fork 未实现该链路 |
| WSL 托盘图标缓存目录 | 修复 | 取上游 | fork 未触碰 |
| 用量/会话/代理修复组 | 修复 | 全量取上游 | fork 在这些文件里只有 `website_url_2` 与注释 |
| 第一方官方预设 `OpenAI API` | 新增 | 仅在 claude/claude-desktop/codex 收录（D5）；openclaw/opencode/mcode 继续隐藏 | 与 fork「收录该厂商官方卡」的既有口径一致；聚合式目录维持只留本机推理 |
| 13 家 Gemini CLI/Astron MaaS/A6API 物料 | 新增 | 目录取上游，fork 构建继续隐藏 | 延续 fork 收敛口径 |
| 预设可见行数断言 111 → 112 | 改写 | 取上游 | fork 构建的可见性由白名单决定，测试在 `IS_FORK_BUILD=false` 下跑 |
| 图标选择器改 `FullScreenPanel` | 改写 | 取上游 | fork 的双链接字段段在不同区域 |
| schema | 未推进（上游仍 24） | fork 保持 25，不新增臂 | 本轮不撞号 |
| `tauri` dev test feature / `yaml` 依赖 | 新增 | 取上游 | 构建依赖变动一律取上游 |
| Release macOS runner `macos-14` → `macos-15` | 上游改 job 结构 | fork 裁剪版只改 matrix 的 runner（D6） | fork 专属文件，按用户决定跟随 runner |
| 模型徽章/快捷切换、双官网链接、跨应用导入、逐模型连通性测试、侧栏面板、托盘左键、右键置顶/置底、DevPanel、禁用更新器 | 无 | 保留 | fork 魔改契约，上游本轮零触碰 |
| README | 4/4 | 保留 fork 整文件 | fork 文档口径 |
| mcode 表单预设过滤缺口 | 无 | 不修，登记 | 不属于本轮同步范围 |

### 预设 id 编号契约（延续）

- 预设目录条目 `id` 一律为**原始数组下标**的字符串；白名单过滤必须发生在 `map((preset, index) => ({ id: String(index), preset }))` 之后，不得先过滤再编号。
- 本轮上游在 claude / codex / gemini / openclaw / opencode / mcode 等目录新增条目会改变下标，但 fork 只在渲染层过滤，`id` 仍按上游数组原位编号；fork 不新增、不删除目录条目。
- DSH 目录由 Pi 目录派生，编号按派生后的数组下标；DSH 账号预设 `dsh-official-account` 是独立的「账号登录」条目，不占用目录编号，`choosePreset` 对其直接返回、不执行 `Number(id)` 查表。
- Kimi 的官方账号卡是独立条目，不属于目录数组；`KIMI_ALLOWED_PRESET_NAMES` 过滤只作用在目录部分。
- `OpenAI API` 条目按上游在原数组中的位置获得编号，fork 的收录只影响是否可见。

### 本地化状态

- 4 个既有 locale 只增删上游本轮键（各 +27/−3），fork 专属键与文案原样保留；同一对象作用域不得出现同名重复键（JSON 会静默取后者、测试与 typecheck 全绿也发现不了，必须显式查重）。
- `tr.json` 整文件取上游（上游本轮 +53/−6，含 #9049 的土耳其语目录补全），逐字节与 `git show v4.0.24:src/i18n/locales/tr.json` 一致，不补 fork 键。
- 新增的原生编辑器 / 思考档位 / 授权中心 / Skills / DSH 相关 UI 文案全部来自上游 locale 键；fork 不新造文案。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`archive_confirmation: automatic`、`max_verify_failures: 5`。
- rebase 中途该文件会被 fork 历史提交改回旧内容：出现时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并 `git add`，不得让 Native Hook 因配置被改写而拒绝写入。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v424`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理未提交工作。
- `rerere` 可能把往轮的解法复用到新基线：复用后逐个复核，尤其版本四文件、`lib.rs`、`tray.rs`、6 个预设文件、4 个 locale 与 `ProviderForm.tsx`。
- locale JSON 合并后可能出现同名重复键：合并后必须做对象作用域查重；TS 侧的重复 `hidden?: boolean` 会报 `TS2300`，上游已有声明时 fork 追加那份会被 git 判为冗余，属正常。
- **上游新增的 `Provider` 结构体字面量必须补 `website_url_2`**：本轮至少 `src-tauri/src/proxy/providers/claude_reasoning.rs` 的测试 helper（`fn provider(name, meta) -> Provider { … website_url: None, category: None, … in_failover_queue: false }`）。不补则 `cargo check --all-targets` 失败；Build 阶段必须对新落地的每个 `Provider { … }` 字面量做全量排查，不能只改已知一处。
- **`lib.rs` 是本轮最容易整文件取一侧的后端文件**：上游重写了 single_instance 区（第 398 与 409 行附近），fork 的无 Updater、connectivity 注册、托盘 builder 段在第 579/1207/1217/1792/2010 行附近；解完必须按「窗口、托盘与 Skills 终态」列出的 grep 清单逐项取证。
- **`tray.rs` 的 fork 左键契约本轮不受上游触碰，但必须复核**：上游新增的 `provider_hint(app, provider, claude_accounts)` 签名变化会连带 `panel_rows` 的取值路径；护栏 `tray_left_click_never_opens_the_menu` 与 `set_show_menu_on_left_click(false)` 必须在位，`native_menu_on_left_click` 保持删除。
- **`KimiProviderForm` 的编号→过滤块与上游 `PRESETS` 改动相邻**：取上游时容易把 fork 的 `.filter` 一起吃掉，导致 fork 构建显示全部 Kimi 目录预设。解完必须 typecheck 确认 `.map` 仍在 `.filter` 之前。
- **`ClaudeFormFields` 的 fork 改写面 300/235**：上游新增字段与 props 必须在 fork 的 `rightSlot` 布局里渲染；不要因取上游把 `apiFormatControl`/`copilotFormatFallback` 双渲染点退回旧布局，也不要因保 fork 丢掉 `reasoningEffort` 的 dirty 判定与隐藏条件。
- **`BasicFormFields` 的上游改动删了 `Button`/`ArrowLeft`/`Dialog*` 导入**：fork 的 `websiteUrl2` 段在同一文件后部；若手工拼接导入块，取上游删除结果，不要因「fork 也用了 Button」把已不需要的导入留着造成 `TS6133`。
- **`commands/misc.rs` 上游改动面 249 行、fork 只有 tunecc URL**：逐 hunk 取上游，禁止整文件取一侧；解完跑 tunecc/farion1231 两条 grep 取证。
- **版本与锁文件禁止 `git checkout --ours`**：rebase 中 `--ours` 是上游基线，会把 fork 的 `repository = tunecc`、`codegen-units = 1`、移除的 updater 依赖一并覆盖（v4.0.20 轮实测踩中）。
- `pnpm-lock.yaml` 的 `(yaml@2.8.1)` peer 后缀改写涉及多个包条目，必须让 `pnpm install --frozen-lockfile` 复验，不接受「手工补一行」。
- **schema 本轮不撞号是结论不是默认**：若上游在 Build 期间被证实推进了 `SCHEMA_VERSION`，按「上游新版本与 fork 当前值取较大者并叠加双方迁移步骤」处理并回到 Shape 更新本节。
- `services/stream_check.rs` 仍是孤儿文件：上游本轮未改它；继续不为「消除 stream_check 字样」删除或改写它，也不重新接线。
- 上游 `.github/workflows/*` 中只有 `release.yml` 被改（macos-15）；fork 的 `ci.yml` 保持与上游一致的 cargo nextest 口径，`wsl2-nightly.yml` 不在本轮改动面。
- 时间敏感用例：`SessionManagerPage` 分桶用例在本地 00:00–00:30 必失败、`AppsPage` 过期缓存用例只在 CI 并发下竞态，两者与上游逐字节相同，单条红按既有取证顺序判定，不登记为同步丢语义。

### 版本号

- `4.0.24-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.24-1`（跨 `v4.0.23`、`v4.0.24` 两个上游发布，只打一个 fork tag）。

### 交付（归档后单独授权）

- 验收通过、用户接受结果并归档后，向用户单独请求授权；获准后执行：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.24-1` 并 `git push origin v4.0.24-1`。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.24-1` 核对远端指向（`gh` 命令一律带 `-R tunecc/cc-switch`，`gh api` 把仓库写进 endpoint path）；Release CI 仅 Windows x64 与 macOS arm64 unsigned，macOS job 现在使用 `macos-15` runner。若 tag push 事件零 run，按既有取证流程删远端 tag 重推同一对象补触发。

### fork 魔改保留清单（同步后必须仍然存在且可用）

1. 产品名 CC Switch、DevPanel（`dev:fork`）与 fork 构建标记 `IS_FORK_BUILD`。
2. 侧栏面板可见性（`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS`、`GeneralSection` 开关）。
3. 模型徽章与快捷切换（`MODEL_CAPABLE_APPS` 仍为 claude/codex/gemini/grokbuild）。
4. Claude 兜底模型直达区、1M 全选与角色模型映射的「非高级」判定。
5. 供应商右键置顶/置底、新建插入第二位。
6. 官方预设白名单（`forkOfficialAllowlist` + `filterForkPresets`；本轮新增 claude/claude-desktop/codex 的 `OpenAI API` 三条；13 家 Gemini CLI / Astron MaaS 等第三方继续隐藏）。
7. 逐模型连通性测试（`connectivity_test_provider_models`/`connectivity_probe_provider`、`shouldShowTestEntry`）。
8. 双官网链接（`websiteUrl`/`websiteUrl2` 后端字段与前端展示；未绑号卡仍显示）。
9. 跨应用导入（`providerImport.ts`、`ProviderImportEntry`、各表单入口，仍只在支持的 `appId` 渲染）。
10. 禁用应用内更新器（无插件/依赖/权限，`install_update_and_restart` 空壳）。
11. README 的 fork 说明与 fork CI（Release 仅两平台 + macos-15 runner）。
12. 托盘左键切换主窗口与源码护栏（全平台一致）。
13. 测试稳定性修正（AppsPage 的 `waitFor` 等）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests`）

- `forkOfficialAllowlist`：过滤函数、白名单表与各表单/测试接线均在；`claude`/`claude-desktop`/`codex` 三键含逐字 `"OpenAI API"`。
- `filterForkPresets`：过滤函数 + 预设入口/测试接线均在。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：列表仍为 claude/codex/gemini/grokbuild。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：前端设置、侧栏、类型、后端 `settings.rs`、测试均在。
- `websiteUrl2`/`website_url_2`：后端迁移/DAO/构造器、deeplink、前端双链接、上游新增测试字面量（含 `claude_reasoning.rs`）、测试均在。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：`lib.rs` 注册、命令与服务、前端 API、hooks 均在。
- `ProviderImportEntry`/`readImportableProviderFields`：组件、hooks、`providerImport.ts` 与各表单/测试均在；Kimi/Mcode/omp 三个表单的导入接线在原生编辑器改造后仍然存在。
- `KIMI_ALLOWED_PRESET_NAMES`：`KimiProviderForm` 中 `.map` 编号在 `.filter` 之前。
- `tray_left_click_never_opens_the_menu`：guard test 在且通过；`native_menu_on_left_click` 仅可能出现在注释/护栏字符串中，函数定义与调用点为 0。
- `tauri_plugin_updater`/`updater_builder`：0 命中；`tauri-plugin-updater` 不在 `Cargo.toml`、`plugin-updater` 不在 `package.json` 与 `pnpm-lock.yaml`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。
- `stream_check`：后端仍只在 `database/schema.rs` 的建表/索引与孤儿文件中出现；`services/mod.rs`、`commands/mod.rs`、`lib.rs` 不声明或注册。
