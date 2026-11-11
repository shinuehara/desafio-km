"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Gráfico em degraus: km acumulados ao longo do desafio.
 * Cada dia com atividade sobe um degrau; a linha tracejada é a meta.
 */

export type DayPoint = {
  /** AAAA-MM-DD */
  date: string;
  /** metros registrados naquele dia (só atividades válidas) */
  dayM: number;
  /** total acumulado até aquele dia, em metros */
  totalM: number;
};

type Props = {
  points: DayPoint[];
  startDate: string;
  endDate: string;
  today: string;
  goalKm: number;
};

const HEIGHT = 220;
const PAD = { top: 18, right: 14, bottom: 30, left: 38 };
const INK = { line: "#c2410c", grid: "#eeece6", axis: "#d6d3cb", text: "#5b5e66", goal: "#166534", surface: "#ffffff" };

const dayNum = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const km = (m: number) => (m / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

export function ProgressChart({ points, startDate, endDate, today, goalKm }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lastDay = today < endDate ? (today < startDate ? startDate : today) : endDate;
  const geo = useMemo(() => {
    const x0 = dayNum(startDate);
    const x1 = Math.max(dayNum(endDate), x0 + 1);
    const total = points.at(-1)?.totalM ?? 0;
    const yMaxKm = Math.max(goalKm, total / 1000) * 1.08;
    const step = niceStep(yMaxKm);
    const ticks: number[] = [];
    for (let v = 0; v <= yMaxKm + 1e-9; v += step) ticks.push(v);
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const sx = (iso: string) => PAD.left + ((dayNum(iso) - x0) / (x1 - x0)) * innerW;
    const sy = (meters: number) => PAD.top + innerH - (meters / 1000 / yMaxKm) * innerH;

    // Caminho em degraus: horizontal até o dia, depois sobe.
    let d = `M${sx(startDate)},${sy(0)}`;
    for (const p of points) {
      d += ` H${sx(p.date)} V${sy(p.totalM)}`;
    }
    d += ` H${sx(lastDay)}`;
    return { sx, sy, ticks, d, innerW, innerH, total };
  }, [points, startDate, endDate, lastDay, goalKm, width]);

  if (points.length === 0) {
    return <p className="small muted">O gráfico aparece depois do seu primeiro registro.</p>;
  }

  const { sx, sy, ticks, d, total } = geo;
  const goalY = sy(goalKm * 1000);
  const last = points[points.length - 1];
  const h = hover !== null ? points[hover] : null;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(sx(p.date) - x);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setHover(best);
  }

  // Rótulos do eixo x: início, fim e "hoje" (se couber sem encostar nos outros).
  const xLabels = [
    { iso: startDate, text: ddmm(startDate), anchor: "start" as const },
    { iso: endDate, text: ddmm(endDate), anchor: "end" as const },
  ];
  const todayX = sx(lastDay);
  const showToday = lastDay !== endDate && todayX - sx(startDate) > 48 && sx(endDate) - todayX > 48;

  const tipLeft = h ? Math.min(Math.max(sx(h.date) - 70, 0), width - 140) : 0;
  const tipTop = h ? Math.max(sy(h.totalM) - 66, 0) : 0;

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div ref={box} style={{ position: "relative", width: "100%" }}>
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Gráfico em degraus: ${km(total)} km acumulados em ${points.length} dias com atividade. Meta: ${goalKm} km.`}
          style={{ display: "block", touchAction: "pan-y" }}
        >
          {/* grade e eixo y */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={sy(t * 1000)} y2={sy(t * 1000)} stroke={t === 0 ? INK.axis : INK.grid} strokeWidth={1} />
              <text x={PAD.left - 6} y={sy(t * 1000)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK.text}>
                {t.toLocaleString("pt-BR")}
              </text>
            </g>
          ))}

          {/* meta */}
          <line x1={PAD.left} x2={width - PAD.right} y1={goalY} y2={goalY} stroke={INK.goal} strokeWidth={1.5} strokeDasharray="5 4" />
          <text x={width - PAD.right} y={goalY - 6} textAnchor="end" fontSize={12} fontWeight={600} fill={INK.goal}>
            Meta {goalKm} km
          </text>

          {/* hoje */}
          {lastDay !== endDate && (
            <line x1={todayX} x2={todayX} y1={PAD.top} y2={sy(0)} stroke={INK.axis} strokeWidth={1} strokeDasharray="2 3" />
          )}

          {/* degraus */}
          <path d={d} fill="none" stroke={INK.line} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* ponto e rótulo do total atual */}
          <circle cx={sx(last.date)} cy={sy(last.totalM)} r={5} fill={INK.line} stroke={INK.surface} strokeWidth={2} />

          {/* eixo x */}
          {xLabels.map((l) => (
            <text key={l.iso} x={sx(l.iso)} y={HEIGHT - 8} textAnchor={l.anchor} fontSize={11} fill={INK.text}>{l.text}</text>
          ))}
          {showToday && (
            <text x={todayX} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK.text}>hoje</text>
          )}

          {/* realce do dia sob o dedo/mouse */}
          {h && (
            <g pointerEvents="none">
              <line x1={sx(h.date)} x2={sx(h.date)} y1={PAD.top} y2={sy(0)} stroke={INK.text} strokeWidth={1} />
              <circle cx={sx(h.date)} cy={sy(h.totalM)} r={6} fill={INK.line} stroke={INK.surface} strokeWidth={2} />
            </g>
          )}

          {/* área de toque (maior que as marcas) */}
          <rect
            x={PAD.left - 10}
            y={0}
            width={width - PAD.left - PAD.right + 20}
            height={HEIGHT}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {h && (
          <div
            role="status"
            style={{
              position: "absolute", left: tipLeft, top: tipTop, width: 140, pointerEvents: "none",
              background: "#17181c", color: "#fff", borderRadius: 10, padding: "8px 10px", fontSize: 13, lineHeight: 1.35,
              boxShadow: "0 4px 14px rgba(23,24,28,0.2)",
            }}
          >
            <div style={{ fontWeight: 700 }}>{ddmm(h.date)}: +{km(h.dayM)} km</div>
            <div style={{ color: "#e7e5e0" }}>Total: {km(h.totalM)} km</div>
          </div>
        )}
      </div>

      <details>
        <summary className="small" style={{ cursor: "pointer", color: "var(--accent)", fontWeight: 600, minHeight: 32 }}>Ver em tabela</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 13 }}>
              <th style={{ padding: "6px 0" }}>Dia</th><th style={{ textAlign: "right" }}>No dia</th><th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "6px 0" }}>{ddmm(p.date)}</td>
                <td style={{ textAlign: "right" }}>+{km(p.dayM)} km</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{km(p.totalM)} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
