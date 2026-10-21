/*
 * Периоды и сравнения для сводок (главная, KPI разделов): «Месяц / Квартал / Год» к прошлому периоду.
 * Опорный месяц — последний полный в копии базы kCRM. TODO: из API — текущий месяц.
 */

export type Period = "m" | "q" | "y"
export type Delta = { v: number; text: string; tone: "up" | "down" | "eq" }

export const MON = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]
const MON_DAT = ["январю", "февралю", "марту", "апрелю", "маю", "июню", "июлю", "августу", "сентябрю", "октябрю", "ноябрю", "декабрю"]
const MON_GEN = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
export const MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

export type Series = Record<string, number>
export const series = (rows: string[][], col = 1): Series => Object.fromEntries(rows.map((r) => [r[0], +r[col]]))

const ANCHOR = "2018-03"
const ym = (s: string) => {
  const [y, m] = s.split("-").map(Number)
  return y * 12 + m - 1
}
export const ymStr = (k: number) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`
const A = ym(ANCHOR)
const LEN: Record<Period, number> = { m: 1, q: 3, y: 12 }

/** Месяцы периода («2018-03»…); shift = 1 — предыдущий период. */
export function range(p: Period, shift = 0) {
  const L = LEN[p]
  let end = A
  if (p === "q") {
    end = A - ((A % 12) % 3) + 2
    if (end > A) end -= 3
  }
  end -= shift * L
  return Array.from({ length: L }, (_, i) => ymStr(end - L + 1 + i))
}
export const yearAgo = (k: string) => ymStr(ym(k) - 12)
/** 12 месяцев до опорного включительно — ось графиков. */
export const LAST12 = Array.from({ length: 12 }, (_, j) => ymStr(A - 11 + j))
export const monthShort = (k: string) => MON_SHORT[+k.slice(5) - 1]

export const sumOf = (s: Series, r: string[]) => r.reduce((a, k) => a + (s[k] || 0), 0)
/** Дата «2018-03-15…» попадает в месяцы периода. */
export const inRange = (d: string | null | undefined, r: string[]) => !!d && d !== "NULL" && r.includes(d.slice(0, 7))

export function periodLabel(p: Period, r: string[]) {
  const [y, m] = r[0].split("-").map(Number)
  const [y2, m2] = r[r.length - 1].split("-").map(Number)
  if (p === "m") return `${MON[m - 1]} ${y}`
  if (p === "q") return `${Math.floor((m - 1) / 3) + 1} квартал ${y}`
  return `${MON_SHORT[m - 1]} ${y} – ${MON_SHORT[m2 - 1]} ${y2}`
}

/** «к февралю» / «к прошлому кварталу» / «к прошлым 12 мес.» */
export function prevLabel(p: Period) {
  if (p === "q") return "к прошлому кварталу"
  if (p === "y") return "к прошлым 12 мес."
  return "к " + MON_DAT[+range(p, 1)[0].slice(5) - 1]
}
/** Для подзаголовка: «К февралю» / «К прошлому кварталу» / «К прошлому году». */
export function prevShort(p: Period) {
  if (p === "q") return "прошлому кварталу"
  if (p === "y") return "прошлому году"
  return MON_DAT[+range(p, 1)[0].slice(5) - 1]
}

const pct = (v: number) => Math.abs(v).toFixed(Math.abs(v) < 10 ? 1 : 0).replace(".", ",")

/** Изменение к прошлому периоду. Без прошлого значения — «—» (или «новое», если есть текущее и `fresh`). */
export function delta(cur: number, prev: number, fresh = false): Delta {
  if (!prev) return fresh && cur ? { v: 0, text: "новое", tone: "up" } : { v: 0, text: "—", tone: "eq" }
  const v = ((cur - prev) / prev) * 100
  return { v, text: (v > 0 ? "▲ " : v < 0 ? "▼ " : "") + pct(v) + "%", tone: v > 0.5 ? "up" : v < -0.5 ? "down" : "eq" }
}
/** «+12%» / «−9,6%» — для текста. */
export const signed = (d: Delta) => (d.v > 0 ? "+" : d.v < 0 ? "−" : "") + pct(d.v) + "%"

export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU")
export const money = (n: number) =>
  n >= 1e9
    ? (n / 1e9).toFixed(1).replace(".", ",") + " млрд"
    : n >= 1e6
      ? (n / 1e6).toFixed(1).replace(".", ",") + " млн"
      : fmt(n)

/** «2018-03-15» → «15 мар 2018». */
export const shortDate = (d: string) => {
  const [y, m, dd] = d.slice(0, 10).split("-")
  return `${+dd} ${MON_GEN[+m - 1]} ${y}`
}
