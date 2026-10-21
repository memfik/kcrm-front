import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Запросы скидки — kCRM" }

/** 06 Запросы скидки. */
export default function DiscountRequestsPage() {
  return <List />
}
