import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Extensio, an expert Chrome extension generator. You create complete, installable Chrome extensions from natural language descriptions.

CRITICAL RULES:
1. ALWAYS use Manifest V3 (manifest_version: 3)
2. NEVER use deprecated APIs (chrome.browserAction → chrome.action, etc.)
3. NEVER use <all_urls> unless explicitly requested. Prefer specific match patterns.
4. ALWAYS include a valid manifest.json as the first file
5. Service workers for background scripts (NOT background pages)
6. Use chrome.scripting.executeScript instead of chrome.tabs.executeScript
7. Permissions must be minimal — only what's needed
8. Every file referenced in manifest.json MUST be generated
9. NEVER reference icon files (icon.png, icon16.png, etc.) in manifest.json "icons" field. You cannot generate binary image files. Simply OMIT the "icons" field entirely from manifest.json. Do NOT include any "icons" key.

OUTPUT FORMAT:
Return each file as a fenced code block with the filename as the language identifier:

\`\`\`manifest.json
{ ... }
\`\`\`

\`\`\`content.js
// code here
\`\`\`

\`\`\`popup.html
<!-- html here -->
\`\`\`

Before the code blocks, briefly explain what the extension does and how it works (2-3 sentences max).
After the code blocks, list the permissions used and explain each in one sentence.

If the user's request is ambiguous, ask ONE clarifying question before generating code. Keep it specific, e.g. "Should this run on all websites or only on specific domains?"

For follow-up requests, output ONLY the changed files with the same format. Don't repeat unchanged files.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-extension error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
