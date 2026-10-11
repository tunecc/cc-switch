# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch main 之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.8 发布头（tag v4.0.8 = df40d53c），fork 版本号为 4.0.8-1。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.8-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q1 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 df40d53c（tag v4.0.8 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == df40d53c；`git log v4.0.8..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 133 个 fork 提交（v4.0.7..main，含 v4.0.7 的同步提交、归档提交与规格修正提交）按原顺序重放，外加本次同步提交与归档提交（见「重放映射」）。
- 本轮无 post-release 区间：同步前 `git rev-parse upstream/main` == `git rev-parse v4.0.8^{commit}` == df40d53c，`git rev-list --count v4.0.8..upstream/main` == 0。上一轮（v4.0.7）被列为 post-release 而排除的 2 个提交（`0b8662a4` fix(i18n)、`1f786dad` docs(release)）本轮随基线进入范围。
- 同步前起点由安全分支 `pre-sync-v408`（= 809d4e4b）固定记录，该提交同时是 origin/main 与本地 annotated tag `v4.0.7-1` 指向的提交，用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- rebase 一趟完成，共 2 次冲突停车、全部解决后 `Successfully rebased and updated refs/heads/main`：同步前 `v4.0.7..main` 的 133 个 fork 提交全部按原顺序重放，rebase 结束后 `git rev-list --count v4.0.8..main` == 133，与重放前逐条一致——无空提交被丢弃、无重复落地、无 git 段错误。`git merge-base main upstream/main` == df40d53c；`git log --format=%an v4.0.8..main | sort -u` 只有 Tune（fork 作者），无任何上游提交落在区间内。
- 提交主题序列逐行 diff：重放前 133 条主题与重放后完全一致（无遗漏、无重复、无顺序变化）。
- patch-id 对照：133 个提交中 130 个 patch-id 与重放前完全相同，3 个不同。这 3 个全部对应本轮 2 个冲突解决点，逐条见下；无一属于「fork 语义丢失」。
- 冲突清单（2 处，按 rebase 顺序）：
  1. 原 `9aaa5747`（fork 首个版本号提交，2/133）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（新基线 4.0.8 vs fork 侧历史版本号 3.20.2-fork.1）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容（不对整文件 `--theirs`）。同提交还带着 `tailwindcss-animate` 的删除、`codegen-units = 1` 与 `trafficLightPosition` 的删除、`tauri.windows.conf.json` 的 title 改写，经核对属该提交原始意图（后续 fork 提交 `1a764021` 会加回 tailwindcss-animate），非误删；`Cargo.toml` 的 `[profile.release]` 段与上游 v4.0.7 新增的 windows-sys 两个 feature 在解决后并存（已核对 `Win32_Foundation` / `Win32_System_Threading` 均在）。
  2. 原 `83a9d90d`（移除旧 stream_check 链路，60/133）：`src-tauri/Cargo.lock` 一段 `cc-switch` 版本号 → 取 fork 侧值。同提交带走的 `tauri-plugin-updater` 及其依赖子树属 fork 关闭自动更新的既定结果；解决后全文件 `tauri-plugin-updater` 命中数为 0，`minisign-verify` / `osakit` / `xattr` / `rustls-platform-verifier` 命中数均为 0（`zip` 2.4.2 在上游基线上本就是无人依赖的孤儿条目，同步前同样存在，非本轮引入）。
