"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Minimize2,
  Maximize2,
  Wand2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "@/components/app-context";
import { FormatPreview } from "@/components/previews";
import { AccuracyRing } from "@/components/accuracy-ring";
import { api } from "@/lib/client";
import { CONTENT_TYPES, type ContentType } from "@/lib/voice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Variation = { id: string; label: string; content: string };

export function WriteWorkspace({ draftParam }: { draftParam: string | null }) {
  const { profiles, activeProfileId, workspace, role, focusMode, refreshProfiles } = useApp();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;
  const canEdit = role === "owner" || role === "editor";

  const [contentType, setContentType] = useState<ContentType>("linkedin");
  const [brief, setBrief] = useState("");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<string | null>(null);
  const [canvasOrigin, setCanvasOrigin] = useState<string>("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [refining, setRefining] = useState<string | null>(null);

  // Live voice controls (right pane) — start from the profile, override per-generation.
  const [sliders, setSliders] = useState(profile?.data.sliders ?? { formality: 50, boldness: 50, detail: 50 });
  const [keywords, setKeywords] = useState("");
  const slidersTouched = useRef(false);

  useEffect(() => {
    if (profile && !slidersTouched.current) setSliders(profile.data.sliders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Load a draft passed via /app?draft=<id>
  useEffect(() => {
    if (!draftParam) return;
    api<{ drafts: { id: string; title: string; contentType: ContentType; brief: string; content: string; profileId: string }[] }>(
      "/api/drafts"
    ).then((data) => {
      const d = data.drafts.find((x) => x.id === draftParam);
      if (!d) return;
      setDraftId(d.id);
      setDraftTitle(d.title);
      setContentType(d.contentType);
      setBrief(d.brief);
      setCanvas(d.content);
      setCanvasOrigin(d.content);
    });
  }, [draftParam]);

  const overrides = useMemo(() => {
    const kw = keywords.split(",").map((w) => w.trim()).filter(Boolean);
    return {
      sliders,
      ...(kw.length ? { doWords: kw } : {}),
    };
  }, [sliders, keywords]);

  const generate = useCallback(
    async (silent = false) => {
      if (!profile || !brief.trim()) {
        if (!silent) toast.error("Give Tone a brief first.");
        return;
      }
      setBusy(true);
      try {
        const data = await api<{ generationId: string; variations: Variation[] }>(
          "/api/generate",
          {
            body: {
              profileId: profile.id,
              contentType,
              brief,
              overrides,
              variationCount: contentType === "tweet" ? 3 : 3,
            },
          }
        );
        setVariations(data.variations);
        setGenerationId(data.generationId);
        setCanvas(null);
        void refreshProfiles();
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [profile, brief, contentType, overrides, refreshProfiles]
  );

  // LIVE controls: when sliders/keywords change after a generation exists,
  // re-shape the output without leaving the page (debounced).
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!variations.length || canvas !== null) return;
    if (liveTimer.current) clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(() => void generate(true), 900);
    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliders, keywords]);

  async function refine(action: "regenerate" | "shorten" | "expand" | "onbrand") {
    if (!profile || canvas === null) return;
    setRefining(action);
    try {
      const data = await api<{ text: string }>("/api/refine", {
        body: { profileId: profile.id, contentType, brief, text: canvas, action },
      });
      setCanvas(data.text);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefining(null);
    }
  }

  async function sendFeedback(rating: "up" | "down", withEdit = false) {
    if (!profile) return;
    try {
      const edited = withEdit && canvas !== null && canvas !== canvasOrigin ? canvas : "";
      const res = await api<{ accuracy: number }>("/api/feedback", {
        body: {
          profileId: profile.id,
          generationId: generationId ?? undefined,
          draftId: draftId ?? undefined,
          rating,
          editedText: edited,
        },
      });
      void refreshProfiles();
      toast.success(
        rating === "up"
          ? edited
            ? `Learned from your edit — voice accuracy now ${res.accuracy}%`
            : `Noted. Voice accuracy now ${res.accuracy}%`
          : "Got it — Tone will steer away from this."
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function saveDraft(status?: string) {
    if (!profile || canvas === null) return;
    const title =
      draftTitle.trim() ||
      (brief.trim().slice(0, 60) || "Untitled") + (brief.length > 60 ? "…" : "");
    try {
      if (draftId) {
        await api(`/api/drafts/${draftId}`, {
          method: "PATCH",
          body: { title, content: canvas, brief, ...(status ? { status } : {}) },
        });
      } else {
        const res = await api<{ id: string }>("/api/drafts", {
          body: { profileId: profile.id, title, contentType, brief, content: canvas },
        });
        setDraftId(res.id);
      }
      setDraftTitle(title);
      setCanvasOrigin(canvas);
      toast.success("Draft saved.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>No voice profile yet</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Tone writes in <em>your</em> voice, so it needs to learn it first.
              Paste a few samples once — never re-explain your brand again.
            </p>
            <Button
              style={{ background: "var(--brand)", color: "white" }}
              nativeButton={false}
            render={<a href="/onboarding" />}
            >
              Teach Tone your voice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rightPane = !focusMode && (
    <aside className="w-full shrink-0 border-t lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
      <div className="pane-pad sticky top-12 grid gap-5">
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Writing as
            </Label>
            <AccuracyRing value={profile.accuracy} size={34} />
          </div>
          <p className="mt-1 font-medium">{profile.name}</p>
          {profile.data.traits.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.data.traits.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>Format</Label>
          <Select
            value={contentType}
            items={Object.fromEntries(CONTENT_TYPES.map((t) => [t.id, t.label]))}
            onValueChange={(v) => v && setContentType(v as ContentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Brief</Label>
          <Textarea
            rows={4}
            placeholder="What should this piece say? Topic, angle, anything specific to include…"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>

        <Button
          onClick={() => void generate()}
          disabled={busy || !canEdit}
          style={{ background: "var(--brand)", color: "white" }}
        >
          <Sparkles className="size-4" />
          {busy ? "Writing in your voice…" : "Generate on-voice drafts"}
        </Button>
        {!canEdit && (
          <p className="text-xs text-muted-foreground">
            You have viewer access — ask an owner for editor rights to generate.
          </p>
        )}

        <div className="grid gap-4 rounded-lg border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Voice controls (live)
          </p>
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
                value={[sliders[key]]}
                max={100}
                step={5}
                disabled={!canEdit}
                onValueChange={(value) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  slidersTouched.current = true;
                  setSliders((s) => ({ ...s, [key]: v }));
                }}
              />
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label className="text-xs">Emphasize keywords</Label>
            <Input
              placeholder="comma, separated"
              value={keywords}
              disabled={!canEdit}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Changes re-shape the current output in place — no need to leave the
            page. Edit the profile itself under Voice profiles.
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Center canvas */}
      <section className="pane-pad min-w-0 flex-1">
        {canvas === null && variations.length === 0 && (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <div className="max-w-md text-center">
              <div
                className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Sparkles className="size-6" />
              </div>
              <h2 className="text-lg font-semibold">
                Tone already knows how {workspace.name} sounds.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                &quot;{profile.name}&quot; was trained on your writing
                {profile.sampleCount > 0 && ` (${profile.sampleCount} samples)`}.
                Pick a format, drop a brief in the panel, and get 3 drafts that
                sound like you — not like ChatGPT.
              </p>
            </div>
          </div>
        )}

        {canvas === null && variations.length > 0 && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Three takes, all in your voice{busy && " — reshaping…"}
              </h2>
            </div>
            <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-1 md:grid-cols-3">
              {variations.map((v) => (
                <Card key={v.id} className={busy ? "opacity-50 transition-opacity" : "transition-opacity"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{v.label}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="On-voice — good"
                          onClick={() => void sendFeedback("up")}
                        >
                          <ThumbsUp className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Off-voice"
                          onClick={() => void sendFeedback("down")}
                        >
                          <ThumbsDown className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                      {v.content}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCanvas(v.content);
                        setCanvasOrigin(v.content);
                      }}
                    >
                      Edit this one
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {canvas !== null && (
          <div className="mx-auto grid max-w-3xl gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {variations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCanvas(null)}>
                  <ArrowLeft className="size-4" /> Variations
                </Button>
              )}
              <Input
                className="h-8 max-w-60 text-sm"
                placeholder="Draft title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
              <div className="flex-1" />
              <Button variant="outline" size="sm" disabled={!!refining || !canEdit} onClick={() => void refine("regenerate")}>
                <RefreshCw className={`size-3.5 ${refining === "regenerate" ? "animate-spin" : ""}`} /> Regenerate
              </Button>
              <Button variant="outline" size="sm" disabled={!!refining || !canEdit} onClick={() => void refine("shorten")}>
                <Minimize2 className="size-3.5" /> Shorten
              </Button>
              <Button variant="outline" size="sm" disabled={!!refining || !canEdit} onClick={() => void refine("expand")}>
                <Maximize2 className="size-3.5" /> Expand
              </Button>
              <Button variant="outline" size="sm" disabled={!!refining || !canEdit} onClick={() => void refine("onbrand")}>
                <Wand2 className="size-3.5" /> More on-brand
              </Button>
            </div>

            <Tabs defaultValue="preview">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Good — and learn from my edits"
                    onClick={() => void sendFeedback("up", true)}
                  >
                    <ThumbsUp className="size-4" />
                    {canvas !== canvasOrigin ? "More like this" : ""}
                  </Button>
                  <Button variant="ghost" size="icon" title="Off-voice" onClick={() => void sendFeedback("down")}>
                    <ThumbsDown className="size-4" />
                  </Button>
                  <Button size="sm" disabled={!canEdit} onClick={() => void saveDraft()} style={{ background: "var(--brand)", color: "white" }}>
                    <Save className="size-4" /> Save draft
                  </Button>
                </div>
              </div>
              <TabsContent value="preview" className="mt-4">
                <FormatPreview contentType={contentType} content={canvas} brand={workspace.name} />
              </TabsContent>
              <TabsContent value="edit" className="mt-4">
                <Textarea
                  rows={16}
                  className="font-mono text-sm"
                  value={canvas}
                  onChange={(e) => setCanvas(e.target.value)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Edit freely, then hit 👍 &quot;More like this&quot; — your edits
                  become training signal for the profile.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>

      {rightPane}
    </div>
  );
}
