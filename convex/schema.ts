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
    // Marketplace fields
    tags: v.optional(v.array(v.string())),
    likeCount: v.optional(v.number()),
    cloneCount: v.optional(v.number()),
    publishedAt: v.optional(v.string()), // ISO 8601
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"]),

  // Likes tracking (prevents duplicate likes)
  agentLikes: defineTable({
    agentId: v.id("agents"),
    userId: v.id("users"),
  })
    .index("by_agent", ["agentId"])
    .index("by_user_and_agent", ["userId", "agentId"]),

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

  // Public (guest) chat sessions — no auth required, identified by guestId
  publicChatSessions: defineTable({
    agentId: v.id("agents"),
    guestId: v.string(), // random UUID stored in localStorage
    lastMessageAt: v.string(),
  })
    .index("by_agent_and_guest", ["agentId", "guestId"]),

  // Public chat messages
  publicChatMessages: defineTable({
    sessionId: v.id("publicChatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    isStreaming: v.optional(v.boolean()),
  }).index("by_session", ["sessionId"]),

  // Chat sessions (one per user+agent conversation)
  chatSessions: defineTable({
    userId: v.id("users"),
    agentId: v.id("agents"),
    title: v.string(),
    lastMessageAt: v.string(), // ISO 8601
  })
    .index("by_user", ["userId"])
    .index("by_user_and_agent", ["userId", "agentId"]),

  // Chat messages
  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    // For streaming partial content
    isStreaming: v.optional(v.boolean()),
  }).index("by_session", ["sessionId"]),

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

  // Characters with emotional state video clips
  characters: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.string()),
  }).index("by_owner", ["ownerId"]),

  // Emotional state clips per character (webm / gif / lottie)
  emotionalStates: defineTable({
    characterId: v.id("characters"),
    ownerId: v.id("users"),
    emotion: v.string(), // e.g. "happy", "sad", "angry", "surprised"
    label: v.optional(v.string()),
    // Original uploaded asset
    storageId: v.optional(v.id("_storage")),
    originalUrl: v.optional(v.string()),
    // Processed lightweight output
    processedUrl: v.optional(v.string()),
    processedFormat: v.optional(v.union(v.literal("webm"), v.literal("gif"), v.literal("lottie"), v.literal("original"))),
    processingStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("done"), v.literal("failed")),
    processingError: v.optional(v.string()),
    // Thumbnail for preview
    thumbnailUrl: v.optional(v.string()),
    // Is this the default clip used in chat?
    isDefault: v.optional(v.boolean()),
  })
    .index("by_character", ["characterId"])
    .index("by_owner", ["ownerId"]),

  // Knowledge base files attached to an agent
  knowledgeFiles: defineTable({
    agentId: v.id("agents"),
    ownerId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(), // MIME type
    fileSize: v.number(), // bytes
    extractedText: v.optional(v.string()), // plain-text content extracted from file
  })
    .index("by_agent", ["agentId"])
    .index("by_owner", ["ownerId"]),

  // Server-side processing pipeline jobs
  pipelineJobs: defineTable({
    ownerId: v.id("users"),
    // Source: either an emotionalState or a standalone mediaJob
    emotionalStateId: v.optional(v.id("emotionalStates")),
    mediaJobId: v.optional(v.id("mediaJobs")),
    // Job type
    jobType: v.union(
      v.literal("bg_removal"),       // Remove background from image
      v.literal("video_to_webm"),    // Convert video → WebM
      v.literal("video_to_gif"),     // Convert video → GIF
      v.literal("image_optimize")    // Compress / resize image
    ),
    // Input
    inputUrl: v.string(),
    inputStorageId: v.optional(v.id("_storage")),
    // Output
    outputUrl: v.optional(v.string()),
    outputStorageId: v.optional(v.id("_storage")),
    outputFormat: v.optional(v.string()),
    outputBytes: v.optional(v.number()),
    inputBytes: v.optional(v.number()),
    // Status
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    attempts: v.number(),
    startedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_emotional_state", ["emotionalStateId"]),
});