- 3 个 patch-id 不一致的提交：`9aaa5747`(f0152de2) 与 `83a9d90d`(519d210d) 对应上述两个冲突点，新增行逐字节相同、只有删除行里被替换的版本号值不同（`4.0.7` → `4.0.8`）；`00b2807c`(ecae8f66) 是上下文位移，新增行与删除行均逐字节相同。三者均已用 `diff <(git show <old>) <(git show <new>)` 按增/删行分别核对。
- fork 历史自带未清理的冲突标记：本轮实测重放原提交 `83a9d90d` 时，`git diff --cached --check` 报出 `src/components/settings/SettingsPage.tsx`（6 处）、4 个 locales（各 2 处）、`tests/components/ProviderList.test.tsx`（2 处）的 leftover conflict marker。经 `git show 83a9d90d:<file>` 逐文件核对，这些标记在该 fork 历史提交自身的 tree 里就存在（SettingsPage 6、各 locale 2、ProviderList.test 1），由后续 fork 提交 `00b2807c` 清掉，属 fork 历史既有事实而非本次同步缺陷。此前记录的 `4b437070` 两个 blob（`database/tests.rs`、`services/provider/gemini_auth.rs`）本轮不再触发告警。重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验。最终态全树 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 为 0 命中，`git grep ... HEAD` 同为 0（已验证）。
- 落地保真核对（12 个上游/fork 重叠文件，A12）：8 个完全对称（上游新增行缺失 0、上游删除行缺失 0、fork 新增行丢失 0、fork 删除行丢失 0），含 `src-tauri/src/lib.rs`、`src/components/providers/forms/ClaudeFormFields.tsx`、`src/components/settings/SettingsPage.tsx`、`src/lib/api/settings.ts`、4 个 locales。4 个差异全部对应刻意取舍：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 是 fork 版本号 `4.0.8-1`（上游写 `4.0.8`），各只差版本号一行，与 v4.0.7 轮同类；逐行核对确认该行就是 4 个文件各自的唯一差异。
- 上游功能落地抽查（与上游 v4.0.8 逐文件比对）：`src/lib/api/model-fetch.ts` 的 `modelFetchRequestHeaders`、`src/components/providers/forms/{ClaudeFormFields,CodexFormFields}.tsx` 的 `{requestHeaders: modelFetchRequestHeaders(localProxyHeadersOverride)}`、`src/components/providers/forms/OpenCodeFormFields.tsx` 的 `normalizeRequestHeaders`/`findRequestHeaderValue` 取模型、`src-tauri/src/commands/config.rs` 的 `reveal_app_log_file`、`src-tauri/src/lib.rs:1414` 的 `commands::reveal_app_log_file` 注册、`src/lib/api/settings.ts` 的 `revealAppLogFile`、`src/components/settings/SettingsPage.tsx` 的 `handleRevealLogFile` 与 `settings.advanced.logConfig.openLog` 按钮、`src/types/proxy.ts` 的 `noticeReasons`、`src/components/providers/mode/SwitchModePanel.tsx` 的 `stack.noticeReasons` 渲染、`src-tauri/src/codex_config.rs` 的 `CODEX_DESKTOP_APP_BUNDLES`（`ChatGPT.app` / `Codex.app`）与 `codex-cli/bin/codex`、`src/index.css` 的暗色 `--text-1: #e4e4e7`、`CHANGELOG.md`、`docs/release-notes/v4.0.8-*.md`、`src/whats-new/4.0.8.json`、4 个 locales 的 `officialModelsReason` 与 `openLog` 均随上游落地。
- `.comet/config.yaml` 未被历史重放改写（重放后 blob 与同步前同为 `cebdcda66dbdcfde8b8de9331650753fb138b223`，内容仍为 `default_workflow: native` + `workflows: [native, classic]`）。
- 本轮无新增 fork 专属代码文件，白名单表只修订共享文件的叠加语义条目（`lib.rs`、`lib/api/settings.ts`、`SettingsPage.tsx`、`ClaudeFormFields.tsx`、4 个 locales 五处追加 v4.0.8 语义），并在「说明」段新增「仅上游改动、fork 侧从未触碰的文件不进入上表」一条。
- 同步提交（`chore: sync fork with upstream v4.0.8`）：版本号 4.0.7-1 → 4.0.8-1（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`，`Cargo.lock` 由 `cargo check` 联动，diff 只有版本号一行）、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订（5 处 v4.0.8 语义 + 1 条说明）、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v408`）：change 目录移入 `docs/comet/archive/<date>-sync-upstream-v408`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。

### 同步范围

