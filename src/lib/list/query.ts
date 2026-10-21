import type { Column, ListConfig, Row } from "./types"

/** Отбор записей: вкладка, поиск, фильтры-чипы и «Ещё» (даты, число, ответственные). */
export type Query = {
  tab: string | null
  q: string
  /** Фильтр → выбранные значения. */
  f: Record<string, string[]>
  from: string
  to: string
  min: string
  max: string
  own: string[]
  sort: [string, 1 | -1]
}

export const emptyQuery = <T extends Row>(cfg: ListConfig<T>): Query => ({
  tab: cfg.tabs?.[0].k ?? null,
  q: "",
  f: {},
  from: "",
  to: "",
  min: "",
  max: "",
  own: [],
  sort: cfg.sort,
})

/** Колонка даты и числа для «Ещё». */
export const dateCol = <T extends Row>(cfg: ListConfig<T>) => cfg.cols.find((c) => c.date)
export const numCol = <T extends Row>(cfg: ListConfig<T>) => cfg.cols.find((c) => c.num)

export function applyQuery<T extends Row>(cfg: ListConfig<T>, rows: T[], q: Query): T[] {
  const tab = cfg.tabs?.find((t) => t.k === q.tab)
  const needle = q.q.trim().toLowerCase()
  const filters = (cfg.filters ?? []).filter((f) => q.f[f.k]?.length)
  const dc = dateCol(cfg)
  const nc = numCol(cfg)
  const own = new Set(q.own)

  const out = rows.filter((x) => {
    if (tab && !tab.f(x)) return false
    if (needle && !cfg.text(x).toLowerCase().includes(needle)) return false
    for (const f of filters) if (!q.f[f.k].includes(f.get(x))) return false
    if (dc && (q.from || q.to)) {
      const v = String(dc.value(x) ?? "").slice(0, 10)
      if (!v || (q.from && v < q.from) || (q.to && v > q.to)) return false
    }
    if (nc && (q.min !== "" || q.max !== "")) {
      const v = Number(nc.value(x) ?? 0)
      if ((q.min !== "" && v < +q.min) || (q.max !== "" && v > +q.max)) return false
    }
    if (cfg.owner && own.size && !own.has(cfg.owner.get(x))) return false
    return true
  })

  const col = cfg.cols.find((c) => c.k === q.sort[0])
  if (col) {
    const dir = q.sort[1]
    out.sort((a, b) => {
      const x = col.value(a) ?? ""
      const y = col.value(b) ?? ""
      return (x > y ? 1 : x < y ? -1 : 0) * dir
    })
  }
  return out
}

/** Число дополнительных условий из «Ещё» — бейдж на кнопке. */
export const extraCount = (q: Query) => (q.from || q.to ? 1 : 0) + (q.min !== "" || q.max !== "" ? 1 : 0) + q.own.length

/** Выгрузка в Excel (CSV, «;», BOM — открывается в Excel с кириллицей). */
export function exportCsv<T extends Row>(cfg: ListConfig<T>, rows: T[]) {
  const cols: Column<T>[] = cfg.cols.filter((c) => !c.noSort)
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const body = [cols.map((c) => cell(c.t)).join(";"), ...rows.map((x) => cols.map((c) => cell(c.value(x))).join(";"))].join("\n")
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${cfg.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
