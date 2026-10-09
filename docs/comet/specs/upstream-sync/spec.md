# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch main 之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.5 发布头（tag v4.0.5 = 2db86e94，与 upstream/main HEAD 为同一提交），fork 版本号为 4.0.5-1。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.5-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q1 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 2db86e94（tag v4.0.5 指向的提交，也是 upstream/main HEAD，本次同步基线）。
- `git merge-base main upstream/main` == 2db86e94；`git log v4.0.5..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 124 个 fork 提交（a29a4f38..main）按原顺序重放，外加本次同步提交与归档提交（见「重放映射」）。
- 上游 v4.0.5 之后无 post-release 提交，因此本轮不存在「留待下次同步」的上游区间。
- 同步前起点由安全分支 `pre-sync-v405`（= ed82e862）固定记录，用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- rebase 一趟完成：同步前 `a29a4f38..main` 的 124 个 fork 提交全部按原顺序重放，rebase 结束后 `git rev-list --count v4.0.5..main` == 124，与重放前逐条一致——无空提交被丢弃、无重复落地、无 git 段错误。`git merge-base main upstream/main` == 2db86e94。
- 冲突共 6 处，全部按下述解法处理并被 rerere 记录：
  1. 原 `9a859fd8`（fork 首个版本号提交）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（新基线 4.0.5 vs fork 侧历史版本号）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容（不对整文件 `--theirs`）。
  2. 原 `5c8e0a3b`（fork 裁剪 release CI）：`.github/workflows/release.yml` 两段冲突（新基线侧是上游 b1752e1c 的 deb/rpm 签名校验与 d90de1ba 的 Linux 包自动更新步骤）→ 整文件取该 fork 提交的版本，上游 Linux 发布步骤按决策不引入。fork 版内自带的 `ubuntu-22.04` runner 行是 fork 既有内容，不是上游带回。
  3. 原 `63d69211`（fork 禁用应用内更新器）：`package.json` 1 段（`@tauri-apps/plugin-updater` 依赖行）+ `pnpm-lock.yaml` 3 段（同包的 specifier / resolution / snapshot）→ 取 fork 侧（删除）；其余上游依赖变动由 git 自动合并保留，未整文件取一侧。
  4. 原 `c77b46eb`（fork 重写 README）：`README.md` → 整文件取 fork 提交版本，上游 5dd824c7 的四份 README v4.0 重写不覆盖 fork 差异说明。
  5. 原 `52faaa8d`（移除旧 stream_check 链路）：`src-tauri/Cargo.lock` 的 `cc-switch` 包版本号冲突 → 取 fork 侧值。
  6. 原 `4b437070`（双官网链接）：`src-tauri/src/proxy/forwarder.rs` 两段测试区冲突 → 取上游侧。依据：上游 f9db9f70 把上游自有的 `copilot_detection_via_base_url` / `copilot_detection_for_enterprise_endpoint` 测试重构为 `is_managed_copilot_request()` 判定 + `test_provider_with_type()` 构造助手（v4.0.4 上游就有这些测试，fork 在本文件从未自建测试，只加过 `website_url_2: None`）；取上游侧后 `test_provider_with_type()` 内的 `website_url_2: None` 由 git 自动合并保留，fork 语义未丢。
- 中途一次修正（如实记录）：第一次尝试时解析脚本因语法错误未执行，`package.json` / `pnpm-lock.yaml` 带着冲突标记就被 `git add` 并落进提交 `b91ec906`。处置：`git rebase --abort` 回到 ed82e862，核对 `.git/rr-cache`（52 条，0 条 postimage 含标记）确认缓存未被污染，改用「解析后强制断言零标记 + `git diff --cached --check` 复核」的脚本重跑，最终历史中无任何冲突标记。教训：重放中途的提交也可能带标记，判定只看最终态，但必须先用全树 `git grep` 证明最终态为空。
- fork 历史自带未清理的冲突标记：原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` _blob 里本来就有 `<<<<<<< HEAD ... >>>>>>> 795d8a12`（要靠后续 fork 提交 `24febbfb`、`c3d2f317` 才清掉）。因此重放中途出现这两处标记属 fork 历史既有事实，不是本次同步缺陷；由此推论——重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验。最终态全树 `git grep -I "^<<<<<<< \|^>>>>>>> "` 为空（已验证）。
- 落地保真核对（25 个上游/fork 重叠文件，A12）：17 个完全对称（`upstreamAddMissing=extraAdd=upstreamDelMissing=extraDel=0`），含 4 个 locales、`types.ts`、`ProviderForm.tsx`、`tray.rs`、`lib.rs`、`provider.rs`、`commands/misc.rs`、`proxy/providers/{claude,codex,mod}.rs`、`services/provider/mod.rs`、`EditProviderDialog.tsx` 与其测试、`codexProviderPresets.ts`。8 个差异全部对应刻意取舍：4 个版本文件是 fork 版本号 `4.0.5-1`（上游写 `4.0.5`）；`package.json` 与 `pnpm-lock.yaml` 是 fork 移除的 `@tauri-apps/plugin-updater`；`release.yml`（上游 43 增 / 6 删不引入）与 `README.md`（上游 86 增 / 59 删不引入）是 fork 裁剪与重写；`forwarder.rs` 的 `extraDel=1` 是被上游删除的那段内联测试字面量里的 `website_url_2: None`（同文件助手仍带该字段）。
- 上游功能落地抽查（与上游 v4.0.5 逐文件比对）：`UsageHeatmap.tsx`、`services/usage_stats.rs`、`linux_fix.rs`、`proxy/providers/copilot_auth.rs` 与上游完全一致（all-time 热力图、Wayland 修复、Copilot 鉴权链路均已落地）；`codexProviderPresets.ts` 相对上游只差 fork 的 2 行 `hidden` 接线。
- `.comet/config.yaml` 未被历史重放改写（重放后仍为 `default_workflow: native` + `workflows: [native, classic]`）。
- 本轮无新增 fork 专属代码文件，白名单表只修订共享文件的叠加语义条目，不虚构新增行。
- 同步提交（`chore: sync fork with upstream v4.0.5`）：版本号 4.0.4-1 → 4.0.5-1（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`）、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订（lib.rs、tray.rs、forwarder.rs 与 proxy providers、provider.rs / services/provider/mod.rs、types.ts、EditProviderDialog 与其测试、ProviderForm.tsx、codexProviderPresets.ts、commands/misc.rs、锁文件冲突口径）、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v405`）：change 目录移入 `docs/comet/archive/<date>-sync-upstream-v405`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。

