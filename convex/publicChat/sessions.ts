import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";

export const getOrCreateSession = mutation({
  args: {
    agentId: v.id("agents"),
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    // Agents must be public
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.visibility !== "public") return null;

    const existing = await ctx.db
      .query("publicChatSessions")
      .withIndex("by_agent_and_guest", (q) =>
        q.eq("agentId", args.agentId).eq("guestId", args.guestId)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("publicChatSessions", {
      agentId: args.agentId,
      guestId: args.guestId,
      lastMessageAt: new Date().toISOString(),
    });
  },
});

export const listMessages = query({
  args: { sessionId: v.id("publicChatSessions"), guestId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.guestId !== args.guestId) return [];

    return await ctx.db
      .query("publicChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const sendUserMessage = mutation({
  args: {
    sessionId: v.id("publicChatSessions"),
    guestId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.guestId !== args.guestId) return null;

    const msgId = await ctx.db.insert("publicChatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: args.content,
    });

    await ctx.db.patch(args.sessionId, { lastMessageAt: new Date().toISOString() });
    return msgId;
  },
});

export const createAssistantPlaceholder = internalMutation({
  args: { sessionId: v.id("publicChatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("publicChatMessages", {
      sessionId: args.sessionId,
      role: "assistant",
      content: "",
      isStreaming: true,
    });
  },
});

export const updateAssistantMessage = internalMutation({
  args: {
    messageId: v.id("publicChatMessages"),
    content: v.string(),
    isStreaming: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
      isStreaming: args.isStreaming,
    });
  },
});

export const clearSession = mutation({
  args: { sessionId: v.id("publicChatSessions"), guestId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.guestId !== args.guestId) return;

    const msgs = await ctx.db
      .query("publicChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of msgs) await ctx.db.delete(msg._id);
  },
});
