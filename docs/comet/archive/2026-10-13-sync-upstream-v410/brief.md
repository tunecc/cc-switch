# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的 v4.0.10 发布头（tag `v4.0.10` = `90fb37ff`），fork 侧 139 个魔改提交（`v4.0.9..main`，含 v4.0.9 的同步提交、归档提交与格式修正提交）按原顺序重放保留，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.9-1` 升为 `4.0.10-1`；全部验收项通过且用户接受验收结果、归档提交生成后，按 Q1 授权的交付方式上传 origin。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v410/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v410/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v410`（= 同步前 main `883e1547`，该提交同时是 origin/main 与本地 tag `v4.0.9-1` 指向的提交），仅用于回退参照与重放前后 diff 对照，不是工作区分支。
- 随上游 rebase 落地的上游新增文件 25 个：
  - 后端：`src-tauri/src/commands/custom_icon.rs`、`src-tauri/src/database/dao/custom_icons.rs`、`src-tauri/src/services/provider/icon.rs`、`src-tauri/src/deeplink/{codex_link,grok_link,icon_fetch}.rs`、`src-tauri/tests/golden/snapshots/rows/deeplink-{codex,grokbuild}-config.txt`。
  - 前端：`src/components/CustomIconNameDialog.tsx`、`src/lib/api/customIcons.ts`、`src/lib/query/customIcons.ts`、`src/utils/customIcon.ts`、`src/whats-new/4.0.10.json`。
  - 测试：`tests/components/{CustomIconNameDialog,IconPicker,ProviderIcon.customIcon,UsageScriptModal}.test.tsx`、`tests/fixtures/customIcon.ts`、`tests/utils/customIcon.test.ts`。
  - 文档：`docs/guides/deeplink-site-integration-guide-{zh,en,ja}.md`、`docs/release-notes/v4.0.10-{zh,en,ja}.md`。
- 交付步骤（验收通过并归档后，按 Q1 授权）新增本地 annotated tag `v4.0.10-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.9-1` → `4.0.10-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。
- 31 个上游/fork 重叠文件（完整清单与逐文件叠加要求见完整目标规格「冲突解决」）：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`）、`README.md`、8 个后端文件（`src-tauri/src/{lib,settings}.rs`、`src-tauri/src/commands/{mod,settings}.rs`、`src-tauri/src/database/{backup,mod}.rs`、`src-tauri/src/database/dao/mod.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/services/provider/mod.rs`，其中 `deeplink/provider.rs` 与 `services/provider/mod.rs` 为本轮最大上游改动面）、4 个前端组件文件（`src/components/providers/{AddProviderDialog,EditProviderDialog}.tsx`、`src/components/providers/forms/BasicFormFields.tsx`）、8 个 `src/config/*ProviderPresets.ts`、4 个 `src/i18n/locales/*.json`、2 个测试文件（`tests/components/{AddProviderDialog,ProviderPresetSelector}.test.tsx`）。
- 上游本轮改动、fork 侧未触碰的其余 99 个文件随 rebase 直接落地（含 `src-tauri/src/deeplink/mod.rs`、`src-tauri/src/proxy/**`、`src-tauri/src/services/usage*`、`src/components/{usage,settings,icons}/**`、`CHANGELOG.md`、`docs/user-manual/**`、`docs/guides/**`）。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（`lib.rs` 的深链接 pending 语义与 fork 三段语义、`settings.rs` 的 `LocalMigrations` 新字段与 fork `VisibleSidebarPanels`、`deeplink/provider.rs`、`services/provider/mod.rs`、`database/backup.rs`、`BasicFormFields.tsx`、8 个预设文件、4 个 locales、版本与锁文件的 `png` 依赖与 updater 移除并存等），确有新增 fork 专属文件时才补充条目。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.10`（`90fb37ff`）：当前 merge-base `8845b1ef`（v4.0.9）→ 目标 `90fb37ff`；fork 侧 139 个提交（`v4.0.9..main`）按原顺序重放。

### 删除

- 无文件删除：上游 `v4.0.9..v4.0.10` 的改动集里没有文件被删（`git diff --name-status --diff-filter=D v4.0.9 v4.0.10` 零命中），fork 侧本轮也不删文件。
- 只随上游删除代码片段与文案键：`BasicFormFields.tsx` 图标弹窗的 `DialogClose` + `common.done` footer 块（改单选即关闭）、locales 里上游移除的对应键、`deeplink` 旧的直接 emit `deeplink-import` / `deeplink-error` 分支（改为 `PendingDeepLink` + `deeplink-pending`）。fork 已删除的 `stream_check` 链路与 updater 相关实现不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v410` 是安全参照分支，不是工作区分支）。
- 不新增 fork 专属代码文件（本轮 fork 侧无新魔改，白名单表只修订既有条目）。
- 不创建 PR、不合并其他分支、不推送除 Q1 授权的 `origin main` 与 tag `v4.0.10-1` 之外的任何远端引用。
- 不新增数据库迁移脚本或推进 schema 版本（上游 v4.0.10 仍为 20，「我的图标」以 JSON 数组存 settings 表 `custom_icons` 键；fork 保持 21）。
- 不放开 fork 预设白名单：上游新增的 NekoCode 等预设由 `forkOfficialAllowlist` 默认拒绝，不改白名单内容。
- 不创建临时脚本或额外目录；`docs/comet/changes/sync-upstream-v410/` 是唯一新增的 change 产物目录。

