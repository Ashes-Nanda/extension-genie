import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Plus, Trash2, FileCode, Clock, Loader2, LogOut, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  extension_type: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
}

const typeColorMap: Record<string, string> = {
  content_script: "bg-accent-lime",
  popup: "bg-accent-pink",
  background: "bg-accent-purple",
  hybrid: "bg-accent-yellow",
  unknown: "bg-secondary",
};

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, extension_type, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load projects");
      setLoading(false);
      return;
    }

    // Get file counts
    const projectsWithCounts = await Promise.all(
      (data || []).map(async (p) => {
        const { count } = await supabase
          .from("project_files")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);
        return { ...p, file_count: count || 0 };
      })
    );

    setProjects(projectsWithCounts);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    }
    setDeleting(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center transition-transform duration-150 group-hover:rotate-[-6deg]">
            <Layers className="h-5 w-5 text-background" />
          </div>
          <span className="font-display text-lg tracking-tight">EXTENSIO</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-accent-yellow text-foreground px-2.5 py-1 border-2 border-foreground">
            Dashboard
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl tracking-tight mb-1">YOUR BUILDS.</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => navigate("/workspace")}
            className="brutal-button bg-accent-lime text-foreground px-5 py-3 text-xs flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Build
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 border-2 border-foreground/20 bg-accent-lime/10 flex items-center justify-center rotate-3">
              <Zap className="h-8 w-8 text-foreground/20" />
            </div>
            <p className="font-display text-lg text-foreground/30 uppercase tracking-tight mb-2">No builds yet</p>
            <p className="font-mono text-xs text-muted-foreground mb-6">Start your first extension build</p>
            <button
              onClick={() => navigate("/workspace")}
              className="brutal-button bg-foreground text-background px-6 py-3 text-xs"
            >
              Start Building
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate("/workspace", { state: { projectId: project.id } })}
                className="brutal-card p-5 cursor-pointer group transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(0_0%_0%)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border-2 border-foreground ${typeColorMap[project.extension_type] || typeColorMap.unknown}`}>
                    {project.extension_type === "unknown" ? "Draft" : project.extension_type.replace("_", " ")}
                  </span>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    disabled={deleting === project.id}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    {deleting === project.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <h3 className="font-display text-sm uppercase tracking-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-[10px] flex items-center gap-1">
                    <FileCode className="h-3 w-3" /> {project.file_count} files
                  </span>
                  <span className="font-mono text-[10px] flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
