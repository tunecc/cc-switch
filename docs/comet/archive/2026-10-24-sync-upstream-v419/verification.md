---
generated_from_state_version: 11
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 2
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-10-24T03:11:18.742Z
- 摘要: 独立验收 24/24 全部通过。六个 Runtime check 均绑定 candidateId 3efd5f7bf2975a90896c885a6e09d5ae4c8438c55a0a8afd2d07062a7176e40e、exit 0 且 inputBefore=inputAfter；另行复核 git 重放映射、四 ref 保真、locale、schema 23、Kimi Q1–Q3 与 fork 保留项，未发现失败或阻塞项。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | A1: rebase 后 `git merge-base main v4.0.19` 等于 `d8983bb`（tag `v4.0.19` 剥离出的提交），`git log v4.0.19..main` 只包含 fork 提交（作者 `Tune`），不含任何上游提交。 | 独立复核：git merge-base main v4.0.19 = d8983bb10b82a1ccc15ae5f44ab070902623e990（tag v4.0.19 对象 319fbfd25ef243f3d3f7783b7a291b073309895d 的剥离提交）；git log --format='%an <%ae>' v4.0.19..HEAD \| sort -u 仅 Tune <176898395+tunecc@users.noreply.github.com>，不含上游作者提交。 |
| A2 | passed | brief.md | A2: 重放前 `git rev-list --count v4.0.18..pre-sync-v419` == 178；重放后 `git rev-list --count v4.0.19..HEAD` 与之的差异只来自「被 git 判定为空而丢弃」或「本轮新增提交」，逐条记录；`git log --format='%s' --reverse` 主题序列逐行 diff 为 0 行；patch-id 对照走 stdin（`git show <c> \| git patch-id --stable`），不同的提交逐个归类为「仅 hunk 位移」或「冲突停车」，冲突停车逐条记录归属与解法。 | v4.0.18..pre-sync-v419=178；v4.0.19..HEAD=181=178 重放+3 本轮新增（fc69fbc83/31dc62f48/6c15d6e31），无判空丢弃；178 条主题序列逐行 diff=0；stdin git patch-id 167 相同、11 不同，逐条为 10 处冲突停车（#2/#30/#43/#69/#74/#101/#117/#128/#137/#174）+1 处仅 hunk 位移（#72），归属与解法见 change spec 重放映射。 |
| A3 | passed | brief.md | A3: 47 个重叠文件的冲突解决符合 `docs/HOW_TO_REBASE_UPSTREAM.md` §3 与完整目标规格的逐文件叠加要求：两侧语义并存、无整文件取一侧（高危面为 `database/schema.rs`、`lib.rs`、`commands/misc.rs`、`services/provider/mod.rs`、`ProviderForm.tsx`、`ProviderCard.tsx`、`ProviderList.tsx`、`App.tsx`、4 个 locale、4 个版本与锁文件、`README.md`）。 | 抽查高危共享面均为两侧语义并存：schema.rs 的 AGY+Kimi 迁移臂、lib.rs 托盘四分支+Kimi 命令、commands/misc.rs KIMI_INSTALL_* 与 4 处 tunecc URL、services/provider/mod.rs Kimi 原生路径与 website_url_2、ProviderForm Kimi 早退+导入/entriesFor/websiteUrl2、ProviderCard 徽章/双链接/Kimi 额度、ProviderList 置顶置底+Kimi 分支、App.tsx 侧边面板+Kimi 列表；locale/版本/锁文件见 A4/A12/A15；冲突标记 0；README 为已逐行归因的整文件 fork 版本。 |
| A4 | passed | brief.md | A4: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的版本号均为 `4.0.19-1`；`src-tauri/src/database/mod.rs` 的 `SCHEMA_VERSION` == 23；迁移链：v18→v19（fork `website_url_2` + 上游 mcode 并存）、v19→v20（上游 pi）、v20→v21（fork 修复 mcode/pi + 上游 `enabled_agy`）、v21→v22（fork 幂等补 `enabled_agy` + 上游 `enabled_kimi` 合并为一步）、v22→v23（幂等补 `enabled_kimi`）全部在位；`create_tables` 的 `mcp_servers`/`skills` 含 `enabled_kimi`；上游迁移测试改到 23，新增 v22→v23 用例。 | 四处版本均为 4.0.19-1；database/mod.rs:54 SCHEMA_VERSION=23；schema.rs 迁移臂 v18→v19(:574)、v19→v20(:579)、v20→v21(:597)、v21→v22(:640 AGY+Kimi)、v22→v23(:662 Kimi 幂等) 全部在位；create_tables 两表含 enabled_kimi(:73,:106)；kimi/agy/fork_v21/fork_v22/upstream_v22 迁移用例在位并通过。 |
| A5 | passed | brief.md | A5: 完整目标规格「fork 魔改保留清单」每一项在同步后仍然存在且可用：产品名 CC Switch 与 DevPanel、侧边面板可见性、模型徽章与快捷切换（claude/codex/gemini/grokbuild）、Claude 兜底模型直达区与 1M 全选、右键置顶/置底与新建插入第二位、官方预设过滤（含 Q1 的 kimi 条目）、逐模型连通性测试（`lib.rs` 两个命令注册在位，且 Kimi 维持上游的测试入口关闭）、双官网链接、跨应用导入（含 Q2 的 Kimi 口径）、禁用应用内更新器、README fork 说明、fork CI。 | 逐项在位：productName=CC Switch、DevPanel、VisibleSidebarPanels；MODEL_CAPABLE_APPS 四 app+ModelQuickSwitchDialog；ClaudeFormFields 兜底直达区与一键全选 1M；ProviderList 右键置顶/置底、mutations.ts:120-149 新建 sortIndex=1；forkOfficialAllowlist.kimi 过滤；lib.rs:1789-1790 两个 connectivity 命令且 ProviderCard 对 kimi 关闭 onTest；ProviderCard 双官网 websiteLinks；providerImport Kimi 来源；updater 0 命中+空壳；README fork 说明；.github/workflows/ci.yml 在位。 |
| A6 | passed | brief.md | A6: rebase 后 `.comet/config.yaml` 仍为 fork 当前配置（`default_workflow: native`，`workflows` 含 native 与 classic），fork 专属白名单文件未被上游或重放改写。 | .comet/config.yaml 仍为 default_workflow: native、workflows: [native, classic]，pre-sync..HEAD 无 diff；forkOfficialAllowlist 相对 pre-sync 仅新增 kimi 四条目，其余 app 白名单未变；kimi 四值严格匹配。 |
| A7 | passed | brief.md | A7: `docs/HOW_TO_REBASE_UPSTREAM.md` 已按本轮同步结果修订（含 §4.6、`lib.rs`/`database/schema.rs`/`commands/misc.rs`/`ProviderCard.tsx`/`ProviderList.tsx` 等行的新口径与 kimi 白名单登记），全局与 change 内完整目标规格已重写为同步后的完整状态（含重放映射、冲突清单、落地保真核对与逐行归类），三处记录的数字与归属互相一致。 | HOW_TO §4 各行与新增 §4.6 已按本轮修订；全局与 change 内完整目标规格已重写；三处数字交叉一致：上游 47/215/+16010/−2351、重放 178（代码终态 180、文档提交后 181）、patch-id 11、保真 30/9（7/7 文件）、locale 52/8/3、schema 23；归因相加一致：上游 22+4+1+3=30，fork 4+1+3+1=9。 |
| A8 | passed | brief.md | A8: `pnpm typecheck` 通过（零 `TS2300`，AppId/`VisibleApps`/`forkOfficialAllowlist`/`APP_ICON_MAP` 的 kimi 字段无重复声明）。 | Runtime check typecheck exit 0（14.65s），绑定 candidateId 3efd5f7b… 且 inputBefore=inputAfter；无 TS2300，kimi 字段声明唯一。 |
| A9 | passed | brief.md | A9: `pnpm test:unit` 通过，含上游本轮新增/改写用例（`KimiProviderForm`、`KimiAccountLogin`、`KimiAccountQuotaFooter`、`KimiAddProviderDialog`、`RequestLogColumnsMenu`、`usageRange`、`ProviderCardActions`、`ProviderList`、`DeepLinkImportDialog`、`AppsPage`、`kimiProviderPresets`）与 fork 既有用例；时间敏感用例按既有 00:00–00:30 窗口口径处理。 | Runtime unit-tests exit 0：269 test files / 3477 tests passed；列出的 11 个上游新增/改写测试文件均存在并包含于运行集（KimiProviderForm/KimiAccountLogin/KimiAccountQuotaFooter/KimiAddProviderDialog/RequestLogColumnsMenu/usageRange/ProviderCardActions/ProviderList/DeepLinkImportDialog/AppsPage/kimiProviderPresets），fork 既有用例同批全绿。 |
| A10 | passed | brief.md | A10: `pnpm format:check` 通过（手工拼接共享文件后必须本地 prettier 归一化）。 | Runtime format-check exit 0（5.06s），Prettier 全部匹配。 |
| A11 | passed | brief.md | A11: `pnpm build:renderer` 通过。 | Runtime renderer-build exit 0（8.09s），仅既有 chunk size 警告，无构建错误。 |
| A12 | passed | brief.md | A12: `cargo check` 通过，并确认 `Cargo.lock` 的改动只来自 `cc-switch` 版本号行 `4.0.19-1`；`tauri-plugin-updater` 相关条目不得出现。 | Runtime cargo-check exit 0（0.96s）；Cargo.lock 相对 pre-sync 仅 cc-switch 版本行 4.0.18-1→4.0.19-1；tauri-plugin-updater 在 Cargo.toml/Cargo.lock 0 命中。 |
| A13 | passed | brief.md | A13: `cargo test` 通过（含 fork 的托盘左键源码护栏、上游 Kimi 迁移/持久化用例、`src-tauri/tests/kimi_commands.rs`）；如遇环境性失败，按规格固定口径取证并记录，不扩大跳过列表。 | Runtime cargo-test exit 0：4064 lib + 各集成目标合计 4267 passed / 0 failed / 11 ignored；tray::tests::tray_left_click_never_opens_the_menu ok；tests/kimi_commands.rs 8/8 passed；Kimi/AGY schema 迁移用例包含在内。 |
| A14 | passed | brief.md | A14: 落地保真核对通过：对 47 个重叠文件按固定四 ref 归一化行多重集算法（`v4.0.18`、`v4.0.19`、`pre-sync-v419`、最终 `HEAD`）逐文件计算「上游新增行缺失」与「fork 新增行缺失」，结果与逐行归类记录在规格中；计算在本轮全部最终态提交落完之后执行；确有意图取舍时逐行说明理由并带重数（`README.md` 的整文件 fork 版本、`4.0.19-1` 版本号行属已知取舍），未说明的非零缺失即视为丢语义缺陷。 | 独立重跑四 ref 归一化行多重集：上游新增行缺失 30 行/7 文件（README 22、4 个版本文件各 1、SCHEMA_VERSION 1、KimiProviderForm 3），fork 新增行缺失 9 行/7 文件（4 个版本各 1、SCHEMA 1、schema.rs 3、ProviderPresetSelector 1），与规格逐行归因一致；其余 208 个上游文件双侧缺失 0。 |
| A15 | passed | brief.md | A15: 4 个既有 locale JSON（`zh`、`en`、`ja`、`zh-TW`）逐文件可解析且按对象作用域统计无任何同名重复键，fork 键段按 key 逐个比对全部在位；上游本轮 52 个新键在 4 个 locale 全部在位且取值与 `v4.0.19` 逐字节一致；上游删除的 8 个键在 4 个 locale 均不再残留（fork 无引用）；fork 专属覆盖 `provider.connectivityCheck` 与 `settings.general.trayStyleHelp` 保持 fork 文案；`tr.json` 与 `git show v4.0.19:src/i18n/locales/tr.json` 逐字节一致（上游 `tr` 自身比 `en` 少 16 个新增键、少 1 个删除键，不补）。 | 四 locale 逐文件 JSON.parse 且对象作用域查重 dup=0；各自与 v4.0.19 对比：新增 52 键全部逐字一致、8 个删除键零残留、3 个改写键逐字一致；fork 键段在位；provider.connectivityCheck 与 settings.general.trayStyleHelp 仍为 fork 文案；tr.json cmp 逐字节一致（302194 bytes）。 |
| A16 | passed | brief.md | A16: `tauri_plugin_updater`/`updater_builder` 在全仓 `src-tauri` 命中数仍为 0；`tauri-plugin-updater` 未回到 `src-tauri/Cargo.toml` 依赖表；`createUpdaterArtifacts` 仍为 `false`；`install_update_and_restart` 仍为空壳。 | src-tauri 全仓 tauri_plugin_updater/updater_builder 0 命中；Cargo.toml 无 tauri-plugin-updater 依赖；createUpdaterArtifacts=false；commands/settings.rs install_update_and_restart 为返回 Ok(false) 的空壳。 |
| A17 | passed | brief.md | A17: 上游 Kimi 能力在 fork 落地后可用：12 个 `APP_IDS` 含 kimi、Apps 页可安装/打开 Kimi Code、Kimi 表单可用（官方账号登录 + 预设目录 + 模型表/拉取模型）、授权中心 Kimi 分组与额度、Kimi 会话/用量归属、MCP/Skills kimi 开关、`enabled_kimi` 持久化与迁移、上游新增测试全部通过；Kimi 官方卡不可复制/不可删、非官方卡无连通性测试入口（与上游一致）。 | APP_IDS 12 项含 kimi；AppsPage TOOL_NAMES 11 项含 kimi 且 KIMI_INSTALL_* 安装/升级链路在位；KimiProviderForm 提供官方账号登录、预设目录、模型表与拉取模型；AuthCenterPanel 挂 KimiAccountLogin + KimiAccountQuota；session_manager/providers/kimi.rs、session_usage_kimi、usage_stats 的 Kimi 归属在位；MCP/Skills 有 enabled_kimi；schema 迁移到 23；各项测试全绿；ProviderCard 官方卡 onDuplicate 关闭、presentation 对官方卡禁编辑/守卫删除、onTest 对 kimi 整体关闭（与上游一致）。 |
| A18 | passed | brief.md | A18: Q1 的 Kimi 预设白名单生效：`forkOfficialAllowlist.kimi` 严格等于 `["Kimi", "Kimi Global", "Kimi For Coding", "Kimi For Coding Global"]`；Kimi 表单的预设目录按名称过滤，官方账号卡 `Kimi Official`（id `kimi-official-account`）始终保留；目录预设 id 仍为 `String(原始数组下标)`，过滤不得改变编号；三条本机推理预设（`Ollama`/`LM Studio`/`vLLM`）以及赞助商/聚合站/`Meta Model API` 等未列入白名单的 Kimi 预设在 fork 构建的所有 Kimi 入口均不可见；其他 app 的白名单不变。 | forkOfficialAllowlist.kimi 严格等于四值数组；KimiProviderForm 先 map((preset,index)=>({id:String(index),preset})) 再按名称 filter，Kimi Official（kimi-official-account）独立置顶保留；Ollama/LM Studio/vLLM 及赞助商/聚合站/Meta Model API 等未列入白名单的 pi 派生预设在 fork 构建被过滤；allowlist 其他 app 条目相对 pre-sync 未变。 |
| A19 | passed | brief.md | A19: Q2 的跨应用导入口径生效：Kimi 仅作为导入来源——`readImportableProviderFields("kimi", …)` 读出 `provider.base_url`/`provider.api_key`，身份字段（名称/备注/官网）照常复制，`defaultModel` 为空且 `targetSupportsDefaultModel("kimi") === false`；`KimiProviderForm` 不渲染 `ProviderImportEntry`，Kimi 不作为导入目标；官方账号卡作为来源时连接字段为空、身份字段仍可复制；其余 11 个应用的导入行为不变。 | readConfigFields('kimi') 读 settingsConfig.provider.base_url/api_key，defaultModel 为空；readImportableProviderFields 始终复制 name/notes/websiteUrl；targetSupportsDefaultModel 白名单不含 kimi；KimiProviderForm 不渲染 ProviderImportEntry；kimiAccountPreset 使用 emptyKimiConfig（base_url/api_key 为空）；providerImport.ts 相对 pre-sync 仅 +kimi 分支，其他 11 app 导入逻辑未动。 |
| A20 | passed | brief.md | A20: Q3 的 Kimi 卡片模型口径生效：Kimi 不进入 fork 的 `MODEL_CAPABLE_APPS`/模型徽章/快捷切换弹窗，卡片维持上游「更多 → 设为默认」与表单模型表；4 个既有 app 的徽章与快捷切换行为不变。 | MODEL_CAPABLE_APPS 仍为 claude/codex/gemini/grokbuild（providerModelUtils.ts:21），测试精确断言四值；ProviderCard 徽章/快捷弹窗由 isModelCapableApp 门控，kimi 不进入；presentation 的 Kimi 分支保留上游「更多→设为默认」；providerModelUtils 相对 pre-sync 无改动，既有 4 app 行为不变。 |
| A21 | passed | brief.md | A21: **fork 左键契约的源码级回归护栏通过**：`src-tauri/src/tray.rs` 的 `tray_left_click_never_opens_the_menu` 用例在重放后仍成立（`apply_tray_style` 固定 `set_show_menu_on_left_click(false)`、`lib.rs` 的 builder 固定 `.show_menu_on_left_click(false)`），上游的 `native_menu_on_left_click` 辅助函数与其调用点在 fork 终态仍为零命中；`lib.rs` 的 `TrayIconEvent::Click` 分支保持 fork 四条分支语义；`tray.rs` 只新增 `AppType::Kimi => "Kimi Code"` 标签。 | Runtime cargo test 中 tray::tests::tray_left_click_never_opens_the_menu ok；tray.rs:2643 set_show_menu_on_left_click(false)，lib.rs:1242 .show_menu_on_left_click(false)；tray.rs 无 native_menu_on_left_click 函数或调用（仅注释与护栏断言字符串）；lib.rs Click 四分支语义在位；v4.0.19 对 tray.rs 的本轮增量为 AppType::Kimi 标签。 |
| A22 | passed | brief.md | A22: 上游用量页重构在 fork 落地后可用：`UsageDataSourcesSheet.tsx` 已删除且无引用，`UsageSettingsSheet`/`ChecklistMenu`/`RequestLogColumnsMenu`/`usageRange` 在位，用量页分页、趋势粒度、同步状态与新设置面板工作；8 个删除键无残留引用。 | UsageDataSourcesSheet.tsx 已不存在且 src/tests 无组件引用；UsageSettingsSheet/ChecklistMenu/RequestLogColumnsMenu/usageRange 在位；RequestLogTable 分页与越界 clamp、usageRange 的 7/14/30 日历日回退、syncStatus.syncing/tip 与新设置面板均已接线；8 个删除键在生产代码零引用（仅 UsageDashboard.test.tsx:602 用负断言确认 usage.tabs.settings 不再渲染）。 |
| A23 | passed | brief.md | A23: 上游本轮其余改动在 fork 落地后可用：Kimi 安装器（`KIMI_INSTALL_*`/npm 命令）、卡片更多菜单默认模型子菜单（OpenCode/OpenClaw）、Pi providerKey 常显与重复校验、BuyToken/V-API 赞助商预设与 locale、`providerPreset.loginWith.kimi`、`src/whats-new/4.0.19.json` 与 release notes。 | commands/misc.rs 有 KIMI_INSTALL_UNIX/WINDOWS_SCRIPT、npm @moonshot-ai/kimi-code 与 kimi upgrade；presentation/ProviderCardActions 实现 OpenCode/OpenClaw「更多→设为默认」默认模型子菜单；PiProviderForm providerKey 常显并有 required/duplicate 校验；BuyToken 8 app、V-API 9 app 预设及 endpointCandidates、locale partnerPromotion.buytoken/vapi、loginWith.kimi 四语在位；whats-new/4.0.19.json 与 docs/release-notes/v4.0.19-*.md 在位。 |
| A24 | passed | brief.md | A24: 冲突标记零命中：`git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md` 为 0（exit 1）。 | git grep -I -l -e '^<<<<<<<' -e '^>>>>>>> ' HEAD -- src src-tauri tests docs README.md 无输出，exit 1，冲突标记 0 命中。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| pnpm typecheck | typecheck | . | passed | 0 | 14650 ms |
| pnpm format:check | format:check | . | passed | 0 | 5062 ms |
| pnpm test:unit | test:unit | . | passed | 0 | 61518 ms |
| pnpm build:renderer | build:renderer | . | passed | 0 | 8094 ms |
| cargo check | check --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 964 ms |
| cargo test | test --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 44682 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm typecheck: passed — exit 0，无 TS2300（2026-10-24 复跑）
- pnpm format:check: passed — All matched files use Prettier code style!
- pnpm test:unit: passed — 269 test files / 3477 tests passed（53.68s）
- pnpm build:renderer: passed — ✓ built in 6.92s，仅既有 chunk size 警告
- cargo check: passed — Finished dev profile，0 错误
- cargo test: passed — lib 4064 passed/0 failed/11 ignored；集成 203 passed（含 kimi_commands 8）；合计 4267 passed/0 failed
- 已知限制: cargo test 的 11 个 ignored 用例为同步前既有的环境门控用例（真机 keychain/S3/性能语料等），本轮未新增跳过。
- 已知限制: README.md 保持 fork 整文件版本，刻意不采纳上游 v4.0.19 的 Kimi/赞助商表格行；已在保真核对中逐行归因。
- 已知限制: 落地保真核对在代码终态 31dc62f48 与当前 HEAD 6c15d6e31 复算结果一致（30/9），docs-only 提交不改动 215 个上游文件。
- 已知限制: tr.json 保持与上游 v4.0.19 逐字节一致；上游 tr 自身比 en 少 16 个新增键、少 1 个删除键，按上游口径不补。

