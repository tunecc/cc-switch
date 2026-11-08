---
generated_from_state_version: 8
---

# 验证

## 当前结果

- 结果: **已归档**
- 验证情况: **已完成检查，验证结果已确认**
- 目标周期: 1
- 迭代: 1
- 验证器尝试次数: 1
- 完成时间: 2026-11-08T12:38:46.764Z
- 摘要: 独立只读验收通过：A1-A15 全部 passed。重跑套件实测——pnpm install --frozen-lockfile/typecheck/test:unit 均 exit=0（294 文件/3787 用例全绿，88.84s），cargo fmt --check/check --all-targets/test 均 exit=0（零告警，4775 通过/14 ignored/0 失败）。A15 保真独立复算 A=72 行/12 文件、B=27 行/7 文件、非重叠缺失 0，全部缺失行归因刻意取舍；A1 patch-id 独立重算 190 同/13 异与登记一致。复用仍有效的 rust-fmt 与 sync-evidence 受管检查。终态 HEAD=45e824108，版本 4.0.26-1，工作区除 Runtime 自管 docs/comet/changes/ 外干净。 受管检查 rust-fmt/sync-evidence 经 refreshChecks 刷新后复跑仍 passed（Action :7），本结果以 Action :8 新收据提交。

## 验收

| 编号 | 结果 | 来源 | 验收项 | 原因 |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | 同步基线与重放完整性可核对：`git merge-base main v4.0.26^{}` 为 `f621d4216`（fork 提交全部落在 `v4.0.26` 之上），`git rev-list --count v4.0.26..HEAD` 等于同步前 fork 提交（同步前实测 203，以 `pre-sync-v426` 现取为准）中实际重放的数量加本轮新增提交，重放主题序列与 `pre-sync-v426` 一致，被 git 判空丢弃的提交逐个登记原因，patch-id 差异逐条归类为「冲突停车」或「仅上下文位移/被上游同名声明消化」。 | 独立复算：merge-base(main,v4.0.26^{})=f621d4216189ef06bcc6acd3588c84937b9794e1；rev-list count v4.0.25..pre-sync-v426=203，v4.0.26..HEAD=205（203 重放+2 本轮新增）；主题序列 diff 仅多出本轮 2 条新提交、重放段逐行一致；patch-id --stable 独立重算 190 同/13 异、判空 0，13 条差异提交与 §4.12 登记清单逐一相同；抽查 25f312bb1（release.yml 148/754→147/797）、cd97b7d0c（locale proxy 并集终态三键并存）、b4d5319b4（numstat 全同、仅上下文位移）归类成立。 |
| A2 | passed | brief.md | fork 全部魔改在终态仍然在位且可用：`IS_FORK_BUILD`/`forkBuild`、`forkOfficialAllowlist`、`forkPresetFilter`、`devpanel/`、连通性测试前后端链路与两个命令注册、模型徽章与快捷切换、`websiteUrl2` 全链路、`VisibleSidebarPanels` 与 Sidebar 过滤、托盘左键切换与源码护栏、跨应用导入接线、右键置顶/置底、无更新器与无 `stream_check` 接线，逐项以 `git grep -I` 取证并跑对应测试。 | git grep -I 取证全部在位：IS_FORK_BUILD=21、forkOfficialAllowlist=15、forkPresetFilter=5、devpanel/DevPanel.tsx、connectivity 两命令注册（lib.rs:1863-1864）、websiteUrl2=96/website_url_2=66、VisibleSidebarPanels=10、tray_left_click_never_opens_the_menu 护栏、ProviderImportEntry=18/useProviderImportSources=14、ModelQuickSwitch、ProviderList 一键置顶/置底；tauri_plugin_updater/@tauri-apps/plugin-updater/cleanup_old_stream_check_logs 全仓 0 命中、stream_check_provider 后端 0 命中；install_update_and_restart 为 Ok(false) stub 且 commands/settings.rs 与 pre-sync 零 diff；3787 单测全绿。前端 api/connectivity-check.ts:28 的 invoke("stream_check_provider") 与上游 tag 及 pre-sync 逐字节相同，属上游既有死路径（无后端注册），非本轮回归。 |
| A3 | passed | brief.md | 两条连通性链路并存终态不变：上游 MCP 检测链（`services/mcp_connectivity.rs`、`commands/mcp.rs`、`useMcpConnectivity.ts`、`UnifiedMcpPanel.tsx`）与 fork 供应商逐模型测试链（`services/connectivity_test/`、两个命令注册、`ConnectivityBadge`/对话框/批量检测）同时在位；本轮上游 `65f6e682a`（401 显示需登录）与 `start_mcp_connectivity_checks` async 化落地；`stream_check_provider` 保持 0 命中。 | 两条链路并存：services/mcp_connectivity.rs、commands/mcp.rs、useMcpConnectivity.ts、UnifiedMcpPanel.tsx 与 services/connectivity_test/ 均在位；lib.rs 同时注册 start/cancel_mcp_connectivity_checks（1663-1664）与 connectivity_test_provider_models/connectivity_probe_provider（1863-1864）；start_mcp_connectivity_checks 为 pub async fn；mcp_connectivity.rs 含 401 sign-in required 处理（上游 65f6e682a 语义落地）；stream_check_provider 在 src-tauri 0 命中。 |
| A4 | passed | brief.md | 维护链重构终态：启动路径（`database/mod.rs`）不再跑清理/vacuum；`backup.rs` 为上游新结构（`backup_if_needed` 私有 + `periodic_backup_if_needed` 先备份后清理、备份失败也清理）但**不含** `cleanup_old_stream_check_logs` 调用；lib.rs 定时器首 tick 跑启动维护、`spawn_blocking` + `MissedTickBehavior::Skip`；上游新增维护测试中涉及 stream_check 清理行为的断言按 fork 移除态适配，其余维护/备份用例与 fork 既有用例全部通过。 | backup.rs：backup_if_needed 私有（413）+ periodic_backup_if_needed（452）上游新结构，无 cleanup_old_stream_check_logs 调用；database/mod.rs 启动路径无清理（152 行注释明确延迟到 periodic）；lib.rs 维护定时器 spawn_blocking + MissedTickBehavior::Skip（1439/1443）首 tick 模式；stream_check_logs 建表保留（schema.rs 3 处）；cargo test 4775 通过/0 失败含全部维护/备份用例。 |
| A5 | passed | brief.md | 窗口可见性与隐藏暂停同 fork 托盘契约共存：lib.rs 4 处 `main-window-visibility-changed` emit 取上游；`windowActivity.ts` 上游重写整文件落地（fork 零语义）与 `tests/lib/windowActivity.test.ts` 通过；fork 托盘左键四分支、`set_show_menu_on_left_click(false)`、`tray_left_click_never_opens_the_menu` 护栏不变；`tray.rs` 的 Credits 文案与 `plan_line` 取上游。 | lib.rs main-window-visibility-changed emit 恰 4 处；windowActivity.ts 与 v4.0.26 tag diff=0 行（整文件随上游），tests/lib/windowActivity.test.ts 在全绿套件内；tray.rs set_show_menu_on_left_click(false)（2699）与 tray_left_click_never_opens_the_menu 源码护栏（3448）在位且用例通过；Credits 文案与 plan_line（727）取上游。 |
| A6 | passed | brief.md | ProviderCard 套餐后缀与 fork 副标题链叠加：上游 `quotaPlanKey`/`useQuotaPlan`/`planSuffix` 与 `src/lib/query/accountPlans.ts`、Auth Center 套餐、Copilot Credits 全落地；fork 的副标题优先级链、模型徽章、双官网链接、右键置顶/置底逐行保留；`tests/lib/accountPlans.test.tsx`、`tests/lib/copilotQuota.test.tsx` 与 fork 既有用例通过。 | ProviderCard：quotaPlanKey（339）/useQuotaPlan（371）/planSuffix（376）与 src/lib/query/accountPlans.ts 落地；fork 副标题链 websiteLinks.length>0 分支（611）与 planSuffix 分支叠加、extractModelBadgeForProvider 模型徽章（410）保留；tests/lib/accountPlans.test.tsx、copilotQuota.test.tsx 随 294 文件/3787 用例全绿。 |
| A7 | passed | brief.md | deeplink 扩展与 fork 跨应用导入互不干扰：上游 `deeplink/provider.rs` 的 app 白名单扩展、Claude Desktop 直连/映射卡分流、Pi 系单模型节点全部落地，新 `Provider` 字面量补 `website_url_2`；fork 的 `ProviderImportEntry`/`useProviderImportSources`/表单接线不变。 | deeplink/parser.rs:96 白名单含 claude-desktop（扩展落地）、provider.rs:1202 claude-desktop 映射分流、新 Provider 字面量 website_url_2: None（434）；fork ProviderImportEntry/useProviderImportSources 接线不变（18/14 命中）；deeplink 与导入用例随 cargo test/单测全绿。 |
| A8 | passed | brief.md | App.tsx 懒加载与 fork 门控叠加：上游 `lazy`/`Suspense` 改造落地，fork 的 `VisibleSidebarPanels` 条件渲染与 Sidebar 过滤保持生效，被门控隐藏的面板不因此提前加载或报错。 | App.tsx lazy/Suspense 改造在位（139-181 共 14+ 个 lazy 声明）；fork visibleSidebarPanels 门控并存（305/436/1930），批量检测按钮按 shouldShowTestEntry && visibleSidebarPanels.batchTest 门控；单测全绿无提前加载报错。 |
| A9 | passed | brief.md | 数据库与 schema 结论可复算：终态 `SCHEMA_VERSION` 为 25（fork 值），迁移臂数量与 `pre-sync-v426` 相同；`dao/providers.rs` 上游批量端点读取与跳过未变保存落地且 `website_url_2` 列与行偏移保留；`database/{schema,tests}.rs`、`dao/providers_tests.rs` 全部用例通过。 | SCHEMA_VERSION=25（database/mod.rs:54）；迁移臂 grep 计数 HEAD=48 与 pre-sync-v426=48 相同；dao/providers.rs 两条批量 SELECT 均含 website_url_2（125/129，row.get(4)），UPDATE 含 website_url_2 = ?4 与 OR website_url_2 IS NOT ?4（375/387）；database/dao 全部用例随 cargo test 4775 通过。 |
| A10 | passed | brief.md | 本地化落地且零静默失效：4 个既有 locale 的上游新增键逐字落地、fork 键段保留；`tr.json` 与 `v4.0.26` tag 逐字节一致且不补 fork 键；5 个 locale 按对象作用域显式查重结果为 `dup=0`。 | 独立 object_pairs_hook 查重 en/ja/zh/zh-TW/tr 五文件 dup=0；tr.json 与 git show v4.0.26:src/i18n/locales/tr.json 逐字节一致（336049 字节）；4 个既有 locale 各 10 个上游新增键+4 个改写键逐字落地（missing=0、changed_not_landed=0）、fork 键段零丢失。 |
| A11 | passed | brief.md | 后端在 fork 结构下编译通过：上游新增/修改的 `Provider` 结构体字面量（含 `deeplink/provider.rs` 本轮新增处）补齐 fork 的 `website_url_2` 字段后，`cargo check --all-targets` 与 `cargo nextest run` 零失败、无新增未使用告警，且 `cargo fmt --check` 通过。 | 独立重跑：cargo check --all-targets exit=0 零错误零告警；cargo fmt --check exit=0；cargo test exit=0，4775 通过/0 失败/14 ignored（ignored 为上游需真实环境用例）。本机未装 cargo-nextest，按任务指令以 cargo test 等价覆盖（§4.12 已登记该口径）。 |
| A12 | passed | brief.md | 版本与锁文件终态一致：四处版本号均为 `4.0.26-1`；`Cargo.lock` 不出现任何 `tauri-plugin-updater` 条目，`pnpm-lock.yaml` 反映 `@tauri-apps/cli 2.12.4` 而 fork 移除的 `@tauri-apps/plugin-updater` 三段仍不存在，`pnpm install` 与 `cargo check` 均报告锁文件未被改写。 | package.json/Cargo.toml/tauri.conf.json/Cargo.lock 四处均 4.0.26-1；pnpm-lock.yaml 含 @tauri-apps/cli@2.12.4（2 处）、plugin-updater 0 命中；Cargo.lock tauri-plugin-updater 0 命中；pnpm install --frozen-lockfile exit=0 报告 Lockfile is up to date，套件跑完后 git status 无任何锁文件/项目文件改动。 |
| A13 | passed | brief.md | CI 裁剪与 fork URL 保留：`.github/workflows/release.yml` 保持 fork 裁剪版（无 Linux bundle、无 stapler 段、macOS runner 仍 `macos-14`）；`git grep -I -n 'farion1231/cc-switch/releases' HEAD -- src-tauri` 仍 0 命中（fork 的 4 处 tunecc URL 与两个测试断言保留）。 | release.yml 无 Linux bundle/stapler 段、macOS runner=macos-14（28 行）；git grep farion1231/cc-switch/releases HEAD -- src-tauri 0 命中；commands/misc.rs tunecc URL 5 处（代码 82/104/116 + 测试断言 7003/7007）在位。 |
| A14 | passed | brief.md | 交付边界与配置保护：Build/Verify 期间不执行任何远端写操作；`.comet/config.yaml` 在 rebase 中途被历史提交改写时按 `git checkout ORIG_HEAD -- .comet/config.yaml` 恢复且终态与同步前一致；取证性 `git fetch upstream` 不带 `--prune-tags`（本轮 Shape 期实测该组合会删光 fork 专属本地 tag，已从 origin 恢复）；终态工作区除 Runtime 自管文件外无未提交改动，`docs/HOW_TO_REBASE_UPSTREAM.md` §4 与 §4.12 反映本轮实测结论。 | 终态 git status 仅 ?? docs/comet/changes/（Runtime 自管），无其他未提交改动；.comet/config.yaml 与 pre-sync-v426 diff=0；docs/HOW_TO_REBASE_UPSTREAM.md §4.12 存在且为本轮实测（2026-11-08），§4 表含 28 处 4.0.26 登记；冲突标记扫描 0 命中；本 Verifier 全程只读、无任何远端写操作。 |
| A15 | passed | brief.md | 落地保真核对（四 ref 行多重集口径）：在最终态提交之后，用 `v4.0.26` / `main(=pre-sync-v426)` / `HEAD` 与上游基线四个 ref 计算行多重集差集，184 个上游文件与 fork 侧 148 个代码文件全部参与，非重叠的上游文件在 fork 侧缺失为 0，重叠 38 文件的两侧缺失行逐行归因并带重数，归因只允许「刻意取舍（版本行 / fork 专属文案 / 裁剪段 / 移除链路 / 白名单条目）」一类，出现无法归类的缺失行即判定失败。 | 独立四 ref 行多重集复算（Counter 差集，删除文件不计）：方向 A=72 行/12 文件——release.yml 41（裁剪段 D7）、backup.rs 14（D3 移除链）、dao/providers.rs 7（加列/参数后移合并等价）、4 locale 各 1（proxyLoopbackHijacked 行尾逗号，内容逐字相同）、README 2（fork 重写）、版本行 4；非重叠 146 个上游文件缺失=0。方向 B=27 行/7 文件——docs 登记 21、旧版本 4.0.25-1 行 4、dao 收尾引号 1、grok-4.5 断言 1（已改 grok-4.7，282 行实证）。全部缺失行归因刻意取舍，与 §4.12 登记数字一致，无无法归类行。 |

