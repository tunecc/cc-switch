import { describe, expect, it } from "vitest";
import { listProviderModelIds } from "@/lib/providerModelIds";

// 与后端 model_ids_from_settings（connectivity_test/model_ids.rs）同口径：
// 每条目只取 model/id/name 中首个非空字段、对象键不 trim、顺序去重。

describe("listProviderModelIds", () => {
  it("每条目只取 model/id/name 中首个非空字段（trim 后非空）", () => {
    const settings = {
      modelCatalog: {
        models: [
          { model: "x", id: "x-id", name: "X" },
          { id: "y" },
          { name: "Z" },
          { model: "  ", name: "blank-model" },
          "not-an-object",
        ],
      },
    };
    expect(listProviderModelIds(settings, "claude")).toEqual([
      "x",
      "y",
      "Z",
      "blank-model",
    ]);
  });

  it("catalog 退化为对象时取原始键（不 trim），仅跳过空白键", () => {
    const settings = {
      modelCatalog: { models: { "raw-key": {}, "  ": {} } },
    };
    expect(listProviderModelIds(settings, "claude")).toEqual(["raw-key"]);

    const padded = { modelCatalog: { models: { "  padded  ": {} } } };
    expect(listProviderModelIds(padded, "claude")).toEqual(["  padded  "]);
  });

  it("claude 无 modelCatalog 时回退 env.ANTHROPIC_MODEL（trim）", () => {
    const settings = { env: { ANTHROPIC_MODEL: " kimi-k2.7-code " } };
    expect(listProviderModelIds(settings, "claude")).toEqual([
      "kimi-k2.7-code",
    ]);
  });

  it("codex 回退 config TOML 顶层 model", () => {
    const settings = { config: 'model = "gpt-5.5"\n' };
    expect(listProviderModelIds(settings, "codex")).toEqual(["gpt-5.5"]);
  });

  it("其余 app 无回退，返回空列表", () => {
    expect(
      listProviderModelIds({ env: { ANTHROPIC_MODEL: "m" } }, "gemini"),
    ).toEqual([]);
  });

  it("按出现顺序去重", () => {
    const settings = {
      modelCatalog: {
        models: [{ model: "a" }, { model: "a" }, { model: "b" }],
      },
    };
    expect(listProviderModelIds(settings, "claude")).toEqual(["a", "b"]);
  });

  it("settingsConfig 缺省时返回空列表", () => {
    expect(listProviderModelIds(undefined, "claude")).toEqual([]);
  });
});
