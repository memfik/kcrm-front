import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Номерная ёмкость — kCRM" }

/** 12 Номерная ёмкость. */
export default function NumberCapacityPage() {
  return <List />
}