- 上游新增提交：merge-base 790ed800 → df40d53c（v4.0.8 tag），共 10 个提交、38 个文件、约 +1436/−132 行，覆盖 v4.0.8 全部发布内容：
  - `0b8662a4` fix(i18n)：en/ja 额度显示帮助与 en/ja/zh-TW 备份提示文案改用 UI 实际标签。文件：`src/i18n/locales/{en,ja,zh-TW}.json`（各 2~4 行改写）。
  - `1f786dad` docs(release)：扩充 v4.0.7 notes 的 Codex 会话压缩段落（config.toml 映射、何时压缩、恢复与 CC Switch 会话列表/用量的处理、注意事项）。文件：`docs/release-notes/v4.0.7-{en,ja,zh}.md`（各 +12/−）。
  - `74b1a98c` fix(models)：OpenCode 表单取模型列表时发送已配置的请求头，并允许「只有请求头、没有 API Key」也能拉取（UA 从请求头里取）。文件：`src/components/providers/forms/OpenCodeFormFields.tsx`（+32/−，复用既有 `helpers/requestHeaders.ts` 的 `normalizeRequestHeaders`/`findRequestHeaderValue`）、`tests/components/OpenCodeFormFields.test.tsx`（+100）。
  - `315aeda7` fix(model-fetch)：Claude 与 Codex 表单取模型列表时带上供应商的本地代理 Header 覆盖 JSON；Codex 表单另把 `localProxyHeadersOverride` 加入模型列表失效 effect 依赖。文件：`src/lib/api/model-fetch.ts`（+17 新增 `modelFetchRequestHeaders`，走既有 `parseHeaderOverrideJson` 校验）、`src/components/providers/forms/ClaudeFormFields.tsx`（+22/−）、`src/components/providers/forms/CodexFormFields.tsx`（+12/−）、`tests/components/CodexFormFields.modelFetch.test.tsx`、新增 `tests/components/CodexFormFields.test.tsx`（+178）与 `src/lib/api/model-fetch.test.ts`（+37）。
  - `4215f7ee` feat(settings)：诊断日志区新增「打开日志」按钮，在系统文件管理器揭示 `cc-switch.log`（文件未创建时回退到日志目录）。文件：`src-tauri/src/commands/config.rs`（+18 `reveal_app_log_file`）、`src-tauri/src/lib.rs`（命令注册 +1）、`src/components/settings/SettingsPage.tsx`（+24）、`src/lib/api/settings.ts`（+4）、4 个 locales（+2 各）。
  - `3784fd9e` fix(ui)：暗色模式三档文字色降刺眼（`--text-1` #f4f4f5→#e4e4e7、`--text-2` #d0d0d8→#ababb3、`--text-3` #b5b5bd→#9a9aa2，shadcn `--foreground` 族跟随、`--muted-foreground` 对齐 `--text-2`；浅色模式不变）。文件：`src/index.css`（+21/−）、`docs/design-system.html`（+4/−）。
  - `979ce6a6` fix(codex)：把桌面版 Codex 自带的 CLI 作为最后兜底候选（macOS 的 ChatGPT.app 与旧名 Codex.app，位于 `/Applications` 与 `~/Applications`，先 `codex-cli/bin/codex` 后 `Resources/codex`，ChatGPT.app 优先；Windows 的 `%LOCALAPPDATA%\OpenAI\Codex\bin\<version>\codex.exe` 按修改时间新者优先；独立安装仍优先）。文件：`src-tauri/src/codex_config.rs`（+176/−）。
  - `2e20cdcb` fix(codex)：官方模型列表取不到时说明具体原因（`officialModelsReason` 九种 code：官方列表的 noLogin / loginStale / loginIncomplete / noVersion / fetchFailed / invalidList，自带列表的 noCli / cliFailed / nothingUsable），Stack 视图暴露 `noticeReasons`，每种回退各记一条 warning；回退后恢复可用时自动重写 client（后台检查在缓存仍新鲜时直接重写，不再依赖列表变化）。文件：`src-tauri/src/codex_config.rs`、`src-tauri/src/mode/controller.rs`（+94/−）、`src-tauri/src/mode/stack.rs`（+6）、`src-tauri/src/services/provider/codex_direct.rs`（+18）、`src-tauri/src/services/provider/codex_official_models.rs`（+387/−）、`src/components/providers/mode/SwitchModePanel.tsx`（+10/−）、`src/types/proxy.ts`（+16）、4 个 locales（+11 各）、`tests/components/SwitchModePanel.test.tsx`（+25）。
  - `ed15cd01` chore(release) v4.0.8：`CHANGELOG.md`（+26）、`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.lock` 的版本号 4.0.7→4.0.8。
  - `df40d53c` docs(release)：`docs/release-notes/v4.0.8-{zh,en,ja}.md`（各 +36）、`src/whats-new/4.0.8.json`（+33）。
