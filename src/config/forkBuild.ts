/**
 * Fork 构建标识（编译期常量）。
 * fork 仓库内 __CCS_FORK_BUILD__ 由 vite define 注入为 true；
 * 上游无此常量。业务代码统一通过 IS_FORK_BUILD 访问，不直接引用裸常量。
 */
export const IS_FORK_BUILD = __CCS_FORK_BUILD__ as boolean;
