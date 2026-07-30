import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { db } from "@/lib/db";

/** Supabase-authenticated user id (== local User.id), or null if signed out. */
export async function getUserId(): Promise<string | null> {
  // If Supabase isn't configured, or is unreachable/paused, treat the request
  // as signed-out rather than throwing — public pages must still render.
  if (!getSupabaseEnv().configured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
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

export async function destroySession() {
  if (!getSupabaseEnv().configured) return;
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Already effectively signed out if Supabase is unreachable.
  }
}

export function canEdit(role: string) {
  return role === "owner" || role === "editor";
}
