import type { NatalChart } from "./astrologyEngine";
import type { ReportTypeId } from "../types/reportTypes";
import { getSettings, streamChat } from "./volcEngineApi";
import { buildPromptsForReportType, resolveSystemPrompt } from "./reportPrompt";
import { fetchReportPrompts } from "./reportPromptApi";
import { runV2Calculations } from "./v2ScoringEngine";
import { trackEvent } from "../utils/track";
import { localizeAstroText } from "../utils/astroI18n";
import { pushSection } from "../utils/streamStore";

function normalizeLanguage(language?: string): string {
  if (!language) return "en";
  return language.toLowerCase().split("-")[0] || "en";
}

function getOutputLanguageName(language?: string): string {
  const lang = normalizeLanguage(language);
  const names: Record<string, string> = {
    en: "English",
    zh: "Chinese",
    es: "Spanish",
    fr: "French",
    de: "German",
    ja: "Japanese",
    ko: "Korean",
    pt: "Portuguese",
    ru: "Russian",
    ar: "Arabic",
  };
  return names[lang] ?? "English";
}

function appendOutputLanguageInstruction(prompt: string, language?: string): string {
  const outputLanguage = getOutputLanguageName(language);
  return `${prompt}

## Output Language Requirement
You must write the final report in ${outputLanguage}.
This instruction overrides any earlier examples, templates, headings, or wording in another language.
Translate all section headings, labels, scoring descriptions, advice, and narrative text into ${outputLanguage}.
Translate all astrology terms too: planet names, zodiac signs, houses, scores, ages, and chart labels.
Do not output Chinese unless the requested output language is Chinese.`;
}

export async function generateReportText(
  chart: NatalChart,
  reportType: ReportTypeId,
  onChunk?: (text: string) => void,
  language = "en"
): Promise<string> {
  trackEvent('report_generating', true);
  const s = getSettings();
  if (!s.apiKey) throw new Error("未配置 API Key，请先去设置页面配置");

  const calcResult = runV2Calculations(chart);

  const prompts = buildPromptsForReportType(reportType, chart, calcResult);
  const dbPrompts = await fetchReportPrompts();
  const sp = appendOutputLanguageInstruction(resolveSystemPrompt(reportType, dbPrompts.prompts), language);
  const up = appendOutputLanguageInstruction(localizeAstroText(prompts.user, language), language);
  let received = "";
  let lastSplit = 0;

  for await (const chunk of streamChat(s.apiKey, {
    model: s.model || "deepseek-v4-pro",
    messages: [
      { role: "system" as const, content: sp },
      { role: "user" as const, content: up },
    ],
    max_tokens: s.maxTokens || 16384,
    temperature: s.temperature ?? 0.1,
  })) {
    received += chunk;
    onChunk?.(received);

    const headingRegex = /(?:^|\n)#{1,3}\s+[^\n]+/g;
    const positions: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = headingRegex.exec(received)) !== null) {
      const pos = match.index + (match[0].startsWith("\n") ? 1 : 0);
      if (pos >= lastSplit) positions.push(pos);
    }
    while (positions.length >= 2) {
      const start = positions[0];
      const end = positions[1];
      const raw = received.slice(start, end).trim();
      const lines = raw.split("\n");
      const heading = lines[0].replace(/^#{1,3}\s+/, "").trim();
      const content = lines.slice(1).join("\n").trim();
      if (heading && content) {
        pushSection({ heading, content });
      }
      lastSplit = end;
      positions.shift();
    }
  }

  const remaining = received.slice(lastSplit).trim();
  if (remaining) {
    const lines = remaining.split("\n");
    const heading = lines[0]?.replace(/^#{1,3}\s+/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    if (heading && content) {
      pushSection({ heading, content });
    }
  }

  return localizeAstroText(received, language);
}
