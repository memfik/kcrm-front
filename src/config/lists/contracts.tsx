import Link from "next/link"
import { CircleDollarSign, CircleX, Download, Eye, FilePlus, FileText, Signature, Upload } from "lucide-react"
import { DateCell, Kv, MiniTable, NameCell, Owner, Pill, Section } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import raw from "@/data/contracts-demo.json"
import { binOf, CONTACT_NAMES, counterpartyName, managerName, ownerColor, rnd, STAFF } from "@/lib/demo-names"
import { CONTRACTS as CONTRACTS_BY_MONTH } from "@/lib/home-stats"
import type { ListConfig, Option } from "@/lib/list/types"
import { delta, fmt, inRange, money, periodLabel, prevLabel, signed, sumOf } from "@/lib/period"
import { CATALOG_ITEMS } from "./catalog"

/*
 * 25 Договоры — последние 500 договоров копии базы kCRM (всего в базе 2 896). Платежи — позиции прейскуранта. TODO: API, LD.
 */

export type Contract = {
  id: number
  num: string
  cs: number
  deal: number
  u: string
  /** Тип: 1 — доходный, 2 — расходный, 3 — доходно-расходный (прочие коды копии базы — как доходный, как в макете). */
  t: number
  date: string
  /** Существующий клиент. */
  cust: boolean
}

const TYPES = ["—", "Доходный", "Расходный", "Доходно-расходный"]
const ALL: Contract[] = raw.map(([id, num, cs, deal, u, t, date, cust]) => ({ id: +id, num: num || "б/н", cs: +cs, deal: +deal, u, t: +t, date, cust: cust === "1" }))

const typeOf = (x: Contract) => TYPES[x.t] || "Доходный"
const monthly = (x: Contract) => ((rnd(x.id, 1) % 300) + 15) * 1000
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const signedIn = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const managerOpts: Option[] = [...new Set(raw.map((c) => c[4]))].slice(0, 25).map((v) => ({ v, label: managerName(v) }))
const allManagers: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))
const link = "text-[#085eff] hover:underline dark:text-[#9db8ff]"

export const CONTRACTS: ListConfig<Contract> = {
  key: "contracts",
  title: "Договоры",
  crumb: "Справочники · Договоры",
  icon: Signature,
  search: "Номер договора или контрагент",
  buttons: [
    { icon: FilePlus, label: "Сформировать из КП", href: "/contract-builder" },
    // TODO: создание договора в LD
    { icon: Signature, label: "Создать договор в LD" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.num} ${counterpartyName(x.cs)} ${managerName(x.u)}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "i", t: "Доходные", f: (x) => x.t === 1 },
    { k: "o", t: "Расходные", f: (x) => x.t === 2 },
    { k: "b", t: "Доходно-расходные", f: (x) => x.t === 3 },
  ],
  filters: [{ k: "u", t: "Менеджер", get: (x) => x.u, opts: managerOpts }],
  sort: ["date", -1],
  cols: [
    { k: "num", t: "Договор", value: (x) => x.num, render: (x) => <NameCell icon={Signature} name={`№ ${x.num}`} sub={x.deal ? `Сделка № ${x.deal}` : "без сделки"} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "t", t: "Тип", value: typeOf, render: (x) => <Pill>{typeOf(x)}</Pill> },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    // TODO: ежемесячный платёж из договора (в макете — оценка по ID)
    { k: "sum", t: "Ежемес. платёж", num: true, value: monthly, render: (x) => `${money(monthly(x))} ₸` },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: (r, rp) => [
    { t: "Подписано", icon: Signature, c: signedIn(r), p: signedIn(rp) },
    { t: "Всего договоров", icon: FileText, c: 2896, note: "в базе kCRM" },
    { t: "Доходных", icon: CircleDollarSign, c: ALL.filter((x) => x.t === 1).length, note: "из последних 500" },
    { t: "Без сделки", icon: CircleX, c: ALL.filter((x) => !x.deal).length, note: "нужно связать" },
  ],
  sub: (r, rp, p) => {
    const c = sumOf(CONTRACTS_BY_MONTH, r)
    return `За ${periodLabel(p, r)} подписано ${fmt(c)} договоров — ${signed(delta(c, sumOf(CONTRACTS_BY_MONTH, rp)))} ${prevLabel(p)}.`
  },
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Договоры по месяцам" series={CONTRACTS_BY_MONTH} r={r} p={p} /> },
  record: (x) => {
    const props = [
      { t: "Номер", v: x.num },
      { t: "Дата", v: <DateCell d={x.date} /> },
      { t: "Тип", v: typeOf(x) },
      { t: "Новый / существующий", v: x.cust ? "Существующий" : "Новый" },
      {
        t: "Контрагент",
        wide: true,
        v: (
          <Link href={`/counterparties/${x.cs}`} className={link}>
            {counterpartyName(x.cs)}
          </Link>
        ),
      },
      { t: "БИН", v: binOf(x.cs) },
      { t: "Менеджер", v: managerName(x.u) },
      { t: "Подписант от клиента", v: CONTACT_NAMES[rnd(x.id, 3) % CONTACT_NAMES.length] },
    ]
    const payments = Array.from({ length: (rnd(x.id, 4) % 3) + 1 }, (_, k) => CATALOG_ITEMS[rnd(x.id, 10 + k) % CATALOG_ITEMS.length])
    return {
      title: `Договор № ${x.num}`,
      meta: (
        <>
          <Pill>{typeOf(x)}</Pill>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            <DateCell d={x.date} />
          </span>
        </>
      ),
      actions: [
        // TODO: превью договора (PDF) и загрузка в LD
        { icon: Eye, label: "Просмотр / PDF" },
        { icon: Upload, label: "Загрузить в LD" },
        { icon: FileText, label: "Акт", href: "/acts" },
      ],
      stats: [
        { t: "Ежемес. платёж", v: `${money(monthly(x))} ₸` },
        { t: "Тип", v: typeOf(x) },
        { t: "Дата", v: <DateCell d={x.date} /> },
      ],
      facts: props.filter((p) => !p.wide),
      tabs: [
        {
          t: "Договор",
          body: (
            <Section title="Реквизиты договора">
              <Kv items={props} />
            </Section>
          ),
        },
        {
          t: "Платежи",
          body: (
            <Section title="Ежемесячные платежи">
              <MiniTable
                head={[{ t: "Услуга" }, { t: "Ед." }, { t: "Кол-во" }, { t: "Сумма с НДС", right: true }]}
                rows={payments.map((p) => [p.d.slice(0, 60), p.ms, 1, `${fmt(p.price * 1.12)} ₸`])}
              />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `Договор № ${x.num}`,
  blank: () => ({ id: 0, num: "", cs: 0, deal: 0, u: allManagers[0].v, t: 1, date: "", cust: false }),
  fields: [
    { k: "num", t: "Номер договора", type: "text", required: true, get: (x) => (x.num === "б/н" ? "" : x.num), set: (x, v) => ({ ...x, num: v.trim() || "б/н" }) },
    { k: "date", t: "Дата", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "t", t: "Тип", type: "select", opts: [1, 2, 3].map((v) => ({ v: String(v), label: TYPES[v] })), get: (x) => String([1, 2, 3].includes(x.t) ? x.t : 1), set: (x, v) => ({ ...x, t: +v }) },
    { k: "u", t: "Менеджер", type: "select", opts: allManagers, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
