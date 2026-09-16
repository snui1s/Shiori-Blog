import { defineMiddleware } from "astro:middleware";

/**
 * CSRF Protection Middleware for Astro
 * Validates Origin and Sec-Fetch-Site headers on all state-changing API requests (POST, PUT, PATCH, DELETE)
 * to prevent Cross-Site Request Forgery attacks.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const method = request.method.toUpperCase();

  // Only protect state-changing HTTP methods on /api/* routes
  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isApiRoute = url.pathname.startsWith("/api/");
  // Auth.js (/api/auth/*) manages its own internal CSRF tokens
  const isAuthRoute = url.pathname.startsWith("/api/auth/");

  if (isMutatingMethod && isApiRoute && !isAuthRoute) {
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");
    const secFetchSite = request.headers.get("sec-fetch-site");

    // 1. Block explicit cross-site fetch requests
    if (secFetchSite === "cross-site") {
      return new Response(
        JSON.stringify({
          error: "Forbidden: Cross-site request blocked by CSRF protection.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate Origin header if present
    if (originHeader) {
      try {
        const reqOrigin = new URL(originHeader).origin;
        const currentOrigin = url.origin;

        if (reqOrigin !== currentOrigin) {
          return new Response(
            JSON.stringify({
              error: "Forbidden: Cross-origin request blocked by CSRF protection.",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({
            error: "Forbidden: Malformed Origin header.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (refererHeader) {
      // 3. Fallback to Referer header if Origin is not supplied
      try {
        const reqRefererOrigin = new URL(refererHeader).origin;
        const currentOrigin = url.origin;

        if (reqRefererOrigin !== currentOrigin) {
          return new Response(
            JSON.stringify({
              error: "Forbidden: Cross-origin referer blocked by CSRF protection.",
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({
            error: "Forbidden: Malformed Referer header.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  const response = await next();

  // Attach Security Headers to all responses (H5 Fix)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://widget.cloudinary.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://placehold.co https://ui-avatars.com https://lh3.googleusercontent.com; connect-src 'self' https://www.google-analytics.com https://api.cloudinary.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  );

  return response;
});
