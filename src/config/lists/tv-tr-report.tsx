import { CalendarClock, ChartColumn, ClipboardCheck, Download, FileText, MapPin, Wrench } from "lucide-react"
import { Kv, NameCell, Section } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import { rnd } from "@/lib/demo-names"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig, Option } from "@/lib/list/types"

/*
 * 39 Отчёт ТВ/ТР и наряды (ОТПП ТК ДИППП, п. 19) — по филиалам, отдельно централизованные и локальные заявки.
 * Цифры — заглушки по номеру строки, как в макете (март 2018). TODO: отчёт из API по заявкам (09), ТР и нарядам (10) за период.
 */

export type TvTrRow = {
  id: number
  br: string
  t: "Централизованные" | "Локальные"
  /** Поступило заявок и точек в них. */
  n: number
  pts: number
  /** ТВ есть / нет / в работе: заявок и точек. */
  y: number
  yp: number
  no: number
  np: number
  w: number
  wp: number
  tender: number
  tr: number
  /** Наряды: поступило, выполнено, в работе. */
  wo: number
  wod: number
  wow: number
}

const BRANCHES = ["АФ", "АС", "ВФ", "ЗФ", "МФ", "УФ", "ЮФ", "КФ", "ШФ", "ОТПП ТК ДИППП"]
const TYPES = ["Централизованные", "Локальные"] as const

const ALL: TvTrRow[] = BRANCHES.flatMap((br, i) =>
  TYPES.map((t, j) => {
    const id = i * 2 + j
    const n = (j ? 8 : 14) + (rnd(id, 1) % 30)
    const y = Math.round(n * (0.45 + (rnd(id, 3) % 30) / 100))
    const no = Math.round((n - y) * 0.5)
    const w = Math.max(0, n - y - no)
    const wo = 4 + (rnd(id, 8) % 20)
    const wod = Math.round(wo * (0.5 + (rnd(id, 9) % 40) / 100))
    return {
      // id с 1 — у записи свой адрес /tv-tr-report/<id>
      id: id + 1,
      br,
      t,
      n,
      pts: n + (rnd(id, 2) % (n * 2)),
      y,
      yp: y + (rnd(id, 4) % (y + 1)),
      no,
      np: no + (rnd(id, 5) % (no + 1)),
      w,
      wp: w + (rnd(id, 6) % (w + 1)),
      tender: rnd(id, 7) % 6,
      tr: Math.round(y * 0.8),
      wo,
      wod,
      wow: wo - wod,
    }
  })
)

const total = (k: "n" | "pts" | "tr" | "wo" | "wod") => ALL.reduce((a, x) => a + x[k], 0)
/** «ТВ есть 1 (2)» — 1 заявка, 2 точки. */
const pair = (a: number, b: number) => `${a} (${b})`
const Pair = ({ a, b }: { a: number; b: number }) => (
  <>
    {a} <span className="text-muted-foreground">({b})</span>
  </>
)
const brOpts: Option[] = BRANCHES.map((v) => ({ v, label: v }))

const download = (rows: TvTrRow[]) => {
  exportCsv(TV_TR_REPORT, rows)
  toast(`Выгружено ${rows.length} строк в Excel (CSV)`)
}

function record(x: TvTrRow) {
  const title = `${x.br} · ${x.t}`
  const requests: BriefItem[] = [
    { t: "Поступило", v: x.n },
    { t: "Точек", v: x.pts },
    { t: "ТВ есть", v: <Pair a={x.y} b={x.yp} />, s: pair(x.y, x.yp) },
    { t: "ТВ нет", v: <Pair a={x.no} b={x.np} />, s: pair(x.no, x.np) },
    { t: "В работе", v: <Pair a={x.w} b={x.wp} />, s: pair(x.w, x.wp) },
    { t: "Тендерные", v: x.tender },
  ]
  const orders: BriefItem[] = [
    { t: "Разработано ТР", v: x.tr },
    { t: "Нарядов поступило", v: x.wo },
    { t: "Выполнено", v: x.wod },
    { t: "Нарядов в работе", v: x.wow },
  ]
  return {
    title,
    meta: <span className="text-[13px]">март 2018</span>,
    actions: [
      { icon: Download, label: "Выгрузить", run: () => download([x]) },
      { icon: ClipboardCheck, label: "Открыть заявки", href: "/tv-registry" },
    ],
    // числовые колонки — как в макете
    stats: briefStats(title, [
      { t: "Поступило заявок", v: x.n },
      { t: "Точек", v: x.pts },
      { t: "ТВ есть, заявок (точек)", v: <Pair a={x.y} b={x.yp} />, s: pair(x.y, x.yp) },
      { t: "ТВ нет, заявок (точек)", v: <Pair a={x.no} b={x.np} />, s: pair(x.no, x.np) },
    ]),
    facts: briefFacts([...requests, ...orders]),
    tabs: [
      {
        t: "Показатели",
        body: (
          <>
            <Section title="Заявки на проверку ТВ">
              <Kv items={requests} />
            </Section>
            <Section title="ТР и наряды">
              <Kv items={orders} />
            </Section>
          </>
        ),
      },
    ],
  }
}

