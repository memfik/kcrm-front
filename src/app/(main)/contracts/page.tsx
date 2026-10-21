import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Договоры — kCRM" }

/** 25 Договоры. */
export default function ContractsPage() {
  return <List />
}
