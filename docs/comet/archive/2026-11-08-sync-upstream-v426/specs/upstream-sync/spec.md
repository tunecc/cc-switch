# 完整目标规格：upstream-sync（v4.0.26 轮）

> 本文件是 `sync-upstream-v426` 的完整目标规格，描述本轮同步**之后** upstream-sync 能力应当处于的完整状态（不是相对旧文本的差异清单）。归档时用它整体重写 `docs/comet/specs/upstream-sync/spec.md`。上一轮（v4.0.25）的完整状态与实测数字保留在 `docs/comet/archive/2026-11-03-sync-upstream-v425/`。

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch 发布头之上」的同步状态。本轮把 main 同步到上游发布 annotated tag `v4.0.26`（tag 对象 `8e975496f2e172230a509a2a5961899a926f5525`，剥离提交 `f621d4216189ef06bcc6acd3588c84937b9794e1`），fork 版本号 `4.0.25-1` → `4.0.26-1`。同步后 fork main = 上游 v4.0.26 内容 + fork 全部魔改提交（按原顺序重放），无丢失、无行为回归。

上游 `v4.0.25..v4.0.26` 共 39 个提交、184 个文件、+8562/−1571（15 新增 / 0 删除 / 169 修改）。本轮主轴是**性能（渲染、数据库、代理、运行时维护）与官方账号体系展示**：App.tsx 懒加载次级页与供应商编辑器（#9181）；供应商端点批量读取与跳过未变保存（#9180）；维护任务延后到阻塞线程、隐藏/最小化窗口暂停 Query（#9182）；会话转录零拷贝（#9183）；剩余等库锁同步命令改 async（#9178）；官方供应商卡副标题显示套餐、Auth Center 显示账户订阅套餐、Copilot 额度全量 capped 展示并改称 Credits；deeplink 导入扩展至 Claude Desktop 与 Pi 系（mcode/kimi/dsh/omp）；Codex 卡片新增官方 Fast 档位开关（默认关）；DSH 主目录覆盖；系统代理劫持本地路由警告；classifier 重试循环停止（#9201）；IPv6 不可达时 race IPv4；Copilot Responses 复用 Grok 兼容层并修复重复回复；MCP 401 显示「需要登录」；Claude Desktop 自动填充菜单名跟随模型编辑（#9203）；npm bin 冲突追加可执行提示（#9173/#9196）；WebDAV skills 归档保留符号链接名（#9197）；对话框居中改不用 translate（1x 屏清晰）；macOS 原始输入不自动大写；预设默认模型刷新与 TeamoRouter 域名 .cn→.com；Linux AppImage 排除 libwayland-client（#9229，落在 fork 已裁段）；stapler 重试（落在 fork 已裁段）。

**上游是否重写了 fork 已有功能——本轮结论：没有同域重复，不产生二选一。** 取证与逐项分析：

