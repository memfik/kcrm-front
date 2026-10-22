import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Наряд-заказы — kCRM" }

/** 44 Наряд-заказы. */
export default function JobOrdersPage() {
  return <List />
}
