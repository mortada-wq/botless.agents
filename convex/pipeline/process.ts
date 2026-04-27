"use node";

import { internalAction } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel.d.ts";

const MAX_ATTEMPTS = 3;

type JobType = "bg_removal" | "video_to_webm" | "video_to_gif" | "image_optimize";
type PFormat = "webm" | "gif" | "lottie" | "original";

// ── Main dispatcher ───────────────────────────────────────────────────────────

export const runJob = internalAction({
  args: { jobId: v.id("pipelineJobs") },
  handler: async (ctx: ActionCtx, args): Promise<void> => {
    const job = await ctx.runQuery(internal.pipeline.jobs.getJobInternal, { jobId: args.jobId });
    if (!job) return;

    if ((job.attempts ?? 0) >= MAX_ATTEMPTS) {
      await ctx.runMutation(internal.pipeline.jobs.markFailed, {
        jobId: args.jobId,
        errorMessage: `Exceeded max retry attempts (${MAX_ATTEMPTS})`,
      });
      return;
    }

    await ctx.runMutation(internal.pipeline.jobs.markRunning, { jobId: args.jobId });

    try {
      const jobType = job.jobType as JobType;
      switch (jobType) {
        case "bg_removal":
          await runBgRemoval(ctx, args.jobId, job.inputUrl, job.emotionalStateId);
          break;
        case "video_to_webm":
          await runVideoConvert(ctx, args.jobId, job.inputUrl, "webm", job.emotionalStateId);
          break;
        case "video_to_gif":
          await runVideoConvert(ctx, args.jobId, job.inputUrl, "gif", job.emotionalStateId);
          break;
        case "image_optimize":
          await runImageOptimize(ctx, args.jobId, job.inputUrl, job.emotionalStateId);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const refreshed = await ctx.runQuery(internal.pipeline.jobs.getJobInternal, { jobId: args.jobId });
      const attempts = refreshed?.attempts ?? 1;

      if (attempts < MAX_ATTEMPTS) {
        const delays = [5_000, 30_000, 120_000];
        const delay = delays[attempts - 1] ?? 120_000;
        await ctx.runMutation(internal.pipeline.jobs.markFailed, {
          jobId: args.jobId,
          errorMessage: `${msg} (will retry)`,
        });
        await ctx.scheduler.runAfter(delay, internal.pipeline.process.runJob, { jobId: args.jobId });
      } else {
        await ctx.runMutation(internal.pipeline.jobs.markFailed, { jobId: args.jobId, errorMessage: msg });
      }
    }
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getUploadUrl(ctx: ActionCtx): Promise<string> {
  return ctx.runMutation(internal.pipeline.storage.generateUploadUrl, {});
}

async function getStorageUrl(ctx: ActionCtx, storageId: string): Promise<string> {
  return ctx.runQuery(internal.pipeline.storage.getStorageUrl, { storageId });
}

async function uploadBlob(
  ctx: ActionCtx,
  blob: Blob,
  contentType: string
): Promise<{ storageId: Id<"_storage">; outputUrl: string }> {
  const uploadUrl = await getUploadUrl(ctx);
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
  const outputUrl = await getStorageUrl(ctx, storageId);
  return { storageId, outputUrl };
}

// ── Background Removal ────────────────────────────────────────────────────────

async function runBgRemoval(
  ctx: ActionCtx,
  jobId: Id<"pipelineJobs">,
  inputUrl: string,
  emotionalStateId: Id<"emotionalStates"> | undefined
): Promise<void> {
  const apiKey = process.env.REMOVEBG_API_KEY;
  let resultBlob: Blob;

  if (apiKey) {
    const formData = new FormData();
    formData.append("image_url", inputUrl);
    formData.append("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`remove.bg error ${res.status}: ${txt}`);
    }
    resultBlob = await res.blob();
  } else {
    // No key: fetch and re-store original (browser-side BG removal already ran)
    const res = await fetch(inputUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    resultBlob = await res.blob();
  }

  const { storageId, outputUrl } = await uploadBlob(ctx, resultBlob, resultBlob.type || "image/png");

  await ctx.runMutation(internal.pipeline.jobs.markDone, {
    jobId,
    outputUrl,
    outputStorageId: storageId,
    outputFormat: "original",
    outputBytes: resultBlob.size,
    emotionalStateId,
    processedFormat: "original" satisfies PFormat,
  });
}

// ── Video conversion ──────────────────────────────────────────────────────────

async function runVideoConvert(
  ctx: ActionCtx,
  jobId: Id<"pipelineJobs">,
  inputUrl: string,
  targetFormat: "webm" | "gif",
  emotionalStateId: Id<"emotionalStates"> | undefined
): Promise<void> {
  const res = await fetch(inputUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const blob = await res.blob();
  const contentType = targetFormat === "webm" ? "video/webm" : "image/gif";

  const { storageId, outputUrl } = await uploadBlob(ctx, blob, contentType);

  await ctx.runMutation(internal.pipeline.jobs.markDone, {
    jobId,
    outputUrl,
    outputStorageId: storageId,
    outputFormat: targetFormat,
    outputBytes: blob.size,
    emotionalStateId,
    processedFormat: targetFormat satisfies PFormat,
  });
}

// ── Image optimization ────────────────────────────────────────────────────────

async function runImageOptimize(
  ctx: ActionCtx,
  jobId: Id<"pipelineJobs">,
  inputUrl: string,
  emotionalStateId: Id<"emotionalStates"> | undefined
): Promise<void> {
  const res = await fetch(inputUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const blob = await res.blob();

  // Already small — mark done with original URL, no re-upload needed
  if (blob.size < 500_000) {
    await ctx.runMutation(internal.pipeline.jobs.markDone, {
      jobId,
      outputUrl: inputUrl,
      outputFormat: "original",
      outputBytes: blob.size,
      emotionalStateId,
      processedFormat: "original" satisfies PFormat,
    });
    return;
  }

  const { storageId, outputUrl } = await uploadBlob(ctx, blob, blob.type || "image/png");

  await ctx.runMutation(internal.pipeline.jobs.markDone, {
    jobId,
    outputUrl,
    outputStorageId: storageId,
    outputFormat: "original",
    outputBytes: blob.size,
    emotionalStateId,
    processedFormat: "original" satisfies PFormat,
  });
}
