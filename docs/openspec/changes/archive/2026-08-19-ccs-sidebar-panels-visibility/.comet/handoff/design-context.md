# Comet Design Handoff

- Change: ccs-sidebar-panels-visibility
- Phase: design
- Mode: compact
- Context hash: 101d7753117ec051ddf3e4873b6a6c2a3f913721b47190323845faff2a2e86b9

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## docs/openspec/changes/ccs-sidebar-panels-visibility/proposal.md

- Source: docs/openspec/changes/ccs-sidebar-panels-visibility/proposal.md
- Lines: 1-30
- SHA256: e8930d67d0c347e70a60f048bd451d16d5b2b37dfed3619644424dc1bab87719

```md
## Why

主页顶栏右侧的功能入口按钮（Skills、Sessions、MCP）对所有 app 常显（受 `hasXxxSupport` 能力守卫，但不受用户偏好控制）。用户希望按需隐藏这些入口，减少顶栏拥挤。复用既有的 `visibleApps` 设置模式，新增侧边面板显隐设置。

## What Changes

- **新增设置字段** `visibleSidebarPanels: { skills: boolean; sessions: boolean; mcp: boolean }`（默认全 true）：
  - `src/types.ts` 定义 `VisibleSidebarPanels` 接口，`AppSettings.visibleSidebarPanels?: VisibleSidebarPanels`。
  - 默认值常量 `DEFAULT_VISIBLE_SIDEBAR_PANELS`（放 `src/config/appConfig.tsx`，与 DEFAULT_VISIBLE_APPS 并列）。
- **App.tsx 顶栏按钮按设置隐藏**：Skills/Sessions/MCP 三按钮在现有 `hasXxxSupport` 守卫基础上，叠加 `visibleSidebarPanels.xxx` 判断（`hasSkillsSupport && visibleSidebarPanels.skills` 等）。Sessions/MCP 在 openclaw 分支与通用分支各有一处（页面渲染逻辑有 OpenClaw 专属分支），两处都需叠加。
- **设置页开关**：`AppVisibilitySettings.tsx` 新增"侧边面板"区，三个 Switch 分别控制 Skills/Sessions/MCP 显隐，写入 `onChange({ visibleSidebarPanels })`。
- **默认行为不变**：默认全 true，未设置/旧数据回退全 true，现有用户零影响。
- **上游构建零影响**：这是通用设置功能（不引入 IS_FORK_BUILD），fork 保留改动便于同步。

## Capabilities

### New Capabilities
- `sidebar-panels-visibility`: 控制主页面顶栏右侧 Skills/Sessions/MCP 面板入口的显示/隐藏。

### Modified Capabilities
<!-- 无。 -->

## Impact

- **类型**：`src/types.ts`（VisibleSidebarPanels + AppSettings.visibleSidebarPanels）。
- **默认值**：`src/config/appConfig.tsx`（DEFAULT_VISIBLE_SIDEBAR_PANELS）。
- **渲染**：`src/App.tsx`（Skills/Sessions/MCP 按钮叠加设置判断，openclaw 分支两处 Sessions/MCP）。
- **设置 UI**：`src/components/settings/AppVisibilitySettings.tsx`（新增开关区）。
- **i18n**：`settings.sidebarPanels.*` 段（title/description/skills/sessions/mcp），4 locale。
- **风险**：顶栏按钮有 openclaw 特殊分支（openclaw 走专属 view 集，Sessions 在 openclaw 分支也在），需两处都叠加避免遗漏；默认值回退逻辑确保旧数据兼容。

```

## docs/openspec/changes/ccs-sidebar-panels-visibility/design.md

- Source: docs/openspec/changes/ccs-sidebar-panels-visibility/design.md
- Lines: 1-38
- SHA256: c6918674287d403167233ac2a16df2926972de1d1fe3b8b303fe817454f7efb5

