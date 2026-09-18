# 目标

把 fork（origin = tunecc/cc-switch）的 main 分支同步到上游 farion1231/cc-switch 的最新 main（v3.20.3，基 f3b18df1 → upstream HEAD 06082e18，33 个新提交），完整保留 fork 全部本地魔改；同时把主页左上角 "CC Switch" 品牌链接的跳转从 `https://ccswitch.io` 改为 `https://github.com/farion1231/cc-switch`。

# 范围

- 按 `docs/HOW_TO_REBASE_UPSTREAM.md` 执行 `git rebase upstream/main`，按 §3 约定解决全部冲突。
- 版本号同步为 `3.20.3-1`（`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 cc-switch 条目）。
- 左上角品牌跳转改造：`src/components/proxy/RoutingActivationBrand.tsx` 的 `motion.a` href 由 `https://ccswitch.io` 改为 `https://github.com/farion1231/cc-switch`，其余品牌入口（托盘「打开官网」、设置页「官方网站」按钮、README）不在本次范围。
- 按 §4 更新 `docs/HOW_TO_REBASE_UPSTREAM.md` 白名单：把 `RoutingActivationBrand.tsx` 的左上角品牌跳转目标列为共享文件中的 fork 专属语义。
- rebase 完成后运行完整构建与测试（文档 §2 要求）。
- 经用户授权后 force-push（`--force-with-lease`）到 origin/main。

# 已调查事实（rebase 冲突预判）

- fork 专属白名单文件（docs/comet|openspec|superpowers、.comet、README.md、CHANGELOG.md、HOW_TO_REBASE_UPSTREAM.md、forkBuild/forkOfficialAllowlist/forkPresetFilter、devpanel、连通性测试与模型快捷切换全套文件、vite/vitest config、tauri.windows.conf.json、CI workflows）：上游未触碰，保留 fork 侧即可。
- fork 关闭自动更新的整套改动（删除 `tauri-plugin-updater` 依赖与 Cargo.lock 条目、`capabilities/default.json` 去掉 `updater:default`、`tauri.conf.json` 去掉 updater 段并把 `createUpdaterArtifacts` 置 false、`updater.ts` 恒返回 up-to-date、`UpdateContext` 去掉启动自检、`AboutSection` 检查更新改为打开 fork releases、`settings.rs` 的 `install_update_and_restart` 返回 false、`misc.rs` 的更新页 URL 指向 tunecc）：上游自 f3b18df1 以来**未修改**这些文件，重放不冲突；上游 re-add updater 的内容只存在于 base，不影响。
- `tray.rs`：上游改动集中在用量展示（Fable 单列、托管 Codex 账号用量路径）；fork 新增 `show_main_window`/`hide_main_window`/`toggle_main_window` 三个函数并改 `show_main` 分支。区域不重叠，预期干净合并或小冲突。
- `lib.rs`：上游在 mod 声明（mcode_config）、prompt 导入、命令注释处改动；fork 改 tray 事件、`show_menu_on_left_click(false)`、命令注册（stream_check → connectivity_test）、Reopen 事件。行号不重叠。
- `App.tsx`：上游 5 处加 mcode 守卫；fork 的可见面板守卫与连通性探针按钮集中在 1583–1790。不重叠。
- `types.ts`：fork 加 `websiteUrl2`/`VisibleSidebarPanels`；上游加 mcode 到 `VisibleApps`/`McpApps`。不重叠。
- 预期**文本冲突**的文件：
  - `src/components/providers/ProviderCard.tsx`（上游在 `onTest && provider.category !== "official"` 行加 `appId !== "mcode"`；fork 把同一行改为 `shouldShowTestEntry(...)`）→ 保留 fork 的 `shouldShowTestEntry` 调用，其内部已覆盖官方供应商过滤；mcode 应用按上游语义隐藏入口（mcode 为 liveConfigManaged 托管应用，无自有端点，与官方同口径不进入连通性测试）。
  - `src/components/providers/ProviderList.tsx`（上游在 `isProviderInConfig` 加 mcode 分支；fork 在同函数附近改探针状态）→ 两处叠加。
  - `src/components/providers/forms/ClaudeFormFields.tsx`（上游改一键设置取值顺序为「兜底模型最后」；fork 把一键设置按钮移到请求地址下方的直达区并保持「兜底模型优先」）→ 保留 fork 语义（fallback model quick-access change 已验收的优先级），仅吸收上游新增的无关字段。
  - `src/components/settings/AppVisibilitySettings.tsx`（上游在 APP_CONFIG 加 mcode；fork 在同数组之前插入侧边面板开关逻辑）→ 叠加 mcode 行。
  - 版本号文件（`package.json`、`tauri.conf.json`、`Cargo.toml`、`Cargo.lock`）：上游 3.20.2→3.20.3，fork 3.20.2→3.20.2-1 → 解决为 `3.20.3-1`。
