import { ChartColumn, CircleDollarSign, Download, FilePlus, Pencil, Target, TrendingUp, Users } from "lucide-react"
import { MiniTable, Owner, Section } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import { DeltaPill } from "@/components/shared/ui"
import offers from "@/data/offers-demo.json"
import raw from "@/data/sales-plan-demo.json"
import { managerName, ownerColor, rnd, STAFF } from "@/lib/demo-names"
import type { Field, ListConfig, Option } from "@/lib/list/types"
import { MON, MON_SHORT, money, type Series } from "@/lib/period"

/*
 * 17 План продаж — план / факт по менеджерам и месяцам. План — копия базы kCRM (sales_plan),
 * факт — сумма КП менеджера за месяц; если КП в копии нет — оценка от плана, как в макете. TODO: API.
 */

export type PlanRow = {
  /** Менеджер × год: uid * 10000 + год. */
  id: number
  u: string
  y: number
  /** По месяцам, ₸. */
  plan: number[]
  fact: number[]
}

const ANCHOR = "2017-12"
const zeros = () => Array<number>(12).fill(0)

const PLAN: Record<string, { u: string; y: number; plan: number[] }> = {}
for (const [u, y, m, sum] of raw) (PLAN[`${u}|${y}`] ??= { u, y: +y, plan: zeros() }).plan[+m - 1] = +sum
const FACT: Record<string, number[]> = {}
for (const [, , u, , date, , , s] of offers.offers) (FACT[`${u}|${date.slice(0, 4)}`] ??= zeros())[+date.slice(5, 7) - 1] += +s

const ALL: PlanRow[] = Object.values(PLAN).map((x) => ({
  id: +x.u * 10000 + x.y,
  ...x,
  fact: FACT[`${x.u}|${x.y}`] ?? x.plan.map((v, i) => Math.round(v * (0.6 + (rnd(x.u, i) % 60) / 100))),
}))

const total = (a: number[]) => a.reduce((s, v) => s + v, 0)
const mln = (n: number) => (n ? (n / 1e6).toFixed(1).replace(".", ",") : "—")
const pct = (x: PlanRow) => Math.round((total(x.fact) / Math.max(1, total(x.plan))) * 100)
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const tenge = (n: number) => `${money(n)} ₸`
const YEARS = [...new Set(ALL.map((x) => x.y))].sort().reverse()
const FACT_BY_MONTH: Series = ALL.reduce<Series>((s, x) => {
  x.fact.forEach((v, i) => (s[`${x.y}-${String(i + 1).padStart(2, "0")}`] = (s[`${x.y}-${String(i + 1).padStart(2, "0")}`] || 0) + v))
  return s
}, {})
const managerOpts: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))

/** Сумма плана / факта по месяцам периода («2017-03»…) для строк года периода. */
const sumBy = (key: "plan" | "fact", r: string[]) => {
  const y = +r[0].slice(0, 4)
  const ms = r.map((k) => +k.slice(5) - 1)
  return ALL.filter((x) => x.y === y).reduce((a, x) => a + ms.reduce((t, i) => t + x[key][i], 0), 0)
}

const monthField = (i: number): Field<PlanRow> => ({
  k: `m${i}`,
  t: `${MON[i][0].toUpperCase()}${MON[i].slice(1)}, ₸`,
  type: "number",
  get: (x) => (x.plan[i] ? String(x.plan[i]) : ""),
  set: (x, v) => ({ ...x, plan: x.plan.map((p, k) => (k === i ? +v || 0 : p)) }),
})

