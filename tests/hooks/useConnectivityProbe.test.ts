import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConnectivityProbe } from "@/hooks/useConnectivityProbe";
import type { Provider } from "@/types";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const probeResult = (modelId: string) => ({
  modelId,
  status: "success",
  totalMs: 123,
  requestUrl: "https://example.com/v1/messages",
  requestHeaders: {},
  requestBody: null,
});

function makeProvider(overrides: Partial<Provider>): Provider {
  return {
    id: "provider",
    name: "Provider",
    settingsConfig: {
      modelCatalog: { models: [{ model: "probe-model" }] },
    },
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useConnectivityProbe", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("skips official / dynamic-endpoint / model-less providers and only probes the rest", async () => {
    invokeMock.mockImplementation(
      (_cmd: string, args: Record<string, unknown>) =>
        Promise.resolve(probeResult(String(args.modelId))),
    );

    const providers: Provider[] = [
      makeProvider({ id: "third-party" }),
      makeProvider({ id: "official", category: "official" }),
      makeProvider({
        id: "codex-oauth",
        meta: { providerType: "codex_oauth" },
      }),
      makeProvider({ id: "xai-oauth", meta: { providerType: "xai_oauth" } }),
      makeProvider({ id: "copilot", meta: { providerType: "github_copilot" } }),
      makeProvider({ id: "no-models", settingsConfig: {} }),
    ];

    const { result } = renderHook(() => useConnectivityProbe("claude"));

    await act(async () => {
      await result.current.probeAll(providers);
    });

    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith("connectivity_probe_provider", {
      appType: "claude",
      providerId: "third-party",
      modelId: "probe-model",
      timeoutSecs: undefined,
    });
    expect(result.current.results["third-party"]).toEqual({
      status: "success",
      totalMs: 123,
    });
    for (const skipped of [
      "official",
      "codex-oauth",
      "xai-oauth",
      "copilot",
      "no-models",
    ]) {
      expect(result.current.results[skipped]).toBeUndefined();
    }

    act(() => {
      result.current.clear();
    });
    expect(result.current.results).toEqual({});
  });

  it("probes the saved defaultTestModelId before the first catalog model", async () => {
    invokeMock.mockImplementation(
      (_cmd: string, args: Record<string, unknown>) =>
        Promise.resolve(probeResult(String(args.modelId))),
    );

    const providers: Provider[] = [
      makeProvider({
        id: "with-default",
        settingsConfig: {
          connectivityTest: { defaultTestModelId: "favorite-model" },
          modelCatalog: { models: [{ model: "catalog-model" }] },
        },
      }),
    ];

    const { result } = renderHook(() => useConnectivityProbe("claude"));

    await act(async () => {
      await result.current.probeAll(providers);
    });

    expect(invokeMock).toHaveBeenCalledWith("connectivity_probe_provider", {
      appType: "claude",
      providerId: "with-default",
      modelId: "favorite-model",
      timeoutSecs: undefined,
    });
  });

  it("falls back to env.ANTHROPIC_MODEL for claude providers without modelCatalog", async () => {
    invokeMock.mockImplementation(
      (_cmd: string, args: Record<string, unknown>) =>
        Promise.resolve(probeResult(String(args.modelId))),
    );

    const providers: Provider[] = [
      makeProvider({
        id: "env-only",
        settingsConfig: { env: { ANTHROPIC_MODEL: "kimi-k2.7-code" } },
      }),
    ];

    const { result } = renderHook(() => useConnectivityProbe("claude"));

    await act(async () => {
      await result.current.probeAll(providers);
    });

    expect(invokeMock).toHaveBeenCalledWith("connectivity_probe_provider", {
      appType: "claude",
      providerId: "env-only",
      modelId: "kimi-k2.7-code",
      timeoutSecs: undefined,
    });
  });

  it("clears results and never invokes for apps outside the first-phase scope", async () => {
    invokeMock.mockResolvedValue(probeResult("probe-model"));

    const providers: Provider[] = [makeProvider({ id: "third-party" })];
    const { result } = renderHook(() => useConnectivityProbe("gemini"));

    await act(async () => {
      await result.current.probeAll(providers);
    });

    expect(invokeMock).not.toHaveBeenCalled();
    expect(result.current.results).toEqual({});
  });

  it("keeps at most 5 probes in flight and continues the pool after a rejection", async () => {
    const gates = Array.from({ length: 7 }, () => deferred<unknown>());
    let call = 0;
    invokeMock.mockImplementation(() => gates[call++].promise);

    const providers = Array.from({ length: 7 }, (_, i) =>
      makeProvider({ id: `p${i}` }),
    );
    const { result } = renderHook(() => useConnectivityProbe("claude"));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.probeAll(providers);
    });

    // 并发度 5：仅前 5 个进入 running，其余排队 waiting
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(5);
    });
    expect(result.current.results["p0"]?.status).toBe("running");
    expect(result.current.results["p4"]?.status).toBe("running");
    expect(result.current.results["p5"]?.status).toBe("waiting");
    expect(result.current.results["p6"]?.status).toBe("waiting");

    await act(async () => {
      gates[0].reject(new Error("boom"));
      gates[1].resolve(probeResult("m1"));
      gates[2].resolve(probeResult("m2"));
      gates[3].resolve(probeResult("m3"));
      gates[4].resolve(probeResult("m4"));
    });

    // 空出的 worker 继续拉起排队项
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(7);
    });
    expect(result.current.results["p5"]?.status).toBe("running");

    await act(async () => {
      gates[5].resolve(probeResult("m5"));
      gates[6].resolve(probeResult("m6"));
      await pending;
    });

    // 单个失败不影响池：p0 error，其余全部成功
    expect(result.current.results["p0"]).toEqual({
      status: "error",
      errorMessage: "Error: boom",
    });
    expect(result.current.results["p1"]).toEqual({
      status: "success",
      totalMs: 123,
    });
    expect(result.current.results["p6"]).toEqual({
      status: "success",
      totalMs: 123,
    });
  });

  it("stopProbe clears waiting/running badges and discards late in-flight results", async () => {
    const gates = Array.from({ length: 5 }, () => deferred<unknown>());
    let call = 0;
    invokeMock.mockImplementation(() => gates[call++].promise);

    const providers = Array.from({ length: 5 }, (_, i) =>
      makeProvider({ id: `p${i}` }),
    );
    const { result } = renderHook(() => useConnectivityProbe("claude"));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.probeAll(providers);
    });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(5);
    });
    expect(result.current.results["p2"]?.status).toBe("running");

    act(() => {
      result.current.stopProbe();
    });

    // waiting/running 徽标立即清除
    expect(result.current.results).toEqual({});

    await act(async () => {
      gates[0].resolve(probeResult("m0"));
      gates[1].reject(new Error("late boom"));
      // 其余在途请求也返回（迟到结果一律按代次丢弃）
      gates[2].resolve(probeResult("m2"));
      gates[3].resolve(probeResult("m3"));
      gates[4].resolve(probeResult("m4"));
      await pending;
    });

    // 在途请求返回后按代次丢弃，不写回结果
    expect(result.current.results).toEqual({});
  });

  it("stopProbe keeps finished badges and stops queued items from starting", async () => {
    const gates = Array.from({ length: 7 }, () => deferred<unknown>());
    let call = 0;
    invokeMock.mockImplementation(() => gates[call++].promise);

    const providers = Array.from({ length: 7 }, (_, i) =>
      makeProvider({ id: `p${i}` }),
    );
    const { result } = renderHook(() => useConnectivityProbe("claude"));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.probeAll(providers);
    });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(5);
    });

    // 先完成 p0；空出的 worker 会拉起排队项 p5
    await act(async () => {
      gates[0].resolve(probeResult("m0"));
    });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(6);
    });
    expect(result.current.results["p0"]).toEqual({
      status: "success",
      totalMs: 123,
    });

    act(() => {
      result.current.stopProbe();
    });

    // 已完成结果保留；running / waiting 清除
    expect(result.current.results).toEqual({
      p0: { status: "success", totalMs: 123 },
    });

    await act(async () => {
      gates[1].resolve(probeResult("m1"));
      gates[2].resolve(probeResult("m2"));
      gates[3].resolve(probeResult("m3"));
      gates[4].resolve(probeResult("m4"));
      gates[5].resolve(probeResult("m5"));
      await pending;
    });

    // p6 永不被拉起，迟到结果全部按代次丢弃
    expect(invokeMock).toHaveBeenCalledTimes(6);
    expect(result.current.results).toEqual({
      p0: { status: "success", totalMs: 123 },
    });
  });

  it("a new probeAll supersedes the previous run's late results", async () => {
    const first = deferred<unknown>();
    const second = deferred<unknown>();
    let call = 0;
    invokeMock.mockImplementation(() =>
      call++ === 0 ? first.promise : second.promise,
    );

    const p0 = makeProvider({ id: "first-run" });
    const p1 = makeProvider({ id: "second-run" });
    const { result } = renderHook(() => useConnectivityProbe("claude"));

    let firstPending: Promise<void> | undefined;
    act(() => {
      firstPending = result.current.probeAll([p0]);
    });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(1);
    });

    // 第二轮启动：第一轮成为过期代次
    let secondPending: Promise<void> | undefined;
    act(() => {
      secondPending = result.current.probeAll([p1]);
    });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      first.resolve(probeResult("late"));
      second.resolve(probeResult("fresh"));
      await Promise.all([firstPending, secondPending]);
    });

    // 旧代次的迟到结果被丢弃，新代次正常写入
    expect(result.current.results["first-run"]).toBeUndefined();
    expect(result.current.results["second-run"]).toEqual({
      status: "success",
      totalMs: 123,
    });
  });
});
