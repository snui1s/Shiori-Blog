import { db, User, eq } from "astro:db";
import { getSession } from "auth-astro/server";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const session = await getSession(request);

  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { name, image } = await request.json();

    if (!name || name.trim() === "") {
        return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
    }

    await db.update(User)
      .set({ 
        name: name.trim(), 
        image: image !== undefined ? image : session.user.image 
      })
      .where(eq(User.email, session.user.email));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
