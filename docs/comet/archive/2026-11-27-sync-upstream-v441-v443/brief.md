# 目标

将 fork `tunecc/cc-switch` 的 `main` 从上游已发布 tag `v4.0.40` 同步到 `v4.0.43`，最终基线为 peeled commit `754fed72d428c66c1e6ed45f38601ac25ded90c6`（annotated tag 对象 `2119227f82a296e5664d063d9ae598a9fe92b73f`，日期 2026-11-26）。按原顺序重放 `v4.0.40..main` 的 233 个 fork 提交，fork 版本号从 `4.0.40-1` 更新为 `4.0.43-1`。上游本轮功能与修复全部落地（fork 已裁剪或已移除的功能域除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户要求：继续同步上游更新并保留自己的修改；如果上游实现了 fork 已有功能，必须先询问用户，分析保留上游实现、fork 实现或混合实现哪一种更好，再按用户决定执行。

# 范围

## 同步区间与取证

- 目标基线：已发布 annotated tag `v4.0.43`，tag 对象 `2119227f82a296e5664d063d9ae598a9fe92b73f`，peeled commit `754fed72d4`。
- 本轮区间：`v4.0.40..v4.0.43`，现取 62 个提交（v4.0.41 31 个、v4.0.42 7 个、v4.0.43 24 个）、372 个文件、+34,618/−6,857；上游新增文件 61 个，删除 0 个。
- 同步前 fork main：`e4d607a1827ca639869fe781a32da74af19c120b`；`v4.0.40..main` 现取 233 个提交。
- `v4.0.43` 之后的 `upstream/main` 有 2 个未发布提交，本轮不纳入（沿用历轮「只锁已发布 tag」）：`d26be6ecb feat(zcode): add ZCode agent support (#9824)` 与 `1963028ee fix(proxy): keep Codex tool schemas acceptable to Gemini behind Chat gateways`。
- 两侧共同改动 59 个文件；共享文件按 `docs/HOW_TO_REBASE_UPSTREAM.md` §3/§4 合并，保留 fork 语义并接纳上游新增。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 prune）或 `git fetch upstream tag <name>`。
- 工作区：用户已选择独立 worktree（`comet/sync-upstream-v441-v443`），归档后是否清理见 Q4；主目录未跟踪的 `scripts/clean-target.sh` 保持原样，不纳入本轮提交。
- 上一轮 `sync-upstream-v443` 因创建时遗漏 `--capability` 已取消（代码/工作区保留），本轮改用 `sync-upstream-v441-v443` 并显式关联 `upstream-sync` 能力；该取消记录不影响本轮交付。

## 上游主题（v4.0.41–v4.0.43）

1. **CodeBuddy 新应用**（#8758）：官方账号登录/切换/额度（Auth Center 分组、账户行整理、Credits 到期显示）、`~/.codebuddy/models.json` 表单与预设、MCP/Skills/Prompts/会话/用量导入、代理协议与托盘显示名。
2. **Copilot CLI → VS Code Copilot 插件同步**（#9435）：新增 `copilot_vscode` 设备级设置、目标探测、同步状态与设置 UI。
3. **GitHub Copilot Auto 路由**（#9564、#9435 后续）：虚拟模型 `copilot-fusion-auto`（Claude/Codex/Claude Desktop 模型列表与 Codex 目录）、Per-account Auto 探测与 `/auto` 解析缓存、Free 账号 Auto 支持。
4. **Grok 官方卡订阅等级**（#9923）：Grok CLI 凭据路径与绑定账号路径都查询套餐名，卡片副标题显示套餐；绑定卡额度查询门控与自动刷新间隔。
5. **授权中心「自动查询额度」开关**（#9325）：`officialQuotaManualOnly`、手动查询空闲态文案、全部刷新跳过缓存、启动时不查额度。
6. **托盘切换 Antigravity 官方账号**（v4.0.43）：托盘 agy 账号分区、按账号额度、切号反馈、macOS 菜单栏图标位置保持、Dock 图标固定。
7. **ProviderCard 账号行重构与隔离修复**（#9977、#9975、#9945、#9978、#9979、#9980）：账号副标题抽到 `ProviderCardAccountLines.tsx`，按应用隔离 managed-auth 查询，修复 agy 徽标/邮箱泄漏到其他卡片。
8. **后台任务失败提示与网络错误分类**（#9911）：`backgroundTaskNotice`、`NetworkErrorKind`/`classify_error_chain`、更新检查与 models.dev 同步失败提示。
9. **前端性能与密度**：i18n 语言包按需加载、托盘用量页懒加载、隐藏托盘唤醒暂停、侧栏收起宽度按紧凑/舒适密度（#9941、#9918）。
10. **安全与代理**：DB/SQL 权限、备份文件名、CONNECT 代理、deeplink 风险规则加固（#9835）；全局代理配置原子发布（#9930）；上游连接复用（#9914）；故障转移不覆盖手选路由（#9946）；Chat reasoning item id（#10005 邻近）、Gemini 长期工具签名（#9009）。
11. **Apps 页与工具链**：OpenCode 2 版本线识别（#8727）、Pi 自更新锚定、Linux 系统终端、登录 shell 工具链环境转发、插件所属项目与 React key 修复、Skills Pi 列说明。
12. **用量/会话/其他修复**：TPS 语义 TTFT 与状态守卫（#9952）、Claude 会话耗时按实际请求时间、用量应用筛选顺序、legacy Codex fork usage 恢复（#9638）、OpenCode 2.4 会话、Gemini `.env` 引号、OpenClaw 块注释、env 删除保留换行、Codex Fast 档说明与锁定、设置页防闪。

