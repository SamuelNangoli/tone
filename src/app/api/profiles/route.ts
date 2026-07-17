import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, refreshAccuracy, unauthorized } from "@/lib/api";
import { getAI } from "@/lib/ai";
import { DEFAULT_VOICE_DATA, parseVoiceData } from "@/lib/voice";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  const profiles = await db.voiceProfile.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { _count: { select: { samples: true, drafts: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    profiles: profiles.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      accuracy: p.accuracy,
      generationCount: p.generationCount,
      feedbackCount: p.feedbackCount,
      sampleCount: p._count.samples,
      draftCount: p._count.drafts,
      data: parseVoiceData(p.data),
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional().default(""),
  data: z
    .object({
      sliders: z.object({
        formality: z.number().min(0).max(100),
        boldness: z.number().min(0).max(100),
        detail: z.number().min(0).max(100),
      }),
      doWords: z.array(z.string()).max(20),
      dontWords: z.array(z.string()).max(20),
      audience: z.string().max(300),
      competitors: z.array(z.string()).max(10),
      websiteUrl: z.string().max(300),
      traits: z.array(z.string()).max(10),
    })
    .partial()
    .optional(),
  samples: z
    .array(z.object({ title: z.string().max(120), content: z.string().min(1).max(20000) }))
    .max(5)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid profile payload.");
  const { name, description, samples } = parsed.data;

  const data = {
    ...DEFAULT_VOICE_DATA,
    ...parsed.data.data,
    sliders: { ...DEFAULT_VOICE_DATA.sliders, ...(parsed.data.data?.sliders ?? {}) },
  };

  // Distill samples into voice traits at creation time — this is the
  // "learn your voice once" moment.
  if (samples.length && data.traits.length === 0) {
    data.traits = await getAI().extractTraits(
      samples.map((s) => s.content),
      data
    );
  }

  const profile = await db.voiceProfile.create({
    data: {
      workspaceId: ctx.workspace.id,
      name,
      description,
      data: JSON.stringify(data),
      samples: {
        create: samples.map((s) => ({ title: s.title, content: s.content })),
      },
    },
  });
  const accuracy = await refreshAccuracy(profile.id);
  return NextResponse.json({ id: profile.id, accuracy });
}