## 上游本轮同步范围（v4.0.9..v4.0.10）

- 34 个提交、130 个文件、约 +12737/−2359 行，按主题分组：
  - 自定义供应商图标与「我的图标」库：`21203803` 上传自定义图标（`commands/custom_icon.rs`、`services/provider/icon.rs`、`IconPicker`/`ProviderIcon` 前端链路、`png` 校验依赖）、`68411d82` 把上传过的图标收进可命名的「我的图标」库（`database/dao/custom_icons.rs` 以 settings 表 `custom_icons` 键存 JSON 数组、`CustomIconNameDialog.tsx`、`src/lib/{api,query}/customIcons.ts`、`src/utils/customIcon.ts`）、`4c263a85` 用户手册补「我的图标」说明。
  - 深链接改造：`16e7ff1c` 链接可声明 API 格式、可导入 Pi 供应商、激活交给用户；`bee47fdf` 链接可自带图标（`iconUrl`，配套 `deeplink/icon_fetch.rs`）；`11e1326b` Codex 链接保留供应商配置而非重建固定模板（新增 `deeplink/codex_link.rs`）；`98222d19` 冷启动不再丢链接并收紧导入校验（`lib.rs` 改为 `PendingDeepLink` 暂存 + `deeplink-pending` 事件）；`450bc039` 导入的用量脚本默认启用；`db93ac20` Grok Build 的 `session_summary` 指向当前供应商并保留链接的模型 profile（新增 `deeplink/grok_link.rs`）；`7577ca95`/`ea1ab809`/`3d5f8471`/`0962337b`/`6af00ecb`/`502d681b` 配套文档与链接生成器改写。
  - 用量统计：`a0dd3b39` 统计展示首 token 时间并在无路由时估算；`382c0e96` 新增 Sub2API 用量查询模板；`cb3c9fef` 用量表全部左对齐并重排请求日志列宽；`23c0a63f` Novita 空余额不再当过期；`96d636ca` OpenRouter 空额度不再当过期；`68122bc4` 尊重 Codex 线程模型设置。
  - 预设：`3302cc2d` NekoCode 预设（8 个 `src/config/*ProviderPresets.ts`）；`e0a03184` OpenModel 注册链接改指向 cc-switch 推荐地址；`85e574b4` YYLX 中文名改为「鱼鱼连线」。
  - 修复与文案：`c63c702c` Claude Code haiku 别名升到 `claude-haiku-5-5`；`28dc5198` 添加/编辑页取消淡入；`04bd15c9` 日语「詳細オプション」；`1a8c1ea3` 连接模式说明先讲各模式优势；`9d4aff88` 把已退役 `cc-switch-official` 桶的会话迁回 openai（`lib.rs` 迁移调用 + `settings.rs` 迁移状态）；`99277921` 无关自动保存改用已确认目录；`fac8bfd8` MSI 升级不再重建已删除的桌面快捷方式；`28ee933c` 类改动的 `9055dd37` 等上游既有修复不在本轮区间。
  - 发版：`db29caef` chore(release) v4.0.10（`CHANGELOG.md` + 四处版本号）；`90fb37ff` docs(release)（三语 release-notes、`src/whats-new/4.0.10.json`、四语 README 赞助位）。
