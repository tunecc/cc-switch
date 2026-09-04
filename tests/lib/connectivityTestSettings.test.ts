import { describe, it, expect } from "vitest";
import {
  getConnectivityTestSettings,
  mergeConnectivityTestSettings,
  DEFAULT_CONNECTIVITY_TEST_SETTINGS,
} from "@/lib/connectivityTestSettings";

describe("connectivityTestSettings", () => {
  it("returns defaults when field absent", () => {
    const s = getConnectivityTestSettings({ env: {} });
    expect(s.prompt).toBe("ping");
    expect(s.stream).toBe(true);
    expect(s.timeoutSecs).toBe(30);
    expect(s.defaultTestModelId).toBeUndefined();
  });

  it("preserves saved fields and defaults the rest", () => {
    const s = getConnectivityTestSettings({
      connectivityTest: { prompt: "hi", stream: false, timeoutSecs: 20 },
    });
    expect(s).toMatchObject({ prompt: "hi", stream: false, timeoutSecs: 20, maxTokens: undefined });
  });

  it("merge writes only explicit fields and does not mutate input", () => {
    const input = { env: { ANTHROPIC_MODEL: "x" } };
    const next = mergeConnectivityTestSettings(input, { prompt: "hi", stream: true, timeoutSecs: 20 });
    expect(input).not.toHaveProperty("connectivityTest");
    expect(next).toHaveProperty("connectivityTest.prompt", "hi");
    expect(next.connectivityTest.maxTokens).toBeUndefined();
  });

  it("merge skips default-valued fields so the stored payload stays minimal", () => {
    const next = mergeConnectivityTestSettings({}, {
      prompt: DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt,
      stream: false,
      timeoutSecs: DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs,
      temperature: 0.5,
      headers: { "x-test": "1" },
      body: { extra: true },
    });
    expect(next.connectivityTest).toEqual({
      stream: false,
      temperature: 0.5,
      headers: { "x-test": "1" },
      body: { extra: true },
    });
  });

  it("merge removes the stored block when every value equals the default", () => {
    const input = {
      env: { ANTHROPIC_MODEL: "x" },
      connectivityTest: { prompt: "old", stream: false, timeoutSecs: 15 },
    };
    const next = mergeConnectivityTestSettings(input, {
      prompt: DEFAULT_CONNECTIVITY_TEST_SETTINGS.prompt,
      stream: DEFAULT_CONNECTIVITY_TEST_SETTINGS.stream,
      timeoutSecs: DEFAULT_CONNECTIVITY_TEST_SETTINGS.timeoutSecs,
    });
    expect(next).not.toHaveProperty("connectivityTest");
    expect(input.connectivityTest).toEqual({ prompt: "old", stream: false, timeoutSecs: 15 });
  });

  it("round-trips merged settings through get", () => {
    const merged = mergeConnectivityTestSettings({}, { prompt: "hi", stream: true, timeoutSecs: 20 });
    const s = getConnectivityTestSettings(merged);
    expect(s).toMatchObject({ prompt: "hi", stream: true, timeoutSecs: 20 });
  });

  it("falls back to defaults when the stored field is malformed", () => {
    const s = getConnectivityTestSettings({ connectivityTest: "nope" });
    expect(s).toEqual(DEFAULT_CONNECTIVITY_TEST_SETTINGS);
  });
});
