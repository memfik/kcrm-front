import { CircleCheck, Clock, Download, FileSignature, Plus, TriangleAlert, Users, X } from "lucide-react"
import { Banner, DateCell, Decision, Flow, Kv, MailLine, NameCell, Owner, Pill, Section, Status, Timeline } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { counterpartyName, fixClient, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES, shiftDate, TODAY, TV_SERVICES } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { shortDate } from "@/lib/period"

/*
 * 41 Тестовые подключения (Предложения ТБ, п. 1 и 3): тест как отдельный вид услуги — ТВ/ТР → КП → наряд без договора и начислений.
 * В копии базы тестов нет — 70 записей собраны по заявкам ТВ/ТР (контрагент, менеджер), как в макете.
 * TODO: API — напоминания за 5 дней, согласование пролонгации ЗДК, автоотключение и распоряжение отделу подключения.
 */

type State = "act" | "soon" | "appr" | "contract" | "off" | "prep"
type Cat = "B2G" | "B2B" | "B2C"

export type TestConnection = {
  id: number
  cs: number
  u: string
  serv: string
  speed: number
  cat: Cat
  /** Срочное — ускоренный SLA. */
  urg: boolean
  /** Срок теста, дней. */
  term: number
  start: string
  end: string
  st: State
  /** Срок пролонгации на согласовании, дней. */
  prol: number
  br: string
}

const STATE: Record<State, [string, string]> = {
  act: ["Активно", "#34c759"],
  soon: ["Заканчивается", "#ff9f0a"],
  appr: ["Пролонгация на согласовании", "#5ac8fa"],
  contract: ["Переход к договору", "#085eff"],
  off: ["Отключено", "#8a93a6"],
  prep: ["ТВ/ТР · КП · наряд", "#af52de"],
}
const CATS: Cat[] = ["B2G", "B2B", "B2C"]
const TERMS = [14, 30, 45, 60]
const SPEEDS = [20, 50, 100]

const daysTo = (d: string) => Math.round((Date.parse(d) - Date.parse(TODAY)) / 864e5)
/** Дней до окончания; после окончания — отрицательное. */
const left = (x: TestConnection) => daysTo(x.end)

/** Статус по датам — для новых записей и смены срока. */
const byDates = (x: TestConnection): State => (left(x) < 0 ? "off" : left(x) <= 5 ? "soon" : daysTo(x.start) > 0 ? "prep" : "act")
const withDates = (x: TestConnection) => {
  const y = { ...x, end: x.start ? shiftDate(x.start, x.term) : "" }
  return y.start && !fin(y) && y.st !== "appr" ? { ...y, st: byDates(y) } : y
}

const ALL: TestConnection[] = Array.from({ length: 70 }, (_, i) => {
  const id = 1200 + i
  const t = requests.rows[(i * 9) % requests.rows.length]
  const term = [14, 30, 30, 45, 60][rnd(id, 1) % 5]
  const start = shiftDate(TODAY, -(rnd(id, 2) % 70) + 10)
  const end = shiftDate(start, term)
  const l = daysTo(end)
  const cat = pick<Cat>(["B2G", "B2B", "B2B", "B2C"], id, 3)
  let st: State = l < 0 ? (rnd(id, 5) % 2 ? "off" : "contract") : l <= 5 ? "soon" : daysTo(start) > 0 ? "prep" : "act"
  if (st === "soon" && rnd(id, 6) % 3 === 0) st = "appr"
  return {
    id,
    cs: fixClient(t[3], id),
    u: t[5],
    serv: pick(TV_SERVICES, id, 7),
    speed: SPEEDS[rnd(id, 8) % 3],
    cat,
    urg: cat === "B2G" || rnd(id, 4) % 5 === 0,
    term,
    start,
    end,
    st,
    prol: st === "appr" ? term : 0,
    br: pick(BRANCHES, id, 9),
  }
})

const fin = (x: TestConnection) => x.st === "off" || x.st === "contract"
const live = (x: TestConnection) => x.st === "act" || x.st === "soon" || x.st === "appr"
const state = (x: TestConnection) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const service = (x: TestConnection) => `${x.serv} · ${x.speed} Мбит/с`
const opts = (list: readonly (string | number)[]): Option[] => list.map((v) => ({ v: String(v), label: String(v) }))
const staffOpts: Option[] = STAFF.slice(0, 24).map((v) => ({ v, label: managerName(v) }))

/** Решение менеджера по тесту — с отменой. */
function decide(x: TestConnection, st: State, msg: string) {
  if (fin(x)) return void toast("Тест уже завершён — решение принято")
  rowsStore.save(TEST_CONNECTIONS, { ...x, st, prol: st === "appr" ? x.term : x.prol })
  toast(msg, () => rowsStore.save(TEST_CONNECTIONS, x))
}
const DECISIONS = [
  { t: "Отключить", label: "Отключить услугу", icon: X, p: "Сформировать распоряжение на отключение", st: "off", msg: "Услуга будет отключена — сформировано распоряжение отделу подключения" },
  { t: "Пролонгировать", label: "Пролонгировать", icon: Clock, p: "Новый срок после согласования ЗДК", st: "appr", msg: "Запрос на пролонгацию отправлен ЗДК / директору департамента ГО" },
  { t: "Перейти к договору", label: "Перейти к договору", icon: FileSignature, p: "Вернуться к КП, затем подписание", st: "contract", msg: "Процесс возвращён на этап КП → подписание договора" },
] as const

