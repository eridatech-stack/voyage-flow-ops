import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, hashPassword, verifyPassword } from "@/lib/auth/jwt";

export const serverLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!user) throw new Error("Invalid email or password");
    const valid = await verifyPassword(data.password, user.password_hash);
    if (!valid) throw new Error("Invalid email or password");
    const token = await signToken({ userId: user.id, email: user.email, fullName: user.full_name });
    return { token, user: { id: user.id, email: user.email, fullName: user.full_name } };
  });

export const serverVerifyToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    return verifyToken(data.token);
  });

export const serverChangePassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string(), newPassword: z.string().min(6) }))
  .handler(async ({ data }) => {
    const hash = await hashPassword(data.newPassword);
    await db.update(users).set({ password_hash: hash }).where(eq(users.id, data.userId));
    return { success: true };
  });

export const serverRegister = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().optional() }))
  .handler(async ({ data }) => {
    const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) throw new Error("Email already in use");
    const hash = await hashPassword(data.password);
    const [result] = await db.insert(users).values({ email: data.email, password_hash: hash, full_name: data.fullName ?? null });
    const id = String((result as any).insertId ?? "");
    const token = await signToken({ userId: id, email: data.email, fullName: data.fullName ?? null });
    return { token, user: { id, email: data.email, fullName: data.fullName } };
  });
