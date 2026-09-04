import { useCallback, useState } from "react";
import { connectivityProbeProvider } from "@/lib/api/connectivity-test";
import { getConnectivityTestSettings } from "@/lib/connectivityTestSettings";
import { listProviderModelIds } from "@/lib/providerModelIds";
import type { AppId } from "@/lib/api";
import type { Provider } from "@/types";

/** 批量探针并发度（设计 D5：前端控制并发 5） */
const PROBE_CONCURRENCY = 5;

/** 动态端点供应商：端点随 OAuth token 运行时解析，不可测（与后端 is_probe_capable 同口径） */
const NON_PROBE_PROVIDER_TYPES: ReadonlySet<string> = new Set([
  "codex_oauth",
  "xai_oauth",
  "github_copilot",
]);

/** 首期仅 claude / codex 支持真实请求连通性测试 */
const PROBE_SUPPORTED_APPS: ReadonlySet<AppId> = new Set(["claude", "codex"]);

/** 探针状态：waiting（排队）→ running → success | error */
export type ConnectivityProbeStatus =
  | "waiting"
  | "running"
  | "success"
  | "error";

export interface ConnectivityProbeEntry {
  status: ConnectivityProbeStatus;
  totalMs?: number;
  errorMessage?: string;
}

export type ConnectivityProbeResults = Record<string, ConnectivityProbeEntry>;

interface ProbeItem {
  providerId: string;
  modelId: string;
}

/** 探针目标模型：默认测试模型优先，无则取模型清单第一个（共享 helper 与后端同口径）；两者皆无 → 跳过（设计 D5） */
function probeModelId(appId: AppId, provider: Provider): string | undefined {
  const configured = getConnectivityTestSettings(
    provider.settingsConfig,
  ).defaultTestModelId;
  if (configured && configured.trim()) return configured.trim();
  return listProviderModelIds(provider.settingsConfig, appId)[0];
}

/**
 * 供应商列表批量探针（卡片徽标用）。
 *
 * 前端轻量过滤（与后端同口径）：official / 动态端点类型 / 无可测模型的
 * 供应商跳过；首期仅 claude/codex。手写并发池（并发度 5）逐供应商调用单
 * 模型探测命令，按完成顺序增量更新；单个失败只写该供应商的 error，不
 * 中断池。结果仅存内存态，切换页面由调用方 clear。
 */
export function useConnectivityProbe(appId: AppId) {
  const [results, setResults] = useState<ConnectivityProbeResults>({});

  const probeAll = useCallback(
    async (providers: Provider[]): Promise<void> => {
      // 首期范围外 app：清空结果并直接返回
      if (!PROBE_SUPPORTED_APPS.has(appId)) {
        setResults({});
        return;
      }

      const items: ProbeItem[] = [];
      for (const provider of providers) {
        if (provider.category === "official") continue;
        if (NON_PROBE_PROVIDER_TYPES.has(provider.meta?.providerType ?? "")) {
          continue;
        }
        const modelId = probeModelId(appId, provider);
        if (!modelId) continue;
        items.push({ providerId: provider.id, modelId });
      }

      const initial: ConnectivityProbeResults = {};
      for (const item of items) {
        initial[item.providerId] = { status: "waiting" };
      }
      setResults(initial);
      if (items.length === 0) return;

      const probeOne = async (item: ProbeItem): Promise<void> => {
        setResults((prev) => ({
          ...prev,
          [item.providerId]: { status: "running" },
        }));
        try {
          const result = await connectivityProbeProvider(
            appId,
            item.providerId,
            item.modelId,
          );
          setResults((prev) => ({
            ...prev,
            [item.providerId]: {
              status: result.status,
              totalMs: result.totalMs,
              errorMessage: result.errorMessage,
            },
          }));
        } catch (e) {
          setResults((prev) => ({
            ...prev,
            [item.providerId]: { status: "error", errorMessage: String(e) },
          }));
        }
      };

      // 手写并发池：N 个 worker 循环取 next++ 项，单项失败不中断
      let next = 0;
      const worker = async (): Promise<void> => {
        for (;;) {
          const index = next++;
          if (index >= items.length) return;
          await probeOne(items[index]);
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(PROBE_CONCURRENCY, items.length) }, () =>
          worker(),
        ),
      );
    },
    [appId],
  );

  const clear = useCallback(() => {
    setResults({});
  }, []);

  return { results, probeAll, clear };
}
