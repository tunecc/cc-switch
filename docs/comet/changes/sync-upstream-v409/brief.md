# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.9 发布头（tag v4.0.9 = 8845b1ef），fork 侧 135 个魔改提交（v4.0.8..main，含 v4.0.8 的同步提交、归档提交与 v4.0.6 规格修正提交）按原顺序重放保留，无丢失、无行为回归；版本号按惯例从 4.0.8-1 升为 4.0.9-1；验收通过并用户接受结果后，按 Q1 授权的交付方式上传 origin。

# Scope

## Directory structure

### Created

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v409/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v409/`（由 Runtime 归档动作生成）。
- 随上游 rebase 落地的上游新增文件 16 个：`src/components/providers/forms/shared/{DirectModeFormatWarning,FullUrlToggle}.tsx`、`src/components/providers/forms/ClaudeStackModelsField.test.tsx`（实际路径 `tests/components/ClaudeStackModelsField.test.tsx`）、`tests/components/{CodexFormFields.subagent,ProviderForm.modeHints}.test.tsx`、`tests/i18n/syncLanguageFromSettings.test.ts`、`src/whats-new/4.0.9.json`、`docs/release-notes/v4.0.9-{zh,en,ja}.md`、`src/icons/extracted/{ikuncode,openmodel,runtoken,soruxgpt,tokenflux}.jpg`、`assets/partners/logos/openmodel-banner.jpg`。
- 交付步骤（验收通过并归档后，按 Q1 授权）新增本地 annotated tag `v4.0.9-1`。
- rebase 前新增本地安全分支 `pre-sync-v409`（= 同步前 main `cc6e7870`），仅用于回退参照与 diff 对照。

### Modified

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（4.0.8-1 → 4.0.9-1）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。
- 33 个上游/fork 重叠文件（完整清单见完整目标规格「冲突解决」）：4 个版本与锁文件、`README.md`（整文件保留 fork 侧）、后端共享文件 `src-tauri/src/{lib,settings,tray}.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/proxy/providers/claude.rs`、前端共享文件 `src/components/providers/{EditProviderDialog.tsx,forms/ClaudeFormFields.tsx,forms/ProviderForm.tsx,forms/ClaudeDesktopProviderForm.tsx,forms/PiProviderForm.tsx,forms/GrokBuildProviderForm.tsx,forms/shared/EndpointField.tsx,forms/shared/index.ts}`、8 个 `src/config/*ProviderPresets.ts`、4 个 `src/i18n/locales/*.json`、3 个测试文件 `tests/components/{EditProviderDialog,GrokBuildProviderForm,ProviderPresetSelector}.test.tsx`。
- 上游独有改动文件 61 个，fork 侧从未触碰，随 rebase 直接落地（清单见完整目标规格「同步范围」，含 `src-tauri/Info.plist`、`src/i18n/index.ts`、`src/main.tsx`、`src/lib/{api,query}/proxy.ts`、`src-tauri/src/{services/proxy,mode/controller,claude_desktop_config,database/dao/proxy,commands/proxy}.rs`、`src/components/providers/forms/{CodexFormFields,CodexConfigSections,FetchedModelPicker,ClaudeStackModelsField,CommonConfigEditor,...}.tsx`、`CHANGELOG.md`、4 个 README 语言版与 flatpak/用户手册文档）。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：共享文件表按需追加本轮 v4.0.9 叠加语义条目（`lib.rs`、`settings.rs`、`commands/settings.rs`、`tray.rs`、`proxy/providers/claude.rs`、`EndpointField.tsx`、`shared/index.ts`、`ClaudeFormFields.tsx`、`ProviderForm.tsx`、三个 ProviderForm 变体、8 个预设文件、4 个 locales、版本与锁文件），并在「说明」段更新本轮仅上游改动文件示例。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为同步后状态）。

### Deleted

- 无。上游 v4.0.8..v4.0.9 的改动集里没有文件删除（`git diff --name-status` 全为 A/M），fork 侧本轮也不删除文件。

### Not created

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v409` 是安全参照分支，不是工作区分支）。
- 不新增 fork 专属代码文件（本轮 fork 侧无新魔改，白名单表只修订既有条目）。
- 不创建 PR、不合并其他分支、不推送除 Q1 授权的 `origin main` 与 tag `v4.0.9-1` 之外的任何远端引用。
- 不创建迁移脚本或改动数据库 schema（上游 v4.0.9 的 `SCHEMA_VERSION` 仍为 20，fork 保持 21）。
- 不放开 fork 预设白名单：上游本轮新增的赞助商预设由 `forkOfficialAllowlist` 默认拒绝，不改白名单内容。
- 不创建临时文件或脚本目录；`docs/comet/changes/sync-upstream-v409/` 是唯一新增的 change 产物目录。

- 把本地 main rebase 到 tag v4.0.9（8845b1ef）：当前 merge-base df40d53c（v4.0.8）→ 目标 8845b1ef；fork 侧 135 个提交（v4.0.8..main）按原顺序重放。
- 基线即上游 v4.0.9 发布头。`upstream/main` = 99277921，`v4.0.9..upstream/main` 有 6 个 post-release 提交，本轮按既定惯例排除（见 Decisions）。
- 上游新增 35 个提交（v4.0.8..v4.0.9），共 94 个文件、约 +6193/−1420 行。按主题分组：
  - 赞助商预设批量新增（8 个提交）：`5b708ebd` SoruxGPT、`fec99c56` IKunCode + SoruxGPT/IKunCode 图标、`d25e8d54` RunToken、`233310d7` OpenModel（跨十个应用 + README 赞助位 + banner 图）、`89add5de` Grok Build 的 SoruxGPT/IKunCode/RunToken、`886915a7` BotCF、`c4770472` YYLX、`b17250a3` TokenFlux；涉及 8 个 `src/config/*ProviderPresets.ts`（各 +84..+372）、`src/config/presetSearchAliases.ts`、`src/icons/extracted/{index,metadata}.ts` 与 5 张 jpg。
  - 本地路由客户端地址（`f88068b9` #7878）：WSL2 NAT 等「客户端与代理不在同一网络栈」场景下，写给客户端的代理主机可与监听地址分开。新增 `AppSettings.proxy_client_host`（`src-tauri/src/settings.rs` +23）、`get/set_proxy_client_host` 命令（`src-tauri/src/commands/settings.rs` +15、`src-tauri/src/lib.rs` +2 注册）、`merge_settings_for_save` 透传保护与该保护的单测、托盘端口提示改用 `get_proxy_client_endpoint_sync`（`src-tauri/src/tray.rs` 1 行）、`src-tauri/src/{database/dao/proxy,services/proxy,commands/proxy}.rs` 与 `src/lib/{api,query}/proxy.ts`、`src/components/settings/sections/RoutingSection.tsx` 设置行、三语用户手册 `docs/user-manual/*/4-proxy/4.1-service.md`。
  - 表单说明改为 HelpTip / 模式感知提示（9 个提交）：`f59bba54` Claude 表单说明进 HelpTip、`36e2ce2c` Codex 字段说明进 HelpTip、`84ca4f00` 聚合布局说明进 HelpTip、`4f08989a` 默认模型说明由星号改 HelpTip、`0dae89e2` Codex 模型列表移出高级选项、`9f7ac1fa` 模型列表首行即默认模型、`e615a6f4` 表单提示跟随应用实际模式（新增 `shared/DirectModeFormatWarning.tsx` 与 `directModeFormatNotice`）、`1e045d2e` 完整 URL 开关移入高级选项（新增 `shared/FullUrlToggle.tsx`，`EndpointField` 去掉 `showFullUrlToggle/isFullUrl/onFullUrlChange/fullUrlHint` 四个 props 改为 `help`）、`56731456` 旧版供应商字段提示缩短。
  - 取模型与模型参数（`644b7d5c`、`f7244745`、`8347e1ab`、`1afa90af`）：模型选择器展示模型参数并静默回填（`src/hooks/useModelMetadataFill.ts`、`src/utils/providerConfigUtils.ts` +106、`src/components/providers/forms/FetchedModelPicker.tsx` 改为可删除的对话框）、去掉打开选择器时的取数量 toast、思考等级选择器与模型列表行对齐、`ac2eebc0` 撤掉 Codex 主推理强度选择器。
  - Codex 子 agent（`2ff37a76`）：默认 sub-agent 模型与推理强度（`hooks/useCodexConfigState.ts`、`CodexConfigSections.tsx`、`CodexFormFields.tsx`、`ProviderForm.tsx`、`tests/components/CodexFormFields.subagent.test.tsx` +201、`tests/utils/providerConfigUtils.codex.test.ts` +89）。
  - 代理转换修复：`6e7811e5` OpenAI 格式的 Claude 上游改发 Bearer 并合并 stack 切换（`src-tauri/src/proxy/providers/claude.rs` +60、`ClaudeFormFields.tsx`、`ClaudeStackModelsField.tsx` + 新测试）、`9055dd37` #8136 不再把未匹配的工具结果以 `role=tool` 发给 Chat 上游（`transform_codex_chat.rs`）、`2b0ec81b` 为 xAI 原生 Responses 重写缺少 `call_id` 的工具输出（`transform_codex_responses_xai_sanitize.rs`）。
  - 其他：`29998ed9` 冷启动应用已保存语言（`src/i18n/index.ts` +33/−、`src/main.tsx` +10/−、`tests/i18n/syncLanguageFromSettings.test.ts`）、`40d19110` #7213 macOS 申请本地网络权限（`src-tauri/Info.plist` 加 `NSLocalNetworkUsageDescription`）、`4cde722c` #8145 打开供应商编辑弹窗不再闪一下 loading（`EditProviderDialog.tsx` + `tests/components/EditProviderDialog.test.tsx` +43）、`28ee933c` Claude Desktop 表单用平实语言解释模型模式、`c69679a2` #8132 与 `5b78fc62` flatpak 文档、`9055dd37` 等。
  - `5e57b1ec` chore(release) v4.0.9：`CHANGELOG.md` + 四处版本号（`package.json`/`Cargo.toml`/`Cargo.lock`/`tauri.conf.json` 各 1 行）。
  - `8845b1ef` docs(release)：`docs/release-notes/v4.0.9-{zh,en,ja}.md`、`src/whats-new/4.0.9.json`、README 四语版本赞助位。
- 冲突面（上游与 fork 同时改动的文件，共 33 个）：4 个版本与锁文件、`README.md`、5 个后端文件（`lib.rs`、`settings.rs`、`tray.rs`、`commands/settings.rs`、`proxy/providers/claude.rs`）、8 个前端文件（`EditProviderDialog.tsx`、`ClaudeFormFields.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`shared/EndpointField.tsx`、`shared/index.ts`）、8 个预设配置文件、4 个 i18n locales、3 个测试文件。`pnpm-lock.yaml` 本轮不在上游改动集内（上游 v4.0.9 未动它），因此不存在该锁文件的 fork 保留段取舍。
- 上游本轮改动的其余 61 个文件 fork 侧均未触碰，随上游直接落地。
- 数据库 schema：上游 v4.0.9 仍为 `SCHEMA_VERSION = 20`（`src-tauri/src/database/{mod,schema,tests}.rs` 本轮未在上游改动集内）；fork 侧 21（含 fork 专属 v20→v21 幂等修复迁移）原样保留，无新的迁移链合并。
- 版本号从 4.0.8-1 升到 4.0.9-1（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 一致；`Cargo.lock` 由 `cargo check` 联动）。
- 冲突按 docs/HOW_TO_REBASE_UPSTREAM.md §3 处理：白名单文件保留 fork 侧，共享文件取上游版本再叠加 fork 必要语义（逐文件语义见完整目标规格）。
- rebase 过程中保护 `.comet/config.yaml`：历史重放可能把它改回旧内容；涉及该文件或重放结束后核对 `default_workflow: native` 与 `workflows: [native, classic]`，被改写时用 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- 更新 docs/HOW_TO_REBASE_UPSTREAM.md：本轮与上游改动相关的叠加语义条目（`lib.rs` 的 `get/set_proxy_client_host` 注册与 fork 三段语义、`settings.rs` 的 `proxy_client_host` 与 fork `VisibleSidebarPanels` 并存、`commands/settings.rs` 的透传保护与 fork updater 移除段、`tray.rs` 的 `get_proxy_client_endpoint_sync` 与 fork 左键切换分支、`EndpointField.tsx` 的上游 `help`/HelpTip 改造与 fork `rightSlot` 并存、`shared/index.ts` 的两个新导出与 fork 导出并集、`ClaudeFormFields.tsx` 的大面重构与 fork 五段语义、`ProviderForm.tsx` 的 `directModeFormatNotice`/sub-agent props 与 fork 导入接线、8 个预设文件的 fork `hidden` 字段、4 个 locales 的 fork 键段），以及本次新增 fork 专属文件（如有）。
- 更新本 change 的完整目标规格（基线、提交数、冲突面、版本号、重放映射按本次同步后状态重写）。
- 同步后执行文档 §2 要求的完整构建与测试（typecheck / test:unit / cargo check / cargo test）。
- 交付（方式按 Q1）：验收通过并用户接受结果后执行 Q1 授权的动作，并把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。

