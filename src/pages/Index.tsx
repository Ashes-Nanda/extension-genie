import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Code, Download, Zap, Eye, Lock, Users, Wrench, Lightbulb } from "lucide-react";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    navigate("/workspace", { state: { prompt: prompt.trim() } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground">
        <h1 className="font-mono text-xl font-bold tracking-tight">EXTENSIO</h1>
        <a href="#how" className="font-mono text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">
          Docs
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16">
        <h2 className="font-mono text-4xl md:text-5xl font-bold leading-tight mb-4">
          Describe your idea.
          <br />
          <span className="text-primary">Get a working Chrome extension.</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          No boilerplate. No manifest errors. Download & install in minutes.
        </p>

        <div className="brutal-card p-1 mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want your Chrome extension to do…"
            className="w-full min-h-[160px] p-4 bg-background text-foreground font-sans text-base resize-none focus:outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="brutal-button bg-primary text-primary-foreground px-8 py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto"
        >
          Generate Extension <ArrowRight className="inline ml-2 h-5 w-5" />
        </button>

        <p className="mt-4 font-mono text-xs text-muted-foreground tracking-wide">
          Manifest V3 • No hidden permissions • ZIP download
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="border-t-2 border-foreground py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-mono text-2xl font-bold mb-10 uppercase tracking-wider">How it works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Lightbulb, step: "01", title: "Describe", desc: "Type what your extension should do in plain English." },
              { icon: Eye, step: "02", title: "Watch", desc: "See your code generated live — manifest, scripts, UI." },
              { icon: Download, step: "03", title: "Download", desc: "Get a ZIP. Load unpacked in Chrome. Done." },
            ].map((item) => (
              <div key={item.step} className="brutal-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-3xl font-bold text-primary">{item.step}</span>
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-mono text-lg font-bold mb-2 uppercase">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="border-t-2 border-foreground py-16 px-6 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-mono text-2xl font-bold mb-8 uppercase tracking-wider">Why this is different</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Zap, text: "Chrome-correct by default" },
              { icon: Shield, text: "Manifest V3 compliant — always" },
              { icon: Lock, text: "Permission-aware generation" },
              { icon: Code, text: "Install-ready ZIPs, every time" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 brutal-card p-4">
                <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-mono text-sm font-bold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t-2 border-foreground py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-mono text-2xl font-bold mb-8 uppercase tracking-wider">Trust & Safety</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "You can see every line of code",
              "No hidden permissions",
              "Nothing runs without your approval",
              "You control what gets installed",
            ].map((text) => (
              <div key={text} className="flex items-start gap-3 p-4">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="font-mono text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t-2 border-foreground py-16 px-6 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-mono text-2xl font-bold mb-10 uppercase tracking-wider">Who it's for</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Non-developers", desc: "Have an idea? That's enough. No code required." },
              { icon: Wrench, title: "Indie hackers & students", desc: "Ship fast. Validate ideas. Skip the boilerplate." },
              { icon: Code, title: "Frontend devs", desc: "Stop fighting manifest.json. Focus on the logic." },
            ].map((item) => (
              <div key={item.title} className="brutal-card p-6">
                <item.icon className="h-6 w-6 mb-4 text-primary" />
                <h4 className="font-mono text-lg font-bold mb-2 uppercase">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t-2 border-foreground py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-mono text-3xl font-bold mb-6">
            Turn an idea into a Chrome extension — <span className="text-primary">now.</span>
          </h3>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="brutal-button bg-primary text-primary-foreground px-8 py-4 text-lg"
          >
            Get Started <ArrowRight className="inline ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-mono text-xs font-bold">EXTENSIO</span>
          <div className="flex gap-6 font-mono text-xs uppercase tracking-wider">
            <a href="#" className="hover:text-primary">Docs</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
