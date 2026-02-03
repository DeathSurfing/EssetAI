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
    shareMode: v.optional(v.union(v.literal("view"), v.literal("edit"))),
    version: v.optional(v.number()),
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

  // Collaborative sessions - tracks active users editing a prompt
  collaborativeSessions: defineTable({
    promptId: v.id("prompts"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
    cursor: v.optional(v.object({
      sectionIndex: v.number(),
      position: v.number(),
    })),
    isTyping: v.optional(v.boolean()),
  })
    .index("by_promptId", ["promptId"])
    .index("by_userId", ["userId"])
    .index("by_promptId_userId", ["promptId", "userId"]),

  // Collaborative edits - tracks changes made by users
  collaborativeEdits: defineTable({
    promptId: v.id("prompts"),
    userId: v.id("users"),
    sectionIndex: v.number(),
    operation: v.union(
      v.literal("insert"),
      v.literal("delete"),
      v.literal("replace")
    ),
    oldContent: v.optional(v.string()),
    newContent: v.optional(v.string()),
    position: v.optional(v.number()),
    length: v.optional(v.number()),
    timestamp: v.number(),
    version: v.number(),
  })
    .index("by_promptId", ["promptId"])
    .index("by_promptId_timestamp", ["promptId", "timestamp"])
    .index("by_promptId_version", ["promptId", "version"]),
});
