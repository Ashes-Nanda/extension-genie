import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Download, CheckCircle, XCircle, AlertTriangle, FileCode, Loader2, Layers, Shield, Zap, LogOut, History } from "lucide-react";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { parseExtensionFiles, analyzeManifest, getPermissionDescription, type ExtensionFile, type ExtensionMeta } from "@/lib/extension-parser";
import { createExtensionZip, createExtensionZipWithIcons, downloadBlob } from "@/lib/zip-export";
import { generateIcons } from "@/lib/icon-generator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CodeBlock from "@/components/CodeBlock";
import { HistorySidebar } from "@/components/HistorySidebar";
import "@/styles/prism-brutal.css";

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as any)?.prompt || "";
  const loadProjectId = (location.state as any)?.projectId || null;
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ExtensionFile[]>([]);
  const [meta, setMeta] = useState<ExtensionMeta>({ type: "unknown", permissions: [], warnings: [], issues: [] });
  const [activeFile, setActiveFile] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(loadProjectId);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef("");

  // Load existing project
  useEffect(() => {
    if (loadProjectId) {
      loadProject(loadProjectId);
    } else if (initialPrompt && messages.length === 0) {
      sendMessage(initialPrompt);
    }
  }, []);

  const loadProject = async (id: string) => {
    const [{ data: msgData }, { data: fileData }] = await Promise.all([
      supabase.from("project_messages").select("role, content").eq("project_id", id).order("created_at"),
      supabase.from("project_files").select("filename, content").eq("project_id", id),
    ]);

    if (msgData) {
      setMessages(msgData.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
    if (fileData && fileData.length > 0) {
      const parsed = fileData.map((f) => ({ name: f.filename, content: f.content }));
      setFiles(parsed);
      setMeta(analyzeManifest(parsed));
      setActiveFile(parsed[0]?.name || "");
    }
  };

  const saveProject = async (msgs: Msg[], parsedFiles: ExtensionFile[], extMeta: ExtensionMeta) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const projectName = msgs.find((m) => m.role === "user")?.content.slice(0, 80) || "Untitled Extension";

    if (!projectId) {
      // Create new project
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: projectName, extension_type: extMeta.type })
        .select("id")
        .single();
      if (error || !data) return;
      setProjectId(data.id);
      await saveProjectData(data.id, msgs, parsedFiles);
    } else {
      // Update existing
      await supabase.from("projects").update({ extension_type: extMeta.type, updated_at: new Date().toISOString() }).eq("id", projectId);
      await saveProjectData(projectId, msgs, parsedFiles);
    }
  };

  const saveProjectData = async (pid: string, msgs: Msg[], parsedFiles: ExtensionFile[]) => {
    // Replace messages and files
    await supabase.from("project_messages").delete().eq("project_id", pid);
    await supabase.from("project_files").delete().eq("project_id", pid);

    if (msgs.length > 0) {
      await supabase.from("project_messages").insert(
        msgs.map((m) => ({ project_id: pid, role: m.role, content: m.content }))
      );
    }
    if (parsedFiles.length > 0) {
      await supabase.from("project_files").insert(
        parsedFiles.map((f) => ({ project_id: pid, filename: f.name, content: f.content }))
      );
    }
  };

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
          const parsed = parseExtensionFiles(fullResponseRef.current);
          if (parsed.length > 0) {
            setFiles(parsed);
            const newMeta = analyzeManifest(parsed);
            setMeta(newMeta);
            if (!activeFile || !parsed.find(f => f.name === activeFile)) {
              setActiveFile(parsed[0]?.name || "");
            }
            const allMsgs = [...allMessages, { role: "assistant" as const, content: fullResponseRef.current }];
            saveProject(allMsgs, parsed, newMeta);
          } else {
            processResponse(fullResponseRef.current);
          }
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Something went wrong");
    }
  };

  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  const handleDownload = async () => {
    if (files.length === 0) return;
    try {
      setIsGeneratingIcons(true);
      const manifestFile = files.find((f) => f.name === "manifest.json");
      let blob: Blob;
      try {
        if (manifestFile) {
          const icons = await generateIcons(manifestFile.content);
          blob = await createExtensionZipWithIcons(files, icons);
        } else {
          blob = await createExtensionZip(files);
        }
      } catch (iconErr) {
        console.warn("Icon generation failed, falling back:", iconErr);
        toast.warning("Icons couldn't be generated — downloading without icons");
        blob = await createExtensionZip(files);
      }
      downloadBlob(blob, "extension.zip");
      setShowSuccess(true);
    } catch {
      toast.error("Failed to create ZIP");
    } finally {
      setIsGeneratingIcons(false);
    }
  };

  const activeFileContent = files.find((f) => f.name === activeFile)?.content || "";

  // Typing animation
  const [visibleChars, setVisibleChars] = useState(0);
  const [animatingFile, setAnimatingFile] = useState("");
  const isNewGeneration = useRef(false);

  // Track when files change from generation (not tab switch)
  useEffect(() => {
    if (isLoading) {
      isNewGeneration.current = true;
    }
  }, [isLoading]);

  useEffect(() => {
    if (isNewGeneration.current) {
      setVisibleChars(0);
      setAnimatingFile(activeFile);
    } else {
      // Tab switch on loaded project — show full content
      setVisibleChars(activeFileContent.length);
      setAnimatingFile(activeFile);
    }
  }, [activeFile, activeFileContent]);

  useEffect(() => {
    if (visibleChars >= activeFileContent.length) {
      isNewGeneration.current = false;
      return;
    }
    const interval = setInterval(() => {
      setVisibleChars((prev) => Math.min(prev + 25, activeFileContent.length));
    }, 16);
    return () => clearInterval(interval);
  }, [visibleChars, activeFileContent]);

  const displayedCode = activeFileContent.slice(0, visibleChars);

  const errors = meta.issues.filter((i) => i.level === "error");
  const warningsList = meta.issues.filter((i) => i.level === "warning");
  const infos = meta.issues.filter((i) => i.level === "info");
  const hasErrors = errors.length > 0;
  const isReady = files.length > 0 && !hasErrors;

  const typeColorMap: Record<string, string> = {
    content_script: "bg-accent-lime",
    popup: "bg-accent-pink",
    background: "bg-accent-purple",
    hybrid: "bg-accent-yellow",
    unknown: "bg-secondary",
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-foreground bg-background">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center transition-transform duration-150 group-hover:rotate-[-6deg]">
            <Layers className="h-4 w-4 text-background" />
          </div>
          <span className="font-display text-base tracking-tight">EXTENSIO</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-3.5 w-3.5" /> History
          </button>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-accent-lime text-foreground px-2.5 py-1 border-2 border-foreground">
            Build Mode
          </span>
          {isLoading && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Generating
            </span>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[360px] flex-shrink-0 flex flex-col border-r-2 border-foreground bg-background">
          <div className="px-4 py-3 border-b-2 border-foreground bg-accent-pink/20">
            <h3 className="font-display text-xs uppercase tracking-widest">Prompt Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`animate-fade-in ${msg.role === "user" ? "ml-6" : "mr-4"}`}>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">
                  {msg.role === "user" ? "→ You" : "← Extensio"}
                </div>
                <div className={`p-3 text-sm border-2 border-foreground transition-all duration-200 ${
                  msg.role === "user"
                    ? "bg-accent-yellow/30 brutal-shadow-sm"
                    : "bg-card brutal-shadow-sm"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans break-words text-sm leading-relaxed">
                    {msg.content.replace(/```[\s\S]*?```/g, "[code generated ↗]")}
                  </pre>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2.5 p-3 border-2 border-foreground bg-accent-lime/20 brutal-shadow-sm animate-fade-in">
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe changes…"
                className="flex-1 p-3 border-2 border-foreground bg-background text-sm resize-none min-h-[64px] focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isLoading) {
                    sendMessage(input);
                  }
                }}
              />
              <button
                onClick={() => input.trim() && !isLoading && sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="brutal-button bg-foreground text-background p-3 disabled:opacity-30 transition-all duration-150"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mt-1.5 tracking-wider">⌘+Enter to send</p>
          </div>
        </div>

        {/* Center: Code */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {files.length > 0 ? (
            <>
              <div className="flex items-center border-b-2 border-foreground overflow-x-auto bg-secondary/30">
                {files.map((f, i) => {
                  const tabColors = ["bg-accent-pink", "bg-accent-lime", "bg-accent-yellow", "bg-accent-orange", "bg-accent-purple"];
                  return (
                    <button
                      key={f.name}
                      onClick={() => setActiveFile(f.name)}
                      className={`px-4 py-2.5 font-mono text-[11px] font-bold border-r-2 border-foreground whitespace-nowrap transition-all duration-150 ${
                        activeFile === f.name
                          ? `${tabColors[i % tabColors.length]} text-foreground brutal-shadow-sm`
                          : "hover:bg-secondary text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <FileCode className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                      {f.name}
                    </button>
                  );
                })}
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-secondary/10">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 border-2 border-foreground/20 bg-accent-lime/10 flex items-center justify-center rotate-3">
                  <FileCode className="h-8 w-8 text-foreground/20" />
                </div>
                <p className="font-display text-lg uppercase tracking-tight text-foreground/30">Code Appears Here</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-2">Submit a prompt to start building</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status */}
        <div className="w-[290px] flex-shrink-0 border-l-2 border-foreground flex flex-col overflow-y-auto bg-background">
          {/* Extension Type */}
          <div className="p-4 border-b-2 border-foreground">
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 font-bold flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Extension Type
            </h4>
            <span className={`font-mono text-xs font-bold uppercase px-3 py-1.5 border-2 border-foreground inline-block brutal-shadow-sm ${typeColorMap[meta.type]}`}>
              {meta.type === "unknown" ? "Awaiting Build" : meta.type.replace("_", " ")}
            </span>
          </div>

          {/* Permissions */}
          <div className="p-4 border-b-2 border-foreground">
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 font-bold flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> Permissions
            </h4>
            {meta.permissions.length > 0 ? (
              <ul className="space-y-2">
                {meta.permissions.map((p) => {
                  const isSensitive = ["<all_urls>", "cookies", "history", "webRequest", "bookmarks"].includes(p);
                  return (
                    <li key={p} className={`text-[11px] font-mono p-2 border-2 border-foreground ${
                      isSensitive
                        ? "bg-accent-pink/30 text-foreground font-bold"
                        : "bg-accent-lime/20 text-foreground"
                    }`}>
                      {isSensitive && <AlertTriangle className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                      {getPermissionDescription(p)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[11px] text-muted-foreground font-mono">No permissions detected</p>
            )}
          </div>

          {/* Validation */}
          <div className={`p-4 border-b-2 border-foreground ${hasErrors ? "bg-accent-pink/10" : ""}`}>
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 font-bold">Validation</h4>
            {files.length === 0 ? (
              <p className="text-[11px] text-muted-foreground font-mono">Waiting for generation…</p>
            ) : (
              <div className="space-y-2">
                {errors.map((issue, i) => (
                  <div key={`e-${i}`} className="flex items-start gap-2 text-[11px] font-mono p-2 border-2 border-foreground bg-destructive/10 text-destructive">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {warningsList.map((issue, i) => (
                  <div key={`w-${i}`} className="flex items-start gap-2 text-[11px] font-mono p-2 border-2 border-foreground bg-accent-orange/15 text-accent-orange">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {infos.map((issue, i) => (
                  <div key={`i-${i}`} className="flex items-start gap-2 text-[11px] font-mono p-2 border-2 border-foreground bg-secondary/50 text-muted-foreground">
                    <FileCode className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {issue.message}
                  </div>
                ))}
                {hasErrors && (
                  <button
                    onClick={() => sendMessage("Fix the following validation errors: " + errors.map(e => e.message).join(", "))}
                    disabled={isLoading}
                    className="brutal-button bg-accent-pink text-foreground px-3 py-2 text-[11px] mt-2 w-full disabled:opacity-40"
                  >
                    ⚡ Fix Automatically
                  </button>
                )}
                {!hasErrors && (
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold p-2 border-2 border-foreground bg-accent-lime/30 text-foreground">
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
              disabled={files.length === 0 || isGeneratingIcons}
              className="brutal-button bg-foreground text-background px-4 py-3.5 text-xs w-full disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isGeneratingIcons ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating Icons…</>
              ) : (
                <><Download className="h-4 w-4" /> Download ZIP</>
              )}
            </button>
            {isReady && (
              <p className="font-mono text-[9px] text-center text-muted-foreground mt-2 uppercase tracking-widest">
                {files.length} files • {meta.type.replace("_", " ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Download success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowSuccess(false)}>
          <div className="brutal-card bg-card p-8 max-w-md mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-lime border-2 border-foreground flex items-center justify-center brutal-shadow-sm">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl tracking-tight">ZIP READY</h3>
            </div>
            <ol className="space-y-3 mb-8">
              {[
                { text: "Open chrome://extensions", color: "bg-accent-pink" },
                { text: "Enable Developer Mode (top right toggle)", color: "bg-accent-lime" },
                { text: 'Click "Load Unpacked"', color: "bg-accent-yellow" },
                { text: "Select the unzipped folder", color: "bg-accent-purple" },
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-center">
                  <span className={`font-mono text-xs font-bold ${step.color} text-foreground w-7 h-7 flex items-center justify-center flex-shrink-0 border-2 border-foreground brutal-shadow-sm`}>
                    {i + 1}
                  </span>
                  <span className="font-mono text-sm">{step.text}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => setShowSuccess(false)} className="brutal-button bg-foreground text-background px-4 py-2.5 text-xs w-full">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      <HistorySidebar open={showHistory} onOpenChange={setShowHistory} />
    </div>
  );
};

export default Workspace;