- 上游新增 mcode（MiniMax Code）应用为纯新增文件 + 各处守卫，与 fork 改动基本正交，同步后 fork 自动获得该应用支持。
- 上游 npm dist-tags 端点改动（`misc.rs` 945 行附近）与 fork 的更新页 URL 改动（56 行）不重叠。

# 非目标

- 不改上游共享代码行为（除必要的 fork 改动叠加与左上角跳转改造）。
- 不改其他品牌入口（托盘官网、设置页官方网站按钮、README 官网声明）。
- 不同步 upstream 其他分支；不清理本地遗留分支。
- 未授权不推送远端。

# 验收示例

- A1: rebase 后 `git merge-base main upstream/main` == 06082e18，`git log upstream/main..main` 仅含 fork 提交。
- A2: fork 本地提交 rebase 后无丢失（`git rev-list --no-merges upstream/main..main | wc -l` 与 rebase 前一致，cherry-mark 检查为空）。
- A3: `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 的 version 均为 `3.20.3-1`。
- A4: 冲突解决符合 §3 约定（白名单文件保留 fork 侧；共享文件以上游为基础叠加 fork 必要改动；ProviderCard 的 onTest 冲突保留 `shouldShowTestEntry` 并叠加 mcode 隐藏语义）。
- A5: 主页左上角 "CC Switch" 品牌链接渲染的 `href` 为 `https://github.com/farion1231/cc-switch`，点击在新标签打开该地址；代理激活态的绿色样式与粒子动画不受影响。
- A6: `pnpm typecheck` 通过。
- A7: `pnpm test:unit`（vitest）通过。
- A8: `cargo check`（src-tauri）通过。
- A9: `cargo test`（src-tauri）通过。已知环境性例外：`update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 在本机 cc-switch 运行时因代理端口 15721 被占用而失败；以 `cargo test -- --skip update_current_claude_desktop_provider_syncs_profile_when_proxy_takeover_is_active` 执行，其余全部通过。
- A10: `docs/HOW_TO_REBASE_UPSTREAM.md` §4 补充 `RoutingActivationBrand.tsx` 品牌跳转目标的 fork 专属语义条目。
- A11: 经用户授权后 `git push --force-with-lease origin main` 成功，origin/main 与本地 main 一致。

# 约束与不变量

- rebease 前工作区干净（当前干净，本地 main == origin/main == 1e29dfde）。
- 白名单文件冲突一律保留 fork 侧；共享文件优先对齐上游再叠加 fork 必要改动。
- rebase 改写 main 历史，推送必须 `--force-with-lease` 且仅在用户明确授权后执行。
- rebase 中断优先 `git rebase --abort` 回到起点；不确定的冲突先 `git status`/`git diff` 复核。
- 不删除、不重置任何 fork 提交。

# 决策

- D1 同步策略 = rebase（非 merge）：`docs/HOW_TO_REBASE_UPSTREAM.md` 既定约定，上次同步同样走 rebase。项目规则已回答。
- D2 冲突解决 = 按文档 §3：白名单保留 fork 侧，共享文件取上游再叠加 fork 改动。
- D3 版本号 = `3.20.3-1`：沿用「上游版本 + `-1`」的 fork 惯例。
- D4 左上角跳转 = 只改 `RoutingActivationBrand.tsx` 的 href：用户明确指定「点击左上角」；该组件即主页 header 左侧的 "CC Switch" 品牌链接（代理接管激活时为绿色）。其余品牌入口保持不变。
- D5 ProviderCard onTest 冲突 = 保留 fork 的 `shouldShowTestEntry(...)`：fork 的连通性测试入口判定已覆盖官方供应商过滤，且与后端 `is_probe_capable` 同口径；上游对 mcode 的隐藏语义（托管应用无自有端点）通过保留 fork 判定天然满足。
- D6 ClaudeFormFields 一键设置冲突 = 保留 fork 的取值优先级（兜底模型优先）：fallback model quick-access change 已验收此语义，上游的「兜底模型最后」属于上游表单布局下的排序约定，不适用于 fork 的直达区设计。
- D7 推送 = 仅在用户最终确认中明确授权后 force-push；未授权则停在本地完成态。

# 待解决问题

（无 —— 用户已确认最终共享理解：目标、范围、A1–A11 验收项与非目标；并授权 rebase 完成且全部构建/测试通过后 force-push 到 origin/main。）

# 验证预期

- 构建与测试：`pnpm typecheck`、`pnpm test:unit`、`cargo check`、`cargo test`（src-tauri）。
- 冲突抽查：版本号文件解决为 3.20.3-1；ProviderCard/ProviderList/ClaudeFormFields/AppVisibilitySettings 按上述决策叠加；其余白名单文件保留 fork 侧。
- A11 仅在用户授权后执行；未授权时其余验收项全部通过即视为完成，推送留待用户单独授权。
