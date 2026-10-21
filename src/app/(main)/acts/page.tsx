import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Акты — kCRM" }

/** 26 Акты выполненных работ. */
export default function ActsPage() {
  return <List />
}
