/* Mini chart components — pure SVG/CSS, no chart library */

import { THB } from "./mock-data";

export function Bars({
  data,
  height = 180,
  format = (v: number) => `฿${(v / 1000).toFixed(0)}k`,
}: {
  data: { label: string; value: number }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const maxIdx = data.findIndex((d) => d.value === max);
  return (
    <div className="flex items-end gap-2 pt-6">
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
          <div className="pointer-events-none absolute -top-5 z-10 hidden whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
            {THB(d.value)}
          </div>
          <span className={`text-[10px] font-medium ${i === maxIdx ? "text-brand-dark" : "text-ink-soft"}`}>{format(d.value)}</span>
          <div
            className={`w-full max-w-[42px] rounded-t-[3px] transition group-hover:opacity-80 ${
              i === maxIdx ? "bg-gradient-to-t from-brand to-[#7ec3f7]" : "bg-gradient-to-t from-[#8ed0f8] to-[#c7e6fb]"
            }`}
            style={{ height: Math.max(4, (d.value / max) * height) }}
          />
        </div>
      ))}
    </div>
  );
}

export function BarsGrouped({
  data,
  height = 180,
  format = (v: number) => `฿${(v / 1000).toFixed(0)}k`,
}: {
  data: { label: string; a: number; b: number }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]));
  return (
    <div className="flex items-end gap-3 pt-6">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div className="flex w-full items-end justify-center gap-1">
            {[d.a, d.b].map((v, j) => (
              <div key={j} className="group relative flex flex-col items-center">
                <div className="pointer-events-none absolute -top-5 z-10 hidden whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
                  {THB(v)}
                </div>
                <div
                  className={`w-full max-w-[24px] rounded-t-[3px] ${j === 0 ? "bg-gradient-to-t from-brand to-[#7ec3f7]" : "bg-gradient-to-t from-[#b0b4ba] to-[#d8dce3]"}`}
                  style={{ height: Math.max(4, (v / max) * height) }}
                />
              </div>
            ))}
          </div>
          <span className="text-[10px] font-medium text-ink-soft">{format(d.a)}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 150,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const stops = segments.map((s) => {
    const from = (acc / total) * 360;
    acc += s.value;
    const to = (acc / total) * 360;
    return `${s.color} ${from}deg ${to}deg`;
  });
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${stops.join(",")})`, transform: "rotate(-90deg)" }} />
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-lg font-bold text-ink">{centerValue}</span>
          {centerLabel && <span className="text-[10px] font-medium text-ink-soft">{centerLabel}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
            <span className="ml-auto font-semibold text-ink">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ values, height = 44 }: { values: number[]; height?: number }) {
  const w = 160;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(height - ((v - min) / range) * (height - 8) - 4).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" style={{ height }}>
      <polygon points={`0,${height} ${pts.join(" ")} ${w},${height}`} fill="#0176d3" opacity={0.08} />
      <polyline points={pts.join(" ")} fill="none" stroke="#0176d3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}