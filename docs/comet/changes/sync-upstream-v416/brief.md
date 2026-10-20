# 目标

fork（tunecc/cc-switch）的 main 同步到上游 farion1231/cc-switch 的新发布头 tag `v4.0.16`（`4f6b5495`，剥离提交 `f92ff0b0`），fork 侧 156 个魔改提交（`v4.0.15..main`）按原顺序重放保留，无丢失、无行为回归；版本号按 fork 惯例从 `4.0.15-1` 升为 `4.0.16-1`；上游 v4.0.16 新增的托盘玻璃面板（tray panel）按用户决定处理（见「决策」Q1）；全部验收项通过且用户接受验收结果后，按交付授权上传 origin 并打 fork 版本 tag。

- 版本号 `4.0.15-1` → `4.0.16-1`；基线 tag `v4.0.16` = `4f6b5495`；交付授权沿用上轮方式（push main + annotated tag `v4.0.16-1` 指向归档提交，触发 fork Release CI）。
- 上游 v4.0.16 的托盘玻璃面板（14 提交）**纳入本轮同步**（Q1 选 B），并叠加保留 fork 的「托盘左键单击切换主窗口」语义（Q2 交付授权沿用上轮方式）。详见「决策」。

# 范围

## 目录结构

### 新建

- 本 change 的正式产物目录 `docs/comet/changes/sync-upstream-v416/`（Runtime 创建）：`brief.md`、`comet-state.yaml`、`specs/upstream-sync/spec.md`。
- 归档时新增 `docs/comet/archive/<date>-sync-upstream-v416/`（由 Runtime 归档动作生成）。
- rebase 前新增本地安全分支 `pre-sync-v416`（= 同步前 main `e0a801da`，该提交同时是 origin/main），仅用于回退参照与重放前后 diff 对照。已创建。
- 随上游 rebase 落地的上游新增文件 18 个（基线 tag `v4.0.16`）：后端 `src-tauri/capabilities/tray-panel.json`、`src-tauri/src/tray_panel.rs`；前端 `src/components/providers/forms/shared/GptContextWindowHint.tsx`、`src/tray-panel.html`、`src/tray-panel/{TrayPanel,UsageTab,api,main,menuAim,usePanelTheme}.tsx`、`src/tray-panel/tray-panel.css`、`src/icons/extracted/alltokens-si.png`、`src/whats-new/4.0.16.json`；测试 `tests/components/{GeneralSection.trayStyle,GptContextWindowHint,TrayPanel.styles,TrayPanel,TrayPanelUsageTab,UsageFooter.tokenPlanBalance}.test.{ts,tsx}`、`tests/config/hermesMinimaxProviderKey.test.ts`、`tests/hooks/useApiKeyLink.test.tsx`、`tests/tray-panel/menuAim.test.ts`；文档 `docs/release-notes/v4.0.16-{zh,en,ja}.md` 与 3 份 routing-guide 更新。**Q1 已决定纳入托盘面板（选 B）**：上述文件全部落地，另需按上游引入 `Cargo.toml` 的 `macos-private-api` feature 与 `objc2 0.6`/`objc2-app-kit 0.3`/`objc2-foundation 0.3` 三个 crate、`tauri.conf.json` 的 `macOSPrivateApi: true`、`vite.config.ts` 的 tray-panel rollup 输入段。
- 交付步骤（验收通过并归档后，按 Q2 授权）新增本地 annotated tag `v4.0.16-1`。

### 修改

