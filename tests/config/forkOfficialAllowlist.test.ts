import { describe, expect, it } from "vitest";
import { forkOfficialAllowlist } from "@/config/forkOfficialAllowlist";
import { dshProviderPresets } from "@/config/dshProviderPresets";

describe("forkOfficialAllowlist", () => {
  it("keeps the three protocol-compatible local presets for dsh", () => {
    expect(forkOfficialAllowlist.dsh).toEqual(["Ollama", "LM Studio", "vLLM"]);
    const names = new Set(dshProviderPresets.map((preset) => preset.name));
    for (const name of forkOfficialAllowlist.dsh) {
      expect(names.has(name)).toBe(true);
    }
  });
});
