import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёт по лидам и сделкам — kCRM" }

/** 35 Отчёт по лидам и сделкам. */
export default function LeadsReportPage() {
  return <List />
}
