import { useMemo } from "react";

// ===== RADAR CHART =====
interface RadarChartProps {
  data: Record<string, number>;
  size?: number;
  color?: string;
  bgColor?: string;
}

export function RadarChart({ data, size = 280, color = "#C4A265", bgColor = "rgba(196,162,101,0.08)" }: RadarChartProps) {
  const entries = Object.entries(data);
  const n = entries.length;
  const center = size / 2;
  const maxR = size * 0.38;
  const levels = 4;

  const points = useMemo(() => {
    return entries.map(([label, value], i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const r = (value / 100) * maxR;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { label, value, x, y, angle };
    });
  }, [entries, n, center, maxR]);

  const gridRings = useMemo(() => {
    return Array.from({ length: levels }, (_, i) => {
      const r = (maxR * (i + 1)) / levels;
      return `M ${center} ${center - r} ` + Array.from({ length: n }, (_, j) => {
        const a = (2 * Math.PI * j) / n - Math.PI / 2;
        return `L ${center + r * Math.cos(a)} ${center + r * Math.sin(a)}`;
      }).join(" ") + " Z";
    });
  }, [center, maxR, levels, n]);

  const dataPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  }, [points]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-fade-in">
      {/* Grid rings */}
      {gridRings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(196,162,101,0.1)" strokeWidth="0.8" />
      ))}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const a = (2 * Math.PI * i) / n - Math.PI / 2;
        return (
          <line key={i}
            x1={center} y1={center}
            x2={center + maxR * Math.cos(a)} y2={center + maxR * Math.sin(a)}
            stroke="rgba(196,162,101,0.12)" strokeWidth="0.8"
          />
        );
      })}
      {/* Data area */}
      <path d={dataPath} fill={bgColor} stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text
            x={center + (maxR + 16) * Math.cos(p.angle)}
            y={center + (maxR + 16) * Math.sin(p.angle)}
            textAnchor="middle" dominantBaseline="central"
            fontSize="10" fill="#8A7B6A" style={{ fontFamily: "system-ui" }}
          >
            {p.label}
          </text>
          <text
            x={p.x} y={p.y - 10}
            textAnchor="middle"
            fontSize="9" fontWeight="600" fill={color}
          >
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ===== BAR CHART (Horizontal) =====
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  maxValue?: number;
}

export function BarChart({ data, width = 320, height = 160, maxValue = 100 }: BarChartProps) {
  const barH = 28;
  const gap = 16;
  const leftPad = 60;
  const rightPad = 40;
  const chartW = width - leftPad - rightPad;

  const colors = ["#C4A265", "#B8935F", "#A88458"];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="animate-fade-in">
      {data.map((item, i) => {
        const y = i * (barH + gap) + gap;
        const barW = (item.value / maxValue) * chartW;
        return (
          <g key={i}>
            {/* Label */}
            <text x={leftPad - 8} y={y + barH / 2}
              textAnchor="end" dominantBaseline="central"
              fontSize="11" fill="#6B5E54" style={{ fontFamily: "system-ui" }}>
              {item.label}
            </text>
            {/* Bar bg */}
            <rect x={leftPad} y={y} width={chartW} height={barH} rx="6"
              fill="rgba(196,162,101,0.06)" />
            {/* Bar fill */}
            <rect x={leftPad} y={y} width={barW} height={barH} rx="6"
              fill={item.color || colors[i % colors.length]} opacity="0.85" />
            {/* Value */}
            <text x={leftPad + barW + 8} y={y + barH / 2}
              dominantBaseline="central"
              fontSize="12" fontWeight="600" fill="#4A4038">
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
