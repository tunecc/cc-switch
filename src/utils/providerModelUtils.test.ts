import { describe, expect, it } from "vitest";
import {
  applyModelToSettings,
  getCurrentModel,
  isModelCapableApp,
  MODEL_CAPABLE_APPS,
} from "./providerModelUtils";
import { extractCodexModelName } from "./providerConfigUtils";

const claudeSettings = (env: Record<string, any> = {}) => ({
  env,
  permissions: { allow: ["Bash"] },
});

describe("isModelCapableApp / MODEL_CAPABLE_APPS", () => {
  it("matches exactly the four core apps", () => {
    expect(MODEL_CAPABLE_APPS).toEqual([
      "claude",
      "codex",
      "gemini",
      "grokbuild",
    ]);
    for (const appId of MODEL_CAPABLE_APPS) {
      expect(isModelCapableApp(appId), appId).toBe(true);
    }
  });

  it("rejects out-of-scope apps", () => {
    for (const appId of [
      "claude-desktop",
      "opencode",
      "openclaw",
      "hermes",
      "pi",
      "",
      "Claude",
    ]) {
      expect(isModelCapableApp(appId), appId).toBe(false);
    }
  });
});

describe("getCurrentModel", () => {
  it("prefers claude SONNET over ANTHROPIC_MODEL", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-5",
      ANTHROPIC_MODEL: "claude-3-5-haiku",
    });
    expect(getCurrentModel("claude", settings)).toBe("claude-sonnet-4-5");
  });

  it("falls back to claude ANTHROPIC_MODEL when SONNET is empty", () => {
    const settings = claudeSettings({ ANTHROPIC_MODEL: "claude-3-7-sonnet" });
    expect(getCurrentModel("claude", settings)).toBe("claude-3-7-sonnet");
  });

  it("returns empty when claude env has no model at all", () => {
    expect(getCurrentModel("claude", claudeSettings())).toBe("");
    expect(
      getCurrentModel("claude", { env: { ANTHROPIC_BASE_URL: "https://x" } }),
    ).toBe("");
  });

  it("strips the [1M] marker from a claude SONNET model", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-5[1M]",
    });
    expect(getCurrentModel("claude", settings)).toBe("claude-sonnet-4-5");
  });

  it("extracts the top-level model from codex/grokbuild TOML", () => {
    const toml =
      'model = "gpt-5.2"\nmodel_provider = "custom"\n\n[model_providers.custom]\nname = "X"\nbase_url = "https://x.example/v1"\nwire_api = "responses"\n';
    expect(getCurrentModel("codex", { config: toml })).toBe("gpt-5.2");
    expect(getCurrentModel("grokbuild", { config: toml })).toBe("gpt-5.2");
  });

  it("returns empty for codex/grokbuild config without a model field", () => {
    const toml =
      'model_provider = "custom"\n\n[model_providers.custom]\nname = "X"\nbase_url = "https://x.example/v1"\n';
    expect(getCurrentModel("codex", { config: toml })).toBe("");
    expect(getCurrentModel("grokbuild", { config: "" })).toBe("");
    expect(getCurrentModel("codex", {})).toBe("");
  });

  it("reads gemini env.GEMINI_MODEL and returns empty when missing", () => {
    expect(
      getCurrentModel("gemini", { env: { GEMINI_MODEL: "gemini-2.5-pro" } }),
    ).toBe("gemini-2.5-pro");
    expect(getCurrentModel("gemini", { env: {} })).toBe("");
    expect(getCurrentModel("gemini", { env: { GEMINI_API_KEY: "k" } })).toBe(
      "",
    );
  });

  it("returns empty for out-of-scope apps regardless of payload", () => {
    expect(getCurrentModel("opencode", { env: { GEMINI_MODEL: "x" } })).toBe(
      "",
    );
    expect(getCurrentModel("claude-desktop", claudeSettings())).toBe("");
    expect(getCurrentModel("", { config: 'model = "y"' })).toBe("");
  });

  it("never throws on non-object settingsConfig", () => {
    for (const hostile of [null, undefined, 42, "text", []]) {
      expect(() => getCurrentModel("claude", hostile)).not.toThrow();
      expect(getCurrentModel("claude", hostile)).toBe("");
    }
  });
});

