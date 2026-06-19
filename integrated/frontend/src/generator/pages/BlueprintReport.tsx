import { useState, useMemo, useEffect, useRef, type ElementType } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Settings, Download, Star, Heart, AlertTriangle, Users, Wallet, Home,
  Briefcase, Compass, KeyRound, Moon, Sparkles, Zap, CheckCircle2,
} from "lucide-react";
import type { NatalChart } from "../services/astrologyEngine";
import { getGlobalReportText, setGlobalReportText, getGlobalReportType } from "../App";
import { getTranslatedReportMeta, parseReportTypeId } from "../types/reportTypes";
import { loadReportText, saveReportText, loadReportId, saveReportId, loadBirthData } from "../services/reportStore";
import { fetchReportFromServer, saveReportToServer } from "../services/reportApi";
import { runV2Calculations } from "../services/v2ScoringEngine";
import { computeReportId } from "../services/reportId";
import { useReportUnlock } from "../hooks/useReportUnlock";
import { getPaymentLabels } from "../services/paymentApi";
import { getRouterSearchParams } from "../utils/routerQuery";
import { generatorPath } from "../utils/generatorNav";
import { ReportDeepReadingCTA } from "../components/ReportDeepReadingCTA";
import { PaywallCard, LockedPreview } from "../components/ReportPaywall";
import { ReportIdentitySection } from "../components/ReportIdentitySection";
import { MarriageReportView, parseMarriageCoverMeta } from "../components/MarriageReportView";
import { CareerReportView, parseCareerCoverMeta } from "../components/CareerReportView";
import { PAYMENT_DISABLED } from "../services/paymentApi";
import { localizeAstroText } from "../utils/astroI18n";
import * as echarts from "echarts";
import { generateReportText } from "../services/reportGenerator";
import PrismAnalysisAnimation from "@/components/prism/PrismAnalysisAnimation";

interface Props { chart: NatalChart | null; }

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";
const LIGHT = "#EDE9FE";
const CARD_BORDER = "#f0e6d3";
const PURPLE_MID = "#7C4FB8";
const PURPLE_LIGHT = "#A78BDB";

const PLANET_ICONS: Record<string, ElementType> = {
  太阳: Star, 月亮: Moon, 水星: Sparkles, 金星: Star, 火星: Zap,
  木星: Sparkles, 土星: Compass, 天王星: Zap, 海王星: Moon, 冥王星: Star,
};
const TALENT_COLORS = [PRIMARY, PURPLE_MID, PURPLE_LIGHT];
const PHASE_COLORS = [PRIMARY, PURPLE_MID, DARK];

// ===== SECTION SPLITTER =====
function splitChineseSections(text: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const regex = /(?:^|\n)(?:\*\*)?【((?:第[一二三四五六七八九十]+部分[：:]|封面·)[^】]+)】(?:\*\*)?(?:\s*\n+|$)/g;
  const matches: { heading: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) matches.push({ heading: m[1].trim(), start: m.index! + m[0].length });
  if (matches.length === 0) {
    const h3Regex = /(?:^|\n)#{2,3}\s+(.+?)(?:\n+|$)/g;
    while ((m = h3Regex.exec(text)) !== null) matches.push({ heading: m[1].trim(), start: m.index! + m[0].length });
  }
  if (matches.length > 0 && matches[0].start > 0) {
    const cover = text.slice(0, matches[0].start).trim();
    if (cover) sections.push({ heading: "__cover__", content: cover });
  }
  for (let i = 0; i < matches.length; i++) {
    const end = i + 1 < matches.length ? matches[i + 1].start - 1 : text.length;
    sections.push({ heading: matches[i].heading, content: text.slice(matches[i].start, end).trim() });
  }
  if (sections.length === 0 && text.trim()) sections.push({ heading: "__all__", content: text });
  return sections;
}

function shouldUseChinese(language: string): boolean {
  return language.toLowerCase().startsWith("zh");
}

function isReportLanguageMismatch(text: string, language: string): boolean {
  if (!text.trim()) return false;
  if (shouldUseChinese(language)) return false;

  const normalized = text.replace(/\s+/g, "");
  const chineseReportSignals = [
    "第一部分", "第二部分", "第三部分", "第四部分", "第五部分",
    "你是谁", "天赋与行业", "性格与资源", "人生各领域", "人生脉络",
    "环境与贵人", "避坑指南", "总结与行动", "感情画像", "事业画像",
  ];
  if (chineseReportSignals.some((signal) => text.includes(signal))) return true;

  const cjkCount = (normalized.match(/[\u3400-\u9fff]/g) || []).length;
  if (cjkCount < 80) return false;
  return cjkCount / Math.max(normalized.length, 1) > 0.25;
}

function getGenericFreeCount(reportType: string): number {
  if (reportType === "simple") return 3;
  if (reportType === "marriage" || reportType === "career") return 3;
  return 3;
}

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function premiumKeywordsFor(reportType: string): string[] {
  if (reportType === "simple") {
    return ["人生各领域", "总结", "life areas", "life domains", "summary", "action"];
  }
  if (reportType === "marriage") {
    return [
      "正缘", "关系痛点", "关系修复", "行动指令",
      "soulmate", "right person", "relationship pain", "pain points", "relationship repair", "repair", "action",
    ];
  }
  if (reportType === "career") {
    return [
      "事业卡点", "突破策略", "创业还是打工", "行动指令",
      "career blocker", "blockers", "breakthrough", "startup", "employment", "employee", "action",
    ];
  }
  return [
    "人生脉络", "环境与贵人", "避坑", "总结",
    "life timeline", "life path", "life stages", "environment", "benefactor", "support",
    "pitfall", "avoid", "summary", "action",
    "life areas", "life domains", "life fields",
  ];
}

function cleanMd(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^\s*[·•\-]\s*/gm, "• ").trim();
}

function extractBetween(text: string, start: string, end?: string[]): string {
  const sEsc = start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const endAlt = end?.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:\\d+条)?").join("|");
  const startPat = `(?:【|\\*\\*)?${sEsc}(?:\\d+条)?(?:】|\\*\\*)?[：:]?`;
  const pat = end?.length
    ? new RegExp(`${startPat}\\s*([\\s\\S]*?)(?=(?:【|\\*\\*)?(?:${endAlt})(?:】|\\*\\*)?[：:]?|$)`, "i")
    : new RegExp(`${startPat}\\s*([\\s\\S]*?)(?=\\n(?:【|\\*\\*)|$)`, "i");
  const match = text.match(pat);
  return match ? stripMdArtifacts(match[1].trim()) : "";
}

