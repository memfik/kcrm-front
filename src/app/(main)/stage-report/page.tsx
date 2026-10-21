import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёт по этапам продаж — kCRM" }

/** 33 Отчёт по этапам продаж. */
export default function StageReportPage() {
  return <List />
}
