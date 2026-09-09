# 目标

把 fork（origin = tunecc/cc-switch）的 main 分支同步到上游 farion1231/cc-switch 的最新 main（v3.20.2，54 个新提交），同时完整保留 fork 的全部本地魔改（连通性测试、模型快捷切换、侧边栏可见性、预设过滤、托盘左键切换等），使 fork 始终保持"可干净 rebase 到上游 main 之上"的既定状态。

# 范围

- 按 `docs/HOW_TO_REBASE_UPSTREAM.md` 的既定流程执行 `git rebase upstream/main`（merge-base 3217f725 → upstream/main f3b18df1）。
- 解决 rebase 过程中的全部冲突，遵循文档 §3 约定：白名单文件保留 fork 侧；共享文件以上游版本为基础，手动叠加 fork 必要改动。
- 同步 fork 版本号惯例：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 统一为 `3.20.2-1`（沿用 dadde129 "bump fork version to 3.20.1-1 after upstream v3.20.1 rebase" 的惯例）。
- 按文档 §4 约定更新 `docs/HOW_TO_REBASE_UPSTREAM.md` 白名单，补充上次同步后新增的 fork 专属文件（连通性测试前后端、供应商双官网链接、托盘左键切换等）。
- rebase 完成后运行完整构建与测试（文档 §2 要求）。
- 经用户授权后 force-push（`--force-with-lease`）到 origin/main。

# 非目标

- 不引入任何新功能或行为变更（除版本号与白名单文档更新外）。
- 不修改上游共享代码的既有行为；共享文件冲突只做"上游 + fork 必要改动"的最小叠加。
- 不处理 upstream 仓库的其他分支（仅同步 main）。
- 不清理本地遗留分支（如 `comet/tray-left-click-toggle-window`）。
- 不推送除 main 以外的分支。

# 验收示例

- A1: rebase 后 `git merge-base main upstream/main` 等于 upstream/main HEAD（f3b18df1），且 `git log upstream/main..main` 只包含 fork 提交。
- A2: fork 全部本地提交在 rebase 后仍存在（提交数与内容对应，无丢失；可用 `git log --oneline upstream/main..main | wc -l` 与 rebase 前对比）。
- A3: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 的 version 均为 `3.20.2-1`。
- A4: 冲突解决符合文档 §3 约定：白名单文件保留 fork 侧改动；共享文件以上游为基础叠加 fork 改动（抽查 `src/App.tsx`、`src/contexts/UpdateContext.tsx`、`src/config/piProviderPresets.ts`、`src/i18n/locales/zh.json`）。
- A5: `pnpm typecheck` 通过。
- A6: `pnpm test:unit`（vitest）通过。
- A7: `cargo check`（src-tauri）通过。
- A8: `cargo test`（src-tauri）通过。已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口），该失败不构成本次同步引入的缺陷；用户已明确接受此例外。验收执行时以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 作为检查命令（显式跳过该环境性测试，跳过原因记录于检查计划），其余全部测试必须通过。
- A9: `docs/HOW_TO_REBASE_UPSTREAM.md` 白名单包含本次新增 fork 专属文件（连通性测试、双官网链接、托盘左键切换等）。
- A10: 经用户授权后，`git push --force-with-lease origin main` 成功，origin/main 与本地 main 一致。

# 约束与不变量

- 工作区在 rebase 前必须干净（当前干净，本地 main == origin/main == 22f5f1a1）。
- 白名单文件冲突时一律保留 fork 侧；共享文件冲突时优先对齐上游，再叠加 fork 必要改动。
- rebase 改写 main 历史，推送必须使用 `--force-with-lease`，且仅在用户明确授权后执行。
- rebase 中断时优先 `git rebase --abort` 回到起点，不盲目 `--continue`。
- 不删除、不重置任何 fork 提交；任何不确定的冲突先 `git status` / `git diff` 复核。

# 决策

- D1 同步策略 = rebase（非 merge）：`docs/HOW_TO_REBASE_UPSTREAM.md` 明确约定"所有 fork 改动最终都要能 rebase 到它的 main 之上"，上次同步（dadde129）也走 rebase。项目规则已回答，无需用户决定。
- D2 冲突解决 = 按文档 §3：白名单文件保留 fork 侧（`--ours`）；共享文件取上游（`--theirs`）再手动叠加 fork 必要改动。
- D3 版本号 = `3.20.2-1`：沿用上次同步的 fork 版本惯例（上游版本 + `-1` 后缀）。
- D4 白名单文档更新 = 纳入本 change：文档 §4 约定"白名单随 fork 魔改范围扩展而更新"。
- D5 推送 = 仅在用户最终确认中明确授权后 force-push 到 origin/main；未授权则停在本地完成态。

# 待解决问题

（无 —— 用户已确认 Shape，并授权 rebase 完成且全部检查通过后 force-push 到 origin/main。）

# 验证预期

- 构建与测试命令：`pnpm typecheck`、`pnpm test:unit`、`cargo check`、`cargo test`（src-tauri）。
- 冲突解决抽查：白名单文件（tauri.conf.json / package.json / Cargo.toml / App.tsx / SettingsPage.tsx / vite.config.ts / vite-env.d.ts / locales devpanel 段 / forkBuild.ts / forkOfficialAllowlist.ts / forkPresetFilter.ts / setupTests.ts / HOW_TO_REBASE_UPSTREAM.md / docs/openspec|comet 产物）保留 fork 侧；共享文件（misc.rs / schema.rs / provider.rs / forwarder.rs / claude.rs / codex.rs / live.rs / BasicFormFields.tsx / AboutSection.tsx / UpdateContext.tsx / presets ×8 / locales 共享段）以上游为基础叠加 fork 改动。
- A10（推送）仅在用户授权后执行；未授权时其余验收项全部通过即视为本 change 完成，推送留待用户后续单独授权。
