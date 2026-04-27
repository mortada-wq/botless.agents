import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { Bot, ChevronLeft, ChevronRight, Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { BUILDER_STEPS, type AgentFormData } from "../_lib/agent-types.ts";
import StepType from "../_components/step-type.tsx";
import StepIdentity from "../_components/step-identity.tsx";
import StepPersonality from "../_components/step-personality.tsx";
import StepKnowledge from "../_components/step-knowledge.tsx";
import StepReview from "../_components/step-review.tsx";

const DEFAULT_FORM: AgentFormData = {
  name: "",
  agentType: "",
  industry: "",
  tagline: "",
  description: "",
  tone: "",
  welcomeMessage: "",
  instructions: "",
  knowledgeText: "",
  avatarUrl: "",
};

function canAdvance(step: number, data: AgentFormData): boolean {
  if (step === 0) return !!data.agentType;
  if (step === 1) return !!data.name.trim();
  if (step === 2) return !!data.tone && !!data.welcomeMessage.trim();
  return true;
}

export default function NewAgentPage() {
  const navigate = useNavigate();
  const createAgent = useMutation(api.agents.createAgent);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AgentFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const update = (updates: Partial<AgentFormData>) => setForm((prev: AgentFormData) => ({ ...prev, ...updates }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      const agentId = await createAgent({
        name: form.name,
        agentType: form.agentType,
        industry: form.industry || undefined,
        tagline: form.tagline || undefined,
        description: form.description || undefined,
        tone: form.tone || undefined,
        welcomeMessage: form.welcomeMessage || undefined,
        instructions: form.instructions || undefined,
        knowledgeText: form.knowledgeText || undefined,
        avatarUrl: form.avatarUrl || undefined,
      });
      toast.success(`${form.name} is live!`);
      navigate(`/dashboard/agents`);
    } catch {
      toast.error("Failed to create agent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLast = step === BUILDER_STEPS.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/agents")}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">New Agent</h1>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {(BUILDER_STEPS as readonly { id: string; label: string }[]).map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-all",
                i < step ? "text-primary cursor-pointer" : i === step ? "text-foreground" : "text-muted-foreground cursor-default"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                i < step ? "bg-primary text-white" :
                i === step ? "bg-primary/20 border border-primary text-primary" :
                "bg-secondary text-muted-foreground"
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < BUILDER_STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-1 transition-colors", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-2xl p-6 min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {step === 0 && <StepType data={form} onChange={update} />}
            {step === 1 && <StepIdentity data={form} onChange={update} />}
            {step === 2 && <StepPersonality data={form} onChange={update} />}
            {step === 3 && <StepKnowledge data={form} onChange={update} />}
            {step === 4 && <StepReview data={form} onGoToStep={setStep} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            disabled={loading}
            className="cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        <div className="flex-1" />
        {!isLast ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance(step, form)}
            className="bg-primary hover:bg-primary/90 cursor-pointer"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 cursor-pointer gap-2"
          >
            {loading ? "Creating..." : <>Launch Agent <Rocket className="w-4 h-4" /></>}
          </Button>
        )}
      </div>
    </div>
  );
}
