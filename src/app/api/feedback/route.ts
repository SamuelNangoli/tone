import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, refreshAccuracy, unauthorized } from "@/lib/api";

const schema = z.object({
  profileId: z.string(),
  generationId: z.string().optional(),
  draftId: z.string().optional(),
  rating: z.enum(["up", "down"]),
  note: z.string().max(1000).optional().default(""),
  /** "Make it more like this" — the user's edited text becomes a training sample. */
  editedText: z.string().max(40000).optional().default(""),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid feedback payload.");
  const { profileId, generationId, draftId, rating, note, editedText } = parsed.data;

  const profile = await db.voiceProfile.findFirst({
    where: { id: profileId, workspaceId: ctx.workspace.id },
  });
  if (!profile) return badRequest("Unknown voice profile.");

  await db.feedback.create({
    data: { profileId, generationId, draftId, rating, note, editedText },
  });

  // The feedback loop: a thumbs-up with an edited version teaches the
  // profile — the edit is stored as a new writing sample.
  if (rating === "up" && editedText.trim().length > 40) {
    await db.sample.create({
      data: {
        profileId,
        title: "From feedback",
        content: editedText,
        source: "feedback",
      },
    });
  }

  const accuracy = await refreshAccuracy(profileId);
  return NextResponse.json({ ok: true, accuracy });
}
