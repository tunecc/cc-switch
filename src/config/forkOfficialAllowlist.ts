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
  // v4.0.24 起上游把 OpenAI 平台 API Key（api.openai.com，cn_official）加进目录：
  // fork 只在与该厂商官方卡同源的应用收录，聚合式目录（openclaw/opencode/mcode）继续只留本机推理。
  claude: [
    "Claude Official",
    "OpenAI API",
    "Ollama",
    "LM Studio",
    "llama.cpp",
    "vLLM",
  ],
  "claude-desktop": [
    "Claude Desktop Official",
    "OpenAI API",
    "Ollama",
    "LM Studio",
    "llama.cpp",
    "vLLM",
  ],
  codex: [
    "OpenAI Official",
    "OpenAI API",
    "Ollama",
    "LM Studio",
    "llama.cpp",
    "vLLM",
  ],
  gemini: ["Google Official"],
  agy: ["Google Official"],
  grokbuild: ["Grok Official"],
  opencode: ["Ollama", "llama.cpp", "vLLM"],
  openclaw: ["LM Studio", "llama.cpp", "vLLM"],
  hermes: ["Ollama", "LM Studio", "llama.cpp", "vLLM"],
  pi: ["Ollama", "LM Studio", "vLLM"],
  // omp 也是本机推理三条（Q1）；omp 目录由 Pi 目录派生，名称一致
  omp: ["Ollama", "LM Studio", "vLLM"],
  // dsh 目录同样由 Pi 目录派生（三种 wire protocol），白名单与 omp 一致；
  // 账号预设 `dsh-official-account` 属于「账号登录」组，不参与目录过滤
  dsh: ["Ollama", "LM Studio", "vLLM"],
  // mcode（MiniMax Code，上游 v4 新增）同样无官方预设
  mcode: [],
  // Kimi 只保留 4 条官方预设；本机推理（Ollama/LM Studio/vLLM）在 Kimi 的所有入口一律隐藏
  kimi: ["Kimi", "Kimi Global", "Kimi For Coding", "Kimi For Coding Global"],
  // copilot（GitHub Copilot CLI）与 workbuddy（腾讯 WorkBuddy）的 BYOK 目录由 Pi 目录派生
  // （上游 v4.0.29 / v4.0.31 新增），白名单与 pi 一致；两家的官方登录卡属于「账号登录」组，不参与目录过滤
  copilot: ["Ollama", "LM Studio", "vLLM"],
  workbuddy: ["Ollama", "LM Studio", "vLLM"],
};
