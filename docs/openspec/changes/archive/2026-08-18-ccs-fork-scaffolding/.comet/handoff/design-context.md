# Comet Design Handoff

- Change: ccs-fork-scaffolding
- Phase: design
- Mode: compact
- Context hash: 60994470c0594be7d5542277f1c8752bfa7eebc28bd4710a720741eb619bcb41

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-fork-scaffolding/proposal.md

- Source: docs/openspec/changes/ccs-fork-scaffolding/proposal.md
- Lines: 1-37
- SHA256: bbb061943e9a8e551e8a55d433782851150d80b6e251c10569a1aa9dbd604263

```md
## Why

本仓库是 farion1231/cc-switch 的 fork，后续会在其上叠加多个魔改功能（预设精简、表单布局、模型搜索、主页模型切换、侧边面板显隐等），且需要持续可同步上游。当前没有任何 fork 专属的构建标识与预览机制：fork 构建产物与上游完全无法区分，开发期间无法在不影响当前使用 CC Switch 的前提下集中预览魔改功能。需要先建立 fork 基础设施，作为后续所有魔改的基线。

## What Changes

- **fork 构建标识（A 层）**
  - 版本号统一加 `-fork.N` 后缀：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 三处版本一致（首个为 `3.19.2-fork.1`）。
  - `productName` 改为 `CC Switch (Fork)`（`tauri.conf.json` 与 `tauri.windows.conf.json` 的窗口标题）。
  - vite 编译期注入全局常量 `__CCS_FORK_BUILD__`（boolean），fork 仓库内恒为 `true`；新增 `src/config/forkBuild.ts` 统一导出 `IS_FORK_BUILD`，并在 `vite-env.d.ts` 声明类型。
  - macOS Overlay 标题栏在 fork 构建启动时动态设置窗口标题为 `CC Switch (Fork)`（Windows 已在 conf 写死）。
- **Dev 预览面板（B 层）**
  - 新增 `src/components/devpanel/DevPanel.tsx`，仅 `IS_FORK_BUILD` 时可用；展示 fork 信息（版本、构建模式、fork 徽章、上游同步状态占位、后续魔改功能占位区）。
  - 设置页 footer 加一个不显眼的 `Fork` 角标按钮（仅 `IS_FORK_BUILD` 可见），点击打开 DevPanel。
- **分支与文档**
  - 新建分支 `feat/fork-scaffolding`（从当前 main）。
  - 新增 `docs/HOW_TO_REBASE_UPSTREAM.md`：upstream remote 添加、rebase 流程、冲突处理约定、fork 专属文件白名单。
- **不变项**
  - `identifier`（`com.ccswitch.desktop`）保持不变，避免 deep-link `ccswitch://` 与 auto_launch 失效。
  - `auto_launch.rs` 中 `app_name = "CC Switch"` 保持不变，避免系统启动项失效。

## Capabilities

### New Capabilities
- `fork-build-identity`: fork 版构建标识与开发预览面板。定义 fork 构建在版本号、窗口标题、编译期常量上与上游可区分；定义 Dev 预览面板仅在 fork 构建下可用、入口位置与展示内容契约。

### Modified Capabilities
<!-- 无既有 spec 需修改；本仓库 specs/ 目前为空。 -->

## Impact

- **构建配置**：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/tauri.windows.conf.json`、`vite.config.ts`、`src/vite-env.d.ts`。
- **新增源码**：`src/config/forkBuild.ts`、`src/components/devpanel/DevPanel.tsx`。
- **改动源码**：`src/App.tsx` 或 `src/components/settings/SettingsPage.tsx`（注入 Fork 角标入口）；`src/main.tsx` 或 `App.tsx`（macOS 启动时设置窗口标题）。
- **文档**：`docs/HOW_TO_REBASE_UPSTREAM.md`。
- **依赖**：无新增依赖；复用 `@tauri-apps/api/window` 已有能力与现有 UI 组件（Dialog/Sheet/按钮）。
- **风险**：版本号三处必须一致；vite `define` 注入需同步 TS 声明，否则 `pnpm typecheck` 失败；不修改 identifier 与 auto_launch app_name 以维持 deep-link 与系统启动项。

```

## docs/openspec/changes/ccs-fork-scaffolding/design.md

- Source: docs/openspec/changes/ccs-fork-scaffolding/design.md
- Lines: 1-70
- SHA256: 3ef2d434011af74b4a8a2006b29cd2974ab9ecc44c3831d387166ccc33bab487

```md
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

```

## docs/openspec/changes/ccs-fork-scaffolding/tasks.md

- Source: docs/openspec/changes/ccs-fork-scaffolding/tasks.md
- Lines: 1-40
- SHA256: a71408a523e2c8da65f35455d806fe4ea3feae7723504069351502891b82686c