### 同步范围

- 上游新增提交：merge-base a29a4f38 → 2db86e94（v4.0.5 tag），共 20 个提交、193 个文件，覆盖 v4.0.5 全部发布内容：
  - f9db9f70 feat(codex)：GitHub Copilot 托管账户 + Responses/Chat 路由（后端 `proxy/forwarder.rs`、`proxy/providers/{codex,claude,mod}.rs`、`proxy/providers/{copilot_auth,copilot_model_map}.rs`、`proxy/copilot_optimizer.rs`、`proxy/handlers.rs`、`provider.rs`、`commands/provider.rs`、`codex_config.rs`；前端 `CodexFormFields.tsx`、`ProviderForm.tsx`、`EditProviderDialog.tsx`、`useDraftEditorProjection.ts`、`apps/useToolManagement.ts`、`types.ts`、`lib/api/{copilot,providers}.ts`；新增 3 个组件测试与 `tests/fixtures/copilot-endpoint-cases.json`）。
  - 5d24fdf9 feat(usage)：all-time 热力图展示全部历史（`commands/usage.rs`、`services/usage_stats.rs`、`lib.rs` 命令注册行、`UsageHeatmap.tsx`、4 个 locales、`lib/api/usage.ts`、`lib/query/usage.ts`）。
  - 3af55c39 fix(codex)：MoArk 预设获得模型目录与原生 Responses 格式（`codex_config.rs`、`src/config/codexProviderPresets.ts`、`tests/config/moarkProviderPresets.test.ts`）。
  - e40ebb6e fix(codex)：隐藏模板下仍列出显式配置的模型（`codex_config.rs`）。
  - 02759c67 fix(proxy)：转换后的 function tools 标记 non-strict（`proxy/providers/transform_responses.rs`）。
  - 36c8b87e fix(linux)：Wayland 首次显示与托盘重新显示恢复标题栏控件（`lib.rs`、`lightweight.rs`、`linux_fix.rs`、`tray.rs`、`Cargo.toml`、`Cargo.lock`、三语 FAQ）。
  - d90de1ba fix(updater)：Linux 包自动更新（`package.json`、`pnpm-lock.yaml`、`.github/workflows/release.yml`）。
  - c5233fe7 fix(apps)：Claude Code npm 安装启用原生 setup（`commands/misc.rs`、`apps/useToolManagement.ts`）。
  - a40adef3 fix(usage)：Grok Build 会话用量 60s 后导入（`services/session_usage_grokbuild.rs`）。
  - b1752e1c ci(release)：latest.json 校验要求 deb/rpm 签名（`.github/workflows/release.yml`）。
  - 5ae6ad38 / 7d800c4d / faae0e4d ci(wsl)：WSL2 夜间测试链与测试标记（`src-tauri/src/lib.rs` 测试相关行等）。
  - a7f66764 chore(github)：issue 模板列出十个应用。
  - 5dd824c7 docs(readme)：四份 README v4.0 重写。
  - efd236a4 docs(manual)：用户手册 v4.0 重写与图片清理。
  - cf02f670 chore(release) v4.0.5：4 个版本文件 + `CHANGELOG.md`。
  - 2db86e94 docs(release)：v4.0.5 三语发行说明 + `src/whats-new/4.0.5.json`；01ee685d docs(release)：v4.0.4 说明口径调整。
