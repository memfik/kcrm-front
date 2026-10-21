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

export type Action = {
  icon: LucideIcon
  label: string
  href?: string
  primary?: boolean
  /** Кнопка шапки списка: выгрузка, импорт или массовое действие над выбранными (`bulk`). */
  onClick?: "export" | "import" | "bulk"
  /** Действие карточки, меняющее запись (решение, статус): возвращает новую версию. */
  apply?: () => Row
}

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

/** Вместо удаления — «Расторгнуть» с датой и причиной (сделки в kCRM не удаляют). */
export type Archive<T> = {
  verb: string
  /** «сделку» / «сделок» — в заголовке диалога. */
  one: string
  many: string
  note: string
  reasons: Option[]
  apply: (x: T, reason: string, date: string) => T
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
  /** Последний месяц с данными, если не общий (см. period.ANCHOR). */
  anchor?: string
  kpis: (r: string[], rp: string[]) => KpiDef[]
  /** Вид «Аналитика» рядом со «Списком». */
  analytics?: { title: string; render: (ctx: { r: string[]; p: Period }) => ReactNode }
  archive?: Archive<T>
  /** Массовое действие над выбранными — для кнопки с onClick: "bulk" («Согласовать выбранные»). */
  bulk?: { done: string; apply: (x: T) => T }
  /** Колонка статуса для плашки на карточке (по умолчанию «st»). */
  cardStatus?: string
  sub: (r: string[], rp: string[], p: Period) => string
  record: (x: T) => RecordView
  fields: Field<T>[]
  blank: () => T
  /** Название записи (заголовок, тосты, «Удалить …?»). */
  name: (x: T) => string
}
