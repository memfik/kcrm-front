import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, Calendar, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Clock, FilePlus, Users } from "lucide-react"
import { DateCell, Kv, NameCell, Owner, Section, Status } from "@/components/list/cells"
import { SmartLink } from "@/components/list/smart-link"
import raw from "@/data/tasks-demo.json"
import { counterpartyName, managerName, ownerColor, pick, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { MON } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 16 Календарь — события, встречи и напоминания (из задач копии базы за март–апрель 2018).
 * «Сегодня» в макете — 15 марта 2018. TODO: API, вид «Неделя».
 */

export type CalendarEvent = {
  id: number
  cs: number
  /** «YYYY-MM-DD HH:MM». */
  date: string
  /** Описание. */
  d: string
  u: string
  done: boolean
}

const TOPICS = ["Встреча с клиентом", "Звонок", "Подписание договора", "Планёрка отдела", "Выезд на объект", "Презентация услуг"]
const TODAY = "2018-03-15"
const TODAY_YM = { y: 2018, m: 2 }

const ALL: CalendarEvent[] = raw.tasks
  .filter(([, , date]) => date.startsWith("2018-03") || date.startsWith("2018-04"))
  .map(([id, cs, date, d, u]) => ({
    id: +id,
    cs: +cs,
    date,
    d: d && d.length > 3 && !/sss|тест/i.test(d) ? d.trim() : pick(TOPICS, id, 1),
    u,
    done: false,
  }))

const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const staffOpts: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))
const p2 = (n: number) => String(n).padStart(2, "0")

