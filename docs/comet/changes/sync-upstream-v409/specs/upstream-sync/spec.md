# 完整目标规格：upstream-sync

## 概述

fork（tunecc/cc-switch）维持「始终可干净 rebase 到上游 farion1231/cc-switch main 之上」的同步状态。每次同步执行后，fork main = 上游发布内容 + fork 全部魔改提交（顺序重放），无丢失、无行为回归。

本轮同步后，fork main 基线为上游 v4.0.9 发布头（tag v4.0.9 = 8845b1ef），fork 版本号为 4.0.9-1。「origin/main 与本地一致」与「归档提交上存在 annotated tag `v4.0.9-1`」属于交付步骤的结果，交付在验收通过并归档之后按 Q1 授权执行，不是验收当时的状态。

## 同步后状态（完整行为描述）

### Git 状态

- `main` 分支基于 8845b1ef（tag v4.0.9 指向的提交，本次同步基线）。
- `git merge-base main upstream/main` == 8845b1ef；`git log v4.0.9..main` 仅包含 fork 提交，fork 全部改动语义保留。同步前的 135 个 fork 提交（v4.0.8..main，含 v4.0.8 的同步提交、归档提交与 v4.0.6 规格修正提交）按原顺序重放，外加本次同步提交与归档提交（见「重放映射」）。
- 本轮基线不含 post-release 区间：`upstream/main` = 99277921，`git rev-list --count v4.0.9..upstream/main` == 6，这 6 个提交（`3302cc2d` NekoCode 预设、`04bd15c9` ja「詳細オプション」文案、`28dc5198` 添加/编辑页取消淡入、`68122bc4` Codex 线程模型设置、`96d636ca` OpenRouter 空额度不再当过期、`99277921` 无关自动保存改用已确认目录）按「只锁已发布 tag」的既定惯例排除，进入下一轮范围。
- 同步前起点由安全分支 `pre-sync-v409`（= `cc6e7870`）固定记录，该提交同时是 origin/main 与本地 annotated tag `v4.0.8-1` 指向的提交，用于重放前后的 diff 对照与回退参照。

#### 重放映射（本轮实测）

- rebase 一趟完成，共 12 次冲突停车，解决后 `Successfully rebased and updated refs/heads/main`。重放前 `git rev-list --count v4.0.8..main` == 135，重放后 `git rev-list --count v4.0.9..main` == 135：无提交被 git 判定为空而丢弃、无冗余提交被去掉、无 git 段错误。`git merge-base main upstream/main` == 8845b1ef；`git log --format=%an v4.0.9..main | sort -u` 只有 Tune（fork 作者），区间内无任何上游提交。
- 提交主题序列逐行 diff（`git log --format='%H %s' --reverse`，重放前 v4.0.8..pre-sync-v409 与重放后 v4.0.9..main）完全一致：135 条主题无遗漏、无重复、无顺序变化。
- patch-id 对照（`git show <c> | git patch-id --stable`，按序逐条比对）：135 个提交中 119 个与重放前完全相同，16 个不同。16 个的归类如下。
  - 4 个属于「内容完全相同、仅 hunk 位移」：`3a0553fe→05d523ae`（1M 全选复选框）、`6f3d2e2a→3d2cd8d8`（模型快捷切换弹窗）、`1752e383→18e4eebd`（仅在模型映射发散时自动展开高级选项）、`13e405cc→e145e556`（跨应用导入）。四对提交的增删行集合（含缩进、逐字节）经比对完全相同，差异只在 diff 的 hunk 行号/元信息层面。
  - 12 个对应本轮 12 次冲突停车，逐条见下；无一属于「fork 语义丢失」。
