# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.20`（tag 对象 `79738d9`，剥离提交 `85ad4969`），fork 侧 182 个提交（`v4.0.19..main`，当前 main `1c10d67aa`）按原顺序整体重放，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.19-1` 升为 `4.0.20-1`。

上游 `v4.0.19..v4.0.20`：**39 提交、205 文件、+12058/−3050（13 新增 / 1 删除 / 191 修改）**，与 fork 的重叠面为 **51 个文件**（fork 侧自 `v4.0.19` 起改动 466 个文件、+56783/−2754）。本轮主轴是 **Oh My Pi（`omp`）成为第 13 个应用、第 12 个 CLI 工具**：它复用 Pi 的全部管线（表单、配置、当前状态、会话读取、MCP），但 `models.yml` 有更严格的 schema 校验，且默认模型写在 `config.yml`；同时上游把数据库 schema 从 22 升到 23（`mcp_servers` 加 `enabled_omp`，Skills 不加），与 fork 已是 23 的 schema 撞车——fork 必须升到 24 并保留自己的 v21→v22 AGY、v22→v23 Kimi 幂等补齐。其余上游改动包括：应用页拖拽排序 + 侧栏跟随（`settings.appOrder`）、应用页按已安装/未安装分组、Pi/omp 的「折叠高级选项」与「拉取模型选择弹窗」、Kimi 官方账号模型编辑与无套餐提示、托管 ChatGPT 账号浏览器登录（新增 `prost` 依赖）、土耳其语补全、预设模型批量刷新（移除 EveryAPI）、用量/托盘/会话修复、Linux 窗口拖动与缩放反馈。

**上游是否重写了 fork 已有功能（用户要求先对比再询问）——本轮结论：没有重复实现，四处同域但语义不同或只是新应用相交，均不构成“保留上游还是保留 fork”的二选一。**

1. **应用拖拽排序（上游）与侧栏面板可见性（fork）不是同一功能**：上游 `app_order` 决定应用在应用页与侧栏中的先后顺序；fork 的 `VisibleSidebarPanels` 决定 MCP / Skills / 会话 / Prompts 等全局面板是否显示。两者写不同设置键、改不同 UI，叠加后并存。
2. **Pi/omp 表单重构（上游）与 fork 的 Pi 表单魔改（双官网、导入、白名单）在同一文件**：上游把兼容项/请求头收进折叠的高级选项、把拉取模型改成弹窗；fork 保留 `websiteUrl2`、跨应用导入入口与白名单过滤。两份改动是不同区域，按叠加处理。
3. **Claude 表单的 Copilot 自动协议路由（上游）与 fork 的接口格式位置调整（fork）**：上游在 Copilot 预设下禁用「上游格式」选择并显示自动路由提示；fork 把该选择器移进了请求地址行的 `rightSlot`。上游语义必须适配到 fork 的布局，不涉及取舍。
4. **omp（新应用）与 fork 的三项功能相交，必须由用户拍板**（Q1–Q3）：
   - 预设白名单：`forkOfficialAllowlist` 是 `Record<AppId, string[]>`，`AppId` 新增 `omp` 后必须有条目，否则 typecheck 失败（Q1）。
   - 跨应用导入：omp 会成为所有分发版应用可见的导入来源（`useProviderImportSources` 按 `APP_IDS` 枚举），且它复用 Pi 表单，导入入口会自然出现；需要决定 omp 作为来源/目标的口径（Q2）。
   - 模型徽章 / 快捷切换：fork 只覆盖 claude/codex/gemini/grokbuild；omp 的默认模型在 `~/.omp/agent/config.yml`，不在供应商 `settingsConfig` 里（Q3）。
5. **schema 撞号（23 vs 23）是实现决定，不是产品取舍**：按既有约定 fork 升到 24、合并 22→23 迁移臂、新增 23→24 幂等补列臂，用户不可见。

交付沿用上轮方式（Q4）：验收通过并归档后推 main + 打 `v4.0.20-1` tag。

