import { describe, expect, it } from "vitest";
import { shrineFortunes } from "./fortunes";

describe("Shrine Fortunes Dataset (栞の御神籤)", () => {
  it("should contain exactly 24 authentic shrine fortunes", () => {
    expect(shrineFortunes).toBeDefined();
    expect(shrineFortunes.length).toBe(24);
  });

  it("should have unique IDs for all fortunes from 1 to 24", () => {
    const ids = shrineFortunes.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(24);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(24);
  });

  it("should contain valid Japanese fortune types (運勢)", () => {
    const validFortuneTypes = ["大吉", "吉", "中吉", "小吉", "半吉", "末吉", "凶"];
    shrineFortunes.forEach((f) => {
      expect(validFortuneTypes).toContain(f.levelKanji);
      expect(f.level.length).toBeGreaterThan(0);
    });
  });

  it("should contain poetry with authentic Japanese waka poem and Thai translation", () => {
    shrineFortunes.forEach((f) => {
      expect(f.poem.length).toBeGreaterThan(5);
      expect(f.poemTranslation.length).toBeGreaterThan(5);
      expect(f.summary.length).toBeGreaterThan(10);
    });
  });

  it("should contain life categories (願望, 職業, 健康) for each fortune", () => {
    shrineFortunes.forEach((f) => {
      expect(f.wishes.length).toBeGreaterThan(0);
      expect(f.work.length).toBeGreaterThan(0);
      expect(f.health.length).toBeGreaterThan(0);
    });
  });

  it("should contain a lucky item and lucky direction for each fortune", () => {
    shrineFortunes.forEach((f) => {
      expect(f.luckyItem.length).toBeGreaterThan(0);
      expect(f.luckyDirection.length).toBeGreaterThan(0);
    });
  });
});
