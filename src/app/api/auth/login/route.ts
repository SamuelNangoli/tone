import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv, SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/env";
import { badRequest } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) return badRequest(SUPABASE_SETUP_MESSAGE);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Enter your email and password.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the authentication service. Check your connection and that your Supabase project is active." },
      { status: 503 }
    );
  }
}
