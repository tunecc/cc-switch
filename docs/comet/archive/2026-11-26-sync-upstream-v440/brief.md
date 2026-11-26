# 目标

将 fork `tunecc/cc-switch` 的 `main` 从上游已发布 tag `v4.0.38` 同步到 `v4.0.40`，最终基线为 peeled commit `f19a9d4f4f08bda03106a7be87c77cbcdf55b019`。按原顺序重放 `v4.0.38..main` 的 228 个 fork 提交，fork 版本号从 `4.0.38-1` 更新为 `4.0.40-1`。上游本轮功能与修复全部落地（fork 已裁剪或已移除的功能域除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户要求：继续同步上游更新并保留自己的修改；如果上游实现了 fork 已有功能，必须先询问用户，分析保留上游实现、fork 实现或混合实现哪一种更好，再按用户决定执行。

# 范围

## 同步区间与取证

- 目标基线：已发布 annotated tag `v4.0.40`，tag 对象 `3da554daf7d5db5feb530f975181371b3ce41133`，peeled commit `f19a9d4f4`。
- 本轮区间：`v4.0.38..v4.0.40`，现取 72 个提交、326 个文件、+66,763/−51,759；v4.0.39 与 v4.0.40 分别 29、43 个提交。
- `v4.0.40` 之后的 `upstream/main` 有 18 个未发布提交，本轮不纳入；CodeBuddy 官方切换、Copilot CLI 配置复用、Grok 订阅额度卡、legacy Codex fork usage 恢复、设置页防闪和 Claude 原生连接复用等主题均属于这 18 个提交。
- 两侧共同改动 48 个文件；只读 `git merge-tree --write-tree HEAD v4.0.40^{}` 预览 14 个内容冲突文件。该预览用于评估风险，最终 rebase 冲突以实际重放为准。
- 同步前 fork main：`c1cfc415c21cbd453fb52d8cca010668e0d7f8a3`；`v4.0.38..main` 现取 228 个提交。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 prune）或 `git fetch upstream tag <name>`。
- 工作区：用户已选择独立 worktree，并允许本轮创建的 worktree 在归档且工作区干净后清理；主目录的未跟踪 `scripts/clean-target.sh` 保持原样，不纳入本轮提交。

## 上游主题与功能交集

1. Auth Center 账号排序/隐藏、供应商副标题显示托管官方账号、Grok Build 官方卡绑定 xAI 账号。
2. Plugins 页面启用与 Antigravity 支持、远端版本检查、占用中重装提示、CLI 缺失时避免创建配置目录，以及仅有桌面应用时回退使用其 bundled Codex CLI。
3. API key 复制、备份目录 opt-in 大小上限、工具版本并发探测与安装状态先显示、overlay 快速切换防闪。
4. 数据库/会话/用量性能：短查询索引与 WAL reader 隔离、WAL 与 proxy 热路径缓存、QuickJS 阻塞 worker、并行扫描共享游标、IPC 取消过期搜索、缓存命中率与隐私扫描优化。
5. 代理安全与可靠性：首字节超时、SSE 缓冲/pending 上限、逐连接 Host 校验、SQL import trigger/view/大小/时限限制、usage_script SSRF/OOM/JS 注入防护、deeplink 凭据外泄字段拦截与失败时不弹导入框。
6. 用量与托盘：Kimi 1.5、WorkBuddy 企业账号、Xiaomi MiMo/Token Plan、xAI OAuth 额度与官方账号副标题、Antigravity T3/ACP 会话和首 token 速度。
7. 其他用户可见修复：Skills Discover 同重名去重、OpenCode Desktop bundled CLI 不再走 npm 升级、deep link 合并失败不弹确认框、additive 应用 remove-from-live 收敛。
8. 供应商与预设：StringAI 完整赞助预设、OpenCode Go DeepSeek effort 修正。
9. 代理协议修复：GPT-6.2 Codex OAuth prompt caching、Chat chunked thinking、并行工具调用重排、减少 body/privacy 重复处理。
10. 测试与结构重构：Codex TOML 工具拆分、SkillService 分模块、大测试文件拆分与同类用例合并、Vitest workspace、CI 加速、objc2 0.5/app-kit 0.2 清理。

功能交集判定遵循目标对象、执行链路、UI 位置三个维度，不以功能名或关键词命中直接判为重复。调查结果及需要用户选边的项目记录在 Decisions/Open questions；尚无决定的事项保持 `[blocking]`。

### 功能交集调查结论（2026-11-25）