```md
## 1. 分支与基础设施

- [ ] 1.1 从当前 main 创建分支 `feat/fork-scaffolding`，确认 `git status` 干净、`git log` 与 origin/main 一致
- [ ] 1.2 新增 `docs/HOW_TO_REBASE_UPSTREAM.md`，包含四节：upstream remote 添加、rebase 上游 main 标准流程、冲突处理约定、fork 专属文件白名单（tauri.conf.json 的 productName/version、package.json version、Cargo.toml version、vite.config.ts 的 define、src/config/forkBuild.ts、src/components/devpanel/、docs/HOW_TO_REBASE_UPSTREAM.md 本身、docs/openspec/）

## 2. A 层：版本号与 productName

- [ ] 2.1 `package.json` 的 `version` 改为 `3.19.2-fork.1`
- [ ] 2.2 `src-tauri/Cargo.toml` 的 `version` 改为 `3.19.2-fork.1`
- [ ] 2.3 `src-tauri/tauri.conf.json` 的 `version` 改为 `3.19.2-fork.1`，`productName` 改为 `CC Switch (Fork)`
- [ ] 2.4 `src-tauri/tauri.windows.conf.json` 的窗口 `title` 改为 `CC Switch (Fork)`
- [ ] 2.5 校验三处版本号字符串完全相同，不修改 `identifier`（`com.ccswitch.desktop`）与 `auto_launch.rs` 的 `app_name`（`CC Switch`）

## 3. A 层：编译期常量

- [ ] 3.1 `vite.config.ts` 增加 `define: { __CCS_FORK_BUILD__: JSON.stringify(true) }`
- [ ] 3.2 `src/vite-env.d.ts` 增加 `declare const __CCS_FORK_BUILD__: boolean;`
- [ ] 3.3 新增 `src/config/forkBuild.ts`，导出 `export const IS_FORK_BUILD = __CCS_FORK_BUILD__ as boolean;`
- [ ] 3.4 运行 `pnpm typecheck` 确认无 `__CCS_FORK_BUILD__` 未定义错误

## 4. A 层：macOS 窗口标题

- [ ] 4.1 在 `src/main.tsx` 或 `src/App.tsx` 初始化处，当 `IS_FORK_BUILD` 为 true 时调用 `getCurrentWindow().setTitle("CC Switch (Fork)")`
- [ ] 4.2 确认 import 来源为 `@tauri-apps/api/window`（或项目现有窗口 API 封装），不引入新依赖
- [ ] 4.3 确认 Windows 路径已由 `tauri.windows.conf.json` 写死 title，无需前端处理

## 5. B 层：Dev 预览面板

- [ ] 5.1 新增 `src/components/devpanel/DevPanel.tsx`，仅当 `IS_FORK_BUILD` 为 true 时渲染内容；展示 fork 版本号、构建模式、fork 标识徽章、上游同步状态占位、后续魔改功能占位区
- [ ] 5.2 在 `src/components/settings/SettingsPage.tsx`（或其 footer 区域）加一个 `Fork` 角标按钮，仅当 `IS_FORK_BUILD` 为 true 时渲染，点击打开 DevPanel（复用现有 Dialog/Sheet 组件）
- [ ] 5.3 为 DevPanel 与角标添加必要的 i18n key（zh/en/ja/zh-TW 的 `devpanel.*`），缺失语言可只补 zh 与 en

## 6. 验证与收尾

- [ ] 6.1 运行 `pnpm typecheck` 通过
- [ ] 6.2 运行 `pnpm test:unit` 通过，确认未破坏现有测试
- [ ] 6.3 运行 `pnpm tauri dev`（或至少 `pnpm dev:renderer` + tauri dev）确认：窗口标题显示 `CC Switch (Fork)`，设置页 footer 可见 Fork 角标，点击打开 DevPanel 显示 fork 信息
- [ ] 6.4 确认原版功能不受影响：供应商切换、Skills/MCP/Sessions、代理等入口仍可见可用（手动巡检）
- [ ] 6.5 `comet classic openspec -- validate ccs-fork-scaffolding` 通过
- [ ] 6.6 在 `feat/fork-scaffolding` 分支提交所有改动（commit message 遵循项目 conventional commits 风格，如 `feat(fork): add fork build identity and dev panel`）

```

## docs/openspec/changes/ccs-fork-scaffolding/specs/fork-build-identity/spec.md

- Source: docs/openspec/changes/ccs-fork-scaffolding/specs/fork-build-identity/spec.md
- Lines: 1-61
- SHA256: e8d05a9d3b1748a61de7654b984aa876b72941d27a675e4d23b4f792d603be5f