```md
## Context

App.tsx 顶栏右侧按钮区：通用分支与 openclaw 分支各渲染 Skills（Wrench）/ Sessions（History）/ MCP（McpIcon）按钮，采用 `hasXxxSupport` 能力守卫（hasSkillsSupport/hasSessionSupport/hasMcpSupport，约 325-335 行）与部分内联条件（`hasMcpSupport &&`、`hasSessionSupport ? opacity... : hidden`）。AppSettings 已有 `visibleApps` 结构（src/types.ts:403 + DEFAULT_VISIBLE_APPS in appConfig.tsx + AppVisibilitySettings 开关）。App.tsx 已有 `visibleApps` 的 useMemo（约 224-229 行）读取 settingsData。

## Goals / Non-Goals

**Goals:** 新增 visibleSidebarPanels 设置（skills/sessions/mcp 显隐），顶栏三按钮叠加设置，设置页加开关，默认全 true 零影响。
**Non-Goals:** 不拦截路由（仅按钮显隐）；不改 prompts/其他按钮；不动后端（settings 走既有自动保存）。

## Decisions

### D1: 复用 visibleApps 模式扩展
- `src/types.ts`：`export interface VisibleSidebarPanels { skills: boolean; sessions: boolean; mcp: boolean }`；`AppSettings.visibleSidebarPanels?: VisibleSidebarPanels`。
- `src/config/appConfig.tsx`：`export const DEFAULT_VISIBLE_SIDEBAR_PANELS: VisibleSidebarPanels = { skills: true, sessions: true, mcp: true }`。
- App.tsx：`const visibleSidebarPanels = { ...DEFAULT_VISIBLE_SIDEBAR_PANELS, ...settingsData?.visibleSidebarPanels };`（useMemo 或直接，与 visibleApps 风格一致；注意 undefined/false 覆盖——用 `...spread` 后 false 会正确覆盖 true，undefined 不覆盖）。

### D2: 顶栏按钮叠加
Skills 按钮（通用分支）：`hasSkillsSupport` → `hasSkillsSupport && visibleSidebarPanels.skills`（opacity/scale 折叠逻辑沿用）。Sessions 按钮（通用 + openclaw 分支两处）：`hasSessionSupport && visibleSidebarPanels.sessions` / openclaw 分支内联 `&& visibleSidebarPanels.sessions`。MCP 按钮（通用 + openclaw 分支两处 `hasMcpSupport &&`）：改为 `hasMcpSupport && visibleSidebarPanels.mcp`。**两处都要改**（通用分支 + openclaw 专属分支）。

### D3: 设置 UI
AppVisibilitySettings.tsx 在 app 开关区后加"侧边面板" section：三个开关（Switch 组件）标签 Skills/Sessions/MCP，`checked={visibleSidebarPanels.xxx}`，onChange 写 `{ visibleSidebarPanels: { ...prev, [key]: !checked } }`。`const visibleSidebarPanels = settings.visibleSidebarPanels ?? DEFAULT_VISIBLE_SIDEBAR_PANELS;`。

### D4: i18n
`settings.sidebarPanels.title/description` + `settings.sidebarPanels.skills/sessions/mcp`（zh/en/ja/zh-TW，title/description 中文：标题/如何滚动不必要，只需三个开关 label + 区标题）。

## Risks / Trade-offs

- openclaw 分支遗漏 → D2 明确两处；grep `hasMcpSupport`/`hasSessionSupport` 出现次数核验。
- 旧数据 undefined → spread 后回退 true（undefined 不覆盖，false 覆盖 true 皆正确）。
- 不拦截路由 → 已由 spec Scenario 覆盖（按钮隐藏但 view 仍可渲染）。

## Migration Plan

feat/sidebar-panels-visibility 分支实施，dev:fork 巡检三开关关闭后按钮消失、路由仍可进（如从上次 view 恢复）。回滚删分支。

## Open Questions

无。

```

## docs/openspec/changes/ccs-sidebar-panels-visibility/tasks.md

- Source: docs/openspec/changes/ccs-sidebar-panels-visibility/tasks.md
- Lines: 1-32
- SHA256: 452a7ae43570c94858d45b7848242602096f6c556e236fceef6a82ad4c8393fb

