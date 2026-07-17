import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, loadVoiceContext, unauthorized } from "@/lib/api";
import { getAI } from "@/lib/ai";

const schema = z.object({
  profileId: z.string(),
  contentType: z.enum(["blog", "linkedin", "tweet", "email", "landing"]),
  brief: z.string().min(3).max(4000),
  overrides: z
    .object({
      sliders: z
        .object({
          formality: z.number().min(0).max(100),
          boldness: z.number().min(0).max(100),
          detail: z.number().min(0).max(100),
        })
        .partial()
        .optional(),
      doWords: z.array(z.string()).optional(),
      dontWords: z.array(z.string()).optional(),
    })
    .optional(),
  variationCount: z.number().min(1).max(3).optional(),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid generation request.");
  const { profileId, contentType, brief, overrides, variationCount } = parsed.data;

  const loaded = await loadVoiceContext(profileId, ctx.workspace.id);
  if (!loaded) return badRequest("Unknown voice profile.");

  try {
    const variations = await getAI().generateVariations({
      voice: loaded.context,
      contentType,
      brief,
      overrides: overrides as never,
      variationCount,
    });

    const generation = await db.generation.create({
      data: {
        profileId,
        contentType,
        brief,
        variations: JSON.stringify(variations),
      },
    });
    await db.voiceProfile.update({
      where: { id: profileId },
      data: { generationCount: { increment: 1 } },
    });

    return NextResponse.json({
      generationId: generation.id,
      variations,
      provider: getAI().name,
    });
  } catch (err) {
    console.error("generate failed:", err);
    return NextResponse.json(
      { error: "Generation failed. Try again in a moment." },
      { status: 502 }
    );
  }
}
