# Fork 仓库 Rebase 上游工作流

本文件描述 cc-switch fork 仓库（`tunecc/cc-switch`，origin）与上游原版（`farion1231/cc-switch`，upstream）同步的标准 rebase 流程。

- **origin**：fork 仓库，地址 `git@github-tunecc:tunecc/cc-switch.git`（即 `https://github.com/tunecc/cc-switch.git`），承载 fork 的魔改代码与 Comet change 文档。
- **upstream**：原版仓库，地址 `https://github.com/farion1231/cc-switch.git`，所有 fork 改动最终都要能 rebase 到它的 `main` 之上。

后续所有 fork 魔改 change 都按本流程与上游同步，保持 fork 始终可干净 rebase。

---

## 1. 添加 upstream remote

首次同步前需要把原版仓库加为 upstream remote（origin 已默认指向 fork）：

```bash
# 添加 upstream（原版仓库）
git remote add upstream https://github.com/farion1231/cc-switch.git

# 拉取 upstream 最新引用
git fetch upstream

# 验证
git remote -v
# origin    git@github-tunecc:tunecc/cc-switch.git (fetch/push)   <- fork
# upstream  https://github.com/farion1231/cc-switch.git (fetch)    <- 原版
```

说明：

- `origin` 是 fork（`tunecc/cc-switch`），日常推送走这里。
- `upstream` 是原版（`farion1231/cc-switch`），只 fetch、不 push。
- 一次添加永久生效，后续只需 `git fetch upstream`。

---

## 2. rebase 上游 main 标准流程

把当前 fork 分支变基到 upstream 最新 main 之上：

```bash
# 1. 拉取 upstream 最新引用
git fetch upstream

# 2. 切到要 rebase 的 fork 分支
git checkout feat/xxx

# 3. 变基到 upstream/main
git rebase upstream/main

# 4. 如有冲突，按第 3 节约定解决后继续
#    git rebase --continue

# 5. 推送回 origin（fork）
git push --force-with-lease origin feat/xxx
```

说明：

- **`--force-with-lease` 比 `--force` 安全**：它会在远端被别人更新时拒绝推送，避免覆盖协作者的新提交；`--force` 会无条件覆盖。
- rebase 前最好保证工作区干净（`git status` 无未提交改动）；如有 stash 需要先处理。
- rebase 会改写 fork 分支历史，所以必须 force push；origin 是 fork 私有分支，可以接受改写。
- rebase 完成后跑一次完整构建与测试，确认 fork 魔改仍工作。

---

## 3. 冲突处理约定

rebase 时按文件归属决定冲突解决策略：

### 3.1 fork 专属文件（见第 4 节白名单）

冲突时 **保留 fork 侧改动**：

```bash
# 保留 fork 侧（rebase 中 fork 侧即 --theirs，上游侧是 --ours）
git checkout --theirs <file>
git add <file>
git rebase --continue
```

这些文件是 fork 魔改或 Comet change 产物，与上游无对应来源或刻意分叉，一律以 fork 为准。

> 方向说明（2026-09-08 v3.20.2 同步实测修正）：`git rebase upstream/main` 重放 fork 提交时，
> `--ours` 是新基线（上游 + 已重放提交），`--theirs` 才是正在重放的 fork 提交 —— 与 merge 语义相反。
> 本文件旧版误写为 `--ours`，已修正；冲突时不确定就先看文件内容再选侧。

### 3.2 其余文件（上游共享代码）

优先取上游版本，再手动合并 fork 必要改动：

```bash
# 取上游版本（rebase 中上游即 --theirs）
git checkout --theirs <file>

# 手动编辑该文件，把 fork 必要的改动叠加回去
# ...编辑...

git add <file>
git rebase --continue
```

说明：

- 共享代码冲突时优先对齐上游，降低长期漂移成本；fork 的魔改应尽量集中在 fork 专属文件中，避免在共享文件里散落改动。
- 解决冲突后必须 `git add` 再 `git rebase --continue`，否则 rebase 不会推进。
- 想中断 rebase 回到起点：`git rebase --abort`。
- 单次冲突处理不确定时不要盲目 `--continue`，先 `git status` 和 `git diff` 复核。

---

## 4. fork 专属文件白名单

rebase 时需 **保留 fork 侧改动** 的文件清单：

