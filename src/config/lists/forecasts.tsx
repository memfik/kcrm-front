import Link from "next/link"
import { CircleDollarSign, CircleX, Download, FilePlus, List, RefreshCw, TrendingUp } from "lucide-react"
import { DateCell, Kv, NameCell, Owner, Pill, Section } from "@/components/list/cells"
import { DeltaPill } from "@/components/shared/ui"
import clients from "@/data/counterparties-demo.json"
import { counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { money } from "@/lib/period"

/*
 * 19 Прогнозы — прогноз доходов по проектам с оценкой вероятности.
 * В копии базы таблицы прогнозов нет — 90 проектов собраны на контрагентах, как в макете. TODO: API.
 */

export type Forecast = {
  id: number
  cs: number
  /** Менеджер КБ. */
  u: string
  name: string
  /** Блок продаж. */
  blk: string
  /** Стоимость без НДС и ежемесячная плата, ₸. */
  cost: number
  mo: number
  /** Вероятность, %. */
  prob: number
  start: string
  /** Недель без обновления статуса. */
  weeks: number
}

const PROJECTS = ["Интернет для филиалов", "VPN между офисами", "Видеонаблюдение", "SIP-телефония", "ЦОД и хостинг", "Аренда каналов"]
const BLOCKS = ["B2B", "B2G", "КМГ", "B2O"]
const PROBS = [10, 25, 50, 75, 90]

const ALL: Forecast[] = Array.from({ length: 90 }, (_, i) => {
  const id = 60 + i
  return {
    id,
    cs: +clients[(i * 13) % clients.length][0],
    u: STAFF[rnd(id, 1) % STAFF.length],
    name: pick(PROJECTS, id, 2),
    blk: pick(BLOCKS, id, 3),
    cost: ((rnd(id, 4) % 900) + 50) * 10000,
    mo: ((rnd(id, 5) % 90) + 5) * 10000,
    prob: PROBS[rnd(id, 6) % PROBS.length],
    start: `2018-${String((rnd(id, 7) % 9) + 3).padStart(2, "0")}-01`,
    weeks: rnd(id, 8) % 20,
  }
})

const tenge = (n: number) => `${money(n)} ₸`
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const prob = (x: Forecast) => <DeltaPill d={{ v: x.prob, text: `${x.prob}%`, tone: x.prob >= 75 ? "up" : x.prob >= 50 ? "eq" : "down" }} />
const problem = (x: Forecast) => x.weeks > 12
const opts = (list: (string | number)[]): Option[] => list.map((v) => ({ v: String(v), label: String(v) }))
const managerOpts: Option[] = STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))
const portfolio = ALL.reduce((a, x) => a + x.cost, 0)
const weighted = ALL.reduce((a, x) => a + (x.cost * x.prob) / 100, 0)