- **明确同域，需用户选边**：上游 v4.0.40 在 `ProviderCard` 为 Grok 绑定账号和 xAI OAuth 新增账号/套餐/reauth 副标题，分支位于 fork `websiteLinks` 之前；上游 `ProviderCard.xaiAccount.test.tsx` 明确断言账号显示时 URL 不显示。fork `ProviderCard.websiteLinks.test.tsx` 则要求 `websiteUrl`/`websiteUrl2` 双链接可见。两者争夺同一卡片副标题位。
- 托盘 `provider_hint` 也由「备注 > Claude 账号 > 官网」扩为「备注 > 托管官方账号 > 官网」，Grok/xAI 账号同样会替代官网；托盘左键四分支不冲突。
- **相邻但并存**：Grok 表单跨应用导入写地址/密钥/config，上游账号选择写 `meta.authBinding`；Auth Center 排序/隐藏使用 `appOrder/visibleApps`，fork `VisibleSidebarPanels` 管侧栏面板；StringAI 被 fork 白名单过滤，`ModelQuickSwitch` 不读 preset；API key 复制、备份上限、安全修复与逐模型测试/供应商导入是不同链路。
- **仅上游**：Kimi 1.5、MiMo 额度、缓存命中率、Antigravity 首 token/sessions/plugins、WorkBuddy 企业 usage、版本探测、WAL/搜索在 fork 侧无同域实现。
- updater 保持 Q1=A；`website_url_2` DAO 列序、右键行为与托盘左键契约按既有规则保留。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v440/{brief.md,specs/upstream-sync/spec.md}`；不建立能力关联或 Delta。
- 归档时由 Runtime 生成 `docs/comet/archive/<date>-sync-upstream-v440/`。
- rebase 前新增本地安全参照分支 `pre-sync-v440`，指向同步前 main，不推送。
- 本轮落地保真脚本 `scripts/fidelity-v439-v440.py`，沿用四 ref 行多重集差集口径并输出逐文件、逐行归因。
- 重放映射与归因证据 `docs/comet/changes/sync-upstream-v440/replay-map.tsv`，逐行记录 228 个原提交、重放提交、patch-id 状态与差异原因。
- 随上游落地的新增源码、测试、文档、物料与 release notes，最终清单以实际 rebase 为准。

### 修改

- 重放全部 228 个 fork 提交；共享文件按 `docs/HOW_TO_REBASE_UPSTREAM.md` §3/§4 合并，保留 fork 语义并接纳上游新增。
- 版本与物料：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`，终态统一 `4.0.40-1`。
- 后端共享文件：lib/tray/window/provider/DAO/proxy/usage/sessions/skills/plugins/auth 等按上游结构叠加 `website_url_2`、connectivity、托盘左键与无 updater 语义。
- 前端共享文件：Provider 表单/卡片/列表、Sidebar/Settings/App、Auth Center、Plugins 等按上游结构叠加 fork 的模型快捷切换、连通性、跨应用导入、双官网与侧栏可见性。
- 8 个 locale：上游新增、改写、删除按上游；fork 专属键按 pre-sync 原键序保留，保持空对象，合并后显式查重；`de/ko/ru/tr` 不补 fork 专属键。
- 预设目录：上游内容逐项落地；fork `hidden?` 字段、编号顺序、白名单和过滤判定保持；StringAI 等新预设不擅自加入 fork 白名单。
- CI：`ci.yml` 保留 fork 裁剪语义与 nextest/WSL2 约定并采纳上游改动；`release.yml` 保持 fork 裁剪版与 `macos-15`。
- fork 文档：更新 `docs/HOW_TO_REBASE_UPSTREAM.md` §4 并新增本轮叠加要点；归档时重写 upstream-sync 完整 Spec。

### 删除

- 上游删除且 fork 同样零引用的文件、API、locale 死键随上游删除并逐项取证。
- fork 已删除的 updater 与 `stream_check` 可达链路不得被重放带回；不删除 fork 仍在使用但上游误判为死代码的 API。

### 明确不建

- 不纳入 `v4.0.40` 后未发布的 18 个提交。
- 不创建 PR；Build/Verify 不执行 push 或打 tag。
- 不改变 fork 功能形态，不做同步之外的功能开发、重构或依赖升级。
- 不擅自更改 `forkOfficialAllowlist`/`forkPresetFilter` 的可见性口径。
- 不恢复应用内 updater、`stream_check` 接线或 release workflow 已裁剪段。

# 非目标

