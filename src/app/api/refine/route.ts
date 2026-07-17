import { NextResponse } from "next/server";
import { z } from "zod";
import { canEdit, getContext } from "@/lib/auth";
import { badRequest, forbidden, loadVoiceContext, unauthorized } from "@/lib/api";
import { getAI } from "@/lib/ai";

const schema = z.object({
  profileId: z.string(),
  contentType: z.enum(["blog", "linkedin", "tweet", "email", "landing"]),
  brief: z.string().max(4000).default(""),
  text: z.string().min(1).max(40000),
  action: z.enum(["regenerate", "shorten", "expand", "onbrand"]),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (!canEdit(ctx.role)) return forbidden();

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid refine request.");
  const { profileId, contentType, brief, text, action } = parsed.data;

  const loaded = await loadVoiceContext(profileId, ctx.workspace.id);
  if (!loaded) return badRequest("Unknown voice profile.");

  try {
    const result = await getAI().refine({
      voice: loaded.context,
      contentType,
      brief,
      text,
      action,
    });
    return NextResponse.json({ text: result });
  } catch (err) {
    console.error("refine failed:", err);
    return NextResponse.json(
      { error: "That edit didn't go through. Try again." },
      { status: 502 }
    );
  }
}
