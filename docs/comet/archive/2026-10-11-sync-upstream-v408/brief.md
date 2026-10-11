# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.8 发布头（tag v4.0.8 = df40d53c），fork 侧 133 个魔改提交（v4.0.7..main，含 v4.0.7 的同步提交、归档提交与规格修正提交）按原顺序重放保留，无丢失、无行为回归；版本号按惯例从 4.0.7-1 升为 4.0.8-1；验收通过并用户接受结果后，按 Q1 授权的交付方式上传 origin。

# Scope

## Directory structure

### Created

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v408/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v408/`（由 Runtime 归档动作生成）。
- 随上游 rebase 落地的上游新增文件：`src/lib/api/model-fetch.test.ts`、`tests/components/CodexFormFields.test.tsx`、`src/whats-new/4.0.8.json`、`docs/release-notes/v4.0.8-{zh,en,ja}.md`。
- 交付步骤（验收通过并归档后，按 Q1 授权）新增本地 annotated tag `v4.0.8-1`。

### Modified

- 版本号三文件：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（4.0.7-1 → 4.0.8-1）。
- `src-tauri/Cargo.lock`：`cc-switch` 包版本号联动（由 `cargo check` 更新）。
- 12 个上游/fork 重叠文件：`src-tauri/src/lib.rs`、`src/components/providers/forms/ClaudeFormFields.tsx`、`src/components/settings/SettingsPage.tsx`、`src/lib/api/settings.ts`、`src/i18n/locales/{zh,en,ja,zh-TW}.json`（取上游 + 叠加 fork 语义），以及上述 4 个版本/锁文件。
- 上游独有改动文件 26 个，fork 侧从未触碰，随 rebase 直接落地（`src-tauri/src/codex_config.rs`、`src-tauri/src/commands/config.rs`、`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/{codex_direct,codex_official_models}.rs`、`src/components/providers/forms/{CodexFormFields,OpenCodeFormFields}.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`src/index.css`、`src/lib/api/model-fetch.ts`、`docs/design-system.html`、`CHANGELOG.md`、`docs/release-notes/v4.0.7-{zh,en,ja}.md`、`tests/components/{OpenCodeFormFields,SwitchModePanel}.test.tsx`、`tests/components/CodexFormFields.modelFetch.test.tsx`）。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：5 处共享文件叠加语义追加 v4.0.8 条目 + 1 条「仅上游改动文件不进入白名单」说明。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为同步后状态）。

### Deleted

- 无。本轮不删除任何文件；上游 v4.0.8 未删除文件。

### Not created

- 不新建 Git 分支或 worktree（隔离方式为 `current`，直接沿用 main）。
- 不新增 fork 专属代码文件（本轮 fork 侧无新魔改，白名单表只修订既有条目）。
- 不创建 PR、不合并其他分支、不推送除 Q1 授权的 `origin main` 与 tag `v4.0.8-1` 之外的任何远端引用。
- 不创建迁移脚本或改动数据库 schema（上游 v4.0.8 未推进 schema，fork 保持 21）。
- 不创建临时文件或脚本目录；`docs/comet/changes/sync-upstream-v408/` 是唯一新增的 change 产物目录。

