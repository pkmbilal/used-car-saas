"use client";

import { useEffect, useRef, useState } from "react";

export type ActivityPoint = { day: string; listings: number; users: number };

const PAD = { left: 36, right: 12, top: 12, bottom: 28 };

const SERIES = [
  { key: "listings", label: "New listings", color: "var(--viz-1)" },
  { key: "users", label: "New users", color: "var(--viz-2)" },
] as const;

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

// Smallest 1/2/5 × 10ⁿ step that fits the max in four gridlines.
function niceScale(max: number): { top: number; step: number } {
  if (max <= 4) return { top: 4, step: 1 };
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  return { top: step * 4, step };
}

// New listings and new users per day, one shared count axis, with a crosshair
// tooltip on hover or tap. The SVG is drawn at its real pixel width so the
// axis text stays readable on phones.
export function ActivityChart({ points }: { points: ActivityPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const W = Math.max(280, width);
  const H = W < 480 ? 200 : 240;
  const BOTTOM = H - PAD.bottom;
  const n = points.length;
  const max = Math.max(0, ...points.flatMap((p) => [p.listings, p.users]));
  const { top, step } = niceScale(max);

  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i * (W - PAD.left - PAD.right)) / (n - 1));
  const y = (v: number) => BOTTOM - (v / top) * (BOTTOM - PAD.top);
  const path = (key: (typeof SERIES)[number]["key"]) =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");

  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(W / 90))));
  const hovered = hover === null ? null : points[hover];

  function onPointerMove(event: React.PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="New listings and new users per day">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--viz-axis)">
                {t}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text key={p.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--viz-axis)">
                {dayLabel.format(toDate(p.day))}
              </text>
            ) : null,
          )}

          {SERIES.map((s) => (
            <path
              key={s.key}
              d={path(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hovered && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={BOTTOM} stroke="var(--viz-axis)" strokeDasharray="3 3" />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(hovered[s.key])}
                  r="4.5"
                  fill={s.color}
                  stroke="var(--viz-surface)"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}

          <rect
            x={PAD.left}
            y={0}
            width={W - PAD.left - PAD.right}
            height={BOTTOM}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerDown={onPointerMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-md bg-zinc-900 px-3 py-2 text-xs leading-relaxed whitespace-nowrap text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="font-semibold">{fullDayLabel.format(toDate(hovered.day))}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.label}: <span className="font-semibold tabular-nums">{hovered[s.key]}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Table view of the same numbers for screen readers. */}
      <table className="sr-only">
        <caption>New listings and new users per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>New listings</th>
            <th>New users</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.day}</td>
              <td>{p.listings}</td>
              <td>{p.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
