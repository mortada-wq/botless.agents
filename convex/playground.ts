"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

// Test a chat provider with a single message
export const testChat = action({
  args: {
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    userMessage: v.string(),
  },
  handler: async (_ctx, args): Promise<{ reply: string; latencyMs: number; tokenCount: number }> => {
    const start = Date.now();

    const client = new OpenAI({
      apiKey: args.apiKey,
      baseURL: args.baseUrl ?? undefined,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (args.systemPrompt) {
      messages.push({ role: "system", content: args.systemPrompt });
    }
    messages.push({ role: "user", content: args.userMessage });

    const response = await client.chat.completions.create({
      model: args.model,
      messages,
      max_tokens: 512,
    });

    const reply = response.choices[0]?.message?.content ?? "(no response)";
    const tokenCount = response.usage?.total_tokens ?? 0;
    const latencyMs = Date.now() - start;

    return { reply, latencyMs, tokenCount };
  },
});

// Test image generation via SiliconFlow or OpenAI-compatible endpoint
export const testImageGeneration = action({
  args: {
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    prompt: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<{ imageUrl: string; latencyMs: number }> => {
    const start = Date.now();

    const baseURL = args.baseUrl ?? (args.provider === "siliconflow" ? "https://api.siliconflow.cn/v1" : undefined);

    const client = new OpenAI({
      apiKey: args.apiKey,
      baseURL,
    });

    const size = `${args.width ?? 1024}x${args.height ?? 1024}` as "1024x1024";

    const response = await client.images.generate({
      model: args.model,
      prompt: args.prompt,
      n: 1,
      size,
    });

    const imageUrl = response.data?.[0]?.url ?? "";
    if (!imageUrl) throw new Error("No image URL returned");

    return { imageUrl, latencyMs: Date.now() - start };
  },
});
