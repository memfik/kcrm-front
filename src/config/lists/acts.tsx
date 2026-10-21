import Link from "next/link"
import { CircleX, Clock, Download, FilePlus, FileText, Printer, Upload, Users } from "lucide-react"
import { DateCell, MiniTable, NameCell, Section, Status } from "@/components/list/cells"
import raw from "@/data/acts-demo.json"
import { counterpartyName, rnd } from "@/lib/demo-names"
import type { ListConfig } from "@/lib/list/types"
import { fmt } from "@/lib/period"

/*
 * 26 Акты выполненных работ — последние 400 актов копии базы kCRM (всего 908). Скан в LD — заглушка по ID, как в макете. TODO: API, LD.
 */

export type Act = {
  id: number
  /** 0 — акт подключения услуг, 1 — акт выполненных работ. */
  t: number
  cs: number
  deal: number
  /** Дата подписания ("" — нет). */
  date: string
  /** Скан загружен в LD. */
  scan: boolean
}

const KINDS = ["Акт подключения услуг", "Акт выполненных работ"]
const ALL: Act[] = raw.map(([id, t, cs, deal, date]) => ({ id: +id, t: +t, cs: +cs, deal: +deal, date: date || "", scan: rnd(id, 1) % 4 !== 0 }))

const scan = (x: Act) => (x.scan ? <Status text="Загружен" color="#34c759" /> : <Status text="Нет скана" color="#ff9f0a" />)
const kind = (x: Act) => KINDS[x.t] || "Акт"

export const ACTS: ListConfig<Act> = {
  key: "acts",
  title: "Акты выполненных работ",
  crumb: "Справочники · Акты",
  icon: FileText,
  search: "№ акта, контрагент или сделка",
  buttons: [
    { icon: FilePlus, label: "Создать акт", href: "/acts/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.id} ${counterpartyName(x.cs)} ${x.deal}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "d", t: "С датой", f: (x) => !!x.date },
    { k: "n", t: "Без даты подписания", f: (x) => !x.date },
  ],
  sort: ["id", -1],
  cols: [
    { k: "id", t: "Акт", value: (x) => x.id, render: (x) => <NameCell icon={FileText} name={`Акт № ${x.id}`} sub={kind(x)} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "deal", t: "Сделка", value: (x) => x.deal, render: (x) => (x.deal ? `№ ${x.deal}` : "—") },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date || null} /> },
    { k: "sc", t: "Скан в LD", value: (x) => (x.scan ? "Загружен" : "Нет скана"), render: scan },
  ],
  kpis: () => [
    { t: "Актов", icon: FileText, c: 908, note: "в базе kCRM" },
    { t: "Без скана в LD", icon: CircleX, c: ALL.filter((x) => !x.scan).length, note: "из последних 400" },
    { t: "Без даты", icon: Clock, c: ALL.filter((x) => !x.date).length },
    { t: "Контрагентов", icon: Users, c: new Set(ALL.map((x) => x.cs)).size },
  ],
  sub: () => "Акты подключения и выполненных работ (на казахском и русском) со ссылкой на скан в LD.",
  cardStatus: "sc",
  record: (x) => ({
    title: `Акт № ${x.id}`,
    meta: (
      <>
        {scan(x)}
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{kind(x)}</span>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
      </>
    ),
    actions: [
      // TODO: печатная форма акта (каз. / рус.)
      { icon: Printer, label: "Печать" },
      // TODO: загрузка скана в LD — сейчас только отметка
      ...(x.scan ? [] : [{ icon: Upload, label: "Загрузить скан", apply: () => ({ ...x, scan: true }) }]),
    ],
    stats: [
      { t: "Дата", v: <DateCell d={x.date || null} /> },
      { t: "Сделка", v: x.deal ? `№ ${x.deal}` : "—" },
      { t: "Скан в LD", v: x.scan ? "Загружен" : "Нет" },
    ],
    facts: [
      {
        t: "Контрагент",
        v: (
          <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            {counterpartyName(x.cs)}
          </Link>
        ),
      },
      { t: "Вид", v: kind(x) },
    ],
    tabs: [
      {
        t: "Работы",
        body: (
          <Section title="Наименование работ (услуг)">
            <MiniTable
              head={[{ t: "Работы" }, { t: "Оборудование" }, { t: "Стоимость", right: true }]}
              rows={[["Подключение услуги Интернет", `MikroTik hEX · S/N ${String(rnd(x.id, 2)).slice(0, 8)}`, `${fmt(((rnd(x.id, 3) % 90) + 10) * 1000)} ₸`]]}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => `Акт № ${x.id}`,
  blank: () => ({ id: 0, t: 1, cs: 0, deal: 0, date: "", scan: false }),
  fields: [
    {
      k: "t",
      t: "Вид акта",
      type: "select",
      opts: KINDS.map((label, i) => ({ v: String(i), label })),
      get: (x) => String(x.t),
      set: (x, v) => ({ ...x, t: +v }),
    },
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "deal", t: "№ сделки", type: "number", get: (x) => (x.deal ? String(x.deal) : ""), set: (x, v) => ({ ...x, deal: +v || 0 }) },
    { k: "date", t: "Дата подписания", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v }) },
  ],
}
