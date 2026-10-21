import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёт ТВ/ТР и наряды — kCRM" }

/** 39 Отчёт ТВ/ТР и наряды. */
export default function TvTrReportPage() {
  return <List />
}
