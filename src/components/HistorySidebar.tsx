import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Trash2, LogOut, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  extension_type: string | null;
  updated_at: string | null;
  created_at: string | null;
}

interface HistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeColorMap: Record<string, string> = {
  content_script: "bg-accent-lime",
  popup: "bg-accent-pink",
  background: "bg-accent-purple",
  hybrid: "bg-accent-yellow",
  unknown: "bg-secondary",
};

export const HistorySidebar = ({ open, onOpenChange }: HistorySidebarProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) fetchProjects();
  }, [open]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, extension_type, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Failed to load projects");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    await supabase.from("project_files").delete().eq("project_id", id);
    await supabase.from("project_messages").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Project deleted");
  };

  const handleOpen = (id: string) => {
    onOpenChange(false);
    navigate("/workspace", { state: { projectId: id } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[340px] border-l-2 border-foreground bg-background p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b-2 border-foreground">
          <SheetTitle className="font-display text-base uppercase tracking-tight">Your Builds</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">No builds yet</p>
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleOpen(project.id)}
                className="w-full text-left p-3 border-2 border-foreground bg-card brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border border-foreground ${typeColorMap[project.extension_type || "unknown"]}`}>
                        {(project.extension_type || "unknown").replace("_", " ")}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updated_at || project.created_at || ""), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t-2 border-foreground">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