```md
## 1. 类型与默认值

- [ ] 1.1 `src/types.ts`：新增 `export interface VisibleSidebarPanels { skills: boolean; sessions: boolean; mcp: boolean }`；`AppSettings` 加 `visibleSidebarPanels?: VisibleSidebarPanels`
- [ ] 1.2 `src/config/appConfig.tsx`：新增 `export const DEFAULT_VISIBLE_SIDEBAR_PANELS: VisibleSidebarPanels = { skills: true, sessions: true, mcp: true }`（import VisibleSidebarPanels from @/types 或从 types 导入）

## 2. App.tsx 顶栏按钮叠加

- [ ] 2.1 在 App.tsx 计算 `const visibleSidebarPanels = { ...DEFAULT_VISIBLE_SIDEBAR_PANELS, ...settingsData?.visibleSidebarPanels };`（放 visibleApps useMemo 附近）；import DEFAULT_VISIBLE_SIDEBAR_PANELS
- [ ] 2.2 Skills 按钮（通用分支）：`hasSkillsSupport` → `hasSkillsSupport && visibleSidebarPanels.skills`（opacity/scale 折叠逻辑沿用）
- [ ] 2.3 Sessions 按钮（通用分支 + openclaw 分支两处）：叠加 `&& visibleSidebarPanels.sessions`
- [ ] 2.4 MCP 按钮（通用分支 + openclaw 分支两处 `hasMcpSupport &&`）：改为 `hasMcpSupport && visibleSidebarPanels.mcp`
- [ ] 2.5 grep 核验 `hasMcpSupport` / `hasSessionSupport` / `hasSkillsSupport` 出现次数与改动覆盖全（不应有遗漏分支）

## 3. 设置 UI

- [ ] 3.1 `src/components/settings/AppVisibilitySettings.tsx`：在 app 开关区后加"侧边面板" section，三个 Switch（Skills/Sessions/MCP），`checked` 读 visibleSidebarPanels，onChange 写 `{ visibleSidebarPanels: { ...prev, key: !value } }`；`const visibleSidebarPanels = settings.visibleSidebarPanels ?? DEFAULT_VISIBLE_SIDEBAR_PANELS;`
- [ ] 3.2 组件 import Switch 与 DEFAULT_VISIBLE_SIDEBAR_PANELS 类型

## 4. i18n

- [ ] 4.1 四 locale 补 `settings.sidebarPanels` 段：title（如 "侧边面板" / "Sidebar Panels"）、skills（"Skills"）、sessions（"会话记录" / "Sessions"）、mcp（"MCP 服务器" / "MCP Servers"），zh/en/ja/zh-TW 齐全，插在 settings.appVisibility 附近

## 5. 验证

- [ ] 5.1 `pnpm typecheck` 通过
- [ ] 5.2 `pnpm test:unit` 通过（1016/1016 无回归）
- [ ] 5.3 `pnpm dev:fork` 巡检：设置页侧边面板三开关默认全开；关 Skills → 顶栏 Wrench 按钮消失；关 Sessions → History 消失；关 MCP → McpIcon 消失；重开恢复；从上次 view 恢复（如曾进 sessions）时面板仍渲染（仅按钮隐藏）
- [ ] 5.4 `comet classic openspec -- validate ccs-sidebar-panels-visibility` 通过

## 6. 提交

- [ ] 6.1 分支提交（conventional commits，可分 2-3 个提交：类型+默认值 / App+设置UI / i18n）

```

## docs/openspec/changes/ccs-sidebar-panels-visibility/specs/sidebar-panels-visibility/spec.md

- Source: docs/openspec/changes/ccs-sidebar-panels-visibility/specs/sidebar-panels-visibility/spec.md
- Lines: 1-39
- SHA256: c9212638e2d8a039709479b6e151b538aad93d8fe110c94c6eac0f7c72fe4c21

```md
## Purpose

控制主页顶栏右侧 Skills/Sessions/MCP 面板入口的显示与隐藏。

## ADDED Requirements

### Requirement: 侧边面板显隐设置

系统 SHALL 支持通过 `AppSettings.visibleSidebarPanels`（`{ skills: boolean; sessions: boolean; mcp: boolean }`）控制主页面顶栏 Skills/Sessions/MCP 三个入口的显示。默认值 SHALL 为全 true。设置未定义或为旧数据时 SHALL 回退全 true。

#### Scenario: 默认全部显示
- **WHEN** 用户未配置 visibleSidebarPanels（或旧数据缺失）
- **THEN** Skills/Sessions/MCP 入口均显示（与现状一致）

#### Scenario: 隐藏指定入口
- **WHEN** 用户设置 visibleSidebarPanels.skills 为 false
- **THEN** 顶栏 Skills 按钮隐藏，其余按钮不受影响

### Requirement: 入口渲染叠加设置

Skills/Sessions/MCP 按钮的渲染 SHALL 同时满足能力守卫与可见性设置：`hasXxxSupport && visibleSidebarPanels.xxx`。OpenClaw 专属分支中的 Sessions/MCP 按钮 SHALL 同样叠加设置。已隐藏的入口对应的视图（skills/sessions/mcp）不可通过按钮导航，但通过其他方式（如已有当前 view 持久化从 LOCAL_STORAGE 恢复）进入 SHALL 仍渲染对应面板（本要求只控制按钮显隐，不拦截路由）。

#### Scenario: 能力守卫与设置叠加
- **WHEN** app 支持 Skills 且 visibleSidebarPanels.skills 为 false
- **THEN** Skills 按钮隐藏
- **WHEN** app 不支持 Skills（如 openclaw）
- **THEN** Skills 按钮本就隐藏（能力守卫），与设置无关

#### Scenario: 设置不拦截路由
- **WHEN** visibleSidebarPanels.sessions 为 false 但当前 view 已恢复为 sessions
- **THEN** 会话面板仍渲染（仅按钮隐藏）

### Requirement: 设置 UI

设置页的 App 可见性区域 SHALL 提供"侧边面板"开关组，用三个 Switch 分别控制 Skills/Sessions/MCP，写入 `visibleSidebarPanels`，并显示当前开关状态。

#### Scenario: 切换开关
- **WHEN** 用户在设置页关闭 Skills 开关
- **THEN** 写入 visibleSidebarPanels.skills=false，保存后顶栏 Skills 按钮隐藏

```