function stripMdArtifacts(text: string): string {
  return text
    .replace(/^#{1,6}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseCharacterByBoldHeaders(content: string) {
  const sections = { strengths: "", weaknesses: "", opportunities: "" };
  const re = /\*\*([^*]+)\*\*\s*/g;
  const hits: { label: string; start: number; headerEnd: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    hits.push({ label: m[1].trim(), start: m.index!, headerEnd: m.index! + m[0].length });
  }

  const classify = (label: string): keyof typeof sections | null => {
    const l = label.replace(/\d+条/g, "").trim();
    if (/优势|强项/.test(l)) return "strengths";
    if (/劣势|短板|弱点/.test(l)) return "weaknesses";
    if (/机会|资源/.test(l)) return "opportunities";
    return null;
  };

  for (let i = 0; i < hits.length; i++) {
    const kind = classify(hits[i].label);
    if (!kind) continue;
    const bodyStart = hits[i].headerEnd;
    const bodyEnd = i + 1 < hits.length ? hits[i + 1].start : content.length;
    const body = stripMdArtifacts(content.slice(bodyStart, bodyEnd).trim());
    if (body.length > 5) {
      sections[kind] = sections[kind] ? `${sections[kind]}\n\n${body}` : body;
    }
  }
  return sections;
}

function InlineMd({ text }: { text: string }) {
  if (!text) return null;
  const { i18n } = useTranslation();
  const parts = localizeAstroText(text, i18n.language).split(/(\*\*.+?\*\*)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="text-amber-300 font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function AiParagraphs({ text, tone = "light" }: { text: string; tone?: "light" | "dark" }) {
  if (!text) return null;
  const bodyCls = tone === "dark"
    ? "text-sm text-white/85 leading-relaxed mb-2"
    : "text-sm text-gray-700 leading-relaxed mb-2";
  const numberedCls = `${bodyCls} flex items-start gap-3`;

  type Block = { kind: "numbered"; num: string; body: string } | { kind: "bullet"; body: string } | { kind: "para"; body: string };
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (!t || t.match(/^#{1,6}\s*$/) || t.match(/^#{2,3}\s/) || t.match(/^\*?\*?【.+】\*?\*?$/)) continue;
    if (t.startsWith("---")) continue;
    const numMatch = t.match(/^(\d+)[.、．)]\s*(.+)/);
    if (numMatch) {
      blocks.push({ kind: "numbered", num: numMatch[1], body: numMatch[2] });
      continue;
    }
    if (t.match(/^[-–•·✕]/)) {
      blocks.push({ kind: "bullet", body: t.replace(/^[-–•·✕]\s*/, "") });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === "numbered" && !t.match(/^(优势|劣势|机会|性格)/)) {
      last.body += `\n${t}`;
      continue;
    }
    blocks.push({ kind: "para", body: t });
  }

  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === "numbered") {
          return (
            <div key={i} className={`${numberedCls} mb-3`}>
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: PRIMARY }}>{block.num}</span>
              <span className="pt-0.5 flex-1"><InlineMd text={block.body} /></span>
            </div>
          );
        }
        if (block.kind === "bullet") {
          return (
            <p key={i} className={`${bodyCls} flex items-start gap-2`}>
              <span className="text-gray-400 mt-0.5">•</span>
              <span><InlineMd text={block.body} /></span>
            </p>
          );
        }
        return <p key={i} className={bodyCls}><InlineMd text={block.body} /></p>;
      })}
    </>
  );
}

function parseCharacterByLineHeaders(content: string) {
  const sections = { strengths: "", weaknesses: "", opportunities: "" };
  const lines = content.split("\n");
  let current: keyof typeof sections | null = null;
  const buf: string[] = [];

  const flush = () => {
    if (!current || buf.length === 0) return;
    const text = stripMdArtifacts(buf.join("\n"));
    if (text) sections[current] = sections[current] ? `${sections[current]}\n\n${text}` : text;
    buf.length = 0;
  };

  for (const raw of lines) {
    const t = raw.trim();
    const hm = t.match(/^(?:【|\*\*)?(性格优势|性格劣势|优势|劣势|机会与资源|机会|资源)(?:\d+条)?(?:】|\*\*)?[：:]?\s*$/);
    if (hm) {
      flush();
      const k = hm[1];
      if (/优势/.test(k)) current = "strengths";
      else if (/劣势/.test(k)) current = "weaknesses";
      else current = "opportunities";
      continue;
    }
    if (current) buf.push(raw);
  }
  flush();
  return sections;
}

function extractSubsection(text: string, starts: string[], ends?: string[]): string {
  for (const start of starts) {
    const chunk = extractBetween(text, start, ends);
    if (chunk.trim().length > 10) return chunk;
  }
  return "";
}

function parseCharacterSections(content: string) {
  const fromExtract = {
    strengths: extractSubsection(
      content,
      ["性格优势", "优势2条", "优势"],
      ["性格劣势", "劣势2条", "劣势", "性格短板", "短板", "机会与资源", "机会2条", "机会"]
    ),
    weaknesses: extractSubsection(
      content,
      ["性格劣势", "劣势2条", "劣势", "性格短板", "短板"],
      ["机会与资源", "机会2条", "机会", "发展机会"]
    ),
    opportunities: extractSubsection(
      content,
      ["机会与资源", "机会2条", "机会", "发展机会", "可利用资源"]
    ),
  };

  const fromBold = parseCharacterByBoldHeaders(content);
  const fromLines = parseCharacterByLineHeaders(content);

  return {
    strengths: fromExtract.strengths || fromBold.strengths || fromLines.strengths,
    weaknesses: fromExtract.weaknesses || fromBold.weaknesses || fromLines.weaknesses,
    opportunities: fromExtract.opportunities || fromBold.opportunities || fromLines.opportunities,
  };
}

function parseEnvironmentSections(content: string): { title: string; text: string }[] {
  const blocks = [
    { title: "最适合的环境", keys: ["最适合你的环境", "最适合的环境", "环境适应", "适合的环境", "环境"] },
    { title: "最需要的贵人", keys: ["最需要的贵人", "身边需要谁", "需要的贵人", "贵人建议"] },
    { title: "旺财贵人", keys: ["旺财贵人", "财运贵人"] },
    { title: "必须远离", keys: ["必须远离", "远离谁", "一定要远离", "远离的人", "需要远离"] },
  ];
  const parsed = blocks
    .map((b) => ({ title: b.title, text: extractSubsection(content, b.keys) }))
    .filter((b) => b.text.trim().length > 8);
  return parsed.length > 0 ? parsed : [{ title: "环境与贵人", text: content }];
}

