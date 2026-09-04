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
});