## 检查

| 检查 | 命令 | 工作目录 | 状态 | 退出码 | 耗时 |
| --- | --- | --- | --- | ---: | ---: |
| cargo fmt --check（fork CI 三平台同款） | fmt --check --manifest-path src-tauri/Cargo.toml | . | passed | 0 | 3878 ms |
| 只读取证：基线/版本/移除链路/fork 保留/locale/裁剪版 | -c import json, subprocess, sys from collections import Counter fails = [] def expect(cond, msg): if not cond: fails.append(msg) def git(*a): r = subprocess.run(['git', *a], capture_output=True, text=True) return r.returncode, r.stdout def hits(pat, *paths): rc, out = git('grep', '-I', '-l', pat, 'HEAD', '--', *paths) return [l for l in out.splitlines() if l.strip()] rc, out = git('merge-base', 'HEAD', 'v4.0.26^{}') expect(rc == 0 and out.strip() == 'f621d4216189ef06bcc6acd3588c84937b9794e1', 'merge-base mismatch: ' + out.strip()) rc, out = git('rev-list', '--count', 'v4.0.25..pre-sync-v426'); pre = int(out.strip()) rc, out = git('rev-list', '--count', 'v4.0.26..HEAD'); post = int(out.strip()) expect(pre == 203, f'pre-sync commits {pre} != 203') expect(post >= pre, f'replayed+new {post} < pre-sync {pre}') expect('"version": "4.0.26-1"' in open('package.json').read(), 'package.json version') expect('"version": "4.0.26-1"' in open('src-tauri/tauri.conf.json').read(), 'tauri.conf version') expect('version = "4.0.26-1"' in open('src-tauri/Cargo.toml').read(), 'Cargo.toml version') expect('name = "cc-switch"\nversion = "4.0.26-1"' in open('src-tauri/Cargo.lock').read(), 'Cargo.lock version') expect('"@tauri-apps/cli": "^2.12.4"' in open('package.json').read(), 'tauri cli bump') expect('@tauri-apps/plugin-updater' not in open('pnpm-lock.yaml').read(), 'pnpm updater resurrected') expect('tauri-plugin-updater' not in open('src-tauri/Cargo.lock').read(), 'cargo updater resurrected') for pat in ['tauri_plugin_updater', 'stream_check_provider', 'cleanup_old_stream_check_logs']: expect(not hits(pat, 'src-tauri'), f'{pat} resurrected') s = open('src-tauri/src/commands/settings.rs').read() expect('pub async fn install_update_and_restart(_app: AppHandle) -> Result<bool, String> {\n Ok(false)\n}' in s, 'updater stub changed') for pat in ['IS_FORK_BUILD', 'forkOfficialAllowlist', 'forkPresetFilter', 'connectivity_test_provider_models', 'connectivity_probe_provider', 'start_mcp_connectivity_checks', 'cancel_mcp_connectivity_checks', 'website_url_2', 'websiteUrl2', 'VisibleSidebarPanels', 'tray_left_click_never_opens_the_menu', 'ProviderImportEntry', 'useProviderImportSources']: expect(bool(hits(pat, 'src', 'src-tauri')), f'{pat} missing') expect(not hits('farion1231/cc-switch/releases', 'src-tauri'), 'upstream releases URL present') rc, out = git('grep', '-I', '-c', 'tunecc/cc-switch/releases', 'HEAD', '--', 'src-tauri/src/commands/misc.rs') expect(rc == 0 and int(out.strip().split(':')[-1]) >= 4, 'tunecc URLs < 4') b = open('src-tauri/src/database/backup.rs').read() expect('periodic_backup_if_needed' in b and 'cleanup_old_stream_check_logs' not in b, 'backup structure') l = open('src-tauri/src/lib.rs').read() expect(l.count('main-window-visibility-changed') >= 4, 'visibility emits < 4') expect('MissedTickBehavior::Skip' in l, 'timer behavior') m = open('src-tauri/src/database/mod.rs').read() expect('pub(crate) const SCHEMA_VERSION: i32 = 25;' in m, 'schema version != 25') def hook(pairs): c = Counter(k for k, _ in pairs) d = [k for k, n in c.items() if n > 1] if d: raise ValueError('dup keys: ' + ','.join(d)) return dict(pairs) for loc in ['en', 'ja', 'zh', 'zh-TW', 'tr']: try: json.loads(open(f'src/i18n/locales/{loc}.json').read(), object_pairs_hook=hook) except ValueError as e: fails.append(f'{loc}: {e}') rc, tr_tag = git('show', 'v4.0.26:src/i18n/locales/tr.json') expect(rc == 0 and tr_tag == open('src/i18n/locales/tr.json').read(), 'tr.json not byte-identical') rel = open('.github/workflows/release.yml').read() expect('macos-14' in rel, 'macos-14 missing') expect('stapler' not in rel.lower() and 'appimage' not in rel.lower(), 'trimmed sections resurrected') if fails: print('FAIL\n' + '\n'.join(fails)); sys.exit(1) print(f'OK merge-base=f621d4216 pre={pre} post={post} versions=4.0.26-1 locales dup=0 tr=identical removal=0 fork-presence=13/13') | . | passed | 0 | 1398 ms |

