

# Auto-Generate Extension Icons with AI Image Generation

## Summary
After an extension is generated, automatically create professional icons (16x16, 48x48, 128x128) using the Nano banana image model (`google/gemini-2.5-flash-image`), include them in the ZIP download, and update the manifest to reference them. This removes the current limitation where icons are intentionally omitted.

---

## Flow

```text
User clicks "Download ZIP"
  |
  v
Extract extension name + description from manifest.json
  |
  v
Call new edge function "generate-icon" with a prompt like:
  "A simple, clean app icon for a Chrome extension called [name]: [description].
   Flat design, solid background, no text, square, suitable for 128x128."
  |
  v
Receive base64 PNG from Nano banana API
  |
  v
Client-side: resize to 16x16, 48x48, 128x128 using canvas
  |
  v
Inject icon files (icon16.png, icon48.png, icon128.png) into the ZIP
  |
  v
Patch manifest.json in the ZIP to add the "icons" field
  |
  v
Download the complete ZIP
```

## Changes

### 1. New Edge Function: `supabase/functions/generate-icon/index.ts`

- Accepts `{ prompt: string }` in the request body
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with:
  - model: `google/gemini-2.5-flash-image`
  - modalities: `["image", "text"]`
  - A prompt crafted from the extension name/description
- Returns the base64 image data as JSON: `{ imageBase64: "data:image/png;base64,..." }`

### 2. New Utility: `src/lib/icon-generator.ts`

- `generateIconPrompt(manifest)` -- extracts name + description from the parsed manifest to build an image prompt
- `resizeImage(base64, size)` -- uses an offscreen `<canvas>` to resize the returned image to 16, 48, and 128 pixels
- `generateIcons(manifestContent)` -- orchestrates: calls the edge function, resizes, returns `{ "icon16.png": Blob, "icon48.png": Blob, "icon128.png": Blob }`

### 3. Update `src/lib/zip-export.ts`

- New function `createExtensionZipWithIcons(files, icons)` that:
  - Adds the 3 icon blobs to the ZIP
  - Patches the manifest.json content to include `"icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" }`
  - Falls back to the current icon-less ZIP if generation fails

### 4. Update `src/pages/Workspace.tsx`

- Modify `handleDownload` to:
  - Show a "Generating icons..." loading state on the download button
  - Call `generateIcons()` before creating the ZIP
  - Pass icons to the updated ZIP function
  - If icon generation fails (timeout/error), fall back to ZIP without icons and show a toast warning

### 5. Update System Prompt (edge function)

- Change rule 9 from "NEVER reference icon files" to: "Do NOT include an icons field in manifest.json -- icons will be auto-generated separately."
- This keeps the AI from hallucinating icon references while we handle it programmatically.

---

## Technical Details

### Edge Function: generate-icon

```text
POST /generate-icon
Body: { "prompt": "A flat, minimal icon for..." }
Response: { "imageBase64": "data:image/png;base64,iVBOR..." }
```

Uses `LOVABLE_API_KEY` (already available). No new secrets needed.

### Canvas Resizing

The image model returns a large image. We resize client-side:
- Create an offscreen canvas at each target size (16, 48, 128)
- Draw the source image scaled to fit
- Export as PNG blob via `canvas.toBlob()`

### Manifest Patching

Before zipping, parse manifest.json, inject:
```json
"icons": {
  "16": "icon16.png",
  "48": "icon48.png",
  "128": "icon128.png"
}
```
Then re-serialize.

### Download Button UX

- Default: "Download ZIP"
- During icon generation: spinner + "Generating icons..."
- On success: ZIP downloads with icons included
- On failure: ZIP downloads without icons + warning toast

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/generate-icon/index.ts` |
| Create | `src/lib/icon-generator.ts` |
| Modify | `src/lib/zip-export.ts` |
| Modify | `src/pages/Workspace.tsx` |
| Modify | `supabase/functions/generate-extension/index.ts` (system prompt tweak) |
| Modify | `supabase/config.toml` (add generate-icon function config) |

