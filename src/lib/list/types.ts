import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import type { Period } from "@/lib/period"

/*
 * Шаблон списка раздела (как `const PAGE = {...}` в макетах): один движок, разделы отличаются конфигом.
 * Записи открываются маршрутами: /<key>, /<key>/<id>, /<key>/<id>/edit, /<key>/new.
 */

export type Row = { id: number }

export type Column<T> = {
  k: string
  t: string
  render: (x: T) => ReactNode
  /** Простое значение — для сортировки, поиска по диапазону и выгрузки. */
  value: (x: T) => string | number | null
  /** Число — справа, сортировка по убыванию. */
  num?: boolean
  /** Дата «YYYY-MM-DD…» — диапазон в «Ещё», сортировка по убыванию. */
  date?: boolean
  noSort?: boolean
}

export type Option = { v: string; label: string; color?: string }

export type Filter<T> = { k: string; t: string; get: (x: T) => string; opts: Option[] }

export type Tab<T> = { k: string; t: string; f: (x: T) => boolean }

export type KpiDef = {
  t: string
  icon: LucideIcon
  c: number
  /** Прошлый период — для «▲ % · было N». */
  p?: number
  note?: string
  f?: (n: number) => string
}

export type Action = { icon: LucideIcon; label: string; href?: string; primary?: boolean; onClick?: "export" }

export type Field<T> = {
  k: string
  t: string
  type: "text" | "select" | "number" | "date"
  opts?: Option[]
  required?: boolean
  wide?: boolean
  get: (x: T) => string
  set: (x: T, v: string) => T
}

export type RecordView = {
  title: string
  meta: ReactNode
  actions: Action[]
  /** Крупные цифры в шапке карточки. */
  stats: { t: string; v: ReactNode }[]
  /** «Кратко» справа. */
  facts: { t: string; v: ReactNode }[]
  tabs: { t: string; fresh?: boolean; body: ReactNode }[]
}

export type ListConfig<T extends Row> = {
  key: string
  title: string
  crumb: string
  icon: LucideIcon
  badge?: "new" | "upd"
  /** Откуда требования («Доработано по требованиям …»). */
  req?: string
  search: string
  buttons: Action[]
  rows: () => T[]
  /** Текст для поиска. */
  text: (x: T) => string
  tabs?: Tab<T>[]
  filters?: Filter<T>[]
  sort: [string, 1 | -1]
  cols: Column<T>[]
  /** Колонка ответственного — фильтр «Ещё» и блок «Ответственный». */
  owner?: { t: string; get: (x: T) => string; name: (id: string) => string; render: (x: T) => ReactNode }
  kpis: (r: string[], rp: string[]) => KpiDef[]
  sub: (r: string[], rp: string[], p: Period) => string
  record: (x: T) => RecordView
  fields: Field<T>[]
  blank: () => T
  /** Название записи (заголовок, тосты, «Удалить …?»). */
  name: (x: T) => string
}