- 不做部分 cherry-pick：范围是 `v4.0.9..v4.0.10` 的全量新增提交，一次 rebase 完成。

# 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等），也不把 `v4.0.10..upstream/main` 的 1 个 post-release 提交（`d9a62313` fix(ui): panel flicker (#8201)）纳入本轮基线。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 幂等修复迁移）；上游本轮把「我的图标」存放在 settings 表既有键位，不引入新的 schema 版本。
- 不创建 PR、不合并其他分支；origin 是 fork 私有仓库，只按 Q1 授权推送。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 `stream_check` 链路）。
- 不放开 fork 预设白名单以显示上游新增的 NekoCode 等赞助商预设，不改 `forkOfficialAllowlist` / `forkPresetFilter` 判定。
- 不引入上游 Linux flatpak/deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

# 验收示例

- A1: rebase 后 `git merge-base main upstream/main` 等于 `90fb37ff`（tag `v4.0.10` 指向的提交），`git log v4.0.10..main` 只包含 fork 提交、不含任何上游提交。
- A2: 重放前 `v4.0.9..main` 的 139 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）与冗余提交（如有）在完整目标规格「重放映射」中逐条记录并说明原因；每次冲突停车逐条记录归属与解法。
- A3: 31 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：版本与锁文件保留 fork 侧版本号 `4.0.10-1`、`Cargo.toml`/`Cargo.lock` 同时具备上游新增的 `png` 依赖与 `tokio` 的 `net` feature 和 fork 移除 updater 的状态、`README.md` 保留 fork 重写版，且上游「自定义图标上传与我的图标库」「深链接 pending 暂存与 `deeplink-pending` 事件、`iconUrl`、链接声明 API 格式、导入 Pi、Codex/Grok Build 链接配置保留」「首 token 时间与 Sub2API 模板」「NekoCode 预设与 OpenModel/YYLX 条目」「`claude-haiku-5-5` 别名」「`cc-switch-official` 桶迁回 openai」全部按上游语义落地。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.10-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留、上游「我的图标」的 settings 键读写随上游落地。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、托盘左键切换、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件（`vite.config.ts` 的 `__CCS_FORK_BUILD__`、`.github/workflows/{ci,release}.yml` 裁剪、`src/config/fork*` 等）未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订，本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例与 fork 既有用例。
- A10: `pnpm format:check` 通过（fork CI 的 Frontend Checks 依次跑 typecheck → format:check → test:unit → build:renderer，手工拼接共享文件后必须本地归一化格式）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 未被 `cargo check` 额外改写（上游新增 `png` 依赖与 fork updater 移除状态在锁文件里并存）。
- A13: `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 通过（该用例在本机 cc-switch 运行时因代理端口 15721 被占用而失败，属上游测试设计，沿用既有例外并显式记录）。
- A14: 落地保真核对通过：对 31 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.9`、`v4.0.10`、`pre-sync-v410`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位（rebase 的三方合并会留下重复键且测试全绿，必须显式查重）。

# 约束与不变量

