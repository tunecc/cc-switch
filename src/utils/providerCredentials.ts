// 供应商凭据提取（base_url + api_key）：按 app 从 settingsConfig 宽松提取。
//
// 与模型快捷切换、连通性测试弹窗共用——拉取上游 /v1/models 前的凭据预检
// 都走这里，避免各弹窗各自维护一份提取口径。
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
} from "@/utils/providerConfigUtils";
import { parseGrokBuildConfig } from "@/utils/grokBuildConfig";

/** 凭据预检结果：base_url + api_key，缺任一则拉取按钮禁用 */
export interface ProviderCredentials {
  baseUrl: string;
  apiKey: string;
}

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// 按当前模型读取语义对齐：codex 走 pickCodexApiKey 同款回退
// （auth.OPENAI_API_KEY 缺失时读 config.toml 的 experimental_bearer_token）。
// grokbuild 的 config 是 Grok CLI 自己的 TOML（[model.<profile>] 表），
// 凭据在 auth.OPENAI_API_KEY 或模型表 env_key 指向的变量里——env_key 只是
// 变量名，拿不到值，视为缺 key（官方 OAuth / env 引用场景本就不走拉取）。
export function extractCredentials(
  appId: string,
  settingsConfig: Record<string, any> | undefined,
): ProviderCredentials {
  const config = asRecord(settingsConfig) ?? {};
  const env = asRecord(config.env) ?? {};
  const auth = asRecord(config.auth) ?? {};
  const configText =
    typeof config.config === "string" ? config.config : undefined;

  switch (appId) {
    case "claude":
      return {
        baseUrl: asTrimmedString(env.ANTHROPIC_BASE_URL),
        apiKey: asTrimmedString(
          env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY,
        ),
      };
    case "codex":
      return {
        baseUrl: extractCodexBaseUrl(configText)?.trim() ?? "",
        apiKey:
          asTrimmedString(auth.OPENAI_API_KEY) ||
          extractCodexExperimentalBearerToken(configText)?.trim() ||
          "",
      };
    case "grokbuild": {
      // grokbuild 供应商的 settingsConfig 是 { config: <TOML> }（无 auth 字段），
      // api_key 在 [model.<default>].api_key / env_key 里；env_key 只是变量名拿不到值。
      const parsed = configText ? parseGrokBuildConfig(configText) : null;
      return {
        baseUrl: parsed?.baseUrl?.trim() ?? "",
        apiKey:
          asTrimmedString(parsed?.apiKey) ||
          asTrimmedString(auth.OPENAI_API_KEY) ||
          "",
      };
    }
    case "gemini":
      return {
        baseUrl: asTrimmedString(env.GOOGLE_GEMINI_BASE_URL),
        apiKey: asTrimmedString(env.GEMINI_API_KEY),
      };
    default:
      return { baseUrl: "", apiKey: "" };
  }
}