- 不做部分 cherry-pick：同步范围是 v4.0.7..v4.0.8 的全量新增提交，一次 rebase 完成。
- 上游本轮未更新 `docs/user-manual/**` 与 `docs/guides/**`。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 12 个文件：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.lock`）、后端共享文件（`src-tauri/src/lib.rs`）、前端共享文件（`src/components/providers/forms/ClaudeFormFields.tsx`、`src/components/settings/SettingsPage.tsx`、`src/lib/api/settings.ts`）、4 个 i18n locales。`pnpm-lock.yaml` 本轮不在上游改动集内（上游 v4.0.8 未动该文件），fork 侧移除 `@tauri-apps/plugin-updater` 的状态原样保留，无冲突。
- 上游本轮改动、fork 侧未触碰的文件直接落上游版本：`src-tauri/src/codex_config.rs`、`src-tauri/src/commands/config.rs`、`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/{codex_direct,codex_official_models}.rs`、`src/components/providers/forms/{CodexFormFields,OpenCodeFormFields}.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`src/index.css`、`src/lib/api/model-fetch.ts`、`docs/design-system.html`、`CHANGELOG.md`、`docs/release-notes/v4.0.8-*` 与 `v4.0.7-*`、`src/whats-new/4.0.8.json`、`tests/components/{CodexFormFields,OpenCodeFormFields,SwitchModePanel}.test.tsx`、`tests/components/CodexFormFields.modelFetch.test.tsx`、`src/lib/api/model-fetch.test.ts`。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游 v4.0.8 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：以上游 `commands::reveal_app_log_file` 命令注册（+1）为基础；叠加并保持 fork 三段语义——移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`，`MouseButton`/`MouseButtonState` 导入保留）、connectivity_test 命令注册（`commands::connectivity_test_provider_models` + `commands::connectivity_probe_provider`）。不得因重放复活 updater 链路。
  - `src/lib/api/settings.ts`：以上游 `revealAppLogFile()` 绑定（+4）为基础；叠加 fork 移除的 `installUpdateAndRestart()`（fork 关闭应用内更新器，该方法不得复活）。
  - `src/components/settings/SettingsPage.tsx`：以上游「打开日志」按钮（`FolderOpen` lucide 导入、`handleRevealLogFile` useCallback、诊断日志 SettingsRow 的 `actions` prop 与按钮，+24）与 v4.0.7 起的 `appConfigScrollTarget` 定位 effect（+130）为基础；叠加 fork 的 DevPanel——`IS_FORK_BUILD`/`DEV_PANEL_ENABLED` 导入、`devPanelOpen` state、about 分组末尾的 Fork 按钮、文件末尾的 `<DevPanel>` 挂载。两侧 JSX 块整块拼接，禁止按行去重。
  - `src/components/providers/forms/ClaudeFormFields.tsx`：以上游取模型列表带上 Header 覆盖（`modelFetchRequestHeaders` 导入、`handleFetchModels` 传 `{requestHeaders: ...}`、`localProxyHeadersOverride` 进依赖数组，+22/−）为基础；叠加 fork 侧——兜底模型直达区（`fallbackQuickAccessSection`，仅经典布局渲染）、`hasCustomModelMapping` 计算与 `hasAnyAdvancedValue` 收窄、`SearchableModelPicker` 导入与对 `ModelDropdown` 的替换、API 格式选择器随端点输入框、1M 全选。两侧导入块取并集。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游新增键（`officialModelsReason` 九种 code、`settings.advanced.logConfig.openLog`/`openLogFailed`）与改写键（`quotaDisplayHelp` 的 en/ja、`codexHistoryUnify.hint` 与 `codexHistoryUnifyRestore.name` 的 en/ja/zh-TW）按上游执行；保留 fork 的 `devpanel` 段与 `connectivityTest` / `connectivityCheck` 等 fork 键段，合并后 fork 键不得缺失。
  - 4 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 取 fork 版本号 4.0.8-1（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）。`package.json` 另保留 fork 的 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater` 依赖；`Cargo.lock` 的 `cc-switch` 包版本号取 fork 值。`Cargo.toml` 上游本轮只改版本号，fork 的 `[profile.release]` 段与 windows-sys 两个 feature 保持并存。收尾用 `cargo check` 复验：报告锁文件未被改写，才算与 `Cargo.toml` 一致。
  - `README.md`：保留 fork 重写版（上游 v4.0.8 未改该文件）。
  - `.github/workflows/release.yml`：保留 fork 裁剪版（上游 v4.0.8 未改该文件；仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）。
