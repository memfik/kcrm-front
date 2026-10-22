import { ClipboardCheck, Clock, CircleCheck, Download, ExternalLink, List, MapPin, Users } from "lucide-react"
import { DateCell, Dash, Kv, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import requests from "@/data/tech-requests-demo.json"
import { fixClient } from "@/lib/demo-clients"
import { counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES, CATEGORIES, CATEGORIES_SHORT, shiftDate, TODAY, TV_SERVICES } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange, shortDate } from "@/lib/period"

/*
 * 38 Реестр заявок КТС-РФ-ДППП-26 (ОТПП ТК ДИППП, п. 18) — все локальные и централизованные заявки на ТВ и ТР.
 * 240 строк собраны по заявкам ТВ/ТР копии базы, как в макете. Текущий пользователь — сотрудник ОТПП ТК ДИППП (пример).
 * TODO: API — реестр по заявкам (09), права (сотрудник — делегированные ему, начальник — весь отдел), выгрузка по форме.
 */

type Res = "yes" | "no" | "work" | "back" | "cancel" | "new"

export type RegistryRow = {
  id: number
  num: string
  date: string
  cat: number
  /** Заказчик услуг и конечный клиент. */
  cust: number
  end: number
  pts: number
  serv: string
  /** Подразделение-инициатор и филиал. */
  from: string
  br: string
  /** Исполнитель и его отдел. */
  ex: string
  dep: string
  center: number
  tender: boolean
  res: Res
  /** Дата ответа ("" — ещё нет). */
  ans: string
  tr: string
}

const STAFF24 = STAFF.slice(0, 24)
const ME = STAFF24[3]
const MY_DEP = "ОТПП ТК ДИППП"
const RES: Record<Res, [string, string]> = {
  yes: ["ТВ есть", "#34c759"],
  no: ["ТВ нет", "#ff375f"],
  work: ["В работе", "#085eff"],
  back: ["На доработке", "#ff9f0a"],
  cancel: ["Отменено", "#8a93a6"],
  new: ["Новая", "#5ac8fa"],
}

const ALL: RegistryRow[] = Array.from({ length: 240 }, (_, i) => {
  const id = 27000 + i
  const t = requests.rows[(i * 3) % requests.rows.length]
  const date = shiftDate(TODAY, -Math.floor(i * 1.6))
  const r = rnd(id, 1) % 10
  const res: Res = r < 4 ? "yes" : r < 6 ? "no" : r < 8 ? "work" : r < 9 ? "back" : "cancel"
  return {
    id,
    num: String(id),
    date,
    cat: rnd(id, 6) % 6,
    cust: fixClient(t[3], id),
    end: rnd(id, 7) % 3 === 0 ? fixClient(requests.rows[(i * 11) % requests.rows.length][3], id + 1) : fixClient(t[3], id),
    pts: 1 + (rnd(id, 8) % (rnd(id, 9) % 4 === 0 ? 12 : 3)),
    serv: pick(TV_SERVICES, id, 10),
    from: pick(["ОРиП ФО", "КБ ФО", "ДКП", "ДПЛО", "ДМПО", "СТС"], id, 11),
    br: pick(BRANCHES, id, 12),
    ex: rnd(id, 2) % 5 === 0 ? ME : STAFF24[rnd(id, 3) % STAFF24.length],
    dep: rnd(id, 4) % 3 === 0 ? MY_DEP : pick(["ОРиП ФО", "ОУСД ФО", MY_DEP], id, 5),
    center: rnd(id, 13) % 2,
    tender: rnd(id, 14) % 6 === 0,
    res,
    ans: res === "work" ? "" : shiftDate(date, 1 + (rnd(id, 15) % 6)),
    tr: res === "yes" ? `ТР-${(rnd(id, 16) % 400) + 100}` : "",
  }
})

