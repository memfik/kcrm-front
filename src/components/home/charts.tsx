"use client"

import { memo, useEffect, useRef, useState } from "react"
import {
  CONTRACTS,
  LAST12,
  MON,
  OFFERS,
  SUMS,
  delta,
  fmt,
  money,
  monthShort,
  yearAgo,
} from "@/lib/home-stats"
import { DeltaPill } from "./ui"

/** Ширина элемента; обновляется не чаще раза в кадр. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(Math.round(e.contentRect.width)))
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])
  return [ref, width] as const
}

const BRAND = "#085eff"
const GREEN = "#34c759"
const dim = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`

/** КП по месяцам: 12 столбцов, выбранный период ярче, пунктир — год назад. */
export const OffersChart = memo(function OffersChart({ selected }: { selected: string[] }) {
  const [ref, W] = useWidth<HTMLDivElement>(800)
  const [tip, setTip] = useState<{ j: number; x: number; y: number } | null>(null)
  const H = 290, pl = 44, pr = 10, pt = 10, pb = 30
  const cur = LAST12.map((k) => OFFERS[k] || 0)
  const prev = LAST12.map((k) => OFFERS[yearAgo(k)] || 0)
  const mx = Math.ceil(Math.max(...cur, ...prev) / 100) * 100 || 100
  const x = (j: number) => pl + ((j + 0.5) * (W - pl - pr)) / 12
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / mx)
  const bw = ((W - pl - pr) / 12) * 0.56
  const sel = new Set(selected)

  return (
    <div ref={ref} className="relative mt-4">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible text-[11.5px] [&_text]:fill-[var(--faint)]">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (mx * i) / 4
          return (
            <g key={i}>
              <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--grid)" />
              <text x={pl - 8} y={y(v) + 4} textAnchor="end">
                {fmt(v)}
              </text>
            </g>
          )
        })}
        {LAST12.map((k, j) => {
          const on = sel.has(k)
          return (
            <g key={k}>
              <rect
                x={x(j) - bw / 2}
                y={y(cur[j])}
                width={bw}
                height={H - pb - y(cur[j])}
                rx={7}
                fill={on ? BRAND : dim(BRAND, 28)}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseMove={(e) => setTip({ j, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTip(null)}
              />
              <text x={x(j)} y={H - 10} textAnchor="middle" className={on ? "fill-foreground! font-semibold" : undefined}>
                {monthShort(k)}
              </text>
            </g>
          )
        })}
        <YearAgoLine values={prev} x={x} y={y} r={3} />
      </svg>
      {tip && <OffersTip j={tip.j} x={tip.x} y={tip.y} cur={cur[tip.j]} prev={prev[tip.j]} />}
    </div>
  )
})

function OffersTip({ j, x, y, cur, prev }: { j: number; x: number; y: number; cur: number; prev: number }) {
  const k = LAST12[j]
  const row = "flex justify-between gap-3.5 text-muted-foreground [&>span:last-child]:font-semibold [&>span:last-child]:text-foreground"
  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[170px] rounded-[14px] border border-border bg-card px-3 py-2.5 text-[12.5px] shadow-[0_16px_40px_-14px_rgba(0,0,30,0.4)]"
      style={{ left: Math.min(window.innerWidth - 200, x + 14), top: y - 20 }}
    >
      <b className="mb-1.5 block text-[13px]">
        {MON[+k.slice(5) - 1]} {k.slice(0, 4)}
      </b>
      <div className={row}>
        <span>КП</span>
        <span>{fmt(cur)}</span>
      </div>
      <div className={row}>
        <span>Сумма</span>
        <span>{money(SUMS[k] || 0)} ₸</span>
      </div>
      <div className={row}>
        <span>Год назад</span>
        <span>{fmt(prev)}</span>
      </div>
      <div className={row}>
        <span>Изменение</span>
        <DeltaPill d={delta(cur, prev)} className="h-[18px]" />
      </div>
    </div>
  )
}

/** Договоры по месяцам: столбцы с подписями, пунктир — год назад. */
export const ContractsChart = memo(function ContractsChart({ selected }: { selected: string[] }) {
  const [ref, W] = useWidth<HTMLDivElement>(500)
  const H = 170, pb = 24, pt = 22
  const v = LAST12.map((k) => CONTRACTS[k] || 0)
  const py = LAST12.map((k) => CONTRACTS[yearAgo(k)] || 0)
  const mx = Math.max(...v, ...py) || 1
  const bw = (W / 12) * 0.5
  const y = (val: number) => H - pb - ((H - pb - pt) * val) / mx
  const x = (j: number) => ((j + 0.5) * W) / 12
  const sel = new Set(selected)

  return (
    <div ref={ref} className="mt-3.5 min-h-[170px] flex-1">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="block text-[11px] [&_text]:fill-[var(--faint)]">
        {[1, 2, 3].map((i) => (
          <line key={i} x1={0} x2={W} y1={y((mx * i) / 3)} y2={y((mx * i) / 3)} stroke="var(--grid)" />
        ))}
        {LAST12.map((k, j) => {
          const on = sel.has(k)
          return (
            <g key={k}>
              <rect x={x(j) - bw / 2} y={y(v[j])} width={bw} height={H - pb - y(v[j])} rx={6} fill={on ? GREEN : dim(GREEN, 26)}>
                <title>
                  {MON[+k.slice(5) - 1]}: {v[j]} · год назад {py[j]}
                </title>
              </rect>
              <text x={x(j)} y={H - 7} textAnchor="middle" className={on ? "fill-foreground! font-semibold" : undefined}>
                {monthShort(k)}
              </text>
              {v[j] > 0 && (
                <text x={x(j)} y={y(v[j]) - 6} textAnchor="middle" className="fill-muted-foreground! font-semibold">
                  {v[j]}
                </text>
              )}
            </g>
          )
        })}
        <YearAgoLine values={py} x={x} y={y} r={2.6} />
      </svg>
    </div>
  )
})

function YearAgoLine({ values, x, y, r }: { values: number[]; x: (j: number) => number; y: (v: number) => number; r: number }) {
  return (
    <g className="pointer-events-none">
      <polyline points={values.map((v, j) => `${x(j)},${y(v)}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={2} strokeDasharray="5 5" />
      {values.map((v, j) => (
        <circle key={j} cx={x(j)} cy={y(v)} r={r} fill="var(--card)" stroke="var(--faint)" strokeWidth={2} />
      ))}
    </g>
  )
}
