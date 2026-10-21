import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "ИПР — kCRM" }

/** 18 Индивидуальный план работ. */
export default function IprPage() {
  return <List />
}
