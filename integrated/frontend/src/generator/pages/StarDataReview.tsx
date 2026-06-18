import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ArrowLeft, Settings, ChevronRight, CheckCircle } from "lucide-react";
import type { NatalChart } from "../services/astrologyEngine";
import StarChartView from "../components/StarChartView";
import { generatorPath } from "../utils/generatorNav";
import { P } from "../theme/prismColors";

interface Props { chart: NatalChart | null; }

export default function StarDataReview({ chart }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!chart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "transparent" }}>
        <p className="text-sm mb-4" style={{ color: P.muted }}>{t('textReportNoData')}</p>
        <button onClick={() => navigate(generatorPath())} className="px-4 py-2 rounded-lg text-xs border" style={{ borderColor: P.cardBorder, color: P.text2 }}>
          {t('textReportBackHome')}
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
            <ArrowLeft size={16} /><span className="hidden sm:inline">{t('textReportBack')}</span>
          </button>
          <h1 className="text-sm font-bold" style={{ color: P.text }}>{t('starReviewStep')}</h1>
          <button onClick={() => navigate(generatorPath("settings"))} className="p-2 rounded-lg" style={{ color: P.muted }}><Settings size={16} /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: P.muted }}>Step 1 of 3</p>
          <h2 className="text-xl font-bold mb-1" style={{ color: P.text }}>{t('starReviewTitle', { name })}</h2>
          <p className="text-xs" style={{ color: P.muted }}>{t('starReviewHint')}</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-4">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: P.gold }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(232,185,81,0.2)" }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(232,185,81,0.2)" }} />
        </div>

        <div className="flex justify-center mb-6"><StarChartView chart={chart} size={280} /></div>

        <SectionTitle icon="☉" title={t('starReviewPlanets')} />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(232,185,81,0.08)" }}>
                <th className="text-left py-2.5 px-3 font-semibold" style={{ color: P.text }}>{t('starReviewPlanet')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewSign')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewDegree')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewHouse')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewStatus')}</th>
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
                  <td className="py-2.5 px-2" style={{ color: P.text2 }}>{t('starReviewHouseLabel')}{p.house}</td>
                  <td className="py-2.5 px-2">
                    {p.isRetrograde ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(180,80,80,0.08)", color: "#B07070" }}>{t('starReviewRetrograde')}</span> :
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(74,138,90,0.08)", color: "#4A8A5A" }}>{t('starReviewDirect')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle icon="↗" title={t('starReviewAxes')} />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <tbody>
              {[
                { name: t('starReviewAsc'), sign: chart.angles.ascendantSign, deg: chart.angles.ascendant },
                { name: t('starReviewMc'), sign: chart.angles.mcSign, deg: chart.angles.mc },
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

        <SectionTitle icon="⌂" title={t('starReviewHouses')} />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "rgba(232,185,81,0.08)" }}>
                <th className="text-left py-2.5 px-3 font-semibold" style={{ color: P.text }}>{t('starReviewHouse')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewSign')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewDegree')}</th>
                <th className="text-left py-2.5 px-2 font-semibold" style={{ color: P.text }}>{t('starReviewNote')}</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((h, i) => (
                <tr key={i} className="border-t" style={{ borderColor: P.cardBorder }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: P.text }}>{t('starReviewHouseLabel')}{h.house}</td>
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

        <SectionTitle icon="◎" title={t('starReviewAspects')} />
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: P.cardBg, border: `1px solid ${P.cardBorder}` }}>
          {Object.entries(aspectsByPlanet).map(([planet, aspects], idx) => (
            <div key={planet} className={idx > 0 ? "border-t" : ""} style={{ borderColor: P.cardBorder }}>
              <div className="py-2.5 px-3 flex items-center gap-2">
                <span className="font-medium text-xs" style={{ color: P.text }}>{planet}</span>
                <span className="text-[10px]" style={{ color: P.text2 }}>
                  {aspects.map((a, i) => (
                    <span key={i}>
                      {formatAspectLabel(a, t)}
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
              {t('starReviewConfirm')}
              <ChevronRight size={16} />
            </button>
            <p className="text-center text-[10px] mt-2" style={{ color: P.muted }}>{t('starReviewConfirmHint')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatAspectLabel(raw: string, t: (key: string) => string): string {
  const symbols: [string, string][] = [
    [t('starReviewConjunction'), "○"],
    [t('starReviewSextile'), "△"],
    [t('starReviewSquare'), "□"],
    [t('starReviewTrine'), "◇"],
    [t('starReviewOpposition'), "☍"],
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
