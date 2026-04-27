// Shared types for agent builder
export type AgentFormData = {
  name: string;
  agentType: string;
  industry: string;
  tagline: string;
  description: string;
  tone: string;
  welcomeMessage: string;
  instructions: string;
  knowledgeText: string;
  avatarUrl: string;
};

export const AGENT_TYPES = [
  { id: "customer_support", label: "Customer Support", desc: "Answer questions 24/7", icon: "💬" },
  { id: "sales", label: "Sales & Lead Gen", desc: "Qualify and convert leads", icon: "🎯" },
  { id: "onboarding", label: "User Onboarding", desc: "Guide new users through setup", icon: "🧭" },
  { id: "product", label: "Product Assistant", desc: "Help users navigate your product", icon: "🛠️" },
  { id: "marketing", label: "Marketing Agent", desc: "Content and campaign support", icon: "📣" },
  { id: "custom", label: "Custom Agent", desc: "Build anything you imagine", icon: "🤖" },
] as const;

export const INDUSTRIES = [
  "E-commerce", "SaaS / Tech", "Healthcare", "Finance", "Education",
  "Real Estate", "Beauty & Wellness", "Travel", "Food & Beverage", "Other",
];

export const TONES = [
  { id: "friendly", label: "Friendly", desc: "Warm, approachable, helpful", emoji: "😊" },
  { id: "professional", label: "Professional", desc: "Formal, precise, trustworthy", emoji: "👔" },
  { id: "casual", label: "Casual", desc: "Relaxed, conversational, fun", emoji: "🙌" },
  { id: "witty", label: "Witty", desc: "Clever, humorous, engaging", emoji: "😄" },
  { id: "empathetic", label: "Empathetic", desc: "Caring, patient, understanding", emoji: "🤝" },
] as const;

export const BUILDER_STEPS = [
  { id: "type", label: "Type" },
  { id: "identity", label: "Identity" },
  { id: "personality", label: "Personality" },
  { id: "knowledge", label: "Knowledge" },
  { id: "review", label: "Review" },
] as const;