| 文件 | 保留字段 / 范围 |
| --- | --- |
| `tauri.conf.json` | `productName`（`CC Switch`，与上游一致；fork 仅靠版本号后缀区分）、`version` 等 fork 标识字段 |
| `package.json` | `version`（fork 版本号） |
| `src-tauri/Cargo.toml` | `version`（与 `package.json` 对齐的 fork 版本号） |
| `vite.config.ts` | `define` 中的 `__CCS_FORK_BUILD__` 等 fork 编译期常量 |
| `vitest.config.ts` | `define` 中的 `__CCS_FORK_BUILD__`（测试环境编译期常量，整文件保留） |
| `src/config/forkBuild.ts` | fork 构建配置（整文件保留） |
| `src/components/devpanel/` | fork 专属 devpanel 组件目录（整目录保留） |
| `src-tauri/tauri.windows.conf.json` | Windows 平台 title（`CC Switch`，与上游一致） |
| `src/App.tsx` | `IS_FORK_BUILD` + `isTauri` 双守卫下的 `setTitle` useEffect |
| `src/components/settings/SettingsPage.tsx` | `IS_FORK_BUILD` 守卫下的 DevPanel 入口与挂载 |
| `src/vite-env.d.ts` | `__CCS_FORK_BUILD__` 全局类型声明 |
| `src/i18n/locales/zh.json` / `en.json` / `ja.json` / `zh-TW.json` | `devpanel` 段 + `connectivityTest` / `connectivityCheck` 等连通性测试键段（fork 新增键；上游新增键按共享合并） |
| `tests/msw/tauriMocks.ts` | `isTauri` mock 导出 |
| `src/config/forkOfficialAllowlist.ts` | fork 官方预设白名单（整文件保留） |
| `src/config/forkPresetFilter.ts` | fork 预设过滤工具（整文件保留） |
| `tests/setupTests.ts` | `vi.mock("@/config/forkBuild")` 段（IS_FORK_BUILD=false 上游构建语义测试隔离） |
| `src-tauri/src/commands/connectivity_test.rs` | 连通性测试 Tauri 命令（整文件保留） |
| `src-tauri/src/services/connectivity_test/` | 连通性测试后端服务（整目录保留） |
| `src/components/providers/ConnectivityTestDialog.tsx` | 连通性测试弹窗（整文件保留） |
| `src/components/providers/ConnectivityDetailDialog.tsx` | 连通性测试详情弹窗（整文件保留） |
| `src/components/providers/ConnectivityBadge.tsx` | 供应商列表批量探针徽标（整文件保留） |
| `src/components/providers/connectivityEntry.ts` | 弹窗入口判定（整文件保留） |
| `src/components/usage/ConnectivityCheckConfigPanel.tsx` | 用量页连通性测试参数面板（整文件保留） |
| `src/hooks/useConnectivityProbe.ts` / `useConnectivityTest.ts` | 测试/探针状态 hooks（整文件保留） |
| `src/lib/api/connectivity-check.ts` / `connectivity-test.ts` | 连通性测试前端 API 绑定（整文件保留） |
| `src/lib/connectivityTestSettings.ts` | 测试参数持久化纯函数（整文件保留） |
| `src/lib/providerModelIds.ts` | 供应商模型读写工具（整文件保留） |
| `src/utils/providerModelUtils.ts` | 模型徽章提取 / 快捷切换工具（整文件保留） |
| `src/components/providers/ModelQuickSwitch/` | 模型快捷切换弹窗组件（整目录保留） |
| `tests/components/ConnectivityTestDialog.test.tsx` 等连通性测试 | `tests/components/connectivityEntry.test.ts`、`tests/hooks/useConnectivityProbe.test.ts`、`tests/hooks/useConnectivityTest.test.ts`、`tests/lib/connectivityTestSettings.test.ts`（整文件保留） |
| `tests/lib/providerModelIds.test.ts` / `tests/utils/providerModelUtils.test.ts` | 模型工具测试（整文件保留） |
| `tests/components/ProviderCard.websiteLinks.test.tsx` / `tests/lib/providerSchema.websiteUrl2.test.ts` | 双官网链接测试（整文件保留） |
| `.github/workflows/ci.yml` / `release.yml` | fork 裁剪版 CI：仅构建 Windows x64 与 macOS arm64 unsigned（整文件保留） |
| `src-tauri/capabilities/default.json` | fork 移除 `updater:default` 权限（保留 fork 版） |
| `README.md` | fork 重写版（记录 fork 差异与构建说明，整文件保留；README_ZH/DE/JA 为共享文件按 §3.2 处理） |
| `CHANGELOG.md` | fork 更新日志（整文件保留） |
| `.comet/config.yaml` | Comet 工作流配置（整文件保留） |
| `docs/superpowers/` | Superpowers 计划/报告产物（整目录保留） |
| `docs/openspec/` | OpenSpec change 产物目录（整目录保留，由协调者管理） |
| `docs/HOW_TO_REBASE_UPSTREAM.md` | 本文件本身（整文件保留） |
| `.gitignore` 的 fork 工具产物段 | 文件末尾 `# >>> Fork: Comet/Superpowers 工具产物 ...` 段（保留，不丢忽略规则） |

共享文件中的 fork 专属语义（冲突时取上游版本后必须叠加回这些改动，见 §3.2）：

| 文件 | fork 专属语义 |
| --- | --- |
| `src-tauri/src/lib.rs` | 托盘左键单击切换主窗口显示/隐藏（`show_menu_on_left_click(false)` 及相关处理） |
| `src/components/settings/AboutSection.tsx` | 「检查更新」改为打开 fork GitHub Releases 页（禁用应用内更新器） |
| `src/contexts/UpdateContext.tsx` | 取消启动自检（fork 关闭自动更新） |
| `src/lib/updater.ts` | 恒返回 up-to-date（fork 关闭自动更新） |
| `src/config/*ProviderPresets.ts` ×8 | 预设接口的 `hidden?: boolean` 字段与官方预设过滤接线 |
| `src/lib/schemas/provider.ts` | `websiteUrl2` 第二官网链接字段 |
| `src-tauri/src/commands/misc.rs` 等后端共享文件 | 连通性测试命令注册、`connectivityTest` sanitize 隔离 |

说明：

- 这些文件 rebase 冲突时按第 3.1 节保留 fork 侧。
- `.gitignore` 整体不是 fork 专属，但其末尾的 fork 工具产物段需保留；其余 `.gitignore` 改动按共享文件处理。
- 白名单随 fork 魔改范围扩展而更新；新增 fork 专属文件时同步补充本表。
