# 目标

fork（tunecc/cc-switch）的 main 继续同步到上游 farion1231/cc-switch 已发布 annotated tag 链 `v4.0.36` → `v4.0.37` → `v4.0.38`，最终基线为 `v4.0.38`（tag 对象 `82a4ba2f0ee1f178de6684693fe3febed4ee7bf4`，剥离提交 `2c084ec752a985fa77470facc14cad76ee67e8e1`）。按原顺序重放 `v4.0.35..main` 的 224 个 fork 提交，fork 版本号 `4.0.35-1` → `4.0.38-1`。上游本轮功能与修复全部落地（fork 已裁剪 / 已移除段除外），fork 全部魔改保留且可用，无丢失、无行为回归。

用户本轮要求：**继续同步上游更新，保留我们自己的修改；如果我们做过的功能上游也新增了，要先询问并分析「保留上游还是保留 fork 更好」。**

本轮核查结论：三版新增域中没有需要做「上游 / fork」二选一的功能。逐项排除：上游 WorkBuddy deeplink 一键导入（URL 链接导入）与 fork 跨应用导入（表单内从其他本地已启用应用导入，`ProviderImportEntry`）入口、实现、数据全部不同，两条链并存；Plugins 页面、供应商 opt-in 参考成本倍率、Claude Code 桌面章节、技能私有仓库 per-host token、Pi Mistral 预设、Antigravity Linux 切号、UnreadableEntriesNotice（读不出行的供应商单独提示）在 fork 侧零对应实现，全部直接落地；上游 `[1m]` 小写标记是写侧 bugfix，fork 解析侧大小写不敏感，采纳后 fork 的 1M 快捷勾选/切换不受影响；托盘 macOS 全屏恢复与 `show_main_window → reveal_main_window/macos_tray_window` 重构行为等价覆盖 fork 的 `apply_tray_policy(true)` 调用（`macos_tray_window::show` 内部已调用），取上游重构。「应用内更新器」域上游本轮零改动（无 modify/delete 冲突即证明 fork 删除的文件上游未再触碰），v4.0.32 轮用户决定 **Q1 = A：保留 fork 现状**继续沿用。

# 范围

## 同步区间与取证

- **区间**：`v4.0.35..v4.0.38`，实测 78 个提交、355 个文件、+42,055/−15,084。其中 v4.0.36 20 个提交（tag `00cba3f4`，peeled `fa4a23700`）、v4.0.37 21 个提交（tag `903a1622`，peeled `a8ca5e83a`）、v4.0.38 37 个提交（tag `82a4ba2f`，peeled `2c084ec75`）。
- **上一轮 tag 后搁置的 5 个提交随 v4.0.36 一并落地**：`fix(usage): keep sub-micro-dollar costs…`（6a6ad60e7）、`fix(test): pass AppType to get_provider_by_id…`（d31eee911）、`fix(codex): pick up new official models sooner in stack mode`（851dac1ba）、`feat(provider): add opt-in reference cost multiplier (#9656)`（b044f4b03）、`fix(usage): collect OpenCode usage from mixed V1/V2 databases (#8363)`（ad22d45a8）。
- **fork 侧重放面**：`v4.0.35..main` 共 224 个提交（`git rev-list --count`），rebase 前安全参照分支 `pre-sync-v436-v438` = 当前 main `7a5f697f5`，不推送。
- **重叠面 54 个文件**（`comm -12`）；merge-tree 预览 14 个冲突文件（README.md、package.json、Cargo.lock、Cargo.toml、commands/misc.rs、commands/stream_check.rs（modify/delete）、database/dao/providers.rs、lib.rs、tauri.conf.json、ProviderList.tsx、en/ja/zh-TW/zh.json）。
- **上游是否齐平**：`git rev-list --count v4.0.38..upstream/main` 现取 **23**。按历轮「只锁已发布 tag」口径，不纳入本轮（含 `feat(providers): add a copy button to the API key input (#9232)`、备份目录大小上限、流式首字节超时等）。
- **取证性 fetch**：只允许 `git fetch upstream --tags`（不带 `--prune`/`--prune-tags`）或 `git fetch upstream tag <name>`。

## 上游本轮改动（按主题）

