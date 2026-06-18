const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export type ReportPromptType = "full" | "simple" | "marriage" | "career";

export interface ReportPromptsResponse {
  prompts: Partial<Record<ReportPromptType, string>>;
  updatedAt: Partial<Record<ReportPromptType, string>>;
}

let cachedPrompts: ReportPromptsResponse | null = null;

export function invalidatePromptCache() {
  cachedPrompts = null;
}

async function parseJson<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export async function fetchReportPrompts(force = false): Promise<ReportPromptsResponse> {
  if (!force && cachedPrompts) return cachedPrompts;
  const res = await fetch(`${API_BASE}/api/report-prompts`);
  cachedPrompts = await parseJson<ReportPromptsResponse>(res);
  return cachedPrompts;
}

export async function verifyReportPromptPassword(password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/report-prompts/verify-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return parseJson<boolean>(res);
}

export async function saveReportPrompts(
  password: string,
  prompts: Partial<Record<ReportPromptType, string>>
): Promise<ReportPromptsResponse> {
  const res = await fetch(`${API_BASE}/api/report-prompts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, prompts }),
  });
  const data = await parseJson<ReportPromptsResponse>(res);
  cachedPrompts = data;
  return data;
}
