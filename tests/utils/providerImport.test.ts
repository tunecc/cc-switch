import { describe, expect, it } from "vitest";
import type { CodexApiFormat, Provider } from "@/types";
import { extractCodexModelName } from "@/utils/providerConfigUtils";
import {
  buildImportedSettingsConfig,
  patchImportedSettingsConfig,
  readImportableProviderFields,
  resolveImportedApiFormat,
  targetSupportsApiFormat,
  targetSupportsDefaultModel,
} from "@/utils/providerImport";

const provider = (
  settingsConfig: Record<string, unknown>,
  extra: Partial<Provider> = {},
): Provider => ({
  id: "p1",
  name: "  Relay One  ",
  settingsConfig,
  notes: "  主力通道  ",
  websiteUrl: "  https://relay.example.com  ",
  ...extra,
});

describe("readImportableProviderFields", () => {
  it("reads claude credentials, default model and api format", () => {
    const fields = readImportableProviderFields(
      "claude",
      provider(
        {
          env: {
            ANTHROPIC_BASE_URL: "https://relay.example.com/api",
            ANTHROPIC_AUTH_TOKEN: "sk-ant",
            ANTHROPIC_MODEL: "claude-sonnet-4-5",
          },
        },
        { meta: { apiFormat: "anthropic" } },
      ),
    );

    expect(fields).toEqual({
      name: "Relay One",
      notes: "主力通道",
      websiteUrl: "https://relay.example.com",
      baseUrl: "https://relay.example.com/api",
      apiKey: "sk-ant",
      defaultModel: "claude-sonnet-4-5",
      apiFormat: "anthropic",
    });
  });

  it("falls back to ANTHROPIC_API_KEY for claude and claude-desktop", () => {
    for (const appId of ["claude", "claude-desktop"] as const) {
      const fields = readImportableProviderFields(
        appId,
        provider({ env: { ANTHROPIC_API_KEY: "sk-plain" } }),
      );
      expect(fields.apiKey).toBe("sk-plain");
    }
  });

  it("reads codex credentials from auth.json and config.toml", () => {
    const fields = readImportableProviderFields(
      "codex",
      provider({
        auth: { OPENAI_API_KEY: "sk-codex" },
        config: [
          'model_provider = "custom"',
          'model = "gpt-5.6-sol"',
          "",
          "[model_providers.custom]",
          'base_url = "https://relay.example.com/v1"',
          'wire_api = "responses"',
        ].join("\n"),
      }),
    );

    expect(fields.baseUrl).toBe("https://relay.example.com/v1");
    expect(fields.apiKey).toBe("sk-codex");
    expect(fields.defaultModel).toBe("gpt-5.6-sol");
  });

  it("falls back to experimental_bearer_token for codex keys", () => {
    const fields = readImportableProviderFields(
      "codex",
      provider({
        auth: {},
        config: [
          'model = "gpt-5.6-sol"',
          'experimental_bearer_token = "sk-bearer"',
          "",
          "[model_providers.custom]",
          'base_url = "https://relay.example.com/v1"',
        ].join("\n"),
      }),
    );

    expect(fields.apiKey).toBe("sk-bearer");
  });

  it("reads gemini credentials and default model", () => {
    const fields = readImportableProviderFields(
      "gemini",
      provider({
        env: {
          GOOGLE_GEMINI_BASE_URL: "https://relay.example.com",
          GEMINI_API_KEY: "sk-gem",
          GEMINI_MODEL: "gemini-3.6-flash",
        },
      }),
    );

    expect(fields.baseUrl).toBe("https://relay.example.com");
    expect(fields.apiKey).toBe("sk-gem");
    expect(fields.defaultModel).toBe("gemini-3.6-flash");
  });

  it("reads grokbuild credentials from its model table", () => {
    const fields = readImportableProviderFields(
      "grokbuild",
      provider({
        config: [
          "[models]",
          'default = "grok-4-5"',
          "",
          "[model.grok-4-5]",
          'model = "grok-4-5-reasoning"',
          'base_url = "https://grok.example.com/v1"',
          'api_key = "sk-grok"',
        ].join("\n"),
      }),
    );

    expect(fields.baseUrl).toBe("https://grok.example.com/v1");
    expect(fields.apiKey).toBe("sk-grok");
    // grokbuild 没有"默认模型"字段，upstreamModel 不作为兜底模型迁出
    expect(fields.defaultModel).toBe("");
  });

  it("reads opencode and mcode credentials from options", () => {
    for (const appId of ["opencode", "mcode"] as const) {
      const fields = readImportableProviderFields(
        appId,
        provider({ options: { baseURL: "https://oc.example.com/v1", apiKey: "sk-oc" } }),
      );
      expect(fields.baseUrl).toBe("https://oc.example.com/v1");
      expect(fields.apiKey).toBe("sk-oc");
      expect(fields.defaultModel).toBe("");
    }
  });

  it("reads openclaw / hermes / pi credentials from their own keys", () => {
    expect(readImportableProviderFields("openclaw", provider({ baseUrl: "https://oc.example.com", apiKey: "sk-claw" })))
      .toMatchObject({ baseUrl: "https://oc.example.com", apiKey: "sk-claw" });
    expect(readImportableProviderFields("hermes", provider({ base_url: "https://h.example.com", api_key: "sk-hermes" })))
      .toMatchObject({ baseUrl: "https://h.example.com", apiKey: "sk-hermes" });
    expect(readImportableProviderFields("pi", provider({ baseUrl: "https://pi.example.com", apiKey: "sk-pi" })))
      .toMatchObject({ baseUrl: "https://pi.example.com", apiKey: "sk-pi" });
  });

  it("returns empty strings instead of undefined for missing fields", () => {
    const fields = readImportableProviderFields("claude", provider({}));
    expect(fields.baseUrl).toBe("");
    expect(fields.apiKey).toBe("");
    expect(fields.defaultModel).toBe("");
    // apiFormat 是唯一允许缺席的字段（来源没声明就没有）
    expect(fields.apiFormat).toBeUndefined();
    expect(
      [fields.name, fields.notes, fields.websiteUrl, fields.baseUrl, fields.apiKey, fields.defaultModel].every(
        (value) => value !== undefined,
      ),
    ).toBe(true);
  });

  it("ignores malformed settingsConfig instead of throwing", () => {
    const fields = readImportableProviderFields(
      "codex",
      provider({ config: "not [ valid toml" }),
    );
    expect(fields.baseUrl).toBe("");
    expect(fields.defaultModel).toBe("");
  });
});

