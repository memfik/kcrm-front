import Link from "next/link"
import { Briefcase, CircleCheck, CircleDollarSign, Clock, FileCheck, FilePlus, FileText, Plus, Signature, Upload, Wrench } from "lucide-react"
import { DateCell, Dash, Flow, Kv, Line, NameCell, Owner, Section, Stage, Status, Timeline } from "@/components/list/cells"
import clients from "@/data/counterparties-demo.json"
import raw from "@/data/deals-demo.json"
import { CONTACT_NAMES, counterpartyName, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { delta, fmt, inRange, money, periodLabel, prevLabel, signed } from "@/lib/period"

/*
 * 04 Сделки. Строки — копия базы kCRM (до сентября 2017); суммы в копии пустые — оценка по услуге.
 * Сделку не удаляют, а расторгают: дата и причина из справочника deal_cancel_list. TODO: API.
 */

export type Deal = {
  id: number
  /** Родительская сделка — у доп. соглашения. */
  pid: number
  date: string
  cs: number
  u: string
  name: string
  serv: string
  exp: number
  fore: number
  fact: number
  fin: number
  succ: number
  /** Причина расторжения (0 — не расторгнута). */
  canc: number
  cancDate?: string
  stg: string
  acts: number
}

type StageInfo = { code: string; text: string; pct: number; color: string }
const STG: Record<string, StageInfo> = Object.fromEntries(raw.stages.map(([id, code, text, pct, color]) => [id, { code, text, pct: +pct, color }]))
const stageOf = (id: string) => STG[id] ?? STG["0"]

const SERV = ["Интернет 100 Мбит/с", "IP-телефония", "Аренда канала L2", "VPN между филиалами", "SIP-транк 30 линий", "Хостинг", "Интернет 50 Мбит/с", "Видеонаблюдение"]
const REASONS: Option[] = raw.cancel.map(([v, label]) => ({ v, label }))

// В копии базы почти все сделки висят на тестовом контрагенте 22291 — раскидываем по реальным.
const fixClient = (cs: string, seed: string) => (cs === "22291" ? +clients[rnd(seed, 55) % clients.length][0] : +cs)

const ALL: Deal[] = raw.deals.map((d) => {
  const [id, pid, date, cs, u, name, exp, fore, fact, fin, succ, canc, stg, acts] = d
  const x: Deal = {
    id: +id,
    pid: +pid,
    date,
    cs: fixClient(cs, id),
    u,
    name: name || "Сделка",
    serv: pick(SERV, id, 3),
    exp: +exp,
    fore: +fore,
    fact: +fact,
    fin: +fin,
    succ: +succ,
    canc: +canc,
    stg: stg === "NULL" ? "0" : stg,
    acts: +acts,
  }
  if (!x.exp) x.exp = ((rnd(x.id, 4) % 90) + 12) * 10000
  if (!x.fore) x.fore = Math.round((x.exp * (stageOf(x.stg).pct || 10)) / 100)
  if (x.fin && !x.fact) x.fact = x.exp
  return x
})

const tenge = (n: number) => `${money(n)} ₸`
const inWork = (x: Deal) => !x.fin && !x.canc
const stage = (x: Deal, short = false) => {
  const s = stageOf(x.stg)
  return <Stage code={s.code} text={s.text} color={s.color} short={short} />
}
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const created = (r: string[]) => ALL.filter((x) => inRange(x.date, r))

const stageOpts: Option[] = raw.stages.map(([v, code, text, , color]) => ({ v, label: `${code} · ${text}`, color }))
const managerOpts: Option[] = [...new Set(raw.deals.map((d) => d[4]))].map((v) => ({ v, label: managerName(v) }))

/** Аналитика: сколько сделок сейчас на каждом этапе воронки. */
function Funnel() {
  const by: Record<string, number> = Object.fromEntries(raw.stages.map(([id]) => [id, 0]))
  ALL.forEach((x) => by[x.stg]++)
  const mx = Math.max(1, ...Object.values(by))
  return (
    <>
      <h3 className="text-[17px] font-bold tracking-[-0.015em]">Воронка сделок</h3>
      <div className="mt-1 text-[13px] text-muted-foreground">11 этапов kCRM · сколько сделок сейчас на каждом этапе</div>
      <div className="mt-4 grid h-[150px] grid-cols-11 items-end gap-2 max-sm:gap-1">
        {raw.stages.map(([id, code, text, , color]) => (
          <div key={id} title={text} className="flex h-full flex-col items-center justify-end gap-1.5">
            <b className="text-[13px] tabular-nums">{by[id]}</b>
            <div className="w-full rounded-lg" style={{ height: 8 + (by[id] / mx) * 90, background: color }} />
            <span className="text-center text-[11px] text-muted-foreground max-sm:text-[9px]">{code}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function record(x: Deal) {
  const s = stageOf(x.stg)
  const steps = raw.stages
    .filter(([id]) => +id > 0 && +id < 10)
    .map(([id, code, text, pct]) => ({ code, text, state: (id === x.stg ? "on" : +pct < s.pct ? "done" : "todo") as "on" | "done" | "todo" }))
  const client = (
    <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
      {counterpartyName(x.cs)}
    </Link>
  )
  const params = [
    { t: "Название", v: x.name, wide: true },
    { t: "Услуга", v: x.serv },
    { t: "Тип", v: x.pid ? "Доп. соглашение" : "Новая сделка" },
    { t: "Ожидание", v: tenge(x.exp) },
    { t: "Прогноз", v: tenge(x.fore) },
    { t: "Факт", v: x.fact ? tenge(x.fact) : "—" },
    { t: "Ответственный", v: managerName(x.u) },
    { t: "Контрагент", v: client, wide: true },
  ]
  const history = [
    { t: "Сделка создана", p: `Менеджер — ${managerName(x.u)}`, d: x.date },
    { t: "Первичная встреча", p: `ЛПР — ${CONTACT_NAMES[rnd(x.id, 30) % CONTACT_NAMES.length]}`, d: x.date },
    { t: "Заявка на ТВ и ТР", p: "ТВ имеется · ТР приложено", d: x.date },
    { t: "Коммерческое предложение", p: `${x.serv} · ${tenge(x.exp)}`, d: x.date },
  ].slice(0, Math.max(1, x.acts))
  const reason = REASONS.find((r) => +r.v === x.canc)

  return {
    title: x.name,
    meta: (
      <>
        {stage(x, true)}
        {x.canc ? <Status text="Расторгнута" color="#8a93a6" /> : null}
        {[`№ ${x.id}`, counterpartyName(x.cs)].map((t) => (
          <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            {t}
          </span>
        ))}
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          <DateCell d={x.date} />
        </span>
      </>
    ),
    actions: [
      { icon: Plus, label: "Добавить действие" },
      { icon: FileText, label: "Создать КП", href: `/offer-builder?deal=${x.id}` },
      { icon: FileCheck, label: "Заявка на ТВ и ТР", href: `/tech-requests/new?deal=${x.id}` },
      { icon: Signature, label: "Создать договор", href: `/contract-builder?deal=${x.id}` },
    ],
    stats: [
      { t: "Ожидание", v: tenge(x.exp) },
      { t: "Прогноз", v: tenge(x.fore) },
      { t: "Факт", v: x.fact ? tenge(x.fact) : <Dash /> },
      { t: "Создана", v: <DateCell d={x.date} /> },
    ],
    facts: params.filter((p) => p.t !== "Название"),
    tabs: [
      {
        t: "Этапы",
        body: (
          <>
            {reason && (
              <div className="mb-3 flex gap-3 rounded-2xl bg-[rgba(255,55,95,0.1)] px-4 py-3.5 text-[13.5px]">
                <div>
                  <b className="mb-0.5 block">Сделка расторгнута{x.cancDate ? ` ${x.cancDate.split("-").reverse().join(".")}` : ""}</b>
                  {reason.label}
                </div>
              </div>
            )}
            <Section title="Путь сделки">
              <Flow steps={steps} />
            </Section>
            <Section title="Действия">
              <Timeline items={history} />
            </Section>
          </>
        ),
      },
      {
        t: "Сделка",
        body: (
          <Section title="Параметры">
            <Kv items={params} />
          </Section>
        ),
      },
      {
        t: "ТВ и ТР",
        body: (
          <Section title="Заявка на ТВ и ТР">
            <Kv
              items={[
                { t: "Статус", v: <Status text="ТВ имеется" color="#34c759" /> },
                { t: "ТР", v: <Status text="Приложено" color="#085eff" /> },
                { t: "Тип", v: "ТК — телекоммуникации" },
                { t: "Исполнитель", v: managerName(String(+x.u + 3)) },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "КП",
        body: (
          <Section title="Коммерческое предложение">
            <Kv
              items={[
                { t: "Услуга", v: x.serv },
                { t: "Стоимость", v: tenge(x.exp) },
                { t: "Скидка", v: `${rnd(x.id, 9) % 15}%` },
                { t: "Статус", v: <Status text="Может быть отправлено клиенту" color="#34c759" />, wide: true },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Договор",
        body: (
          <Section title="Договор">
            <Kv
              items={[
                { t: "Тип договора", v: "Доходный · Новый" },
                { t: "Номер в LD", v: `${(rnd(x.id, 11) % 900) + 100}/КД-2017` },
                { t: "Дата договора", v: <DateCell d={x.date} /> },
                { t: "Текущая стоимость", v: tenge(x.exp) },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Наряды",
        body: (
          <Section title="Наряды по сделке">
            <Line icon={Wrench}>
              <b>Наряд на подключение №{(rnd(x.id, 12) % 9000) + 1000}</b>
              <span className="flex-1" />
              <Status text="В работе" color="#ff9f0a" />
            </Line>
          </Section>
        ),
      },
    ],
  }
}

const ANCHOR = "2017-08"

export const DEALS: ListConfig<Deal> = {
  key: "deals",
  title: "Сделки",
  crumb: "Продажи · Сделки",
  icon: Briefcase,
  search: "Название сделки, контрагент или № сделки",
  buttons: [
    { icon: FilePlus, label: "Новая сделка", href: "/deals/new" },
    { icon: Briefcase, label: "Доп. соглашение", href: "/deals/new" },
    { icon: Upload, label: "Импорт из файла", onClick: "import" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.name} ${counterpartyName(x.cs)} ${x.id} ${x.serv}`,
  tabs: [
    { k: "w", t: "В работе", f: inWork },
    { k: "d", t: "Завершённые", f: (x) => !!x.fin && !!x.succ },
    { k: "c", t: "Расторгнутые", f: (x) => !!x.canc || (!!x.fin && !x.succ) },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "stg", t: "Этап", get: (x) => x.stg, opts: stageOpts },
    { k: "u", t: "Менеджер", get: (x) => x.u, opts: managerOpts },
  ],
  sort: ["date", -1],
  cols: [
    {
      k: "name",
      t: "Сделка",
      value: (x) => x.name,
      render: (x) => <NameCell icon={Briefcase} name={x.name + (x.pid ? " · доп. соглашение" : "")} sub={`№ ${x.id} · ${x.serv}`} />,
    },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "stg", t: "Этап", value: (x) => stageOf(x.stg).pct, render: (x) => stage(x) },
    { k: "date", t: "Создана", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "exp", t: "Ожидание", num: true, value: (x) => x.exp, render: (x) => tenge(x.exp) },
    { k: "fore", t: "Прогноз", num: true, value: (x) => x.fore, render: (x) => tenge(x.fore) },
    { k: "fact", t: "Факт", num: true, value: (x) => x.fact, render: (x) => (x.fact ? tenge(x.fact) : <Dash />) },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  anchor: ANCHOR,
  kpis: (r, rp) => {
    const sum = (rows: Deal[]) => rows.reduce((a, x) => a + x.exp, 0)
    return [
      { t: "Новые сделки", icon: Briefcase, c: created(r).length, p: created(rp).length },
      { t: "Ожидаемая сумма", icon: CircleDollarSign, c: sum(created(r)), p: sum(created(rp)), f: tenge },
      { t: "В работе", icon: Clock, c: ALL.filter(inWork).length, note: "по всем этапам воронки" },
      {
        t: "Конверсия в договор",
        icon: CircleCheck,
        c: Math.round((ALL.filter((x) => stageOf(x.stg).pct >= 70).length / ALL.length) * 100),
        f: (v) => `${v}%`,
        note: "дошли до этапа «Договор»",
      },
    ]
  },
  sub: (r, rp, p) => {
    const c = created(r).length
    return `За ${periodLabel(p, r)} открыто ${fmt(c)} сделок, ${prevLabel(p, ANCHOR)} — ${signed(delta(c, created(rp).length))}. Сделки в копии базы — до сентября 2017 года, поэтому сводка за август 2017.`
  },
  analytics: { title: "Воронка", render: () => <Funnel /> },
  archive: {
    verb: "Расторгнуть",
    one: "сделку",
    many: "сделок",
    note: "Сделка перейдёт в «Расторгнутые». Дата и причина обязательны.",
    reasons: REASONS,
    apply: (x, reason, date) => ({ ...x, canc: +reason, cancDate: date }),
  },
  cardStatus: "stg",
  record,
  name: (x) => x.name,
  blank: () => ({
    id: 0,
    pid: 0,
    // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
    date: "",
    cs: 0,
    u: managerOpts[0].v,
    name: "",
    serv: SERV[0],
    exp: 0,
    fore: 0,
    fact: 0,
    fin: 0,
    succ: 0,
    canc: 0,
    stg: "1",
    acts: 1,
  }),
  fields: [
    { k: "name", t: "Сделка", type: "text", required: true, wide: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim() }) },
    { k: "cs", t: "ID контрагента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    {
      k: "pid",
      t: "Тип",
      type: "select",
      opts: [
        { v: "0", label: "Новая сделка" },
        { v: "1", label: "Доп. соглашение" },
      ],
      get: (x) => (x.pid ? "1" : "0"),
      set: (x, v) => ({ ...x, pid: v === "1" ? x.pid || 1 : 0 }),
    },
    { k: "serv", t: "Услуга", type: "select", opts: SERV.map((v) => ({ v, label: v })), get: (x) => x.serv, set: (x, v) => ({ ...x, serv: v }) },
    { k: "stg", t: "Этап", type: "select", opts: stageOpts, get: (x) => x.stg, set: (x, v) => ({ ...x, stg: v }) },
    { k: "u", t: "Менеджер", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "date", t: "Создана", type: "date", get: (x) => x.date.slice(0, 10), set: (x, v) => ({ ...x, date: v || x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "exp", t: "Ожидание, ₸", type: "number", get: (x) => (x.exp ? String(x.exp) : ""), set: (x, v) => ({ ...x, exp: +v || 0 }) },
    { k: "fore", t: "Прогноз, ₸", type: "number", get: (x) => (x.fore ? String(x.fore) : ""), set: (x, v) => ({ ...x, fore: +v || 0 }) },
  ],
}
