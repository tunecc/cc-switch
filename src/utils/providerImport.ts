// 跨应用供应商导入的字段映射层。
//
// 一个读方向 + 两个写方向：
// - 读：`readImportableProviderFields` 从来源应用的 settingsConfig 里取出
//   「名称/备注/官网/请求地址/密钥/默认模型/上游格式」；
// - 写（新建）：`buildImportedSettingsConfig` 以目标应用的「自定义」模板为
//   基底整体重建，把取出的请求地址/密钥/默认模型写进目标形状；
// - 写（编辑）：`patchImportedSettingsConfig` 在既有配置上就地覆盖这三个键，
//   其余一切原样保留——整份重建会清掉 providerKey、模型表、modelCatalog 等
//   不在导入范围内的状态。
//
// 刻意不复用 `utils/providerCredentials` 的 `extractCredentials`：那个表的
// default 分支返回空值，是给「拉取模型列表前的凭据预检」用的（只有支持
// /models 拉取的应用才填）。导入需要覆盖全部 10 个应用，语义不同，混用会
// 让其中一侧的行为被另一侧静默改变。

import type { AppId } from "@/lib/api/types";
import type { Provider } from "@/types";
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
  extractCodexModelName,
  setCodexBaseUrl,
  setCodexModelName,
} from "@/utils/providerConfigUtils";
import {
  GROK_BUILD_DEFAULT_API_BACKEND,
  GROK_BUILD_DEFAULT_CONTEXT_WINDOW,
  GROK_BUILD_DEFAULT_MODEL,
  parseGrokBuildConfig,
  updateGrokBuildConfig,
} from "@/utils/grokBuildConfig";
import { getCodexCustomTemplate } from "@/config/codexTemplates";
import { buildPiSettingsConfig } from "@/utils/piProviderConfig";

/** 一次导入可迁移的字段快照。空字符串表示来源没有该值。 */
export interface ImportableProviderFields {
  name: string;
  notes: string;
  websiteUrl: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  /** 来源供应商声明的上游 API 方言（`meta.apiFormat`）。 */
  apiFormat?: string;
}

