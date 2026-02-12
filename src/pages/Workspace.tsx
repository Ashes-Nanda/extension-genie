import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layers, Loader2, LogOut, History, PanelLeftClose, PanelRightClose } from "lucide-react";
import { streamChat, type Msg } from "@/lib/stream-chat";
import { parseExtensionFiles, analyzeManifest, type ExtensionFile, type ExtensionMeta } from "@/lib/extension-parser";
import { createExtensionZip, createExtensionZipWithIcons, downloadBlob } from "@/lib/zip-export";
import { generateIcons } from "@/lib/icon-generator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { CodeViewer } from "@/components/workspace/CodeViewer";
import { StatusPanel } from "@/components/workspace/StatusPanel";
import { EmptyState } from "@/components/workspace/EmptyState";
import { SuccessOverlay } from "@/components/workspace/SuccessOverlay";
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
  const fullResponseRef = useRef("");

  // Mobile panel toggle
  const [mobilePanel, setMobilePanel] = useState<"chat" | "code" | "status">("chat");

  // Icon generation
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Typing animation
  const [visibleChars, setVisibleChars] = useState(0);
  const isNewGeneration = useRef(false);

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
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: projectName, extension_type: extMeta.type })
        .select("id")
        .single();
      if (error || !data) return;
      setProjectId(data.id);
      await saveProjectData(data.id, msgs, parsedFiles);
    } else {
      await supabase.from("projects").update({ extension_type: extMeta.type, updated_at: new Date().toISOString() }).eq("id", projectId);
      await saveProjectData(projectId, msgs, parsedFiles);
    }
  };

  const saveProjectData = async (pid: string, msgs: Msg[], parsedFiles: ExtensionFile[]) => {
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
            // Switch to code view on mobile after generation
            setMobilePanel("code");
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

  const generatePreviewIcon = async () => {
    if (!files.length) return;
    try {
      setIsGeneratingPreview(true);
      const manifestFile = files.find((f) => f.name === "manifest.json");
      if (!manifestFile) return;
      const icons = await generateIcons(manifestFile.content);
      const iconBlob = icons["icon128.png"];
      const reader = new FileReader();
      reader.onloadend = () => setPreviewIcon(reader.result as string);
      reader.readAsDataURL(iconBlob);
    } catch (err) {
      console.warn("Preview generation failed:", err);
      toast.warning("Couldn't preview icon");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

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

  // Typing animation
  const activeFileContent = files.find((f) => f.name === activeFile)?.content || "";

  useEffect(() => {
    if (isLoading) isNewGeneration.current = true;
  }, [isLoading]);

  useEffect(() => {
    if (isNewGeneration.current) {
      setVisibleChars(0);
    } else {
      setVisibleChars(activeFileContent.length);
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b-2 border-foreground bg-background">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-foreground flex items-center justify-center transition-transform duration-150 group-hover:rotate-[-6deg]">
            <Layers className="h-4 w-4 text-background" />
          </div>
          <span className="font-display text-base tracking-tight max-sm:hidden">EXTENSIO</span>
        </button>

        {/* Mobile panel switcher */}
        <div className="flex items-center gap-1 md:hidden">
          {(["chat", "code", "status"] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setMobilePanel(panel)}
              className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest border-2 border-foreground transition-all
                ${mobilePanel === panel
                  ? "bg-accent-lime text-foreground brutal-shadow-sm"
                  : "bg-background text-muted-foreground hover:text-foreground"
                }`}
            >
              {panel === "chat" ? "Chat" : panel === "code" ? "Code" : "Status"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-3.5 w-3.5" /> <span className="max-sm:hidden">History</span>
          </button>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-accent-lime text-foreground px-2.5 py-1 border-2 border-foreground max-sm:hidden">
            Build Mode
          </span>
          {isLoading && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> <span className="max-sm:hidden">Generating</span>
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

      {/* 3-pane layout — desktop: side-by-side, mobile: tab-switched */}
      <div className="flex-1 flex overflow-hidden min-h-0 max-md:flex-col">
        {/* Chat panel */}
        <div className={`md:flex flex-col min-h-0 ${mobilePanel === "chat" ? "flex" : "hidden md:flex"}`}>
          <ChatPanel
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSend={sendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Code panel */}
        <div className={`flex-1 flex-col overflow-hidden min-h-0 ${mobilePanel === "code" ? "flex" : "hidden md:flex"}`}>
          {files.length > 0 ? (
            <CodeViewer
              files={files}
              activeFile={activeFile}
              displayedCode={displayedCode}
              onSetActiveFile={setActiveFile}
            />
          ) : (
            <EmptyState onSelectPrompt={(prompt) => {
              setInput(prompt);
              setMobilePanel("chat");
            }} />
          )}
        </div>

        {/* Status panel */}
        <div className={`md:flex flex-col min-h-0 ${mobilePanel === "status" ? "flex" : "hidden md:flex"}`}>
          <StatusPanel
            meta={meta}
            files={files}
            hasErrors={hasErrors}
            isReady={isReady}
            errors={errors}
            warningsList={warningsList}
            infos={infos}
            isLoading={isLoading}
            isGeneratingIcons={isGeneratingIcons}
            isGeneratingPreview={isGeneratingPreview}
            previewIcon={previewIcon}
            onFixErrors={() => sendMessage("Fix the following validation errors: " + errors.map(e => e.message).join(", "))}
            onDownload={handleDownload}
            onGeneratePreviewIcon={generatePreviewIcon}
          />
        </div>
      </div>

      {/* Download success overlay */}
      {showSuccess && <SuccessOverlay onClose={() => setShowSuccess(false)} />}

      {/* History Sidebar */}
      <HistorySidebar open={showHistory} onOpenChange={setShowHistory} />
    </div>
  );
};

export default Workspace;
