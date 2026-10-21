"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChartColumn, Download, FileText, Signature, Users } from "lucide-react"
import { Kpi } from "@/components/shared/kpi"
import { Btn } from "@/components/list/ui"
import { GlassSegmented, GlassSegmentedItem } from "@/components/ui/opaline/glass-segmented"
import raw from "@/data/home-demo.json"
import { managerName, rnd } from "@/lib/demo-names"
import { exportCsv } from "@/lib/list/query"
import { delta, fmt, MON_SHORT } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 31 Свод по продажам — подразделение / менеджер / услуга × месяцы: сумма КП, кол-во КП, договоры; сравнение с прошлым годом.
 * Кол-во КП по менеджерам и месяцам — копия базы; сумма и договоры месяца распределены по менеджерам пропорционально КП;
 * подразделение и услуга — по менеджеру (заглушка), как в макете. TODO: агрегаты из API.
 */

type By = "dep" | "mgr" | "srv"
type Metric = "s" | "n" | "c"
type Cell = { u: string; m: string; n: number; s: number; c: number; dep: string; srv: string }

const BRANCHES = ["ГО-ДКП", "АФ", "АС", "ЮФ", "ВФ", "ЗФ", "КФ", "МФ", "УФ", "ШФ"]
const SERVICES = ["Интернет", "IP-телефония", "Аренда каналов", "VPN", "SIP-транки", "Хостинг", "Видеонаблюдение"]

const total: Record<string, number> = {}
const count: Record<string, number> = {}
for (const [m, n, s] of raw.offers) {
  total[m] = +s
  count[m] = +n
}
// в копии базы есть ошибочные суммы (млрд в одном КП) — заменяем выброс средним чеком нормальных месяцев
{
  const ok = Object.keys(total).filter((k) => total[k] < 2e8)
  const avg = ok.reduce((a, k) => a + total[k] / count[k], 0) / ok.length
  for (const k of Object.keys(total)) if (total[k] > 2e8) total[k] = avg * count[k]
}
const contracts: Record<string, number> = Object.fromEntries(raw.contracts.map(([m, n]) => [m, +n]))
const CELLS: Cell[] = raw.mgr.map(([u, m, n]) => {
  const share = count[m] ? +n / count[m] : 0
  return { u, m, n: +n, s: (total[m] || 0) * share, c: (contracts[m] || 0) * share, dep: BRANCHES[rnd(u, 2) % BRANCHES.length], srv: SERVICES[rnd(u, 3) % SERVICES.length] }
})

