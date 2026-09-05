import { invoke } from "@tauri-apps/api/core";
import type { AppId } from "./types";
import type { ConnectivityTestSettings } from "@/lib/connectivityTestSettings";

// ===== 按模型真实请求连通性测试 API =====
// 本模块是按模型真实请求连通性测试的前端 API 绑定：直接向上游供应商端点
// 发最小化请求，逐模型度量 first_byte_ms / total_ms，不经由本地代理网关，
// 也不触碰故障转移熔断器（对应后端 commands/connectivity_test.rs）。

export type ConnectivityTestStatus = "success" | "error";

export interface ConnectivityTestResult {
  /** 被测模型 ID */
  modelId: string;
  status: ConnectivityTestStatus;
  /** 首字节耗时（毫秒）；非流式无响应体时回退为总耗时 */
  firstByteMs?: number;
  /** 总耗时（毫秒） */
  totalMs?: number;
  /** status=error 时的错误信息 */
  errorMessage?: string;
  /** 实际请求 URL */
  requestUrl: string;
  /** 实际请求 headers（鉴权敏感头已由后端脱敏） */
  requestHeaders: Record<string, string>;
  /** 实际请求 body */
  requestBody: unknown;
  responseHeaders?: Record<string, string>;
  /** 响应体预览（JSON 或原始文本，上限 256 KiB） */
  responseBody?: unknown;
}

export interface ConnectivityTestResponse {
  results: ConnectivityTestResult[];
}

/**
 * `ConnectivityTestSettings`（Task 4，settings_config.connectivityTest 的形状）
 * → 后端命令参数。
 *
 * 字段名差异：前端设置里的 `headers`/`body` 对应后端 `ConnectivityTestParams`
 * 的 `custom_headers`/`custom_body`（serde camelCase → `customHeaders`/
 * `customBody`）；`defaultTestModelId` 只服务前端弹窗/探针选型，后端参数不
 * 消费，不发送。值为 undefined 的键经 JSON 序列化自然丢弃，后端按缺省处理。
 */
function toBackendParams(
  settings: ConnectivityTestSettings,
): Record<string, unknown> {
  return {
    prompt: settings.prompt,
    stream: settings.stream,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    customHeaders: settings.headers,
    customBody: settings.body,
    timeoutSecs: settings.timeoutSecs,
  };
}

/**
 * 单供应商连通性测试（弹窗用）。`modelIds` 非空时后端仅对传入集合发起
 * 真实请求（勾选即测试范围，可含弹窗内拉取的会话级模型）；缺省时后端
 * 回退到供应商静态模型清单。`params` 缺省时后端使用默认参数。
 */
export async function connectivityTestProviderModels(
  appId: AppId,
  providerId: string,
  params?: ConnectivityTestSettings,
  modelIds?: string[],
): Promise<ConnectivityTestResponse> {
  return invoke("connectivity_test_provider_models", {
    appType: appId,
    providerId,
    params: params === undefined ? undefined : toBackendParams(params),
    modelIds,
  });
}

/**
 * 单模型连通性探测（供应商列表批量徽标用），由前端控制并发调用。
 */
export async function connectivityProbeProvider(
  appId: AppId,
  providerId: string,
  modelId: string,
  timeoutSecs?: number,
): Promise<ConnectivityTestResult> {
  return invoke("connectivity_probe_provider", {
    appType: appId,
    providerId,
    modelId,
    timeoutSecs,
  });
}
