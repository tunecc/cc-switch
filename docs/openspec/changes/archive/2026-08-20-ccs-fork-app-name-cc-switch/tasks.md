# Implementation Tasks

## 1. 应用名与窗口标题改为 CC Switch

- [x] 1.1 `src-tauri/tauri.conf.json`：`productName` 由 `CC Switch (Fork)` 改为 `CC Switch`
- [x] 1.2 `src-tauri/tauri.windows.conf.json`：窗口 `title` 由 `CC Switch (Fork)` 改为 `CC Switch`
- [x] 1.3 `src/App.tsx`：macOS Overlay 启动 `setTitle` 字符串由 `"CC Switch (Fork)"` 改为 `"CC Switch"`，并更新上方注释

## 2. dev 预览构建保持不变

- [x] 2.1 确认 `src-tauri/tauri.dev.conf.json` 的 `productName`/`title` 仍为 `CC Switch (Fork Dev)`（不改）

## 3. 同步文档与既有 spec

- [x] 3.1 `docs/openspec/specs/fork-build-identity/spec.md`：更新「Fork 窗口标题区分」Requirement 正文与 Scenario 为 `CC Switch`（与 delta 一致，归档合并主 spec 时以 delta 为准；此处先行同步避免阅读歧义）
- [x] 3.2 `docs/HOW_TO_REBASE_UPSTREAM.md`：更新白名单表 `tauri.windows.conf.json` 与 `tauri.conf.json` 的保留字段备注为 `CC Switch`（dev 文件保留 `(Fork Dev)`）
- [x] 3.3 `README.md`：「应用标题与 productName 改为 CC Switch (Fork)」措辞更新为反映应用名为 `CC Switch`

## 4. 验证

- [x] 4.1 `pnpm typecheck` 通过
- [x] 4.2 `pnpm test:unit` 无回归
- [x] 4.3 `comet classic openspec -- validate ccs-fork-app-name-cc-switch --strict` 通过
- [x] 4.4 grep 确认无遗漏的 `CC Switch (Fork)` 残留（dev 预览构建 `CC Switch (Fork Dev)` 除外）