export const FORECASTS: ListConfig<Forecast> = {
  key: "forecasts",
  title: "Прогнозы",
  crumb: "Планирование · Прогнозы проектов",
  icon: TrendingUp,
  search: "Клиент, проект или менеджер",
  foot: "прогнозы — пример данных: в копии базы таблицы прогнозов нет",
  buttons: [
    { icon: FilePlus, label: "Новый прогноз", href: "/forecasts/new" },
    { icon: Download, label: "Экспорт", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.name} ${managerName(x.u)}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "h", t: "Вероятность ≥ 75%", f: (x) => x.prob >= 75 },
    { k: "p", t: "Проблемные", f: problem },
  ],
  filters: [{ k: "blk", t: "Блок продаж", get: (x) => x.blk, opts: opts(BLOCKS) }],
  sort: ["cost", -1],
  cols: [
    { k: "name", t: "Проект", value: (x) => x.name, render: (x) => <NameCell icon={TrendingUp} name={x.name} sub={counterpartyName(x.cs)} /> },
    { k: "blk", t: "Блок", value: (x) => x.blk, render: (x) => <Pill>{x.blk}</Pill> },
    { k: "u", t: "Менеджер КБ", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "cost", t: "Стоимость без НДС", num: true, value: (x) => x.cost, render: (x) => tenge(x.cost) },
    { k: "mo", t: "Ежемес. плата", num: true, value: (x) => x.mo, render: (x) => tenge(x.mo) },
    { k: "prob", t: "Вероятность", num: true, value: (x) => x.prob, render: prob },
    { k: "start", t: "Начало", date: true, value: (x) => x.start, render: (x) => <DateCell d={x.start} /> },
    { k: "weeks", t: "Без обновления", num: true, value: (x) => x.weeks, render: (x) => (x.weeks ? <span className={problem(x) ? "text-[#ff375f]" : undefined}>{x.weeks} нед.</span> : "—") },
  ],
  owner: { t: "Менеджер КБ", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: () => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Портфель проектов", icon: CircleDollarSign, c: portfolio, p: portfolio * 0.88, f: tenge },
    { t: "Взвешенный бюджет", icon: TrendingUp, c: weighted, p: weighted * 0.92, f: tenge },
    { t: "Проектов", icon: List, c: ALL.length },
    { t: "Проблемные зоны", icon: CircleX, c: ALL.filter(problem).length, note: "статус не обновлялся > 12 недель" },
  ],
  sub: () => "Прогноз доходов по проектам с оценкой вероятности. Взвешенный бюджет = стоимость × вероятность.",
  record: (x) => {
    const params = [
      {
        t: "Клиент",
        wide: true,
        v: (
          <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            {counterpartyName(x.cs)}
          </Link>
        ),
      },
      { t: "Менеджер КБ", v: managerName(x.u) },
      { t: "Блок продаж", v: x.blk },
      { t: "Стоимость без НДС", v: tenge(x.cost) },
      { t: "Ежемесячная плата", v: tenge(x.mo) },
      { t: "Вероятность", v: `${x.prob}%` },
      { t: "Дата начала", v: <DateCell d={x.start} /> },
      { t: "Срок реализации", v: `${(rnd(x.id, 9) % 10) + 2} мес.` },
    ]
    return {
      title: x.name,
      meta: (
        <>
          {prob(x)}
          <Pill>{x.blk}</Pill>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
        </>
      ),
      // TODO: «Обновить статус» — с выбором вероятности и комментарием
      actions: [{ icon: RefreshCw, label: "Обновить статус", apply: () => ({ ...x, weeks: 0 }) }],
      stats: [
        { t: "Стоимость", v: tenge(x.cost) },
        { t: "Взвешенно", v: tenge((x.cost * x.prob) / 100) },
        { t: "Вероятность", v: `${x.prob}%` },
        { t: "Без обновления", v: x.weeks ? `${x.weeks} нед.` : "—" },
      ],
      facts: params.filter((p) => !p.wide),
      tabs: [
        {
          t: "Проект",
          body: (
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `${x.name} · ${counterpartyName(x.cs)}`,
  blank: () => ({ id: 0, cs: 0, u: managerOpts[0].v, name: PROJECTS[0], blk: BLOCKS[0], cost: 0, mo: 0, prob: 50, start: "2018-04-01", weeks: 0 }),
  fields: [
    { k: "name", t: "Проект", type: "text", required: true, wide: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim() }) },
    { k: "cs", t: "ID клиента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "blk", t: "Блок продаж", type: "select", opts: opts(BLOCKS), get: (x) => x.blk, set: (x, v) => ({ ...x, blk: v }) },
    { k: "u", t: "Менеджер КБ", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "cost", t: "Стоимость без НДС, ₸", type: "number", get: (x) => (x.cost ? String(x.cost) : ""), set: (x, v) => ({ ...x, cost: +v || 0 }) },
    { k: "mo", t: "Ежемесячная плата, ₸", type: "number", get: (x) => (x.mo ? String(x.mo) : ""), set: (x, v) => ({ ...x, mo: +v || 0 }) },
    { k: "prob", t: "Вероятность", type: "select", opts: PROBS.map((v) => ({ v: String(v), label: `${v}%` })), get: (x) => String(x.prob), set: (x, v) => ({ ...x, prob: +v, weeks: 0 }) },
    { k: "start", t: "Дата начала", type: "date", get: (x) => x.start, set: (x, v) => ({ ...x, start: v || x.start }) },
  ],
}
