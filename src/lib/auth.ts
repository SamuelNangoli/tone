import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const COOKIE = "tone_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "tone-dev-secret"
);

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function getUser() {
  const userId = await getUserId();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

/**
 * Returns the current user plus their active workspace membership,
 * or null when unauthenticated. Role checks happen at the API layer.
 */
export async function getContext() {
  const userId = await getUserId();
  if (!userId) return null;
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { user: true, workspace: true },
  });
  if (!membership) return null;
  return {
    user: membership.user,
    workspace: membership.workspace,
    role: membership.role,
  };
}

export function canEdit(role: string) {
  return role === "owner" || role === "editor";
}
