import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Download, CheckCircle, XCircle, AlertTriangle, FileCode, Loader2 } from "lucide-react";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { parseExtensionFiles, analyzeManifest, getPermissionDescription, type ExtensionFile, type ExtensionMeta } from "@/lib/extension-parser";
import { createExtensionZip, downloadBlob } from "@/lib/zip-export";
import { toast } from "sonner";

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as any)?.prompt || "";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ExtensionFile[]>([]);
  const [meta, setMeta] = useState<ExtensionMeta>({ type: "unknown", permissions: [], warnings: [], issues: [] });
  const [activeFile, setActiveFile] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef("");

  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      sendMessage(initialPrompt);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processResponse = (fullText: string) => {
    const parsed = parseExtensionFiles(fullText);
    if (parsed.length > 0) {
      setFiles(parsed);
      setMeta(analyzeManifest(parsed));
      if (!activeFile || !parsed.find(f => f.name === activeFile)) {
        setActiveFile(parsed[0]?.name || "");
      }
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    fullResponseRef.current = "";

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      await streamChat({
        messages: allMessages,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          fullResponseRef.current = assistantSoFar;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          processResponse(fullResponseRef.current);
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Something went wrong");
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) return;
    try {
      const blob = await createExtensionZip(files);
      downloadBlob(blob, "extension.zip");
      setShowSuccess(true);
    } catch {
      toast.error("Failed to create ZIP");
    }
  };

  const activeFileContent = files.find((f) => f.name === activeFile)?.content || "";
  const errors = meta.issues.filter((i) => i.level === "error");
  const warnings = meta.issues.filter((i) => i.level === "warning");
  const infos = meta.issues.filter((i) => i.level === "info");
  const hasErrors = errors.length > 0;
  const isReady = files.length > 0 && !hasErrors;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 font-mono text-sm font-bold hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> EXTENSIO
        </button>
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          Generation Workspace
        </span>
      </div>

      {/* 3-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[340px] flex-shrink-0 flex flex-col border-r-2 border-foreground">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === "user" ? "ml-4" : "mr-4"}`}>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {msg.role === "user" ? "You" : "Extensio"}
                </div>
                <div className={`p-3 text-sm border-2 border-foreground ${msg.role === "user" ? "bg-secondary" : "bg-card"}`}>
                  <pre className="whitespace-pre-wrap font-sans break-words text-sm leading-relaxed">
                    {msg.content.replace(/```[\s\S]*?```/g, "[code generated ↗]")}
                  </pre>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t-2 border-foreground">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe changes…"
                className="flex-1 p-2 border-2 border-foreground bg-background text-sm resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) {
                    sendMessage(input);
                  }
                }}
              />
              <button
                onClick={() => input.trim() && !isLoading && sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="brutal-button bg-primary text-primary-foreground p-3 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {files.length > 0 ? (
            <>
              <div className="flex items-center border-b-2 border-foreground overflow-x-auto">
                {files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFile(f.name)}
                    className={`px-4 py-2 font-mono text-xs border-r-2 border-foreground whitespace-nowrap ${
                      activeFile === f.name ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    <FileCode className="inline h-3 w-3 mr-1.5" />
                    {f.name}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto p-4 bg-card">
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                  {activeFileContent}
                </pre>
              </div>
              <div className="px-4 py-1 border-t-2 border-foreground">
                <p className="font-mono text-[10px] text-muted-foreground">
                  Generated code — editable, but changes may break validation
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">Your extension code will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status */}
        <div className="w-[280px] flex-shrink-0 border-l-2 border-foreground flex flex-col overflow-y-auto">
          {/* Extension Type */}
          <div className="p-4 border-b-2 border-foreground">
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Extension Type</h4>
            <span className="font-mono text-sm font-bold uppercase bg-secondary px-3 py-1 border-2 border-foreground inline-block">
              {meta.type === "unknown" ? "—" : meta.type.replace("_", " ")}
            </span>
          </div>

          {/* Permissions */}
          <div className="p-4 border-b-2 border-foreground">
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Permissions</h4>
            {meta.permissions.length > 0 ? (
              <ul className="space-y-2">
                {meta.permissions.map((p) => {
                  const isSensitive = ["<all_urls>", "cookies", "history", "webRequest", "bookmarks"].includes(p);
                  return (
                    <li key={p} className={`text-xs font-sans ${isSensitive ? "text-destructive font-bold" : ""}`}>
                      {isSensitive && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                      {getPermissionDescription(p)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No permissions detected</p>
            )}
          </div>

          {/* Validation */}
          <div className={`p-4 border-b-2 border-foreground ${hasErrors ? "bg-destructive/10" : ""}`}>
            <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Validation</h4>
            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground">Waiting for generation…</p>
            ) : (
              <div className="space-y-2">
                {errors.map((issue, i) => (
                  <div key={`e-${i}`} className="flex items-start gap-2 text-xs text-destructive">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {warnings.map((issue, i) => (
                  <div key={`w-${i}`} className="flex items-start gap-2 text-xs text-accent-orange">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {infos.map((issue, i) => (
                  <div key={`i-${i}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <FileCode className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {hasErrors && (
                  <button
                    onClick={() => sendMessage("Fix the following validation errors: " + errors.map(e => e.message).join(", "))}
                    disabled={isLoading}
                    className="brutal-button bg-destructive text-destructive-foreground px-3 py-1.5 text-xs mt-2 w-full disabled:opacity-40"
                  >
                    Fix Automatically
                  </button>
                )}
                {!hasErrors && (
                  <div className="flex items-center gap-2 text-xs text-primary font-bold">
                    <CheckCircle className="h-4 w-4" /> Ready to install
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download */}
          <div className="p-4 mt-auto">
            <button
              onClick={handleDownload}
              disabled={files.length === 0}
              className="brutal-button bg-primary text-primary-foreground px-4 py-3 text-sm w-full disabled:opacity-40"
            >
              <Download className="inline h-4 w-4 mr-2" /> Download ZIP
            </button>
          </div>
        </div>
      </div>

      {/* Download success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50" onClick={() => setShowSuccess(false)}>
          <div className="brutal-card bg-card p-8 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-mono text-xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" /> ZIP ready to install
            </h3>
            <ol className="space-y-3 mb-6">
              {[
                "Open chrome://extensions",
                "Enable Developer Mode (top right toggle)",
                'Click "Load Unpacked"',
                "Select the unzipped folder",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-sm font-bold bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-mono text-sm">{step}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => setShowSuccess(false)} className="brutal-button bg-secondary text-secondary-foreground px-4 py-2 text-sm w-full">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
