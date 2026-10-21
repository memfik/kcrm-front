import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёты — kCRM" }

/** 27 Отчёты. */
export default function ReportsPage() {
  return <List />
}
