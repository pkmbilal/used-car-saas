"use client";

import { useEffect, useRef, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { formatNumber } from "@/lib/dictionary";

export type TrendPoint = { day: string; views: number; contacts: number };

const AXIS = 36; // room for the count labels
const EDGE = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

// Gregorian calendar with Western digits in Arabic, as in lib/format.ts.
const INTL_LOCALE = { ar: "ar-SA-u-ca-gregory-nu-latn", en: "en-GB" } as const;

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

// Smallest 1/2/5 × 10ⁿ step that fits the max in four gridlines.
function niceScale(max: number): { top: number; step: number } {
  if (max <= 4) return { top: 4, step: 1 };
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  return { top: step * 4, step };
}

// Views and contacts per day on one count axis, with a crosshair tooltip on
// hover or tap. Time runs right to left in Arabic. Adapted from the admin
// activity chart; the SVG is drawn at its real pixel width so the axis text
// stays readable on phones.
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const { t, locale } = useDictionary();
  const c = t.insights.chart;
  const rtl = locale === "ar";
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

  const series = [
    { key: "views", label: c.views, color: "var(--viz-1)" },
    { key: "contacts", label: c.contacts, color: "var(--viz-3)" },
  ] as const;
  const dayLabel = new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "short", timeZone: "UTC" });
  const fullDayLabel = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const W = Math.max(280, width);
  const H = W < 480 ? 200 : 240;
  const BOTTOM = H - PAD_BOTTOM;
  const plotStart = rtl ? EDGE : AXIS;
  const plotEnd = rtl ? W - AXIS : W - EDGE;
  const n = points.length;
  const max = Math.max(0, ...points.flatMap((p) => [p.views, p.contacts]));
  const { top, step } = niceScale(max);

  const frac = (i: number) => (n <= 1 ? 0 : i / (n - 1));
  const x = (i: number) =>
    rtl ? plotEnd - frac(i) * (plotEnd - plotStart) : plotStart + frac(i) * (plotEnd - plotStart);
  const y = (v: number) => BOTTOM - (v / top) * (BOTTOM - PAD_TOP);
  const path = (key: (typeof series)[number]["key"]) =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");

  // Soft fill under the views line, closed along the baseline.
  const viewsArea =
    n > 1 ? `${path("views")}L${x(n - 1).toFixed(1)},${BOTTOM}L${x(0).toFixed(1)},${BOTTOM}Z` : "";

  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(W / 90))));
  const hovered = hover === null ? null : points[hover];

  function onPointerMove(event: React.PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const f = (px - plotStart) / (plotEnd - plotStart);
    const i = Math.round((rtl ? 1 - f : f) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className="h-1 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={c.caption}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={plotStart} x2={plotEnd} y1={y(tick)} y2={y(tick)} stroke="var(--viz-grid)" />
              <text
                x={rtl ? plotEnd + 8 : plotStart - 8}
                y={y(tick) + 4}
                textAnchor={rtl ? "start" : "end"}
                fontSize="11"
                fill="var(--viz-axis)"
              >
                {formatNumber(locale, tick)}
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

          <defs>
            <linearGradient id="trend-views-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-1)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--viz-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {viewsArea && <path d={viewsArea} fill="url(#trend-views-fill)" />}

          {series.map((s) => (
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

          {/* Today's values, marked at the end of each line. */}
          {n > 0 && hover === null &&
            series.map((s) => (
              <circle
                key={s.key}
                cx={x(n - 1)}
                cy={y(points[n - 1][s.key])}
                r="4"
                fill={s.color}
                stroke="var(--viz-surface)"
                strokeWidth="2"
              />
            ))}

          {hovered && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD_TOP} y2={BOTTOM} stroke="var(--viz-axis)" strokeDasharray="3 3" />
              {series.map((s) => (
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
            x={plotStart}
            y={0}
            width={plotEnd - plotStart}
            height={BOTTOM}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerDown={onPointerMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-xl bg-zinc-900/95 px-3 py-2 text-xs leading-relaxed whitespace-nowrap text-white shadow-xl ring-1 ring-white/10 backdrop-blur dark:bg-zinc-100/95 dark:text-zinc-900 dark:ring-black/10"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: x(hover) > W / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="font-semibold">{fullDayLabel.format(toDate(hovered.day))}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                {s.label}: <span className="font-semibold tabular-nums">{formatNumber(locale, hovered[s.key])}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Table view of the same numbers for screen readers. */}
      <table className="sr-only">
        <caption>{c.caption}</caption>
        <thead>
          <tr>
            <th>{c.day}</th>
            <th>{c.views}</th>
            <th>{c.contacts}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{fullDayLabel.format(toDate(p.day))}</td>
              <td>{p.views}</td>
              <td>{p.contacts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