1. **Plugins 页面（v4.0.36/37/38）**：`feat(plugins): add a Plugins page backed by each app's official CLI (#9220)` 及两个后续修复（#9742、重试 loading）；涉及 `src/components/plugins/`、`commands/plugins*.rs` 等全新链路。
2. **供应商 DB 层重构与不可读行处理（v4.0.37，fca6b1bbe）**：`load_providers` 与 `get_provider_by_id` 共享 `PROVIDER_SELECT` + `row_to_provider`；settings_config/meta 解析失败的行不再回退默认值、不再被下一次保存覆盖，改由 `get_unreadable_provider` 单独列出（前端 `UnreadableEntriesNotice`，仅可删除）；新增 `get_provider_rows` 返回 `Rows<Provider>`、`read_provider`、`provider_exists`、`clear_omo_category_current`。托盘改用 `get_provider_rows(app)?.readable`。
3. **托盘与窗口重构（v4.0.37/38）**：`show_main_window` 拆出 `hide_main_to_tray` / `reveal_main_window`；macOS 走新模块 `macos_tray_window.rs`（退出全屏 Space 再隐藏、重开恢复全屏，ee36a25b3；内部已调 `apply_tray_policy(true)`）；非 macOS 恢复链加 `window_fit::fit_to_work_area`；持久化主窗口尺寸过小的恢复（5a5111b0a）；Windows `set_skip_taskbar` 收进 helper。
4. **`[1m]` 小写标记（v4.0.37，5909b0502）**：`ONE_M_MARKER_FOR_CLIENT` 由 `[1M]` 改为 `[1m]`（官方文档口径），读取侧照旧大小写不敏感、旧 `[1M]` 配置仍识别；Stack id、routing tier 别名、子代理 id、预设同步改写。
5. **Skills 私有仓库 token（v4.0.36，ef9467ad2）**：per-host 访问令牌读私有技能仓库；stall 超时下载（6313363ed）；非 ZIP 仓库报错文案（a5fd82b6a）；relink 失败上报（5968c5023）。
6. **WorkBuddy deeplink 一键导入（v4.0.38，63798b896）**：`app=workbuddy` 进入 provider deeplink 白名单；构建 WorkBuddy 编辑器同形卡片（vendor/name、url 原样、trim 后 apiKey、单模型 supportsToolCall）；链接必须带 model，apiFormat 仅接受 openai_chat。与 fork 跨应用导入无关。
7. **Antigravity（v4.0.36/38）**：Linux 账号切换（25c2e6b5e）；Claude thinking 变体按基础模型计价；speed 用原生流式时长；会话过滤空/内部会话并解析结构化 SessionBlocks。
8. **代理与协议修复（v4.0.36/37/38）**：Codex→Anthropic 工具转换不转发 OpenAI strict 标志（d15cb087c）；Responses message items 生成 `msg_` 前缀 ID（82c29d09a）；Codex Chat bridge 扁平工具名冲突消歧（c73d8a48c）；私有参数过滤保留 tool-call 参数（3c9d7765b）；Responses→Anthropic SSE 按 event 拆分（33ee6d668）；IPv6 监听 `::1`（527527105）；circuit breaker 健康清除时重置（bd3d38801）；前后端内存/资源泄漏与代理请求限制（fe99cae4e）；免费 auto-review 不受配额保护（f2e7b171c）；Codex reasoning 覆盖对官方模型名生效（a18d91c56）。
9. **用量与定价（v4.0.36/37/38）**：Hydrogen 分层定价与 Orchestrator 归因；Gemini/Flash 分层变体按基础模型计价；Gemini 会话回填去重；Codex cache writes 展示；等价 reasoning 档合并与 Gemini 4 Neon 种子；usage 索引与 pooled medians 单扫描；sessions 懒元数据扫描；代理/会话日志按 provider 前缀去重。
10. **其他修复**：Claude Code 桌面章节（c29332ef9）；供应商编辑器 pending saves 会话隔离（49e82664a）；Copilot v1 auth 迁移暂留（9431a6bc9）；opencode v2 会话边界（3a7495bf8）；omp resume Windows 可粘贴（b13ee2694）；AppImage 用宿主 xdg-open（9455eb319）；additive providers 批量 live sync 失败上报（b989bd6e0）；MCP flag toggle 读不回时回滚（fca6b1bbe 前端部分）；Pi Mistral 预设（8ddb73e48）；供应商主机匹配改 vendor hosts（37e3eabfe）；韩语翻译改进；auth center 行高；tools 锁释放顺序；dsh reasoningEfforts 归一化。
11. **结构重构与清理（v4.0.37/38）**：死代码清理 + knip 进 CI（2a750c3fc，含 `knip.json` 新文件与 ci.yml 新 job）；proxy 测试拆文件；crate 根 re-export 清理（81a5973e0）；tests/ 纳入 Prettier 检查（03e93b711）；i18n CJK 直写 JSX 测试（5d6ed73bf）；localeParity/测试加固；韩语技术标识检查放宽（f19551bb8）。