- fork 全部 139 个魔改提交必须顺序重放，无丢失、无行为回归。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；无法安全判定的冲突暂停并记录，不盲目 `--continue`。
- rebase 前用安全分支 `pre-sync-v410`（= 当前 main `883e1547`）固定起点；失败或局面不可收拾时 `git rebase --abort` 回到起点，工作区恢复原状；重放前后核对 `ORIG_HEAD`。
- 沿用 `rerere.enabled=true`：上一轮记录的解法可自动复用，但复用结果仍须逐个复核，不默认正确。
- 重放中途不能跑 `cargo test`：fork 历史提交自身带未清理冲突标记（上一轮实测为 `en.json` 中间提交），只有 rebase 完成后才能编译校验；最终态必须 `git grep -I -n "^<<<<<<< \|>>>>>>> "` 零命中。
- 长重放中 git commit 偶发段错误（signal 11）时，先核对 `.git/rebase-merge` 与提交是否实际已落盘，再决定 continue 或重放，防止同一提交重复落地。
- 合并两侧 JSX/Rust 禁止按行去重，必须整块拼接后核对括号与花括号平衡。
- `src-tauri/src/lib.rs`、`src-tauri/src/deeplink/provider.rs`、`src-tauri/src/services/provider/mod.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/database/backup.rs`、`src/components/providers/forms/BasicFormFields.tsx` 与 4 个 locales 是本轮高危叠加面：出现「整文件取一侧」的省事解法即视为丢语义缺陷（`lib.rs` 与 `commands/settings.rs` 还要确认 updater 链路未被带回，locales 会丢 fork 键段）。
- `lib.rs` 本轮上游把深链接事件从 `deeplink-import`/`deeplink-error` 改为 `PendingDeepLink` 暂存 + `deeplink-pending`；fork 的三段语义（移除 Updater 插件注册、托盘左键切换主窗口、connectivity_test 命令注册）必须与新 pending 机制并存。
- `.comet/config.yaml` 与 `docs/comet/**` 按 fork 侧保留，是 Native 工作流继续运转的前提；历史重放可能把 `.comet/config.yaml` 改回旧内容，涉及该文件或重放结束后必须核对，被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复。
- current 工作区在 main 上 rebase：检出新基线瞬间工作树短暂缺少关联规格文件，Runtime 可能判定 Shape recovery；按 Runtime 返回的恢复命令处理，不手工改状态文件。
- 上游改动与 fork 语义冲突时，优先保住「上游行为 + fork 语义并存」；版本号、locales、`lib.rs`、`settings.rs`、`commands/settings.rs`、`Cargo.toml`/`Cargo.lock` 属高频误删点。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。

# 决策

