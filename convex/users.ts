import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      // Update avatar/name if changed
      await ctx.db.patch(user._id, {
        name: identity.name ?? user.name,
        avatar: identity.profileUrl ?? user.avatar,
      });
      return user._id;
    }
    return await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      avatar: identity.profileUrl,
      tokenIdentifier: identity.tokenIdentifier,
      onboardingComplete: false,
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

export const completeOnboarding = mutation({
  args: {
    companyName: v.string(),
    role: v.string(),
    useCase: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
    await ctx.db.patch(user._id, {
      companyName: args.companyName,
      role: args.role,
      useCase: args.useCase,
      onboardingComplete: true,
    });
  },
});
