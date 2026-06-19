import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Lock, ExternalLink, Sparkles } from "lucide-react";
import { getPaymentLabels, type PaymentMode } from "../services/paymentApi";
import type { ReportTypeMeta } from "../types/reportTypes";

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";

interface PaywallCardProps {
  amountYuan?: string;
  onPay: () => void;
  paying: boolean;
  error: string | null;
  wechatHint: string | null;
  isWeChatInApp: boolean;
  paymentMode?: PaymentMode | null;
  reportMeta: ReportTypeMeta;
}

export function PaywallCard({
  amountYuan,
  onPay,
  paying,
  error,
  wechatHint,
  isWeChatInApp,
  paymentMode = null,
  reportMeta,
}: PaywallCardProps) {
  const { t } = useTranslation();
  const labels = getPaymentLabels(paymentMode, t);
  const price = amountYuan ?? reportMeta.priceYuan;

  return (
    <div
      className="rounded-2xl p-6 shadow-xl border-2 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)`, borderColor: SECONDARY }}
    >
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ background: SECONDARY }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={20} className="text-amber-300" />
          <h3 className="text-lg font-bold text-white">{reportMeta.paywallTitle}</h3>
        </div>
        <p className="text-sm text-white/75 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('paywallDesc', { name: reportMeta.name }) }} />
        <ul className="space-y-2 mb-5">
          {reportMeta.paywallItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/85">
              <Sparkles size={14} className="text-amber-300 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {isWeChatInApp && paymentMode === "alipay" && (
          <div className="mb-4 rounded-lg p-3 text-xs leading-relaxed flex gap-2" style={{ background: "rgba(232,200,122,0.15)", color: "#fde68a" }}>
            <ExternalLink size={16} className="flex-shrink-0 mt-0.5" />
            <span>{t('paywallWechatHint')}</span>
          </div>
        )}
        {wechatHint && (
          <p className="text-xs text-amber-200 mb-3">{wechatHint}</p>
        )}
        {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="w-full py-3.5 rounded-xl font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: paying ? PRIMARY : labels.buttonColor }}
        >
          {paying ? labels.paying : `${labels.button} · $${price}`}
        </button>
        <p className="text-[10px] text-white/50 text-center mt-3">{t('paywallFooter')}</p>
      </div>
    </div>
  );
}

interface LockedPreviewProps {
  children: ReactNode;
}

/** 未解锁时：展示模糊预览 */
export function LockedPreview({ children }: LockedPreviewProps) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="select-none pointer-events-none" style={{ filter: "blur(6px)", maxHeight: 200, overflow: "hidden" }}>
        {children}
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(13,27,42,0.95) 70%)" }}
      />
    </div>
  );
}
