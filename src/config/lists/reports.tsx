import { Bell, CalendarClock, ChartColumn, Download, FileText, Globe, Phone, Signature, TrendingUp, UserRound, Users, Wrench, type LucideIcon } from "lucide-react"
import { Kv, NameCell, Pill, Section } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { CONTRACTS as CONTRACTS_BY_MONTH, OFFERS } from "@/lib/home-stats"
import { exportCsv } from "@/lib/list/query"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
import { sumOf } from "@/lib/period"
import { CONTRACTS } from "./contracts"
import { COUNTERPARTIES } from "./counterparties"
import { IP_REQUESTS } from "./ip-requests"
import { LEADS } from "./leads"

/*
 * 27 Отчёты — все отчёты kCRM в одном месте. Часть открывает свои страницы (31, 33–35);
 * остальные «Сформировать» выгружает CSV по данным соответствующего раздела. TODO: отчёты на сервере, .xlsx, подписка по расписанию.
 */

export type Report = {
  id: number
  n: string
  d: string
  icon: LucideIcon
  g: string
  /** Своя страница отчёта. */
  page?: string
  /** Выгрузка по данным раздела; возвращает число строк. */
  run?: () => number
}

/** Выгрузка раздела как отчёта: все его записи (с изменениями в этой вкладке) и колонки списка. */
const dump =
  <T extends Row>(title: string, cfg: ListConfig<T>) =>
  () => {
    const rows = rowsStore.all(cfg)
    exportCsv({ title, cols: cfg.cols }, rows)
    return rows.length
  }

const REPORTS: Report[] = [
  { id: 1, n: "Свод по продажам", d: "Подразделение / менеджер / услуга × месяцы: вход, продажи, договоры, отказы, конверсия", icon: ChartColumn, g: "Продажи", page: "/sales-summary" },
  { id: 2, n: "Отчёт по этапам продаж", d: "Воронка: сколько сделок на каждом из 11 этапов, переходы между этапами", icon: TrendingUp, g: "Продажи", page: "/stage-report" },
  { id: 3, n: "Воронка сделок", d: "Конверсия по этапам с отказами и причинами", icon: TrendingUp, g: "Продажи", page: "/stage-report" },
  { id: 4, n: "Отчёт по доходам", d: "Ежемесячные и единовременные доходы по договорам", icon: Signature, g: "Продажи", run: dump("Отчёт по доходам", CONTRACTS) },
  { id: 5, n: "Отчёт по входящим лидам", d: "Звонки колл-центра по темам и операторам", icon: Phone, g: "Лиды", page: "/leads-report" },
  { id: 6, n: "Воронка лидов", d: "От звонка до сделки", icon: TrendingUp, g: "Лиды", run: dump("Воронка лидов", LEADS) },
  { id: 7, n: "Отчёт по лидам и сделкам", d: "Сколько лидов превратились в сделки", icon: Users, g: "Лиды", page: "/leads-report" },
  { id: 8, n: "Заявки и наряды", d: "ТВ/ТР и наряды по филиалам и ответственным, выгрузка в Excel", icon: Wrench, g: "Заявки", page: "/requests-report" },
  { id: 9, n: "Технологии подключения LM", d: "Какие технологии последней мили используются", icon: Globe, g: "Заявки", run: dump("Технологии подключения LM", IP_REQUESTS) },
  { id: 10, n: "Контрагенты без email", d: "Для чистки базы и рассылок", icon: Users, g: "Контрагенты", run: dump("Контрагенты без email", COUNTERPARTIES) },
  { id: 11, n: "Контрагенты ЛПР, ВПР", d: "Лица, принимающие и влияющие на решение", icon: UserRound, g: "Контрагенты", run: dump("Контрагенты ЛПР ВПР", COUNTERPARTIES) },
]
const GROUPS = ["Продажи", "Лиды", "Заявки", "Контрагенты"]

const generate = (x: Report) =>
  x.run ? toast(`«${x.n}» сформирован · ${x.run()} строк (CSV для Excel)`) : toast(`«${x.n}» — откройте отчёт, он строится на своей странице`)

export const REPORTS_LIST: ListConfig<Report> = {
  key: "reports",
  title: "Отчёты",
  crumb: "Отчёты · Все отчёты kCRM",
  icon: ChartColumn,
  search: "Название отчёта",
  buttons: [
    { icon: Download, label: "Экспресс-отчёт", onClick: "bulk" },
    // TODO: подписка на отчёт по расписанию (письмо на почту)
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => REPORTS,
  text: (x) => `${x.n} ${x.d}`,
  tabs: [{ k: "a", t: "Все", f: () => true }, ...GROUPS.map((g) => ({ k: g, t: g, f: (x: Report) => x.g === g }))],
  sort: ["id", 1],
  cols: [
    { k: "n", t: "Отчёт", value: (x) => x.n, render: (x) => <NameCell icon={x.icon} name={x.n} sub={x.d} /> },
    { k: "g", t: "Раздел", value: (x) => x.g, render: (x) => <Pill>{x.g}</Pill> },
    { k: "f", t: "Формат", noSort: true, value: () => "Excel · CSV", render: () => "Excel · CSV" },
    {
      k: "b",
      t: "",
      noSort: true,
      value: () => null,
      render: (x) => (
        <Btn
          className="h-[34px] px-3.5 text-[13px]"
          onClick={(e) => {
            e.stopPropagation()
            generate(x)
          }}
        >
          <Download />
          Сформировать
        </Btn>
      ),
    },
  ],
  kpis: (r, rp) => {
    const conv = (rr: string[]) => Math.round((sumOf(CONTRACTS_BY_MONTH, rr) / Math.max(1, sumOf(OFFERS, rr))) * 100)
    return [
      { t: "КП", icon: FileText, c: sumOf(OFFERS, r), p: sumOf(OFFERS, rp) },
      { t: "Договоры", icon: Signature, c: sumOf(CONTRACTS_BY_MONTH, r), p: sumOf(CONTRACTS_BY_MONTH, rp) },
      { t: "Конверсия КП → договор", icon: TrendingUp, c: conv(r), p: conv(rp), f: (v) => `${v}%` },
      { t: "Отчётов", icon: ChartColumn, c: REPORTS.length },
    ]
  },
  sub: () => "Все отчёты kCRM в одном месте. Каждый строится за выбранный период и сравнивается с прошлым.",
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Свод: КП по месяцам" series={OFFERS} r={r} p={p} /> },
  // «Экспресс-отчёт» — отмеченные отчёты; отменять нечего
  bulk: { done: "Сформировано отчётов", run: (rows) => void rows.forEach(generate) },
  rowHref: (x) => x.page,
  record: (x) => ({
    title: x.n,
    meta: <Pill>{x.g}</Pill>,
    actions: [
      x.page ? { icon: ChartColumn, label: "Открыть отчёт", href: x.page } : { icon: Download, label: "Сформировать", run: () => void generate(x) },
      { icon: Bell, label: "Подписаться" },
    ],
    stats: [],
    facts: [],
    tabs: [
      {
        t: "Параметры",
        body: (
          <Section title="Отчёт">
            <p className="mb-3.5 text-sm text-muted-foreground">{x.d}</p>
            <Kv
              items={[
                { t: "Период", v: "март 2018" },
                { t: "Сравнить с", v: "февраль 2018" },
                { t: "Филиал", v: "Все" },
                { t: "Формат", v: "Excel (CSV)" },
              ]}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => x.n,
}
