import sanitizeHtml from "sanitize-html";

/**
 * Permitted HTML tags for blog content (Rich Text from TipTap / Markdown)
 */
export const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "div",
  "span",
  "blockquote",
  "ul",
  "ol",
  "li",
  "b",
  "i",
  "strong",
  "em",
  "strike",
  "s",
  "del",
  "u",
  "mark",
  "code",
  "pre",
  "hr",
  "br",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

/**
 * Permitted attributes per tag. Strictly avoids any inline JS event handlers (onerror, onclick, etc.)
 */
export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "name", "target", "rel", "title", "class", "id"],
  img: ["src", "alt", "title", "width", "height", "loading", "decoding", "class"],
  span: ["style", "class"],
  mark: ["style", "data-color", "class"],
  p: ["style", "class"],
  th: ["colspan", "rowspan", "style", "class"],
  td: ["colspan", "rowspan", "style", "class"],
  code: ["class"],
  pre: ["class"],
  "*": ["class", "id"],
};

/**
 * Strictly allowed safe inline styles to preserve TipTap text colors, highlights, and alignment
 * while preventing CSS injection / expression attacks.
 */
export const ALLOWED_STYLES = {
  "*": {
    color: [
      /^#(0x)?[0-9a-f]{3,8}$/i,
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i,
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i,
      /^hsl\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)$/i,
      /^[a-z]+$/i,
    ],
    "background-color": [
      /^#(0x)?[0-9a-f]{3,8}$/i,
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i,
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i,
      /^hsl\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*\)$/i,
      /^[a-z]+$/i,
    ],
    "text-align": [/^(left|right|center|justify)$/i],
  },
};

/**
 * Sanitizes rich text HTML content to eliminate XSS vectors (scripts, iframes, javascript: URI, event handlers)
 * while preserving styling, colors, marks, and semantic blog structure.
 */
export function sanitizeContentHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";

  return sanitizeHtml(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedSchemesAppliedTo: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => {
        // Enforce safe rel attribute for links with target="_blank"
        if (attribs.target === "_blank") {
          const existingRel = attribs.rel ? attribs.rel.split(/\s+/) : [];
          if (!existingRel.includes("noopener")) existingRel.push("noopener");
          if (!existingRel.includes("noreferrer")) existingRel.push("noreferrer");
          attribs.rel = existingRel.join(" ");
        }
        return {
          tagName,
          attribs,
        };
      },
    },
  });
}
