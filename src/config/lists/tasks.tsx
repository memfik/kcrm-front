import Link from "next/link"
import { Calendar, CircleCheck, CircleX, Clock, FilePlus, ListTodo, Users } from "lucide-react"
import { DateCell, Kv, NameCell, Owner, Section, Status } from "@/components/list/cells"
import { Chat } from "@/components/list/chat"
import { MonthChart } from "@/components/list/month-chart"
import raw from "@/data/tasks-demo.json"
import { counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { series, sumOf } from "@/lib/period"
import { todayLocal } from "@/lib/today"

/*
 * 15 Задачи и поручения. Строки — копия базы kCRM; тип и статус («в работе», «срок истёк») — заглушки по ID и сроку. TODO: API.
 */

type State = "new" | "work" | "done" | "late"

export type Task = {
  id: number
  cs: number
  /** Срок «YYYY-MM-DD HH:MM». */
  date: string
  /** Тема. */
  d: string
  /** Поручил и исполнитель. */
  u: string
  ex: string
  st: State
}

const TOPICS = [
  "Позвонить клиенту по продлению договора",
  "Подготовить КП на интернет 100 Мбит/с",
  "Встреча с ЛПР",
  "Отправить проект договора",
  "Согласовать скидку",
  "Проверить оплату счёта",
  "Собрать документы для тендера",
  "Уточнить адрес точки подключения",
]
const TYPES = ["На ознакомление", "К исполнению", "Срочное исполнение"]
const STATE: Record<State, [string, string]> = {
  new: ["Не начато", "#8a93a6"],
  work: ["В работе", "#085eff"],
  done: ["Исполнено", "#34c759"],
  late: ["Срок истёк", "#ff375f"],
}

const ALL: Task[] = raw.tasks.map(([id, cs, date, d, u, ex]) => ({
  id: +id,
  cs: +cs,
  date,
  // в копии базы у части задач тема пустая или тестовая
  d: d && !/sss|тест/i.test(d) ? d.trim() : pick(TOPICS, id, 1),
  u,
  ex: +ex ? ex : u,
  // статус в копии базы не хранится — по сроку относительно конца марта 2018
  st: date < "2018-03-20" ? (rnd(id, 2) % 6 ? "done" : "late") : rnd(id, 3) % 3 ? "new" : "work",
}))

const typeOf = (x: Task) => TYPES[x.id % 3]
const status = (x: Task) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const BY_MONTH = series(raw.byMonth)
const staffOpts: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))
const actual = (x: Task) => x.st === "new" || x.st === "work"