## 功能交集调查结论

按目标对象、执行链路、UI 位置三维度核对；不以功能名/关键词命中直接判重。

- **明确同域，需用户选边（Q1）**：上游 v4.0.41 的 Grok 官方卡订阅套餐显示，与 fork 在 v4.0.40 overlay 中已加入的 `planLabel` 实现（`GrokBoundAccountLine` 接收套餐并交给 `ManagedBoundAccountLine` 渲染，数据来自 xAI 额度缓存）落在同一卡片副标题位、同一用户可见结果。上游版本额外提供 Grok CLI 凭据路径的套餐查询（`with_plan`）、绑定卡额度查询的 `usageEnabled` 门控、以及 `autoQueryInterval` 自动刷新；fork 版本没有这些，且卡片副标题布局与双官网分行契约不同。
- **候选相邻，不属同域**：
  - 上游把账号副标题抽到 `ProviderCardAccountLines.tsx`（含 agy/xAI/Copilot/Codex/CodeBuddy），fork 在 `ProviderCard` 内联维护同一批账号行 + 双官网链接兄弟行；这是结构重构与 fork 布局契约的合并，不是重复功能。
  - 上游 `native_menu_on_left_click(native)` 与 fork `show_menu_on_left_click(false)` 在 v4.0.40 即已分叉，本轮未再改变；按既有托盘左键契约保留 fork。
  - 上游 stream_check 的网络错误分类落在 fork 已删除的可达链与孤儿文件上；fork 的逐模型连通性测试是独立链路，不把上游分类硬接到 fork UI（可选增强，非本轮范围）。
  - 上游 Copilot Auto 虚拟模型与 fork 的可搜索模型选择器是同一输入框的数据/组件两层，需在 Build 中适配，不属于「重复实现」。
  - 上游后台更新检查失败提示与 fork 关闭应用内更新器：按 Q1=A 不恢复自动检查，`updateCheck` 通知路径在 fork 不触发；models.dev 同步失败提示可落地。
