## Context

本仓库是 farion1231/cc-switch 的 fork，origin/main 与上游 main 当前 0 差异，后续会在其上叠加多个魔改 change。现有构建产物与上游无法区分，且开发期需要在不影响当前使用 CC Switch 的前提下预览魔改功能。

关键约束：
- `identifier`（`com.ccswitch.desktop`）与 `auto_launch` 的 `app_name`（`CC Switch`）必须保持不变，否则 deep-link `ccswitch://` 与系统启动项失效。
- 窗口标题配置分散：macOS 用 `titleBarStyle: "Overlay"` + `title: ""`（标题由前端控制）；Windows 用 `tauri.windows.conf.json` 的 `title: "CC Switch"`。
- vite 已配置 `envPrefix: ["VITE_", "TAURI_"]`，但 fork 标识需要的是编译期常量而非运行期环境变量，使用 `define` 注入更合适。
- 项目为 Tauri 应用，版本号在三处声明（`package.json`、`Cargo.toml`、`tauri.conf.json`），必须手动保持一致。

## Goals / Non-Goals

**Goals:**
- fork 构建产物在窗口标题、版本号、编译期常量上与上游可区分。
- 提供仅 fork 构建可用的 Dev 预览面板，作为后续魔改功能的集中入口（本轮占位）。
- 建立可复用的上游 rebase 工作流文档与 fork 专属文件白名单。

**Non-Goals:**
- 不实现后续魔改功能本身（预设精简、表单布局、模型搜索、主页模型切换、侧边面板显隐等）。
- 不引入运行期配置开关来切换 fork/上游行为；fork 标识在编译期固定。
- 不修改 deep-link scheme、auto_launch、identifier。
- 不搭建 CI 或自动发布流程。

## Decisions

### D1: 版本号用 `-fork.N` 后缀而非自定义 prerelease tag

版本号统一为 `3.19.2-fork.1`。SemVer 预发布段允许任意标识符，`-fork.1` 可被 cargo/npm 正确解析，且与上游 `3.19.2` 明显区分。N 为整数计数，每次 fork 基线递增。

**备选**：用独立 build metadata（`+fork`）— 但 build metadata 在 SemVer 比较中被忽略，tsc/npm 仍可能把它当作同一版本，区分度不足。故选 prerelease 段。

### D2: 编译期常量用 vite `define` 注入而非环境变量

在 `vite.config.ts` 用 `define: { __CCS_FORK_BUILD__: JSON.stringify(true) }` 注入。fork 仓库本身就是 fork 构建，该常量在 fork 仓库内恒为 `true`；上游无此行，常量缺失（即"非 fork 构建"）。

**统一访问层**：业务代码通过 `src/config/forkBuild.ts` 导出的 `IS_FORK_BUILD` 访问，不直接引用裸常量，便于后续如果需要切换为环境变量驱动时只改一处。

**备选**：用 `import.meta.env.VITE_FORK_BUILD` — 但需要额外维护 `.env` 文件且为字符串类型，需手动 `=== "true"` 转换；`define` 直接产出 boolean，类型更干净。

### D3: macOS 窗口标题用前端动态设置而非 conf 写死

macOS `titleBarStyle: "Overlay"` 下 `tauri.conf.json` 的 `title` 为空，由前端控制。在 fork 构建启动时调用 `getCurrentWindow().setTitle("CC Switch (Fork)")`。Windows 在 `tauri.windows.conf.json` 写死 `title`。

**备选**：在 `tauri.conf.json` 主配置写死 title — 但 Overlay 模式下 macOS 标题栏不显示 title 字段，且会污染上游 rebase 时的主 conf 文件。前端动态设置只改动 `main.tsx`/`App.tsx`，对上游 `tauri.conf.json` 的改动仅限 version/productName。

### D4: Dev 面板入口放设置页 footer 角标

设置页 footer 加一个不显眼的 `Fork` 角标按钮（仅 `IS_FORK_BUILD` 渲染），点击用现有 Dialog/Sheet 组件打开 DevPanel。放设置页 footer 而非主页，避免干扰日常使用；角标而非显眼按钮，保持低调。

### D5: fork 专属文件白名单独立维护

`docs/HOW_TO_REBASE_UPSTREAM.md` 列出 fork 专属文件白名单：`tauri.conf.json`（productName/version）、`package.json`（version）、`Cargo.toml`（version）、`vite.config.ts`（define）、`src/config/forkBuild.ts`、`src/components/devpanel/`、`docs/HOW_TO_REBASE_UPSTREAM.md` 本身、`docs/openspec/`。rebase 上游时这些文件需保留 fork 侧改动，其余冲突优先取上游。

## Risks / Trade-offs

- **版本号三处手动同步易漂移** → Mitigation: tasks 中明确列出三处一致校验；后续可加一个 `scripts/check-fork-version.mjs` 脚本校验（本轮不做，留作后续 change）。
- **vite define 在 TS 中未声明会导致 typecheck 失败** → Mitigation: 在 `src/vite-env.d.ts` 声明 `declare const __CCS_FORK_BUILD__: boolean;`，tasks 中包含 typecheck 验证。
- **rebase 上游时 `tauri.conf.json`/`package.json`/`Cargo.toml`/`vite.config.ts` 会冲突** → Mitigation: 这些文件 fork 改动最小且集中（版本号、productName、define 一行），冲突时按白名单约定保留 fork 侧改动；文档明确标注。
- **Dev 面板入口在设置页 footer 可能不够显眼** → Trade-off: 故意低调，避免影响日常使用；后续可在 DevPanel 内加快捷键入口（本轮不做）。
- **macOS 动态设置标题在窗口重建后可能丢失** → Mitigation: 在 `App` 初始化 useEffect 中设置，窗口重建会重新走初始化；如仍丢失可在 `tauri.conf.json` 的 macOS 主窗口也写 title 作为兜底（本轮先观察）。

## Migration Plan

- **部署**：在 `feat/fork-scaffolding` 分支完成改动后，本地 `pnpm tauri dev` 验证；不影响已安装的上游 CC Switch（identifier 相同会覆盖安装，但开发期用 dev 模式不安装产物，不影响）。
- **回滚**：删除 `feat/fork-scaffolding` 分支或 checkout 回 main 即可回到上游状态；fork 改动全部隔离在该分支。
- **后续 change 依赖**：后续魔改 change 从 `feat/fork-scaffolding` 分支起步，依赖 `IS_FORK_BUILD` 与 DevPanel 容器。

## Open Questions

无。所有关键决策已定。
