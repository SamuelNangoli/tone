// Deterministic local provider so the entire product works without an API
// key. It reads the same voice profile the real provider does — sliders,
// do/don't words, traits — so the "live voice controls" behavior is
// demonstrable end to end.

import type { ContentType, VoiceProfileData } from "@/lib/voice";
import type {
  AIProvider,
  GenerateRequest,
  RefineRequest,
  Variation,
  VoiceContext,
} from "./types";

function merged(voice: VoiceContext, overrides?: Partial<VoiceProfileData>): VoiceProfileData {
  return {
    ...voice.data,
    ...overrides,
    sliders: { ...voice.data.sliders, ...(overrides?.sliders ?? {}) },
  };
}

type Lexicon = {
  opener: string;
  connector: string;
  verb: string;
  closer: string;
  cta: string;
};

function lexicon(d: VoiceProfileData): Lexicon {
  const casual = d.sliders.formality >= 55;
  const bold = d.sliders.boldness >= 55;
  return {
    opener: bold
      ? casual
        ? "Let's be honest:"
        : "The uncomfortable truth:"
      : casual
        ? "Here's something we keep hearing:"
        : "A pattern worth examining:",
    connector: casual ? "And here's the thing —" : "More importantly,",
    verb: bold ? "cuts" : "reduces",
    closer: bold
      ? "The teams that fix this first will out-ship everyone else."
      : "Teams that address this early see compounding returns.",
    cta: casual ? "See it in action" : "Request a walkthrough",
  };
}

function sprinkle(text: string, d: VoiceProfileData): string {
  let out = text;
  // Respect don't-words by stripping them; weave one do-word into the close.
  for (const w of d.dontWords) {
    if (!w.trim()) continue;
    out = out.replace(new RegExp(`\\b${w.trim()}\\b`, "gi"), "").replace(/  +/g, " ");
  }
  const doWord = d.doWords.find((w) => w.trim());
  if (doWord && !out.toLowerCase().includes(doWord.toLowerCase())) {
    out = out.replace(/\.\s*$/, `. ${capitalize(doWord)} is the point.`);
  }
  return out;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function topicFrom(brief: string): string {
  const t = brief.trim().replace(/\.$/, "");
  return t.length > 90 ? t.slice(0, 90) + "…" : t || "your topic";
}

function body(
  contentType: ContentType,
  brief: string,
  d: VoiceProfileData,
  angle: number,
  audience: string
): string {
  const lex = lexicon(d);
  const topic = topicFrom(brief);
  const aud = audience || "your buyers";
  const detailed = d.sliders.detail >= 55;

  const angles = [
    {
      hook: `${lex.opener} most teams get "${topic}" backwards.`,
      point: `They optimize the visible part and ignore the part ${aud} actually feel.`,
    },
    {
      hook: `Last quarter, a customer told us their take on ${topic}. It stuck with us.`,
      point: `"We didn't need more features. We needed fewer decisions." That reframed how we think about it.`,
    },
    {
      hook: `We pulled the numbers on ${topic} across our customer base.`,
      point: `The gap between the top quartile and everyone else wasn't budget or headcount — it was iteration speed.`,
    },
  ];
  const a = angles[angle % angles.length];

  switch (contentType) {
    case "tweet":
      return sprinkle(`${a.hook} ${a.point} ${lex.closer}`.slice(0, 270), d);

    case "linkedin":
      return sprinkle(
        [
          a.hook,
          ``,
          a.point,
          ``,
          `${lex.connector} this ${lex.verb} the busywork nobody signed up for. ${
            detailed
              ? `We've watched it play out across onboarding, activation, and expansion — same pattern every time.`
              : ``
          }`,
          ``,
          lex.closer,
        ]
          .join("\n")
          .replace(/\n{3,}/g, "\n\n"),
        d
      );

    case "email":
      return sprinkle(
        [
          `Subject: ${capitalize(topic)} — a 3-minute read that pays for itself`,
          ``,
          `Hi there,`,
          ``,
          a.hook,
          ``,
          `${a.point} ${lex.connector} it ${lex.verb} the time your team spends on rework${
            detailed ? ` — the kind that never shows up in a dashboard but everyone feels by Friday` : ``
          }.`,
          ``,
          `${lex.closer}`,
          ``,
          `${lex.cta} → just reply to this email.`,
          ``,
          `— The team`,
        ].join("\n"),
        d
      );

    case "landing":
      return sprinkle(
        [
          `## Hero`,
          `${capitalize(topic)}, without the busywork.`,
          `The platform ${aud} actually enjoy using — built for outcomes, not checkboxes.`,
          ``,
          `## Problem`,
          `${a.hook} ${a.point}`,
          ``,
          `## Solution`,
          `One workspace that ${lex.verb} rework, keeps context in one place, and turns handoffs into non-events.${
            detailed ? ` Setup takes minutes, not a quarter-long rollout.` : ``
          }`,
          ``,
          `## Social proof`,
          `"We stopped arguing about process and started shipping." — VP Operations, mid-market SaaS`,
          ``,
          `## CTA`,
          `${lex.cta} — free for 14 days, no card required.`,
        ].join("\n"),
        d
      );

    case "blog":
    default:
      return sprinkle(
        [
          `${capitalize(topic)}: what the best teams do differently`,
          ``,
          a.hook + ` ` + a.point,
          ``,
          `## Why this keeps happening`,
          `Most advice on ${topic} is written for a team that doesn't exist — infinite time, one stakeholder, no legacy decisions. Real teams inherit constraints. The question isn't "what's ideal", it's "what's the highest-leverage change we can make this quarter."`,
          ``,
          `## The pattern that works`,
          `${capitalize(lex.connector.replace(/—$/, "").trim())} the teams that win treat this as a system, not a project. They pick one metric that ${aud} feel directly, instrument it, and ${lex.verb} everything that doesn't move it.${
            detailed
              ? `\n\nIn practice that looks like: a weekly review that takes 20 minutes, one owner per metric, and a standing rule that anything unmeasured is a hypothesis, not a fact.`
              : ``
          }`,
          ``,
          `## Where to start`,
          `Pick the smallest slice of ${topic} you can change this week. Ship it, measure it, then decide. ${lex.closer}`,
        ].join("\n"),
        d
      );
  }
}

