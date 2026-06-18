import "./polyfills";
import "./index.css";
import "@/styles/prism.css";
import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router";
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
  const [chart, setChart] = useState<NatalChart | null>(globalChart);
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
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
    } catch (e) {
      console.warn("[report] 同步到服务器失败，请确认 payment API 已启动", e);
    }
    return { reportId, reportType };
  }, []);

  const handleGenerate = useCallback(async (birthData: BirthData) => {
    setIsLoading(true);
    setCharCount(0);
    hasNavigated.current = false;
    try {
      const natalChart = await calculateNatalChart(birthData);
      saveBirthData(birthData);
      globalChart = natalChart;
      globalReportText = "";
      clearReportText(getGlobalReportType());
      setChart(natalChart);

      const reportType = getGlobalReportType();
      const text = await generateReportText(natalChart, reportType, (t) => setCharCount(t.length));
      if (!text.trim()) throw new Error("报告生成失败，未收到有效内容");

      const { reportId } = await persistReport(text, natalChart);
      setIsLoading(false);
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate(`${generatorPath("final-report")}?reportType=${encodeURIComponent(reportType)}&reportId=${encodeURIComponent(reportId)}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Error generating report:", error);
      setIsLoading(false);
      alert(`报告生成出错: ${errMsg}\n\n如果问题持续，请检查：\n1. 设置页是否已配置 API Key\n2. 网络连接是否正常`);
    }
  }, [navigate, persistReport]);

  const handleTextConfirm = useCallback(async (text: string) => {
    const activeChart = globalChart;
    if (!activeChart) return;
    await persistReport(text, activeChart);
  }, [persistReport]);

  return (
    <div className="prism-root relative min-h-screen">
      <PrismBackground />
      <div className="relative z-10">
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
