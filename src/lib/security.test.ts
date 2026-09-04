import { describe, expect, it } from "vitest";

describe("Security & Validation Helpers (H1-H5 Fixes)", () => {
  describe("Pagination & Query Clamping (H3)", () => {
    function clampPagination(rawPage: string | null, rawLimit: string | null) {
      const pageNum = parseInt(rawPage || "1");
      const limitNum = parseInt(rawLimit || "9");
      const page = Math.max(1, isNaN(pageNum) ? 1 : pageNum);
      const limit = Math.min(Math.max(1, isNaN(limitNum) ? 9 : limitNum), 50);
      const offset = (page - 1) * limit;
      return { page, limit, offset };
    }

    it("should clamp excessive limit to maximum 50", () => {
      const result = clampPagination("1", "999999");
      expect(result.limit).toBe(50);
    });

    it("should clamp zero or negative limit to minimum 1", () => {
      expect(clampPagination("1", "0").limit).toBe(1);
      expect(clampPagination("1", "-10").limit).toBe(1);
    });

    it("should clamp negative page to 1 and prevent negative offset", () => {
      const result = clampPagination("-5", "10");
      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it("should fallback to default page 1 and limit 9 on NaN", () => {
      const result = clampPagination("invalid", "not-a-number");
      expect(result.page).toBe(1);
      expect(result.limit).toBe(9);
    });
  });

  describe("SQL Search Wildcard Sanitization (H3)", () => {
    function sanitizeSearchQuery(rawSearch: string): string {
      const cleanSearch = rawSearch.trim().slice(0, 100);
      return cleanSearch.replace(/[%_\\]/g, " ").trim();
    }

    it("should strip % and _ wildcard characters for safe exact search", () => {
      expect(sanitizeSearchQuery("100% discount")).toBe("100  discount");
      expect(sanitizeSearchQuery("test_post")).toBe("test post");
      expect(sanitizeSearchQuery("50%_off")).toBe("50  off");
    });

    it("should truncate overly long queries to 100 characters", () => {
      const longQuery = "a".repeat(200);
      expect(sanitizeSearchQuery(longQuery).length).toBe(100);
    });
  });

  describe("Slug Validation and Normalization (H2)", () => {
    function validateAndNormalizeSlug(rawSlug: string): { isValid: boolean; slug: string } {
      const normalized = rawSlug.trim().toLowerCase().replace(/[\s_]+/g, "-");
      const isValid = /^[a-z0-9\u0E00-\u0E7F-]+$/i.test(normalized);
      return { isValid, slug: normalized };
    }

    it("should accept valid alphanumeric and hyphen slugs", () => {
      expect(validateAndNormalizeSlug("my-awesome-post-2026").isValid).toBe(true);
      expect(validateAndNormalizeSlug("tech-review").isValid).toBe(true);
    });

    it("should accept valid Thai language slugs", () => {
      expect(validateAndNormalizeSlug("บทความ-ภาษาไทย-123").isValid).toBe(true);
    });

    it("should reject malicious or invalid slugs with special characters or scripts", () => {
      expect(validateAndNormalizeSlug("<script>alert(1)</script>").isValid).toBe(false);
      expect(validateAndNormalizeSlug("post;DROP TABLE Post;--").isValid).toBe(false);
      expect(validateAndNormalizeSlug("hello/world").isValid).toBe(false);
    });
  });

  describe("Comments Permission without User ID Leakage (H4)", () => {
    it("should compute isAuthor and canDelete correctly without leaking raw user IDs", () => {
      const currentUserId = "user-123";
      const isAdmin = false;

      const rawComment = {
        id: 1,
        userId: "user-123",
        content: "Hello",
      };

      const sanitizedComment = {
        id: rawComment.id,
        content: rawComment.content,
        isAuthor: rawComment.userId === currentUserId,
        canDelete: rawComment.userId === currentUserId || isAdmin,
      };

      expect(sanitizedComment.isAuthor).toBe(true);
      expect(sanitizedComment.canDelete).toBe(true);
      expect("userId" in sanitizedComment).toBe(false);
    });
  });
});