- 把本地 main rebase 到 tag v4.0.8（df40d53c）：当前 merge-base 790ed800 → 目标 df40d53c；fork 侧 133 个提交（v4.0.7..main）按原顺序重放。
- 基线即上游 v4.0.8 发布头。本轮无 post-release 区间：`git rev-parse upstream/main` == `git rev-parse v4.0.8^{commit}` == df40d53c，`git rev-list --count v4.0.8..upstream/main` == 0，因此「锁 tag」与「跟 upstream/main」两种基线选择在本轮指向同一提交，不存在需要取舍的分叉。
- 上一轮（v4.0.7）被列为 post-release 而排除的 2 个提交本轮首次进入范围：`0b8662a4` fix(i18n)（额度帮助与备份提示文案对齐 UI 标签）、`1f786dad` docs(release)（扩充 v4.0.7 notes 的 Codex 会话压缩段落）。
- 上游新增 10 个提交（v4.0.7..v4.0.8），共 38 个文件、约 +1436/−132 行。按主题分组：
  - `315aeda7` fix(model-fetch)：Claude / Codex 表单取模型列表时带上供应商的本地代理 Header 覆盖（新增 `src/lib/api/model-fetch.ts` 的 `modelFetchRequestHeaders` helper，走既有 `parseHeaderOverrideJson` 校验规则；改 `src/components/providers/forms/{ClaudeFormFields,CodexFormFields}.tsx`、`tests/components/CodexFormFields.modelFetch.test.tsx`、新增 `tests/components/CodexFormFields.test.tsx` 与 `src/lib/api/model-fetch.test.ts`）。Codex 表单另把 `localProxyHeadersOverride` 加入模型列表失效 effect 的依赖，修掉「只改 Header 后残留上一个身份的模型列表」。
  - `74b1a98c` fix(models)：OpenCode 表单取模型列表时发送已配置的请求头，并支持「只有请求头没有 API Key」时也能拉取（`src/components/providers/forms/OpenCodeFormFields.tsx` 复用既有 `helpers/requestHeaders.ts` 的 `normalizeRequestHeaders`/`findRequestHeaderValue`；`tests/components/OpenCodeFormFields.test.tsx` +100）。
  - `4215f7ee` feat(settings)：诊断日志区新增「打开日志」按钮（`src-tauri/src/commands/config.rs` 新增 `reveal_app_log_file`、`src-tauri/src/lib.rs` +1 命令注册、`src/components/settings/SettingsPage.tsx` +24、`src/lib/api/settings.ts` +4、4 个 locales）。
  - `2e20cdcb` fix(codex)：官方模型列表取不到时说明具体原因（`officialModelsReason` 九种 code，Stack 视图新增 `noticeReasons`），并且回退后恢复可用时自动重写 client（改 `src-tauri/src/codex_config.rs`、`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/{codex_direct,codex_official_models}.rs`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts` +16、4 个 locales、`tests/components/SwitchModePanel.test.tsx` +25）。
  - `979ce6a6` fix(codex)：桌面版 Codex 自带的 CLI 也作为最后兜底候选（macOS 的 ChatGPT.app / Codex.app，Windows 的 `%LOCALAPPDATA%\OpenAI\Codex\bin\<version>\codex.exe`，`src-tauri/src/codex_config.rs` +176）。
  - `3784fd9e` fix(ui)：暗色模式三档文字色降刺眼（`src/index.css` 的 `--text-1/2/3` 与 shadcn `--foreground` 族、`--muted-foreground`；`docs/design-system.html` 同步）。
  - `0b8662a4` fix(i18n)：en/ja 额度显示帮助与 en/ja/zh-TW 备份提示文案改用 UI 实际标签。
  - `1f786dad` docs(release)：扩充 v4.0.7 notes 的 Codex 会话压缩段落。
  - `ed15cd01` chore(release) v4.0.8：`CHANGELOG.md` +26、四个版本文件。
  - `df40d53c` docs(release)：`docs/release-notes/v4.0.8-{zh,en,ja}.md`、`src/whats-new/4.0.8.json`。
- 冲突面（上游与 fork 同时改动的文件，共 12 个）：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.lock`）、后端共享文件（`src-tauri/src/lib.rs`）、前端共享文件（`src/components/providers/forms/ClaudeFormFields.tsx`、`src/components/settings/SettingsPage.tsx`、`src/lib/api/settings.ts`）、4 个 i18n locales。`pnpm-lock.yaml` 本轮不在上游改动集内（上游 v4.0.8 未动它），因此不存在该锁文件的 fork 保留段取舍。
- 上游本轮改动的其余 26 个文件 fork 侧均未触碰，随上游直接落地：`src-tauri/src/codex_config.rs`、`src-tauri/src/commands/config.rs`、`src-tauri/src/mode/{controller,stack}.rs`、`src-tauri/src/services/provider/{codex_direct,codex_official_models}.rs`、`src/components/providers/forms/{CodexFormFields,OpenCodeFormFields}.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`src/index.css`、`src/lib/api/model-fetch.ts`、`docs/design-system.html`、`CHANGELOG.md`、`docs/release-notes/v4.0.8-*` 与 `v4.0.7-*`、`src/whats-new/4.0.8.json`、`tests/components/{CodexFormFields,OpenCodeFormFields,SwitchModePanel}.test.tsx`、`tests/components/CodexFormFields.modelFetch.test.tsx`、`src/lib/api/model-fetch.test.ts`。
- 数据库 schema：上游 v4.0.8 未推进 schema（`SCHEMA_VERSION` 仍为 20，CHANGELOG 升级说明明确「No database schema change (still 20)」）；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。
- 版本号从 4.0.7-1 升到 4.0.8-1（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：§4 中与本次上游改动相关的叠加语义条目（`lib.rs` 的 `reveal_app_log_file` 注册与 fork 三段语义、`lib/api/settings.ts` 的新绑定与 fork 移除更新绑定、`SettingsPage.tsx` 的「打开日志」按钮与 fork DevPanel、`ClaudeFormFields.tsx` 的 Header 覆盖取模型与 fork 兜底模型直达区/搜索选择器、4 个 locales 的 fork 新增键段），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付（方式按 Q1）：验收通过并用户接受结果后执行 Q1 授权的动作，并把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*`、`upstream/chore/*` 等）。
- 不做部分 cherry-pick 式同步；范围是 v4.0.7..v4.0.8 的全部新增提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q1 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路、上游 v4 已删除的组件）。
- 不引入上游 Linux deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 df40d53c（tag v4.0.8 指向的提交），`git log v4.0.8..main` 只包含 fork 提交。
- A2: rebase 前 v4.0.7..main 的 133 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。
- A3: 12 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.8-1`（`Cargo.lock` 的 fork 条目、`package.json`/`Cargo.toml`/`tauri.conf.json` 的 version），共享代码以上游 v4.0.8 为基础叠加回 fork 必要语义，且上游「取模型列表带上 Header 覆盖」「OpenCode 表单用请求头拉取模型」「诊断日志打开日志按钮」「官方模型列表不可用原因与自动恢复」「桌面版 Codex CLI 兜底」「暗色文字降亮」等改动全部落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.8-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 790ed800→df40d53c」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。

# Constraints and invariants

- fork 全部 133 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前创建安全分支记录起点（`pre-sync-v408` = 当前 main 809d4e4b，该提交同时是 origin/main 与本地 tag `v4.0.7-1` 指向的提交）；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- fork 历史自带未清理的冲突标记（原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` blob 内本就有标记）：重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验；最终态必须全树零冲突标记。
- current 工作区直接在 main 上 rebase 时，检出新基线的瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行，并按 Q1 的授权范围；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」，不得为省事整文件取一侧而丢掉任何一方（版本号、locales、`lib.rs`、`SettingsPage.tsx` 属高频误删点）。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡（项目记忆既有教训）。

