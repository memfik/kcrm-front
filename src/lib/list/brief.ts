import type { ReactNode } from "react"

/*
 * Плашки в шапке карточки — по правилу движка макетов: числовые колонки, затем поля карточки, затем даты;
 * берутся только короткие значения (до 26 знаков), без совпадающих с заголовком, без ID / БИН / названий / контрагента / адреса; не больше 4.
 */

/** Поле карточки; `s` — его текст, если `v` не строка (статус, дата). */
export type BriefItem = { t: string; v: ReactNode; s?: string; wide?: boolean }

const SKIP = /^ID|БИН|Название|Контрагент|Комментар|Адрес/i

export function briefStats(title: string, items: BriefItem[]) {
  const seen = new Set<string>()
  const out = items.filter((x) => {
    const s = x.s ?? (typeof x.v === "string" || typeof x.v === "number" ? String(x.v) : "")
    if (!s || s === "—" || s.length > 26 || s === title || SKIP.test(x.t) || seen.has(x.t)) return false
    seen.add(x.t)
    return true
  })
  const stats = out.slice(0, 4).map(({ t, v }) => ({ t, v }))
  return stats.length >= 2 ? stats : []
}

/** «Кратко» — поля первой вкладки карточки (не больше 10), как в макетах. */
export const briefFacts = (items: BriefItem[]) => items.slice(0, 10).map(({ t, v }) => ({ t, v }))
