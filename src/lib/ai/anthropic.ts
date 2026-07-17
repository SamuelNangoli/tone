import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  GenerateRequest,
  RefineRequest,
  Variation,
} from "./types";
import { buildVoiceSystemPrompt, formatInstruction } from "./prompt";
import type { VoiceProfileData } from "@/lib/voice";

const MODEL = "claude-opus-4-8";

const VARIATION_LABELS = ["Direct", "Story-led", "Data-led"];

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client = new Anthropic();

  async generateVariations(req: GenerateRequest): Promise<Variation[]> {
    const count = Math.min(req.variationCount ?? 3, 3);
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: buildVoiceSystemPrompt(req.voice, req.overrides),
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              variations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["label", "content"],
                  additionalProperties: false,
                },
              },
            },
            required: ["variations"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            `Write ${count} distinct on-voice variations of the following piece. Each takes a different angle (e.g. ${VARIATION_LABELS.join(", ")}) but all stay strictly in the brand voice.`,
            ``,
            `Format: ${formatInstruction(req.contentType)}`,
            ``,
            `Brief: ${req.brief}`,
          ].join("\n"),
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      throw new Error("The AI provider declined this request.");
    }
    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as {
      variations: { label: string; content: string }[];
    };
    return parsed.variations.slice(0, count).map((v, i) => ({
      id: `v${i + 1}`,
      label: v.label || VARIATION_LABELS[i] || `Variation ${i + 1}`,
      content: v.content,
    }));
  }

  async refine(req: RefineRequest): Promise<string> {
    const instruction: Record<RefineRequest["action"], string> = {
      regenerate: "Rewrite this piece from scratch with a fresh angle, same brief, same voice.",
      shorten: "Shorten this piece by roughly a third. Keep the strongest lines. Same voice.",
      expand: "Expand this piece with more substance (examples, specifics). Same voice, no fluff.",
      onbrand:
        "Rewrite this to be MORE on-brand: push harder on the voice traits, do-words, and register defined in your instructions.",
    };
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: buildVoiceSystemPrompt(req.voice),
      messages: [
        {
          role: "user",
          content: [
            instruction[req.action],
            ``,
            `Format: ${formatInstruction(req.contentType)}`,
            `Brief: ${req.brief}`,
            ``,
            `Current text:`,
            req.text,
            ``,
            `Return only the rewritten piece, no commentary.`,
          ].join("\n"),
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      throw new Error("The AI provider declined this request.");
    }
    return response.content.find((b) => b.type === "text")?.text ?? req.text;
  }

  async extractTraits(
    samples: string[],
    data: VoiceProfileData
  ): Promise<string[]> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              traits: { type: "array", items: { type: "string" } },
            },
            required: ["traits"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            "Analyze these writing samples and produce 4-6 short voice trait descriptors (single words or two-word phrases, e.g. 'direct', 'dry humor', 'metaphor-heavy').",
            `Audience: ${data.audience || "unknown"}.`,
            ...samples.map((s, i) => `<sample ${i + 1}>\n${s.slice(0, 1500)}\n</sample>`),
          ].join("\n\n"),
        },
      ],
    });
    if (response.stop_reason === "refusal") return [];
    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    try {
      return (JSON.parse(text) as { traits: string[] }).traits.slice(0, 6);
    } catch {
      return [];
    }
  }
}
