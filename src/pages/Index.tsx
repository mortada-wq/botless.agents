import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Upload, ArrowRight, Sparkles, MessageCircle, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Unauthenticated, Authenticated } from "convex/react";
import { cn } from "@/lib/utils.ts";

// Pre-made agent showcase cards
const AGENT_CARDS = [
  {
    id: 1,
    name: "Aurora",
    role: "Beauty & Skincare",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aurora&backgroundColor=b6e3f4",
    lastMessage: "Your glow routine starts here ✨",
    online: true,
    color: "#0A9396",
  },
  {
    id: 2,
    name: "Max",
    role: "Tech Support",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Max&backgroundColor=c0aede",
    lastMessage: "I can debug that for you right now",
    online: true,
    color: "#667eea",
  },
  {
    id: 3,
    name: "Sage",
    role: "HR & Onboarding",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sage&backgroundColor=d1f4d1",
    lastMessage: "Welcome to the team! Let's get started",
    online: false,
    color: "#48bb78",
  },
  {
    id: 4,
    name: "Zara",
    role: "Sales & Outreach",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Zara&backgroundColor=ffd5dc",
    lastMessage: "Found 3 leads matching your ICP today",
    online: true,
    color: "#ed8936",
  },
];

function AgentCard({ agent, index }: { agent: typeof AGENT_CARDS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1, duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer group"
    >
      {/* Spotlight glow */}
      <div
        className={cn(
          "absolute -inset-px rounded-xl transition-opacity duration-300",
          hovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(200px circle at 50% 0%, ${agent.color}33, transparent)`,
          border: `1px solid ${agent.color}44`,
        }}
      />
      <div className="relative bg-card border border-border rounded-xl p-4 flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-11 h-11 rounded-full bg-secondary object-cover"
          />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
              agent.online ? "bg-green-400" : "bg-muted-foreground"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
            <span className="text-[10px] text-muted-foreground">{agent.online ? "Active now" : "2h ago"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">{agent.role}</p>
          <div className="flex items-center gap-1.5">
            {/* Typing indicator */}
            {agent.online && (
              <div className="flex gap-0.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate italic">{agent.lastMessage}</p>
          </div>
        </div>
        <button
          className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: `${agent.color}22`, color: agent.color }}
        >
          Chat
        </button>
      </div>
    </motion.div>
  );
}

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn("absolute rounded-full blur-3xl pointer-events-none", className)}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        scale: [1, 1.05, 1],
      }}
      transition={{
        repeat: Infinity,
        duration: 8,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Index() {
  const [dragOver, setDragOver] = useState(false);
  const [prompt, setPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex flex-col">
      {/* Animated background orbs */}
      <FloatingOrb className="w-96 h-96 bg-primary/20 top-[-10%] left-[-5%]" delay={0} />
      <FloatingOrb className="w-80 h-80 bg-purple-600/15 bottom-[10%] right-[-5%]" delay={3} />
      <FloatingOrb className="w-64 h-64 bg-blue-600/10 top-[40%] left-[60%]" delay={1.5} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Botless</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <Link to="/marketplace" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Marketplace
          </Link>
          <Unauthenticated>
            <SignInButton className="text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer" />
          </Unauthenticated>
          <Authenticated>
            <Link to="/dashboard">
              <Button size="sm" className="bg-primary hover:bg-primary/90 cursor-pointer">
                Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Authenticated>
        </motion.div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 gap-12">
        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-center max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI Agents for Every Business</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance mb-4">
            Build your AI agent
            <span className="text-primary"> in minutes</span>
          </h1>
          <p className="text-lg text-muted-foreground text-balance max-w-xl mx-auto">
            Drop a product image or describe your agent — we handle the rest. Video avatars, voice, and intelligent conversations powered by your choice of AI.
          </p>
        </motion.div>

        {/* Upload / prompt hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-6 bg-card/50 backdrop-blur-sm",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            {/* Drop zone icon area */}
            <div
              className="flex flex-col items-center gap-2 mb-4 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                dragOver ? "bg-primary/20" : "bg-secondary"
              )}>
                <Upload className={cn("w-5 h-5", dragOver ? "text-primary" : "text-muted-foreground")} />
              </div>
              <p className="text-sm text-muted-foreground">
                {dragOver ? "Drop your image here" : "Drag & drop a product image"}
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" />

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or describe your agent</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Prompt input */}
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A friendly customer support agent for my skincare brand..."
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
              />
              <Button
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 cursor-pointer shrink-0"
                onClick={() => { /* Coming soon */ }}
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Agent showcase cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="w-full max-w-2xl"
        >
          <p className="text-center text-xs text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" />
            Live agents from the marketplace
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENT_CARDS.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} />
            ))}
          </div>

          {/* Marketplace CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center mt-6"
          >
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              or browse marketplace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
