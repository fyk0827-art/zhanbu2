import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Settings, ChevronRight, CheckCircle, Loader, AlertTriangle, RefreshCw } from "lucide-react";
import type { NatalChart } from "../services/astrologyEngine";
import { getSettings } from "../services/volcEngineApi";
import { generateReportText } from "../services/reportGenerator";
import { getGlobalReportType } from "../services/reportSession";
import { getTranslatedReportMeta } from "../types/reportTypes";
import { generatorPath } from "../utils/generatorNav";
import { P } from "../theme/prismColors";
import { computeReportId } from "../services/reportId";
import { saveReportId } from "../services/reportStore";

interface Props {
  chart: NatalChart | null;
  onTextConfirm: (text: string) => void | Promise<void>;
}

export default function TextReport({ chart, onTextConfirm }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reportType = getGlobalReportType();
  const reportMeta = getTranslatedReportMeta(t, reportType);
  const [rawText, setRawText] = useState("");
  const [isGen, setIsGen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "conn" | "recv" | "done" | "err">("idle");
  const abortRef = useRef(false);
  const genSessionRef = useRef(0);
  const autoStartedRef = useRef(false);

  const [calcPhase, setCalcPhase] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleGen = useCallback(async () => {
    if (!chart) return;
    const sessionId = ++genSessionRef.current;
    const s = getSettings();
    if (!s.apiKey) { setError(t("errorNoApiKey")); setPhase("err"); return; }
    abortRef.current = false;
    setError(null); setRawText(""); setCharCount(0); setIsGen(true); setPhase("conn");
    try {
      setCalcPhase(t("textReportCalculating"));
      const received = await generateReportText(chart, reportType, (text) => {
        if (abortRef.current || sessionId !== genSessionRef.current) return;
        setRawText(text);
        setCharCount(text.length);
        setPhase("recv");
      });
      if (sessionId !== genSessionRef.current) return;
      setRawText(received);
      setCharCount(received.length);
      setCalcPhase("");
      setPhase("done");
    } catch (e: unknown) {
      if (sessionId !== genSessionRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setPhase("err");
    } finally {
      if (sessionId === genSessionRef.current) {
        setIsGen(false);
      }
    }
  }, [chart, reportType, t]);

  useEffect(() => {
    if (!chart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void handleGen();
  }, [chart, handleGen]);

  const handleConfirmReport = useCallback(async () => {
    if (!chart?.birthData) {
      setConfirmError(t("textReportNoChart"));
      return;
    }
    if (!rawText.trim()) {
      setConfirmError(t("textReportWaitGeneration"));
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      await Promise.resolve(onTextConfirm(rawText));
      const rid = await computeReportId(chart.birthData, reportType);
      saveReportId(rid, reportType);
      navigate(`${generatorPath("final-report")}?reportType=${encodeURIComponent(reportType)}&reportId=${encodeURIComponent(rid)}`);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : t("textReportNavigateFail"));
    } finally {
      setConfirming(false);
    }
  }, [chart, rawText, onTextConfirm, reportType, navigate, t]);

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "transparent" }}>
        <p className="text-sm mb-4" style={{ color: P.muted }}>{t("textReportNoData")}</p>
        <button onClick={() => navigate(generatorPath())} className="px-4 py-2 rounded-lg text-xs border" style={{ borderColor: P.cardBorder, color: P.text2 }}>{t("textReportBackHome")}</button>
      </div>
    );
  }

  const name = chart.birthData.name || "你";

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: P.text }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: P.headerBg, borderColor: P.cardBorder }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(generatorPath("data-review"))} className="flex items-center gap-1.5 text-sm p-2 -ml-2" style={{ color: P.muted }}>
            <ArrowLeft size={16} /><span className="hidden sm:inline">{t("textReportBack")}</span>
          </button>
          <h1 className="text-sm font-bold" style={{ color: P.text }}>{t("textReportStep")}</h1>
          <button onClick={() => navigate(generatorPath("settings"))} className="p-2 rounded-lg" style={{ color: P.muted }}><Settings size={16} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: P.muted }}>Step 2 of 3</p>
          <h2 className="text-xl font-bold mb-1" style={{ color: P.text }}>{name} · {reportMeta.name}</h2>
          <p className="text-xs" style={{ color: P.muted }}>{t('textReportGenerating', { wordCount: reportMeta.wordCount })}</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-4">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: P.gold }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: isGen || rawText ? P.gold : "rgba(232,185,81,0.2)" }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(232,185,81,0.2)" }} />
        </div>

        {isGen && (
          <div className="text-center py-12">
            <Loader className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: P.gold }} />
            <p className="text-sm font-medium mb-1" style={{ color: P.text }}>
              {phase === "conn" ? (calcPhase || "正在进行星盘计算...") : "正在生成文字报告..."}
            </p>
            {calcPhase && phase === "conn" && (
              <p className="text-xs mt-2 px-4 py-1 rounded-full inline-block" style={{ background: "rgba(232,185,81,0.08)", color: P.muted }}>
                浏览器端精确计算中
              </p>
            )}
            {rawText && (
              <p className="text-xs mt-2 px-4 py-1 rounded-full inline-block" style={{ background: "rgba(232,185,81,0.08)", color: P.muted }}>
                {t('textReportCharCount', { count: charCount })}
              </p>
            )}
          </div>
        )}

        {error && !isGen && (
          <div className="rounded-xl p-4 mb-4 text-center" style={{ background: "rgba(180,80,80,0.06)", border: "1px solid rgba(180,80,80,0.2)" }}>
            <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: "#B05050" }} />
            <p className="text-xs mb-3" style={{ color: "#B05050" }}>{error}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate(generatorPath("settings"))} className="px-4 py-2 rounded-lg text-xs border" style={{ borderColor: P.cardBorder, color: P.text2 }}>{t("textReportCheckSettings")}</button>
              <button onClick={() => handleGen()} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1" style={{ background: P.gold, color: P.onGold }}>
                <RefreshCw size={12} /> {t("textReportRetry")}
              </button>
            </div>
          </div>
        )}

        {rawText && !isGen && (
          <>
            <div className="rounded-2xl p-4 mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: P.gold }}>{t("textReportGenerated")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(74,138,90,0.1)", color: "#4A8A5A" }}>
                  {t('textReportChars', { count: rawText.length })}
                </span>
              </div>
              <div
                className="text-xs leading-relaxed whitespace-pre-wrap overflow-auto"
                style={{ color: P.text2, maxHeight: "60vh" }}
              >
                {rawText}
              </div>
            </div>

            <div className="text-center mb-4">
              <button
                onClick={() => handleGen()}
                className="px-4 py-2 rounded-lg text-xs border flex items-center gap-1.5 mx-auto"
                style={{ borderColor: P.cardBorder, color: P.text2 }}
              >
                <RefreshCw size={12} /> {t("textReportRegenerate")}
              </button>
            </div>
          </>
        )}

        {rawText && !isGen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-xl z-50" style={{ background: P.footerBg, borderColor: P.cardBorder }}>
            <div className="max-w-2xl mx-auto">
              {confirmError && (
                <p className="text-xs text-center mb-2 px-2" style={{ color: "#f87171" }}>{confirmError}</p>
              )}
              <button
                type="button"
                onClick={() => void handleConfirmReport()}
                disabled={confirming}
                className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: P.gold, color: P.onGold }}
              >
                {confirming ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {confirming ? t("textReportEnterFinal") : t("textReportFinalHint")}
                {!confirming && <ChevronRight size={16} />}
              </button>
              <p className="text-center text-[10px] mt-2" style={{ color: P.muted }}>{t("textReportFinalHint")}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
