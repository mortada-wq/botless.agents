import { v } from "convex/values";
import { query } from "./_generated/server";
import { ConvexError } from "convex/values";

type AgentStat = {
  agentId: string;
  name: string;
  status: string;
  chatSessionCount: number;
  publicSessionCount: number;
  totalConversations: number;
  likeCount: number;
  cloneCount: number;
};

type DayCount = { date: string; count: number };

type AnalyticsData = {
  agentCount: number;
  activeAgentCount: number;
  totalChatSessions: number;
  totalPublicSessions: number;
  totalConversations: number;
  totalMediaJobs: number;
  completedMediaJobs: number;
  imageJobCount: number;
  videoJobCount: number;
  conversationsByDay: DayCount[];
  mediaJobsByDay: DayCount[];
  agentStats: AgentStat[];
};

export const getMyAnalytics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args): Promise<AnalyticsData> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) {
      throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    }

    const windowDays = args.days ?? 30;
    const now = Date.now();

    // Fetch base data
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const chatSessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const mediaJobs = await ctx.db
      .query("mediaJobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Per-agent public session counts
    const agentStats: AgentStat[] = await Promise.all(
      agents.map(async (agent) => {
        const publicSessions = await ctx.db
          .query("publicChatSessions")
          .withIndex("by_agent_and_guest", (q) => q.eq("agentId", agent._id))
          .collect();
        const agentChatSessions = chatSessions.filter((s) => s.agentId === agent._id);
        return {
          agentId: agent._id,
          name: agent.name,
          status: agent.status,
          chatSessionCount: agentChatSessions.length,
          publicSessionCount: publicSessions.length,
          totalConversations: agentChatSessions.length + publicSessions.length,
          likeCount: agent.likeCount ?? 0,
          cloneCount: agent.cloneCount ?? 0,
        };
      })
    );

    // Build day-keyed buckets for last N days
    const initBuckets = (): Record<string, number> => {
      const buckets: Record<string, number> = {};
      for (let i = windowDays - 1; i >= 0; i--) {
        const key = new Date(now - i * 86400000).toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      return buckets;
    };

    // Conversations by day (private chat sessions only)
    const convBuckets = initBuckets();
    for (const s of chatSessions) {
      const key = new Date(s._creationTime).toISOString().slice(0, 10);
      if (key in convBuckets) convBuckets[key]++;
    }
    const conversationsByDay = Object.entries(convBuckets).map(([date, count]) => ({ date, count }));

    // Media jobs by day
    const mediaBuckets = initBuckets();
    for (const j of mediaJobs) {
      const key = new Date(j._creationTime).toISOString().slice(0, 10);
      if (key in mediaBuckets) mediaBuckets[key]++;
    }
    const mediaJobsByDay = Object.entries(mediaBuckets).map(([date, count]) => ({ date, count }));

    const totalPublicSessions = agentStats.reduce((s, a) => s + a.publicSessionCount, 0);

    return {
      agentCount: agents.length,
      activeAgentCount: agents.filter((a) => a.status === "active").length,
      totalChatSessions: chatSessions.length,
      totalPublicSessions,
      totalConversations: chatSessions.length + totalPublicSessions,
      totalMediaJobs: mediaJobs.length,
      completedMediaJobs: mediaJobs.filter((j) => j.status === "completed").length,
      imageJobCount: mediaJobs.filter((j) => j.type === "image").length,
      videoJobCount: mediaJobs.filter((j) => j.type === "video").length,
      conversationsByDay,
      mediaJobsByDay,
      agentStats,
    };
  },
});
