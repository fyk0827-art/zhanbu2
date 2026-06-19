import { type ElementType } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Settings,
  Download,
  Star,
  Heart,
  AlertTriangle,
  Users,
  Compass,
  CheckCircle2,
} from "lucide-react";
import type { ReportTypeMeta } from "../types/reportTypes";
import type { PaymentMode } from "../services/paymentApi";
import { ReportDeepReadingCTA } from "./ReportDeepReadingCTA";
import { PaywallCard, LockedPreview } from "./ReportPaywall";
import { ReportIdentitySection } from "./ReportIdentitySection";
import { generatorPath } from "../utils/generatorNav";
import { localizeAstroText } from "../utils/astroI18n";

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";
const LIGHT = "#EDE9FE";
const CARD_BORDER = "#f0e6d3";

function cleanMd(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^\s*[·•\-]\s*/gm, "• ").trim();
}

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

const MARRIAGE_PREMIUM_KEYWORDS = [
  "正缘", "关系痛点", "关系修复", "行动指令",
  "soulmate", "right person", "relationship pain", "pain points", "relationship repair", "repair", "action",
];

function InlineMd({ text }: { text: string }) {
  if (!text) return null;
  const { i18n } = useTranslation();
  const parts = localizeAstroText(text, i18n.language).split(/(\*\*.+?\*\*)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-amber-300 font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function AiParagraphs({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <>
      {lines.map((line, i) => {
        const t = line.trim();
        if (t.match(/^#{2,3}\s/) || t.match(/^\*?\*?【.+】\*?\*?$/)) return null;
        if (t.startsWith("---")) return <hr key={i} className="my-3 border-gray-200" />;
        if (t.match(/^[-–•·✕]/)) {
          return (
            <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>
                <InlineMd text={t.replace(/^[-–•·✕]\s*/, "")} />
              </span>
            </p>
          );
        }
        if (t.match(/^(\d+)\.\s/)) {
          return (
            <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2 flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: PRIMARY }}
              >
                {t.match(/^(\d+)/)?.[1]}
              </span>
              <span className="pt-0.5">
                <InlineMd text={t.replace(/^\d+\.\s*/, "")} />
              </span>
            </p>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">
            <InlineMd text={t} />
          </p>
        );
      })}
    </>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${PRIMARY}15` }}
      >
        <Icon size={20} style={{ color: PRIMARY }} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-orange-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ReportSection({
  icon,
  title,
  subtitle,
  content,
  locked,
  dark,
}: {
  icon: ElementType;
  title: string;
  subtitle: string;
  content: string;
  locked?: boolean;
  dark?: boolean;
}) {
  if (!content) return null;
  const body = (
    <div
      className={`rounded-2xl p-5 shadow-md border ${dark ? "relative overflow-hidden" : "bg-white"}`}
      style={
        dark
          ? { background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)`, borderColor: "transparent" }
          : { borderColor: CARD_BORDER }
      }
    >
      {dark ? (
        <div className="text-sm text-white/85 leading-relaxed">
          <AiParagraphs text={content} />
        </div>
      ) : (
        <AiParagraphs text={content} />
      )}
    </div>
  );

  return (
    <section className="py-6 px-6 max-w-[414px] mx-auto">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      {locked ? <LockedPreview>{body}</LockedPreview> : body}
    </section>
  );
}

export interface MarriageReportViewProps {
  name: string;
  roleLabel: string;
  parts: { heading: string; content: string }[];
  coverExtra?: string;
  loveScore?: string;
  marriageScore?: string;
  keywords?: string;
  reportMeta: ReportTypeMeta;
  hasPremium: boolean;
  showPremium: boolean;
  unlockLoading: boolean;
  orderId: string | null;
  tradeNo: string | null;
  paidAtLabel: string;
  paying: boolean;
  payError: string | null;
  wechatHint: string | null;
  isWeChatInApp: boolean;
  paymentMode: PaymentMode | null;
  startPay: () => void;
  navigate: (path: string) => void;
  paymentButtonLabel: string;
  paymentPayingLabel: string;
  paymentButtonColor: string;
  priceUsd?: string;
}

function findPart(parts: { heading: string; content: string }[], kws: string[]) {
  for (const kw of kws) {
    const f = parts.find((s) => includesAny(s.heading, [kw]));
    if (f) return f;
  }
  return null;
}

export function parseMarriageCoverMeta(coverText: string) {
  const love = coverText.match(/(?:恋爱美满度|Love score)[：:]\s*(\d+\s*(?:分|pts)[^*\n]*)/i)?.[1];
  const marriage = coverText.match(/(?:婚姻美满度|Marriage score)[：:]\s*(\d+\s*(?:分|pts)[^*\n]*)/i)?.[1];
  const kw = coverText.match(/(?:感情关键词|Relationship keywords)[：:]\s*(.+)/i)?.[1];
  return { love, marriage, kw: kw ? cleanMd(kw) : undefined };
}

export function MarriageReportView({
  name,
  roleLabel,
  parts,
  coverExtra,
  loveScore,
  marriageScore,
  keywords,
  reportMeta,
  hasPremium,
  showPremium,
  unlockLoading,
  orderId,
  tradeNo,
  paidAtLabel,
  paying,
  payError,
  wechatHint,
  isWeChatInApp,
  paymentMode,
  startPay,
  navigate,
  paymentButtonLabel,
  paymentPayingLabel,
  paymentButtonColor,
  priceUsd,
}: MarriageReportViewProps) {
  const { t, i18n } = useTranslation();
  const label = (zh: string, en: string) => (i18n.language.toLowerCase().startsWith("zh") ? zh : en);
  const display = (text: string) => localizeAstroText(text, i18n.language);
  const profilePart = findPart(parts, ["感情画像", "relationship profile", "emotional profile", "love profile"]);
  const lovePart = findPart(parts, ["恋爱全景", "love overview", "romantic overview", "dating"]);
  const marriagePart = findPart(parts, ["婚姻全景", "marriage overview", "partnership overview"]);
  const soulmatePart = findPart(parts, ["正缘导航", "soulmate", "right person"]);
  const painPart = findPart(parts, ["关系痛点", "relationship pain", "pain points"]);
  const repairPart = findPart(parts, ["关系修复", "relationship repair", "repair and maintenance"]);
  const actionPart = findPart(parts, ["行动指令", "action", "weekly checklist"]);

  const sectionIsPremium = (heading: string) =>
    includesAny(heading, [...reportMeta.premiumKeywords, ...MARRIAGE_PREMIUM_KEYWORDS]);

  const premiumLocked = (part: { heading: string; content: string } | null) =>
    Boolean(part && hasPremium && !showPremium && sectionIsPremium(part.heading));

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A" }}>
      <style>{`@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="relative w-full overflow-hidden" style={{ background: DARK }}>
        <img src="/images/cover_ping.jpg" alt="" className="w-full h-64 object-cover opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-2">Love & Marriage Report</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{name} · {roleLabel}</h1>
          <div className="w-16 h-0.5 mb-4" style={{ background: SECONDARY }} />
          {(loveScore || marriageScore) && (
            <div className="flex flex-wrap justify-center gap-3 text-xs text-white/90 mb-2">
              {loveScore && (
                <span className="px-3 py-1 rounded-full" style={{ background: "rgba(232,200,122,0.2)" }}>
                  {label("恋爱", "Love")} {display(loveScore)}
                </span>
              )}
              {marriageScore && (
                <span className="px-3 py-1 rounded-full" style={{ background: "rgba(232,200,122,0.2)" }}>
                  {label("婚姻", "Marriage")} {display(marriageScore)}
                </span>
              )}
            </div>
          )}
          {keywords && <p className="text-sm text-amber-200/90">{display(keywords)}</p>}
        </div>
        <button
          type="button"
          onClick={() => navigate(generatorPath())}
          className="no-print absolute top-4 left-4 p-2 rounded-full flex items-center gap-1"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 20 }}
        >
          <ArrowLeft size={16} />
          <span className="text-xs">{t('reportBack')}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate(generatorPath("settings"))}
          className="no-print absolute top-4 right-4 p-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff", zIndex: 20 }}
        >
          <Settings size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90"
        style={{ background: PRIMARY, bottom: hasPremium && !showPremium ? "5.5rem" : undefined }}
      >
        <Download size={18} />
        <span className="font-medium">{showPremium || !hasPremium ? t('reportPrintSave') : t('reportPrintFree')}</span>
      </button>

      {hasPremium && !showPremium && !unlockLoading && (
        <div
          className="no-print fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 max-w-[414px] mx-auto"
          style={{ background: "linear-gradient(transparent, #0D1B2A 40%)" }}
        >
          <button
            type="button"
            onClick={startPay}
            disabled={paying}
            className="w-full py-3 rounded-full font-bold text-white shadow-lg disabled:opacity-60"
            style={{ background: paymentButtonColor }}
          >
            {paying ? paymentPayingLabel : `${paymentButtonLabel} · $${priceUsd ?? reportMeta.priceYuan}`}
          </button>
        </div>
      )}

      <ReportIdentitySection
        roleLabel={roleLabel}
        tagline={keywords ? display(keywords) : keywords}
        description={coverExtra}
        badges={[
          ...(loveScore
            ? [{ icon: Heart, label: label("恋爱美满度", "Love score"), value: display(loveScore), color: "#EC4899" }]
            : []),
          ...(marriageScore
            ? [{ icon: Users, label: label("婚姻美满度", "Marriage score"), value: display(marriageScore), color: "#8B5CF6" }]
            : []),
        ]}
      />

      <ReportSection
        icon={Heart}
        title={label("你的感情画像", "Your Relationship Profile")}
        subtitle={label("你在关系里的真实模式与核心需求", "Your real pattern and core needs in relationships")}
        content={profilePart?.content ?? ""}
      />
      <ReportSection
        icon={Heart}
        title={label("恋爱全景", "Love Overview")}
        subtitle={label("恋爱模式 · 场景 · 多谈还是少谈", "Dating pattern · Scenarios · More or fewer relationships")}
        content={lovePart?.content ?? ""}
      />
      <ReportSection
        icon={Users}
        title={label("婚姻全景", "Marriage Overview")}
        subtitle={label("婚姻基础 · 伴侣画像 · 经营铁律", "Marriage foundation · Partner profile · Relationship rules")}
        content={marriagePart?.content ?? ""}
      />

      {hasPremium && !showPremium && !unlockLoading && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <PaywallCard
            priceUsd={priceUsd}
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
                {paidAtLabel ? (
                  <>
                    <br />
                    {t('reportPaymentTime')}{paidAtLabel}
                  </>
                ) : null}
              </p>
            )}
          </div>
        </section>
      )}

      <ReportSection
        icon={Compass}
        title={label("正缘导航", "Soulmate Navigation")}
        subtitle={label("场合 · 识别特征 · 时间窗口", "Where to meet · How to recognize · Timing windows")}
        content={soulmatePart?.content ?? ""}
        locked={premiumLocked(soulmatePart)}
      />
      <ReportSection
        icon={AlertTriangle}
        title={label("关系痛点", "Relationship Pain Points")}
        subtitle={label("模式拆解与可执行修复方案", "Pattern breakdown and practical repair plan")}
        content={painPart?.content ?? ""}
        locked={premiumLocked(painPart)}
        dark={showPremium && Boolean(painPart)}
      />
      <ReportSection
        icon={Heart}
        title={label("关系修复与经营", "Relationship Repair & Care")}
        subtitle={label("找到对的人 · 维持关系的铁律", "Finding the right person · Rules for keeping love stable")}
        content={repairPart?.content ?? ""}
        locked={premiumLocked(repairPart)}
      />
      <ReportSection
        icon={Star}
        title={label("行动指令", "Action Plan")}
        subtitle={label("本周清单与关系时间线", "This week's checklist and relationship timeline")}
        content={actionPart?.content ?? ""}
        locked={premiumLocked(actionPart)}
        dark={showPremium && Boolean(actionPart)}
      />

      <ReportDeepReadingCTA />

      <div className="py-6 px-6 max-w-[414px] mx-auto pb-24 text-center">
        <p className="text-xs text-gray-400">
           {t('reportMarriageLabel')} · {new Date().toLocaleDateString(i18n.language)} · {t('reportPersonalRef')}
        </p>
      </div>

      {hasPremium && !showPremium && <div className="h-20 max-w-[414px] mx-auto" aria-hidden />}
    </div>
  );
}
