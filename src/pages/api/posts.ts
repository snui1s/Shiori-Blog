import type { APIRoute } from "astro";
import { db, Post, User, eq, like, and, or, desc, sql } from "astro:db";
import { getSession } from "auth-astro/server";
import { sanitizeContentHtml } from "../../lib/sanitize";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const rawSearch = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category")?.trim() || "";

  // H3 Fix: Clamp pagination parameters to prevent DB dump or negative offset
  const rawPage = parseInt(url.searchParams.get("page") || "1");
  const rawLimit = parseInt(url.searchParams.get("limit") || "9");
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 9 : rawLimit), 50);
  const offset = (page - 1) * limit;

  try {
    let conditions = [];

    // Clean search query and remove SQLite wildcards (% and _) to avoid wildcard hijacking
    const cleanSearch = rawSearch.trim().slice(0, 100);
    if (cleanSearch) {
      const sanitizedTerm = cleanSearch.replace(/[%_\\]/g, " ").trim();
      if (sanitizedTerm) {
        const searchPattern = `%${sanitizedTerm}%`;
        conditions.push(
          or(
            like(Post.title, searchPattern),
            like(Post.excerpt, searchPattern),
            like(Post.content, searchPattern),
          ),
        );
      }
    }

    if (category) conditions.push(eq(Post.category, category));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get posts
    const posts = await db
      .select()
      .from(Post)
      .where(whereClause)
      .orderBy(desc(Post.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql`count(*)` })
      .from(Post)
      .where(whereClause);

    const total = Number(totalCountResult[0]?.count || 0);

    return new Response(
      JSON.stringify({
        posts: posts.map((p) => ({
          ...p,
          image: p.imageUrl, // Add image property for consistency
        })),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      },
    );
  } catch (error) {
    console.error("Fetch posts error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);

  // 1. Check if user is logged in
  if (!session || !session.user?.email) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Please login first" }),
      { status: 401 },
    );
  }

  // 2. Fetch user from DB to verify role
  const dbUser = await db
    .select()
    .from(User)
    .where(eq(User.email, session.user.email))
    .get();

  const isOwner = session.user.email === import.meta.env.ADMIN_EMAIL;
  const isAdmin = dbUser?.role === "admin" || isOwner;

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
      status: 403,
    });
  }

  try {
    const data = await request.json();

    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      return new Response(JSON.stringify({ error: "Title is required" }), { status: 400 });
    }

    if (!data.slug || typeof data.slug !== "string" || !data.slug.trim()) {
      return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });
    }

    const normalizedSlug = data.slug.trim().toLowerCase().replace(/[\s_]+/g, "-");
    if (!/^[a-z0-9\u0E00-\u0E7F-]+$/i.test(normalizedSlug)) {
      return new Response(
        JSON.stringify({ error: "Invalid slug format. Use alphanumeric characters and hyphens only." }),
        { status: 400 }
      );
    }

    const existingPost = await db.select().from(Post).where(eq(Post.slug, normalizedSlug)).get();
    if (existingPost) {
      return new Response(
        JSON.stringify({ error: "Slug is already in use by another post" }),
        { status: 409 }
      );
    }

    // แปลงชื่อ field จาก snake_case (จาก Editor) เป็น camelCase (ตาม DB)
    await db.insert(Post).values({
      title: data.title.trim(),
      slug: normalizedSlug,
      excerpt: data.excerpt,
      content: sanitizeContentHtml(data.content || ""),
      category: data.category || "Journal",
      imageUrl: data.image_url || data.imageUrl,
      author: data.author || dbUser?.name || "Admin",
    });

    return new Response(JSON.stringify({ message: "Success", slug: normalizedSlug }), {
      status: 201,
    });
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Malformed JSON input" }), {
        status: 400,
      });
    }
    console.error("Post creation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
