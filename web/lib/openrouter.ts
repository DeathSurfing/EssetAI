import { createOpenAI } from "@ai-sdk/openai";

export function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-flash-1.5";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  const client = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return { client, model };
}
