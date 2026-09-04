import { describe, expect, it } from "vitest";
import { getOptimizedImageUrl, getOptimizedContentHtml } from "./images";

describe("Image Optimization Utilities", () => {
  describe("getOptimizedImageUrl", () => {
    it("should return empty string or falsy input as is", () => {
      expect(getOptimizedImageUrl("")).toBe("");
      // @ts-expect-error testing null
      expect(getOptimizedImageUrl(null)).toBe(null);
    });

    it("should return standard image URLs unchanged", () => {
      const standardUrl = "https://example.com/assets/banner.jpg";
      expect(getOptimizedImageUrl(standardUrl)).toBe(standardUrl);
    });

    it("should append optimization parameters to raw Unsplash URLs", () => {
      const unsplashUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";
      const result = getOptimizedImageUrl(unsplashUrl, 600);
      expect(result).toBe(`${unsplashUrl}?auto=format&fit=crop&w=600&q=80`);
    });

    it("should not modify Unsplash URLs that already have query parameters", () => {
      const unsplashWithParams = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500";
      expect(getOptimizedImageUrl(unsplashWithParams)).toBe(unsplashWithParams);
    });

    it("should insert transformations for Cloudinary URLs", () => {
      const cloudinaryUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      const optimized = getOptimizedImageUrl(cloudinaryUrl, 800);
      expect(optimized).toBe(
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg"
      );
    });

    it("should not duplicate transformations if f_auto is already present", () => {
      const alreadyOptimized =
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/sample.jpg";
      expect(getOptimizedImageUrl(alreadyOptimized)).toBe(alreadyOptimized);
    });
  });

  describe("getOptimizedContentHtml", () => {
    it("should return empty string if input is empty", () => {
      expect(getOptimizedContentHtml("")).toBe("");
    });

    it("should inject lazy loading and async decoding into img tags", () => {
      const html = '<p>Content</p><img src="https://example.com/test.jpg" alt="test">';
      const result = getOptimizedContentHtml(html);
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('decoding="async"');
      expect(result).toContain('src="https://example.com/test.jpg"');
    });

    it("should optimize Cloudinary img src inside HTML content", () => {
      const html =
        '<p>Read this</p><img src="https://res.cloudinary.com/demo/image/upload/post.jpg" alt="Photo" />';
      const result = getOptimizedContentHtml(html);
      expect(result).toContain(
        'src="https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1000,c_limit/post.jpg"'
      );
    });

    it("should preserve existing loading attribute if already present", () => {
      const html = '<img loading="eager" src="https://example.com/hero.jpg" />';
      const result = getOptimizedContentHtml(html);
      expect(result).toContain('loading="eager"');
    });
  });
});
