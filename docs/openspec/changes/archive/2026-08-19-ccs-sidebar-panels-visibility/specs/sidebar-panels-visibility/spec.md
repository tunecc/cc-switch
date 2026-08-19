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