/** Сетка месяца (Пн–Вс): до трёх событий в дне, «ещё N»; клик по событию — карточка, по дню — новое событие. */
function MonthGrid({ rows, jump }: { rows: CalendarEvent[]; jump: number }) {
  const [ym, setYm] = useState(TODAY_YM)
  const todayRef = useRef<HTMLDivElement>(null)
  // «Перейти на сегодня»: месяц «сегодня», прокрутка к дню и короткая подсветка
  useEffect(() => {
    if (!jump) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ответ на нажатие кнопки шапки (jump), а не на рендер
    setYm(TODAY_YM)
    const raf = requestAnimationFrame(() => {
      const el = todayRef.current
      if (!el) return
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.animate([{ boxShadow: "inset 0 0 0 2px #085eff, 0 0 0 6px rgba(8,94,255,0.6)" }, { boxShadow: "inset 0 0 0 2px #085eff" }], { duration: 900 })
    })
    return () => cancelAnimationFrame(raf)
  }, [jump])
  const prefix = `${ym.y}-${p2(ym.m + 1)}`
  const byDay: Record<number, CalendarEvent[]> = {}
  rows
    .filter((x) => x.date.startsWith(prefix))
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .forEach((x) => (byDay[+x.date.slice(8, 10)] ??= []).push(x))
  const first = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
  const days = new Date(ym.y, ym.m + 1, 0).getDate()
  const shift = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))
  const nav = "grid size-[34px] cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-[var(--soft)] [&_svg]:size-4"

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.015em] first-letter:uppercase">
            {MON[ym.m]} {ym.y}
          </h3>
          <div className="mt-1 text-[13px] text-muted-foreground">Сегодня в макете — 15 марта</div>
        </div>
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-1">
          <button type="button" className={nav} aria-label="Предыдущий месяц" onClick={() => shift(-1)}>
            <ChevronLeft />
          </button>
          <span className="h-[34px] rounded-full bg-foreground px-3.5 text-[13px] leading-[34px] font-semibold text-background">Месяц</span>
          <button type="button" className={nav} aria-label="Следующий месяц" onClick={() => shift(1)}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 max-sm:gap-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => (
          <div key={w} className="px-2 text-xs text-muted-foreground">
            {w}
          </div>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1
          const list = byDay[d] ?? []
          const today = `${prefix}-${p2(d)}` === TODAY
          return (
            <div
              key={d}
              ref={today ? todayRef : undefined}
              className={cn(
                "flex min-h-24 flex-col gap-1 overflow-hidden rounded-[14px] bg-[var(--soft)] p-2 transition-colors hover:bg-[color-mix(in_srgb,#085eff_10%,var(--soft))] max-sm:min-h-16 max-sm:p-1",
                today && "shadow-[inset_0_0_0_2px_#085eff]"
              )}
            >
              <SmartLink href="/calendar/new" className="text-[13px] font-bold" title="Новое событие">
                {d}
              </SmartLink>
              {list.slice(0, 3).map((x) => (
                <Link
                  key={x.id}
                  href={`/calendar/${x.id}`}
                  title={x.d}
                  className={cn(
                    "truncate rounded-md bg-[color-mix(in_srgb,#085eff_16%,transparent)] px-1.5 py-0.5 text-[11px] max-sm:hidden",
                    x.done && "line-through opacity-60"
                  )}
                >
                  {x.date.slice(11)} {x.d}
                </Link>
              ))}
              {list.length > 3 && <i className="text-[11px] text-muted-foreground not-italic max-sm:hidden">ещё {list.length - 3}</i>}
              {list.length > 0 && <i className="hidden size-1.5 rounded-full bg-[#085eff] max-sm:block" />}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** «YYYY-MM-DD HH:MM» + 1 час. */
function nextHour(date: string) {
  const [d, t = "09:00"] = date.split(" ")
  const [y, m, dd] = d.split("-").map(Number)
  const [h, mi] = t.split(":").map(Number)
  const n = new Date(y, m - 1, dd, h + 1, mi)
  return `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())} ${p2(n.getHours())}:${p2(n.getMinutes())}`
}

export const CALENDAR: ListConfig<CalendarEvent> = {
  key: "calendar",
  title: "Календарь",
  crumb: "Планирование · Календарь событий",
  icon: Calendar,
  search: "Событие или клиент",
  buttons: [
    { icon: FilePlus, label: "Новое событие", href: "/calendar/new" },
    { icon: CalendarDays, label: "Перейти на сегодня", onClick: "analytics" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.d} ${counterpartyName(x.cs)}`,
  tabs: [
    { k: "3", t: "Март 2018", f: (x) => x.date.startsWith("2018-03") },
    { k: "4", t: "Апрель 2018", f: (x) => x.date.startsWith("2018-04") },
    { k: "a", t: "Все", f: () => true },
  ],
  sort: ["date", 1],
  cols: [
    { k: "date", t: "Когда", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "d", t: "Событие", value: (x) => x.d, render: (x) => <NameCell icon={Calendar} name={x.d} sub={x.cs ? counterpartyName(x.cs) : "внутреннее"} /> },
    { k: "u", t: "Автор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
  ],
  owner: { t: "Автор", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: () => [
    { t: "Событий в марте", icon: Calendar, c: ALL.filter((x) => x.date.startsWith("2018-03")).length, p: raw.tasks.filter(([, , d]) => d.startsWith("2018-02")).length },
    { t: "В апреле", icon: Clock, c: ALL.filter((x) => x.date.startsWith("2018-04")).length, note: "запланировано" },
    { t: "Встреч с клиентами", icon: Users, c: ALL.filter((x) => x.cs).length },
    // TODO: напоминания из API (в макете — 40% событий)
    { t: "Напоминаний", icon: Bell, c: Math.round(ALL.length * 0.4) },
  ],
  sub: () => "События, встречи и напоминания. Клик по дню — новое событие, по событию — подробности.",
  analytics: { title: "Месяц", tab: "Календарь", icon: CalendarDays, first: true, render: ({ rows, jump }) => <MonthGrid rows={rows} jump={jump} /> },
  noCards: true,
  record: (x) => {
    const info = [
      { t: "Когда", v: <DateCell d={x.date} /> },
      { t: "Автор", v: managerName(x.u) },
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
      { t: "Описание", v: x.d, wide: true },
    ]
    return {
      title: x.d,
      meta: (
        <>
          {x.done && <Status text="Исполнено" color="#34c759" />}
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            <DateCell d={x.date} />
          </span>
        </>
      ),
      actions: [
        ...(x.done ? [] : [{ icon: CircleCheck, label: "Исполнено", apply: () => ({ ...x, done: true }) }]),
        { icon: Clock, label: "Отложить на час", apply: () => ({ ...x, date: nextHour(x.date) }) },
      ],
      stats: [],
      facts: info.filter((i) => !i.wide),
      tabs: [
        {
          t: "Событие",
          body: (
            <Section title="Событие">
              <Kv items={info} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => x.d,
  blank: () => ({ id: 0, cs: 0, date: "", d: "", u: staffOpts[0].v, done: false }),
  fields: [
    { k: "d", t: "Событие", type: "text", required: true, wide: true, get: (x) => x.d, set: (x, v) => ({ ...x, d: v.trim() }) },
    { k: "u", t: "Автор", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
