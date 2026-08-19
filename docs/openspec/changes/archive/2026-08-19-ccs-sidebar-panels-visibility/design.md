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
