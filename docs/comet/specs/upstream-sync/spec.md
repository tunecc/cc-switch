# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch main 之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.6 发布头（tag v4.0.6 = c2611266），fork 版本号为 4.0.6-1。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.6-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q2 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 c2611266（tag v4.0.6 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == c2611266；`git log v4.0.6..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 128 个 fork 提交（2db86e94..main）按原顺序重放，外加本次同步提交与归档提交（见「重放映射」）。
- 上游 v4.0.6 之后有 2 个 post-release 提交（ef24a019 test(codex)：WSL 临时目录跳过 thread version SQLite fixture；3e566a3b fix(pi)：火山方舟 Agent Plan 指向自己的端点并新增 Coding Plan），按 Q1 决定不在本轮范围，留待下次同步。
- 同步前起点由安全分支 `pre-sync-v406`（= e574d8ae）固定记录，用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- rebase 一趟完成，共 12 次冲突停车、全部解决后 `Successfully rebased and updated refs/heads/main`：同步前 `2db86e94..main` 的 128 个 fork 提交全部按原顺序重放，rebase 结束后 `git rev-list --count v4.0.6..main` == 128，与重放前逐条一致——无空提交被丢弃、无重复落地、无 git 段错误。`git merge-base main upstream/main` == c2611266；`git log --format=%an v4.0.6..main | sort -u` 只有 Tune（fork 作者），无任何上游提交落在区间内。
- 提交主题序列逐行 diff：重放前 128 条主题与重放后完全一致（无遗漏、无重复、无顺序变化）。
- patch-id 对照：128 个提交中 113 个 patch-id 与重放前完全相同，15 个不同。这 15 个全部对应本轮 冲突解决点或其上下文位移，逐条见下；无一属于「fork 语义丢失」。
- 冲突清单（12 处，按 rebase 顺序）：
  1. 原 `aa5c75df`（fork 首个版本号提交，3/128）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（新基线 4.0.6 vs fork 侧历史版本号 3.20.2-fork.1）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容（不对整文件 `--theirs`）。同提交还带着 `tailwindcss-animate` 的删除，经核对属该提交原始意图（后续 fork 提交 `bf493650` 会加回），非误删。
  2. 原 `a1d08310`（侧边面板开关，35/128）：`src/components/settings/sections/GeneralSection.tsx` 一段 → 上游「显示供应商搜索」开关行 + fork 的 skills/sessions/mcp 三个开关行并存（上游块补自己的 `}`/`/>` 闭合后接 fork 块）。
  3. 原 `d21209fb`（pill 开关样式，36/128）：同文件一段 → 上游搜索开关行 + fork 的 `<SidebarPanelPillRow />` 并存（该 fork 提交本就是用 pill 行替换三个开关行）。
  4. 原 `9f38059a`（fork 裁剪 release CI，41/128）：`.github/workflows/release.yml` 一段（ours=52 上游 Linux 资产块 vs theirs=0）→ 取 fork 侧（删除 Linux 块）。解决后与 fork 提交 `9f38059a` 的文件 blob 逐字节相同。
  5. 原 `eda990f2`（fork 重写 README，43/128）：`README.md` 一段（ours=511 上游 vs theirs=1 fork 链接行）→ 取 fork 侧。解决后与 fork 提交 `eda990f2` 的 blob 逐字节相同。
  6. 原 `9ee6f1f7`（右键置顶/置底，47/128）：`tests/components/ProviderList.test.tsx` 整文件冲突（ours=701 vs theirs=0）→ 取 ours（上游 v4.0.6 测试内容），theirs 的 5 个新右键用例已被 git 合入公共区。补回被 fork 片段截断而丢失的 MiniMax 用例闭合 `});`（括号平衡由 +1 归零）。
  7. 原 `1f2565e6`（归档 claude-model-quick-access，49/128）：同文件 5 段（ours=0/theirs=8、15、5 与 ours=55/theirs=0、theirs=1）→ 前三段与第五段取 theirs（补 `updateSortOrderMock`/`updateTrayMenuMock`/`toastMock`、`@/lib/api/providers` 与 `sonner` mock、`beforeEach` mockReset），第四段取 ours（保留上游 v4.0.6 的「matches the API address」用例）。该 commit 的 `vi.mock("sonner")` 出现两次属 fork 历史既有事实，后续 fork 提交会改成 `@/lib/toast`。
  8. 原 `e66f1a88`（移除旧 stream_check 链路，74/128）：`src-tauri/Cargo.lock` 一段 `cc-switch` 版本号 → 取 fork 侧值。同提交带走的 `tauri-plugin-updater` 及其依赖子树（minisign-verify、osakit、tar、xattr、zip 4.6.1、rustls-platform-verifier 等）属 fork 关闭自动更新的既定结果。
  9. 原 `fa588dae`（连通性测试 UI 四项修复，79/128）：`src/App.tsx` 2 段 + `src/components/providers/ProviderList.tsx` 2 段 → App.tsx 取两边并集（上游 `Search` 图标与搜索按钮块 + fork `Activity`/`Loader2` 与批量检测按钮块）；ProviderList.tsx 取两边并集（上游 `searchOpen`/`onSearchOpenChange` + fork `probeResults`）。详见下方「App.tsx 合并教训」。
  10. 原 `d30ac693`（双官网链接，84/128）：`tests/components/ProviderList.test.tsx` 2 段 → 两个用例都保留：上游「matches the API address and stops filtering once the panel closes」与 fork「matches providers by the second website URL in search」。两段共用同一段 `useDragSortMock.mockReturnValue({...})` 中间上下文，按「ours 用例完整 + theirs 用例完整」重组，并删掉因此多出的一个闭合 `});`。
  11. 原 `ca7be4fe`（sync fork with upstream v4.0.1，107/128）：`src/components/providers/ProviderList.tsx` 一段 → 取上游的 `searchIndex` 实现（可按请求地址搜索），再把 fork 的 `provider.websiteUrl2` 加回 text 字段数组，保住 fork 的第二个官网链接可搜。
  12. 同 `ca7be4fe` 之后无冲突，128/128 一次跑完。
