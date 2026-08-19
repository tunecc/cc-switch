## 1. 类型与默认值

- [x] 1.1 `src/types.ts`：新增 `export interface VisibleSidebarPanels { skills: boolean; sessions: boolean; mcp: boolean }`；`AppSettings` 加 `visibleSidebarPanels?: VisibleSidebarPanels`
- [x] 1.2 `src/config/appConfig.tsx`：新增 `export const DEFAULT_VISIBLE_SIDEBAR_PANELS: VisibleSidebarPanels = { skills: true, sessions: true, mcp: true }`（import VisibleSidebarPanels from @/types 或从 types 导入）

## 2. App.tsx 顶栏按钮叠加

- [x] 2.1 在 App.tsx 计算 `const visibleSidebarPanels = { ...DEFAULT_VISIBLE_SIDEBAR_PANELS, ...settingsData?.visibleSidebarPanels };`（放 visibleApps useMemo 附近）；import DEFAULT_VISIBLE_SIDEBAR_PANELS
- [x] 2.2 Skills 按钮（通用分支）：`hasSkillsSupport` → `hasSkillsSupport && visibleSidebarPanels.skills`（opacity/scale 折叠逻辑沿用）
- [x] 2.3 Sessions 按钮（通用分支 + openclaw 分支两处）：叠加 `&& visibleSidebarPanels.sessions`
- [x] 2.4 MCP 按钮（通用分支 + openclaw 分支两处 `hasMcpSupport &&`）：改为 `hasMcpSupport && visibleSidebarPanels.mcp`
- [x] 2.5 grep 核验 `hasMcpSupport` / `hasSessionSupport` / `hasSkillsSupport` 出现次数与改动覆盖全（不应有遗漏分支）

## 3. 设置 UI

- [x] 3.1 `src/components/settings/AppVisibilitySettings.tsx`：在 app 开关区后加"侧边面板" section，三个 Switch（Skills/Sessions/MCP），`checked` 读 visibleSidebarPanels，onChange 写 `{ visibleSidebarPanels: { ...prev, key: !value } }`；`const visibleSidebarPanels = settings.visibleSidebarPanels ?? DEFAULT_VISIBLE_SIDEBAR_PANELS;`
- [x] 3.2 组件 import Switch 与 DEFAULT_VISIBLE_SIDEBAR_PANELS 类型

## 4. i18n

- [x] 4.1 四 locale 补 `settings.sidebarPanels` 段：title（如 "侧边面板" / "Sidebar Panels"）、skills（"Skills"）、sessions（"会话记录" / "Sessions"）、mcp（"MCP 服务器" / "MCP Servers"），zh/en/ja/zh-TW 齐全，插在 settings.appVisibility 附近

## 5. 验证

- [x] 5.1 `pnpm typecheck` 通过
- [x] 5.2 `pnpm test:unit` 通过（1016/1016 无回归）
- [x] 5.3 `pnpm dev:fork` 巡检：设置页侧边面板三开关默认全开；关 Skills → 顶栏 Wrench 按钮消失；关 Sessions → History 消失；关 MCP → McpIcon 消失；重开恢复；从上次 view 恢复（如曾进 sessions）时面板仍渲染（仅按钮隐藏）
- [x] 5.4 `comet classic openspec -- validate ccs-sidebar-panels-visibility` 通过

## 6. 提交

- [x] 6.1 分支提交（conventional commits，可分 2-3 个提交：类型+默认值 / App+设置UI / i18n）
