import { CalendarClock, CircleCheck, Download, Globe, Undo2, X } from "lucide-react"
import { Kv, NameCell, Section } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import { toast } from "@/components/shared/toast"
import { rnd } from "@/lib/demo-names"
import { shiftDate, TODAY } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig } from "@/lib/list/types"
import type { Series } from "@/lib/period"

/*
 * 43 Отчёт по IP-адресам (ОТУП ДИППП, модуль «Выдача IP-адресов») — по филиалам за период, с разбивкой по видам заявок.
 * Цифры — заглушки по номеру строки, как в макете (март 2018). TODO: отчёт из API по заявкам на IP (11) за выбранный период.
 */

export type IpReportRow = {
  id: number
  br: string
  /** Поступило заявок, исполнено, отклонено. */
  n: number
  done: number
  rej: number
  /** По видам: выдача, изменение, переоформление, изъятие. */
  g: number
  c: number
  r: number
  w: number
  /** Выдано адресов. */
  addr: number
}

const BRANCHES = ["АФ", "АС", "ВФ", "ЗФ", "МФ", "УФ", "ЮФ", "КФ", "ШФ", "ГО-ДКП"]

const ALL: IpReportRow[] = BRANCHES.map((br, i) => {
  const g = 6 + (rnd(i, 1) % 20)
  const c = rnd(i, 2) % 8
  const r = rnd(i, 3) % 6
  const w = 1 + (rnd(i, 4) % 7)
  const n = g + c + r + w
  const rej = rnd(i, 5) % 4
  // id с 1 — у строки свой адрес /ip-report/<id>
  return { id: i + 1, br, n, g, c, r, w, done: n - rej - (rnd(i, 6) % 4), rej, addr: g * 8 + (rnd(i, 7) % 40) }
})

/** Заявки по месяцам — пример из макета: одна заявка раз в два дня за последний год. */
const BY_MONTH: Series = Array.from({ length: 180 }, (_, i) => shiftDate(TODAY, -i * 2).slice(0, 7)).reduce<Series>((s, k) => ({ ...s, [k]: (s[k] || 0) + 1 }), {})

const total = (k: "n" | "done" | "rej" | "w") => ALL.reduce((a, x) => a + x[k], 0)

const download = (rows: IpReportRow[]) => {
  exportCsv(IP_REPORT, rows)
  toast(`Выгружено ${rows.length} строк в Excel (CSV)`)
}

function record(x: IpReportRow) {
  const title = `Филиал ${x.br}`
  const requests: BriefItem[] = [
    { t: "Поступило", v: x.n },
    { t: "Исполнено", v: x.done },
    { t: "Отклонено", v: x.rej },
  ]
  const kinds: BriefItem[] = [
    { t: "Выдача", v: x.g },
    { t: "Изменение", v: x.c },
    { t: "Переоформление", v: x.r },
    { t: "Изъятие", v: x.w },
    { t: "Выдано адресов", v: x.addr },
  ]
  return {
    title,
    meta: <span className="text-[13px]">заявки IP · март 2018</span>,
    actions: [{ icon: Download, label: "Выгрузить", run: () => download([x]) }],
    // числовые колонки — как в макете
    stats: briefStats(title, [...requests, ...kinds]),
    facts: briefFacts([...requests, ...kinds]),
    tabs: [
      {
        t: "Показатели",
        body: (
          <>
            <Section title="Заявки">
              <Kv items={requests} />
            </Section>
            <Section title="По видам">
              <Kv items={kinds} />
            </Section>
          </>
        ),
      },
    ],
  }
}

export const IP_REPORT: ListConfig<IpReportRow> = {
  key: "ip-report",
  title: "Отчёт по IP-адресам",
  crumb: "Отчёты · Заявки на IP-адреса",
  icon: Globe,
  badge: "new",
  req: "ОТУП ДИППП, модуль «Выдача IP-адресов» — отчёт с выгрузкой в Excel: поступило, исполнено, отклонено за период; разбивка на выдачу, изменение, переоформление и изъятие",
  search: "Филиал",
  buttons: [
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
    // TODO: рассылка отчёта по расписанию
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => ALL,
  text: (x) => x.br,
  sort: ["n", -1],
  cols: [
    { k: "br", t: "Филиал", value: (x) => x.br, render: (x) => <NameCell icon={Globe} name={x.br} sub="заявки IP" /> },
    { k: "n", t: "Поступило", num: true, value: (x) => x.n, render: (x) => x.n },
    { k: "done", t: "Исполнено", num: true, value: (x) => x.done, render: (x) => x.done },
    { k: "rej", t: "Отклонено", num: true, value: (x) => x.rej, render: (x) => x.rej || "—" },
    { k: "g", t: "Выдача", num: true, value: (x) => x.g, render: (x) => x.g },
    { k: "c", t: "Изменение", num: true, value: (x) => x.c, render: (x) => x.c || "—" },
    { k: "r", t: "Переоформление", num: true, value: (x) => x.r, render: (x) => x.r || "—" },
    { k: "w", t: "Изъятие", num: true, value: (x) => x.w, render: (x) => x.w },
    { k: "addr", t: "Выдано адресов", num: true, value: (x) => x.addr, render: (x) => x.addr },
  ],
  // прошлого периода в примере нет — сравнение условное, как в макете
  kpis: () => [
    { t: "Поступило", icon: Globe, c: total("n"), p: Math.round(total("n") * 0.9) },
    { t: "Исполнено", icon: CircleCheck, c: Math.round((total("done") / total("n")) * 100), p: 84, f: (v) => `${v}%` },
    { t: "Отклонено", icon: X, c: total("rej"), p: total("rej") + 3 },
    { t: "Изъятий", icon: Undo2, c: total("w"), note: "в т. ч. авто при отключении" },
  ],
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Заявки на IP по месяцам" series={BY_MONTH} r={r} p={p} /> },
  sub: () => "Март 2018. Сравнение с февралём. Выгружается в Excel по выбранному периоду.",
  noCards: true,
  noDelete: true,
  record,
  name: (x) => `Филиал ${x.br}`,
}
