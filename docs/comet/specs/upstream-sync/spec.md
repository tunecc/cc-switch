# 完整目标规格：upstream-sync（v4.0.22 轮，当前基线）

> 本文件是 upstream-sync 能力的累积规格，随每轮同步整体重写；当前内容对应 fork 已同步到上游发布头 tag `v4.0.22` 的状态，取代此前的 v4.0.21 轮版本。历轮的同步范围、冲突停车清单与落地保真数字保留在各 change 的归档产物 `docs/comet/archive/<date>-sync-upstream-*/` 中。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步基线为 annotated tag `v4.0.22`（tag 对象 `ab92059613455b5bb6751f16f87817eb731a55e4`，剥离提交 `b76426741ef93069e2f374ac01ca7ef5760e1d0e`）；fork 版本号 `4.0.21-1` → `4.0.22-1`。`upstream/main` 比 tag 多 10 个提交（最新 `ba3d80d87`），按「只锁已发布 tag」约定不纳入。推送与 tag 属交付步骤，在验收通过并归档之后单独取得用户授权再执行。

上游 `v4.0.21..v4.0.22` 共 58 个提交、228 个文件、+15909/−1177（37 新增 / 1 删除 / 190 修改），与 fork 的重叠面为 45 个文件（fork 相对该基线的自有改动面为 474 个文件、+60318/−2783）。本轮主轴是 **DeepSeek Harness（DSH）作为第 14 个应用整体接入**：Web 与 Desktop 配置并行管理，供应商页支持 live 托管、模型编辑器专用的 `dsh` 方言、DeepSeek 官方账号登录（授权中心）与用量导入，MCP/Skills 开关、侧栏、可见应用设置同步接入；预设目录由 Pi 目录派生，只保留三种 wire protocol 兼容的条目，官方账号卡 `dsh-official-account` 独立于目录。上游同时带来终端增强（追加自定义参数、跳过权限提示、Codex 供应商卡直接打开终端）、用量与额度修复（OMP/DSH 用量导入、非当前供应商余额刷新、绑号 Claude 账号额度进入托盘与用量设置、MiniMax 周窗口、错误信息写入上限、侧栏用量对齐）、代理修复（xAI Responses include、Gemini skip signature / thoughtSignature / 尾部文本、WebSearch blocked_domains、Copilot Claude 原生 `/v1/messages`、常量时间 token、`x-api-key`、回环地址守卫）、Skills 增强（打开安装目录、复制名称、Discover 打开文档、只发现变更仓库）、WebDAV 清空配置、应用/配置修复（live 配置读取失败提示、Kimi 安装器重跑、CLI 无版本判定、OpenCode V2 baseURL、TOML 数组表头、Claude Desktop 模型顺序、AGY transcript、Codex 模型列表日志）、Claude 账号修复（子进程代理、超大凭据 keychain、过期账号引导、授权中心滚动、WSL 提示）、预设/赞助商刷新（OspreyAI、Astron、TokenFlux、StreamLake、AIGoCode/PatewayAI/DIT.ai 物料）、Windows 第三方托盘宿主兼容，以及 schema 24（`enabled_dsh` 两表 + `session_log_sync.parser_state`）、`subtle` 依赖与 v4.0.22 发布物料。

**上游是否重写了 fork 已有功能——本轮结论：没有重复实现，不构成「保留上游 or 保留 fork」的二选一。** 同域交集与处理：

