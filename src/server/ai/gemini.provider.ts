import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "@/server/errors/AppError";
import type { AiProvider } from "./ai.provider";

/**
 * Creates a Gemini-backed AiProvider.
 * The API key is read at construction time so callers control when the key is
 * resolved (e.g. lazily, at first request — not at module evaluation time).
 */
export function createGeminiProvider(apiKey: string): AiProvider {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    async complete(prompt: string): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          // Force pure JSON output — no markdown fences, no prose
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  };
}

/**
 * Lazily-resolved singleton.
 * Not created at module evaluation time so a missing GEMINI_API_KEY does not
 * crash the process on startup — the error surfaces at the first request.
 */
let _instance: AiProvider | null = null;

export function getGeminiProvider(): AiProvider {
  if (!_instance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new AppError(
        "GEMINI_API_KEY environment variable is not set",
        500,
        "AI_MISCONFIGURED"
      );
    }
    _instance = createGeminiProvider(key);
  }
  return _instance;
}
