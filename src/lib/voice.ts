// The Voice Profile is the product's core asset: a structured, editable
// object every generation is conditioned on. Stored as JSON text in the
// VoiceProfile.data column (SQLite/Postgres portable).

export type ToneSliders = {
  /** 0 = formal, 100 = casual */
  formality: number;
  /** 0 = careful, 100 = bold */
  boldness: number;
  /** 0 = concise, 100 = detailed */
  detail: number;
};

export type VoiceProfileData = {
  sliders: ToneSliders;
  doWords: string[];
  dontWords: string[];
  audience: string;
  competitors: string[];
  websiteUrl: string;
  /** Descriptors extracted from writing samples + quiz, e.g. "direct", "playful" */
  traits: string[];
};

export const DEFAULT_VOICE_DATA: VoiceProfileData = {
  sliders: { formality: 50, boldness: 50, detail: 50 },
  doWords: [],
  dontWords: [],
  audience: "",
  competitors: [],
  websiteUrl: "",
  traits: [],
};

export function parseVoiceData(raw: string): VoiceProfileData {
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_VOICE_DATA,
      ...parsed,
      sliders: { ...DEFAULT_VOICE_DATA.sliders, ...(parsed.sliders ?? {}) },
    };
  } catch {
    return DEFAULT_VOICE_DATA;
  }
}

/**
 * Voice accuracy is the retention hook: it starts modest and visibly climbs
 * as the profile accumulates samples and feedback. Deterministic so the
 * indicator is stable between page loads.
 */
export function computeAccuracy(opts: {
  sampleCount: number;
  feedbackCount: number;
  positiveFeedback: number;
  hasQuiz: boolean;
  hasWebsite: boolean;
}): number {
  let score = 40;
  score += Math.min(opts.sampleCount, 5) * 5; // up to +25 from samples
  if (opts.hasQuiz) score += 8;
  if (opts.hasWebsite) score += 4;
  // Feedback: diminishing returns, positive signals count a bit more.
  const fb = Math.min(opts.feedbackCount, 40);
  score += Math.min(18, fb * 0.6 + Math.min(opts.positiveFeedback, 20) * 0.3);
  return Math.min(97, Math.round(score));
}

export const CONTENT_TYPES = [
  { id: "blog", label: "Blog post" },
  { id: "linkedin", label: "LinkedIn post" },
  { id: "tweet", label: "Tweet" },
  { id: "email", label: "Email" },
  { id: "landing", label: "Landing copy" },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]["id"];
