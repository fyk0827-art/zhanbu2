import { useNavigate } from "react-router";
import { ArrowLeft, Settings, ChevronRight, CheckCircle } from "lucide-react";
import type { NatalChart } from "../services/astrologyEngine";
import StarChartView from "../components/StarChartView";
import { generatorPath } from "../utils/generatorNav";
import { P } from "../theme/prismColors";

interface Props { chart: NatalChart | null; }

export default function StarDataReview({ chart }: Props) {
  const navigate = useNavigate();

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "transparent" }}>
        <p className="text-sm mb-4" style={{ color: P.muted }}>请先输入出生信息</p>
        <button onClick={() => navigate(generatorPath())} className="px-4 py-2 rounded-lg text-xs border" style={{ borderColor: P.cardBorder, color: P.text2 }}>
          返回首页
        </button>
      </div>
    );
  }

  const name = chart.birthData.name || "你";

  const aspectsByPlanet: Record<string, string[]> = {};
  for (const a of chart.aspects) {
    if (!aspectsByPlanet[a.planet1]) aspectsByPlanet[a.planet1] = [];
    if (!aspectsByPlanet[a.planet2]) aspectsByPlanet[a.planet2] = [];
    aspectsByPlanet[a.planet1].push(`${a.aspectType}${a.planet2}`);
    aspectsByPlanet[a.planet2].push(`${a.aspectType}${a.planet1}`);
  }

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: P.text }}>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: P.headerBg, borderColor: P.cardBorder }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(generatorPath())} className="flex items-center gap-1.5 text-sm p-2 -ml-2" style={{ color: P.muted }}>
            <ArrowLeft size={16} /><span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-sm font-bold" style={{ color: P.text }}>步骤 1/3：星盘数据确认</h1>
          <button onClick={() => navigate(generatorPath("settings"))} className="p-2 rounded-lg" style={{ color: P.muted }}><Settings size={16} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: P.muted }}>Step 1 of 3</p>
          <h2 className="text-xl font-bold mb-1" style={{ color: P.text }}>{name} 的星盘数据</h2>
          <p className="text-xs" style={{ color: P.muted }}>请仔细核对以下星盘信息，确认无误后再生成报告</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-4">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: P.gold }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(232,185,81,0.2)" }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(232,185,81,0.2)" }} />
        </div>

        <div className="flex justify-center mb-6"><StarChartView chart={chart} size={280} /></div>

        <SectionTitle icon="☉" title="行星位置" />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(232,185,81,0.08)" }}>
                <th className="text-left py-2.5 px-3 font-semibold" style={{ color: P.text }}>行星</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>星座</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>度数</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>宫位</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: P.cardBorder }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: P.text }}>{p.name}</td>
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>{p.sign}</td>
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>
                    {Math.floor(p.signDegree)}°{Math.floor((p.signDegree % 1) * 60).toString().padStart(2, "0")}′
                  </td>
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>第{p.house}宫</td>
                  <td className="py-2.5 px-2">
                    {p.isRetrograde ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(180,80,80,0.08)", color: "#B07070" }}>逆行</span> :
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(74,138,90,0.08)", color: "#4A8A5A" }}>顺行</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle icon="↗" title="四轴" />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <tbody>
              {[
                { name: "上升", sign: chart.angles.ascendantSign, deg: chart.angles.ascendant },
                { name: "天顶", sign: chart.angles.mcSign, deg: chart.angles.mc },
              ].map((a, i) => {
                const deg = a.deg;
                const d = Math.floor(deg % 30);
                const m = Math.floor(((deg % 30) % 1) * 60);
                return (
                  <tr key={i} className={i > 0 ? "border-t" : ""} style={{ borderColor: P.cardBorder }}>
                    <td className="py-2.5 px-3 font-medium" style={{ color: P.text }}>{a.name}</td>
                    <td className="py-2.5 px-2" style={{ color: P.text2 }}>{a.sign}</td>
                    <td className="py-2.5 px-2" style={{ color: P.text2 }}>{d}°{m.toString().padStart(2, "0")}′</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <SectionTitle icon="⌂" title="各宫位置" />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(232,185,81,0.08)" }}>
                <th className="text-left py-2.5 px-3 font-semibold" style={{ color: P.text }}>宫位</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>星座</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>度数</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>备注</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((h, i) => (
                <tr key={i} className="border-t" style={{ borderColor: P.cardBorder }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: P.text }}>第{h.house}宫</td>
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>{h.sign}</td>
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>
                    {Math.floor(h.signDegree)}°{Math.floor((h.signDegree % 1) * 60).toString().padStart(2, "0")}′
                  </td>
                  <td className="py-2.5 px-2" style={{ color: P.muted }}>
                    {h.house === 1 ? "(上升)" : h.house === 4 ? "(天底)" : h.house === 7 ? "(下降)" : h.house === 10 ? "(天顶)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle icon="◎" title="行星相位" />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          {Object.entries(aspectsByPlanet).map(([planet, aspects], idx) => (
            <div key={planet} className={idx > 0 ? "border-t" : ""} style={{ borderColor: P.cardBorder }}>
              <div className="py-2.5 px-3 flex items-center gap-2">
                <span className="font-medium text-xs" style={{ color: P.text }}>{planet}</span>
                <span className="text-[10px]" style={{ color: P.text2 }}>
                  {aspects.map((a, i) => (
                    <span key={i}>
                      {formatAspectLabel(a)}
                      {i < aspects.length - 1 ? "、" : ""}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-xl" style={{ background: P.footerBg, borderColor: P.cardBorder }}>
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => navigate(generatorPath("text-report"))}
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: P.gold, color: P.onGold }}
            >
              <CheckCircle size={16} />
              数据核对无误，生成文字报告
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-[10px] mt-2" style={{ color: P.muted }}>点击后将调用 AI 生成文字版人生蓝图报告</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatAspectLabel(raw: string): string {
  const symbols: [string, string][] = [
    ["合相", "○"],
    ["六合", "△"],
    ["刑克", "□"],
    ["拱相", "◇"],
    ["冲相", "☍"],
  ];
  for (const [type, symbol] of symbols) {
    if (raw.startsWith(type)) return symbol + raw.slice(type.length);
  }
  return raw;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: P.gold }}>{icon}</span>
      <h3 className="text-sm font-bold" style={{ color: P.text }}>{title}</h3>
    </div>
  );
}
