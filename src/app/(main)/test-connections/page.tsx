import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Тестовые подключения — kCRM" }

/** 41 Тестовые подключения. */
export default function TestConnectionsPage() {
  return <List />
}