- 基线 tag `v4.0.20` = `79738d9`（剥离提交 `85ad4969`）；`upstream/main` 比 tag 多 1 个提交（`de0a235ad`），本轮只锁 tag，不同步 tag 之后的提交。
- 版本号 `4.0.19-1` → `4.0.20-1`；上游本轮新增 `prost = "0.14"` 依赖（托管 ChatGPT 浏览器登录），`Cargo.lock` 随之新增条目。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v420/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v420/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v420`（= 同步前 main `1c10d67aa`），仅用于回退参照、重放前后 diff 对照与落地保真四 ref 比对。
- 随上游 rebase 落地的上游新增文件 13 个（`git diff --name-status v4.0.19 v4.0.20` 的 A 项），fork 在这些文件上无自有语义，全部随上游落地：
  - omp 后端：`src-tauri/src/omp_config.rs`、`src-tauri/src/commands/omp.rs`、`src-tauri/src/mcp/omp.rs`、`src-tauri/src/services/provider/omp.rs`、`src-tauri/src/session_manager/providers/omp.rs`。
  - 其他后端：`src-tauri/src/proxy/providers/codex_oauth_auth/browser.rs`（托管 ChatGPT 浏览器登录）、`src-tauri/src/services/session_usage_agy/native_models.rs`（agy 原生 generation 用量模型）。
  - 前端与测试：`src/config/ompProviderPresets.ts`、`tests/config/ompProviderPresets.test.ts`。
  - 发布物料：`docs/release-notes/v4.0.20-{en,ja,zh}.md`、`src/whats-new/4.0.20.json`。
- 交付步骤（验收通过并归档后，按 Q4 授权）新增本地 annotated tag `v4.0.20-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.19-1` → `4.0.20-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包版本联动；`prost` 条目随上游新增）。
- 51 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.19 v4.0.20 | sort) <(git diff --name-only v4.0.19 HEAD | sort)`；上游 205 文件 + fork 侧 466 文件）。逐文件行数口径（`git diff --numstat v4.0.19 <ref> -- <file>`，**上游 / fork**）：
  - 仓库根：`README.md` 7/11（fork 96/543，fork 为整文件自有的「与上游的差别」版，冲突时保留 fork 整文件）、`package.json` 1/1（2/2）、`src-tauri/Cargo.toml` 2/1（3/6）、`src-tauri/Cargo.lock` 25/1（4/174）、`src-tauri/tauri.conf.json` 1/1（5/11）。
  - 后端：`commands/misc.rs` 152/10（6/5）、`commands/mod.rs` 2/0（2/2）、`database/dao/mcp.rs` 6/3（1/1）、`database/mod.rs` 1/1（1/4）、`database/schema.rs` 42/1（338/3）、`database/tests.rs` 30/0（76/0）、`deeplink/provider.rs` 6/1（1/0）、`lib.rs` 11/0（32/42）、`provider.rs` 20/2（45/1）、`proxy/providers/mod.rs` 4/2（1/0）、`services/provider/live.rs` 18/3（44/0）、`services/provider/mod.rs` 77/11（4/0）、`services/provider/pi.rs` 17/4（1/0）、`settings.rs` 52/2（47/0）、`tray.rs` 33/24（75/6）。
  - 前端：`src/App.tsx` 174/18（88/2）、`AddProviderDialog.tsx` 7/5（1/0）、`EditProviderDialog.tsx` 8/7（2/0）、`ProviderList.tsx` 20/13（229/10）、`forms/ClaudeDesktopProviderForm.tsx` 11/1（85/12）、`forms/ClaudeFormFields.tsx` 16/2（276/221）、`forms/KimiProviderForm.tsx` 107/50（11/4）、`forms/PiProviderForm.tsx` 252/84（65/43）、`forms/ProviderForm.tsx` 1/1（183/43）、`forms/ProviderPresetSelector.tsx` 3/1（18/10）、`components/shell/Sidebar.tsx` 5/2（12/2）、`config/appConfig.tsx` 47/1（9/1）、`lib/query/mutations.ts` 14/12（63/0）、`types.ts` 6/0（14/0）。
  - 预设：`src/config/{gemini,grokBuild,hermes,openclaw,opencode,pi}ProviderPresets.ts` 60/60、5/4、562/280、952/614、408/228、269/248（fork 侧均为 2/0 的 `hidden` 字段）。
  - 本地化：`src/i18n/locales/{en,ja,zh-TW,zh}.json` 70/9、70/9、71/10、71/10（fork 侧 en 328/25、ja 315/24、zh-TW 315/24、zh 327/24）；`tr.json` 上游本轮补全（fork 侧零改动，整文件取上游）。
  - 测试：`tests/components/{AddProviderDialog,AppsPage,ClaudeDesktopProviderForm,ClaudeFormFields,EditProviderDialog,ProviderPresetSelector}.test.tsx` 58/0、148/5、7/0、11/0、29/0、2/2（fork 侧 3/0、12/6、14/0、140/0、47/0、33/0）与 `tests/components/__snapshots__/ProviderForm.presetRows.golden.test.tsx.snap` 9/23（10/0）。
  - 完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 154 个文件随 rebase 直接落地，含 omp 全套新增文件、托管 ChatGPT 浏览器登录、agy 原生用量模型、Windows/Linux/用量/托盘修复、预设刷新、`src/whats-new/4.0.20.json`、3 份 release notes 与 EveryAPI banner 删除。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（`database/schema.rs`、`commands/misc.rs`、`settings.rs`、`tray.rs`、`PiProviderForm.tsx`、`KimiProviderForm.tsx`、`ProviderForm.tsx`、`ProviderList.tsx`、`ClaudeFormFields.tsx`、`App.tsx`、`appConfig.tsx`、`Sidebar.tsx` 等行的 v4.0.20 口径），新增 §4.7「v4.0.20 轮的叠加要点」（omp 交集、schema 24、`appOrder` 与侧栏面板并存、Pi 高级选项折叠）。
- `docs/comet/specs/upstream-sync/spec.md`：归档时更新为本轮同步后的完整状态（重放映射、冲突清单、落地保真核对与逐行归类）。
- `docs/comet/specs/database-schema-migrations/spec.md`：登记 SCHEMA_VERSION 24 与 22→23（fork Kimi 幂等 + 上游 omp 列合并）/ 23→24（Kimi + omp 幂等补齐）两步、降级不兼容。
- `docs/comet/specs/provider-cross-app-import/spec.md`：按 Q2 结果登记 omp 的纳入/排除与形状。
- `docs/comet/specs/provider-model-quick-view-switch/spec.md`：按 Q3 结果登记 omp 的徽章/快捷切换口径。
- 把本地 main rebase 到 tag `v4.0.20`（`79738d9` → 剥离提交 `85ad4969`）：当前 merge-base 为 `d8983bb`（v4.0.19）。

### 删除

- 上游本轮删除 1 个文件：`assets/partners/logos/everyapi-banner.jpg`（EveryAPI 赞助商退出），随上游删除；fork 侧对该文件零自有语义。
- 上游本轮删除托盘 `TrayTexts.balance_used_up` 字段及四语取值、改写 zh-TW 三条额度失败文案，按上游落地；fork 的托盘左键分支与文案钩子不动。
- 上游本轮删除部分 locale 键并新增大量键（en/ja/zh 各 9 删、zh-TW 10 删），以 `v4.0.20` 删除集合为准，fork 代码不得残留对已删除键的引用。
- fork 已删除的 updater 链路、`stream_check` 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式 `current`，直接沿用 main；`pre-sync-v420` 是安全参照分支）。
- 不新增 fork 专属代码文件；不改 `forkPresetFilter.ts` 判定实现；不改 `forkOfficialAllowlist` 既有条目（除 Q1 决定的新增 `omp` 条目）。
- 不创建 PR；不推送除 Q4 授权范围之外的任何远端引用。
- 不支持「fork v24 数据库被上游 v4.0.20（v23）打开」的降级兼容（上游自身即对更高版本报错，fork 沿用同一策略并在文档登记）。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与本轮上游 tag 逐字节一致）。
- 不同步 `upstream/main` 上 tag 之后的提交 `de0a235ad`，也不同步其他上游分支。
- 不复活 fork 已删除的应用内更新器与 `stream_check` 链路；不新增赞助商/聚合站预设到 fork 白名单（上游新增的预设只影响上游构建）。
- 不在 Q3 选 A 时给 omp 增加 fork 专属的模型快捷切换通路或文案。

## 上游本轮同步范围（v4.0.19..v4.0.20，39 提交 205 文件 +12058/−3050）

1. **Oh My Pi 接入（13 提交）**：`c8945d2d9`（Oh My Pi 支持）、`2afe8cdbe`（内部 app id 改为 `omp`）、`3d7cf6aa3`（移植文本级 models.yml 编辑器并共用 Pi 管线）、`a03c6c7a3`（复用 Pi 表单与管线）、`e88a9fa41`（用 Pi 会话读取器读 omp 会话）、`b34753b83`（omp 全局 prompts）、`f1d43ebaa`（README 列出 omp）、`9bacd1d17`（会话预览允许项目图片）、`d9422e7d6`（安装/升级不假定 Bun）、`d01daa0d6`（导入 Skills 时隐藏 omp）、`c6617bc23`（omp 说明移到 MCP/Skills 列）、`6e040f4c8`（providerKey 对照 omp 自己的 providers 查重）、`f67cb33dd`（匹配 omp 的 apiKey、models.json 与 schema 规则）。
2. **Pi/omp 共用表单（3 提交）**：`6c2fc74e3`（拉取模型改为弹窗选择，Pi 与 omp 共用）、`5f6426400`（少用的供应商设置收进折叠高级选项）、`dcdcbcb47`（用量查询解析 apiKey 的 `$NAME` 引用）。
3. **Kimi 与定价（4 提交）**：`c3e54a4e8`（Kimi K3.1 Pro / HighSpeed 价格）、`626529451`（编辑官方账号模型、可从 Kimi 移除）、`c91aa7740`（无 Kimi Code 套餐显示 “No subscription”）、`f395cd6be`（从子代理自有 wire log 导入 Kimi 用量）。
4. **应用顺序与 Apps 页（4 提交）**：`5bc562ce0`（应用页按已安装/未安装分组）、`b71141a86`（拖拽排序已安装应用，侧栏跟随）、`ba6a8a555`（Claude Desktop 按是否安装分组）、`72b056f6e`（余额用尽仍显示金额）。
5. **用量与托盘修复（3 提交）**：`b9f317af5`（DeepSeek 空余额不再当作套餐过期）、`28a2ebc0e`（每个 tab 显示计数且过滤变化时计数稳定）、`e68e69437`（中文额度失败文案改为「额度查询失败」）。
6. **其他修复（8 提交）**：`1a3057dc1`（Claude 会话标题跳过本地命令输出）、`e8ae28b65`（Linux 恢复窗口拖动与缩放反馈）、`7f9cd9e96`（孤儿工具结果媒体用附加标记）、`bd50984e0`（Copilot 自动协议路由在表单中体现）、`c72c82cfb`（托管 ChatGPT 账号浏览器登录）、`309c9c515`（agy 从原生 generation 恢复子代理用量模型）、`442df1db7`（下载 skill 归档带 User-Agent）、`9decd60e8`（土耳其语目录补全）。
7. **预设刷新（2 提交）**：`cae7c3754`（移除 EveryAPI 赞助商与预设）、`50a9d103d`（预设模型跟进厂商最新阵容，顶层预设名不变）。
8. **发布相关（2 提交）**：`c9e059a4d`（四处版本号 4.0.20）、`85ad4969b`（3 份 release notes + `src/whats-new/4.0.20.json`）。

# 非目标

- 不同步 upstream 其他分支；不做部分 cherry-pick；不纳入 tag 之后的 `de0a235ad`。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.19-1` 及更早的 fork tag。
- 不重构 fork 既有魔改以迎合上游新代码；只做叠加、契约适配与 Q1–Q3 选定的取舍。
- 不改上游 omp / Kimi / 托管 ChatGPT 登录的内部实现；fork 只决定它们与自有功能的交集方式。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不给 `tr.json` 补 fork 键；不保留上游已删除的 locale 键。
- 不恢复应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程或 `stream_check` 链路。
- 不改 fork 的托盘左键分派（本轮上游 `tray.rs` 只加 omp 标签、删 `balance_used_up`、改 zh-TW 文案）。
- 不改上游自带的测试与用例语义（除重放必须连接的改写与 fork 稳定性修正）。
- 不新增数据库迁移之外的结构变更；不改变 fork v20→v21 修复迁移、v21→v22 AGY 补齐、v22→v23 Kimi 补齐的语义。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.20` 等于 `85ad4969`（tag `v4.0.20` 剥离出的提交），`git log v4.0.20..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交。
- A2: 重放前 `git rev-list --count v4.0.19..pre-sync-v420` == 182；重放后 `git rev-list --count v4.0.20..HEAD` 与之的差异只来自「被 git 判定为空而丢弃」或「本轮新增提交」，逐条记录；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行；patch-id 对照走 stdin（`git show <c> | git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，冲突停车逐条记录归属与解法。
- A3: 51 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、除 `README.md` 外无整文件取一侧（高危面为 `database/schema.rs`、`database/tests.rs`、`lib.rs`、`commands/misc.rs`、`settings.rs`、`tray.rs`、`services/provider/{mod,live,pi}.rs`、`PiProviderForm.tsx`、`KimiProviderForm.tsx`、`ClaudeFormFields.tsx`、`ProviderList.tsx`、`App.tsx`、`appConfig.tsx`、`Sidebar.tsx`、4 个 locale、4 个版本与锁文件）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.20-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 24；迁移链：v18→v19（fork `website_url_2` + 上游 mcode 并存）、v19→v20（上游 pi）、v20→v21（fork 修复 mcode/pi + 上游 `enabled_agy`）、v21→v22（fork 幂等补 `enabled_agy` + 上游 `enabled_kimi` 合并）、v22→v23（fork 幂等补 `enabled_kimi` + 上游 `enabled_omp` 合并）、v23→v24（幂等补 `enabled_kimi`（两表）与 `enabled_omp`（仅 `mcp_servers`））全部在位；`create_tables` 的 `mcp_servers` 含 `enabled_agy`/`enabled_kimi`/`enabled_omp`，`skills` 含 `enabled_agy`/`enabled_kimi` 且不含 `enabled_omp`；上游迁移测试改用 `SCHEMA_VERSION` 常量，新增 v23→v24 两侧形状与幂等用例。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤（含 Q1 的 `omp` 条目）、逐模型连通性测试（`lib.rs` 两个命令注册在位，且 omp 维持上游的测试入口关闭）、双官网链接、跨应用导入（含 Q2 的 omp 口径）、禁用应用内更新器、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.7、`database/schema.rs`/`settings.rs`/`tray.rs`/`PiProviderForm.tsx`/`KimiProviderForm.tsx`/`ProviderList.tsx`/`App.tsx` 等行的新口径与 omp 白名单登记），全局与 change 内完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类），三处记录的数字与归属互相一致。
- A8: `pnpm typecheck` 通过（零 `TS2300`，AppId/`VisibleApps`/`forkOfficialAllowlist`/`APP_ICON_MAP` 的 omp 字段无重复声明）。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`ompProviderPresets`、`PiProviderForm`、`AppsPage`、`KimiProviderForm`、`ClaudeFormFields`、`ProviderList`、`AddProviderDialog`、`EditProviderDialog`、`ProviderPresetSelector`、`ClaudeDesktopProviderForm`、`ProviderForm.presetRows.golden`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自 `cc-switch` 版本行 `4.0.20-1` 与上游新增的 `prost` 依赖树；`tauri-plugin-updater` 相关条目不得出现。
- A13: `cargo test` 通过（含 fork 的托盘左键源码护栏、上游 omp/Kimi/AGY/托管登录/代理/用量用例、`database/tests.rs` 的 v22→v23 用例在 24 终态下仍成立）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。
- A14: 落地保真核对通过：对 51 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.19`、`v4.0.20`、`pre-sync-v420`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数（`README.md` 的整文件 fork 版本、`4.0.20-1` 版本号行属已知取舍），未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键，fork 键段按 key 逐个比对全部在位；上游本轮新增键在 4 个 locale 全部在位且取值与 `v4.0.20` 逐字节一致；上游删除的键不再残留（fork 无引用）；fork 专属覆盖 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 保持 fork 文案；`tr.json` 与 `git show v4.0.20:src/i18n/locales/tr.json` 逐字节一致。
- A16: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。
- A17: 上游 omp 能力在 fork 落地后可用：13 个 `APP_IDS` 含 omp、Apps 页可安装/打开 Oh My Pi（Unix/Windows 安装脚本、`omp upgrade`）、omp 表单可用（复用 Pi 表单、providerKey 查重、模型表/拉取模型弹窗、折叠高级选项）、omp 会话/用量/prompts 与 MCP/Skills omp 开关、`enabled_omp` 持久化与迁移、上游新增测试全部通过；omp 不进代理适配器与 deeplink。
- A18: Q1 的 omp 预设白名单生效：`forkOfficialAllowlist.omp` 严格等于 `["Ollama", "LM Studio", "vLLM"]`；omp 表单的预设目录按名称过滤，目录预设 id 仍为原始数组下标（过滤在编号之后）；未列入白名单的赞助商/聚合站/`Ollama Cloud`/`Meta Model API` 等在 fork 构建的所有 omp 入口不可见；其他 app 的白名单不变。
- A19: Q2 的跨应用导入口径生效：omp 的纳入/排除与完整目标规格一致（若为来源：`readImportableProviderFields("omp", …)` 读出顶层 `baseUrl`/`apiKey`，身份字段照常复制，`defaultModel` 为空；若为目标：`PiProviderForm` 以 `appId="omp"` 渲染导入入口，`buildImportedSettingsConfig`/`patchImportedSettingsConfig` 产出与 Pi 同形状的配置）；其余应用的导入行为不变。
- A20: Q3 的 omp 卡片模型口径生效：omp 不进入 fork 的 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗，卡片维持上游 Pi 家族的当前状态与表单模型表；4 个既有 app 的徽章与快捷切换行为不变。
- A21: **fork 左键契约的源码级回归护栏通过**：`src-tauri/src/tray.rs` 的 `tray_left_click_never_opens_the_menu` 用例在重放后仍成立（`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`、`lib.rs` 的 builder 固定 `.show_menu_on_left_click(false)`），上游的 `native_menu_on_left_click` 辅助函数与其调用点在 fork 终态仍为零命中；`lib.rs` 的 `TrayIconEvent::Click` 分支保持 fork 四条分支语义；`tray.rs` 只新增 `AppType::Omp => "Oh My Pi"` 标签与上游文案/字段删改。
- A22: 上游应用排序与 fork 侧栏面板可见性并存：`settings.appOrder` 可往返序列化（camelCase），应用页拖拽后侧栏顺序跟随；`VisibleSidebarPanels` 仍能隐藏 MCP/Skills/会话/Prompts 全局项；两者同时生效时先按 `orderAppIds(settings?.appOrder)` 排序再按 `visibleApps` 过滤，全局项按 `visibleSidebarPanels` 过滤。
- A23: 上游本轮其余改动在 fork 落地后可用：应用页已安装/未安装分组与拖拽、Pi/omp 折叠高级选项与拉取模型弹窗、Kimi 官方账号模型编辑与无套餐提示、托管 ChatGPT 浏览器登录（`prost` 依赖）、agy 原生用量模型、Claude Copilot 自动协议路由提示（适配到 fork 的 `EndpointField.rightSlot` 布局）、Linux 窗口拖动/缩放、用量 tab 计数与 DeepSeek 空余额语义、托盘额度文案、土耳其语、预设模型刷新与 EveryAPI 移除、`src/whats-new/4.0.20.json` 与 release notes。
- A24: 冲突标记零命中：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 为 0（exit 1）。
- A25: schema 24 升级路径正确：模拟上游 v23 形状（有 `enabled_omp`、无 `enabled_kimi`）→ 24 后两表有 `enabled_kimi` 且 `mcp_servers` 保留 `enabled_omp`；模拟 fork v23 形状（有 `enabled_kimi`、无 `enabled_omp`）→ 24 后 `mcp_servers` 有 `enabled_omp`、`skills` 仍无 `enabled_omp`；重复调用幂等；既有 v21/v22 幂等用例保持通过。

