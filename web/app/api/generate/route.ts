import { streamText } from "ai";
import { createOpenRouterClient } from "@/lib/openrouter";
import { parseGoogleMapsUrl, formatLocationContext } from "@/lib/location-parser";
import { generatePromptSchema } from "@/lib/prompt-quality";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { googleMapsUrl, parsedLocation: clientParsedLocation } = generatePromptSchema.parse(body);
    
    // Use client-parsed location if available, otherwise parse on server
    let location;
    if (clientParsedLocation) {
      // Normalize undefined values to ensure type compatibility
      location = {
        ...clientParsedLocation,
        businessName: clientParsedLocation.businessName ?? null,
        area: clientParsedLocation.area ?? null,
        city: clientParsedLocation.city ?? null,
        locality: clientParsedLocation.locality ?? null,
        urlType: clientParsedLocation.urlType ?? 'unknown',
        domainType: clientParsedLocation.domainType ?? 'unknown',
        originalUrl: clientParsedLocation.originalUrl ?? googleMapsUrl,
        expandedUrl: clientParsedLocation.expandedUrl ?? null,
        isExpanded: clientParsedLocation.isExpanded ?? false,
        extractionConfidence: clientParsedLocation.extractionConfidence ?? 'low',
        processingPriority: clientParsedLocation.processingPriority ?? 3,
      };
      console.log("Using client-parsed location:", location);
    } else {
      location = await parseGoogleMapsUrl(googleMapsUrl);
      console.log("Server-parsed location:", location);
    }
    
    const { client, model } = createOpenRouterClient();
    console.log("Using model:", model);
    
    // Build location context using enriched data
    const locationContext = formatLocationContext(location);
    const businessName = location.businessName || "Local Business";
    
    console.log("Business:", businessName, "| Location Context:", locationContext.substring(0, 100) + "...");
    
    // Enhanced prompt with URL type awareness and Nominatim data
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
- Low confidence: Focus on general business type

${locationContext}

Business Name: ${businessName}`;

    const userPrompt = `Generate a website prompt for ${businessName}. Create all 8 sections now.`;
    
    console.log("Sending to model...");
    
    // Use streamText for streaming response
    const result = streamText({
      model: client(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      maxOutputTokens: 1500,
      onError: (error) => {
        console.error("Streaming error:", error);
      },
    });

    // Return the stream response with explicit headers for production
    const response = result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
    
    return response;
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
