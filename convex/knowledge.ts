import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

// ── Auth helper ────────────────────────────────────────────────────────────────

async function requireUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user;
}

// ── Generate upload URL ────────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Save file record after upload ──────────────────────────────────────────────

export const saveKnowledgeFile = mutation({
  args: {
    agentId: v.id("agents"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    extractedText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.ownerId !== user._id) {
      throw new ConvexError({ message: "Agent not found or access denied", code: "FORBIDDEN" });
    }

    return await ctx.db.insert("knowledgeFiles", {
      agentId: args.agentId,
      ownerId: user._id,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      extractedText: args.extractedText,
    });
  },
});

// ── List knowledge files for an agent ─────────────────────────────────────────

export const listKnowledgeFiles = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.ownerId !== user._id) return [];

    const files = await ctx.db
      .query("knowledgeFiles")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    return await Promise.all(
      files.map(async (f) => ({
        ...f,
        url: await ctx.storage.getUrl(f.storageId),
      }))
    );
  },
});

// ── Delete a knowledge file ────────────────────────────────────────────────────

export const deleteKnowledgeFile = mutation({
  args: { fileId: v.id("knowledgeFiles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new ConvexError({ message: "File not found", code: "NOT_FOUND" });
    if (file.ownerId !== user._id) throw new ConvexError({ message: "Access denied", code: "FORBIDDEN" });
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.fileId);
  },
});

// ── Get aggregated knowledge context for LLM ──────────────────────────────────

export const getKnowledgeContext = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args): Promise<string> => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return "";

    const files = await ctx.db
      .query("knowledgeFiles")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const parts: string[] = [];

    if (agent.knowledgeText?.trim()) {
      parts.push(`--- Agent Notes ---\n${agent.knowledgeText.trim()}`);
    }

    for (const f of files) {
      if (f.extractedText?.trim()) {
        parts.push(`--- ${f.fileName} ---\n${f.extractedText.trim()}`);
      }
    }

    return parts.join("\n\n");
  },
});

// ── Update extracted text after client-side parsing ───────────────────────────

export const updateExtractedText = mutation({
  args: {
    fileId: v.id("knowledgeFiles"),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new ConvexError({ message: "File not found", code: "NOT_FOUND" });
    if (file.ownerId !== user._id) throw new ConvexError({ message: "Access denied", code: "FORBIDDEN" });
    await ctx.db.patch(args.fileId, { extractedText: args.extractedText });
  },
});
