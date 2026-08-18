# Verification Report: ccs-fork-scaffolding

> change: ccs-fork-scaffolding
> verify_mode: full
> 产物语言：zh-CN
> 验证日期：2026-08-18

## 1. 验证范围

本 change 为 fork 版 cc-switch 建立魔改基础设施（fork 构建标识 + Dev 预览面板 + 上游 rebase 工作流文档）。验证覆盖 spec `fork-build-identity` 的 5 个 Requirement。

## 2. 验证命令与结果

### 2.1 类型检查
- 命令：`pnpm typecheck`
- 结果：EXIT 0（tsc --noEmit 无错误）
- 覆盖：`__CCS_FORK_BUILD__` 类型声明、IS_FORK_BUILD 导出、DevPanel、SettingsPage 注入

### 2.2 单元测试
- 命令：`pnpm test:unit`
- 结果：131/131 文件通过，987/987 测试通过
- 基线对比：基线 `fd14f9c4`（上游 main）同样 987/987 pass，本 change 无回归
- 修复过程：
  - 初次引入 `__CCS_FORK_BUILD__` 编译期常量后，vitest 未注入该常量导致 7 个测试失败 → 修复 `vitest.config.ts` 增加 define（commit ebcda951）
  - 修复后仍有 7 个 App.test.tsx 失败（基线绿，本 change 回归），根因是 `App.tsx` 的 setTitle useEffect 在 jsdom 测试环境调用真实 `getCurrentWindow()` → 修复加 `isTauri()` 守卫 + tauriMocks 补 `isTauri` 导出（commit 8a63ccf8）
  - 修复后 987/987 pass

### 2.3 OpenSpec 验证
- 命令：`comet classic openspec -- validate ccs-fork-scaffolding`
- 结果：Change 'ccs-fork-scaffolding' is valid

### 2.4 前端 dev server
- 命令：`pnpm dev:renderer`（vite dev server，端口 3000）
- 结果：启动无错，forkBuild 模块编译期常量 `IS_FORK_BUILD = true` 正确注入
- 完整 `pnpm tauri dev` Rust 1.95 toolchain 要求，本机首次无 rustup；已通过 Homebrew 装 rustup + 1.95 toolchain 后验证

### 2.5 本机 dev 模式巡检（用户手动）
- 命令：`pnpm dev:fork`（dev 专用 identifier + 独立配置目录，不污染原版 CC Switch）
- 结果：通过
  - 独立窗口 `CC Switch (Fork Dev)` 启动正常
  - 配置目录隔离（`CC_SWITCH_TEST_HOME=~/.cc-switch-fork-dev`），原版 `~/.cc-switch` 不受影响
  - Rust 后端数据库迁移 v0→v17 正常完成，5 个官方 provider seed 成功
  - 原版 CC Switch 与 fork dev 版可并存（不同 identifier 绕过 single_instance 锁）

## 3. Spec Requirement 合规

| Requirement | 状态 | 证据 |
|---|---|---|
| 1. Fork 构建版本号标识 | PASS | package.json / Cargo.toml / tauri.conf.json 三处 `3.19.2-fork.1` 一致，匹配 `^\d+\.\d+\.\d+-fork\.\d+$`；Cargo.lock 同步 |
| 2. Fork 窗口标题区分 | PASS | macOS 动态 setTitle（App.tsx，IS_FORK_BUILD + isTauri 双守卫）；Windows 写死 title（tauri.windows.conf.json）；identifier `com.ccswitch.desktop` 与 auto_launch `app_name "CC Switch"` 未变 |
| 3. Fork 编译期常量 | PASS | vite/vitest define 一致注入 `__CCS_FORK_BUILD__: true`；`src/config/forkBuild.ts` 导出 IS_FORK_BUILD；vite-env.d.ts `declare global` 类型声明；typecheck 通过 |
| 4. Dev 预览面板仅 fork 可用 | PASS | DevPanel 与 SettingsPage 角标均 `{IS_FORK_BUILD && ...}` 守卫；上游构建 IS_FORK_BUILD 不存在→不渲染；本机 dev:fork 巡检确认角标可见、DevPanel 弹出显示 fork 信息 |
| 5. 上游同步工作流文档 | PASS | `docs/HOW_TO_REBASE_UPSTREAM.md` 四节齐全（upstream remote / rebase 流程 / 冲突处理 / 白名单）；白名单覆盖本 change 全部 16 个改动文件 |

## 4. 额外验证：dev 模式隔离基础设施

为支持开发期巡检不污染原版，新增 dev 专用配置（commit 2934dfec）：
- `src-tauri/tauri.dev.conf.json`：identifier `com.ccswitch.fork.dev`，productName/title `CC Switch (Fork Dev)`
- `package.json` `dev:fork` script：`CC_SWITCH_TEST_HOME="$HOME/.cc-switch-fork-dev" pnpm tauri dev -c src-tauri/tauri.dev.conf.json`
- 效果：dev 模式用独立 identifier（绕过 single_instance 锁）+ 独立配置目录（不碰 `~/.cc-switch`），原版 CC Switch 与 fork dev 版可并存
- 该文件已纳入 fork 专属白名单

## 5. 最终 code review 结论

- review_mode: standard，最终轻量 code review 结论：PASS_WITH_SUGGESTIONS
- 无 CRITICAL
- 1 个 IMPORTANT（白名单未覆盖全部改动文件）→ final-fix 修复（commit 3d942cca 补全白名单）
- 2 个 SUGGESTION（DevPanel 防御性 IS_FORK_BUILD 守卫、FORK_VERSION 手动同步）→ 接受，不阻塞，记录于此

## 6. 提交清单（9 commits，分支 feat/fork-scaffolding）

- 6db194b7 docs(fork): add upstream rebase workflow and ignore tool artifacts
- a58d4c37 feat(fork): bump version to 3.19.2-fork.1 and rename product to CC Switch (Fork)
- 42e02284 feat(fork): inject __CCS_FORK_BUILD__ compile-time constant
- f46065f1 feat(fork): set macOS window title to CC Switch (Fork) on startup
- 3bb42bac feat(fork): add DevPanel and settings footer entry
- ebcda951 fix(fork): define __CCS_FORK_BUILD__ in vitest config
- 8a63ccf8 fix(fork): guard setTitle with isTauri in test/non-tauri env
- 3d942cca docs(fork): complete rebase whitelist with all fork-touched files
- 2934dfec feat(fork): add dev config with isolated identifier and config dir

## 7. 验证结论

**PASS** — 全部 5 个 spec Requirement 满足，typecheck/test:unit/openspec validate 通过，本机 dev 巡检通过，无回归（987/987 与基线一致）。可进入归档阶段。