const BY: Record<By, string> = { dep: "По подразделениям", mgr: "По менеджерам", srv: "По услугам" }
const BY_HEAD: Record<By, string> = { dep: "Подразделение", mgr: "Менеджер", srv: "Услуга" }
const METRIC: Record<Metric, string> = { s: "Сумма КП", n: "Кол-во КП", c: "Договоры" }
const money = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} млн` : fmt(n))
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0)

/** Год × строка (подразделение / менеджер / услуга) → 12 значений по месяцам. */
function pivot(year: string, by: By, metric: Metric) {
  const o: Record<string, number[]> = {}
  for (const r of CELLS) {
    if (!r.m.startsWith(year)) continue
    const k = by === "mgr" ? r.u : r[by]
    ;(o[k] ??= Array(12).fill(0))[+r.m.slice(5) - 1] += r[metric]
  }
  return o
}

function Pct({ c, p }: { c: number; p: number }) {
  if (!p) return null
  const d = ((c - p) / p) * 100
  return <span className={cn("ml-1 text-[11px] font-bold", d >= 0 ? "text-[var(--trend-up)]" : "text-[var(--trend-down)]")}>{`${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(0)}%`}</span>
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-0.5 rounded-full bg-[var(--soft)] p-[3px]">
      {(Object.keys(options) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={cn("h-8 cursor-pointer rounded-full px-3.5 text-[13px] whitespace-nowrap text-muted-foreground", value === k && "bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]")}
        >
          {options[k]}
        </button>
      ))}
    </div>
  )
}

export function SalesSummary() {
  const [year, setYear] = useState("2017")
  const [by, setBy] = useState<By>("dep")
  const [metric, setMetric] = useState<Metric>("s")
  const prevYear = String(+year - 1)
  const f = (x: number) => (metric === "s" ? money(x) : fmt(x))

  const view = useMemo(() => {
    const cur = pivot(year, by, metric)
    const prev = pivot(prevYear, by, metric)
    const keys = Object.keys(cur)
      .sort((a, b) => sum(cur[b]) - sum(cur[a]))
      .slice(0, by === "mgr" ? 25 : 20)
    const mx = Math.max(1, ...keys.flatMap((k) => cur[k]))
    // сравнение — только за месяцы, по которым есть прошлый год
    const has = Array.from({ length: 12 }, (_, i) => CELLS.some((r) => r.m === `${prevYear}-${String(i + 1).padStart(2, "0")}`))
    const sumHas = (a: number[]) => a.reduce((s, x, i) => s + (has[i] ? x : 0), 0)
    const T = Array.from({ length: 12 }, (_, i) => keys.reduce((s, k) => s + cur[k][i], 0))
    const TP = Array.from({ length: 12 }, (_, i) => Object.values(prev).reduce((s, a) => s + a[i], 0))
    return { cur, prev, keys, mx, has, sumHas, T, TP }
  }, [year, prevYear, by, metric])

  const ofYear = (y: string) => CELLS.filter((r) => r.m.startsWith(y) && (y !== year || view.has[+r.m.slice(5) - 1] || !sum(view.TP)))
  const kpi = (key: "s" | "n" | "c") => [sum(ofYear(year).map((r) => r[key])), sum(ofYear(prevYear).map((r) => r[key]))] as const
  const managers = [new Set(ofYear(year).map((r) => r.u)).size, new Set(ofYear(prevYear).map((r) => r.u)).size]
  const cs = view.sumHas(view.T)
  const ps = sum(view.TP)
  const name = (k: string) => (by === "mgr" ? managerName(k) : k)

  const download = () =>
    exportCsv(
      {
        title: `Свод_по_продажам_${year}`,
        cols: [
          { t: BY_HEAD[by], value: (k: string) => name(k) },
          ...MON_SHORT.map((m, i) => ({ t: m, value: (k: string) => Math.round(view.cur[k][i]) })),
          { t: `Итого ${year}`, value: (k: string) => Math.round(sum(view.cur[k])) },
          { t: prevYear, value: (k: string) => Math.round(sum(view.prev[k] ?? [])) },
        ],
      },
      view.keys
    )

  return (
    <div className="mx-auto w-full max-w-[1760px] pb-10">
      <section className="flex flex-wrap items-center justify-between gap-5 px-[34px] pt-1.5 pb-4 max-sm:px-4">
        <div className="rise min-w-0">
          <p className="flex items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
            <ChartColumn className="size-4" />
            <Link href="/reports">Отчёты</Link> · Свод по продажам
          </p>
          <h1 className="mt-1.5 text-[34px] leading-[1.1] font-medium tracking-[-0.025em] max-sm:text-[26px]">Свод по продажам</h1>
          <p className="mt-1.5 max-w-[760px] text-sm text-muted-foreground">
            {year} год: {{ s: "сумма КП", n: "КП", c: "договоров" }[metric]} {f(cs)}
            {metric === "s" ? " ₸" : ""} (за сопоставимые месяцы) — {ps ? `${(cs - ps) / ps >= 0 ? "+" : "−"}${Math.abs(((cs - ps) / ps) * 100).toFixed(0)}%` : "нет данных"} к {prevYear} году.
          </p>
        </div>
        <GlassSegmented aria-label="Год" value={year} onValueChange={setYear} className="rise text-foreground [animation-delay:80ms]">
          {["2017", "2016"].map((y) => (
            <GlassSegmentedItem key={y} value={y} label={y} className="h-[38px] px-5 text-sm text-muted-foreground opacity-100 data-[state=active]:text-foreground" />
          ))}
        </GlassSegmented>
      </section>

      <div className="grid grid-cols-4 gap-[18px] px-[34px] max-[1240px]:grid-cols-2 max-sm:gap-2.5 max-sm:px-3">
        {(
          [
            ["Сумма КП", FileText, ...kpi("s"), money],
            ["КП", FileText, ...kpi("n"), fmt],
            ["Договоры", Signature, ...kpi("c"), fmt],
            ["Менеджеров", Users, managers[0], managers[1], fmt],
          ] as const
        ).map(([t, icon, c, p, ff], i) => (
          <Kpi key={t} i={i} compact title={t} icon={icon} value={ff(c)} d={p ? delta(c, p) : undefined} caption={p ? `к ${prevYear} · было ${ff(p)}` : "нет данных за прошлый год"} />
        ))}
      </div>

      <div className="px-[34px] pt-[18px] max-sm:px-3">
        <section className="rounded-3xl border border-border bg-card px-6 py-5 shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-3">
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <Seg value={by} options={BY} onChange={setBy} />
            <Seg value={metric} options={METRIC} onChange={setMetric} />
            <span className="flex-1" />
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              меньше
              <i className="h-2.5 w-20 rounded-full bg-[linear-gradient(90deg,rgba(8,94,255,0.05),rgba(8,94,255,0.55))]" />
              больше
            </span>
            <Btn onClick={download}>
              <Download />
              Выгрузить
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground [&>th]:px-2.5 [&>th]:pb-2 [&>th]:font-medium [&>th]:whitespace-nowrap">
                  <th className="sticky left-0 bg-card">{BY_HEAD[by]}</th>
                  {MON_SHORT.map((m) => (
                    <th key={m} className="text-right">
                      {m}
                    </th>
                  ))}
                  <th className="text-right">Итого {year}</th>
                  <th className="text-right">{prevYear}</th>
                </tr>
              </thead>
              <tbody className="[&_td]:border-t [&_td]:border-border [&_td]:px-2.5 [&_td]:py-2.5 [&_td]:whitespace-nowrap">
                {view.keys.map((k) => {
                  const p = view.prev[k] ?? Array(12).fill(0)
                  return (
                    <tr key={k}>
                      <td className="sticky left-0 bg-card font-medium">{name(k)}</td>
                      {view.cur[k].map((x, i) => (
                        <td key={i} className="relative text-right tabular-nums">
                          <i aria-hidden className="absolute inset-0.5 rounded-md" style={{ background: `rgba(8,94,255,${((x / view.mx) * 0.55).toFixed(3)})` }} />
                          <span className="relative">{x ? f(x) : <span className="text-[var(--faint)]">—</span>}</span>
                        </td>
                      ))}
                      <td className="text-right tabular-nums">
                        <b>{f(sum(view.cur[k]))}</b>
                        <Pct c={view.sumHas(view.cur[k])} p={sum(p)} />
                      </td>
                      <td className="text-right text-muted-foreground tabular-nums">{sum(p) ? f(sum(p)) : "—"}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold">
                  <td className="sticky left-0 bg-card">Итого</td>
                  {view.T.map((x, i) => (
                    <td key={i} className="text-right tabular-nums">
                      {f(x)}
                      <Pct c={x} p={view.TP[i]} />
                    </td>
                  ))}
                  <td className="text-right tabular-nums">
                    {f(sum(view.T))}
                    <Pct c={cs} p={ps} />
                  </td>
                  <td className="text-right tabular-nums">{f(ps)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap justify-between gap-3 px-[34px] pt-5 text-[12.5px] text-[var(--faint)] max-sm:px-4">
        <span>© АО «QMobile» · kCRM · суммы КП и договоры — из копии базы; разбивка по подразделениям и услугам — по менеджеру/позиции</span>
        <span className="flex items-center gap-2">
          <i className="size-2 rounded-full bg-[#34c759]" />
          Служба работает
        </span>
      </footer>
    </div>
  )
}
