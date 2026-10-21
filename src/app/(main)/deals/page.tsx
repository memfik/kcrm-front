import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Сделки — kCRM" }

/** 04 Сделки. */
export default function DealsPage() {
  return <List />
}
