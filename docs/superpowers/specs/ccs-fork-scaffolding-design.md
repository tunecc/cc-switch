---
comet_change: ccs-fork-scaffolding
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-18-ccs-fork-scaffolding
status: final
---

# Design Doc: ccs-fork-scaffolding

> OpenSpec change: `ccs-fork-scaffolding`
> 产物语言：zh-CN
> 本文件是 Superpowers 侧的 Design Doc，对应 OpenSpec change 的 `design.md` 的技术决策落地。

## 1. 背景与目标

fork 版 cc-switch 需要在编译期与运行期与上游可区分，并提供仅 fork 可用的开发预览面板，作为后续魔改功能的集中入口。完整背景与动机见 OpenSpec `proposal.md`。

**目标**：
- fork 构建产物在窗口标题、版本号、编译期常量上与上游可区分。
- 提供仅 fork 构建可用的 Dev 预览面板（本轮占位）。
- 建立可复用的上游 rebase 工作流文档与 fork 专属文件白名单。

**非目标**：不实现后续魔改功能本身；不引入运行期配置开关；不修改 deep-link/auto_launch/identifier；不搭建 CI。

## 2. 技术决策

### D1: 版本号 `-fork.N` 后缀
三处（package.json、Cargo.toml、tauri.conf.json）统一 `3.19.2-fork.1`。SemVer prerelease 段可被 cargo/npm 正确解析且与上游区分。备选 `+fork` build metadata 被比较忽略，区分度不足，弃用。

### D2: 编译期常量用 vite `define`
`vite.config.ts` 增加 `define: { __CCS_FORK_BUILD__: JSON.stringify(true) }`。业务代码通过 `src/config/forkBuild.ts` 导出的 `IS_FORK_BUILD` 访问。备选 `import.meta.env.VITE_FORK_BUILD` 需维护 .env 且为字符串，类型不干净，弃用。

### D3: macOS 窗口标题前端动态设置
Overlay 模式下 title 为空，前端在初始化时 `getCurrentWindow().setTitle("CC Switch (Fork)")`。Windows 在 `tauri.windows.conf.json` 写死 title。避免污染主 `tauri.conf.json` 的 macOS title 字段。

### D4: Dev 面板入口放设置页 footer 角标
设置页 footer 加不显眼 `Fork` 角标（仅 IS_FORK_BUILD 渲染），点击用现有 Dialog/Sheet 打开 DevPanel。低调，避免干扰日常使用。

### D5: fork 专属文件白名单
`docs/HOW_TO_REBASE_UPSTREAM.md` 列出 fork 专属文件白名单，rebase 上游时保留 fork 侧改动，其余冲突优先取上游。白名单：tauri.conf.json(productName/version)、package.json(version)、Cargo.toml(version)、vite.config.ts(define)、src/config/forkBuild.ts、src/components/devpanel/、docs/HOW_TO_REBASE_UPSTREAM.md 本身、docs/openspec/。

## 3. 实施方案

### 3.1 版本号与 productName
- `package.json`: `version` → `3.19.2-fork.1`
- `src-tauri/Cargo.toml`: `version` → `3.19.2-fork.1`
- `src-tauri/tauri.conf.json`: `version` → `3.19.2-fork.1`，`productName` → `CC Switch (Fork)`
- `src-tauri/tauri.windows.conf.json`: 窗口 `title` → `CC Switch (Fork)`
- 不动 `identifier`（`com.ccswitch.desktop`）与 `auto_launch.rs` 的 `app_name`

### 3.2 编译期常量
- `vite.config.ts`: 增加 `define: { __CCS_FORK_BUILD__: JSON.stringify(true) }`
- `src/vite-env.d.ts`: `declare const __CCS_FORK_BUILD__: boolean;`
- `src/config/forkBuild.ts`: `export const IS_FORK_BUILD = __CCS_FORK_BUILD__ as boolean;`

### 3.3 macOS 窗口标题
- `src/App.tsx`（或 main.tsx）初始化 useEffect：`if (IS_FORK_BUILD) getCurrentWindow().setTitle("CC Switch (Fork)")`
- import 自 `@tauri-apps/api/window`（项目已用）

### 3.4 Dev 预览面板
- `src/components/devpanel/DevPanel.tsx`: `IS_FORK_BUILD` 为 true 时渲染 fork 信息（版本、构建模式、徽章、上游同步状态占位、后续魔改功能占位区）；用现有 Dialog/Sheet 组件承载
- `src/components/settings/SettingsPage.tsx`: footer 加 `Fork` 角标按钮（仅 IS_FORK_BUILD），点击打开 DevPanel
- i18n: 补 zh/en 的 `devpanel.*` key

### 3.5 rebase 文档
- `docs/HOW_TO_REBASE_UPSTREAM.md`: 四节（upstream remote、rebase 流程、冲突约定、白名单）

## 4. 风险与缓解

- 版本号三处手动同步易漂移 → tasks 明确校验；后续可加 check 脚本（本轮不做）
- vite define 未声明致 typecheck 失败 → vite-env.d.ts 声明，typecheck 验证
- rebase 上游 conf/package 文件冲突 → 白名单约定保留 fork 侧，改动最小集中
- Dev 入口不够显眼 → 故意低调，后续可加快捷键
- macOS 动态标题窗口重建丢失 → 初始化 useEffect 设置；必要时 conf 写兜底 title

## 5. 验收

- `pnpm typecheck` 通过
- `pnpm test:unit` 通过
- `pnpm tauri dev`：窗口标题 `CC Switch (Fork)`，设置页 footer Fork 角标可见，DevPanel 显示 fork 信息，版本号 `3.19.2-fork.1`
- 原版功能不受影响（供应商/Skills/MCP/Sessions/代理）
- `docs/HOW_TO_REBASE_UPSTREAM.md` 存在
- `comet classic openspec -- validate ccs-fork-scaffolding` 通过

## 6. 任务分解

详见 OpenSpec `tasks.md`（6 组 24 个任务）。