- **仅上游**：CodeBuddy 应用、Copilot VS Code 同步、Copilot Fusion Auto、授权中心自动额度开关、托盘 Antigravity 切号、后台任务提示/网络错误分类、i18n 懒加载、侧栏密度、安全加固、代理连接复用与原子配置、OpenCode 2、Linux 终端等。
- **仅 fork**：按「fork 魔改保留终态」清单执行。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v441-v443/{brief.md,specs/upstream-sync/spec.md}`；不建立能力关联 Delta（沿用旧格式完整目标规格，归档整体重写基线）。
- rebase 前新增本地安全参照分支 `pre-sync-v441-v443`（指向同步前 main `e4d607a18`），不推送。
- 本轮落地保真脚本 `scripts/fidelity-v441-v443.py`，沿用四 ref 原始文本行多重集差集口径。
- 重放映射与归因证据 `docs/comet/changes/sync-upstream-v441-v443/replay-map.tsv`，逐行记录 233 个原提交、重放提交、patch-id 状态与差异原因。
- 随上游落地的新增源码、测试、文档、物料与 release notes（`docs/release-notes/v4.0.41-*.md`、v4.0.42、v4.0.43、`src/whats-new/4.0.4{1,2,3}.json`、`docs/copilot-vscode-sync-zh.md`、`codebuddy*`/`copilot_vscode*`/`upstream_pool*` 等），最终清单以实际 rebase 为准。

### 修改

- 重放全部 233 个 fork 提交；共享文件按 §3/§4 合并。
- 版本与物料：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json` 终态统一 `4.0.43-1`。
- 后端共享文件：`lib.rs`（新命令注册与 CodeBuddy manager）、`tray.rs`/`tray_panel.rs`（agy 账号分区与图标位置）、`commands/{misc,settings,provider,subscription,terminal_launch,stream_check}.rs`、`proxy/{error,http_client,forwarder}.rs`、`settings.rs`、`database/{schema,backup,dao/*}.rs`、`services/{provider,subscription_grok,stream_check,codebuddy_account}/*`、`mcp/codebuddy.rs`、`session_manager/*`、`deeplink/provider.rs` 等。
- 前端共享文件：`ProviderCard.tsx`/`ProviderCardAccountLines.tsx`、`ProviderList.tsx`、`ProviderForm` 入口、`ClaudeFormFields.tsx`、`ClaudeDesktopProviderForm.tsx`、`ProviderPresetSelector.tsx`、`Sidebar.tsx`/`useSidebarCollapsed.ts`、`App.tsx`、`main.tsx`、`i18n/index.ts`、`tray-panel/*`、`SettingsPage`/Auth Center 设置、`types.ts`/`appConfig.tsx`/`appSpecs.ts`、`hermesProviderPresets.ts`/`hermesProviderMeta.ts`、`workbuddyProviderPresets.ts`/`workbuddyOfficialMeta.ts`、`lib/query/{managedAuth,subscription,mutations,queries}.ts` 等。
- 新 AppId/AppType `codebuddy` 在 fork 侧的全部穷尽匹配：`forkOfficialAllowlist`、`tray::app_display_name`、`services/provider/live.rs`、`appConfig.tsx`、`ProviderList` 的 liveConfigManaged、`App`/`VisibleApps`/`McpApps`/Skills 列表、测试字面量。
- 8 个 locale：上游新增（含 CodeBuddy、Copilot VS Code、自动额度、后台任务、`streamCheck.hint.*`、`quota.manualIdle`）、改写、删除按上游；fork 专属键按 pre-sync 原键序保留，空对象保持；`de/ko/ru/tr` 与 `v4.0.43` 逐字节一致。
- 预设目录：上游内容逐项落地；fork `hidden?` 字段、编号顺序、白名单和过滤判定保持；CodeBuddy 预设可见性按用户决定（Q2）。
- CI：`.github` 本轮无上游改动，保持 fork 现状（`ci.yml` 裁剪语义、`release.yml` `macos-15`）。
- fork 文档：更新 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 并新增 v4.0.41–v4.0.43 叠加要点；README fork 差别清单按终态更新（CodeBuddy 行、Grok 套餐等按决定）。

### 删除

- 上游删除且 fork 同样零引用的文件、API、locale 死键随上游删除并逐项取证（本轮上游删除文件 0 个；`authCenter.quota.updating` 等键按上游删除）。
- fork 已删除的 updater 与 `stream_check` 可达链路不得被重放带回。
- 不删除 fork 仍在使用但上游误判为死代码的 API。

### 明确不建

- 不纳入 `v4.0.43` 后未发布的 2 个提交（ZCode 新应用、Codex→Gemini 工具 schema 修复）。
- 不创建 PR；Build/Verify 不执行 push 或打 tag。
- 不改变 fork 功能形态，不做同步之外的功能开发（连通性错误分类移植等可选增强本轮不做）。
- 不擅自更改 `forkOfficialAllowlist`/`forkPresetFilter` 的可见性口径（CodeBuddy 按 Q2）。
- 不恢复应用内 updater、`stream_check` 接线或 release workflow 已裁剪段。

# 非目标

