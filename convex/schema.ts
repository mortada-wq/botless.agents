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
});
