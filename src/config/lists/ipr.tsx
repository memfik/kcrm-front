import Link from "next/link"
import { CircleDollarSign, Download, FilePlus, List, Pencil, UserRound, Users } from "lucide-react"
import { Kv, Owner, Section } from "@/components/list/cells"
import raw from "@/data/ipr-demo.json"
import { counterpartyName, managerName, ownerColor, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { fmt, MON, money } from "@/lib/period"

/*
 * 18 ИПР — индивидуальные планы работ менеджеров: клиент, услуга прейскуранта и ожидаемый объём.
 * Строки — копия базы kCRM. TODO: API.
 */

export type IprRow = {
  id: number
  u: string
  cs: number
  y: number
  /** Месяц 1–12, 0 — на весь год. */
  m: number
  sv: string
  /** Ожидаемый объём, ₸. */
  p: number
  cm: string
}

// в справочнике есть одинаковые названия с пробелом в конце — приводим к одному виду
const SERVICE: Record<string, string> = Object.fromEntries(raw.services.map(([id, name]) => [id, name.trim()]))
const ALL: IprRow[] = raw.rows.map(([id, u, cs, y, m, sv, p, cm]) => ({ id: +id, u, cs: +cs, y: +y, m: +m, sv: SERVICE[sv] || "—", p: +p, cm }))

const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const period = (x: IprRow) => (x.m ? `${MON[x.m - 1]} ${x.y}` : String(x.y))
const ofYear = (y: number) => ALL.filter((x) => x.y === y)
const volume = (rows: IprRow[]) => rows.reduce((a, x) => a + x.p, 0)
const serviceOpts: Option[] = [...new Set(ALL.map((x) => x.sv).filter((s) => s !== "—"))].map((v) => ({ v, label: v }))
const allServices: Option[] = [...new Set(Object.values(SERVICE))].map((v) => ({ v, label: v }))
const managerOpts: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))

export const IPR: ListConfig<IprRow> = {
  key: "ipr",
  title: "Индивидуальный план работ",
  crumb: "Планирование · ИПР",
  icon: List,
  search: "Менеджер, клиент или услуга",
  buttons: [
    { icon: FilePlus, label: "Добавить строку", href: "/ipr/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${managerName(x.u)} ${counterpartyName(x.cs)} ${x.sv} ${x.cm}`,
  tabs: [
    { k: "17", t: "2017", f: (x) => x.y === 2017 },
    { k: "16", t: "2016", f: (x) => x.y === 2016 },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [{ k: "sv", t: "Услуга", get: (x) => x.sv, opts: serviceOpts }],
  sort: ["p", -1],
  cols: [
    { k: "u", t: "Менеджер", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "cs", t: "Клиент", value: (x) => counterpartyName(x.cs), render: (x) => (x.cs ? <b className="font-semibold">{counterpartyName(x.cs)}</b> : "—") },
    { k: "sv", t: "Услуга", value: (x) => x.sv, render: (x) => x.sv },
    { k: "m", t: "Месяц", value: (x) => x.y * 12 + x.m, render: (x) => <span className="first-letter:uppercase">{period(x)}</span> },
    { k: "p", t: "Объём, ₸", num: true, value: (x) => x.p, render: (x) => (x.p ? fmt(x.p) : "—") },
    { k: "cm", t: "Комментарий", value: (x) => x.cm, render: (x) => <span className="whitespace-normal text-muted-foreground">{x.cm || "—"}</span> },
  ],
  owner: { t: "Менеджер", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  // ИПР — годовой план: сравнение 2017 с 2016, а не по выбранному периоду (как в макете)
  kpis: () => [
    { t: "Объём ИПР 2017", icon: CircleDollarSign, c: volume(ofYear(2017)), p: volume(ofYear(2016)), f: (n) => `${money(n)} ₸` },
    { t: "Строк плана", icon: List, c: ofYear(2017).length, p: ofYear(2016).length },
    { t: "Клиентов", icon: Users, c: new Set(ofYear(2017).map((x) => x.cs)).size },
    { t: "Менеджеров", icon: UserRound, c: new Set(ofYear(2017).map((x) => x.u)).size },
  ],
  sub: () => "Индивидуальные планы менеджеров: клиент, услуга и ожидаемый объём. Сравнение 2017 года с 2016.",
  noCards: true,
  record: (x) => {
    const info = [
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
      { t: "Услуга", v: x.sv },
      { t: "Объём", v: x.p ? `${money(x.p)} ₸` : "—" },
      { t: "Период", v: <span className="first-letter:uppercase">{period(x)}</span> },
      { t: "Комментарий", v: x.cm || "—", wide: true },
    ]
    return {
      title: `ИПР · ${managerName(x.u)}`,
      meta: <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{x.sv}</span>,
      actions: [{ icon: Pencil, label: "Изменить", href: `/ipr/${x.id}/edit` }],
      stats: [],
      facts: info.filter((i) => !i.wide),
      tabs: [
        {
          t: "Строка",
          body: (
            <Section title="Строка плана">
              <Kv items={info} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `ИПР · ${managerName(x.u)}${x.cs ? ` · ${counterpartyName(x.cs)}` : ""}`,
  blank: () => ({ id: 0, u: managerOpts[0].v, cs: 0, y: 2017, m: 0, sv: allServices[0].v, p: 0, cm: "" }),
  fields: [
    { k: "u", t: "Менеджер", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "cs", t: "ID клиента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "sv", t: "Услуга", type: "select", opts: allServices, get: (x) => x.sv, set: (x, v) => ({ ...x, sv: v }) },
    { k: "p", t: "Объём, ₸", type: "number", get: (x) => (x.p ? String(x.p) : ""), set: (x, v) => ({ ...x, p: +v || 0 }) },
    {
      k: "m",
      t: "Месяц",
      type: "select",
      opts: [{ v: "0", label: "Весь год" }, ...MON.map((m, i) => ({ v: String(i + 1), label: m[0].toUpperCase() + m.slice(1) }))],
      get: (x) => String(x.m),
      set: (x, v) => ({ ...x, m: +v }),
    },
    { k: "cm", t: "Комментарий", type: "text", wide: true, get: (x) => x.cm, set: (x, v) => ({ ...x, cm: v.trim() }) },
  ],
}
