import { useMemo } from "react";
import { getPlanetSymbol, SIGN_SYMBOLS } from "../services/astrologyEngine";
import type { NatalChart } from "../services/astrologyEngine";

interface Props {
  chart: NatalChart;
  size?: number;
}

/** Normalize to [0, 360) */
function norm360(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Convert ecliptic longitude to chart angle (SVG radians)
 *  ASC at 180° (left), MC at 270° (top) in SVG coords
 */
function lonToAngle(ascendant: number, longitude: number): number {
  const deg = 180 + ascendant - longitude;
  return (deg * Math.PI) / 180;
}

export default function StarChartView({ chart, size = 400 }: Props) {
  const center = size / 2;
  const outerR = size * 0.46;
  const zodiacR = size * 0.40;
  const houseR = size * 0.34;
  const innerR = size * 0.14;

  const { houses, planets, angles, aspects } = chart;

  // House cusp lines (from center to outerR)
  const houseLines = useMemo(() => {
    return houses.map((h) => {
      const angleRad = lonToAngle(angles.ascendant, h.longitude);
      const x2 = center + outerR * Math.cos(angleRad);
      const y2 = center + outerR * Math.sin(angleRad);
      return { x2, y2, key: h.house, angleRad };
    });
  }, [houses, angles.ascendant, center, outerR]);

  // Zodiac sign arcs on outer ring
  const zodiacArcs = useMemo(() => {
    const arcs: { start: number; end: number; sign: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const startRad = lonToAngle(angles.ascendant, i * 30);
      const endRad = lonToAngle(angles.ascendant, (i + 1) * 30);
      arcs.push({ start: startRad, end: endRad, sign: i });
    }
    return arcs;
  }, [angles.ascendant]);

  // Planet positions (placed between houseR and zodiacR)
  const planetPositions = useMemo(() => {
    return planets.map((p) => {
      const angleRad = lonToAngle(angles.ascendant, p.longitude);
      // Distribute planets radially based on their house
      const radius = houseR + (zodiacR - houseR) * 0.5;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return { ...p, x, y, angleRad };
    });
  }, [planets, angles.ascendant, center, houseR, zodiacR]);

  // House numbers (centered in inner circle)
  const houseNumbers = useMemo(() => {
    return houses.map((h, i) => {
      const nextHouse = houses[(i + 1) % 12];
      const midLon = (() => {
        const a = norm360(h.longitude);
        const b = norm360(nextHouse.longitude);
        let diff = b - a;
        if (diff < 0) diff += 360;
        return norm360(a + diff / 2);
      })();
      const angleRad = lonToAngle(angles.ascendant, midLon);
      const hx = center + (innerR + 8) * Math.cos(angleRad);
      const hy = center + (innerR + 8) * Math.sin(angleRad);
      return { house: h.house, x: hx, y: hy };
    });
  }, [houses, angles.ascendant, center, innerR]);

  // Angle markers (ASC, MC, DSC, IC)
  const angleMarkers = useMemo(() => {
    const markers = [
      { label: "ASC", lon: angles.ascendant, color: "#C8A97E" },
      { label: "MC", lon: angles.mc, color: "#C49B8A" },
      { label: "DSC", lon: angles.descendant, color: "#8FA8B8" },
      { label: "IC", lon: angles.ic, color: "#9BB8A0" },
    ];
    return markers.map((m) => {
      const angleRad = lonToAngle(angles.ascendant, m.lon);
      const x = center + (outerR + 16) * Math.cos(angleRad);
      const y = center + (outerR + 16) * Math.sin(angleRad);
      return { ...m, x, y, angleRad };
    });
  }, [angles, center, outerR]);

  // Aspect lines inside the chart
  const aspectLines = useMemo(() => {
    const significantAspects = aspects.filter(
      (a) => a.aspectType === "合相" || a.aspectType === "冲相" || a.aspectType === "拱相" || a.aspectType === "刑克"
    ).slice(0, 8);
    return significantAspects.map((a) => {
      const p1 = planets.find((p) => p.name === a.planet1);
      const p2 = planets.find((p) => p.name === a.planet2);
      if (!p1 || !p2) return null;
      const a1 = lonToAngle(angles.ascendant, p1.longitude);
      const a2 = lonToAngle(angles.ascendant, p2.longitude);
      const x1 = center + houseR * 0.6 * Math.cos(a1);
      const y1 = center + houseR * 0.6 * Math.sin(a1);
      const x2 = center + houseR * 0.6 * Math.cos(a2);
      const y2 = center + houseR * 0.6 * Math.sin(a2);
      const color =
        a.aspectType === "合相"
          ? "rgba(196,162,101,0.35)"
          : a.aspectType === "冲相"
          ? "rgba(196,100,100,0.3)"
          : a.aspectType === "刑克"
          ? "rgba(180,80,80,0.3)"
          : "rgba(100,150,120,0.3)";
      return { x1, y1, x2, y2, color, key: `${a.planet1}-${a.planet2}` };
    }).filter(Boolean);
  }, [aspects, planets, angles.ascendant, center, houseR]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-fade-in"
      style={{ filter: "drop-shadow(0 2px 12px rgba(196,162,101,0.1))" }}
    >
      <defs>
        <radialGradient id="chartGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.97" />
          <stop offset="60%" stopColor="#F8F2EA" stopOpacity="0.94" />
          <stop offset="100%" stopColor="#F0E8DC" stopOpacity="0.9" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===== OUTER DECORATIVE RINGS ===== */}
      <circle cx={center} cy={center} r={outerR + 12} fill="none" stroke="#E0D5C5" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4" />
      <circle cx={center} cy={center} r={outerR + 6} fill="none" stroke="#E0D5C5" strokeWidth="0.5" opacity="0.25" />

      {/* ===== MAIN BACKGROUND ===== */}
      <circle cx={center} cy={center} r={outerR} fill="url(#chartGrad)" stroke="#D0C4B2" strokeWidth="1" />

      {/* ===== ZODIAC RING (outer band) ===== */}
      {zodiacArcs.map((arc, i) => {
        // Draw arc segment from houseR to outerR
        const sweep = Math.abs(arc.end - arc.start) > Math.PI ? 1 : 0;
        const ox1 = center + outerR * Math.cos(arc.start);
        const oy1 = center + outerR * Math.sin(arc.start);
        const ox2 = center + outerR * Math.cos(arc.end);
        const oy2 = center + outerR * Math.sin(arc.end);
        const ix1 = center + zodiacR * Math.cos(arc.start);
        const iy1 = center + zodiacR * Math.sin(arc.start);
        const ix2 = center + zodiacR * Math.cos(arc.end);
        const iy2 = center + zodiacR * Math.sin(arc.end);

        const bgColors = ["#FDF8F2", "#F5EDE3", "#FDF8F2", "#F5EDE3", "#FDF8F2", "#F5EDE3", "#FDF8F2", "#F5EDE3", "#FDF8F2", "#F5EDE3", "#FDF8F2", "#F5EDE3"];

        return (
          <path
            key={`zodiac-${i}`}
            d={`M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${sweep} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${zodiacR} ${zodiacR} 0 ${sweep} 0 ${ix1} ${iy1}`}
            fill={bgColors[i]}
            stroke="#D0C4B2"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Degree ticks on zodiac ring */}
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const rad = lonToAngle(angles.ascendant, deg);
        const isMajor = i % 6 === 0; // every 30°
        const r1 = outerR - 1;
        const r2 = outerR - (isMajor ? 7 : 3);
        return (
          <line
            key={`tick-${i}`}
            x1={center + r1 * Math.cos(rad)}
            y1={center + r1 * Math.sin(rad)}
            x2={center + r2 * Math.cos(rad)}
            y2={center + r2 * Math.sin(rad)}
            stroke={isMajor ? "#B0A08E" : "#C8BAA8"}
            strokeWidth={isMajor ? "1" : "0.5"}
            opacity={isMajor ? 0.5 : 0.3}
          />
        );
      })}

      {/* Zodiac symbols on outer ring */}
      {zodiacArcs.map((arc, i) => {
        const startNorm = ((arc.start % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        const endNorm = ((arc.end % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        let midAngle: number;
        if (endNorm > startNorm) {
          midAngle = (startNorm + endNorm) / 2;
        } else {
          midAngle = (startNorm + endNorm + 2 * Math.PI) / 2;
          if (midAngle > 2 * Math.PI) midAngle -= 2 * Math.PI;
        }
        const sx = center + (outerR - 14) * Math.cos(midAngle);
        const sy = center + (outerR - 14) * Math.sin(midAngle);
        return (
          <text
            key={`sign-${i}`}
            x={sx}
            y={sy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size > 300 ? "12" : "9"}
            fill="#6B5E54"
            style={{ fontFamily: "serif" }}
          >
            {SIGN_SYMBOLS[i]}
          </text>
        );
      })}

      {/* ===== HOUSE BOUNDARY LINES ===== */}
      {houseLines.map((line) => {
        const isAngle = line.key === 1 || line.key === 4 || line.key === 7 || line.key === 10;
        return (
          <line
            key={`house-${line.key}`}
            x1={center + innerR * Math.cos(line.angleRad)}
            y1={center + innerR * Math.sin(line.angleRad)}
            x2={line.x2}
            y2={line.y2}
            stroke={isAngle ? "#B8A080" : "#C8BAA8"}
            strokeWidth={isAngle ? "1.5" : "0.7"}
            opacity={isAngle ? 0.7 : 0.4}
          />
        );
      })}

      {/* ===== HOUSE BACKGROUND SEGMENTS ===== */}
      {houses.map((h, i) => {
        const nextH = houses[(i + 1) % 12];
        const startRad = lonToAngle(angles.ascendant, h.longitude);
        const endRad = lonToAngle(angles.ascendant, nextH.longitude);
        const sweep = Math.abs(endRad - startRad) > Math.PI ? 1 : 0;

        const hx1 = center + houseR * Math.cos(startRad);
        const hy1 = center + houseR * Math.sin(startRad);
        const hx2 = center + houseR * Math.cos(endRad);
        const hy2 = center + houseR * Math.sin(endRad);

        // Draw sector from center to houseR
        return (
          <path
            key={`house-sector-${h.house}`}
            d={`M ${center} ${center} L ${hx1} ${hy1} A ${houseR} ${houseR} 0 ${sweep} 1 ${hx2} ${hy2} Z`}
            fill={i % 2 === 0 ? "rgba(255,253,249,0.3)" : "rgba(245,237,227,0.25)"}
            stroke="none"
          />
        );
      })}

      {/* ===== ASPECT LINES (inside inner area) ===== */}
      {aspectLines.map((line) => (
        <line
          key={`aspect-${line!.key}`}
          x1={line!.x1}
          y1={line!.y1}
          x2={line!.x2}
          y2={line!.y2}
          stroke={line!.color}
          strokeWidth="1"
        />
      ))}

      {/* ===== INNER CENTER CIRCLE ===== */}
      <circle cx={center} cy={center} r={innerR} fill="rgba(255,253,249,0.8)" stroke="#D0C4B2" strokeWidth="0.8" />
      <circle cx={center} cy={center} r={innerR - 1} fill="none" stroke="#D0C4B2" strokeWidth="0.4" opacity="0.5" strokeDasharray="2 3" />

      {/* Center decoration */}
      <circle cx={center} cy={center} r="3" fill="#C4A265" opacity="0.3" />
      <circle cx={center} cy={center} r="1.5" fill="#C4A265" opacity="0.5" />

      {/* ===== HOUSE NUMBERS ===== */}
      {houseNumbers.map((h) => (
        <text
          key={`hnum-${h.house}`}
          x={h.x}
          y={h.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size > 300 ? "9" : "7"}
          fill="#A09078"
          style={{ fontFamily: "system-ui, sans-serif" }}
          fontWeight="500"
        >
          {h.house}
        </text>
      ))}

      {/* ===== PLANET MARKERS ===== */}
      {planetPositions.map((p) => {
        const r = size > 300 ? 12 : 9;
        return (
          <g key={p.body}>
            {/* Glow */}
            <circle cx={p.x} cy={p.y} r={r + 3} fill="#C4A265" opacity="0.06" />
            {/* Planet circle */}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill="#FFFDF9"
              stroke="#C4A265"
              strokeWidth="1.2"
              filter="url(#softGlow)"
            />
            {/* Planet symbol */}
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size > 300 ? "14" : "10"}
              fill="#2D2420"
              style={{ fontFamily: "serif" }}
            >
              {getPlanetSymbol(p.body)}
            </text>
            {/* Retrograde */}
            {p.isRetrograde && (
              <text
                x={p.x + r - 2}
                y={p.y - r + 5}
                textAnchor="middle"
                fontSize={size > 300 ? "8" : "6"}
                fill="#C49B8A"
                fontWeight="bold"
              >
                ℞
              </text>
            )}
            {/* Planet degree outside */}
            <text
              x={p.x + r + 6}
              y={p.y + 3}
              textAnchor="start"
              fontSize={size > 300 ? "7" : "5.5"}
              fill="#9A8B7A"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {Math.floor(p.signDegree)}°
            </text>
          </g>
        );
      })}

      {/* ===== ANGLE MARKERS ===== */}
      {angleMarkers.map((m) => (
        <g key={m.label}>
          <circle cx={m.x} cy={m.y} r="11" fill={m.color} opacity="0.1" />
          <circle cx={m.x} cy={m.y} r="3.5" fill={m.color} />
          <text
            x={m.x}
            y={m.y - 14}
            textAnchor="middle"
            fontSize={size > 300 ? "8.5" : "7"}
            fill={m.color}
            fontWeight="600"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
