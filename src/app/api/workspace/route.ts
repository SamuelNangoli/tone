import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getContext } from "@/lib/auth";
import { badRequest, forbidden, unauthorized } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  industry: z.string().min(1).max(60).optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function PATCH(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "owner") return forbidden("Only the owner can change workspace settings.");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid workspace settings.");

  await db.workspace.update({ where: { id: ctx.workspace.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