function record(x: TestConnection) {
  const l = left(x)
  const params: BriefItem[] = [
    { t: "Вид услуги", v: "Тестовое подключение" },
    { t: "Услуга", v: service(x) },
    { t: "Категория клиента", v: x.cat },
    { t: "Срочность", v: x.urg ? "Срочное — ускоренный SLA" : "Стандартное" },
    { t: "Дата подключения", v: <DateCell d={x.start} />, s: shortDate(x.start) },
    { t: "Срок", v: `${x.term} дн` },
    { t: "Окончание", v: <DateCell d={x.end} />, s: shortDate(x.end) },
    { t: "Начисления в биллинге", v: "не формируются" },
    { t: "Филиал", v: x.br },
    { t: "Менеджер", v: managerName(x.u) },
  ]
  const step = (code: string, d: string, on = false) => ({ code, text: <DateCell d={d} />, state: on ? ("on" as const) : ("done" as const) })
  const remind = shiftDate(x.end, -5)
  return {
    title: `Тест · ${counterpartyName(x.cs)}`,
    meta: (
      <>
        {state(x)}
        <Pill>{x.serv}</Pill>
        <Pill>{x.cat + (x.urg ? " · срочное" : "")}</Pill>
      </>
    ),
    actions: fin(x) ? [] : DECISIONS.map((d) => ({ icon: d.icon, label: d.label, run: () => decide(x, d.st, d.msg) })),
    // как в макете: числовые колонки (срок, осталось), затем поля карточки
    stats: briefStats(`Тест · ${counterpartyName(x.cs)}`, [{ t: "Срок", v: `${x.term} дн` }, { t: "Осталось", v: l < 0 ? "—" : `${l} дн` }, ...params]),
    facts: briefFacts(params),
    tabs: [
      {
        t: "Тест",
        body: (
          <>
            {x.st === "soon" && (
              <Banner icon={TriangleAlert} title={`До окончания ${l} дн — нужно решение`}>
                Если не выбрать вариант, услуга отключится автоматически {shortDate(x.end)}.
              </Banner>
            )}
            {x.st === "appr" && (
              <Banner icon={Users} tone="blue" title="Пролонгация на согласовании">
                Ждёт решения ЗДК / директора департамента ГО.
              </Banner>
            )}
            <Section title="Решение менеджера">
              <Decision disabled={fin(x)} items={DECISIONS.map((d) => ({ t: d.t, p: d.p, onClick: () => decide(x, d.st, d.msg) }))} />
            </Section>
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Процесс",
        body: (
          <Section title="Этапы">
            <Flow
              steps={[
                step("ТВ / ТР", shiftDate(x.start, -9)),
                step("КП", shiftDate(x.start, -6)),
                step("Наряд", shiftDate(x.start, -3)),
                step("Подключено", x.start, x.st === "prep"),
                { code: "Договор", text: "пропускается", state: "todo" },
                step("Решение", x.end, !fin(x)),
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Уведомления",
        body: (
          <Section title="Напоминания за 5 дней">
            <MailLine who={managerName(x.u)} what="менеджер" d={remind} />
            <MailLine who="Отдел подключения ДИППП" what="исполнитель отключения" d={remind} />
            <MailLine who={`Главный инженер филиала ${x.br}`} what="контроль" d={remind} />
          </Section>
        ),
      },
      {
        t: "Согласование",
        body: (
          <Section title="Пролонгация">
            {x.st === "appr" || x.prol ? (
              <Timeline
                items={[
                  { t: `Запрошена пролонгация на ${x.prol || x.term} дн`, p: managerName(x.u), d: shiftDate(x.end, -4) },
                  { t: "На согласовании", p: "ЗДК / директор департамента ГО", d: shiftDate(x.end, -4) },
                ]}
              />
            ) : (
              <span className="text-muted-foreground">Пролонгацию не запрашивали</span>
            )}
          </Section>
        ),
      },
    ],
  }
}

export const TEST_CONNECTIONS: ListConfig<TestConnection> = {
  key: "test-connections",
  title: "Тестовые подключения",
  crumb: "Заявки · Тестовые подключения",
  icon: Clock,
  badge: "new",
  req: "Предложения ТБ, п. 1 и 3 — тестовое подключение как отдельный вид услуги: срок, дата подключения, срочность, категория клиента; проходит ТВ/ТР → КП → наряд без договора и без начислений; уведомление за 5 дней; решение менеджера; пролонгация по согласованию ЗДК; автоотключение",
  search: "Контрагент, услуга или менеджер",
  foot: "тестовые подключения — пример данных: в копии базы их нет",
  buttons: [
    { icon: Plus, label: "Новое тестовое подключение", href: "/test-connections/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.serv} ${managerName(x.u)}`,
  tabs: [
    { k: "act", t: "Активные", f: (x) => x.st === "act" || x.st === "prep" },
    { k: "soon", t: "Заканчиваются ≤ 5 дн", f: (x) => x.st === "soon" },
    { k: "appr", t: "На согласовании", f: (x) => x.st === "appr" },
    { k: "done", t: "Завершены", f: fin },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "cat", t: "Категория клиента", get: (x) => x.cat, opts: opts(CATS) },
    { k: "urg", t: "Срочность", get: (x) => (x.urg ? "1" : "0"), opts: [{ v: "1", label: "Срочное" }, { v: "0", label: "Стандартное" }] },
  ],
  sort: ["end", 1],
  cols: [
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <NameCell icon={Clock} name={counterpartyName(x.cs)} sub={service(x)} /> },
    { k: "cat", t: "Категория", value: (x) => x.cat, render: (x) => <Pill>{x.cat}</Pill> },
    { k: "urg", t: "Срочность", value: (x) => (x.urg ? "Срочное" : "Стандартное"), render: (x) => (x.urg ? <Status text="Срочное" color="#ff375f" /> : "Стандартное") },
    { k: "start", t: "Подключено", date: true, value: (x) => x.start, render: (x) => <DateCell d={x.start} /> },
    { k: "term", t: "Срок", num: true, value: (x) => x.term, render: (x) => `${x.term} дн` },
    { k: "end", t: "Окончание", date: true, value: (x) => x.end, render: (x) => <DateCell d={x.end} /> },
    {
      k: "left",
      t: "Осталось",
      num: true,
      value: left,
      render: (x) =>
        left(x) < 0 ? <span className="text-[var(--faint)]">—</span> : <b style={{ color: left(x) <= 5 ? "#ff9f0a" : undefined }}>{left(x)} дн</b>,
    },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (_r, _rp, rows) => {
    const done = rows.filter(fin).length
    return [
      { t: "Активных", icon: Clock, c: rows.filter(live).length },
      { t: "Заканчиваются ≤ 5 дн", icon: TriangleAlert, c: rows.filter((x) => x.st === "soon").length, note: "нужно решение менеджера" },
      { t: "На согласовании", icon: Users, c: rows.filter((x) => x.st === "appr").length, note: "ЗДК / директор департамента ГО" },
      // доля перешедших в договор среди завершённых; «было» — пример из макета
      { t: "Перешли в договор", icon: CircleCheck, c: Math.round((rows.filter((x) => x.st === "contract").length / Math.max(1, done)) * 100), p: 41, f: (v) => `${v}%` },
    ]
  },
  sub: () =>
    "Тестовое подключение проходит ТВ/ТР, КП и наряд, но без подписания договора и без начислений в биллинге. За 5 дней до окончания CRM напоминает менеджеру, отделу подключения ДИППП и главному инженеру филиала. Без решения услуга отключается автоматически.",
  record,
  locked: fin,
  name: (x) => `Тест · ${counterpartyName(x.cs)}`,
  // дата подключения — при сохранении (сегодня в примере данных), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: staffOpts[0].v, serv: TV_SERVICES[0], speed: 50, cat: "B2B", urg: false, term: 30, start: "", end: "", st: "prep", prol: 0, br: BRANCHES[0] }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => withDates({ ...x, cs: +v || 0, start: x.start || shiftDate(TODAY, 7) }) },
    { k: "serv", t: "Услуга", type: "select", opts: opts(TV_SERVICES), get: (x) => x.serv, set: (x, v) => ({ ...x, serv: v }) },
    { k: "speed", t: "Скорость, Мбит/с", type: "select", opts: opts(SPEEDS), get: (x) => String(x.speed), set: (x, v) => ({ ...x, speed: +v || x.speed }) },
    { k: "cat", t: "Категория клиента", type: "select", opts: opts(CATS), get: (x) => x.cat, set: (x, v) => ({ ...x, cat: v as Cat, urg: v === "B2G" || x.urg }) },
    { k: "urg", t: "Срочность", type: "select", opts: [{ v: "0", label: "Стандартное" }, { v: "1", label: "Срочное — ускоренный SLA" }], get: (x) => (x.urg ? "1" : "0"), set: (x, v) => ({ ...x, urg: v === "1" }) },
    { k: "start", t: "Дата подключения", type: "date", get: (x) => x.start, set: (x, v) => withDates({ ...x, start: v }) },
    { k: "term", t: "Срок, дней", type: "select", opts: opts(TERMS), get: (x) => String(x.term), set: (x, v) => withDates({ ...x, term: +v || x.term }) },
    { k: "br", t: "Филиал", type: "select", opts: opts(BRANCHES), get: (x) => x.br, set: (x, v) => ({ ...x, br: v }) },
    { k: "u", t: "Менеджер", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
