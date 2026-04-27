import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getMessageHistory = internalQuery({
  args: { sessionId: v.id("publicChatSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("publicChatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});
