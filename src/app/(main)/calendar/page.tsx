import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Календарь — kCRM" }

/** 16 Календарь. */
export default function CalendarPage() {
  return <List />
}
