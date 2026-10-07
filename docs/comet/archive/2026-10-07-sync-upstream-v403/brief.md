# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.3 发布头（8596a233，tag v4.0.3 指向该提交），fork 全部魔改按原顺序重放保留，无丢失、无行为回归；版本号按惯例升为 4.0.3-1。

# Scope

- 把本地 main rebase 到 v4.0.3 tag（merge-base 现为 bf2fe0d0（v4.0.2）→ 目标 8596a233）：上游新增 31 个提交，覆盖 v4.0.3 全部发布内容——Claude 快捷开关新增 auto mode 服务端检查开关（网关默认关）、删除 Teammates 与 max effort 快捷开关、每个快捷开关加帮助提示，CLAUDE_CODE_AUTO_MODE_SERVER 从供应商 env 投影进 settings.json（cf567ca6，上次同步的 post-release 提交本次纳入），备份位置与体积展示（backup_storage 服务 + BackupStorageSection），预设新增 OpenCode Zen（claude/codex）与 MoArk（模力方舟）、删除过期 OpenCode Go 推荐码、Hermes/OpenClaw MiMo 预设默认 mimo-v2.6-pro，代理修复（LF/CRLF 混合 SSE 分隔、OpenCode Go 网关客户端身份要求、Claude effort 映射尊重 thinking-off 与逐模型 effort 下限），用量统计（缓存 token 计入供应商/模型统计、模型统计显示成功率与速度、session-log 供应商本地化名、短标签、写库移出 tokio worker），Skills（已装列表全选框、导入技能部署到每个勾选应用），ChatGPT 订阅显示 Codex Credits 余额，MCP 与 Prompts 全页编辑器 + 未保存确认（a4d07f31），用量页 WebKit 布局抖动修复，测试 HOME 覆盖优先于旧版 HOME 回退；fork 侧 115 个提交（bf2fe0d0..main）按原顺序重放。
- 基线锁定 tag v4.0.3（8596a233）；upstream/main HEAD d35726e2（hermes scan-limit 测试批处理，post-release）不在本次范围，留待下次同步。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再手动叠加 fork 必要改动。本次冲突面 31 个文件（上游 v4.0.2..v4.0.3 与 fork bf2fe0d0..main 改动文件交集）：版本文件 4 个（package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock）按 fork 版本号 4.0.3-1 处理；后端共享文件（src-tauri/src/lib.rs、provider.rs、proxy/forwarder.rs、services/mod.rs、services/provider/live.rs、services/provider/mod.rs、tray.rs）与前端共享文件（src/App.tsx、AddProviderDialog.tsx、EditProviderDialog.tsx、forms/ProviderForm.tsx、universal/UniversalProviderFormModal.tsx、lib/api/settings.ts、src/types.ts）、预设文件 7 个（claudeDesktop/codex/hermes/openclaw/opencode/pi ProviderPresets）、4 个 i18n locales、3 个测试文件（AddProviderDialog.test.tsx、ProviderPresetSelector.test.tsx、ProviderForm.presetRows golden snapshot）取上游版本后叠加 fork 语义。
- schema.rs 上游本次未改动：SCHEMA_VERSION 维持 20，fork 的 v18→v19 website_url_2 合并结果原样保留，无需重新合并迁移链。
- 上游新增预设（OpenCode Zen、MoArk 等）在 fork 构建下由 forkOfficialAllowlist 自动过滤（claude/codex 白名单不含它们，其余 app 白名单为空），维持 fork「仅官方预设」语义，不新增白名单条目。
- AddProviderDialog.test.tsx：上游 a4d07f31 独立做了与 fork 670821d8 相同的 getByRole→findByRole 竞态修复；取上游版本后叠加回 fork 的两段 explanatory 注释。
- rebase 过程中保护 `.comet/config.yaml`：历史提交重放可能把它改回旧内容（曾导致只启用 classic、Native hook 拒绝写入），重放涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复到 rebase 前版本。
- 已知流程坑位（项目记忆 current-rebase-shape-recovery）：current 工作区 rebase 检出新基线瞬间，工作树短暂缺少 docs/comet/specs 全局规格文件，Runtime 可能判定退回 Shape；按 Runtime 返回的恢复命令处理（必要时先回 main 重新 prepare/confirm 同一 Shape 再继续），change 自身 specs/ 的实施事实更新（重放映射等）放在 handoff 提交前完成并接受最后一次确认。
- 版本号从 4.0.2-1 升到 4.0.3-1（package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock）。
- 把本次同步新增的 fork 专属文件补进 docs/HOW_TO_REBASE_UPSTREAM.md §4 白名单（如有）。
- 更新本 change 的完整目标规格 specs/upstream-sync/spec.md（上游基线、版本号、冲突面与叠加语义按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不清理本地遗留分支。
- 不手工挑选上游提交（不做 cherry-pick 式部分同步）；同步范围是 v4.0.3 tag 前的全部新增提交。
- 不同步 post-release 提交 d35726e2（下次同步处理）。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 8596a233…（v4.0.3 tag 指向的提交），`git log v4.0.3..main` 只包含 fork 提交，且 d35726e2 不在 main 历史中。
- A2: `git log v4.0.3..main` 的提交与 rebase 前改动语义一一对应：115 个原始 fork 提交按原顺序重放（若出现 git 自动判定的冗余跳过或需合并的提交，按 spec 记录的映射处理并核对语义），外加本次同步提交；全部 fork 功能语义保留。
- A3: 冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3：白名单文件保留 fork 侧；共享文件以上游版本为基础叠加回 fork 必要改动（lib.rs 移除 Updater 插件注册 + 托盘左键切换 + connectivity_test 命令注册并叠加上游新命令注册；provider.rs website_url_2 字段族；forwarder.rs 上游 SSE/身份/effort 改动为基础叠加 fork UA 口径注释；services/mod.rs 上游 backup_storage 与 fork connectivity_test 的 mod 声明并存；live.rs/provider mod.rs fork 连通性测试获取模型接线；tray.rs fork toggle_main_window 函数族；App.tsx 批量探针状态提升与批量检测门控与 setTitle 守卫并叠加上游全页编辑器路由；Add/EditProviderDialog fork 接线；ProviderForm.tsx 跨应用导入与预设过滤与 websiteUrl2；UniversalProviderFormModal websiteUrl2；settings.ts fork 移除更新 API 叠加上游新增设置；types.ts websiteUrl2 与 VisibleSidebarPanels；预设文件 fork hidden 语义；locales 保留 fork devpanel/connectivityTest 键段；AddProviderDialog.test.tsx 上游 findByRole 修复 + fork 注释）。
- A4: package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml、src-tauri/Cargo.lock 的版本号均为 4.0.3-1。
- A5: fork 魔改保留清单（specs/upstream-sync/spec.md）中的每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边栏面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（default_workflow: native，workflows 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md §4 已补充本次同步后新增的 fork 专属文件（如有）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: origin/main 与本地 main 一致（--force-with-lease 推送成功）。以 Q1 的授权结果为准。

