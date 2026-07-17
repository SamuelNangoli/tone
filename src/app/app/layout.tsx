import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseVoiceData } from "@/lib/voice";
import { AppProvider } from "@/components/app-context";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getContext();
  if (!ctx) redirect("/login");

  const profiles = await db.voiceProfile.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { _count: { select: { samples: true, drafts: true } } },
    orderBy: { createdAt: "asc" },
  });

  const prefs = JSON.parse(ctx.user.prefs || "{}");

  return (
    <AppProvider
      workspace={{
        id: ctx.workspace.id,
        name: ctx.workspace.name,
        industry: ctx.workspace.industry,
        accentColor: ctx.workspace.accentColor,
      }}
      user={{ name: ctx.user.name, email: ctx.user.email }}
      role={ctx.role}
      initialPrefs={prefs}
      initialProfiles={profiles.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        accuracy: p.accuracy,
        generationCount: p.generationCount,
        feedbackCount: p.feedbackCount,
        sampleCount: p._count.samples,
        draftCount: p._count.drafts,
        data: parseVoiceData(p.data),
      }))}
    >
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