- 15 个 patch-id 不一致的提交：`34903ffdd`(aa5c75df)、`34ad732d7`(b2a5ad9d)、`d7f1cc58c`(08147a5dd)、`9dfa74b56`(a1d08310)、`f3a7831b3`(d21209fb)、`e58292673`(9f38059ac)、`a9399707d`(eda990f21)、`713aa6324`(9ee6f1f79)、`3f2264a6d`(1f2565e68)、`78a7b1788`(0d132230e)、`51e70a357`(e66f1a88d)、`8e190dd3f`(72abeacdf)、`d3e104248`(fa588daec)、`12a3cd684`(d30ac693d)、`4fe772b85`(ca7be4fe0)。前 8 个与上述冲突点一一对应；后 7 个是同一冲突文件的上下文位移（文件早前已被冲突解决改写过，后续 fork 提交的 diff 上下文行号变化导致 patch-id 改变，内容语义不变）。
- fork 历史自带未清理的冲突标记：原提交 `4b437070` 的 `src-tauri/src/database/tests.rs` 与 `src-tauri/src/services/provider/gemini_auth.rs` blob 里本来就有 `<<<<<<< HEAD ... >>>>>>> 795d8a12`（要靠后续 fork 提交 `24febbfb`、`c3d2f317` 才清掉）。因此重放中途（第 84/128 步之后）出现这两处标记属 fork 历史既有事实，不是本次同步缺陷；`git diff --cached --check` 会报 "leftover conflict marker"，此时不能据此判定同步失败。重放中途不能跑 `cargo test`，只有 rebase 完成后才能编译校验。最终态全树 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 为 0 命中（已验证）。
- 落地保真核对（28 个上游/fork 重叠文件，A12）：20 个完全对称（`upstreamAddMissing=extraAdd=upstreamDelMissing=extraDel=0`），含 `commands/misc.rs`、`commands/settings.rs`、`database/dao/providers.rs`、`lib.rs`、`forwarder.rs`、`services/provider/mod.rs`、`settings.rs`、`tray.rs`、`ProviderForm.tsx`、`ProviderCard.tsx`、`GeneralSection.tsx`、`Sidebar.tsx`、`codexProviderPresets.ts`、4 个 locales、`lib/api/settings.ts`、`types.ts`、`ProviderList.test.tsx`。8 个差异全部对应刻意取舍：4 个版本文件是 fork 版本号 `4.0.6-1`（上游写 `4.0.6`）；`release.yml` 未引入上游 22 增/24 删（deb/rpm 签名与 Linux 包自动更新），与 fork 侧逐字节相同；`README.md` 未引入上游 2 增/1 删，与 fork 侧逐字节相同；`App.tsx` 的差异仅在于 lucide 导入块的排版（上游 5 个图标 + fork 2 个，7 个全部导入且各使用 1 次；两个按钮 JSX 块已与各自原始版本逐字节比对一致）；`ProviderList.tsx` 的 `extraAdd` 是 fork 的 `provider.websiteUrl2,`（上游 `searchIndex` 未含该字段，按规格加回）。
- 上游功能落地抽查（与上游 v4.0.6 逐文件比对）：`src-tauri/src/proxy/providers/streaming.rs`、`opaque_state_rectifier.rs`、`mode/controller.rs`、`mode/stack.rs`、`commands/auth.rs`、`resources/gpt5_5_template.json`、`src/whats-new/4.0.6.json`、`src/utils/providerConfigUtils.ts`、`src/types/proxy.ts` 与 `v4.0.6` 逐字节相同（SSE 收尾、子 agent 工具、第三方目录自带模板、聚合模式开关等均已落地）；`codex_config.rs` 通过 `include_str!("resources/gpt5_5_template.json")` 使用该模板。
- `.comet/config.yaml` 未被历史重放改写（重放后 blob 与同步前同为 `cebdcda66dbdcfde8b8de9331650753fb138b223`，内容仍为 `default_workflow: native` + `workflows: [native, classic]`）。
- 本轮无新增 fork 专属代码文件，白名单表只修订共享文件的叠加语义条目，并新增 2 行（`src-tauri/src/database/dao/providers.rs`、`src/lib/api/settings.ts` 由「本轮起进入共享文件表」）。
- 同步提交（`chore: sync fork with upstream v4.0.6`）：版本号 4.0.5-1 → 4.0.6-1（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock`，`Cargo.lock` 由 `cargo check` 联动）、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订（17 处 v4.0.6 语义）、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v406`）：change 目录移入 `docs/comet/archive/<date>-sync-upstream-v406`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。

