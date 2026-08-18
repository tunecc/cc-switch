/**
 * Fork 官方预设白名单。
 * 仅 fork 构建（IS_FORK_BUILD）下生效；上游构建不过滤。
 * 按预设的 `name` 字段精确字符串匹配。各 app 仅保留官方预设；
 * 无官方预设的 app（hermes/openclaw/opencode/pi）为空数组，
 * 过滤后预设列表为空，只支持自定义添加。
 */
import type { AppId } from "@/lib/api";

export const forkOfficialAllowlist: Record<AppId, string[]> = {
  claude: ["Claude Official"],
  "claude-desktop": ["Claude Desktop Official"],
  codex: ["OpenAI Official"],
  gemini: ["Google Official"],
  grokbuild: ["Grok Official"],
  opencode: [],
  openclaw: [],
  hermes: [],
  pi: [],
};