export const SALES_PLAN: ListConfig<PlanRow> = {
  key: "sales-plan",
  title: "План продаж",
  crumb: "Планирование · План / факт",
  icon: Target,
  search: "Менеджер",
  buttons: [
    { icon: FilePlus, label: "Добавить в план", href: "/sales-plan/new" },
    { icon: ChartColumn, label: "Показать графики", onClick: "analytics" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x, plan: [...x.plan], fact: [...x.fact] })),
  text: (x) => managerName(x.u),
  tabs: YEARS.map((y) => ({ k: String(y), t: `${y} год`, f: (x: PlanRow) => x.y === y })),
  sort: ["tp", -1],
  cols: [
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    ...MON_SHORT.map((m, i) => ({
      k: `m${i}`,
      t: m,
      num: true,
      noSort: true,
      value: (x: PlanRow) => x.plan[i],
      render: (x: PlanRow) => (
        <div className="leading-[1.25]">
          <b>{mln(x.plan[i])}</b>
          <br />
          <span className={`text-[11.5px] ${x.plan[i] && x.fact[i] >= x.plan[i] ? "text-[#34c759]" : "text-muted-foreground"}`}>{mln(x.fact[i])}</span>
        </div>
      ),
    })),
    { k: "tp", t: "План, млн", num: true, value: (x) => total(x.plan), render: (x) => mln(total(x.plan)) },
    {
      k: "pct",
      t: "Выполнение",
      num: true,
      value: pct,
      render: (x) => {
        const p = pct(x)
        return <DeltaPill d={{ v: p, text: `${p}%`, tone: p >= 100 ? "up" : p >= 80 ? "eq" : "down" }} />
      },
    },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  anchor: ANCHOR,
  kpis: (r, rp) => {
    const done = (rr: string[]) => Math.round((sumBy("fact", rr) / Math.max(1, sumBy("plan", rr))) * 100)
    return [
      { t: "План", icon: Target, c: sumBy("plan", r), p: sumBy("plan", rp), f: tenge },
      { t: "Факт (сумма КП)", icon: CircleDollarSign, c: sumBy("fact", r), p: sumBy("fact", rp), f: tenge },
      { t: "Выполнение", icon: TrendingUp, c: done(r), p: done(rp), f: (v) => `${v}%` },
      { t: "Менеджеров в плане", icon: Users, c: ALL.filter((x) => x.y === +r[0].slice(0, 4)).length },
    ]
  },
  sub: () => "План, факт и выполнение по менеджерам. В ячейках: верхняя цифра — план, нижняя — факт, млн ₸.",
  analytics: { title: "По месяцам", tab: "Графики", render: ({ r, p }) => <MonthChart title="Факт продаж по месяцам" series={FACT_BY_MONTH} r={r} p={p} anchor={ANCHOR} f={money} /> },
  noCards: true,
  record: (x) => ({
    title: `План · ${managerName(x.u)}`,
    meta: <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{x.y} год</span>,
    actions: [{ icon: Pencil, label: "Изменить план", href: `/sales-plan/${x.id}/edit` }],
    stats: [
      { t: "План", v: tenge(total(x.plan)) },
      { t: "Факт", v: tenge(total(x.fact)) },
      { t: "Выполнение", v: `${pct(x)}%` },
    ],
    facts: [
      { t: "Менеджер", v: managerName(x.u) },
      { t: "Год", v: x.y },
    ],
    tabs: [
      {
        t: "По месяцам",
        body: (
          <Section title="План и факт">
            <MiniTable
              head={[{ t: "Месяц" }, { t: "План", right: true }, { t: "Факт", right: true }, { t: "%", right: true }]}
              rows={MON.map((m, i) => [
                <span key="m" className="first-letter:uppercase">
                  {m}
                </span>,
                tenge(x.plan[i]),
                tenge(x.fact[i]),
                x.plan[i] ? `${Math.round((x.fact[i] / x.plan[i]) * 100)}%` : "—",
              ])}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => `План · ${managerName(x.u)}, ${x.y}`,
  blank: () => ({ id: 0, u: managerOpts[0].v, y: 2017, plan: zeros(), fact: zeros() }),
  fields: [
    { k: "u", t: "Менеджер", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    ...MON.map((_, i) => monthField(i)),
  ],
}
