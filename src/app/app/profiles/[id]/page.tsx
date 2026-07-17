"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { useApp } from "@/components/app-context";
import { AccuracyRing } from "@/components/accuracy-ring";
import type { VoiceProfileData } from "@/lib/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FullProfile = {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  generationCount: number;
  feedbackCount: number;
  data: VoiceProfileData;
  samples: { id: string; title: string; content: string; source: string }[];
};

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { role, refreshProfiles } = useApp();
  const canEdit = role === "owner" || role === "editor";

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [name, setName] = useState("");
  const [data, setData] = useState<VoiceProfileData | null>(null);
  const [newSample, setNewSample] = useState({ title: "", content: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await api<{ profile: FullProfile }>(`/api/profiles/${id}`);
    setProfile(res.profile);
    setName(res.profile.name);
    setData(res.profile.data);
  }

  useEffect(() => {
    load().catch(() => router.push("/app/profiles"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!profile || !data) {
    return <div className="pane-pad text-sm text-muted-foreground">Loading profile…</div>;
  }

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ accuracy: number }>(`/api/profiles/${id}`, {
        method: "PATCH",
        body: { name, data },
      });
      toast.success(`Saved. Voice accuracy: ${res.accuracy}%`);
      await refreshProfiles();
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addSample() {
    if (newSample.content.trim().length < 40) {
      toast.error("Samples need at least a paragraph to be useful.");
      return;
    }
    try {
      await api(`/api/profiles/${id}`, {
        method: "PATCH",
        body: { addSample: { title: newSample.title || "Pasted sample", content: newSample.content } },
      });
      setNewSample({ title: "", content: "" });
      await load();
      await refreshProfiles();
      toast.success("Sample added — accuracy updated.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function removeSample(sampleId: string) {
    await api(`/api/profiles/${id}`, { method: "PATCH", body: { removeSampleId: sampleId } });
    await load();
    await refreshProfiles();
  }

  const csv = (arr: string[]) => arr.join(", ");
  const parse = (s: string) => s.split(",").map((w) => w.trim()).filter(Boolean);

  return (
    <div className="pane-pad mx-auto grid w-full max-w-3xl gap-6">
      <div className="flex items-center gap-4">
        <AccuracyRing value={profile.accuracy} size={56} />
        <div className="min-w-0 flex-1">
          <Input
            className="max-w-sm text-lg font-semibold"
            value={name}
            disabled={!canEdit}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {profile.samples.length} samples · {profile.generationCount} generations ·{" "}
            {profile.feedbackCount} feedback signals. This profile is the asset —
            everything you generate is conditioned on it.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => void save()} disabled={busy} style={{ background: "var(--brand)", color: "white" }}>
            Save changes
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tone</CardTitle>
          <CardDescription>The defaults every generation starts from.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {(
            [
              ["Formal", "Casual", "formality"],
              ["Careful", "Bold", "boldness"],
              ["Concise", "Detailed", "detail"],
            ] as const
          ).map(([low, high, key]) => (
            <div key={key} className="grid gap-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{low}</span>
                <span>{high}</span>
              </div>
              <Slider
                value={[data.sliders[key]]}
                max={100}
                step={5}
                disabled={!canEdit}
                onValueChange={(value) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  setData((d) => d && { ...d, sliders: { ...d.sliders, [key]: v } });
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vocabulary &amp; audience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Do-words</Label>
            <Input
              value={csv(data.doWords)}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, doWords: parse(e.target.value) })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Don&apos;t-words</Label>
            <Input
              value={csv(data.dontWords)}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, dontWords: parse(e.target.value) })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Audience</Label>
            <Input
              value={data.audience}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, audience: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Don&apos;t sound like (competitors)</Label>
            <Input
              value={csv(data.competitors)}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, competitors: parse(e.target.value) })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Voice traits (learned)</Label>
            <Input
              value={csv(data.traits)}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, traits: parse(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Extracted from your samples — edit freely if we got you wrong.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Website</Label>
            <Input
              value={data.websiteUrl}
              disabled={!canEdit}
              onChange={(e) => setData((d) => d && { ...d, websiteUrl: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Writing samples</CardTitle>
          <CardDescription>
            The raw material the voice is learned from. Feedback-sourced samples
            appear here too — that&apos;s the loop working.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {profile.samples.map((s) => (
            <div key={s.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.title || "Untitled"}</p>
                <div className="flex items-center gap-2">
                  {s.source === "feedback" && (
                    <Badge variant="secondary" className="text-[10px]">
                      learned from feedback
                    </Badge>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => void removeSample(s.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{s.content}</p>
            </div>
          ))}
          {canEdit && (
            <>
              <Separator />
              <div className="grid gap-2">
                <Input
                  placeholder="New sample title (optional)"
                  value={newSample.title}
                  onChange={(e) => setNewSample((s) => ({ ...s, title: e.target.value }))}
                />
                <Textarea
                  rows={4}
                  placeholder="Paste more of your writing — every sample sharpens the voice."
                  value={newSample.content}
                  onChange={(e) => setNewSample((s) => ({ ...s, content: e.target.value }))}
                />
                <Button variant="outline" onClick={() => void addSample()}>
                  Add sample
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
