# Outcome

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.21`（annotated tag 对象 `2f04decf8`，剥离提交 `c4db63c60`）：fork 侧 180 个提交（`v4.0.20..main`，当前 main `2fe1bbe47`）按原顺序整体重放，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.20-1` 升为 `4.0.21-1`。

上游 `v4.0.20..v4.0.21`：**54 提交、161 文件、+12488/−1383（35 新增 / 126 修改 / 0 删除）**，与 fork 的重叠面为 **31 个文件**（fork 侧自 `v4.0.20` 起改动 470 个文件、+58802/−2766）。本轮主轴是 **Claude 官方订阅多账号切换**：授权中心添加多个 Claude 账号，官方卡通过「登录方式」下拉绑定账号，切卡即切号（走 Claude Code 官方 `CLAUDE_CONFIG_DIR` / `claude auth login` 流程），绑号卡与授权中心显示每个号的套餐和剩余额度，「打开终端」时终端固定用卡片上的号。其余上游改动：Codex 模型列表拖拽排序、打开终端移到卡片图标按钮、轻量模式重启保持、授权中心「添加账号」常显与额度条对齐、Hermes「设为默认」移入 ⋯ 菜单、Codex/代理/MCP/Kimi 用量/Oh My Pi YAML/Gemini .env 等修复、土耳其语补全、预设刷新（ClinePass、TeamoRouter、Kimi K3.1、DeepSeek Flash、MiniMax Flash）、新增 `.github/workflows/schema-version.yml` 与 v4.0.21 发布物料。

**用户要求先比对再询问：上游是否新增了 fork 已有功能——本轮结论：没有重复实现，因此不存在「保留上游还是保留 fork」的二选一。** 证据与同域交集：

1. **Claude 官方多账号切换是全新能力**：fork 的授权中心只有上游既有的 Codex / xAI / Kimi / Copilot 托管账号；fork 自有功能里没有任何「多 Claude 账号」或「切卡即切号」实现，`src-tauri/src/services/claude_account/` 与 `src/components/providers/forms/ClaudeOfficialSection.tsx` 在 fork 侧均为零自有语义，随上游整体落地。
2. **「打开终端」与 fork 的卡片/菜单改造同文件但不同项**：上游把终端从 ⋯ 菜单移到卡片图标按钮（编辑左侧），fork 只是在同一个 ⋯ 菜单里移除了「模型」项并新增右键置顶/置底（右键菜单，不在 ⋯ 内）。两侧互不覆盖，按上游位置放终端图标、fork 菜单改造原样保留。
3. **连通检测入口判定同域但无可见冲突**：上游把「官方 / OMO / OMO Slim 卡不显示检测连通」抽成 `supportsConnectivityCheck`；fork 的逐模型连通性测试入口由 `shouldShowTestEntry` 控制且仅对 claude / codex 开放，OMO（opencode）在 fork 本来就没有入口。采纳上游判定作为 ProviderCard 内层守卫，fork 的 `shouldShowTestEntry` 外层守卫保留，fork 可见行为不变。
4. **卡片副标题 / 额度区叠加**：上游为绑号 Claude 官方卡新增账号行、套餐标签与额度 footer；fork 的模型徽章（标题行）、双官网链接（副标题行）与右键菜单在不同位置。合并规则：绑号卡副标题按上游显示账号行（与上游一致，不再显示官网链接）；未绑号卡保留 fork 双官网链接，有套餐时在链接后追加 `· 套餐`；模型徽章与右键菜单不动。
5. **预设白名单**：上游新增 ClinePass、TeamoRouter 等第三方预设 → fork 构建按既定口径继续隐藏；Kimi 官方预设**名称不变**（只加 K3.1 Pro / HighSpeed 模型行），仍命中白名单；本轮**没有**新增 `category: "local"` 预设，`forkOfficialAllowlist` 无需增改。
6. **其他同文件项均为机械叠加**：Codex 模型列表拖拽排序（fork 未改 `CodexFormFields.tsx`，直接落地）、Hermes 设为默认移入 ⋯ 菜单、轻量模式持久化（fork 托盘左键在 `tray.rs` 不同分支）、Claude Desktop Copilot URL 检测（fork 的 `rightSlot` 布局照上一轮口径承载）、`update_provider_sort_indexes` 新 DAO 函数（fork 的一键置顶/置底走同一 `updateSortOrder` 命令，自动获益）。