- 不丢失或削弱逐模型连通性测试、托盘左键切换、模型徽章/快捷切换、`websiteUrl2`、`VisibleSidebarPanels`、跨应用导入、右键完整菜单（含置顶置底/删除）、默认顶部插入、批量检测开关、DevPanel/fork 构建标识和 1M 快捷勾选。
- 不把上游 `appSpecs` 反向用于改写 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry`。
- 不为了让上游新功能可见而绕过 fork 官方预设白名单。
- 不清理主目录中与本轮无关的未跟踪文件。

# 验收示例

- A1: 同步基线与重放完整：`git merge-base main v4.0.40^{}` 为 `f19a9d4f4`；228 个同步前 fork 提交按原顺序重放，判空丢弃逐个登记，主题序列一致，patch-id 差异逐条归因为冲突停车、仅上下文位移或被上游同名实现消化。
- A2: fork 魔改保留：`IS_FORK_BUILD`/`forkBuild`、白名单/过滤器、DevPanel、connectivity 前后端与两个命令注册、模型徽章/快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels`、托盘左键四分支与源码护栏、跨应用导入、右键完整菜单（含置顶置底/删除）、默认顶部插入均存在且对应回归检查通过。
- A3: 上游能力落地：Auth Center 排序/隐藏与 Grok xAI 绑定、Plugins Antigravity 支持、API key 复制、备份上限、工具并发探测、数据库/会话/usage 性能、Host/SSRF/SQL/deeplink/SSE 安全修复、Kimi 1.5/WorkBuddy 企业/Xiaomi MiMo/xAI OAuth 用量、StringAI 预设与结构重构均在上游实现位置落地，并由上游或新增测试覆盖。
- A4: 功能交集逐项有结论：按目标对象、执行链路、UI 位置判定上游与 fork 功能是否同域；所有需要用户选边的项目在 Build 前得到明确决定，未决定项不得由 Agent 擅自替换。
- A5: 更新器域保持 fork 现状：不复活 updater 插件/依赖/能力/自动下载 UI；保留简化 `UpdateContext` 的 legacy 键兼容且启动不自动检查，`lib/updater.ts` 恒 up-to-date，`check_app_update_available` 白名单桩与关于页 tunecc Releases 跳转保留；上游本轮 updater 域清理不采纳，Q1=A 继续生效。
- A6: `stream_check` 保持不可达：模块声明、命令注册、DAO 读取和调用链不恢复；保留既有 schema 建表/索引，以及 pre-sync 已存在但未编译的孤儿 `services/stream_check.rs`/helper，不把上游 MCP connectivity 误接到 fork 逐模型测试链。
- A7: 本地化正确：8 个 locale 的上游增删改落地，fork 专属叶键不丢且保持原键序与空对象；`forkOnlyLocaleKeys.ts` 按 v4.0.40 重新生成；所有 locale 按对象作用域查重 dup=0；`de/ko/ru/tr` 与上游 tag 逐字节一致；localeParity/localeCoverage/readmeParity/CJK 检查通过。
- A8: 数据库与 Provider DAO：上游 WAL、缓存、短查询索引、reader 隔离和 Provider DAO 改造完整落地；fork `website_url_2` 的 SELECT、解码、UPDATE/INSERT 守卫与测试保留；上游新增 `Provider` 字面量补齐 fork 字段；SCHEMA_VERSION 保持与上游一致，若实际出现撞号按既有规则记录。
- A9: 托盘与窗口：上游重构完整落地，fork `show_menu_on_left_click(false)`、`panel_visible` 与四分支保持；`tray_left_click_never_opens_the_menu` 通过；上游 xAI 托盘额度与 fork 逐模型测试并存；Q2 混合契约落实为卡片账号效态/双官网分行、托盘账号优先，对应测试通过。
- A10: 预设与模型能力：上游新预设目录内容落地，StringAI 等第三方预设不擅自进 fork 白名单；fork 编号→hidden→白名单过滤顺序、`hidden?` 字段与模型徽章/快捷切换判据保持；1M 读写兼容不回归。
- A11: CI 与物料：`ci.yml` 采纳上游结构与加速改动并保留 fork 裁剪、nextest、WSL2 restore-only 和 continue-on-error；`release.yml` 保持裁剪版与 `macos-15`；`Cargo.toml` 保持 tunecc repository、codegen-units=1、无 updater；依赖与锁文件一致。
- A12: 全量检查通过：`pnpm install --frozen-lockfile`、`pnpm typecheck`、`pnpm format:check`、`pnpm knip`、`pnpm test:unit`、`cargo fmt --check`、`cargo check --locked --all-targets`、`cargo test --all-targets`。前后端重负载检查串行执行，vitest 限 2 forks、Rust 测试限 4 threads。
- A13: 落地保真：最终态提交后运行四 ref 原始文本行多重集差集（`v4.0.40`/`v4.0.38`/`pre-sync-v440`/`HEAD`，不做空白或符号归一化）；上游侧缺失扣除 pre-sync 既有分歧后逐行归因，fork 侧缺失逐行归因，无非预期残余。
- A14: 四处版本一致：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包终态均为 `4.0.40-1`。
- A15: 交付边界：Build/Verify 不推送、不打 tag；接受结果并归档后，按用户对 D9 的明确授权执行 force-with-lease 推送 main 和 annotated tag `v4.0.40-1`，不创建 PR；worktree 仅在归档完成且干净后按用户选择清理。

