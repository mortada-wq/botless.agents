import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

async function requireUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user;
}

export const listCharacters = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    // Attach emotional state count
    const result = await Promise.all(
      characters.map(async (c) => {
        const states = await ctx.db
          .query("emotionalStates")
          .withIndex("by_character", (q) => q.eq("characterId", c._id))
          .collect();
        return { ...c, stateCount: states.length };
      })
    );
    return result;
  },
});

export const getCharacter = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.ownerId !== user._id) return null;
    const states = await ctx.db
      .query("emotionalStates")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();
    return { ...character, states };
  },
});

export const createCharacter = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("characters", {
      ownerId: user._id,
      name: args.name,
      description: args.description,
      avatarUrl: args.avatarUrl,
    });
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.ownerId !== user._id)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { characterId, ...rest } = args;
    await ctx.db.patch(characterId, rest);
  },
});

export const deleteCharacter = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.ownerId !== user._id)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    // Delete emotional states first
    const states = await ctx.db
      .query("emotionalStates")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();
    for (const s of states) await ctx.db.delete(s._id);
    await ctx.db.delete(args.characterId);
  },
});

// ── Emotional states ─────────────────────────────────────────────────────────

export const addEmotionalState = mutation({
  args: {
    characterId: v.id("characters"),
    emotion: v.string(),
    label: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    originalUrl: v.optional(v.string()),
    processedUrl: v.optional(v.string()),
    processedFormat: v.optional(v.union(v.literal("webm"), v.literal("gif"), v.literal("lottie"), v.literal("original"))),
    thumbnailUrl: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.ownerId !== user._id)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    return ctx.db.insert("emotionalStates", {
      ...args,
      ownerId: user._id,
      processingStatus: args.processedUrl ? "done" : "pending",
    });
  },
});

export const updateEmotionalState = mutation({
  args: {
    stateId: v.id("emotionalStates"),
    emotion: v.optional(v.string()),
    label: v.optional(v.string()),
    processedUrl: v.optional(v.string()),
    processedFormat: v.optional(v.union(v.literal("webm"), v.literal("gif"), v.literal("lottie"), v.literal("original"))),
    processingStatus: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("done"), v.literal("failed"))),
    processingError: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const state = await ctx.db.get(args.stateId);
    if (!state || state.ownerId !== user._id)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    const { stateId, ...rest } = args;
    await ctx.db.patch(stateId, rest);
  },
});

export const deleteEmotionalState = mutation({
  args: { stateId: v.id("emotionalStates") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const state = await ctx.db.get(args.stateId);
    if (!state || state.ownerId !== user._id)
      throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.delete(args.stateId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const setDefaultState = mutation({
  args: { characterId: v.id("characters"), stateId: v.id("emotionalStates") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const states = await ctx.db
      .query("emotionalStates")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .collect();
    for (const s of states) {
      if (s.ownerId !== user._id) continue;
      await ctx.db.patch(s._id, { isDefault: s._id === args.stateId });
    }
  },
});
