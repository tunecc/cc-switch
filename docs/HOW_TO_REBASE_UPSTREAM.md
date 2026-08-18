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
# 保留 fork 侧（rebase 中 fork 侧即 --ours）
git checkout --ours <file>
git add <file>
git rebase --continue
```

这些文件是 fork 魔改或 Comet change 产物，与上游无对应来源或刻意分叉，一律以 fork 为准。

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
| `tauri.conf.json` | `productName`、`version` 等 fork 标识字段 |
| `package.json` | `version`（fork 版本号） |
| `src-tauri/Cargo.toml` | `version`（与 `package.json` 对齐的 fork 版本号） |
| `vite.config.ts` | `define` 中的 `__CCS_FORK_BUILD__` 等 fork 编译期常量 |
| `src/config/forkBuild.ts` | fork 构建配置（整文件保留） |
| `src/components/devpanel/` | fork 专属 devpanel 组件目录（整目录保留） |
| `docs/HOW_TO_REBASE_UPSTREAM.md` | 本文件本身（整文件保留） |
| `docs/openspec/` | Comet change 产物目录（整目录保留，由协调者管理） |
| `.gitignore` 的 fork 工具产物段 | 文件末尾 `# >>> Fork: Comet/Superpowers 工具产物 ...` 段（保留，不丢忽略规则） |

说明：

- 这些文件 rebase 冲突时按第 3.1 节保留 fork 侧。
- `.gitignore` 整体不是 fork 专属，但其末尾的 fork 工具产物段需保留；其余 `.gitignore` 改动按共享文件处理。
- 白名单随 fork 魔改范围扩展而更新；新增 fork 专属文件时同步补充本表。
