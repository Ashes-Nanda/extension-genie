

# Switch Extension Generation to Direct Gemini API

## What Changes

Replace the Lovable AI gateway call in the `generate-extension` edge function with a direct call to Google's Gemini API using your own API key.

## Steps

1. **Add your Gemini API key as a secret** — store it as `GEMINI_API_KEY` so the edge function can access it securely.

2. **Update `supabase/functions/generate-extension/index.ts`**:
   - Replace the Lovable AI gateway URL (`https://ai.gateway.lovable.dev/...`) with the Google Gemini API endpoint (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse`)
   - Use `GEMINI_API_KEY` instead of `LOVABLE_API_KEY` for authentication
   - Adapt the request body from OpenAI-compatible format to Gemini's native format (system instruction + contents array)
   - Transform the SSE response from Gemini's format (`candidates[0].content.parts[0].text`) into the OpenAI-compatible format the frontend already expects (`choices[0].delta.content`), so no frontend changes are needed

3. **No frontend changes** — the edge function will continue to return the same OpenAI-compatible SSE stream format that `stream-chat.ts` already parses.

## Technical Detail

- Gemini model: `gemini-2.5-flash` (fast, capable, cost-effective)
- The SSE transformation happens via a `TransformStream` in the edge function that reads Gemini chunks and re-emits them in `data: {"choices":[{"delta":{"content":"..."}}]}` format
- Rate limit handling (429) and error responses remain the same

