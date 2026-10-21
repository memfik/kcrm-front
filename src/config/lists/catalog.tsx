import { BookOpen, Calendar, CircleDollarSign, Download, FilePlus, Layers, SlidersHorizontal } from "lucide-react"
import { Kv, Pill, Section } from "@/components/list/cells"
import raw from "@/data/catalog-demo.json"
import type { ListConfig, Option } from "@/lib/list/types"
import { fmt } from "@/lib/period"

/*
 * 23 Продукт-каталог — позиции действующей версии прейскуранта (копия базы kCRM, 700 позиций).
 * Только просмотр: цены меняются через «Конструктор прейскуранта» (24). TODO: API.
 */

export type CatalogItem = {
  id: number
  /** Тип абонента (B2B / B2C / …). */
  ct: string
  /** Группа услуг. */
  sv: string
  /** Номер позиции «5.2». */
  pos: string
  d: string
  /** Единица измерения. */
  ms: string
  /** Ежемесячный / за трафик (иначе — единовременный). */
  mon: boolean
  traf: boolean
  price: number
  /** Максимальная скидка, %. */
  disc: number
}

const UNIT: Record<string, string> = Object.fromEntries(raw.units.map(([id, name]) => [id, name]))
const SERVICE: Record<string, string> = Object.fromEntries(raw.services.map(([id, name]) => [id, name.trim()]))
const CLIENT: Record<string, string> = Object.fromEntries(raw.clientTypes.map(([id, name, hint]) => [id, hint ? `${name} · ${hint}` : name]))

export const CATALOG_ITEMS: CatalogItem[] = raw.price.map(([id, ct, sv, pos, d, ms, mon, traf, price, disc]) => ({
  id: +id,
  ct,
  sv: SERVICE[sv] || "Прочие услуги",
  pos,
  // в копии базы встречаются неразрывные и двойные пробелы
  d: d.replace(/\s+/g, " ").trim(),
  ms: UNIT[ms] || "—",
  mon: mon === "1",
  traf: traf === "1",
  price: +price,
  disc: +disc,
}))

/** «12.3» → «0012.0003»: сортировка позиций по номеру, а не как строк. */
const posKey = (pos: string) =>
  pos
    .split(".")
    .map((n) => n.padStart(4, "0"))
    .join(".")
const payment = (x: CatalogItem) => (x.mon ? "Ежемесячный" : x.traf ? "За трафик" : "Единовременный")
const clientOpts: Option[] = raw.clientTypes.filter(([id]) => +id).map(([v, name, hint]) => ({ v, label: `${name} · ${hint}` }))
const serviceOpts: Option[] = [...new Set(CATALOG_ITEMS.map((x) => x.sv))].map((v) => ({ v, label: v }))

export const CATALOG: ListConfig<CatalogItem> = {
  key: "catalog",
  title: "Продукт-каталог",
  crumb: "Справочники · Прейскурант, текущая версия",
  icon: BookOpen,
  search: "Название услуги или позиция",
  buttons: [
    { icon: FilePlus, label: "Сформировать КП", href: "/offer-builder" },
    { icon: SlidersHorizontal, label: "Конструктор прейскуранта", href: "/price-builder" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => CATALOG_ITEMS.map((x) => ({ ...x })),
  text: (x) => `${x.d} ${x.pos} ${x.sv}`,
  tabs: [
    { k: "m", t: "Ежемесячные", f: (x) => x.mon },
    { k: "o", t: "Единовременные", f: (x) => !x.mon && !x.traf },
    { k: "t", t: "За трафик", f: (x) => x.traf },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "ct", t: "Тип абонента", get: (x) => x.ct, opts: clientOpts },
    { k: "sv", t: "Услуга", get: (x) => x.sv, opts: serviceOpts },
  ],
  sort: ["pos", 1],
  cols: [
    { k: "pos", t: "Позиция", value: (x) => posKey(x.pos), render: (x) => <span className="tabular-nums">{x.pos}</span> },
    { k: "d", t: "Услуга", value: (x) => x.d, render: (x) => <span className="block max-w-[560px] whitespace-normal">{x.d}</span> },
    { k: "sv", t: "Группа", value: (x) => x.sv, render: (x) => <Pill>{x.sv}</Pill> },
    { k: "ms", t: "Ед. изм.", value: (x) => x.ms, render: (x) => x.ms },
    { k: "price", t: "Стоимость", num: true, value: (x) => x.price, render: (x) => `${fmt(x.price)} ₸` },
    { k: "disc", t: "Макс. скидка", num: true, value: (x) => x.disc, render: (x) => (x.disc ? `${x.disc}%` : "—") },
  ],
  kpis: () => [
    { t: "Позиций в прейскуранте", icon: BookOpen, c: CATALOG_ITEMS.length, note: "текущая версия (12)" },
    { t: "Ежемесячных", icon: Calendar, c: CATALOG_ITEMS.filter((x) => x.mon).length },
    { t: "Единовременных", icon: CircleDollarSign, c: CATALOG_ITEMS.filter((x) => !x.mon && !x.traf).length },
    { t: "Групп услуг", icon: Layers, c: new Set(CATALOG_ITEMS.map((x) => x.sv)).size },
  ],
  sub: () => "Каталог услуг из действующей версии прейскуранта: телефония, интернет, каналы, VPN, хостинг. Отсюда позиции попадают в КП.",
  noCards: true,
  noDelete: true,
  record: (x) => {
    const params = [
      { t: "Услуга", v: x.d, wide: true },
      { t: "Группа", v: x.sv },
      { t: "Тип абонента", v: CLIENT[x.ct] || "—" },
      { t: "Единица измерения", v: x.ms },
      { t: "Стоимость", v: `${fmt(x.price)} ₸` },
      { t: "Платёж", v: payment(x) },
      { t: "Максимальная скидка", v: x.disc ? `${x.disc}%` : "без скидки" },
    ]
    return {
      title: x.d,
      meta: (
        <>
          <Pill>{x.pos}</Pill>
          <Pill>{x.sv}</Pill>
        </>
      ),
      // TODO: добавить позицию в открытое КП (Конструктор КП, макет 28)
      actions: [{ icon: FilePlus, label: "Добавить в КП", href: `/offer-builder?pos=${x.id}` }],
      stats: [
        { t: "Стоимость", v: `${fmt(x.price)} ₸` },
        { t: "Платёж", v: payment(x) },
        { t: "Макс. скидка", v: x.disc ? `${x.disc}%` : "—" },
      ],
      facts: params.filter((p) => !p.wide),
      tabs: [
        {
          t: "Позиция",
          body: (
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `${x.pos} · ${x.d}`,
}