1. **deeplink 导入扩展 ≠ fork 跨应用导入**：上游 `51b464bd3` 扩的是 `ccswitch://` 链接解析的 app 白名单（`src-tauri/src/deeplink/provider.rs` +251/−48）；fork 的跨应用导入是 ProviderForm 内从其他应用已存供应商配置导入（`ProviderImportEntry` + `useProviderImportSources`/`useProviderImportApply`）。机制（URL 协议 vs 表单内读取本地配置）、入口（系统 deeplink vs 预设按钮区上方按钮行）、数据来源（链接参数 vs 其他应用供应商库）三者均不同。fork 在 `deeplink/provider.rs` 的全部语义只有 1 行 `website_url_2: None`。
2. **套餐/额度展示为上游单向新增**：`626f0226f`（官方卡副标题套餐，新 `src/lib/query/accountPlans.ts` 的 `useQuotaPlan` 读各额度 footer 同款查询缓存）、`cf3c86fe5`（Auth Center 账户套餐）、`78971d563`（Copilot 全量 capped 额度、premium 改称 Credits，含 `tray.rs` 的 `tier_premium` 文案与 `plan_line`）。fork 没有自己的套餐显示实现；fork 的 ProviderCard 副标题优先级链（Codex 账号行 → 绑号 Claude 账号行（不显示官网链接）→ AGY 当前模型 → fork 双官网链接 → 单官网链）、模型徽章与快捷切换按精确键名读 `*_MODEL`，均不受影响。
3. **Codex Fast 档位是新开关**：`62688ab38` 新增 `modelCatalog.officialSpeedTiers`（默认 false），只在原生 Responses profile 的直连/route 模式把官方 GPT 行的 `service_tiers`/`additional_speed_tiers` 还原；Chat 转换、Copilot 自建目录不受影响。fork 的快捷切换/1M 改写是 Claude 系 env 键链路，无对应实现。
4. **窗口隐藏暂停不碰 fork 托盘契约**：`50a51b867` 在 lib.rs 4 处 show/hide 补 `main-window-visibility-changed` emit；`windowActivity.ts`（fork 零语义，不在重叠面）重写为「隐藏/最小化才暂停 Query，焦点只控制装饰心跳」，visibility 判定挂原生 `onFocusChanged`/`onResized` + `isVisible`/`isMinimized` 轮询与自定义事件。fork 托盘 `show_main_window`/`hide_main_window` 会触发原生 focus/resize；上游自己的 `tray.rs` 同位置也不 emit 该事件，fork 不补 emit 即与上游逐点一致。`tray.rs` 本轮上游 diff（+46/−29）只含 TrayTexts 的 `tier_premium` 文案与 `plan_line`，`TrayIconEvent::Click`、`show_menu_on_left_click` 零命中。
5. **fork 高频魔改文件本轮上游零改动**：`ProviderList.tsx`、`ProviderCardActions.tsx`、`Sidebar.tsx`、`SettingsPage.tsx`、`GeneralSection.tsx`、`AboutSection.tsx`、`forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`ModelQuickSwitch/`、`providerModelUtils.ts`、`providerImport.ts`、`ProviderImportEntry.tsx`、`services/connectivity_test/`、`commands/connectivity_test.rs`、`.github/workflows/ci.yml`（以上游 diff 名单实测为准）。
6. **上游本轮净新增预设为 0**：只有既有预设内模型刷新（`kimi-k3.1-pro`、`qwen3.7-plus`、`grok-4.7`）与域名变更（TeamoRouter .cn→.com 共 6 个目录、官方卡 `claude.ai/download`→`claude.com/download`）；白名单无收录决定。
7. **release.yml 上游 hunks 落在 fork 已裁段**：`c70d61de0` 的 Linux AppImage `LINUXDEPLOY_EXCLUDED_LIBRARIES` 与 `7afceec14` 的两段 stapler 重试，对应 fork 裁剪版中不存在的 Linux build 与公证段（fork 只构建 macOS/Windows，macOS runner 锁 `macos-14`）；fork 裁剪版整文件保留。

因此本轮全部上游功能按上游落地（fork 已裁/已移除段除外），fork 魔改一律保留，无需用户做功能级取舍。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 tag `v4.0.26` 剥离出的提交 `f621d4216189ef06bcc6acd3588c84937b9794e1`。
- `git merge-base main v4.0.26^{}` == `f621d4216`；`git log v4.0.26..main` 仅含 fork 作者 `Tune <176898395+tunecc@users.noreply.github.com>` 的提交。
- 同步前 fork 提交（`git rev-list --count v4.0.25..main`，同步前 main = `7361a9d0c`，即 origin/main 与 fork tag `v4.0.25-1` 指向的提交，写作时实测 203）按原顺序重放，外加本轮的同步终态提交与归档提交；终态计数以现取命令为准，不在本规格写死。
- 重放映射核对口径：重放前后 `git rev-list --count` 之差只允许来自「被 git 判定为空而丢弃」或「本轮新增提交」；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行差异（剔除被判空丢弃者后比较）；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，不允许「fork 语义丢失」。
- 同步前起点由安全分支 `pre-sync-v426`（= `7361a9d0c`）固定记录；该分支不推送。
- 上一轮基线 tag `v4.0.25`（剥离 `a3eafa408`）与 fork 发布 tag `v4.0.25-1` 保持不变、不改写历史。
- `upstream/main` 在 tag 之后已有 skills 哈希迁移、codex catalog 绝对指针、deeplink 风险分类、会话 FTS5 搜索等提交，按「只锁已发布 tag」约定本轮一律不纳入；不同步其他上游分支。
- 取证性 fetch 只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`：本轮 Shape 期实测 `--prune --prune-tags` 组合会删除全部 fork 专属本地 tag（已从 origin 恢复并核对）。
- 重放开始前工作树只允许存在本 change 的 `docs/comet/changes/sync-upstream-v426/` 产物。

