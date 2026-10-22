import { ChartColumn, CircleCheck, Download, Gavel, Send, TrendingUp } from "lucide-react"
import { Kv, NameCell, Pill, Section } from "@/components/list/cells"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { exportCsv } from "@/lib/list/query"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig } from "@/lib/list/types"
import { LOTS_LIST, type Lot } from "./lots"
import { TENDERS } from "./tenders"

/*
 * 22 Отчёты по тендерам — каталог отчётов с выгрузкой. Отчёты строятся по данным «Тендеров» (20) и «Лотов» (21),
 * включая изменения в этой вкладке. TODO: отчёты на сервере, .xlsx, период / филиал / менеджер.
 */

export type TenderReport = { id: number; n: string; d: string; run: () => number }

const COMPETITORS = ["Казахтелеком", "Beeline Business", "Transtelecom", "2Day Telecom"]

/** Полный отчёт по лотам: лот × конкурент и его цена. */
function fullLots() {
  const rows = rowsStore.all(LOTS_LIST).flatMap((x) => COMPETITORS.slice(0, x.comp).map((c, k) => ({ x, c, price: Math.round(x.budget * (0.82 + k * 0.04)) })))
  exportCsv(
    {
      title: "Полный отчёт по лотам",
      cols: [
        { t: "Лот", value: (r) => r.x.name },
        { t: "Закупка", value: (r) => r.x.ten },
        { t: "Бюджет без НДС", value: (r) => r.x.budget },
        { t: "Конкурент", value: (r) => r.c },
        { t: "Цена", value: (r) => r.price },
        { t: "Итог", value: (r) => (r.x.res === "win" ? "Выигран" : r.x.res === "lose" ? "Проигран" : "Ожидает итогов") },
      ],
    },
    rows
  )
  return rows.length
}

/** Отчёт по конкурентам: участие в лотах и средняя скидка к бюджету. */
function competitors() {
  const lots: Lot[] = rowsStore.all(LOTS_LIST)
  const rows = COMPETITORS.map((c, k) => {
    const seen = lots.filter((x) => x.comp > k)
    return { c, n: seen.length, disc: Math.round((1 - (0.82 + k * 0.04)) * 100) }
  })
  exportCsv(
    {
      title: "Отчёт по конкурентам",
      cols: [
        { t: "Конкурент", value: (r) => r.c },
        { t: "Участий в лотах", value: (r) => r.n },
        { t: "Средняя скидка к бюджету, %", value: (r) => r.disc },
      ],
    },
    rows
  )
  return rows.length
}

const REPORTS: TenderReport[] = [
  {
    id: 1,
    n: "Отчёт по тендерам",
    d: "Все закупки за период со статусами и решениями",
    run: () => {
      const rows = rowsStore.all(TENDERS)
      exportCsv({ title: "Отчёт по тендерам", cols: TENDERS.cols }, rows)
      return rows.length
    },
  },
  {
    id: 2,
    n: "Отчёт по лотам",
    d: "Бюджеты, обеспечения и итоги лотов",
    run: () => {
      const rows = rowsStore.all(LOTS_LIST)
      exportCsv({ title: "Отчёт по лотам", cols: LOTS_LIST.cols }, rows)
      return rows.length
    },
  },
  { id: 3, n: "Полный отчёт по лотам", d: "Лоты, конкуренты, цены и причины проигрыша", run: fullLots },
  { id: 4, n: "Отчёт по конкурентам", d: "Кто и сколько раз участвовал, средняя скидка", run: competitors },
]

const generate = (x: TenderReport) => toast(`«${x.n}» сформирован · ${x.run()} строк (CSV для Excel)`)

export const TENDER_REPORTS: ListConfig<TenderReport> = {
  key: "tender-reports",
  title: "Отчёты по тендерам",
  crumb: "Тендеры · Отчёты",
  icon: ChartColumn,
  search: "Отчёт",
  buttons: [{ icon: Download, label: "Сформировать", onClick: "bulk" }],
  // «Сформировать» в шапке — отмеченные отчёты; отменять нечего (файлы уже скачаны)
  bulk: { done: "Сформировано отчётов", run: (rows) => void rows.forEach((x) => x.run()) },
  rows: () => REPORTS,
  text: (x) => `${x.n} ${x.d}`,
  sort: ["id", 1],
  cols: [
    { k: "id", t: "Отчёт", value: (x) => x.id, render: (x) => <NameCell icon={ChartColumn} name={x.n} sub={x.d} /> },
    { k: "f", t: "Формат", noSort: true, value: () => "Excel", render: () => <Pill>Excel</Pill> },
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
  // TODO: цифры за год из API (в макете — константы)
  kpis: () => [
    { t: "Тендеров за год", icon: Gavel, c: 540, p: 470 },
    { t: "Заявок подано", icon: Send, c: 118, p: 101 },
    { t: "Побед", icon: CircleCheck, c: 37, p: 29 },
    { t: "Доля побед", icon: TrendingUp, c: 31, p: 29, f: (v) => `${v}%` },
  ],
  sub: () => "Отчёты по закупкам и лотам с выгрузкой в Excel. Цифры в карточках — сравнение с прошлым годом.",
  noCards: true,
  record: (x) => ({
    title: x.n,
    meta: <span className="text-[13px]">{x.d}</span>,
    actions: [{ icon: Download, label: "Сформировать", run: () => void generate(x) }],
    stats: [],
    facts: [],
    tabs: [
      {
        t: "Параметры",
        body: (
          <Section title="Период и фильтры">
            <Kv
              items={[
                { t: "Период", v: "01.01.2018 – 31.03.2018" },
                { t: "Филиал", v: "Все" },
                { t: "Менеджер", v: "Все" },
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
