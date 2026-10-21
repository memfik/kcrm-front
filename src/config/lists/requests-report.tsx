import { CalendarClock, CircleCheck, ClipboardCheck, Download, FileText, Wrench } from "lucide-react"
import { Kv, NameCell, Section } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { managerName, rnd, STAFF } from "@/lib/demo-names"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig, Option } from "@/lib/list/types"
import type { Series } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 34 Отчёт по заявкам и нарядам (areport) — сводка по филиалам. Цифры по филиалам — заглушки, как в макете;
 * график — заявки ТВ/ТР из копии базы. TODO: агрегаты из API по заявкам (09) и нарядам (10) за период.
 */

export type BranchRow = { id: number; br: string; u: string; tv: number; done: number; wo: number; wd: number; na: number; rej: number; days: number }

const BRANCHES = ["АФ", "АС", "ВФ", "ЗФ", "МФ", "УФ", "ЮФ", "КФ", "ШФ", "ГО-ДКП"]

const ALL: BranchRow[] = BRANCHES.map((br, i) => {
  const tv = 6 + (rnd(i, 1) % 30)
  const wo = 8 + (rnd(i, 3) % 40)
  return {
    id: i + 1,
    br,
    u: STAFF[i % STAFF.length],
    tv,
    done: Math.round(tv * (0.5 + (rnd(i, 2) % 45) / 100)),
    wo,
    wd: Math.round(wo * (0.55 + (rnd(i, 4) % 40) / 100)),
    na: rnd(i, 5) % 6,
    rej: rnd(i, 6) % 5,
    days: 2 + (rnd(i, 7) % 50) / 10,
  }
})
const total = (k: "tv" | "done" | "wo" | "na") => ALL.reduce((a, x) => a + x[k], 0)
const pct = (x: BranchRow) => Math.round((x.done / x.tv) * 100)
const days = (x: BranchRow) => `${x.days.toFixed(1).replace(".", ",")} дн`
const brOpts: Option[] = BRANCHES.map((v) => ({ v, label: v }))
const BY_MONTH: Series = requests.rows
  .filter((t) => t[7] > "2000")
  .reduce<Series>((o, t) => ((o[t[7].slice(0, 7)] = (o[t[7].slice(0, 7)] || 0) + 1), o), {})

const download = (rows: BranchRow[]) => {
  exportCsv(REQUESTS_REPORT, rows)
  toast(`Выгружено ${rows.length} строк в Excel (CSV)`)
}

export const REQUESTS_REPORT: ListConfig<BranchRow> = {
  key: "requests-report",
  title: "Отчёт по заявкам и нарядам",
  crumb: "Отчёты · Заявки и наряды по филиалам",
  icon: Wrench,
  search: "Филиал",
  buttons: [
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
    // TODO: рассылка отчёта по расписанию
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => ALL,
  text: (x) => x.br,
  filters: [{ k: "br", t: "Филиал", get: (x) => x.br, opts: brOpts }],
  sort: ["tv", -1],
  cols: [
    { k: "br", t: "Филиал", value: (x) => x.br, render: (x) => <NameCell icon={Wrench} name={x.br} sub={`Ответственный — ${managerName(x.u)}`} /> },
    { k: "tv", t: "Заявок ТВ/ТР", num: true, value: (x) => x.tv, render: (x) => x.tv },
    {
      k: "done",
      t: "Отработано",
      num: true,
      value: (x) => x.done,
      render: (x) => (
        <>
          {x.done}{" "}
          <span className={cn("ml-1 rounded-full px-1.5 py-px text-[11px] font-bold", pct(x) > 70 ? "bg-[var(--trend-up)]/15 text-[var(--trend-up)]" : "bg-[var(--trend-down)]/15 text-[var(--trend-down)]")}>
            {pct(x)}%
          </span>
        </>
      ),
    },
    { k: "wo", t: "Нарядов", num: true, value: (x) => x.wo, render: (x) => x.wo },
    { k: "wd", t: "Выполнено", num: true, value: (x) => x.wd, render: (x) => x.wd },
    { k: "na", t: "Без акта", num: true, value: (x) => x.na, render: (x) => x.na || "—" },
    { k: "rej", t: "Отклонено", num: true, value: (x) => x.rej, render: (x) => x.rej || "—" },
    { k: "days", t: "Ср. срок", num: true, value: (x) => x.days, render: days },
  ],
  owner: { t: "Ответственный", get: (x) => x.u, name: managerName, render: (x) => managerName(x.u) },
  // прошлого периода в примере нет — сравнение условное, как в макете
  kpis: () => [
    { t: "Заявок ТВ/ТР", icon: ClipboardCheck, c: total("tv"), p: Math.round(total("tv") * 0.88) },
    { t: "Отработано", icon: CircleCheck, c: Math.round((total("done") / total("tv")) * 100), p: 71, f: (v) => `${v}%` },
    { t: "Нарядов", icon: Wrench, c: total("wo"), p: Math.round(total("wo") * 1.07) },
    { t: "Без акта", icon: FileText, c: total("na"), p: total("na") + 4 },
  ],
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Заявки ТВ и ТР по месяцам" series={BY_MONTH} r={r} p={p} /> },
  sub: () => "Сводный отчёт по заявкам ТВ/ТР и нарядам по филиалам и ответственным (areport). Выгружается в Excel.",
  noCards: true,
  noDelete: true,
  record: (x) => ({
    title: `Филиал ${x.br}`,
    meta: <span className="text-[13px]">{managerName(x.u)}</span>,
    actions: [
      { icon: Download, label: "Выгрузить", run: () => download([x]) },
      { icon: ClipboardCheck, label: "Открыть заявки", href: "/tech-requests" },
    ],
    stats: [
      { t: "Заявок ТВ/ТР", v: x.tv },
      { t: "Отработано", v: `${pct(x)}%` },
      { t: "Нарядов", v: x.wo },
    ],
    facts: [
      { t: "Ответственный", v: managerName(x.u) },
      { t: "Нарядов выполнено", v: `${x.wd} из ${x.wo}` },
      { t: "Без акта", v: x.na || "—" },
      { t: "Средний срок", v: days(x) },
    ],
    tabs: [
      {
        t: "Показатели",
        body: (
          <>
            <Section title="Заявки ТВ/ТР">
              <Kv
                items={[
                  { t: "Всего", v: x.tv },
                  { t: "Отработано", v: x.done },
                  { t: "Средний срок", v: days(x) },
                ]}
              />
            </Section>
            <Section title="Наряды">
              <Kv
                items={[
                  { t: "Всего", v: x.wo },
                  { t: "Выполнено", v: x.wd },
                  { t: "Без акта", v: x.na },
                  { t: "Отклонено", v: x.rej },
                ]}
              />
            </Section>
          </>
        ),
      },
    ],
  }),
  name: (x) => `Филиал ${x.br}`,
}