# Non-goals

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*`、`upstream/chore/*` 等），也不把 `v4.0.9..upstream/main` 的 6 个 post-release 提交纳入本轮基线。
- 不做部分 cherry-pick 式同步；范围是 v4.0.8..v4.0.9 的全部新增提交。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q1 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路、上游 v4 已删除的组件）。
- 不放开 fork 预设白名单，不改 `forkOfficialAllowlist` / `forkPresetFilter` 的判定。
- 不引入上游 Linux flatpak/deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）；上游本轮的 `flatpak/README.md` 改动作为文档随上游落地，不参与 fork 构建。

# Acceptance examples

- A1: rebase 后 `git merge-base main upstream/main` 等于 8845b1ef（tag v4.0.9 指向的提交），`git log v4.0.9..main` 只包含 fork 提交。
- A2: rebase 前 v4.0.8..main 的 135 个 fork 提交按原顺序逐一重放；被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因，全部 fork 功能语义保留。
- A3: 33 个重叠文件的冲突解决符合 docs/HOW_TO_REBASE_UPSTREAM.md §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.9-1`，`README.md` 保留 fork 重写版，共享代码以上游 v4.0.9 为基础叠加回 fork 必要语义，且上游「本地路由客户端地址（`proxy_client_host` + `get/set_proxy_client_host` 命令 + 托盘端点口径）」「OpenAI 格式 Claude 上游发 Bearer 并合并 stack 切换」「未匹配工具结果不再以 `role=tool` 发出」「xAI 原生 Responses 无 `call_id` 工具输出重写」「表单说明改 HelpTip 与完整 URL 开关移入高级选项」「模型参数展示与静默回填、取模型对话框可删除」「Codex sub-agent 默认模型与推理强度」「冷启动应用已保存语言」「macOS 本地网络权限描述」「编辑弹窗不再闪 loading」「八组赞助商预设」全部落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 4.0.9-1，且 `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），未被历史重放改写。
- A7: docs/HOW_TO_REBASE_UPSTREAM.md 已按本次同步结果修订（相关叠加语义条目、本次新增的 fork 专属文件如有），完整目标规格已重写为同步后的完整状态。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过。
- A10: `cargo check` 通过。
- A11: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A12: 落地保真核对通过：对每个上游与 fork 同时改动的重叠文件，比较「上游 df40d53c→8845b1ef」与「同步前 main→同步后 main」两份 diff 的增删行集合，上游新增一行不缺、fork 新增一行不丢（双向差集为 0）；确有意图取舍时按完整目标规格记录并说明。

# Constraints and invariants

- fork 全部 135 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 docs/HOW_TO_REBASE_UPSTREAM.md §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前创建安全分支记录起点（`pre-sync-v409` = 当前 main `cc6e7870`，该提交同时是 origin/main 与本地 tag `v4.0.8-1` 指向的提交）；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- fork 历史自带未清理的冲突标记（上一轮实测：`SettingsPage.tsx`、4 个 locales、`ProviderList.test.tsx` 在 fork 历史提交自身 tree 里就带标记，由后续 fork 提交清掉）：重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验；最终态必须全树零冲突标记。
- `src/components/providers/forms/shared/EndpointField.tsx` 与 `ClaudeFormFields.tsx` 是本轮最高危叠加面：上游删掉了 `showFullUrlToggle/isFullUrl/onFullUrlChange/fullUrlHint` 四个 props 并新增 `help`，fork 在同一位置加了 `rightSlot`（API 格式选择器）；合并结果必须同时具备上游 `help` 形态与 fork `rightSlot` 形态，且 fork 的兜底模型直达区、`hasCustomModelMapping`、`SearchableModelPicker`、1M 全选全部保留。
- current 工作区直接在 main 上 rebase 时，检出新基线的瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- 推送 main 与推送 tag 各自都需要验收通过且用户接受结果后执行，并按 Q1 的授权范围；tag 一旦推送即触发公开发布流水线。
- `.comet/config.yaml` 与 docs/comet/** 流程产物按 fork 侧保留，是 Native 工作流继续运转的前提。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」，不得为省事整文件取一侧而丢掉任何一方（版本号、locales、`lib.rs`、`settings.rs`、`EndpointField.tsx`、`commands/settings.rs` 属高频误删点，其中 `commands/settings.rs` 与 `lib.rs` 还要确认 updater 链路未被带回）。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡（项目记忆既有教训）。

# Decisions

- 同步基线：tag v4.0.9 = 8845b1ef。理由：项目既定的 fork 同步惯例是只锁已发布上游 tag（`upstream/main` 领先 6 个 post-release 提交：`3302cc2d` NekoCode 预设、`04bd15c9` ja 文案、`28dc5198` 添加/编辑页取消淡入、`68122bc4` Codex 线程模型设置、`96d636ca` OpenRouter 额度、`99277921` 无关自动保存目录，全部属于下一轮范围），与过去 9 轮一致，基线是已验证的发布头。
- 隔离方式：当前目录（current），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；且同步必须直接改写 main 历史，与过去 9 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability（change 直接以完整目标规格 `specs/upstream-sync/spec.md` 形式管理）。理由：该能力既有总规格是纯散文、无 `### Requirement:` 受管小节，关联模式不允许整份重写 prose；沿用过去 8 轮同步惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：4.0.8-1 → 4.0.9-1；`-1` 表示上游 4.0.9 上的第一代 fork 构建，四处版本文件一致。
- 数据库 schema：上游 v4.0.9 未推进 schema（`SCHEMA_VERSION` 仍为 20，`database/{mod,schema,tests}.rs` 不在上游改动集内），fork 21 与 v20→v21 修复迁移原样保留，不新增迁移步骤。
- `README.md`：整文件保留 fork 重写版（上游 `233310d7` 只往 README 的赞助表加 OpenModel 一行，fork README 已不含赞助商表且只记录 fork 差异）；`README_ZH/DE/JA.md` fork 侧从未触碰，随上游落地。
- `CHANGELOG.md`、`flatpak/README.md`、`docs/user-manual/*/4-proxy/4.1-service.md`、`src-tauri/Info.plist`：fork 未改过，随上游落地。
- `src-tauri/Cargo.toml` / `Cargo.lock` / `package.json` / `tauri.conf.json`：上游本轮只改版本号，各文件除版本号一行外无其他上游改动；取 fork 版本号 `4.0.9-1`，其余内容保持 git 已合并结果。
- `pnpm-lock.yaml`：上游 v4.0.9 未改该文件，fork 侧移除 `@tauri-apps/plugin-updater` 的状态原样保留，本轮无冲突。
- `.github/workflows/release.yml`：上游 v4.0.9 未改该文件，保留 fork 裁剪版（仅 Windows x64 + macOS arm64 unsigned，且跳过上游 tag 发版）。
- 上游新增赞助商预设的可见性：不改 fork 白名单，由 `forkOfficialAllowlist` 默认拒绝（fork 构建下这些预设不可见），上游代码与图标照常落地。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q1，2026-10-12 用户选择 A）：验收通过并用户接受结果后，`git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.9-1` 并 `git push origin v4.0.9-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端；执行前无需重复询问。

