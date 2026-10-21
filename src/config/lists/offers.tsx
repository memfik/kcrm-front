import Link from "next/link"
import { CircleCheck, CircleDollarSign, Download, FileText, FilePlus, Percent, Printer, Signature, TrendingUp } from "lucide-react"
import { DateCell, Dash, Kv, NameCell, Owner, Section, Status, Timeline } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import raw from "@/data/offers-demo.json"
import { binOf, counterpartyName, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import { OFFERS, SUMS } from "@/lib/home-stats"
import type { ListConfig, Option } from "@/lib/list/types"
import { fmt, money, periodLabel, prevLabel, sumOf } from "@/lib/period"

/*
 * 05 Коммерческие предложения. Строки — последние 600 КП из копии базы kCRM;
 * позиции — из прейскуранта копии базы. TODO: API.
 * TODO: создание и правка КП — в Конструкторе КП (макет 28): /offers/new → /offer-builder, «Редактировать» → /offer-builder?kp=<id>.
 */

export type Offer = {
  id: number
  cs: number
  u: string
  deal: number
  date: string
  /** Согласовано. */
  act: number
  /** Позиций. */
  n: number
  /** Сумма, ₸. */
  s: number
}

const ALL: Offer[] = raw.offers.map(([id, cs, u, deal, date, act, n, s]) => ({ id: +id, cs: +cs, u, deal: +deal, date, act: +act, n: +n, s: +s }))
const BRANCHES = ["АФ", "АС", "ВФ", "ЗФ", "МФ", "УФ", "ЮФ", "КФ", "ШФ", "ГО-ДКП", "ГО-ДУКО"]

const tenge = (n: number) => `${money(n)} ₸`
type StatusKey = "ok" | "wait" | "off"
const statusOf = (x: Offer): StatusKey => (x.act ? "ok" : x.s ? "wait" : "off")
const STATUS: Record<StatusKey, [string, string]> = {
  ok: ["Согласовано", "#34c759"],
  wait: ["На согласовании", "#ff9f0a"],
  off: ["Черновик", "#8a93a6"],
}
const status = (x: Offer) => <Status text={STATUS[statusOf(x)][0]} color={STATUS[statusOf(x)][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const managerOpts: Option[] = [...new Set(raw.offers.map((o) => o[2]))].slice(0, 30).map((v) => ({ v, label: managerName(v) }))
const statusOpts: Option[] = (Object.keys(STATUS) as StatusKey[]).map((v) => ({ v, label: STATUS[v][0], color: STATUS[v][1] }))
const approvedShare = Math.round((ALL.filter((x) => x.act).length / ALL.length) * 100)

function record(x: Offer) {
  const client = (
    <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
      {counterpartyName(x.cs)}
    </Link>
  )
  const head = [
    { t: "Наименование клиента", v: x.cs ? client : counterpartyName(0), wide: true },
    { t: "БИН/ИИН", v: x.cs ? binOf(x.cs) : "—" },
    { t: "Менеджер клиента", v: managerName(x.u) },
    { t: "Филиал", v: pick(BRANCHES, x.cs, 3) },
    { t: "Валюта", v: "KZT" },
    { t: "Прейскурант", v: "версия 12" },
    { t: "Статус в биллинге", v: <Status text="Активный" color="#34c759" /> },
  ]
  const items = Array.from({ length: Math.max(1, Math.min(6, x.n)) }, (_, k) => {
    const [name, price] = raw.price[rnd(x.id, 20 + k) % raw.price.length]
    return { name: name.slice(0, 70), qty: (rnd(x.id, 30 + k) % 3) + 1, price: +price, disc: rnd(x.id, 40 + k) % 12 }
  })
  const th = "border-b border-border px-2.5 pb-2.5 text-left text-[11.5px] font-semibold tracking-[0.04em] text-[var(--faint)] uppercase first:pl-0 last:pr-0"
  const td = "border-b border-border px-2.5 py-3 align-top first:pl-0 last:pr-0 group-last:border-0"

  return {
    title: `КП № ${x.id}`,
    meta: (
      <>
        {status(x)}
        {[counterpartyName(x.cs), x.deal ? `Сделка № ${x.deal}` : "без сделки"].map((t) => (
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
      { icon: FileText, label: "Открыть конструктор", href: `/offer-builder?kp=${x.id}` },
      { icon: Printer, label: "Печать / PDF" },
      { icon: Percent, label: "Запрос скидки", href: `/discount-requests/new?kp=${x.id}` },
      { icon: Signature, label: "Сформировать договор", href: `/contract-builder?kp=${x.id}` },
    ],
    stats: [
      { t: "Сумма", v: x.s ? tenge(x.s) : <Dash /> },
      { t: "Позиций", v: x.n || <Dash /> },
      { t: "Дата", v: <DateCell d={x.date} /> },
    ],
    facts: head,
    tabs: [
      {
        t: "Позиции",
        body: (
          <>
            <Section title="Позиции из прейскуранта">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr>
                      <th className={th}>Услуга</th>
                      <th className={th}>Кол-во</th>
                      <th className={`${th} text-right`}>Цена</th>
                      <th className={th}>Скидка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, k) => (
                      <tr key={k} className="group">
                        <td className={td}>{it.name}</td>
                        <td className={`${td} tabular-nums`}>{it.qty}</td>
                        <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{fmt(it.price)} ₸</td>
                        <td className={`${td} tabular-nums`}>{it.disc}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="Итого">
              <Kv
                items={[
                  { t: "Ожидаемая стоимость", v: tenge(x.s) },
                  { t: "Согласованная стоимость", v: tenge(x.s * 0.94) },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "Клиент",
        body: (
          <Section title="Шапка КП">
            <Kv items={head} />
          </Section>
        ),
      },
      {
        t: "История",
        body: (
          <Section title="Согласование">
            <Timeline
              items={[
                { t: "КП создано", p: managerName(x.u), d: x.date },
                { t: "Запрос на скидку", p: "Скидка выше допустимой", d: x.date },
                { t: x.act ? "Скидка подтверждена" : "Ожидает согласования", p: `Согласующий — ${managerName(String(+x.u + 11))}`, d: x.date },
              ]}
            />
          </Section>
        ),
      },
    ],
  }
}

const avg = (r: string[]) => sumOf(SUMS, r) / Math.max(1, sumOf(OFFERS, r))

export const OFFERS_LIST: ListConfig<Offer> = {
  key: "offers",
  title: "Коммерческие предложения",
  crumb: "Продажи · КП",
  icon: FileText,
  search: "№ КП, контрагент или менеджер",
  buttons: [
    { icon: FilePlus, label: "Создать КП", href: "/offer-builder" },
    { icon: Percent, label: "Запросы скидки", href: "/discount-requests" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `№${x.id} ${counterpartyName(x.cs)} ${managerName(x.u)}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "ok", t: "Согласовано", f: (x) => !!x.act },
    { k: "w", t: "На согласовании", f: (x) => !x.act && !!x.s },
    { k: "d", t: "Черновики", f: (x) => !x.s },
  ],
  filters: [{ k: "u", t: "Менеджер", get: (x) => x.u, opts: managerOpts }],
  sort: ["date", -1],
  cols: [
    { k: "id", t: "№ КП", value: (x) => x.id, render: (x) => <NameCell icon={FileText} name={`КП № ${x.id}`} sub={x.deal ? `Сделка № ${x.deal}` : "без сделки"} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "n", t: "Позиций", num: true, value: (x) => x.n, render: (x) => x.n || <Dash /> },
    { k: "s", t: "Сумма", num: true, value: (x) => x.s, render: (x) => (x.s ? tenge(x.s) : <Dash />) },
    { k: "act", t: "Статус", value: (x) => STATUS[statusOf(x)][0], render: status },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: (r, rp) => [
    { t: "КП выставлено", icon: FileText, c: sumOf(OFFERS, r), p: sumOf(OFFERS, rp) },
    { t: "Сумма КП", icon: CircleDollarSign, c: sumOf(SUMS, r), p: sumOf(SUMS, rp), f: tenge },
    { t: "Средний чек", icon: TrendingUp, c: avg(r), p: avg(rp), f: tenge },
    { t: "Согласовано", icon: CircleCheck, c: approvedShare, f: (v) => `${v}%`, note: "из последних 600 КП" },
  ],
  sub: (r, rp, p) => `Реестр коммерческих предложений. За ${periodLabel(p, r)} — сравнение ${prevLabel(p)} и с тем же периодом год назад.`,
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="КП по месяцам" series={OFFERS} r={r} p={p} /> },
  cardStatus: "act",
  record,
  name: (x) => `КП № ${x.id}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: managerOpts[0].v, deal: 0, date: "", act: 0, n: 1, s: 0 }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "deal", t: "№ сделки", type: "number", get: (x) => (x.deal ? String(x.deal) : ""), set: (x, v) => ({ ...x, deal: +v || 0 }) },
    { k: "u", t: "Менеджер", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "date", t: "Дата", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "n", t: "Позиций", type: "number", get: (x) => String(x.n), set: (x, v) => ({ ...x, n: +v || 0 }) },
    { k: "s", t: "Сумма, ₸", type: "number", get: (x) => (x.s ? String(x.s) : ""), set: (x, v) => ({ ...x, s: +v || 0 }) },
    { k: "act", t: "Согласование", type: "select", opts: statusOpts.filter((o) => o.v !== "off"), get: (x) => (x.act ? "ok" : "wait"), set: (x, v) => ({ ...x, act: v === "ok" ? 1 : 0 }) },
  ],
}
