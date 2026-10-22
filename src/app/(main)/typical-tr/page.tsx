import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Типовые ТР — kCRM" }

/** 46 Типовые ТР. */
export default function TypicalTrPage() {
  return <List />
}