### 同步范围（v4.0.25..v4.0.26：39 提交、184 文件、+8562/−1571）

上游本轮改动按功能分组（提交号便于 Build 阶段核对落地保真）：

1. **官方账号体系展示（3 提交）**：`cf3c86fe5`（Auth Center 每个账户显示订阅套餐）、`626f0226f`（官方供应商卡副标题末尾套餐：新 `src/lib/query/accountPlans.ts` 的 `useQuotaPlan` 按各额度 footer 同款查询键读缓存，Claude 官方卡仍走 `claudeDefaultPlanLabel`/`ClaudeBoundAccountLine`）、`78971d563`（Copilot 显示每个 capped 额度、premium 改称 Credits：`tray.rs` 的 `tier_premium` 五语言文案与 `plan_line`、相关组件与 `tests/lib/copilotQuota.test.tsx`）。
2. **deeplink 导入扩展（1 提交）**：`51b464bd3`（claude-desktop/mcode/kimi/dsh/omp 链接不再被解析器 app 列表拒绝；Claude Desktop 只接受 cla-* 模型名——Anthropic 格式且仅 cla-*（或无）模型成直连卡，其余成四档映射卡且不声明 1M；mcode/dsh/omp/kimi 复用 Pi 单模型节点、链接必须带 `model`，Kimi 补 `max_context_size: 131072` 且键为 `<provider id>/<model>`；id 为 ASCII slug+uuid）。
3. **Codex Fast 档位（1 提交）**：`62688ab38`（新卡片设置 `modelCatalog.officialSpeedTiers` 默认关；开启后在原生 Responses profile 的直连/route 模式还原镜像 GPT 行的官方 `service_tiers`/`additional_speed_tiers`，使 `service_tier = "fast"` 被 Codex 0.166 发成 `priority`；Chat 转换与 Copilot 自建目录不适用）。
4. **DSH 主目录覆盖（2 提交）**：`81a9fa79d`（`settings.dsh_config_dir`（相当于 DSH_HOME、优先于环境变量）、`get_dsh_override_dir`、前端 `dshConfigDir`）、`420646d8a`（headless DSH profile 读 CC Switch 存的 key）。
5. **运行时性能与维护链（4 提交）**：`50a51b867`（#9182：启动期不再跑日志清理/rollup/vacuum，`database/mod.rs` 启动清理块移除；`backup.rs` 重构为私有 `backup_if_needed` + `periodic_backup_if_needed` 先备份后清理、备份 disabled/失败也跑清理；lib.rs 维护定时器 `spawn_blocking` + `MissedTickBehavior::Skip`、首 tick 即跑启动维护；lib.rs 4 处窗口 show/hide 补 `main-window-visibility-changed`；`windowActivity.ts` 重写：隐藏/最小化暂停 Query、焦点只控心跳，`focusManager.setEventListener` 挂原生事件）、`ca58c0313`（#9181：App.tsx 用 `lazy`/`Suspense` 懒加载次级页与供应商编辑器）、`fc9b17cbf`（#9180：`dao/providers.rs` 批量读端点、跳过未变保存，新 `dao/providers_tests.rs`）、`cc4ce0386`（#9183：会话转录避免拷贝、释放轻量缓存，新 `commands/session_manager_tests.rs`）。
6. **同步命令 off UI thread（1 提交）**：`98777515d`（#9178：`add_custom_icon`/`rename_custom_icon`/`set_global_proxy_url`/`rename_db_backup`/`start_mcp_connectivity_checks` 改 async，`commands/mod.rs` 新增 `run_db_task` helper）。
7. **代理链（8 提交）**：`e78784715`（#9201：classifier 重试循环停止，新 `proxy/classifier_guard.rs`）、`44c7fa9bc`（classifier-loop 早退补 `outbound_model`）、`e217bfcbb`（#9161：转发分配与 failover 库读减少）、`a990c81a1`（IPv6 上游不可达时 race IPv4）、`7c250c423`（系统代理劫持本地路由时警告，新 `proxy/loopback_probe.rs`）、`80ad02c5f`（失败请求日志带映射后上游模型）、`abf441fe2`（Codex chat 保留 turn-start developer 消息位置）、`38efe1099`（Codex chat call_id 缓存按客户端会话隔离）。
8. **Copilot Responses（2 提交）**：`02a136413`（#7989：复用 Grok 兼容层，新 `proxy/providers/copilot_responses.rs`）、`1adb3cbc4`（#8025：修复回复显示两次）。
9. **MCP 与订阅修复（2 提交）**：`65f6e682a`（401 MCP 端点显示「需要登录」而不是失败）、`1d9b448ef`（跟随登录卡刷新过期 Claude 登录）。
10. **表单与 UI（5 提交）**：`e6e7831e8`（#9203：Claude Desktop 自动填充菜单名跟随模型编辑，新 `updateRouteModel`；从下拉选模型时留空显示名一并填上）、`0f06fed26`（对话框居中改不用 translate，1x 屏不糊）、`7a0718e15`（macOS 原始输入不自动大写）、`d16064bde`（#9109：会话阅读器工具栏与元数据换行）、`3cf79926d`（官方卡指向 claude.com/download）。
11. **npm bin 冲突提示（2 提交）**：`1c2ed0669`/`2186b3052`（#9173/#9196：识别 EEXIST+`File exists:` 提取冲突路径，追加备份改名/改用原安装方式提示并警告不要盲目 `--force`，新 `tests/components/npmBinCollision.test.ts`）。
12. **其他修复（3 提交）**：`df3a9072a`（#9197：WebDAV skills 归档保留文件符号链接名）、`b8fa4199c`（#9148：子 agent 并发上限评审跟进）、`51fce968b`（#9193：预设默认模型刷新 grok-4.7/kimi-k3.1-pro/qwen3.7-plus）。
13. **预设域名（1 提交）**：`a5100e0e6`（TeamoRouter .cn→.com，6 个预设目录）。
14. **CI、发布与文档（4 提交）**：`c70d61de0`（#9229：`@tauri-apps/cli ^2.12.4` + release.yml Linux AppImage 排除 libwayland-client）、`7afceec14`（stapler 重试 ×2）、`8c05b6226`（版本号 4.0.26）、`f621d4216`（`docs/release-notes/v4.0.26-{en,zh,ja}.md`）。

