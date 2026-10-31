# Outcome

本轮同步完成后：fork `main` 以已发布 annotated tag `v4.0.22`（tag 对象 `ab92059613455b5bb6751f16f87817eb731a55e4`，剥离提交 `b76426741ef93069e2f374ac01ca7ef5760e1d0e`）为基线，按原顺序重放同步前 `v4.0.21..main` 的全部 183 个 fork 提交（起点 `bce5bbceeda8866e485a3601ae482f7b92af40b3`），再叠加本轮同步终态与归档提交；fork 版本号 `4.0.21-1` → `4.0.22-1`；上游 v4.0.22 的功能与修复落地（唯一例外是 `ed494fbc7` 的 OpenCode V2 baseURL 修复——其宿主 `stream_check` 探测链路已由 fork 移除，按 D9 登记为不适用），fork 全部魔改保留且可用；上游本轮没有重写 fork 已有功能，同域行为碰撞有两处：托盘点击处理按「保留 fork 左键契约」合并（D2），已移除 `stream_check` 上的修复按「保留 fork 移除」处理（D9）。

# Scope

- **同步基线**：`v4.0.21..v4.0.22` 共 58 个提交、228 个文件、+15909/−1177（37 新增 / 1 删除 / 190 修改）。fork 侧自 `v4.0.21` 起改动 474 个文件、+60318/−2783，重叠面 45 个文件。`upstream/main`（`ba3d80d87`，tag 之后 10 个提交）按「只锁已发布 tag」约定不纳入。
- **DeepSeek Harness（DSH）新应用**：第 14 个应用，Web 与 Desktop 配置并行管理；侧栏、供应商列表/表单、模型编辑器、MCP/Skills 开关、账号登录、用量导入与 live 配置管理全部接入；预设目录由 Pi 目录派生（三种 wire protocol），官方账号预设 `dsh-official-account` 独立于目录。
- **终端**：打开终端支持追加自定义参数（含 shell 引号解析与批量变量透传）、跳过权限提示选项、Codex 供应商卡直接打开终端；`terminalAvailable` 判定 Codex 仅在当前卡或自带路由时提供入口。
- **用量与额度**：Oh My Pi 会话用量导入、DSH 用量导入、绑号 Claude 官方卡在托盘与用量设置显示账号额度、非当前/未启用供应商也按配置刷新余额、MiniMax 周窗口用尽后保持可见、`proxy_request_logs.error_message` 写入上限、侧栏用量文字对齐。
- **代理与 MCP**：xAI Responses `include` 过滤、Gemini 原生路径 skip signature 回退、`thoughtSignature` 移到 Part 级、Gemini 函数响应尾部文本拆分、Claude WebSearch `blocked_domains` 映射、Copilot Claude 模型走原生 `/v1/messages`（含 prompt caching）、Claude Desktop 网关常量时间 token 校验与 `x-api-key` 认证、拒绝回环到代理自身的上游地址、DSH MCP 配置。
- **Skills / WebDAV / 应用配置**：Skills 打开安装目录、复制名称、Discover 列表打开文档、只发现变更仓库；WebDAV 清空已保存配置；累加式应用 live 配置读取失败提示；Kimi CLI 旧版本时重跑安装器；CLI 存在但取不到版本时判为不可运行；OpenCode V2 `settings.baseURL`（宿主 `stream_check` 已由 fork 移除，按 D9 不适用）；TOML 数组表头识别；Claude Desktop `inferenceModels` 按 UI 顺序写入；AGY transcript 路径与根优先级修复；Codex 官方模型列表失败日志。
- **Claude 账号与授权中心**：Claude Code 子进程继承全局代理、超大凭据经 argv 写 keychain、过期托管账号引导到「账号」页、授权中心只滚动面板主体、WSL 配置目录提示、Claude 账号切换指南文档。
- **预设与赞助商**：OspreyAI、Astron Coding Plan 新增，TokenFlux 换域名并保留回退，StreamLake API key 链接带渠道跟踪，AIGoCode/PatewayAI/DIT.ai 赞助商物料刷新，AIGoCode 深/浅色 logo 替换旧图。fork 构建继续按白名单隐藏第三方预设。
- **托盘与 Windows**：上游把托盘点击处理抽成 `tray::handle_tray_icon_event`，新增 `tray_compat` 兼容 Windows 第三方托盘宿主，并在托盘/用量设置显示绑号 Claude 账号额度；fork 左键「切换主窗口、永不弹菜单」契约保持。
- **数据库**：上游 schema 升到 24（`enabled_dsh` 两张表 + `session_log_sync.parser_state`），与 fork 当前 24 冲突；fork 升到 25，合并上游列并新增幂等补列臂。
- **版本与文档**：四个版本文件统一 `4.0.22-1`；`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与新增 §4.9、`docs/comet/specs/upstream-sync/spec.md`（归档时）、`docs/comet/specs/database-schema-migrations/spec.md` 更新。
- **交付**：推送 `main` 与 annotated tag `v4.0.22-1` 只在验收通过、用户接受并归档之后执行；本轮在 Archive 阶段单独请求授权（D6）。

## 目录结构

### 新建

- `src/config/dshProviderPresets.ts`：DSH 预设目录（由 Pi 目录派生）与官方账号预设 `dsh-official-account`。
- `src-tauri/src/dsh_config/`：DSH Web/Desktop 配置文件读写与路径解析。
- `src-tauri/src/tray_compat.rs`：Windows 第三方托盘宿主兼容，仅作点击事件传输。
- `src-tauri/src/services/provider/codex_terminal.rs`（或上游同名模块）：Codex 卡片终端启动。
- 上游其余新增文件（37 个）：Claude 账号/代理/Skills/WebDAV 相关新模块、`src/whats-new/` 发布物料、`docs/release-notes/`、新增测试与预设/赞助商资源；fork 侧无自有语义，随重放整体落地。
- 本轮 fork 不新建功能文件，只在既有文件内补 `dsh` 白名单键与过滤接线。

### 修改

- 后端核心：`src-tauri/src/lib.rs`（模块与命令注册、托盘处理抽取）、`src-tauri/src/tray.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/database/{schema.rs,mod.rs}`（schema 25）、`src-tauri/src/database/dao/{mcp,providers,session_log}.rs`、`src-tauri/src/services/provider/{mod,live}.rs`、`src-tauri/src/services/claude_account/*`、`src-tauri/src/proxy/*`、`src-tauri/src/commands/*`；职责是承接上游 DSH/用量/代理/账号修复，并保留 fork 的更新器移除、`connectivity_test`、`website_url_2`、侧栏面板设置与托盘契约。
- 前端：`src/App.tsx`、`src/components/providers/*`（卡片、列表、菜单、表单、终端对话框）、`src/components/settings/*`、`src/lib/*`、`src/types.ts`、`src/i18n/locales/*`；职责是接入 DSH 应用、终端参数/跳过权限、用量与额度展示、live 配置提示，并保留 fork 的模型徽章、快捷切换、右键置顶/置底、双官网链接、跨应用导入与预设过滤。
- 仓库根与配置：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`（版本 `4.0.22-1`，不引入 updater）、`README.md`（fork 整文件保留，不采纳上游赞助商表）。
- 文档：`docs/HOW_TO_REBASE_UPSTREAM.md`（§4 与新增 §4.9）、`docs/comet/specs/upstream-sync/spec.md`（归档时重写）、`docs/comet/specs/database-schema-migrations/spec.md`（登记 schema 25）；本 change 正式产物位于 `docs/comet/changes/sync-upstream-v422/`。

### 删除

- 仅随重放移除上游 v4.0.22 删除的 1 个文件；fork 侧不主动删除任何自有实现。

### 明确不建

- 不新建 fork 自有功能模块，不新建 updater 相关文件或依赖。
- 不修改 `.comet/config.yaml`。
- 不新增上游范围外的文档（fork 说明只在 README 与既有 docs 文件内更新）。

# Non-goals

- 不纳入 `v4.0.22` 之后 `upstream/main` 的 10 个提交，也不同步其他上游分支或未发布 tag。
- 不重新启用应用内更新器，不引入 updater 插件/依赖/AIP。
- 不新增 fork 自有功能；本轮唯一的 fork 侧新增代码是 DSH 的预设白名单键与过滤接线。
- 不修复 `McodeProviderForm` 既有的「mcode 预设未经过 fork 白名单过滤」缺口，保留现状并在文档中登记。
- 不修改 `.comet/config.yaml`，不改变 Native 工作流配置。
- Build/Verify 阶段不 push、不打 tag、不创建 PR；不重写任何历史 tag。
- 不为了追赶上游而放弃 fork 的托盘左键、双官网链接、模型徽章/快捷切换、跨应用导入、逐模型连通性测试、侧栏面板可见性等契约。

# Acceptance examples

1. **基线正确**：`git merge-base main v4.0.22` 等于 `b76426741ef93069e2f374ac01ca7ef5760e1d0e`（`v4.0.22^{}`），且 `git log --format='%an <%ae>' v4.0.22..main | sort -u` 只输出 `Tune <176898395+tunecc@users.noreply.github.com>`。
2. **重放完整**：同步前安全分支 `pre-sync-v422` 指向 `bce5bbceeda8866e485a3601ae482f7b92af40b3`；重放后 `git rev-list --count v4.0.22..HEAD` 与 183 的差值只来自被 git 判空丢弃的提交和本轮新增提交，逐条登记；重放前后提交主题序列逐行 diff 为 0 行；patch-id 差异逐个归类为「逐字相同 / 仅 hunk 位移 / 冲突停车」，不存在 fork 语义丢失。
3. **上游零丢失**：按四 ref 行多重集口径对 228 个上游改动文件复算，非重叠的 183 个上游文件在 fork 侧缺失行为 0；重叠面缺失行逐行归因，只允许 README 整文件替换、四个版本文件 `4.0.22-1` 取代、以及合并等价的布局/分支改写。
4. **DSH 可用**：`dsh` 出现在应用列表、侧栏、MCP/Skills 开关、可见应用设置与后端 `AppType` 全部匹配臂中；DSH 页可添加/编辑/删除 live 托管供应商，模型编辑器使用 `dsh` 方言，账号预设 `DeepSeek` 进入账号登录组并可跳转授权中心；DSH 的 Web/Desktop 配置、账号登录、用量导入与 MCP 配置可读写，相关前后端测试通过。
5. **终端增强落地**：打开的终端会在生成参数之后追加用户自定义参数（按用户 shell 解析引号，批量变量原样透传），可选择跳过权限提示；Codex 供应商卡在满足 `terminalAvailable` 时可直接打开终端；Claude/agy 既有隔离语义与 fork 卡片图标入口不变。
6. **上游功能与修复落地**：用量（OMP/DSH 导入、非当前供应商余额刷新、Claude 账号额度、MiniMax 周窗口、错误信息上限）、代理（xAI include、Gemini 三处、WebSearch blocked_domains、Copilot 原生 Messages、常量时间 token、x-api-key、回环守卫）、Skills（打开目录/复制名称/发现文档/增量发现）、WebDAV 清空配置、live 配置读取失败提示、Kimi 安装器重跑、CLI 无版本判定、TOML 数组表头、Claude Desktop 模型顺序、AGY transcript 修复均可从代码与测试中验证。`ed494fbc7` 的 OpenCode V2 baseURL 修复登记为**不适用**：它只改 `src-tauri/src/services/stream_check.rs`，而该供应商卡探测链路已由 fork 移除（`c618f2ab3`），文件保持未编译孤儿状态——`services/mod.rs` 不声明 `stream_check`、`stream_check_provider` 未注册、OpenCode 不在 `TargetBuilder::for_app` 与 `shouldShowTestEntry` 范围内；该项不要求可用功能或测试覆盖。
7. **Schema 25 正确**：`SCHEMA_VERSION == 25`；`mcp_servers` 与 `skills` 均含 `enabled_dsh`，`session_log_sync` 含 `parser_state`；23→24 臂合并上游列并 set 24，新 24→25 臂幂等补齐三列并 set 25；上游 v4.0.22 的 24 库与 fork v4.0.21 的 24 库都能升到 25；迁移与 `create_tables` 测试通过。
8. **托盘契约不变**：`tray::handle_tray_icon_event` 内保持 fork 四条分支（面板样式左键且面板未显示切换主窗口、其余面板切换；原生菜单样式左键切换主窗口、右键标记反馈后交系统菜单），Windows 第三方宿主经 `tray_compat` 补发的点击走同一函数；`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`，`native_menu_on_left_click` 不复活，`tray_left_click_never_opens_the_menu` 护栏通过；绑号 Claude 账号额度进入托盘用量来源。
9. **更新器仍禁用**：`tauri_plugin_updater`/`updater_builder` 零命中，`Cargo.toml`/`package.json` 无 updater 依赖，`createUpdaterArtifacts` 为 `false`，`install_update_and_restart` 与 `check_app_update_available` 保持空壳。
10. **预设口径**：六个上游预设目录（含 Pi 派生到 DSH）内容按上游落地；fork 构建继续只保留白名单条目，DSH 白名单为 `["Ollama","LM Studio","vLLM"]`；账号预设 `DeepSeek` 不参与目录过滤；预设 `id` 仍按原始数组下标编号，白名单过滤在编号之后执行；`forkOfficialAllowlist` 补齐 `dsh` 键且类型检查通过。
11. **本地化正确**：4 个既有 locale 合并上游新增/删除/改写键并保留 fork 键段，按对象作用域查重为 0 重复；`tr.json` 整文件取上游；无残留的已删除键引用。
12. **版本统一**：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 `cc-switch` 条目均为 `4.0.22-1`，无其他版本号残留。
13. **冲突收敛**：45 个重叠文件逐个按 §3 规则合并，没有整文件取一侧；`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 零命中。
14. **fork 魔改保留**：DevPanel/`IS_FORK_BUILD`、侧栏面板可见性、模型徽章与快捷切换、Claude 兜底模型直达、右键置顶/置底与新建插入第二位、逐模型连通性测试、双官网链接、跨应用导入、fork README、测试稳定性修正均仍在且可检索到。
15. **文档同步**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果修订并新增 §4.9；归档时 `docs/comet/specs/upstream-sync/spec.md` 重写为 v4.0.22 轮完整状态；`docs/comet/specs/database-schema-migrations/spec.md` 登记 schema 25 与新增迁移臂。
16. **交付边界与配置保护**：Build/Verify 期间不执行任何远端写操作；归档后推送 `main` 与 `v4.0.22-1` 前单独取得用户授权；`.comet/config.yaml` 未被修改。

# Constraints and invariants

- 只以已发布 tag `v4.0.22` 的剥离提交为基线；不接受 tag 之后的上游提交。
- 同步前必须创建 `pre-sync-v422` 安全分支；任何重放失败先 `git rebase --abort`，禁止 `git reset --hard` 清理。
- `rerere` 复用的解法必须逐个复核，尤其是版本四文件、`lib.rs`、`tray.rs`、schema 文件与 4 个 locale。
- 重放中途不跑 `cargo test`；最终态必须对冲突标记零命中。
- 重叠文件禁止整文件取一侧（README 除外，属刻意整文件保留 fork）。
- 上游内容零丢失与 fork 语义零丢失同等重要；合并等价差异必须逐行归因。
- schema 版本碰撞按 D4 处理：不得简单把上游 24 当终态，也不得覆盖 fork 已有迁移臂。
- 托盘左键行为在所有平台保持一致：左键单击永不弹菜单；Windows 第三方宿主的点击补发只作为事件传输，不改变可见行为。
- 应用内更新器保持禁用；不得因上游重放带入任何 updater 实现。
- `.comet/config.yaml` 不修改；不改 `artifact_root`、`language`、`clarification_mode`、`max_verify_failures`。
- 交付动作（push main、push tag）不属于 Build/Verify 范围，必须等归档后单独授权。

# Decisions

- **D1｜基线与版本**：本轮基线锁定 annotated tag `v4.0.22`（tag 对象 `ab9205961…`，剥离提交 `b76426741…`）；fork 版本号 `4.0.21-1` → `4.0.22-1`；不纳入 `upstream/main` 的 10 个 tag 后提交。
- **D2｜上游是否重写 fork 功能：没有，不构成二选一**。逐项分析：DSH、终端增强、用量/代理/Skills/WebDAV 修复、Claude 账号修复、预设与赞助商物料在 fork 侧都没有对应自有实现；唯一同域行为碰撞是托盘点击处理——上游把处理抽成 `tray::handle_tray_icon_event`、新增 Windows 第三方宿主兼容，并把 Windows 左键改为「显示主窗口」。**结论：保留 fork 的托盘契约**（左键切换主窗口、永不弹菜单，全平台一致），采纳上游的函数抽取与 `tray_compat` 作为事件传输层；不采纳上游「Windows 左键只显示不切换」的分支。理由是 fork 托盘契约已写入 `docs/comet/specs/tray-left-click-toggle/spec.md` 并有源码护栏，且用户本轮明确要求保留自有修改；`tray_compat` 的补发点击在本轮只扩大 Windows 第三方宿主下的可用性，不改变 fork 语义。
- **D3｜DSH 全量采纳**：DSH 作为第 14 个应用整体落地（含 Web/Desktop 配置、账号登录、MCP/Skills、用量导入、模型编辑器方言）。fork 构建的 DSH 预设白名单为 `["Ollama","LM Studio","vLLM"]`（由 Pi 目录派生且协议兼容的三条本机推理）；账号预设 `DeepSeek`（`dsh-official-account`）属于「账号登录」组，不经白名单过滤。`McodeProviderForm` 对 `appId === "dsh"` 的目录套用 `filterForkPresets`，编号仍按上游原始数组下标；mcode 表单既有的未过滤缺口本轮不动。
- **D4｜schema 升级到 25**：上游 v4.0.22 的 schema 24 与 fork 当前 24 碰撞。fork 升到 25：把上游 24 的 `enabled_dsh`（`mcp_servers`/`skills`）与 `session_log_sync.parser_state` 合并进 fork 现有的 `23 =>` 臂并 set 24；新增 `24 =>` 幂等补列臂并 set 25，覆盖已到达 fork 24 的库；`create_tables` 补齐三列并保留 `parser_state` 的 `add_column_if_missing` 开发版补丁；`database/dao/mcp.rs` 的 SELECT/INSERT 与行映射加入 `enabled_dsh`。降级仍按上游策略不做兼容。
- **D5｜预设与本地化口径**：六个预设目录整份取上游；fork 各保留 `hidden?: boolean` 类型行；新增第三方预设（OspreyAI、Astron、TokenFlux/StreamLake 变更）继续被白名单隐藏，本机推理与官方名仍逐字命中白名单；4 个 locale 合并上游键并保留 fork 键段，`tr.json` 整文件取上游。
- **D6｜交付授权延后**：Build/Verify 不推送、不打 tag；归档完成后向用户单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.22-1` 的推送。只授权这两项远端动作，不创建 PR。
- **D7｜文档更新**：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 增改本轮的共享文件行并追加 §4.9「v4.0.22 轮的叠加要点」；归档时把 `docs/comet/specs/upstream-sync/spec.md` 重写为 v4.0.22 完整状态；`docs/comet/specs/database-schema-migrations/spec.md` 登记 schema 25。README 保持 fork 整文件。
- **D8｜验证范围**：以 `.comet/config.yaml` 的检查要求为准；代码终态跑 `pnpm typecheck`、`pnpm test:unit`、`cd src-tauri && cargo test`；已知上游 flaky（SessionManagerPage 本地 00:00–00:30、AppsPage 并发缓存竞态）按既有记录说明，不作为实现缺陷。
- **D9｜上游修复与 fork 移除碰撞：保留 fork 移除**（2026-10-31 用户选择）。上游 `ed494fbc7` 修的是「供应商卡连通性检测读取 OpenCode V2 `settings.baseURL`」，改动只在 `src-tauri/src/services/stream_check.rs`。fork 已在 `c618f2ab3` 移除旧 `stream_check` 可达性探测全链路（保留表结构），改用逐模型连通性测试 `connectivity_test`；该服务文件在 main 上是未编译、无调用方的孤儿文件（历次同步保留），上游修复因此只落到死代码。fork 的活跃探测只覆盖 claude/codex：`connectivity_test::protocol::TargetBuilder::for_app` 对 OpenCode 返回 `None`，`shouldShowTestEntry` 只放行 claude/codex，`stream_check_provider` 命令未注册，没有可落地的活跃路径。用户明确选择保留 fork 移除：A6 把该子项登记为不适用，不改代码、不改用户可见行为；`services/stream_check.rs` 保持上游逐字内容但不编译，也不为「消除 stream_check 字样」删除或改动它。若未来要把 OpenCode 接入逐模型连通性测试，另开 change 评估。

# Open questions

无未决项。用户提出的「上游若重复实现 fork 功能则分析并询问」已完成核实：本轮上游没有重复实现 fork 功能；两处同域碰撞均已由用户确认——托盘点击按 D2 保留 fork 契约；上游对已移除 `stream_check` 的 OpenCode V2 baseURL 修复按 D9 登记为不适用（2026-10-31 用户选择「保留 fork 移除」）。

# Verification expectations

- 每条验收项都要有可复现命令或测试证据；Runtime 检查之外由新的只读 Verifier 独立判断全部验收项。
- 同步证据：`pre-sync-v422`、`git merge-base`、作者集合、`git rev-list --count`、主题序列 diff、patch-id 分类、`git grep` 冲突标记零命中、四 ref 行多重集差及逐行归因，全部记录在 `verification.md` 与本轮归档产物中。
- 功能证据：DSH、终端、用量、代理、Skills、WebDAV、schema 25、托盘、更新器禁用、预设过滤、locale 查重、版本四文件分别给出代码位置与测试结果。
- A6 的 OpenCode V2 baseURL 子项按 D9 的边界核验：`services/mod.rs` 不声明 `stream_check`、`stream_check_provider` 未注册、`TargetBuilder::for_app` 与 `shouldShowTestEntry` 不含 OpenCode；该文件为孤儿文件，不要求功能可用或测试覆盖。
- 测试命令：`pnpm typecheck`、`pnpm test:unit`、`cd src-tauri && cargo test`；失败项需区分本轮引入、上游既有 flaky 与环境限制，并记录原始输出。
- fork 魔改取证：对保留清单逐项执行 `git grep`，确认存在；更新器相关符号确认零命中。
- 最终结果需用户明确接受；归档与交付按 D6 单独授权。
