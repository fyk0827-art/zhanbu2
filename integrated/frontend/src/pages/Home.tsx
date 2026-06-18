import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ageGroupApi, settingsApi } from "@/services/api";
import QuizFlow from "@/components/QuizFlow";
import PrismBackground from "@/components/prism/PrismBackground";
import PrismBrandSymbol from "@/components/prism/PrismBrandSymbol";
import "@/styles/prism.css";

export default function Home() {
  const { t } = useTranslation();
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: ageGroups, isLoading: ageGroupsLoading } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
  });

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });

  const questionCount = publicSettings?.quizQuestionCount ?? 5;

  // 首次访问：数据就绪后立即进入 PRISM 问答，不再先闪旧首页
  useEffect(() => {
    if (!ageGroups?.length) return;
    const hasTaken = sessionStorage.getItem("qaTestTaken");
    if (!hasTaken) {
      setShowQuiz(true);
    }
  }, [ageGroups]);

  const handleQuizClose = () => {
    setShowQuiz(false);
    sessionStorage.setItem("qaTestTaken", "true");
  };

  if (showQuiz && ageGroups) {
    return <QuizFlow ageGroups={ageGroups} onClose={handleQuizClose} />;
  }

  return (
    <div className="prism-root min-h-screen relative overflow-hidden">
      <PrismBackground />
      <div className="prism-page min-h-screen">
        {ageGroupsLoading ? (
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--prism-gold)" }} />
        ) : (
          <div className="text-center max-w-[440px]">
            <div className="mx-auto mb-6 prism-fade-in prism-fade-d1">
              <PrismBrandSymbol size={72} />
            </div>
            <div
              className="prism-font-display text-sm font-semibold tracking-[10px] uppercase mb-1 prism-fade-in prism-fade-d1"
              style={{ color: "var(--prism-gold)" }}
            >
              PRISM
            </div>
            <div
              className="prism-font-serif text-[11px] tracking-[5px] mb-10 prism-fade-in prism-fade-d2"
              style={{ color: "rgba(232,185,81,0.45)" }}
            >
              人 生 剧 本
            </div>
            <h1
              className="prism-font-serif text-[26px] font-bold leading-relaxed mb-4 prism-fade-in prism-fade-d2"
              style={{ color: "var(--prism-cream)" }}
            >
              你的灵魂蓝图
              <br />
              比你以为的
              <span style={{ color: "var(--prism-gold)", textShadow: "0 0 30px rgba(232,185,81,0.25)" }}>
                更精确
              </span>
            </h1>
            <p
              className="text-sm leading-loose mb-12 prism-fade-in prism-fade-d3"
              style={{ color: "rgba(250,246,240,0.5)" }}
            >
              {questionCount}道灵魂校准，五维度深度解码
              <br />
              然后，让星盘印证一切
            </p>
            <button
              className="prism-btn-gold prism-fade-in prism-fade-d4"
              onClick={() => setShowQuiz(true)}
              disabled={!ageGroups?.length}
            >
              开 启 解 读
            </button>
            <p className="mt-6 text-xs prism-fade-in prism-fade-d4" style={{ color: "rgba(250,246,240,0.2)" }}>
              {t("quizQuestionCountHint", { count: questionCount })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