- 版本号四处：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`（`4.0.15-1` → `4.0.16-1`）与 `src-tauri/Cargo.lock`（`cc-switch` 包条目联动，由 `cargo check` 更新）。上游 `v4.0.15..v4.0.16` 对这四处的改动只有版本号行，本轮 npm 无新增/移除依赖。
- 35 个上游/fork 重叠文件（实测口径 `comm -12 <(git diff --name-only v4.0.15 v4.0.16|sort) <(git diff --name-only v4.0.15 main|sort)`；上游 127 文件 + fork 327 文件）：4 个版本与锁文件、10 个后端文件（`src-tauri/src/{commands/misc,commands/settings,database/schema,deeplink/provider,lib,proxy/model_mapper,services/provider/mod,settings,tray}.rs`、`tauri.conf.json`）、15 个前端文件（`src/App.tsx`、`src/types.ts`、`src/components/providers/{ProviderList}.tsx`、`forms/{ProviderForm,ClaudeDesktopProviderForm,PiProviderForm}.tsx`、`forms/shared/index.ts`、`src/components/settings/{AboutSection,sections/GeneralSection}.tsx`、`src/components/shell/Sidebar.tsx`、7 个 `src/config/*ProviderPresets.ts`）、4 个 `src/i18n/locales/*.json`、`tests/components/ProviderPresetSelector.test.tsx`。完整清单与逐文件叠加要求在完整目标规格「冲突解决」中展开。
- 上游本轮改动、fork 侧未触碰的其余 92 个文件随 rebase 直接落地（含 `src-tauri/src/opencode_config.rs` 的 `get_default_model`/`set_default_model`、`proxy/handlers.rs`、`proxy/providers/*`、`services/{balance,coding_plan,skill,session_usage_mcode,session_mcode}.rs`、`commands/failover.rs`、`live/project/claude.rs`、`mode/{controller,current}.rs`、`proxy/failover_switch.rs`、`deeplink/tests.rs`、`tests/provider_service.rs`、前端 `UsageFooter.tsx`、`UsageTrendChart.tsx`、`presentation.ts`、`DeepLinkImportDialog.tsx`、`useProviderActions.ts`、`useHermesFormState.ts`、`modelMetadata.ts`、`lib/api/providers.ts`、`piModelCatalog.ts`、`tests/msw/handlers.ts`、`src/App.tsx` 等）。
- `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订，新增 §4.3「v4.0.16 轮的叠加要点」；确有新增 fork 专属文件时才补充白名单条目。
- 全局能力规格 `docs/comet/specs/upstream-sync/spec.md`（归档时更新为本轮同步后的完整状态）。
- 把本地 main rebase 到 tag `v4.0.16`（`4f6b5495`）：当前 merge-base `988b0d00`（v4.0.15）→ 目标 `f92ff0b0`。

### 删除

- 上游本轮删除 1 个文件：`src/assets/icons/app-icon.png`（v4.0.16 把 About 卡片 logo 换成矢量 `src/assets/icons/logo.svg`；fork 未改过该 png，随上游删除；fork 的 `AboutSection.tsx` 精简形态在冲突解决时保留，仅按需叠加矢量 logo）。
- 只随上游删除代码片段与 locale 键：上游 `e02f3a33` 去掉 Zhipu `apiKeyUrl` 的 `?ic=` 邀请码参数（7 个预设文件各 2 行）；上游改写 `tr.json` 17 条文案（fork 保持与上游 tag 逐字节一致，随上游改写）。fork 已删除的 updater 链路、`stream_check` 链路不得被重放带回。

### 明确不建

- 不新建 Git 分支或 worktree 作为工作区（隔离方式为 `current`，直接沿用 main；`pre-sync-v416` 是安全参照分支）。
- 不新增 fork 专属代码文件、不改 `forkPresetFilter.ts` 判定实现与 `forkOfficialAllowlist.ts` 既有条目（上游本轮新增的 AllTokens SI 赞助商预设 6 个 app 全部按 fork 既有政策默认拒绝，白名单无须追加）。
- 不创建 PR；不推送除 Q2 授权范围之外的任何远端引用。
- 不新增数据库迁移（上游 v4.0.16 仍为 `SCHEMA_VERSION = 20`，fork 保持 21）。
- 不给 `tr.json` 补 fork 键（沿用既有决定：与上游 tag 逐字节一致）。

## 上游本轮同步范围（v4.0.15..v4.0.16，43 提交 127 文件 +8813/−556）

- **托盘玻璃面板**（14 提交，约 3.7k 行）：`77c6dc79` 用玻璃面板替代原生托盘菜单（新增 `tray_panel.rs` 1152 行、`src/tray-panel/` 前端 6 文件 + html + css、`capabilities/tray-panel.json`）；`752998a6` 加「托盘样式」设置项（`settings.nativeTrayMenu`，`GeneralSection.tsx` 的 `SegmentedControl` + 4 locale 各 4 键）；`940f9f93` 面板跟随用量显示币种与图表样式；`e003829b` 默认托盘样式为面板；`e2af66ca` 模式名用主题色；`cd449274` Unix 不再把继承进程环境变量报成冲突；`273d166b` macOS 深色窗口上可读；`a8e17dd6` 悬停与应用切换即时响应；`27c42fd1` 子面板内容淡入与应用切换时关闭；`b76e83c3` CJK 四位数轴刻度缩短与 Y 轴按标签定宽；`01bc780f` 面板重新成为默认；`e33a0f35` 样式测试匹配不透明 macOS 填充；`3168b00f` **revert** 上游 v4.0.14 的「侧栏 Today 徽标只显数字」（`6fcbb054`），恢复带「今日」文案。依赖新增 4 个 Rust crate（`objc2 0.6`、`objc2-app-kit 0.3`、`objc2-foundation 0.3`）、`tauri` 的 `macos-private-api` feature 与 `tauri.conf.json` 的 `macOSPrivateApi: true`。**与 fork 的托盘左键单击切换主窗口直接冲突**：上游把左右键 Up 都改成弹面板（原生菜单模式下左键为「打开主界面」的 show，不是 toggle）。
- **Get API Key 链接**（3 提交）：`b92de269` 编辑已有供应商时也能显示「获取 API Key」链接（`useApiKeyLink.ts` 97 → 149 行：新增 `formBaseUrl` 反向按请求地址反查预设，多个预设链接/推广语不一致时不猜、退回官网）；`68b52851` 恢复浅蓝链接样式；`e02f3a33` 去掉 Zhipu `?ic=` 邀请码。`ProviderForm.tsx` 6 处调用点与 `ClaudeDesktopProviderForm.tsx` 1 处传入 `formBaseUrl`。`useApiKeyLink.ts` 是上游共享文件（fork 从未修改），fork 当前形态等价于上游改造前的上游版本。
- **GPT 上下文窗口**（3 提交）：`a94f997f` 尊重配置的 GPT 窗口；`f3d4fe53` 恢复 API 计费平台的 1.05M 窗口；`8d7a7415` 只对「借用」的 GPT 窗口封顶并对超大条目告警；新增 `GptContextWindowHint.tsx` 提示组件 + 4 locale 各 1 键 + 新测试。`shared/index.ts` 导出该组件。
- **Hermes MiniMax providerKey**（2 提交）：`0bbbb534` 预设选中时预填不与 Hermes 内置冲突的 provider key（`HermesProviderPreset.providerKey` 新字段；MiniMax cn/intl 的 `settingsConfig.name` 由 `minimax`/`minimax_en` 改为 `cc-switch-minimax`/`cc-switch-minimax-en`）；`734c4831` 官方 MiniMax 预设加 `MiniMax-M3.1-Flash`（含 `title_generation_model: "MiniMax-M3"`，M3.1 无法关闭思考）。`ProviderForm.tsx` 的 `resetHermesState(config)` → `resetHermesState(config, preset.providerKey)`。新测试 `tests/config/hermesMinimaxProviderKey.test.ts`。
- **AllTokens SI 赞助商预设**（`b89cccf9`）：6 个 app 各 1 条（claude 系列 5 + gemini/grokBuild/opencode/openclaw/hermes/pi），新图标 `alltokens-si.png`，4 locale 各 1 条描述键。按 fork 白名单政策自动拒绝，不进入 fork UI。
- **其他修复**：`8b09732a` 无 AccessKey 不自动开启 Volcengine 套餐配额；`bb05f9d6` Kimi K3 / Step 5 Preview 定价修正 + 新 Qwen 种子；`1e36b107` MiniMax Code 用量行缺模型名时恢复；`6c36d68a` CC Switch 脱离路由时保留 Codex ChatGPT 登录；`8e51101e` 路由模式下 5.5 目标发布 catalog id；`2c2d6c43` 官方卡片 auth.json 编辑器显示磁盘登录；`56ac4f9a` 仅陈旧 DB current 标记指向时允许删除空闲卡片；`eadfc151` **opencode 从新增供应商卡片设默认模型**（`ProviderList.tsx` 的 `defaultModel`/`defaultModelOptions` 由 openclaw 专用泛化 + `App.tsx` 的 `onSetAsDefault` 扩入 opencode + `opencode_config.rs` 新增 `get_default_model`/`set_default_model` + `opencodeFormUtils.ts` 新增 `getOpencodeDeclaredModels`）；`3b1f11b6` Windows 找 fnm 管理的 Node CLI；`a9a93f06` skill 测试隔离 HOME；`f3d9e8c6` About 卡片 logo 用矢量标记（删除 `src/assets/icons/app-icon.png`）；`5fa00079` macOS 图标磁贴改浅灰；`adc223af`/`75e93281`/`8d8dc456` 代理侧 Claude catalog id / WebSearch / tool 输出连续性修复。

# 非目标

- 不同步 upstream 其他分支（`upstream/agent/*`、`upstream/codex/*` 等）；不做部分 cherry-pick。
- 不清理本地遗留分支与历史 tag，不改动 `v4.0.15-1` 及更早的 fork tag。
- 不改动 fork 的数据库迁移链（SCHEMA_VERSION 21 与 v20→v21 修复迁移原样保留）。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、`installUpdateAndRestart` 安装流程、旧 `stream_check` 链路）。
- 不放开赞助商、聚合站与第三方云预设；不改 `forkPresetFilter` 判定实现。
- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不给 `tr.json` 补 fork 键。
- 不改 fork「左键单击切换主窗口」的既有语义，也不新增面板专属交互（面板内容以上游实现为准）。- 不重构 fork 既有魔改以迎合上游新代码；只做叠加与必要的契约适配。

# 验收示例

- A1: rebase 后 `git merge-base main v4.0.16` 等于 `f92ff0b0`（tag `v4.0.16` 指向的提交），`git log v4.0.16..main` 只包含 fork 提交、不含任何上游提交。
- A2: 重放前 `v4.0.15..main` 的 156 个 fork 提交按原顺序逐一重放；提交主题序列逐行 diff 一致，被 git 判定为空而丢弃的提交（如有）在完整目标规格「重放映射」中逐条记录；每次冲突停车逐条记录归属与解法。
- A3: 35 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（版本与锁文件、`settings.rs`、`tray.rs`、`misc.rs`、`lib.rs`、`App.tsx`、`GeneralSection.tsx`、`AboutSection.tsx`、`Sidebar.tsx`、`ProviderList.tsx`、`ProviderForm.tsx`、7 个预设文件、4 个 locales、测试文件为高危面）。
- A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.16-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` 仍为 21、fork 专属 v20→v21 幂等修复迁移完整保留。
- A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤、逐模型连通性测试、双官网链接、跨应用导入、禁用应用内更新器、上游 tag 发版跳过、README fork 说明、fork CI。
- A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。
- A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.3 v4.0.16 叠加要点），本 change 的完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类）。
- A8: `pnpm typecheck` 通过。
- A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`tests/components/{TrayPanel,TrayPanelUsageTab,TrayPanel.styles,GeneralSection.trayStyle,GptContextWindowHint,UsageFooter.tokenPlanBalance,ProviderPresetSelector,AppsPage}.test.{ts,tsx}`、`tests/config/hermesMinimaxProviderKey.test.ts`、`tests/hooks/useApiKeyLink.test.tsx`、`tests/tray-panel/menuAim.test.ts`、`tests/lib/modelMetadata.test.ts`、`tests/config/{codexChatProviderPresets,codexReasoningLevelPresets,presetModelMetadata,hermesMinimaxProviderKey}.test.ts` 等）与 fork 既有用例。
- A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。
- A11: `pnpm build:renderer` 通过。
- A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自本轮决定纳入的依赖与版本号行：允许 `cc-switch` 包版本号行改为 `4.0.16-1`、`objc2 0.6.4`/`objc2-app-kit 0.3.2`/`objc2-foundation 0.3.2` 三条目新增；`tauri-plugin-updater` 相关条目不得出现。
- A13: `cargo test` 通过（如遇与上轮同因的环境性失败——本机 cc-switch 占用代理端口 15721——按上轮口径显式 `--skip` 该用例并记录原因；上轮被 skip 的用例已被上游改名/重写，本轮以实际失败项为准，不扩大跳过列表）。
- A14: 落地保真核对通过：对 35 个重叠文件按完整目标规格固定的四 ref 归一化行多重集算法（`v4.0.15`、`v4.0.16`、`pre-sync-v416`、`HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；确有意图取舍时逐行说明理由，未说明的非零缺失即视为丢语义缺陷。
- A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且无任何同名重复键，fork 键段按 key 逐个比对全部在位；`tr.json` 与 `git show v4.0.16:src/i18n/locales/tr.json` 逐字节一致。
- A16: 托盘面板随上游落地且可用——`src-tauri/src/tray_panel.rs` 与 `src/tray-panel/**`（6 个 tsx + css + html）在位、`src-tauri/capabilities/tray-panel.json` 已注册、`src-tauri/tauri.conf.json` 的 `macOSPrivateApi: true` 与 `src-tauri/Cargo.toml` 的 `macos-private-api` feature + `objc2 0.6`/`objc2-app-kit 0.3`/`objc2-foundation 0.3` 三个 crate 在位、「托盘样式」设置项在 `src/components/settings/sections/GeneralSection.tsx` 可切换且 4 locale 的 `trayStyle*` 4 键齐全、`vite.config.ts` 的 tray-panel rollup 输入段在位。
- A17: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`。
- A18: 上游 `eadfc151` 的 opencode 默认模型功能在 fork 落地后可用：`src-tauri/src/opencode_config.rs` 的 `get_default_model`/`set_default_model`、`src/lib/api/providers.ts` 的对应 API、`src/components/providers/forms/helpers/opencodeFormUtils.ts` 的 `getOpencodeDeclaredModels`、`src/components/providers/ProviderList.tsx` 的 `defaultModel`/`defaultModelOptions` 泛化与 `src/App.tsx` 的 `onSetAsDefault` 扩入 opencode 全部在位，且不破坏 fork 的模型徽章/快捷切换（徽章逻辑在 `ProviderCard.tsx`，与 `App.tsx` 的 `onSetAsDefault` 是两条独立链路）。
- A19: 上游 `b92de269` 的「编辑时也能显示获取 API Key 链接」在 fork 落地后可用：`src/components/providers/forms/hooks/useApiKeyLink.ts` 的 `formBaseUrl` 反向反查逻辑在位，`src/components/providers/forms/ProviderForm.tsx` 的 6 处 `useApiKeyLink` 调用与 `ClaudeDesktopProviderForm.tsx` 的 1 处已传 `formBaseUrl`，`tests/hooks/useApiKeyLink.test.tsx` 通过。
- A20: 上游 Hermes MiniMax 修复落地后 fork 的 MiniMax cn/intl Hermes 预设不再与 Hermes 内置冲突：`hermesProviderPresets.ts` 中两条 MiniMax 的 `settingsConfig.name` 为 `cc-switch-minimax`/`cc-switch-minimax-en`、`providerKey` 字段已设、`suggestedDefaults.model.provider` 已改指新名、`MiniMax-M3.1-Flash` 条目在位；`useHermesFormState.ts` 的 `resetHermesState` 第二参 `providerKey` 与 `ProviderForm.tsx` 的传参在位；`tests/config/hermesMinimaxProviderKey.test.ts` 通过；且 `HermesProviderPreset` interface 中 `hidden?: boolean`（fork）与 `providerKey?: string`（上游）两个字段并存、无重复声明。
- A21: 上游 GPT 上下文窗口治理落地后行为正确：`src/lib/modelMetadata.ts` 的 `GPT_CONTEXT_WINDOW_CAP`/`isGptModelId`/`capGptContextWindow`（只封顶借来的窗口）在位、`src/components/providers/forms/shared/GptContextWindowHint.tsx` 已从 `shared/index.ts` 导出并在上游 5 个表单（Codex/Hermes/OpenClaw/OpenCode/Pi）渲染、4 locale 的 `gptContextWindowHint` 键在位、`tests/lib/modelMetadata.test.ts` 与 `tests/config/presetModelMetadata.test.ts` 已随上游改写（不再断言一刀切封顶）且通过。
- A22: **fork 的逐模型连通性测试功能未因 `lib.rs` 合并而失效**：`src-tauri/src/lib.rs` 的 `invoke_handler` 中 `commands::connectivity_test_provider_models` 与 `commands::connectivity_probe_provider` 两个注册仍在位（上游 v4.0.16 把这两个注册删掉、换成 `stream_check_provider`，若整段取上游会让 fork 该功能在运行时报未处理命令、且不报编译错误）。
- A23: **上游 `deeplink/provider.rs` 的 `Provider` 结构体字面量已补 `website_url_2: None`**：上游 `build_provider_from_request` 的 `Provider { … }` 字面量没有该字段（fork 新增的列），不补则 `cargo check` 直接失败；补完后该行在位。
- A24: **`src-tauri/src/tray.rs` 的 `note_tray_click` → `mark_feedback_seen` 改名已适配**：上游把 `note_tray_click` 改名为 `mark_feedback_seen`，fork 的 `note_tray_click` 定义、两个调用点与两个测试断言（`tray.rs:4260,4262`）已按上游新名适配，`cargo check`/`cargo test` 通过；fork 的「悬停/点击时刷新用量」与「反馈行显示过就拿掉」语义不丢失。

# 约束与不变量

- fork 全部 156 个魔改提交必须顺序重放，无丢失、无行为回归；重放前用安全分支 `pre-sync-v416`（= `e0a801da`）固定起点，失败时 `git rebase --abort` 回到起点。
- 冲突处理以 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 为准；无法安全判定的冲突暂停并记录。
- 沿用 `rerere.enabled=true`：上轮记录的解法可自动复用，但复用结果必须逐个复核。
- 重放中途不跑 `cargo test`（fork 历史提交自带冲突标记）；最终态必须对 `<<<<<<<` 与 `>>>>>>>` 标记零命中（取证口径 `git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> '`）。
- patch-id 对照必须走 stdin（`git show <c> | git patch-id --stable`）。
- 本轮高危叠加面：`src-tauri/src/tray.rs`（上游 +485/−31 的面板接线、`apply_tray_style`、`native_menu_on_left_click`、删 `TrayMode::Desktop` 与 fork `hide_main_window`/`toggle_main_window` 两个 helper 同区）、`src-tauri/src/lib.rs`（上游 +45/−18 的面板注册、窗口事件过滤 `PANEL_LABEL`、macOSPrivateApi 与 fork 无 Updater 插件/左键分支/connectivity_test 注册）、`src/components/settings/sections/GeneralSection.tsx`（上游在 `showProviderSearch` 行之后插入托盘样式 SegmentedControl，fork 在同一卡片内插 `SidebarPanelPillRow`）、`src/components/settings/AboutSection.tsx`（上游换矢量 logo 与 fork 精简形态）、`src/components/providers/ProviderList.tsx`、`forms/ProviderForm.tsx`、7 个 `src/config/*ProviderPresets.ts`（`hidden?: boolean` 重复声明）、`src/i18n/locales/*.json`——出现「整文件取一侧」即视为丢语义缺陷。
- 上游 `HermesProviderPreset.providerKey` 与 fork 的 `hidden?: boolean` 同处 `hermesProviderPresets.ts` 的 interface：三方合并可能留下两份 `hidden?: boolean`（v4.0.12 轮实测 `TS2300: Duplicate identifier`），合并后必须删掉 fork 侧重复声明。同理适用于其余 6 个预设文件的 interface。
- manifest 键删除项必须跟随上游：Zhipu `apiKeyUrl` 的 `?ic=` 参数（7 个预设文件）、`tr.json` 17 条文案改写。fork 在这些区域无自有语义，取上游新形态。
- `.comet/config.yaml` 被历史重放改写时从 ORIG_HEAD 恢复并核对 native 启用状态。
- current 工作区在 main 上 rebase：检出新基线瞬间工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape；按 Runtime 返回的恢复命令处理。
- 合并两侧 JSX/Rust 禁止按行去重；合并后必须本地跑 `pnpm format:check` 与 `pnpm build:renderer`；locale 重复键必须显式查重。
- 时间敏感用例在本地 00:00–00:30 窗口必失败的既有口径继续适用。
- 推送（若 Q2 授权）只用 `--force-with-lease`；远端被他人更新时拒绝推送并报告。
- 若 Q1 决定纳入托盘面板：不得为了让上游代码落地而恢复 fork 已移除的 `tauri-plugin-updater`（上游 `Cargo.toml` 同时含 updater 依赖与 objc2 0.3 依赖，取上游 objc2 部分、updater 部分保持 fork 删除态）。
- 上游把 `src-tauri/src/tray.rs` 的 `note_tray_click` 改名为 `mark_feedback_seen`（`tray.rs:1527`）；fork 的 `note_tray_click` 定义、两个调用点与两个测试断言（`tray.rs:4260,4262`）必须按上游新名适配，否则 `cargo check` 失败。
- **`src-tauri/src/lib.rs` 的 `invoke_handler` 是无声失效高危点**：上游 v4.0.16 删掉 `commands::connectivity_test_provider_models` 与 `commands::connectivity_probe_provider` 两个注册、新增 `stream_check_provider`/`get_opencode_default_model`/`set_opencode_default_model`；fork 依赖前两个注册（`src-tauri/src/commands/connectivity_test.rs`）。整段取上游会让 fork 逐模型连通性测试在运行时报「未处理的命令」且**不报编译错误**，必须手工保留 fork 的两个注册。
- 上游 `src-tauri/src/deeplink/provider.rs` 的 `build_provider_from_request` 中 `Provider { … }` 字面量没有 `website_url_2` 字段（fork 新增列）；取上游形态后必须补 `website_url_2: None`，否则 `cargo check` 失败。
- 上游 `src/lib/modelMetadata.ts` 的 GPT 窗口封顶语义从「一刀切 272K」窄化为「只封顶从 models.dev 借来的窗口」；fork 从未修改该文件与其两个测试文件，必须连带采用上游对 `tests/lib/modelMetadata.test.ts` 与 `tests/config/presetModelMetadata.test.ts` 的改写，保留 fork 旧断言会反向失败。

# 决策

- 隔离方式：当前目录（`current`），沿用 main。理由：工作区干净、无其他 active Native change、未要求并行；同步必须直接改写 main 历史，与过去 14 轮一致。
- 能力关联：不关联 `upstream-sync` capability，直接以完整目标规格 `specs/upstream-sync/spec.md` 管理（该能力既有总规格为纯散文；沿用历轮决策）。
- 版本号：`4.0.15-1` → `4.0.16-1`。
- 数据库 schema：上游 v4.0.16 仍 `SCHEMA_VERSION = 20` 且 `database/**` 仅新增 Kimi K3 / Step 5 Preview / Qwen 价格种子行；fork 保持 21，不新增迁移。
- 上游依赖：本轮 npm 无新增依赖；Rust 新增 4 crate 与 `macos-private-api` feature **仅与托盘面板绑定**，是否引入完全取决于 Q1。
- 预设白名单：上游本轮新增 AllTokens SI 赞助商预设 6 个 app，全部不在白名单，fork 构建自动拒绝，无须新授权、不追加条目。
- `tr.json`：保持与上游 tag 逐字节一致，不补 fork 键（沿用 2026-10-15 决定）。
- **Q1（2026-10-20 用户决定：纳入，选 B）**：上游 v4.0.16 的托盘玻璃面板（`77c6dc79` 等 14 提交）**纳入**本轮同步，并叠加保留 fork 的「托盘左键单击切换主窗口」语义。
  - 叠加方式（Build 阶段按上游 `tray_panel::toggle`、`native_menu_on_left_click`、`show_menu_on_left_click` 三者的实际语义选定并记录，两种都满足「fork 左键切换主窗口语义不失效」）：①「面板开启时左键 toggle 面板、否则 toggle 主窗口」；②「右键弹面板、左键保持切换主窗口」。推荐 ①：面板是上游默认交互（`uses_native_menu()` 默认 false），左键先服务面板更符合上游心智，同时主窗口切换语义通过 else 分支完整保留。
  - 必须引入：`Cargo.toml` 的 `macos-private-api` feature + `objc2 0.6`/`objc2-app-kit 0.3`/`objc2-foundation 0.3`、`tauri.conf.json` 的 `macOSPrivateApi: true`、`vite.config.ts` 的 tray-panel rollup 输入、`capabilities/tray-panel.json`、`settings.rs`/`types.ts`/`commands/settings.rs` 的 `native_tray_menu`、`GeneralSection.tsx` 的「托盘样式」`SegmentedControl`、4 locale 的 `trayStyle*` 4 键、5 个面板测试文件。
  - **不得为之恢复** fork 已移除的 `tauri-plugin-updater`（上游 `Cargo.toml` 同时含 updater 依赖与 objc2 0.3 依赖，只取 objc2 部分）。
  - 已知必须手工处理的叠加点：上游把 `tray.rs` 的 `note_tray_click` 改名为 `mark_feedback_seen`，fork 的 `note_tray_click` 及其两个测试断言（`tray.rs:4260,4262`）需按上游新名适配，否则编译失败。
- **Q2（2026-10-20 用户决定：沿用上轮方式）**：交付授权沿用上轮方式——验收通过并用户接受结果、生成归档提交后，执行 `git push --force-with-lease origin main`，随后在归档提交上创建 annotated tag `v4.0.16-1` 并 `git push origin v4.0.16-1`（触发 fork Release CI）。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。只授权这两项动作，不含 merge、PR 或其他远端引用；执行前无需重复询问。
- 上游 `b92de269`（编辑时显示获取 API Key 链接）：直接纳入。理由：`useApiKeyLink.ts` 是上游共享文件、fork 从未修改（实测 `git diff v4.0.15 HEAD` 对该文件为空），fork 当前形态就是上游改造前的上游版本；上游改动是纯增强（新增 `formBaseUrl` 可选参数与按请求地址反向反查预设，多个候选链接/推广语不一致时不猜、退回官网），不触碰 fork 任何语义，纳入零冲突成本且让 fork 获得该修复。
- 上游 `eadfc151`（opencode 默认模型）：直接纳入，但需在 Build 中适配 `App.tsx` 的 `onSetAsDefault`。理由：后端 `opencode_config.rs` 与前端 `opencodeFormUtils.ts`、`ProviderList.tsx` 均随上游落地；fork 的模型徽章/快捷切换在 `ProviderCard.tsx`，与 `App.tsx` 的 `onSetAsDefault` 是两条独立链路，扩入 opencode 不影响 fork 语义。
- 上游 `f3d9e8c6`（About logo 用矢量标记、删除 `app-icon.png`）：纳入上游删除与新 logo，fork 的 AboutSection 精简形态（不自检、不安装更新、指向 tunecc Releases）保持不动。
- 上游 `3168b00f`（revert 侧栏 Today 只显数字）：纳入。理由：该 revert 恢复的是 v4.0.14 之前的行为，fork 未触碰该区域（fork 的 Sidebar 改动只有 `visibleSidebarPanels` 过滤段与 `globals`→`allGlobals` 改名），取上游即可。
- 上游 GPT 上下文窗口治理（`a94f997f`、`f3d4fe53`、`8d7a7415` + `GptContextWindowHint.tsx`）：纳入。fork 在 `src/lib/modelMetadata.ts`、`tests/lib/modelMetadata.test.ts`、`tests/config/presetModelMetadata.test.ts` 三个文件上**从未修改**（实测 diff 为空），当前形态就是上游改造前的上游版本；上游把「一刀切封顶 272K」窄化为「只封顶从 models.dev 借来的窗口」并新增超大条目告警。**必须连带采用上游对这两个测试文件的改写**——fork 现有断言（如 `preset("https://relay.example.com/v1", { "openai-gpt-6-astra": { contextWindow: 1050000 } })` → `GPT_CONTEXT_WINDOW_CAP`）在上游新语义下会反向失败。fork 侧无代码需要保留。
- 上游 Hermes MiniMax providerKey 修复（`0bbbb534`）：纳入。该提交修的是 fork 同样存在的真实缺陷——Hermes 把 `model.provider` 为 `minimax` 的路由到内置 provider、忽略同名 `custom_provider`，导致请求根本不发出；fork 的 MiniMax cn/intl 条目仍用冲突名 `minimax`/`minimax_en`（上游判定口径 `HERMES_BUILTIN_MINIMAX_IDS = ["minimax","minimax-cn","minimax-oauth"]`，fork 两条都命中）。叠加时保留 fork 的 `hidden?: boolean`，与上游 `providerKey?: string` 两字段并存于 `HermesProviderPreset` interface（不得删任一侧）。
- 上游 AllTokens SI 赞助商预设（`b89cccf9`，9 个预设文件 + 新图标 + 4 locale 描述键）：数据随上游落地，但 fork UI 不显示。理由：`filterForkPresets` 按 `name` 精确匹配 `forkOfficialAllowlist`，`"AllTokens SI"` 不在任何 app 的白名单中，与既有 `alltokens.cc` 同样不可见——这是 fork 既有的「官方+本机推理」政策，不是本轮新决定，无须新授权、不追加白名单条目。
- 上游 opencode 默认模型（`eadfc151`）：纳入，`App.tsx` 的 `onSetAsDefault` 扩入 opencode 随上游。fork 的模型徽章/快捷切换在 `ProviderCard.tsx`，与 `App.tsx` 的 `onSetAsDefault` 是两条独立链路，扩入不影响 fork 语义。
- 上游 About logo 矢量标记（`f3d9e8c6`，删除 `src/assets/icons/app-icon.png`）：纳入上游 logo 与删除；fork 的 AboutSection 精简形态（不自检、不安装更新、指向 tunecc Releases）保持不动。**手工解决，不得整文件取上游**（会把 fork 刻意移除的 updater UI 与 `extractErrorMessage` import 带回来）。
- 上游 `cd449274`（Unix 不把继承环境变量报成冲突）与 `3b1f11b6`（Windows fnm Node CLI）：纳入。fork 从未修改 `services/env_checker.rs`（实测 diff 为空），前者干净落地；后者在 `commands/misc.rs` 与 fork 唯一的 releases URL 行相距约 2000 行，无冲突。
- 上游 `8b09732a`（火山无 AccessKey 不默认启用套餐）与 `codingPlanProviders.ts` 的 `codingPlanEnabledByDefault()`：纳入。fork 从未修改 `src/config/codingPlanProviders.ts`，干净落地并补上 fork 缺失的默认关闭逻辑。

# 未决问题

- 无。Q1（托盘玻璃面板是否纳入）与 Q2（交付授权）已于 2026-10-20 由用户确认，结论记入「决策」。

# 验证期望

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm build:renderer`
- `cargo check`
- `cargo test`（环境性例外按 A13 口径）
- 落地保真核对脚本 + locale 重复键查重 + 冲突标记零命中
