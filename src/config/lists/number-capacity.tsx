import { CircleCheck, Clock, FilePlus, Hash, Layers, Lock, Phone, TriangleAlert, Undo2 } from "lucide-react"
import { Banner, DateCell, Kv, MailLine, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import { Chat } from "@/components/list/chat"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { fixClient } from "@/lib/demo-clients"
import { CITY, counterpartyName, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"
import { todayLocal } from "@/lib/today"

/*
 * 12 Номерная ёмкость — заявки на выделение городских номеров. Доработано по требованиям ОТУП ДИППП.
 * В копии базы таблица пустая — 80 заявок собраны из заявок ТВ/ТР, как в макете. TODO: API, ЕСТУ «Телефонная нумерация».
 */

type State = "dr" | "rv" | "rc" | "n" | "w" | "d" | "r"

export type NumberRequest = {
  id: number
  cs: number
  u: string
  /** Номеров и каналов. */
  n: number
  ch: number
  iface: string
  city: string
  date: string
  st: State
  /** Аннулирование, созданное автоматически по наряду на отключение. */
  annul: boolean
}

const STATE: Record<State, [string, string]> = {
  dr: ["Черновик", "#8a93a6"],
  rv: ["На рассмотрении", "#5ac8fa"],
  rc: ["Отозвана", "#8a93a6"],
  n: ["Новая заявка", "#ff9f0a"],
  w: ["В работе", "#085eff"],
  d: ["Исполнена", "#34c759"],
  r: ["Отклонена", "#ff375f"],
}
const FINAL: State[] = ["d", "r", "rc"]
const IFACES = ["SIP", "E1 (PRI)", "Аналог"]
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: NumberRequest[] = Array.from({ length: 80 }, (_, i) => {
  const id = 300 + i
  const t = requests.rows[(i * 3) % requests.rows.length]
  // по заявке в день, от 29 марта 2018 назад
  const d = new Date(2018, 2, 29 - i)
  return {
    id,
    cs: fixClient(t[3], +t[0] + i),
    u: t[5],
    n: [1, 2, 5, 10, 30, 100][rnd(id, 1) % 6],
    ch: [2, 4, 8, 30][rnd(id, 2) % 4],
    iface: pick(IFACES, id, 3),
    city: pick(CITY, t[3], 14),
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    st: (["dr", "rv", "n", "w", "d", "d", "d", "r"] as State[])[rnd(id, 4) % 8],
    annul: rnd(id, 9) % 6 === 0,
  }
})

const state = (x: NumberRequest) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const made = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: (string | number)[]): Option[] => list.map((v) => ({ v: String(v), label: String(v) }))
const staffOpts: Option[] = [...new Set(ALL.map((x) => x.u))].map((v) => ({ v, label: managerName(v) }))
const save = (x: NumberRequest) => rowsStore.save(NUMBER_CAPACITY, x)

function record(x: NumberRequest) {
  const final = FINAL.includes(x.st)
  const params = [
    { t: "Контрагент", v: counterpartyName(x.cs), wide: true },
    { t: "Количество номеров", v: x.n },
    { t: "Количество каналов", v: x.ch },
    { t: "Интерфейс АТС", v: x.iface },
    { t: "Уровень доступа", v: "Город + МГ" },
    { t: "Номерная группа", v: x.st === "d" ? `7172 ${(rnd(x.id, 5) % 90) + 10}-XX-XX` : "—" },
    { t: "Инициатор", v: managerName(x.u) },
    { t: "Город", v: x.city },
  ]
  return {
    title: `Заявка на номера № ${x.id}`,
    meta: (
      <>
        {state(x)}
        <Pill>{x.annul ? "Аннулирование" : "Выделение"}</Pill>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
      </>
    ),
    actions: final
      ? []
      : [
          { icon: CircleCheck, label: "В работу", apply: () => ({ ...x, st: "w" as State }) },
          { icon: CircleCheck, label: "Исполнить", apply: () => ({ ...x, st: "d" as State }) },
          {
            icon: Undo2,
            label: "Отозвать заявку",
            run: () => {
              if (x.st !== "dr" && x.st !== "rv") return void toast("Отозвать можно только черновик или заявку на рассмотрении")
              save({ ...x, st: "rc" })
              toast("Заявка отозвана", () => save(x))
            },
          },
        ],
    stats: [
      { t: "Номеров", v: x.n },
      { t: "Каналов", v: x.ch },
      { t: "Интерфейс", v: x.iface },
      { t: "Дата", v: <DateCell d={x.date} /> },
    ],
    facts: params.filter((p) => !p.wide),
    tabs: [
      {
        t: "Заявка",
        body: (
          <>
            {x.annul && (
              <Banner icon={TriangleAlert} title="Аннулирование создано автоматически" fresh>
                Для точки подключения оформлен наряд на отключение — номера из исходной заявки будут аннулированы.
              </Banner>
            )}
            {final && (
              <Banner icon={Lock} tone="blue" title="Финальный статус">
                Поля заблокированы.
              </Banner>
            )}
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Чат",
        body: (
          <Section title="Чат по заявке">
            <Chat
              items={[
                { t: "Заявка создана", p: managerName(x.u), d: x.date },
                { t: "Уточнение", p: "Нужен ли выход на МН?", d: x.date },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Уведомления",
        fresh: true,
        body: (
          <Section title="Письма">
            <MailLine who={managerName(x.u)} what="заявка создана" d={x.date} />
            {x.st === "d" && <MailLine who={`${managerName(x.u)}, ОТУП ДИППП`} what="номера выделены · ЕСТУ обновлена" d={x.date} />}
          </Section>
        ),
      },
    ],
  }
}

export const NUMBER_CAPACITY: ListConfig<NumberRequest> = {
  key: "number-capacity",
  title: "Номерная ёмкость",
  crumb: "Заявки · Выделение телефонных номеров",
  icon: Hash,
  badge: "upd",
  req: "Доработано по требованиям ОТУП ДИППП: статусы Черновик / На рассмотрении, отзыв заявки, уведомления по e-mail, авто-заявка на аннулирование нумерации при наряде на отключение, синхронизация с ЕСТУ «Телефонная нумерация»",
  search: "Контрагент или город",
  foot: "пример данных: в копии базы таблица заявок на номера пустая",
  buttons: [{ icon: FilePlus, label: "Заявка на номера", href: "/number-capacity/new" }],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.city}`,
  tabs: [
    { k: "w", t: "Текущие", f: (x) => ["dr", "rv", "n", "w"].includes(x.st) },
    { k: "d", t: "Исполненные", f: (x) => x.st === "d" },
    { k: "a", t: "Все", f: () => true },
  ],
  sort: ["date", -1],
  cols: [
    {
      k: "id",
      t: "Заявка",
      value: (x) => x.id,
      render: (x) => <NameCell icon={Hash} name={`Заявка № ${x.id}`} sub={`${x.annul ? "Аннулирование · авто из наряда" : "Выделение"} · ${x.iface}`} />,
    },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "city", t: "Город", value: (x) => x.city, render: (x) => x.city },
    { k: "n", t: "Номеров", num: true, value: (x) => x.n, render: (x) => x.n },
    { k: "ch", t: "Каналов", num: true, value: (x) => x.ch, render: (x) => x.ch },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Инициатор", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Заявок", icon: Hash, c: made(r), p: Math.max(1, made(r) - 4) },
    { t: "Номеров выделено", icon: Phone, c: ALL.filter((x) => x.st === "d").reduce((a, x) => a + x.n, 0) },
    { t: "В работе", icon: Clock, c: ALL.filter((x) => x.st === "w" || x.st === "n").length },
    { t: "Каналов", icon: Layers, c: ALL.reduce((a, x) => a + x.ch, 0), note: "по всем заявкам" },
  ],
  sub: () => "Заявки на выделение городских номеров: количество, каналы, интерфейс АТС и назначенная номерная группа.",
  locked: (x) => FINAL.includes(x.st),
  record,
  name: (x) => `Заявка на номера № ${x.id}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: staffOpts[0].v, n: 1, ch: 2, iface: IFACES[0], city: CITY[1], date: "", st: "dr", annul: false }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0, date: x.date || todayLocal() }) },
    { k: "city", t: "Город", type: "select", opts: opts(CITY), get: (x) => x.city, set: (x, v) => ({ ...x, city: v }) },
    { k: "n", t: "Количество номеров", type: "select", opts: opts([1, 2, 5, 10, 30, 100]), get: (x) => String(x.n), set: (x, v) => ({ ...x, n: +v }) },
    { k: "ch", t: "Количество каналов", type: "select", opts: opts([2, 4, 8, 30]), get: (x) => String(x.ch), set: (x, v) => ({ ...x, ch: +v }) },
    { k: "u", t: "Инициатор", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    {
      k: "st",
      t: "Статус",
      type: "select",
      opts: (["dr", "rv"] as State[]).map((v) => ({ v, label: STATE[v][0], color: STATE[v][1] })),
      get: (x) => (x.st === "rv" ? "rv" : "dr"),
      // форма меняет только «Черновик / На рассмотрении»; дальше статус двигают действия карточки
      set: (x, v) => (x.st === "dr" || x.st === "rv" ? { ...x, st: v as State } : x),
    },
  ],
}