交付沿用既有惯例（Q1 请用户确认一次）：验收通过并归档后 `git push --force-with-lease origin main`，在归档提交上打 annotated tag `v4.0.21-1` 并推送，触发 fork Release CI。

- 基线 tag `v4.0.21` = tag 对象 `2f04decf8`（剥离提交 `c4db63c60`）；`upstream/main` 比 tag 多 18 个提交（最新 `144c41b96`），本轮只锁已发布 tag，不同步 tag 之后的提交。
- 版本号 `4.0.20-1` → `4.0.21-1`；上游本轮没有新增 Cargo 依赖（`Cargo.lock` 只有 `cc-switch` 版本行变化）。
- 数据库 schema 不撞号：上游 `SCHEMA_VERSION` 仍为 23，fork 保持 24，本轮不需要新的迁移臂。

# Scope

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v421/`（Runtime 已创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v421/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v421`（= 同步前 main `2fe1bbe47`），仅用于回退参照、重放前后 diff 对照与落地保真四 ref 比对。
- 随上游 rebase 落地的上游新增文件 35 个（`git diff --name-status v4.0.20 v4.0.21` 的 A 项），fork 在这些文件上无自有语义，全部随上游落地：
  - Claude 多账号后端：`src-tauri/src/commands/claude_account.rs`、`src-tauri/src/services/claude_account/`（`mod`、`cc_lock`、`identity`、`layout`、`login`、`shared`、`usage`、`tests` 与 `snapshot/` 下 10 个文件）、`src-tauri/src/services/provider/claude_official.rs`。
  - 代理回归测试：`src-tauri/src/proxy/tests_issue_7271.rs`。
  - 前端：`src/components/ClaudeAccountQuotaFooter.tsx`、`src/components/providers/forms/ClaudeOfficialSection.tsx`、`src/lib/claudePlan.ts`。
  - 测试：`tests/components/{ClaudeOfficialSection,CodexFormFields.catalogReorder,ProviderCard.claudeAccount}.test.tsx`、`tests/config/{claudeDesktopProviderPresets,teamorouterClaudePresets}.test.ts`、`tests/hooks/useClaudeAccountQuota.test.tsx`、`tests/lib/claudePlan.test.ts`。
  - CI 与发布物料：`.github/workflows/schema-version.yml`、`docs/release-notes/v4.0.21-{en,ja,zh}.md`、`src/whats-new/4.0.21.json`。
