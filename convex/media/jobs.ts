import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

// ── Create a new media job ────────────────────────────────────────────────────

export const createJob = mutation({
  args: {
    type: v.union(v.literal("image"), v.literal("video")),
    provider: v.string(),
    model: v.string(),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
    // Image
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    steps: v.optional(v.number()),
    seed: v.optional(v.number()),
    // Video
    duration: v.optional(v.number()),
    fps: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const jobId = await ctx.db.insert("mediaJobs", {
      userId: user._id,
      agentId: args.agentId,
      type: args.type,
      provider: args.provider,
      model: args.model,
      prompt: args.prompt,
      negativePrompt: args.negativePrompt,
      width: args.width,
      height: args.height,
      steps: args.steps,
      seed: args.seed,
      duration: args.duration,
      fps: args.fps,
      status: "pending",
    });

    return jobId;
  },
});

// ── Internal: update job status (called from action) ─────────────────────────

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("mediaJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    resultUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      ...(args.resultUrl ? { resultUrl: args.resultUrl } : {}),
      ...(args.errorMessage ? { errorMessage: args.errorMessage } : {}),
    });
  },
});

// ── Delete a job ──────────────────────────────────────────────────────────────

export const deleteJob = mutation({
  args: { jobId: v.id("mediaJobs") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Not your job" });
    await ctx.db.delete(args.jobId);
  },
});

// ── List jobs (paginated) ─────────────────────────────────────────────────────

export const listJobs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    type: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return { page: [], isDone: true, continueCursor: "" };

    let q = ctx.db
      .query("mediaJobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const results = await q.paginate(args.paginationOpts);

    // Filter by type client-side (minimal docs)
    if (args.type) {
      return {
        ...results,
        page: results.page.filter((j) => j.type === args.type),
      };
    }

    return results;
  },
});

// ── Get single job ────────────────────────────────────────────────────────────

export const getJob = query({
  args: { jobId: v.id("mediaJobs") },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return null;
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) return null;
    return job;
  },
});
