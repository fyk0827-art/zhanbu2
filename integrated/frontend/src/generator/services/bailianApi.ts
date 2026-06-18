export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export async function* streamChat(
  apiKey: string,
  request: ChatRequest
): AsyncGenerator<string, void, unknown> {
  const url = `${BASE_URL}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // skip
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function chat(
  apiKey: string,
  request: Omit<ChatRequest, "stream">
): Promise<string> {
  const url = `${BASE_URL}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...request, stream: false }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Settings management
export interface AppSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customPrompt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  model: "qwen-plus",
  temperature: 0.8,
  maxTokens: 4096,
  customPrompt: "",
};

export function getSettings(): AppSettings {
  try {
    const saved = localStorage.getItem("constellation_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem("constellation_settings", JSON.stringify(settings));
}

export const AVAILABLE_MODELS = [
  { value: "qwen-plus", label: "qwen-plus" },
  { value: "qwen-max", label: "qwen-max" },
  { value: "qwen-turbo", label: "qwen-turbo" },
];

// Default system prompt for astrology report
export const DEFAULT_SYSTEM_PROMPT = `你是一位资深的占星学家，擅长将星盘信息转化为温暖、诗意、富有洞察力的人生剧本。
请用中文写作，文风要优雅、感性、有温度，像一位智慧的女性导师在讲述命运的故事。
不要使用任何 markdown 标记，纯文本段落即可。每段之间空一行。`;
