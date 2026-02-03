import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    workosId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.union(
      v.literal("free"),
      v.literal("normal"),
      v.literal("paid"),
      v.literal("admin")
    ),
    generationsUsedThisPeriod: v.number(),
    generationPeriodStart: v.number(),
    monthlyGenerationLimit: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workosId", ["workosId"])
    .index("by_email", ["email"]),

  prompts: defineTable({
    userId: v.id("users"),
    placeName: v.string(),
    url: v.string(),
    sections: v.array(v.object({
      header: v.string(),
      content: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.optional(v.boolean()),
    shareToken: v.optional(v.string()),
    collaborators: v.optional(v.array(v.id("users"))),
  })
    .index("by_userId", ["userId"])
    .index("by_shareToken", ["shareToken"]),

  generations: defineTable({
    userId: v.optional(v.id("users")),
    fingerprint: v.optional(v.string()),
    promptId: v.optional(v.id("prompts")),
    createdAt: v.number(),
    type: v.union(
      v.literal("full"),
      v.literal("section")
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_fingerprint", ["fingerprint"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  anonymousUsage: defineTable({
    fingerprint: v.string(),
    generationsCount: v.number(),
    firstGenerationAt: v.number(),
    lastGenerationAt: v.number(),
  })
    .index("by_fingerprint", ["fingerprint"]),
});