- 交付步骤（验收通过并归档后，按 Q1 授权）新增本地 annotated tag `v4.0.21-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.20-1` → `4.0.21-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包版本行联动；无新增依赖）。
- 31 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.20 v4.0.21 | sort) <(git diff --name-only v4.0.20 HEAD | sort)`；上游 161 文件 + fork 侧 470 文件）。逐文件行数口径（`git diff --numstat v4.0.20 <ref> -- <file>`，**上游 / fork**）：
  - 仓库根：`README.md` 7/7（fork 96/539，fork 为整文件自有的「与上游的差别」版，冲突时保留 fork 整文件）、`package.json` 1/1（2/2）、`src-tauri/Cargo.toml` 1/1（3/6）、`src-tauri/Cargo.lock` 1/1（5/175）、`src-tauri/tauri.conf.json` 1/1（5/11）。
  - 后端：`commands/misc.rs` 308/31（6/5）、`commands/mod.rs` 2/0（2/2）、`commands/settings.rs` 14/0（7/105）、`database/dao/providers.rs` 21/0（41/32）、`lib.rs` 30/2（32/42）、`proxy/forwarder.rs` 3/1（2/1）、`proxy/providers/codex.rs` 49/0（1/0）、`services/mod.rs` 1/0（2/1）、`services/provider/mod.rs` 8/9（4/0）、`settings.rs` 13/0（47/0）。
  - 前端：`src/App.tsx` 17/0（83/1）、`ProviderCard.tsx` 70/8（104/1）、`forms/ClaudeDesktopProviderForm.tsx` 23/5（85/12）、`forms/ProviderForm.tsx` 26/1（183/43）、`lib/query/mutations.ts` 6/0（63/0）。
  - 预设：`src/config/{hermes,openclaw,opencode,pi}ProviderPresets.ts` 122/53、235/160、146/46、119/149（fork 侧均为 2/0 的 `hidden` 字段）。
  - 本地化：`src/i18n/locales/{en,ja,zh-TW,zh}.json` 47/11（fork 侧 en 328/25、ja 315/24、zh-TW 315/24、zh 327/24）；`tr.json` 本轮上游补全（fork 侧零改动，整文件取上游）。
  - 测试：`tests/components/{ClaudeDesktopProviderForm,ProviderCardActions,ProviderPresetSelector}.test.tsx` 169/0、46/0、2/2（fork 侧 14/0、34/0、33/0）。
  - 完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 130 个文件随 rebase 直接落地，含 Claude 多账号全套新增文件、Codex 模型拖拽排序、轻量模式持久化、Apps 安装修复、代理/MCP/Gemini/Oh My Pi 修复、预设刷新、`src/whats-new/4.0.21.json`、3 份 release notes 与 schema-version CI。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（`ProviderCard.tsx`、`commands/settings.rs`、`settings.rs`、`lib.rs`、`services/mod.rs`、`services/provider/mod.rs`、`database/dao/providers.rs`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`App.tsx`、`mutations.ts`、4 个 locale 等行的 v4.0.21 口径），新增 §4.8「v4.0.21 轮的叠加要点」（Claude 多账号、卡片副标题/终端按钮、连通检测判定、轻量模式、预设刷新）。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记「v4.0.21 轮上游 schema 仍为 23，fork 保持 24，无新增迁移臂」。
- 把本地 main rebase 到 tag `v4.0.21`（tag 对象 `2f04decf8` → 剥离提交 `c4db63c60`）：当前 merge-base 为 `85ad4969`（v4.0.20）。

### 删除

- 上游本轮**没有删除文件**。
- 上游删除/改写 locale 键（en/ja/zh-TW/zh 各 11 删）：以 `v4.0.21` 删除集合为准，fork 代码不得残留对已删除键的引用；fork 专属键与文案继续保留。
- fork 已删除的 updater 链路与 `stream_check` 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式 `current`，直接沿用 main；`pre-sync-v421` 是安全参照分支）。
- 不新增 fork 专属代码文件；不改 `forkPresetFilter.ts` 判定实现；不改 `forkOfficialAllowlist` 既有条目（本轮无新增 local 预设，无需增改）。
- 不创建 PR；不推送除 Q1 授权范围之外的任何远端引用。
- 不把上游 `upstream/main` 上 tag 之后的 18 个提交纳入同步。
- 不给 `tr.json` 补 fork 键（与本轮上游 tag 逐字节一致）。
- 不复活应用内更新器与 `stream_check` 链路。
- 不为上游新增的第三方预设（ClinePass / TeamoRouter）放开 fork 白名单。
- 不做数据库降级兼容（fork v24 库被上游 v4.0.21（v23）打开仍报「版本过新」，与上游策略一致）。

## 上游本轮同步范围（v4.0.20..v4.0.21，54 提交 161 文件 +12488/−1383）

上游本轮改动按功能分组如下（详细到提交号，便于 Build 阶段核对落地保真）：

