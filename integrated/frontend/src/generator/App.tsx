import "./polyfills";
import "./index.css";
import "@/styles/prism.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import PrismBackground from "@/components/prism/PrismBackground";
import HomePage from "./pages/HomePage";
import StarDataReview from "./pages/StarDataReview";
import TextReport from "./pages/TextReport";
import BlueprintReport from "./pages/BlueprintReport";
import SettingsPage from "./pages/SettingsPage";
import { saveReportText, clearReportText, saveReportId, saveBirthData } from "./services/reportStore";
import { computeReportId } from "./services/reportId";
import { getGlobalReportType, setGlobalReportType } from "./services/reportSession";
import type { ReportTypeId } from "./types/reportTypes";
import { saveReportToServer } from "./services/reportApi";
import { bindPrepaidReport, getPrepaidOrderId } from "./services/partnerApi";
import { calculateNatalChart } from "./services/astrologyEngine";
import type { BirthData, NatalChart } from "./services/astrologyEngine";
import { generatorPath } from "./utils/generatorNav";
import { generateReportText } from "./services/reportGenerator";
import { trackEvent } from "./utils/track";
import { reset as resetStore, subscribe, getState } from "./utils/streamStore";

let globalChart: NatalChart | null = null;
let globalReportText: string = "";

export function getGlobalChart(): NatalChart | null { return globalChart; }
export function getGlobalReportText(): string { return globalReportText; }
export { getGlobalReportType, setGlobalReportType };
export function setGlobalReportText(text: string, reportType?: ReportTypeId) {
  globalReportText = text;
  saveReportText(text, reportType ?? getGlobalReportType());
}

export default function App() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [chart, setChart] = useState<NatalChart | null>(globalChart);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (chart) globalChart = chart;
  }, [chart]);

  const persistReport = useCallback(async (text: string, activeChart: NatalChart) => {
    const reportType = getGlobalReportType();
    globalReportText = text;
    saveReportText(text, reportType);
    const reportId = await computeReportId(activeChart.birthData, reportType);
    saveReportId(reportId, reportType);
    try {
      await saveReportToServer({
        reportId,
        reportText: text,
        chartJson: activeChart,
        displayName: activeChart.birthData.name || undefined,
        reportType,
      });
      const prepaidOrderId = getPrepaidOrderId();
      if (prepaidOrderId) {
        await bindPrepaidReport(prepaidOrderId, reportId);
      }
    } catch {
      // The local report is still usable; payment unlock can retry loading it by report ID.
    }
    return { reportId, reportType };
  }, []);

  const handleGenerate = useCallback(async (birthData: BirthData) => {
    trackEvent('chart_calculate', true);
    setIsLoading(true);
    setGenerationError(null);
    setCharCount(0);
    hasNavigated.current = false;
    resetStore();
    try {
      const natalChart = await calculateNatalChart(birthData);
      saveBirthData(birthData);
      globalChart = natalChart;
      globalReportText = "";
      clearReportText(getGlobalReportType());
      setChart(natalChart);

      const reportType = getGlobalReportType();
      let fullText = "";

      const unsub = subscribe(() => {
        const s = getState();
        if (s.sections.length >= 2 && !hasNavigated.current) {
          hasNavigated.current = true;
          setIsLoading(false);
          navigate(`${generatorPath("final-report")}?reportType=${encodeURIComponent(reportType)}`);
        }
      });

      try {
        fullText = await generateReportText(natalChart, reportType, (chunk) => setCharCount(chunk.length), i18n.language);
      } finally {
        unsub();
      }

      if (!fullText.trim()) throw new Error(t("errorEmptyReport"));

      const { reportId } = await persistReport(fullText, natalChart);
      trackEvent('report_success', true);
      setIsLoading(false);
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate(`${generatorPath("final-report")}?reportType=${encodeURIComponent(reportType)}&reportId=${encodeURIComponent(reportId)}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      trackEvent('report_fail', true);
      console.error("Error generating report:", error);
      setIsLoading(false);
      setGenerationError(t("errorNetworkFailed", { msg: errMsg }));
    }
  }, [navigate, persistReport, t, i18n.language]);

  const handleTextConfirm = useCallback(async (text: string) => {
    const activeChart = globalChart;
    if (!activeChart) return;
    await persistReport(text, activeChart);
  }, [persistReport]);

  return (
    <div className="prism-root relative min-h-screen">
      <PrismBackground />
      <div className="relative z-10">
        {generationError && (
          <div className="fixed left-1/2 top-4 z-[100] w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
            {generationError}
          </div>
        )}
        <Routes>
          <Route index element={<HomePage onGenerate={handleGenerate} isLoading={isLoading} charCount={charCount} />} />
          <Route path="data-review" element={<StarDataReview chart={chart} />} />
          <Route path="text-report" element={<TextReport chart={chart} onTextConfirm={handleTextConfirm} />} />
          <Route path="final-report" element={<BlueprintReport chart={chart} />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
}
