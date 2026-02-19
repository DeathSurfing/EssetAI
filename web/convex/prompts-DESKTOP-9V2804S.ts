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
    const isCollaborator = user && prompt.collaborators?.includes(user._id);
    const isPublic = prompt.isPublic || prompt.shareToken;
    const hasAccess = isOwner || isCollaborator || isPublic;

    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    // Get owner info for collaborators
    let ownerInfo = null;
    if (!isOwner) {
      const owner = await ctx.db.get(prompt.userId);
      ownerInfo = {
        name: owner?.name || owner?.email || "Unknown",
        email: owner?.email,
        avatar: owner?.avatar,
      };
    }

    return {
      ...prompt,
      isOwner,
      isCollaborator: !!isCollaborator,
      ownerInfo,
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

// Get prompts where user is a collaborator (shared with me)
export const getSharedPrompts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return [];

    // Get all prompts where user is in collaborators array
    const allPrompts = await ctx.db.query("prompts").collect();
    
    const sharedPrompts = allPrompts.filter((prompt) => 
      prompt.collaborators?.includes(user._id)
    );

    // Enrich with owner info
    const enriched = await Promise.all(
      sharedPrompts.map(async (prompt) => {
        const owner = await ctx.db.get(prompt.userId);
        return {
          ...prompt,
          ownerName: owner?.name || owner?.email || "Unknown",
          ownerAvatar: owner?.avatar,
        };
      })
    );

    return enriched;
  },
});

// Update prompt sections (for both owners and collaborators)
export const updatePromptSections = mutation({
  args: {
    promptId: v.id("prompts"),
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

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) throw new Error("Prompt not found");

    // Check permissions - owner OR collaborator can edit
    const isOwner = prompt.userId === user._id;
    const isCollaborator = prompt.collaborators?.includes(user._id);
    const canEdit = isOwner || isCollaborator || (prompt.isPublic && prompt.shareMode === "edit");

    if (!canEdit) throw new Error("Edit permission denied");

    const now = Date.now();

    // Update the prompt sections
    await ctx.db.patch(args.promptId, {
      sections: args.sections,
      updatedAt: now,
      version: (prompt.version || 0) + 1,
    });

    return { success: true, updatedAt: now };
  },
});
