import { Briefcase, CircleCheck, CircleDollarSign, Download, FilePlus, Layers, TrendingUp, TriangleAlert } from "lucide-react"
import { Kv, Line, NameCell, Section, Status } from "@/components/list/cells"
import { CITY, pick, rnd } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { money } from "@/lib/period"

/*
 * 21 Лоты закупок — бюджет, обеспечение, конкуренты и итог. Пример данных: в копии базы лотов нет (как в макете). TODO: API.
 */

type Result = "win" | "lose" | "wait"

export type Lot = {
  id: number
  /** № закупки. */
  ten: string
  name: string
  /** Бюджет без НДС, ₸. */
  budget: number
  place: string
  /** Обеспечение заявки, %. */
  guar: number
  /** Конкурентов. */
  comp: number
  res: Result
}

const LOTS = ["Интернет 100 Мбит/с", "Канал L2 Астана–Алматы", "IP-VPN 12 точек", "ВКС 5 залов", "Аренда стойки в ЦОД", "IP-телефония 60 линий"]
const COMPETITORS = ["Казахтелеком", "Beeline Business", "Transtelecom", "2Day Telecom"]
const RESULT: Record<Result, [string, string]> = {
  win: ["Выигран", "#34c759"],
  lose: ["Проигран", "#ff375f"],
  wait: ["Ожидает итогов", "#ff9f0a"],
}

const ALL: Lot[] = Array.from({ length: 160 }, (_, i) => {
  const id = 9100 + i
  return {
    id,
    ten: `№${(rnd(id, 2) % 9000000) + 1000000}`,
    name: pick(LOTS, id, 3),
    budget: ((rnd(id, 4) % 400) + 10) * 100000,
    place: pick(CITY, id, 5),
    guar: [0, 1, 3][rnd(id, 6) % 3],
    comp: (rnd(id, 7) % 5) + 1,
    res: (["win", "lose", "lose", "wait", "wait"] as Result[])[rnd(id, 8) % 5],
  }
})

const tenge = (n: number) => `${money(n)} ₸`
const result = (x: Lot) => <Status text={RESULT[x.res][0]} color={RESULT[x.res][1]} />
const won = ALL.filter((x) => x.res === "win")
const decided = ALL.filter((x) => x.res !== "wait")
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))

export const LOTS_LIST: ListConfig<Lot> = {
  key: "lots",
  title: "Лоты",
  crumb: "Тендеры · Лоты",
  icon: Layers,
  search: "Лот или номер закупки",
  foot: "пример данных",
  buttons: [
    { icon: FilePlus, label: "Добавить лот", href: "/lots/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.name} ${x.ten} ${x.place}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "w", t: "Выиграны", f: (x) => x.res === "win" },
    { k: "l", t: "Проиграны", f: (x) => x.res === "lose" },
    { k: "o", t: "Ожидают", f: (x) => x.res === "wait" },
  ],
  sort: ["budget", -1],
  cols: [
    { k: "name", t: "Лот", value: (x) => x.name, render: (x) => <NameCell icon={Layers} name={x.name} sub={`Закупка ${x.ten}`} /> },
    { k: "place", t: "Место поставки", value: (x) => x.place, render: (x) => x.place },
    { k: "budget", t: "Бюджет без НДС", num: true, value: (x) => x.budget, render: (x) => tenge(x.budget) },
    { k: "guar", t: "Обеспечение", num: true, value: (x) => x.guar, render: (x) => (x.guar ? `${x.guar}%` : "—") },
    { k: "comp", t: "Конкурентов", num: true, value: (x) => x.comp, render: (x) => x.comp },
    { k: "res", t: "Итог", value: (x) => RESULT[x.res][0], render: result },
  ],
  kpis: () => [
    { t: "Лотов", icon: Layers, c: ALL.length },
    // сравнение условное, как в макете
    { t: "Выиграно", icon: CircleCheck, c: won.length, p: won.length - 4 },
    { t: "Доля побед", icon: TrendingUp, c: Math.round((won.length / Math.max(1, decided.length)) * 100), f: (v) => `${v}%` },
    { t: "Бюджет выигранных", icon: CircleDollarSign, c: won.reduce((a, x) => a + x.budget, 0), f: tenge },
  ],
  sub: () => "Лоты закупок: бюджет, обеспечение, конкуренты и итог. Для проигранных — причина отклонения.",
  cardStatus: "res",
  record: (x) => {
    const params = [
      { t: "Закупка", v: x.ten },
      { t: "Бюджет без НДС", v: tenge(x.budget) },
      { t: "Бюджет с НДС", v: tenge(x.budget * 1.12) },
      { t: "Место поставки", v: x.place },
      { t: "Обеспечение заявки", v: x.guar ? `${x.guar}%` : "не требуется" },
      { t: "Конкурентов", v: x.comp },
    ]
    // в макете у конкурентов четыре имени — лишние не показываем
    const rivals = COMPETITORS.slice(0, x.comp)
    return {
      title: x.name,
      meta: result(x),
      actions: [
        // TODO: риски по лоту — отдельная сущность
        { icon: TriangleAlert, label: "Добавить риск" },
        { icon: Briefcase, label: "Связать со сделкой", href: "/deals" },
      ],
      stats: [
        { t: "Бюджет", v: tenge(x.budget) },
        { t: "Обеспечение", v: x.guar ? `${x.guar}%` : "—" },
        { t: "Конкурентов", v: x.comp },
      ],
      facts: params,
      tabs: [
        {
          t: "Лот",
          body: (
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          ),
        },
        {
          t: "Конкуренты",
          body: (
            <Section title="Ценовые предложения">
              {rivals.map((c, k) => (
                <Line key={c}>
                  <b>{c}</b>
                  <span className="flex-1" />
                  <span className="tabular-nums">{tenge(x.budget * (0.82 + k * 0.04))}</span>
                </Line>
              ))}
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `${x.name} · ${x.ten}`,
  blank: () => ({ id: 0, ten: "", name: "", budget: 0, place: CITY[1], guar: 0, comp: 1, res: "wait" }),
  fields: [
    { k: "name", t: "Лот", type: "text", required: true, wide: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim() }) },
    { k: "place", t: "Место поставки", type: "select", opts: opts(CITY), get: (x) => x.place, set: (x, v) => ({ ...x, place: v }) },
    { k: "budget", t: "Бюджет без НДС, ₸", type: "number", get: (x) => (x.budget ? String(x.budget) : ""), set: (x, v) => ({ ...x, budget: +v || 0 }) },
    { k: "guar", t: "Обеспечение", type: "select", opts: [0, 1, 3].map((v) => ({ v: String(v), label: v ? `${v}%` : "не требуется" })), get: (x) => String(x.guar), set: (x, v) => ({ ...x, guar: +v }) },
    { k: "comp", t: "Конкурентов", type: "number", get: (x) => String(x.comp), set: (x, v) => ({ ...x, comp: +v || 1 }) },
    { k: "res", t: "Итог", type: "select", opts: (Object.keys(RESULT) as Result[]).map((v) => ({ v, label: RESULT[v][0], color: RESULT[v][1] })), get: (x) => x.res, set: (x, v) => ({ ...x, res: v as Result }) },
  ],
}
