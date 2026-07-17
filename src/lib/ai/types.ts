import type { ContentType, VoiceProfileData } from "@/lib/voice";

export type VoiceContext = {
  profileName: string;
  industry: string;
  data: VoiceProfileData;
  /** Up to ~5 writing samples the profile was trained on. */
  samples: { title: string; content: string }[];
};

export type GenerateRequest = {
  voice: VoiceContext;
  contentType: ContentType;
  brief: string;
  /** Live overrides from the right-hand voice controls (optional). */
  overrides?: Partial<VoiceProfileData>;
  variationCount?: number;
};

export type Variation = {
  id: string;
  label: string;
  content: string;
};

export type RefineAction = "regenerate" | "shorten" | "expand" | "onbrand";

export type RefineRequest = {
  voice: VoiceContext;
  contentType: ContentType;
  brief: string;
  text: string;
  action: RefineAction;
};

export interface AIProvider {
  readonly name: string;
  generateVariations(req: GenerateRequest): Promise<Variation[]>;
  refine(req: RefineRequest): Promise<string>;
  /** Distills writing samples + quiz answers into voice trait descriptors. */
  extractTraits(samples: string[], data: VoiceProfileData): Promise<string[]>;
}
