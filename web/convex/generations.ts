import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const FREE_LIMIT = 5;
const NORMAL_LIMIT = 20;
const ANONYMOUS_LIMIT = 5;

export const checkGenerationQuota = query({
  args: {
    fingerprint: v.optional(v.string()),
    promptId: v.optional(v.id("prompts")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
        .first();

      if (!user) return { allowed: false, reason: "User not found" };

      // Check if user is a collaborator on this prompt
      let userToCheck = user;
      if (args.promptId) {
        const prompt = await ctx.db.get(args.promptId);
        if (prompt && prompt.userId !== user._id) {
          const isCollab = prompt.collaborators?.includes(user._id) || false;
          if (isCollab) {
            // User is collaborator - check owner's quota
            const owner = await ctx.db.get(prompt.userId);
            if (owner) {
              userToCheck = owner;
            }
          }
        }
      }

      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;

      // Check if period needs reset
      const needsReset = now - userToCheck.generationPeriodStart > oneMonth;
      const effectiveUsed = needsReset ? 0 : userToCheck.generationsUsedThisPeriod;

      const remaining = userToCheck.monthlyGenerationLimit - effectiveUsed;

      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        role: userToCheck.role,
        needsPeriodReset: needsReset,
        isCollaborator: userToCheck._id !== user._id,
        ownerId: userToCheck._id !== user._id ? userToCheck._id : undefined,
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
    promptId: v.optional(v.id("prompts")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();

    let userId: string | undefined = undefined;
    let ownerId: string | undefined = undefined;
    let isCollaborator = false;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
        .first();

      if (user) {
        userId = user._id;

        // Check if this is a collaborator using a prompt
        if (args.promptId) {
          const prompt = await ctx.db.get(args.promptId);
          if (prompt && prompt.userId !== user._id) {
            // User is a collaborator - use owner's credits
            const isCollab = prompt.collaborators?.includes(user._id) || false;
            if (isCollab) {
              ownerId = prompt.userId;
              isCollaborator = true;
              
              // Deduct from owner
              const owner = await ctx.db.get(prompt.userId);
              if (owner) {
                await ctx.db.patch(owner._id, {
                  generationsUsedThisPeriod: owner.generationsUsedThisPeriod + 1,
                  updatedAt: now,
                });
              }
            } else {
              // Deduct from self
              await ctx.db.patch(user._id, {
                generationsUsedThisPeriod: user.generationsUsedThisPeriod + 1,
                updatedAt: now,
              });
            }
          } else {
            // Not a collaborator or no prompt - deduct from self
            await ctx.db.patch(user._id, {
              generationsUsedThisPeriod: user.generationsUsedThisPeriod + 1,
              updatedAt: now,
            });
          }
        } else {
          // No prompt specified - deduct from self
          await ctx.db.patch(user._id, {
            generationsUsedThisPeriod: user.generationsUsedThisPeriod + 1,
            updatedAt: now,
          });
        }
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

    // Track the generation with owner info
    await ctx.db.insert("generations", {
      userId: userId as any,
      ownerId: ownerId as any,
      fingerprint: args.fingerprint || undefined,
      promptId: args.promptId,
      type: args.type,
      createdAt: now,
      isCollaborator: isCollaborator,
    });

    return { 
      success: true,
      chargedToOwner: isCollaborator,
      ownerId: ownerId,
    };
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