新增文件 15 个（`git diff --name-status --diff-filter=A v4.0.25 v4.0.26` 的全部 A 项），fork 侧无自有语义、随上游整体落地：

- 后端：`src-tauri/src/commands/session_manager_tests.rs`、`src-tauri/src/database/dao/providers_tests.rs`、`src-tauri/src/proxy/classifier_guard.rs`、`src-tauri/src/proxy/loopback_probe.rs`、`src-tauri/src/proxy/providers/copilot_responses.rs`。
- 前端：`src/lib/query/accountPlans.ts`、`src/whats-new/4.0.26.json`。
- 测试：`tests/components/npmBinCollision.test.ts`、`tests/lib/accountPlans.test.tsx`、`tests/lib/copilotQuota.test.tsx`、`tests/lib/windowActivity.test.ts`。
- 脚本与文档：`scripts/measure-renderer.mjs`、`docs/release-notes/v4.0.26-{en,ja,zh}.md`。

删除文件 0 个。

### 维护链重构终态（D3）

- 启动路径（`database/mod.rs` 的 `Database::init` 尾部）不再执行日志清理、rollup/vacuum；启动恢复后的首次维护由 lib.rs 定时器首 tick 在 `spawn_blocking` 里跑，之后每 24h 一次，`MissedTickBehavior::Skip` 避免睡眠后补 burst。
- `backup.rs`：`backup_if_needed` 为私有备份函数；`periodic_backup_if_needed` 先跑备份再跑清理（rollup/prune + vacuum），备份 disabled 或失败不阻止清理。**fork 边界**：上游新结构中的 `cleanup_old_stream_check_logs(7)` 调用不落地（fork 已随 stream_check 链路移除该函数，`git grep 'fn cleanup_old_stream_check_logs'` 保持 0 命中）；上游新增测试里对 stream_check 清理行为的断言按 fork 移除态适配（删除或改写该断言），`stream_check_logs` 建表语句保留在 `schema.rs`，上游新测试对该表的 INSERT/SELECT 不受影响。
- `dao/providers.rs`：上游批量端点读取与跳过未变保存落地；fork 的 `website_url_2` 列、SELECT 列序与 `row.get(N)` 偏移逐行保留。

