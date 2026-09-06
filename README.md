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

### 10. 供应商连通性测试

供应商列表新增连通性测试能力，直接用供应商配置发起真实请求，验证可用性与延迟：

- 测试弹窗为单一模型表格：打开即加载全部模型（待测试态），支持行勾选 / 表头全选（含半选态）与 5 格统计卡；一轮测完自动勾选失败项。
- 实时拉取模型：通过 `/v1/models` 拉取，采用「搜索添加」多选选择器把模型加入测试表格并自动勾选；拉取结果仅会话内有效，不写回供应商配置。
- 勾选即测试范围：逐模型独立并行请求 + 行级流式更新结果。
- 后端直连执行器（reqwest + SSE 流式）：总超时 / 空闲超时控制，度量首字延迟等指标并识别错误类型。
- 探测目标按供应商 API 格式对齐真实转发链路：按 anthropic / openai_chat / openai_responses / gemini_native 分派端点并做协议转换，鉴权头与 adapter 出站请求同源。
- 批量探针徽标：供应商列表批量检测入口在 header 图标组，逐个供应商打徽标显示结果，可随时停止（runId 代次守卫丢弃在途迟到写入）。
- 测试参数与默认测试模型持久化；打开弹窗自动勾选已保存默认模型 → 供应商当前使用模型 → 清单首个。
- 移除上游旧的 stream_check 可达性探测全链路（保留表结构）。
- zh-CN / en / zh-TW / ja 四语言文案。

### 11. 供应商双官网链接

- 供应商支持第二个官网链接（`websiteUrl2`，SQLite schema v18→v19 幂等迁移，旧 config.json 同步迁移）。
- 统一供应商表单新增第二个链接输入框（zod 同第一链接规则校验）；主页供应商卡片两个链接横排展示，逐链接打开默认浏览器，同值去重。
- 复制供应商、搜索匹配、统一供应商生成 claude/codex/gemini 时第二链接随行透传。

### 12. 其他小幅调整

- Claude 表单高级面板仅在模型映射真正自定义时自动展开；快捷设置产生的统一映射（含 1M 标记剥离后比较）不再触发展开。
- 修复模型快捷切换弹窗内模型列表滚轮无法滚动的问题。
- 兜底模型快捷设置按钮与模型输入框右缘对齐。

### 13. 托盘图标左键切换主窗口

- 托盘图标左键单击切换主窗口显隐：窗口隐藏或最小化时单击即显示、置前并聚焦；窗口可见时再次单击隐藏到托盘，稳定往返。
- 隐藏时平台处理与「关闭到托盘」完全一致：macOS 同步隐藏 Dock 图标、Windows 隐藏任务栏项；显示时还原并聚焦，与「打开主界面」菜单项行为一致。
- 左键不再弹出托盘菜单，每次点击仅触发一次切换；右键单击仍弹出托盘菜单（打开主界面 / 官网 / 供应商与项目切换 / 轻量模式 / 退出），菜单结构与行为不变。
- 仅 macOS 与 Windows 生效；Linux 系统托盘不产生点击事件，行为保持现状（平台限制）。

---

## 版本号

采用 `3.20.0-1` 形式（合法 semver，且 Windows MSI 的第 4 位版本号为 1），与上游版本号明确区分。

## 与上游同步

fork 始终保持可干净 rebase 到上游 `main`。同步流程、冲突处理约定与 fork 专属文件白名单见：

👉 [docs/HOW_TO_REBASE_UPSTREAM.md](docs/HOW_TO_REBASE_UPSTREAM.md)
