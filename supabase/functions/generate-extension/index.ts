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
9. Do NOT include an "icons" field in manifest.json — icons will be auto-generated separately after code generation. Simply OMIT the "icons" key entirely.
10. NEVER use eval(), new Function(), or any dynamic code execution
11. NEVER load remote scripts via <script src="https://..."> or fetch+eval patterns
12. NEVER include obfuscated code, base64-encoded scripts, or minified blobs
13. NEVER generate extensions that capture passwords, keystrokes, or credentials
14. NEVER generate spyware, keyloggers, data exfiltration tools, or surveillance extensions
15. NEVER generate extensions that silently send user data to external servers without explicit user consent
16. If the user asks for malicious functionality (keylogger, password stealer, screen recorder without consent, browsing history exfiltration), REFUSE and explain why. Do not generate any code for it.

SECURITY RULES FOR GENERATED CODE:
- All event listeners must have specific, scoped selectors — no blanket document-level capture
- No XMLHttpRequest or fetch to unknown/hardcoded external domains unless the user explicitly specifies the endpoint
- No chrome.cookies access unless explicitly required by the described feature
- Content scripts must use specific match patterns, never "*://*/*" unless explicitly requested
- Storage should use chrome.storage.local, never localStorage for sensitive data

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

FOLLOW-UP / ITERATION RULES:
- For follow-up requests, output ALL files that make up the complete extension, not just changed files. This ensures the ZIP always contains the full working extension.
- When the user asks to remove a permission, ensure it is removed from the manifest AND any code using it is also removed.
- When the user asks to change target domains, update both manifest match patterns and any domain checks in code.
- When adding new features, check for conflicts with existing manifest entries.
- Never leave orphaned files — if a file is no longer referenced in manifest.json, do not output it.
- Always re-validate the complete manifest after any change.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["user", "assistant"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message content too long" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
