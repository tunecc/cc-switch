# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.12 发布头（tag `v4.0.12` = `51ac86f1`），fork 侧 143 个魔改提交（`v4.0.10..main`，含 v4.0.10 的同步提交、归档提交、文档提交与 deeplink 测试竞态修正提交）按原顺序重放保留，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.10-1` 升为 `4.0.12-1`；全部验收项通过且用户接受验收结果、归档提交生成后，按 Q1 授权的交付方式上传 origin。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v412/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v412/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v412`（= 同步前 main `1ec0fc08`，该提交同时是 origin/main），仅用于回退参照与重放前后 diff 对照，不是工作区分支。
- 随上游 rebase 落地的上游新增文件 25 个：
  - 后端：`src-tauri/src/commands/tool_uninstall.rs`、`src-tauri/src/commands/tool_node_requirement.rs`。
  - 前端组件：`src/components/apps/ManualUninstallDialog.tsx`、`src/components/apps/ToolUninstallConfirmDialog.tsx`、`src/components/apps/toolUninstallCommands.ts`、`src/hooks/useUsageAutoRefresh.ts`、`src/whats-new/4.0.11.json`、`src/whats-new/4.0.12.json`。
  - 本地化：`src/i18n/locales/tr.json`（上游新增土耳其语，4109 个叶子键）。
  - 图标与素材：`src/icons/extracted/grooroute.jpg`、`src/icons/extracted/streamlake.svg`、`assets/partners/logos/grooroute-banner.jpg`。
  - 测试：`tests/components/{DailyMemoryPanel,UsagePage,UsagePanelMotion,WorkspaceFileEditor}.test.tsx`、`tests/hooks/{useUsageAutoRefresh,useUsageEventBridge}.test.tsx`、`tests/i18n/turkishDetection.test.ts`。
  - 文档：`docs/release-notes/v4.0.1{1,2}-{zh,en,ja}.md`（6 个）。