- 不丢失或削弱逐模型连通性测试、托盘左键切换、模型徽章/快捷切换、`websiteUrl2`、`VisibleSidebarPanels`、跨应用导入、右键完整菜单（含置顶置底/删除）、默认顶部插入、批量检测开关、DevPanel/fork 构建标识和 1M 快捷勾选。
- 不把上游 `appSpecs` 反向用于改写 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry`。
- 不为了让上游新功能可见而绕过 fork 官方预设白名单。
- 不清理主目录中与本轮无关的未跟踪文件。
- 不把上游 stream_check 错误分类接到 fork 逐模型测试链；不恢复更新器域任何链路。

# 验收示例

- A1: 同步基线与重放完整：`git merge-base main v4.0.43^{}` 为 `754fed72d`；233 个同步前 fork 提交按原顺序重放，判空丢弃逐个登记，主题序列一致，patch-id 差异逐条归因为冲突停车、仅上下文位移或被上游同名实现消化。
- A2: fork 魔改保留：`IS_FORK_BUILD`/`forkBuild`、白名单/过滤器、DevPanel、connectivity 前后端与两个命令注册、模型徽章/快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels`、托盘左键四分支与源码护栏、跨应用导入、右键完整菜单（含置顶置底/删除）、默认顶部插入均存在且对应回归检查通过。
- A3: 上游 v4.0.41–v4.0.43 能力落地：CodeBuddy 应用与官方账号切换/额度、Copilot VS Code 同步、Copilot Fusion Auto、Grok 订阅等级（按 Q1 决定的实现）、授权中心自动额度开关、托盘 Antigravity 切号与图标位置、ProviderCard 账号行隔离与 agy 泄漏修复、后台任务提示与网络错误分类、i18n 按需加载、侧栏密度、安全加固、代理连接复用/原子配置、OpenCode 2、Linux 终端、用量/会话修复均在上游实现位置落地，并由上游或新增测试覆盖。
- A4: 功能交集逐项有结论：所有需要用户选边的项目在 Build 前得到明确决定；未决定项不得由 Agent 擅自替换；相邻项按「保留 fork 语义 + 接纳上游结构」合并。
- A5: 更新器域保持 fork 现状：不复活 updater 插件/依赖/能力/自动下载 UI；保留简化 `UpdateContext`（legacy 键兼容、启动不自动检查）、`lib/updater.ts` 恒 up-to-date、`check_app_update_available` 白名单桩与关于页 tunecc Releases 跳转；`backgroundTask.updateCheckFailed` 提示路径在 fork 不触发。
- A6: `stream_check` 保持不可达：命令/模块声明/DAO 读取/调用链零命中；仅保留既有 schema 表与孤儿 `services/stream_check.rs`；不把上游 MCP connectivity 或网络错误分类接入 fork 逐模型测试链。
- A7: 本地化正确：8 个 locale 的上游增删改落地，fork 专属叶键不丢且保持原键序与空对象；`forkOnlyLocaleKeys.ts` 按 v4.0.43 重新生成；所有 locale 按对象作用域查重 dup=0；`de/ko/ru/tr` 与上游 tag 逐字节一致；localeParity/localeCoverage/readmeParity/CJK 检查通过。
- A8: 数据库与 Provider DAO：上游本轮 schema/列/DAO 改动完整落地（含 CodeBuddy 相关表/列）；fork `website_url_2` 的 SELECT、解码、UPDATE/INSERT 守卫与测试保留；SCHEMA_VERSION 与上游一致，撞号按既有规则记录。
- A9: 托盘与窗口：上游 agy 账号分区、macOS 图标位置与 Dock 修复完整落地；fork `show_menu_on_left_click(false)`、`panel_visible` 与四分支保持；`tray_left_click_never_opens_the_menu` 通过。
- A10: 预设与模型能力：上游预设内容落地；CodeBuddy 可见性按 Q2 决定执行；fork 编号→hidden→白名单过滤顺序、`hidden?` 字段与模型徽章/快捷切换判据保持；1M 读写兼容不回归。
- A11: CodeBuddy 集成完整：新 AppId/AppType 在 fork 的所有穷尽匹配处补齐（allowlist、托盘显示名、live 写入、appConfig、ProviderList、VisibleApps/McpApps/Skills/用量/会话），无编译缺口；官方账号卡可切换/显示额度；MCP/Skills/Prompts 开关可用。
- A12: CI 与物料：`.github` 保持 fork 现状；`Cargo.toml` 保持 tunecc repository、codegen-units=1、无 updater；依赖与锁文件一致；四处版本均为 `4.0.43-1`。
- A13: 全量检查通过：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm format:check`、`pnpm knip`、`pnpm test:unit`、`cargo fmt --check`、`cargo check --locked --all-targets`、`cargo test --all-targets`；重负载检查串行执行，vitest 限 2 forks、Rust 测试限 4 threads。
- A14: 落地保真：最终态提交后运行 `scripts/fidelity-v441-v443.py`（`v4.0.43`/`v4.0.40`/`pre-sync-v441-v443`/`HEAD` 四 ref，原始文本行多重集差集，不做空白/符号归一化）；上游侧缺失扣除 pre-sync 既有分歧后逐行归因，fork 侧缺失逐行归因，无非预期残余。
- A15: 文档终态：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 增补 v4.0.41–v4.0.43 叠加要点；fork README 差别清单与终态一致；归档后 `docs/comet/specs/upstream-sync/spec.md` 由本 change 完整目标规格整体重写。
- A16: 交付边界：Build/Verify 不推送、不打 tag；接受结果并归档后，按 Q3 的明确授权执行远端交付（若授权），不创建 PR；worktree 清理按 Q4。

# 决策

- D1：锁已发布 tag `v4.0.43`，不纳入 tag 后 2 个未发布提交（ZCode 新应用、Gemini 工具 schema 修复）；沿用历轮口径。
- D2：同步方式沿用完整 `git rebase v4.0.43`，重放全部 233 个 fork 提交，不 cherry-pick、不 merge；共享文件取上游结构并叠加 fork 必要语义。
- D3：应用内更新器沿用 Q1=A，保留 fork 现状；上游 `UpdateContext`/`backgroundTaskNotice` 的更新检查提示不在 fork 触发；models.dev 同步失败提示按上游落地。
- D4：`stream_check` 保持孤儿删除态；上游网络错误分类只落在共享 `proxy/error.rs`（不接入 fork 逐模型测试链）。
- D5：locale 按上游为准、fork 专属叶键按 pre-sync 原位置恢复；结构化 JSON 合并并显式查重，`de/ko/ru/tr` 不加 fork 键；上游新增 `streamCheck.hint.*` 作为上游键保留（fork 无 UI 引用，保持 8 语种键集合一致），既有 5 个 `streamCheck.*` 移除豁免不变。
- D6：预设内容取上游；fork 白名单判定不改；CodeBuddy 新应用预设可见性由 Q2 决定。
- D7：CI/release 保持 fork 裁剪与 `macos-15`；本轮上游 `.github` 无改动。
- D8：测试与结构重构随上游；knip/测试重构误判 fork 在用功能时以真实引用和回归结果为准做最小适配并登记。
- D9：采用单 change 推进（不拆 Supervisor）：rebase、冲突叠加、保真与全量回归围绕同一共享 Git 状态顺序执行。
- D10：新应用集成沿用既有先例（copilot/workbuddy/dsh/agy/omp）：新 AppId 在 fork 穷尽匹配处补齐，第三方预设默认不显示，官方卡按既有决定收录；不改变 fork 功能形态。
- D13（Q1=A，2026-11-27）：Grok 官方卡套餐显示取上游实现。删除 fork 的 `planLabel` 重复实现，`GrokBoundAccountLine` 改用上游 `plan` prop；后端 `query_grokbuild_quota_with_managed_fallback(..., with_plan=true)` / `get_grok_subscription_quota_with_plan` 落地，Grok CLI 凭据路径也显示套餐；`quotaPlanKey` 对绑定 Grok 卡按 `!grokBoundAccountId || usageEnabled` 门控；绑定卡 `XaiOauthQuotaFooter` 使用 `autoQueryInterval = meta.usage_script.autoQueryInterval ?? 5`。fork 的双官网兄弟行与账号行布局保持不变。
- D14（Q2=A，2026-11-27）：CodeBuddy 在 fork 构建下只显示官方登录卡（单独常量，不参与白名单目录过滤）与自定义；`forkOfficialAllowlist.codebuddy = []`，DeepSeek/Xiaomi MiMo/LongCat 三个 `cn_official` 预设不显示。
- D15（Q3=A，2026-11-27）：接受结果并归档后授权 `git push --force-with-lease origin main` 并创建、推送 annotated tag `v4.0.43-1` 触发 Release CI；不创建 PR，不使用 `--force`。
- D16（Q4=A，2026-11-27）：归档完成、交付核对且两个 worktree 干净后，清理本轮 `comet/sync-upstream-v441-v443` worktree/分支与已取消的 `sync-upstream-v443` worktree/分支；主目录未跟踪文件不动。

# Open questions

（本轮问题已全部解决：Q1=A 取上游 Grok 套餐实现；Q2=A 仅官方登录卡；Q3=A push main + tag `v4.0.43-1`；Q4=A 归档后清理两个 worktree。结论见 Decisions D13–D16。）