export const TV_TR_REPORT: ListConfig<TvTrRow> = {
  key: "tv-tr-report",
  title: "Отчёт ТВ/ТР и наряды",
  crumb: "Отчёты · Заявки ТВ, ТР и наряды по филиалам",
  icon: ChartColumn,
  badge: "new",
  req: "ОТПП ТК ДИППП, п. 19 — отчёт по заявкам ТВ, разработанным ТР и нарядам на подключение отдельно по локальным и централизованным заявкам: по филиалу, по Обществу в целом, со всеми подразделениями",
  search: "Филиал",
  buttons: [
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
    { icon: ChartColumn, label: "По Обществу в целом", onClick: "reset" },
    // TODO: рассылка отчёта по расписанию
    { icon: CalendarClock, label: "По расписанию" },
  ],
  rows: () => ALL,
  text: (x) => `${x.br} ${x.t}`,
  tabs: [
    { k: "a", t: "Все заявки", f: () => true },
    { k: "c", t: "Централизованные", f: (x) => x.t === "Централизованные" },
    { k: "l", t: "Локальные", f: (x) => x.t === "Локальные" },
  ],
  filters: [{ k: "br", t: "Филиал", get: (x) => x.br, opts: brOpts }],
  sort: ["id", 1],
  cols: [
    { k: "br", t: "Филиал", value: (x) => x.id, render: (x) => <NameCell icon={ChartColumn} name={x.br} sub={x.t} /> },
    { k: "n", t: "Поступило заявок", num: true, value: (x) => x.n, render: (x) => x.n },
    { k: "pts", t: "Точек", num: true, value: (x) => x.pts, render: (x) => x.pts },
    { k: "y", t: "ТВ есть, заявок (точек)", num: true, value: (x) => x.y, render: (x) => <Pair a={x.y} b={x.yp} /> },
    { k: "no", t: "ТВ нет, заявок (точек)", num: true, value: (x) => x.no, render: (x) => <Pair a={x.no} b={x.np} /> },
    { k: "w", t: "В работе, заявок (точек)", num: true, value: (x) => x.w, render: (x) => <Pair a={x.w} b={x.wp} /> },
    { k: "tender", t: "Из них тендерных", num: true, value: (x) => x.tender, render: (x) => x.tender || "—" },
    { k: "tr", t: "Разработано ТР", num: true, value: (x) => x.tr, render: (x) => x.tr },
    { k: "wo", t: "Наряды: поступило", num: true, value: (x) => x.wo, render: (x) => x.wo },
    { k: "wod", t: "Наряды: выполнено", num: true, value: (x) => x.wod, render: (x) => x.wod },
    { k: "wow", t: "Наряды: в работе", num: true, value: (x) => x.wow, render: (x) => x.wow },
  ],
  // прошлого периода в примере нет — сравнение условное, как в макете
  kpis: () => [
    { t: "Заявок ТВ", icon: ClipboardCheck, c: total("n"), p: Math.round(total("n") * 0.91) },
    { t: "Точек", icon: MapPin, c: total("pts"), p: Math.round(total("pts") * 0.88) },
    { t: "Разработано ТР", icon: FileText, c: total("tr"), p: Math.round(total("tr") * 1.05) },
    { t: "Нарядов выполнено", icon: Wrench, c: Math.round((total("wod") / total("wo")) * 100), p: 64, f: (v) => `${v}%` },
  ],
  sub: () =>
    "Март 2018 · по Обществу в целом. Форма как в требованиях ОТПП ТК ДИППП: «ТВ есть 1 (2)» — 1 заявка, 2 точки. Отдельно централизованные и локальные; включая ОТПП ТК ДИППП.",
  noCards: true,
  record,
  name: (x) => `${x.br} · ${x.t}`,
}