### 窗口可见性与托盘契约终态（D4）

- lib.rs 4 处 show/hide（主页面加载完成、关闭最小化到托盘、静默启动、正常启动非 Windows）在上游位置补 `main-window-visibility-changed` emit，取上游。
- `windowActivity.ts` 整文件随上游（fork 零语义）：`focusManager.setEventListener` 接管 React Query 焦点；可见（原生 visible 且非 minimized 且 document 非 hidden）才恢复刷新，焦点只控心跳；`tests/lib/windowActivity.test.ts` 落地并通过。
- fork 托盘左键「切换主窗口、永不弹菜单」四分支、`set_show_menu_on_left_click(false)` 与源码护栏 `tray_left_click_never_opens_the_menu` 不变；`show_main_window`/`hide_main_window` 不补 emit（上游 tray.rs 同位置不 emit，原生 focus/resize 事件已驱动 visibility 刷新）。
- `tray.rs` 的 `tier_premium = "Credits"` 五语言文案与 `plan_line` 改动取上游；fork 在该文件的左键语义段不受影响。

### 官方账号展示与 fork 卡片终态（D9）

- ProviderCard：上游 `quotaPlanKey`（Copilot/Codex OAuth/xAI OAuth/Kimi 官方/AGY 官方订阅各按额度查询键）、`useQuotaPlan`、`subtitlePlan = claudeDefaultPlanLabel ?? quotaPlan`、`planSuffix` 按上游落地；fork 的副标题优先级链、模型徽章、双官网链接、右键置顶/置底逐行保留，套餐后缀与 fork 各渲染段不争用同一位置。
- Auth Center 账户套餐（`cf3c86fe5`）与 Copilot Credits（`78971d563`）整链取上游；`tests/lib/accountPlans.test.tsx`、`tests/lib/copilotQuota.test.tsx` 落地。
- `ClaudeDesktopProviderForm.tsx`：上游 `updateRouteModel`（菜单显示名等于原模型则跟随新模型，下拉选择时填空显示名）取上游；fork 的 `ProviderImportEntry` 接线、白名单过滤（先编号后过滤）、`websiteUrl2` 段保留。
- `ProviderForm.tsx`：上游 `codexOfficialSpeedTiers` 状态与 `modelCatalog.officialSpeedTiers` 写盘取上游；fork 的导入入口、预设过滤与其他表单段保留。

### deeplink 与跨应用导入终态