#### App.tsx 合并教训（本轮踩坑，后续同步必读）

用「按行去重」合并两段 JSX 会破坏结构：上游与 fork 两个按钮块都含 `<Button`、`}`、`>`、`)}` 等相同行，去重后 `title={` 的三元表达式被截断成 `title={
 ? t(...)`，`tsc` 报一连串 TS1109/TS1136/TS1003。正确做法：把两块各自完整取出，整块拼接（ours 块 + theirs 块），再核对括号平衡与「每个图标都导入且都使用」。lucide 导入块取两边并集后按字母序重排即可，与按钮块无关。

### 同步范围

- 上游新增提交：merge-base 2db86e94 → c2611266（v4.0.6 tag），共 24 个提交、89 个文件、约 +3953/−729 行，覆盖 v4.0.6 全部发布内容：
  - c5efe0ba feat(providers)：供应商页页头搜索按钮，可按请求地址查找；新增 `show_provider_search` 设置（默认开，快捷键仍可用）。文件：`src/components/providers/ProviderList.tsx`（+166/−）、`src/components/settings/sections/GeneralSection.tsx`（+11）、`src-tauri/src/settings.rs`（+21）、`src/lib/api/settings.ts`（+5）、`src/types.ts`、4 个 locales、`tests/components/ProviderList.test.tsx`（+55）、`src/utils/providerConfigUtils.ts`（+37，`extractProviderBaseUrl`）。
  - c1cb531f feat(skills) + 033017b0 fix(skills)：Skills 一键全部更新（确认框列出每个 Skill 与来源仓库）、导入对话框不再因「发现」页重新下载而锁死。文件：`src/components/skills/UnifiedSkillsPanel.tsx`（+138/−）、`src/hooks/useSkills.ts`（+17）、`src/components/providers/forms/hooks/useManagedAuth.ts`、`tests/hooks/useImportSkillsFromApps.test.tsx`、`tests/components/UnifiedSkillsPanel.test.tsx`（+101/−）。
  - 0be33a84 fix(quota) + 4629ee2f fix(tray)：额度数字恢复绿/橙/红三色、警告阈值 10% → 20%、托盘应用行标题写全部额度档位（#8011：只留剩余最少两档时 5 小时档几乎总被挤掉）。文件：`src-tauri/src/tray.rs`（+56/−，`WARN_BELOW_PERCENT` 10.0 → 20.0、删除 `pick_lines`、`quota_title` 写全部档位）、`src/components/quota/QuotaLines.tsx`（+76/−）、`src/components/quota/quotaRules.ts`（+15）、`src/components/quota/AccountQuota.tsx`、`src/components/UsageFooter.tsx`、`tests/components/quotaRules.test.ts`、`tests/components/SubscriptionQuotaFooter.test.tsx`。
  - 6760cfbb feat(codex) + c37a2625 fix(proxy)：聚合模式经典子 agent 工具开关（`codex_stack_classic_subagents`，默认关）、子 agent 任务不可读时报错说明原因而非清空。文件：`src-tauri/src/mode/controller.rs`（+170/−）、`src-tauri/src/mode/stack.rs`、`src-tauri/src/commands/settings.rs`（+28）、`src-tauri/src/settings.rs`（`codex_stack_classic_subagents` 字段 + 访问器 + Default）、`src/lib/api/settings.ts`、`src-tauri/src/lib.rs`（`codex_forces_multi_agent_v2` 命令注册 +1）、`src/components/settings/CodexAuthSettings.tsx`（+43）、`src/components/providers/mode/SwitchModePanel.tsx`、`src/types/proxy.ts`、`tests/components/CodexAuthSettings.test.tsx`（+65）、`tests/components/SwitchModePanel.test.tsx`（+23）、`tests/components/Switch.test.tsx`。
  - 4aeaccf1 fix(codex)：删除托管账号或全部登出时解除 Codex 供应商绑定（`unbind_codex_managed_accounts`，只解本机账号）。文件：`src-tauri/src/database/dao/providers.rs`（+86 新方法）、`src-tauri/src/commands/auth.rs`（+26/−）、`src-tauri/src/services/provider/mod.rs`。
  - 889b797d fix(claude) + 86421718 fix(proxy)：npm 安装的 Claude Code 升级路径允许安装脚本（#7099）、Anthropic SSE 终止事件前关闭未闭合 content block（#7986）。文件：`src-tauri/src/commands/misc.rs`（+187/−）、`src-tauri/src/proxy/forwarder.rs`（+441/−）、`src-tauri/src/proxy/providers/streaming.rs`（+179 新文件）。
  - ae934663 fix(codex) + dc93c496 fix(codex) + b4a07943 fix(codex)：第三方目录条目改用 CC Switch 自带的经典工具模板（不再跟随 Codex 本地官方缓存条目）、聚合模式官方模型保持可见（按本机实际最新版本拉取）、Copilot 不再持久化代表性 apiFormat（#7972）。文件：`src-tauri/src/services/provider/codex_client_catalog.rs`（+227/−）、`codex_official_models.rs`（+342/−）、`codex_direct.rs`、`src-tauri/src/codex_config.rs`（+358/−）、`src-tauri/src/resources/gpt5_5_template.json`、`src-tauri/src/proxy/providers/codex_compaction.rs`（+72/−）、`src-tauri/src/proxy/opaque_state_rectifier.rs`（+219/−）、`src/config/codexProviderPresets.ts`（−1）、`tests/utils/providerConfigUtils.baseUrl.test.ts`（+53 新文件）、`tests/components/ProviderForm.codexCopilot.test.tsx`。
  - 1beb8fa8 feat(ui)：CC Switch 有新版本时侧栏「设置」提示点改绿并从该点打开「关于」页；工具更新提示点保持中性色。文件：`src/components/shell/Sidebar.tsx`（+13/−，`NavItem` 新增 `dotTone`）、`src/components/settings/SettingsPage.tsx` 相关、4 个 locales。
  - 8919d05c fix(ui)：应用页「显示」列开关改用 action 色。文件：`src/components/ui/switch.tsx`（+18/−）、`src/components/apps/AppsPage.tsx`、`src/components/mcp/formBits.tsx`、`src/components/providers/CodexStaleClientsNotice.tsx`、`tests/components/AppsPage.test.tsx`、`tests/components/CodexStaleClientsNotice.test.tsx`、`tests/components/CodexAuthSettings.test.tsx`。
  - ffffd43c fix(codex) + 66144d58 fix(codex)：第三方压缩摘要轮保留工具定义（#7991）、Stack 模式外也提示缓存账号重启（#8006）。文件：`src-tauri/src/proxy/providers/codex_compaction.rs`、`src-tauri/src/mode/controller.rs`。
  - 42d47956 ci(release)：Linux deb/rpm 包缺失时快速失败（#7985）。文件：`.github/workflows/release.yml`（+46/−）。
  - 449c7e78 docs + f025ee05 docs(faq)：新增中文聚合模式指南与 5 张图、三语手册更新 Linux 应用级窗口按钮设置路径。文件：`docs/guides/aggregation-mode-guide-zh.md`（+168）、`docs/images/aggregation-mode/**`、`docs/user-manual/{zh,en,ja}/**`。
  - 18bdea7c chore(icons)：DMXAPI logo 更新（`src/icons/extracted/dmxapi.png`）。
  - 314968b6 chore(release) v4.0.6：4 个版本文件 + `CHANGELOG.md`（+43）；c2611266 docs(release)：`docs/release-notes/v4.0.6-{zh,en,ja}.md`、`src/whats-new/4.0.6.json`。
