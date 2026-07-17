// Single entry point for all AI calls. The model/provider is swappable:
// set ANTHROPIC_API_KEY to use Claude; otherwise the deterministic local
// mock keeps the whole product functional for development and demos.

import type { AIProvider } from "./types";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";

let provider: AIProvider | null = null;

export function getAI(): AIProvider {
  if (!provider) {
    provider = process.env.ANTHROPIC_API_KEY
      ? new AnthropicProvider()
      : new MockProvider();
  }
  return provider;
}

export * from "./types";
