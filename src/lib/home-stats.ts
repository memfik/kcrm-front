import raw from "@/data/home-demo.json"
import { managerName, companyName } from "./demo-names"
import { series, shortDate } from "./period"

export * from "./period"
export { initials, managerName, companyName } from "./demo-names"

/*
 * Главная (макет 02): расчёты по копии базы kCRM (2016–2018). Названия компаний и ФИО — примеры.
 * TODO: заменить на агрегаты из API.
 */

export const OFFERS = series(raw.offers)
export const SUMS = series(raw.offers, 2)
export const CONTRACTS = series(raw.contracts)
export const ACTIVITY = series(raw.activity)

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
