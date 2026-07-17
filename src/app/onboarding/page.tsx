"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SampleDraft = { title: string; content: string };

const STEPS = ["Your writing", "Your website", "Your voice", "Done"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [profileName, setProfileName] = useState("Company blog");
  const [samples, setSamples] = useState<SampleDraft[]>([
    { title: "", content: "" },
    { title: "", content: "" },
    { title: "", content: "" },
  ]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [formality, setFormality] = useState(50);
  const [boldness, setBoldness] = useState(50);
  const [detail, setDetail] = useState(50);
  const [doWords, setDoWords] = useState("");
  const [dontWords, setDontWords] = useState("");
  const [audience, setAudience] = useState("");
  const [competitors, setCompetitors] = useState("");

  const filledSamples = samples.filter((s) => s.content.trim().length > 40);

  async function finish() {
    setBusy(true);
    try {
      await api("/api/profiles", {
        body: {
          name: profileName || "Company blog",
          description: "Created during onboarding",
          data: {
            sliders: { formality, boldness, detail },
            doWords: doWords.split(",").map((w) => w.trim()).filter(Boolean),
            dontWords: dontWords.split(",").map((w) => w.trim()).filter(Boolean),
            audience,
            competitors: competitors.split(",").map((w) => w.trim()).filter(Boolean),
            websiteUrl,
          },
          samples: filledSamples.map((s) => ({
            title: s.title || "Pasted sample",
            content: s.content,
          })),
        },
      });
      setStep(3);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
          Step {Math.min(step + 1, 3)} of 3 — {STEPS[step]}
        </p>
        <Progress value={((step + 1) / 4) * 100} className="mt-2" />
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teach Tone how you already write</CardTitle>
            <CardDescription>
              Paste 3–5 pieces you&apos;re proud of — blog posts, emails,
              LinkedIn posts. This is what makes every future draft sound like
              you instead of a chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Voice profile name</Label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder='e.g. "Company blog"'
              />
            </div>
            {samples.map((s, i) => (
              <div key={i} className="grid gap-1.5 rounded-lg border p-3">
                <Input
                  placeholder={`Sample ${i + 1} title (optional)`}
                  value={s.title}
                  onChange={(e) =>
                    setSamples((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, title: e.target.value } : p))
                    )
                  }
                />
                <Textarea
                  rows={4}
                  placeholder="Paste the text here…"
                  value={s.content}
                  onChange={(e) =>
                    setSamples((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, content: e.target.value } : p))
                    )
                  }
                />
              </div>
            ))}
            {samples.length < 5 && (
              <Button
                variant="outline"
                onClick={() => setSamples((p) => [...p, { title: "", content: "" }])}
              >
                Add another sample
              </Button>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filledSamples.length} usable sample{filledSamples.length === 1 ? "" : "s"}
              </p>
              <Button
                onClick={() => setStep(1)}
                disabled={filledSamples.length < 1}
                style={{ background: "var(--brand)", color: "white" }}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Where do you live on the internet?</CardTitle>
            <CardDescription>
              Your website gives Tone extra context about how your brand talks
              in public. Optional, but it helps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Website URL</Label>
              <Input
                type="url"
                placeholder="https://yourcompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)} style={{ background: "var(--brand)", color: "white" }}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Dial in the voice</CardTitle>
            <CardDescription>
              Three sliders, a few words, and who you&apos;re talking to. You
              can tweak all of this anytime — it lives in your Voice Profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {(
              [
                ["Formal", "Casual", formality, setFormality],
                ["Careful", "Bold", boldness, setBoldness],
                ["Concise", "Detailed", detail, setDetail],
              ] as const
            ).map(([low, high, value, set]) => (
              <div key={low} className="grid gap-2">
                <div className="flex justify-between text-sm">
                  <span className={value < 50 ? "font-semibold" : "text-muted-foreground"}>{low}</span>
                  <span className={value >= 50 ? "font-semibold" : "text-muted-foreground"}>{high}</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(v) => set(Array.isArray(v) ? v[0] : v)}
                  max={100}
                  step={5}
                />
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label>Words you love (comma-separated)</Label>
              <Input value={doWords} onChange={(e) => setDoWords(e.target.value)} placeholder="ship, momentum, craft" />
            </div>
            <div className="grid gap-1.5">
              <Label>Words you ban</Label>
              <Input value={dontWords} onChange={(e) => setDontWords(e.target.value)} placeholder="synergy, leverage, delve" />
            </div>
            <div className="grid gap-1.5">
              <Label>Who are you writing for?</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Heads of RevOps at 50–500 person SaaS companies" />
            </div>
            <div className="grid gap-1.5">
              <Label>3 competitors you do NOT want to sound like</Label>
              <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Acme, Globex, Initech" />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={finish} disabled={busy} style={{ background: "var(--brand)", color: "white" }}>
                {busy ? "Learning your voice…" : "Build my Voice Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Your voice is learned. 🎯</CardTitle>
            <CardDescription>
              From now on, every draft in this workspace is conditioned on
              &quot;{profileName}&quot;. You&apos;ll never re-explain your brand
              to an AI again — and the profile keeps improving as you give
              feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                router.push("/app");
                router.refresh();
              }}
              style={{ background: "var(--brand)", color: "white" }}
            >
              Write something in your voice →
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