const result = (x: RegistryRow) => <Status text={RES[x.res][0]} color={RES[x.res][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const answered = ALL.filter((x) => x.res === "yes" || x.res === "no")

function record(x: RegistryRow) {
  const title = `Заявка № ${x.num}`
  const items: BriefItem[] = [
    { t: "№ заявки", v: x.num },
    { t: "Дата поступления", v: <DateCell d={x.date} />, s: shortDate(x.date) },
    { t: "Категория", v: CATEGORIES[x.cat], wide: true },
    { t: "Заказчик услуг", v: counterpartyName(x.cust) },
    { t: "Конечный клиент", v: counterpartyName(x.end) },
    { t: "Количество точек", v: x.pts },
    { t: "Услуга", v: x.serv },
    { t: "Тип обработки", v: x.center ? "Централизованная" : "Локальная" },
    { t: "Инициатор", v: `${x.from} · ${x.br}` },
    { t: "Исполнитель", v: managerName(x.ex) },
    { t: "Отдел исполнителя", v: x.dep },
    { t: "Тендерная процедура", v: x.tender ? "Да" : "Нет" },
    { t: "Результат", v: result(x), s: RES[x.res][0] },
    { t: "Дата ответа", v: <DateCell d={x.ans || null} />, s: x.ans && shortDate(x.ans) },
    { t: "ТР", v: x.tr || "—" },
  ]
  return {
    title,
    meta: (
      <>
        {result(x)}
        <Pill>{CATEGORIES_SHORT[x.cat]}</Pill>
        <Pill>{counterpartyName(x.cust)}</Pill>
      </>
    ),
    actions: [
      { icon: ClipboardCheck, label: "Открыть заявку ТВ и ТР", href: "/tech-requests" },
      { icon: Users, label: "Делегировать", delegate: true },
    ],
    // числовая колонка «Точек», затем поля строки реестра, затем даты — как в макете
    stats: briefStats(title, [{ t: "Точек", v: x.pts }, ...items, { t: "Поступила", v: <DateCell d={x.date} />, s: shortDate(x.date) }]),
    facts: briefFacts(items),
    tabs: [
      {
        t: "Строка реестра",
        body: (
          <Section title="КТС-РФ-ДППП-26">
            <Kv items={items} />
          </Section>
        ),
      },
    ],
  }
}

export const TV_REGISTRY: ListConfig<RegistryRow> = {
  key: "tv-registry",
  title: "Реестр заявок КТС-РФ-ДППП-26",
  crumb: "Заявки · Реестр заявок на ТВ и ТР",
  icon: List,
  badge: "new",
  req: "ОТПП ТК ДИППП, п. 18 — рабочая форма «Реестр заявок КТС-РФ-ДППП-26»: все локальные и централизованные заявки; сотрудник видит делегированные ему, начальник — все заявки отдела; выгрузка по форме с фильтрами",
  search: "№, заказчик, конечный клиент или адрес",
  foot: "реестр — пример данных по заявкам ТВ/ТР",
  buttons: [
    { icon: Download, label: "Выгрузить по форме КТС-РФ-ДППП-26", onClick: "export" },
    { icon: ExternalLink, label: "Открыть в отдельной вкладке", run: () => void window.open(window.location.href, "_blank") },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.num} ${counterpartyName(x.cust)} ${counterpartyName(x.end)} ${x.serv}`,
  tabs: [
    { k: "me", t: "Мои заявки", f: (x) => x.ex === ME },
    { k: "dep", t: "Заявки отдела", f: (x) => x.dep === MY_DEP },
    { k: "a", t: "Все (начальник отдела)", f: () => true },
  ],
  filters: [
    { k: "cat", t: "Категория", get: (x) => String(x.cat), opts: CATEGORIES.map((label, i) => ({ v: String(i), label })) },
    {
      k: "center",
      t: "Тип",
      get: (x) => String(x.center),
      opts: [
        { v: "1", label: "Централизованная" },
        { v: "0", label: "Локальная" },
      ],
    },
    { k: "res", t: "Результат", get: (x) => x.res, opts: (Object.keys(RES) as Res[]).map((v) => ({ v, label: RES[v][0], color: RES[v][1] })) },
    { k: "br", t: "Филиал", get: (x) => x.br, opts: opts(BRANCHES) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "num", t: "№ заявки", value: (x) => +x.num, render: (x) => <NameCell icon={ClipboardCheck} name={`№ ${x.num}`} sub={CATEGORIES_SHORT[x.cat] + (x.tender ? " · тендер" : "")} /> },
    { k: "date", t: "Поступила", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "cust", t: "Заказчик услуг", value: (x) => counterpartyName(x.cust), render: (x) => <b className="font-semibold">{counterpartyName(x.cust)}</b> },
    { k: "end", t: "Конечный клиент", value: (x) => counterpartyName(x.end), render: (x) => (x.end === x.cust ? <span className="text-muted-foreground">тот же</span> : counterpartyName(x.end)) },
    { k: "pts", t: "Точек", num: true, value: (x) => x.pts, render: (x) => x.pts },
    { k: "serv", t: "Услуга", value: (x) => x.serv, render: (x) => x.serv },
    { k: "center", t: "Тип", value: (x) => x.center, render: (x) => <Pill>{x.center ? "Централиз." : "Локальная"}</Pill> },
    { k: "from", t: "Инициатор", value: (x) => `${x.from} · ${x.br}`, render: (x) => `${x.from} · ${x.br}` },
    { k: "ex", t: "Исполнитель", value: (x) => managerName(x.ex), render: (x) => owner(x.ex) },
    { k: "res", t: "Результат", value: (x) => x.res, render: result },
    { k: "ans", t: "Ответ", date: true, value: (x) => x.ans, render: (x) => <DateCell d={x.ans || null} /> },
    { k: "tr", t: "ТР", value: (x) => x.tr, render: (x) => x.tr || <Dash /> },
  ],
  owner: { t: "Исполнитель", get: (x) => x.ex, name: managerName, render: (x) => owner(x.ex), set: (x, ex) => ({ ...x, ex }) },
  kpis: (r, rp) => [
    { t: "Заявок в реестре", icon: List, c: ALL.filter((x) => inRange(x.date, r)).length, p: ALL.filter((x) => inRange(x.date, rp)).length },
    { t: "Мои в работе", icon: Clock, c: ALL.filter((x) => x.ex === ME && x.res === "work").length, note: "делегированы мне" },
    // прошлого периода по доле ТВ в примере нет — сравнение условное, как в макете
    { t: "ТВ есть", icon: CircleCheck, c: Math.round((answered.filter((x) => x.res === "yes").length / answered.length) * 100), p: 63, f: (v) => `${v}%` },
    { t: "Точек в заявках", icon: MapPin, c: ALL.filter((x) => inRange(x.date, r)).reduce((a, x) => a + x.pts, 0) },
  ],
  sub: () =>
    `Вы — ${managerName(ME)}, ${MY_DEP}. Во вкладке «Мои заявки» — делегированные вам; «Заявки отдела» и «Все» доступны начальнику отдела. Выгрузка повторяет форму КТС-РФ-ДППП-26 с учётом фильтров.`,
  record,
  cardStatus: "res",
  name: (x) => `Заявка № ${x.num}`,
}
