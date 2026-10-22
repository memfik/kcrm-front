import { Download, FileText, Globe, Hash, Link as LinkIcon, Plus, Route, TriangleAlert, Users, Wrench } from "lucide-react"
import { Banner, DateCell, Flow, Kv, Line, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { CITY, counterpartyName, fixClient, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES, shiftDate, STREETS, TODAY } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange, shortDate } from "@/lib/period"

/*
 * 44 Наряд-заказы (ОТУП ДИППП, модули «Формирование наряд-заказа» и «Наряд на работы»; предложения ТБ, пп. 4–8).
 * В копии базы наряд-заказов нет — 130 записей собраны по заявкам ТВ/ТР (контрагент, менеджер), как в макете.
 * TODO: API — подтягивание последних версий ТР и КП, заявок IP / ID-канала / номеров, маршрут исполнения, наряд в разделе «Наряды» (10).
 */

type State = "dr" | "ready" | "appr" | "wo"
type Kind = "Централизованный" | "Локальный"
type Cat = "Стандартный" | "Нестандартный"

export type JobOrder = {
  id: number
  num: string
  cs: number
  u: string
  work: string
  type: Kind
  cat: Cat
  /** Подключение через стороннего оператора. */
  so: boolean
  /** Подключение без подписанного договора — нужно согласование ЗДК. */
  noc: boolean
  st: State
  date: string
  /** Последние версии ТР и КП. */
  trv: number
  kpv: number
  /** Есть исполненные заявки на IP, ID-канал, номера. */
  ip: boolean
  idc: boolean
  tel: boolean
  br: string
  /** Номер наряда на работы. */
  wo: string
}

/** 13 видов работ (предложения ТБ). */
const WORKS = ["Подключение", "Приостановление", "Возобновление", "Отключение", "Тестовое подключение", "Изменение маршрутизации", "Изменение IP-адресации", "Увеличение", "Уменьшение", "Перенос", "Переоформление", "Смена технологии", "Отправка оборудования"]

const STATE: Record<State, [string, string]> = {
  dr: ["Черновик", "#8a93a6"],
  ready: ["Готов к наряду", "#5ac8fa"],
  appr: ["На согласовании", "#ff9f0a"],
  wo: ["Наряд сформирован", "#34c759"],
}
const FLOW: State[] = ["dr", "ready", "ready", "appr", "wo", "wo", "wo"]
const KINDS: Kind[] = ["Централизованный", "Локальный"]
const CATS: Cat[] = ["Стандартный", "Нестандартный"]
const ROUTE: Record<Kind, string[]> = {
  Централизованный: ["Курирующий менеджер", "ОТУП ДИППП (консолидатор ГО)", "Главный инженер филиала", "Исполнитель работ"],
  Локальный: ["Курирующий менеджер", "Главный инженер филиала", "Исполнитель работ"],
}

const ALL: JobOrder[] = Array.from({ length: 130 }, (_, i) => {
  const id = 6000 + i
  const t = requests.rows[(i * 7) % requests.rows.length]
  const noc = rnd(id, 3) % 9 === 0
  const st = FLOW[rnd(id, 4) % 7]
  return {
    id,
    num: `НЗ-${3000 + i}`,
    cs: fixClient(t[3], id),
    u: t[5],
    work: WORKS[rnd(id, 1) % WORKS.length],
    type: rnd(id, 5) % 2 ? "Централизованный" : "Локальный",
    cat: rnd(id, 6) % 4 === 0 ? "Нестандартный" : "Стандартный",
    so: rnd(id, 2) % 6 === 0,
    noc,
    st: noc && st === "wo" ? "appr" : st,
    date: shiftDate(TODAY, -Math.floor(i * 1.1)),
    trv: 1 + (rnd(id, 7) % 3),
    kpv: 1 + (rnd(id, 8) % 4),
    ip: rnd(id, 9) % 2 === 1,
    idc: rnd(id, 10) % 3 === 0,
    tel: rnd(id, 11) % 4 === 0,
    br: pick(BRANCHES, id, 12),
    wo: `Н-${18000 + i}`,
  }
})

const state = (x: JobOrder) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const docs = (x: JobOrder) => `ТР v${x.trv} · КП v${x.kpv}${x.ip ? " · IP" : ""}${x.idc ? " · ID" : ""}${x.tel ? " · №" : ""}`
/** «ТР v2 · КП v3 · IP · №» → версии и связанные заявки. */
const parseDocs = (x: JobOrder, v: string): JobOrder => ({
  ...x,
  trv: +(v.match(/ТР\s*v?(\d+)/i)?.[1] ?? x.trv),
  kpv: +(v.match(/КП\s*v?(\d+)/i)?.[1] ?? x.kpv),
  ip: /\bIP\b/i.test(v),
  idc: /\bID\b/i.test(v),
  tel: v.includes("№"),
})
const point = (x: JobOrder) => `${pick(CITY, x.id, 33)}, ${pick(STREETS, x.id, 31)}, ${(rnd(x.id, 32) % 180) + 1}`
const opts = (list: readonly string[]): Option[] => list.map((v) => ({ v, label: v }))
const staffOpts: Option[] = STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))
const done = <Status text="Исполнено" color="#34c759" />
const latest = <Status text="последняя" color="#34c759" />

