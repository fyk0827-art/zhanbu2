import { type ElementType } from "react";

const PRIMARY = "#5B3A8C";
const SECONDARY = "#E8C87A";
const DARK = "#2D1B4E";
const CARD_BORDER = "#f0e6d3";

export interface IdentityBadge {
  icon: ElementType;
  label: string;
  value: string;
  score?: string;
  color?: string;
}

export interface ReportIdentitySectionProps {
  roleLabel: string;
  tagline?: string;
  description?: string;
  badges?: IdentityBadge[];
}

export function ReportIdentitySection({
  roleLabel,
  tagline,
  description,
  badges,
}: ReportIdentitySectionProps) {
  const descLines = description
    ?.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const badgeCols =
    badges && badges.length === 2 ? "grid-cols-2" : badges && badges.length >= 3 ? "grid-cols-3" : "grid-cols-1";

  return (
    <section className="py-8 px-6 max-w-[414px] mx-auto">
      <div
        className="relative rounded-2xl p-6 shadow-xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1A0F2E 100%)` }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/3"
          style={{ background: PRIMARY, opacity: 0.08 }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full translate-y-1/3 -translate-x-1/3"
          style={{ background: SECONDARY, opacity: 0.08 }}
        />
        <div className="relative flex flex-col items-center gap-5">
          <div
            className="w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-2xl overflow-hidden"
            style={{ background: DARK, borderColor: SECONDARY }}
          >
            <img src="/images/ping_avatar.png" alt="" className="w-28 h-28 object-contain scale-125" />
          </div>
          <div className="text-center">
            <div
              className="inline-block rounded-full px-3 py-1 mb-2"
              style={{ background: "rgba(232,200,122,0.15)" }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200">
                Identity Revealed
              </span>
            </div>
            <h2 className="text-3xl font-black mb-1 tracking-tight text-white">
              你是 <span className="text-amber-300">{roleLabel}</span>
            </h2>
            {tagline && <div className="text-lg font-bold text-amber-200/90 mb-3">{tagline}</div>}
            {descLines && descLines.length > 0 && (
              <div className="space-y-2">
                {descLines.map((line, i) => (
                  <p key={i} className="text-sm text-white/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {badges && badges.length > 0 && (
        <div className={`grid ${badgeCols} gap-3 mt-5`}>
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="rounded-xl p-4 text-center shadow-md border"
              style={{ background: "white", borderColor: CARD_BORDER }}
            >
              <badge.icon size={22} style={{ color: badge.color || PRIMARY }} className="mx-auto mb-2" />
              <div className="text-xs text-gray-500 mb-1">{badge.label}</div>
              <div className="text-sm font-bold text-gray-800">{badge.value}</div>
              {badge.score && (
                <div className="text-xs font-bold mt-1" style={{ color: badge.color || PRIMARY }}>
                  {badge.score}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