- 交付步骤（验收通过并归档后，按 Q1 授权）新增本地 annotated tag `v4.0.12-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.10-1` → `4.0.12-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。上游 `v4.0.10..v4.0.12` 对 `Cargo.toml`/`package.json`/`tauri.conf.json`/`Cargo.lock` 的改动只有版本号行，本轮没有新增或移除任何依赖。
- fork 专属文件 `src/config/forkOfficialAllowlist.ts`（按 Q2 授权，在上游改动落地后单独提交）：为 claude、claude-desktop、codex、hermes 各追加 `Ollama`、`LM Studio`、`llama.cpp`、`vLLM`，为 openclaw 追加 `LM Studio`、`llama.cpp`、`vLLM`，为 opencode 追加 `Ollama`、`llama.cpp`、`vLLM`，为 pi 追加 `Ollama`、`LM Studio`、`vLLM`（名称逐字取自上游 `v4.0.12` 各预设文件里 `category: "local"` 条目的 `name` 字段）；`gemini` 与 `grokbuild` 保持各自的官方条目（上游这两个 app 无 local 分类条目），`mcode` 保持 `[]`。`filterForkPresets` 的判定实现与 `forkPresetFilter.ts` 不改。该文件不在上游改动集内，不参与 rebase 冲突。
- 34 个上游/fork 重叠文件（完整清单与逐文件叠加要求见完整目标规格「冲突解决」）：4 个版本与锁文件、`README.md`、6 个后端文件（`src-tauri/src/{lib,settings}.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/tray.rs`）、8 个前端文件（`src/App.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src/components/providers/ProviderList.tsx`、`src/components/providers/forms/{ClaudeDesktopProviderForm,ProviderForm}.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/components/universal/UniversalProviderFormModal.tsx`）、8 个 `src/config/*ProviderPresets.ts`、4 个 `src/i18n/locales/*.json`、3 个测试文件（`tests/components/{DeepLinkImportDialog,ProviderList,ProviderPresetSelector}.test.tsx`）。
- 上游本轮改动、fork 侧未触碰的其余 94 个文件随 rebase 直接落地（含 `src-tauri/src/services/**`（`session_usage_codex.rs`、`session_usage_pi.rs`、`webdav_sync/archive.rs`）、`src-tauri/src/proxy/http_client.rs`、`src/components/apps/**`（`AppsPage.tsx` 与工具卸载三个新文件）、`src/components/providers/forms/presetGroups.ts`、`src/hooks/useUsageAutoRefresh.ts`、`src/i18n/index.ts`、`src/whats-new/4.0.1{1,2}.json`、`CHANGELOG.md`、`README_{ZH,DE,JA}.md`、`docs/user-manual/**`、`docs/release-notes/**`。上游本轮**未触碰** `src-tauri/src/commands/{mod,settings}.rs`、`src-tauri/src/database/**` 与 `docs/guides/**`（`git diff v4.0.10 v4.0.12` 对这三个路径零命中）；工具卸载等新模块是以 `#[path]` 声明在 `src-tauri/src/commands/misc.rs:16-19`，对外命令注册在 `src-tauri/src/lib.rs`。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（`tray.rs` 的土耳其语托盘文案与 fork `toggle_main_window`/`hide_main_window`、`commands/misc.rs` 的 Windows PATH 恢复与工具卸载 + fork 1 行、`ProviderList.tsx` 的上游搜索框位置与聚焦改造（searchSlot / focusSearch；每行卸载溢出菜单在应用页 AppsPage.tsx）与 fork 右键置顶置底、`settings.rs` 与 `lib/api/settings.ts`、`App.tsx`、`GeneralSection.tsx`、`UniversalProviderFormModal.tsx`、8 个预设文件、4 个 locales 与新增 tr.json 的处理口径、版本与锁文件只有版本号行等），确有新增 fork 专属文件时才补充条目。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.12`（`51ac86f1`）：当前 merge-base `90fb37ff`（v4.0.10）→ 目标 `51ac86f1`；fork 侧 143 个提交（`v4.0.10..main`）按原顺序重放。

### 删除

- 无文件删除：上游 `v4.0.10..v4.0.12` 的改动集里没有文件被删（`git diff --name-status --diff-filter=D v4.0.10 v4.0.12` 零命中），fork 侧本轮也不删文件。
- 只随上游删除代码片段与文案键：上游 `c760c8cb`/`d6d46c35` 移除 ClaudeAPI 与 Code0 的赞助位与推广文案、`c83cd728` 删除 OpenCode 自带内置项的重复预设、`3069b556` 隐藏 Mistral 路由型预设。fork 已删除的 `stream_check` 链路与 updater 相关实现不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v412` 是安全参照分支，不是工作区分支）。
- 不新增 fork 专属代码文件（本轮 fork 侧无新魔改，白名单表只修订既有条目）。
- 不创建 PR、不合并其他分支、不推送除 Q1 授权的 `origin main` 与 tag `v4.0.12-1` 之外的任何远端引用。
- 不新增数据库迁移脚本或推进 schema 版本（上游 v4.0.12 仍为 20，fork 保持 21）。
- 不引入新的 Rust/npm 依赖（上游本轮未改依赖，只改版本号行）。
- 不改 `forkPresetFilter.ts` 的过滤判定实现，也不改 `forkOfficialAllowlist.ts` 既有的官方预设条目；本轮只按 Q2 追加本机推理（`category: "local"`）条目。
- 不给 `src/i18n/locales/tr.json` 补任何 fork 键（按 Q3 决定保持与上游 tag 逐字节一致，fork 专属文案在土耳其语下由 `fallbackLng: "en"` 回退英文）。
- 不创建临时脚本或额外目录；`docs/comet/changes/sync-upstream-v412/` 是唯一新增的 change 产物目录。

## 上游本轮同步范围（v4.0.10..v4.0.12）

- 67 个提交、128 个文件、约 +19593/−1014 行（含 `tr.json` 的 4759 行），按主题分组：
  - 工具卸载与应用页（v4.0.11 `dbb81ea2`、v4.0.12 `f7696fa8`、`6a232cab`、`ae778b4f`、`74d43799`、`30fcd90a`、`06805090`）：新增 `commands/tool_uninstall.rs`（+1673，`prepare_tool_uninstall` 枚举每个安装、给出可执行计划或必须手删的原因，执行时重新枚举并拒绝与预览不一致的路径；Grok 0.2.112+ 安装集合、原生卸载同时删搜索目录里指向同一二进制 launcher 符号链接；原生安装在 `[cli] installer = "npm"` 时把 npm 副本标记为「会被工具自身更新装回」）、`commands/tool_node_requirement.rs`（+309，npm 工具更新前先检查 Node 版本）、`src/components/apps/{ManualUninstallDialog,ToolUninstallConfirmDialog,toolUninstallCommands}`、卸载入口移入每行溢出菜单、列对齐与布局不抖动。
  - Windows CLI 生命周期（v4.0.11 `479964f2`、v4.0.12 `74d43799`）：`commands/misc.rs`（上游 +375/−68）恢复用户 PATH 供 CLI 生命周期命令使用、`run_windows_tool_command_capture` 与 mise/node 搜索路径改造、配套测试。
  - 本机推理预设与 Local 分组（v4.0.12 `8686c165`、`d5b729a5`、`16964d7c`、`936aec4a`、`c6263cc9`、`8b7d71c1`）：`src/types.ts` 的 `ProviderCategory` 新增 `"local"`；带 `category: "local"` 条目的 app 与名称为 claude、claude-desktop、codex、hermes 各 `Ollama`/`LM Studio`/`llama.cpp`/`vLLM` 4 条，openclaw `LM Studio`/`llama.cpp`/`vLLM` 3 条，opencode `Ollama`/`llama.cpp`/`vLLM` 3 条，pi `Ollama`/`LM Studio`/`vLLM` 3 条；gemini、grokbuild、mcode 无 local 条目；新增 LM Studio、llama.cpp、vLLM 图标；`openclawProviderPresets.ts`（上游 +1322/−115）、`codexProviderPresets.ts`（+1142/−106）、`hermesProviderPresets.ts`（+717/−22）为本轮最大上游改动面。
  - 云与聚合站预设（v4.0.11 `438834fe`、`3700af35`、`3c918cd0`、`84464e7e`、`e48b84d6`；v4.0.12 `4bc74d02`、`3c2a72ca`、`0a129e94`、`ae111a4b`、`cc43c8ba`、`18935228`、`b76b22c8`、`2cde53dd`、`627e89c0`、`e779974c`、`73e07a1e`、`c85f8782`、`7adbc51d`、`ff443477`、`d1592fb1`、`23dc945e`、`453cdaf9`）：GrooRoute Pro（8 个 app + banner 素材与邀请链接）、SoruxGPT Coding Plan、AIComing、StreamLake China/Vanchin 与 Codex、Cloudflare AI Gateway、Mistral AI、Fireworks、Microsoft Foundry、Hugging Face、DigitalOcean、SambaNova、Groq、Nebius Token Factory、Vercel AI Gateway、DeepInfra、Meta Model API、Baseten、Ollama Cloud、SiliconFlow（opencode）；AIGoCode 站点改址。
  - 预设治理（v4.0.12 `3069b556`、`c83cd728`、`d6d46c35`、`c760c8cb`）：隐藏 Mistral 路由型预设并保持预设 id 稳定、删除 OpenCode 自带内置项的重复预设、去掉 ClaudeAPI 与 code0 的合作标记与推广文案（含四语 README 条目）。
  - 土耳其语与语言回退（v4.0.12 `c21106ff`、`d1592fb1`、`5b6d317f`、`e5eeb166`）：新增 `src/i18n/locales/tr.json` 与 `src/i18n/index.ts` 的 `tr` 注册、`src/types.ts` 的 `language` 联合类型加 `"tr"`、`tray.rs` 的托盘土耳其语（该文件上游整体 +77/−10：新增 `map_locale_to_tray_language` 与 `TrayTexts` 的 `tr` 变体，`TrayTexts` 结构自身在 impl hunk 里新增 61 行）、`tests/i18n/turkishDetection.test.ts`、系统语言不受支持时改用英文、土耳其语选项去掉「社区翻译」后缀、澄清「在应用页隐藏应用」的文案。
  - 用量统计（v4.0.11 `c05906bb`、`9719b7b3`、`c859026d`；v4.0.12 `7a8087f6`、`cc81627a`、`4958863a`）：Codex rollout 分页合并以解析 fork 父级、跳过未变更的延迟 Codex rollout、coding-plan 用量对所有 app 默认启用；新增 `src/hooks/useUsageAutoRefresh.ts`（页面打开时按所选间隔扫描会话日志）与配套测试；Pi 会话历史速度估算恢复（`services/session_usage_pi.rs` +237/−3，`session_usage_codex.rs` +610/−57）。
  - 深链接（v4.0.11 `b13797e3`）：导入的 coding-plan 用量默认启用，`deeplink/provider.rs` 相应改动（上游 +45/−3）。
  - 批量操作反馈（v4.0.11 `6b4c09ac`、`1ef555df`）：MCP 与 skills 批量失败显示 error/warning toast。
  - 其他修复（v4.0.12 `b1941307`、`c11c7cf1`、`866b93b4`、`061d24c8`、`74b98ca9`、`49d529fb`、`31c6f574`；v4.0.11 `d9a62313`）：WSL 下 `piConfigDir` 指向 9P 时跳过被拒绝的 syscall、代理上游错误体为空时明确说明、终止响应后不再重复发出流错误、重复点击当前页仍保留未保存更改守卫、skills 恢复失败后保留快照、供应商搜索面板不再遮住卡片操作、搜索框移到首行末尾、面板闪烁。
  - 发版（`3b3c3f0b`、`2635dfff`、`edf32204`、`51ac86f1`）：两轮 `CHANGELOG.md` 与四处版本号、六份三语 release-notes、`src/whats-new/4.0.11.json` 与 `4.0.12.json`。
- 不做部分 cherry-pick：范围是 `v4.0.10..v4.0.12` 的全量新增提交，一次 rebase 完成。
- `upstream/main` == `51ac86f1` == tag `v4.0.12`，本轮基线即上游最新头，没有需要排除的 post-release 提交；上一轮排除的 `d9a62313`（面板闪烁）已随 `3b3c3f0b` 进入 v4.0.11，本轮纳入基线。

# 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加与 Q2/Q3 明确授权的内容）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等）。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 幂等修复迁移）；上游 v4.0.12 的 `SCHEMA_VERSION` 仍为 20，工具卸载与新预设都不引入 schema 变更。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q1 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 `stream_check` 链路）。上游新文案里的 `toolUninstallReinstalledByUpdater` 等「updater」指工具 CLI 自身的更新器，不是应用内更新器，不因此复活任何 fork 已删实现。
- 不引入上游 Linux flatpak/deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）；`.github/workflows/**` 与 `pnpm-lock.yaml` 本轮不在上游改动集内。

# 验收示例

- A1: rebase 后 `git merge-base main upstream/main` 等于 `51ac86f1`（tag `v4.0.12` 指向的提交），`git log v4.0.12..main` 只包含 fork 提交、不含任何上游提交。
- A2: 重放前 `v4.0.10..main` 的 143 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因；每次冲突停车逐条记录归属与解法。
- A3: 34 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.12-1` 且未被引入新依赖；`src-tauri/src/tray.rs` 同时具备上游土耳其语托盘文案与 fork 的 `hide_main_window`/`toggle_main_window`；`src-tauri/src/commands/misc.rs` 以上游 Windows PATH 与工具生命周期改造为基础并保留 fork 的 1 行改动；`src/components/providers/ProviderList.tsx` 以上游的 `searchSlot` 挂载位置、`focusSearch` 复用与搜索框不再遮挡卡片为基础，并保留 fork 的右键置顶/置底与新建插入第二位；`src/App.tsx`、`GeneralSection.tsx`、`UniversalProviderFormModal.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`src/types.ts`、`src/lib/api/settings.ts`、`src-tauri/src/{lib,settings}.rs`、`deeplink/provider.rs`、`proxy/forwarder.rs` 与 8 个预设文件、4 个 locales、3 个测试文件按规格逐文件要求叠加，两侧语义并存、无整文件取一侧。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.12-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件（`vite.config.ts` 的 `__CCS_FORK_BUILD__`、`.github/workflows/{ci,release}.yml` 裁剪、`src/config/fork*` 等）未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/hooks/useUsageAutoRefresh.test.tsx`、`tests/hooks/useUsageEventBridge.test.tsx`、`tests/i18n/turkishDetection.test.ts`、`tests/components/{UsagePage,DailyMemoryPanel,UsagePanelMotion,WorkspaceFileEditor,AppsPage}.test.tsx`、`tests/config/codexReasoningLevelPresets.test.ts`）与 fork 既有用例。
- A10: `pnpm format:check` 通过（fork CI 的 Frontend Checks 依次跑 typecheck → format:check → test:unit → build:renderer，手工拼接共享文件后必须本地归一化格式）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（本轮唯一合法改动是 `cc-switch` 包版本号行）。
- A13: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录），含上游新增的工具卸载与 PATH 恢复用例。
- A14: 落地保真核对通过：对 34 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.10`、`v4.0.12`、`pre-sync-v412`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位（rebase 的三方合并会留下重复键且测试全绿，必须显式查重）；新增的 `src/i18n/locales/tr.json` 与 `git show v4.0.12:src/i18n/locales/tr.json` 逐字节一致（Q3：不补 fork 键）。
- A16: 上游本轮新增能力全部落地且可用：工具卸载（含选择安装副本、Grok 布局、手动命令对话框、Node 版本检查）、本机推理 Local 分组与新预设数据、土耳其语界面与托盘、用量按所选间隔自动刷新、Codex rollout 分页合并与延迟跳过、Pi 速度估算、MCP/skills 批量失败 toast、Windows CLI PATH 恢复；fork 已删除的 updater 与 `stream_check` 实现未被任何一项带回。
- A17: 按 Q2 追加白名单条目后可见性正确：fork 构建下 claude、claude-desktop、codex、hermes 的本机推理可选条目为 `Ollama`/`LM Studio`/`llama.cpp`/`vLLM`，openclaw 为 `LM Studio`/`llama.cpp`/`vLLM`，opencode 为 `Ollama`/`llama.cpp`/`vLLM`，pi 为 `Ollama`/`LM Studio`/`vLLM`；`gemini`/`grokbuild` 仍只显示各自的官方预设、`mcode` 仍只显示自定义；赞助商与聚合站预设仍被默认拒绝；`IS_FORK_BUILD` 为 false 时过滤不生效，预设列表与上游完全一致。

# 约束与不变量

- fork 全部 143 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前用安全分支 `pre-sync-v412`（= 当前 main `1ec0fc08`）固定起点；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 重放中途不能跑 `cargo test`：fork 历史提交自身带未清理冲突标记（上一轮实测区间内 69 个提交的 tree 含标记），只有 rebase 完成后才能编译校验；最终态必须对 `<<<<<<<` 与 `>>>>>>>` 标记零命中。
- 取证命令口径：`git grep` 查冲突标记用 `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> '`（`--name-only` 会被当成 pathspec 造成假阴性）；patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`），`git patch-id --stable <hash>` 返回空串会把全部提交误判为不同。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- 合并两侧 JSX/Rust 禁止按行去重，必须整块拼接后核对括号与花括号平衡。
- `src-tauri/src/tray.rs`、`src-tauri/src/commands/misc.rs`、`src/components/providers/ProviderList.tsx`、`tests/components/ProviderList.test.tsx`、4 个 locales、`src/types.ts`、`src/lib/api/settings.ts` 是本轮高危叠加面：出现「整文件取一侧」的省事解法即视为丢语义缺陷（`lib.rs` 与 `commands/settings.rs` 还要确认 updater 链路未被带回）。
- `tray.rs` 本轮上游加土耳其语托盘文案与 `map_locale_to_tray_language` 分支；fork 的 `hide_main_window`/`toggle_main_window` 两个 helper 与 `lib.rs` 的左键分支必须并存。
- `ProviderList.tsx` 本轮上游改动 +115/−85（`searchSlot` 挂载位置、`focusSearch` 复用、搜索框移到列表上方第一行最右端且不遮挡卡片；每行溢出菜单的卸载入口属应用页 `AppsPage.tsx`），fork 侧 +229/−10（右键置顶/置底、模型徽章、批量连通性入口）；两侧菜单项必须并存，不得用上游版本覆盖 fork 菜单。
- `.comet/config.yaml` 与 `docs/comet/**` 按 fork 侧保留，是 Native 工作流继续运转的前提；历史重放可能把 `.comet/config.yaml` 改回旧内容，涉及该文件或重放结束后必须核对，被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- current 工作区在 main 上 rebase：检出新基线瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」；版本号、locales、`lib.rs`、`settings.rs`、`tray.rs`、`ProviderList.tsx`、`Cargo.toml`/`Cargo.lock` 属高频误删点。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。

# 决策

- 同步基线：tag `v4.0.12` = `51ac86f1`。理由：项目既定的 fork 同步惯例是只锁已发布上游 tag；本轮 `upstream/main` 恰与 tag `v4.0.12` 同一提交，无需排除 post-release 区间。与过去 12 轮一致。
- 隔离方式：当前目录（`current`），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；同步必须直接改写 main 历史，与过去各轮同步一致。
- 能力关联：不关联 `upstream-sync` capability，change 直接以完整目标规格 `specs/upstream-sync/spec.md` 管理。理由：该能力既有总规格是纯散文、无受管 `### Requirement:` 小节，关联模式不允许整份重写 prose；沿用过去各轮惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：`4.0.10-1` → `4.0.12-1`；`-1` 表示上游 4.0.12 上的第一代 fork 构建，四处版本文件一致，`Cargo.lock` 由 `cargo check` 联动。理由：跳过的 4.0.11 不单独构建，fork 构建代数只在同一上游版本内累加。
- 数据库 schema：上游 v4.0.11 与 v4.0.12 的 `SCHEMA_VERSION` 均为 20（`src-tauri/src/database/**` 不在上游本轮改动集内）；fork 侧保持 21，v20→v21 幂等修复迁移原样保留，不新增迁移步骤。
- Rust/npm 依赖：上游 `v4.0.10..v4.0.12` 对 `src-tauri/Cargo.toml` 与 `package.json` 的改动只有版本号行，本轮无新增依赖；`Cargo.toml` 合并结果必须保持 fork 移除 `tauri-plugin-updater` 的状态，`Cargo.lock` 只允许 `cc-switch` 条目版本号一行变化。
- `README.md`：整文件保留 fork 重写版（上游本轮改动为 ClaudeAPI/code0 赞助位移除与四语「community-translated Turkish」措辞，fork README 不含赞助商表、只记录 fork 差异）；`README_{ZH,DE,JA}.md` fork 侧从未触碰，随上游落地。
- `CHANGELOG.md`、`docs/user-manual/**`、`docs/release-notes/**`、`src/whats-new/**`：fork 未改过，随上游落地。`docs/guides/**` 同样 fork 未改过，但上游本轮未改该目录（`git diff v4.0.10 v4.0.12 -- docs/guides` 零命中），本轮没有内容落地。
- `.github/workflows/{ci,release}.yml`：上游本轮未改，保留 fork 裁剪版（仅 Windows x64 + macOS arm64 unsigned，跳过上游 tag 发版）。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- Q1（交付授权，2026-10-15 用户选择 A）：验收通过并用户接受结果、生成归档提交后，执行 `git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.12-1` 并 `git push origin v4.0.12-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端引用；执行前无需重复询问。
- Q2（新 Local 预设可见性，2026-10-15 用户选择 C「所有 Local 预设都加白名单」）：为上游 `category: "local"` 的预设追加 `forkOfficialAllowlist` 条目，覆盖全部含 local 条目的 app —— claude、claude-desktop、codex、hermes（各 `Ollama`/`LM Studio`/`llama.cpp`/`vLLM`）与 openclaw（`LM Studio`/`llama.cpp`/`vLLM`）、opencode（`Ollama`/`llama.cpp`/`vLLM`）、pi（`Ollama`/`LM Studio`/`vLLM`）。选项文字当时列了六个 app，实测 `codexProviderPresets.ts` 也有 4 条 local 条目，按「所有」的意图一并纳入并在规格中写明。`gemini`/`grokbuild` 上游无 local 条目，仍只保留各自的官方预设（`Google Official` / `Grok Official`），`mcode` 保持 `[]`。赞助商与聚合站预设继续默认拒绝。
- Q3（tr.json 的 fork 专属键，2026-10-15 用户选择 A）：不给 `src/i18n/locales/tr.json` 补 fork 键，保持与上游 `v4.0.12` 逐字节一致；土耳其语下 fork 专属文案由 `fallbackLng: "en"` 回退英文。理由：不新增 fork 重叠文件，未来每轮同步 tr.json 零冲突成本，回退行为与缺键现状一致。

# 未决问题

- 无。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.12^{commit}`、`git log --oneline v4.0.12..main`、`git rev-list --count`（重放前后）、提交主题序列逐行 diff、patch-id 对照（走 stdin）、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照、全树冲突标记 grep
- 落地保真核对：按 A14 的四 ref 归一化行多重集算法逐文件比对（34 个重叠文件），非零项逐行归类
- locale 查重：4 个既有 locale JSON（zh/en/ja/zh-TW）逐文件解析 + 同名重复键检测，fork 键段逐个 key 比对；`src/i18n/locales/tr.json` 与 `git show v4.0.12:src/i18n/locales/tr.json` 逐字节一致（Q3）
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支（`toggle_main_window`/`hide_main_window`）、fork CI 矩阵、预设过滤接线与 8 个预设文件的 `hidden` 字段、`EndpointField.rightSlot`、`SearchableModelPicker`、`hasCustomModelMapping`、1M 全选、兜底模型直达区、模型徽章、双官网链接、跨应用导入接线、4 个 locale 的 fork 键段、`lib.rs`/`commands/settings.rs` 中 `updater` 命中数为 0、`ProviderList.tsx` 的右键置顶/置底菜单项
- 上游功能落地抽查：`commands/tool_uninstall.rs` 与 `commands/tool_node_requirement.rs` 及其在 `commands/misc.rs:16-19` 的 `#[path]` 模块声明与 `lib.rs` 命令列表里的 `prepare_tool_uninstall` 注册、`src/components/apps/{ManualUninstallDialog,ToolUninstallConfirmDialog}` 与 `toolUninstallCommands.ts`、`src/hooks/useUsageAutoRefresh.ts`、`src/i18n/locales/tr.json` 与 `src/i18n/index.ts`/`tray.rs` 的土耳其语、`src/types.ts` 的 `"local"` 分类与各预设文件的本机推理条目与图标、`services/session_usage_codex.rs` 的分页合并与延迟跳过、`services/session_usage_pi.rs` 的速度估算、`commands/misc.rs` 的 Windows PATH 恢复、MCP/skills 批量失败 toast、`src/whats-new/4.0.1{1,2}.json` 与六份三语 release-notes
