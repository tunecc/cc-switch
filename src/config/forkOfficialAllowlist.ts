/**
 * Fork 官方预设白名单。
 * 仅 fork 构建（IS_FORK_BUILD）下生效；上游构建不过滤。
 * 按预设的 `name` 字段精确字符串匹配。各 app 保留官方预设 + 本机推理（上游
 * `category: "local"`）预设；无这两类预设的 app（gemini 之外的 grokbuild/mcode）
 * 只留官方或空数组，过滤后预设列表为空，只支持自定义添加。
 * 本机推理条目名称必须与上游 `category: "local"` 预设的 `name` 逐字一致，
 * 拼写不符会让该 app 的本机推理条目静默消失。
 */
import type { AppId } from "@/lib/api";

export const forkOfficialAllowlist: Record<AppId, string[]> = {
  claude: ["Claude Official", "Ollama", "LM Studio", "llama.cpp", "vLLM"],
  "claude-desktop": [
    "Claude Desktop Official",
    "Ollama",
    "LM Studio",
    "llama.cpp",
    "vLLM",
  ],
  codex: ["OpenAI Official", "Ollama", "LM Studio", "llama.cpp", "vLLM"],
  gemini: ["Google Official"],
  grokbuild: ["Grok Official"],
  opencode: ["Ollama", "llama.cpp", "vLLM"],
  openclaw: ["LM Studio", "llama.cpp", "vLLM"],
  hermes: ["Ollama", "LM Studio", "llama.cpp", "vLLM"],
  pi: ["Ollama", "LM Studio", "vLLM"],
  // mcode（MiniMax Code，上游 v4 新增）同样无官方预设
  mcode: [],
};
