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
    agentType: v.string(), // customer_support | sales | onboarding | product | marketing | custom
    industry: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    // Visual
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.string()),
    // Personality
    tone: v.optional(v.string()), // friendly | professional | casual | witty | empathetic
    welcomeMessage: v.optional(v.string()),
    instructions: v.optional(v.string()),
    // Knowledge
    knowledgeText: v.optional(v.string()),
    // Status
    status: v.string(), // draft | active | paused
    visibility: v.string(), // private | public
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  faqs: defineTable({
    agentId: v.id("agents"),
    question: v.string(),
    answer: v.string(),
  }).index("by_agent", ["agentId"]),
});