## 目录结构

### 新建

- 本 change 正式产物：`docs/comet/changes/sync-upstream-v436-v438/{brief.md,specs/upstream-sync/spec.md}`；沿用历轮决定，不建立能力关联、不产生 `capability-association.yaml` 与 `delta.yaml`。
- 归档时由 Runtime 生成 `docs/comet/archive/<date>-sync-upstream-v436-v438/`。
- rebase 前新增本地安全参照分支 `pre-sync-v436-v438`（= `7a5f697f5`），不推送。
- 本轮落地保真复算脚本 `scripts/fidelity-v436-v438.py`，沿用 `fidelity-v432.py` 的四 ref 口径（`v4.0.38` / `v4.0.35` / `pre-sync-v436-v438` / `HEAD`），可重复执行、不含硬编码条数。
- 随上游落地的新增文件（最终清单以实际 rebase 为准）：Rust 侧 `macos_tray_window.rs`、`commands/plugins*.rs` 等 Plugins 链路、`services/`、`proxy/` 拆分出的测试文件；前端侧 Plugins 页面组件、`knip.json`、`src/whats-new/{4.0.36,4.0.37,4.0.38}.json` 与上游 release notes；测试侧 `tests/config/mistralPiProviderPresets.test.ts`、`tests/components/plugins/*` 等。
- 交付步骤（验收通过、归档且用户另行授权后）新增本地 annotated tag `v4.0.38-1`。

### 修改

