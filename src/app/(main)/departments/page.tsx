import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Подразделения — kCRM" }

/** 45 Подразделения. */
export default function DepartmentsPage() {
  return <List />
}
