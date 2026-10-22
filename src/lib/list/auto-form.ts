import { managerName, STAFF } from "@/lib/demo-names"
import { rowsStore } from "./store"
import type { Field, ListConfig, Option, Row } from "./types"

/*
 * Форма раздела без своих `fields` — как в движке макетов: поля из колонок (варианты — из фильтров),
 * новая запись — копия первой строки раздела. Так «Изменить» и «Создать» есть у каждого списка.
 */

const OWNER = /^(u|uid|ex|mgr)$/
const staffOpts: Option[] = STAFF.slice(0, 60).map((v) => ({ v, label: managerName(v) }))
const yesNo: Option[] = [
  { v: "1", label: "Да" },
  { v: "0", label: "Нет" },
]

/** Новая запись автоформы: id 0 — поля пустые (селекты — на первом варианте). */
const isBlank = (x: Row) => x.id === 0

function autoFields<T extends Row>(cfg: ListConfig<T>, sample: T): Field<T>[] {
  const rec = sample as unknown as Record<string, unknown>
  return cfg.cols.flatMap((c, i): Field<T>[] => {
    const raw = rec[c.k]
    if (!(c.k in rec) || c.k === "id" || !["string", "number", "boolean"].includes(typeof raw)) return []
    const filter = cfg.filters?.find((f) => f.k === c.k)
    const opts = filter?.opts ?? (OWNER.test(c.k) ? staffOpts : typeof raw === "boolean" ? yesNo : undefined)
    const type: Field<T>["type"] = opts ? "select" : c.date ? "date" : typeof raw === "number" ? "number" : "text"
    const read = (x: T): string => {
      const v = (x as unknown as Record<string, unknown>)[c.k]
      if (filter) return filter.get(x)
      if (typeof v === "boolean") return v ? "1" : "0"
      return v == null ? "" : String(v).slice(0, c.date ? 10 : undefined)
    }
    return [
      {
        k: c.k,
        t: c.t,
        type,
        opts,
        required: i === 0,
        get: (x) => (isBlank(x) ? (opts ? opts[0].v : "") : read(x)),
        set: (x, v) => {
          const old = (x as unknown as Record<string, unknown>)[c.k]
          const next = typeof old === "number" ? +v || 0 : typeof old === "boolean" ? v === "1" || v === "true" : v
          return { ...x, [c.k]: next }
        },
      },
    ]
  })
}

/** Поля и заготовка новой записи: свои у раздела или собранные по колонкам. */
export function formOf<T extends Row>(cfg: ListConfig<T>) {
  const first = () => rowsStore.all(cfg)[0]
  const blank = cfg.blank ?? (() => ({ ...first(), id: 0 }))
  const fields = cfg.fields ?? (first() ? autoFields(cfg, first()) : [])
  return { fields, blank }
}
