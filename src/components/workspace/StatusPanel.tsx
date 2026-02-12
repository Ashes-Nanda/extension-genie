import { useState } from "react";
import { Download, CheckCircle, XCircle, AlertTriangle, FileCode, Loader2, Shield, Zap, ChevronDown, Image } from "lucide-react";
import type { ExtensionMeta } from "@/lib/extension-parser";
import { getPermissionDescription } from "@/lib/extension-parser";

interface StatusPanelProps {
  meta: ExtensionMeta;
  files: { name: string; content: string }[];
  hasErrors: boolean;
  isReady: boolean;
  errors: { message: string; level: string }[];
  warningsList: { message: string; level: string }[];
  infos: { message: string; level: string }[];
  isLoading: boolean;
  isGeneratingIcons: boolean;
  isGeneratingPreview: boolean;
  previewIcon: string | null;
  onFixErrors: () => void;
  onDownload: () => void;
  onGeneratePreviewIcon: () => void;
}

const typeColorMap: Record<string, string> = {
  content_script: "bg-accent-lime",
  popup: "bg-accent-pink",
  background: "bg-accent-purple",
  hybrid: "bg-accent-yellow",
  unknown: "bg-secondary",
};

const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b-2 border-foreground">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
      >
        <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
          <Icon className="h-3 w-3" /> {title}
        </h4>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </div>
  );
};

export const StatusPanel = ({
  meta, files, hasErrors, isReady,
  errors, warningsList, infos,
  isLoading, isGeneratingIcons, isGeneratingPreview, previewIcon,
  onFixErrors, onDownload, onGeneratePreviewIcon,
}: StatusPanelProps) => {
  return (
    <div className="w-[290px] flex-shrink-0 border-l-2 border-foreground flex flex-col overflow-y-auto bg-background min-h-0 h-full
                     max-md:w-full max-md:border-l-0 max-md:border-t-2 max-md:h-auto">
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
      <CollapsibleSection title="Permissions" icon={Shield}>
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
      </CollapsibleSection>

      {/* Validation */}
      <CollapsibleSection title="Validation" icon={CheckCircle}>
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
                onClick={onFixErrors}
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
      </CollapsibleSection>

      {/* Icon Preview */}
      {files.length > 0 && (
        <CollapsibleSection title="Icon Preview" icon={Image} defaultOpen={!!previewIcon}>
          {previewIcon ? (
            <div className="flex flex-col items-center gap-3">
              <div className="border-2 border-foreground bg-secondary/30 p-3 brutal-shadow-sm">
                <img
                  src={previewIcon}
                  alt="Extension icon preview"
                  className="w-20 h-20"
                  style={{ imageRendering: "auto" }}
                />
              </div>
              <button
                onClick={onGeneratePreviewIcon}
                disabled={isGeneratingPreview}
                className="brutal-button bg-secondary text-foreground px-3 py-1.5 text-[10px] w-full disabled:opacity-40"
              >
                {isGeneratingPreview ? (
                  <><Loader2 className="inline h-3 w-3 mr-1.5 animate-spin" /> Regenerating…</>
                ) : (
                  "↻ Regenerate"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onGeneratePreviewIcon}
              disabled={isGeneratingPreview || !files.length}
              className="brutal-button bg-accent-purple/20 text-foreground px-3 py-2.5 text-[10px] w-full disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {isGeneratingPreview ? (
                <><Loader2 className="inline h-3 w-3 animate-spin" /> Generating…</>
              ) : (
                <><Image className="h-3 w-3" /> Generate Icon Preview</>
              )}
            </button>
          )}
        </CollapsibleSection>
      )}

      {/* Download */}
      <div className="p-4 mt-auto">
        <button
          onClick={onDownload}
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
  );
};