- 同步基线：tag `v4.0.10` = `90fb37ff`。理由：项目既定的 fork 同步惯例是只锁已发布上游 tag；`upstream/main` = `d9a62313` 领先 1 个 post-release 提交（`fix(ui): panel flicker (#8201)`），按惯例排除，进入下一轮范围。与过去 10 轮一致。
- 隔离方式：当前目录（`current`），沿用 main，不新建分支或 worktree。理由：工作区干净、无其他 active Native change、用户未要求并行；同步必须直接改写 main 历史，与过去 10 轮同步一致。
- 能力关联：不关联 `upstream-sync` capability，change 直接以完整目标规格 `specs/upstream-sync/spec.md` 管理。理由：该能力既有总规格是纯散文、无受管 `### Requirement:` 小节，关联模式不允许整份重写 prose；沿用过去各轮惯例，归档时更新 `docs/comet/specs/upstream-sync/spec.md`。
- 版本号：`4.0.9-1` → `4.0.10-1`；`-1` 表示上游 4.0.10 上的第一代 fork 构建，四处版本文件一致，`Cargo.lock` 由 `cargo check` 联动。
- 数据库 schema：上游 v4.0.10 的 `SCHEMA_VERSION` 仍为 20（本轮未推进，`database/{schema,tests}.rs` 不在上游改动集内；「我的图标」存于 settings 表 `custom_icons` 键，无需迁移）；fork 侧保持 21，v20→v21 幂等修复迁移原样保留，不新增迁移步骤。
- Rust 依赖：上游本轮在 `src-tauri/Cargo.toml` 新增 `png = "0.18"` 并给 `tokio` 加 `net` feature；合并结果必须同时具备上游依赖与 fork 移除 `tauri-plugin-updater` 的状态，`Cargo.lock` 相应条目由 cargo 联动后复核。
- `README.md`：整文件保留 fork 重写版（上游只改四语 README 的赞助商位，fork README 不含赞助商表、只记录 fork 差异）；`README_{ZH,DE,JA}.md` fork 侧从未触碰，随上游落地。
- `CHANGELOG.md`、`docs/user-manual/**`、`docs/guides/**`、`flatpak/**`：fork 未改过，随上游落地。
- `.github/workflows/{ci,release}.yml`：上游本轮未改，保留 fork 裁剪版（仅 Windows x64 + macOS arm64 unsigned，跳过上游 tag 发版）。
- 上游新增的 NekoCode 等预设可见性：不改 fork 白名单，由 `forkOfficialAllowlist` 默认拒绝（fork 构建下不可见属预期结果），上游预设数据与图标照常落地。
- 交付时机：推送 main 与推送 tag 不作为本轮验收项，而是验收通过 → 归档提交之后的交付步骤。理由：tag 必须指向归档提交，而归档提交在验收之后才存在，交付类断言无法在 Verify 时取证。
- 交付授权来源（Q1，2026-10-13 用户选择 A）：验收通过并用户接受结果、生成归档提交后，执行 `git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.10-1` 并 `git push origin v4.0.10-1`（触发 fork Release CI 出 Windows x64 + macOS arm64 unsigned 安装包）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端引用；执行前无需重复询问。

# 未决问题

- 无。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`（在 `src-tauri`）
- `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active`（在 `src-tauri`）
- Git 结构核对：`git merge-base main upstream/main`、`git rev-parse v4.0.10^{commit}`、`git log --oneline v4.0.10..main`、`git rev-list --count`（重放前后）、提交主题序列逐行 diff、patch-id 对照、四处版本文件 grep、`SCHEMA_VERSION` grep、`.comet/config.yaml` blob 对照、全树冲突标记 grep
- 落地保真核对：按 A14 的四 ref 归一化行多重集算法逐文件比对（31 个重叠文件），非零项逐行归类
- locale 查重：4 个 locale JSON 逐文件解析 + 同名重复键检测（含嵌套段落的 `inactiveFieldsHint` 等历史高危键）
- fork 语义抽查：`IS_FORK_BUILD`/DevPanel 入口、`visible_sidebar_panels`、`website_url_2`、connectivity_test 命令注册、托盘左键分支、fork CI 矩阵、预设过滤接线与 8 个预设文件的 `hidden` 字段、`EndpointField.rightSlot`、`SearchableModelPicker`、`hasCustomModelMapping`、1M 全选、兜底模型直达区、模型徽章、双官网链接、跨应用导入接线、4 个 locale 的 fork 键段、`lib.rs`/`commands/settings.rs` 中 `updater` 命中数为 0
- 上游功能落地抽查：`commands/custom_icon.rs` 与 `services/provider/icon.rs` 的图标上传与 png 校验、`dao/custom_icons.rs` 的 `custom_icons` settings 键读写、`deeplink/{codex_link,grok_link,icon_fetch}.rs` 与 `deeplink/provider.rs` 的 `iconUrl`/API 格式/Pi 导入、`lib.rs` 的 `PendingDeepLink` 暂存与 `deeplink-pending` 事件、用量首 token 时间与 Sub2API 模板、`claude-haiku-5-5` 别名、`cc-switch-official` 桶迁回 openai 的迁移调用与状态键、8 个预设文件的 NekoCode 条目、`src/whats-new/4.0.10.json` 与三语 release-notes