1. **Claude 官方多账号与授权中心（15 提交）**：`4dc05a9aa`（多账号切换）、`58fee0db2`（补齐切换缺口）、`1409bad95`（切卡即切号）、`e550adcfb`（绑号卡切号）、`1ddb14e19`（恢复/停放一致）、`3837f460d`（副标题显示账号）、`0d6386ed8`（卡上账号额度）、`b3eb2ad19`（授权中心额度）、`e29968f52`（登录失效不显示旧额度）、`ea1645f95`（额度条对齐）、`93a3e8ec8`（标题常显添加账号）、`ee83fd896`（移除「删除全部账号」菜单）、`5cc6c47fc`（切卡后重读账户）、`88c878ac9`（官方卡显示套餐）、`503957424`（授权中心头部与 main 对齐）。
2. **卡片与终端（3 提交）**：`623246868`（打开终端移到卡片图标）、`45155e9dc`（终端隔离提示）、`0c07d5095`（用量列对齐）。
3. **Codex 与用量（6 提交）**：`05034a4e4`（模型列表拖拽排序）、`71524045d`（聚合成员顺序跟随拖拽）、`0820ff73f`（托管登录刷新失败不误报过期）、`e8e1cfbff`（远程压缩用量不漏记）、`42ef63471`（侧栏切换时趋势图不跳动）、`644f56642`（Kimi 用量按请求时间）。
4. **代理与 MCP（5 提交）**：`80640b528`（Chat Completions `data` 包裹）、`96f01af07`（Azure 资源 400 重试）、`238d8a712`（`<think>` 转换回归测试）、`c2110ebb0`（MCP SSE 不支持提示）、`cfc64971f`（Codex MCP 去掉 `timeout`/`autoApprove`）。
5. **Apps / 表单 / 环境（6 提交）**：`ff31d8409`（Grok Build npm 12 postinstall）、`618af9d97`（OpenCode npm 12 postinstall）、`5f0fc2537`（Hermes 双安装计数）、`74a98fddc`（Gemini `.env` 的 `export` 行）、`ec5c5f8ad`（Claude Desktop Copilot URL 检测）、`665107753`（OpenCode OMO 不显示检测连通）。
6. **预设与文案（7 提交）**：`95e294855`（ClinePass）、`a56dddb9e`（TeamoRouter）、`d564adc35`（Kimi K3.1 Pro / HighSpeed）、`56fa007f4`（DeepSeek Flash）、`03337b7e8`（MiniMax Flash max 思考）、`6837f3617`（Claude Desktop OpenCode Go 官方地址）、`d2008fdb4`（土耳其语补全）。
7. **其他修复与 CI（6 提交）**：`e332cfdb7`（Oh My Pi `models.yml` 含 `&`/`*`/`!`）、`da0c84e4e`（轻量模式重启保持）、`882e7a6a4`（无提示词项目停用当前提示词）、`f20a2b29d`（Windows 登录 opener 常量）、`9f5adaac3`（schema-version PR 自动关闭 CI）、`9c30cde45`（issue/PR 模板 Human Note）。
8. **发布相关（2 提交）**：`cb50e6007`（四处版本号 4.0.21）、`c4db63c60`（3 份 release notes + `src/whats-new/4.0.21.json`）。

## 本轮重叠面与同域交集结论

- 重叠面 31 个文件，逐文件行数见上；上游 161 个文件中 130 个 fork 未触碰、随 rebase 直接落地。
- **上游没有重新实现任何 fork 既有功能**（详见 Outcome 的六条证据）。
- 需要 Build 阶段按「叠加」处理的高危面：`ProviderCard.tsx`（上游账号行/套餐/额度/终端隔离 + fork 模型徽章/双官网链接）、`ProviderCardActions.tsx`（上游终端图标 + fork 菜单改造，注意该文件不在重叠面但被上游本轮修改）、`commands/misc.rs`（上游 npm 12 与安装修复 + fork tunecc URL）、`commands/settings.rs`（上游轻量模式 + fork 更新器移除）、`lib.rs`（上游 claude_account 注册 + fork updater/stream_check 移除与 connectivity 注册）、`services/mod.rs`（上游 claude_account 模块 + fork connectivity_test 模块）、`ProviderForm.tsx`（上游 ClaudeAccountSelect + fork 导入/布局）、`ClaudeDesktopProviderForm.tsx`（上游 Copilot URL 检测 + fork rightSlot 布局）、`settings.rs`（上游 lightweight_mode + fork sidebar panels）、`mutations.ts`（上游账号缓存失效 + fork 导入/快捷切换）、`App.tsx`（上游托管账号刷新 + fork 侧栏/连通性）、4 个 locale、`database/dao/providers.rs`（上游 `update_provider_sort_indexes` + fork `website_url_2`）。