const LABELS = ["Direct", "Story-led", "Data-led"];

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async generateVariations(req: GenerateRequest): Promise<Variation[]> {
    const d = merged(req.voice, req.overrides);
    const count = Math.min(req.variationCount ?? 3, 3);
    return Array.from({ length: count }, (_, i) => ({
      id: `v${i + 1}`,
      label: LABELS[i],
      content: body(req.contentType, req.brief, d, i, d.audience),
    }));
  }

  async refine(req: RefineRequest): Promise<string> {
    const d = req.voice.data;
    switch (req.action) {
      case "shorten": {
        const lines = req.text.split("\n");
        const kept = lines.filter(
          (l, i) => l.startsWith("##") || l.startsWith("Subject:") || i < 2 || l === "" || Math.random() < 0.7
        );
        const shortened = kept
          .map((l) =>
            l.length > 160 && !l.startsWith("##")
              ? l.split(". ").slice(0, Math.max(1, Math.ceil(l.split(". ").length / 2))).join(". ").replace(/\.?$/, ".")
              : l
          )
          .join("\n")
          .replace(/\n{3,}/g, "\n\n");
        return shortened;
      }
      case "expand":
        return (
          req.text +
          `\n\nOne more thing worth naming: the cost of waiting. Every week this stays unsolved, the workaround calcifies a little more — and workarounds are the most expensive process you'll never see on an invoice.`
        );
      case "onbrand": {
        const doWord = d.doWords.find((w) => w.trim());
        const trait = d.traits[0];
        let out = req.text;
        if (trait && !out.includes("(")) {
          out = out.replace(/\.\s*\n/, `. (Yes, we're ${trait} about this.)\n`);
        }
        if (doWord && !out.toLowerCase().includes(doWord.toLowerCase())) {
          out += `\n\n${capitalize(doWord)} — that's the standard we hold ourselves to.`;
        }
        return out;
      }
      case "regenerate":
      default:
        return body(
          req.contentType,
          req.brief,
          merged(req.voice),
          Math.floor(Math.random() * 3),
          d.audience
        );
    }
  }

  async extractTraits(samples: string[], data: VoiceProfileData): Promise<string[]> {
    const traits: string[] = [];
    const text = samples.join(" ").toLowerCase();
    if (data.sliders.formality >= 55) traits.push("conversational");
    else traits.push("polished");
    if (data.sliders.boldness >= 55) traits.push("opinionated");
    else traits.push("measured");
    if (data.sliders.detail >= 55) traits.push("substantive");
    else traits.push("punchy");
    if (text.includes("?")) traits.push("question-led");
    if (/\d/.test(text)) traits.push("data-grounded");
    if (text.includes("we ") || text.includes("our ")) traits.push("first-person plural");
    return traits.slice(0, 6);
  }
}