- 54 个重叠文件，按类别：
  - 版本与物料：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src-tauri/tauri.conf.json`、`CHANGELOG.md`（冲突全部取 fork 版本侧，最终版本由收尾 bump 提交定为 `4.0.38-1`）。
  - 后端核心冲突：`lib.rs`（fork 注释保留）、`commands/misc.rs`（Q1=A 保持 fork 删除）、`commands/stream_check.rs`（modify/delete：保持 fork 删除）、`database/dao/providers.rs`（上游重构 + 补回 `website_url_2`）、`tray.rs`（上游重构整段落地）。
  - 后端自动合并：`commands/{mod,settings}.rs`、`database/{schema,tests}.rs`、`deeplink/provider.rs`、`provider.rs`、`proxy/{forwarder,http_client}.rs`、`proxy/providers/{claude,codex}.rs`、`services/{mod,provider/{live,mod,pi}}.rs`、`settings.rs`，以及随上游重构自动合并的其他 proxy / usage / mcp / sessions / skills 文件。
  - 前端：`src/App.tsx`、`src/components/providers/{EditProviderDialog,ProviderCard,ProviderList}.tsx`、`src/components/providers/forms/{ClaudeDesktopProviderForm,ClaudeFormFields,GrokBuildProviderForm,PiProviderForm,ProviderForm}.tsx`、`src/components/shell/Sidebar.tsx`、`src/config/{grokBuildProviderPresets,piProviderPresets}.ts`（fork `hidden?` 字段与上游 Modelflare 移位/Mistral 预设叠加）、`src/types.ts`。
  - locale：`src/i18n/locales/{en,ja,zh-TW,zh}.json` 冲突合并；`{de,ko,ru,tr}.json` 随上游（`tr.json` 与 `v4.0.38` tag 逐字节一致、不补 fork 键）。
  - 测试：`tests/components/{ClaudeFormFields,EditProviderDialog,GrokBuildProviderForm,ProviderList}.test.tsx`、`tests/config/{localeCoverage,localeParity,readmeParity}.test.ts`。
- fork 侧文档：`docs/HOW_TO_REBASE_UPSTREAM.md` §4 共享文件表按本轮实测修订，并新增 §4.17「v4.0.36–v4.0.38 轮的叠加要点」；归档时把 `specs/upstream-sync/spec.md` 重写为本轮终态。
- CI：`ci.yml` 采纳上游 knip job（`pnpm knip` + `knip.json`），fork 裁剪语义（无 schedule/workflow_dispatch、四 job fork `if`、后端 nextest、WSL2 restore-only rust-cache、`continue-on-error`）全保留；上游删除 Claude review workflow 的删除随上游（fork 侧若已有同名删除则零操作）。

### 删除

- 上游本轮删除的文件随上游删除且 fork 侧同样零引用（Build 逐个取证登记）。
- 上游删除的 17 个 locale 死键（fork 侧也零引用，见验收 A6）随上游删除。
- fork 已删除的更新器链路（`AutoUpdatePrompt.tsx`、`UpdateContext`、`app_update.rs`、`lib/updater.ts` fork 版恒 up-to-date）与 `stream_check` 可达链路不得被重放带回。

### 明确不建

- 不引入 `upstream/main` 上 `v4.0.38` 之后的 23 个提交。
- 不重新接线 `stream_check`；不复活 `release.yml` 被裁段；macOS runner 维持 `macos-15`。
- 不创建 PR；不推送除交付授权范围之外的任何远端引用。
- 不改 fork 自有功能形态，也不做本轮之外的功能开发、重构或依赖升级。
- 不为上游新增第三方预设改写 `forkOfficialAllowlist`/`forkPresetFilter` 判定实现。

# 非目标

- 不改 fork 自有功能实现与形态：逐模型连通性测试链（`commands/connectivity_test.rs` 两个命令注册）、托盘左键契约（`tray_left_click_never_opens_the_menu` 源码护栏与四分支）、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、跨应用导入（`ProviderImportEntry`/`providerImport.ts`）、右键删除与默认插顶（`quickMoveTop`）、批量检测侧栏开关、DevPanel 与 fork 构建标识、1M 表头快捷勾选。
- 不把上游 `appSpecs` 能力表反向用于改写 fork 的 `MODEL_CAPABLE_APPS`/`shouldShowTestEntry`。
- 不对上游 Plugins 页面、成本倍率、桌面章节、skills token、WorkBuddy deeplink、Antigravity Linux 切号等新能力做 fork 侧定制。
- 不因上游重构删除 fork 仍在用但上游判定为死代码的 API；只删除 fork 侧同样零引用且不影响 fork 用例的项。

# 验收示例

- A1: 同步基线与重放完整性可核对：`git merge-base main v4.0.38^{}` 为 `2c084ec75`，`git rev-list --count v4.0.35..HEAD` = 224 + 上游区间 78 + 本轮新增提交数（现取口径），重放主题序列与 `pre-sync-v436-v438`（= `7a5f697f5`）一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移」。
- A2: fork 全部魔改在终态仍然在位：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与 `ModelQuickSwitch`、`websiteUrl2` 全链路（含 DAO SELECT/字面量）、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键四分支与 `set_show_menu_on_left_click(false)` 及源码护栏、跨应用导入接线、右键删除与默认插顶，逐项 `git grep -I` 取证并跑对应测试。
- A3: 上游本轮新能力落地：Plugins 页面、供应商 opt-in 参考成本倍率、Claude Code 桌面章节、skills 私有仓库 token、Pi Mistral 预设、WorkBuddy deeplink、Antigravity Linux 切号、UnreadableEntriesNotice、上一轮搁置的 5 个提交，逐项有上游测试或新增测试通过。
- A4: 更新器域终态（Q1 = A 延续）：`app_update.rs`、`AutoUpdatePrompt.tsx`、`UpdateContext` 自动下载链路不复活；`commands/misc.rs` 保持 fork 删除 `check_for_updates`/`open_portable_update_download` 并保留 fork 自带 `is_portable_mode`；`lib/updater.ts` 恒 up-to-date；关于页「检查更新」指向 tunecc Releases。
- A5: 孤儿 `stream_check` 豁免延续：`commands/stream_check.rs` 保持删除，模块声明、命令注册、dao 表读取均为 0 命中；上游对它的 2 行改动（`get_provider_rows` 调用）不落地。
- A6: 本地化终态：8 个 locale 上游 117 个新键进入、上游删除的 17 个死键一并删除（fork 的 en/zh/zh-TW/ja 实删 12 个，另 5 个 `streamCheck.*` 已被移除清单覆盖且本就不在；逐键确认零引用）；`FORK_ONLY_LOCALE_KEYS` 按新基线复核（fork-only 终态 397 键与上轮清单一致，零增减）；fork 专属键按 pre-sync 分支原键序插回、空对象 `{}` 保全（`providerPreset.version` 与 `prompts.confirm` 重点核对）；`tr.json` 与 `v4.0.38` tag 逐字节一致；`localeParity`/`localeCoverage`/`readmeParity` 与上游更新版合并后全绿。
- A7: DB/DAO 终态：`SCHEMA_VERSION` 双方维持 27，本轮无迁移臂；`PROVIDER_SELECT`/`row_to_provider` 为上游重构形态且必须包含 fork 的 `website_url_2` 列（列序 = website_url 之后）；不可读行保护语义（不回退默认值、可单独列出删除）落地；`get_provider_rows` 与 fork 仍调用的 `get_all_providers` 共存或 fork 调用点（tray/lib/codex_history_migration 等）按上游模式迁移，终态零编译绕过；`database/tests.rs` 相关用例通过。
- A8: 托盘与窗口终态：上游 `show_main_window` → `reveal_main_window`/`hide_main_to_tray`/`macos_tray_window` 重构整段落地；macOS 显示路径行为等价覆盖 fork 的 `apply_tray_policy(true)`（`macos_tray_window::show` 内部调用）；fork 托盘左键切换、轻量模式重建窗口分支、`tray_left_click_never_opens_the_menu` 源码护栏全部保持；`fit_to_work_area` 恢复链与 fork 行为无回归。
- A9: `[1m]` 标记终态：写侧（`ONE_M_MARKER_FOR_CLIENT`）为小写 `[1m]`，读侧保持大小写不敏感；fork 的 1M 表头快捷勾选、模型徽章、Stack 模式行为无回归；旧 `[1M]` 配置仍可读取。
- A10: CI 与物料终态：`ci.yml` 采纳 knip job 且 fork 裁剪语义全保留，`pnpm knip` 通过；`tests/` Prettier 检查通过；CJK JSX 直写测试通过（fork i18n `defaultValue` 用法不误伤）；`Cargo.toml` 保持 fork 移除 `tauri-plugin-updater`、`repository` 指 tunecc；`release.yml` 保持 fork 版与 macOS `macos-15`。
- A11: 全量检查通过：`pnpm typecheck`、`pnpm format:check`（含 tests/）、`pnpm knip` 零报告、`pnpm test:unit`（fork 既有用例不回归）、`cargo fmt --check`、`cargo test --all-targets`、`cargo check --locked --all-targets`。（本仓库无 `pnpm lint` script，前端检查套件以 CI frontend job 的 typecheck/format/knip/test 为准。）
- A12: 版本号四处（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 包）终态一致为 `4.0.38-1`。
- A13: 交付授权延后：Build/Verify 不推送、不打 tag；归档完成后单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.38-1` 推送；不创建 PR。

