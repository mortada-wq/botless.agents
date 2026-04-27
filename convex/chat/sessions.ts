import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export const getOrCreateSession = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const existing = await ctx.db
      .query("chatSessions")
      .withIndex("by_user_and_agent", (q) =>
        q.eq("userId", user._id).eq("agentId", args.agentId)
      )
      .order("desc")
      .first();

    if (existing) return existing._id;

    const agent = await ctx.db.get(args.agentId);
    const title = agent ? `Chat with ${agent.name}` : "New Chat";

    return await ctx.db.insert("chatSessions", {
      userId: user._id,
      agentId: args.agentId,
      title,
      lastMessageAt: new Date().toISOString(),
    });
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return [];
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    // Enrich with agent info
    return await Promise.all(
      sessions.map(async (s) => {
        const agent = await ctx.db.get(s.agentId);
        return { ...s, agentName: agent?.name ?? "Unknown", agentAvatar: agent?.avatarUrl };
      })
    );
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your session" });

    // Delete all messages in session
    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const msg of msgs) await ctx.db.delete(msg._id);
    await ctx.db.delete(args.sessionId);
  },
});
