## Context

fork 当前把应用名/窗口标题定为 `CC Switch (Fork)` 以便与上游运行实例区分（见 archive `2026-08-18-ccs-fork-scaffolding`）。用户希望安装后系统里看到的应用名就是 `CC Switch`。可区分性本就有两条独立通道：版本号 fork 后缀（`-fork.N` / 当前 `-1`）与 `IS_FORK_BUILD` 门控的 fork 专属行为（预设过滤、DevPanel）。应用名后缀只是第三条「视觉提示」通道，去掉不影响 fork 与上游的实质性区分。

关键现状约束：
- `tauri.conf.json:3` `productName: "CC Switch (Fork)"` —— 决定打包产物名/安装后系统显示名。
- `tauri.windows.conf.json:7` `title: "CC Switch (Fork)"` —— Windows Visible 标题栏写死值。
- `App.tsx:210` macOS Overlay 启动 `getCurrentWindow().setTitle("CC Switch (Fork)")` —— macOS Overlay 标题栏动态设置。
- `tauri.dev.conf.json` `productName/title: "CC Switch (Fork Dev)"` —— dev 预览环境，需保留以隔离本机正式版数据。
- `identifier com.ccswitch.desktop`、`auto_launch.rs app_name "CC Switch"` —— 本就不带后缀，不动；改它们会破坏 deep-link 与启动项。
- `package.json` / `Cargo.toml` 版本号（当前 `3.20.0-1`）—— 不动，仍可作为 fork 标识（spec 原本要求 `-fork.N`，当前是 `-1`，属既有状态，本次不强制改回）。

## Goals / Non-Goals

**Goals:**
- 打包后系统显示的应用名为 `CC Switch`，窗口标题为 `CC Switch`。
- dev 预览构建仍能与本机正式版区分。
- deep-link 与启动项不受影响。

**Non-Goals:**
- 不改 `identifier`、`auto_launch.app_name`、版本号、`IS_FORK_BUILD` 常量、DevPanel、预设过滤等 fork 专属机制。
- 不改 dev 预览构建（`tauri.dev.conf.json`）的应用名。
- 不重构窗口标题设置方式（仍 macOS 动态 setTitle + Windows 写死 title）。

## Decisions

### D1: 应用名/窗口标题统一为 `CC Switch`，去掉 `(Fork)` 后缀
- `tauri.conf.json` `productName` → `CC Switch`。
- `tauri.windows.conf.json` `title` → `CC Switch`。
- `App.tsx` `setTitle` 字符串 → `"CC Switch"`。
- 备选：保留 `productName` 为 `CC Switch` 但窗口标题留 `(Fork)` —— 不一致更别扭，且用户明确要应用名就是 `CC Switch`，一并统一最干净。
- macOS 卸载重装：旧 `CC Switch (Fork)` 安装与新 `CC Switch` 同 identifier，安装会覆盖，属预期（deep-link/启动项不变）。

### D2: dev 预览构建保留 `CC Switch (Fork Dev)`
- `tauri.dev.conf.json` 不动。dev 预览用独立 identifier `com.ccswitch.fork.dev` 与独立 test home `~/.cc-switch-fork-dev`，本就是为隔离本机正在用的正式版；应用名也保留 `(Fork Dev)` 提示，避免在 dev 里误操作正式版数据。这是运行时安全护栏，不因正式构建改名而弱化。

### D3: 同步更新文档与既有 spec
- 既有主 spec `docs/openspec/specs/fork-build-identity/spec.md` 的「Fork 窗口标题区分」Requirement 由本次 delta `MODIFIED` 覆盖，归档时合并主 spec。
- `docs/HOW_TO_REBASE_UPSTREAM.md` 白名单里 `tauri.windows.conf.json` 备注的「fork 标识 "CC Switch (Fork)"」、`tauri.conf.json` 备注更新为反映新值 `CC Switch`（dev 文件保留 `(Fork Dev)`）。
- README「构建标识与开发预览」节里「应用标题与 `productName` 改为 `CC Switch (Fork)`」措辞更新为「应用标题与 `productName` 为 `CC Switch`（与上游一致），fork 仅通过版本号后缀与 `IS_FORK_BUILD` 行为区分」。

## Risks / Trade-offs

- [fork 与上游运行实例在任务栏/Dock 视觉上不再可文字区分] → 仍可凭版本号（About 页 / 帮助 → 版本）与 fork 专属行为区分；用户已明确接受（用户要的就是应用名一致）。
- [同 identifier 覆盖安装可能让用户以为装的是上游版] → 版本号仍带 fork 标识（当前 `-1`，spec 契约为 `-fork.N`），About/版本页可查；不构成功能风险。
- [文档与 spec 措辞漂移] → D3 一并同步，避免后续 rebase 或阅读歧义。

## Migration Plan

直接在 `main` 分支实现（Level 1 本地低风险配置改动）。回滚即还原 `tauri.conf.json` / `tauri.windows.conf.json` / `App.tsx` 三处字符串。

## Open Questions

无。