describe("resolveImportedApiFormat", () => {
  it("passes through the three formats shared by claude and codex", () => {
    for (const format of ["anthropic", "openai_chat", "openai_responses"]) {
      expect(resolveImportedApiFormat("claude", format)).toBe(format);
      expect(resolveImportedApiFormat("codex", format)).toBe(format);
    }
  });

  it("keeps gemini_native only for targets that support it", () => {
    expect(resolveImportedApiFormat("claude", "gemini_native")).toBe(
      "gemini_native",
    );
    expect(resolveImportedApiFormat("codex", "gemini_native")).toBeUndefined();
  });

  it("returns undefined for targets that never persist apiFormat", () => {
    for (const appId of ["gemini", "opencode", "openclaw", "hermes", "pi", "mcode"] as const) {
      expect(targetSupportsApiFormat(appId)).toBe(false);
      expect(resolveImportedApiFormat(appId, "anthropic")).toBeUndefined();
    }
  });

  it("returns undefined when the source declares no format", () => {
    expect(resolveImportedApiFormat("claude", undefined)).toBeUndefined();
    expect(resolveImportedApiFormat("claude", "")).toBeUndefined();
  });
});

describe("buildImportedSettingsConfig", () => {
  const fields = {
    baseUrl: "https://relay.example.com/v1",
    apiKey: "sk-shared",
    defaultModel: "claude-sonnet-4-5",
  };

  it("writes claude env keys", () => {
    expect(buildImportedSettingsConfig("claude", fields)).toEqual({
      env: {
        ANTHROPIC_BASE_URL: "https://relay.example.com/v1",
        ANTHROPIC_AUTH_TOKEN: "sk-shared",
        ANTHROPIC_MODEL: "claude-sonnet-4-5",
      },
    });
  });

  it("writes codex auth.json plus config.toml and keeps wire_api = responses", () => {
    const config = buildImportedSettingsConfig("codex", fields);
    expect(config.auth).toEqual({ OPENAI_API_KEY: "sk-shared" });
    const toml = String(config.config);
    expect(toml).toContain('base_url = "https://relay.example.com/v1"');
    expect(toml).toContain('model = "claude-sonnet-4-5"');
    expect(toml).toContain('wire_api = "responses"');
  });

  it("matches each app's own custom template when every field is empty", () => {
    // claude 的自定义模板是 {env:{}}：缺项不落键
    expect(buildImportedSettingsConfig("claude", { baseUrl: "", apiKey: "", defaultModel: "" })).toEqual({
      env: {},
    });
    // codex 的模板是 {auth:{OPENAI_API_KEY:""}, config:…}：空值落空串
    const codex = buildImportedSettingsConfig("codex", {
      baseUrl: "",
      apiKey: "",
      defaultModel: "",
    });
    expect(codex.auth).toEqual({ OPENAI_API_KEY: "" });
    expect(String(codex.config)).toContain('model_provider = "custom"');
    expect(extractCodexModelName(String(codex.config))).toBeUndefined();
  });

  it("writes gemini env keys", () => {
    expect(
      buildImportedSettingsConfig("gemini", {
        baseUrl: "https://relay.example.com",
        apiKey: "sk-gem",
        defaultModel: "gemini-3.6-flash",
      }),
    ).toEqual({
      env: {
        GOOGLE_GEMINI_BASE_URL: "https://relay.example.com",
        GEMINI_API_KEY: "sk-gem",
        GEMINI_MODEL: "gemini-3.6-flash",
      },
    });
  });

  it("writes grokbuild through its own config builder without taking the source model", () => {
    const config = buildImportedSettingsConfig("grokbuild", {
      baseUrl: "https://grok.example.com/v1",
      apiKey: "sk-grok",
      defaultModel: "claude-sonnet-4-5",
    });
    const toml = String(config.config);
    expect(toml).toContain('base_url = "https://grok.example.com/v1"');
    expect(toml).toContain('api_key = "sk-grok"');
    // grokbuild 没有默认模型字段，来源模型不得悄悄落到 upstreamModel 上
    expect(toml).not.toContain("claude-sonnet-4-5");
    expect(toml).toContain('model = "grok-4.5"');
  });

  it("writes opencode / mcode options", () => {
    expect(
      buildImportedSettingsConfig("opencode", {
        baseUrl: "https://oc.example.com/v1",
        apiKey: "sk-oc",
        defaultModel: "",
      }),
    ).toEqual({
      npm: "@ai-sdk/openai-compatible",
      options: { baseURL: "https://oc.example.com/v1", apiKey: "sk-oc" },
      models: {},
    });
    expect(
      buildImportedSettingsConfig("mcode", {
        baseUrl: "https://oc.example.com/v1",
        apiKey: "sk-oc",
        defaultModel: "",
      }),
    ).toEqual({
      kind: "custom",
      enabled: true,
      api: "anthropic-messages",
      options: { baseURL: "https://oc.example.com/v1", apiKey: "sk-oc" },
      models: {},
    });
  });

  it("writes openclaw / hermes / pi shapes", () => {
    expect(
      buildImportedSettingsConfig("openclaw", {
        baseUrl: "https://claw.example.com",
        apiKey: "sk-claw",
        defaultModel: "",
      }),
    ).toEqual({
      baseUrl: "https://claw.example.com",
      apiKey: "sk-claw",
      api: "openai-completions",
      models: [],
    });
    expect(
      buildImportedSettingsConfig("hermes", {
        baseUrl: "https://h.example.com",
        apiKey: "sk-hermes",
        defaultModel: "",
      }),
    ).toEqual({
      name: "",
      base_url: "https://h.example.com",
      api_key: "sk-hermes",
    });
    expect(
      buildImportedSettingsConfig("pi", {
        baseUrl: "https://pi.example.com",
        apiKey: "sk-pi",
        defaultModel: "",
      }),
    ).toEqual({
      baseUrl: "https://pi.example.com",
      api: "openai-completions",
      apiKey: "sk-pi",
      models: [],
    });
  });
});

