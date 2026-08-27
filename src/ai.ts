import { requestUrl } from "obsidian";
import type { PromptMessage } from "./prompts";
import type { ProviderProtocol } from "./types";

export interface AiRequest {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  protocol: ProviderProtocol;
  instructions: string;
  messages: PromptMessage[];
  maxOutputTokens: number;
}

interface ResponseContentPart {
  type?: string;
  text?: string;
}

interface ResponseOutputItem {
  type?: string;
  content?: ResponseContentPart[];
}

interface ResponsesPayload {
  output_text?: string;
  output?: ResponseOutputItem[];
  error?: { message?: string };
}

interface ChatCompletionsPayload {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function parseResponsesPayload(payload: ResponsesPayload): string {
  if (payload.error?.message) throw new Error(payload.error.message);
  if (payload.output_text?.trim()) return payload.output_text.trim();
  const text = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("The AI provider returned no text output.");
  return text;
}

export async function createTutorResponse(request: AiRequest): Promise<string> {
  if (!request.apiKey.trim()) throw new Error("Add an API key in Synthesis Learning settings first.");
  const headers = {
    Authorization: `Bearer ${request.apiKey}`,
    "Content-Type": "application/json"
  };
  if (request.protocol === "chat-completions") {
    const response = await requestUrl({
      url: endpoint(request.apiBaseUrl, "chat/completions"),
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: "system", content: request.instructions },
          ...request.messages
        ],
        max_tokens: request.maxOutputTokens
      })
    });
    const payload = response.json as ChatCompletionsPayload;
    if (payload.error?.message) throw new Error(payload.error.message);
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("The AI provider returned no text output.");
    return content;
  }

  const response = await requestUrl({
    url: endpoint(request.apiBaseUrl, "responses"),
    method: "POST",
    headers,
    body: JSON.stringify({
      model: request.model,
      instructions: request.instructions,
      input: request.messages,
      max_output_tokens: request.maxOutputTokens,
      store: false
    })
  });
  return parseResponsesPayload(response.json as ResponsesPayload);
}

