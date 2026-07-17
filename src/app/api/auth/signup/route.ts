import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
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

  const base = slugify(company);
  let slug = base;
  for (let i = 2; await db.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      memberships: {
        create: {
          role: "owner",
          workspace: { create: { name: company, slug, industry } },
        },
      },
    },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
