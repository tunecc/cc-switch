import { IS_FORK_BUILD } from "@/config/forkBuild";
import { forkOfficialAllowlist } from "@/config/forkOfficialAllowlist";

/**
 * Fork 预设过滤：仅 fork 构建下按白名单过滤预设。
 * - IS_FORK_BUILD 为 false（上游构建）→ 原样返回，零影响。
 * - IS_FORK_BUILD 为 true 且白名单非空 → 仅保留白名单内 name 匹配的预设。
 * - IS_FORK_BUILD 为 true 且白名单为空 → 返回空数组（该 app 无官方预设，只支持自定义）。
 */
export function filterForkPresets<T extends { name: string }>(
  appId: string,
  presets: T[],
): T[] {
  if (!IS_FORK_BUILD) return presets;
  const allow =
    forkOfficialAllowlist[appId as keyof typeof forkOfficialAllowlist] ?? [];
  if (allow.length === 0) return [];
  return presets.filter((p) => allow.includes(p.name));
}
