import { describe, expect, it } from "vitest";
import { shouldShowTestEntry } from "@/components/providers/connectivityEntry";
import type { AppId } from "@/lib/api";

describe("shouldShowTestEntry", () => {
  it("shows the test entry for claude with a third-party provider", () => {
    expect(shouldShowTestEntry("claude" as AppId, "third-party")).toBe(true);
  });

  it("hides the test entry for codex official providers", () => {
    expect(shouldShowTestEntry("codex" as AppId, "official")).toBe(false);
  });

  it("hides the test entry for gemini regardless of category", () => {
    expect(shouldShowTestEntry("gemini" as AppId, "third-party")).toBe(false);
  });

  it("shows the test entry for codex with a third-party provider", () => {
    expect(shouldShowTestEntry("codex" as AppId, "third-party")).toBe(true);
  });

  it("hides the test entry for claude official providers", () => {
    expect(shouldShowTestEntry("claude" as AppId, "official")).toBe(false);
  });

  it("hides the test entry when category is undefined for non-claude/codex apps", () => {
    expect(shouldShowTestEntry("opencode" as AppId, undefined)).toBe(false);
  });

  // ---------- 动态端点 providerType 排除（3 参用例） ----------

  it("hides the test entry for github_copilot providers", () => {
    expect(shouldShowTestEntry("claude" as AppId, "third_party", "github_copilot")).toBe(false);
  });

  it("hides the test entry for codex_oauth providers", () => {
    expect(shouldShowTestEntry("codex" as AppId, "third_party", "codex_oauth")).toBe(false);
  });

  it("hides the test entry for xai_oauth providers", () => {
    expect(shouldShowTestEntry("claude" as AppId, "third_party", "xai_oauth")).toBe(false);
  });

  it("still shows the test entry when providerType is undefined (2-param compatibility)", () => {
    expect(shouldShowTestEntry("claude" as AppId, "third_party")).toBe(true);
  });

  it("does not false-positive on ordinary providerType values", () => {
    expect(shouldShowTestEntry("claude" as AppId, "third_party", "anthropic")).toBe(true);
  });
});
