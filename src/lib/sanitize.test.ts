import { describe, expect, it } from "vitest";
import { sanitizeContentHtml, ALLOWED_TAGS } from "./sanitize";

describe("HTML Sanitization Utilities (XSS Prevention & TipTap Support)", () => {
  it("should strip <script> tags and embedded code", () => {
    const malicious = '<p>Normal text</p><script>alert("XSS")</script>';
    const cleaned = sanitizeContentHtml(malicious);
    expect(cleaned).toBe("<p>Normal text</p>");
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain('alert("XSS")');
  });

  it("should strip <iframe>, <object>, and <embed> tags", () => {
    const malicious =
      '<div>Safe content</div><iframe src="https://evil.com"></iframe><embed src="malware.swf">';
    const cleaned = sanitizeContentHtml(malicious);
    expect(cleaned).toContain("Safe content");
    expect(cleaned).not.toContain("iframe");
    expect(cleaned).not.toContain("embed");
  });

  it("should strip inline event handlers (onerror, onclick, onload, etc.)", () => {
    const malicious =
      '<img src="invalid.jpg" onerror="alert(\'hacked\')" /><button onclick="evil()">Click</button>';
    const cleaned = sanitizeContentHtml(malicious);
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).not.toContain("alert");
  });

  it("should strip javascript: pseudoprotocol URLs in <a> href", () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const cleaned = sanitizeContentHtml(malicious);
    expect(cleaned).not.toContain("javascript:");
  });

  it("should enforce rel='noopener noreferrer' on external links with target='_blank'", () => {
    const link = '<a href="https://google.com" target="_blank">Google</a>';
    const cleaned = sanitizeContentHtml(link);
    expect(cleaned).toContain('rel="noopener noreferrer"');
  });

  it("should preserve TipTap highlight tags (<mark>) and background colors", () => {
    const highlight =
      '<p>ข้อความ <mark data-color="#f63049" style="background-color: #f63049">ไฮไลต์สีแดง</mark></p>';
    const cleaned = sanitizeContentHtml(highlight);
    expect(cleaned).toContain("<mark");
    expect(cleaned).toContain('data-color="#f63049"');
    expect(cleaned).toContain("background-color:#f63049");
    expect(cleaned).toContain("ไฮไลต์สีแดง");
  });

  it("should preserve TipTap font color styles (<span style='color: #4facfe'>)", () => {
    const colored = '<p><span style="color: #4facfe">ข้อความสีฟ้า</span></p>';
    const cleaned = sanitizeContentHtml(colored);
    expect(cleaned).toContain('<span style="color:#4facfe">ข้อความสีฟ้า</span>');
  });

  it("should preserve semantic strike tags (<del>, <s>, <strike>)", () => {
    const striked = "<p><del>ข้อความที่ถูกขีดฆ่า</del></p>";
    const cleaned = sanitizeContentHtml(striked);
    expect(cleaned).toContain("<del>ข้อความที่ถูกขีดฆ่า</del>");
  });

  it("should preserve relative links and internal anchor tags", () => {
    const relativeLink = '<a href="/blog/post-1">อ่านบทความก่อนหน้า</a>';
    const cleaned = sanitizeContentHtml(relativeLink);
    expect(cleaned).toContain('href="/blog/post-1"');
  });

  it("should strip protocol-relative URLs (//evil.com) to prevent cross-origin redirects", () => {
    const protocolRelativeLink = '<a href="//evil.com/phishing">Click here</a>';
    const cleaned = sanitizeContentHtml(protocolRelativeLink);
    expect(cleaned).not.toContain("//evil.com");
  });

  it("should strip dangerous CSS styles while allowing safe text-align and colors", () => {
    const dangerousStyle =
      '<p style="behavior: url(xss.htc); color: #333333; position: fixed">ข้อความ</p>';
    const cleaned = sanitizeContentHtml(dangerousStyle);
    expect(cleaned).toContain("color:#333333");
    expect(cleaned).not.toContain("behavior");
    expect(cleaned).not.toContain("position");
  });

  it("should preserve legitimate blog formatting (h2, p, blockquote, ul, ol, img, code)", () => {
    const safeHtml = `
      <h2>หัวข้อบทความ</h2>
      <p>นี่คือเนื้อหาที่มี <strong>ตัวหนา</strong> และ <em>ตัวเอียง</em></p>
      <blockquote>คำคมที่น่าสนใจ</blockquote>
      <ul>
        <li>รายการที่ 1</li>
        <li>รายการที่ 2</li>
      </ul>
      <pre><code>console.log("hello");</code></pre>
      <img src="https://example.com/photo.jpg" alt="Photo" class="rounded-xl" />
    `;
    const cleaned = sanitizeContentHtml(safeHtml);
    expect(cleaned).toContain("<h2>");
    expect(cleaned).toContain("หัวข้อบทความ");
    expect(cleaned).toContain("<strong>");
    expect(cleaned).toContain("<blockquote>");
    expect(cleaned).toContain("<ul>");
    expect(cleaned).toContain("<code>");
    expect(cleaned).toContain('<img src="https://example.com/photo.jpg"');
  });

  it("should strip data: URLs from <a> href while permitting them on <img> src", () => {
    const maliciousLink = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>';
    const cleanedLink = sanitizeContentHtml(maliciousLink);
    expect(cleanedLink).not.toContain("data:");

    const safeBase64Img = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Dot" />';
    const cleanedImg = sanitizeContentHtml(safeBase64Img);
    expect(cleanedImg).toContain("data:image/png;base64");
  });

  it("should handle empty or nullish strings safely", () => {
    expect(sanitizeContentHtml("")).toBe("");
    // @ts-expect-error testing null
    expect(sanitizeContentHtml(null)).toBe("");
  });
});
