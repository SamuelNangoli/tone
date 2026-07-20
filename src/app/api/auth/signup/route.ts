import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { badRequest } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  company: z.string().min(1).max(80),
  industry: z.string().min(1).max(60).default("B2B SaaS"),
});

function slugify(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "workspace"
  );
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Check your details and try again.");
  const { name, email, password, company, industry } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing)
    return badRequest("An account with that email already exists — sign in instead.");

  const supabase = await createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) return badRequest(signUpError.message);
  const authUser = signUpData.user;
  if (!authUser) {
    return badRequest("Check your inbox to confirm your email, then sign in.");
  }
  if (!signUpData.session) {
    // Email confirmation is required by the Supabase project — no session
    // cookie was issued yet, so we can't create the workspace as this user.
    return badRequest(
      "Account created — check your inbox to confirm your email before signing in."
    );
  }

  const base = slugify(company);
  let slug = base;
  for (let i = 2; await db.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  await db.user.create({
    data: {
      id: authUser.id,
      name,
      email,
      memberships: {
        create: {
          role: "owner",
          workspace: { create: { name: company, slug, industry } },
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
