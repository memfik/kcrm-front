import { Briefcase, CalendarClock, Clock, Download, Signature, TrendingUp } from "lucide-react"
import { Kv, Section, Stage } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import { toast } from "@/components/shared/toast"
import raw from "@/data/deals-demo.json"
import { rnd } from "@/lib/demo-names"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig } from "@/lib/list/types"
import { money, type Series } from "@/lib/period"

/*
 * 33 Отчёт по этапам продаж (r300). Сколько сделок сейчас на этапе — по копии базы;
 * время на этапе и сумма — заглушки по номеру этапа, как в макете. TODO: отчёт из API, история переходов между этапами.
 */

export type StageRow = { id: number; code: string; name: string; color: string; n: number; reach: number; days: number; sum: number }

const ANCHOR = "2017-08"
/** Этап «Договор» и дальше — сделка дошла до договора. */
const CONTRACT_STAGE = 7

const by: Record<string, number> = {}
for (const d of raw.deals) {
  const k = d[12] === "NULL" ? "0" : d[12]
  by[k] = (by[k] || 0) + 1
}
const stages = raw.stages.filter(([id]) => +id > 0)
const ALL: StageRow[] = stages.map(([id, code, name, , color], i) => {
  const n = by[id] || 0
  return {
    id: +id,
    code,
    name,
    color,
    n,
    // дошли до этапа — сейчас на нём или дальше
    reach: stages.slice(i).reduce((a, [z]) => a + (by[z] || 0), 0),
    days: 4 + (rnd(+id, 1) % 18),
    sum: n * (300 + (rnd(+id, 2) % 600)) * 1000,
  }
})
const TOTAL = ALL.reduce((a, x) => a + x.n, 0)
const START = Math.max(1, ALL[0]?.reach ?? 0)
const conv = (x: StageRow) => Math.round((x.reach / START) * 100)
const signed = ALL.filter((x) => x.id >= CONTRACT_STAGE).reduce((a, x) => a + x.n, 0)
const cycle = ALL.reduce((a, x) => a + x.days, 0)
const BY_MONTH: Series = raw.deals.reduce<Series>((o, d) => ((o[d[2].slice(0, 7)] = (o[d[2].slice(0, 7)] || 0) + 1), o), {})

const download = (rows: StageRow[]) => {
  exportCsv(STAGE_REPORT, rows)
  toast(`Выгружено ${rows.length} этапов в Excel (CSV)`)
}

function Funnel() {
  return (
    <>
      <h3 className="text-[17px] font-bold tracking-[-0.015em]">Воронка: сколько сделок дошло до каждого этапа</h3>
      <div className="mt-1 text-[13px] text-muted-foreground">От первичных переговоров до завершения · {TOTAL} сделок</div>
      <div className="mt-3.5 flex flex-col gap-1.5">
        {ALL.map((x) => (
          <div key={x.id} className="flex items-center gap-3 text-[13px]">
            <span className="w-[200px] flex-none truncate text-muted-foreground max-sm:w-[110px]">
              {x.code} · {x.name}
            </span>
            <div className="h-[26px] flex-1 overflow-hidden rounded-lg bg-[var(--soft)]">
              <i className="block h-full rounded-lg" style={{ width: `${Math.max(3, (x.reach / START) * 100)}%`, background: x.color }} />
            </div>
            <b className="w-[70px] flex-none text-right tabular-nums">
              {x.reach} · {conv(x)}%
            </b>
          </div>
        ))}
      </div>
    </>
  )
}

export const STAGE_REPORT: ListConfig<StageRow> = {
  key: "stage-report",
  title: "Отчёт по этапам продаж",
  crumb: "Отчёты · Воронка сделок",
  icon: TrendingUp,
  search: "Этап",
  anchor: ANCHOR,
  buttons: [
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
    // TODO: рассылка отчёта по расписанию
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => ALL,
  text: (x) => `${x.code} ${x.name}`,
  sort: ["id", 1],
  cols: [
    { k: "id", t: "Этап", value: (x) => x.id, render: (x) => <Stage code={x.code} text={x.name} color={x.color} /> },
    { k: "n", t: "Сейчас на этапе", num: true, value: (x) => x.n, render: (x) => x.n },
    { k: "reach", t: "Дошли до этапа", num: true, value: (x) => x.reach, render: (x) => x.reach },
    { k: "conv", t: "Конверсия от старта", num: true, value: (x) => x.reach, render: (x) => `${conv(x)}%` },
    { k: "days", t: "Ср. время на этапе", num: true, value: (x) => x.days, render: (x) => `${x.days} дн` },
    { k: "sum", t: "Сумма сделок", num: true, value: (x) => x.sum, render: (x) => money(x.sum) },
  ],
  // сделок в копии базы мало и прошлого периода нет — сравнение условное, как в макете
  kpis: () => [
    { t: "Сделок в воронке", icon: Briefcase, c: TOTAL },
    { t: "Дошли до договора", icon: Signature, c: signed, p: 3 },
    { t: "Конверсия", icon: TrendingUp, c: Math.round((signed / Math.max(1, TOTAL)) * 100), p: 15, f: (v) => `${v}%` },
    { t: "Средний цикл сделки", icon: Clock, c: cycle, p: cycle + 9, f: (v) => `${v} дн` },
  ],
  analytics: {
    title: "Воронка",
    tab: "Воронка",
    render: ({ r, p }) => (
      <>
        <Funnel />
        <div className="mt-6 border-t border-border pt-5">
          <MonthChart title="Новые сделки по месяцам" series={BY_MONTH} r={r} p={p} anchor={ANCHOR} />
        </div>
      </>
    ),
  },
  sub: () => "Отчёт по этапам продаж (r300): где застревают сделки и сколько доходит до договора. Сравнение — с прошлым периодом.",
  noCards: true,
  record: (x) => ({
    title: `${x.code} · ${x.name}`,
    meta: <span className="text-[13px]">{x.n} сделок на этапе</span>,
    actions: [
      { icon: Download, label: "Выгрузить", run: () => download([x]) },
      { icon: Briefcase, label: "Открыть сделки", href: "/deals" },
    ],
    stats: [
      { t: "Сейчас на этапе", v: x.n },
      { t: "Конверсия от старта", v: `${conv(x)}%` },
      { t: "Сумма", v: money(x.sum) },
    ],
    facts: [
      { t: "Дошли до этапа", v: x.reach },
      { t: "Ср. время на этапе", v: `${x.days} дн` },
      { t: "Доля в воронке", v: `${Math.round((x.n / Math.max(1, TOTAL)) * 100)}%` },
    ],
    tabs: [
      {
        t: "Этап",
        body: (
          <Section title="Показатели">
            <Kv
              items={[
                { t: "Сейчас на этапе", v: x.n },
                { t: "Дошли до этапа", v: x.reach },
                { t: "Конверсия от старта", v: `${conv(x)}%` },
                { t: "Среднее время", v: `${x.days} дней` },
                { t: "Сумма", v: money(x.sum) },
              ]}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => `${x.code} · ${x.name}`,
}
