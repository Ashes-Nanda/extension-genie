import { FileCode } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import type { ExtensionFile } from "@/lib/extension-parser";

interface CodeViewerProps {
  files: ExtensionFile[];
  activeFile: string;
  displayedCode: string;
  onSetActiveFile: (name: string) => void;
}

const TAB_COLORS = ["bg-accent-pink", "bg-accent-lime", "bg-accent-yellow", "bg-accent-orange", "bg-accent-purple"];

export const CodeViewer = ({ files, activeFile, displayedCode, onSetActiveFile }: CodeViewerProps) => (
  <>
    <div className="flex items-center border-b-2 border-foreground overflow-x-auto bg-secondary/30">
      {files.map((f, i) => (
        <button
          key={f.name}
          onClick={() => onSetActiveFile(f.name)}
          className={`px-4 py-2.5 font-mono text-[11px] font-bold border-r-2 border-foreground whitespace-nowrap transition-all duration-150 ${
            activeFile === f.name
              ? `${TAB_COLORS[i % TAB_COLORS.length]} text-foreground brutal-shadow-sm`
              : "hover:bg-secondary text-foreground/70 hover:text-foreground"
          }`}
        >
          <FileCode className="inline h-3 w-3 mr-1.5 -mt-0.5" />
          {f.name}
        </button>
      ))}
    </div>
    <div className="flex-1 overflow-auto p-5 bg-card">
      <CodeBlock code={displayedCode} filename={activeFile} />
    </div>
    <div className="px-5 py-2 border-t-2 border-foreground bg-secondary/30 flex items-center justify-between">
      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
        {files.length} file{files.length > 1 ? "s" : ""} generated
      </p>
      <p className="font-mono text-[9px] text-muted-foreground">
        {activeFile}
      </p>
    </div>
  </>
);
