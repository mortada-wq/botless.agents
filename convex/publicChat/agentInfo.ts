import { v } from "convex/values";
import { query } from "../_generated/server";

// Public read of any agent (for the share page — no auth needed)
export const getPublicAgentById = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    const owner = await ctx.db.get(agent.ownerId);
    const faqs = await ctx.db
      .query("faqs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    return {
      ...agent,
      ownerName: owner?.name ?? "Anonymous",
      ownerAvatar: owner?.avatar,
      faqs,
    };
  },
});
