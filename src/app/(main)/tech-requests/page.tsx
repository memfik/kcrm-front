import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Запросы ТВ и ТР — kCRM" }

/** 09 Запросы ТВ и ТР. */
export default function TechRequestsPage() {
  return <List />
}