describe("default model support", () => {
  it("is limited to claude, codex and gemini", () => {
    expect(targetSupportsDefaultModel("claude")).toBe(true);
    expect(targetSupportsDefaultModel("codex")).toBe(true);
    expect(targetSupportsDefaultModel("gemini")).toBe(true);
    for (const appId of [
      "claude-desktop",
      "grokbuild",
      "opencode",
      "openclaw",
      "hermes",
      "pi",
      "mcode",
    ] as const) {
      expect(targetSupportsDefaultModel(appId)).toBe(false);
    }
  });
});

describe("cross-app round trips", () => {
  const claudeSource = provider(
    {
      env: {
        ANTHROPIC_BASE_URL: "https://relay.example.com/api",
        ANTHROPIC_AUTH_TOKEN: "sk-shared",
        ANTHROPIC_MODEL: "claude-sonnet-4-5",
      },
    },
    { meta: { apiFormat: "anthropic" } },
  );

  it("claude -> codex -> claude keeps the address verbatim", () => {
    const fromClaude = readImportableProviderFields("claude", claudeSource);
    const codexConfig = buildImportedSettingsConfig("codex", fromClaude);
    const asCodexProvider = provider(codexConfig, {
      name: fromClaude.name,
      meta: {
        apiFormat: resolveImportedApiFormat(
          "codex",
          fromClaude.apiFormat,
        ) as CodexApiFormat | undefined,
      },
    });
    const fromCodex = readImportableProviderFields("codex", asCodexProvider);

    expect(fromCodex.baseUrl).toBe(fromClaude.baseUrl);
    expect(fromCodex.apiKey).toBe(fromClaude.apiKey);
    expect(fromCodex.defaultModel).toBe(fromClaude.defaultModel);
  });

  it("claude -> gemini -> claude keeps the address verbatim", () => {
    const fromClaude = readImportableProviderFields("claude", claudeSource);
    const geminiConfig = buildImportedSettingsConfig("gemini", fromClaude);
    const fromGemini = readImportableProviderFields("gemini", provider(geminiConfig));

    expect(fromGemini.baseUrl).toBe(fromClaude.baseUrl);
    expect(fromGemini.apiKey).toBe(fromClaude.apiKey);
    expect(fromGemini.defaultModel).toBe(fromClaude.defaultModel);
  });

  it("opencode -> claude carries base URL and key", () => {
    const source = provider({
      options: { baseURL: "https://relay.example.com/v1", apiKey: "sk-oc" },
    });
    const fromOpencode = readImportableProviderFields("opencode", source);
    const claudeConfig = buildImportedSettingsConfig("claude", fromOpencode);

    expect(claudeConfig).toEqual({
      env: {
        ANTHROPIC_BASE_URL: "https://relay.example.com/v1",
        ANTHROPIC_AUTH_TOKEN: "sk-oc",
      },
    });
  });

  it("hermes -> codex carries base URL and key", () => {
    const source = provider({ base_url: "https://relay.example.com/v1", api_key: "sk-hermes" });
    const fromHermes = readImportableProviderFields("hermes", source);
    const codexConfig = buildImportedSettingsConfig("codex", fromHermes);

    expect(codexConfig.auth).toEqual({ OPENAI_API_KEY: "sk-hermes" });
    expect(String(codexConfig.config)).toContain(
      'base_url = "https://relay.example.com/v1"',
    );
  });

  it("never leaks the api key into the writable field summary inputs", () => {
    // 弹窗只读 name/notes/baseUrl；这里固定住该契约——readImportableProviderFields
    // 返回 key 供表单写入，但展示层不得引用它。
    const fields = readImportableProviderFields("claude", claudeSource);
    expect(JSON.stringify([fields.name, fields.notes, fields.baseUrl])).not.toContain(
      "sk-shared",
    );
  });
});

