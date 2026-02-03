import { z } from "zod";

export const generatePromptSchema = z.object({
  googleMapsUrl: z.string().min(1, "Google Maps URL is required"),
  builder: z.enum(["lovable", "framer", "webflow"]).default("lovable"),
  parsedLocation: z.object({
    businessName: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    locality: z.string().nullable().optional(),
    urlType: z.enum(["short", "place", "search", "directions", "coordinates", "unknown"]).optional(),
    domainType: z.enum(["maps.google.com", "google.com/maps", "unknown"]).optional(),
    originalUrl: z.string().optional(),
    expandedUrl: z.string().nullable().optional(),
    isExpanded: z.boolean().optional(),
    extractionConfidence: z.enum(["high", "medium", "low"]).optional(),
    processingPriority: z.number().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    nominatimData: z.any().optional(),
    nominatimError: z.string().optional(),
  }).optional(),
});

export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;

export const REQUIRED_SECTIONS = [
  "PROJECT CONTEXT",
  "BUSINESS OVERVIEW",
  "TARGET AUDIENCE",
  "DESIGN DIRECTION",
  "SITE STRUCTURE",
  "CONTENT GUIDELINES",
  "PRIMARY CALL-TO-ACTION",
  "LOCATION CONTEXT",
] as const;

export type RequiredSection = (typeof REQUIRED_SECTIONS)[number];

export interface PromptQualityScore {
  score: number;
  maxScore: number;
  percentage: number;
  stars: number;
  feedback: string[];
  sectionsPresent: RequiredSection[];
  sectionsMissing: RequiredSection[];
}

export function calculateQualityScore(prompt: string): PromptQualityScore {
  const sectionsPresent: RequiredSection[] = [];
  const sectionsMissing: RequiredSection[] = [];
  
  for (const section of REQUIRED_SECTIONS) {
    if (prompt.includes(section)) {
      sectionsPresent.push(section);
    } else {
      sectionsMissing.push(section);
    }
  }
  
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 100;
  
  // Section presence (40 points)
  const sectionScore = (sectionsPresent.length / REQUIRED_SECTIONS.length) * 40;
  score += sectionScore;
  
  if (sectionsPresent.length === REQUIRED_SECTIONS.length) {
    feedback.push("All required sections present");
  } else {
    feedback.push(`${sectionsMissing.length} sections missing`);
  }
  
  // CTA clarity (15 points)
  const hasExplicitCta = /(?:call|contact|book|schedule|visit|order|buy|get|start)/i.test(prompt);
  if (hasExplicitCta) {
    score += 15;
    feedback.push("Strong CTA clarity");
  } else {
    feedback.push("CTA could be more explicit");
  }
  
  // Location specificity (15 points)
  const hasLocation = /(?:address|city|area|neighborhood|located|near)/i.test(prompt);
  if (hasLocation) {
    score += 15;
    feedback.push("Location context included");
  } else {
    feedback.push("Location context inferred, kept generic");
  }
  
  // Design direction (15 points)
  const hasDesignDirection = /(?:modern|minimal|professional|elegant|vibrant|clean|sophisticated|bold)/i.test(prompt);
  if (hasDesignDirection) {
    score += 15;
    feedback.push("Design direction clearly defined");
  } else {
    feedback.push("Design direction could be more specific");
  }
  
  // Conciseness (15 points)
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 50 && wordCount < 500) {
    score += 15;
    feedback.push("Concise, focused language");
  } else if (wordCount >= 500) {
    score += 5;
    feedback.push("Content slightly verbose");
  } else {
    score += 10;
    feedback.push("Content could be more detailed");
  }
  
  const percentage = Math.round((score / maxScore) * 100);
  const stars = Math.round((percentage / 100) * 5);
  
  return {
    score: Math.round(score),
    maxScore,
    percentage,
    stars: Math.max(1, Math.min(5, stars)),
    feedback,
    sectionsPresent,
    sectionsMissing,
  };
}
