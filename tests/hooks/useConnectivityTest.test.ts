import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConnectivityTest } from "@/hooks/useConnectivityTest";
import type { Provider } from "@/types";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const provider: Provider = {
  id: "provider-1",
  name: "Test Provider",
  settingsConfig: {
    modelCatalog: { models: [{ model: "model-a" }, { model: "model-b" }] },
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useConnectivityTest", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("marks all selected models running while the invoke is pending, then maps results by modelId", async () => {
    const { promise, resolve } = deferred<{ results: unknown[] }>();
    invokeMock.mockReturnValue(promise);

    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.runTest(["model-a", "model-b"], {
        prompt: "ping",
        stream: true,
        timeoutSecs: 30,
      });
    });

    // 单次 invoke 覆盖全部选中模型；参数名按后端 serde camelCase
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith(
      "connectivity_test_provider_models",
      {
        appType: "claude",
        providerId: "provider-1",
        params: { prompt: "ping", stream: true, timeoutSecs: 30 },
      },
    );

    // pending 期间全部选中模型为 running
    expect(result.current.results["model-a"]).toEqual({ status: "running" });
    expect(result.current.results["model-b"]).toEqual({ status: "running" });

    await act(async () => {
      resolve({
        results: [
          {
            modelId: "model-a",
            status: "success",
            firstByteMs: 120,
            totalMs: 300,
            requestUrl: "https://example.com/v1/messages",
            requestHeaders: {},
            requestBody: { model: "model-a" },
          },
          {
            modelId: "model-b",
            status: "error",
            errorMessage: "HTTP 401",
            requestUrl: "https://example.com/v1/messages",
            requestHeaders: {},
            requestBody: { model: "model-b" },
          },
        ],
      });
      await pending;
    });

    // 返回后按 modelId 写终态并携带完整结果
    expect(result.current.results["model-a"]?.status).toBe("success");
    expect(result.current.results["model-a"]?.result?.modelId).toBe("model-a");
    expect(result.current.results["model-a"]?.result?.totalMs).toBe(300);
    expect(result.current.results["model-b"]?.status).toBe("error");
    expect(result.current.results["model-b"]?.result?.errorMessage).toBe(
      "HTTP 401",
    );

    // reset 清空
    act(() => {
      result.current.reset();
    });
    expect(result.current.results).toEqual({});
  });

  it("marks every running model error with the invoke rejection message", async () => {
    invokeMock.mockRejectedValue("供应商 provider-1 不支持连通性测试");

    const { result } = renderHook(() => useConnectivityTest(provider, "codex"));

    await act(async () => {
      await result.current.runTest(["model-a", "model-b"]);
    });

    expect(invokeMock).toHaveBeenCalledWith(
      "connectivity_test_provider_models",
      {
        appType: "codex",
        providerId: "provider-1",
        params: undefined,
      },
    );
    expect(result.current.results["model-a"]).toEqual({
      status: "error",
      errorMessage: "供应商 provider-1 不支持连通性测试",
    });
    expect(result.current.results["model-b"]).toEqual({
      status: "error",
      errorMessage: "供应商 provider-1 不支持连通性测试",
    });
  });

  it("finalizes selected models missing from the response as error instead of leaving running", async () => {
    invokeMock.mockResolvedValue({
      results: [
        {
          modelId: "model-a",
          status: "success",
          requestUrl: "https://example.com/v1/messages",
          requestHeaders: {},
          requestBody: null,
        },
      ],
    });

    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    await act(async () => {
      await result.current.runTest(["model-a", "model-b"]);
    });

    expect(result.current.results["model-a"]?.status).toBe("success");
    expect(result.current.results["model-b"]?.status).toBe("error");
    expect(typeof result.current.results["model-b"]?.errorMessage).toBe(
      "string",
    );
  });
});
