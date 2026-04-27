import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "../_generated/api";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });
  return user;
}

// ── Enqueue a new pipeline job ────────────────────────────────────────────────

export const enqueueJob = mutation({
  args: {
    jobType: v.union(
      v.literal("bg_removal"),
      v.literal("video_to_webm"),
      v.literal("video_to_gif"),
      v.literal("image_optimize")
    ),
    inputUrl: v.string(),
    inputStorageId: v.optional(v.id("_storage")),
    inputBytes: v.optional(v.number()),
    emotionalStateId: v.optional(v.id("emotionalStates")),
    mediaJobId: v.optional(v.id("mediaJobs")),
  },
  handler: async (ctx, args): Promise<string> => {
    const user = await requireUser(ctx);

    const jobId = await ctx.db.insert("pipelineJobs", {
      ownerId: user._id,
      jobType: args.jobType,
      inputUrl: args.inputUrl,
      inputStorageId: args.inputStorageId,
      inputBytes: args.inputBytes,
      emotionalStateId: args.emotionalStateId,
      mediaJobId: args.mediaJobId,
      status: "queued",
      attempts: 0,
    });

    // Schedule immediate execution
    await ctx.scheduler.runAfter(0, internal.pipeline.process.runJob, { jobId });

    return jobId;
  },
});

// ── Retry a failed job ────────────────────────────────────────────────────────

export const retryJob = mutation({
  args: { jobId: v.id("pipelineJobs") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.ownerId !== user._id)
      throw new ConvexError({ code: "NOT_FOUND", message: "Job not found" });
    if (job.status !== "failed")
      throw new ConvexError({ code: "BAD_REQUEST", message: "Only failed jobs can be retried" });

    await ctx.db.patch(args.jobId, {
      status: "queued",
      errorMessage: undefined,
      outputUrl: undefined,
      outputStorageId: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.pipeline.process.runJob, { jobId: args.jobId });
  },
});

// ── Cancel / delete a job ─────────────────────────────────────────────────────

export const deleteJob = mutation({
  args: { jobId: v.id("pipelineJobs") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job || job.ownerId !== user._id)
      throw new ConvexError({ code: "NOT_FOUND", message: "Job not found" });
    await ctx.db.delete(args.jobId);
  },
});

// ── List jobs (paginated) ─────────────────────────────────────────────────────

export const listJobs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return { page: [], isDone: true, continueCursor: "" };

    const results = await ctx.db
      .query("pipelineJobs")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    if (args.status) {
      return { ...results, page: results.page.filter((j) => j.status === args.status) };
    }

    return results;
  },
});

// ── Stats summary ─────────────────────────────────────────────────────────────

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const all = await ctx.db
      .query("pipelineJobs")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const queued = all.filter((j) => j.status === "queued").length;
    const running = all.filter((j) => j.status === "running").length;
    const done = all.filter((j) => j.status === "done").length;
    const failed = all.filter((j) => j.status === "failed").length;

    // Bytes saved = sum of (inputBytes - outputBytes) for done jobs
    const bytesSaved = all
      .filter((j) => j.status === "done" && j.inputBytes && j.outputBytes)
      .reduce((acc, j) => acc + ((j.inputBytes ?? 0) - (j.outputBytes ?? 0)), 0);

    return { total: all.length, queued, running, done, failed, bytesSaved };
  },
});

// ── Internal helpers ──────────────────────────────────────────────────────────

export const getJobInternal = internalQuery({
  args: { jobId: v.id("pipelineJobs") },
  handler: async (ctx, args) => ctx.db.get(args.jobId),
});

export const markRunning = internalMutation({
  args: { jobId: v.id("pipelineJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;
    await ctx.db.patch(args.jobId, {
      status: "running",
      startedAt: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    });
  },
});

export const markDone = internalMutation({
  args: {
    jobId: v.id("pipelineJobs"),
    outputUrl: v.string(),
    outputStorageId: v.optional(v.id("_storage")),
    outputFormat: v.optional(v.string()),
    outputBytes: v.optional(v.number()),
    emotionalStateId: v.optional(v.id("emotionalStates")),
    processedFormat: v.optional(v.union(
      v.literal("webm"),
      v.literal("gif"),
      v.literal("lottie"),
      v.literal("original")
    )),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "done",
      outputUrl: args.outputUrl,
      outputStorageId: args.outputStorageId,
      outputFormat: args.outputFormat,
      outputBytes: args.outputBytes,
      completedAt: new Date().toISOString(),
    });

    // Propagate result back to emotional state if linked
    if (args.emotionalStateId) {
      await ctx.db.patch(args.emotionalStateId, {
        processedUrl: args.outputUrl,
        processedFormat: args.processedFormat ?? "original",
        processingStatus: "done",
      });
    }
  },
});

export const markFailed = internalMutation({
  args: { jobId: v.id("pipelineJobs"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    await ctx.db.patch(args.jobId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: new Date().toISOString(),
    });

    // Mark linked emotional state as failed too
    if (job?.emotionalStateId) {
      await ctx.db.patch(job.emotionalStateId, {
        processingStatus: "failed",
        processingError: args.errorMessage,
      });
    }
  },
});
