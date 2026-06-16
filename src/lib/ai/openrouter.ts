const BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
// Separate model for image tasks (OCR) — must be vision-capable. Defaults to a
// free Google Gemma multimodal model, which transcribes Thai + English well.
// Override per OpenRouter availability (the free roster rotates).
const VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || "google/gemma-4-26b-a4b-it:free";

export type CallAIOptions = {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
};

export async function callAI({
  systemPrompt,
  userPrompt,
  maxTokens = 800,
}: CallAIOptions): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export type CallAIVisionOptions = {
  systemPrompt: string;
  userPrompt: string;
  /** A data URL (data:image/...;base64,...) or a publicly reachable image URL. */
  imageUrl: string;
  maxTokens?: number;
};

/**
 * Single-shot vision call: send an image plus a text instruction to a
 * vision-capable model and return its text reply. Used for OCR of brief images.
 */
export async function callAIVision({
  systemPrompt,
  userPrompt,
  imageUrl,
  maxTokens = 2000,
}: CallAIVisionOptions): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function* callAIStream({
  systemPrompt,
  userPrompt,
  maxTokens = 800,
}: CallAIOptions): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = json.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content) yield content;
          } catch {
            // ignore non-JSON lines (e.g. comments)
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
