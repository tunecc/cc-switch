// Pi 供应商 settingsConfig 的组装与字段归属（哪些键由表单控件掌管、哪些是
// 用户自定义透传）。抽到 utils 是为了让跨应用导入的映射层复用同一份组装
// 规则，避免组件与工具各写一套导致导入结果和表单保存结果不一致。

export interface PiSettingsConfigInput {
  passthrough: Record<string, unknown>;
  nativeName?: string;
  baseUrl: string;
  api: string;
  includeApi: boolean;
  apiKey: string;
  headers: Record<string, string>;
  compat: Record<string, unknown>;
  includeCompat: boolean;
  models: Record<string, unknown>[];
  includeModels: boolean;
}

export function buildPiSettingsConfig({
  passthrough,
  nativeName,
  baseUrl,
  api,
  includeApi,
  apiKey,
  headers,
  compat,
  includeCompat,
  models,
  includeModels,
}: PiSettingsConfigInput): Record<string, unknown> {
  return {
    ...passthrough,
    ...(nativeName !== undefined ? { name: nativeName } : {}),
    ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
    ...(includeApi && api.trim() ? { api: api.trim() } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(includeCompat ? { compat } : {}),
    ...(includeModels ? { models } : {}),
  };
}
