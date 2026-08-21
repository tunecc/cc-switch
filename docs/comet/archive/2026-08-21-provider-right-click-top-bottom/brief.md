# Outcome

魔改版 cc-switch 的供应商列表支持右键菜单「一键置顶 / 一键置底」，且新增供应商默认插入到列表第二位（index 1），便于立即调整与使用。行为对齐参考项目 `/Users/tune/Downloads/cc-switch` 的同名实现。

# Scope

- 供应商列表项右键菜单（onContextMenu），提供「一键置顶」「一键置底」两个动作。
- 置顶/置底通过重排 sortIndex 并批量调用 `providersApi.updateSortOrder` 落库，随后 invalidate `["providers", appId]` 与 `["failoverQueue", appId]` 查询并刷新托盘菜单。
- 新增供应商（`useAddProviderMutation`）当未显式指定 sortIndex 时：将现有第 0 项保持 `sortIndex=0`、其余项 `sortIndex+1` 让位，新供应商 `sortIndex=1`（插入第二位）。
- 列表为空时新增不触发让位，新供应商落库为首位。
- 已在顶部/底部时提示并不重复操作。
- 补齐 i18n 文案（zh-CN / en）：quickMoveTop / quickMoveBottom / quickMoveAlreadyTop / quickMoveAlreadyBottom。

# Non-goals

- 不移除或改变现有拖拽排序与 hover 行内按钮（编辑/复制/删除/检测等）。
- 不新增「上移/下移」按钮。
- 不改变复制（duplicate）的插入语义（仍在原项之后一位）。
- 不改变托盘菜单排序规则。
- 不新增后端 Tauri 命令，复用现有 `update_providers_sort_order`。

# Acceptance examples

- 列表 [A,B,C]，右键 C → 一键置顶 → 列表变为 [C,A,B]，sortIndex 重写为 0,1,2，托盘顺序同步。
- 列表 [A,B,C]，右键 A → 一键置底 → 列表变为 [B,C,A]，sortIndex 重写为 0,1,2。
- 列表 [A,B,C]，右键 A → 一键置顶 → 提示「已在顶部」，列表与 sortIndex 不变。
- 列表 [A,B,C]，右键 C → 一键置底 → 提示「已在底部」，列表不变。
- 在 [A,B,C] 中点「新增供应商」加 D → 列表变为 [A,D,B,C]（D 在第二位），现有项 sortIndex 已全部显式化。
- 空列表新增 X → 列表 [X]（X 为首位，无让位动作）。
- 列表中含 sortIndex 未定义的条目时，新增 D 仍插入到**显示**第二位（处理 defined-first 排序陷阱，不排到最前）。

# Constraints and invariants

- 复用现有 `providersApi.updateSortOrder` 与 Tauri `update_providers_sort_order`，不新增后端命令（与参考一致）。
- 排序字段仍为 `Provider.sortIndex`；前端 `useDragSort` 对 undefined 按 defined-first 处理——插入第二位前必须给所有现有项显式 sortIndex，避免新项被排到最前。
- 重排后 invalidate `["providers", appId]` 与 `["failoverQueue", appId]` 并刷新托盘菜单，与拖拽路径保持一致。

# Decisions

- 右键菜单仅包含「一键置顶 / 一键置底」两项（对齐参考），不纳入编辑/复制/删除等动作，避免与现有 hover 行内按钮重复。
- 「插入第二位」适用于所有未显式指定 sortIndex 的添加路径（手动新增、预设/导入等），逻辑放在 `useAddProviderMutation` 内；复制因显式传 sortIndex 不受影响。
- 置顶 = splice 取出后 unshift 到首位；置底 = splice 取出后 push 到末尾；随后 applyQuickSort 按 index 重写全部 sortIndex（对齐参考）。
- 新增插入第二位：现有第 0 项保持 `sortIndex=0`、其余项 `sortIndex+1` 让位，新供应商 `sortIndex=1`，同时使所有现有项 sortIndex 显式化（解决 defined-first 排序陷阱）。
- 右键菜单 UI 采用内联 fixed 定位 div + button（对齐参考实现），不引入新依赖。
- i18n 文案补齐 zh-CN/en 正式条目（quickMoveTop / quickMoveBottom / quickMoveAlreadyTop / quickMoveAlreadyBottom），不只依赖 defaultValue。

# Open questions

- [blocking] CONFIRM: 供应商右键菜单仅「置顶/置底」两项；新增供应商（及所有未显式指定 sortIndex 的添加）默认插入第二位，现有项统一让位并显式化 sortIndex；复用现有 `update_providers_sort_order`，不新增后端命令；不改动拖拽排序与 hover 行内按钮。等待用户确认目标/范围/决定/验收项/非目标后进入 Build。

# Verification expectations

- 运行 `tests/components/ProviderList.test.tsx` 及相关 provider mutation 测试。
- 覆盖场景：置顶、置底、已在顶/底提示、新增插入第二位、空列表新增、defined-first 排序陷阱。