/** Наряд на работы по наряд-заказу; без договора — сначала согласование ЗДК. */
function makeOrder(x: JobOrder) {
  if (x.st === "wo") return void toast(`Наряд ${x.wo} уже сформирован`)
  if (x.noc) return void toast("Нужно согласование ЗДК / директора департамента — подключение без договора")
  rowsStore.save(JOB_ORDERS, { ...x, st: "wo" as State })
  toast(`Сформирован черновик наряда ${x.wo} — связан с ${x.num}`, () => rowsStore.save(JOB_ORDERS, x))
}

function record(x: JobOrder) {
  const title = `${x.num} · ${x.work}`
  const params: BriefItem[] = [
    { t: "Контрагент", v: counterpartyName(x.cs) },
    { t: "Точка подключения", v: point(x), wide: true },
    { t: "Тип наряда", v: x.type },
    { t: "Вид работ", v: x.work },
    { t: "Категория", v: x.cat },
    { t: "Подключение через СО", v: x.so ? "Да" : "Нет" },
    { t: "Курирующий менеджер", v: managerName(x.u) },
    { t: "Филиал", v: x.br },
  ]
  const terms: BriefItem[] = [
    { t: "Категория", v: x.cat },
    { t: "Плановый срок", v: x.cat === "Нестандартный" ? "15 рабочих дней" : "5 рабочих дней" },
    { t: "Наряд", v: x.st === "wo" ? x.wo : "ещё не сформирован" },
  ]
  return {
    title,
    meta: (
      <>
        {state(x)}
        <Pill>{x.type}</Pill>
        <Pill>{x.cat}</Pill>
      </>
    ),
    actions: [
      { icon: Wrench, label: "Сформировать наряд", run: () => makeOrder(x) },
      { icon: Users, label: "Назначить исполнителя", delegate: true },
    ],
    // как в макете: поля всех вкладок, затем дата создания
    stats: briefStats(title, [...params, ...terms, { t: "Создан", v: <DateCell d={x.date} />, s: shortDate(x.date) }]),
    facts: briefFacts(params),
    tabs: [
      {
        t: "Наряд-заказ",
        body: (
          <>
            {x.noc && (
              <Banner icon={TriangleAlert} title="Подключение без подписанного договора">
                Требуется согласование директора департамента / ЗДК. Подключение — по логике тестового подключения; начисления по последней версии КП.
              </Banner>
            )}
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Документы",
        body: (
          <>
            <Section title="Подтянуто автоматически (последние версии)">
              <Line icon={FileText}>
                <b>
                  ТР-{(rnd(x.id, 20) % 400) + 100} · версия {x.trv}
                </b>
                <span className="flex-1" />
                {latest}
              </Line>
              <Line icon={FileText}>
                <b>
                  КП № {3000 + (rnd(x.id, 21) % 900)} · версия {x.kpv}
                </b>
                <span className="flex-1" />
                {latest}
              </Line>
              {x.ip && (
                <Line icon={Globe}>
                  <b>Заявка IP-{700 + (rnd(x.id, 22) % 120)}</b>
                  <span className="flex-1" />
                  {done}
                </Line>
              )}
              {x.idc && (
                <Line icon={LinkIcon}>
                  <b>ID-канал KZ-ALM-ETH-{100000 + (rnd(x.id, 23) % 899999)}</b>
                  <span className="flex-1" />
                  {done}
                </Line>
              )}
              {x.tel && (
                <Line icon={Hash}>
                  <b>Заявка на номера № {300 + (rnd(x.id, 24) % 80)}</b>
                  <span className="flex-1" />
                  {done}
                </Line>
              )}
            </Section>
            {x.so && (
              <Section title="Через стороннего оператора">
                <Kv
                  items={[
                    { t: "Маршрут согласований", v: "пройден ✓" },
                    { t: "Документы ТР / рентабельность", v: "приложены ✓" },
                    { t: "Контроль рентабельности", v: "не выполняется на этапе подключения", wide: true },
                  ]}
                />
              </Section>
            )}
          </>
        ),
      },
      {
        t: "Маршрут",
        body: (
          <>
            <Section title={`Маршрут исполнения · ${x.type}`}>
              <Flow
                steps={ROUTE[x.type].map((code, k) => ({
                  code,
                  text: k === 0 ? <DateCell d={x.date} /> : null,
                  state: x.st === "wo" ? (k < 2 ? "done" : k === 2 ? "on" : "todo") : k === 0 ? "on" : "todo",
                }))}
              />
            </Section>
            <Section title="Сроки">
              <Kv items={terms} />
            </Section>
          </>
        ),
      },
    ],
  }
}

export const JOB_ORDERS: ListConfig<JobOrder> = {
  key: "job-orders",
  title: "Наряд-заказы",
  crumb: "Заявки · Наряд-заказ → наряд на работы",
  icon: FileText,
  badge: "new",
  req: "ОТУП ДИППП, модули «Формирование наряд-заказа» и «Наряд на работы»; предложения ТБ, пп. 4–8 — тип Централизованный / Локальный со своим маршрутом, 13 видов работ, стандартные / нестандартные, подключение через СО, обязательное подтягивание последних версий ТР и КП",
  search: "№, контрагент или вид работ",
  foot: "наряд-заказы — пример данных: в копии базы их нет",
  buttons: [
    { icon: Plus, label: "Сформировать наряд-заказ", href: "/job-orders/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.num} ${counterpartyName(x.cs)} ${x.work}`,
  tabs: [
    { k: "w", t: "В работе", f: (x) => x.st !== "wo" },
    { k: "wo", t: "Наряд сформирован", f: (x) => x.st === "wo" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "type", t: "Тип", get: (x) => x.type, opts: opts(KINDS) },
    { k: "work", t: "Вид работ", get: (x) => x.work, opts: opts(WORKS) },
    { k: "cat", t: "Категория", get: (x) => x.cat, opts: opts(CATS) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "num", t: "Наряд-заказ", value: (x) => x.num, render: (x) => <NameCell icon={FileText} name={x.num} sub={x.work} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "type", t: "Тип", value: (x) => x.type, render: (x) => <Pill>{x.type}</Pill> },
    { k: "cat", t: "Категория", value: (x) => x.cat, render: (x) => (x.cat === "Нестандартный" ? <Status text="Нестандартный" color="#ff9f0a" /> : "Стандартный") },
    { k: "docs", t: "ТР · КП · IP · ID · №", value: docs, render: docs },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "date", t: "Создан", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    {
      k: "st",
      t: "Статус",
      value: (x) => STATE[x.st][0],
      render: (x) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {state(x)}
          {x.so && <Pill>через СО</Pill>}
          {x.noc && <Pill>без договора</Pill>}
        </span>
      ),
    },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: (r, rp, rows) => [
    { t: "Наряд-заказов", icon: FileText, c: rows.filter((x) => inRange(x.date, r)).length, p: rows.filter((x) => inRange(x.date, rp)).length },
    { t: "Централизованных", icon: Route, c: rows.filter((x) => x.type === "Централизованный").length },
    { t: "Нестандартных", icon: TriangleAlert, c: rows.filter((x) => x.cat === "Нестандартный").length },
    { t: "Ждут согласования", icon: Users, c: rows.filter((x) => x.st === "appr").length },
  ],
  sub: () =>
    "После ТР, КП и заявок на IP / ID-канал / номера менеджер формирует наряд-заказ. Последние версии ТР и КП подтягиваются обязательно. Для каждого типа — свой маршрут исполнения.",
  record,
  name: (x) => `Наряд-заказ ${x.num}`,
  blank: () => ({
    id: 0,
    num: "",
    cs: 0,
    u: staffOpts[0].v,
    work: WORKS[0],
    type: "Централизованный",
    cat: "Стандартный",
    so: false,
    noc: false,
    st: "dr",
    date: "",
    trv: 1,
    kpv: 1,
    ip: false,
    idc: false,
    tel: false,
    br: BRANCHES[0],
    wo: "",
  }),
  // как в макете: поля — колонки списка («Контрагент» — по ID, как в остальных разделах)
  fields: [
    {
      k: "num",
      t: "Наряд-заказ",
      type: "text",
      required: true,
      wide: true,
      get: (x) => x.num,
      // номер наряда — по id при сохранении новой записи
      set: (x, v) => ({ ...x, num: v.trim(), wo: x.wo || `Н-${18000 + x.id - 6000}` }),
    },
    { k: "cs", t: "ID контрагента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "type", t: "Тип", type: "select", opts: opts(KINDS), get: (x) => x.type, set: (x, v) => ({ ...x, type: v as Kind }) },
    { k: "cat", t: "Категория", type: "select", opts: opts(CATS), get: (x) => x.cat, set: (x, v) => ({ ...x, cat: v as Cat }) },
    { k: "docs", t: "ТР · КП · IP · ID · №", type: "text", get: (x) => (x.num ? docs(x) : ""), set: parseDocs },
    { k: "u", t: "Менеджер", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
    { k: "date", t: "Создан", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "st", t: "Статус", type: "select", opts: (Object.keys(STATE) as State[]).map((v) => ({ v, label: STATE[v][0], color: STATE[v][1] })), get: (x) => x.st, set: (x, v) => ({ ...x, st: v as State }) },
  ],
}
