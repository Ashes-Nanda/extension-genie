

# Rework: Landing-Centric Flow + History Sidebar + Code Typing Animation

## Summary
Three changes: (1) Make the landing page the hub -- prompt "Start Build" requires login, and after auth redirect back to landing, not dashboard. (2) Replace the dashboard with a slide-out history sidebar accessible from the landing page and workspace. (3) Add a typewriter animation to the code viewer so code appears character-by-character as it streams in.

---

## 1. Auth-Gated "Start Build" on Landing Page

**Current behavior:** Clicking "Start Build" navigates to `/workspace` regardless of auth state. A separate "Dashboard" button exists for logged-in users.

**New behavior:**
- When user clicks "Start Build" (or selects a template), check if they are logged in.
- If NOT logged in, redirect to `/auth` with the prompt stored in the URL state (e.g., `navigate("/auth", { state: { redirectPrompt: prompt } })`).
- After successful login/signup on `/auth`, redirect back to `/` with the prompt pre-filled, then auto-trigger navigation to `/workspace`.
- The nav button changes from "Dashboard" to "History" (opens sidebar) when logged in.

**Files changed:**
- `src/pages/Index.tsx` -- gate `handleGenerate` behind auth check; change nav button from "Dashboard" to "History" toggle
- `src/pages/Auth.tsx` -- accept `redirectPrompt` in location state; after auth, navigate to `/` with prompt in state instead of `/dashboard`
- `src/App.tsx` -- remove `/dashboard` route; remove `Dashboard` import

## 2. History Sidebar (Replaces Dashboard)

**New component:** `src/components/HistorySidebar.tsx`

A slide-out drawer/sheet from the right side containing the user's project history. Accessible from both the landing page nav and the workspace top bar.

**Contents:**
- Header: "Your Builds" with close button
- List of projects ordered by `updated_at` desc
- Each item shows: project name (truncated), extension type badge, time ago
- Click a project to navigate to `/workspace` with `projectId` in state
- Delete button per project with confirmation
- Sign out button at the bottom
- Uses the existing Sheet component from shadcn

**Files changed:**
- Create `src/components/HistorySidebar.tsx`
- `src/pages/Index.tsx` -- add sidebar state + trigger button in nav
- `src/pages/Workspace.tsx` -- replace "Dashboard" link with history sidebar trigger
- Delete `src/pages/Dashboard.tsx`

## 3. Code Typing Animation

**Current behavior:** When code is generated, the full file content appears instantly in the `CodeBlock` component once files are parsed.

**New behavior:** Code appears with a typewriter effect, characters revealed progressively.

**Approach:**
- Track a `displayedLength` state that increments via `requestAnimationFrame` or `setInterval`
- Slice the actual code content to `displayedLength` and pass that to `CodeBlock`
- When `activeFile` changes or content updates, reset and re-animate
- Speed: ~20-30 characters per frame for a fast but visible "writing" effect
- When generation is still streaming, the animation keeps pace; once done, it catches up quickly

**Files changed:**
- `src/pages/Workspace.tsx` -- add typing animation state around the `CodeBlock` render in the center pane

---

## Technical Details

### Auth Flow with Redirect

```text
User types prompt -> clicks "Start Build"
  |
  v
Logged in? --YES--> navigate("/workspace", { state: { prompt } })
  |
  NO
  v
navigate("/auth", { state: { redirectPrompt: prompt } })
  |
  v
User logs in / signs up
  |
  v
Auth.tsx detects session -> navigate("/", { state: { prompt: redirectPrompt } })
  |
  v
Index.tsx picks up prompt from state -> auto-navigates to workspace
```

### History Sidebar Structure

Uses the existing `Sheet` component (from `@/components/ui/sheet`):
- `SheetTrigger` in the nav bar
- `SheetContent` side="right" containing project list
- Fetches projects from `supabase.from("projects")` on open
- Each project card is clickable, navigates to workspace

### Typing Animation Logic

```text
- State: visibleChars (number), starts at 0
- On activeFileContent change: reset visibleChars to 0
- useEffect with setInterval (every 16ms, add ~20 chars)
- displayedCode = activeFileContent.slice(0, visibleChars)
- Pass displayedCode to CodeBlock
- When visibleChars >= content.length, clear interval
- Skip animation for user-initiated file tab switches on already-loaded projects
```

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/HistorySidebar.tsx` |
| Modify | `src/pages/Index.tsx` |
| Modify | `src/pages/Auth.tsx` |
| Modify | `src/pages/Workspace.tsx` |
| Modify | `src/App.tsx` |
| Delete | `src/pages/Dashboard.tsx` |

