import { managerName, STAFF } from "@/lib/demo-names"
import { rowsStore } from "./store"
import type { Column, Field, ListConfig, Option, Row } from "./types"

/*
 * Форма записи — как в движке макетов: поля — колонки списка в их порядке, первое обязательное и во всю ширину,
 * варианты — из фильтров, у ответственного — сотрудники. Свои `fields` раздела подставляются по ключу колонки
 * (разбор значения, пересчёт сроков); полей без колонки в форме нет. Колонки, которые считаются из других
 * полей («Осталось», «ЕСТУ»), — только для чтения. Новая запись без `blank` — копия первой строки.
 */

const OWNER = /^(u|uid|ex|mgr)$/
const staffOpts: Option[] = STAFF.slice(0, 60).map((v) => ({ v, label: managerName(v) }))
const yesNo: Option[] = [
  { v: "1", label: "Да" },
  { v: "0", label: "Нет" },
]

/** Новая запись: id 0 — поля пустые (селекты — на первом варианте). */
const isBlank = (x: Row) => x.id === 0
const raw = (x: Row, k: string) => (x as unknown as Record<string, unknown>)[k]

/** Колонка-код («act» → «Активно»): варианты — встречающиеся значения с подписями из таблицы, иначе свободный ввод. */
function codes<T extends Row>(cfg: ListConfig<T>, c: Column<T>): Option[] | undefined {
  const seen = new Map<string, string>()
  for (const x of rowsStore.all(cfg)) {
    const v = String(raw(x, c.k))
    if (!seen.has(v)) seen.set(v, String(c.value(x) ?? v))
    if (seen.size > 12) return undefined
  }
  const coded = [...seen].some(([v, label]) => v !== label)
  return seen.size > 1 && coded ? [...seen].map(([v, label]) => ({ v, label })) : undefined
}

function autoField<T extends Row>(cfg: ListConfig<T>, c: Column<T>, sample: T): Field<T> {
  const v0 = raw(sample, c.k)
  const stored = c.k in sample && c.k !== "id" && ["string", "number", "boolean"].includes(typeof v0)
  const filter = stored ? cfg.filters?.find((f) => f.k === c.k) : undefined
  const opts = stored ? (filter?.opts ?? (OWNER.test(c.k) ? staffOpts : typeof v0 === "boolean" ? yesNo : codes(cfg, c))) : undefined
  const type: Field<T>["type"] = opts ? "select" : c.date && stored ? "date" : typeof v0 === "number" && stored ? "number" : "text"
  const read = (x: T): string => {
    if (!stored) return String(c.value(x) ?? "")
    if (filter) return filter.get(x)
    const v = raw(x, c.k)
    if (typeof v === "boolean") return v ? "1" : "0"
    return v == null ? "" : String(v).slice(0, c.date ? 10 : undefined)
  }
  return {
    k: c.k,
    // контрагент в записи — id: поле по ID, как в остальных формах
    t: c.k === "cs" && typeof v0 === "number" ? "ID контрагента" : c.t,
    type,
    opts,
    readOnly: !stored,
    get: (x) => (isBlank(x) ? (opts ? opts[0].v : "") : read(x)),
    set: (x, v) => {
      if (!stored) return x
      const old = raw(x, c.k)
      const next = typeof old === "number" ? +v || 0 : typeof old === "boolean" ? v === "1" || v === "true" : v
      return { ...x, [c.k]: next }
    },
  }
}

/** Поля и заготовка новой записи — по колонкам, со своими полями раздела там, где они есть. */
export function formOf<T extends Row>(cfg: ListConfig<T>) {
  const first = () => rowsStore.all(cfg)[0]
  const blank = cfg.blank ?? (() => ({ ...first(), id: 0 }))
  const sample = first() ?? blank()
  const fields: Field<T>[] = sample
    ? cfg.cols
        .filter((c) => !c.noSort)
        .map((c, i) => {
          const own = cfg.fields?.find((f) => f.k === c.k)
          const f = own ? { ...own, t: /^ID /.test(own.t) ? own.t : c.t } : autoField(cfg, c, sample)
          return i === 0 ? { ...f, required: !f.readOnly, wide: true } : { ...f, wide: false }
        })
    : []
  return { fields, blank }
}