1. **DSH 是全新应用**：fork 侧没有任何 DSH 代码、预设或配置语义；`commands/dsh.rs`、`dsh_config.rs`、`mcp/dsh.rs`、`services/dsh_account.rs`、`session_manager/providers/dsh.rs`、`session_usage_dsh.rs`、`DshAccount.tsx`、`dshProviderPresets.ts` 随上游整体落地，fork 只补白名单键与过滤接线。
2. **托盘点击处理同域不同语义**：上游把内联处理抽成 `tray::handle_tray_icon_event`、新增 `tray_compat`（Windows 第三方宿主补发点击），并把 Windows 左键改为「显示主窗口」；fork 的契约是「左键切换主窗口显示/隐藏、永不弹菜单，全平台一致」。处理方式见「托盘、更新器与 Windows 终态」与 D2：采纳上游的函数抽取与 `tray_compat` 作为事件传输，handler 内保留 fork 四条分支，不采纳上游 Windows 单分支。
3. **终端入口同域但目标不同**：上游新增 `terminalAvailable` 与 Codex 卡终端、额外参数、跳过权限提示；fork 的逐模型连通性入口、右键置顶/置底、⋯ 菜单移除「模型」项均不在上游本轮改动面，互不覆盖。
4. **用量自动查询语义变化**：上游移除 `ProviderCard` 的 `isInConfig`，让余额按用户配置刷新、不再依赖当前/启用状态（`869c0b27f`）；fork 未实现该逻辑，整体取上游。fork 的模型徽章、双官网链接与额度容器不受影响。
5. **`McodeProviderForm` 与 `ProviderList` 是共享文件**：上游加入 DSH 预设/账号组与 DSH 账号卡、live 配置读取失败提示；fork 加入跨应用导入与列表/卡片改造。按「上游新块 + fork 新块并存」逐 hunk 合并。
6. **预设白名单与 schema**：上游新增第三方预设 → fork 构建继续隐藏；上游 schema 24 与 fork 24 碰撞 → fork 升 25（见 D4）。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.22` 剥离出的提交 `b76426741ef93069e2f374ac01ca7ef5760e1d0e`。
- `git merge-base main v4.0.22` == `b76426741`；`git log v4.0.22..main` 仅含 fork 作者 `Tune` 的提交。
- 同步前 183 个 fork 提交（`git rev-list --count v4.0.21..HEAD`，起点 `bce5bbceeda8866e485a3601ae482f7b92af40b3`）按原顺序重放，外加本轮的同步终态提交与归档提交。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v422`（= `bce5bbceeda8866e485a3601ae482f7b92af40b3`）固定记录。
- 上一轮基线 tag `v4.0.21` = `2f04decf8`（剥离 `c4db63c60`）与 fork 发布 tag `v4.0.21-1` 保持不变。
- `upstream/main` 当前为 `ba3d80d87`（tag 之后 10 个提交），本轮显式排除，不同步其他上游分支。
- 上游本轮不触碰 `.gitignore`；重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v422/` 产物。若 Comet Runtime 追加托管忽略块，先作为独立 chore 提交再开始重放。

### 同步范围（v4.0.21..v4.0.22：58 提交、228 文件、+15909/−1177）

上游本轮改动按功能分组如下（详细到提交号，便于核对落地保真）：

1. **DSH 应用接入（6 提交）**：`3fc8794cf`（集成 DSH）、`6fa328f3b`（Web/Desktop 并行管理、账号登录、用量导入）、`2baa68621`（DeepSeek 官方账号登录）、`efb955bd1`（账号区去掉横幅、共享列表写入标题）、`f283a55f6`（侧栏显示全名）、`dfa291237`（共享模型编辑器对齐 Pi/Kimi）。
2. **终端（3 提交）**：`ebb00da11`（追加自定义参数）、`03b475fb8`（跳过权限提示选项）、`6776bc06b`（Codex 供应商卡打开终端）。
3. **用量与额度（6 提交）**：`accc44898`（OMP 会话用量导入）、`67cce7ad3`（绑号 Claude 账号额度进托盘与用量设置）、`869c0b27f`（非当前供应商也刷新余额）、`32db0e576`（MiniMax 周窗口用尽后保持可见）、`f19b3898c`（`error_message` 写入上限）、`7f82b85b5`（侧栏今日用量文字对齐）。
4. **代理（9 提交）**：`8355f1f1f`（xAI Responses include 过滤）、`df753b5ef`（Gemini Native skip signature 回退）、`6282108e0`（thoughtSignature 移到 Part 级）、`064ae4220`（Gemini 函数响应尾部文本拆分）、`326b394be`（Claude WebSearch blocked_domains 映射）、`9403960f8`（Copilot Claude 走原生 Messages）、`1718a2619`（常量时间 token 校验）、`33833a6a6`（`x-api-key` 网关认证）、`cd9c72108`（拒绝回环到代理自身的上游 URL）。
5. **Skills（3 提交）**：`9077b4326`（只发现变更仓库）、`6d6b7162f`（打开安装目录、复制名称）、`0b8a53e37`（Discover 列表打开文档）。
6. **应用、配置与表单（9 提交）**：`c1933fd04`（live 配置读取失败提示）、`da2635118`（Kimi CLI 旧版本重跑安装器）、`e78f641ca`（CLI 存在但无版本判为不可运行）、`ed494fbc7`（OpenCode V2 `settings.baseURL`）、`ddcb11176`（TOML 数组表头识别）、`983113a13`（Claude Desktop `inferenceModels` 按 UI 顺序）、`4ed071500`（AGY transcript 路径按 Path 比较）、`115677a1c`（AGY transcript 优先于其它根的索引条目）、`11485ee78`（Codex 官方模型列表失败记录根因）。
7. **Claude 账号与授权中心（7 提交）**：`33aaf8e74`（子进程继承全局代理）、`6c998b4dc`（超大凭据经 argv 写 keychain）、`16b6575d0`（过期托管账号指向 Accounts）、`144c41b96`（授权中心只滚动面板主体）、`d288057f3`（Claude 订阅账号切换指南）、`dd81bc95b`（v4.0.21 notes 链接指南）、`0133facca`（配置目录在 WSL 时提示不支持 Claude 账号）。
8. **预设与赞助商（8 提交）**：`9433caabe`（OspreyAI）、`839efbe24`（TokenFlux 域名与回退）、`ebdedbee4`（StreamLake 渠道跟踪）、`12e9fe53f`（Astron Coding Plan）、`ee8ee25eb`（DIT.ai 位置）、`03e19fe73`（DIT.ai 文案）、`c2aa4e0b2`（PatewayAI 文案）、`3e75b96e1`（AIGoCode 物料）。
9. **托盘（1 提交）**：`e55d8a21b`（Windows 第三方托盘宿主点击兼容）。
10. **WebDAV、UI、CI、文档与发布（6 提交）**：`7201d81bf`（清空 WebDAV 配置）、`a62203bb0`（重复 tooltip 与帮助卡约束）、`03ec9dbb6`（WSL2 检查改手动、SQLite 测试守卫）、`df511e82e`（PR 模板要求 Human Note）、`84d4ce32b`（版本号 4.0.22）、`b76426741`（3 份 release notes + `src/whats-new/4.0.22.json`）。

新增文件 37 个（`git diff --name-status v4.0.21 v4.0.22` 的 A 项），fork 侧无自有语义、随上游整体落地：

- DSH 后端：`src-tauri/src/commands/dsh.rs`、`src-tauri/src/dsh_config.rs`、`src-tauri/src/mcp/dsh.rs`、`src-tauri/src/services/dsh_account.rs`、`src-tauri/src/services/session_usage_dsh.rs`、`src-tauri/src/session_manager/providers/dsh.rs`、`src-tauri/tests/dsh_commands.rs`。
- DSH 前端：`src/components/providers/DshAccount.tsx`、`src/config/dshProviderPresets.ts` 与测试、`src/lib/api/dsh.ts`。
- 其他后端：`src-tauri/src/services/session_usage_omp.rs`（OMP 用量导入）、`src-tauri/src/services/provider/codex_terminal.rs`（Codex 终端）、`src-tauri/src/proxy/upstream_guard.rs`（回环守卫）、`src-tauri/src/tray_compat.rs`（Windows 托盘兼容）。
- 前端测试：`tests/components/{AuthCenterPanel,DshAccountCard,DshAddProviderDialog,UsagePolling}.test.tsx`、`tests/hooks/useSkillRepoDiscovery.test.tsx`。
- 文档与物料：`docs/release-notes/v4.0.22-{en,ja,zh}.md`、`src/whats-new/4.0.22.json`、`docs/deepseek-harness-integration-zh.md`、`docs/deepseek-harness-pr8771-compatibility.md`、`docs/guides/claude-official-accounts-guide-zh.md`、Claude 账号指南图片与封面提示词、OspreyAI 图标与横幅、AIGoCode 深/浅色 logo。

上游本轮删除 1 个文件：`assets/partners/logos/aigocode.png`（由深/浅色两张替换）。fork 未改该资源，按上游删除。

### DeepSeek Harness（DSH）终态

- **应用接入**：`dsh` 是第 14 个应用（`AppId`/`AppType::Dsh`），显示名 `DeepSeek Harness`，图标 `deepseek`；进入应用列表、侧栏、`DEFAULT_VISIBLE_APPS`、`VisibleApps`、`MCP_APP_IDS`、`SKILLS_APP_IDS`、`ADDITIVE_APP_IDS`、托盘应用名与全部 `match AppType` 分支。默认可见；不参与「当前供应商」概念（`get_current_provider`/`set_current_provider` 对其返回 `None`/no-op），不显示 ProfileSwitcher。
- **Web 与 Desktop 配置**：`dsh_config` 管理 Web 与 Desktop 两份 profile（含布局锁定、写入与提交），`initialize_dsh_profiles` 在启动、列表读取与同步前把 live 托管供应商与启用的 MCP 服务器补进新出现的 profile，并在本地记录完成状态，避免用户后续原生删除被回填。
- **供应商页**：`ProviderForm` 把 `dsh` 路由到 `McodeProviderForm`；表单按 `appId` 选择 `dshProviderPresets`，模型编辑器使用 `modelDialect="dsh"`（与 Pi/Kimi 对齐的共享编辑器）；`ProviderService` 的 list/save/update/add/delete 对 DSH 走 `dsh_config` 的 live 读写与锁；供应商卡作为累加式应用管理（live 成员判定 `liveConfigManaged`），支持添加/移除/删除。
- **账号登录**：`DshAccount` 卡片与 `services/dsh_account.rs` 提供 DeepSeek 官方账号登录、登出、轮询与取消；授权中心增加 `dsh_account` 分组；「账号登录」预设 `DeepSeek`（`providerKey = dsh-official-account`）只负责跳转授权中心，不新建供应商。
- **预设目录**：`dshProviderPresets` 由 `piProviderPresets` 派生，只保留 `openai-completions` / `openai-responses` / `anthropic-messages` 三种协议，并按 DSH 的 compat 字段白名单裁剪；模型表写入 DSH 的 `models` 结构（name/modalities/limit/reasoning/reasoningEfforts）。条目编号沿用派生数组的原始下标。
- **用量与 MCP**：`session_usage_dsh.rs` 导入 DSH 会话用量，`session_log_sync.parser_state` 保存游标处未完成请求的解析上下文；`mcp/dsh.rs` 把 MCP 服务器写入 DSH 配置；`McpApps`/`VisibleApps`/`AppType` 均有 `dsh` 位。
- **deeplink**：DSH 供应商不允许通过 deeplink 创建，返回「请到 DeepSeek Harness 页面添加」。
- **fork 边界**：DSH 不进入 fork 的模型徽章/快捷切换（`MODEL_CAPABLE_APPS` 仍为 claude/codex/gemini/grokbuild），不改变跨应用导入与逐模型连通性测试的既有范围；fork 只新增 DSH 白名单键与 DSH 目录过滤接线。

### 终端终态

- **额外参数**：打开终端时可在生成参数之后追加用户自定义参数；按用户 shell 解析（Unix 用对应 shell 的引号规则，fish 单独处理；Windows 按命令行规则），无法解析时不启动并给出错误；批量/终端变量原样透传，不插入到批量变量之前。
- **跳过权限提示**：新增选项在生成的参数后追加平台对应的跳过权限标志，避免用户每次手动输入。
- **入口**：Codex 供应商卡在 `terminalAvailable(provider, appId, isCurrent)` 为真时提供「打开终端」；Codex 需要是当前卡或自带路由（`codexHasOwnRoute`），否则不显示入口。`App.tsx` 的 `onOpenTerminal` 覆盖 claude / codex / agy。v4.0.21 的卡片图标按钮位置、⋯ 菜单移除模型项、fork 右键菜单均不变。
- **隔离语义**：Claude 卡通过 `--settings <临时文件>` 注入该卡的 env，绑号官方卡固定使用账号的 `CLAUDE_CONFIG_DIR`；Codex 第三方卡通过 `codex -c` 覆盖只对本次进程生效，Key 经环境变量传入，不写 `config.toml`；agy 带 Key 的卡使用私有 `--gemini_dir`；`terminalIsIsolated` 继续决定卡片上的隔离提示。

### 用量、额度与侧栏终态

- **OMP 用量**：`session_usage_omp.rs` 导入 Oh My Pi 会话用量；注册与聚合接回 `services/mod.rs` 与用量统计链路。
- **Claude 账号额度**：绑号 Claude 官方卡在托盘与用量设置显示该账号的套餐与剩余额度（`TrayUsageSource::ClaudeAccount` + `usage_cache.with_claude_account`）；未绑号卡仍走应用级订阅缓存；查不到账号额度时不回落到默认登录的缓存。
- **余额刷新**：`ProviderCard` 移除 `isInConfig`，脚本用量按用户配置的 `autoQueryInterval` 刷新，不再依赖「当前/已启用」；`UsageFooter` 不再接收 `isCurrent`/`isInConfig`。副作用是未启用供应商的余额也会按配置刷新（上游 `869c0b27f` 的预期行为）。
- **MiniMax**：周窗口额度用尽后仍保持可见，不因归零而隐藏。
- **错误信息**：`proxy_request_logs.error_message` 在写入时截断到上限，避免异常长文本撑大数据库。
- **侧栏**：今日用量文字增加行内距，与模式标签对齐。
- **fork 边界**：fork 的模型徽章、双官网链接、额度容器宽度与右键菜单保持不变；`UsageFooter` 的 fork 使用方式按合并后接口调整。

### 代理与 MCP 终态

- **xAI**：Responses 请求过滤不支持的 `include` 标记，避免上游 400。
- **Gemini**：Native 路径在缺少签名时回退到 Gemini 的 skip signature；`thoughtSignature` 挂到 Part 级而不是 `functionCall` 内部；函数响应尾部的普通文本拆分为独立 part，避免上游解析失败。
- **WebSearch**：Claude 的 `blocked_domains` 映射为 Responses 的过滤参数。
- **Copilot**：Anthropic 模型且模型声明支持 `/v1/messages` 时，Claude 客户端请求原生透传（保留 `cache_control` 与 thinking block），否则走 Chat/Responses 桥；thinking block 只在需要格式转换时主动剥离；`uses_anthropic_rectifiers` 覆盖 `GitHubCopilot`，让原生 Messages 的签名/预算整流器生效。
- **Claude Desktop 网关**：token 比较改为常量时间（新增 `subtle` 依赖），并接受 `x-api-key` 认证头。
- **回环守卫**：`proxy/upstream_guard.rs` 在发出上游请求前拒绝解析到代理自身监听地址的 URL，避免自我转发循环。
- **MCP**：`mcp_servers`/`skills` 增加 DSH 开关；DAO 的 SELECT/INSERT 与行映射同步扩展；MCP 页面按应用展示 DSH。

### Skills、WebDAV、应用与配置终态

- **Skills**：Discover 只扫描发生变更的仓库（不再每次全量）；已安装技能可打开安装目录、复制名称；Discover 列表可打开技能文档；新增 `discover_repo_skills` 与 `open_skill_dir` 命令并在 `lib.rs` 注册。
- **WebDAV**：新增 `webdav_sync_clear_settings` 命令与「清空配置」入口，清空后同步状态与表单一起复位；自动同步 worker 与既有上传/下载逻辑不变。
- **live 配置读取失败**：opencode / openclaw / hermes 的 live 成员查询出错时，供应商列表顶部显示警告，说明修好配置前添加/移除都会失败，不再表现为「空列表」。
- **应用管理**：Kimi CLI 版本早于支持 `upgrade --yes` 时重跑官方安装器；CLI 存在但拿不到版本时报告为不可运行并给出探测详情；OpenCode 连通性检测读取 V2 `settings.baseURL`；TOML 段落识别支持数组表头；Claude Desktop 的 `inferenceModels` 按 UI 层级顺序写入；AGY transcript 路径按 `Path` 比较（Windows 分隔符），transcript 优先于其它根的索引条目；Codex 官方模型列表拉取失败时记录底层原因。
- **UI**：修复重复 tooltip，约束帮助卡尺寸。

### Claude 账号与授权中心终态

- Claude Code 子进程继承应用的全局代理设置。
- 超大凭据改经 argv 写入系统 keychain，避免命令行/环境变量长度限制。
- 托管账号过期时引导用户到「账号」页，而不是给出无法执行的命令。
- 授权中心跳转到分组时只滚动面板主体，头部保持固定。
- 配置目录位于 WSL 时，明确提示不支持 Claude 账号。
- 新增 Claude 订阅账号切换指南文档，并从 v4.0.21 release notes 链接。

### 卡片、列表与预设终态

- **ProviderCard**：采纳上游 `terminalAvailable` 判定与 `isInConfig` 移除；采纳 DSH 账号卡在列表中的渲染（不属于供应商行）；fork 的模型徽章（标题行）、双官网链接（副标题行）、右键置顶/置底、`max-w-[208px]` 额度容器与 `onTest` 外层守卫保留。绑号 Claude 官方卡仍走上游账号行与额度 footer，未绑号卡仍走 fork 双链接。
- **ProviderList**：采纳 DSH 账号卡（登录后显示在「已添加」最前，参与搜索与计数）、live 配置读取失败提示、搜索词提取与 `extraAdded` 统计；fork 的 229 行列表改造（卡片渲染、右键、双链接、徽章相关接线）保留。移除 `isInConfig` 传参后，累加式应用的余额刷新由上游新语义决定。
- **预设**：六个目录（gemini / grokBuild / hermes / openclaw / opencode / pi）内容整份取上游；Pi 的目录变化同时影响 DSH 派生目录。fork 构建继续按 `forkOfficialAllowlist` 过滤，本轮新增的 OspreyAI、Astron、TokenFlux、StreamLake 等第三方条目不在白名单内，继续隐藏；本机推理条目 `Ollama` / `LM Studio` / `vLLM` 名称不变，仍命中白名单。
- **DSH 过滤**：`McodeProviderForm` 对 `appId === "dsh"` 使用 `filterForkPresets("dsh", dshProviderPresets)`，账号预设 `DeepSeek` 作为独立「账号登录」条目不过滤；mcode 表单既有的未过滤缺口本轮不修，保留现状。

### 数据库 schema 终态（25）

- `SCHEMA_VERSION` == 25（上游 v4.0.22 为 24，fork 因已有 24 而再升一位）。
- 迁移链：
  - v18→v19：fork 的 `website_url_2` 与上游 `enabled_mcode` 并存。
  - v19→v20：上游 `mcp_servers.enabled_pi`。
  - v20→v21：fork 的 mcode/pi 幂等修复 + 上游 `enabled_agy`（两张表），set 21。
  - v21→v22：fork 的 `enabled_agy` 幂等补齐（两张表）+ 上游 `enabled_kimi`（两张表），set 22。
  - v22→v23：fork 的 `enabled_kimi` 幂等补齐（两张表）合并上游 `enabled_omp`（仅 `mcp_servers`），set 23。
  - v23→v24：fork 原有 `enabled_kimi`（两张表）与 `enabled_omp`（仅 `mcp_servers`）幂等补齐，**合并上游本轮的 `enabled_dsh`（两张表）与 `session_log_sync.parser_state`**，set 24。
  - v24→v25（本轮新增）：幂等补 `enabled_dsh`（`mcp_servers`/`skills`）与 `session_log_sync.parser_state`，set 25。覆盖已停在 fork v24 的库；上游 v4.0.22 的 v24 库已含这些列，重复执行无副作用。
- `create_tables` 的 `mcp_servers` 与 `skills` 均含 `enabled_dsh`；`session_log_sync` 的 DDL 含 `parser_state`，并在建表后保留 `add_column_if_missing` 补丁，修复跑过未发布开发版 v24 的库。
- `database/dao/mcp.rs`：`MCP_SERVER_SELECT`、`INSERT OR REPLACE`、`row_to_mcp_server` 与 `AppType::Dsh` 的列名映射全部加入 `enabled_dsh`（位于 `enabled_omp` 之后，行索引 18，INSERT 19 个参数）。
- 上游 v4.0.22 不新增表；除上述列外无其它 schema 变化。
- 降级：fork v25 库被上游 v4.0.22（v24）打开会报「数据库版本过新」，与上游自身策略一致，不做兼容。

### 托盘、更新器与 Windows 终态

- **托盘入口**：托盘点击处理统一走 `tray::handle_tray_icon_event`；`lib.rs` 的 builder 只挂 `.on_tray_icon_event(tray::handle_tray_icon_event)`。Windows 第三方宿主经 `tray_compat` 补发的点击也调用同一函数。
- **fork 四条分支（全平台一致）**：面板样式且左键 Up、面板未显示 → `tray::toggle_main_window`；面板样式其余情况（左键且面板已显示、右键）→ `tray_panel::toggle(rect)` 并返回；原生菜单样式左键 Up → `toggle_main_window`；原生菜单样式右键 Up → `mark_feedback_seen` 后交系统菜单。不采纳上游「Windows 左键只显示主窗口」的分支。
- **tray_compat（Windows）**：给托盘隐藏窗口加子类；`Shell_NotifyIconGetRect` 取不到矩形时，把光标位置当作图标补发一次点击；右键在原生菜单模式下补弹当前菜单；300ms 内重复右键去重；`create_tray_menu` 重建时调用 `remember_native_menu` 更新可弹菜单。它只做事件传输，不改变 fork 的可见行为。
- **其它托盘**：上游新增绑号 Claude 账号额度来源（`TrayUsageSource::ClaudeAccount`）、DSH 应用显示名与相关测试随上游落地；`apply_tray_style` 继续固定 `set_show_menu_on_left_click(false)`；`native_menu_on_left_click` 保持删除（不复活上游定义）；`tray::tests::tray_left_click_never_opens_the_menu` 护栏保留并通过；悬停/点击刷新用量的逻辑不变。
- **应用内更新器**：继续禁用。`install_update_and_restart` 保持空壳（返回 `Ok(false)`），`check_app_update_available` 保持空壳，无 updater 插件/依赖/AIP；上游本轮未改 updater 相关函数。
- **Windows 其它**：采纳 `tray_compat`、Kimi 安装器重跑、CLI 无版本判定与 WSL2 工作流调整；上一轮的 MSI 模板 `REBOOT=ReallySuppress`、`CloseApplication`、可选桌面快捷方式与 `release.yml` Property 断言保持（`release.yml` 不在上游本轮改动面）。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md`：
  - §4 共享文件表按本轮结果修订：`lib.rs` 行（上游 `dsh`/`tray_compat`/`handle_tray_icon_event`/skills/webdav 命令 + fork updater/stream_check 移除与 connectivity 注册）、`tray.rs` 行（上游 handler/tray_compat/Claude 账号额度/DSH 名 + fork 左键契约与护栏）、`settings.rs` 行（上游 `dsh` + fork 侧栏面板）、`database/{schema,mod}.rs` 与 `database/tests.rs` 行（schema 25 + 上游 dsh/parser_state）、`database/dao/mcp.rs` 行（上游 `enabled_dsh` + fork 既有列）、`provider.rs`/`deeplink/provider.rs` 行（上游 DSH 分支 + fork `website_url_2`）、`services/provider/mod.rs` 行（上游 `initialize_dsh_profiles`/`codex_terminal`/`keep_row_if_written` + fork 测试字面量）、`services/provider/live.rs` 行（上游 DSH 分支 + fork sanitize 助手）、`commands/misc.rs` 行（上游终端/Kimi/CLI 探测 + fork URL）、`App.tsx`/`ProviderList.tsx`/`ProviderCard.tsx` 行（上游 DSH/终端/用量语义 + fork 侧栏/徽章/双链接/右键）、`McodeProviderForm.tsx` 行（上游 DSH 预设/账号组 + fork 导入 + fork DSH 过滤接线）、6 个预设文件与 4 个 locale 行。
  - locale 行登记：fork 专属覆盖仍为 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp`；上游本轮新增/删除/改写键按上游落地；`tr.json` 整文件取上游。
  - 新增 §4.9「v4.0.22 轮的叠加要点」：DSH 全量接入与白名单、托盘 handler 抽取与 `tray_compat` 的 fork 合并规则、schema 24 碰撞与 25、终端增强、用量自动刷新语义、上游新增第三方预设的隐藏口径。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记「v4.0.22 轮上游 schema 24 与 fork 24 碰撞，fork 升 25；23→24 臂合并 dsh/parser_state，新增 24→25 幂等臂」。

### 重放映射（口径与实测）

- 同步前 `git rev-list --count v4.0.21..pre-sync-v422` 预期 == 183。
- 重放后 `git rev-list --count v4.0.22..HEAD` 与 183 的差值只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；逐条记录。
- tag `v4.0.22` 是 annotated tag：tag 对象 `ab9205961…`，剥离提交 `b76426741…`；`git merge-base main v4.0.22` == `b76426741…`；`git log --format='%an <%ae>' v4.0.22..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- 提交主题序列逐行 diff（重放前 `v4.0.21..pre-sync-v422` 与重放后 `v4.0.22..HEAD`）差异必须为 0 行。
- patch-id 对照（stdin 口径）逐个归类：与重放前完全相同 / 仅 hunk 位移 / 冲突停车；冲突停车逐条记录归属与解法。预期的主要停车面：版本四文件、`README.md`、`src-tauri/src/lib.rs`、`tray.rs`、`commands/misc.rs`、`database/{schema,mod}.rs`、`database/tests.rs`、`provider.rs`、`services/provider/{mod,live}.rs`、`settings.rs`、`App.tsx`、`ProviderCard.tsx`、`ProviderList.tsx`、`McodeProviderForm.tsx`、`ProviderForm.tsx`、6 个预设文件、4 个 locale、`tests/components/{ProviderList,ProviderPresetSelector}.test.tsx`。
- 冲突停车清单（交互式）已逐条记录（见下）；rerere 复用的解法必须逐个复核。
- `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 必须 0 命中（exit 1）。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。

#### 本轮实测（Build 阶段回填）

- 同步前 `git rev-list --count v4.0.21..pre-sync-v422` = **183**。
- 重放后（代码终态 `HEAD` = `8aaa362cd`）`git rev-list --count v4.0.22..HEAD` = **184** = 183 个重放提交 + 1 个本轮新增提交（`8aaa362cd` `feat(fork): sync v4.0.22-1 with schema 25 and DSH support`）。Build 收尾的文档提交（只改 `docs/**` 与 Markdown）使最终 `HEAD` 计数为 **185** = 183 + 2，不改变重放映射。
- 被 git 判空丢弃的提交 = **0 个**（183 → 183）。
- 主题序列 `git log --format='%s' --reverse` 逐行 diff（`v4.0.21..pre-sync-v422` vs `v4.0.22..HEAD` 剔除本轮新增提交后）= **0 行**。
- `git merge-base main v4.0.22` = `b76426741ef93069e2f374ac01ca7ef5760e1d0e`（= `v4.0.22^{}`，annotated tag 对象 `ab92059613455b5bb6751f16f87817eb731a55e4`）；`git log --format='%an <%ae>' v4.0.22..HEAD | sort -u` 只有 `Tune <176898395+tunecc@users.noreply.github.com>`。
- patch-id 差异 = **13 处**（170 个与重放前逐字相同）：
  - **12 处为冲突停车**（全部在 reflog 留下今日的 `rebase (continue)` 记录，重放位置 31、46、48、49、67、70、87、97、106、113、157、178，逐条见下）；
  - **1 处未停车**：`a4bda4bcb→a22a67ddf`（模型徽章与快捷切换入口），文件集与增删行数完全相同，属三方自动合并后内容随新基线上下文位移。
- rerere：全程开启，今日新增 44 个文件级条目；12 个停车点全部按最终树逐条复核（见下方冲突清单），最终 `pnpm typecheck`、`pnpm test:unit`、`cargo test` 全绿。

### 落地保真核对（口径，最终态复算）

- 算法（固定口径）：对上游 `v4.0.21..v4.0.22` 改动过的每个文件（228 个，覆盖 45 个重叠文件的全部）取 `git diff v4.0.21 v4.0.22 -- f` 的增/删行、`git diff v4.0.21 pre-sync-v422 -- f` 的 fork 增行，与 `git show HEAD:f` 的实际内容；行先 strip、去掉一个尾逗号、丢弃空行与纯符号噪声行，再做多重集差得「上游新增行缺失」与「fork 新增行缺失」。非重叠的 183 个上游文件 fork 侧缺失应为 0。
- 计算必须在全部最终态提交（版本、文案、文档、schema、DSH 与其它交集、合并、测试断言修正）落完之后，对最终代码终态 `HEAD` 执行；其后的归档提交只改 Markdown，不在 228 个文件内，故数字不变。
- 预期的刻意取舍（逐行归因，具体行数见下方「本轮实测」）：
  - `README.md`：fork 是整文件自有的「与上游的差别」文档；上游本轮新增/删除行不落地，全部归因为「fork 整文件替换」。
  - 版本与锁文件：上游 `4.0.22` 行被 fork `4.0.22-1` 取代（4 个文件各 1 行）；fork 的 `4.0.21-1` 行被本轮终态升级（属预期流转）。
  - `src-tauri/Cargo.toml` / `Cargo.lock`：上游新增 `subtle` 依赖行按上游落地，fork 移除的 updater 行不得出现。
  - `McodeProviderForm.tsx`：上游 `presets.map(...)` 的目录表达式被 fork 的 `filterForkPresets("dsh", …)` 包裹，逐行归因为「过滤接线等价」；fork 的导入块保留。
  - `ProviderCard.tsx` / `ProviderList.tsx`：上游移除 `isInConfig`、加入 `terminalAvailable`/DSH 账号卡/live 错误提示；fork 的徽章、双链接、右键与列表改造保留。若行形态因 fork 布局改写，逐行归因为「布局等价」。
  - `tray.rs` / `lib.rs`：上游把 handler 移入 `tray.rs`、加入 `tray_compat` 与 Claude 账号额度；fork 四条分支落在 handler 内，上游 Windows 单分支不逐字存在，逐行归因为「合并等价」。
  - `database/schema.rs` / `mod.rs`：上游 24 的迁移内容并入 fork 的 23→24 臂，`SCHEMA_VERSION` 用 25；上游 `set_user_version(conn, 24)` 的独立臂形态被 fork 的两臂结构取代，逐行归因为「schema 版本碰撞合并」。
  - 6 个预设文件：目录内容整份取上游，fork 各保留 `hidden?: boolean` 两行，不产生上游行缺失。
  - 4 个 locale：上游新增 72 行/删除 14 行全部按上游落地；fork 键段不产生上游缺失；`tr.json` 与上游逐字节一致。
- 任何未说明的非零缺失视为丢语义缺陷；「上游内容零丢失」的旁证用 `git diff --numstat v4.0.22 HEAD -- <file>` 只看 fork 侧新增/删除。

#### 本轮实测（Build 阶段回填）

- 实测合计：**上游新增行缺失 25 行（8 个文件），fork 新增行缺失 27 行（8 个文件）**；228 个上游文件全部参与计算（45 个重叠文件 + 183 个非重叠文件），非重叠上游文件的 fork 新增行缺失为 **0**。计算在代码终态 `HEAD` = `8aaa362cd` 上执行（含 `ProviderCard` 用量自动刷新语义修正与 `McodeProviderForm`/`ProviderCard` 合并）；其后的文档提交只改 `docs/**` 与 Markdown，不在 228 个文件内，数字不变。
- 上游新增行缺失逐项归因：
  - `README.md` 13 行（PatewayAI / DIT.ai / AIGoCode / OspreyAI 赞助商 `tr`/`td` 行）：fork README 整文件重写，不采纳上游赞助商表（刻意取舍）。
  - `package.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` / `src-tauri/tauri.conf.json` 各 1 行（共 4 行）版本号 `4.0.22`：fork 用 `4.0.22-1` 取代（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `pub(crate) const SCHEMA_VERSION: i32 = 24;`：fork 因 24 同号碰撞升为 25（见 schema 终态）。
  - `src-tauri/src/tray.rs` 4 行（`if cfg!(target_os = "windows") && *button == MouseButton::Left {`、`crate::tray_panel::hide_panel(tray.app_handle());`、`show_main_window(tray.app_handle());`、`} else if !crate::tray_panel::uses_native_menu() {`）：按 D2 不采纳上游「Windows 左键只显示主窗口」分支，fork 四条分支保留；`show_main_window` 的可见效果由 fork `toggle_main_window` 承载（合并等价）。
  - `src/components/providers/forms/McodeProviderForm.tsx` 3 行（`...presets.map((preset, index) => ({`、`id: String(index)`、`preset`）：上游目录表达式被 fork 的 `directoryEntries ... .filter(... filterForkPresets("dsh", ...))` 包裹，编号仍在过滤之前（过滤接线等价）。
- fork 新增行缺失逐项归因：
  - 版本四文件各 1 行（共 4 行）`4.0.21-1`：本轮终态升级为 `4.0.22-1`（预期流转）。
  - `src-tauri/src/database/mod.rs` 1 行 `pub(crate) const SCHEMA_VERSION: i32 = 24;`：本轮终态为 25（预期流转）。
  - `src-tauri/src/database/schema.rs` 1 行（`log::info!("迁移数据库从 v23 到 v24（幂等补齐 Kimi 与 OMP 列）");`）：合并上游 `enabled_dsh` 后改写为「幂等补齐 Kimi、OMP 与 DSH 列」（语义等价）。
  - `src-tauri/src/lib.rs` 19 行（托盘 `MouseButton`/`MouseButtonState`/`TrayIconEvent` 导入与 `TrayIconEvent::Click` 处理代码）：上游把事件处理抽到 `tray.rs`，这些行按原语义迁入 `tray::handle_tray_icon_event`（现位于 `tray.rs:21` 与 `tray.rs:2691–2703`），`lib.rs` 只挂 `.on_tray_icon_event`（合并等价）。
  - `src/components/providers/forms/McodeProviderForm.tsx` 2 行（`const importEntry = (`、注释 `// 结构留给用户继续填（与 choosePreset 同一套入口）。`）：导入块改为 `appId === "mcode"` 条件表达式，注释并入上方导入说明（结构改写等价）。
- 说明：`tr.json` 与 `v4.0.22` 逐字节一致（`cmp` 通过）；4 个 locale 与上游的 72/14 行差异全部按上游落地，fork 键段保留，按对象作用域查重为 0 重复。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

本轮重叠面为 45 个文件（实测口径：`comm -12 <(git diff --name-only v4.0.21 v4.0.22 | sort) <(git diff --name-only v4.0.21 HEAD | sort)`；上游 228 文件 + fork 474 文件）。逐文件叠加要求（行数口径为 `git diff --numstat v4.0.21 <ref> -- <file>`，**上游 / fork**）：

#### 版本与仓库根（5 个）

- **`package.json`**（1/1 / 2/2）：取上游内容，版本号改为 fork `4.0.22-1`；保留 fork 的 `dev:fork` script 与已移除的 `@tauri-apps/plugin-updater` 依赖。
- **`src-tauri/Cargo.toml`**（2/1 / 3/6）：取上游内容，版本号改为 `4.0.22-1`；采纳上游新增 `subtle = "2.6"`；保留 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc、`codegen-units = 1`。
- **`src-tauri/Cargo.lock`**（2/1 / 5/175）：采纳上游 `subtle` 包与 `cc-switch` 依赖行；`cc-switch` 条目改为 `4.0.22-1`；不得出现任何 updater 相关包。
- **`src-tauri/tauri.conf.json`**（1/1 / 5/11）：取上游内容，版本号改为 `4.0.22-1`；保留 `createUpdaterArtifacts: false`、`productName: "CC Switch"`、`macOSPrivateApi: true` 与 fork 移除的 `trafficLightPosition`。
- **`README.md`**（15/10 / 96/539）：fork README 是整文件自有的「与上游的差别」文档；冲突按整文件保留 fork 版；上游本轮新增/删除行与赞助商物料不落地，属刻意取舍。

#### 后端（16 个）

- **`src-tauri/src/commands/misc.rs`**（747/32 / 6/5）：上游新增终端参数解析/跳过权限、Kimi 安装器重跑、CLI 版本探测、WSL 检测、DSH 生命周期与测试等；fork 只把握手/更新器相关 URL 指向 tunecc。冲突时逐 hunk 取上游并保留 fork 的 URL，禁止整文件取一侧；解完 grep `farion1231/cc-switch/releases` 应为 0（README/文档除外）、`tunecc/cc-switch/releases` 在位。
- **`src-tauri/src/commands/mod.rs`**（2/0 / 2/2）：上游注册 `dsh` 模块；fork 的 `connectivity_test` 模块声明保留、`stream_check` 维持移除。
- **`src-tauri/src/database/dao/mcp.rs`**（6/3 / 1/1）：上游在 SELECT/INSERT/行映射与 `AppType` 映射加入 `enabled_dsh`；fork 既有列与映射保留，`enabled_dsh` 置于 `enabled_omp` 之后（索引 18、19 个参数）。
- **`src-tauri/src/database/mod.rs`**（1/1 / 1/4）：上游把 `SCHEMA_VERSION` 改为 24；fork 改为 25，保留 fork 其它改动。
- **`src-tauri/src/database/schema.rs`**（107/1 / 449/5）：把上游 `enabled_dsh`（两表）、`parser_state`（DDL 与开发版补丁）与测试并入 fork 的 23→24 臂；新增 24→25 幂等臂；`create_tables` 保留 fork 既有列并补三列；上游 24 的独立臂形态改为 fork 的两臂结构。
- **`src-tauri/src/database/tests.rs`**（43/0 / 76/0）：上游 DSH/parser_state 迁移测试与 fork 既有迁移测试并存；所有期望 `SCHEMA_VERSION` 的断言改为 25，新增 fork 24→25 用例。
- **`src-tauri/src/deeplink/provider.rs`**（5/0 / 1/0）：上游新增 `AppType::Dsh` 拒绝分支；fork 既有改动保留。
- **`src-tauri/src/lib.rs`**（19/41 / 32/42）：上游把内联托盘处理替换为 `tray::handle_tray_icon_event`、注册 `dsh`/`tray_compat`/`initialize_dsh_profiles`/skills/webdav 命令；fork 的无 Updater、connectivity 命令注册、`stream_check` 移除、托盘 builder 与 fork 窗口语义原样保留。解完 grep 确认 `tauri_plugin_updater`/`updater_builder` 命中 0、`.show_menu_on_left_click(false)` 在位、connectivity 注册在位、`dsh`/`tray_compat` 注册在位、`handle_tray_icon_event` 被 builder 引用。
- **`src-tauri/src/provider.rs`**（4/0 / 45/1）：上游新增 `AppType::Dsh` 的凭证提取分支；fork 的 `website_url_2` 等 45 行改动保留。
- **`src-tauri/src/proxy/forwarder.rs`**（99/26 / 2/1）：上游新增 Copilot 原生 Messages、回环守卫、整流器覆盖与测试；fork 的注释与测试字面量保留。
- **`src-tauri/src/proxy/providers/mod.rs`**（12/4 / 1/0）：上游 Gemini 三处修复随上游落地；fork 既有改动保留。
- **`src-tauri/src/services/mod.rs`**（3/0 / 2/1）：上游新增 `dsh_account`、`session_usage_omp`、`session_usage_dsh` 模块；fork 的 `connectivity_test` 模块声明保留。
- **`src-tauri/src/services/provider/live.rs`**（42/1 / 43/0）：上游新增 DSH 分支与 `initialize_dsh_profiles`；fork 的 `sanitize_claude_settings_for_live` 助手与测试整段保留。
- **`src-tauri/src/services/provider/mod.rs`**（109/16 / 4/0）：上游新增 `codex_terminal` 模块、`initialize_dsh_profiles` 导出、DSH 的 list/save/add/update/delete 分支与 `keep_row_if_written` 回滚；fork 的 4 行测试字面量 `website_url_2: None` 保留。
- **`src-tauri/src/settings.rs`**（6/2 / 47/0）：上游新增 `VisibleApps.dsh`、`Default` 与 `visible()`/`get_current_provider`/`set_current_provider` 的 DSH 分支；fork 的 `VisibleSidebarPanels`、`website_url_2` 等设置整段保留，两段并存。
- **`src-tauri/src/tray.rs`**（157/1 / 75/6）：上游新增 `handle_tray_icon_event`、`TrayUsageSource::ClaudeAccount`、`tray_compat` 钩子、DSH 显示名与测试；fork 的四条左键/右键分支落在 handler 内（不采纳上游 Windows 单分支），`hide_main_window`/`toggle_main_window`、`apply_tray_style` 的 `set_show_menu_on_left_click(false)`、guard test 保留；上游重新加入的 `native_menu_on_left_click` 不复活。

#### 前端（12 个）

- **`src/App.tsx`**（11/4 / 83/1）：上游新增 `dsh` 分支（query 失效、复制、ProfileSwitcher、移除确认、用量筛选、Codex 终端入口）；fork 的窗口标题、`visibleSidebarPanels`、`useConnectivityProbe`/批量测试、`websiteUrl2` 保留。
- **`src/components/providers/AddProviderDialog.tsx`**（2/0 / 1/0）：上游账号登录回调与 fork 既有改动并存。
- **`src/components/providers/EditProviderDialog.tsx`**（1/0 / 2/0）：上游改动与 fork 既有改动并存。
- **`src/components/providers/ProviderCard.tsx`**（8/16 / 108/18）：采纳上游 `terminalAvailable`、移除 `isInConfig`、额度 footer 不再接收 `isCurrent`/`isInConfig`；fork 的模型徽章、双官网链接、右键菜单、`max-w-[208px]` 与 `onTest` 外层守卫保留；绑号 Claude 官方卡仍走上游账号行与额度 footer。
- **`src/components/providers/ProviderList.tsx`**（91/20 / 229/10）：采纳上游 DSH 账号卡、live 配置读取失败提示、搜索/`extraAdded` 统计与 `isInConfig` 移除；fork 的列表与卡片渲染改造保留；空白状态、搜索空态与账号卡同时存在时按上游语义展示。
- **`src/components/providers/forms/McodeProviderForm.tsx`**（80/24 / 49/1）：采纳上游 `appId`、DSH 预设目录与账号组、`usePresetStep`、`modelDialect`，删除 fork 旧 `PRESET_ENTRIES` 常量；fork 的跨应用导入入口（预设 `extraActions` 与编辑态卡片）保留；对 `appId === "dsh"` 套用 `filterForkPresets`，账号预设 `DeepSeek` 不过滤。
- **`src/components/providers/forms/ProviderForm.tsx`**（2/1 / 183/43）：上游把 `dsh` 路由到 `McodeProviderForm` 并传入 `appId`；fork 的 183/43 改动（Kimi 早退、跨应用导入、布局）保留。
- **`src/components/shell/Sidebar.tsx`**（3/2 / 12/2）：上游用量文字行内距随上游落地；fork 的侧栏面板可见性接线保留。
- **`src/config/appConfig.tsx`**（13/1 / 9/1）：上游新增 `dsh` 到应用列表、可见应用、MCP/Skills、累加式应用与图标映射；fork 的 `DEFAULT_VISIBLE_SIDEBAR_PANELS` 等改动保留。
- **`src/types.ts`**（2/0 / 14/0）：上游新增 `VisibleApps.dsh?`、`McpApps.dsh?`；fork 类型改动保留。
- **`src/lib/api/settings.ts`**（4/0 / 0/4）：上游新增 `webdavSyncClearSettings`；fork 既有移除项保持。
- **`src/lib/query/mutations.ts`**（1/0 / 63/0）：上游新增 DSH 的累加式失效分支；fork 的导入与快捷切换改动保留。

#### 预设（6 个）

- **`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts`**（5/4、7/3、41/5、55/5、51/5、27/5 / 各 2/0）：目录内容整份取上游（OspreyAI、Astron、TokenFlux、StreamLake、AIGoCode 等）；fork 只保留各接口的 `hidden?: boolean` 两行。白名单条目（`Ollama`/`LM Studio`/`vLLM`/官方名）在上游目录中仍逐字存在；新增第三方预设不在 fork 白名单内，继续隐藏。Pi 目录变化同时影响 DSH 派生目录。

#### 本地化（4 个）

- **`src/i18n/locales/{en,ja,zh-TW,zh}.json`**（72/14 / 328/25、315/24、315/24、327/24）：保留 fork 键段（含 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 的 fork 文案、供应商导入、模型快捷切换等），叠加上游本轮 72 行新增、14 行删除/改写（DSH、终端、Skills、WebDAV、live 配置、用量、Copilot 等）；不得出现同名重复键。`tr.json` 不在重叠面，整文件取上游。

#### 测试（2 个）

- **`tests/components/ProviderList.test.tsx`**（96/3 / 277/5）：上游 DSH/lib 配置/余额刷新用例与 fork 既有 277 行断言并存；按合并后的组件接口调整。
- **`tests/components/ProviderPresetSelector.test.tsx`**（2/2 / 33/0）：上游基线改写 + fork 的 `extraActions`/白名单断言并存。

#### fork 自有文件（不在重叠面，仅需核对不被上游形态带偏）

- **`src/config/forkOfficialAllowlist.ts`**：新增 `dsh: ["Ollama", "LM Studio", "vLLM"]`；其余条目不变（mcode 仍为空数组）。
- **`src/config/forkPresetFilter.ts`**：判定实现不改；6 个预设目录继续在「编号后过滤」，DSH 目录在表单内过滤。
- **`src/components/providers/connectivityEntry.ts`**：`shouldShowTestEntry` 判定不变。
- **`src-tauri/src/commands/connectivity_test.rs`**、**`src-tauri/src/services/connectivity_test/`**：不在上游本轮改动面，保持不动。
- **`src/utils/providerImport.ts`**、**`ProviderImportEntry.tsx`**、**`hooks/useProviderImportApply.ts`**：不在上游本轮改动面，保持不动。

#### 冲突停车清单（本轮实测 12 处，按重放顺序）

「差异面」= 该提交重放前后 `git show --numstat` 不一致的文件（冲突解决实际落点）；未列出的提交与重放前逐字相同（另有 1 处未停车但 patch-id 不同，见「重放映射」实测）。

| # | 提交（旧 → 新） | 差异面 | 解法 |
| --- | --- | --- | --- |
| 31 | `b47ac25bf→92f057fb8`（模型徽章对齐上游 `extractModelBadge`） | `ProviderCard.tsx`（14/10 → 30/18） | 按 v4.0.22 卡片骨架重排模型徽章与快捷切换入口；`providerModelUtils.ts` 76 行按原内容落地，差异仅为上下文行数扩增 |
| 46 | `e05453b77→b0bd0409f`（右键置顶/置底 + 新建插第二位） | `ProviderList.tsx`（numstat 相同，内容随基线重排） | 保留 fork 右键菜单与插入位置逻辑；locale 4 键与两处测试断言取合并后语义 |
| 48 | `44aef003f→8491875a0`（归档 claude-model-quick-access） | `ProviderCard.tsx`、`ClaudeFormFields.tsx` 等（numstat 相同） | 归档提交的代码改动按 v4.0.22 基线重放：徽章/快捷切换与上游终端/用量行共存，表单与侧栏改动原样保留 |
| 49 | `efbdbb698→55d86586a`（README fork 构建说明） | `README.md`（96/539 → 96/544） | 整文件取 fork；本提交新增的 5 行按 fork README 文案落位 |
| 67 | `c72eba099→bda48753a`（连通性测试弹窗/详情/徽标 + 四语言文案） | 4 个 locale（numstat 相同） | fork 连通性文案与上游本轮 locale 新增键并存，按对象作用域查重 dup=0 |
| 70 | `4ce83b404→86fce76a8`（供应商列表集成） | `ProviderActions.tsx`、`ProviderCard.tsx`、`ProviderList.tsx` 等（numstat 相同） | fork 列表/卡片改造叠加到 v4.0.22 基线；DSH 账号卡、live 错误提示与 fork 徽标/右键接线并存 |
| 87 | `aebe3aa81→a5d637e9a`（托盘左键切换主窗口） | `lib.rs`（31/28 → 6/16）、`tray.rs`（32/0 → 45/5） | 上游把内联托盘处理抽为 `handle_tray_icon_event`；fork 事件处理随之迁入 `tray.rs`，`lib.rs` 只保留 builder 挂载与 `TrayIconBuilder` 导入 |
| 97 | `190d6e00c→14c20ab2d`（跨应用导入） | `McodeProviderForm.tsx`（49/1 → 51/1） | 上游 DSH 表单结构与 fork 导入入口并存；`importEntry` 只在 `appId === "mcode"` 渲染 |
| 106 | `00768d6bb→e76db69b0`（v4.0.1 CI 修复） | `lib.rs`（1/3 → 无） | 该提交原本修改的 `lib.rs` 片段已被上游托盘抽取移走，重放后不再需要；其余文件按原内容落地 |
| 113 | `f5fa9bb07→58f308e55`（v20→v21 修复迁移） | `schema.rs`（171/9，numstat 相同）、`dao/mcp.rs`、`docs` | v21 修复臂并入 v4.0.22 迁移链；`docs/HOW_TO_REBASE_UPSTREAM.md` 两行按本轮文档终态落位 |
| 157 | `f7f2f0eff→f25551a59`（托盘原生菜单左键契约） | `tray.rs`（6/6，numstat 相同） | 「原生菜单样式左键切换主窗口」分支落在 `handle_tray_icon_event` 内，右键 `mark_feedback_seen` 语义不变 |
| 178 | `82d44d39d→3b68c215d`（v4.0.20-1 同步） | 版本四文件、`database/mod.rs`、`schema.rs`、4 个 locale | 版本行重放期取上游 `4.0.22`、收尾统一为 `4.0.22-1`；v23→v24 臂合并上游 `enabled_dsh`/`parser_state` 并新增 v24→v25 幂等臂；locale 保留 fork 键段 |

### fork 取舍清单

| 功能 | 上游本轮 | fork 处理 | 理由 |
| --- | --- | --- | --- |
| DeepSeek Harness（第 14 应用） | 新增 | 全量保留，补 `dsh` 白名单键与 DSH 目录过滤 | 全新能力，无 fork 对应实现 |
| 终端额外参数/跳过权限/Codex 卡终端 | 新增 | 全量保留，与 fork 卡片入口叠加 | 无 fork 对应实现，入口不冲突 |
| 用量自动刷新（移除 `isInConfig`） | 行为变更 | 取上游 | fork 未实现该逻辑，上游为预期修复 |
| 绑号 Claude 账号额度（托盘/用量设置） | 新增 | 全量保留 | 无 fork 对应实现 |
| 代理/Skills/WebDAV/应用配置修复 | 新增 | 全量保留 | 无冲突 |
| 托盘 handler 抽取 + Windows 兼容 | 新增 | 采纳抽取与 `tray_compat`；左键语义保留 fork 四条分支 | fork 契约优先，兼容层只做事件传输 |
| schema 24 | 新增 | fork 升 25，合并 dsh/parser_state 并新增幂等臂 | 版本号碰撞，保留双方迁移历史 |
| 预设 OspreyAI/Astron/TokenFlux/StreamLake | 新增 | 全量取上游目录，fork 构建继续隐藏第三方 | 延续 fork 收敛口径 |
| DSH 预设目录 | 新增 | 取上游派生目录，白名单仅留 Ollama/LM Studio/vLLM | 延续 fork 收敛口径 |
| 模型徽章/快捷切换 | 无 | 保留 | fork 魔改契约 |
| 双官网链接 | 无 | 保留（未绑号卡） | fork 魔改契约 |
| 跨应用导入 | 无 | 保留 | fork 魔改契约 |
| 逐模型连通性测试 | 无 | 保留 | fork 魔改契约 |
| 应用内更新器 | 无 | 继续禁用 | fork 契约 |
| 托盘左键 | 语义变化 | 保留 fork 契约 | fork 契约与源码护栏 |
| README | 15/10 | 保留 fork 整文件 | fork 文档口径 |
| mcode 表单预设过滤缺口 | 无 | 不修，登记 | 不属于本轮同步范围 |

### 预设 id 编号契约（延续）

- 预设目录条目 `id` 一律为**原始数组下标**的字符串；白名单过滤必须发生在 `map((preset, index) => ({ id: String(index), preset }))` 之后，不得先过滤再编号。
- 本轮上游新增 OspreyAI/Astron/TokenFlux/StreamLake 等条目会改变数组下标，但 fork 只在渲染层过滤，`id` 仍按上游数组原位编号；fork 不新增、不删除目录条目。
- DSH 目录由 Pi 目录派生，编号按派生后的数组下标；DSH 账号预设 `dsh-official-account` 是独立的「账号登录」条目，不占用目录编号，`choosePreset` 对其直接返回、不执行 `Number(id)` 查表。
- Kimi 的官方账号卡是独立条目，不属于目录数组。

### 本地化状态

- 4 个既有 locale 只增删上游本轮键，fork 专属键与文案原样保留；同一对象作用域不得出现同名重复键（JSON 会静默取后者，TS interface 会报 TS2300）。
- `tr.json` 整文件取上游（上游本轮同样更新），逐字节与 `git show v4.0.22:src/i18n/locales/tr.json` 一致，不补 fork 键。
- 新增的 DSH / 终端 / Skills / WebDAV / live 配置相关 UI 文案全部来自上游 locale 键；fork 不新造文案。

### `.comet/config.yaml` 保护

- 不修改 `.comet/config.yaml`；不改 `default_workflow: native` 与 `workflows` 列表；不改 `artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5`。

### 已知流程坑位（沿用 + 本轮新增）

- 重放前必须固定 `pre-sync-v422`；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理。
- `rerere` 可能把往轮的解法复用到新基线：复用后逐个复核，尤其是版本四文件、`lib.rs`、`tray.rs`、schema 文件与 4 个 locale。
- locale JSON 合并后可能出现同名重复键：合并后必须做对象作用域查重。
- **schema 碰撞是本轮最高危面**：不要接受上游 `SCHEMA_VERSION = 24`；23→24 臂必须同时含 fork 的 kimi/omp 与上游的 dsh/parser_state；24→25 臂必须幂等；`create_tables` 与 DAO 的列集/索引要同步；上游迁移测试断言需改为 25。
- **托盘合并**：上游把 handler 移入 `tray.rs` 并重新加入 `native_menu_on_left_click`、Windows 左键单分支；fork 必须保留 handler 入口与四条分支、删除 `native_menu_on_left_click`、保留 `set_show_menu_on_left_click(false)` 与护栏；`tray_compat` 只能作为事件传输；`lib.rs` 中不再使用的 `TrayIconEvent` 导入要清理。
- **`McodeProviderForm`**：上游删除了顶层 `PRESET_ENTRIES` 常量并改为按 `appId` 选择；fork 的导入入口必须保留；DSH 过滤在编号后执行；`DSH_ACCOUNT_PRESET_ID` 不得参与 `Number(id)` 查表，否则得到 `NaN`。
- **`ProviderCard` / `ProviderList`**：上游移除 `isInConfig`、改变自动查询语义、加入 DSH 账号卡与 live 错误提示；fork 的徽章/双链接/右键/列表改造必须保留，测试按合并后接口调整。
- **`UsageFooter` / `ProviderCard` 用量 props**：v4.0.22 起 `UsageFooter` 不再接收 `isCurrent`/`isInConfig`，卡片 `autoQueryInterval` 无条件取 `usage_script` 配置；重放时若把 fork 旧接口整段保留，会出现 `TS2322` 与 `tests/components/UsagePolling.test.tsx` 失败。最终树必须与上游一致（本轮已在收尾修正）。
- **`commands/misc.rs`** 上游改动面 747 行；fork 只有 tunecc URL，逐 hunk 取上游 + 保留 URL，禁止整文件取一侧。
- **`database/dao/mcp.rs`** 的列顺序与行索引必须与 `schema.rs` 的 DDL 一致（`enabled_dsh` 在 `enabled_omp` 之后）。
- **`AppType` 穷尽匹配**：`app_config.rs` 为非重叠文件整体取上游；重叠的 `settings.rs`、`tray.rs`、`provider.rs`、`deeplink/provider.rs`、`services/provider/{live,mod}.rs` 必须补齐 `Dsh` 分支，否则编译失败。
- `Cargo.toml` / `Cargo.lock` 采纳 `subtle`；不得出现 updater 包。
- `tr.json` 不要因为 fork 缺键而回写；逐字节一致是验收项。
- 上游 `.github/workflows/wsl2-nightly.yml` 改动按上游落地；`release.yml` 不在上游本轮改动面，fork 的 Windows 物料断言保持。

### 版本号

- `4.0.22-1`：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目。
- 不修改历史 tag；本轮交付 tag 为 `v4.0.22-1`。

### 交付（归档后单独授权）

- 验收通过、用户接受结果并归档后，向用户单独请求授权；获准后执行：`git push --force-with-lease origin main`；在归档提交上创建 annotated tag `v4.0.22-1` 并 `git push origin v4.0.22-1`。
- 只授权这两项远端动作；不创建 PR、不推送其他引用。
- 推送后用 `git ls-remote origin main refs/tags/v4.0.22-1` 核对远端指向；Release CI 仅 Windows x64 与 macOS arm64 unsigned。

### fork 魔改保留清单（同步后必须仍然存在且可用）

1. 产品名 CC Switch、DevPanel（`dev:fork`）与 fork 构建标记 `IS_FORK_BUILD`。
2. 侧栏面板可见性（`VisibleSidebarPanels`、`DEFAULT_VISIBLE_SIDEBAR_PANELS`、`GeneralSection` 开关）。
3. 模型徽章与快捷切换（claude/codex/gemini/grokbuild）。
4. Claude 兜底模型直达区、1M 全选与角色模型映射的「非高级」判定。
5. 供应商右键置顶/置底、新建插入第二位。
6. 官方预设白名单（`forkOfficialAllowlist` + `filterForkPresets`；新增 `dsh` 键；OspreyAI/Astron/TokenFlux/StreamLake 继续隐藏）。
7. 逐模型连通性测试（`connectivity_test_provider_models`/`connectivity_probe_provider`、`shouldShowTestEntry`）。
8. 双官网链接（`websiteUrl`/`websiteUrl2` 后端字段与前端展示；未绑号卡仍显示）。
9. 跨应用导入（`providerImport.ts`、`ProviderImportEntry`、各表单入口）。
10. 禁用应用内更新器（无插件/依赖/权限，`install_update_and_restart` 空壳）。
11. README 的 fork 说明与 fork CI。
12. 托盘左键切换主窗口与源码护栏（全平台一致）。
13. 测试稳定性修正（AppsPage 的 `waitFor` 等）。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests`）

- `forkOfficialAllowlist`：过滤函数、白名单表与 5 处表单/测试接线均在。
- `filterForkPresets`：过滤函数 + 6 个预设入口/测试接线均在。
- `MODEL_CAPABLE_APPS`/`isModelCapableApp`：列表仍为 claude/codex/gemini/grokbuild。
- `visibleSidebarPanels`/`VisibleSidebarPanels`：前端设置、侧栏、类型、后端 `settings.rs`、测试均在。
- `websiteUrl2`/`website_url_2`：后端迁移/DAO/构造器、deeplink、前端双链接、测试均在。
- `connectivity_test_provider_models`/`connectivity_probe_provider`：`lib.rs` 注册、命令与服务、前端 API、hooks 均在。
- `ProviderImportEntry`/`readImportableProviderFields`：组件、hooks、`providerImport.ts` 与各表单/测试均在。
- `terminalIsIsolated`/`openTerminalIsolated`：上游终端隔离链路与 fork 卡片入口均在。
- `tray_left_click_never_opens_the_menu`：guard test 在且通过；`native_menu_on_left_click` 仅可能出现在注释/护栏字符串中，函数定义与调用点为 0。
- `tauri_plugin_updater`/`updater_builder`：0 命中；`tauri-plugin-updater` 不在 `Cargo.toml`、`plugin-updater` 不在 `package.json`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。
