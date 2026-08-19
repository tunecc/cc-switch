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