- 本轮 fork 侧未改动的共享文件随上游与重放自然落地，fork 语义保持既有状态。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.8 仍为 20，CHANGELOG 升级说明明确「No database schema change (still 20)」）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 上游 v4.0.8 未改动 `src-tauri/src/database/mod.rs`、`schema.rs`、`tests.rs`，本轮不新增迁移步骤。后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- Shape 确认后编辑 brief 或 spec 会触发 Native Shape recovery：用同一个 summary 重新执行 prepare-shape-confirmation，再 `--confirmed` 回到 Build，然后原样重交 builder-handoff（candidateId 不变，Runtime 检查回执仍有效）。`acceptance_review.status` 合法值是 `implemented-with-evidence` 且 evidence 必须非空。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- Builder 交接的检查计划字段须用 Runtime 形态 `{id,name,executable,argv,cwdRef,timeoutMs,repeatable}`；`executable` 只写程序名，不要把程序名同时塞进 `argv[0]`。
- 重放中途不能跑 `cargo test`：fork 历史提交 `4b437070` 的两个 blob 自带未清理冲突标记，只有最终态才可编译校验。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡。
- fork 发版 tag 推送事件偶发丢失：推送后若 Actions 零排程，先取证（`git ls-remote`、`/actions/permissions`、workflows state、releases 资产数、check-suites、events），确认后删远端 tag 重推同一本地对象补触发；`release.yml` 的 concurrency 组 `cancel-in-progress: true`，不要连续并发重推。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.8-1`（同步前工作树为 4.0.7-1，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.8 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q1 明确授权，执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- Q1 已授权发布（2026-10-11 用户选择 A）：随后在归档提交上创建 annotated tag `v4.0.8-1` 并 `git push origin v4.0.8-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐（本轮与上游 Header 覆盖取模型改动同处一个 useCallback，合并后 `hasCustomModelMapping` 逻辑必须保留）。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + `hidden` 字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册、`install_update_and_restart` 不执行安装）。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/lib.rs`（上游 `reveal_app_log_file` 注册 + fork 三段语义）、`src/lib/api/settings.ts`（上游 `revealAppLogFile` 绑定 + fork 移除更新命令）、`src/components/settings/SettingsPage.tsx`（上游「打开日志」按钮 + fork DevPanel）、`src/components/providers/forms/ClaudeFormFields.tsx`（上游 Header 覆盖取模型 + fork 兜底直达区与搜索选择器）、4 个 locales（上游 `officialModelsReason` 与 logConfig 键 + fork `devpanel`/连通性键段）、`package.json` / `Cargo.toml` / `tauri.conf.json` / `Cargo.lock`（上游版本号 + fork `4.0.8-1`）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。
- 上游测试的零点窗口（既有实测记录，不改变任何验收要求）：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min / 1h / 3h / 4h / 5h` 构造会话，却断言存在「今天」分桶；本地时间落在 00:00–00:30 时 `now - 30min` 已属于前一天，该桶不存在，用例必然失败。同步过程中跨越零点时，遇到该单项失败先查时钟窗口再查实现，不要据此改动上游文件或放宽 A9。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q1 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路）。
- 不引入上游 Linux deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = 809d4e4b，安全分支 `pre-sync-v408` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q1 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
