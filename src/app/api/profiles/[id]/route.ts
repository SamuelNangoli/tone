import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, refreshAccuracy, unauthorized } from "@/lib/api";
import { parseVoiceData } from "@/lib/voice";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const profile = await db.voiceProfile.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: { samples: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      accuracy: profile.accuracy,
      generationCount: profile.generationCount,
      feedbackCount: profile.feedbackCount,
      data: parseVoiceData(profile.data),
      samples: profile.samples.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        source: s.source,
      })),
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  addSample: z
    .object({ title: z.string().max(120), content: z.string().min(1).max(20000) })
    .optional(),
  removeSampleId: z.string().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();
  const { id } = await params;

  const profile = await db.voiceProfile.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid update payload.");
  const { name, description, data, addSample, removeSampleId } = parsed.data;

  if (data) {
    const current = parseVoiceData(profile.data);
    const next = {
      ...current,
      ...data,
      sliders: {
        ...current.sliders,
        ...((data as { sliders?: object }).sliders ?? {}),
      },
    };
    await db.voiceProfile.update({
      where: { id },
      data: { data: JSON.stringify(next) },
    });
  }
  if (name !== undefined || description !== undefined) {
    await db.voiceProfile.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
  }
  if (addSample) {
    await db.sample.create({
      data: { profileId: id, title: addSample.title, content: addSample.content },
    });
  }
  if (removeSampleId) {
    await db.sample.deleteMany({ where: { id: removeSampleId, profileId: id } });
  }

  const accuracy = await refreshAccuracy(id);
  return NextResponse.json({ ok: true, accuracy });
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "owner") return forbidden("Only the owner can delete profiles.");
  const { id } = await params;
  await db.voiceProfile.deleteMany({ where: { id, workspaceId: ctx.workspace.id } });
  return NextResponse.json({ ok: true });
}
