import { useRef, useEffect } from "react";
import { Send, Loader2, Terminal, Bot } from "lucide-react";
import type { Msg } from "@/lib/stream-chat";

interface ChatPanelProps {
  messages: Msg[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  isLoading: boolean;
}

export const ChatPanel = ({ messages, input, onInputChange, onSend, isLoading }: ChatPanelProps) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatContent = (content: string) => {
    return content.replace(/```[\s\S]*?```/g, "✦ code generated →");
  };

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col border-r-2 border-foreground bg-background
                     max-md:w-full max-md:border-r-0 max-md:border-b-2">
      <div className="px-4 py-3 border-b-2 border-foreground bg-accent-pink/20">
        <h3 className="font-display text-xs uppercase tracking-widest">Prompt Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-md:max-h-[40vh]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
            <div className="w-10 h-10 border-2 border-foreground/15 bg-accent-lime/10 flex items-center justify-center mb-3 rotate-[-3deg]">
              <Terminal className="h-5 w-5 text-foreground/20" />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Describe what your extension should do.<br />
              Be specific about functionality & target sites.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === "user" ? "ml-4" : "mr-2"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-5 h-5 flex items-center justify-center border border-foreground/30 text-[9px] font-bold
                ${msg.role === "user" 
                  ? "bg-accent-yellow/40" 
                  : "bg-accent-purple/30"
                }`}>
                {msg.role === "user" ? "→" : <Bot className="h-3 w-3" />}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                {msg.role === "user" ? "You" : "Extensio"}
              </span>
            </div>
            <div className={`p-3 text-sm border-2 border-foreground transition-all duration-200 ml-7 ${
              msg.role === "user"
                ? "bg-accent-yellow/20 brutal-shadow-sm"
                : "bg-card brutal-shadow-sm"
            }`}>
              <pre className="whitespace-pre-wrap font-sans break-words text-[13px] leading-relaxed">
                {formatContent(msg.content)}
              </pre>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2.5 p-3 border-2 border-foreground bg-accent-lime/20 brutal-shadow-sm animate-fade-in ml-7">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Building Extension…</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t-2 border-foreground bg-secondary/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe your extension…"
            className="flex-1 p-3 border-2 border-foreground bg-background text-sm resize-none min-h-[64px] focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) {
                onSend(input);
              }
            }}
          />
          <button
            onClick={() => input.trim() && !isLoading && onSend(input)}
            disabled={!input.trim() || isLoading}
            className="brutal-button bg-foreground text-background p-3 disabled:opacity-30 transition-all duration-150"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground mt-1.5 tracking-wider">⌘+Enter to send</p>
      </div>
    </div>
  );
};
