import { streamText } from "ai";
import { createOpenRouterClient } from "@/lib/openrouter";
import { z } from "zod";

const regenerateSectionSchema = z.object({
  sectionName: z.string(),
  sectionContent: z.string(),
  allSections: z.array(z.object({
    header: z.string(),
    content: z.string(),
  })),
  customInstructions: z.string(),
  businessContext: z.object({
    name: z.string(),
    location: z.string(),
  }),
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      sectionName, 
      sectionContent, 
      allSections, 
      customInstructions,
      businessContext 
    } = regenerateSectionSchema.parse(body);
    
    console.log("Regenerating section:", sectionName);
    console.log("Business:", businessContext.name, "| Location:", businessContext.location);
    console.log("Custom instructions:", customInstructions);
    
    const { client, model } = createOpenRouterClient();
    
    // Build context from all other sections
    const otherSectionsContext = allSections
      .filter(s => s.header !== sectionName)
      .map(s => `${s.header}\n${s.content}`)
      .join("\n\n");
    
    const systemPrompt = `You are a website prompt generator. Regenerate ONE section of an 8-section website prompt.

BUSINESS CONTEXT:
Name: ${businessContext.name}
Location: ${businessContext.location}

CURRENT FULL PROMPT (all sections):
${otherSectionsContext}

SECTION TO REGENERATE: ${sectionName}
CURRENT CONTENT:
${sectionContent}

USER CUSTOM INSTRUCTIONS:
${customInstructions}

RULES:
1. Regenerate ONLY the ${sectionName} section
2. Keep the same ALL CAPS header: ${sectionName}
3. Write 2-4 specific, actionable sentences
4. Maintain consistency with other sections
5. Never mention regeneration or previous versions
6. Never mention Google Maps or URLs
7. Don't make up awards or years in business
8. Output ONLY the section content (no header explanation)

Generate the new content for ${sectionName} now.`;

    console.log("Sending to model...");
    
    // Use streamText for streaming response
    const result = streamText({
      model: client(model),
      system: systemPrompt,
      prompt: `Regenerate the ${sectionName} section based on the custom instructions provided.`,
      temperature: 0.3,
      maxOutputTokens: 500,
    });

    // Return the stream response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in regenerate-section route:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to regenerate section";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
