import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    companyName: v.optional(v.string()),
    role: v.optional(v.string()),
    useCase: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  agents: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    agentType: v.string(),
    industry: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.string()),
    tone: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    instructions: v.optional(v.string()),
    knowledgeText: v.optional(v.string()),
    status: v.string(),
    visibility: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  faqs: defineTable({
    agentId: v.id("agents"),
    question: v.string(),
    answer: v.string(),
  }).index("by_agent", ["agentId"]),

  // Media generation jobs (image/video via SiliconFlow or other providers)
  mediaJobs: defineTable({
    userId: v.id("users"),
    agentId: v.optional(v.id("agents")),
    type: v.union(v.literal("image"), v.literal("video")),
    provider: v.string(),
    model: v.string(),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    // Image params
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    steps: v.optional(v.number()),
    seed: v.optional(v.number()),
    // Video params
    duration: v.optional(v.number()),
    fps: v.optional(v.number()),
    // Output
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    resultUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    // Cost tracking (in credits/tokens)
    estimatedCost: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Per-user AI provider configuration
  providerSettings: defineTable({
    userId: v.id("users"),
    // Chat / LLM
    chatProvider: v.string(),
    chatModel: v.optional(v.string()),
    chatApiKey: v.optional(v.string()),
    // Image generation
    imageProvider: v.string(),
    imageModel: v.optional(v.string()),
    imageApiKey: v.optional(v.string()),
    // Video generation
    videoProvider: v.string(),
    videoModel: v.optional(v.string()),
    videoApiKey: v.optional(v.string()),
    // SiliconFlow shared key
    siliconflowApiKey: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