### Builder 报告的证据

以下为 Builder 报告，不等同于 Runtime 检查凭据或独立验收结果。

- pnpm install --frozen-lockfile: passed — 锁文件未被改写；@tauri-apps/cli 2.12.4 落地，plugin-updater 三段不存在
- pnpm typecheck: passed — 零错误
- pnpm test:unit 全量: passed — 294 文件 / 3787 用例全绿（/tmp/pnpm-test-v426-full.log exit=0）；含上游新增 accountPlans/copilotQuota/windowActivity/npmBinCollision 与 fork 用例；唯一修复为 providerImport.test.ts 的 grok-4.7 断言适配
- cargo check --all-targets: passed — 零错误零告警；上游新增 Provider 字面量已补 website_url_2
- cargo fmt --check: passed — exit=0
- cargo test 全量: passed — 4775 通过 / 14 ignored / 0 失败（/tmp/cargo-test-v426-full.log exit=0）；含托盘护栏、schema、维护链重构、上游新增 providers_tests/session_manager_tests
- locale 查重与逐字节核对: passed — 5 个 locale 按对象作用域 object_pairs_hook 查重 dup=0；tr.json 与 v4.0.26 tag 逐字节一致
- fork 保留/移除清单 git grep 取证: passed — 13 项 fork 符号全部在位；tauri_plugin_updater/stream_check_provider/cleanup_old_stream_check_logs 零命中；install_update_and_restart 保持 Ok(false) stub 且 settings.rs 与 pre-sync 零 diff；farion1231 releases URL 零命中、misc.rs tunecc URL 5 处
- 重放完整性核对: passed — merge-base=f621d4216；203/203 重放、0 丢弃、主题序列逐行一致；patch-id 190 同/13 异全部归类登记于 §4.12
- 四 ref 落地保真复算: passed — 在最终态提交后执行：方向 A=72 行/12 文件（release.yml 裁剪段 41、backup.rs D3 移除 14、dao 列位移 7、locale 逗号 4、README 域名 2、版本行 4），方向 B=27 行/7 文件（docs 登记行 21、旧版本行 4、dao 引号 1、grok 断言 1），全部归因；非重叠上游文件缺失 0
- 已知限制: 本机未安装 cargo-nextest，后端全量以 cargo test 执行（4775 通过/14 ignored/0 失败）；fork CI 正式口径为 nextest，独立 Verifier 可按该口径复跑。
- 已知限制: 时间敏感用例的既有 flaky 边界（SessionManagerPage 分桶本地 00:00–00:30、AppsPage 过期缓存 CI 并发竞态）本轮未触发；如 Verifier 遇到单条红按上游同用例比对与本地重跑判定。
- 已知限制: Tauri 桌面 UI 未做真机手工验收；行为由 3787 前端用例 + 4775 后端用例与逐行叠加核对覆盖。

