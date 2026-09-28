"use server";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, hashPassword, verifyPassword } from "@/lib/auth/jwt";

export async function serverLogin(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error("Invalid email or password");

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid email or password");

  const token = await signToken({ userId: user.id, email: user.email, fullName: user.full_name });
  return { token, user: { id: user.id, email: user.email, fullName: user.full_name } };
}

export async function serverRegister(email: string, password: string, fullName?: string) {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("Email already in use");

  const hash = await hashPassword(password);
  const [result] = await db.insert(users).values({ email, password_hash: hash, full_name: fullName ?? null });
  const id = String((result as any).insertId ?? "");

  const token = await signToken({ userId: id, email, fullName: fullName ?? null });
  return { token, user: { id, email, fullName } };
}

export async function serverVerifyToken(token: string) {
  return verifyToken(token);
}

export async function serverChangePassword(userId: string, newPassword: string) {
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ password_hash: hash }).where(eq(users.id, userId));
  return { success: true };
}