/** 目标应用可写入的配置字段（不含名称/备注/官网这类身份字段）。 */
export interface ImportableConfigFields {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const firstNonEmpty = (...values: string[]): string =>
  values.find((value) => value.length > 0) ?? "";

const envOf = (settingsConfig: unknown): Record<string, unknown> =>
  asRecord(asRecord(settingsConfig)?.env) ?? {};

const configTomlOf = (settingsConfig: unknown): string => {
  const value = asRecord(settingsConfig)?.config;
  return typeof value === "string" ? value : "";
};

const authOf = (settingsConfig: unknown): Record<string, unknown> =>
  asRecord(asRecord(settingsConfig)?.auth) ?? {};

const optionsOf = (settingsConfig: unknown): Record<string, unknown> =>
  asRecord(asRecord(settingsConfig)?.options) ?? {};

// ── 读：按来源应用取出可迁移字段 ───────────────────────────────────────────

// 只有 claude / codex / gemini 有「默认 / 兜底模型」这个单值字段（与写侧
// DEFAULT_MODEL_SUPPORT 同一份判定）。claude-desktop 的 env 由提交时按
// baseUrl/apiKey 重建、从不落 ANTHROPIC_MODEL；grokbuild 的 upstreamModel
// 是客户端 profile 的真实模型名，不是兜底模型。两者都按「无该字段」返回空，
// 避免来源模型被迁到一个目标根本没有的语义位上。
function readConfigFields(
  appId: AppId,
  settingsConfig: unknown,
): Pick<ImportableProviderFields, "baseUrl" | "apiKey" | "defaultModel"> {
  switch (appId) {
    case "claude": {
      const env = envOf(settingsConfig);
      return {
        baseUrl: asTrimmedString(env.ANTHROPIC_BASE_URL),
        apiKey: firstNonEmpty(
          asTrimmedString(env.ANTHROPIC_AUTH_TOKEN),
          asTrimmedString(env.ANTHROPIC_API_KEY),
        ),
        defaultModel: asTrimmedString(env.ANTHROPIC_MODEL),
      };
    }
    case "claude-desktop": {
      const env = envOf(settingsConfig);
      return {
        baseUrl: asTrimmedString(env.ANTHROPIC_BASE_URL),
        apiKey: firstNonEmpty(
          asTrimmedString(env.ANTHROPIC_AUTH_TOKEN),
          asTrimmedString(env.ANTHROPIC_API_KEY),
        ),
        defaultModel: "",
      };
    }
    case "codex": {
      const configToml = configTomlOf(settingsConfig);
      return {
        baseUrl: asTrimmedString(extractCodexBaseUrl(configToml)),
        apiKey: firstNonEmpty(
          asTrimmedString(authOf(settingsConfig).OPENAI_API_KEY),
          asTrimmedString(extractCodexExperimentalBearerToken(configToml)),
        ),
        defaultModel: asTrimmedString(extractCodexModelName(configToml)),
      };
    }
    case "grokbuild": {
      const parsed = parseGrokBuildConfig(configTomlOf(settingsConfig));
      return {
        baseUrl: asTrimmedString(parsed.baseUrl),
        apiKey: firstNonEmpty(
          asTrimmedString(parsed.apiKey),
          asTrimmedString(authOf(settingsConfig).OPENAI_API_KEY),
        ),
        defaultModel: "",
      };
    }
    case "gemini": {
      const env = envOf(settingsConfig);
      return {
        baseUrl: asTrimmedString(env.GOOGLE_GEMINI_BASE_URL),
        apiKey: asTrimmedString(env.GEMINI_API_KEY),
        defaultModel: asTrimmedString(env.GEMINI_MODEL),
      };
    }
    case "opencode":
    case "mcode": {
      const options = optionsOf(settingsConfig);
      return {
        baseUrl: asTrimmedString(options.baseURL),
        apiKey: asTrimmedString(options.apiKey),
        defaultModel: "",
      };
    }
    case "openclaw": {
      const config = asRecord(settingsConfig) ?? {};
      return {
        baseUrl: asTrimmedString(config.baseUrl),
        apiKey: asTrimmedString(config.apiKey),
        defaultModel: "",
      };
    }
    case "hermes": {
      const config = asRecord(settingsConfig) ?? {};
      return {
        baseUrl: asTrimmedString(config.base_url),
        apiKey: asTrimmedString(config.api_key),
        defaultModel: "",
      };
    }
    case "pi": {
      const config = asRecord(settingsConfig) ?? {};
      return {
        baseUrl: asTrimmedString(config.baseUrl),
        apiKey: asTrimmedString(config.apiKey),
        defaultModel: "",
      };
    }
    default:
      return { baseUrl: "", apiKey: "", defaultModel: "" };
  }
}

/** 从任意应用的已有供应商中读出可迁移字段。 */
export function readImportableProviderFields(
  appId: AppId,
  provider: Provider,
): ImportableProviderFields {
  return {
    name: asTrimmedString(provider.name),
    notes: asTrimmedString(provider.notes),
    websiteUrl: asTrimmedString(provider.websiteUrl),
    ...readConfigFields(appId, provider.settingsConfig),
    apiFormat: asTrimmedString(provider.meta?.apiFormat) || undefined,
  };
}

// ── 上游 API 格式的跨应用映射 ──────────────────────────────────────────────

// 只列这三个应用：它们的提交路径无条件把 apiFormat 写进 meta。
// claude-desktop 刻意排除——它只在 proxy 模式下持久化该字段，direct 模式
// 会被表单强制覆写成 "anthropic"（ClaudeDesktopProviderForm 的 meta 组装），
// 对着一份反正会被丢掉的写入做「本次将写入」的承诺比不承诺更糟。
const API_FORMAT_SUPPORT: Partial<Record<AppId, readonly string[]>> = {
  claude: ["anthropic", "openai_chat", "openai_responses", "gemini_native"],
  codex: ["openai_responses", "openai_chat", "anthropic"],
  grokbuild: ["openai_responses", "openai_chat", "anthropic"],
};

/** 目标应用是否保存 `meta.apiFormat`。 */
export function targetSupportsApiFormat(appId: AppId): boolean {
  return API_FORMAT_SUPPORT[appId] !== undefined;
}

// 只有这三个应用有明确的「默认 / 兜底模型」字段；其余应用的模型由各自的
// 模型表或 catalog 管理，没有可写入的单值字段。
const DEFAULT_MODEL_SUPPORT: readonly AppId[] = ["claude", "codex", "gemini"];

/** 目标应用是否有可写入的默认（兜底）模型字段。 */
export function targetSupportsDefaultModel(appId: AppId): boolean {
  return DEFAULT_MODEL_SUPPORT.includes(appId);
}

/**
 * 把来源的上游格式换算成目标应用的取值。
 * 来源取值不在目标支持集合内（例如 gemini_native 迁到 Codex）时返回
 * undefined，由调用方保持目标默认值——不猜映射。
 */
export function resolveImportedApiFormat(
  targetAppId: AppId,
  sourceApiFormat: string | undefined,
): string | undefined {
  if (!sourceApiFormat) return undefined;
  const supported = API_FORMAT_SUPPORT[targetAppId];
  if (!supported?.includes(sourceApiFormat)) return undefined;
  return sourceApiFormat;
}

// ── 写：把字段写进目标应用的配置形状 ──────────────────────────────────────

/**
 * 新建模式：以目标应用的「自定义」模板为基底，写入请求地址 / 密钥 / 默认模型。
 *
 * 空值语义分两种，都与该应用「自定义」模板自身一致：
 * - claude：缺项不落键（模板是 `{env:{}}`）；
 * - gemini / opencode / mcode / openclaw / hermes / codex auth：写空字符串
 *   （这些模板自带空值键，如 `GEMINI_DEFAULT_CONFIG` 的 `""`）。
 */
export function buildImportedSettingsConfig(
  targetAppId: AppId,
  fields: ImportableConfigFields,
): Record<string, unknown> {
  const baseUrl = fields.baseUrl.trim();
  const apiKey = fields.apiKey.trim();
  const defaultModel = fields.defaultModel.trim();

  switch (targetAppId) {
    // claude-desktop 单独一支：它的 env 由提交时按 baseUrl/apiKey 重建，
    // 没有默认模型字段（见 DEFAULT_MODEL_SUPPORT）。若和 claude 共用一支把
    // ANTHROPIC_MODEL 写进表单配置，弹窗没预告过这个键、用户会在 JSON 编辑器
    // 里看到一个来路不明的值。
    case "claude-desktop": {
      const env: Record<string, string> = {};
      if (baseUrl) env.ANTHROPIC_BASE_URL = baseUrl;
      if (apiKey) env.ANTHROPIC_AUTH_TOKEN = apiKey;
      return { env };
    }
    case "claude": {
      const env: Record<string, string> = {};
      if (baseUrl) env.ANTHROPIC_BASE_URL = baseUrl;
      if (apiKey) env.ANTHROPIC_AUTH_TOKEN = apiKey;
      if (defaultModel) env.ANTHROPIC_MODEL = defaultModel;
      return { env };
    }
    case "codex": {
      // 模板自带 model_provider / wire_api = "responses"；只补 base_url 与
      // model，保注释保键序的前缀编辑走 providerConfigUtils，禁止整文档重排。
      // 来源没有默认模型时把模板自带的 model 行删掉——留给用户的目标模型
      // 字段必须是空的，而不是模板的占位模型。
      const template = getCodexCustomTemplate();
      let config = setCodexBaseUrl(template.config, baseUrl);
      config = setCodexModelName(config, defaultModel);
      return {
        auth: { OPENAI_API_KEY: apiKey },
        config,
      };
    }
    case "grokbuild": {
      // grokbuild 的 config.toml 由本工具生成（非用户手写带注释），走它自己的
      // 组装入口；api_key 为空时该键被删除，避免写下空值。
      // grokbuild 没有"默认/兜底模型"字段（见 DEFAULT_MODEL_SUPPORT），因此
      // 不把来源的模型写进 upstreamModel——那会让来源模型悄悄落到一个弹窗
      // 没预告过的字段上。留空由 updateGrokBuildConfig 回落到默认 profile。
      const config = updateGrokBuildConfig(undefined, {
        model: GROK_BUILD_DEFAULT_MODEL,
        baseUrl,
        name: "",
        apiKey,
        apiBackend: GROK_BUILD_DEFAULT_API_BACKEND,
        contextWindow: GROK_BUILD_DEFAULT_CONTEXT_WINDOW,
      });
      return { config };
    }
    case "gemini": {
      const env: Record<string, string> = {
        GOOGLE_GEMINI_BASE_URL: baseUrl,
        GEMINI_API_KEY: apiKey,
        GEMINI_MODEL: defaultModel,
      };
      return { env };
    }
    case "opencode":
      return {
        npm: "@ai-sdk/openai-compatible",
        options: { baseURL: baseUrl, apiKey },
        models: {},
      };
    case "mcode":
      return {
        kind: "custom",
        enabled: true,
        api: "anthropic-messages",
        options: { baseURL: baseUrl, apiKey },
        models: {},
      };
    case "openclaw":
      return {
        baseUrl,
        apiKey,
        api: "openai-completions",
        models: [],
      };
    case "hermes":
      return {
        name: "",
        base_url: baseUrl,
        api_key: apiKey,
      };
    case "pi":
      return buildPiSettingsConfig({
        passthrough: {},
        baseUrl,
        api: "openai-completions",
        includeApi: true,
        apiKey,
        headers: {},
        compat: {},
        includeCompat: false,
        models: [],
        includeModels: true,
      });
    default:
      return {};
  }
}

// 空值删键、非空写值：与各应用自己输入框的行为一致（例如
// useModelState.handleModelChange 空值 delete、useBaseUrlState 写 ""），
// 这样"导入"和"用户手改一个字段"留下的是同一种配置。
const setOrDelete = (
  target: Record<string, unknown>,
  key: string,
  value: string,
) => {
  if (value) target[key] = value;
  else delete target[key];
};

/**
 * 编辑模式：在既有配置上就地覆盖导入范围内的键，其余一律原样保留。
 *
 * 这是 A6 的关键——编辑已有供应商时导入只允许动「请求地址 / 密钥 / 默认
 * 模型」这三个键位，providerKey、模型表、modelCatalog、扩展 config、以及
 * env/config 里的其他键都必须活下来。整份按模板重建（buildImportedSettingsConfig）
 * 只属于新建模式。
 */
export function patchImportedSettingsConfig(
  targetAppId: AppId,
  existing: Record<string, unknown>,
  fields: ImportableConfigFields,
): Record<string, unknown> {
  const baseUrl = fields.baseUrl.trim();
  const apiKey = fields.apiKey.trim();
  const defaultModel = fields.defaultModel.trim();
  const next: Record<string, unknown> = { ...existing };

  switch (targetAppId) {
    case "claude":
    case "claude-desktop": {
      const env: Record<string, unknown> = {
        ...(asRecord(existing.env) ?? {}),
      };
      setOrDelete(env, "ANTHROPIC_BASE_URL", baseUrl);
      // 沿用既有的认证字段名；两者都没有时才落到默认的 AUTH_TOKEN
      const authKey =
        "ANTHROPIC_AUTH_TOKEN" in env
          ? "ANTHROPIC_AUTH_TOKEN"
          : "ANTHROPIC_API_KEY" in env
            ? "ANTHROPIC_API_KEY"
            : "ANTHROPIC_AUTH_TOKEN";
      setOrDelete(env, authKey, apiKey);
      if (targetAppId === "claude") {
        setOrDelete(env, "ANTHROPIC_MODEL", defaultModel);
      }
      next.env = env;
      return next;
    }
    case "codex": {
      // 只动 OPENAI_API_KEY：auth.json 里可能还有 ChatGPT 登录态等其他键，
      // 整份替换会把它们抹掉。
      const auth: Record<string, unknown> = {
        ...(asRecord(existing.auth) ?? {}),
      };
      setOrDelete(auth, "OPENAI_API_KEY", apiKey);
      const configText =
        typeof existing.config === "string" ? existing.config : "";
      const config = setCodexModelName(
        setCodexBaseUrl(configText, baseUrl),
        defaultModel,
      );
      next.auth = auth;
      next.config = config;
      return next;
    }
    case "grokbuild": {
      const configText =
        typeof existing.config === "string" ? existing.config : "";
      const parsed = parseGrokBuildConfig(configText);
      next.config = updateGrokBuildConfig(configText, {
        model: parsed.model,
        upstreamModel: parsed.upstreamModel,
        baseUrl,
        name: parsed.name,
        apiKey,
        apiBackend: parsed.apiBackend,
        contextWindow: parsed.contextWindow,
        envKey: parsed.envKey,
      });
      return next;
    }
    case "gemini": {
      const env: Record<string, unknown> = {
        ...(asRecord(existing.env) ?? {}),
      };
      setOrDelete(env, "GOOGLE_GEMINI_BASE_URL", baseUrl);
      setOrDelete(env, "GEMINI_API_KEY", apiKey);
      setOrDelete(env, "GEMINI_MODEL", defaultModel);
      next.env = env;
      // 顶层 config（gemini 的扩展配置对象）原样保留
      return next;
    }
    case "opencode":
    case "mcode": {
      const options: Record<string, unknown> = {
        ...(asRecord(existing.options) ?? {}),
      };
      setOrDelete(options, "baseURL", baseUrl);
      setOrDelete(options, "apiKey", apiKey);
      next.options = options;
      return next;
    }
    case "openclaw": {
      // 只碰 baseUrl / apiKey；api、models、headers 等保持原样
      setOrDelete(next, "baseUrl", baseUrl);
      setOrDelete(next, "apiKey", apiKey);
      return next;
    }
    case "hermes": {
      setOrDelete(next, "base_url", baseUrl);
      setOrDelete(next, "api_key", apiKey);
      return next;
    }
    case "pi": {
      setOrDelete(next, "baseUrl", baseUrl);
      setOrDelete(next, "apiKey", apiKey);
      return next;
    }
    default:
      return next;
  }
}