# Non-goals

- 不同步 upstream 其他分支；不做部分 cherry-pick；不纳入 tag 之后的 18 个提交。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.20-1` 及更早的 fork tag。
- 不重构 fork 既有魔改以迎合上游新代码；只做叠加与契约适配。
- 不改上游 Claude 多账号 / Codex 拖拽 / 轻量模式等新能力的内部实现；fork 只决定它们与自有功能的交集方式。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现；不增改 `forkOfficialAllowlist`。
- 不给 `tr.json` 补 fork 键；不保留上游已删除的 locale 键。
- 不恢复应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程或 `stream_check` 链路。
- 不改 fork 的托盘左键四条分支；不把 `native_menu_on_left_click` 带回。
- 不改数据库 schema 版本（上游 23 / fork 24）；不新增迁移臂。
- 不新增 fork 专属功能；不把上游新增第三方预设加入 fork 构建。
- 不改上游自带的测试与用例语义（除重放必须连接的改写与 fork 稳定性修正）。

# Acceptance examples

- A1: rebase 后 `git merge-base main v4.0.21` 等于 `c4db63c60`（tag `v4.0.21` 剥离出的提交），`git log v4.0.21..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交；`git log v4.0.20..main` 的提交数 = 180 个重放提交 + 本轮新增提交（逐条记录），主题序列逐行 diff 为 0 行（剔除被 git 判空丢弃的提交），patch-id 对照逐个归类为「完全相同 / 仅 hunk 位移 / 冲突停车」。
- A2: 31 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、除 `README.md` 外无整文件取一侧（高危面为 `database/dao/providers.rs`、`lib.rs`、`services/mod.rs`、`commands/misc.rs`、`commands/settings.rs`、`settings.rs`、`ProviderCard.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`App.tsx`、`mutations.ts`、4 个 locale、4 个版本与锁文件）；`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 零命中。
- A3: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.21-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 24，迁移链（v18→v19 `website_url_2` + `enabled_mcode`、v19→v20 pi、v20→v21 fork 修复 + `enabled_agy`、v21→v22 AGY 幂等 + `enabled_kimi`、v22→v23 Kimi 幂等 + `enabled_omp`、v23→v24 幂等补列）与 `create_tables` 列集不变；`git diff v4.0.20..HEAD -- src-tauri/src/database/schema.rs src-tauri/src/database/mod.rs` 除既有 fork 内容外无新增改动。
- A4: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧栏面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试（两个 Tauri 命令注册在位）、双官网链接、跨应用导入、禁用应用内更新器、README fork 说明、fork CI、托盘左键切换主窗口。
- A5: `git grep` 取证与同步前一致：`tauri_plugin_updater`/`updater_builder` 命中 0；`tauri-plugin-updater` 未回到 `Cargo.toml`；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳；`connectivity_test_provider_models`/`connectivity_probe_provider` 在 `lib.rs` 注册在位；`shouldShowTestEntry` 调用链在位。
- A6: 上游 Claude 多账号能力在 fork 落地后可用：`commands/claude_account.rs` 与 `services/claude_account/**` 模块注册、授权中心可添加账号、Claude 官方卡「登录方式」下拉绑定账号、切卡即切号、卡片副标题显示账号与套餐、卡片/授权中心显示账号额度、绑号卡「打开终端」显示隔离提示；上游新增测试（`ClaudeOfficialSection`、`ProviderCard.claudeAccount`、`useClaudeAccountQuota`、`claudePlan`）全部通过。
- A7: 卡片叠加符合合并规则：绑号 Claude 官方卡副标题显示账号行（上游语义）、未绑号卡保留 fork 双官网链接并在有套餐时追加 `· 套餐`；fork 模型徽章与快捷切换入口仍在标题行；「打开终端」为卡片图标按钮（编辑左侧），⋯ 菜单不再含终端项；右键置顶/置底仍可用。
- A8: 连通检测入口判定按上游 `supportsConnectivityCheck`（官方 / OMO / OMO Slim 隐藏）叠加 fork 的 `shouldShowTestEntry`（仅 claude/codex），fork 现有连通性测试入口行为不变，上游 `providerCapabilities.test.ts` 通过。
- A9: 预设口径不变：`forkOfficialAllowlist` 未被修改；上游新增 ClinePass / TeamoRouter 在 fork 构建（`IS_FORK_BUILD`）下不可见；Kimi 官方预设名称不变且新模型行可见；本轮无 `category: "local"` 新预设；`filterForkPresets` 判定实现不改。
- A10: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键；上游本轮新增键全部在位且取值与 `v4.0.21` 逐字节一致；上游删除的键不再残留；fork 键段（连通性、导入、快捷切换、侧栏、置顶置底等）与 `provider.connectivityCheck`、`settings.general.trayStyleHelp` 的 fork 文案全部在位；`tr.json` 与 `git show v4.0.21:src/i18n/locales/tr.json` 逐字节一致。
- A11: `pnpm typecheck` 通过（零 `TS2300`，新增 `ClaudeOfficialSection`/`ClaudeAccountQuotaFooter` 类型无重复声明）。
- A12: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`ClaudeOfficialSection`、`ProviderCard.claudeAccount`、`CodexFormFields.catalogReorder`、`useClaudeAccountQuota`、`claudePlan`、`teamorouterClaudePresets`、`claudeDesktopProviderPresets`、`ProviderCardActions`、`OpenTerminalDialog`、`AuthCenterGroups`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。
- A13: `pnpm format:check` 通过；`pnpm build:renderer` 通过。
- A14: `cargo check` 通过，`Cargo.lock` 的改动只来自 `cc-switch` 版本行 `4.0.21-1`（无新增依赖；updater 相关条目不出现）。
- A15: `cargo test` 通过（含上游 Claude 多账号、Codex 拖拽、轻量模式、代理、MCP、Kimi/Oh My Pi、Gemini 用例，fork 的托盘左键源码护栏与迁移测试）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。
- A16: 落地保真核对通过：对 31 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.20`、`v4.0.21`、`pre-sync-v421`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数，未说明的非零缺失即视为丢语义缺陷。
- A17: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮结果修订（含 §4.8 与 `ProviderCard.tsx`/`commands/settings.rs`/`settings.rs`/`lib.rs`/`services/mod.rs`/`ProviderForm.tsx`/`ClaudeDesktopProviderForm.tsx`/`App.tsx` 等行新口径）；change 内完整目标规格与全局 `docs/comet/specs/upstream-sync/spec.md` 已更新为同步后完整状态，三处记录的数字与归属互相一致。
- A18: `.comet/config.yaml` 未被修改（`default_workflow: native`、`workflows`、`artifact_root: docs`、`language: zh-CN`、`clarification_mode: batch`、`max_verify_failures: 5` 全部保持）。
- A19: 轻量模式持久化（上游）与 fork 托盘左键并存：设置文件新增 `lightweight_mode` 字段；面板样式左键仍切换主窗口、原生菜单样式左键仍交系统菜单，`tray_left_click_never_opens_the_menu` 护栏通过。
- A20: 上游 18 个 tag 之后的提交未进入历史：`git log --oneline v4.0.21..main` 不含 `144c41b96`、`cd9c72108` 等 tag 后提交；`upstream/main` 的引用未被写入 fork 历史。

# Constraints and invariants

- 只做 rebase：`git rebase v4.0.21` 重放全部 fork 提交；任何失败先 `git rebase --abort`，不得用 `git reset --hard` 清理。
- 重放前固定安全分支 `pre-sync-v421`（= `2fe1bbe47`），用于回退参照与落地保真四 ref。
- `.gitignore`/`.comet` 托管状态：Comet Runtime 可能追加托管忽略块；如出现，先作为独立 chore 提交再开始重放。
- 版本四文件一致：`4.0.21-1`；不修改历史 tag；交付 tag 为 `v4.0.21-1`，必须指向归档提交。
- 数据库 schema 保持 24；上游 23 的 `SCHEMA_VERSION` 行被 fork 24 取代属预期取舍；不新增迁移臂。
- 应用内更新器继续禁用：无插件/依赖/权限，`install_update_and_restart` 空壳，`check_app_update_available` 空壳。
- 托盘左键契约不变：`tray.rs` 四条分支、`show_menu_on_left_click(false)` 两处、源码护栏。
- README 整文件保留 fork 版；上游 README 改动不落地。
- locale：4 个 locale 只增删上游键并保留 fork 键段，同对象作用域不得有同名重复键；`tr.json` 逐字节等于上游 tag。
- fork 白名单与过滤实现不变；本轮无 local 预设新增。
- 卡片叠加规则（见 Outcome 第 4 条）不得回退 fork 的模型徽章、双官网链接、右键菜单。
- 连通检测：fork 的 `shouldShowTestEntry` 外层守卫保留；采纳上游 `supportsConnectivityCheck` 内层守卫。
- 重放中途不跑 `cargo test`；最终态必须对冲突标记零命中。
- 落地保真四 ref 计算必须在全部最终态提交（版本、文案、文档、schema 确认、合并）落完之后对最终 `HEAD` 执行。

# Decisions

- D1（交付，已确认）：沿用惯例——验收通过并归档后 `git push --force-with-lease origin main`，在归档提交上创建 annotated tag `v4.0.21-1` 并推送；不创建 PR、不推送其他引用。
- D2：本轮上游没有重复实现 fork 功能，不产生「保留上游 or 保留 fork」的二选一；同域交集按 Outcome 第 1–6 条的叠加规则处理。
- D3：卡片合并规则——绑号 Claude 官方卡副标题显示上游账号行；未绑号卡保留 fork 双官网链接（有套餐时追加 `· 套餐`）；模型徽章、右键菜单、置顶置底不动；「打开终端」按上游放到卡片图标（编辑左侧）。
- D4：连通检测入口——采纳上游 `supportsConnectivityCheck`（官方/OMO/OMO Slim 隐藏）作为卡片内层守卫，fork 的 `shouldShowTestEntry` 外层守卫保留；fork 可见行为不变。
- D5：预设——ClinePass/TeamoRouter 等第三方预设继续在 fork 构建隐藏；Kimi 官方预设名称不变；不增改 `forkOfficialAllowlist`。
- D6：locale——4 个既有 locale 叠加上游键并保留 fork 键；`tr.json` 整文件取上游、逐字节一致。
- D7：schema——上游仍为 23、fork 保持 24，不做迁移变更，不做降级兼容。
- D8：重放映射与落地保真的记录口径与历轮一致（安全分支、四 ref 多重集、逐行归因、带重数）。

# Open questions

（无未决问题。Q1 已确认：交付方式为「推 main + 推 tag」，见 D1。）

# Verification expectations

- 独立 Verifier 只读，逐项覆盖 A1–A20；Runtime 检查计划至少包含：`pnpm typecheck`、`pnpm test:unit`、`pnpm format:check`、`pnpm build:renderer`、`cargo check`、`cargo test`、冲突标记 grep、版本/schema grep、locale 解析与重复键检查、`tr.json` 逐字节比对。
- 重放映射与落地保真由 Verifier 用同一算法独立复算（`git rev-list --count`、主题序列 diff、`git patch-id`、四 ref 多重集），数字与规格不一致即判失败。
- 时间敏感测试（`SessionManagerPage` 本地 00:00–00:30、`AppsPage` 过期缓存用例）按既有口径处理并在报告中记录。
- 交付（推 main / 推 tag）不是验收项，只在用户接受结果并归档后按 Q1 授权执行。
