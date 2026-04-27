import { ConvexError, v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const DEFAULTS = {
  chatProvider: "hercules",
  imageProvider: "siliconflow",
  videoProvider: "siliconflow",
} as const;

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export const getProviderSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return null;
    const settings = await ctx.db
      .query("providerSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!settings) return { ...DEFAULTS };
    return settings;
  },
});

export const upsertProviderSettings = mutation({
  args: {
    chatProvider: v.optional(v.string()),
    chatModel: v.optional(v.string()),
    chatApiKey: v.optional(v.string()),
    imageProvider: v.optional(v.string()),
    imageModel: v.optional(v.string()),
    imageApiKey: v.optional(v.string()),
    videoProvider: v.optional(v.string()),
    videoModel: v.optional(v.string()),
    videoApiKey: v.optional(v.string()),
    siliconflowApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const existing = await ctx.db
      .query("providerSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const updates = Object.fromEntries(Object.entries(args).filter(([, val]) => val !== undefined));

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("providerSettings", {
        userId: user._id,
        chatProvider: args.chatProvider ?? DEFAULTS.chatProvider,
        imageProvider: args.imageProvider ?? DEFAULTS.imageProvider,
        videoProvider: args.videoProvider ?? DEFAULTS.videoProvider,
        ...updates,
      });
    }
  },
});
