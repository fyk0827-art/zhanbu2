import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const STEPS = [
  { textKey: "analysisStep1Text", subKey: "analysisStep1Sub" },
  { textKey: "analysisStep2Text", subKey: "analysisStep2Sub" },
  { textKey: "analysisStep3Text", subKey: "analysisStep3Sub" },
  { textKey: "analysisStep4Text", subKey: "analysisStep4Sub" },
  { textKey: "analysisStep5Text", subKey: "analysisStep5Sub" },
  { textKey: "analysisStep6Text", subKey: "analysisStep6Sub" },
];

const INITIAL_COUNTDOWN = Math.floor(Math.random() * 301) + 600;

interface Props {
  charCount?: number;
}

export default function PrismAnalysisAnimation({ charCount: _charCount }: Props) {
  const { t } = useTranslation();
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);
  const doneRef = useRef(false);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setStepIdx(i);
          setVisible(true);
        }, 300);
      }, i * 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { doneRef.current = true; return 0; }
        return prev - 1;
      });
    }, 100);
    return () => clearInterval(t);
  }, []);

  const step = STEPS[stepIdx];

  return (
    <div className="prism-page text-center max-w-[400px] mx-auto">
      <div className="relative w-[180px] h-[180px] mx-auto mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="prism-analysis-ring" />
        ))}
        <div
          className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full"
          style={{ background: "var(--prism-gold)", boxShadow: "0 0 30px rgba(232,185,81,0.4)" }}
        />
        <p className="absolute inset-0 flex items-center justify-center text-xs font-mono mt-5" style={{ color: "var(--prism-cream)" }}>
          {countdown > 0
            ? `Estimated time: ${(countdown / 10).toFixed(1)}s`
            : "The results are coming soon, please be patient"}
        </p>
      </div>
      <p
        className="prism-font-serif text-base leading-relaxed transition-opacity duration-300"
        style={{ color: "var(--prism-cream)", opacity: visible ? 1 : 0 }}
      >
        {t(step.textKey)}
      </p>
      <p className="text-xs mt-3 tracking-widest" style={{ color: "rgba(232,185,81,0.3)" }}>
        {t(step.subKey)}
      </p>
    </div>
  );
}
