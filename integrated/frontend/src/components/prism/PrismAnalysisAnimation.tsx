import { useEffect, useState } from "react";

const STEPS = [
  { text: "正在连接你的本命星盘…", sub: "PRISM 五维校准引擎" },
  { text: "读取行星位置与宫位配置…", sub: "Swiss Ephemeris 精度 0.01°" },
  { text: "交叉验证你的答案与星盘数据…", sub: "五维度逐层比对" },
  { text: "识别灵魂格局与飞宫链条…", sub: "格局分析 · 飞宫推演" },
  { text: "正在生成图文报告…", sub: "AI 深度解读引擎" },
  { text: "你的命运蓝图已生成", sub: "准备呈现" },
];

interface Props {
  charCount?: number;
}

export default function PrismAnalysisAnimation({ charCount = 0 }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(true);

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
      </div>
      <p
        className="prism-font-serif text-base leading-relaxed transition-opacity duration-300"
        style={{ color: "var(--prism-cream)", opacity: visible ? 1 : 0 }}
      >
        {step.text}
      </p>
      <p className="text-xs mt-3 tracking-widest" style={{ color: "rgba(232,185,81,0.3)" }}>
        {step.sub}
      </p>
      {charCount > 0 && (
        <p
          className="text-xs mt-4 px-4 py-1.5 rounded-full inline-block"
          style={{ background: "rgba(232,185,81,0.08)", color: "rgba(232,185,81,0.55)" }}
        >
          已接收 {charCount} 字符
        </p>
      )}
    </div>
  );
}