describe("default model is only read where the target has a field", () => {
  it("does not read ANTHROPIC_MODEL from claude-desktop", () => {
    const fields = readImportableProviderFields(
      "claude-desktop",
      provider({
        env: {
          ANTHROPIC_BASE_URL: "https://a.example.com",
          ANTHROPIC_AUTH_TOKEN: "sk-a",
          ANTHROPIC_MODEL: "claude-sonnet-4-5",
        },
      }),
    );
    // claude-desktop 的 env 从不落 ANTHROPIC_MODEL（提交时按 baseUrl/apiKey 重建）
    expect(fields.defaultModel).toBe("");
    expect(fields.baseUrl).toBe("https://a.example.com");
    expect(fields.apiKey).toBe("sk-a");
  });

  it("does not read upstreamModel from grokbuild", () => {
    const fields = readImportableProviderFields(
      "grokbuild",
      provider({
        config: [
          "[models]",
          'default = "grok-4-5"',
          "",
          "[model.grok-4-5]",
          'model = "grok-4-5-reasoning"',
          'base_url = "https://grok.example.com/v1"',
          'api_key = "sk-grok"',
        ].join("\n"),
      }),
    );
    expect(fields.defaultModel).toBe("");
    expect(fields.baseUrl).toBe("https://grok.example.com/v1");
    expect(fields.apiKey).toBe("sk-grok");
  });

  it("only supports apiFormat migration where the save path persists it", () => {
    expect(targetSupportsApiFormat("claude")).toBe(true);
    expect(targetSupportsApiFormat("codex")).toBe(true);
    expect(targetSupportsApiFormat("grokbuild")).toBe(true);
    // claude-desktop 只在 proxy 模式持久化 apiFormat，承诺写入门槛太高
    expect(targetSupportsApiFormat("claude-desktop")).toBe(false);
    expect(resolveImportedApiFormat("claude-desktop", "openai_chat")).toBeUndefined();
  });
});