- 上游 `deeplink/provider.rs` 的 app 白名单扩展、Claude Desktop 直连/映射卡分流、Pi 系单模型节点全部落地；其中新增的 `Provider { … }` 字面量必须补 fork 的 `website_url_2: None`（或对应值），否则 `cargo check --all-targets` 失败。
- fork 跨应用导入（`ProviderImportEntry`、`useProviderImportSources`/`useProviderImportApply`、各表单接线与 `providerImport.ts`）实现与形态完全不改。

### App.tsx 懒加载与 fork 门控终态

- 上游 `lazy`/`Suspense` 改造落地：次级页（Settings/AuthCenter/Apps/Usage/MCP/Prompts/Skills/Sessions/Workspace/openclaw 面板等）与供应商编辑对话框按需加载。
- fork 的 `VisibleSidebarPanels` 条件渲染与 Sidebar 过滤保持生效：被门控隐藏的面板不渲染、不因此提前加载或报错；fork 的批量检测入口门控（`visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry`）不变。

### 数据库 schema 终态（25，本轮不升级）

- 上游 `SCHEMA_VERSION` 本轮仍 24，fork 保持 25；不撞号、无迁移链合并、无新臂；`database/schema.rs` 本轮上游零改动（以实测 diff 为准）。
- `docs/comet/specs/database-schema-migrations/spec.md` 本轮不改。

### fork 侧文档终态

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮结果增改（新增 `dao/providers.rs`、`backup.rs`、`deeplink/provider.rs`、`App.tsx`、`windowActivity.ts` 等本轮新碰撞面），追加 §4.12「v4.0.26 轮的叠加要点」（维护链重构的 fork 边界、窗口可见性事件口径、release.yml 被裁段豁免、fetch 禁 `--prune-tags`）。
- 归档时 `docs/comet/specs/upstream-sync/spec.md` 整体重写为本规格内容。

### 重放映射（口径与记录要求，实测数字在 Build 阶段记录，不回写本规格）

- 同步前 fork 提交数以 `git rev-list --count v4.0.25..pre-sync-v426` 现取为准（写作时 203）。
- 重放后 `git rev-list --count v4.0.26..HEAD` 与主题序列对照 `pre-sync-v426` 逐行核对；被判空丢弃的提交逐个登记 sha 与原因；patch-id 差异逐条归类。
- 冲突停车清单在 Build 阶段实测记录到 `docs/HOW_TO_REBASE_UPSTREAM.md` §4.12，不写死在本规格。

### 落地保真核对（口径，最终态复算）

- 在最终态提交之后，用 `v4.0.26` / `pre-sync-v426` / `HEAD` / `v4.0.25` 四个 ref 计算行多重集差集：上游 184 文件与 fork 侧 148 个代码文件全部参与；非重叠上游文件在 fork 侧缺失为 0；重叠 38 文件的两侧缺失行逐行归因并带重数。
- 归因只允许「刻意取舍」一类：版本行、fork 专属文案、release.yml 裁剪段、stream_check/updater 移除链路、白名单条目、`website_url_2` 字面量补齐。出现无法归类的缺失行即判定失败。
- 修复类提交会改变保真数字，文档登记一律用现取口径。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

#### 版本与仓库根（5 个）

- `package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`：版本号终态 `4.0.26-1`；禁止 `git checkout --ours` 整体取侧；`Cargo.lock` 本轮上游零新增依赖，只允许 `cc-switch` 版本行变动；`pnpm-lock.yaml` 只取上游 `@tauri-apps/cli` 变动，fork 移除的 updater 三段不得带回。
- `README.md`：fork 重写版整文件保留。

#### 后端（13 个）

