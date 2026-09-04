import { useCallback, useState } from "react";
import {
  connectivityTestProviderModels,
  type ConnectivityTestResult,
} from "@/lib/api/connectivity-test";
import type { AppId } from "@/lib/api";
import type { ConnectivityTestSettings } from "@/lib/connectivityTestSettings";
import type { Provider } from "@/types";

/** 逐模型测试状态：waiting（排队）→ running → success | error */
export type ModelTestStatus = "waiting" | "running" | "success" | "error";

export interface ModelTestEntry {
  status: ModelTestStatus;
  /** 终态时的后端结果（invoke 整体失败时缺失，改看 errorMessage） */
  result?: ConnectivityTestResult;
  /** invoke 整体失败（供应商不可测 / 后端错误）时的错误信息，逐模型共享 */
  errorMessage?: string;
}

export type ModelTestResults = Record<string, ModelTestEntry>;

/**
 * 连通性测试弹窗的状态管理（模型多选 → 一次测试 → 逐模型结果）。
 *
 * 一次 `runTest` 只发一次 invoke：后端命令对该供应商全部模型并行测试并整批
 * 返回。前端先把选中模型置 running，返回后按 modelId 写终态；invoke 整体
 * 失败时所有未终态模型置 error。
 */
export function useConnectivityTest(provider: Provider, appId: AppId) {
  const [results, setResults] = useState<ModelTestResults>({});

  const runTest = useCallback(
    async (
      modelIds: string[],
      params?: ConnectivityTestSettings,
    ): Promise<void> => {
      if (modelIds.length === 0) return;

      const seeded: ModelTestResults = {};
      for (const modelId of modelIds) {
        seeded[modelId] = { status: "running" };
      }
      setResults(seeded);

      try {
        const response = await connectivityTestProviderModels(
          appId,
          provider.id,
          params,
        );

        const finished: ModelTestResults = {};
        for (const item of response.results) {
          finished[item.modelId] = { status: item.status, result: item };
        }
        setResults((prev) => finalize({ ...prev, ...finished }));
      } catch (e) {
        const errorMessage = String(e);
        setResults((prev) => finalize(prev, errorMessage));
      }
    },
    [appId, provider.id],
  );

  const reset = useCallback(() => {
    setResults({});
  }, []);

  return { results, runTest, reset };
}

/**
 * 把仍未终态（waiting/running）的条目收敛为 error，避免后端漏返回结果时
 * 界面永远停在 running。正常流程不会触发；`errorMessage` 缺省用兜底说明。
 */
function finalize(
  results: ModelTestResults,
  errorMessage?: string,
): ModelTestResults {
  const next = { ...results };
  for (const modelId of Object.keys(next)) {
    const status = next[modelId].status;
    if (status === "waiting" || status === "running") {
      next[modelId] = {
        status: "error",
        errorMessage: errorMessage ?? "后端未返回该模型的测试结果",
      };
    }
  }
  return next;
}
