import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// Join a collaborative editing session
export const joinSession = mutation({
  args: {
    promptId: v.id("prompts"),
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

    // Check if user has access
    const isOwner = prompt.userId === user._id;
    const isCollaborator = prompt.collaborators?.includes(user._id);
    const hasAccess = isOwner || isCollaborator || prompt.isPublic;

    if (!hasAccess) throw new Error("Access denied");

    const now = Date.now();

    // Check if already in session
    const existing = await ctx.db
      .query("collaborativeSessions")
      .withIndex("by_promptId_userId", (q) =>
        q.eq("promptId", args.promptId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      // Update last active
      await ctx.db.patch(existing._id, {
        lastActiveAt: now,
      });
      return { sessionId: existing._id };
    }

    // Create new session
    const sessionId = await ctx.db.insert("collaborativeSessions", {
      promptId: args.promptId,
      userId: user._id,
      joinedAt: now,
      lastActiveAt: now,
    });

    return { sessionId };
  },
});

// Leave a collaborative session
export const leaveSession = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return;

    const session = await ctx.db
      .query("collaborativeSessions")
      .withIndex("by_promptId_userId", (q) =>
        q.eq("promptId", args.promptId).eq("userId", user._id)
      )
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Get active collaborators in a prompt
export const getActiveCollaborators = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    const sessions = await ctx.db
      .query("collaborativeSessions")
      .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
      .collect();

    // Filter out inactive users and get user details
    const activeSessions = sessions.filter(
      (s) => now - s.lastActiveAt < timeout
    );

    const collaborators = await Promise.all(
      activeSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          userId: session.userId,
          name: user?.name || user?.email || "Anonymous",
          avatar: user?.avatar,
          cursor: session.cursor,
          isTyping: session.isTyping,
          joinedAt: session.joinedAt,
        };
      })
    );

    return collaborators;
  },
});

// Update cursor position
export const updateCursor = mutation({
  args: {
    promptId: v.id("prompts"),
    sectionIndex: v.number(),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return;

    const session = await ctx.db
      .query("collaborativeSessions")
      .withIndex("by_promptId_userId", (q) =>
        q.eq("promptId", args.promptId).eq("userId", user._id)
      )
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        cursor: { sectionIndex: args.sectionIndex, position: args.position },
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Set typing status
export const setTypingStatus = mutation({
  args: {
    promptId: v.id("prompts"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return;

    const session = await ctx.db
      .query("collaborativeSessions")
      .withIndex("by_promptId_userId", (q) =>
        q.eq("promptId", args.promptId).eq("userId", user._id)
      )
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isTyping: args.isTyping,
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Apply a collaborative edit
export const applyEdit = mutation({
  args: {
    promptId: v.id("prompts"),
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

    // Check edit permissions
    const isOwner = prompt.userId === user._id;
    const isCollaborator = prompt.collaborators?.includes(user._id);
    const canEdit =
      isOwner ||
      isCollaborator ||
      (prompt.isPublic && prompt.shareMode === "edit");

    if (!canEdit) throw new Error("Edit permission denied");

    const now = Date.now();
    const newVersion = (prompt.version || 0) + 1;

    // Record the edit
    await ctx.db.insert("collaborativeEdits", {
      promptId: args.promptId,
      userId: user._id,
      sectionIndex: args.sectionIndex,
      operation: args.operation,
      oldContent: args.oldContent,
      newContent: args.newContent,
      position: args.position,
      length: args.length,
      timestamp: now,
      version: newVersion,
    });

    // Update the prompt sections
    const updatedSections = [...prompt.sections];
    if (args.operation === "replace" && args.newContent) {
      updatedSections[args.sectionIndex] = {
        ...updatedSections[args.sectionIndex],
        content: args.newContent,
      };
    }

    // Update prompt
    await ctx.db.patch(args.promptId, {
      sections: updatedSections,
      version: newVersion,
      updatedAt: now,
    });

    return { version: newVersion };
  },
});

// Get edit history
export const getEditHistory = query({
  args: {
    promptId: v.id("prompts"),
    limit: v.optional(v.number()),
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

    // Check access
    const isOwner = prompt.userId === user._id;
    const isCollaborator = prompt.collaborators?.includes(user._id);
    const hasAccess = isOwner || isCollaborator || prompt.isPublic;

    if (!hasAccess) throw new Error("Access denied");

    const edits = await ctx.db
      .query("collaborativeEdits")
      .withIndex("by_promptId_timestamp", (q) =>
        q.eq("promptId", args.promptId)
      )
      .order("desc")
      .take(args.limit || 50);

    // Enrich with user info
    const enrichedEdits = await Promise.all(
      edits.map(async (edit) => {
        const editUser = await ctx.db.get(edit.userId);
        return {
          ...edit,
          userName: editUser?.name || editUser?.email || "Unknown",
          userAvatar: editUser?.avatar,
        };
      })
    );

    return enrichedEdits;
  },
});
