"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
  resolveChatRuntime,
  streamAnthropicStyle,
  streamOpenAiStyle,
} from "./llmStreamHelpers";

export const sendMessage = action({
  args: {
    sessionId: v.id("chatSessions"),
    userMessageId: v.id("chatMessages"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<void> => {
    const agent = await ctx.runQuery(internal.chat.llmAction_helpers.getAgentAndSettings, {
      agentId: args.agentId,
    });

    if (!agent) {
      await ctx.runMutation(internal.chat.messages.createAssistantPlaceholder, {
        sessionId: args.sessionId,
      });
      return;
    }

    const assistantMsgId = await ctx.runMutation(
      internal.chat.messages.createAssistantPlaceholder,
      { sessionId: args.sessionId }
    );

    const history = await ctx.runQuery(internal.chat.llmAction_helpers.getMessageHistory, {
      sessionId: args.sessionId,
    });

    const systemPrompt = [
      agent.instructions ?? `You are ${agent.name}, a helpful AI assistant.`,
      agent.tone ? `Tone: ${agent.tone}.` : "",
      agent.knowledgeText ? `Knowledge base:\n${agent.knowledgeText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const historyForLlm = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const runtime = resolveChatRuntime(agent.settings);

    try {
      let fullContent: string;
      if (runtime.mode === "anthropic") {
        fullContent = await streamAnthropicStyle({
          systemPrompt,
          history: historyForLlm,
          runtime,
          onDelta: async (text) => {
            await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
              messageId: assistantMsgId,
              content: text,
              isStreaming: true,
            });
          },
        });
      } else {
        fullContent = await streamOpenAiStyle({
          systemPrompt,
          history: historyForLlm,
          runtime,
          onDelta: async (text) => {
            await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
              messageId: assistantMsgId,
              content: text,
              isStreaming: true,
            });
          },
        });
      }

      await ctx.runMutation(internal.chat.messages.updateAssistantMessage, {
        messageId: assistantMsgId,
        content:
          fullContent.trim() ||
          "I'm sorry, I couldn't generate a response.",
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
