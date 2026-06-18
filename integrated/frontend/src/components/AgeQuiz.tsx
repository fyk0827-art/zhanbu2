import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronRight, Sparkles, RotateCcw } from "lucide-react";

interface AgeOption {
  label: string;
  scores: Record<string, number>;
}

interface AgeQuestion {
  question: string;
  options: AgeOption[];
}

interface AgeQuizProps {
  onComplete: (ageGroupId: number) => void;
  onSkip: () => void;
  ageGroups: { id: number; name: string; minAge: number; maxAge: number }[];
}

// Score keys map to age group indices: child, teenager, youngAdult, adult, senior
const SCORE_KEYS = ["child", "teenager", "youngAdult", "adult", "senior"];

export default function AgeQuiz({ onComplete, onSkip, ageGroups }: AgeQuizProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    child: 0, teenager: 0, youngAdult: 0, adult: 0, senior: 0,
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [resultGroup, setResultGroup] = useState<number | null>(null);
  const [estimatedAge, setEstimatedAge] = useState(0);

  const getQuestions = useCallback((): AgeQuestion[] => {
    const lang = i18n.language;

    const questionSets: Record<string, AgeQuestion[]> = {
      zh: [
        {
          question: "你的业余时间最喜欢做什么？",
          options: [
            { label: "玩玩具、画画、看动画片", scores: { child: 10, teenager: 1, youngAdult: 0, adult: 1, senior: 0 } },
            { label: "玩游戏、刷短视频、追星", scores: { child: 2, teenager: 10, youngAdult: 3, adult: 0, senior: 0 } },
            { label: "健身、社交、旅行、追剧", scores: { child: 0, teenager: 2, youngAdult: 10, adult: 3, senior: 1 } },
            { label: "陪伴家人、工作提升、投资理财", scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 3 } },
            { label: "园艺、读书、带孙辈、下棋", scores: { child: 0, teenager: 0, youngAdult: 0, adult: 2, senior: 10 } },
          ],
        },
        {
          question: "你平时最常用什么设备上网？",
          options: [
            { label: "平板 / 父母的手机", scores: { child: 10, teenager: 2, youngAdult: 0, adult: 1, senior: 0 } },
            { label: "手机不离手，各种App都玩", scores: { child: 2, teenager: 10, youngAdult: 8, adult: 4, senior: 1 } },
            { label: "手机+电脑，工作娱乐两不误", scores: { child: 0, teenager: 3, youngAdult: 10, adult: 8, senior: 2 } },
            { label: "电脑为主，偶尔用手机", scores: { child: 0, teenager: 1, youngAdult: 3, adult: 10, senior: 5 } },
            { label: "手机会用，但更喜欢面对面聊天", scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
        {
          question: "你目前最关心的事情是什么？",
          options: [
            { label: "考试成绩、交朋友、买新玩具", scores: { child: 10, teenager: 3, youngAdult: 0, adult: 0, senior: 0 } },
            { label: "升学、恋爱、打扮、朋友关系", scores: { child: 2, teenager: 10, youngAdult: 2, adult: 0, senior: 0 } },
            { label: "职业发展、恋爱婚姻、买房买车", scores: { child: 0, teenager: 2, youngAdult: 10, adult: 3, senior: 0 } },
            { label: "孩子教育、家庭开支、健康养生", scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 3 } },
            { label: "身体健康、子女幸福、安享晚年", scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
        {
          question: "你最喜欢的音乐类型是？",
          options: [
            { label: "儿歌、动画片主题曲", scores: { child: 10, teenager: 0, youngAdult: 0, adult: 0, senior: 0 } },
            { label: "流行、说唱、K-Pop、电子音乐", scores: { child: 1, teenager: 10, youngAdult: 8, adult: 2, senior: 0 } },
            { label: "民谣、轻音乐、独立音乐", scores: { child: 0, teenager: 3, youngAdult: 10, adult: 5, senior: 2 } },
            { label: "经典老歌、摇滚、爵士", scores: { child: 0, teenager: 1, youngAdult: 2, adult: 10, senior: 5 } },
            { label: "戏曲、红歌、传统音乐", scores: { child: 0, teenager: 0, youngAdult: 0, adult: 2, senior: 10 } },
          ],
        },
        {
          question: "如果给你一笔钱，你会怎么花？",
          options: [
            { label: "买玩具、零食、游戏皮肤", scores: { child: 10, teenager: 4, youngAdult: 0, adult: 0, senior: 0 } },
            { label: "买潮牌、化妆品、演唱会门票", scores: { child: 1, teenager: 10, youngAdult: 5, adult: 0, senior: 0 } },
            { label: "旅行、学习、投资自己", scores: { child: 0, teenager: 2, youngAdult: 10, adult: 4, senior: 1 } },
            { label: "存起来、理财、给孩子", scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 5 } },
            { label: "保健品、给孙辈、存着养老", scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
      ],
      default: [
        {
          question: t("quizQ1", "What do you enjoy most in your free time?"),
          options: [
            { label: t("quizQ1O1", "Playing with toys, drawing, watching cartoons"), scores: { child: 10, teenager: 1, youngAdult: 0, adult: 1, senior: 0 } },
            { label: t("quizQ1O2", "Gaming, social media, hanging with friends"), scores: { child: 2, teenager: 10, youngAdult: 3, adult: 0, senior: 0 } },
            { label: t("quizQ1O3", "Fitness, travel, nightlife, streaming"), scores: { child: 0, teenager: 2, youngAdult: 10, adult: 3, senior: 1 } },
            { label: t("quizQ1O4", "Family time, career growth, investing"), scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 3 } },
            { label: t("quizQ1O5", "Gardening, reading, grandkids, chess"), scores: { child: 0, teenager: 0, youngAdult: 0, adult: 2, senior: 10 } },
          ],
        },
        {
          question: t("quizQ2", "What device do you use most to go online?"),
          options: [
            { label: t("quizQ2O1", "Tablet / parents' phone"), scores: { child: 10, teenager: 2, youngAdult: 0, adult: 1, senior: 0 } },
            { label: t("quizQ2O2", "Phone is always in my hand"), scores: { child: 2, teenager: 10, youngAdult: 8, adult: 4, senior: 1 } },
            { label: t("quizQ2O3", "Phone + laptop for work and play"), scores: { child: 0, teenager: 3, youngAdult: 10, adult: 8, senior: 2 } },
            { label: t("quizQ2O4", "Computer mostly, phone sometimes"), scores: { child: 0, teenager: 1, youngAdult: 3, adult: 10, senior: 5 } },
            { label: t("quizQ2O5", "I use phone but prefer face-to-face chat"), scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
        {
          question: t("quizQ3", "What are you most concerned about right now?"),
          options: [
            { label: t("quizQ3O1", "Grades, friends, new toys/games"), scores: { child: 10, teenager: 3, youngAdult: 0, adult: 0, senior: 0 } },
            { label: t("quizQ3O2", "School, dating, looks, social life"), scores: { child: 2, teenager: 10, youngAdult: 2, adult: 0, senior: 0 } },
            { label: t("quizQ3O3", "Career, relationships, buying house/car"), scores: { child: 0, teenager: 2, youngAdult: 10, adult: 3, senior: 0 } },
            { label: t("quizQ3O4", "Kids' education, savings, health"), scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 3 } },
            { label: t("quizQ3O5", "Health, children's happiness, peace"), scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
        {
          question: t("quizQ4", "What kind of music do you like best?"),
          options: [
            { label: t("quizQ4O1", "Kids songs, cartoon theme songs"), scores: { child: 10, teenager: 0, youngAdult: 0, adult: 0, senior: 0 } },
            { label: t("quizQ4O2", "Pop, hip-hop, K-Pop, EDM"), scores: { child: 1, teenager: 10, youngAdult: 8, adult: 2, senior: 0 } },
            { label: t("quizQ4O3", "Indie, acoustic, chill tunes"), scores: { child: 0, teenager: 3, youngAdult: 10, adult: 5, senior: 2 } },
            { label: t("quizQ4O4", "Classic rock, jazz, golden oldies"), scores: { child: 0, teenager: 1, youngAdult: 2, adult: 10, senior: 5 } },
            { label: t("quizQ4O5", "Traditional, classical, folk music"), scores: { child: 0, teenager: 0, youngAdult: 0, adult: 2, senior: 10 } },
          ],
        },
        {
          question: t("quizQ5", "If you got some money, how would you spend it?"),
          options: [
            { label: t("quizQ5O1", "Toys, snacks, game items"), scores: { child: 10, teenager: 4, youngAdult: 0, adult: 0, senior: 0 } },
            { label: t("quizQ5O2", "Fashion, makeup, concert tickets"), scores: { child: 1, teenager: 10, youngAdult: 5, adult: 0, senior: 0 } },
            { label: t("quizQ5O3", "Travel, courses, self-investment"), scores: { child: 0, teenager: 2, youngAdult: 10, adult: 4, senior: 1 } },
            { label: t("quizQ5O4", "Save it, invest, spend on family"), scores: { child: 0, teenager: 0, youngAdult: 2, adult: 10, senior: 5 } },
            { label: t("quizQ5O5", "Health products, gifts for grandkids"), scores: { child: 0, teenager: 0, youngAdult: 0, adult: 3, senior: 10 } },
          ],
        },
      ],
    };

    return questionSets[lang] || questionSets["default"];
  }, [t, i18n.language]);

  const questions = getQuestions();

  const handleSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const option = questions[currentQ].options[optionIndex];
    const newScores = { ...scores };
    for (const [key, val] of Object.entries(option.scores)) {
      newScores[key] += val;
    }
    setScores(newScores);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setSelectedOption(null);
      } else {
        // Calculate result
        let maxScore = -1;
        let maxIndex = 0;
        for (let i = 0; i < SCORE_KEYS.length; i++) {
          if (newScores[SCORE_KEYS[i]] > maxScore) {
            maxScore = newScores[SCORE_KEYS[i]];
            maxIndex = i;
          }
        }
        const group = ageGroups[maxIndex];
        if (group) {
          setResultGroup(group.id);
          setEstimatedAge(Math.round((group.minAge + group.maxAge) / 2));
        }
        setStep("result");
      }
    }, 400);
  };

  const handleRestart = () => {
    setStep("intro");
    setCurrentQ(0);
    setScores({ child: 0, teenager: 0, youngAdult: 0, adult: 0, senior: 0 });
    setSelectedOption(null);
    setResultGroup(null);
  };

  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2A26]/50 backdrop-blur-sm" onClick={onSkip} />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
        <button onClick={onSkip} className="absolute right-4 top-4 rounded-full p-1 text-[#6B6560] transition-all hover:rotate-90 hover:text-[#2D2A26]">
          <X size={20} />
        </button>

        {/* Intro */}
        {step === "intro" && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8C547]/20">
              <Sparkles size={36} className="text-[#E8C547]" />
            </div>
            <h2 className="mb-3 font-['Fredoka'] text-2xl text-[#2D2A26]">
              {t("quizTitle", "Let Us Guess Your Age!")}
            </h2>
            <p className="mb-8 text-[#6B6560] leading-relaxed">
              {t("quizDesc", "Answer a few fun questions and we'll recommend the perfect questions for your age group. No need to tell us your age — we'll figure it out!")}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStep("quiz")}
                className="w-full rounded-full bg-[#E8C547] px-6 py-3.5 font-['Fredoka'] font-medium text-[#2D2A26] transition-transform hover:scale-[1.02]"
              >
                {t("quizStart", "Start the Quiz")}
              </button>
              <button
                onClick={onSkip}
                className="text-sm text-[#6B6560] transition-colors hover:text-[#E8C547]"
              >
                {t("quizSkip", "Skip and browse all questions")}
              </button>
            </div>
          </div>
        )}

        {/* Quiz */}
        {step === "quiz" && (
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs text-[#6B6560]">
                <span>{t("quizProgress", "Question {{current}} of {{total}}", { current: currentQ + 1, total: questions.length })}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E8E4DC]">
                <div
                  className="h-full rounded-full bg-[#E8C547] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <h3 className="mb-6 font-['Fredoka'] text-xl text-[#2D2A26]">
              {questions[currentQ].question}
            </h3>

            <div className="space-y-3">
              {questions[currentQ].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selectedOption !== null}
                  className={`flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left text-sm transition-all ${
                    selectedOption === idx
                      ? "border-[#E8C547] bg-[#E8C547]/10 text-[#2D2A26]"
                      : "border-[#E8E4DC] bg-white text-[#2D2A26] hover:border-[#E8C547]/50 hover:bg-[#FFFDF5]"
                  } ${selectedOption !== null && selectedOption !== idx ? "opacity-50" : ""}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    selectedOption === idx ? "bg-[#E8C547] text-[#2D2A26]" : "bg-[#E8E4DC]/50 text-[#6B6560]"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.label}</span>
                  {selectedOption === idx && <ChevronRight size={16} className="ml-auto text-[#E8C547]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {step === "result" && resultGroup && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#81B29A]/15">
              <Sparkles size={36} className="text-[#81B29A]" />
            </div>

            <p className="mb-1 text-sm text-[#6B6560]">{t("quizResultLabel", "We think you are...")}</p>

            <h2 className="mb-2 font-['Fredoka'] text-3xl text-[#2D2A26]">
              {ageGroups.find((g) => g.id === resultGroup)?.name}
            </h2>

            <p className="mb-1 text-lg text-[#E07A5F]">
              ~{estimatedAge} {t("yearsOld", "years old")}
            </p>

            <p className="mb-8 text-sm text-[#6B6560]">
              {t("quizResultDesc", "We've selected questions perfect for your age group. Ready to share your wisdom?")}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onComplete(resultGroup)}
                className="w-full rounded-full bg-[#E8C547] px-6 py-3.5 font-['Fredoka'] font-medium text-[#2D2A26] transition-transform hover:scale-[1.02]"
              >
                {t("quizViewQuestions", "View My Questions")}
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-2 text-sm text-[#6B6560] transition-colors hover:text-[#E8C547]"
              >
                <RotateCcw size={14} />
                {t("quizRetake", "Retake Quiz")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
