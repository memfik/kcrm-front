import { Briefcase, CalendarClock, Coins, Download, Phone, TrendingUp } from "lucide-react"
import { Kv, Owner, Pill, Section } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import { managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig, Option } from "@/lib/list/types"
import { money } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 35 Отчёт по лидам и сделкам (r308) — воронка «лид → сделка» по менеджерам. Цифры — пример данных, как в макете.
 * TODO: отчёт из API по лидам (08) и сделкам (04) за период.
 */

export type LeadRow = { id: number; u: string; l: number; p: number; d: number; w: number; sum: number; src: string }

const SOURCES = ["Звонок", "Сайт", "Гос. закупки", "Рекомендация"]

const ALL: LeadRow[] = STAFF.slice(0, 24).map((u, i) => {
  const l = 10 + (rnd(u, 1) % 60)
  const p = Math.round(l * (0.4 + (rnd(u, 2) % 50) / 100))
  const d = Math.round(p * (0.15 + (rnd(u, 3) % 40) / 100))
  const w = Math.round(d * (0.3 + (rnd(u, 4) % 50) / 100))
  return { id: i + 1, u, l, p, d, w, sum: w * (200 + (rnd(u, 5) % 800)) * 1000, src: pick(SOURCES, u, 6) }
})
const total = (k: "l" | "p" | "d" | "w" | "sum") => ALL.reduce((a, x) => a + x[k], 0)
const conv = (x: LeadRow) => Math.round((x.w / x.l) * 100)
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const srcOpts: Option[] = SOURCES.map((v) => ({ v, label: v }))

const download = (rows: LeadRow[]) => {
  exportCsv(LEADS_REPORT, rows)
  toast(`Выгружено ${rows.length} строк в Excel (CSV)`)
}

function Funnel() {
  const steps: [string, number][] = [
    ["Лиды", total("l")],
    ["В работе", total("p")],
    ["Сделки", total("d")],
    ["Выиграно", total("w")],
  ]
  return (
    <>
      <h3 className="text-[17px] font-bold tracking-[-0.015em]">Воронка лидов</h3>
      <div className="mt-1 text-[13px] text-muted-foreground">От звонка до выигранной сделки</div>
      <div className="mt-3.5 grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
        {steps.map(([t, v], i) => (
          <div key={t} className="rounded-2xl p-4" style={{ background: `color-mix(in srgb, #085eff ${22 - i * 5}%, var(--soft))` }}>
            <div className="text-[12.5px] text-muted-foreground">{t}</div>
            <b className="text-[26px] tabular-nums">{v}</b>
            <div className="text-xs text-muted-foreground">{i ? `${Math.round((v / steps[0][1]) * 100)}% от лидов` : "100%"}</div>
          </div>
        ))}
      </div>
    </>
  )
}

export const LEADS_REPORT: ListConfig<LeadRow> = {
  key: "leads-report",
  title: "Отчёт по лидам и сделкам",
  crumb: "Отчёты · Лиды → сделки",
  icon: Phone,
  search: "Менеджер",
  foot: "лиды — пример данных",
  buttons: [
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
    // TODO: рассылка отчёта по расписанию
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => ALL,
  text: (x) => managerName(x.u),
  filters: [{ k: "src", t: "Источник", get: (x) => x.src, opts: srcOpts }],
  sort: ["l", -1],
  cols: [
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "l", t: "Лидов", num: true, value: (x) => x.l, render: (x) => x.l },
    { k: "p", t: "Взято в работу", num: true, value: (x) => x.p, render: (x) => x.p },
    { k: "d", t: "Сделок", num: true, value: (x) => x.d, render: (x) => x.d },
    { k: "w", t: "Выиграно", num: true, value: (x) => x.w, render: (x) => x.w },
    {
      k: "cv",
      t: "Конверсия",
      num: true,
      value: (x) => x.w / x.l,
      render: (x) => {
        const c = conv(x)
        return (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              c >= 10 ? "bg-[var(--trend-up)]/15 text-[var(--trend-up)]" : c >= 5 ? "bg-[var(--soft)] text-muted-foreground" : "bg-[var(--trend-down)]/15 text-[var(--trend-down)]"
            )}
          >
            {c}%
          </span>
        )
      },
    },
    { k: "sum", t: "Сумма", num: true, value: (x) => x.sum, render: (x) => money(x.sum) },
    { k: "src", t: "Главный источник", value: (x) => x.src, render: (x) => <Pill>{x.src}</Pill> },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  // прошлого периода в примере нет — сравнение условное, как в макете
  kpis: () => [
    { t: "Лидов", icon: Phone, c: total("l"), p: Math.round(total("l") * 0.9) },
    { t: "Сделок из лидов", icon: Briefcase, c: total("d"), p: Math.round(total("d") * 0.85) },
    { t: "Конверсия лид → победа", icon: TrendingUp, c: Math.round((total("w") / total("l")) * 100), p: 6, f: (v) => `${v}%` },
    { t: "Сумма побед", icon: Coins, c: total("sum"), p: total("sum") * 0.8, f: money },
  ],
  analytics: { title: "Воронка", tab: "Воронка", render: () => <Funnel /> },
  sub: () => "Сколько лидов колл-центра превратились в сделки по каждому менеджеру (r308). Сравнение с прошлым периодом.",
  noCards: true,
  record: (x) => ({
    title: managerName(x.u),
    meta: <span className="text-[13px]">Лиды → сделки</span>,
    actions: [{ icon: Download, label: "Выгрузить", run: () => download([x]) }],
    stats: [
      { t: "Лидов", v: x.l },
      { t: "Выиграно", v: x.w },
      { t: "Конверсия", v: `${conv(x)}%` },
    ],
    facts: [
      { t: "Главный источник", v: x.src },
      { t: "Взято в работу", v: x.p },
      { t: "Сделок", v: x.d },
      { t: "Сумма", v: money(x.sum) },
    ],
    tabs: [
      {
        t: "Воронка",
        body: (
          <Section title="Показатели">
            <Kv
              items={[
                { t: "Лидов", v: x.l },
                { t: "Взято в работу", v: x.p },
                { t: "Сделок", v: x.d },
                { t: "Выиграно", v: x.w },
                { t: "Конверсия", v: `${conv(x)}%` },
                { t: "Сумма", v: money(x.sum) },
                { t: "Главный источник", v: x.src },
              ]}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => managerName(x.u),
}
