import { FileCode, Puzzle, ArrowRight } from "lucide-react";

const EXAMPLE_PROMPTS = [
  { text: "Dark mode toggle for any website", color: "bg-accent-pink" },
  { text: "Save all open tabs as bookmarks", color: "bg-accent-lime" },
  { text: "Highlight all links on the page", color: "bg-accent-yellow" },
  { text: "Word counter for selected text", color: "bg-accent-purple" },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyState = ({ onSelectPrompt }: EmptyStateProps) => (
  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-secondary/10">
    <div className="text-center max-w-md px-6">
      {/* Animated icon cluster */}
      <div className="relative w-28 h-28 mx-auto mb-8">
        <div className="absolute inset-0 border-2 border-foreground/10 bg-accent-lime/10 rotate-6 animate-fade-in" />
        <div className="absolute inset-2 border-2 border-foreground/15 bg-accent-pink/10 -rotate-3 animate-fade-in" style={{ animationDelay: "0.1s" }} />
        <div className="absolute inset-4 border-2 border-foreground/20 bg-card flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Puzzle className="h-10 w-10 text-foreground/25" />
        </div>
      </div>

      <p className="font-display text-xl uppercase tracking-tight text-foreground/40 mb-2">
        Build Something
      </p>
      <p className="font-mono text-[11px] text-muted-foreground mb-8 leading-relaxed">
        Describe your Chrome extension idea and we'll generate<br />
        the complete source code, manifest, and files.
      </p>

      {/* Example prompts */}
      <div className="space-y-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
          Try an example
        </p>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt.text}
            onClick={() => onSelectPrompt(prompt.text)}
            className={`w-full text-left px-3 py-2.5 border-2 border-foreground text-[12px] font-mono 
              ${prompt.color}/15 hover:${prompt.color}/30 
              transition-all duration-150 flex items-center justify-between group
              hover:translate-x-1`}
          >
            <span>{prompt.text}</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
