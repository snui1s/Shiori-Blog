import { describe, expect, it } from "vitest";
import { CATEGORIES, STORAGE_KEY } from "./constants";

describe("Application Constants", () => {
  it("should have a valid draft storage key", () => {
    expect(STORAGE_KEY).toBe("shiori_blog_draft");
  });

  it("should contain default blog categories", () => {
    expect(CATEGORIES).toBeDefined();
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(CATEGORIES).toContain("Life");
    expect(CATEGORIES).toContain("Review");
    expect(CATEGORIES).toContain("Travel");
    expect(CATEGORIES).toContain("Food");
    expect(CATEGORIES).toContain("Thought");
  });
});