# 决策

- **D1｜同步目标与工作区**：最终锁已发布 tag `v4.0.38^{}` = `2c084ec75`，不纳入 `upstream/main` 的 23 个 tag 后提交。工作区 `current`，沿用 main 与当前目录（沿用历轮同步惯例；当前目录仅有未跟踪的 `scripts/clean-target.sh`，与同步无交集，不纳入提交）；`pre-sync-v436-v438` 只作回退参照。
- **D2｜「上游是否重复实现 fork 功能」核查**：按历轮三步口径执行——`git diff v4.0.35 v4.0.38` 逐文件比对并读实现，全量扫描上游新增行对 fork 功能标识（`websiteUrl2`/`website_url_2`/`QuickSwitch`/`VisibleSidebarPanels`/`quickMoveTop`/`DevPanel`/`forkBuild`/`forkOfficial`/`ProviderImportEntry`/`ConnectivityTestDialog`/`ModelQuickSwitch`/`tray_left_click` 等），最后按功能名逐项排除同域相邻。结论：
  - **WorkBuddy deeplink vs fork 跨应用导入**：deeplink 是 URL 链接导入（外部站点发起、构建 WorkBuddy 卡片），fork 跨应用导入是表单内从其他本地已启用应用挑供应商预填（`ProviderImportEntry` + `providerImport.ts`）。入口、实现、数据三不重叠，两条链并存，无需取舍。
  - **Plugins 页面 / 成本倍率 / 桌面章节 / skills token / Mistral 预设 / Antigravity Linux / UnreadableEntriesNotice**：fork 侧零对应实现，全部直接落地。
  - **`[1m]` 小写标记**：上游写侧 bugfix；fork 解析大小写不敏感（`eq_ignore_ascii_case`），fork 的 1M UI 与快捷链路只依赖解析，不依赖写出的具体大小写形态；采纳上游。
  - **托盘/窗口重构 vs fork 托盘魔改**：`macos_tray_window::show` 内部已调用 `apply_tray_policy(true)` 并处理全屏恢复，fork `show_main_window` 的 macOS 分支行为被上游重构行为等价覆盖；轻量模式重建窗口分支上游原样保留。取上游重构，fork 契约测试保持绿。
  - **应用内更新器**：上游本轮零改动（无 modify/delete 冲突即证明），Q1 = A（2026-11-15 用户决定）继续沿用，终态见 A4。
