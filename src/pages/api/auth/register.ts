import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import bcrypt from "bcryptjs";
import { validateRegistration } from "../../../lib/auth";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";
 
export const prerender = false;
 
export const POST: APIRoute = async ({ request }) => {
  // Rate limiting: Max 5 registration attempts per 15 minutes per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "คุณทำรายการสมัครสมาชิกบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
      }),
      { status: 429 }
    );
  }

  try {
    const data = await request.formData();
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    // 1. Validate input
    const validation = validateRegistration(name, email, password);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validation.message,
        }),
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await db
      .select()
      .from(User)
      .where(eq(User.email, email))
      .get();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ไม่สามารถใช้อีเมลนี้ลงทะเบียนได้ กรุณาตรวจสอบหรือเข้าสู่ระบบ",
        }),
        { status: 400 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create new user
    const userId = crypto.randomUUID();

    await db.insert(User).values({
      id: userId,
      email,
      password: hashedPassword,
      name: name,
      role: "reader",
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "ลงทะเบียนสำเร็จ",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      }),
      { status: 500 }
    );
  }
};
