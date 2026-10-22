/** Сегодня «YYYY-MM-DD» по местному времени (toISOString — UTC: в Казахстане до 05:00 дал бы вчера). Звать в обработчиках, не при рендере: страницы пререндерятся. */
export function todayLocal(d = new Date()) {
  const p2 = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}
