import { CircleCheck, CircleX, Clock, Download, FilePlus, FileText, Globe, Link as LinkIcon, Paperclip, RefreshCw, Users, Wrench } from "lucide-react"
import { Banner, DateCell, Flow, Kv, Line, MiniTable, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import requests from "@/data/tech-requests-demo.json"
import { fixClient } from "@/lib/demo-clients"
import { CITY, counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES } from "@/lib/dippp"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"
import { todayLocal } from "@/lib/today"

/*
 * 10 Наряды на работы. Доработано по требованиям ОТУП ДИППП и ТБ.
 * В копии базы таблица нарядов пустая — 180 нарядов собраны из заявок ТВ/ТР (контрагент, сделка, инициатор), как в макете. TODO: API.
 */

type State = "new" | "w" | "d" | "na" | "rej"

export type WorkOrder = {
  id: number
  num: string
  type: string
  cs: number
  deal: number
  /** Инициатор и исполнитель. */
  u: string
  ex: string
  /** Подразделение. */
  br: string
  date: string
  st: State
  /** Централизованная обработка. */
  center: number
  cat: "Стандартный" | "Нестандартный"
  /** Плановый и фактический срок, дн (0 — ещё в работе). */
  plan: number
  fact: number
}

const TYPES = ["Подключение", "Отключение", "Приостановка", "Возобновление", "Тестовое подключение", "Изменение маршрутизации", "Изменение IP-адресации", "Увеличение", "Уменьшение", "Перенос", "Изменение технологии", "Переоформление"]
const STATE: Record<State, [string, string]> = {
  new: ["Не направлен", "#8a93a6"],
  w: ["В работе", "#085eff"],
  d: ["Выполнено", "#34c759"],
  na: ["Выполнен, акт не приложен", "#ff9f0a"],
  rej: ["Отклонено", "#ff375f"],
}
/** Шаг маршрута «Согласование → Утверждение → Исполнение → Перевод → Исполнено», на котором стоит наряд. */
const STEP: Record<State, number> = { new: 0, w: 2, d: 5, na: 4, rej: 1 }
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: WorkOrder[] = Array.from({ length: 180 }, (_, i) => {
  const id = 4100 + i
  const t = requests.rows[i % requests.rows.length]
  // по 3 наряда в день, от 30 марта 2018 назад
  const d = new Date(2018, 2, 30 - Math.floor(i / 3))
  const s = rnd(id, 1) % 10
  return {
    id,
    num: `Н-${18000 + i}`,
    type: TYPES[rnd(id, 2) % TYPES.length],
    cs: fixClient(t[3], +t[0] + i),
    deal: +t[4],
    u: t[5],
    ex: STAFF[rnd(id, 3) % STAFF.length],
    br: pick(BRANCHES, id, 4),
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    st: s < 4 ? "w" : s < 7 ? "d" : s < 8 ? "na" : s < 9 ? "rej" : "new",
    center: rnd(id, 5) % 2,
    cat: rnd(id, 6) % 4 === 0 ? "Нестандартный" : "Стандартный",
    plan: 5 + (rnd(id, 7) % 10),
    fact: s < 4 || s >= 9 ? 0 : 4 + (rnd(id, 8) % 14),
  }
})

const state = (x: WorkOrder) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const jobOrder = (x: WorkOrder) => `НЗ-${3000 + (x.id % 130)}`
const done = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const centerOpts: Option[] = [
  { v: "1", label: "Централизованная" },
  { v: "0", label: "Локальная" },
]
const catOpts = opts(["Стандартный", "Нестандартный"])
const staffOpts: Option[] = STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))