```md
## Purpose

定义 fork 版 cc-switch 在构建产物、窗口标题、编译期常量上与上游可区分，并提供仅 fork 构建可用的开发预览面板，作为后续魔改功能的集中预览入口。

## ADDED Requirements

### Requirement: Fork 构建版本号标识

fork 构建 SHALL 在 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 三处使用一致的版本号，且版本号 MUST 以 `-fork.N` 后缀标记（N 为从 1 起的整数），使 fork 构建产物与上游可通过版本号区分。

#### Scenario: 三处版本号一致且带 fork 后缀
- **WHEN** 检查 fork 构建的版本号配置
- **THEN** `package.json` 的 `version`、`src-tauri/Cargo.toml` 的 `version`、`src-tauri/tauri.conf.json` 的 `version` 三者字符串完全相同，且匹配 `^\d+\.\d+\.\d+-fork\.\d+$`

### Requirement: Fork 窗口标题区分

fork 构建的窗口标题 MUST 显示为 `CC Switch (Fork)`，使运行中的 fork 与上游在任务栏/Dock/窗口标题上可区分。macOS Overlay 标题栏 SHALL 在启动时动态设置窗口标题；Windows Visible 标题栏 SHALL 在 `tauri.windows.conf.json` 写死。`identifier`（`com.ccswitch.desktop`）与 `auto_launch` 的 `app_name`（`CC Switch`）MUST 保持不变，避免 deep-link `ccswitch://` 与系统启动项失效。

#### Scenario: macOS 窗口标题
- **WHEN** 在 macOS 上启动 fork 构建
- **THEN** 窗口标题显示为 `CC Switch (Fork)`

#### Scenario: Windows 窗口标题
- **WHEN** 在 Windows 上启动 fork 构建
- **THEN** 窗口标题显示为 `CC Switch (Fork)`

#### Scenario: identifier 与启动项不变
- **WHEN** 检查 fork 构建配置
- **THEN** `identifier` 仍为 `com.ccswitch.desktop`，`auto_launch.rs` 中 `app_name` 仍为 `CC Switch`

### Requirement: Fork 编译期常量

fork 构建 SHALL 通过 vite `define` 注入编译期全局常量 `__CCS_FORK_BUILD__`（boolean），在 fork 仓库内恒为 `true`。前端 SHALL 通过 `src/config/forkBuild.ts` 导出的 `IS_FORK_BUILD` 访问该常量，不得在业务代码中直接引用裸常量。TypeScript 类型声明 MUST 同步声明 `__CCS_FORK_BUILD__: boolean`，保证 `pnpm typecheck` 通过。

#### Scenario: 常量在 fork 构建为 true
- **WHEN** 编译期解析 `__CCS_FORK_BUILD__`
- **THEN** 其值为 `true`，且 `IS_FORK_BUILD` 导出为 `true`

#### Scenario: 类型声明存在
- **WHEN** 运行 `pnpm typecheck`
- **THEN** 不出现 `__CCS_FORK_BUILD__` 未定义的类型错误

### Requirement: Dev 预览面板仅 fork 可用

Dev 预览面板（DevPanel）SHALL 仅在 `IS_FORK_BUILD` 为 `true` 时渲染并暴露入口。面板入口 SHALL 放置在设置页 footer 的一个不显眼 `Fork` 角标按钮上，点击后打开 DevPanel。面板 SHALL 展示 fork 信息：版本号、构建模式、fork 标识徽章、上游同步状态占位、后续魔改功能占位区。当 `IS_FORK_BUILD` 为 `false` 时，入口与面板 MUST 不可见且不可达。

#### Scenario: fork 构建显示入口与面板
- **WHEN** 在 fork 构建的设置页 footer 点击 `Fork` 角标
- **THEN** DevPanel 打开并展示 fork 信息

#### Scenario: 上游构建不显示入口
- **WHEN** 在 `IS_FORK_BUILD` 为 `false` 的构建中查看设置页
- **THEN** footer 不出现 `Fork` 角标，DevPanel 不可达

### Requirement: 上游同步工作流文档

fork 仓库 SHALL 包含 `docs/HOW_TO_REBASE_UPSTREAM.md`，说明 upstream remote 添加、rebase 上游 main 的标准流程、冲突处理约定、fork 专属文件白名单（tauri.conf.json 的 productName/version、package.json version、Cargo.toml version、vite.config.ts 的 define、src/config/forkBuild.ts、src/components/devpanel/）。

#### Scenario: 文档存在且覆盖必要章节
- **WHEN** 检查 `docs/HOW_TO_REBASE_UPSTREAM.md`
- **THEN** 文档包含 upstream remote 添加、rebase 流程、冲突处理约定、fork 专属文件白名单四个部分

```