- 冲突清单（12 处，按 rebase 顺序，标注 fork 侧原提交与新提交）：
  1. `f0152de2→109ecae4`（2/135，fork 首个版本号提交）：`package.json` / `src-tauri/Cargo.toml` / `src-tauri/tauri.conf.json` 三处版本号冲突（新基线 `4.0.9` vs 该提交要写入的历史值 `3.20.2-fork.1`）→ 只取 fork 侧版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`。同提交带走的 `tailwindcss-animate` 删除、`codegen-units = 1`、`trafficLightPosition` 删除与 `tauri.windows.conf.json` title 改写经核对属该提交原始意图（后续 fork 提交 `870dc12c` 会把 tailwindcss-animate 加回），非误删。
  2. `c26d98cd→5cf29ba8`（17/135，API 格式选择器移到端点框旁）：`ClaudeFormFields.tsx` 4 个 hunk。(a) `hasAnyAdvancedValue`：上游 v4.0.9 在该条件里新增的 `(!isXaiOauthPreset && !isCodexOauthPreset && apiFormat !== "anthropic") ||` 按 fork 意图删除（fork 后续提交把整段换成 `hasCustomModelMapping`），上游 `isFullUrl ||` 一项保留。(b) 端点区：以上游 `EndpointField` 新形态（`help={endpointHint}`、门控 `shouldShowSpeedTest && !isCodexOauthPreset && !isXaiOauthPreset`）为基础，叠加 fork 的 flex 包裹层与 `apiFormat` Select，并补回被上游保留的 `showManageButton`/`onManageClick`（首次解法漏掉，已复核补回）。(c) 上游高级选项里的整段 `apiFormatField`（`apiFormatLabel` + `FormLabel` + `HelpTip` + Select + `DirectModeFormatWarning`）由 fork 的端点行位置取代，其中上游新增的 `providerForm.apiFormatHelp` HelpTip 文案改贴在端点行 Select 之后、`DirectModeFormatWarning` 改在端点行之后渲染，两侧语义并存不重复渲染。(d) 经典布局高级区取上游 `{fullUrlToggle}` + 上游认证门控，只去掉 `{apiFormatField}` 引用。
  3. `931dad4e→0836ad02`（20/135，Select 移入 `EndpointField.rightSlot`）：`shared/EndpointField.tsx` 与 `ClaudeFormFields.tsx`。`EndpointField` 解为「上游形态（`help` + `HelpTip`、删除 `showFullUrlToggle`/`isFullUrl`/`onFullUrlChange`/`fullUrlHint`、`hint` 直接渲染）+ fork 的 `rightSlot?: ReactNode` 与 `Input`+`rightSlot` 的 flex 包裹层」，导入取并集（`ReactNode`/`HelpTip`/`Zap`，`Switch`/`Link2` 随上游删除）；`ClaudeFormFields` 的端点行改为 `rightSlot={...Select + HelpTip}` 形态，`directModeFormatNotice` 告警仍在端点区之后渲染。
  4. `cff23c3b→26e693be`（23/135，四语言 `advancedOptionsHint` 改写）：上游 v4.0.9 已删除 `providerForm.advancedOptionsHint` 键并把说明改为 HelpTip 文案，fork 的改写文字无对应宿主键 → 4 个 locale 一律跟随上游删除，不复活该键。同提交的 `toggleAll` ja/zh-TW 补齐与 `apiFormatHint` 死键删除自动落地（上游也已删 `apiFormatHint`）。
  5. `f5d0cb45→7141f7e1`（25/135，移植 `SearchableModelPicker`）：`ClaudeFormFields.tsx` 的 `./shared` 导入块与 `shared/index.ts` 均取并集（上游 `FullUrlToggle`/`ModelDropdown`/`DirectModeFormatNotice` + fork `SearchableModelPicker`）。
  6. `e0302059→77458dd9`（26/135，四语言模型搜索键）：`zh`/`ja`/`zh-TW` 解为「上游 v4.0.9 新增的 `apiFormatHelp`/`directModeFormatInUse`/`directModeFormatSwitch`/`localProxyRequestOverridesHelp` 等键 + fork 的 `searchModels`/`noModelsFound`」，JSON 逐文件解析通过。**本轮事故**：该次 `git add src/i18n/locales/*.json` 时 `en.json` 仍带着同一次停车未解析的冲突标记被提交进重放历史（新 hash `77458dd9` 的 `src/i18n/locales/en.json` 内含 `<<<<<<< HEAD` / `>>>>>>> e0302059` 两行标记）；标记在下一次停车（`02d6522c`）解决时被一并清除，重放完成后 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 在工作树与 HEAD 都为 0 命中，最终态无标记，但该中间提交带标记属本轮已知瑕疵。
  7. `6a4868e0→2a621f3b`（43/135，README 重写）：`README.md` 整文件保留 fork 侧（`git checkout --theirs`）。上游本轮只往 README 的赞助商表加 OpenModel 一行，fork 重写版不含赞助商表，属白名单刻意取舍。
  8. `8e9f233e→f79aba00`（49/135，claude-model-quick-access 归档提交）：`ClaudeFormFields.tsx` 3 个 hunk。Stack 布局高级区取上游结构（`{fullUrlToggle}` + 抽取后的 `{userAgentAndOverrides}`），不复活上游已删除的 `stackLayout.advancedHint` 段落；经典布局模型映射表头取上游 `FormLabel + HelpTip(modelMappingHint)`，去掉 fork 已移到直达区的「一键设置 / 获取模型」两个按钮；fork 的 `{fallbackQuickAccessSection}` 引用保留在经典布局。
  9. `02d6522c→2b75eaf5`（连通性测试组件与四语言文案）：4 个 locale 解为「上游 `inactiveFieldsHint` 新措辞 + 上游新增键 + fork 的连通性测试键段与历史 `writeCommonConfig`/`editCommonConfig` 等键段」，逐文件 JSON 解析通过；`en.json` 连同第 6 条遗留标记一起修复。
  10. `519d210d→94eb84c0`（74/135，移除旧 stream_check 链路）：`src-tauri/Cargo.lock` 的 `cc-switch` 版本行取 fork 侧历史值，解决后全文件 `tauri-plugin-updater` 命中数为 0；`src-tauri/src/lib.rs` 自动合并，重放后 `tauri_plugin_updater` 命中数为 0，connectivity_test 命令注册保留。
  11. `040870be→d30dafe8`（107/135，fork 的 v4.0.1 同步提交）：`ClaudeFormFields.tsx` 的 Stack 高级区取当前上游结构（`{fullUrlToggle}` + `{userAgentAndOverrides}`），该提交当年的旧结构不再复活。
  12. `336aa87c→c677dc73`（110/135，v4.0.1 同步后的 CI/发布修复）：`ClaudeFormFields.tsx` 2 个 hunk。Stack 高级区门控解为「fork 的 `shouldShowModelSelector` 与上游的 `!isCopilotPreset` 两者合取」，即两侧的隐藏条件都保留、不新增可见态；内容取上游抽取的 `{userAgentAndOverrides}`，上游已删除的 `stackLayout.advancedHint` 不复活。
- 最终态修正（记在本轮同步提交里，不属于任何单个重放提交）：
  - `ClaudeFormFields.tsx`：删除重放后不再被引用的 `ModelDropdown` 导入；把上游的 `fallbackModelLabel` / `usesThirdPartyEndpoint` / `fallbackModelMissing` 三个常量上移到 `fallbackQuickAccessSection` 定义之前（JSX 在定义时即求值，位置错误会触发 TDZ）；兜底模型直达区改用 `fallbackModelLabel` 变量，并采用上游 v4.0.9 的模式感知 HelpTip（`fallbackModelHelpDirect` / `fallbackModelHelp` 按 `directModeFormatNotice` 分支）与缺失告警（`fallbackModelHaikuMissing` / `fallbackModelMissing`），替换上游已删除键 `fallbackModelHint` 的静态段落；Stack 布局不再渲染兜底直达区（与重放前 fork main 一致，也是上游 `ProviderForm.stackModels` 用例的要求）。
  - 版本号四处 `4.0.8-1 → 4.0.9-1`，`src-tauri/Cargo.lock` 由 `cargo check` 联动（仅版本号一行）。
  - `docs/HOW_TO_REBASE_UPSTREAM.md`：§4 共享文件表按本轮结果修订（详见「白名单文档更新」）。
- 上游功能落地抽查（与上游 v4.0.9 逐文件比对）：`src-tauri/src/settings.rs` 的 `AppSettings::proxy_client_host` + `get/set_proxy_client_host`、`commands/settings.rs` 的透传保护与 `save_settings_should_keep_the_existing_proxy_client_host` 单测、`lib.rs` 的 `commands::get_proxy_client_host` / `set_proxy_client_host` 注册、`tray.rs` 的 `get_proxy_client_endpoint_sync`、`src/lib/api/proxy.ts` 与 `src/lib/query/proxy.ts` 的客户端地址绑定、`RoutingSection.tsx` 的设置行、`proxy/providers/claude.rs` 的 Bearer/stack 合并、`transform_codex_chat.rs` 的未匹配工具结果处理、`transform_codex_responses_xai_sanitize.rs` 的 `call_id` 重写、`shared/{FullUrlToggle,DirectModeFormatWarning}.tsx` 与 `shared/index.ts` 导出、`EndpointField.tsx` 的 `help`/`HelpTip`、`FetchedModelPicker.tsx` 对话框与 `useModelMetadataFill.ts` 静默回填、`useCodexConfigState.ts`/`CodexConfigSections.tsx`/`ProviderForm.tsx` 的 sub-agent state 与 props、`src/i18n/index.ts` + `src/main.tsx` 冷启动语言、`src-tauri/Info.plist` 的 `NSLocalNetworkUsageDescription`、`EditProviderDialog.tsx` 的 `open && !waitingForEditorView`、8 个预设文件的赞助商条目、`src/icons/extracted/*` 与 5 张图标、`src/whats-new/4.0.9.json`、`docs/release-notes/v4.0.9-{zh,en,ja}.md`、`CHANGELOG.md` 均随上游落地。
- fork 语义落地抽查（与重放前 fork main 逐文件比对）：`IS_FORK_BUILD`/DevPanel、`visible_sidebar_panels`（与上游 `proxy_client_host` 在 `settings.rs` 并存）、`website_url_2`（含 `proxy/providers/claude.rs` 的两处测试字面量）、connectivity_test 命令注册、托盘左键分支（`lib.rs` 的 `TrayIconEvent::Click` 行号与内容与重放前 fork main 一致）、fork CI 矩阵、预设过滤接线与 8 个预设文件的 `hidden` 字段、`EndpointField.rightSlot`、`SearchableModelPicker`、`hasCustomModelMapping`、1M 全选（`allOneMEnabled`/`someOneMEnabled` 及 JSX）、兜底模型直达区、模型徽章、双官网链接、跨应用导入接线（`ProviderForm`/三个 ProviderForm 变体）、4 个 locale 的 fork 键段（按 key 逐个比对，`devpanel`、`connectivityTest`/`connectivityCheck`、`searchModels`/`noModelsFound` 等全部在位）。
- 落地保真核对（33 个上游/fork 重叠文件，A12，实测数字）：把每个文件按行归一化（去缩进、去尾逗号）后比较三份 tree 的行集合——「上游 v4.0.8→v4.0.9 新增的行」必须在最终文件里出现，「fork v4.0.8→同步前 main 新增的行」必须在最终文件里出现。结果：上游新增行缺失共 19 行、fork 新增行缺失共 10 行，其余 26 个重叠文件两侧都为 0（含 `src-tauri/src/{lib,settings,tray}.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/proxy/providers/claude.rs`、`EditProviderDialog.tsx`、`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`shared/EndpointField.tsx`、`shared/index.ts`、8 个 `src/config/*ProviderPresets.ts`、3 个测试文件）。缺失行逐条归类如下，全部是刻意取舍或跟随上游删除，不是丢语义：
  1. `README.md` 4 行：上游 `233310d7` 往赞助商表加的 `<tr>`/`</tr>` 与两行 OpenModel 赞助文案。fork README 是「只记录与上游差别」的重写版、整表不存在，白名单整文件保留 fork 侧。
  2. 4 个版本与锁文件各 1 行：上游写 `4.0.9`，最终取 fork 的 `4.0.9-1`；同时 fork 重放前的 `4.0.8-1` 行按预期被替换。
  3. `ClaudeFormFields.tsx` 上游缺失 11 行：上游高级选项 `apiFormatField` 整段的骨架行（`const apiFormatLabel = t(...)`、`<FormLabel htmlFor="apiFormat">{apiFormatLabel}</FormLabel>`、该段的 `<div className="flex items-center gap-0.5">` 与 `<HelpTip title={apiFormatLabel}>` 外壳、`{category !== "cloud_provider" &&` / `!isCodexOauthPreset && (` 门控、`{/* 上游格式选择（仅非云服务商显示；xAI、Codex 托管账号卡的格式由后端固定） */}` 与 `{/* Base URL 输入框；Codex / xAI 托管账号卡的上游地址由后端固定，不显示 */}` 注释、`{/* 高级区只有 UA 和请求覆盖；Copilot 的转发会跳过这两项，整块不显示 */}` 注释的旧措辞）以及 `hasAnyAdvancedValue` 里上游新增的 `(!isXaiOauthPreset && !isCodexOauthPreset && apiFormat !== "anthropic") ||`。前者由 fork 的 `EndpointField.rightSlot` 位置取代，段内 `providerForm.apiFormatHelp` 文案与 `DirectModeFormatWarning` 已在 fork 位置逐字渲染；后者按 fork 既有的 `hasCustomModelMapping` 口径删除。
  4. `ClaudeFormFields.tsx` fork 缺失 2 行：`category !== "cloud_provider" && !isXaiOauthPreset ? (`（外层门控已排除 xAI 托管卡，重写为 `category !== "cloud_provider" ? (`，判定等价）与 `<p className="text-xs text-muted-foreground">`（其承载的 `providerForm.fallbackModelHint` 键被上游 v4.0.9 删除，段落改由上游的模式感知 HelpTip 与缺失告警取代）。
  5. 4 个 locale 的 `advancedOptionsHint` 各 1 行：该键由上游 v4.0.9 删除（说明改为 HelpTip 承载），fork 早先对措辞的改写随之失去宿主键，按上游删除处理，不复活。
  - fork 删除的行（旧 stream_check 链路、`tauri_plugin_updater` 依赖与插件注册、`installUpdateAndRestart`）未被上游带回，`Cargo.lock` 与 `src-tauri/src/lib.rs` 的 updater 命中数均为 0。
  - 附带事实（不算 fork 语义丢失）：上游 v4.0.9 自身删除了 `advancedOptionsHint`、`apiFormatHint`、`fallbackModelHint`、`stackLayout.advancedHint` 与 38 个 fork 从 v4.0.8 继承的 `codexConfig.*`/`claudeDesktop.*` 旧说明键，最终树跟随上游删除；对应文案改由 HelpTip 键承载。4 个 locale 的 JSON 均可解析，fork 键段按 key 逐个比对全部在位（`devpanel` 仍只存在于 zh / en，属 fork 既有状态）。
- 全树冲突标记：`git grep -I -n "^<<<<<<< \|^>>>>>>> "` 在工作树与 HEAD 均 0 命中。重放中途未跑 `cargo test`，编译校验只在 rebase 完成后执行。
- 本轮检查实测结果：`pnpm typecheck` 通过；`pnpm test:unit` 221 个文件 / 2718 个用例全部通过；`cargo check` 通过（并确认 `Cargo.lock` 未被额外改写）；`cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 退出码 0，17 个测试二进制 / 3794 个用例通过、0 失败。
- 同步提交（`chore: sync fork with upstream v4.0.9`）：版本号四处 + `Cargo.lock` 联动、`ClaudeFormFields.tsx` 最终态修正、docs/HOW_TO_REBASE_UPSTREAM.md 条目修订、本 change 产物（brief / spec / comet-state）。
- 归档提交（`chore(native): archive sync-upstream-v409`）：change 目录移入 `docs/comet/archive/<date>-sync-upstream-v409`、全局规格 `docs/comet/specs/upstream-sync/spec.md` 更新为本文件的同步后状态。

### 同步范围

- 上游新增提交：merge-base df40d53c → 8845b1ef（v4.0.9 tag），共 35 个提交、94 个文件、约 +6193/−1420 行，覆盖 v4.0.9 全部发布内容：
  - 赞助商预设批量新增（8 个提交）：`5b708ebd` SoruxGPT、`fec99c56` IKunCode 预设与 SoruxGPT/IKunCode 图标、`d25e8d54` RunToken、`233310d7` OpenModel（跨十个应用 + `assets/partners/logos/openmodel-banner.jpg` + 四语 README 赞助位）、`89add5de` Grok Build 的 SoruxGPT/IKunCode/RunToken、`886915a7` BotCF、`c4770472` YYLX、`b17250a3` TokenFlux。文件：8 个 `src/config/*ProviderPresets.ts`（`claudeDesktop` +120、`codex` +112、`gemini` +111、`grokBuild` +84、`hermes` +232、`openclaw` +372、`opencode` +288、`pi` +148，均为纯新增）、`src/config/presetSearchAliases.ts`、`src/icons/extracted/{index,metadata}.ts` 与 5 张图标 jpg、`src/config/claudeProviderPresets.ts`。
  - `f88068b9` fix(proxy) #7878：客户端与代理不在同一网络栈时（如 WSL2 NAT），写给客户端的代理主机可与监听地址分开。`src-tauri/src/settings.rs`（+23，`AppSettings.proxy_client_host` + `get/set_proxy_client_host` 纯函数）、`src-tauri/src/commands/settings.rs`（+15，两个命令与 `merge_settings_for_save` 的 `proxy_client_host` 透传保护 + 该保护单测）、`src-tauri/src/lib.rs`（+2 命令注册）、`src-tauri/src/tray.rs`（`get_proxy_listen_sync` → `get_proxy_client_endpoint_sync` 1 行）、`src-tauri/src/{database/dao/proxy,services/proxy,commands/proxy}.rs`、`src/lib/api/proxy.ts`（+10）、`src/lib/query/proxy.ts`（+35）、`src/components/settings/sections/RoutingSection.tsx`、`docs/user-manual/{en,ja,zh}/4-proxy/4.1-service.md`。
  - `6e7811e5` fix(proxy)：OpenAI 格式的 Claude 上游改发 `Bearer` 并合并 stack 切换。`src-tauri/src/proxy/providers/claude.rs`（+60）、`src/components/providers/forms/ClaudeFormFields.tsx`、`src/components/providers/forms/ClaudeStackModelsField.tsx` 与新增 `tests/components/ClaudeStackModelsField.test.tsx`（+66）。
  - `9055dd37` fix(proxy) #8136：不再把未匹配的工具结果以 `role=tool` 发给 Chat 上游（`src-tauri/src/proxy/providers/transform_codex_chat.rs`）。
  - `2b0ec81b` fix(codex)：为 xAI 原生 Responses 重写缺少 `call_id` 的工具输出（`src-tauri/src/proxy/providers/transform_codex_responses_xai_sanitize.rs`）。
  - `2ff37a76` feat(codex)：sub-agent 默认模型与推理强度。`src/components/providers/forms/hooks/useCodexConfigState.ts`、`CodexConfigSections.tsx`、`CodexFormFields.tsx`、`ProviderForm.tsx`（`subagentModel`/`subagentReasoningEffort` props 接线）、`src/utils/providerConfigUtils.ts`（+106）、`tests/components/CodexFormFields.subagent.test.tsx`（+201）、`tests/utils/providerConfigUtils.codex.test.ts`（+89）、`src-tauri/src/{claude_desktop_config,services/provider/codex_direct,mode/controller}.rs`。
  - `644b7d5c` feat(forms)：模型选择器展示模型参数并静默回填 picks。`src/hooks/useModelMetadataFill.ts`（+16/−）、`src/components/providers/forms/FetchedModelPicker.tsx`、`ClaudeFormFields.tsx`、`PiProviderForm.tsx`（调用形态改为 `{ baseUrl: rowBaseUrl }`）、4 个 locales、`tests/hooks/useModelMetadataFill.test.tsx`、`tests/components/PiProviderForm` 相关断言。
  - `f7244745` feat(forms)：取到的模型改在可删除的对话框里挑选。`FetchedModelPicker.tsx`、4 个 locales。
  - `8347e1ab` refactor(forms)：去掉打开模型选择器时的取数量 toast。
  - `1afa90af` fix(forms)：思考等级选择器与模型列表行对齐。
  - `ac2eebc0` revert(forms)：撤掉 Codex 主推理强度选择器。
  - `28ee933c` refactor(claude-desktop)：用平实语言解释模型模式。`src/components/providers/forms/ClaudeDesktopProviderForm.tsx`（+4/−9）、4 个 locales。
  - `1e045d2e` refactor(forms)：完整 URL 开关移入高级选项。新增 `src/components/providers/forms/shared/FullUrlToggle.tsx`；`shared/EndpointField.tsx` 删除 `showFullUrlToggle`/`isFullUrl`/`onFullUrlChange`/`fullUrlHint` 四个 props 与内联开关，新增 `help` props（+10/−46）；`shared/index.ts` 新增导出。
  - `56731456` refactor(forms)：旧版供应商字段提示缩短。`GrokBuildProviderForm.tsx`（`inactiveFieldsHint` 去掉 `count` 参数）、4 个 locales。
  - `f59bba54` refactor(forms)：Claude 表单说明移入 HelpTip。`ClaudeFormFields.tsx`、4 个 locales。
  - `e615a6f4` refactor(forms)：表单提示跟随应用实际模式。新增 `src/components/providers/forms/shared/DirectModeFormatWarning.tsx`（含 `DirectModeFormatNotice` 类型）、`ProviderForm.tsx` 的 `directModeFormatNotice` 计算与向 `ClaudeFormFields` 传递、`shared/index.ts` 导出、`tests/components/ProviderForm.modeHints.test.tsx`（+300）。
  - `84ca4f00` refactor(stack)：聚合布局说明移入 HelpTip。`ClaudeFormFields.tsx`、`ClaudeStackModelsField.tsx`。
  - `36e2ce2c` refactor(codex)：字段说明移入 HelpTip。`CodexFormFields.tsx`、`shared/EndpointField.tsx`。
  - `9f7ac1fa` refactor(codex)：模型列表首行即默认模型；`0dae89e2` refactor(codex)：模型列表移出高级选项；`4f08989a` refactor(stack)：默认模型改用 HelpTip 而非星号。
  - `29998ed9` fix(i18n)：冷启动应用已保存语言。`src/i18n/index.ts`（+33/−）、`src/main.tsx`（+10/−）、新增 `tests/i18n/syncLanguageFromSettings.test.ts`（+39）。
  - `40d19110` fix(macOS) #7213：`src-tauri/Info.plist` 新增 `NSLocalNetworkUsageDescription`（本地网络权限弹窗说明）。
  - `4cde722c` fix(providers) #8145：打开供应商编辑弹窗不再先闪 loading。`EditProviderDialog.tsx` 的 `isOpen={open && !waitingForEditorView}`、`tests/components/EditProviderDialog.test.tsx`（+43）。
  - `c69679a2` #8132 与 `5b78fc62`：flatpak 打包 flags 文档与无签名 key 时跳过更新器产物的说明（`flatpak/README.md`）。
  - `5e57b1ec` chore(release) v4.0.9：`CHANGELOG.md` 与四处版本号（`package.json`/`Cargo.toml`/`Cargo.lock`/`tauri.conf.json` 各 1 行）。
  - `8845b1ef` docs(release)：`docs/release-notes/v4.0.9-{zh,en,ja}.md`、`src/whats-new/4.0.9.json`（+19）、四语 README 赞助位。
- 不做部分 cherry-pick：同步范围是 v4.0.8..v4.0.9 的全量新增提交，一次 rebase 完成。
- 上游本轮改动的 `docs/user-manual/**` 仅 `4-proxy/4.1-service.md` 三语；`docs/guides/**` 未更新。

### 冲突解决（遵循 docs/HOW_TO_REBASE_UPSTREAM.md §3）

- 本轮重叠面为 33 个文件（上游 v4.0.8..v4.0.9 与 fork v4.0.8..main 同时改动）：4 个版本与锁文件（`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.lock`）、`README.md`、5 个后端文件（`src-tauri/src/lib.rs`、`src-tauri/src/settings.rs`、`src-tauri/src/tray.rs`、`src-tauri/src/commands/settings.rs`、`src-tauri/src/proxy/providers/claude.rs`）、8 个前端文件（`src/components/providers/EditProviderDialog.tsx`、`forms/ClaudeFormFields.tsx`、`forms/ProviderForm.tsx`、`forms/ClaudeDesktopProviderForm.tsx`、`forms/PiProviderForm.tsx`、`forms/GrokBuildProviderForm.tsx`、`forms/shared/EndpointField.tsx`、`forms/shared/index.ts`）、8 个预设配置文件（`claudeDesktop`/`codex`/`gemini`/`grokBuild`/`hermes`/`openclaw`/`opencode`/`pi` 的 `*ProviderPresets.ts`，fork 侧各 +2 即预设接口的 `hidden?: boolean` 字段）、4 个 i18n locales、3 个测试文件（`tests/components/{EditProviderDialog,GrokBuildProviderForm,ProviderPresetSelector}.test.tsx`）。`pnpm-lock.yaml` 本轮不在上游改动集内（上游 v4.0.9 未动该文件），fork 侧移除 `@tauri-apps/plugin-updater` 的状态原样保留，无冲突。
- 上游本轮改动、fork 侧未触碰的 61 个文件直接落上游版本，其中关键项：`src-tauri/Info.plist`、`src/i18n/index.ts`、`src/main.tsx`、`src/lib/api/proxy.ts`、`src/lib/query/proxy.ts`、`src-tauri/src/{services/proxy,commands/proxy,database/dao/proxy,mode/controller,claude_desktop_config}.rs`、`src/components/settings/sections/RoutingSection.tsx`、`src/components/providers/forms/{CodexFormFields,CodexConfigSections,FetchedModelPicker,ClaudeStackModelsField,CommonConfigEditor,CustomUserAgentField,GeminiConfigEditor,LocalProxyRequestOverridesField,OpenCodeFormFields}.tsx`、`forms/hooks/useCodexConfigState.ts`、`src/utils/providerConfigUtils.ts`、`src/hooks/useModelMetadataFill.ts`、`src/config/{claudeProviderPresets,presetSearchAliases}.ts`、`src/icons/extracted/{index,metadata}.ts` 与 5 张 jpg、`CHANGELOG.md`、`README_{DE,JA,ZH}.md`、`flatpak/README.md`、`docs/user-manual/*/4-proxy/4.1-service.md`、`docs/release-notes/v4.0.9-*`、`src/whats-new/4.0.9.json`、`tests/components/*` 与 `tests/{hooks,i18n,utils}/*` 的上游新增/改写用例。
- fork 专属白名单文件冲突时保留 fork 侧（rebase 中 fork 提交为 `--theirs`）：`vite.config.ts` / `vitest.config.ts` 的 `__CCS_FORK_BUILD__`、`src/config/forkBuild.ts`、`src/config/forkOfficialAllowlist.ts`、`src/config/forkPresetFilter.ts`、`src/components/devpanel/`、`src-tauri/tauri.windows.conf.json`、`src-tauri/tauri.dev.conf.json`、`src/vite-env.d.ts`、`tests/msw/tauriMocks.ts`、`tests/setupTests.ts` 的 forkBuild mock 段、连通性测试前后端与测试文件、模型快捷切换与双官网链接相关文件、跨应用导入相关文件、`.github/workflows/ci.yml` / `release.yml`、`src-tauri/capabilities/default.json`、`README.md`（上游本轮只加 OpenModel 赞助行，fork 重写版不含赞助商表，整文件保留 fork 侧）、`.comet/config.yaml`、`docs/superpowers/`、`docs/openspec/`、`docs/comet/`、`docs/HOW_TO_REBASE_UPSTREAM.md`、`.gitignore` 末尾 fork 工具产物段。
- `CHANGELOG.md`：fork 在 v4.0.8..main 区间未改过该文件，取上游 v4.0.9 版本落地。
- 共享文件以上游 v4.0.9 版本为基础，叠加回 fork 必要语义：
  - `src-tauri/src/lib.rs`：以上游 `commands::get_proxy_client_host` + `commands::set_proxy_client_host` 两行注册为基础；叠加并保持 fork 三段语义——移除 Updater 插件注册段、托盘左键单击切换主窗口（`show_menu_on_left_click(false)` + `TrayIconEvent::Click` 左键 Up 分支调 `tray::toggle_main_window`）、connectivity_test 命令注册（`commands::connectivity_test_provider_models` + `commands::connectivity_probe_provider`）。解决后必须 grep 确认 `tauri_plugin_updater` / `updater_builder` 命中数为 0。
  - `src-tauri/src/settings.rs`：以上游 `AppSettings.proxy_client_host` 字段段（含「本地路由（设备级）」注释）、`Default` 中的 `proxy_client_host: None` 与 `get_proxy_client_host()`/`set_proxy_client_host()` 两个函数为基础；叠加 fork 的 `VisibleSidebarPanels` 结构与 `AppSettings.visible_sidebar_panels` 字段段。两段必须并存，不得整文件取一侧。
  - `src-tauri/src/commands/settings.rs`：以上游 `merge_settings_for_save` 的 `incoming.proxy_client_host = existing.proxy_client_host.clone()` 透传保护与新增单测 `save_settings_should_keep_the_existing_proxy_client_host` 为基础；叠加 fork 移除的 `install_update_and_restart` 下载安装实现（命令接口留空壳，`tauri_plugin_updater::UpdaterExt` 导入与 `UpdateDownloadProgress` 事件结构不复活）。本文件是「取上游侧易带回 updater」的高危点，解完必须 grep `updater_builder`。
  - `src-tauri/src/tray.rs`：以上游 `collect_snapshots` 里 `get_proxy_listen_sync` → `get_proxy_client_endpoint_sync` 的 1 行改动为基础；叠加 fork 的 `toggle_main_window` 与左键单击切换分支（约 32 行）。两侧改动区域不同，预期可自动合并，但必须逐行复核 fork 分支未被带回成 `show_menu_on_left_click` 默认行为。
  - `src-tauri/src/proxy/providers/claude.rs`：以上游 +60 的 Bearer/stack 切换逻辑为基础；fork 侧只有两处测试 `Provider` 字面量里的 `website_url_2: None`，上游本轮未新增测试字面量，预期自动合并，解决后确认这两行仍在（否则 `cargo test` 编译失败）。
  - `src/components/providers/forms/shared/EndpointField.tsx`（本轮最高危叠加面）：以上游形态为基础——删除 `showFullUrlToggle`/`isFullUrl`/`onFullUrlChange`/`fullUrlHint` 四个 props 与内联 `Switch` + `Link2` 开关块，改为 `help?: string` props 并在字段名后渲染 `<HelpTip title={label}>`（去掉 `💡` 前缀），`hint` 直接渲染；同时保留 fork 的 `rightSlot?: ReactNode` props 与「`Input` + `rightSlot` 的 `flex flex-wrap items-center gap-2` 包裹层（`Input` 带 `min-w-0 flex-1`）」，即 fork 的 API 格式选择器仍贴在端点输入框右侧。导入取并集：`HelpTip`、`Zap`（上游）+ `ReactNode` 类型导入（fork），`Switch`/`Link2` 随上游删除。
  - `src/components/providers/forms/shared/index.ts`：上游新增 `DirectModeFormatWarning`、`FullUrlToggle` 两个值导出与 `DirectModeFormatNotice` 类型导出；叠加 fork 对 `SearchableModelPicker`（及 `SearchableModelMultiPicker`）的导出，取并集。
  - `src/components/providers/forms/ClaudeFormFields.tsx`：以上游 v4.0.9 的重构形态为基础（说明移入 HelpTip、完整 URL 开关移出本文件、`directModeFormatNotice` prop、取模型带 Header 覆盖延续、OpenAI 格式 Bearer 与 stack 切换合并、模型参数展示与静默回填、聚合布局说明 HelpTip）；叠加保持 fork 五段语义——兜底模型直达区 `fallbackQuickAccessSection`（仅经典布局渲染）、`hasCustomModelMapping` 计算与 `hasAnyAdvancedValue` 收窄、`SearchableModelPicker` 对 `ModelDropdown` 的替换、API 格式选择器随端点输入框（经 `EndpointField.rightSlot`）、1M 全选。上游在本文件净增 +222/−148、fork 侧为 +262/−214，两侧 JSX 必须整块拼接后核对括号平衡，禁止按行去重；导入块取并集。
  - `src/components/providers/forms/ProviderForm.tsx`：以上游 `DirectModeFormatNotice` 类型导入、`directModeFormatNotice` 计算（按 `appModeView?.mode === "direct"` 与实际 `directProviderId` 判定 `inUse`/`switch`）、Codex sub-agent 两个 state 与 `subagentModel`/`subagentReasoningEffort` props 接线及 `ClaudeFormFields` 的 `directModeFormatNotice` 传递为基础；叠加 fork 的跨应用导入接线（`ProviderImportEntry` + `useProviderImportApply`/`useProviderImportSources`，编辑与新建两条同步路径）与 `ProviderPresetSelector.extraActions` 插槽。
  - `src/components/providers/forms/ClaudeDesktopProviderForm.tsx`：以上游 `28ee933c` 的平实语言文案改造（+4/−9）为基础；叠加 fork 的跨应用导入接线、双官网链接字段与官方预设过滤接线（fork 侧 +74/−5）。
  - `src/components/providers/forms/PiProviderForm.tsx`：以上游 `644b7d5c` 的调用形态改动（`rowBaseUrl` → `{ baseUrl: rowBaseUrl }`）为基础；叠加 fork 的导入接线、双官网链接与预设过滤（fork 侧 +56/−38）。
  - `src/components/providers/forms/GrokBuildProviderForm.tsx`：以上游 `56731456` 的 `inactiveFieldsHint` 去 `count` 参数改动为基础；叠加 fork 的导入接线、双官网链接与预设过滤（fork 侧 +70/−5）。
  - `src/components/providers/EditProviderDialog.tsx`：以上游 `isOpen={open && !waitingForEditorView}`（含两行注释）为基础；叠加 fork 的 `websiteUrl2` 两处读写（初始值映射与提交值 trim 透传）。
  - 8 个 `src/config/*ProviderPresets.ts`：上游各文件为纯新增预设条目（+84..+372）；叠加保持 fork 在预设接口上的 `hidden?: boolean` 字段段（每个文件 +2）。合并结果必须同时含上游全部新预设条目与 fork 的 `hidden` 字段；上游新预设是否可见由 `forkOfficialAllowlist` 决定，不改白名单、不手工放开。
  - 4 个 i18n locales（zh / en / ja / zh-TW）：上游本轮各文件 +68/−62，集中在把表单说明改为 HelpTip 文案、`inactiveFieldsHint` 改写、完整 URL 开关移入高级选项的新键、赞助商预设搜索别名与 `directModeFormat` 相关键——按上游执行新增与改写；保留 fork 的 `devpanel` 段（只存在于 zh / en）与 `connectivityTest` / `connectivityCheck`、模型快捷切换、双官网链接、跨应用导入等 fork 键段，合并后 fork 键不得缺失，也不得为「补齐」而给 ja / zh-TW 手工添加 fork 既有的 `devpanel` 段。
  - 3 个测试文件：`tests/components/EditProviderDialog.test.tsx` 以上游 +43 的新用例与结构为基础，叠加 fork 的 47 行 fork 用例；`tests/components/GrokBuildProviderForm.test.tsx` 以上游 +10/−8 改动为基础，叠加 fork 的 20 行导入/双链接用例；`tests/components/ProviderPresetSelector.test.tsx` 以上游把 Claude 可见预设行数断言从 74 改为 81 为基础，叠加 fork 的 33 行 `extraActions`/预设过滤用例。
  - 4 个版本与锁文件：`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 上游本轮各只改版本号一行，取 fork 版本号 `4.0.9-1`（只取版本号值，保留 git 已合并的上游其余内容，不对整文件 `--theirs`）。`package.json` 另保留 fork 的 `dev:fork` script 与移除的 `@tauri-apps/plugin-updater` 依赖；`Cargo.lock` 的 `cc-switch` 包版本号取 fork 值。收尾用 `cargo check` 复验：报告锁文件未被改写，才算与 `Cargo.toml` 一致。
- 本轮 fork 侧未改动的共享文件随上游与重放自然落地，fork 语义保持既有状态。

### 数据库 schema 状态

- `src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 21（上游 v4.0.9 仍为 20，且 `database/{mod,schema,tests}.rs` 三个文件都不在上游本轮改动集内）。
- 迁移链：v18→v19 同时保留上游 mcode 迁移与 fork `website_url_2`；v19→v20 取上游（`mcp_servers.enabled_pi`）；fork 专属 v20→v21 幂等修复迁移补齐 `mcp_servers.enabled_mcode`/`enabled_pi` 与 `skills.enabled_mcode`，必须原样保留。
- 本轮不新增迁移步骤。后续上游推进时取「上游新版本与 fork 21 的较大者」并叠加双方迁移步骤。

### `.comet/config.yaml` 保护

- 历史提交重放可能把 fork 专属的 `.comet/config.yaml` 改回旧内容（曾导致只启用 classic、Native hook 拒绝所有写入）。
- 重放涉及该文件时、以及 rebase 完成后，核对 `default_workflow: native` 与 `workflows` 含 native 与 classic；被改写时 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复 rebase 前版本（同步前 blob 为 `cebdcda66dbdcfde8b8de9331650753fb138b223`）。

### 已知流程坑位（项目记忆）

- current 工作区 rebase 检出新基线瞬间，工作树短暂缺少关联规格文件，Runtime 可能判定退回 Shape（'Native target specification declarations changed' / 'Native Shape artifacts changed'）；按 Runtime 返回的恢复命令处理，必要时先回 main 重新 prepare/confirm 同一 Shape 再继续；change 自身 specs/ 的实施事实更新（重放映射）在 handoff 提交前完成并接受最后一次确认。
- Shape 确认后编辑 brief 或 spec 会触发 Native Shape recovery：用同一个 summary 重新执行 prepare-shape-confirmation，再 `--confirmed` 回到 Build，然后原样重交 builder-handoff（candidateId 不变，Runtime 检查回执仍有效）。`acceptance_review.status` 合法值是 `implemented-with-evidence` 且 evidence 必须非空。
- 长重放中 git commit 偶发段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- `git checkout --ours/--theirs` 在 rebase 中方向与 merge 相反：`--ours` 是新基线，`--theirs` 是正在重放的 fork 提交。
- Builder 交接的检查计划字段须用 Runtime 形态 `{id,name,executable,argv,cwdRef,timeoutMs,repeatable}`；`executable` 只写程序名，不要把程序名同时塞进 `argv[0]`。
- 重放中途不能跑 `cargo test`：fork 历史提交自身带未清理冲突标记（上一轮实测为 `SettingsPage.tsx`、4 个 locales、`ProviderList.test.tsx`，由后续 fork 提交清掉），只有最终态才可编译校验；最终态必须 `git grep -I -n "^<<<<<<< \|^>>>>>>> "` 零命中。
- 合并两侧 JSX 禁止按行去重，必须整块拼接后核对括号平衡。
- fork 发版 tag 推送事件偶发丢失：推送后若 Actions 零排程，先取证（`git ls-remote`、`/actions/permissions`、workflows state、releases 资产数、check-suites、events），确认后删远端 tag 重推同一本地对象补触发；`release.yml` 的 concurrency 组 `cancel-in-progress: true`，不要连续并发重推。
- 时间敏感用例：`tests/components/SessionManagerPage.test.tsx > switches to all apps and to time buckets` 的 fixture 用 `now - 30min/1h/3h/4h/5h` 构造却断言存在「今天」分桶，本地时间落在 00:00–00:30 时必然失败。同步过程中跨越该窗口时，遇到这一项失败先查时钟窗口再查实现，不据此改动上游文件或放宽 A9。

### 版本号

- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`：`4.0.9-1`（同步前工作树为 4.0.8-1，重放过程途经历史版本号）。
- 语义：上游版本号 + `-N`，`N` 为同一上游版本上的 fork 构建代数；上游 4.0.9 的第一代 fork 构建取 `-1`。

### 交付（上传）

- 交付不是本轮验收项，而是验收通过并生成归档提交之后执行的步骤（原因：tag 必须指向归档提交，Verify 时该提交尚不存在）。交付范围由 Q1 明确授权（2026-10-12 用户选择 A），执行后把实际结果回报给用户。
- 全部验收项通过且用户接受验收结果后：`git push --force-with-lease origin main`（不使用 `--force`；远端被他人更新时拒绝推送并报告）。
- 随后在归档提交上创建 annotated tag `v4.0.9-1` 并 `git push origin v4.0.9-1`；tag 推送触发 fork Release CI（windows-2022 + macos-14，unsigned）构建并发布 GitHub Release 安装包。执行后把 `main`/`origin/main` 一致性、tag 指向与 Release CI 运行结果回报给用户。
- 不创建 PR，不同步其他分支或远端，不推送 `v4.0.9..upstream/main` 的 post-release 内容。

### 工作区未提交改动

- 同步前工作区干净（本 change 未跟踪产物除外）；change 产物随同步提交与归档提交进入历史。
- 验收不要求工作区在验收当下为空：`comet-state.yaml` 与 `verification.md` 是 Runtime 每轮验收都会改写或删除的流程状态文件，它们在归档时随最终状态一并提交。

### fork 魔改保留清单（同步后必须仍然存在且可用）

- 产品名 "CC Switch"（窗口标题、`__CCS_FORK_BUILD__` 常量、DevPanel 及其 CCS_DEV_PANEL 门控）。
- 侧边栏面板可见性设置（含 prompts 面板、pill toggles、批量检测开关、后端 `AppSettings.visible_sidebar_panels` 持久化）——本轮与上游新增的 `proxy_client_host` 字段同处 `src-tauri/src/settings.rs`，两段必须并存。
- 供应商卡片模型徽章与快捷切换弹窗（含 Haiku 显示名同步、仅翻转 1M、获取模型列表成功后自动展开、徽章作为快捷切换入口）。
- Claude 兜底模型直达区与快捷设置按钮对齐（本轮与上游 HelpTip 化、完整 URL 开关外移、`directModeFormatNotice`、Bearer/stack 合并同处一个文件，合并后 `hasCustomModelMapping` 与直达区逻辑必须保留）。
- 供应商右键置顶/置底、新建供应商插入第二位。
- 官方预设过滤（forkOfficialAllowlist + forkPresetFilter + 8 个预设文件的 `hidden` 字段 + 表单接线）——上游本轮新增的 SoruxGPT/IKunCode/RunToken/OpenModel/BotCF/YYLX/TokenFlux 预设因此在 fork 构建下不可见，属预期结果，不得为此改动白名单或过滤逻辑。
- 逐模型连通性测试（后端 reqwest+SSE 直连执行器、Tauri 命令、持久化、"搜索添加"选择器、按供应商 API 格式对齐真实转发链路、供应商列表徽标、四语言文案、旧 stream_check 链路已移除仅保留表结构）。
- 供应商双官网链接（主页横排双链接、表单双字段横排、`website_url_2` 列与 v18→v19 迁移；本轮 `EditProviderDialog.tsx` 与 `proxy/providers/claude.rs` 的 `websiteUrl2`/`website_url_2` 语义都要保留）。
- 托盘图标左键单击切换主窗口显示/隐藏（本轮同文件上游改了端口口径，两侧并存）。
- 从其他已启用应用导入供应商配置（`ProviderForm.tsx`、`ClaudeDesktopProviderForm.tsx`、`PiProviderForm.tsx`、`GrokBuildProviderForm.tsx`、`McodeProviderForm.tsx` 与 `ProviderPresetSelector.extraActions`）。
- 禁用应用内更新器（About 指向 tunecc/cc-switch Releases、启动自检取消、`updater:default` 权限移除、后端无 updater 插件注册、`install_update_and_restart` 不执行安装）。
- 上游 tag 的发版构建跳过（fork CI 裁剪：仅 Windows x64 与 macOS arm64 unsigned）。
- README fork 差异说明与构建说明。

### 白名单文档更新

- `docs/HOW_TO_REBASE_UPSTREAM.md` §4 表格补充本次同步后新增的 fork 专属文件（如有）。
- 共享文件表中与本次上游改动相关的叠加语义按需修订：`src-tauri/src/lib.rs`（上游 `get/set_proxy_client_host` 注册 + fork 三段语义）、`src-tauri/src/settings.rs`（上游 `proxy_client_host` + fork `VisibleSidebarPanels`）、`src-tauri/src/commands/settings.rs`（上游透传保护与单测 + fork updater 移除）、`src-tauri/src/tray.rs`（上游 `get_proxy_client_endpoint_sync` + fork 左键切换）、`src-tauri/src/proxy/providers/claude.rs`（上游 Bearer/stack 合并 + fork `website_url_2: None`）、`src/components/providers/forms/shared/EndpointField.tsx`（上游 `help`/HelpTip 与删掉的四个 full-URL props + fork `rightSlot`）、`shared/index.ts`（上游两个新导出 + fork 选择器导出）、`src/components/providers/forms/ClaudeFormFields.tsx`（本轮大面重构 + fork 五段语义）、`src/components/providers/forms/ProviderForm.tsx`（上游 `directModeFormatNotice` + sub-agent 接线 + fork 导入接线与插槽）、`ClaudeDesktopProviderForm.tsx` / `PiProviderForm.tsx` / `GrokBuildProviderForm.tsx`（上游文案与调用形态改动 + fork 三段接线）、`src/config/*ProviderPresets.ts` ×8（上游赞助商预设 + fork `hidden` 字段与白名单默认拒绝）、4 个 locales（上游 HelpTip 化文案 + fork 键段）、`src/components/providers/EditProviderDialog.tsx` 与其测试（上游 loading 闪屏修复 + fork `websiteUrl2` 与用例）、`package.json` / `Cargo.toml` / `tauri.conf.json` / `Cargo.lock`（上游 4.0.9 + fork `4.0.9-1`）。
- 本轮无新增 fork 专属文件时，在文档中不虚构条目，仅在确有新增时补充。

### 构建与测试（文档 §2 要求）

- `pnpm typecheck` 通过。
- `pnpm test:unit`（vitest）通过，含上游本轮新增/改写用例（`ProviderForm.modeHints`、`CodexFormFields.subagent`、`ClaudeStackModelsField`、`syncLanguageFromSettings`、`providerConfigUtils.codex`、`ProviderPresetSelector` 的 81 行断言）与 fork 既有用例。
- `cargo check` 通过。
- `cargo test` 通过 —— 已知环境性例外：上游自带测试 `update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 应用运行时会因代理默认端口 15721 被占用而失败（上游测试设计如此，需绑定真实端口）。沿用既有例外；验收检查以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行（显式跳过并记录原因），其余全部测试必须通过，含上游新增的 `save_settings_should_keep_the_existing_proxy_client_host`。

## 非目标

- 不改任何上游共享代码的行为（除必要的 fork 改动叠加）。
- 不新增功能。
- 不同步 upstream 其他分支，也不把 `v4.0.9..upstream/main` 的 6 个 post-release 提交纳入本轮基线。
- 不做部分 cherry-pick 式同步。
- 不清理本地遗留分支与历史 tag。
- 不改动 fork 的数据库迁移链（除保留既有 v20→v21 修复迁移）。
- 不创建 PR；origin 是 fork 私有仓库，只按 Q1 授权推送 main 与 tag。
- 不复活 fork 已删除的上游能力（应用内更新器、`updater:default` 权限、旧 stream_check 链路）。
- 不放开 fork 预设白名单以显示上游新增赞助商预设。
- 不引入上游 Linux flatpak/deb/rpm 发布链路（fork 只构建 Windows x64 + macOS arm64 unsigned）。

## 错误与边界

- rebase 中断/失败：`git rebase --abort` 回到起点（同步前 main = `cc6e7870`，安全分支 `pre-sync-v409` 同指），工作区恢复原状。
- 长重放中 git commit 段错误（signal 11）：先核对 `.git/rebase-merge` 状态与提交是否实际已落盘，再决定 continue 或重放，防止同题重复提交。
- 不确定的冲突：不盲目 `--continue`，先 `git status` / `git diff` 复核；无法安全判定时暂停并记录，不猜测语义。
- `.comet/config.yaml` 被历史重放改写时，从 ORIG_HEAD 恢复并核对 native 启用状态；不得让 Native 工作流在 classic-only 配置下继续。
- `EndpointField.tsx` / `ClaudeFormFields.tsx` / `shared/index.ts` / 4 个 locales / `commands/settings.rs` 若出现「整文件取一侧」的省事解法，即视为丢语义缺陷：前两者会丢 fork 的 `rightSlot`/兜底直达区/搜索选择器/1M 全选，locales 会丢 fork 键段，`commands/settings.rs` 与 `lib.rs` 会带回 updater 链路。
- 推送只用 `--force-with-lease`，不用 `--force`；远端被他人更新时拒绝推送并报告，不改用 `--force`。
- tag 推送会触发公开发布流水线：只在验收通过、用户接受结果并按 Q1 明确授权后执行；tag 名或指向错误时先删除远端 tag 前必须征得用户同意。
- `cargo test` 例外用例只在代理端口 15721 被本机 cc-switch 占用时跳过；若出现其他失败，按真实缺陷处理，不扩大跳过列表。