/** Отложить на день: срок «YYYY-MM-DD HH:MM» + 1 день. */
function nextDay(date: string) {
  const [d, time] = date.split(" ")
  const [y, m, dd] = d.split("-").map(Number)
  const n = new Date(y, m - 1, dd + 1)
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}${time ? ` ${time}` : ""}`
}

export const TASKS: ListConfig<Task> = {
  key: "tasks",
  title: "Задачи",
  crumb: "Планирование · Задачи и поручения",
  icon: ListTodo,
  search: "Тема, клиент или исполнитель",
  buttons: [
    { icon: FilePlus, label: "Добавить задачу", href: "/tasks/new" },
    { icon: Calendar, label: "Календарь", href: "/calendar" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.d} ${counterpartyName(x.cs)} ${managerName(x.ex)}`,
  tabs: [
    { k: "w", t: "Актуальные", f: actual },
    { k: "l", t: "Просроченные", f: (x) => x.st === "late" },
    { k: "d", t: "Исполненные", f: (x) => x.st === "done" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [{ k: "ty", t: "Тип", get: typeOf, opts: TYPES.map((v, i) => ({ v, label: v, color: i === 2 ? "#ff375f" : undefined })) }],
  sort: ["date", -1],
  cols: [
    { k: "d", t: "Тема", value: (x) => x.d, render: (x) => <NameCell icon={ListTodo} name={x.d} sub={typeOf(x)} /> },
    { k: "u", t: "Поручил", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "cs", t: "Клиент", value: (x) => counterpartyName(x.cs), render: (x) => (x.cs ? <b className="font-semibold">{counterpartyName(x.cs)}</b> : <span className="text-[var(--faint)]">—</span>) },
    { k: "date", t: "Срок", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "ex", t: "Исполнитель", value: (x) => managerName(x.ex), render: (x) => owner(x.ex) },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: status },
  ],
  owner: { t: "Исполнитель", get: (x) => x.ex, name: managerName, render: (x) => owner(x.ex), set: (x, ex) => ({ ...x, ex }) },
  kpis: (r, rp) => {
    const done = ALL.filter((x) => x.st === "done").length
    const closed = done + ALL.filter((x) => x.st === "late").length
    return [
      { t: "Задач и событий", icon: ListTodo, c: sumOf(BY_MONTH, r), p: sumOf(BY_MONTH, rp) },
      { t: "Актуальные", icon: Clock, c: ALL.filter(actual).length },
      { t: "Просрочено", icon: CircleX, c: ALL.filter((x) => x.st === "late").length, note: "требуют внимания" },
      { t: "Исполнено вовремя", icon: CircleCheck, c: Math.round((done / Math.max(1, closed)) * 100), f: (v) => `${v}%` },
    ]
  },
  sub: () => "Поручения себе и коллегам, события календаря и чат по каждой задаче.",
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Задачи и события по месяцам" series={BY_MONTH} r={r} p={p} /> },
  record: (x) => {
    const params = [
      { t: "Тема", v: x.d, wide: true },
      { t: "Поручил", v: managerName(x.u) },
      { t: "Исполнитель", v: managerName(x.ex) },
      {
        t: "Клиент",
        wide: true,
        v: x.cs ? (
          <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            {counterpartyName(x.cs)}
          </Link>
        ) : (
          "—"
        ),
      },
      { t: "Срок", v: <DateCell d={x.date} /> },
      { t: "Тип", v: typeOf(x) },
    ]
    return {
      title: x.d,
      meta: (
        <>
          {status(x)}
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            срок <DateCell d={x.date} />
          </span>
        </>
      ),
      actions: [
        ...(x.st === "done" ? [] : [{ icon: CircleCheck, label: "Исполнено", apply: () => ({ ...x, st: "done" as State }) }]),
        // TODO: «Отложить» с выбором даты и напоминанием (в макете — диалог события)
        { icon: Clock, label: "Отложить", apply: () => ({ ...x, date: nextDay(x.date), st: x.st === "late" ? ("work" as State) : x.st }) },
        { icon: Users, label: "Переназначить", delegate: true },
      ],
      stats: [
        { t: "Срок", v: <DateCell d={x.date} /> },
        { t: "Тип", v: typeOf(x) },
        { t: "Статус", v: STATE[x.st][0] },
      ],
      facts: params.filter((p) => !p.wide),
      tabs: [
        {
          t: "Задача",
          body: (
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          ),
        },
        {
          t: "Чат",
          body: (
            <Section title="Чат по задаче">
              <Chat
                items={[
                  { t: "Задача поставлена", p: managerName(x.u), d: x.date },
                  { t: "Принято в работу", p: managerName(x.ex), d: x.date },
                  { t: "Комментарий", p: "Клиент просит перенести встречу на четверг", d: x.date },
                ]}
              />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => x.d,
  // срок по умолчанию — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, date: "", d: "", u: staffOpts[0].v, ex: staffOpts[0].v, st: "new" }),
  fields: [
    { k: "d", t: "Тема", type: "text", required: true, wide: true, get: (x) => x.d, set: (x, v) => ({ ...x, d: v.trim() }) },
    { k: "ex", t: "Исполнитель", type: "select", opts: staffOpts, get: (x) => x.ex, set: (x, v) => ({ ...x, ex: v }) },
    { k: "u", t: "Поручил", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "date", t: "Срок", type: "date", get: (x) => x.date.slice(0, 10), set: (x, v) => ({ ...x, date: v ? `${v}${x.date.slice(10) || " 18:00"}` : x.date || `${todayLocal()} 18:00` }) },
    { k: "cs", t: "ID клиента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
  ],
}
