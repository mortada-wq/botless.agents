"use node";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type ChatSettingsSlice = {
  chatProvider: string;
  chatApiKey?: string;
  chatModel?: string;
  siliconflowApiKey?: string;
};

/** Resolve credentials; treats legacy `hercules` as OpenAI-compatible. */
export function resolveChatRuntime(settings: ChatSettingsSlice): {
  mode: "openai-compat";
  baseURL: string;
  apiKey: string;
  model: string;
} | {
  mode: "anthropic";
  apiKey: string;
  model: string;
} {
  const { chatProvider, chatApiKey, chatModel, siliconflowApiKey } = settings;

  if (chatProvider === "siliconflow") {
    return {
      mode: "openai-compat",
      baseURL: "https://api.siliconflow.cn/v1",
      apiKey: siliconflowApiKey ?? chatApiKey ?? "",
      model: chatModel ?? "Qwen/Qwen2.5-7B-Instruct",
    };
  }

  if (chatProvider === "anthropic") {
    return {
      mode: "anthropic",
      apiKey: chatApiKey ?? "",
      model: chatModel ?? "claude-sonnet-4-5-20250929",
    };
  }

  // openai, legacy hercules, or default
  return {
    mode: "openai-compat",
    baseURL: "https://api.openai.com/v1",
    apiKey: chatApiKey ?? process.env.OPENAI_API_KEY ?? "",
    model: chatModel ?? "gpt-4o-mini",
  };
}

export async function streamOpenAiStyle(args: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  runtime: Extract<ReturnType<typeof resolveChatRuntime>, { mode: "openai-compat" }>;
  onDelta: (fullContent: string) => Promise<void>;
}): Promise<string> {
  const { systemPrompt, history, runtime, onDelta } = args;
  const openai = new OpenAI({
    baseURL: runtime.baseURL,
    apiKey: runtime.apiKey,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: runtime.model,
    messages,
    stream: true,
    max_tokens: 1024,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullContent += delta;
      await onDelta(fullContent);
    }
  }
  return fullContent;
}

export async function streamAnthropicStyle(args: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  runtime: Extract<ReturnType<typeof resolveChatRuntime>, { mode: "anthropic" }>;
  onDelta: (fullContent: string) => Promise<void>;
}): Promise<string> {
  const { systemPrompt, history, runtime, onDelta } = args;
  const client = new Anthropic({ apiKey: runtime.apiKey });

  const messages = history.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  const stream = await client.messages.stream({
    model: runtime.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  let fullContent = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullContent += event.delta.text;
      await onDelta(fullContent);
    }
  }
  return fullContent;
}
