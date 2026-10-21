import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "История звонков — kCRM" }

/** 32 История звонков. */
export default function CallsPage() {
  return <List />
}