- 不做部分 cherry-pick：同步范围是 v4.0.6 tag 前的全量新增提交，一次 rebase 完成。
- 上游本轮在 `docs/user-manual/**` 与 `docs/guides/**` 新增/更新的文档与图片不在 fork 白名单，随上游落地。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 28 个文件：5 个版本与锁文件（`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、fork 重写与裁剪文件（`README.md`、`.github/workflows/release.yml`）、后端共享文件（`src-tauri/src/lib.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/commands/misc.rs`、`src-tauri/src/database/dao/providers.rs`、`src-tauri/src/proxy/forwarder.rs`、`src-tauri/src/services/provider/mod.rs`）、前端共享文件（`src/App.tsx`、`src/components/providers/ProviderCard.tsx`、`src/components/providers/ProviderList.tsx`、`src/components/providers/forms/ProviderForm.tsx`、`src/components/settings/sections/GeneralSection.tsx`、`src/components/shell/Sidebar.tsx`、`src/config/codexProviderPresets.ts`、`src/lib/api/settings.ts`、`src/types.ts`）、4 个 i18n locales、`tests/components/ProviderList.test.tsx`。
- 相对 v4.0.5 轮新增的 4 个重叠文件及其叠加要求：
  - `src-tauri/src/commands/settings.rs`：以上游 `codex_stack_classic_subagents` 开关的落库与失败回滚（+28）为基础；叠加 fork 侧既有改动——移除 `install_update_and_restart` 的下载安装实现（保留命令接口兼容旧前端）、移除 `tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构、`Emitter` 导入相应调整。两侧必须并存，不得因取上游侧而复活 updater 链路。
  - `src-tauri/src/database/dao/providers.rs`：以上游 `unbind_codex_managed_accounts`（+86）为基础；叠加 fork 侧 `website_url_2` 列——`get_providers` / `get_provider` 两条 SELECT 的列清单、`row.get(N)` 索引整体后移一位、`Provider` 结构体构造多 `website_url_2` 字段。上游新方法不触碰这两条查询，预期 git 自动合并；若冲突按上述语义手工叠加。
  - `src/lib/api/settings.ts`：以上游 `codexForcesMultiAgentV2()` 绑定（+5）为基础；叠加 fork 侧移除的 `installUpdateAndRestart()`（fork 关闭应用内更新器，该方法不得复活）。
  - `tests/components/ProviderList.test.tsx`：以上游供应商页搜索用例（+55）为基础；叠加 fork 侧右键快捷排序与 failover 的 mock 段（`updateSortOrderMock` / `updateTrayMenuMock` / `toastMock`、`@/lib/api/providers` 部分 mock、`@/lib/query/failover` mock 取代已删除的 `@/hooks/useStreamCheck` mock）。fork 把 `useStreamCheck` mock 换成 failover mock 是因为上游旧链路已删，该改动必须保留。
