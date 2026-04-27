import { type AgentFormData } from "../_lib/agent-types.ts";
import { BookOpen, HelpCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  data: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
};

type FAQ = { question: string; answer: string };

export default function StepKnowledge({ data, onChange }: Props) {
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: "", answer: "" }]);

  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: keyof FAQ, value: string) => {
    const updated = faqs.map((faq, idx) => idx === i ? { ...faq, [field]: value } : faq);
    setFaqs(updated);
    // Store FAQs as part of knowledgeText as a simple format
    const faqText = updated
      .filter((f) => f.question.trim())
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");
    onChange({ knowledgeText: [data.knowledgeText?.split("---FAQs---")[0]?.trim(), faqText ? `---FAQs---\n${faqText}` : ""].filter(Boolean).join("\n\n") });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Add knowledge to your agent</h2>
        <p className="text-sm text-muted-foreground mt-1">The more context you give, the smarter your agent becomes.</p>
      </div>

      {/* Text knowledge */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-foreground">Knowledge base</label>
        </div>
        <p className="text-xs text-muted-foreground">Paste your product info, company policies, FAQs, or any context you want the agent to know.</p>
        <textarea
          value={data.knowledgeText?.split("---FAQs---")[0]?.trim() ?? ""}
          onChange={(e) => {
            const faqPart = data.knowledgeText?.includes("---FAQs---") ? "\n\n" + data.knowledgeText.split("---FAQs---")[1] : "";
            onChange({ knowledgeText: e.target.value + faqPart });
          }}
          rows={6}
          placeholder="e.g. GlowSkin is a premium skincare brand founded in 2020. We specialize in natural, vegan-friendly products. Our bestsellers are the Hydra Serum ($49) and Vitamin C Glow Mask ($35). We ship worldwide. Return policy: 30 days..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors resize-none"
        />
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium text-foreground">FAQ pairs <span className="text-muted-foreground font-normal">(optional)</span></label>
          </div>
          <button
            onClick={addFaq}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </button>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-secondary/50 border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">FAQ #{i + 1}</span>
                {faqs.length > 1 && (
                  <button
                    onClick={() => removeFaq(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                value={faq.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
                placeholder="Question: e.g. What's your return policy?"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
              />
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(i, "answer", e.target.value)}
                rows={2}
                placeholder="Answer: e.g. We offer free returns within 30 days of purchase..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors resize-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
