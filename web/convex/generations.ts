import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const FREE_LIMIT = 5;
const NORMAL_LIMIT = 20;
const ANONYMOUS_LIMIT = 5;

export const checkGenerationQuota = query({
  args: {
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
        .first();

      if (!user) return { allowed: false, reason: "User not found" };

      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;

      // Check if period needs reset
      const needsReset = now - user.generationPeriodStart > oneMonth;
      const effectiveUsed = needsReset ? 0 : user.generationsUsedThisPeriod;

      const remaining = user.monthlyGenerationLimit - effectiveUsed;

      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        role: user.role,
        needsPeriodReset: needsReset,
      };
    } else {
      if (!args.fingerprint) {
        return { allowed: false, reason: "Fingerprint required" };
      }

      const fingerprint = args.fingerprint;
      const anonymous = await ctx.db
        .query("anonymousUsage")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprint", fingerprint))
        .first();

      const count = anonymous?.generationsCount || 0;
      const remaining = ANONYMOUS_LIMIT - count;

      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        role: "anonymous",
      };
    }
  },
});

export const trackGeneration = mutation({
  args: {
    type: v.union(v.literal("full"), v.literal("section")),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();

    await ctx.db.insert("generations", {
      userId: identity ? undefined : undefined,
      fingerprint: args.fingerprint || undefined,
      type: args.type,
      createdAt: now,
    });

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
        .first();

      if (user) {
        await ctx.db.patch(user._id, {
          generationsUsedThisPeriod: user.generationsUsedThisPeriod + 1,
          updatedAt: now,
        });
      }
    } else if (args.fingerprint) {
      const fingerprint = args.fingerprint;
      const anonymous = await ctx.db
        .query("anonymousUsage")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprint", fingerprint))
        .first();

      if (anonymous) {
        await ctx.db.patch(anonymous._id, {
          generationsCount: anonymous.generationsCount + 1,
          lastGenerationAt: now,
        });
      } else {
        await ctx.db.insert("anonymousUsage", {
          fingerprint: fingerprint,
          generationsCount: 1,
          firstGenerationAt: now,
          lastGenerationAt: now,
        });
      }
    }

    return { success: true };
  },
});

export const getAnonymousUsage = query({
  args: {
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const anonymous = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .first();

    if (!anonymous) {
      return {
        generationsCount: 0,
        remaining: ANONYMOUS_LIMIT,
      };
    }

    return {
      generationsCount: anonymous.generationsCount,
      remaining: Math.max(0, ANONYMOUS_LIMIT - anonymous.generationsCount),
    };
  },
});
