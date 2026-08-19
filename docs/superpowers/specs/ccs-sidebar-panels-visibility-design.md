---
comet_change: ccs-sidebar-panels-visibility
role: technical-design
canonical_spec: openspec
archived-with: 2026-08-19-ccs-sidebar-panels-visibility
status: final
---

# Design Doc: ccs-sidebar-panels-visibility

> OpenSpec change: `ccs-sidebar-panels-visibility`
> 产物语言：zh-CN
> 通用设置功能，不引入 IS_FORK_BUILD

## 1. 背景与目标

主页顶栏 Skills/Sessions/MCP 按钮常显（仅能力守卫），用户希望可隐藏。复用 visibleApps 设置模式，新增 visibleSidebarPanels（skills/sessions/mcp 三开关，默认全 true），顶栏按钮叠加设置。**不拦截路由**（仅按钮显隐）。

**非目标**：不改 prompts 等按钮；不拦截路由；不动后端（走既有 settings 自动保存）。

## 2. 技术决策

### D1: 类型 + 默认值
- `src/types.ts`：`VisibleSidebarPanels { skills; sessions; mcp }`；`AppSettings.visibleSidebarPanels?`
- `src/config/appConfig.tsx`：`DEFAULT_VISIBLE_SIDEBAR_PANELS = { all true }`

### D2: 顶栏叠加（关键：openclaw 分支两处都要改）
`const visibleSidebarPanels = { ...DEFAULT_VISIBLE_SIDEBAR_PANELS, ...settingsData?.visibleSidebarPanels };`（spread 保证 undefined 不覆盖、false 覆盖 true）。
- Skills（通用分支）：`hasSkillsSupport && visibleSidebarPanels.skills`
- Sessions（通用 + openclaw 分支）：叠加 `&& visibleSidebarPanels.sessions`
- MCP（通用 + openclaw 分支 `hasMcpSupport &&`）：`hasMcpSupport && visibleSidebarPanels.mcp`
grep 核验无遗漏分支。

### D3: 设置 UI
AppVisibilitySettings.tsx app 开关区后加"侧边面板" section，三个 Switch，写 spread 更新 visibleSidebarPanels。

### D4: i18n
settings.sidebarPanels.{title, skills, sessions, mcp} 四语言。

## 3. 实施方案

1. types.ts + appConfig.tsx 默认值
2. App.tsx：visibleSidebarPanels 计算 + 三按钮两分支叠加
3. AppVisibilitySettings.tsx 开关区
4. i18n 4 locale
5. 验证：typecheck / test:unit 1016 / dev:fork 巡检三开关效果 + 路由仍可恢复 / validate

## 4. 风险与缓解

- openclaw 分支遗漏 → 明确两处 + grep hasMcpSupport/hasSessionSupport 出现次数核验
- 旧数据 undefined → spread 回退 true
- 不拦截路由 → spec Scenario 覆盖（按钮隐藏但 view 仍渲染）

## 5. 验收

spec 3 Requirement：设置字段默认全 true 回退 / 入口渲染叠加设置（两分支）/ 设置 UI 三开关。

## 6. 任务分解

详见 OpenSpec tasks.md（6 组 13 任务）。
