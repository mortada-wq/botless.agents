import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// Generate an upload URL (for use by pipeline actions)
export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

// Get the serving URL for a storage ID
export const getStorageUrl = internalQuery({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as Parameters<typeof ctx.storage.getUrl>[0]);
    return url ?? "";
  },
});
