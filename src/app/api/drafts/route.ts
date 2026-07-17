import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, unauthorized } from "@/lib/api";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  const drafts = await db.draft.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { profile: { select: { id: true, name: true } }, author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    drafts: drafts.map((d) => ({
      id: d.id,
      title: d.title,
      contentType: d.contentType,
      brief: d.brief,
      content: d.content,
      status: d.status,
      profileId: d.profile.id,
      profileName: d.profile.name,
      author: d.author?.name ?? null,
      updatedAt: d.updatedAt,
    })),
  });
}

const createSchema = z.object({
  profileId: z.string(),
  title: z.string().min(1).max(160),
  contentType: z.enum(["blog", "linkedin", "tweet", "email", "landing"]),
  brief: z.string().max(4000).default(""),
  content: z.string().max(100000).default(""),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid draft payload.");

  const profile = await db.voiceProfile.findFirst({
    where: { id: parsed.data.profileId, workspaceId: ctx.workspace.id },
  });
  if (!profile) return badRequest("Unknown voice profile.");

  const draft = await db.draft.create({
    data: {
      ...parsed.data,
      workspaceId: ctx.workspace.id,
      authorId: ctx.user.id,
    },
  });
  return NextResponse.json({ id: draft.id });
}
