import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  content: z.string().max(100000).optional(),
  brief: z.string().max(4000).optional(),
  status: z.enum(["draft", "approved", "published"]).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid draft update.");

  const result = await db.draft.updateMany({
    where: { id, workspaceId: ctx.workspace.id },
    data: parsed.data,
  });
  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();
  const { id } = await params;
  await db.draft.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  return NextResponse.json({ ok: true });
}
