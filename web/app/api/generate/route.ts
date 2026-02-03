import { streamText } from "ai";
import { createOpenRouterClient } from "@/lib/openrouter";
import { parseGoogleMapsUrl } from "@/lib/location-parser";
import { generatePromptSchema } from "@/lib/prompt-quality";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleMapsUrl, parsedLocation: clientParsedLocation } = generatePromptSchema.parse(body);
    
    // Use client-parsed location if available, otherwise parse on server
    let location;
    if (clientParsedLocation) {
      location = clientParsedLocation;
      console.log("Using client-parsed location:", location);
    } else {
      location = await parseGoogleMapsUrl(googleMapsUrl);
      console.log("Server-parsed location:", location);
    }
    
    const { client, model } = createOpenRouterClient();
    console.log("Using model:", model);
    
// Build context string
    const businessName = location.businessName || "Local Business";
    const locationStr = location.locality || location.city || location.area || "Unknown location";
    
    // Additional context for better prompts
    const urlTypeContext = location.urlType && location.urlType !== 'unknown' ? 
      ` (URL type: ${location.urlType})` : '';
    const domainContext = location.domainType && location.domainType !== 'unknown' ? 
      ` (source: ${location.domainType})` : '';
    const confidenceContext = location.extractionConfidence ? 
      ` (confidence: ${location.extractionConfidence})` : '';
    
    console.log("Business:", businessName, "| Location:", locationStr, "| URL Type:", location.urlType, "| Domain:", location.domainType);
    
// Enhanced prompt with URL type awareness
    const systemPrompt = `You are a website prompt generator. Create structured website prompts.

Generate a complete website generation prompt with these 8 sections:

PROJECT CONTEXT
BUSINESS OVERVIEW
TARGET AUDIENCE
DESIGN DIRECTION
SITE STRUCTURE
CONTENT GUIDELINES
PRIMARY CALL-TO-ACTION
LOCATION CONTEXT

Instructions:
- Use ALL CAPS for section headers
- Write 2-4 sentences per section
- Be specific and actionable
- Infer business type from the name
- Never mention Google Maps or URLs
- Never make up awards or years in business
- Adjust content specificity based on data confidence
- High confidence: Use specific details
- Medium confidence: Include some specifics but note limitations
- Low confidence: Focus on general business type${urlTypeContext}${domainContext}${confidenceContext}

Business: ${businessName}
Location: ${locationStr}
Data Source: ${location.domainType || 'Unknown'}
Extraction Confidence: ${location.extractionConfidence || 'Unknown'}`;

    const userPrompt = `Generate a website prompt for ${businessName} in ${locationStr}. Create all 8 sections now.`;
    
    console.log("Sending to model...");
    
    // Use streamText for streaming response
    const result = streamText({
      model: client(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    // Return the stream response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in generate route:", error);
    
    if (error instanceof Error && error.message === "OPENROUTER_API_KEY is required") {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to generate prompt";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
