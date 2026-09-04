/**
 * Optimizes a Cloudinary URL by adding auto-format, auto-quality, and resizing parameters.
 * If the URL is not a Cloudinary URL, it returns the original URL.
 */
export function getOptimizedImageUrl(url: string, width: number = 800) {
  if (!url) return url;

  // Optimize Unsplash URLs
  if (url.includes("images.unsplash.com") && !url.includes("?")) {
    return `${url}?auto=format&fit=crop&w=${width}&q=80`;
  }

  // Check if it's a Cloudinary URL
  if (url.includes("res.cloudinary.com")) {
    // Check if it already has transformations
    if (url.includes("/upload/") && !url.includes("/upload/f_auto")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        // f_auto: auto format (WebP/AVIF)
        // q_auto: auto quality
        // w_800: resize to specific width
        // c_limit: don't upscale if smaller
        return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
      }
    }
  }

  return url;
}

import { sanitizeContentHtml } from "./sanitize";

/**
 * Parses HTML content, sanitizes it against XSS vectors, and optimizes all <img> tags within it.
 */
export function getOptimizedContentHtml(html: string) {
  if (!html) return html;

  // 1. Sanitize against XSS vectors
  const cleanHtml = sanitizeContentHtml(html);

  // 2. Regex to find <img> tags and optimize attributes
  return cleanHtml.replace(
    /<img\s+([^>]*?)src=(['"])([^'"]+)\2([^>]*?)>/gi,
    (match, before, quote, src, after) => {
      const optimizedSrc = getOptimizedImageUrl(src, 1000); // Higher width for content images

      // Ensure loading="lazy" and decoding="async" are present if not already
      let newTag = `<img ${before}src="${optimizedSrc}"${after}`;
      if (!newTag.includes('loading="')) {
        newTag = newTag.replace("<img ", '<img loading="lazy" ');
      }
      if (!newTag.includes('decoding="')) {
        newTag = newTag.replace("<img ", '<img decoding="async" ');
      }

      return newTag + ">";
    },
  );
}
