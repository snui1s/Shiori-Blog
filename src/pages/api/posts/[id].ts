import type { APIRoute } from 'astro';
import { db, Post, User, eq } from 'astro:db';
import { getSession } from "auth-astro/server";
import { sanitizeContentHtml } from "../../../lib/sanitize";

export const prerender = false;

async function isAuthorized(request: Request) {
  const session = await getSession(request);
  if (!session || !session.user?.email) return false;
  
  const dbUser = await db.select().from(User).where(eq(User.email, session.user.email)).get();
  const isOwner = session.user.email === import.meta.env.ADMIN_EMAIL;
  return dbUser?.role === 'admin' || isOwner;
}

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response(null, { status: 400 });

  try {
    const post = await db.select().from(Post).where(eq(Post.slug, id)).get();
    if (!post) return new Response(null, { status: 404 });
    return new Response(JSON.stringify(post), { status: 200 });
  } catch (error: any) {
    console.error('Get post error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!await isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing post slug' }), { status: 400 });
  
  try {
    // 1. Check if the post exists
    const existingPost = await db.select().from(Post).where(eq(Post.slug, id)).get();
    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    const data = await request.json();

    // 2. Validate and check uniqueness if slug is being updated
    let targetSlug = existingPost.slug;
    if (data.slug && typeof data.slug === 'string' && data.slug.trim() !== existingPost.slug) {
      const normalizedSlug = data.slug.trim().toLowerCase().replace(/[\s_]+/g, '-');
      // Validate slug format (letters, numbers, Thai characters, hyphens)
      if (!/^[a-z0-9\u0E00-\u0E7F-]+$/i.test(normalizedSlug)) {
        return new Response(
          JSON.stringify({ error: 'Invalid slug format. Use alphanumeric characters and hyphens only.' }),
          { status: 400 }
        );
      }

      // Check for collision with other posts
      const slugCollision = await db.select().from(Post).where(eq(Post.slug, normalizedSlug)).get();
      if (slugCollision && slugCollision.slug !== existingPost.slug) {
        return new Response(
          JSON.stringify({ error: 'Slug is already in use by another post' }),
          { status: 409 }
        );
      }
      targetSlug = normalizedSlug;
    }

    // 3. Prepare partial update payload (H1 fix: preserve existing image if not provided)
    const updateData: Record<string, any> = {
      slug: targetSlug,
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = sanitizeContentHtml(data.content || '');
    if (data.category !== undefined) updateData.category = data.category;
    if (data.author !== undefined) updateData.author = data.author;

    // H1 fix: support both image_url and imageUrl, and preserve existing if not passed
    const providedImage = data.image_url !== undefined ? data.image_url : data.imageUrl;
    if (providedImage !== undefined) {
      updateData.imageUrl = providedImage;
    }

    await db.update(Post)
      .set(updateData)
      .where(eq(Post.slug, id));

    return new Response(JSON.stringify({ message: 'Updated successfully', slug: targetSlug }), { status: 200 });
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Malformed JSON input' }), { status: 400 });
    }
    console.error('Update post error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!await isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'Missing post slug' }), { status: 400 });

  try {
    // Check if the post exists before deleting
    const existingPost = await db.select().from(Post).where(eq(Post.slug, id)).get();
    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    await db.delete(Post).where(eq(Post.slug, id));
    return new Response(JSON.stringify({ message: 'Deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
