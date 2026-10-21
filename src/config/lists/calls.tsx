import { useState } from "react"
import { Briefcase, Clock, Download, Phone, PhoneMissed, PhoneOutgoing } from "lucide-react"
import { DateCell, Dash, Kv, Line, NameCell, Owner, Section, Status, Timeline } from "@/components/list/cells"
import { Btn } from "@/components/list/ui"
import clients from "@/data/counterparties-demo.json"
import { counterpartyName, managerName, ownerColor, rnd } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"

/*
 * 32 История звонков (CDR). В копии базы журнала Oktell нет — 320 звонков собраны по контрагентам и их менеджерам, как в макете.
 * TODO: API телефонии — журнал, записи разговоров, «Позвонить» / «Перезвонить» через Oktell.
 */

export type Call = {
  id: number
  cs: number
  u: string
  dir: "in" | "out"
  /** «YYYY-MM-DD HH:MM». */
  date: string
  tel: string
  /** Длительность, с (0 — не состоялся). */
  dur: number
  res: number
  rec: boolean
}

const RES: [string, string][] = [
  ["Отвечен", "#34c759"],
  ["Не отвечен", "#ff9f0a"],
  ["Занято", "#8a93a6"],
  ["Сброшен", "#ff375f"],
]
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: Call[] = Array.from({ length: 320 }, (_, i) => {
  const id = 500000 + i * 13
  const [cs, u] = clients[(i * 7) % clients.length]
  // по 10 звонков в день, от 31 марта 2018 назад
  const d = new Date(2018, 2, 31 - Math.floor(i / 10))
  const r = rnd(id, 3) % 10 < 7 ? 0 : (rnd(id, 4) % 3) + 1
  return {
    id,
    cs: +cs,
    u,
    dir: rnd(id, 5) % 2 ? "in" : "out",
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(9 + (rnd(id, 1) % 9))}:${p2(rnd(id, 2) % 60)}`,
    tel: `+7 7${(rnd(id, 6) % 90) + 10} ${String(rnd(id, 7) % 1000).padStart(3, "0")} ${p2(rnd(id, 8) % 100)} ${p2(rnd(id, 9) % 100)}`,
    dur: r ? 0 : (rnd(id, 10) % 900) + 15,
    res: r,
    rec: !r,
  }
})

const result = (x: Call) => <Status text={RES[x.res][0]} color={RES[x.res][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const dirText = (x: Call) => (x.dir === "in" ? "Входящий" : "Исходящий")
const mmss = (s: number) => `${Math.floor(s / 60)}:${p2(Math.round(s % 60))}`
const resOpts: Option[] = RES.map(([label, color], i) => ({ v: String(i), label, color }))
const talked = ALL.filter((x) => x.dur)

/** «Слушать» — заглушка проигрывателя, как в макете. TODO: запись из Oktell. */
function Play() {
  const [on, setOn] = useState(false)
  return (
    <Btn
      className="h-8 px-3 text-[13px]"
      onClick={(e) => {
        e.stopPropagation()
        setOn(!on)
      }}
    >
      {on ? "❚❚ 0:07" : "▶ Слушать"}
    </Btn>
  )
}

function record(x: Call) {
  return {
    title: `Звонок ${x.tel}`,
    meta: (
      <>
        {result(x)}
        <span className="text-[13px]">
          <DateCell d={x.date} /> · {x.date.slice(11)}
        </span>
      </>
    ),
    actions: [
      { icon: Phone, label: "Перезвонить" },
      { icon: Download, label: "Скачать запись" },
      { icon: Briefcase, label: "Создать сделку", href: "/deals/new" },
    ],
    stats: [
      { t: "Направление", v: dirText(x) },
      { t: "Длительность", v: x.dur ? mmss(x.dur) : "—" },
      { t: "Результат", v: RES[x.res][0] },
    ],
    facts: [
      { t: "Контрагент", v: counterpartyName(x.cs) },
      { t: "Менеджер", v: managerName(x.u) },
    ],
    tabs: [
      {
        t: "Звонок",
        body: (
          <>
            <Section title="Детали">
              <Kv
                items={[
                  { t: "Контрагент", v: counterpartyName(x.cs), wide: true },
                  { t: "Направление", v: dirText(x) },
                  { t: "Менеджер", v: managerName(x.u) },
                  { t: "Длительность", v: x.dur ? `${Math.floor(x.dur / 60)} мин ${x.dur % 60} с` : "—" },
                  { t: "Результат", v: RES[x.res][0] },
                ]}
              />
            </Section>
            {x.rec && (
              <Section title="Запись разговора">
                <Line icon={Phone}>
                  <b>call_{x.id}.mp3</b>
                  <span className="flex-1" />
                  <Play />
                </Line>
              </Section>
            )}
          </>
        ),
      },
      {
        t: "История клиента",
        body: (
          <Section title="Последние звонки">
            <Timeline
              items={ALL.filter((c) => c.cs === x.cs)
                .slice(0, 5)
                .map((c) => ({ t: `${dirText(c)} · ${RES[c.res][0]}`, p: managerName(c.u), d: c.date }))}
            />
          </Section>
        ),
      },
    ],
  }
}

export const CALLS: ListConfig<Call> = {
  key: "calls",
  title: "История звонков",
  crumb: "Продажи · Звонки (CDR)",
  icon: Phone,
  search: "Телефон, контрагент или менеджер",
  foot: "звонки — пример данных: в копии базы журнала Oktell нет",
  buttons: [
    // TODO: звонок через Oktell
    { icon: Phone, label: "Позвонить" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.tel} ${counterpartyName(x.cs)} ${managerName(x.u)}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "in", t: "Входящие", f: (x) => x.dir === "in" },
    { k: "out", t: "Исходящие", f: (x) => x.dir === "out" },
    { k: "miss", t: "Пропущенные", f: (x) => x.res === 1 },
  ],
  filters: [{ k: "res", t: "Результат", get: (x) => String(x.res), opts: resOpts }],
  sort: ["date", -1],
  cols: [
    { k: "tel", t: "Звонок", value: (x) => x.tel, render: (x) => <NameCell icon={x.dir === "in" ? Phone : PhoneOutgoing} name={x.tel} sub={`${dirText(x)} · ${x.id}`} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    {
      k: "date",
      t: "Дата и время",
      date: true,
      value: (x) => x.date,
      render: (x) => (
        <>
          <DateCell d={x.date} /> <span className="text-muted-foreground">{x.date.slice(11)}</span>
        </>
      ),
    },
    { k: "dur", t: "Длительность", num: true, value: (x) => x.dur, render: (x) => (x.dur ? mmss(x.dur) : <Dash />) },
    { k: "res", t: "Результат", value: (x) => RES[x.res][0], render: result },
    { k: "rec", t: "Запись", noSort: true, value: (x) => (x.rec ? "есть" : ""), render: (x) => (x.rec ? <Play /> : <Dash />) },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (r) => {
    const c = ALL.filter((x) => inRange(x.date, r)).length
    return [
      // прошлого периода в примере данных нет — сравнение условное, как в макете
      { t: "Звонков", icon: Phone, c, p: Math.round(c * 0.91) },
      { t: "Отвечено", icon: Phone, c: Math.round(((ALL.length - ALL.filter((x) => x.res).length) / ALL.length) * 100), p: 68, f: (v) => `${v}%` },
      { t: "Пропущенных", icon: PhoneMissed, c: ALL.filter((x) => x.res === 1).length, note: "нужно перезвонить" },
      { t: "Средняя длительность", icon: Clock, c: talked.reduce((a, x) => a + x.dur, 0) / Math.max(1, talked.length), f: mmss },
    ]
  },
  sub: () => "Входящие и исходящие звонки по клиентам из телефонии Oktell, с записями разговоров.",
  noDelete: true,
  record,
  name: (x) => `Звонок ${x.tel}`,
}
