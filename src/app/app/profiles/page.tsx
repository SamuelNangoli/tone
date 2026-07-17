"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useApp } from "@/components/app-context";
import { AccuracyRing } from "@/components/accuracy-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilesPage() {
  const { profiles, refreshProfiles, role, setActiveProfileId } = useApp();
  const canEdit = role === "owner" || role === "editor";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await api<{ id: string }>("/api/profiles", {
        body: { name: name.trim(), samples: [] },
      });
      await refreshProfiles();
      setActiveProfileId(res.id);
      setOpen(false);
      setName("");
      toast.success("Profile created — add samples to raise its accuracy.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pane-pad mx-auto w-full max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Voice profiles</h1>
          <p className="text-sm text-muted-foreground">
            One brand, many voices — the blog doesn&apos;t sound like the
            founder&apos;s LinkedIn. Each profile is trained separately.
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button style={{ background: "var(--brand)", color: "white" }} />}
            >
              New profile
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New voice profile</DialogTitle>
                <DialogDescription>
                  Name it after where the writing lives — &quot;Company
                  blog&quot;, &quot;Founder LinkedIn&quot;, &quot;Support
                  replies&quot;.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Label htmlFor="pname">Name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
                <Button onClick={() => void create()} disabled={busy} style={{ background: "var(--brand)", color: "white" }}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <AccuracyRing value={p.accuracy} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-xs text-muted-foreground">
                {p.sampleCount} samples · {p.generationCount} generations ·{" "}
                {p.feedbackCount} feedback signals
              </p>
              {p.data.traits.length > 0 && (
                <p className="text-xs">
                  <span className="text-muted-foreground">Sounds: </span>
                  {p.data.traits.join(", ")}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
            render={<Link href={`/app/profiles/${p.id}`} />}
                >
                  View &amp; tune
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
            render={<Link href="/app" onClick={() => setActiveProfileId(p.id)} />}
                >
                  Write with this
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Tone hasn&apos;t learned your voice yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            A voice profile is what makes Tone yours: your samples, your tone
            sliders, your banned words. Five minutes now, on-brand forever.
          </p>
          <Button
            className="mt-4"
            style={{ background: "var(--brand)", color: "white" }}
            nativeButton={false}
            render={<Link href="/onboarding" />}
          >
            Start the voice wizard
          </Button>
        </div>
      )}
    </div>
  );
}