function parsePitfallBlocks(content: string): {
  key: string;
  title: string;
  icon: ElementType;
  bg: string;
  border: string;
  titleColor: string;
  mark: string;
  special?: boolean;
  items: string[];
}[] {
  const templates = [
    { key: "一定要避开的人", title: "一定要避开的人", icon: Users, bg: "#FFF5F5", border: "#FECACA", titleColor: "#B91C1C", mark: "text-red-400", keys: ["一定要避开的人", "避开的人", "远离的人", "不要靠近的人"] },
    { key: "一定要避开的事", title: "一定要避开的事", icon: AlertTriangle, bg: "#FFFBEB", border: "#FDE68A", titleColor: "#B45309", mark: "text-yellow-500", keys: ["一定要避开的事", "避开的事", "不要做的事"] },
    { key: "一定要避开的环境", title: "一定要避开的环境", icon: Home, bg: "#EFF6FF", border: "#BFDBFE", titleColor: "#1D4ED8", mark: "text-blue-400", keys: ["一定要避开的环境", "避开的环境", "危险环境"] },
    { key: "特别版避坑", title: "针对你的特别版", icon: Star, bg: LIGHT, border: PRIMARY, titleColor: DARK, mark: "", special: true as const, keys: ["特别版避坑", "特别版", "最容易踩的3个坑", "最容易踩的坑", "核心避坑"] },
  ];

  const blocks = templates.map((b) => {
    const chunk = extractSubsection(content, [...b.keys]);
    const items = parseListItems(chunk);
    const { keys: _keys, ...rest } = b;
    return {
      ...rest,
      items: items.length > 0 ? items : (chunk.trim() ? [chunk.trim()] : []),
    };
  }).filter((b) => b.items.length > 0);

  if (blocks.length > 0) return blocks;

  const fallbackItems = parseListItems(content);
  if (fallbackItems.length > 0) {
    return [{
      key: "避坑要点",
      title: "避坑要点",
      icon: AlertTriangle,
      bg: "#FFFBEB",
      border: "#FDE68A",
      titleColor: "#B45309",
      mark: "text-yellow-500",
      special: false,
      items: fallbackItems,
    }];
  }

  return [{
    key: "避坑指南",
    title: "避坑指南",
    icon: AlertTriangle,
    bg: "#FFFBEB",
    border: "#FDE68A",
    titleColor: "#B45309",
    mark: "text-yellow-500",
    special: false,
    items: [content.trim()],
  }];
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}15` }}>
        <Icon size={20} style={{ color: PRIMARY }} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-orange-400">{subtitle}</p>
      </div>
    </div>
  );
}

function RadarChart({ data, title }: { data: { name: string; score: number }[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const el = ref.current;
    const chart = echarts.init(el);
    const applyOption = () => {
      chart.setOption({
        title: { text: title, left: "center", top: 4, textStyle: { fontSize: 11, color: DARK, fontWeight: 600 } },
        radar: {
          indicator: data.map(d => ({ name: d.name, max: 100 })),
          center: ["50%", "55%"], radius: "58%",
          axisName: { color: "#6B7280", fontSize: 9 },
          splitArea: { areaStyle: { color: ["#F9F7FC", "#FFFFFF"] } },
          axisLine: { lineStyle: { color: "#E5E0ED" } },
          splitLine: { lineStyle: { color: "#E5E0ED" } },
        },
        series: [{
          type: "radar",
          data: [{
            value: data.map(d => d.score),
            areaStyle: { color: "rgba(91,58,140,0.25)" },
            lineStyle: { color: PRIMARY, width: 2 },
            itemStyle: { color: PRIMARY },
          }],
        }],
      }, true);
      chart.resize();
    };
    applyOption();
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => chart.resize())
      : null;
    ro?.observe(el);
    const onWinResize = () => chart.resize();
    window.addEventListener("resize", onWinResize);
    requestAnimationFrame(() => chart.resize());
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onWinResize);
      chart.dispose();
    };
  }, [data, title]);
  return <div ref={ref} className="w-full h-52 min-h-[208px]" />;
}

function BarChart({ data, title }: { data: { name: string; score: number; fullLabel?: string }[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const el = ref.current;
    const chart = echarts.init(el);
    const sorted = [...data].sort((a, b) => a.score - b.score);
    const applyOption = () => {
      chart.setOption({
        title: { text: title, left: "center", top: 4, textStyle: { fontSize: 11, color: DARK, fontWeight: 600 } },
        grid: { top: 36, right: 48, bottom: 24, left: 8, containLabel: true },
        xAxis: { type: "value", max: 100, axisLabel: { fontSize: 9, color: "#9CA3AF" }, splitLine: { lineStyle: { color: "#F3F0F8" } } },
        yAxis: {
          type: "category",
          data: sorted.map(d => d.fullLabel || d.name),
          axisLabel: { fontSize: 8, color: "#4B5563", width: 72, overflow: "truncate" },
          axisLine: { show: false }, axisTick: { show: false },
        },
        series: [{
          type: "bar",
          data: sorted.map((d, i) => ({
            value: d.score,
            itemStyle: {
              color: [PURPLE_LIGHT, PURPLE_MID, PRIMARY][i % 3] || PRIMARY,
              borderRadius: [0, 4, 4, 0],
            },
            label: { show: true, position: "right", formatter: "{c} pts", fontSize: 9, color: DARK },
          })),
          barWidth: "50%",
        }],
      }, true);
      chart.resize();
    };
    applyOption();
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => chart.resize())
      : null;
    ro?.observe(el);
    const onWinResize = () => chart.resize();
    window.addEventListener("resize", onWinResize);
    requestAnimationFrame(() => chart.resize());
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onWinResize);
      chart.dispose();
    };
  }, [data, title]);
  return <div ref={ref} className="w-full h-52 min-h-[208px]" />;
}

function parseListItems(text: string): string[] {
  if (!text) return [];
  return text.split(/\n/).map(l => cleanMd(l.trim())).filter(l => l.length > 4 && !l.match(/^#{1,3}\s/));
}

function parseLifeTimeline(content: string): {
  phases: { age: string; title: string; desc: string }[];
  dimensions: { label: string; desc: string }[];
} {
  const phases: { age: string; title: string; desc: string }[] = [];
  const dimensions: { label: string; desc: string }[] = [];
  const dimBoundary = String.raw`\n\s*[•◦\-]?\s*\*?\*?(?:情感|财富|事业|健康|成长)线`;

  const parenRe = new RegExp(
    String.raw`(\d+)[\-–](\d+)岁[（(]([^)）]+)[）)]\s*([\s\S]*?)(?=(?:\d+)[\-–](?:\d+)岁[（(]|(?:\d+)岁\+[：:（(]|${dimBoundary}|$)`,
    "g"
  );
  for (const m of content.matchAll(parenRe)) {
    phases.push({
      age: `${m[1]}-${m[2]}岁`,
      title: m[3].trim(),
      desc: cleanMd(m[4]).trim().slice(0, 500),
    });
  }

  if (phases.length === 0) {
    const colonRe = new RegExp(
      String.raw`(\d+)[\-–](\d+)岁[：:]\s*([^\n]+)\n?([\s\S]*?)(?=\n\d+[\-–]\d+岁[：:]|\n\d+岁\+[：:]|${dimBoundary}|$)`,
      "g"
    );
    for (const m of content.matchAll(colonRe)) {
      phases.push({
        age: `${m[1]}-${m[2]}岁`,
        title: m[3].trim(),
        desc: cleanMd(m[4]).trim().slice(0, 500),
      });
    }
  }

  if (phases.length === 0) {
    const plusRe = new RegExp(
      String.raw`(\d+)岁\+[：:]\s*([^\n]+)\n?([\s\S]*?)(?=\n\d+[\-–]\d+岁|\n\d+岁\+[：:]|${dimBoundary}|$)`,
      "g"
    );
    for (const m of content.matchAll(plusRe)) {
      phases.push({
        age: `${m[1]}岁+`,
        title: m[2].trim(),
        desc: cleanMd(m[3]).trim().slice(0, 500),
      });
    }
  }

  const dimRe = /[•◦\-]?\s*\*?\*?(情感线|财富线|事业线|健康线|成长线)\*?\*?[：:]\s*([^\n]+)/g;
  for (const m of content.matchAll(dimRe)) {
    dimensions.push({ label: m[1], desc: cleanMd(m[2]).trim() });
  }

  return { phases, dimensions };
}

// ===== MAIN =====
export default function BlueprintReport({ chart }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const label = (zh: string, en: string) => (shouldUseChinese(i18n.language) ? zh : en);
  const display = (text: string) => localizeAstroText(text, i18n.language);

  const PLANET_LABELS: Record<string, string> = {
    太阳: t('planetExplorer'), 月亮: t('planetEmpath'), 水星: t('planetThinker'),
    金星: t('planetHarmonizer'), 火星: t('planetActionTaker'), 木星: t('planetVisionary'),
    土星: t('planetBuilder'), 天王星: t('planetDisruptor'), 海王星: t('planetDreamweaver'),
    冥王星: t('planetTransformer'),
  };

  const LIFE_AREA_META: { keys: string[]; title: string; icon: ElementType }[] = [
    { keys: ["恋爱", "亲密"], title: t('areaLove'), icon: Heart },
    { keys: ["正财", "价值"], title: t('areaWealth'), icon: Wallet },
    { keys: ["婚姻", "合作"], title: t('areaMarriage'), icon: Users },
    { keys: ["人生钥匙", "钥匙", "命主"], title: t('areaLifeKey'), icon: KeyRound },
    { keys: ["家庭", "根基"], title: t('areaFamily'), icon: Home },
    { keys: ["事业", "名声"], title: t('areaCareer'), icon: Briefcase },
    { keys: ["工作", "健康"], title: t('areaWorkHealth'), icon: Compass },
    { keys: ["偏财", "深层"], title: t('areaDeepResources'), icon: Star },
  ];

  const [restoredChart, setRestoredChart] = useState<NatalChart | null>(null);
  const activeChart = chart ?? restoredChart;
  const [restoring, setRestoring] = useState(false);
  const reportType = parseReportTypeId(
    getRouterSearchParams().get("reportType") || getGlobalReportType()
  );
  const reportMeta = getTranslatedReportMeta(t, reportType);
  const [unifiedPriceYuan, setUnifiedPriceYuan] = useState(reportMeta.priceYuan);
  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "";
    fetch(`${apiBase}/api/age-groups`)
      .then((r) => r.json())
      .then((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data) && data.length > 0 && data[0].price) {
          setUnifiedPriceYuan(Number(data[0].price).toFixed(2));
        }
      })
      .catch(() => {});
  }, []);

  const [reportText, setReportText] = useState(
    () => loadReportText(reportType) || getGlobalReportText() || ""
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genCharCount, setGenCharCount] = useState(0);
  const autoGenRef = useRef(false);
  const languageRepairRef = useRef(false);
  const [reportId, setReportId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getRouterSearchParams().get("reportId") || loadReportId(reportType);
  });

  useEffect(() => {
    const birth = activeChart?.birthData ?? loadBirthData() ?? undefined;
    if (!birth) return;
    computeReportId(birth, reportType).then((computed) => {
      setReportId((prev) => {
        const next = prev ?? computed;
        if (next) saveReportId(next, reportType);
        return next;
      });
    });
  }, [activeChart, reportType]);

  useEffect(() => {
    if (!activeChart || !reportText || languageRepairRef.current) return;
    if (!isReportLanguageMismatch(reportText, i18n.language)) return;
    languageRepairRef.current = true;
    autoGenRef.current = false;
    setReportText("");
    setGlobalReportText("", reportType);
    saveReportText("", reportType);
  }, [activeChart, reportText, reportType, i18n.language]);

  useEffect(() => {
    if (!activeChart || reportText || autoGenRef.current) return;
    autoGenRef.current = true;
    setGenerating(true);
    setGenError(null);
    generateReportText(activeChart, reportType, (text) => setGenCharCount(text.length), i18n.language)
      .then((text) => {
        if (!text.trim()) throw new Error(t("errorEmptyReport"));
        setReportText(text);
        setGlobalReportText(text, reportType);
        saveReportText(text, reportType);
      })
      .catch((e) => setGenError(e instanceof Error ? e.message : String(e)))
      .finally(() => setGenerating(false));
  }, [activeChart, reportText, reportType, i18n.language, t]);

  const {
    isUnlocked,
    orderId,
    paidAt,
    tradeNo,
    loading: unlockLoading,
    paying,
    error: payError,
    wechatHint,
    isWeChatInApp,
    paymentMode,
    confirmingReturn,
    pollExhausted,
    startPay,
    refresh: refreshUnlock,
  } = useReportUnlock(reportId, { reportType });

  /** 支付宝回跳后内存中无 chart，从服务器恢复（解锁后才有 chartJson / 全文） */
  useEffect(() => {
    if (chart || !reportId) return;
    let cancelled = false;
    setRestoring(true);
    (async () => {
      try {
        const data = await fetchReportFromServer(reportId);
        if (cancelled) return;
        if (data?.chartJson) setRestoredChart(data.chartJson);
        if (data?.reportText) {
          setReportText(data.reportText);
          setGlobalReportText(data.reportText);
          saveReportText(data.reportText);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, reportId, isUnlocked]);

  /** 已付费：从数据库恢复星盘与报告正文（换设备/清缓存） */
  useEffect(() => {
    if (!reportId || !isUnlocked) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReportFromServer(reportId);
        if (cancelled || !data?.unlocked) return;
        if (data.chartJson) setRestoredChart(data.chartJson);
        if (data.reportText) {
          setReportText(data.reportText);
          setGlobalReportText(data.reportText);
          saveReportText(data.reportText);
        }
      } catch {
        /* 离线或 API 未启动时沿用本地缓存 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, isUnlocked]);

  /** 将本地报告同步到数据库（生成后、支付前也可存） */
  useEffect(() => {
    if (!reportId || !reportText || !activeChart) return;
    saveReportToServer({
      reportId,
      reportText,
      chartJson: activeChart,
      displayName: activeChart.birthData.name || undefined,
      reportType,
    }).catch(() => {});
  }, [reportId, reportText, activeChart, reportType]);

  const paidAtLabel = paidAt ? new Date(paidAt).toLocaleString("zh-CN") : "";

  const calc = useMemo(() => (activeChart ? runV2Calculations(activeChart) : null), [activeChart]);
  const name = activeChart?.birthData?.name || label("你", "You");

  const top3Chart = useMemo(() => {
    if (!calc) return [];
    return calc.sortedPlanets.slice(0, 3).map(p => ({
      name: localizeAstroText(p.name, i18n.language),
      score: p.score,
      fullLabel: `${localizeAstroText(p.name, i18n.language)} ${PLANET_LABELS[p.name] || ""}`,
    }));
  }, [calc, i18n.language]);

  const parts = useMemo(() => {
    if (!reportText) return [];
    return splitChineseSections(reportText);
  }, [reportText]);

  const paymentLabels = getPaymentLabels(paymentMode, t);

  const paymentReturnOrderId =
    getRouterSearchParams().get("orderId") || getRouterSearchParams().get("out_trade_no");

  if (!activeChart) {
    const waitingPay =
      Boolean(paymentReturnOrderId) &&
      (confirmingReturn || restoring || unlockLoading || (!isUnlocked && !pollExhausted));
    let statusText: string;
    if (payError) statusText = payError;
    else if (pollExhausted && !isUnlocked)
      statusText = t('errorPaymentReturnFailed');
    else if (waitingPay) statusText = t('reportRestoring');
    else if (restoring) statusText = t('reportRestoring');
    else if (reportId)
      statusText = t('reportRestoreFailed');
    else statusText = t('reportNoReportId');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#0D1B2A", color: "#9CA3AF" }}>
        <p>{statusText}</p>
        {(pollExhausted || payError) && (
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: PRIMARY }}
            onClick={() => refreshUnlock()}
          >
            {t('reportConfirmPayment')}
          </button>
        )}
      </div>
    );
  }
  if (!reportText || !calc) {
    if (generating) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
          <PrismAnalysisAnimation charCount={genCharCount} />
        </div>
      );
    }
    if (genError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#0D1B2A", color: "#9CA3AF" }}>
          <p>{genError}</p>
          <div className="flex gap-3">
            <button type="button" className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "rgba(232,185,81,0.3)", color: "#E8B951" }} onClick={() => navigate(generatorPath())}>
              {t('reportBackHome')}
            </button>
            <button type="button" className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: PRIMARY }} onClick={() => navigate(generatorPath("settings"))}>
              {t('textReportCheckSettings')}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A", color: "#9CA3AF" }}>
        {t('reportPreparing')}
      </div>
    );
  }

  const dp = calc.dominantPlanet;
  const profiles = calc.sortedPlanets.slice(0, 3).map((p, i) => {
    const pd = activeChart!.planets.find(pl => pl.name === p.name);
    const Icon = PLANET_ICONS[p.name] || Star;
    return {
      Icon,
      name: localizeAstroText(p.name, i18n.language),
      score: p.score,
      sign: localizeAstroText(pd?.sign || "", i18n.language),
      house: pd?.house || 0,
      label: PLANET_LABELS[p.name] || t('planetExplorer'),
      color: TALENT_COLORS[i] || PRIMARY,
      value: pd ? `${localizeAstroText(pd.sign, i18n.language)} ${label(`第${pd.house}宫`, `${pd.house}${pd.house === 1 ? "st" : pd.house === 2 ? "nd" : pd.house === 3 ? "rd" : "th"} house`)}` : "",
    };
  });

  const findPart = (kws: string[]) => {
    for (const kw of kws) {
      const f = parts.find(s => includesAny(s.heading, [kw]));
      if (f) return f;
    }
    return null;
  };

  const coverPart = findPart(["封面", "cover", "memory anchor", "profile"]);
  const whoPart = findPart(["你是谁", "内心", "who you are", "identity", "inner"]);
  const talentPart = findPart(["天赋与行业", "talent", "industry", "career direction"]);
  const charPart = findPart(["性格与资源", "character", "resources", "strength", "weakness", "opportunit"]);
  const charSections = charPart ? parseCharacterSections(charPart.content) : null;
  const areaPart = findPart(["人生各领域", "life areas", "life domains", "life fields", "areas of life"]);
  const timePart = findPart(["人生脉络", "life timeline", "life path", "life stages", "life trajectory"]);
  const envPart = findPart(["环境与贵人", "environment", "benefactor", "supportive people"]);
  const pitPart = findPart(["避坑", "pitfall", "avoid", "traps"]);
  const summaryPart = findPart(["总结", "summary", "action"]);

  const sectionIsPremium = (heading: string) =>
    includesAny(heading, [...reportMeta.premiumKeywords, ...premiumKeywordsFor(reportType)]);

  const bodyParts = parts.filter((p) => p.heading !== "__cover__" && p.content.trim());
  const keywordPremium = parts.some((p) => sectionIsPremium(p.heading));
  const genericPremium = bodyParts.length > getGenericFreeCount(reportType);
  const hasPremium = keywordPremium || genericPremium;
  const showPremium = PAYMENT_DISABLED || isUnlocked;
  const areaLocked =
    hasPremium && !showPremium && Boolean(areaPart) && sectionIsPremium(areaPart.heading);

  let mainTitle = label(`${dp}人`, `${localizeAstroText(dp, i18n.language)} type`);
  let tagline = profiles[0] ? `${profiles[0].label} · ${label(`第${profiles[0].house}宫能量`, `${profiles[0].house}${profiles[0].house === 1 ? "st" : profiles[0].house === 2 ? "nd" : profiles[0].house === 3 ? "rd" : "th"} house energy`)}` : "";
  const coverLines = (coverPart?.content || "").split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of coverLines) {
    if (l.startsWith("#") || l.startsWith("*")) continue;
    const c = cleanMd(l).replace(/[┌─┐│┘]/g, "").trim();
    if (c.length > 2 && c.length < 30 && (c.includes("人") || c.includes("——"))) {
      mainTitle = c;
      break;
    }
    if (!tagline && c.length > 4 && c.length < 40) tagline = c;
  }
  if (mainTitle.includes("封面")) mainTitle = label(`${PLANET_LABELS[dp] || dp}型`, `${localizeAstroText(dp, i18n.language)} type`);

  let whoExplanation = "";
  const whoContent = whoPart?.content || "";
  const dpPatterns = [
    new RegExp(`【?${dp}人是什么】?[？?]?\\s*\\n*([\\s\\S]*?)(?=【|\\*\\*|$)`, "s"),
    new RegExp(`\\*\\*【?${dp}人是什么】?\\*\\*\\s*\\n*([\\s\\S]*?)(?=\\*\\*|【|$)`, "s"),
  ];
  for (const pat of dpPatterns) {
    const m = whoContent.match(pat);
    if (m) {
      whoExplanation = m[1].replace(/\*\*/g, "").trim();
      if (whoExplanation.length > 10) break;
    }
  }
  if (!whoExplanation && whoContent) {
    const fp = whoContent.split("\n").map(l => l.trim()).filter(l => l.length > 5 && !l.startsWith("#") && !l.startsWith("*") && !l.includes("【"))[0];
    if (fp) whoExplanation = cleanMd(fp);
  }

  const deepPart = findPart(["内心深处", "你不说", "deep inside", "inner truth", "unspoken"]);
  const deepText = deepPart?.content || whoExplanation;

  const lifeAreas = (() => {
    if (!areaPart) return [];
    type Area = { title: string; icon: ElementType; tag: string; desc: string; source: string; advice: string };
    const areas: Area[] = [];
    const structured = [...areaPart.content.matchAll(/【([^】]+)】\s*(?:🔮\s*)?(.+?)\n\s*锚点[：:]\s*(.+?)(?:\n|$)\s*来源\/入口[：:]\s*(.+?)(?:\n|$)\s*具体建议[：:]\s*(.+?)(?:\n(?=【)|$)/g)];
    for (const m of structured) {
      const meta = LIFE_AREA_META.find(x => x.keys.some(k => m[1].includes(k))) || { title: m[1], icon: Compass, keys: [] };
      areas.push({
        title: meta.title,
        icon: meta.icon,
        tag: cleanMd(m[3]).slice(0, 8),
        desc: cleanMd(m[2]),
        source: cleanMd(m[4]),
        advice: cleanMd(m[5]),
      });
    }
    if (areas.length === 0) {
      const simple = [...areaPart.content.matchAll(/【([^】]+)】([\s\S]*?)(?=【|$)/g)];
      for (const m of simple) {
        const meta = LIFE_AREA_META.find(x => x.keys.some(k => m[1].includes(k))) || { title: m[1], icon: Compass, keys: [] };
        const body = cleanMd(m[2]);
        const fly = body.match(/(\d+\s*飞\s*\d+|[\d]+飞[\d]+)/)?.[0] || "";
        areas.push({ title: meta.title, icon: meta.icon, tag: fly || "洞察", desc: body.slice(0, 120), source: fly, advice: body.slice(120, 280) || body });
      }
    }
    return areas;
  })();

  const lifeTimeline = timePart ? parseLifeTimeline(timePart.content) : { phases: [], dimensions: [] };
  const timelineData = lifeTimeline.phases;
  const dimensionLines = lifeTimeline.dimensions;

  const envBlocks = envPart ? parseEnvironmentSections(envPart.content) : [];

  const pitfallsBlocks = pitPart ? parsePitfallBlocks(pitPart.content) : [];

  const talents = (() => {
    if (!talentPart) return [];
    const t: { title: string; score: string; desc: string; color: string }[] = [];
    const matches = talentPart.content.matchAll(/[（(](.+?)[··\s]+(.+?)\s*第(\d+)宫.*?[）)]\s*(?:🔹\s*)?能量评分[：:]\s*(?:[★☆]*)\s*[（(]?(\d+)分[）)]?\s*([\s\S]*?)(?=[（(]|$)/g);
    for (const m of matches) {
      t.push({
        title: `【${m[1]}】（${m[1]}·${m[2]} 第${m[3]}宫）`,
        score: `★★★★★（${m[4]}分）`,
        desc: cleanMd(m[5]),
        color: TALENT_COLORS[t.length] || PRIMARY,
      });
    }
    if (t.length === 0) {
      calc.sortedPlanets.slice(0, 3).forEach((p, i) => {
        const pd = activeChart!.planets.find(pl => pl.name === p.name);
        t.push({
          title: label(
            `【${PLANET_LABELS[p.name] || p.name}】（${p.name}·${pd?.sign || ""} 第${pd?.house || "?"}宫）`,
            `【${PLANET_LABELS[p.name] || localizeAstroText(p.name, i18n.language)}】 (${localizeAstroText(p.name, i18n.language)} · ${localizeAstroText(pd?.sign || "", i18n.language)} ${pd?.house || "?"} house)`
          ),
          score: label(`${p.score}分`, `${p.score} pts`),
          desc: label(
            `${p.name}落在${pd?.sign}${pd?.house}宫，是你的${i === 0 ? "核心" : i === 1 ? "第二" : "第三"}天赋来源。`,
            `${localizeAstroText(p.name, i18n.language)} in ${localizeAstroText(pd?.sign || "", i18n.language)} ${pd?.house || "?"} house is one of your ${i === 0 ? "core" : i === 1 ? "secondary" : "third"} talent sources.`
          ),
          color: TALENT_COLORS[i],
        });
      });
    }
    return t;
  })();

  const careerBlock = talentPart ? extractBetween(talentPart.content, "事业方向", ["一般天赋", "TOP3"]) || extractBetween(talentPart.content, "最适合") : "";
  const roleLabel = (() => {
    const raw = mainTitle.replace(/^你是\s*/, "").trim();
    if (raw.endsWith("人")) return localizeAstroText(raw, i18n.language);
    return label(`${dp}人`, `${localizeAstroText(dp, i18n.language)} type`);
  })();

  if (reportType === "marriage") {
    const marriageCover =
      findPart(["感情档案", "封面"]) ?? (parts[0]?.heading === "__cover__" ? parts[0] : null);
    const coverText = marriageCover?.content || coverPart?.content || "";
    const coverMeta = parseMarriageCoverMeta(coverText);
    let marriageRole = roleLabel;
    const titleLine = coverText.split("\n").find((l) => l.includes("#") && l.includes("感情档案"));
    if (titleLine) {
      marriageRole =
        cleanMd(titleLine.replace(/^#+\s*/, ""))
          .replace(/的感情档案.*/, "")
          .trim() || marriageRole;
    }
    const coverExtra = coverText
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        return t && !t.startsWith("#") && !t.includes("美满度") && !t.includes("感情关键词");
      })
      .join("\n")
      .trim();

    return (
      <MarriageReportView
        name={name}
        roleLabel={marriageRole}
        parts={parts}
        coverExtra={coverExtra}
        loveScore={coverMeta.love}
        marriageScore={coverMeta.marriage}
        keywords={coverMeta.kw}
        reportMeta={reportMeta}
        hasPremium={hasPremium}
        showPremium={showPremium}
        unlockLoading={unlockLoading}
        orderId={orderId}
        tradeNo={tradeNo}
        paidAtLabel={paidAtLabel}
        paying={paying}
        payError={payError}
        wechatHint={wechatHint}
        isWeChatInApp={isWeChatInApp}
        paymentMode={paymentMode}
        startPay={startPay}
        navigate={navigate}
        paymentButtonLabel={paymentLabels.button}
        paymentPayingLabel={paymentLabels.paying}
        paymentButtonColor={paymentLabels.buttonColor}
      />
    );
  }

  if (reportType === "career") {
    const careerCover =
      findPart(["事业财富档案", "封面"]) ?? (parts[0]?.heading === "__cover__" ? parts[0] : null);
    const coverText = careerCover?.content || coverPart?.content || "";
    const coverMeta = parseCareerCoverMeta(coverText);
    let careerRole = roleLabel;
    const titleLine = coverText.split("\n").find((l) => l.includes("#") && l.includes("事业财富档案"));
    if (titleLine) {
      careerRole =
        cleanMd(titleLine.replace(/^#+\s*/, ""))
          .replace(/的事业财富档案.*/, "")
          .trim() || careerRole;
    }
    const coverExtra = coverText
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        return t && !t.startsWith("#") && !t.includes("成就度") && !t.includes("潜力度") && !t.includes("事业关键词");
      })
      .join("\n")
      .trim();

    return (
      <CareerReportView
        name={name}
        roleLabel={careerRole}
        parts={parts}
        coverExtra={coverExtra}
        careerScore={coverMeta.career}
        wealthScore={coverMeta.wealth}
        keywords={coverMeta.kw}
        reportMeta={reportMeta}
        hasPremium={hasPremium}
        showPremium={showPremium}
        unlockLoading={unlockLoading}
        orderId={orderId}
        tradeNo={tradeNo}
        paidAtLabel={paidAtLabel}
        paying={paying}
        payError={payError}
        wechatHint={wechatHint}
        isWeChatInApp={isWeChatInApp}
        paymentMode={paymentMode}
        startPay={startPay}
        navigate={navigate}
        paymentButtonLabel={paymentLabels.button}
        paymentPayingLabel={paymentLabels.paying}
        paymentButtonColor={paymentLabels.buttonColor}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A" }}>
      <style>{`@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      {/* Cover */}
      <div className="relative w-full overflow-hidden no-print-nav" style={{ background: DARK }}>
        <img src="/images/cover_ping.jpg" alt="" className="w-full h-64 object-cover opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-2">Life Blueprint Report</p>
          <h1 className="text-3xl font-bold text-center mb-3 text-white">{name} · {roleLabel}</h1>
          <div className="w-16 h-0.5 mb-4" style={{ background: SECONDARY }} />
          <div className="flex flex-wrap justify-center gap-3 text-sm text-white/80">
            {profiles.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <p.Icon size={14} /> {p.name} {label(`${p.score}分`, `${p.score} pts`)}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => navigate(generatorPath())} className="no-print absolute top-4 left-4 p-2 rounded-full flex items-center gap-1" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 20 }}>
          <ArrowLeft size={16} /><span className="text-xs">{t('reportBack')}</span>
        </button>
        <button type="button" onClick={() => navigate(generatorPath("settings"))} className="no-print absolute top-4 right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 20 }}>
          <Settings size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90"
        style={{ background: PRIMARY, bottom: hasPremium && !showPremium ? "5.5rem" : undefined }}
      >
        <Download size={18} /><span className="font-medium">{showPremium || !hasPremium ? t('reportPrintSave') : t('reportPrintFree')}</span>
      </button>

      {hasPremium && !showPremium && !unlockLoading && (
        <div className="no-print fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 max-w-[414px] mx-auto" style={{ background: "linear-gradient(transparent, #0D1B2A 40%)" }}>
          {payError && (
            <p className="text-xs text-red-300 text-center mb-2 px-2">{payError}</p>
          )}
          <button
            type="button"
            onClick={startPay}
            disabled={paying || !reportId}
            className="w-full py-3 rounded-full font-bold text-white shadow-lg disabled:opacity-60"
            style={{ background: paymentLabels.buttonColor }}
          >
            {paying ? paymentLabels.paying : `${paymentLabels.button} · $${unifiedPriceYuan}`}
          </button>
        </div>
      )}

      <ReportIdentitySection
        roleLabel={roleLabel}
        tagline={tagline}
        description={whoExplanation}
        badges={profiles.map((p) => ({
          icon: p.Icon,
          label: label(`${p.name}星`, `${p.name} planet`),
          value: p.value || p.label,
          score: label(`${p.score}分`, `${p.score} pts`),
          color: p.color,
        }))}
      />

      {/* Talents */}
      {talentPart && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Star} title={label("天赋与行业", "Talents & Career Fit")} subtitle={label("你的核心天赋与最佳事业赛道（分数已标准化至100分制）", "Your core talents and strongest career lanes, scored on a 100-point scale")} />
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-100 bg-white">
              <RadarChart data={top3Chart} title={`${name} · ${label("三维度能量分布", "Three-Dimension Energy Map")}`} />
            </div>
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-100 bg-white">
              <BarChart data={top3Chart} title={`${name} · ${label("TOP3 天赋能量对比", "Top 3 Talent Energy")}`} />
            </div>
          </div>
          <div className="space-y-3">
            {talents.map((item, idx) => (
              <div key={idx} className="rounded-xl p-4 border-l-4 shadow-sm bg-white" style={{ borderLeftColor: item.color }}>
                <h4 className="text-sm font-bold text-gray-800 mb-1">{display(item.title)}</h4>
                <div className="text-xs font-bold mb-2" style={{ color: item.color }}>{display(item.score)}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{display(item.desc)}</p>
              </div>
            ))}
          </div>
          {careerBlock && (
            <div className="mt-4 rounded-xl p-4 border" style={{ background: LIGHT, borderColor: "#d8cfe8" }}>
              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Briefcase size={16} style={{ color: PRIMARY }} /> {label("最适合的事业方向", "Best Career Direction")}
              </h4>
              <div className="text-sm text-gray-700 leading-relaxed"><AiParagraphs text={careerBlock} /></div>
            </div>
          )}
        </section>
      )}

      {/* Character */}
      {charPart && charSections && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Heart} title={label("性格与资源", "Character & Resources")} subtitle={label("你的性格特质与可利用资源", "Your traits and usable support resources")} />
          <div className="grid grid-cols-1 gap-4">
            {(charSections.strengths || charPart.content) && (
              <div className="rounded-xl p-4 border bg-white" style={{ borderColor: "#d8cfe8" }}>
                <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2"><Compass size={16} /> {label("性格优势", "Strengths")}</h4>
                <AiParagraphs text={charSections.strengths || charPart.content} />
              </div>
            )}
            {charSections.weaknesses && (
              <div className="rounded-xl p-4 border bg-white" style={{ borderColor: "#d8cfe8" }}>
                <h4 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> {label("性格劣势", "Growth Edges")}</h4>
                <AiParagraphs text={charSections.weaknesses} />
              </div>
            )}
          </div>
          {charSections.opportunities && (
            <div className="mt-4 rounded-xl p-4 border" style={{ background: LIGHT, borderColor: "#d8cfe8" }}>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Wallet size={16} style={{ color: PRIMARY }} /> {label("机会与资源", "Opportunities & Resources")}</h4>
              <AiParagraphs text={charSections.opportunities} />
            </div>
          )}
        </section>
      )}

      {/* Deep */}
      {deepText && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Heart} title={label("内心深处 —— 你不说，但我懂", "Deep Inside — What You Don't Say")} subtitle={label("读懂你内心最柔软的那部分", "Reading the quiet, tender part of your inner world")} />
          <div className="rounded-2xl p-6 shadow-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)` }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/3" style={{ background: PRIMARY, opacity: 0.06 }} />
            <div className="relative text-sm text-white/85 leading-relaxed space-y-4">
              <AiParagraphs text={deepText} tone="dark" />
            </div>
          </div>
        </section>
      )}

      {/* Life areas */}
      {areaPart && !areaLocked && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Compass} title={label("人生各领域（飞星结论）", "Life Areas")} subtitle={label("八大生活领域的关键洞察", "Key insights across the major domains of life")} />
          {lifeAreas.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {lifeAreas.map((f, i) => (
                <div key={i} className="rounded-xl p-4 border shadow-sm bg-white" style={{ borderColor: CARD_BORDER }}>
                  <div className="flex items-center gap-2 mb-2">
                    <f.icon size={16} style={{ color: PRIMARY }} />
                    <span className="text-sm font-bold text-gray-800">{display(f.title)}</span>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: PRIMARY }}>{display(f.tag)}</span>
                  </div>
                  {f.source && <p className="text-xs text-gray-500 mb-1">{label("来源/入口：", "Source / Entry: ")}{display(f.source)}</p>}
                  <p className="text-sm text-gray-700 leading-relaxed">{display(f.desc)}</p>
                  {f.advice && (
                    <p className="text-xs text-gray-600 mt-2 p-2 rounded" style={{ background: LIGHT }}><strong>{label("建议：", "Advice: ")}</strong>{display(f.advice)}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-4 bg-white border" style={{ borderColor: CARD_BORDER }}><AiParagraphs text={areaPart.content} /></div>
          )}
        </section>
      )}
      {areaPart && areaLocked && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Compass} title={label("人生各领域（飞星结论）", "Life Areas")} subtitle={label("解锁后查看", "Unlock to view")} />
          <LockedPreview>
            <div className="rounded-xl p-4 bg-white border" style={{ borderColor: CARD_BORDER }}>
              <AiParagraphs text={areaPart.content.slice(0, 320)} />
            </div>
          </LockedPreview>
        </section>
      )}

      {hasPremium && !showPremium && !unlockLoading && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <PaywallCard
            amountYuan={unifiedPriceYuan}
            onPay={startPay}
            paying={paying}
            error={payError}
            wechatHint={wechatHint}
            isWeChatInApp={isWeChatInApp}
            paymentMode={paymentMode}
            reportMeta={reportMeta}
          />
        </section>
      )}

      {hasPremium && showPremium && (
        <section className="py-2 px-6 max-w-[414px] mx-auto">
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: LIGHT, color: PRIMARY }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{t('reportUnlockSuccess', { name: reportMeta.name })}</span>
            </div>
            {orderId && (
              <p className="text-[11px] mt-2 leading-relaxed opacity-80" style={{ color: DARK }}>
                {t('reportOrderNo')}<span className="font-mono">{orderId}</span>
                {tradeNo ? (
                  <>
                    <br />
                    {t('reportPaymentRef')}<span className="font-mono">{tradeNo}</span>
                  </>
                ) : null}
                {paidAtLabel ? <><br />{t('reportPaymentTime')}{paidAtLabel}</> : null}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Timeline */}
      {timePart && (showPremium ? (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Compass} title={label("人生脉络建议", "Life Timeline Guidance")} subtitle={label("不同阶段的成长路径与行动指南", "Growth paths and action guidance across life stages")} />
          {timelineData.length > 0 && (
            <div className="space-y-4 mb-4">
              {timelineData.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="text-xs font-bold text-white py-1 rounded-t" style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}>{display(item.age)}</div>
                    <div className="h-full w-0.5 mx-auto min-h-[40px]" style={{ background: `${PHASE_COLORS[i % PHASE_COLORS.length]}30` }} />
                  </div>
                  <div className="flex-1 rounded-xl p-4 border shadow-sm bg-white" style={{ borderColor: CARD_BORDER }}>
                    <h4 className="text-sm font-bold text-gray-800 mb-1">{display(item.title)}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{display(item.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {dimensionLines.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {dimensionLines.map((line, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-4 border bg-white" style={{ borderColor: CARD_BORDER }}>
                  <Compass size={18} style={{ color: PRIMARY }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-1">{display(line.label)}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{display(line.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!timelineData.length && !dimensionLines.length && (
            <div className="rounded-xl p-4 border bg-white" style={{ borderColor: CARD_BORDER }}>
              <AiParagraphs text={timePart.content} />
            </div>
          )}
        </section>
      ) : hasPremium ? (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Compass} title={label("人生脉络建议", "Life Timeline Guidance")} subtitle={label("不同阶段的成长路径与行动指南", "Growth paths and action guidance across life stages")} />
          <LockedPreview>
            {timelineData.length > 0 ? (
              <div className="rounded-xl p-4 border bg-white" style={{ borderColor: CARD_BORDER }}>
                <h4 className="text-sm font-bold text-gray-800">{display(timelineData[0].age)} · {display(timelineData[0].title)}</h4>
                <p className="text-sm text-gray-600 mt-2">{display(timelineData[0].desc)}</p>
              </div>
            ) : (
              <div className="rounded-xl p-4 border bg-white" style={{ borderColor: CARD_BORDER }}>
                <AiParagraphs text={timePart.content.slice(0, 400)} />
              </div>
            )}
          </LockedPreview>
        </section>
      ) : null)}

      {/* Environment */}
      {envPart && showPremium && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Users} title={label("环境与贵人", "Environment & Allies")} subtitle={label("适合的环境、贵人与需要远离的人", "The environments, allies, and dynamics to move toward or away from")} />
          <div className="space-y-3">
            {envBlocks.map((block) => (
              <div key={block.title} className="rounded-xl p-4 border bg-white" style={{ borderColor: "#d8cfe8" }}>
                <h4 className="text-sm font-bold text-gray-800 mb-2" style={{ color: PRIMARY }}>{display(block.title)}</h4>
                <AiParagraphs text={block.text} />
              </div>
            ))}
          </div>
        </section>
      )}
      {envPart && hasPremium && !showPremium && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={Users} title={label("环境与贵人", "Environment & Allies")} subtitle={label("解锁后查看", "Unlock to view")} />
          <LockedPreview>
            <div className="rounded-xl p-4 border bg-white text-sm text-gray-600" style={{ borderColor: CARD_BORDER }}>
              {display(envBlocks[0]?.text.slice(0, 120) || envPart.content.slice(0, 120) || label("适合你的环境与贵人分析…", "Your environment and ally analysis..."))}
            </div>
          </LockedPreview>
        </section>
      )}

      {/* Pitfalls */}
      {pitPart && showPremium && (
        <section className="py-6 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={AlertTriangle} title={label("避坑指南", "Pitfall Guide")} subtitle={label("一定要避开的人、事、环境", "People, choices, and environments to avoid")} />
          <div className="space-y-3">
            {pitfallsBlocks.map((block, i) => (
              <div key={block.key || i} className={`rounded-xl p-4 border shadow-sm ${block.special ? "border-2" : ""}`} style={{ background: block.bg, borderColor: block.border }}>
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: block.titleColor }}>
                  <block.icon size={16} /> {display(block.title)}
                </h4>
                {block.items.length === 1 && block.items[0].length > 80 ? (
                  <div className="text-sm text-gray-700 leading-relaxed"><AiParagraphs text={block.items[0]} /></div>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className={`mt-1 ${block.special ? "" : block.mark}`} style={block.special ? { color: PRIMARY } : undefined}>{block.special ? "⚠" : "✕"}</span>
                        <span><InlineMd text={item} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {pitPart && hasPremium && !showPremium && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <SectionTitle icon={AlertTriangle} title={label("避坑指南", "Pitfall Guide")} subtitle={label("解锁后查看", "Unlock to view")} />
          <LockedPreview>
            <div className="rounded-xl p-4 text-sm text-gray-600" style={{ background: "#FFF5F5" }}>
              {display(pitfallsBlocks[0]?.items[0] || label("针对你的避坑清单…", "Your personalized pitfall checklist..."))}
            </div>
          </LockedPreview>
        </section>
      )}

      {/* Summary */}
      {summaryPart && showPremium && (
        <section className="py-6 px-6 max-w-[414px] mx-auto pb-24">
          <SectionTitle icon={Star} title={label("总结与行动指令", "Summary & Action Plan")} subtitle={label("你的核心身份与行动清单", "Your core identity and action checklist")} />
          <div className="rounded-2xl p-6 shadow-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)` }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/3" style={{ background: PRIMARY, opacity: 0.06 }} />
            <div className="relative">
              <div className="text-center mb-4">
                <div className="inline-block rounded-full px-3 py-1" style={{ background: "rgba(232,200,122,0.2)" }}>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200">Summary & Action Plan</span>
                </div>
              </div>
              <div className="text-base text-white/90 leading-relaxed"><AiParagraphs text={summaryPart.content} tone="dark" /></div>
              <div className="flex flex-wrap gap-2 justify-center mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                {profiles.map(p => (
                  <span key={p.name} className="text-[10px] px-3 py-1 rounded-full text-amber-200" style={{ background: "rgba(232,200,122,0.15)" }}>
                    {label(`${p.name}人`, `${p.name} type`)} · {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">{t('reportLifeBlueprint')} · {new Date().toLocaleDateString(i18n.language)} · {t('reportPersonalRef')}</p>
          </div>
        </section>
      )}
      {summaryPart && hasPremium && !showPremium && (
        <section className="py-4 px-6 max-w-[414px] mx-auto pb-28">
          <SectionTitle icon={Star} title={label("总结与行动指令", "Summary & Action Plan")} subtitle={label("解锁后查看", "Unlock to view")} />
          <LockedPreview>
            <div className="rounded-2xl p-4 text-sm" style={{ background: DARK }}>
              <AiParagraphs text={summaryPart.content.slice(0, 200)} tone="dark" />
            </div>
          </LockedPreview>
        </section>
      )}
      {hasPremium && !showPremium && (
        <div className="h-20 max-w-[414px] mx-auto" aria-hidden />
      )}
      <ReportDeepReadingCTA />
    </div>
  );
}
