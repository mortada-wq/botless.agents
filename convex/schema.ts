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
