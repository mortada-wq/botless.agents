import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getAgentAndSettings = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const settings = await ctx.db
      .query("providerSettings")
      .withIndex("by_user", (q) => q.eq("userId", agent.ownerId))
      .unique();

    return {
      ...agent,
      settings: {
        chatProvider: settings?.chatProvider ?? "hercules",
        chatModel: settings?.chatModel,
        chatApiKey: settings?.chatApiKey,
        siliconflowApiKey: settings?.siliconflowApiKey,
      },
    };
  },
});

export const getMessageHistory = internalQuery({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});
