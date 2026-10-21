"use client"

import { DeltaPill } from "@/components/shared/ui"
import { useWidth } from "@/hooks/use-width"
import { delta, fmt, last12, MON, monthShort, periodLabel, sumOf, yearAgo, type Period, type Series } from "@/lib/period"

const BRAND = "#085eff"

/** «По месяцам» для аналитики раздела: 12 столбцов до опорного месяца, выбранный период ярче, пунктир — год назад. */
export function MonthChart({
  title,
  series,
  r,
  p,
  anchor,
  f = fmt,
}: {
  title: string
  series: Series
  r: string[]
  p: Period
  anchor?: string
  f?: (n: number) => string
}) {
  const [ref, W] = useWidth<HTMLDivElement>(900)
  const ks = last12(anchor)
  const cur = ks.map((k) => series[k] || 0)
  const prev = ks.map((k) => series[yearAgo(k)] || 0)
  const H = 220, pl = 46, pb = 26, pt = 10
  const mx = Math.max(...cur, ...prev, 1) * 1.1
  const x = (j: number) => pl + ((j + 0.5) * (W - pl)) / 12
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / mx)
  const bw = ((W - pl) / 12) * 0.55
  const sel = new Set(r)
  const c = sumOf(series, r)
  const was = sumOf(series, r.map(yearAgo))

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.015em]">{title}</h3>
          <div className="mt-1 text-[13px] text-muted-foreground">
            За {periodLabel(p, r)}: <b className="text-foreground">{f(c)}</b> · <DeltaPill d={delta(c, was)} /> к тому же периоду год назад
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-3 rounded-[4px] bg-[#085eff]" />
            Выбранный период
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="w-4 border-t-2 border-dashed border-[var(--faint)]" />
            Год назад
          </span>
        </div>
      </div>
      <div ref={ref} className="mt-3">
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible text-[11.5px] [&_text]:fill-[var(--faint)]">
          {[0, 1, 2, 3].map((i) => {
            const v = (mx * i) / 3
            return (
              <g key={i}>
                <line x1={pl} x2={W} y1={y(v)} y2={y(v)} stroke="var(--grid)" />
                <text x={pl - 8} y={y(v) + 4} textAnchor="end">
                  {f(v)}
                </text>
              </g>
            )
          })}
          {ks.map((k, j) => {
            const on = sel.has(k)
            return (
              <g key={k}>
                <rect x={x(j) - bw / 2} y={y(cur[j])} width={bw} height={H - pb - y(cur[j])} rx={6} fill={on ? BRAND : `color-mix(in srgb, ${BRAND} 28%, transparent)`}>
                  <title>{`${MON[+k.slice(5) - 1]} ${k.slice(0, 4)}: ${f(cur[j])} · год назад ${f(prev[j])}`}</title>
                </rect>
                <text x={x(j)} y={H - 8} textAnchor="middle" className={on ? "fill-foreground! font-semibold" : undefined}>
                  {monthShort(k)}
                </text>
              </g>
            )
          })}
          <polyline
            points={prev.map((v, j) => `${x(j)},${y(v)}`).join(" ")}
            fill="none"
            stroke="var(--faint)"
            strokeWidth={2}
            strokeDasharray="5 5"
            className="pointer-events-none"
          />
        </svg>
      </div>
    </>
  )
}
