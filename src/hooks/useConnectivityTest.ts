import { useCallback, useState } from "react";
import {
  connectivityTestProviderModels,
  type ConnectivityTestResult,
} from "@/lib/api/connectivity-test";
import type { AppId } from "@/lib/api";
import type { ConnectivityTestSettings } from "@/lib/connectivityTestSettings";
import type { Provider } from "@/types";

/** 逐模型测试状态：waiting（待测试）→ running → success | error */
export type ModelTestStatus = "waiting" | "running" | "success" | "error";

export interface ModelTestEntry {
  status: ModelTestStatus;
  /** 终态时的后端结果（invoke 失败时缺失，改看 errorMessage） */
  result?: ConnectivityTestResult;
  /** invoke 失败（供应商不可测 / 后端错误）时的错误信息 */
  errorMessage?: string;
}

export type ModelTestResults = Record<string, ModelTestEntry>;

/**
 * 连通性测试弹窗的状态管理（模型勾选 → 逐模型并行测试 → 行级流式结果）。
 *
 * `runTest` 对每个模型各发一次 invoke（`modelIds` 单元素，勾选即测试范围），
 * 全部并行执行；每个模型返回后立即写该行终态，不等待其余模型完成。
 * 单模型 invoke 失败只影响该行（置 error），不影响其他模型。
 *
 * 返回值为本轮各模型的终态快照，供调用方实现「测完自动勾选失败项」。
 */
export function useConnectivityTest(provider: Provider, appId: AppId) {
  const [results, setResults] = useState<ModelTestResults>({});

  const runTest = useCallback(
    async (
      modelIds: string[],
      params?: ConnectivityTestSettings,
    ): Promise<ModelTestResults> => {
      if (modelIds.length === 0) return {};

      // 本轮全部置 running（清空旧行的终态数据）
      setResults((prev) => {
        const next = { ...prev };
        for (const modelId of modelIds) {
          next[modelId] = { status: "running" };
        }
        return next;
      });

      const outcomes = await Promise.all(
        modelIds.map(async (modelId) => {
          let entry: ModelTestEntry;
          try {
            const response = await connectivityTestProviderModels(
              appId,
              provider.id,
              params,
              [modelId],
            );
            const item = response.results.find(
              (result) => result.modelId === modelId,
            );
            entry = item
              ? { status: item.status, result: item }
              : {
                  status: "error",
                  errorMessage: "后端未返回该模型的测试结果",
                };
          } catch (e) {
            entry = { status: "error", errorMessage: String(e) };
          }
          setResults((prev) => ({ ...prev, [modelId]: entry }));
          return [modelId, entry] as const;
        }),
      );

      return Object.fromEntries(outcomes);
    },
    [appId, provider.id],
  );

  const reset = useCallback(() => {
    setResults({});
  }, []);

  return { results, runTest, reset };
}
