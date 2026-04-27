"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// SiliconFlow API base URL
const SF_BASE = "https://api.siliconflow.cn/v1";

// ── Image generation ─────────────────────────────────────────────────────────

export const generateImage = action({
  args: {
    jobId: v.id("mediaJobs"),
    apiKey: v.string(),
    model: v.string(),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    steps: v.optional(v.number()),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    // Mark job as running
    await ctx.runMutation(internal.media.jobs.updateJobStatus, {
      jobId: args.jobId,
      status: "running",
    });

    try {
      const body: Record<string, unknown> = {
        model: args.model,
        prompt: args.prompt,
        negative_prompt: args.negativePrompt ?? "",
        image_size: `${args.width ?? 1024}x${args.height ?? 1024}`,
        num_inference_steps: args.steps ?? 20,
        seed: args.seed,
      };

      const res = await fetch(`${SF_BASE}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`SiliconFlow image error ${res.status}: ${err}`);
      }

      const json = (await res.json()) as {
        data?: Array<{ url?: string }>;
        images?: Array<{ url?: string }>;
      };
      const url = json.data?.[0]?.url ?? json.images?.[0]?.url;
      if (!url) throw new Error("No image URL in SiliconFlow response");

      await ctx.runMutation(internal.media.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "completed",
        resultUrl: url,
      });
    } catch (err) {
      await ctx.runMutation(internal.media.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  },
});

// ── Video generation ──────────────────────────────────────────────────────────

export const generateVideo = action({
  args: {
    jobId: v.id("mediaJobs"),
    apiKey: v.string(),
    model: v.string(),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    duration: v.optional(v.number()),
    fps: v.optional(v.number()),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.media.jobs.updateJobStatus, {
      jobId: args.jobId,
      status: "running",
    });

    try {
      const body: Record<string, unknown> = {
        model: args.model,
        prompt: args.prompt,
        negative_prompt: args.negativePrompt ?? "",
        num_frames: (args.duration ?? 4) * (args.fps ?? 8),
        seed: args.seed,
      };

      // Submit generation request
      const res = await fetch(`${SF_BASE}/video/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`SiliconFlow video submit error ${res.status}: ${err}`);
      }

      const submitJson = (await res.json()) as { requestId?: string; request_id?: string };
      const requestId = submitJson.requestId ?? submitJson.request_id;
      if (!requestId) throw new Error("No requestId in SiliconFlow video response");

      // Poll for result (max 120 seconds)
      const maxAttempts = 24;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 5000));

        const pollRes = await fetch(`${SF_BASE}/video/status/${requestId}`, {
          headers: { Authorization: `Bearer ${args.apiKey}` },
        });

        if (!pollRes.ok) continue;

        const pollJson = (await pollRes.json()) as {
          status?: string;
          videos?: Array<{ url: string }>;
          url?: string;
        };

        if (pollJson.status === "Succeed" || pollJson.status === "success") {
          const url = pollJson.videos?.[0]?.url ?? pollJson.url;
          if (url) {
            await ctx.runMutation(internal.media.jobs.updateJobStatus, {
              jobId: args.jobId,
              status: "completed",
              resultUrl: url,
            });
            return;
          }
        }

        if (pollJson.status === "Failed" || pollJson.status === "failed") {
          throw new Error("SiliconFlow video generation failed");
        }
      }

      throw new Error("Video generation timed out after 120 seconds");
    } catch (err) {
      await ctx.runMutation(internal.media.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  },
});

// ── Poll existing video job (reschedule from client) ─────────────────────────
export const pollVideoJob = internalAction({
  args: {
    jobId: v.id("mediaJobs"),
    apiKey: v.string(),
    requestId: v.string(),
    attempts: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const pollRes = await fetch(`${SF_BASE}/video/status/${args.requestId}`, {
      headers: { Authorization: `Bearer ${args.apiKey}` },
    });

    if (!pollRes.ok) return;

    const pollJson = (await pollRes.json()) as {
      status?: string;
      videos?: Array<{ url: string }>;
      url?: string;
    };

    if (pollJson.status === "Succeed" || pollJson.status === "success") {
      const url = pollJson.videos?.[0]?.url ?? pollJson.url;
      if (url) {
        await ctx.runMutation(internal.media.jobs.updateJobStatus, {
          jobId: args.jobId,
          status: "completed",
          resultUrl: url,
        });
      }
    } else if (pollJson.status === "Failed" || pollJson.status === "failed") {
      await ctx.runMutation(internal.media.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        errorMessage: "SiliconFlow video generation failed",
      });
    } else if (args.attempts < 24) {
      // Schedule another poll in 5 seconds
      await ctx.scheduler.runAfter(5000, internal.media.siliconflow.pollVideoJob, {
        jobId: args.jobId,
        apiKey: args.apiKey,
        requestId: args.requestId,
        attempts: args.attempts + 1,
      });
    } else {
      await ctx.runMutation(internal.media.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "failed",
        errorMessage: "Video generation timed out",
      });
    }
  },
});
