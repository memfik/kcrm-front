import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Наряды — kCRM" }

/** 10 Наряды на работы. */
export default function WorkOrdersPage() {
  return <List />
}
