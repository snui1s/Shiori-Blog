import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, clearAllRateLimits, getClientIp } from "./rate-limit";

describe("Rate Limiter Utilities (Brute Force Protection)", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it("should allow requests under the limit", () => {
    const key = "ip-test-1";
    const res1 = checkRateLimit(key, 3, 60000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, 3, 60000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, 3, 60000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests exceeding the limit", () => {
    const key = "ip-test-2";
    // 3 requests allowed
    checkRateLimit(key, 3, 60000);
    checkRateLimit(key, 3, 60000);
    checkRateLimit(key, 3, 60000);

    // 4th request must be blocked
    const res4 = checkRateLimit(key, 3, 60000);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetTimeMs).toBeGreaterThan(0);
  });

  it("should allow requests again after window expires", () => {
    const key = "ip-test-3";
    const startTime = 1000000;
    const windowMs = 5000;

    checkRateLimit(key, 2, windowMs, startTime);
    checkRateLimit(key, 2, windowMs, startTime + 1000);

    // At 2000ms: limit reached
    const blocked = checkRateLimit(key, 2, windowMs, startTime + 2000);
    expect(blocked.allowed).toBe(false);

    // At 6001ms: oldest request (at 1000000) has expired
    const allowedAfterExpiry = checkRateLimit(key, 2, windowMs, startTime + 5001);
    expect(allowedAfterExpiry.allowed).toBe(true);
  });

  it("should correctly extract client IP from X-Forwarded-For header", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("should fallback to 127.0.0.1 if no IP headers are present", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