function record(x: WorkOrder) {
  const speed = [20, 50, 100][rnd(x.id, 6) % 3]
  const step = STEP[x.st]
  const main = [
    { t: "Клиент", v: counterpartyName(x.cs), wide: true },
    { t: "Договор", v: `${(rnd(x.id, 3) % 900) + 100}/КД-2018` },
    { t: "Лицевой счёт", v: String(rnd(x.id, 4)).slice(0, 8) },
    { t: "Инициатор", v: managerName(x.u) },
    { t: "Координатор", v: managerName(x.ex) },
    { t: "Адрес работ", v: `${pick(CITY, x.cs, 14)}, ${pick(["пр. Абая", "ул. Кунаева", "пр. Республики"], x.cs, 21)} ${(rnd(x.cs, 22) % 200) + 1}`, wide: true },
    { t: "Идентификатор УС", v: `${pick(["ast", "alm", "krg"], x.cs, 1)}0${(rnd(x.cs, 2) % 90) + 10}.01` },
  ]
  const terms = [
    { t: "Категория", v: x.cat },
    { t: "Плановый срок", v: `${x.plan} дн` },
    { t: "Фактический срок", v: x.fact ? `${x.fact} дн` : "в работе" },
    { t: "Отклонение", v: x.fact ? (x.fact > x.plan ? `+${x.fact - x.plan} дн — просрочка` : "в срок") : "—" },
    { t: "Контроль", v: `Главный инженер филиала ${x.br}` },
  ]

  return {
    title: `Наряд на ${x.type.toLowerCase()} · ${x.num}`,
    meta: (
      <>
        {state(x)}
        <Pill>{x.br}</Pill>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          <DateCell d={x.date} />
        </span>
      </>
    ),
    actions: [
      // маршрут: «Не направлен» → согласован и в работе; из отклонённого — снова в работу
      { icon: CircleCheck, label: "Согласовать", apply: () => ({ ...x, st: x.st === "new" || x.st === "rej" ? ("w" as State) : x.st }) },
      { icon: Users, label: "Выбрать исполнителя", delegate: true },
      { icon: Paperclip, label: "Приложить акт", apply: () => ({ ...x, st: x.st === "na" || x.st === "w" ? ("d" as State) : x.st }) },
    ],
    stats: [
      { t: "Тип работ", v: x.type },
      { t: "План / факт", v: x.fact ? `${x.plan} / ${x.fact} дн` : `${x.plan} дн / —` },
      { t: "Категория", v: x.cat },
      { t: "Дата", v: <DateCell d={x.date} /> },
    ],
    facts: main.filter((m) => !m.wide),
    tabs: [
      {
        t: "Маршрут",
        body: (
          <>
            {x.type === "Отключение" && (
              <Banner icon={RefreshCw} tone="blue" title="Созданы связанные заявки" fresh>
                Изъятие IP-адреса, смена статуса ID-канала в ЕСТУ и аннулирование номеров — по данным исходных заявок. Менеджеру придёт письмо после исполнения.
              </Banner>
            )}
            <Section title="Согласование">
              <Flow
                steps={["Согласование", "Утверждение", "Исполнение", "Перевод", "Исполнено"].map((code, k) => ({
                  code,
                  text: ["ГО-ДАРС", "ГО-ДИТ", x.br, "Биллинг", "—"][k],
                  state: k < step ? "done" : k === step ? "on" : "todo",
                }))}
              />
            </Section>
            <Section title="Основное">
              <Kv items={main} />
            </Section>
          </>
        ),
      },
      {
        t: "Связанные",
        fresh: true,
        body: (
          <Section title="Подтянуто при формировании (последние версии)">
            <Line icon={FileText}>
              <b>Наряд-заказ {jobOrder(x)}</b>
              <span className="flex-1" />
              <Pill>{x.center ? "Централизованный" : "Локальный"}</Pill>
            </Line>
            <Line icon={FileText}>
              <b>
                ТР-{(rnd(x.id, 20) % 400) + 100} · версия {1 + (rnd(x.id, 21) % 3)}
              </b>
              <span className="flex-1" />
              <Status text="последняя" color="#34c759" />
            </Line>
            <Line icon={FileText}>
              <b>
                КП № {3000 + (rnd(x.id, 22) % 900)} · версия {1 + (rnd(x.id, 23) % 4)}
              </b>
              <span className="flex-1" />
              <Status text="последняя" color="#34c759" />
            </Line>
            <Line icon={Globe}>
              <b>Заявка IP-{700 + (rnd(x.id, 24) % 120)}</b>
            </Line>
            {rnd(x.id, 25) % 2 ? (
              <Line icon={LinkIcon}>
                <b>ID-канал KZ-ALM-ETH-{100000 + (rnd(x.id, 26) % 899999)}</b>
              </Line>
            ) : null}
          </Section>
        ),
      },
      {
        t: "Сроки",
        fresh: true,
        body: (
          <Section title="Плановые и фактические сроки">
            <Kv items={terms} />
          </Section>
        ),
      },
      {
        t: "Услуги",
        body: (
          <>
            <Section title="Ежемесячные услуги">
              <MiniTable
                head={[{ t: "Услуга" }, { t: "Кол-во" }, { t: "Начало" }]}
                rows={[
                  [`Интернет ${speed} Мбит/с`, 1, <DateCell key="d" d={x.date} />],
                  ["Выделенный IP-адрес", (rnd(x.id, 7) % 4) + 1, <DateCell key="d" d={x.date} />],
                ]}
              />
            </Section>
            <Section title="Технические параметры">
              <Kv
                items={[
                  { t: "Пропускная способность", v: `${speed} Мбит/с` },
                  { t: "Выделенная подсеть", v: `/${30 - (rnd(x.id, 8) % 3)}` },
                  { t: "Оконечное оборудование", v: "MikroTik hEX" },
                  { t: "Кросс, пара", v: `${(rnd(x.id, 9) % 50) + 1}-${(rnd(x.id, 10) % 100) + 1}` },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "Документы",
        body: (
          <Section title="Документы">
            {["Акт выполненных работ", "Акт монтажа оборудования", "Разрешительные документы"].map((d, k) => (
              <Line key={d} icon={FileText}>
                <b>{d}</b>
                <span className="flex-1" />
                {k || x.st === "d" ? <Status text="Приложен" color="#34c759" /> : <Status text="Нет" color="#8a93a6" />}
              </Line>
            ))}
          </Section>
        ),
      },
    ],
  }
}

export const WORK_ORDERS: ListConfig<WorkOrder> = {
  key: "work-orders",
  title: "Наряды на работы",
  crumb: "Заявки · Наряды",
  icon: Wrench,
  badge: "upd",
  req: "Доработано по требованиям ОТУП ДИППП и ТБ: связь с наряд-заказом, стандартные / нестандартные наряды, плановые и фактические сроки, обязательное подтягивание последних версий ТР и КП, автоматические заявки на изъятие IP / смену статуса ID / аннулирование номеров при отключении",
  search: "№ наряда, контрагент или исполнитель",
  foot: "наряды — пример данных: в копии базы таблица нарядов пустая",
  buttons: [
    { icon: FilePlus, label: "Создать наряд", href: "/work-orders/new" },
    { icon: FileText, label: "Наряд-заказы", href: "/job-orders" },
    { icon: FileText, label: "Акт монтажа", href: "/install-acts" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.num} ${counterpartyName(x.cs)} ${x.type}`,
  tabs: [
    { k: "w", t: "Новые / в работе", f: (x) => x.st === "w" || x.st === "new" },
    { k: "d", t: "Исполнено", f: (x) => x.st === "d" || x.st === "na" },
    { k: "r", t: "Отклонено", f: (x) => x.st === "rej" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "type", t: "Тип работ", get: (x) => x.type, opts: opts(TYPES) },
    { k: "cat", t: "Категория", get: (x) => x.cat, opts: catOpts },
    { k: "center", t: "Обработка", get: (x) => String(x.center), opts: centerOpts },
    { k: "br", t: "Подразделение", get: (x) => x.br, opts: opts(BRANCHES) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "num", t: "Наряд", value: (x) => x.id, render: (x) => <NameCell icon={Wrench} name={x.num} sub={`${x.type} · из ${jobOrder(x)}`} /> },
    { k: "cat", t: "Категория", fresh: true, value: (x) => x.cat, render: (x) => (x.cat === "Нестандартный" ? <Status text="Нестандартный" color="#ff9f0a" /> : "Стандартный") },
    {
      k: "plan",
      t: "План / факт",
      fresh: true,
      value: (x) => x.fact - x.plan,
      render: (x) =>
        x.fact ? (
          <>
            {x.plan} / <b className={x.fact > x.plan ? "text-[#ff375f]" : "text-[#34c759]"}>{x.fact}</b> дн
          </>
        ) : (
          `${x.plan} дн / —`
        ),
    },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "deal", t: "Сделка", value: (x) => x.deal, render: (x) => (x.deal ? `№ ${x.deal}` : "—") },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "ex", t: "Исполнитель", value: (x) => managerName(x.ex), render: (x) => owner(x.ex) },
    { k: "br", t: "Подразд.", value: (x) => x.br, render: (x) => <Pill>{x.br}</Pill> },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Исполнитель", get: (x) => x.ex, name: managerName, render: (x) => owner(x.ex), set: (x, ex) => ({ ...x, ex }) },
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Нарядов", icon: Wrench, c: done(r), p: Math.round(done(r) * 1.12) },
    { t: "В работе", icon: Clock, c: ALL.filter((x) => x.st === "w").length, note: "у исполнителей" },
    { t: "Без акта", icon: FileText, c: ALL.filter((x) => x.st === "na").length, note: "выполнены, акт не приложен" },
    { t: "Отклонено", icon: CircleX, c: ALL.filter((x) => x.st === "rej").length, note: "на доработке" },
  ],
  sub: () =>
    "Наряд создаётся из наряд-заказа. Стандартные и нестандартные наряды — со своими сроками. 12 типов работ: подключение, отключение, перенос, изменение IP-адресации и другие. Маршрут: согласование → утверждение → исполнение.",
  record,
  name: (x) => `Наряд ${x.num}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, num: "", type: TYPES[0], cs: 0, deal: 0, u: staffOpts[0].v, ex: staffOpts[1].v, br: BRANCHES[0], date: "", st: "new", center: 1, cat: "Стандартный", plan: 7, fact: 0 }),
  fields: [
    { k: "cat", t: "Категория", type: "select", opts: catOpts, get: (x) => x.cat, set: (x, v) => ({ ...x, cat: v as WorkOrder["cat"] }) },
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "deal", t: "№ сделки", type: "number", get: (x) => (x.deal ? String(x.deal) : ""), set: (x, v) => ({ ...x, deal: +v || 0 }) },
    { k: "br", t: "Подразделение", type: "select", opts: opts(BRANCHES), get: (x) => x.br, set: (x, v) => ({ ...x, br: v }) },
    { k: "u", t: "Инициатор", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "ex", t: "Исполнитель", type: "select", opts: staffOpts, get: (x) => x.ex, set: (x, v) => ({ ...x, ex: v }) },
    { k: "plan", t: "Плановый срок, дн", type: "number", get: (x) => String(x.plan), set: (x, v) => ({ ...x, plan: +v || x.plan }) },
    { k: "date", t: "Дата", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date || todayLocal() }) },
  ],
}
