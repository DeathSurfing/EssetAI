import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { toast } from "sonner";

// Generate a unique invite token
const generateInviteToken = () => {
  return `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Create a collaboration invite
export const createInvite = mutation({
  args: {
    promptId: v.id("prompts"),
    email: v.optional(v.string()),
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

    // Only owner can invite collaborators
    if (prompt.userId !== user._id) {
      throw new Error("Only the owner can invite collaborators");
    }

    // Check if user has reached collaborator limit based on their tier
    const currentCollaborators = prompt.collaborators?.length || 0;
    const maxCollaborators = {
      free: 0, // Free users can't have collaborators
      normal: 3,
      paid: 10,
      admin: 50,
    };

    const userTier = user.role;
    const maxAllowed = maxCollaborators[userTier as keyof typeof maxCollaborators] || 0;

    if (currentCollaborators >= maxAllowed) {
      throw new Error(
        `Your ${userTier} plan allows ${maxAllowed} collaborators. Upgrade to add more.`
      );
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days expiry

    const inviteToken = generateInviteToken();

    const inviteId = await ctx.db.insert("collaborationInvites", {
      promptId: args.promptId,
      ownerId: prompt.userId,
      inviteToken,
      email: args.email || undefined,
      invitedBy: user._id,
      createdAt: now,
      expiresAt,
      status: "pending",
    });

    return {
      inviteId,
      inviteToken,
      expiresAt,
    };
  },
});

// Accept a collaboration invite
export const acceptInvite = mutation({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Find the invite
    const invite = await ctx.db
      .query("collaborationInvites")
      .withIndex("by_token", (q) => q.eq("inviteToken", args.inviteToken))
      .first();

    if (!invite) throw new Error("Invite not found");

    // Check if already accepted or expired
    if (invite.status !== "pending") {
      throw new Error(`This invite has already been ${invite.status}`);
    }

    const now = Date.now();
    if (now > invite.expiresAt) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invite has expired");
    }

    // Check if email matches (if email was specified)
    if (invite.email && invite.email !== user.email) {
      throw new Error("This invite was sent to a different email address");
    }

    // Check if user is already a collaborator
    const prompt = await ctx.db.get(invite.promptId);
    if (!prompt) throw new Error("Prompt not found");

    if (prompt.collaborators?.includes(user._id)) {
      throw new Error("You are already a collaborator on this prompt");
    }

    // Check if user is the owner
    if (prompt.userId === user._id) {
      throw new Error("You are the owner of this prompt");
    }

    // Add user to collaborators
    const updatedCollaborators = [...(prompt.collaborators || []), user._id];
    await ctx.db.patch(invite.promptId, {
      collaborators: updatedCollaborators,
      updatedAt: now,
    });

    // Update invite status
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: now,
      acceptedBy: user._id,
    });

    toast.success("You are now a collaborator on this prompt!");

    return {
      success: true,
      promptId: invite.promptId,
      promptName: prompt.placeName,
    };
  },
});

// Revoke an invite
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("collaborationInvites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    // Only owner or inviter can revoke
    if (invite.ownerId !== user._id && invite.invitedBy !== user._id) {
      throw new Error("Not authorized to revoke this invite");
    }

    await ctx.db.patch(invite._id, { status: "revoked" });

    return { success: true };
  },
});

// Remove a collaborator
export const removeCollaborator = mutation({
  args: {
    promptId: v.id("prompts"),
    collaboratorId: v.id("users"),
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

    // Only owner can remove collaborators
    if (prompt.userId !== user._id) {
      throw new Error("Only the owner can remove collaborators");
    }

    const updatedCollaborators = (prompt.collaborators || []).filter(
      (id) => id !== args.collaboratorId
    );

    await ctx.db.patch(args.promptId, {
      collaborators: updatedCollaborators,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get pending invites for a prompt
export const getPendingInvites = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return [];

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) return [];

    // Only owner can see invites
    if (prompt.userId !== user._id) return [];

    const invites = await ctx.db
      .query("collaborationInvites")
      .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
      .collect();

    const now = Date.now();

    return invites
      .filter((invite) => invite.status === "pending" && invite.expiresAt > now)
      .map((invite) => ({
        _id: invite._id,
        inviteToken: invite.inviteToken,
        email: invite.email,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      }));
  },
});

// Get collaborators for a prompt
export const getCollaborators = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) return [];

    const collaborators = await Promise.all(
      (prompt.collaborators || []).map(async (userId) => {
        const user = await ctx.db.get(userId);
        return {
          userId,
          name: user?.name || user?.email || "Unknown",
          email: user?.email,
          avatar: user?.avatar,
        };
      })
    );

    return collaborators;
  },
});

// Get invite details by token (for invite acceptance page)
export const getInviteByToken = query({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("collaborationInvites")
      .withIndex("by_token", (q) => q.eq("inviteToken", args.inviteToken))
      .first();

    if (!invite) return null;

    const prompt = await ctx.db.get(invite.promptId);
    const owner = await ctx.db.get(invite.ownerId);

    return {
      status: invite.status,
      expiresAt: invite.expiresAt,
      promptName: prompt?.placeName || "Unknown",
      ownerName: owner?.name || owner?.email || "Unknown",
      email: invite.email,
    };
  },
});

// Check if user is a collaborator on a prompt
export const isCollaborator = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return false;

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) return false;

    // Owner is not a collaborator
    if (prompt.userId === user._id) return false;

    return prompt.collaborators?.includes(user._id) || false;
  },
});

// Get prompt access info (owner, collaborator, or none)
export const getPromptAccess = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { access: "none" as const };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) {
      return { access: "none" as const };
    }

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      return { access: "none" as const };
    }

    if (prompt.userId === user._id) {
      return {
        access: "owner" as const,
        canEdit: true,
        canInvite: true,
        ownerId: user._id,
      };
    }

    const isCollaborator = prompt.collaborators?.includes(user._id);

    if (isCollaborator) {
      return {
        access: "collaborator" as const,
        canEdit: true,
        canInvite: false,
        ownerId: prompt.userId,
      };
    }

    if (prompt.isPublic) {
      return {
        access: "public" as const,
        canEdit: prompt.shareMode === "edit",
        canInvite: false,
        ownerId: prompt.userId,
      };
    }

    return { access: "none" as const };
  },
});
