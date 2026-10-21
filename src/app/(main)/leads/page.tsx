import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Лиды — kCRM" }

/** 08 Лиды. */
export default function LeadsPage() {
  return <List />
}