## 阻塞项

_无。_

## 风险与跳过的工作

- 前端 src/lib/api/connectivity-check.ts:28 仍 invoke("stream_check_provider")：与上游 v4.0.26 tag 及 pre-sync fork 逐字节相同的既有死路径（后端无注册、仅 useStreamCheck.ts 及其测试引用），非本轮回归，建议后续轮次评估是否随上游清理。
- 本机未安装 cargo-nextest，A11 以 cargo test 等价执行（4775/0/14）；fork CI 的 nextest 口径将在 CI 侧覆盖。
- 已知 flaky 边界（SessionManagerPage 凌晨分桶、AppsPage 缓存竞态）本轮未触发，294 文件/3787 用例一次全绿；后续夜间运行仍可能按既有边界处置。

## 之前的迭代

| 目标周期 | 迭代 | 尝试 | 结果 | 未解决项 | 摘要 | 完成时间 |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 独立只读验收通过：A1-A15 全部 passed。重跑套件实测——pnpm install --frozen-lockfile/typecheck/test:unit 均 exit=0（294 文件/3787 用例全绿，88.84s），cargo fmt --check/check --all-targets/test 均 exit=0（零告警，4775 通过/14 ignored/0 失败）。A15 保真独立复算 A=72 行/12 文件、B=27 行/7 文件、非重叠缺失 0，全部缺失行归因刻意取舍；A1 patch-id 独立重算 190 同/13 异与登记一致。复用仍有效的 rust-fmt 与 sync-evidence 受管检查。终态 HEAD=45e824108，版本 4.0.26-1，工作区除 Runtime 自管 docs/comet/changes/ 外干净。 受管检查 rust-fmt/sync-evidence 经 refreshChecks 刷新后复跑仍 passed（Action :7），本结果以 Action :8 新收据提交。 | 2026-11-08T12:38:46.764Z |



## 结论

独立只读验收通过：A1-A15 全部 passed。重跑套件实测——pnpm install --frozen-lockfile/typecheck/test:unit 均 exit=0（294 文件/3787 用例全绿，88.84s），cargo fmt --check/check --all-targets/test 均 exit=0（零告警，4775 通过/14 ignored/0 失败）。A15 保真独立复算 A=72 行/12 文件、B=27 行/7 文件、非重叠缺失 0，全部缺失行归因刻意取舍；A1 patch-id 独立重算 190 同/13 异与登记一致。复用仍有效的 rust-fmt 与 sync-evidence 受管检查。终态 HEAD=45e824108，版本 4.0.26-1，工作区除 Runtime 自管 docs/comet/changes/ 外干净。 受管检查 rust-fmt/sync-evidence 经 refreshChecks 刷新后复跑仍 passed（Action :7），本结果以 Action :8 新收据提交。
