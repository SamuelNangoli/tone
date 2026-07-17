import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getContext } from "@/lib/auth";
import { badRequest, forbidden, unauthorized } from "@/lib/api";

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  const members = await db.membership.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({
    members: members.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    })),
  });
}

const inviteSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});

export async function POST(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "owner") return forbidden("Only the owner can invite teammates.");

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid invite.");
  const { name, email, role } = parsed.data;

  let user = await db.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;
  if (!user) {
    tempPassword = randomBytes(6).toString("base64url");
    user = await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(tempPassword, 10) },
    });
  }

  const existing = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: ctx.workspace.id } },
  });
  if (existing) return badRequest("Already a member of this workspace.");

  await db.membership.create({
    data: { userId: user.id, workspaceId: ctx.workspace.id, role },
  });
  return NextResponse.json({ ok: true, tempPassword });
}

const patchSchema = z.object({
  membershipId: z.string(),
  role: z.enum(["owner", "editor", "viewer"]).optional(),
  remove: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const ctx = await getContext();
  if (!ctx) return unauthorized();
  if (ctx.role !== "owner") return forbidden("Only the owner can manage roles.");

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest("Invalid member update.");
  const { membershipId, role, remove } = parsed.data;

  const membership = await db.membership.findFirst({
    where: { id: membershipId, workspaceId: ctx.workspace.id },
  });
  if (!membership) return badRequest("Unknown member.");
  if (membership.userId === ctx.user.id)
    return badRequest("You can't change your own role.");

  if (remove) {
    await db.membership.delete({ where: { id: membershipId } });
  } else if (role) {
    await db.membership.update({ where: { id: membershipId }, data: { role } });
  }
  return NextResponse.json({ ok: true });
}
