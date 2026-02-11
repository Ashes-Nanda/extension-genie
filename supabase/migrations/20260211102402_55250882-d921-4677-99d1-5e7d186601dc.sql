
-- projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Extension',
  extension_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- project_files table
CREATE TABLE public.project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- project_messages table
CREATE TABLE public.project_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Projects: users can CRUD their own
CREATE POLICY "users_select_own_projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Project files: scoped via project ownership
CREATE POLICY "users_select_own_files" ON public.project_files FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_insert_own_files" ON public.project_files FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_update_own_files" ON public.project_files FOR UPDATE USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_delete_own_files" ON public.project_files FOR DELETE USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

-- Project messages: scoped via project ownership
CREATE POLICY "users_select_own_messages" ON public.project_messages FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_insert_own_messages" ON public.project_messages FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_update_own_messages" ON public.project_messages FOR UPDATE USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_delete_own_messages" ON public.project_messages FOR DELETE USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

-- Trigger for updated_at on projects
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