# 约束与不变量

- fork 全部 182 个提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v420`（= `1c10d67aa`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；`--ours` 是新基线（v4.0.20），`--theirs` 是重放的 fork 提交。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对冲突标记零命中。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- 重放前工作树必须干净（当前仅有本 change 的 `docs/comet/changes/sync-upstream-v420/` 产物）；不得丢弃或改写 `.comet/runtime/`、archived change 与既有 tag。
- 上游本轮不触碰 `.gitignore`；若工作树出现新的 Comet Runtime 托管忽略块，先作为独立 chore 提交再开始重放。
- 版本号、上游 tag、schema 号、迁移臂、落地保真数字必须与完整目标规格一致；规格中的实测数字在 Build 阶段回填，不得用估计值代替。
- 不修改已确认的验收标准；Build 阶段若发现需要改变用户可见行为，回到 Shape 重新确认。

# 决策

- D1 基线：同步到 annotated tag `v4.0.20`（tag 对象 `79738d9`，剥离提交 `85ad4969`）；`upstream/main` 的 tag 之后提交 `de0a235ad` 不纳入。
- D2 版本：fork 版本号 `4.0.19-1` → `4.0.20-1`，四处版本文件与 `Cargo.lock` 同步。
- D3 重放：182 个 fork 提交按原顺序整体 rebase，不做部分 cherry-pick；`README.md` 保留 fork 整文件版本，不采纳上游本轮的 README 改写。
- D4 schema：`SCHEMA_VERSION` 升到 24；22→23 合并 fork 的 Kimi 幂等补齐与上游的 `enabled_omp`；新增 23→24 幂等补齐 Kimi（两表）+ omp（仅 `mcp_servers`）；不支持降级。
- D5 上游功能与 fork 功能的关系：应用排序与侧栏面板可见性并存；Pi/omp 表单重构与 fork 的 Pi 魔改叠加；Copilot 自动协议路由语义适配到 fork 的接口格式布局；不存在需要二选一的重写。
- D6 托盘/更新器：托盘左键继续走 fork 四条分支；应用内更新器继续禁用；本轮上游的托盘文案与字段删改照常落地。
- 隔离方式：当前目录（`current`），沿用 main。理由：工作区除 Comet 产物外干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去轮次一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（沿用历轮决策）。
- README：保留 fork 整文件自有版本；上游本轮 README 的 omp/赞助商增删不采纳，在保真核对中归因为「fork 整文件替换」。
- 预设白名单：上游本轮刷新预设模型与移除 EveryAPI 不影响 fork 白名单（既有白名单条目在上游目录中仍存在）；omp 条目见 Q1。
- `tr.json`：整文件取上游（土耳其语补全），不补 fork 键，与本轮 tag 逐字节一致。
- 卡片模型：上游应用排序与默认模型语义与 fork 的供应商级模型快捷切换并存；不因本轮上游改动移除 fork 徽章/快捷切换（omp 口径见 Q3）。
- **Q1（2026-10-25 用户决定：仅本机推理三条）**：`forkOfficialAllowlist.omp = ["Ollama", "LM Studio", "vLLM"]`，与 Pi 一致；Kimi 家族、第三方/聚合站、赞助商、`Ollama Cloud`、`Meta Model API` 等未列入白名单的 omp 预设在 fork 构建的所有入口不可见。目录预设 id 仍为原始数组下标（过滤排在编号之后）；其他 app 的白名单不变。
- **Q2（2026-10-25 用户决定：来源 + 目标，与 Pi 完全对齐）**：`readConfigFields("omp", …)` 读顶层 `baseUrl`/`apiKey`（omp settingsConfig 与 Pi 同形状），身份字段照常复制，`defaultModel` 为空；`buildImportedSettingsConfig("omp", …)`/`patchImportedSettingsConfig("omp", …)` 复用 `buildPiSettingsConfig` 并写顶层 `baseUrl`/`apiKey`；`PiProviderForm` 在 omp 下以 `appId="omp"` 渲染 `ProviderImportEntry`、以 `useProviderImportSources("omp")` 枚举来源；omp 也作为其他应用的导入来源。
- **Q3（2026-10-25 用户决定：不进入）**：omp 不进入 `MODEL_CAPABLE_APPS`，不加模型徽章/快捷切换弹窗；omp 的默认模型继续由上游 Pi 家族的当前状态与表单模型表管理。4 个既有 app 行为不变。
- **Q4（2026-10-25 用户决定：推 main + 推 tag）**：验收通过、用户接受结果并归档后，`git push --force-with-lease origin main`，在归档提交上创建 annotated tag `v4.0.20-1` 并 `git push origin v4.0.20-1`（触发 fork Release CI，仅 Windows x64 与 macOS arm64 unsigned）。只授权这两项动作。

# 未决问题

- 无。Q1（omp 预设白名单）、Q2（omp 跨应用导入）、Q3（omp 模型徽章/快捷切换）与 Q4（交付授权）已于 2026-10-25 由用户确认，结论记入「决策」。

# 验证期望

- 静态检查：`pnpm typecheck`、`pnpm format:check`、`pnpm build:renderer`、`cargo check` 全部通过。
- 测试：`pnpm test:unit`、`cargo test` 通过；重点覆盖 omp 表单/预设/迁移、Kimi 官方账号、应用排序、Pi 折叠高级选项、Copilot 提示、托盘左键护栏与 schema 24 升级路径。
- 结构核对：重放映射（提交数、主题序列、patch-id 归类）、冲突停车清单、零冲突标记、版本号、schema 链、`Cargo.lock` 变更范围、更新器零命中。
- 内容核对：落地保真四 ref 行多重集差集（逐行归因、带重数）、4 个 locale 的键集合与 fork 文案、`tr.json` 逐字节一致、fork 魔改清单逐项取证。
- 交付核对（Q4 授权后）：push `main` 与 annotated tag `v4.0.20-1`，并用 `git ls-remote` 确认远端指向。
