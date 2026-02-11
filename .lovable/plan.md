
# Extensio — Feature Roadmap Plan

## Overview
This plan covers the most impactful features to add, organized by priority tiers. Each tier builds on the previous one.

---

## Tier 1: Foundation (Persistence + Auth + History)
These are blockers for scalability. Without them, every session is throwaway.

### 1A. User Authentication
- Add email/password signup and login using the built-in auth system
- Create a minimal auth page at `/auth` with login/signup toggle
- Protect the workspace route so generations are tied to a user
- Add a user avatar/menu in the top bar with sign-out

### 1B. Database Schema
Create tables to persist user work:
- **projects** — stores each generation session (id, user_id, name, created_at, updated_at)
- **project_files** — stores generated files per project (id, project_id, filename, content)
- **project_messages** — stores chat history (id, project_id, role, content, created_at)
- RLS policies scoped to `auth.uid()` on all tables

### 1C. Project History Dashboard
- New `/dashboard` page showing a grid of past projects
- Each card shows: project name (derived from first prompt), extension type badge, file count, last modified date
- Click to reopen a project in the workspace and continue iterating
- Delete projects with confirmation

---

## Tier 2: UX Polish (Mobile + Dark Mode + Templates)

### 2A. Responsive Workspace
- On screens below 768px, collapse to a single-pane view with tab navigation (Chat | Code | Status)
- Use the existing `useIsMobile` hook
- Swipeable panes or bottom tab bar

### 2B. Dark Mode Toggle
- Add a theme toggle button in the nav bar
- Wire up the existing `next-themes` package (already installed)
- Dark mode CSS variables are already defined in `index.css`

### 2C. Template Gallery
- Expand the 3 landing page chips into a browsable modal/page with 10-15 categorized templates
- Categories: Productivity, Social Media, Developer Tools, Shopping, Accessibility
- Each template has a title, one-line description, and pre-filled prompt
- Clicking a template navigates directly to workspace

---

## Tier 3: Intelligence (Clarification + Better Iterations)

### 3A. Intent Clarification Screen
- As outlined in the original plan: when the AI responds with a question instead of code, render it as a dedicated clarification UI (radio buttons or simple input) instead of raw chat text
- Detect clarification responses by checking if the AI output contains no code blocks
- Show a styled card with the question and chunky answer options

### 3B. Undo / Version History
- Store each generation iteration as a version snapshot in the database
- Add "Undo" and "Redo" buttons in the workspace toolbar
- Show a version timeline in the status panel (v1, v2, v3...)
- Click any version to restore that file state

### 3C. Inline Code Editing
- Make the code viewer editable (contenteditable or a lightweight editor)
- Show a warning banner: "Manual edits may break validation"
- Re-run validation on blur
- Sync edits back to the files state so the ZIP reflects changes

---

## Tier 4: Growth (Sharing + SEO + Docs)

### 4A. Shareable Build Links
- Generate a unique URL for each project (e.g., `/build/abc123`)
- Public read-only view showing the code and extension metadata
- "Fork this build" button to clone into a new project

### 4B. SEO and Meta Tags
- Add proper `<title>` and `<meta>` tags per page
- OG image and description for social sharing
- Sitemap for the landing page

### 4C. Docs, Privacy, Terms Pages
- Create simple static pages at `/docs`, `/privacy`, `/terms`
- Wire up the dead footer links
- Docs page: quick-start guide, FAQ, supported extension types

### 4D. Usage Dashboard
- Show remaining credits / rate limit status in the workspace top bar
- Proactive warning when approaching limits instead of only error toasts

---

## Technical Details

### Database Migration SQL (Tier 1B)
```text
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
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- project_messages table
CREATE TABLE public.project_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (all scoped to auth.uid())
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "users_own_projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_files" ON public.project_files
  FOR ALL USING (project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "users_own_messages" ON public.project_messages
  FOR ALL USING (project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  ));
```

### New Routes
```text
/auth         — Login/Signup page
/dashboard    — Project history grid
/workspace    — Generation workspace (existing)
/build/:id    — Shareable read-only view (Tier 4)
/docs         — Documentation
/privacy      — Privacy policy
/terms        — Terms of service
```

### Files to Create/Modify
- `src/pages/Auth.tsx` — Authentication page
- `src/pages/Dashboard.tsx` — Project history
- `src/pages/Workspace.tsx` — Add save/load logic, undo, mobile layout
- `src/components/ThemeToggle.tsx` — Dark mode switch
- `src/components/TemplateGallery.tsx` — Browsable template modal
- `src/components/MobileWorkspace.tsx` — Single-pane mobile layout
- `src/App.tsx` — Add new routes and auth guards

### Suggested Implementation Order
1. Auth + Database + History (Tier 1) — unlocks persistence
2. Dark mode + Mobile responsive (Tier 2A-B) — quick wins
3. Templates + Clarification UI (Tier 2C + 3A) — better UX
4. Undo/Versioning + Code editing (Tier 3B-C) — power features
5. Sharing + SEO + Docs (Tier 4) — growth features
