import raw from "@/data/home-demo.json"

/*
 * Главная (макет 02): расчёты по копии базы kCRM (2016–2018). Названия компаний и ФИО — примеры.
 * TODO: заменить на агрегаты из API; формат периодов и сравнений оставить.
 */

export type Period = "m" | "q" | "y"
export type Delta = { v: number; text: string; tone: "up" | "down" | "eq" }

export const MON = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]
const MON_DAT = ["январю", "февралю", "марту", "апрелю", "маю", "июню", "июлю", "августу", "сентябрю", "октябрю", "ноябрю", "декабрю"]
const MON_GEN = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
export const MON_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

type Series = Record<string, number>
const series = (rows: string[][], col = 1): Series => Object.fromEntries(rows.map((r) => [r[0], +r[col]]))

export const OFFERS = series(raw.offers)
export const SUMS = series(raw.offers, 2)
export const CONTRACTS = series(raw.contracts)
export const ACTIVITY = series(raw.activity)

/** Последний полный месяц в копии базы. */
const ANCHOR = "2018-03"
const ym = (s: string) => {
  const [y, m] = s.split("-").map(Number)
  return y * 12 + m - 1
}
export const ymStr = (k: number) => `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`
const A = ym(ANCHOR)
const LEN: Record<Period, number> = { m: 1, q: 3, y: 12 }

/** Месяцы периода; shift = 1 — предыдущий период. */
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

export function delta(cur: number, prev: number): Delta {
  if (!prev) return { v: 0, text: "—", tone: "eq" }
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

export const shortDate = (d: string) => {
  const [y, m, dd] = d.split("-")
  return `${+dd} ${MON_GEN[+m - 1]} ${y}`
}

/* ---------- имена-заглушки (в базе — ID) ---------- */

const CO = [
  "ТОО «Альфа Логистик»", "АО «КазМунайСервис»", "ТОО «Астана Строй Групп»", "ИП «Нурсултан Трейд»", "ТОО «Евразия Агро»",
  "АО «Транс Телеком Сервис»", "ТОО «Каспий Нефть»", "ТОО «Алтын Дала»", "ГУ «Акимат района»", "ТОО «Шымкент Пласт»",
  "АО «Энергосбыт»", "ТОО «Медикал Плюс»", "ТОО «Сарыарка Авто»", "КГП «Городская больница №3»",
]
const FIRST = ["Айгерим", "Данияр", "Мадина", "Ержан", "Алия", "Тимур", "Динара", "Руслан", "Асель", "Нурлан", "Жанна", "Бауыржан", "Сауле", "Арман", "Гульнар", "Ербол", "Айдана", "Марат", "Лаура", "Канат", "Дана", "Олжас", "Камила", "Серик"]
const LAST = [["Сапаров", "Сапарова"], ["Ахметов", "Ахметова"], ["Касымов", "Касымова"], ["Нурланов", "Нурланова"], ["Жумабеков", "Жумабекова"], ["Ибраев", "Ибраева"], ["Омаров", "Омарова"], ["Есимов", "Есимова"], ["Абилов", "Абилова"], ["Исабеков", "Исабекова"], ["Байжанов", "Байжанова"], ["Смагулов", "Смагулова"]]
const FEM = new Set(["Айгерим", "Мадина", "Алия", "Динара", "Асель", "Жанна", "Сауле", "Гульнар", "Айдана", "Лаура", "Дана", "Камила"])
const UIDS = [...new Set(raw.mgr.map((x) => x[0]).concat(raw.recent.map((x) => x[2]), raw.deals.map((x) => x[2])))].sort((a, b) => +a - +b)

export function managerName(id: string) {
  if (id === "1") return "Администратор"
  const i = UIDS.indexOf(id)
  const f = FIRST[i % FIRST.length]
  const l = LAST[(Math.floor(i / FIRST.length) + i * 7) % LAST.length]
  return `${f} ${l[FEM.has(f) ? 1 : 0]}`
}
export const companyName = (id: string) => (+id ? CO[Math.abs((+id * 2654435761) >>> 0) % CO.length] : "— без контрагента —")
export const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)

/* ---------- блоки ---------- */

/** Лицевые счета по статусам биллинга. */
export const ACCOUNT_STATUS: Record<number, { name: string; color: string }> = {
  0: { name: "Не определён", color: "#8a93a6" },
  1: { name: "Перспективный", color: "#ff9f0a" },
  2: { name: "Есть интерес", color: "#5ac8fa" },
  3: { name: "Активный", color: "#34c759" },
  4: { name: "Неактивный", color: "#af52de" },
  5: { name: "Приостановлен", color: "#ffcc00" },
  6: { name: "Отказ", color: "#ff375f" },
}
export const ACCOUNTS = raw.curstat.map(([s, n]) => ({ status: +s, count: +n })).sort((a, b) => b.count - a.count)

export function topManagers(r: string[], rp: string[]) {
  const by: Record<string, number> = {}
  const bp: Record<string, number> = {}
  for (const [u, m, n] of raw.mgr) {
    if (r.includes(m)) by[u] = (by[u] || 0) + +n
    if (rp.includes(m)) bp[u] = (bp[u] || 0) + +n
  }
  return Object.entries(by)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, name: managerName(id), count, prev: bp[id] || 0 }))
}

export type OfferStatus = "ok" | "wait" | "off"
export const RECENT_OFFERS = raw.recent.map(([id, co, u, date, sum, act]) => ({
  id,
  companyId: co,
  company: companyName(co),
  manager: managerName(u),
  date: shortDate(date),
  sum: +sum,
  status: (+act ? "ok" : +sum ? "wait" : "off") as OfferStatus,
}))

export const FEED = raw.deals.slice(0, 6).map(([id, co, u, date, kind]) => ({
  id,
  title: kind || "Сделка",
  isRequest: /обращ/i.test(kind),
  text: `${companyName(co)} · ${managerName(u)}`,
  date: shortDate(date),
}))
