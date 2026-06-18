import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Loader2, Check, ChevronRight } from "lucide-react";
import { questionApi, settingsApi } from "@/services/api";
import type { QuestionDTO, SubmitAnswerRequest } from "@/types/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import "@/styles/prism.css";

interface AgeGroup {
  id: number;
  name: string;
  minAge: number;
  maxAge: number;
  price: number;
}

interface QuizFlowProps {
  ageGroups: AgeGroup[];
  onClose: () => void;
}

type QuizStep = "age" | "answering" | "result";

const DIMENSIONS = [
  { key: "P", name: "◈ P 维度 · 肉身容器" },
  { key: "R", name: "◈ R 维度 · 灵魂技艺" },
  { key: "I", name: "◈ I 维度 · 感知之门" },
  { key: "S", name: "◈ S 维度 · 价值天平" },
  { key: "M", name: "◈ M 维度 · 使命方向" },
];

function getDimIndex(qIndex: number, total: number): number {
  if (total <= 0) return 0;
  if (total === 5) return Math.min(qIndex, 4);
  return Math.min(Math.floor((qIndex / total) * 5), 4);
}

export default function QuizFlow({ ageGroups, onClose }: QuizFlowProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<QuizStep>("age");
  const [userAge, setUserAge] = useState("");
  const [ageError, setAgeError] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<AgeGroup | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [slideKey, setSlideKey] = useState(0);

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });

  const questionCount = publicSettings?.quizQuestionCount ?? 5;

  const { data: fetchedQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", matchedGroup?.id, i18n.language, questionCount],
    queryFn: () =>
      matchedGroup
        ? questionApi.list(matchedGroup.id, i18n.language)
        : Promise.resolve([] as QuestionDTO[]),
    enabled: !!matchedGroup && step === "answering",
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (req: SubmitAnswerRequest) => questionApi.submitAnswer(req),
  });

  const determineAgeGroup = (age: number): AgeGroup | null => {
    return ageGroups.find((g) => age >= g.minAge && age <= g.maxAge) || null;
  };

  const handleAgeSubmit = () => {
    const age = parseInt(userAge);
    if (isNaN(age) || age < 0 || age > 120) { setAgeError(t("invalidAge")); return; }
    setAgeError("");
    const group = determineAgeGroup(age);
    if (!group) { setAgeError(t("noAgeGroupMatch")); return; }
    setMatchedGroup(group);
    setStep("answering");
    setCurrentQIndex(0);
    setSlideKey((k) => k + 1);
  };

  const handleSelectOption = (qId: number, key: string) => {
    if (selections[qId]) return;
    const qList = fetchedQuestions || [];
    const newSelections = { ...selections, [qId]: key };
    setSelections(newSelections);
    setTimeout(() => {
      if (currentQIndex < qList.length - 1) {
        setCurrentQIndex((p) => p + 1);
        setSlideKey((k) => k + 1);
      } else {
        handleFinishAnswering(newSelections);
      }
    }, 600);
  };

  const saveAnswers = async (answersMap: Record<number, string>) => {
    if (!matchedGroup || !fetchedQuestions) return;
    const age = parseInt(userAge);
    for (const q of fetchedQuestions) {
      const sel = answersMap[q.id];
      if (sel) {
        await submitAnswerMutation.mutateAsync({ questionId: q.id, respondentAge: age, selectedOption: sel });
      }
    }
  };

  const handleContinueToGenerator = () => {
    sessionStorage.setItem("qaTestTaken", "true");
    window.location.href = "/generator";
  };

  const handleFinishAnswering = async (finalSelections?: Record<number, string>) => {
    const answersMap = finalSelections ?? selections;
    const total = fetchedQuestions?.length ?? 0;
    const answered = fetchedQuestions?.filter((q) => answersMap[q.id]).length ?? 0;
    if (total > 0 && answered < total) return;
    setSelections(answersMap);
    setStep("result");
    await saveAnswers(answersMap);
  };

  const qList = fetchedQuestions || [];
  const currentQ = qList[currentQIndex];
  const answeredCount = qList.filter((q) => selections[q.id]).length;
  const dimIdx = useMemo(() => getDimIndex(currentQIndex, qList.length), [currentQIndex, qList.length]);
  const progressPct = qList.length > 0 ? ((currentQIndex + 1) / qList.length) * 100 : 0;

  return (
    <div className="prism-root fixed inset-0 z-[100] overflow-y-auto">
      <PrismBackground />
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <LanguageSwitcher variant="compact" />
        <button
          onClick={onClose}
          className="rounded-full p-2 transition-all hover:rotate-90"
          style={{ color: "rgba(250,246,240,0.5)" }}
        >
          <X size={20} />
        </button>
      </div>

      {step === "age" && (
        <div className="prism-page min-h-screen">
          <div className="w-full max-w-[400px] text-center">
            <div className="mb-6"><PrismBrandSymbol size={56} /></div>
            <h2 className="prism-font-serif text-xl font-bold mb-2" style={{ color: "var(--prism-cream)" }}>
              {t("howOldAreYou")}
            </h2>
            <p className="text-sm mb-8" style={{ color: "rgba(250,246,240,0.4)" }}>{t("ageHelpText")}</p>
            <input
              type="number"
              value={userAge}
              onChange={(e) => { setUserAge(e.target.value); setAgeError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAgeSubmit()}
              placeholder={t("enterAge")}
              min={0}
              max={120}
              autoFocus
              className="prism-input text-center text-2xl prism-font-serif mb-4"
            />
            {ageError && <p className="mb-4 text-sm" style={{ color: "var(--prism-danger)" }}>{ageError}</p>}
            <button className="prism-btn-gold w-full" onClick={handleAgeSubmit} disabled={!userAge.trim()}>
              {t("continue")}
            </button>
          </div>
        </div>
      )}

      {step === "answering" && matchedGroup && (
        <div className="prism-page min-h-screen">
          <div className="w-full max-w-[480px] flex flex-col min-h-[85vh] justify-center">
            {questionsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={36} className="animate-spin" style={{ color: "var(--prism-gold)" }} />
              </div>
            ) : currentQ ? (
              <>
                <div className="mb-8">
                  <div className="flex justify-center gap-4 mb-4">
                    {DIMENSIONS.map((d, i) => (
                      <div
                        key={d.key}
                        className={`prism-dim-icon ${i === dimIdx ? "active" : i < dimIdx ? "done" : ""}`}
                      >
                        {d.key}
                      </div>
                    ))}
                  </div>
                  <div className="prism-progress-track">
                    <div className="prism-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div key={slideKey} className="prism-question-enter text-center">
                  <div className="prism-font-display text-[11px] tracking-[6px] uppercase mb-2" style={{ color: "rgba(232,185,81,0.4)" }}>
                    PRISM
                  </div>
                  <div className="prism-font-serif text-[13px] tracking-[3px] mb-7" style={{ color: "rgba(232,185,81,0.6)" }}>
                    {DIMENSIONS[dimIdx].name}
                  </div>
                  <h3 className="prism-font-serif text-lg font-semibold leading-relaxed mb-9 min-h-[70px]" style={{ color: "var(--prism-cream)" }}>
                    {currentQ.title}
                  </h3>
                  {currentQ.description && (
                    <p className="text-sm mb-6 -mt-6" style={{ color: "rgba(250,246,240,0.4)" }}>{currentQ.description}</p>
                  )}
                  <div className="flex flex-col gap-3">
                    {currentQ.options.map((opt) => {
                      const isSelected = selections[currentQ.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(currentQ.id, opt.key)}
                          disabled={!!selections[currentQ.id]}
                          className={`prism-option-btn ${isSelected ? "selected" : ""}`}
                        >
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-center text-xs mt-6 italic min-h-[20px]" style={{ color: "rgba(232,185,81,0.35)" }}>
                  {currentQIndex + 1} / {qList.length} · {matchedGroup.name}
                </p>
              </>
            ) : (
              <div className="text-center py-10" style={{ color: "rgba(250,246,240,0.5)" }}>
                <p>{t("noQuestionsAvailable", "No questions available for this age group.")}</p>
                <button className="prism-btn-gold mt-6" onClick={() => setStep("age")}>{t("goBack")}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "result" && matchedGroup && (
        <div className="prism-page min-h-screen">
          <div className="w-full max-w-[440px] text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(232,185,81,0.12)" }}>
              <Check size={28} style={{ color: "var(--prism-gold)" }} />
            </div>
            <h2 className="prism-font-serif text-xl font-bold mb-2" style={{ color: "var(--prism-cream)" }}>
              {t("answersSaved", "All Answers Saved!")}
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(250,246,240,0.5)" }}>
              你已完成 {answeredCount} 道灵魂校准。<br />
              接下来填写出生信息生成报告——<strong style={{ color: "var(--prism-gold)" }}>可免费预览约 50%</strong>，满意后再支付解锁全文。
            </p>

            <div className="prism-birth-form text-left mb-6">
              <h4 className="text-sm font-medium mb-3" style={{ color: "var(--prism-cream)" }}>{t("yourSelections", "Your Selections")}</h4>
              <div className="space-y-2">
                {qList.map((q, idx) => {
                  const sel = selections[q.id];
                  return (
                    <div key={q.id} className="flex items-start gap-2 text-sm">
                      <span className="text-xs" style={{ color: "rgba(250,246,240,0.3)" }}>{idx + 1}.</span>
                      <span className="flex-1 truncate" style={{ color: "rgba(250,246,240,0.5)" }}>{q.title}</span>
                      {sel ? (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(232,185,81,0.12)", color: "var(--prism-gold)" }}>{sel}</span>
                      ) : (
                        <span className="shrink-0 text-xs" style={{ color: "var(--prism-danger)" }}>-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="prism-btn-gold w-full inline-flex items-center justify-center gap-2" onClick={handleContinueToGenerator}>
              生成人生剧本
              <ChevronRight size={18} />
            </button>
            <p className="mt-4 text-xs" style={{ color: "rgba(250,246,240,0.25)" }}>
              支付将在报告生成完成后进行
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
