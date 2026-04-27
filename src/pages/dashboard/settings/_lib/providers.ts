// Provider metadata for the settings UI

export type ProviderCategory = "chat" | "image" | "video";

export type Provider = {
  id: string;
  name: string;
  logo: string;        // emoji fallback
  badge?: string;      // "Recommended" | "Your default" etc.
  models?: { id: string; label: string; desc?: string }[];
  apiKeyLabel?: string;
  apiKeyLink?: string;
  apiKeyHint?: string;
  usesSharedSiliconflow?: boolean;
};

export const CHAT_PROVIDERS: Provider[] = [
  {
    id: "hercules",
    name: "Hercules AI Gateway",
    logo: "⚡",
    badge: "Built-in",
    models: [
      { id: "openai/gpt-5", label: "GPT-5", desc: "Best quality" },
      { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Fast & cheap" },
      { id: "anthropic/claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", desc: "Great reasoning" },
    ],
    apiKeyHint: "No API key needed — uses your Hercules Cloud credits.",
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "🤖",
    models: [
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-5-mini", label: "GPT-5 Mini" },
      { id: "gpt-4o", label: "GPT-4o" },
    ],
    apiKeyLabel: "OpenAI API Key",
    apiKeyLink: "https://platform.openai.com/api-keys",
    apiKeyHint: "Get your API key from platform.openai.com",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    logo: "🧠",
    models: [
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
      { id: "claude-opus-4-5", label: "Claude Opus 4.5", desc: "Most powerful" },
      { id: "claude-haiku-3-5", label: "Claude Haiku 3.5", desc: "Fastest" },
    ],
    apiKeyLabel: "Anthropic API Key",
    apiKeyLink: "https://console.anthropic.com/settings/keys",
    apiKeyHint: "Get your API key from console.anthropic.com",
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    logo: "🌊",
    badge: "Recommended",
    models: [
      { id: "Qwen/Qwen3-235B-A22B", label: "Qwen3 235B", desc: "Best quality" },
      { id: "Qwen/Qwen3-30B-A3B", label: "Qwen3 30B", desc: "Balanced" },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3" },
    ],
    apiKeyLabel: "SiliconFlow API Key",
    apiKeyLink: "https://cloud.siliconflow.cn/account/ak",
    apiKeyHint: "Get your API key from cloud.siliconflow.cn",
    usesSharedSiliconflow: true,
  },
];

export const IMAGE_PROVIDERS: Provider[] = [
  {
    id: "siliconflow",
    name: "SiliconFlow",
    logo: "🌊",
    badge: "Recommended",
    models: [
      { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell", desc: "Fast generation" },
      { id: "black-forest-labs/FLUX.1-dev", label: "FLUX.1 Dev", desc: "High quality" },
      { id: "stabilityai/stable-diffusion-3-5-large", label: "SD 3.5 Large" },
    ],
    apiKeyLabel: "SiliconFlow API Key",
    apiKeyLink: "https://cloud.siliconflow.cn/account/ak",
    usesSharedSiliconflow: true,
  },
  {
    id: "openai",
    name: "OpenAI DALL-E",
    logo: "🎨",
    models: [
      { id: "dall-e-3", label: "DALL-E 3", desc: "Best quality" },
      { id: "dall-e-2", label: "DALL-E 2" },
    ],
    apiKeyLabel: "OpenAI API Key",
    apiKeyLink: "https://platform.openai.com/api-keys",
  },
  {
    id: "stability",
    name: "Stability AI",
    logo: "🖼️",
    models: [
      { id: "sd3.5-large", label: "Stable Diffusion 3.5" },
      { id: "sd3-medium", label: "SD 3 Medium", desc: "Balanced" },
    ],
    apiKeyLabel: "Stability API Key",
    apiKeyLink: "https://platform.stability.ai/account/keys",
  },
  {
    id: "replicate",
    name: "Replicate",
    logo: "🔁",
    models: [
      { id: "flux-1.1-pro", label: "FLUX 1.1 Pro" },
      { id: "flux-schnell", label: "FLUX Schnell" },
    ],
    apiKeyLabel: "Replicate API Token",
    apiKeyLink: "https://replicate.com/account/api-tokens",
  },
];

export const VIDEO_PROVIDERS: Provider[] = [
  {
    id: "siliconflow",
    name: "SiliconFlow",
    logo: "🌊",
    badge: "Recommended",
    models: [
      { id: "Wan-AI/Wan2.1-I2V-14B-720P", label: "Wan2.1 I2V 720P", desc: "Image to video" },
      { id: "Wan-AI/Wan2.1-T2V-14B", label: "Wan2.1 T2V", desc: "Text to video" },
    ],
    apiKeyLabel: "SiliconFlow API Key",
    apiKeyLink: "https://cloud.siliconflow.cn/account/ak",
    usesSharedSiliconflow: true,
  },
  {
    id: "runway",
    name: "RunwayML",
    logo: "🎬",
    models: [
      { id: "gen4_turbo", label: "Gen-4 Turbo", desc: "Best quality" },
      { id: "gen3a_turbo", label: "Gen-3 Alpha Turbo" },
    ],
    apiKeyLabel: "Runway API Key",
    apiKeyLink: "https://app.runwayml.com/settings",
  },
  {
    id: "kling",
    name: "Kling AI",
    logo: "✨",
    models: [
      { id: "kling-v2-master", label: "Kling v2 Master", desc: "Top quality" },
      { id: "kling-v1.6-pro", label: "Kling v1.6 Pro" },
    ],
    apiKeyLabel: "Kling API Key",
    apiKeyLink: "https://klingai.com",
  },
  {
    id: "pika",
    name: "Pika",
    logo: "⚡",
    models: [
      { id: "pika-2.2", label: "Pika 2.2" },
      { id: "pika-2.1", label: "Pika 2.1" },
    ],
    apiKeyLabel: "Pika API Key",
    apiKeyLink: "https://pika.art",
  },
];
