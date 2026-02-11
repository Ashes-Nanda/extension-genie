

# Extensio — MVP Implementation Plan

## Design System
Neo-brutalist visual language throughout:
- Off-white background, single loud accent color (electric blue)
- 2-3px solid black borders, hard drop shadows (no blur)
- Border radius: 0-4px max
- Monospace headings, system sans body text
- Everything should feel confident and raw, not polished

---

## Screen 1: Landing Page
**Goal:** Get users to type a prompt immediately.

- Minimal top bar: Logo + "Docs" link
- Giant headline: *"Describe your idea. Get a working Chrome extension."*
- One massive textarea as the hero element
- Oversized CTA button: **"Generate Extension →"**
- Small trust line below: "Manifest V3 • No hidden permissions • ZIP download"
- "How it works" section: 3 brutalist step cards (Describe → Watch → Download)
- "Why this is different" section: bullet points about Chrome-correctness
- Trust & safety section addressing extension fear
- "Who it's for" cards (non-devs, indie hackers, frontend devs)
- Repeated CTA at bottom
- Minimal footer (Docs, Privacy, Terms)

---

## Screen 2: Intent Clarification (Conditional)
**Goal:** Ask one clarifying question when the prompt is ambiguous.

- Simple card with a single question (e.g., "Where should this run?")
- Chunky radio buttons or simple input
- "Continue →" button
- Appears only when the AI detects ambiguity — otherwise skip straight to workspace

---

## Screen 3: Generation Workspace (Core Product)
**Goal:** The main 3-pane experience where extensions are built.

### Left Pane — Prompt Chat
- Chat-style prompt history showing user messages and AI responses
- Big textarea input at bottom
- "Regenerate" and "Undo" controls
- Terminal/chat hybrid aesthetic

### Center Pane — Code Editor (Read-Only by Default)
- File tree on the left side
- Syntax-highlighted code viewer on the right
- Files appear progressively as AI generates them
- Inline comments auto-injected explaining code intent
- Label: "Generated code — editable, but changes may break validation"

### Right Pane — Status & Actions
- **Extension Type** badge (content script / popup / background)
- **Permissions** list in plain English (e.g., "Reads page content on amazon.com")
- Red warning blocks for sensitive permissions
- **Validation Status** (✔ Ready / ✖ Errors with details)
- **Download ZIP** button — big, loud, undeniable

---

## Screen 4: Validation Errors (Inline)
- Right pane turns red when errors exist
- Error details expand inline with clear descriptions
- "Fix Automatically" button to re-prompt the AI
- Download button disabled until resolved

---

## Screen 5: Download Success (Overlay/Banner)
- Success banner with step-by-step install instructions:
  1. Open chrome://extensions
  2. Enable Developer Mode
  3. Click "Load Unpacked"
- Mono-styled, numbered, boxed steps
- Download ZIP button

---

## AI Backend (Lovable Cloud)
- Edge function using Lovable AI Gateway to power:
  - **Intent parsing**: Convert natural language → extension type, scope, permissions
  - **Code generation**: Stream Manifest V3-compliant extension code (manifest.json, scripts, popup HTML/CSS)
  - **Clarification questions**: When intent is ambiguous
  - **Iterative refinement**: Handle follow-up prompts ("add dark mode", "only run on LinkedIn")
- Specialized system prompt enforcing Chrome extension correctness, Manifest V3 only, explicit permissions
- Streaming responses for real-time code appearance

---

## Validation & ZIP Export
- Client-side manifest.json validation before download
- Check for missing files, invalid permissions, deprecated APIs
- Bundle all generated files into a downloadable ZIP
- Ensure the ZIP is directly loadable via Chrome's "Load Unpacked"