describe("applyModelToSettings (claude)", () => {
  const MODEL = "claude-sonnet-4-5";

  it("withOneM=false writes the base model to all six model fields", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet[1M]",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "old-opus",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "old-fable[1M]",
      ANTHROPIC_MODEL: "old-sonnet",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "old-haiku",
      CLAUDE_CODE_SUBAGENT_MODEL: "old-sub",
    });
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: false,
    });

    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_FABLE_MODEL).toBe(MODEL);
    expect(next.env.ANTHROPIC_MODEL).toBe(MODEL);
    expect(next.env.CLAUDE_CODE_SUBAGENT_MODEL).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe(MODEL);
  });

  it("withOneM=false rewrites display names for empty / old-base / old-base[1M] values", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet",
      // 空：写新 base
      ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: "",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "old-opus",
      // 等于旧 base：写新 base
      ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: "old-opus",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "old-fable[1M]",
      // 等于旧 base[1M]：写新 base
      ANTHROPIC_DEFAULT_FABLE_MODEL_NAME: "old-fable[1M]",
    });
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: false,
    });

    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_FABLE_MODEL_NAME).toBe(MODEL);
  });

  it("keeps user-customized display names", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet",
      ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: "我的模型",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "old-opus",
      ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: "我的模型",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "old-fable",
      ANTHROPIC_DEFAULT_FABLE_MODEL_NAME: "我的模型",
    });
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: false,
    });

    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME).toBe("我的模型");
    expect(next.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME).toBe("我的模型");
    expect(next.env.ANTHROPIC_DEFAULT_FABLE_MODEL_NAME).toBe("我的模型");
    // 模型字段本身照常覆写
    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe(MODEL);
  });

  it("withOneM=true marks the five main fields but never HAIKU", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "old-haiku",
    });
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: true,
    });

    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe(`${MODEL}[1M]`);
    expect(next.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe(`${MODEL}[1M]`);
    expect(next.env.ANTHROPIC_DEFAULT_FABLE_MODEL).toBe(`${MODEL}[1M]`);
    expect(next.env.ANTHROPIC_MODEL).toBe(`${MODEL}[1M]`);
    expect(next.env.CLAUDE_CODE_SUBAGENT_MODEL).toBe(`${MODEL}[1M]`);
    expect(next.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe(MODEL);
  });

  it("withOneM=true writes display names as the base model", () => {
    const settings = claudeSettings({
      ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet[1M]",
      ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: "old-sonnet[1M]",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "old-opus",
      ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: "",
      ANTHROPIC_DEFAULT_FABLE_MODEL: "old-fable",
      ANTHROPIC_DEFAULT_FABLE_MODEL_NAME: "old-fable",
    });
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: true,
    });

    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME).toBe(MODEL);
    expect(next.env.ANTHROPIC_DEFAULT_FABLE_MODEL_NAME).toBe(MODEL);
  });

  it("treats a model already carrying [1M] as its base and strips the marker when disabled", () => {
    const next = applyModelToSettings(
      "claude",
      claudeSettings(),
      `${MODEL}[1M]`,
      { withOneM: false },
    );
    expect(next.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe(MODEL);
    expect(next.env.ANTHROPIC_MODEL).toBe(MODEL);
  });

  it("builds an env skeleton when settingsConfig is not an object", () => {
    for (const hostile of [null, undefined, 42, "text"]) {
      const next = applyModelToSettings("claude", hostile, MODEL, {
        withOneM: false,
      });
      expect(next).toEqual({
        env: {
          ANTHROPIC_DEFAULT_SONNET_MODEL: MODEL,
          ANTHROPIC_DEFAULT_OPUS_MODEL: MODEL,
          ANTHROPIC_DEFAULT_FABLE_MODEL: MODEL,
          ANTHROPIC_MODEL: MODEL,
          ANTHROPIC_DEFAULT_HAIKU_MODEL: MODEL,
          CLAUDE_CODE_SUBAGENT_MODEL: MODEL,
          ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: MODEL,
          ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: MODEL,
          ANTHROPIC_DEFAULT_FABLE_MODEL_NAME: MODEL,
        },
      });
    }
  });

  it("keeps unrelated env keys and other top-level config untouched", () => {
    const settings = {
      env: { ANTHROPIC_BASE_URL: "https://x", ANTHROPIC_AUTH_TOKEN: "t" },
      permissions: { allow: ["Bash"] },
    };
    const next = applyModelToSettings("claude", settings, MODEL, {
      withOneM: false,
    });
    expect(next.env.ANTHROPIC_BASE_URL).toBe("https://x");
    expect(next.env.ANTHROPIC_AUTH_TOKEN).toBe("t");
    expect(next.permissions).toEqual({ allow: ["Bash"] });
  });
});