# Open questions

- 无。

# Verification expectations

- `pnpm typecheck`
- `pnpm test:unit`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.9^{commit}`、`git log --oneline v4.0.9..main`、`git rev-list --count`（重放前后）、提交主题序列逐行 diff、patch-id 对照、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照、全树冲突标记 grep
- 落地保真核对：按 A12 的增删行双向差集脚本逐文件比对（33 个重叠文件）
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线、`EndpointField` 的 `rightSlot`、`lib.rs`/`commands/settings.rs` 中 `updater` 命中数为 0
- 上游功能落地抽查：`AppSettings::proxy_client_host` 与 `get/set_proxy_client_host` 命令注册与 `merge_settings_for_save` 透传保护、`get_proxy_client_endpoint_sync`、`src/lib/{api,query}/proxy.ts` 与 `RoutingSection.tsx` 的客户端地址行、`proxy/providers/claude.rs` 的 Bearer 分支、`transform_codex_chat.rs` 的未匹配工具结果处理、`transform_codex_responses_xai_sanitize.rs` 的 `call_id` 重写、`shared/{FullUrlToggle,DirectModeFormatWarning}.tsx` 与 `EndpointField` 的 `help`、`FetchedModelPicker` 对话框与 `useModelMetadataFill` 静默回填、Codex sub-agent 两个 state 与 props、`src/i18n/index.ts` 冷启动语言、`Info.plist` 的 `NSLocalNetworkUsageDescription`、`EditProviderDialog` 的 `waitingForEditorView` 门控、8 个预设文件的赞助商条目与 `src/whats-new/4.0.9.json`