# 决策

- D1：锁已发布 `v4.0.40`，不纳入 tag 后 18 个未发布提交；独立 worktree，允许归档后清理；主目录未跟踪脚本不动。
- D2：同步方式沿用完整 `git rebase v4.0.40`，重放全部 fork 提交，不 cherry-pick、不 merge；共享文件取上游结构并叠加 fork 必要语义。
- D3：应用内更新器沿用 2026-11-15 Q1=A，保留 fork 现状；不得因上游更新器代码或新命令半套接线。本轮上游 `src/contexts/UpdateContext.tsx` 只删除从未写入的 legacy dismissed-version key，`src-tauri/src/commands/settings.rs` 只删除无效 allow 注释；`AboutSection.tsx`、`lib/updater.ts`、`src-tauri/src/app_update.rs` 无本轮改动。fork 保留现有简化 `UpdateContext`（legacy 键兼容、启动不自动检查），不采纳上游对其 updater 域清理；`settings.rs` 的非功能性 allow 清理可落地。手动检查仍由 AboutSection 打开 tunecc Releases。
- D4：`stream_check` 保持孤儿删除态；上游 MCP connectivity 与 fork 逐模型连通性按不同目标/链路/UI 判定，可并存。
- D5：locale 按上游为准、fork 专属叶键按 pre-sync 原位置恢复；结构化 JSON 合并并显式查重，`de/ko/ru/tr` 不加 fork 键。
- D6：预设内容取上游；fork 白名单判定不改，新第三方预设默认不显示；只有本机推理/官方卡按既有明确决定追加，其余可见性变化必须询问用户。
- D7：CI/release 保留 fork 裁剪与 `macos-15`；采纳上游 CI 优化但不得把上游全平台签名/发布物料带回 fork。
- D8：测试与结构重构随上游；若测试或 knip 误判 fork 在用功能为死代码，以真实引用和回归结果为准做最小适配并登记。
- D9：交付已授权。验收通过、用户接受结果并归档后，执行 `git push --force-with-lease origin main` 到 fork，并在归档提交上创建、推送 annotated tag `v4.0.40-1` 触发 Release CI；不创建 PR、不使用 `--force`、不清理主目录文件。该授权不要求在用户接受结果前提前交付。
- D10：Q2 于 2026-11-25 选择 A 混合。`ProviderCard` 对 Grok 绑定账号/xAI OAuth 卡片将账号/套餐/reauth 与 `websiteLinks` 分行显示，两类信息同时可见；托盘 `provider_hint` 账号优先。需自定义 JSX、locale 与测试，并调整上游「账号替代 URL」测试为混合契约。其余交集均为相邻或上游独有，无需选边。
- D11：采用单 change 推进。rebase、冲突叠加、保真与全量回归必须围绕同一共享 Git 状态顺序执行，拆成多个独立子任务不会增加并行收益，反而增加重复 rebase 与集成风险。

# 已确认的用户决定

- 2026-11-25：Q2 选择 A 混合显示：Grok/xAI 卡片账号效态与双官网分行，托盘账号优先。
- 2026-11-25：本轮使用独立 worktree，并允许在归档完成且工作区干净后清理本次创建的 worktree。
- 2026-11-25：验收通过、接受结果并归档后，授权 force-with-lease 推送 main 与 annotated tag `v4.0.40-1`；不创建 PR。
- 2026-11-15：应用内更新器 Q1=A，保留 fork 现状；上游零改动或继续增强均不改变该决定。
- 2026-11-03 起：上游 `category: local` 本机推理预设加入 fork 白名单，第三方云/赞助商/聚合预设默认拒绝；新整份 locale 不补 fork 键。

# Open questions

（无。功能交集调查完成；Q2 已于 2026-11-25 选择 A 混合，其余项目均为相邻并存或上游独有。）
