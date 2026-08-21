import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAddProviderMutation } from "@/lib/query/mutations";
import type { Provider } from "@/types";

const apiMocks = vi.hoisted(() => ({
  add: vi.fn(),
  ensureClaudeDesktopOfficialProvider: vi.fn(),
  getAll: vi.fn(),
  updateTrayMenu: vi.fn(),
  updateSortOrder: vi.fn(),
}));

const uuidMocks = vi.hoisted(() => ({
  generateUUID: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  providersApi: {
    add: (...args: unknown[]) => apiMocks.add(...args),
    ensureClaudeDesktopOfficialProvider: (...args: unknown[]) =>
      apiMocks.ensureClaudeDesktopOfficialProvider(...args),
    getAll: (...args: unknown[]) => apiMocks.getAll(...args),
    updateTrayMenu: (...args: unknown[]) => apiMocks.updateTrayMenu(...args),
    updateSortOrder: (...args: unknown[]) => apiMocks.updateSortOrder(...args),
  },
  sessionsApi: {},
  settingsApi: {},
}));

vi.mock("@/utils/uuid", () => ({
  generateUUID: () => uuidMocks.generateUUID(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

beforeEach(() => {
  apiMocks.add.mockReset().mockResolvedValue(true);
  apiMocks.ensureClaudeDesktopOfficialProvider
    .mockReset()
    .mockResolvedValue(true);
  apiMocks.getAll.mockReset().mockResolvedValue({});
  apiMocks.updateTrayMenu.mockReset().mockResolvedValue(true);
  apiMocks.updateSortOrder.mockReset().mockResolvedValue(true);
  uuidMocks.generateUUID.mockReset().mockReturnValue("generated-uuid");
  toastMocks.success.mockReset();
  toastMocks.error.mockReset();
  toastMocks.warning.mockReset();
});

describe("useAddProviderMutation", () => {
  it("duplicates Claude Desktop official providers with a fresh id", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAddProviderMutation("claude-desktop"),
      { wrapper },
    );

    const duplicatedProvider = await act(async () =>
      result.current.mutateAsync({
        name: "Claude Desktop Official copy",
        settingsConfig: { env: {} },
        category: "official",
      }),
    );

    expect(apiMocks.ensureClaudeDesktopOfficialProvider).not.toHaveBeenCalled();
    expect(apiMocks.add).toHaveBeenCalledTimes(1);
    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-uuid",
        name: "Claude Desktop Official copy",
        category: "official",
      }),
      "claude-desktop",
      undefined,
    );
    expect(duplicatedProvider.id).toBe("generated-uuid");
    expect(duplicatedProvider.id).not.toBe("claude-desktop-official");
  });

  it("returns the persisted seed row for the Claude Desktop official preset", async () => {
    const seedProvider: Provider = {
      id: "claude-desktop-official",
      name: "Claude Desktop Official",
      settingsConfig: { env: {} },
      websiteUrl: "https://claude.ai/download",
      category: "official",
      icon: "anthropic",
      iconColor: "#D4915D",
      createdAt: 123,
    };
    apiMocks.getAll.mockResolvedValueOnce({
      "claude-desktop-official": seedProvider,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAddProviderMutation("claude-desktop"),
      { wrapper },
    );

    const persistedProvider = await act(async () =>
      result.current.mutateAsync({
        name: "Renamed by form",
        settingsConfig: { env: { ignored: true } },
        websiteUrl: "https://example.invalid",
        category: "official",
        icon: "custom-icon",
        ensureClaudeDesktopOfficialSeed: true,
      }),
    );

    expect(apiMocks.ensureClaudeDesktopOfficialProvider).toHaveBeenCalledTimes(
      1,
    );
    expect(apiMocks.getAll).toHaveBeenCalledWith("claude-desktop");
    expect(apiMocks.add).not.toHaveBeenCalled();
    expect(persistedProvider).toEqual(seedProvider);
  });

  it("adds a managed Codex account as a separate official card", async () => {
    const { wrapper, queryClient } = createWrapper();
    // 预置已有供应商，使新增走"插入第二位"的缓存路径而不触发 getAll 拉取。
    queryClient.setQueryData(["providers", "codex"], {
      providers: {
        "existing-codex": {
          id: "existing-codex",
          name: "Existing",
          settingsConfig: {},
          sortIndex: 0,
          createdAt: 1,
        },
      },
      currentProviderId: "existing-codex",
    });
    const { result } = renderHook(() => useAddProviderMutation("codex"), {
      wrapper,
    });

    const persistedProvider = await act(async () =>
      result.current.mutateAsync({
        name: "OpenAI Official",
        settingsConfig: { auth: {}, config: "" },
        category: "official",
        meta: {
          providerType: "codex_oauth",
          authBinding: {
            source: "managed_account",
            authProvider: "codex_oauth",
            accountId: "acct-managed",
          },
        },
      }),
    );

    expect(apiMocks.getAll).not.toHaveBeenCalled();
    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-uuid",
        category: "official",
        sortIndex: 1,
        meta: {
          providerType: "codex_oauth",
          authBinding: {
            source: "managed_account",
            authProvider: "codex_oauth",
            accountId: "acct-managed",
          },
        },
      }),
      "codex",
      undefined,
    );
    expect(persistedProvider).toEqual(
      expect.objectContaining({
        id: "generated-uuid",
        meta: expect.objectContaining({
          authBinding: expect.objectContaining({
            accountId: "acct-managed",
          }),
        }),
      }),
    );
  });

  it("adds every unbound Codex Official as an independent provider", async () => {
    uuidMocks.generateUUID
      .mockReset()
      .mockReturnValueOnce("unbound-official-1")
      .mockReturnValueOnce("unbound-official-2");
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["providers", "codex"], {
      providers: {
        "existing-codex": {
          id: "existing-codex",
          name: "Existing",
          settingsConfig: {},
          sortIndex: 0,
          createdAt: 1,
        },
      },
      currentProviderId: "existing-codex",
    });
    const { result } = renderHook(() => useAddProviderMutation("codex"), {
      wrapper,
    });

    const firstProvider = await act(async () =>
      result.current.mutateAsync({
        name: "OpenAI Official 1",
        settingsConfig: { auth: {}, config: "" },
        category: "official",
        meta: { providerType: "codex_oauth" },
      }),
    );
    const secondProvider = await act(async () =>
      result.current.mutateAsync({
        name: "OpenAI Official 2",
        settingsConfig: { auth: {}, config: "" },
        category: "official",
        meta: { providerType: "codex_oauth" },
      }),
    );

    expect(apiMocks.getAll).not.toHaveBeenCalled();
    expect(apiMocks.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: "unbound-official-1",
        meta: { providerType: "codex_oauth" },
      }),
      "codex",
      undefined,
    );
    expect(apiMocks.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: "unbound-official-2",
        meta: { providerType: "codex_oauth" },
      }),
      "codex",
      undefined,
    );
    expect(firstProvider.id).toBe("unbound-official-1");
    expect(secondProvider.id).toBe("unbound-official-2");
  });

  it("adds a Pi provider without a separate default-model command", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddProviderMutation("pi"), {
      wrapper,
    });

    const provider = await act(async () =>
      result.current.mutateAsync({
        name: "Pi Provider",
        providerKey: "pi-provider",
        settingsConfig: {
          api: "openai-responses",
          baseUrl: "https://example.com/v1",
          apiKey: "secret",
          models: [{ id: "model-a" }],
        },
      }),
    );

    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pi-provider" }),
      "pi",
      undefined,
    );
    expect(provider.id).toBe("pi-provider");
  });

  it("reports a Pi provider add failure", async () => {
    apiMocks.add.mockRejectedValueOnce(new Error("provider add failed"));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddProviderMutation("pi"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          name: "Pi Provider",
          providerKey: "pi-provider",
          settingsConfig: { models: [{ id: "model-a" }] },
        }),
      ).rejects.toThrow("provider add failed");
    });

    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pi-provider" }),
      "pi",
      undefined,
    );
    expect(toastMocks.error).toHaveBeenCalled();
    expect(toastMocks.warning).not.toHaveBeenCalled();
  });

  it("inserts a new provider at the second position and shifts existing items", async () => {
    const { wrapper, queryClient } = createWrapper();
    // 现有列表 [A, B, C]，sortIndex 分别 0/1/2
    queryClient.setQueryData(["providers", "claude"], {
      providers: {
        a: {
          id: "a",
          name: "A",
          settingsConfig: {},
          sortIndex: 0,
          createdAt: 1,
        },
        b: {
          id: "b",
          name: "B",
          settingsConfig: {},
          sortIndex: 1,
          createdAt: 2,
        },
        c: {
          id: "c",
          name: "C",
          settingsConfig: {},
          sortIndex: 2,
          createdAt: 3,
        },
      },
      currentProviderId: "a",
    });
    const { result } = renderHook(() => useAddProviderMutation("claude"), {
      wrapper,
    });

    const newProvider = await act(async () =>
      result.current.mutateAsync({
        name: "D",
        settingsConfig: {},
        category: "custom",
      }),
    );

    // 让位：第 0 项保持 0，其余 +1；新项 sortIndex=1（插入第二位）
    expect(apiMocks.updateSortOrder).toHaveBeenCalledTimes(1);
    expect(apiMocks.updateSortOrder).toHaveBeenCalledWith(
      [
        { id: "a", sortIndex: 0 },
        { id: "b", sortIndex: 2 },
        { id: "c", sortIndex: 3 },
      ],
      "claude",
    );
    expect(newProvider.sortIndex).toBe(1);
    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "generated-uuid", sortIndex: 1 }),
      "claude",
      undefined,
    );
  });

  it("does not shift items and leaves sortIndex unset when the list is empty", async () => {
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["providers", "claude"], {
      providers: {},
      currentProviderId: "",
    });
    const { result } = renderHook(() => useAddProviderMutation("claude"), {
      wrapper,
    });

    const newProvider = await act(async () =>
      result.current.mutateAsync({
        name: "X",
        settingsConfig: {},
        category: "custom",
      }),
    );

    expect(apiMocks.updateSortOrder).not.toHaveBeenCalled();
    expect(newProvider.sortIndex).toBeUndefined();
    expect(apiMocks.add).toHaveBeenCalledWith(
      expect.not.objectContaining({ sortIndex: expect.anything() }),
      "claude",
      undefined,
    );
  });

  it("explicitly assigned sortIndex bypasses the insert-at-second logic", async () => {
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["providers", "claude"], {
      providers: {
        a: {
          id: "a",
          name: "A",
          settingsConfig: {},
          sortIndex: 0,
          createdAt: 1,
        },
      },
      currentProviderId: "a",
    });
    const { result } = renderHook(() => useAddProviderMutation("claude"), {
      wrapper,
    });

    const newProvider = await act(async () =>
      result.current.mutateAsync({
        name: "Dup",
        settingsConfig: {},
        sortIndex: 1,
      }),
    );

    expect(apiMocks.updateSortOrder).not.toHaveBeenCalled();
    expect(newProvider.sortIndex).toBe(1);
  });

  it("falls back to getAll when the providers cache is empty for the app", async () => {
    apiMocks.getAll.mockResolvedValueOnce({
      a: { id: "a", name: "A", settingsConfig: {}, sortIndex: 0, createdAt: 1 },
    });
    const { wrapper, queryClient } = createWrapper();
    // 缓存中没有该 app 的 providers（length === 0）
    queryClient.setQueryData(["providers", "claude"], {
      providers: {},
      currentProviderId: "",
    });
    const { result } = renderHook(() => useAddProviderMutation("claude"), {
      wrapper,
    });

    await act(async () =>
      result.current.mutateAsync({
        name: "D",
        settingsConfig: {},
        category: "custom",
      }),
    );

    expect(apiMocks.getAll).toHaveBeenCalledWith("claude");
    expect(apiMocks.updateSortOrder).toHaveBeenCalledTimes(1);
    expect(apiMocks.updateSortOrder).toHaveBeenCalledWith(
      [{ id: "a", sortIndex: 0 }],
      "claude",
    );
  });

  it("materializes sortIndex for undefined-sortIndex items so the new item lands second", async () => {
    const { wrapper, queryClient } = createWrapper();
    // 所有现有项 sortIndex 未定义：经 useDragSort 排序后顺序为 A,B,C
    queryClient.setQueryData(["providers", "claude"], {
      providers: {
        a: { id: "a", name: "A", settingsConfig: {}, createdAt: 1 },
        b: { id: "b", name: "B", settingsConfig: {}, createdAt: 2 },
        c: { id: "c", name: "C", settingsConfig: {}, createdAt: 3 },
      },
      currentProviderId: "",
    });
    const { result } = renderHook(() => useAddProviderMutation("claude"), {
      wrapper,
    });

    const newProvider = await act(async () =>
      result.current.mutateAsync({
        name: "D",
        settingsConfig: {},
        category: "custom",
      }),
    );

    // 让位把所有现有项显式化：A→0, B→2, C→3；新项 sortIndex=1
    expect(apiMocks.updateSortOrder).toHaveBeenCalledWith(
      [
        { id: "a", sortIndex: 0 },
        { id: "b", sortIndex: 2 },
        { id: "c", sortIndex: 3 },
      ],
      "claude",
    );
    expect(newProvider.sortIndex).toBe(1);
  });
});
