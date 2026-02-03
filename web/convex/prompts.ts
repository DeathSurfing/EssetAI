import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getMyPrompts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
  },
});

export const getPrompt = query({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const prompt = await ctx.db.get(args.id);

    if (!prompt) return null;

    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
          .first()
      : null;

    const isOwner = user && prompt.userId === user._id;
    const isPublic = prompt.isPublic || prompt.shareToken;

    if (!isOwner && !isPublic) {
      throw new Error("Unauthorized");
    }

    return {
      ...prompt,
      isOwner,
    };
  },
});

export const createPrompt = mutation({
  args: {
    placeName: v.string(),
    url: v.string(),
    sections: v.array(
      v.object({
        header: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    return await ctx.db.insert("prompts", {
      userId: user._id,
      placeName: args.placeName,
      url: args.url,
      sections: args.sections,
      createdAt: now,
      updatedAt: now,
      isPublic: false,
    });
  },
});

export const migratePrompts = mutation({
  args: {
    prompts: v.array(
      v.object({
        placeName: v.string(),
        url: v.string(),
        sections: v.array(
          v.object({
            header: v.string(),
            content: v.string(),
          })
        ),
        createdAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const migratedIds = [];

    for (const prompt of args.prompts) {
      const id = await ctx.db.insert("prompts", {
        userId: user._id,
        placeName: prompt.placeName,
        url: prompt.url,
        sections: prompt.sections,
        createdAt: prompt.createdAt || now,
        updatedAt: now,
        isPublic: false,
      });
      migratedIds.push(id);
    }

    return { migratedCount: migratedIds.length, ids: migratedIds };
  },
});

export const deletePrompt = mutation({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const prompt = await ctx.db.get(args.id);
    if (!prompt || prompt.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const createShareLink = mutation({
  args: {
    promptId: v.id("prompts"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    if (user.role === "free") {
      throw new Error("Sharing not available on free tier");
    }

    const shareToken = args.isPublic ? `public-${crypto.randomUUID()}` : undefined;

    await ctx.db.patch(args.promptId, {
      isPublic: args.isPublic,
      shareToken,
      updatedAt: Date.now(),
    });

    return { shareToken };
  },
});

export const getPublicPrompt = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!prompt || !prompt.isPublic) {
      return null;
    }

    return prompt;
  },
});
