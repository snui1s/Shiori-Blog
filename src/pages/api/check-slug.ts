import type { APIRoute } from "astro";
import { db, Post, eq } from "astro:db";
import { getSession } from "auth-astro/server";

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  // M8 Fix: Require authenticated user to prevent public slug enumeration
  const session = await getSession(request);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const slug = url.searchParams.get("slug")?.trim();
  if (!slug) {
    return new Response(JSON.stringify({ exists: false }), { status: 200 });
  }

  try {
    const existingPost = await db.select().from(Post).where(eq(Post.slug, slug)).get();
    return new Response(JSON.stringify({ exists: !!existingPost }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
