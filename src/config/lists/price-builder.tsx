import Link from "next/link"
import { BookOpen, CircleCheck, Clock, FilePlus, Layers, SlidersHorizontal } from "lucide-react"
import { DateCell, Kv, NameCell, Section, Status } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig } from "@/lib/list/types"
import { fmt, shortDate } from "@/lib/period"
import { CATALOG_ITEMS } from "./catalog"

/*
 * 24 Конструктор прейскуранта — версии прейскуранта: рабочая и архивные. Изменения вступают в силу после активации.
 * Версии и даты — как в макете; позиции версии — прейскурант копии базы. TODO: API, редактирование позиций версии.
 */

export type PriceVersion = {
  id: number
  /** Действует с. */
  date: string
  /** Рабочая (текущая). */
  act: boolean
  /** Позиций. */
  n: number
}

const VERSIONS: [number, string, boolean][] = [
  [5, "2016-01-25", false],
  [6, "2016-01-25", false],
  [7, "2016-01-26", false],
  [8, "2016-08-16", false],
  [9, "2016-11-01", false],
  [10, "2017-01-12", false],
  [11, "2017-03-01", false],
  [12, "2017-07-12", true],
]
const TOTAL = CATALOG_ITEMS.length
const ALL: PriceVersion[] = VERSIONS.map(([id, date, act]) => ({ id, date, act, n: act ? TOTAL : Math.round(TOTAL * (0.7 + id / 40)) }))

const status = (x: PriceVersion) => (x.act ? <Status text="Рабочая (текущая)" color="#34c759" /> : <Status text="Архив" color="#8a93a6" />)

/** Сделать версию рабочей: у остальных снимаем отметку. Возвращает отмену. */
function activate(x: PriceVersion) {
  const before = rowsStore.all(PRICE_BUILDER)
  before.forEach((v) => v.act !== (v.id === x.id) && rowsStore.save(PRICE_BUILDER, { ...v, act: v.id === x.id }))
  return () => before.forEach((v) => rowsStore.save(PRICE_BUILDER, v))
}

export const PRICE_BUILDER: ListConfig<PriceVersion> = {
  key: "price-builder",
  title: "Конструктор прейскуранта",
  crumb: "Справочники · Версии прейскуранта",
  icon: SlidersHorizontal,
  search: "Версия",
  buttons: [
    { icon: FilePlus, label: "Создать новую версию", href: "/price-builder/new" },
    { icon: CircleCheck, label: "Активировать версию", onClick: "bulk" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `версия ${x.id}`,
  tabs: [
    { k: "a", t: "Все версии", f: () => true },
    { k: "c", t: "Текущая", f: (x) => x.act },
  ],
  sort: ["id", -1],
  cols: [
    { k: "id", t: "Версия", value: (x) => x.id, render: (x) => <NameCell icon={SlidersHorizontal} name={`Версия ${x.id}`} sub={`с ${shortDate(x.date)}`} /> },
    { k: "date", t: "Действует с", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "n", t: "Позиций", num: true, value: (x) => x.n, render: (x) => fmt(x.n) },
    { k: "act", t: "Статус", value: (x) => (x.act ? "Рабочая" : "Архив"), render: status },
    {
      k: "b",
      t: "",
      noSort: true,
      value: () => null,
      render: (x) => (
        <Link
          href={`/price-builder/${x.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-[34px] items-center rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold hover:bg-[var(--soft)]"
        >
          {x.act ? "Редактировать" : "Открыть"}
        </Link>
      ),
    },
  ],
  kpis: () => [
    { t: "Версий", icon: Layers, c: ALL.length },
    { t: "Текущая версия", icon: CircleCheck, c: 12, f: (v) => `№ ${v}` },
    { t: "Позиций", icon: BookOpen, c: TOTAL, p: Math.round(TOTAL * 0.93) },
    { t: "Последнее изменение", icon: Clock, c: 0, f: () => "12 июл 2017" },
  ],
  sub: () => "Рабочая версия прейскуранта и версии для редактирования. Изменения вступают в силу после активации.",
  // «Активировать версию» в шапке — первая из отмеченных (рабочей может быть только одна)
  bulk: { done: "Активирована версия", run: (rows) => (rows[0] ? activate(rows[0]) : undefined) },
  noCards: true,
  record: (x) => ({
    title: `Версия ${x.id}`,
    meta: status(x),
    actions: x.act
      ? []
      : [
          {
            icon: CircleCheck,
            label: "Активировать",
            run: () => void toast(`Версия ${x.id} — рабочая`, activate(x)),
          },
        ],
    stats: [
      { t: "Действует с", v: <DateCell d={x.date} /> },
      { t: "Позиций", v: fmt(x.n) },
      { t: "Статус", v: x.act ? "Рабочая" : "Архив" },
    ],
    facts: [],
    tabs: [
      {
        t: "Версия",
        body: (
          <Section title="Параметры">
            <Kv
              items={[
                { t: "Действует с", v: <DateCell d={x.date} /> },
                { t: "Позиций", v: fmt(x.n) },
                { t: "Статус", v: x.act ? "Рабочая" : "Архив" },
                {
                  t: "Позиции",
                  wide: true,
                  v: (
                    <Link href="/catalog" className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
                      Открыть в «Продукт-каталоге»
                    </Link>
                  ),
                },
              ]}
            />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => `Версия ${x.id}`,
  // новая версия — копия текущей по позициям; рабочей становится после активации
  blank: () => ({ id: 0, date: "", act: false, n: TOTAL }),
  fields: [{ k: "date", t: "Действует с", type: "date", required: true, get: (x) => x.date, set: (x, v) => ({ ...x, date: v }) }],
}