# Decisions

- 同步基线：tag v4.0.8 = df40d53c。理由：本轮 `upstream/main` 与 `v4.0.8^{commit}` 是同一提交（df40d53c，`git rev-list --count v4.0.8..upstream/main` == 0），锁 tag 与跟 upstream/main 无差异，不存在上一轮那样的 post-release 取舍；与过去 8 轮同步惯例一致，基线是已验证的发布头。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；且同步必须直接改写 main 历史，与过去 8 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability（change 直接以完整目标规格 `specs/upstream-sync/spec.md` 形式管理）。理由：该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 7 轮同步惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：4.0.7-1 → 4.0.8-1；`-1` 表示上游 4.0.8 上的第一代 fork 构建，四处版本文件一致。
- 数据库 schema：上游 v4.0.8 未推进 schema（仍为 20，CHANGELOG 升级说明明确「No database schema change (still 20)」），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- `CHANGELOG.md`：fork 在 v4.0.7..main 区间未改过该文件，取上游 v4.0.8 版本落地；白名单中「整文件保留 fork 侧」只在 fork 侧确有改动时生效。
- `docs/release-notes/v4.0.7-{zh,en,ja}.md`：fork 未改过，随上游 `1f786dad` 落地（该提交属上一轮排除、本轮进入范围的内容）。
- `.github/workflows/release.yml`：上游 v4.0.8 未改该文件，保留 fork 裁剪版（仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）。
- `docs/design-system.html` 与 `src/index.css`：fork 未改过，随上游暗色配色改动落地。
- `pnpm-lock.yaml`：上游 v4.0.8 未改该文件，fork 侧移除 `@tauri-apps/plugin-updater` 的状态原样保留，本轮无冲突。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q1，2026-10-11 用户选择 A）：验收通过并用户接受结果后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.8-1` 并 `git push origin v4.0.8-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端；执行前无需重复询问。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.8^{commit}`、`git log --oneline v4.0.8..main`、`git rev-list --count`（重放前后）、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照
- 落地保真核对：按 A12 的增删行双向差集脚本逐文件比对
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线
- 上游功能落地抽查：`modelFetchRequestHeaders` 与 Claude/Codex/OpenCode 三处表单取模型请求头、`reveal_app_log_file` 与「打开日志」按钮、`officialModelsReason`/`noticeReasons` 与自动恢复、桌面版 Codex CLI 兜底、暗色 `--text-*` 三档
