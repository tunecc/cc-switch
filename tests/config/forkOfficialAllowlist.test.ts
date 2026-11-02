import { describe, expect, it } from "vitest";
import { forkOfficialAllowlist } from "@/config/forkOfficialAllowlist";
import { dshProviderPresets } from "@/config/dshProviderPresets";
import { providerPresets } from "@/config/claudeProviderPresets";
import { claudeDesktopProviderPresets } from "@/config/claudeDesktopProviderPresets";
import { codexProviderPresets } from "@/config/codexProviderPresets";
import { openclawProviderPresets } from "@/config/openclawProviderPresets";
import { opencodeProviderPresets } from "@/config/opencodeProviderPresets";
import { mcodeProviderPresets } from "@/config/mcodeProviderPresets";

describe("forkOfficialAllowlist", () => {
  it("keeps the three protocol-compatible local presets for dsh", () => {
    expect(forkOfficialAllowlist.dsh).toEqual(["Ollama", "LM Studio", "vLLM"]);
    const names = new Set(dshProviderPresets.map((preset) => preset.name));
    for (const name of forkOfficialAllowlist.dsh) {
      expect(names.has(name)).toBe(true);
    }
  });

  // 条目名必须与上游目录逐字命中，拼写不符会让该条目在 fork 构建里静默消失。
  it("admits the first-party OpenAI API preset for the three vendor-official apps", () => {
    const catalogs: [string[], { name: string }[]][] = [
      [forkOfficialAllowlist.claude, providerPresets],
      [forkOfficialAllowlist["claude-desktop"], claudeDesktopProviderPresets],
      [forkOfficialAllowlist.codex, codexProviderPresets],
    ];
    for (const [allowed, catalog] of catalogs) {
      expect(allowed).toContain("OpenAI API");
      expect(new Set(catalog.map((preset) => preset.name)).has("OpenAI API")).toBe(
        true,
      );
    }
  });

  it("keeps OpenAI API hidden in the aggregator catalogs", () => {
    for (const allowed of [
      forkOfficialAllowlist.openclaw,
      forkOfficialAllowlist.opencode,
      forkOfficialAllowlist.mcode,
    ]) {
      expect(allowed).not.toContain("OpenAI API");
    }
    expect(
      new Set(openclawProviderPresets.map((preset) => preset.name)).has(
        "OpenAI API",
      ),
    ).toBe(true);
    expect(
      new Set(opencodeProviderPresets.map((preset) => preset.name)).has(
        "OpenAI API",
      ),
    ).toBe(true);
    expect(
      new Set(mcodeProviderPresets.map((preset) => preset.name)).has("OpenAI API"),
    ).toBe(true);
  });
});
