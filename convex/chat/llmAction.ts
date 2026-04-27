"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import OpenAI from "openai";

export const sendMessage = action({
  args: {
    sessionId: v.id("chatSessions"),
    userMessageId: v.id("chatMessages"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<void> => {
    // Load agent config
    const agent = await ctx.runQuery(internal.chat.llmAction_helpers.getAgentAndSettings, {
      agentId: args.agentId,
    });

    if (!agent) {
      await ctx.runMutation(internal.chat.messages.createAssistantPlaceholder, {
        sessionId: args.sessionId,
      });
      return;
    }

    // Create assistant placeholder
    const assistantMsgId = await ctx.runMutation(
      internal.chat.messages.createAssistantPlaceholder,
      { sessionId: args.sessionId }
    );

    // Gather message history
    const history = await ctx.runQuery(internal.chat.llmAction_helpers.getMessageHistory, {
      sessionId: args.sessionId,
    });

    // Build system prompt from agent
    const systemPrompt = [
      agent.instructions ?? `You are ${agent.name}, a helpful AI assistant.`,
      agent.tone ? `Tone: ${agent.tone}.` : "",
      agent.knowledgeText ? `Knowledge base:\n${agent.knowledgeText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Determine API key and base URL
    const { chatProvider, chatApiKey, chatModel, siliconflowApiKey } = agent.settings;
    let baseURL: string | undefined;
    let apiKey: string;
    let model: string;

    if (chatProvider === "siliconflow") {
      baseURL = "https://api.siliconflow.cn/v1";
      apiKey = siliconflowApiKey ?? chatApiKey ?? "";
      model = chatModel ?? "Qwen/Qwen2.5-7B-Instruct";
    } else {
      // Default: Hercules AI Gateway
      baseURL = "http://ai-gateway.hercules.app/v1";
      apiKey = process.env.HERCULES_API_KEY ?? "";
      model = chatModel ?? "openai/gpt-5-mini";
    }

    const openai = new OpenAI({ baseURL, apiKey });

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const stream = await openai.chat.completions.create({
        model,
        messages,
        stream: true,
        max_tokens: 1024,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          fullContent += delta;
          await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
            messageId: assistantMsgId,
            content: fullContent,
            isStreaming: true,
          });
        }
      }

      // Finalize
      await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
        messageId: assistantMsgId,
        content: fullContent || "I'm sorry, I couldn't generate a response.",
        isStreaming: false,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
        messageId: assistantMsgId,
        content: `Sorry, I encountered an error: ${errMsg}`,
        isStreaming: false,
      });
    }
  },
});
