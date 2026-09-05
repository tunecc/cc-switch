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

/** 按被测 modelId 分发的 invoke mock：每个模型一个 deferred */
function invokeByModel() {
  const pending = new Map<string, { promise: Promise<unknown>; resolve: (v: unknown) => void; reject: (r?: unknown) => void }>();
  invokeMock.mockImplementation((_cmd: string, args: Record<string, unknown>) => {
    const id = (args.modelIds as string[])[0];
    const d = deferred<unknown>();
    pending.set(id, d);
    return d.promise;
  });
  return pending;
}

describe("useConnectivityTest", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("invokes per model (single-element modelIds) and streams row states", async () => {
    const pending = invokeByModel();

    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    let running: Promise<unknown> | undefined;
    act(() => {
      running = result.current.runTest(["model-a", "model-b"], {
        prompt: "ping",
        stream: true,
        timeoutSecs: 30,
      });
    });

    // 每模型一次独立 invoke，modelIds 为单元素（勾选即测试范围）
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(invokeMock).toHaveBeenCalledWith(
      "connectivity_test_provider_models",
      {
        appType: "claude",
        providerId: "provider-1",
        params: { prompt: "ping", stream: true, timeoutSecs: 30 },
        modelIds: ["model-a"],
      },
    );
    expect(invokeMock).toHaveBeenCalledWith(
      "connectivity_test_provider_models",
      {
        appType: "claude",
        providerId: "provider-1",
        params: { prompt: "ping", stream: true, timeoutSecs: 30 },
        modelIds: ["model-b"],
      },
    );

    // pending 期间两个模型均为 running
    expect(result.current.results["model-a"]).toEqual({ status: "running" });
    expect(result.current.results["model-b"]).toEqual({ status: "running" });

    // model-a 先返回：立即写终态，model-b 仍为 running（逐行流式更新）
    await act(async () => {
      pending.get("model-a")!.resolve({
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
        ],
      });
    });
    expect(result.current.results["model-a"]?.status).toBe("success");
    expect(result.current.results["model-a"]?.result?.totalMs).toBe(300);
    expect(result.current.results["model-b"]?.status).toBe("running");

    await act(async () => {
      pending.get("model-b")!.resolve({
        results: [
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
      await running;
    });
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

  it("maps full ConnectivityTestSettings onto backend params (headers/body → customHeaders/customBody)", async () => {
    invokeMock.mockResolvedValue({ results: [] });

    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    await act(async () => {
      await result.current.runTest(["model-a"], {
        prompt: "ping",
        defaultTestModelId: "model-a",
        stream: false,
        temperature: 0.7,
        maxTokens: 512,
        headers: { "X-Custom": "value" },
        body: { max_tokens: 64 },
        timeoutSecs: 15,
      });
    });

    // 锁定 toBackendParams 字段映射：后端 serde 只认 customHeaders/customBody；
    // defaultTestModelId 是纯前端字段，不进入命令参数
    expect(invokeMock).toHaveBeenCalledWith(
      "connectivity_test_provider_models",
      {
        appType: "claude",
        providerId: "provider-1",
        params: {
          prompt: "ping",
          stream: false,
          temperature: 0.7,
          maxTokens: 512,
          customHeaders: { "X-Custom": "value" },
          customBody: { max_tokens: 64 },
          timeoutSecs: 15,
        },
        modelIds: ["model-a"],
      },
    );
  });

  it("isolates invoke failure to that model only", async () => {
    invokeMock.mockImplementation((_cmd: string, args: Record<string, unknown>) => {
      const id = (args.modelIds as string[])[0];
      return id === "model-a"
        ? Promise.reject("供应商 provider-1 不支持连通性测试")
        : Promise.resolve({
            results: [
              {
                modelId: "model-b",
                status: "success",
                requestUrl: "https://example.com/v1/messages",
                requestHeaders: {},
                requestBody: { model: "model-b" },
              },
            ],
          });
    });

    const { result } = renderHook(() => useConnectivityTest(provider, "codex"));

    const outcome = await act(async () => {
      return await result.current.runTest(["model-a", "model-b"]);
    });

    // 单模型失败只影响该行，另一行照常写终态
    expect(result.current.results["model-a"]).toEqual({
      status: "error",
      errorMessage: "供应商 provider-1 不支持连通性测试",
    });
    expect(result.current.results["model-b"]?.status).toBe("success");

    // 返回的本轮终态快照供「测完自动勾选失败项」消费
    expect(outcome["model-a"]?.status).toBe("error");
    expect(outcome["model-b"]?.status).toBe("success");
  });

  it("finalizes a model missing from the response as error instead of leaving running", async () => {
    invokeMock.mockResolvedValue({ results: [] });

    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    await act(async () => {
      await result.current.runTest(["model-a"]);
    });

    expect(result.current.results["model-a"]?.status).toBe("error");
    expect(typeof result.current.results["model-a"]?.errorMessage).toBe(
      "string",
    );
  });

  it("returns an empty snapshot when no models are requested", async () => {
    const { result } = renderHook(() =>
      useConnectivityTest(provider, "claude"),
    );

    let outcome: Record<string, unknown> | undefined;
    await act(async () => {
      outcome = await result.current.runTest([]);
    });

    expect(outcome).toEqual({});
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
