import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { Bot, Building2, Briefcase, Zap, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

const ROLES = [
  { id: "founder", label: "Founder / CEO", icon: "🚀" },
  { id: "marketer", label: "Marketer", icon: "📣" },
  { id: "developer", label: "Developer", icon: "💻" },
  { id: "support", label: "Support Lead", icon: "🎧" },
  { id: "sales", label: "Sales", icon: "📈" },
  { id: "other", label: "Other", icon: "✨" },
];

const USE_CASES = [
  { id: "customer_support", label: "Customer Support", desc: "Answer questions 24/7", icon: "💬" },
  { id: "sales", label: "Sales & Lead Gen", desc: "Qualify and convert leads", icon: "🎯" },
  { id: "onboarding", label: "User Onboarding", desc: "Guide new users", icon: "🧭" },
  { id: "product", label: "Product Assistant", desc: "Help users navigate your product", icon: "🛠️" },
  { id: "marketing", label: "Marketing Agent", desc: "Content and campaigns", icon: "📣" },
  { id: "custom", label: "Custom Agent", desc: "Build anything you imagine", icon: "🤖" },
];

const STEPS = ["Welcome", "Your Role", "Use Case", "Company"];

export default function Onboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const canNext =
    (step === 0) ||
    (step === 1 && role) ||
    (step === 2 && useCase) ||
    (step === 3 && companyName.trim().length > 0);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({ companyName, role, useCase });
      toast.success("Welcome to Botless!");
      navigate("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-10"
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground">Botless</span>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                i < step ? "bg-primary text-white" :
                i === step ? "bg-primary/20 border border-primary text-primary" :
                "bg-secondary text-muted-foreground"
              )}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-px transition-colors duration-300", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Welcome to Botless</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  You're about to build AI agents powered by video, voice, and intelligence. Let's personalize your experience in under a minute.
                </p>
              </div>
            )}

            {/* Step 1: Role */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">What's your role?</h2>
                  <p className="text-sm text-muted-foreground mt-1">We'll tailor your experience to fit.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
                        role === r.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground"
                      )}
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Use case */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">What will your agent do?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Pick your primary use case.</p>
                </div>
                <div className="space-y-2">
                  {USE_CASES.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setUseCase(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                        useCase === u.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/50 hover:border-border/80"
                      )}
                    >
                      <span className="text-xl">{u.icon}</span>
                      <div>
                        <p className={cn("text-sm font-medium", useCase === u.id ? "text-foreground" : "text-foreground/80")}>{u.label}</p>
                        <p className="text-xs text-muted-foreground">{u.desc}</p>
                      </div>
                      {useCase === u.id && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Company */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">What's your company name?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your agents will represent this brand.</p>
                </div>
                <input
                  autoFocus
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && canNext && handleFinish()}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6 w-full max-w-md">
        {step > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            className="flex-1 cursor-pointer"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!canNext || loading}
            className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer"
          >
            {loading ? "Setting up..." : "Launch Botless"} <Zap className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