# Constraints and invariants

- fork 全部 115 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 失败或局面不可收拾时 `git rebase --abort` 回到起点（670821d8），工作区恢复原状。
- 长重放过程中 git commit 偶发段错误（signal 11）时，先核对提交是否实际已落盘（.git/rebase-merge 状态），不盲目重放，防止同题重复提交。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。

# Decisions

- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。工作区当前干净（仅本 change 未跟踪产物），且同步需要直接改写 main 历史。
- 版本号：4.0.2-1 → 4.0.3-1，沿用「上游版本 + -1」惯例（fork 在该上游版本上的第一代魔改版本），与 package.json / tauri.conf.json / Cargo.toml / Cargo.lock 四处一致。
- 同步范围：v4.0.3 tag 全量 31 个提交一次 rebase，不做部分 cherry-pick；post-release 提交 d35726e2 锁定在范围外（沿用 v4.0.2 同步的基线锁定惯例）。
- 数据库 schema：上游 v4.0.3 未改 schema.rs，SCHEMA_VERSION 维持 20，fork v18→v19 website_url_2 合并结果不动。
- 上游新预设（OpenCode Zen、MoArk）：fork 构建下由 forkOfficialAllowlist 自动过滤，不新增白名单条目，维持「仅官方预设」语义。
- AddProviderDialog.test.tsx：上游已含等价 findByRole 修复，取上游版本叠加 fork 注释。
- `.comet/config.yaml` 保护：重放涉及该文件或重放后，核对并被改写时从 ORIG_HEAD 恢复（项目记忆 rebase-comet）。
- 推送：授权 rebase 完成且验收通过、用户接受结果后用 `--force-with-lease` 推送到 origin/main。用户已确认（Q1：授权推送，2026-10-07）。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`
- Git 核对命令：`git merge-base main upstream/main`、`git rev-parse v4.0.3^{commit}`、`git log --oneline v4.0.3..main`、`git branch --contains d35726e2`（应无 main）、版本号文件内容、`.comet/config.yaml` 内容、schema.rs 的 SCHEMA_VERSION 与迁移段