- 不做部分 cherry-pick：同步范围是 v4.0.5 tag 前的全量新增提交，一次 rebase 完成。
- 上游本轮在 `docs/user-manual/**` 删除了若干过时图片文件；这些文件不在 fork 白名单，随上游落地。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 25 个文件：5 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、fork 重写与裁剪文件（`README.md`、`.github/workflows/release.yml`）、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/provider.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs`、`src-tauri/src/services/provider/mod.rs`）、前端共享文件（`src/types.ts`、`src/components/providers/EditProviderDialog.tsx`、`src/components/providers/forms/ProviderForm.tsx`、`src/config/codexProviderPresets.ts`）、4 个 i18n locales、`tests/components/EditProviderDialog.test.tsx`。
- 仅上游改动、无 fork 改动的文件直接落上游版本：`UsageHeatmap.tsx`、`src/lib/api/{copilot,usage}.ts`、`src/lib/query/usage.ts`、`src-tauri/src/codex_config.rs`、`src-tauri/src/proxy/copilot_optimizer.rs`、`src-tauri/src/proxy/providers/{copilot_auth,copilot_model_map,transform_responses}.rs`、`src-tauri/src/{linux_fix,lightweight}.rs`、`src-tauri/src/commands/{usage,provider}.rs`、`src-tauri/src/services/{usage_stats,session_usage_grokbuild}.rs`、`src/components/providers/forms/hooks/useDraftEditorProjection.ts`、`src/components/apps/useToolManagement.ts`、`README_ZH/DE/JA.md`、`CHANGELOG.md`（fork 在本轮区间未改动）、`docs/release-notes/v4.0.5-*.md`、`docs/user-manual/**`、`.github/ISSUE_TEMPLATE/**`、`src/whats-new/4.0.5.json`、上游新增测试与 fixture。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游 v4.0.5 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：以上游本轮改动为基础（all-time 热力图命令注册、Wayland 标题栏/托盘重显链路、WSL 夜间测试相关行）；叠加并保持 fork —— 移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册；不得因重放复活 updater 链路。
  - `src-tauri/src/tray.rs`：以上游 Wayland 修复改动为基础；叠加 fork 的左键单击切换逻辑（本轮 fork 侧 32 行改动是重点保留对象，两处都涉及托盘构建路径，须逐行复核合并结果）。
  - `src-tauri/src/provider.rs`、`src-tauri/src/services/provider/mod.rs`：以上游 Copilot 托管账户字段与路由改动为基础；叠加 fork 侧既有改动（provider 字段读写与连通性测试相关接线），保持两侧语义并存。
  - `src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/proxy/providers/{claude,codex,mod}.rs`：以上游 Copilot Responses/Chat 路由（forwarder 大规模重写）为基础；叠加 fork 的 connectivityTest sanitize 隔离与相关命令/模块注册，模块声明取上游新增 + fork 新增并存。
  - `src-tauri/src/commands/misc.rs`：以上游 npm native setup 改动为基础；保持 fork 的连通性测试命令注册与 `connectivityTest` sanitize 隔离。
  - `src/components/providers/forms/ProviderForm.tsx`：以上游 Copilot 托管账户接线（+87 行）为基础；叠加 fork 的跨应用导入接线（`ProviderImportEntry` + `useProviderImportApply`，编辑/新建两条同步路径，fork 侧本轮存量 213 行改动）。
  - `src/components/providers/EditProviderDialog.tsx` 与 `tests/components/EditProviderDialog.test.tsx`：以上游改动为基础；叠加 fork 侧既有改动与 fork 测试用例（fork 侧测试 47 行）。
  - `src/types.ts`：以上游新增类型为基础；叠加 fork 的 `websiteUrl2`、`VisibleSidebarPanels` 等类型段。
  - `src/config/codexProviderPresets.ts`：以上游 MoArk 模型目录与 Responses 格式预设为基础；叠加 fork 预设接口的 `hidden?: boolean` 字段与官方预设过滤接线（fork 白名单口径不变，上游新增 MoArk 预设按 fork 过滤规则判定是否可见）。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游新增键（Copilot 能力、all-time 热力图、Wayland 说明等）与删改键按上游执行；保留 fork 的 `devpanel` 段与 `connectivityTest` / `connectivityCheck` 等 fork 键段，合并后 fork 键不得缺失。
  - 5 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 取 fork 版本号 4.0.5-1（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）；`pnpm-lock.yaml` 以上游依赖变动为基础，保持 fork 侧 `tailwindcss-animate` 等 devDependency 修复不回退；`Cargo.toml`/`Cargo.lock` 接收上游新增依赖（Wayland 相关）同时保持 fork 移除 updater 插件后的依赖状态。
  - `.github/workflows/release.yml`：保留 fork 裁剪版（仅 Windows x64 与 macOS arm64 unsigned、跳过上游 tag 发版）；上游 b1752e1c 的 deb/rpm 签名校验与 d90de1ba 的 Linux 包自动更新步骤不引入 fork 发布链路。
  - `README.md`：保留 fork 重写版；上游 5dd824c7 的 v4.0 版式更新不覆盖 fork 差异说明。
- 本轮 fork 侧未改动的共享文件（`AboutSection.tsx`、`GeneralSection.tsx`、`settings.rs`、`commands/settings.rs`、`database/**`、`App.tsx`、`Sidebar.tsx`、`ProviderCard*.tsx`、`ModelQuickSwitch/`、`SearchableModelPicker*`、`ClaudeFormFields.tsx` 等）随上游与重放自然落地，fork 语义保持既有状态；`AboutSection.tsx` 需确认 fork 的 tunecc Releases 指向与更新器禁用仍在（上游 `src/whats-new/4.0.5.json` 会让 whats-new 摘要入口显示 v4.0.5 条目）。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 上游 v4.0.5 未改动 `src-tauri/src/database/**`（仍为 20），本轮不新增迁移步骤；后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少 `docs/comet/specs/upstream-sync/spec.md`，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- 撤销能力关联（若后续改为关联）后，Runtime 在 `new` 时生成的 `specs/<capability>/delta.yaml` 模板残留会让 Shape 准备持续失败，须删除残留模板；本轮 change 未关联能力，不生成 `delta.yaml`。
- Builder 交接的检查计划字段须用 Runtime 形态 `{id,name,executable,argv,cwdRef,timeoutMs,repeatable}`；Verifier 重派发不得改动已冻结候选的检查计划。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.5-1`（同步前工作树为 4.0.4-1，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.5 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由用户在 Shape 的 Q1 明确授权，执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- 若 Q1 授权发布（本轮已授权，方式 A）：随后在归档提交上创建 annotated tag `v4.0.5-1` 并 `git push origin v4.0.5-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + `hidden` 字段 + 表单接线）。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移）。
- 托盘图标左键单击切换主窗口显示/隐藏。
- 从其他已启用应用导入供应商配置。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册）。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/lib.rs` 与 `src-tauri/src/tray.rs`（上游 Wayland 标题栏/托盘重显链路与 fork 左键切换、更新器移除并存）、`src-tauri/src/provider.rs` 与 `src-tauri/src/services/provider/mod.rs`、`src-tauri/src/proxy/forwarder.rs` 与 `src-tauri/src/proxy/providers/*`（上游 Copilot 托管账户路由与 fork connectivityTest sanitize/命令注册并存）、`src-tauri/src/commands/misc.rs`（上游 npm native setup 与 fork 连通性测试命令并存）、`src/components/providers/forms/ProviderForm.tsx` 与 `EditProviderDialog.tsx`/其测试（上游 Copilot 接线与 fork 跨应用导入并存）、`src/types.ts`（上游新增类型与 fork `websiteUrl2`/`VisibleSidebarPanels` 并存）、`src/config/codexProviderPresets.ts`（上游 MoArk 目录与 fork `hidden` 过滤并存）、4 个 locales、`README.md` 与 `.github/workflows/release.yml`（白名单保留 fork 侧的上游改动不引入）、`CHANGELOG.md`（本轮 fork 侧无改动，取上游版本）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。
- 上游测试的零点窗口（本轮实测记录，不改变任何验收要求）：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min / 1h / 3h / 4h / 5h` 构造会话，却断言存在「今天」分桶；本地时间落在 00:00–00:30 时 `now - 30min` 已属于前一天，该桶不存在，用例必然失败。该测试文件与 `src/components/sessions/SessionManagerPage.tsx` 在同步前后逐字节相同（fork 自 2026-03-06 起就带这个用例），因此与本次同步无关：00:30 之后跑出的正式结果才算数。同步过程中跨越零点时，遇到该单项失败先查时钟窗口再查实现，不要据此改动上游文件或放宽 A9。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q1 授权推送 main 与（如授权）tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = ed82e862，安全分支 `pre-sync-v405` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q1 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
