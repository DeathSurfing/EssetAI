import { streamText } from "ai";
import { createOpenRouterClient } from "@/lib/openrouter";
import { parseGoogleMapsUrl } from "@/lib/location-parser";
import { generatePromptSchema } from "@/lib/prompt-quality";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleMapsUrl } = generatePromptSchema.parse(body);
    
    const location = parseGoogleMapsUrl(googleMapsUrl);
    
    const { client, model } = createOpenRouterClient();
    
    const systemPrompt = `You are an expert website prompt engineer. Your task is to generate a complete, structured website generation prompt that follows an exact format.

CONTEXT FROM USER INPUT:
- Business Name: ${location.businessName || "Not specified"}
- Area/Neighborhood: ${location.area || "Not specified"}
- City: ${location.city || "Not specified"}

STRICT OUTPUT FORMAT REQUIREMENTS:
You MUST format your response with exactly 8 section headers. Each section header must be on its own line in ALL CAPS with NO markdown formatting (no #, no **, no bold). The headers must appear exactly as written below:

PROJECT CONTEXT
BUSINESS OVERVIEW
TARGET AUDIENCE
DESIGN DIRECTION
SITE STRUCTURE
CONTENT GUIDELINES
PRIMARY CALL-TO-ACTION
LOCATION CONTEXT

CRITICAL RULES:
1. Each section MUST start with its header in ALL CAPS on its own line
2. Never use markdown headers (# or ##) - write headers as plain text
3. Infer business type from the name (e.g., "cafe", "salon", "gym", "restaurant", "plumber")
4. Never mention Google Maps or how you inferred information
5. Never fabricate specific factual claims (awards, years, certifications)
6. Keep each section to 2-4 concise sentences
7. Output ONLY the structured prompt - no explanations, no reasoning, no intro text

EXAMPLE FORMAT:
PROJECT CONTEXT
Create a professional website for a local business. The site should establish credibility and drive customer engagement.

BUSINESS OVERVIEW
[content here...]

Write confidently and professionally. If specific details are unknown, keep content generic but compelling.`;

    const result = streamText({
      model: client(model),
      system: systemPrompt,
      prompt: `Generate a complete website prompt for a business located at the provided URL. The business type should be inferred from the name and location context.`,
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generate route:", error);
    
    if (error instanceof Error && error.message === "OPENROUTER_API_KEY is required") {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Failed to generate prompt" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
