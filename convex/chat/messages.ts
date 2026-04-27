import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export const listMessages = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return [];
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const sendUserMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your session" });

    const msgId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "user",
      content: args.content,
    });

    // Update session timestamp
    await ctx.db.patch(args.sessionId, { lastMessageAt: new Date().toISOString() });

    return msgId;
  },
});

export const createAssistantPlaceholder = internalMutation({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: "assistant",
      content: "",
      isStreaming: true,
    });
  },
});

export const updateAssistantMessage = internalMutation({
  args: {
    messageId: v.id("chatMessages"),
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
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your session" });

    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of msgs) await ctx.db.delete(msg._id);
  },
});
