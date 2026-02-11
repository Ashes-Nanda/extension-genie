import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPrompt = (location.state as any)?.redirectPrompt || "";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (redirectPrompt) {
          navigate("/", { state: { prompt: redirectPrompt } });
        } else {
          navigate("/");
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (redirectPrompt) {
          navigate("/", { state: { prompt: redirectPrompt } });
        } else {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Logging you in...");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
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
      </nav>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {redirectPrompt && (
            <div className="mb-6 p-3 border-2 border-foreground bg-accent-yellow/20 brutal-shadow-sm">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Your prompt is saved</p>
              <p className="font-mono text-xs truncate">{redirectPrompt}</p>
            </div>
          )}

          {/* Toggle */}
          <div className="flex mb-8">
            {["Login", "Sign Up"].map((label, i) => {
              const active = i === 0 ? isLogin : !isLogin;
              return (
                <button
                  key={label}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-widest border-2 border-foreground transition-all duration-150 ${
                    active
                      ? "bg-foreground text-background brutal-shadow-sm"
                      : "bg-background text-foreground hover:bg-secondary"
                  } ${i === 0 ? "border-r-0" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="brutal-card p-8">
            <h2 className="font-display text-2xl tracking-tight mb-2">
              {isLogin ? "WELCOME BACK." : "JOIN THE LAB."}
            </h2>
            <p className="font-mono text-xs text-muted-foreground mb-8">
              {isLogin
                ? "Log in to access your extension projects."
                : "Create an account to save and manage your builds."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-foreground bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border-2 border-foreground bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="brutal-button bg-foreground text-background w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Log In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center mt-6 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            {isLogin ? "No account? " : "Already have one? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
