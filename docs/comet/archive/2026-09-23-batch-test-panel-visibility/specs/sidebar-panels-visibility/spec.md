# 完整目标规格：sidebar-panels-visibility

## 概述

用户通过「设置 → 应用可见性 → 侧边面板」控制主页顶栏右侧面板入口的显示。可控制的入口为 Skills、会话记录、MCP 服务器、提示词管理、批量检测。

## 数据

`AppSettings.visibleSidebarPanels`（后端字段 `visible_sidebar_panels`）结构为：

```text
{ skills: boolean; sessions: boolean; mcp: boolean; prompts: boolean; batchTest: boolean }
```

每个字段默认 `true`。设置整体未配置，或已保存数据缺少其中某个字段时，该字段回退 `true`。

## 设置 UI

设置页应用可见性区域的「侧边面板」开关组列出五个开关：Skills、会话记录、MCP 服务器、提示词管理、批量检测。开关与应用可见性按钮同一交互：开启为高亮，关闭为灰显。点按写入对应字段并立即反映状态。

批量检测开关的文案与主页按钮标题同源：简体「批量检测」、繁体「批量檢測」、英文「Batch test」、日文「一括テスト」。

## 顶栏渲染

主页供应商视图顶栏右侧入口同时满足能力守卫与可见性设置才渲染：

- Skills：`hasSkillsSupport && visibleSidebarPanels.skills`（hermes 分支为 `visibleSidebarPanels.skills`）
- 会话记录：`hasSessionSupport && visibleSidebarPanels.sessions`（openclaw 分支为 `visibleSidebarPanels.sessions`）
- MCP：`hasMcpSupport && visibleSidebarPanels.mcp`
- 提示词管理：`visibleSidebarPanels.prompts`
- 批量检测：`shouldShowTestEntry(activeApp) && visibleSidebarPanels.batchTest`

`shouldShowTestEntry` 只对 claude、codex 返回 true。因此 gemini、opencode、openclaw、hermes、pi、grokbuild、claude-desktop、mcode 等应用的顶栏不出现批量检测按钮，与 `batchTest` 取值无关。

hermes 与 openclaw 的专属顶栏分支没有批量检测按钮，本能力不给它们新增。

## 隐藏时的探测

`batchTest` 变为 false 时，如果批量连通性探测正在进行，探测停止。再次打开开关不会自动重新开始探测。

隐藏只去掉顶栏入口。供应商卡片上单个供应商的连通性测试按钮不受 `batchTest` 影响。本设置不拦截路由，也不改变批量探测的请求、结果和展示。
