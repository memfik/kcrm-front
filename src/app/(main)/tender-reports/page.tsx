import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёты по тендерам — kCRM" }

/** 22 Отчёты по тендерам. */
export default function TenderReportsPage() {
  return <List />
}