- 仅上游改动、无 fork 改动的文件直接落上游版本：`src-tauri/src/mode/controller.rs`、`src-tauri/src/mode/stack.rs`、`src-tauri/src/codex_config.rs`、`src-tauri/src/commands/auth.rs`、`src-tauri/src/proxy/opaque_state_rectifier.rs`、`src-tauri/src/proxy/providers/{streaming,codex_compaction}.rs`、`src-tauri/src/resources/gpt5_5_template.json`、`src-tauri/src/services/provider/{codex_client_catalog,codex_direct,codex_official_models}.rs`、`src/components/skills/UnifiedSkillsPanel.tsx`、`src/hooks/useSkills.ts`、`src/components/providers/forms/hooks/useManagedAuth.ts`、`src/components/settings/CodexAuthSettings.tsx`、`src/components/providers/mode/SwitchModePanel.tsx`、`src/components/quota/QuotaLines.tsx`、`src/components/quota/quotaRules.ts`、`src/components/quota/AccountQuota.tsx`、`src/components/UsageFooter.tsx`、`src/components/ui/switch.tsx`、`src/components/apps/AppsPage.tsx`、`src/components/mcp/formBits.tsx`、`src/components/providers/CodexStaleClientsNotice.tsx`、`src/components/providers/forms/hooks/useManagedAuth.ts`、`src/utils/providerConfigUtils.ts`、`src/types/proxy.ts`、`README_ZH/DE/JA.md`、`CHANGELOG.md`（fork 在本轮区间未改动）、`docs/guides/**`、`docs/release-notes/v4.0.6-*.md`、`docs/user-manual/**`、`src/whats-new/4.0.6.json`、`src/icons/extracted/dmxapi.png`、上游新增测试。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- 共享文件以上游 v4.0.6 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：以上游本轮新增的 `codex_forces_multi_agent_v2` 命令注册（+1）为基础；叠加并保持 fork —— 移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册；不得因重放复活 updater 链路。
  - `src-tauri/src/tray.rs`：以上游本轮改动为基础（`WARN_BELOW_PERCENT` 20.0、删除 `pick_lines`、`quota_title` 写全部档位、相关测试改名与新增）；叠加 fork 的左键单击切换逻辑（`toggle_main_window` 与左键 Up 分支）。此文件连续两轮是「最容易整文件取一侧而丢语义」的点，解完冲突后必须逐行复核合并结果。
  - `src-tauri/src/settings.rs`：以上游 `show_provider_search`（默认 true）与 `codex_stack_classic_subagents`（默认 false）两个新字段、`Default` 实现两行与 `codex_stack_classic_subagents()` 访问器为基础；叠加 fork 的 `VisibleSidebarPanels` 结构 + `AppSettings.visible_sidebar_panels` 字段段。
  - `src-tauri/src/commands/misc.rs`：以上游 npm 安装/升级路径允许安装脚本的改动（+187/−）为基础；保持 fork 的连通性测试命令注册与 `connectivityTest` sanitize 隔离。
  - `src-tauri/src/proxy/forwarder.rs`：以上游本轮 +441/− 的 Anthropic SSE 收尾、加密子 agent 任务流起始、第三方压缩工具保留等改动为基础；叠加 fork 的 connectivityTest sanitize 隔离与测试里 Provider 字面量的 `website_url_2: None`。上游测试区若重构，取上游侧后必须确认 `test_provider_with_type()` 内仍带 `website_url_2: None`，否则 `cargo test` 编译失败。
  - `src-tauri/src/services/provider/mod.rs`：以上游第三方目录自带模板、官方模型可见性、托管账号解绑接线（+249/−）为基础；叠加 fork 侧既有改动（provider 字段读写、`website_url_2` 与连通性测试相关接线），保持两侧语义并存。
  - `src/components/providers/ProviderList.tsx`：以上游页头搜索按钮（含 `extractProviderBaseUrl` 按请求地址查找、+166/−）为基础；叠加 fork 的右键一键置顶/置底（`applyQuickSort` + `updateTrayMenu` 刷新）、ConnectivityTestDialog、批量探针徽标接线、`websiteUrl2` 搜索。fork 侧在该文件存量改动密度高，是本轮前端最主要的合并点。
  - `src/components/providers/ProviderCard.tsx`：以上游把 `extractApiUrl` 内联实现替换为 `extractProviderBaseUrl(provider.settingsConfig) ?? fallbackText` 的重构为基础；叠加 fork 的模型徽章（`extractModelBadgeForProvider`）、ConnectivityBadge 探针徽标、双官网链接横排、右键菜单挂载。注意上游删掉了 `extractCodexBaseUrl` 导入，fork 若仍引用需改走 `extractProviderBaseUrl`。
  - `src/components/providers/forms/ProviderForm.tsx`：以上游本轮 +99/−（搜索接线、Copilot 相关调整）为基础；叠加 fork 的跨应用导入接线（`ProviderImportEntry` + `useProviderImportApply`，编辑/新建两条同步路径）与 `ProviderPresetSelector.extraActions` 插槽。
  - `src/components/settings/sections/GeneralSection.tsx`：以上游「显示供应商搜索」开关行（+11）为基础；叠加 fork 的侧边面板可见性 pill 开关行（skills/sessions/mcp/prompts/batchTest）。
  - `src/components/shell/Sidebar.tsx`：以上游 `NavItem` 的 `dotTone`（neutral/success）与「设置」项 `dotTone="success"` 为基础；叠加 fork 的全局面板项（MCP/Skills/会话/Prompts）按 `visibleSidebarPanels` 过滤。
  - `src/App.tsx`：以上游本轮 +43/− 为基础；叠加 fork 的批量连通性探针状态提升（useConnectivityProbe）、页头「批量检测」按钮按 `visibleSidebarPanels.batchTest` 与 `shouldShowTestEntry` 门控、托盘同款 window-title 守卫、`IS_FORK_BUILD` + `isTauri` 双守卫下的 `setTitle` useEffect。
  - `src/config/codexProviderPresets.ts`：上游本轮只删 1 行；fork 的预设接口 `hidden?: boolean` 与官方预设过滤接线照常生效（上游预设是否可见由 fork 白名单决定，不要手工放开）。
  - `src/types.ts`：以上游新增类型（`showProviderSearch`、`codexStackClassicSubagents`、`dotTone` 等）为基础；叠加 fork 的 `websiteUrl2`、`VisibleSidebarPanels` 等类型段。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游新增键（供应商搜索、Skills 全部更新、额度三色、经典子 agent 开关、更新点等）与删改键按上游执行；保留 fork 的 `devpanel` 段与 `connectivityTest` / `connectivityCheck` 等 fork 键段，合并后 fork 键不得缺失。
  - 5 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 取 fork 版本号 4.0.6-1（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）；`pnpm-lock.yaml` 与 `src-tauri/Cargo.lock` 以上游依赖变动为基础，只针对 fork 专属条目取 fork 侧（`@tauri-apps/plugin-updater` 的 specifier / resolution / snapshot 三段，`cc-switch` 包版本号）。收尾用 `pnpm install` 与 `cargo check` 复验：两者都报告锁文件未被改写，才算与 `package.json` / `Cargo.toml` 一致。
  - `.github/workflows/release.yml`：保留 fork 裁剪版（仅 Windows x64 与 macOS arm64 unsigned、跳过上游 tag 发版）；上游 42d47956 的 deb/rpm 缺失快速失败属上游 Linux 发布链路，不引入 fork 发布链路。
  - `README.md`：保留 fork 重写版；上游 v4.0.6 的 3 行改动不覆盖 fork 差异说明。
