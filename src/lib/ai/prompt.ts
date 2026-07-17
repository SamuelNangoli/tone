import type { ContentType, VoiceProfileData } from "@/lib/voice";
import type { VoiceContext } from "./types";

const FORMAT_RULES: Record<ContentType, string> = {
  blog: "A blog post: compelling title on the first line, then well-structured body with '## ' subheadings. 400-700 words.",
  linkedin:
    "A LinkedIn post: strong hook in the first line, short paragraphs with line breaks, no hashtag spam (max 3 at the end). 80-200 words.",
  tweet:
    "A single tweet: max 280 characters, punchy, no hashtag spam (max 1), no emojis unless the voice is very casual.",
  email:
    "A marketing email: first line is 'Subject: <subject>', then a blank line, then the body. Short paragraphs, one clear call to action. 100-220 words.",
  landing:
    "Landing page copy as sections, each starting with '## <Section name>' (Hero, Problem, Solution, Social proof, CTA). Hero has a headline and subheadline. Keep each section tight.",
};

function mergedData(voice: VoiceContext, overrides?: Partial<VoiceProfileData>): VoiceProfileData {
  return {
    ...voice.data,
    ...overrides,
    sliders: { ...voice.data.sliders, ...(overrides?.sliders ?? {}) },
  };
}

function sliderWord(value: number, low: string, high: string): string {
  if (value <= 25) return `strongly ${low}`;
  if (value <= 45) return `leaning ${low}`;
  if (value < 55) return `balanced between ${low} and ${high}`;
  if (value < 75) return `leaning ${high}`;
  return `strongly ${high}`;
}

/** Builds the system prompt that conditions every generation on the brand voice. */
export function buildVoiceSystemPrompt(
  voice: VoiceContext,
  overrides?: Partial<VoiceProfileData>
): string {
  const d = mergedData(voice, overrides);
  const lines: string[] = [
    `You are the in-house writer for a ${voice.industry} brand. You write in the brand's own voice — never in a generic AI voice.`,
    ``,
    `## Brand voice profile: "${voice.profileName}"`,
    `- Register: ${sliderWord(d.sliders.formality, "formal", "casual")}.`,
    `- Stance: ${sliderWord(d.sliders.boldness, "careful", "bold")}.`,
    `- Depth: ${sliderWord(d.sliders.detail, "concise", "detailed")}.`,
  ];
  if (d.traits.length) lines.push(`- Voice traits: ${d.traits.join(", ")}.`);
  if (d.audience) lines.push(`- Audience: ${d.audience}.`);
  if (d.doWords.length)
    lines.push(`- Favor these words/phrases where natural: ${d.doWords.join(", ")}.`);
  if (d.dontWords.length)
    lines.push(`- Never use these words/phrases: ${d.dontWords.join(", ")}.`);
  if (d.competitors.length)
    lines.push(
      `- Do NOT sound like these competitors: ${d.competitors.join(", ")}. Avoid their tone and cliches.`
    );
  if (voice.samples.length) {
    lines.push(``, `## Writing samples in the brand voice (imitate style, not content):`);
    for (const s of voice.samples.slice(0, 5)) {
      lines.push(`<sample title="${s.title || "untitled"}">`);
      lines.push(s.content.slice(0, 2000));
      lines.push(`</sample>`);
    }
  }
  lines.push(
    ``,
    `Avoid generic AI tells: no "delve", "unlock", "game-changer", "in today's fast-paced world", no em-dash overuse, no bullet-point salad unless the format calls for it.`
  );
  return lines.join("\n");
}

export function formatInstruction(contentType: ContentType): string {
  return FORMAT_RULES[contentType];
}