describe("buildImportedSettingsConfig: codex default model", () => {
  it("leaves the model field empty when the source has none", () => {
    const config = buildImportedSettingsConfig("codex", {
      baseUrl: "https://relay.example.com/v1",
      apiKey: "sk-shared",
      defaultModel: "",
    });
    const toml = String(config.config);
    // 不得保留自定义模板自带的占位模型
    expect(toml).not.toContain('model = "gpt-5.6-sol"');
    expect(extractCodexModelName(toml)).toBeUndefined();
    expect(toml).toContain('base_url = "https://relay.example.com/v1"');
    expect(toml).toContain('wire_api = "responses"');
  });

  it("writes the source model when there is one", () => {
    const config = buildImportedSettingsConfig("codex", {
      baseUrl: "",
      apiKey: "",
      defaultModel: "gpt-5.6-sol",
    });
    expect(extractCodexModelName(String(config.config))).toBe("gpt-5.6-sol");
  });
});

describe("patchImportedSettingsConfig", () => {
  const importable = {
    baseUrl: "https://relay.example.com/api",
    apiKey: "sk-shared",
    defaultModel: "claude-sonnet-4-5",
  };

  it("claude: overwrites only the imported env keys and keeps the rest", () => {
    const patched = patchImportedSettingsConfig(
      "claude",
      {
        env: {
          ANTHROPIC_BASE_URL: "https://old.example.com",
          ANTHROPIC_AUTH_TOKEN: "sk-old",
          ANTHROPIC_MODEL: "claude-opus-4-1",
          ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-4-5",
          API_TIMEOUT_MS: "600000",
        },
      },
      importable,
    );
    expect(patched).toEqual({
      env: {
        ANTHROPIC_BASE_URL: "https://relay.example.com/api",
        ANTHROPIC_AUTH_TOKEN: "sk-shared",
        ANTHROPIC_MODEL: "claude-sonnet-4-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-4-5",
        API_TIMEOUT_MS: "600000",
      },
    });
  });

  it("claude: keeps the existing ANTHROPIC_API_KEY field name", () => {
    const patched = patchImportedSettingsConfig(
      "claude",
      { env: { ANTHROPIC_API_KEY: "sk-old", ANTHROPIC_MODEL: "m" } },
      importable,
    );
    const env = patched.env as Record<string, unknown>;
    expect(env.ANTHROPIC_API_KEY).toBe("sk-shared");
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
  });

  it("claude: empty source values delete the imported keys", () => {
    const patched = patchImportedSettingsConfig(
      "claude",
      {
        env: {
          ANTHROPIC_BASE_URL: "https://old.example.com",
          ANTHROPIC_AUTH_TOKEN: "sk-old",
          ANTHROPIC_MODEL: "old-model",
          ANTHROPIC_DEFAULT_OPUS_MODEL: "keep-me",
        },
      },
      { baseUrl: "", apiKey: "", defaultModel: "" },
    );
    const env = patched.env as Record<string, unknown>;
    expect(env.ANTHROPIC_BASE_URL).toBeUndefined();
    expect(env.ANTHROPIC_AUTH_TOKEN).toBeUndefined();
    expect(env.ANTHROPIC_MODEL).toBeUndefined();
    expect(env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("keep-me");
  });

  it("codex: patches auth and TOML in place, keeping modelCatalog and other auth keys", () => {
    const existingConfig = [
      'model_provider = "custom"',
      'model = "gpt-5.6-sol"',
      "",
      "[model_providers.custom]",
      'base_url = "https://old.example.com/v1"',
      'wire_api = "responses"',
    ].join("\n");
    const patched = patchImportedSettingsConfig(
      "codex",
      {
        auth: { OPENAI_API_KEY: "sk-old", auth_mode: "chatgpt" },
        config: existingConfig,
        modelCatalog: { models: [{ model: "gpt-5.6-sol" }] },
      },
      importable,
    );
    // modelCatalog 与登录态键都必须活下来
    expect(patched.modelCatalog).toEqual({ models: [{ model: "gpt-5.6-sol" }] });
    expect(patched.auth).toEqual({
      OPENAI_API_KEY: "sk-shared",
      auth_mode: "chatgpt",
    });
    const toml = String(patched.config);
    expect(toml).toContain('base_url = "https://relay.example.com/api"');
    expect(toml).toContain('model = "claude-sonnet-4-5"');
    expect(toml).toContain('wire_api = "responses"');
  });

  it("gemini: keeps the top-level config and other env keys", () => {
    const patched = patchImportedSettingsConfig(
      "gemini",
      {
        env: {
          GOOGLE_GEMINI_BASE_URL: "https://old.example.com",
          GEMINI_API_KEY: "sk-old",
          GEMINI_MODEL: "gemini-3.6-flash",
          GOOGLE_GEMINI_EXTRA: "keep",
        },
        config: { someExtension: true },
      },
      importable,
    );
    expect(patched.config).toEqual({ someExtension: true });
    expect(patched.env).toEqual({
      GOOGLE_GEMINI_BASE_URL: "https://relay.example.com/api",
      GEMINI_API_KEY: "sk-shared",
      GEMINI_MODEL: "claude-sonnet-4-5",
      GOOGLE_GEMINI_EXTRA: "keep",
    });
  });

  it("opencode / mcode: patches only options.baseURL and options.apiKey", () => {
    for (const appId of ["opencode", "mcode"] as const) {
      const patched = patchImportedSettingsConfig(
        appId,
        {
          npm: "@ai-sdk/anthropic",
          kind: "custom",
          options: {
            baseURL: "https://old.example.com",
            apiKey: "sk-old",
            headers: { "X-Custom": "1" },
            setCacheKey: true,
          },
          models: { "gpt-4o": { name: "GPT-4o" } },
        },
        importable,
      );
      expect(patched.models).toEqual({ "gpt-4o": { name: "GPT-4o" } });
      expect(patched.npm).toBe("@ai-sdk/anthropic");
      expect(patched.kind).toBe("custom");
      expect(patched.options).toEqual({
        baseURL: "https://relay.example.com/api",
        apiKey: "sk-shared",
        headers: { "X-Custom": "1" },
        setCacheKey: true,
      });
    }
  });

  it("openclaw / hermes / pi: patch only their credential keys", () => {
    expect(
      patchImportedSettingsConfig(
        "openclaw",
        {
          baseUrl: "https://old.example.com",
          apiKey: "sk-old",
          api: "openai-completions",
          models: [{ id: "m1" }],
          headers: { "User-Agent": "x" },
        },
        importable,
      ),
    ).toEqual({
      baseUrl: "https://relay.example.com/api",
      apiKey: "sk-shared",
      api: "openai-completions",
      models: [{ id: "m1" }],
      headers: { "User-Agent": "x" },
    });

    expect(
      patchImportedSettingsConfig(
        "hermes",
        {
          name: "My Hermes",
          base_url: "https://old.example.com",
          api_key: "sk-old",
          api_mode: "chat",
          models: [{ id: "m1" }],
        },
        importable,
      ),
    ).toEqual({
      name: "My Hermes",
      base_url: "https://relay.example.com/api",
      api_key: "sk-shared",
      api_mode: "chat",
      models: [{ id: "m1" }],
    });

    expect(
      patchImportedSettingsConfig(
        "pi",
        {
          name: "My Pi",
          baseUrl: "https://old.example.com",
          apiKey: "sk-old",
          api: "openai-completions",
          models: [{ id: "m1" }],
        },
        importable,
      ),
    ).toEqual({
      name: "My Pi",
      baseUrl: "https://relay.example.com/api",
      apiKey: "sk-shared",
      api: "openai-completions",
      models: [{ id: "m1" }],
    });
  });

  it("grokbuild: keeps profile and upstreamModel, moves only base_url and api_key", () => {
    const patched = patchImportedSettingsConfig(
      "grokbuild",
      {
        config: [
          "[models]",
          'default = "grok-4-5"',
          "",
          "[model.grok-4-5]",
          'model = "grok-4-5-reasoning"',
          'base_url = "https://old.example.com/v1"',
          'api_key = "sk-old"',
          'context_window = 500000',
        ].join("\n"),
      },
      importable,
    );
    const toml = String(patched.config);
    expect(toml).toContain('base_url = "https://relay.example.com/api"');
    expect(toml).toContain('api_key = "sk-shared"');
    expect(toml).toContain('model = "grok-4-5-reasoning"');
    expect(toml).toContain('context_window = 500000');
    expect(toml).not.toContain("claude-sonnet-4-5");
  });

  it("does not mutate the existing config object", () => {
    const existing = {
      env: { ANTHROPIC_BASE_URL: "https://old.example.com", ANTHROPIC_AUTH_TOKEN: "sk-old" },
    };
    const snapshot = JSON.stringify(existing);
    patchImportedSettingsConfig("claude", existing, importable);
    expect(JSON.stringify(existing)).toBe(snapshot);
  });
describe("buildImportedSettingsConfig: default model never reaches a target without the field", () => {
  const withModel = {
    baseUrl: "https://relay.example.com/api",
    apiKey: "sk-shared",
    defaultModel: "claude-sonnet-4-5",
  };

  it("claude-desktop never gets ANTHROPIC_MODEL in add mode", () => {
    const config = buildImportedSettingsConfig("claude-desktop", withModel);
    const env = config.env as Record<string, unknown>;
    expect(env.ANTHROPIC_BASE_URL).toBe("https://relay.example.com/api");
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe("sk-shared");
    expect(env.ANTHROPIC_MODEL).toBeUndefined();
    // 与编辑路径一致：两条写路径对同一目标的字段集合必须相同
    const patched = patchImportedSettingsConfig(
      "claude-desktop",
      { env: { ANTHROPIC_DEFAULT_HAIKU_MODEL: "keep" } },
      withModel,
    );
    expect((patched.env as Record<string, unknown>).ANTHROPIC_MODEL).toBeUndefined();
    expect((patched.env as Record<string, unknown>).ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe("keep");
  });

  it("every target without a default-model field stays free of the source model", () => {
    const modelFree = [
      "claude-desktop",
      "grokbuild",
      "opencode",
      "openclaw",
      "hermes",
      "pi",
      "mcode",
    ] as const;
    for (const appId of modelFree) {
      expect(targetSupportsDefaultModel(appId)).toBe(false);
      const built = buildImportedSettingsConfig(appId, withModel);
      const patched = patchImportedSettingsConfig(
        appId,
        built as Record<string, unknown>,
        withModel,
      );
      expect(JSON.stringify([built, patched])).not.toContain("claude-sonnet-4-5");
    }
  });
});
});
