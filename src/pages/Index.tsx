import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Lock, Code, Eye, Package, Layers, Terminal, Puzzle, CheckCircle, User } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TemplateGallery } from "@/components/TemplateGallery";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    navigate("/workspace", { state: { prompt: prompt.trim() } });
  };

  const fillPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <Layers className="h-5 w-5 text-background" />
          </div>
          <div>
            <span className="font-display text-lg font-bold italic tracking-tight">EXTENSIO</span>
            <span className="ml-2 text-[9px] font-mono font-bold uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5 border border-foreground">
              AI Extension Lab
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-6 font-mono text-xs font-bold uppercase tracking-widest">
            <a href="#process" className="hover:text-primary transition-colors">Process</a>
            <a href="#core" className="hover:text-primary transition-colors">Core</a>
            <a href="#safety" className="hover:text-primary transition-colors">Safety</a>
          </div>
          {session ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="brutal-button bg-accent-lime text-foreground px-4 py-1.5 text-[10px] flex items-center gap-1.5"
            >
              <User className="h-3 w-3" /> Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="brutal-button bg-foreground text-background px-4 py-1.5 text-[10px] flex items-center gap-1.5"
            >
              <User className="h-3 w-3" /> Login
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24">
        {/* Decorative shapes */}
        <div className="absolute left-[-30px] top-1/3 w-24 h-24 rounded-full bg-accent-pink opacity-70 animate-fade-in" style={{ animationDelay: "600ms" }} />
        <div className="absolute right-[-20px] top-2/3 w-28 h-28 bg-accent-lime opacity-60 rotate-12 animate-fade-in" style={{ animationDelay: "800ms" }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest bg-foreground text-background px-3 py-1.5">
              V3 Compliant Build Engine
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-bold italic leading-[0.9] mb-6 tracking-tight animate-slide-up" style={{ animationDelay: "200ms" }}>
            FROM IDEA,
            <br />
            <span className="text-primary">TO ZIP</span> IN 10S.
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto font-mono animate-fade-in" style={{ animationDelay: "400ms" }}>
            Describe a feature. Our engine architected the{" "}
            <span className="underline decoration-primary decoration-2 underline-offset-2 text-foreground font-bold">Manifest V3</span>{" "}
            source, UI logic, and permissions instantly.
          </p>

          <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "500ms" }}>
            <div className="brutal-card p-1 mb-4 transition-shadow duration-200 hover:shadow-[6px_6px_0px_0px_hsl(0_0%_0%)]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: 'Highlight all mentions of AI in neon pink across the web...'"
                className="w-full min-h-[140px] p-4 bg-background text-foreground text-sm font-mono resize-none focus:outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                }}
              />
            </div>

            {/* Template chips + Gallery button */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-3">
                {[
                  { label: "Dark Toggle", color: "bg-foreground text-background", hoverColor: "hover:bg-foreground/80" },
                  { label: "Price Tracker", color: "bg-accent-pink text-foreground", hoverColor: "hover:brightness-110" },
                  { label: "Tab Manager", color: "bg-accent-lime text-foreground", hoverColor: "hover:brightness-110" },
                ].map((chip, i) => (
                  <button
                    key={chip.label}
                    onClick={() => fillPrompt(`Create a Chrome extension: ${chip.label.toLowerCase()}`)}
                    className={`${chip.color} ${chip.hoverColor} px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-foreground brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 animate-fade-in`}
                    style={{ animationDelay: `${600 + i * 80}ms` }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors animate-fade-in"
                style={{ animationDelay: "840ms" }}
              >
                Browse all templates →
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="brutal-button bg-foreground text-background px-10 py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start Build <ArrowRight className="inline ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Process Protocol */}
      <section id="process" className="border-t-2 border-foreground py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal animation="slide-up">
            <h2 className="font-display text-4xl md:text-5xl font-bold italic text-center mb-14 tracking-tight">
              PROCESS <span className="text-primary">PROTOCOL</span>.
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Synthesize", desc: "Our engine maps your natural language to Chrome's API surface area and required permissions.", color: "bg-card" },
              { step: "02", title: "Compile", desc: "Code is drafted in real-time, following strict V3 security protocols and modular architecture.", color: "bg-accent-pink" },
              { step: "03", title: "Deploy", desc: "Extract your ZIP package and load it as an unpacked extension. Zero Web Store friction.", color: "bg-accent-lime" },
            ].map((item, i) => (
              <ScrollReveal key={item.step} animation="fade-in" delay={i * 120}>
                <div className={`${item.color} border-2 border-foreground p-8 brutal-shadow group cursor-default transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[1px_1px_0px_0px_hsl(0_0%_0%)]`}>
                  <span className="font-display text-4xl font-bold italic text-muted-foreground/40 group-hover:text-primary transition-colors duration-200">{item.step}</span>
                  <h4 className="font-display text-xl font-bold italic uppercase mt-4 mb-3">{item.title}</h4>
                  <p className="text-sm text-foreground/80 font-mono">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Core Architecture */}
      <section id="core" className="border-t-2 border-foreground py-20 px-6 bg-primary">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal animation="slide-up">
            <h2 className="font-display text-4xl md:text-5xl font-bold italic text-center mb-14 tracking-tight text-primary-foreground">
              CORE<br />ARCHITECTURE.
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "V3 Standard", desc: "Secure, performant, and future-proofed against Manifest V2 deprecation.", color: "bg-accent-yellow" },
              { icon: Shield, title: "Sandboxed", desc: "Strictly scoped permissions. No excessive access or background bloat.", color: "bg-accent-lime" },
              { icon: Package, title: "Modular Bundle", desc: "Logic separated into workers, content scripts, and popups for scalability.", color: "bg-accent-pink" },
              { icon: Code, title: "Vanilla Code", desc: "Clean, zero-dependency JavaScript that runs natively without polyfills.", color: "bg-card" },
              { icon: Puzzle, title: "Pop Components", desc: "Pre-styled UI modules for options pages and browser action popups.", color: "bg-accent-orange" },
              { icon: Terminal, title: "Logic Mapping", desc: "Translates high-level goals into tab listeners, storage hooks, and event cycles.", color: "bg-accent-purple" },
            ].map((item, i) => (
              <ScrollReveal key={item.title} animation="scale-in" delay={i * 80}>
                <div className={`${item.color} border-2 border-foreground p-6 brutal-shadow group cursor-default transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[1px_1px_0px_0px_hsl(0_0%_0%)] hover:rotate-[-1deg]`}>
                  <div className="w-8 h-8 bg-foreground flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110">
                    <item.icon className="h-4 w-4 text-background" />
                  </div>
                  <h4 className="font-display text-sm font-bold italic uppercase mb-2">{item.title}</h4>
                  <p className="text-xs text-foreground/80 font-mono">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Source Audit Logic / Trust */}
      <section id="safety" className="border-t-2 border-foreground py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal animation="fade-in-left">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold italic mb-6 tracking-tight leading-[0.95]">
                SOURCE<br /><span className="text-primary">AUDIT</span> LOGIC.
              </h2>
              <p className="text-sm text-muted-foreground mb-8 font-mono">
                We believe in verified trust. Inspect your code, read your permissions, own your scripts.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Eye, title: "Source Access", desc: "Every file in your build is visible and editable in the IDE before download." },
                  { icon: Lock, title: "Security Scoping", desc: "We actively prevent the generation of extensions that violate user privacy." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 group cursor-default">
                    <div className="w-9 h-9 bg-accent-lime border-2 border-foreground flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold italic uppercase mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-in-right" delay={150}>
            <div className="brutal-card p-6 max-w-sm mx-auto md:ml-auto transition-shadow duration-200 hover:shadow-[6px_6px_0px_0px_hsl(0_0%_0%)]">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5" />
                <h4 className="font-display text-sm font-bold italic uppercase">Integrity Scan</h4>
              </div>
              {[
                { label: "V3 Architecture", status: true },
                { label: "Secure Runtime", status: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 px-3 mb-2 border-2 border-foreground bg-accent-lime/30 transition-colors duration-200 hover:bg-accent-lime/50">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">{row.label}</span>
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t-2 border-foreground py-24 px-6 bg-accent-lime">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="slide-up">
            <h2 className="font-display text-5xl md:text-6xl font-bold italic mb-8 tracking-tight text-foreground leading-[0.9]">
              BUILD FAST.<br />INSTALL NOW.
            </h2>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="brutal-button bg-foreground text-background px-10 py-4 text-sm"
            >
              Start Build <ArrowRight className="inline ml-2 h-4 w-4" />
            </button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-6 px-6 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-xs font-bold italic">EXTENSIO</span>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-primary transition-colors duration-200">Docs</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Terms</a>
          </div>
        </div>
      </footer>
      {/* Template Gallery Modal */}
      <TemplateGallery 
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={fillPrompt}
      />
    </div>
  );
};

export default Index;
