import { type ElementType } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Settings,
  Download,
  Star,
  Briefcase,
  Wallet,
  AlertTriangle,
  Compass,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { ReportTypeMeta } from "../types/reportTypes";
import type { PaymentMode } from "../services/paymentApi";
import { ReportDeepReadingCTA } from "./ReportDeepReadingCTA";
import { PaywallCard, LockedPreview } from "./ReportPaywall";
import { ReportIdentitySection } from "./ReportIdentitySection";
import { generatorPath } from "../utils/generatorNav";

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";
const LIGHT = "#EDE9FE";
const CARD_BORDER = "#f0e6d3";

function cleanMd(text: string): string {
  return text.replace(/\*\*/g, "").replace(/^\s*[·•\-]\s*/gm, "• ").trim();
}

function InlineMd({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.+?\*\*)/);
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

export interface CareerReportViewProps {
  name: string;
  roleLabel: string;
  parts: { heading: string; content: string }[];
  coverExtra?: string;
  careerScore?: string;
  wealthScore?: string;
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
}

function findPart(parts: { heading: string; content: string }[], kws: string[]) {
  for (const kw of kws) {
    const f = parts.find((s) => s.heading.includes(kw));
    if (f) return f;
  }
  return null;
}

export function parseCareerCoverMeta(coverText: string) {
  const career = coverText.match(/事业成就度[：:]\s*(\d+分[^*\n]*)/)?.[1];
  const wealth = coverText.match(/财富潜力度[：:]\s*(\d+分[^*\n]*)/)?.[1];
  const kw = coverText.match(/事业关键词[：:]\s*(.+)/)?.[1];
  return { career, wealth, kw: kw ? cleanMd(kw) : undefined };
}

export function CareerReportView({
  name,
  roleLabel,
  parts,
  coverExtra,
  careerScore,
  wealthScore,
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
}: CareerReportViewProps) {
  const { t, i18n } = useTranslation();
  const profilePart = findPart(parts, ["事业画像"]);
  const directionPart = findPart(parts, ["职业方向"]);
  const wealthPart = findPart(parts, ["财富地图"]);
  const painPart = findPart(parts, ["事业卡点"]);
  const strategyPart = findPart(parts, ["突破策略"]);
  const workStylePart = findPart(parts, ["创业还是打工"]);
  const actionPart = findPart(parts, ["行动指令"]);

  const sectionIsPremium = (heading: string) =>
    reportMeta.premiumKeywords.some((kw) => heading.includes(kw));

  const premiumLocked = (part: { heading: string; content: string } | null) =>
    Boolean(part && hasPremium && !showPremium && sectionIsPremium(part.heading));

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A" }}>
      <style>{`@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="relative w-full overflow-hidden" style={{ background: DARK }}>
        <img src="/images/cover_ping.jpg" alt="" className="w-full h-64 object-cover opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-2">Career & Wealth Report</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{name} · {roleLabel}</h1>
          <div className="w-16 h-0.5 mb-4" style={{ background: SECONDARY }} />
          {(careerScore || wealthScore) && (
            <div className="flex flex-wrap justify-center gap-3 text-xs text-white/90 mb-2">
              {careerScore && (
                <span className="px-3 py-1 rounded-full" style={{ background: "rgba(232,200,122,0.2)" }}>
                  事业 {careerScore}
                </span>
              )}
              {wealthScore && (
                <span className="px-3 py-1 rounded-full" style={{ background: "rgba(232,200,122,0.2)" }}>
                  财富 {wealthScore}
                </span>
              )}
            </div>
          )}
          {keywords && <p className="text-sm text-amber-200/90">{keywords}</p>}
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
            {paying ? paymentPayingLabel : `${paymentButtonLabel} · ¥${reportMeta.priceYuan}`}
          </button>
        </div>
      )}

      <ReportIdentitySection
        roleLabel={roleLabel}
        tagline={keywords}
        description={coverExtra}
        badges={[
          ...(careerScore
            ? [{ icon: Briefcase, label: "事业成就度", value: careerScore, color: PRIMARY }]
            : []),
          ...(wealthScore
            ? [{ icon: Wallet, label: "财富潜力度", value: wealthScore, color: "#059669" }]
            : []),
        ]}
      />

      <ReportSection
        icon={Briefcase}
        title="你的事业画像"
        subtitle="职场真实面目 · 驱动力 · 职业陷阱"
        content={profilePart?.content ?? ""}
      />
      <ReportSection
        icon={Compass}
        title="职业方向"
        subtitle="核心赛道 · 金钥匙 · 不适合的方向"
        content={directionPart?.content ?? ""}
      />
      <ReportSection
        icon={Wallet}
        title="财富地图"
        subtitle="正财 · 偏财 · 财富节奏"
        content={wealthPart?.content ?? ""}
      />

      {hasPremium && !showPremium && !unlockLoading && (
        <section className="py-4 px-6 max-w-[414px] mx-auto">
          <PaywallCard
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
        icon={AlertTriangle}
        title="事业卡点"
        subtitle="重复模式与可执行突破方案"
        content={painPart?.content ?? ""}
        locked={premiumLocked(painPart)}
        dark={showPremium && Boolean(painPart)}
      />
      <ReportSection
        icon={TrendingUp}
        title="突破策略"
        subtitle="事业加速器 · 财富护城河 · 核心课题"
        content={strategyPart?.content ?? ""}
        locked={premiumLocked(strategyPart)}
      />
      <ReportSection
        icon={Briefcase}
        title="创业还是打工"
        subtitle="适合你的路径与前提条件"
        content={workStylePart?.content ?? ""}
        locked={premiumLocked(workStylePart)}
      />
      <ReportSection
        icon={Star}
        title="行动指令"
        subtitle="本周清单与事业时间线"
        content={actionPart?.content ?? ""}
        locked={premiumLocked(actionPart)}
        dark={showPremium && Boolean(actionPart)}
      />

      <ReportDeepReadingCTA />

      <div className="py-6 px-6 max-w-[414px] mx-auto pb-24 text-center">
        <p className="text-xs text-gray-400">
           {t('reportCareerLabel')} · {new Date().toLocaleDateString(i18n.language)} · {t('reportPersonalRef')}
        </p>
      </div>

      {hasPremium && !showPremium && <div className="h-20 max-w-[414px] mx-auto" aria-hidden />}
    </div>
  );
}
