import type { AppId } from "@/lib/api";

/**
 * 动态端点供应商类型：端点随 OAuth token 运行时解析，不可探测。
 * 与后端 `is_probe_capable`（`commands/connectivity_test.rs:39-50`）同口径，
 * `useConnectivityProbe` / `shouldShowTestEntry` 三处共用。
 */
export const NON_PROBE_PROVIDER_TYPES: ReadonlySet<string> = new Set([
  "codex_oauth",
  "xai_oauth",
  "github_copilot",
]);

/**
 * 供应商卡片是否展示「连通性测试」入口（检测按钮）。
 *
 * 首期仅 claude / codex 支持真实请求连通性测试；官方供应商（category
 * === "official"）一律隐藏：其 base_url 故意留空、走客户端默认/OAuth
 * 端点，cc-switch 没有可靠的探测目标。动态端点类型（codex_oauth /
 * xai_oauth / github_copilot）一并隐藏：端点随 OAuth token 运行时解析，
 * 不可探测。其余应用（gemini / opencode / openclaw / hermes / pi /
 * grokbuild / claude-desktop 等）暂未接入。
 *
 * 与 `useConnectivityProbe` / 后端 `is_probe_capable` 三处同口径。
 *
 * 纯函数，便于单元测试与在 ProviderCard / ProviderList 之间复用同一判定。
 */
export function shouldShowTestEntry(
  appId: AppId,
  providerCategory?: string,
  providerType?: string,
): boolean {
  return (
    (appId === "claude" || appId === "codex") &&
    providerCategory !== "official" &&
    !NON_PROBE_PROVIDER_TYPES.has(providerType ?? "")
  );
}
