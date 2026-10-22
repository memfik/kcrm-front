import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Отчёт по IP-адресам — kCRM" }

/** 43 Отчёт по IP-адресам. */
export default function IpReportPage() {
  return <List />
}