- 本轮 fork 侧未改动的共享文件（`AboutSection.tsx`、`ProviderCardActions.tsx`、`lib/query/mutations.ts`、`ClaudeFormFields.tsx`、`ModelQuickSwitch/`、`SearchableModelPicker*`、`database/schema.rs`、`database/mod.rs` 等）随上游与重放自然落地，fork 语义保持既有状态；`AboutSection.tsx` 需确认 fork 的 tunecc Releases 指向与更新器禁用仍在（上游 `src/whats-new/4.0.6.json` 会让 whats-new 摘要入口显示 v4.0.6 条目）。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.6 仍为 20，发行说明明确「数据库结构没有变化」）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 上游 v4.0.6 未改动 `src-tauri/src/database/mod.rs` 与 `schema.rs`，本轮不新增迁移步骤；后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- Builder 交接的检查计划字段须用 Runtime 形态 `{id,name,executable,argv,cwdRef,timeoutMs,repeatable}`；`executable` 只写程序名，不要把程序名同时塞进 `argv[0]`（Runtime 按 `executable + argv` 原样拼接，会报 `error: no such command: cargo`）。
- 重放中途不能跑 `cargo test`：fork 历史提交 `4b437070` 的两个 blob 自带未清理冲突标记，只有最终态才可编译校验。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.6-1`（同步前工作树为 4.0.5-1，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.6 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q2 明确授权，执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- Q2 已授权发布（2026-10-10 用户选择 A+B）：随后在归档提交上创建 annotated tag `v4.0.6-1` 并 `git push origin v4.0.6-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）。
- Claude fallback model 快捷访问区与快捷设置按钮对齐。
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
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/tray.rs`（上游额度阈值 20% 与全档位标题 + fork 左键切换）、`src-tauri/src/settings.rs`（上游两个新设置字段 + fork `visible_sidebar_panels`）、`src-tauri/src/commands/settings.rs`（上游经典子 agent 开关落库回滚 + fork 更新器命令移除）、`src-tauri/src/database/dao/providers.rs`（上游解绑方法 + fork `website_url_2` 列索引）、`src/lib/api/settings.ts`（上游新命令绑定 + fork 移除更新命令）、`src/components/providers/ProviderList.tsx`（上游页头搜索 + fork 右键排序与批量探针）、`src/components/providers/ProviderCard.tsx`（上游 `extractProviderBaseUrl` 重构 + fork 徽章与双链接）、`src/components/providers/forms/ProviderForm.tsx`、`src/components/settings/sections/GeneralSection.tsx`（上游搜索开关行 + fork pill 行）、`src/components/shell/Sidebar.tsx`（上游 `dotTone` + fork 面板过滤）、`src/App.tsx`、`src-tauri/src/proxy/forwarder.rs` 与 `src-tauri/src/services/provider/mod.rs`、`src-tauri/src/lib.rs`、`src/config/codexProviderPresets.ts`、`src/types.ts`、4 个 locales、`tests/components/ProviderList.test.tsx`（上游搜索用例 + fork 快捷排序 mock）、`README.md` 与 `.github/workflows/release.yml`（白名单保留 fork 侧的上游改动不引入）、`CHANGELOG.md`（本轮 fork 侧无改动，取上游版本）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过。
- 上游测试的零点窗口（既有实测记录，不改变任何验收要求）：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min / 1h / 3h / 4h / 5h` 构造会话，却断言存在「今天」分桶；本地时间落在 00:00–00:30 时 `now - 30min` 已属于前一天，该桶不存在，用例必然失败。该测试文件与 `src/components/sessions/SessionManagerPage.tsx` 在同步前后逐字节相同，因此与本次同步无关：00:30 之后跑出的正式结果才算数。同步过程中跨越零点时，遇到该单项失败先查时钟窗口再查实现，不要据此改动上游文件或放宽 A9。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q2 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路）。
- 不引入上游 Linux deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = e574d8ae，安全分支 `pre-sync-v406` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q2 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
