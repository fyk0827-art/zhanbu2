import type { NatalChart } from "./astrologyEngine";
import type { ReportTypeId } from "../types/reportTypes";
import { getSettings, streamChat } from "./volcEngineApi";
import { buildPromptsForReportType, resolveSystemPrompt } from "./reportPrompt";
import { fetchReportPrompts } from "./reportPromptApi";
import { runV2Calculations } from "./v2ScoringEngine";

export async function generateReportText(
  chart: NatalChart,
  reportType: ReportTypeId,
  onChunk?: (text: string) => void
): Promise<string> {
  const s = getSettings();
  if (!s.apiKey) throw new Error("未配置 API Key，请先去设置页面配置");

  const calcResult = runV2Calculations(chart);
  console.log("[V2.8] Calculated scores:", calcResult.scores);
  console.log("[V2.8] Dominant planet:", calcResult.dominantPlanet);

  const prompts = buildPromptsForReportType(reportType, chart, calcResult);
  const dbPrompts = await fetchReportPrompts();
  const sp = resolveSystemPrompt(reportType, dbPrompts.prompts);
  const up = prompts.user;
  let received = "";

  for await (const chunk of streamChat(s.apiKey, {
    model: s.model || "deepseek-v4-pro-260425",
    messages: [
      { role: "system" as const, content: sp },
      { role: "user" as const, content: up },
    ],
    max_tokens: s.maxTokens || 8192,
    temperature: s.temperature ?? 0.1,
  })) {
    received += chunk;
    onChunk?.(received);
  }
  return received;
}
