import { ConvexError, v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { skills } from "./skills";

async function getAuthUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  return user;
}

export const createAgent = mutation({
  args: {
    name: v.string(),
    agentType: v.string(),
    industry: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    tone: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    instructions: v.optional(v.string()),
    knowledgeText: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    return await ctx.db.insert("agents", {
      ownerId: user._id,
      name: args.name,
      agentType: args.agentType,
      industry: args.industry,
      tagline: args.tagline,
      description: args.description,
      tone: args.tone,
      welcomeMessage: args.welcomeMessage,
      instructions: args.instructions,
      knowledgeText: args.knowledgeText,
      avatarUrl: args.avatarUrl,
      status: "active",
      visibility: "private",
    });
  },
});

export const updateAgent = mutation({
  args: {
    agentId: v.id("agents"),
    name: v.optional(v.string()),
    agentType: v.optional(v.string()),
    industry: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    tone: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    instructions: v.optional(v.string()),
    knowledgeText: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    status: v.optional(v.string()),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });
    if (agent.ownerId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your agent" });
    const { agentId, ...rest } = args;
    const updates = Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined));
    await ctx.db.patch(agentId, updates);
  },
});

export const deleteAgent = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new ConvexError({ code: "NOT_FOUND", message: "Agent not found" });
    if (agent.ownerId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Not your agent" });
    await ctx.db.delete(args.agentId);
  },
});

export const listMyAgents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("agents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const getAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

export const listSkills = query({
  args: {},
  handler: async () => {
    return Object.values(skills);
  },
});
