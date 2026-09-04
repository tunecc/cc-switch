import type { AppId } from "@/lib/api";

/**
 * 供应商卡片是否展示「连通性测试」入口（检测按钮）。
 *
 * 首期仅 claude / codex 支持真实请求连通性测试；官方供应商（category
 * === "official"）一律隐藏：其 base_url 故意留空、走客户端默认/OAuth
 * 端点，cc-switch 没有可靠的探测目标。其余应用（gemini / opencode /
 * openclaw / hermes / pi / grokbuild / claude-desktop 等）暂未接入。
 *
 * 纯函数，便于单元测试与在 ProviderCard / ProviderList 之间复用同一判定。
 */
export function shouldShowTestEntry(
  appId: AppId,
  providerCategory?: string,
): boolean {
  return (appId === "claude" || appId === "codex") && providerCategory !== "official";
}
