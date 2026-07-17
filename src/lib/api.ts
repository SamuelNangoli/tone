import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeAccuracy, parseVoiceData } from "@/lib/voice";
import type { VoiceContext } from "@/lib/ai";

export function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

export function forbidden(msg = "Viewers can't make changes") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

/** Recomputes and persists a profile's voice-accuracy score. */
export async function refreshAccuracy(profileId: string) {
  const profile = await db.voiceProfile.findUnique({
    where: { id: profileId },
    include: { samples: true, feedback: true },
  });
  if (!profile) return;
  const data = parseVoiceData(profile.data);
  const accuracy = computeAccuracy({
    sampleCount: profile.samples.length,
    feedbackCount: profile.feedback.length,
    positiveFeedback: profile.feedback.filter((f) => f.rating === "up").length,
    hasQuiz: Boolean(data.audience || data.traits.length),
    hasWebsite: Boolean(data.websiteUrl),
  });
  await db.voiceProfile.update({
    where: { id: profileId },
    data: { accuracy, feedbackCount: profile.feedback.length },
  });
  return accuracy;
}

/** Loads a profile (scoped to a workspace) as the VoiceContext the AI layer consumes. */
export async function loadVoiceContext(
  profileId: string,
  workspaceId: string
): Promise<{ context: VoiceContext; profileId: string } | null> {
  const profile = await db.voiceProfile.findFirst({
    where: { id: profileId, workspaceId },
    include: {
      samples: { orderBy: { createdAt: "desc" }, take: 5 },
      workspace: true,
    },
  });
  if (!profile) return null;
  return {
    profileId: profile.id,
    context: {
      profileName: profile.name,
      industry: profile.workspace.industry,
      data: parseVoiceData(profile.data),
      samples: profile.samples.map((s) => ({ title: s.title, content: s.content })),
    },
  };
}