- `lib.rs`：可见性事件 4 处与维护定时器取上游；invoke_handler 本轮上游零改动，重放停车时确认 fork 两个 connectivity 注册 + 上游两个 mcp connectivity 注册同时在位、`stream_check_provider` 0 命中、无 updater 注册。
- `tray.rs`：TrayTexts/plan_line 的 Credits 段取上游；fork 左键契约段保留。
- `settings.rs`：上游 `dsh_config_dir` 三处（字段、Default、normalize）+ `get_dsh_override_dir` 取上游；fork 的 `VisibleSidebarPanels` 字段段保留。
- `commands/misc.rs`：上游 npm bin 提示等 +105 取上游；fork 的 4 处 tunecc URL 与两个测试断言保留（`farion1231/cc-switch/releases` 0 命中）。
- `commands/mod.rs`：上游 `run_db_task` helper 取上游；fork 声明保留。
- `database/mod.rs`：启动清理块随上游移除；fork 的 SCHEMA_VERSION 25 与迁移臂不变。
- `database/backup.rs`：上游新维护结构取上游，去掉 `cleanup_old_stream_check_logs` 调用与对应行为断言（D3）。
- `database/dao/providers.rs`：上游批量读/跳过未变保存取上游；`website_url_2` 列与行偏移保留。
- `deeplink/provider.rs`：上游导入扩展取上游；新 `Provider` 字面量补 `website_url_2`。
- `proxy/forwarder.rs`：上游 classifier guard、loopback、IPv4 race、分配优化取上游；fork 语义段（如有）叠加。
- `proxy/providers/codex.rs`：Fast 档位与 call_id 缓存取上游。
- `proxy/providers/mod.rs` / `proxy/mod.rs`：模块声明取并集（上游新增 `copilot_responses`、`classifier_guard`、`loopback_probe`；fork 既有声明保留）。

#### 前端（12 个）

- `App.tsx`：懒加载取上游；fork 门控段叠加保留。
- `ProviderCard.tsx`：套餐后缀取上游；fork 副标题链/徽章/双链接保留。
- `forms/ProviderForm.tsx` / `forms/ClaudeDesktopProviderForm.tsx`：上游新接线取上游；fork 导入入口/白名单过滤/websiteUrl2 保留。
- `types.ts`：上游新字段（`dshConfigDir`、`officialSpeedTiers` 等）取上游；fork 字段（`websiteUrl2`、`visibleSidebarPanels` 等）保留。
- 6 个预设 config：模型刷新与域名取上游；fork 白名单过滤不动。
- 4 个 locale：上游新增逐字落地；fork 键段保留；对象作用域查重 dup=0。

#### 本地化（`tr.json`，不在重叠面）

- 整文件随上游、与 `v4.0.26` tag 逐字节一致、不补 fork 键。

#### fork 自有文件（不在重叠面，仅需核对不被上游形态带偏）

- `forkOfficialAllowlist.ts`、`forkPresetFilter.ts`、`devpanel/`、`services/connectivity_test/`、`commands/connectivity_test.rs`、`ModelQuickSwitch/`、`providerModelUtils.ts`、`providerImport.ts`、`ProviderImportEntry.tsx`、`connectivityTestSettings.ts`、`Sidebar.tsx`、`GeneralSection.tsx`（trayStyleHelp）、`AboutSection.tsx`（fork 标识）、`.github/workflows/ci.yml`、`.github/workflows/release.yml`（裁剪版，虽然 upstream 改了它但 hunks 落在被裁段——重放时整文件保留 fork 侧）。

#### 冲突停车清单（Build 阶段实测记录）

- 以实测为准登记到 `docs/HOW_TO_REBASE_UPSTREAM.md` §4.12；预期高危区：版本四文件、`lib.rs`、`tray.rs`、`settings.rs`、`backup.rs`、`database/mod.rs`、`dao/providers.rs`、`ProviderCard.tsx`、`App.tsx`、两个表单、4 个 locale、release.yml。

### fork 取舍清单

- 保留 fork：全部魔改（见保留清单）、release.yml 裁剪版、README 重写版、`stream_check_logs` 建表语句、schema 25。
- 取上游：本轮全部新功能与修复（除落在被裁/已移除段的部分）、`@tauri-apps/cli ^2.12.4`、`tr.json` 整文件。
- 不落地：release.yml 的 Linux AppImage env 与 stapler 重试段（fork 无对应段）、`cleanup_old_stream_check_logs` 调用与行为断言（fork 已移除）、upstream/main tag 后提交。

