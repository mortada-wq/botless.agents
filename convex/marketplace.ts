import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

// ── List public agents ────────────────────────────────────────────────────────

export const listPublicAgents = query({
  args: {
    paginationOpts: paginationOptsValidator,
    industry: v.optional(v.string()),
    agentType: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);

    const results = await ctx.db
      .query("agents")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .paginate(args.paginationOpts);

    // Client-side filtering (small dataset expected)
    let filtered = results.page;
    if (args.industry) {
      filtered = filtered.filter((a) => a.industry === args.industry);
    }
    if (args.agentType) {
      filtered = filtered.filter((a) => a.agentType === args.agentType);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.tagline ?? "").toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q)
      );
    }

    // Enrich with owner name and like status
    const enriched = await Promise.all(
      filtered.map(async (agent) => {
        const owner = await ctx.db.get(agent.ownerId);
        const liked = user
          ? !!(await ctx.db
              .query("agentLikes")
              .withIndex("by_user_and_agent", (q) =>
                q.eq("userId", user._id).eq("agentId", agent._id)
              )
              .unique())
          : false;
        return {
          ...agent,
          ownerName: owner?.name ?? "Anonymous",
          ownerAvatar: owner?.avatar,
          liked,
        };
      })
    );

    return { ...results, page: enriched };
  },
});

// ── Get single public agent detail ───────────────────────────────────────────

export const getPublicAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.visibility !== "public") return null;

    const owner = await ctx.db.get(agent.ownerId);
    const liked = user
      ? !!(await ctx.db
          .query("agentLikes")
          .withIndex("by_user_and_agent", (q) =>
            q.eq("userId", user._id).eq("agentId", args.agentId)
          )
          .unique())
      : false;

    const faqs = await ctx.db
      .query("faqs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    return {
      ...agent,
      ownerName: owner?.name ?? "Anonymous",
      ownerAvatar: owner?.avatar,
      liked,
      faqs,
    };
  },
});

// ── Toggle like ───────────────────────────────────────────────────────────────

export const toggleLike = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.visibility !== "public")
      throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    const existing = await ctx.db
      .query("agentLikes")
      .withIndex("by_user_and_agent", (q) =>
        q.eq("userId", user._id).eq("agentId", args.agentId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.agentId, {
        likeCount: Math.max(0, (agent.likeCount ?? 0) - 1),
      });
      return false;
    } else {
      await ctx.db.insert("agentLikes", { agentId: args.agentId, userId: user._id });
      await ctx.db.patch(args.agentId, { likeCount: (agent.likeCount ?? 0) + 1 });
      return true;
    }
  },
});

// ── Clone agent into user's own collection ────────────────────────────────────

export const cloneAgent = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.visibility !== "public")
      throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });

    // Bump clone count on original
    await ctx.db.patch(args.agentId, { cloneCount: (agent.cloneCount ?? 0) + 1 });

    const newId = await ctx.db.insert("agents", {
      ownerId: user._id,
      name: `${agent.name} (Clone)`,
      agentType: agent.agentType,
      industry: agent.industry,
      tagline: agent.tagline,
      description: agent.description,
      avatarUrl: agent.avatarUrl,
      tone: agent.tone,
      welcomeMessage: agent.welcomeMessage,
      instructions: agent.instructions,
      knowledgeText: agent.knowledgeText,
      tags: agent.tags,
      status: "active",
      visibility: "private",
    });

    return newId;
  },
});

// ── Publish agent to marketplace ──────────────────────────────────────────────

export const publishAgent = mutation({
  args: {
    agentId: v.id("agents"),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });
    if (agent.ownerId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your agent" });

    await ctx.db.patch(args.agentId, {
      visibility: "public",
      publishedAt: new Date().toISOString(),
      tags: args.tags ?? agent.tags,
      likeCount: agent.likeCount ?? 0,
      cloneCount: agent.cloneCount ?? 0,
    });
  },
});

// ── Unpublish agent ───────────────────────────────────────────────────────────

export const unpublishAgent = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });
    if (agent.ownerId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your agent" });

    await ctx.db.patch(args.agentId, { visibility: "private" });
  },
});
