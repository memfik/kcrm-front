import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёт по заявкам и нарядам — kCRM" }

/** 34 Отчёт по заявкам и нарядам. */
export default function RequestsReportPage() {
  return <List />
}