### 预设 id 编号契约（延续）

- 编号（原数组下标）→ 过滤上游 `hidden` → 过滤 fork 白名单的顺序不变；本轮上游无净新增预设，白名单条目集合不变。

### 本地化状态

- 4 个既有 locale（en/ja/zh/zh-TW）：上游新增（Credits、套餐、deeplink、DSH、npm 提示、whats-new 等）逐字落地，fork 专属键段保留；对象作用域显式查重 dup=0。
- `tr.json`：与上游 tag 逐字节一致。

### `.comet/config.yaml` 保护

- rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复并 `git add`；终态与同步前一致（native+classic 启用、artifact_root docs、clarification_mode batch）。

### 已知流程坑位（沿用 + 本轮新增）

- 沿用：版本/锁文件禁整体取侧；`.comet/config.yaml` 中途恢复；`Provider` 字面量补 `website_url_2`；locale 静默重复键；预设 id 下标契约；cargo fmt 必须进正式检查；时间敏感 flaky 用例判定口径；绝对条数用现取口径。
- 本轮新增：取证 fetch 禁 `--prune-tags`（Shape 期实测删光 fork 本地 tag，已从 origin 恢复）；release.yml 上游 hunks 落在被裁段时整文件保留 fork 侧并在保真归因中登记「裁剪段」；`backup.rs` 新维护结构中的 stream_check 调用不复活。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`（cc-switch 包）四处终态统一 `4.0.26-1`。

### 交付（归档后单独授权）

- 验收通过、用户接受并归档后，向用户单独请求授权执行：`git push --force-with-lease origin main` + 创建并推送 annotated tag `v4.0.26-1`。不创建 PR；不推送 `pre-sync-v426`。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- `IS_FORK_BUILD`/`forkBuild` 构建标识与 About 面板 fork 标识。
- `forkOfficialAllowlist.ts` + `forkPresetFilter.ts` 白名单过滤（编号→hidden→白名单顺序）。
- `devpanel/`  DevPanel 全链路。
- 供应商逐模型连通性测试：`services/connectivity_test/`、`commands/connectivity_test.rs`、`connectivity_test_provider_models`/`connectivity_probe_provider` 注册、`ConnectivityBadge`/`ConnectivityTestDialog`/`ConnectivityDetailDialog`、批量检测入口门控、`connectivityTestSettings.ts`、`connectivityTest`/`provider.connectivityCheck` 键段。
- 模型徽章与快捷切换（`ModelQuickSwitch/`、`providerModelUtils.ts` 精确键名读取）。
- `websiteUrl2`/`website_url_2` 全链路（类型、表单、DAO 列、deeplink 字面量）。
- `VisibleSidebarPanels`/`visible_sidebar_panels` 与 Sidebar 过滤、批量检测门控。
- 托盘左键切换主窗口、永不弹菜单（四分支、`set_show_menu_on_left_click(false)`、`tray_left_click_never_opens_the_menu` 护栏）。
- 跨应用导入（`ProviderImportEntry`、`useProviderImportSources`/`useProviderImportApply`、各表单接线）。
- 右键置顶/置底（`ProviderCardActions`）。
- 无更新器（`tauri_plugin_updater`/`@tauri-apps/plugin-updater`/`install_update_and_restart` 0 命中）、无 `stream_check` 接线（模块声明、命令注册、`cleanup_old_stream_check_logs` 0 命中）。
- fork CI 裁剪（release.yml 无 Linux/公证段、macos-14）与 4 处 tunecc URL。

### fork 魔改保留清单落地取证（`git grep -I -l … HEAD -- src src-tauri tests`）

- 保留清单逐项命中数 > 0（以 Build 阶段实测脚本为准）；移除清单（updater、`stream_check_provider`、`fn cleanup_old_stream_check_logs`、`farion1231/cc-switch/releases`）逐项 0 命中。