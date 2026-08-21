<div align="center">

# CC Switch (Fork)

### 基于 [farion1231/cc-switch](https://github.com/farion1231/cc-switch) 的个人 fork

[![Version](https://img.shields.io/github/v/release/tunecc/cc-switch?color=blue&label=version)](https://github.com/tunecc/cc-switch/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20x64%20%7C%20macOS%20arm64-lightgrey.svg)](https://github.com/tunecc/cc-switch/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)

本仓库是上游 [CC Switch](https://github.com/farion1231/cc-switch) 的 fork，仅记录**与上游的差别**。
完整功能介绍、使用文档请参考上游 [README](https://github.com/farion1231/cc-switch#readme)。

</div>

---

## 与上游的差别

### 1. 构建标识与开发预览

- 引入编译期常量 `IS_FORK_BUILD`（vite define 注入），所有 fork 专属行为通过它门控，上游构建不受影响。
- 应用标题与 `productName` 为 `CC Switch`（与上游一致），fork 仅通过版本号后缀与 `IS_FORK_BUILD` 行为区分；macOS 窗口标题在 `IS_FORK_BUILD && isTauri()` 双守卫下设置。
- 新增 `dev:fork` 脚本：通过 `CCS_DEV_PANEL=1` + `CC_SWITCH_TEST_HOME=~/.cc-switch-fork-dev` 隔离出一个独立的开发预览环境，**不干扰本机正在使用的正式版 CC Switch**。
- DevPanel 开发面板与 Fork 角标仅在 `dev:fork` 模式下显示（`DEV_PANEL_ENABLED`），正式 build 恒为关闭。

### 2. 预设供应商精简

仅保留各 app 的官方预设，其余第三方预设全部移除；无官方预设的 app 只支持自定义添加。

| App                               | 保留的预设              |
| --------------------------------- | ----------------------- |
| Claude                            | Claude Official         |
| Claude Desktop                    | Claude Desktop Official |
| Codex                             | OpenAI Official         |
| Gemini                            | Google Official         |
| Grok Build                        | Grok Official           |
| OpenCode / OpenClaw / Hermes / Pi | 无预设，仅自定义        |

由 `forkOfficialAllowlist` + `forkPresetFilter` 实现，仅在 fork 构建下生效。

### 3. Claude 表单调整

- 「上游格式 / apiFormat」选择器从折叠的高级面板移到请求地址输入框旁边，同一行展示。
- 删除 apiFormat 的长篇说明文字（老玩家已知用法）。
- 1M 支持新增表头一键全选勾选（tri-state：全选 / 部分选中 / 未选）。

### 4. 模型搜索

从上游主线移植 `SearchableModelPicker`，替换原有的 `ModelDropdown`：

- Claude 表单、Copilot 模型选择、模型输入组件统一改用可搜索的选择器。

### 5. 主页模型展示与快速切换

- 供应商卡片显示当前使用的模型徽标。
- 卡片上一键「拉取模型 → 搜索选择 → 应用到所有角色字段」的快速切换弹窗；Claude 可在此流程内一键追加 1M 标记。
- 新增纯函数模块 `providerModelUtils`（覆盖 Claude / Codex / Gemini / GrokBuild 四类应用的模型读写语义，含 29 个单测）。

### 6. 侧边栏面板显隐设置

设置页新增四个开关，可分别隐藏主页右侧入口：

- Skills（技能）
- MCP servers
- Sessions（会话历史）
- Prompts（提示词管理）

采用紧凑 pill toggle 风格，状态由后端 `AppSettings.visibleSidebarPanels` 持久化。

### 7. 关闭应用内自动更新

- 移除 `tauri-plugin-updater` 依赖及全部自动更新链路。
- 「检查更新」按钮改为直接打开 GitHub Releases 页，由用户手动下载新版。
- 数据库版本过新的恢复界面去掉下载进度条，统一引导到发布页。

### 8. 打包范围

- 仅构建 **Windows x64** 与 **macOS arm64** 两个平台。
- 不做代码签名与 Apple 公证，按未签名分发（macOS 需右键打开绕过 Gatekeeper）。
- CI 不再生成 `latest.json` 与 `.sig` 签名产物。

### 9. 供应商列表右键置顶/置底 与 新增插入第二位

- 供应商列表项右键菜单提供「一键置顶」「一键置底」两个动作，复用现有 `providersApi.updateSortOrder`（后端 `update_providers_sort_order`）落库后重写全部 `sortIndex`，并 invalidate `["providers", appId]` 与 `["failoverQueue", appId]`、刷新托盘菜单——与拖拽排序路径完全一致，不新增后端命令。
- 已在顶部/底部时 `toast.info` 提示且不重复操作；菜单点击外部 / 滚动 / 缩放 / Esc 时自动关闭。
- 右键菜单仅含这两项，不纳入编辑/复制/删除等动作，避免与现有 hover 行内按钮重复；拖拽排序与 hover 行内按钮保持不变。
- 新增供应商（`useAddProviderMutation`，未显式指定 `sortIndex` 的所有添加路径）默认插入到列表**第二位**（index 1）：现有第 0 项保持 `sortIndex=0`、其余项 `sortIndex+1` 让位，新供应商 `sortIndex=1`，同时把所有现有项 `sortIndex` 显式化（解决 `useDragSort` 的 defined-first 排序陷阱，避免新项被排到最前）。
- 空列表新增不触发让位，新供应商落库为首位；复制路径因显式传 `sortIndex` 不受影响。
- 补齐 zh-CN / en / zh-TW / ja 四语言 `quickMove*` 文案（`quickMoveTop` / `quickMoveBottom` / `quickMoveAlreadyTop` / `quickMoveAlreadyBottom`）。

---

## 版本号

采用 `3.20.0-1` 形式（合法 semver，且 Windows MSI 的第 4 位版本号为 1），与上游版本号明确区分。

## 与上游同步

fork 始终保持可干净 rebase 到上游 `main`。同步流程、冲突处理约定与 fork 专属文件白名单见：

👉 [docs/HOW_TO_REBASE_UPSTREAM.md](docs/HOW_TO_REBASE_UPSTREAM.md)