## 阻塞项

_无。_

## 风险与跳过的工作

- A22 的 8 个删除键在生产代码零引用；UsageDashboard.test.tsx:602 仅以负断言字符串确认 usage.tabs.settings 不再渲染，不构成运行时引用。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 0 | recovery | — | 确认态 change spec 在 Build 阶段按 A7/A14 回填实测数字，导致正式产物哈希漂移、Builder 候选无法被接受；需求范围与 24 项验收不变，返回 Shape 重新确认包含实测结果的最终规格。 | 2026-10-24T02:18:34.937Z |
| 2 | 1 | 1 | pass | — | 独立验收 24/24 全部通过。六个 Runtime check 均绑定 candidateId 3efd5f7bf2975a90896c885a6e09d5ae4c8438c55a0a8afd2d07062a7176e40e、exit 0 且 inputBefore=inputAfter；另行复核 git 重放映射、四 ref 保真、locale、schema 23、Kimi Q1–Q3 与 fork 保留项，未发现失败或阻塞项。 | 2026-10-24T03:11:18.742Z |



## 结论

独立验收 24/24 全部通过。六个 Runtime check 均绑定 candidateId 3efd5f7bf2975a90896c885a6e09d5ae4c8438c55a0a8afd2d07062a7176e40e、exit 0 且 inputBefore=inputAfter；另行复核 git 重放映射、四 ref 保真、locale、schema 23、Kimi Q1–Q3 与 fork 保留项，未发现失败或阻塞项。
