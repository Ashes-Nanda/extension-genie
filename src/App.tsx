import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import Workspace from "./pages/Workspace";
import Auth from "./pages/Auth";

import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

function ProtectedRoute({ children, session }: { children: React.ReactNode; session: Session | null }) {
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute session={session}>
            <Workspace />
          </ProtectedRoute>
        }
      />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
