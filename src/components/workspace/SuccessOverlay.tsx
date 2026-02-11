import { CheckCircle } from "lucide-react";

const STEPS = [
  { text: "Open chrome://extensions", color: "bg-accent-pink" },
  { text: "Enable Developer Mode (top right toggle)", color: "bg-accent-lime" },
  { text: 'Click "Load Unpacked"', color: "bg-accent-yellow" },
  { text: "Select the unzipped folder", color: "bg-accent-purple" },
];

interface SuccessOverlayProps {
  onClose: () => void;
}

export const SuccessOverlay = ({ onClose }: SuccessOverlayProps) => (
  <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
    <div className="brutal-card bg-card p-8 max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent-lime border-2 border-foreground flex items-center justify-center brutal-shadow-sm">
          <CheckCircle className="h-5 w-5" />
        </div>
        <h3 className="font-display text-xl tracking-tight">ZIP READY</h3>
      </div>
      <ol className="space-y-3 mb-8">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3 items-center">
            <span className={`font-mono text-xs font-bold ${step.color} text-foreground w-7 h-7 flex items-center justify-center flex-shrink-0 border-2 border-foreground brutal-shadow-sm`}>
              {i + 1}
            </span>
            <span className="font-mono text-sm">{step.text}</span>
          </li>
        ))}
      </ol>
      <button onClick={onClose} className="brutal-button bg-foreground text-background px-4 py-2.5 text-xs w-full">
        Got it
      </button>
    </div>
  </div>
);
