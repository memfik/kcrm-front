import { Clock, Coins, Download, FileSignature, Plus, TrendingUp, TriangleAlert, Undo2 } from "lucide-react"
import { Banner, DateCell, Decision, Kv, NameCell, Owner, Section, Status, Timeline } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { fixClient } from "@/lib/demo-clients"
import { counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { shiftDate, TODAY } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { money, shortDate } from "@/lib/period"

/*
 * 42 Временное платное увеличение объёма (Предложения ТБ, п. 2): объём услуги по действующему договору на срок.
 * В копии базы таких записей нет — 56 собраны по заявкам ТВ/ТР (контрагент, менеджер), как в макете.
 * TODO: API — начисления в биллинге, напоминание за 5 дней, согласование ЗДК и ГЦ, автовозврат к условиям договора.
 */

type State = "act" | "soon" | "appr" | "back" | "ds"

export type TempIncrease = {
  id: number
  cs: number
  u: string
  /** Договор «123/КД-2017». */
  ctr: string
  serv: string
  /** Объём по договору и временный, Мбит/с. */
  base: number
  tmp: number
  start: string
  end: string
  term: number
  st: State
  /** Доплата в месяц, ₸. */
  price: number
}

const STATE: Record<State, [string, string]> = {
  act: ["Действует", "#34c759"],
  soon: ["Заканчивается", "#ff9f0a"],
  appr: ["Пролонгация на согласовании", "#5ac8fa"],
  back: ["Возврат к договору", "#8a93a6"],
  ds: ["Доп. соглашение", "#085eff"],
}
const SERVICES = ["Интернет", "VPN L2", "Аренда канала"]
const BASES = [20, 50, 100, 200]
const TERMS = [7, 14, 30, 60]

const daysTo = (d: string) => Math.round((Date.parse(d) - Date.parse(TODAY)) / 864e5)
/** Дней до окончания начислений; после окончания — отрицательное. */
const left = (x: TempIncrease) => daysTo(x.end)
/** Доплата — за разницу объёмов, тариф за Мбит/с у записи свой. */
const priceOf = (x: TempIncrease) => Math.max(0, x.tmp - x.base) * (900 + (rnd(x.id, 10) % 400))

const ALL: TempIncrease[] = Array.from({ length: 56 }, (_, i) => {
  const id = 1400 + i
  const t = requests.rows[(i * 13) % requests.rows.length]
  const base = BASES[rnd(id, 1) % 4]
  const start = shiftDate(TODAY, -(rnd(id, 3) % 60))
  const term = TERMS[rnd(id, 4) % 4]
  const end = shiftDate(start, term)
  const l = daysTo(end)
  let st: State = l < 0 ? (rnd(id, 5) % 2 ? "back" : "ds") : l <= 5 ? "soon" : "act"
  if (st === "soon" && rnd(id, 6) % 3 === 0) st = "appr"
  const x: TempIncrease = {
    id,
    cs: fixClient(t[3], id),
    u: t[5],
    ctr: `${(rnd(id, 7) % 900) + 100}/КД-20${16 + (rnd(id, 8) % 3)}`,
    serv: pick(SERVICES, id, 9),
    base,
    tmp: base * [2, 3, 5][rnd(id, 2) % 3],
    start,
    end,
    term,
    st,
    price: 0,
  }
  return { ...x, price: priceOf(x) }
})

const fin = (x: TempIncrease) => x.st === "back" || x.st === "ds"
const state = (x: TempIncrease) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const tenge = (n: number) => `${money(n)} ₸`
const volume = (x: TempIncrease) => `${x.base} → ${x.tmp} Мбит/с`
const opts = (list: readonly (string | number)[]): Option[] => list.map((v) => ({ v: String(v), label: String(v) }))
const staffOpts: Option[] = STAFF.slice(0, 24).map((v) => ({ v, label: managerName(v) }))

/** Окончание, статус и доплата — по датам и объёмам (новая запись, смена срока или объёма). */
const recalc = (x: TempIncrease) => {
  const y = { ...x, end: x.start ? shiftDate(x.start, x.term) : "", price: priceOf(x) }
  return y.start && !fin(y) && y.st !== "appr" ? { ...y, st: (left(y) <= 5 ? "soon" : "act") as State } : y
}

/** Решение менеджера — с отменой. */
function decide(x: TempIncrease, st: State, msg: string) {
  if (fin(x)) return void toast("Увеличение уже завершено — решение принято")
  rowsStore.save(TEMP_INCREASE, { ...x, st })
  toast(msg, () => rowsStore.save(TEMP_INCREASE, x))
}
const decisions = (x: TempIncrease) =>
  [
    { t: "Вернуться к договору", label: "Вернуться к договору", icon: Undo2, p: `${x.base} Мбит/с с ${shortDate(x.end)}`, st: "back", msg: "Услуга вернётся к условиям основного договора" },
    { t: "Пролонгировать", label: "Пролонгировать", icon: Clock, p: "Согласование ЗДК и стоимости — ГЦ", st: "appr", msg: "Пролонгация отправлена на согласование ЗДК и ГЦ" },
    { t: "Доп. соглашение", label: "Заключить доп. соглашение", icon: FileSignature, p: "Новое КП и новая модель начислений", st: "ds", msg: "Процесс возвращён к формированию КП для доп. соглашения" },
  ] as const

function record(x: TempIncrease) {
  const l = left(x)
  const title = `Увеличение · ${counterpartyName(x.cs)}`
  const params: BriefItem[] = [
    { t: "Договор", v: x.ctr },
    { t: "Услуга", v: x.serv },
    { t: "Базовый объём", v: `${x.base} Мбит/с` },
    { t: "Временный объём", v: `${x.tmp} Мбит/с` },
    { t: "Начало начислений", v: <DateCell d={x.start} />, s: shortDate(x.start) },
    { t: "Окончание начислений", v: <DateCell d={x.end} />, s: shortDate(x.end) },
    { t: "Доплата в месяц", v: tenge(x.price) },
    { t: "Условия возврата", v: "Автоматически к параметрам договора", wide: true },
  ]
  const ds = decisions(x)
  return {
    title,
    meta: (
      <>
        {state(x)}
        <span>{volume(x)}</span>
      </>
    ),
    actions: fin(x) ? [] : ds.map((d) => ({ icon: d.icon, label: d.label, run: () => decide(x, d.st, d.msg) })),
    // как в макете: числовые колонки (объём, доплата, осталось), затем поля карточки
    stats: briefStats(title, [{ t: "Объём", v: volume(x) }, { t: "Доплата в месяц", v: tenge(x.price) }, { t: "Осталось", v: l < 0 ? "—" : `${l} дн` }, ...params]),
    facts: briefFacts(params),
    tabs: [
      {
        t: "Увеличение",
        body: (
          <>
            {x.st === "soon" && (
              <Banner icon={TriangleAlert} title={`До окончания ${l} дн`}>
                Без решения услуга вернётся к {x.base} Мбит/с {shortDate(x.end)}.
              </Banner>
            )}
            <Section title="Решение менеджера">
              <Decision disabled={fin(x)} items={ds.map((d) => ({ t: d.t, p: d.p, onClick: () => decide(x, d.st, d.msg) }))} />
            </Section>
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Согласование",
        body: (
          <Section title="Пролонгация">
            {x.st === "appr" ? (
              <Timeline
                items={[
                  { t: "Запрошена пролонгация", p: managerName(x.u), d: shiftDate(x.end, -3) },
                  { t: "ЗДК / директор департамента ГО", p: "на согласовании", d: shiftDate(x.end, -3) },
                  { t: "Стоимость — ГЦ", p: "на согласовании", d: shiftDate(x.end, -3) },
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

export const TEMP_INCREASE: ListConfig<TempIncrease> = {
  key: "temp-increase",
  title: "Временное увеличение объёма",
  crumb: "Заявки · Временное платное увеличение",
  icon: TrendingUp,
  badge: "new",
  req: "Предложения ТБ, п. 2 — временное платное увеличение объёма услуг: срок, даты начала и окончания начислений, условия возврата; уведомление за 5 дней; пролонгация по согласованию ЗДК и ГЦ; доп. соглашение; автоматический возврат к условиям договора",
  search: "Контрагент, договор или менеджер",
  foot: "временные увеличения — пример данных: в копии базы их нет",
  buttons: [
    { icon: Plus, label: "Новое увеличение", href: "/temp-increase/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.ctr} ${managerName(x.u)}`,
  tabs: [
    { k: "act", t: "Действуют", f: (x) => x.st === "act" },
    { k: "soon", t: "Заканчиваются ≤ 5 дн", f: (x) => x.st === "soon" },
    { k: "appr", t: "На согласовании", f: (x) => x.st === "appr" },
    { k: "done", t: "Завершены", f: fin },
    { k: "a", t: "Все", f: () => true },
  ],
  sort: ["end", 1],
  cols: [
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <NameCell icon={TrendingUp} name={counterpartyName(x.cs)} sub={`Договор ${x.ctr}`} /> },
    { k: "serv", t: "Услуга", value: (x) => x.serv, render: (x) => x.serv },
    {
      k: "base",
      t: "Объём",
      num: true,
      value: (x) => x.base,
      render: (x) => (
        <>
          {x.base} → <b>{x.tmp}</b> Мбит/с
        </>
      ),
    },
    { k: "price", t: "Доплата в месяц", num: true, value: (x) => x.price, render: (x) => tenge(x.price) },
    { k: "start", t: "Начисления с", date: true, value: (x) => x.start, render: (x) => <DateCell d={x.start} /> },
    { k: "end", t: "по", date: true, value: (x) => x.end, render: (x) => <DateCell d={x.end} /> },
    {
      k: "left",
      t: "Осталось",
      num: true,
      value: left,
      render: (x) => (left(x) < 0 ? "—" : <b style={{ color: left(x) <= 5 ? "#ff9f0a" : undefined }}>{left(x)} дн</b>),
    },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (_r, _rp, rows) => [
    { t: "Действуют", icon: TrendingUp, c: rows.filter((x) => !fin(x)).length },
    { t: "Заканчиваются ≤ 5 дн", icon: TriangleAlert, c: rows.filter((x) => x.st === "soon").length },
    { t: "Доплата в месяц", icon: Coins, c: rows.filter((x) => !fin(x)).reduce((a, x) => a + x.price, 0), f: tenge },
    { t: "Перешли в доп. соглашение", icon: FileSignature, c: rows.filter((x) => x.st === "ds").length },
  ],
  sub: () =>
    "Временное увеличение по действующему договору. За 5 дней до окончания CRM напоминает менеджеру. Без решения услуга автоматически возвращается к параметрам договора.",
  record,
  locked: fin,
  name: (x) => `Увеличение · ${counterpartyName(x.cs)}`,
  // начало начислений — при сохранении (сегодня в примере данных), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: staffOpts[0].v, ctr: "", serv: SERVICES[0], base: 50, tmp: 100, start: "", end: "", term: 14, st: "act", price: 0 }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => recalc({ ...x, cs: +v || 0, start: x.start || TODAY }) },
    { k: "serv", t: "Услуга", type: "select", opts: opts(SERVICES), get: (x) => x.serv, set: (x, v) => ({ ...x, serv: v }) },
    { k: "base", t: "Объём по договору, Мбит/с", type: "select", opts: opts(BASES), get: (x) => String(x.base), set: (x, v) => recalc({ ...x, base: +v || x.base }) },
    { k: "start", t: "Начало начислений", type: "date", get: (x) => x.start, set: (x, v) => recalc({ ...x, start: v }) },
    { k: "u", t: "Менеджер", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
