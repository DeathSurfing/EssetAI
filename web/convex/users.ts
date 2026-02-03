import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

const ANONYMOUS_LIMIT = 5;

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return null;

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    // Check if period needs reset - just calculate effective values, don't mutate
    const needsReset = now - user.generationPeriodStart > oneMonth;
    const effectiveUsed = needsReset ? 0 : user.generationsUsedThisPeriod;
    const effectivePeriodStart = needsReset ? now : user.generationPeriodStart;

    const remaining = user.monthlyGenerationLimit - effectiveUsed;

    return {
      ...user,
      generationsRemaining: Math.max(0, remaining),
      needsPeriodReset: needsReset,
      effectivePeriodStart,
    };
  },
});

export const syncUserFromWorkOS = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", args.workosId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatar: args.avatar,
        updatedAt: now,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      workosId: args.workosId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: "free",
      generationsUsedThisPeriod: 0,
      generationPeriodStart: now,
      monthlyGenerationLimit: ANONYMOUS_LIMIT,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const upgradeUserRole = mutation({
  args: {
    role: v.union(
      v.literal("free"),
      v.literal("normal"),
      v.literal("paid"),
      v.literal("admin")
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

    const limits: Record<string, number> = {
      free: 5,
      normal: 20,
      paid: 100,
      admin: 999999,
    };

    await ctx.db.patch(user._id, {
      role: args.role,
      monthlyGenerationLimit: limits[args.role],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getUserStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return null;

    const promptCount = await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect()
      .then((prompts) => prompts.length);

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    
    // Calculate effective values based on period
    const needsReset = now - user.generationPeriodStart > oneMonth;
    const effectiveUsed = needsReset ? 0 : user.generationsUsedThisPeriod;

    const recentGenerations = await ctx.db
      .query("generations")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", user._id).gt("createdAt", needsReset ? now - oneMonth : user.generationPeriodStart)
      )
      .collect()
      .then((gens) => gens.length);

    return {
      role: user.role,
      generationsUsed: recentGenerations,
      generationsRemaining: Math.max(0, user.monthlyGenerationLimit - effectiveUsed),
      monthlyLimit: user.monthlyGenerationLimit,
      promptCount,
      needsPeriodReset: needsReset,
    };
  },
});

// Reset generation period - call this when user generates after period expires
export const resetGenerationPeriod = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    if (now - user.generationPeriodStart > oneMonth) {
      await ctx.db.patch(user._id, {
        generationsUsedThisPeriod: 0,
        generationPeriodStart: now,
        updatedAt: now,
      });
      return { reset: true, newPeriodStart: now };
    }

    return { reset: false };
  },
});
