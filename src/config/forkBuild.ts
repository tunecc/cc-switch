/**
 * Fork 构建标识（编译期常量）。
 * fork 仓库内 __CCS_FORK_BUILD__ 由 vite define 注入为 true；
 * 上游无此常量。业务代码统一通过 IS_FORK_BUILD 访问，不直接引用裸常量。
 */
export const IS_FORK_BUILD = __CCS_FORK_BUILD__ as boolean;

/**
 * 开发面板开关（编译期常量）。
 * 由 vite define 注入 __CCS_DEV_PANEL__：仅当 fork 开发模式（dev:fork 脚本显式
 * 设置 CCS_DEV_PANEL=1）时编译为 true；正式 build 无此环境变量，恒为 false。
 * DevPanel / Fork 角标显示条件为 IS_FORK_BUILD && DEV_PANEL_ENABLED。
 */
export const DEV_PANEL_ENABLED = __CCS_DEV_PANEL__ as boolean;