describe("applyModelToSettings (codex/grokbuild)", () => {
  const TOML = [
    'model = "gpt-4.1"',
    'model_provider = "custom"',
    "",
    "[model_providers.custom]",
    'name = "X"',
    'base_url = "https://x.example/v1"',
    'wire_api = "responses"',
    "",
  ].join("\n");

  it("replaces the TOML model while leaving other lines intact", () => {
    for (const appId of ["codex", "grokbuild"] as const) {
      const next = applyModelToSettings(appId, { config: TOML }, "gpt-5.2");
      expect(next.config, appId).toContain('model = "gpt-5.2"');
      expect(next.config, appId).toContain('model_provider = "custom"');
      expect(next.config, appId).toContain("[model_providers.custom]");
      expect(next.config, appId).toContain('name = "X"');
      expect(next.config, appId).toContain('base_url = "https://x.example/v1"');
      expect(next.config, appId).toContain('wire_api = "responses"');
      expect(extractCodexModelName(next.config), appId).toBe("gpt-5.2");
    }
  });

  it("inserts the model line when config has none yet", () => {
    const tomlWithoutModel =
      'model_provider = "custom"\n\n[model_providers.custom]\nname = "X"\n';
    const next = applyModelToSettings(
      "codex",
      { config: tomlWithoutModel },
      "gpt-5.2",
    );
    expect(extractCodexModelName(next.config)).toBe("gpt-5.2");
    expect(next.config).toContain('model_provider = "custom"');
    expect(next.config).toContain("[model_providers.custom]");
  });

  it("returns the config unchanged when config is missing", () => {
    // 不应发生，但绝不抛异常、不凭空造 config
    expect(applyModelToSettings("codex", {}, "gpt-5.2")).toEqual({});
    expect(applyModelToSettings("grokbuild", null, "gpt-5.2")).toEqual({});
  });

  it("round-trips: apply then getCurrentModel yields the same model", () => {
    for (const appId of ["codex", "grokbuild"] as const) {
      for (const model of ["gpt-5.2", "grok-4-fast", "model with space"]) {
        const next = applyModelToSettings(appId, { config: TOML }, model);
        expect(getCurrentModel(appId, next), `${appId}:${model}`).toBe(model);
      }
    }
  });

  it("keeps codex auth and other keys alongside config", () => {
    const settings = { auth: { OPENAI_API_KEY: "sk-x" }, config: TOML };
    const next = applyModelToSettings("codex", settings, "gpt-5.2");
    expect(next.auth).toEqual({ OPENAI_API_KEY: "sk-x" });
    expect(extractCodexModelName(next.config)).toBe("gpt-5.2");
  });
});

describe("applyModelToSettings (gemini)", () => {
  it("writes env.GEMINI_MODEL and keeps other env keys", () => {
    const settings = {
      env: { GEMINI_API_KEY: "k", GOOGLE_GEMINI_BASE_URL: "https://x" },
    };
    const next = applyModelToSettings("gemini", settings, "gemini-2.5-pro");
    expect(next.env.GEMINI_MODEL).toBe("gemini-2.5-pro");
    expect(next.env.GEMINI_API_KEY).toBe("k");
    expect(next.env.GOOGLE_GEMINI_BASE_URL).toBe("https://x");
  });

  it("builds an env skeleton when settingsConfig is not an object", () => {
    const next = applyModelToSettings("gemini", null, "gemini-2.5-flash");
    expect(next).toEqual({ env: { GEMINI_MODEL: "gemini-2.5-flash" } });
  });
});

describe("applyModelToSettings (edge cases)", () => {
  it("returns a shallow copy for out-of-scope apps", () => {
    const settings = { env: { A: 1 }, nested: { b: [1, 2] } };
    const next = applyModelToSettings("opencode", settings, "whatever");
    expect(next).toEqual(settings);
    expect(next).not.toBe(settings);
    // 浅拷贝：嵌套引用共享，但不修改原对象的前提下无危害
    expect(next.nested).toBe(settings.nested);
  });

  it("never mutates the input settingsConfig (deep immutability)", () => {
    const settings = {
      env: {
        ANTHROPIC_DEFAULT_SONNET_MODEL: "old-sonnet[1M]",
        ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: "old-sonnet[1M]",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "old-opus",
        ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: "自定义名",
        ANTHROPIC_MODEL: "old-sonnet",
      },
      permissions: { allow: ["Bash"] },
    };
    const snapshot = JSON.parse(JSON.stringify(settings));

    for (const appId of ["claude", "gemini"] as const) {
      const next = applyModelToSettings(appId, settings, "new-model", {
        withOneM: true,
      });
      expect(next, appId).not.toBe(settings);
      expect(next.env, appId).not.toBe(settings.env);
      expect(settings, appId).toEqual(snapshot);
    }

    const codexSettings = { config: 'model = "a"\nmodel_provider = "b"\n' };
    const codexSnapshot = JSON.parse(JSON.stringify(codexSettings));
    const codexNext = applyModelToSettings("codex", codexSettings, "gpt-5.2");
    expect(codexNext).not.toBe(codexSettings);
    expect(codexSettings).toEqual(codexSnapshot);
  });

  it("never throws on null/undefined settingsConfig for any capable app", () => {
    for (const appId of MODEL_CAPABLE_APPS) {
      expect(() => applyModelToSettings(appId, null, "m")).not.toThrow();
      expect(() => applyModelToSettings(appId, undefined, "m")).not.toThrow();
    }
  });
});
