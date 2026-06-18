import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Check, FileText, Home, Loader2 } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { loadQuizReport, type QuizReportData } from "@/lib/quizReport";

export default function Report() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [report, setReport] = useState<QuizReportData | null>(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const data = loadQuizReport();
    if (!data) {
      navigate("/", { replace: true });
      return;
    }
    setReport(data);
    const timer = setTimeout(() => setGenerating(false), 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5]">
        <Loader2 size={32} className="animate-spin text-[#E8C547]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="border-b border-[#E8E4DC] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#E8C547]" />
            <h1 className="font-['Fredoka'] text-xl text-[#2D2A26]">{t("reportGeneration", "Report Generation")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {generating ? (
          <div className="py-24 text-center">
            <Loader2 size={40} className="mx-auto mb-4 animate-spin text-[#E8C547]" />
            <p className="font-['Fredoka'] text-lg text-[#2D2A26]">{t("generatingReport", "Generating your report...")}</p>
            <p className="mt-2 text-sm text-[#6B6560]">{t("generatingReportDesc", "Analyzing your answers based on your age group.")}</p>
          </div>
        ) : (
          <div>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#81B29A]/15">
                <Check size={32} className="text-[#81B29A]" />
              </div>
              <h2 className="mb-2 font-['Fredoka'] text-2xl text-[#2D2A26]">{t("reportReady", "Your Report Is Ready")}</h2>
              <p className="text-sm text-[#6B6560]">
                {t("yourAgeGroup")}: <strong className="text-[#2D2A26]">{report.ageGroupName}</strong> · {report.userAge} {t("yearsOld")}
              </p>
            </div>

            <div className="mb-8 rounded-2xl border border-[#81B29A]/30 bg-[#81B29A]/5 p-6">
              <h3 className="mb-4 font-['Fredoka'] text-lg text-[#2D2A26]">{t("fullReport", "Your Full Report")}</h3>
              <div className="space-y-4">
                {report.answers.map((item, idx) => (
                  <div key={item.questionId} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-1 flex items-start gap-2">
                      <span className="text-xs font-bold text-[#E8C547]">Q{idx + 1}</span>
                      <p className="text-sm font-medium text-[#2D2A26]">{item.title}</p>
                    </div>
                    {item.description && (
                      <p className="ml-5 text-xs text-[#6B6560]">{item.description}</p>
                    )}
                    <div className="ml-5 mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#6B6560]">{t("yourChoice", "Your choice")}:</span>
                      <span className="rounded-full bg-[#81B29A]/15 px-2.5 py-0.5 text-xs font-bold text-[#81B29A]">
                        {item.selectedKey}
                      </span>
                      <span className="text-xs text-[#2D2A26]">{item.selectedText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8C547] px-8 py-3.5 font-['Fredoka'] font-medium text-[#2D2A26] transition-transform hover:scale-[1.02]"
            >
              <Home size={18} />
              {t("backToHome", "Back to Home")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
