import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Контрагенты — kCRM" }

/** 03 Контрагенты. */
export default function CounterpartiesPage() {
  return <List />
}
