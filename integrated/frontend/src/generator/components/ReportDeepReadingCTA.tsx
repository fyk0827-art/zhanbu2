import { useTranslation } from "react-i18next";
import { DEEP_REPORT_MODULE_COUNT, INTERPRETER_WHATSAPP_URL } from "../config/reportCta";

interface Props {
  moduleCount?: number;
}

export function ReportDeepReadingCTA({ moduleCount = DEEP_REPORT_MODULE_COUNT }: Props) {
  const { t } = useTranslation();

  return (
    <section className="px-6 py-8 max-w-[414px] mx-auto no-print">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-9 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(27,42,74,0.92) 0%, rgba(13,27,42,0.98) 100%)",
          border: "1px solid rgba(232,185,81,0.14)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(232,185,81,0.5) 0%, transparent 100%)," +
              "radial-gradient(1px 1px at 80% 20%, rgba(232,185,81,0.35) 0%, transparent 100%)," +
              "radial-gradient(1px 1px at 60% 80%, rgba(232,185,81,0.3) 0%, transparent 100%)",
          }}
        />
        <div className="relative">
          <p
            className="prism-font-display text-[10px] font-semibold tracking-[0.4em] uppercase mb-5"
            style={{ color: "var(--prism-gold)" }}
          >
            {t('deepReadingLabel')}
          </p>
          <h3 className="prism-font-serif text-[17px] font-bold leading-relaxed" style={{ color: "var(--prism-cream)" }}>
            {t('deepReadingTitle1')}
          </h3>
          <h3 className="prism-font-serif text-[22px] font-bold mb-4" style={{ color: "var(--prism-gold)" }}>
            {t('deepReadingTitle2')}
          </h3>
          <p className="text-[12px] leading-relaxed mb-1" style={{ color: "rgba(250,246,240,0.42)" }}>
            {t('deepReadingDesc1')}
          </p>
          <p className="text-[12px] leading-relaxed mb-7" style={{ color: "rgba(250,246,240,0.42)" }}>
            {t('deepReadingDesc2')}
          </p>
          <a
            href={INTERPRETER_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 mb-5 shadow-lg transition-opacity hover:opacity-90"
            style={{ background: "#25D366" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-white text-[14px] font-semibold">Contact Interpreter on WhatsApp</span>
          </a>
          <p className="text-[14px] font-medium mb-2" style={{ color: "var(--prism-gold)" }}>
            Click to add your personal interpreter
          </p>
          <p className="text-[11px] tracking-wide" style={{ color: "rgba(250,246,240,0.32)" }}>
            Unlock all {moduleCount} deep reading modules
          </p>
        </div>
      </div>
    </section>
  );
}
