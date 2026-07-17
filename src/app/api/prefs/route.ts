import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getContext } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api";

const schema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
});

export async function PATCH(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid preferences.");

  const current = JSON.parse(ctx.user.prefs || "{}");
  await db.user.update({
    where: { id: ctx.user.id },
    data: { prefs: JSON.stringify({ ...current, ...parsed.data }) },
  });
  return NextResponse.json({ ok: true });
}
