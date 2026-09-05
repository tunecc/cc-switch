import { describe, expect, it } from "vitest";
import { providerSchema } from "@/lib/schemas/provider";

const baseForm = {
  name: "Provider",
  settingsConfig: "{}",
};

describe("providerSchema websiteUrl2", () => {
  it("accepts a valid second website URL", () => {
    const result = providerSchema.safeParse({
      ...baseForm,
      websiteUrl: "https://example.com",
      websiteUrl2: "https://second.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty or missing second website URL", () => {
    expect(
      providerSchema.safeParse({ ...baseForm, websiteUrl2: "" }).success,
    ).toBe(true);
    expect(providerSchema.safeParse(baseForm).success).toBe(true);
  });

  it("rejects an invalid second website URL with the same message as the first", () => {
    const result = providerSchema.safeParse({
      ...baseForm,
      websiteUrl2: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.filter(
        (issue) => issue.path[0] === "websiteUrl2",
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toBe("请输入有效的网址");
    }
  });
});
