# 目标

修复供应商卡片右键菜单「删除」无效的问题；并把新增自定义供应商的默认插入位置从第二位（index 1）改为第一位（index 0，列表顶部第一个）。

用户原话：右键单击供应商的界面点击的删除无效，这个要修复一下；另外，每个新增的自定义不要让它排在第二个，而是排在第一个，顶部第一个。

## 调查结论（Shape 阶段实测）

1. 删除链路各环节单独看都完整：前端 `ProviderList` 右键菜单 `ProviderMenuItems.onSelect={onDelete}` → `App.tsx listCallbacks.onDelete` → `setConfirmAction({provider, action: "delete"})` → 确认框 `handleConfirmAction` → `useDeleteProviderMutation` → `providersApi.delete` → 后端 `delete_provider` 命令 → `ProviderService::delete` → `db.delete_provider`。全部组件测试（2017 个）通过。
2. 但右键菜单路径**零测试覆盖**（`tests/components/ProviderList.test.tsx` 把 ProviderCard mock 掉，右键菜单只有快捷排序用例）。嫌疑点：`ProviderContextMenu` 是受控 Radix DropdownMenu（`open` + `onOpenChange(open=false)` 立即 `onClose()` 置空 `contextMenu` → `items` 变 null → `ProviderMenuItems` unmount），`onSelect` 与菜单关闭存在竞态窗口；另外 `presentation.deleteDisabledReason`（当前启用中的供应商 `inUseCannotDelete`、Kimi 官方在用卡、DSH 托管卡等）会让删除项禁用，用户可能把「禁用」理解成「无效」。Build 首步写复现测试锁定真实根因，再修。
3. 新增排第二是 fork 自己的行为：`src/lib/query/mutations.ts` `useAddProviderMutation` 在 `sortIndex === undefined` 时把现有第 0 项保持 0、其余 +1，新项 `sortIndex = 1`（commit 0977b437a）。改第一位：现有项全部 +1，新项 `sortIndex = 0`。

# 范围

## 目录结构

### 修改

- `src/components/providers/ProviderList.tsx` — 右键菜单删除竞态修复（若有）；保证 `onSelect` 先于菜单卸载执行
- `src/lib/query/mutations.ts` — `useAddProviderMutation` 默认插入位置 index 1 → 0（含让位逻辑与注释更新）
- `tests/components/ProviderList.test.tsx` — 新增右键删除链路复现/回归用例
- `src/lib/query/mutations` 相关测试（如有）— 新增插入位置断言更新

# 非目标

- 不改「当前启用中的供应商禁止删除」设计（`inUseCannotDelete`），那是保护性逻辑；仅确保禁用原因对用户可见清晰
- 不改后端删除逻辑与数据库层
- 不改显式传 `sortIndex` 的路径（复制供应商保持原语义）
- 不改拖拽排序与一键置顶/置底行为

# 验收示例

- A1 复现测试先行：右键菜单 → 点删除 → 断言 App 层 `onDelete` 收到正确 provider；修复前该用例必须能暴露问题（若链路本就通，则用例固化回归）
- A2 修复后右键删除全链路有效：非当前供应商右键删除 → 确认框弹出 → 确认后供应商从列表消失（msw/模拟层验证 mutation 被调用）
- A3 新增自定义供应商出现在列表顶部第一位（sortIndex=0，其余项依次后移），多 app（claude/codex 等通用路径）成立
- A4 复制供应商路径不受影响（显式 sortIndex 语义保持）
- A5 `pnpm typecheck`、`pnpm test:unit`、`pnpm format:check` 全绿