- **D3｜dao/providers.rs 冲突**：整段取上游 `PROVIDER_SELECT` + `row_to_provider` 重构，并把 fork 的 `website_url_2` 列补回 `PROVIDER_SELECT`（`website_url` 之后）与 `row_to_provider` 解码（列序同步后移），这是 v4.0.16 轮已知故障模式的本轮形态；不可读行保护语义一并落地。fork 仍调用的 `get_all_providers`（tray.rs ×2、lib.rs ×2、codex_history_migration ×2、provider.rs 内部）与上游新 `get_provider_rows` 共存，或按上游模式把 fork 调用点迁到 `readable` 行——Build 按编译与测试结果择一，终态零静默失效。
- **D4｜tray.rs 冲突**：`show_main_window`/`hide_main_to_tray`/`reveal_main_window`/`macos_tray_window` 整段取上游；fork 的 `apply_tray_policy` 定义保留，托盘左键四分支与 `lib.rs` 的 fork 注释保留；macOS 显示路径行为等价以 `tray::tests` + 手工核对为证。
- **D5｜misc.rs / stream_check.rs 冲突**：misc.rs 保持 fork 侧删除（Q1=A）；stream_check.rs 保持 fork 侧删除（孤儿豁免），上游对它的 2 行改动随删除不落地；fork 不恢复模块声明与命令注册。
- **D6｜本地化**：8 个 locale 的上游新增/改写/删除逐字取上游；fork 专属键按 pre-sync 分支原键序插回（JSON 结构化重建，保留空对象 `{}`）；`FORK_ONLY_LOCALE_KEYS` 按新基线重新生成（实测 414 键）；`FORK_REMOVED_LOCALE_KEYS` 覆盖 `autoUpdate.*`/`streamCheck.*` 并核对上游本轮新键不引入需移除项；合并后 8 个文件显式查重 `dup=0`；`tr.json` 与 tag 逐字节一致。
- **D7｜CI 与物料**：`ci.yml` 采纳 knip job；若 knip 对 fork 专属在用文件误报，在 `knip.json` 增补 fork 侧 ignore 并登记；`Cargo.toml`/`release.yml`/版本号口径同历轮；上游删除 Claude review workflow 随上游。
- **D8｜测试加固随上游**：`tests/` Prettier 检查与 CJK JSX 直写测试随上游采纳；fork 测试文件若被 Prettier 改写则一并格式化；CJK 测试若误伤 fork `defaultValue` 用法，按上游测试实现核对扫描范围后决定是否需要 fork 侧适配并登记。
- **D9｜交付授权延后**：Build/Verify 不推送、不打 tag；归档完成后单独请求授权，再执行 `git push --force-with-lease origin main` 与 annotated tag `v4.0.38-1` 推送；不创建 PR。

## 已确认的用户决定（沿用）

- **Q1 更新器取舍 → 保留 fork 现状（A）**（2026-11-15，v4.0.32 轮确认；本轮上游零改动，状态自然延续）。fork 的更新器删除链路与 `is_portable_mode` 自带实现全部不变，终态见 A4。

# Open questions

（无。本轮核查结论：没有「我们做的功能上游也新增了同类功能」的情况——WorkBuddy deeplink 与 fork 跨应用导入是两条不同的链；其余上游新能力 fork 均零对应实现。冲突解决全部落在既定口径（更新器 Q1=A、stream_check 孤儿豁免、版本/README/locale 流程）与机械合并（DAO + `website_url_2`、tray 重构行为等价、ProviderList 双 import、lib.rs 注释）。无需用户做新的二选一决定。）
