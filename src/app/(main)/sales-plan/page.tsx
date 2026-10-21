import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "План продаж — kCRM" }

/** 17 План продаж. */
export default function SalesPlanPage() {
  return <List />
}
