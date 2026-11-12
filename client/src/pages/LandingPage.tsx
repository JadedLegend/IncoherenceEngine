import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ShieldAlert, ArrowRight, ExternalLink, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface LandingPageProps {
  onEnter: (apiKey: string) => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [step, setStep] = useState<"welcome" | "setup">("welcome");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter your OpenRouter API key to initialize the engine.");
      return;
    }

    localStorage.setItem("openrouter_api_key", apiKey.trim());
    onEnter(apiKey.trim());
    toast.success("OpenRouter credentials loaded. Initializing diagnostic mirror.");
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Background Subtle Textures */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,154,42,0.03),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-xl w-full border border-border/40 bg-card/20 backdrop-blur-md p-8 sm:p-10 relative z-10 flex flex-col gap-6 -mt-8">
          {/* Header Branding */}
          <div className="text-center flex flex-col gap-2">
            <span className="font-mono text-xs tracking-[0.25em] text-primary/80 uppercase">
              Diagnostic Mirror
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-wider uppercase font-medium">
              Incoherence Engine
            </h1>
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#c49a2a] uppercase">
              MIRRORED ACTUALITY
            </span>
            <div className="h-[1px] w-12 bg-primary/40 mx-auto my-1" />
          </div>

          {/* Conceptual Copy */}
          <div className="font-sans text-xs leading-relaxed text-muted-foreground text-center flex flex-col gap-3 max-w-md mx-auto">
            <p>
              AI systems are being scaled as if they understand. They don't. They produce output that looks like understanding — fluent, confident, structurally plausible — but with no mechanism for distinguishing what's real from what sounds right.
            </p>
            <p>
              This isn't a technical curiosity. It's a structural risk. The better they get at performing, the harder the gap becomes to see.
            </p>
            <p className="font-mono text-[10px] text-primary/60 uppercase">
              What follows is not an argument about this. It is a direct encounter with it.
            </p>
          </div>

          {/* Path 1: Free Version Info Button */}
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={() => setStep("setup")}
              className="w-full font-serif text-sm tracking-widest uppercase py-6 border border-[#c49a2a]/40 bg-[#c49a2a]/5 hover:bg-[#c49a2a]/15 text-[#c49a2a] hover:text-[#c49a2a] active:scale-[0.98] transition-all"
            >
              Free Version
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Path 2: Direct Key Entry (Enter the Mirror) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border/10 pt-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-sm font-bold tracking-wider text-[#00ff66] uppercase flex items-center justify-center gap-2.5">
                <KeyRound className="w-4 h-4 text-[#00ff66]" />
                Enter the Mirror
                <KeyRound className="w-4 h-4 text-[#00ff66]" />
              </label>
              <Input
                type="password"
                placeholder="PASTE OPENROUTER API KEY (sk-or-...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs tracking-widest bg-background/50 border-border/40 focus:border-[#00ff66]/80 focus:ring-1 focus:ring-[#00ff66]/40 h-11 text-center"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-serif text-xs tracking-widest uppercase py-5 border border-[#c49a2a]/40 bg-[#c49a2a]/5 hover:bg-[#c49a2a]/15 text-[#c49a2a] hover:text-[#c49a2a] active:scale-[0.98] transition-all"
            >
              Enter In
            </Button>
          </form>

          {/* Footer Warning / Disclaimer */}
          <div className="flex gap-3 border-t border-border/10 pt-4">
            <ShieldAlert className="w-5 h-5 text-destructive/60 flex-shrink-0 mt-0.5" />
            <p className="font-mono text-[9px] text-muted-foreground/50 leading-relaxed uppercase">
              WARNING: This interface will annotate conversational failure modes in real time. The critique itself is generated by AI and is subject to the recursive failures it identifies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Subtle Textures */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,154,42,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-xl w-full border border-border/40 bg-card/20 backdrop-blur-md p-8 sm:p-12 relative z-10 flex flex-col gap-8">
        {/* Back Navigation */}
        <button
          onClick={() => setStep("welcome")}
          className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* Header Branding */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase">
            Setup Credentials
          </span>
          <h2 className="font-serif text-2xl tracking-wider uppercase font-medium">
            OpenRouter Configuration
          </h2>
          <div className="font-sans text-xs text-muted-foreground leading-relaxed flex flex-col gap-2">
            <p>
              Welcome to the <strong className="text-foreground font-semibold">Free Version</strong>. To be absolutely clear: <strong className="text-foreground font-semibold">there is nothing simulated about this version.</strong>
            </p>
            <p>
              You will be interacting with 100% real, active AI models (like Google's Gemini, Meta's Llama, and Qwen) performing genuine, high-level structural critiques of each other. 
            </p>
            <p>
              OpenRouter generously hosts these models completely for free. We just need your free API key to let your browser make these direct calls.
            </p>
          </div>
        </div>

        {/* Step-by-Step Guide to Free OpenRouter Access */}
        <div className="border border-border/20 bg-black/10 p-5 flex flex-col gap-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-primary">
            Step-by-Step Instructions:
          </span>
          <ol className="font-mono text-[11px] text-muted-foreground/80 leading-relaxed list-decimal list-inside flex flex-col gap-3 uppercase">
            <li>
              Go to{" "}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold inline-flex items-center gap-1"
              >
                OpenRouter.com
                <ExternalLink className="w-3 h-3" />
              </a>{" "}
              and sign up for a free account.
            </li>
            <li>
              Open your{" "}
              <a
                href="https://openrouter.ai/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-bold inline-flex items-center gap-1"
              >
                API keys page
                <ExternalLink className="w-3 h-3" />
              </a>
              , create a new key, and name it (e.g., "Incoherence Engine").{" "}
              <strong className="text-foreground">No credit card is required.</strong>
            </li>
            <li>
              Copy the key (it starts with <code className="text-foreground">sk-or-...</code>) and paste it below.
            </li>
          </ol>
        </div>

        {/* Key entry right here, so nobody has to go back a screen */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="font-mono text-[10px] tracking-widest uppercase text-[#00ff66] flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            Paste your key
          </label>
          <Input
            type="password"
            placeholder="PASTE OPENROUTER API KEY (sk-or-...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            className="font-mono text-xs tracking-widest bg-background/50 border-border/40 focus:border-[#00ff66]/80 focus:ring-1 focus:ring-[#00ff66]/40 h-11 text-center"
          />
          <Button
            type="submit"
            className="w-full font-serif text-xs tracking-widest uppercase py-5 border border-[#c49a2a]/40 bg-[#c49a2a]/5 hover:bg-[#c49a2a]/15 text-[#c49a2a] hover:text-[#c49a2a] active:scale-[0.98] transition-all"
          >
            Enter In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
