import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Лоты — kCRM" }

/** 21 Лоты. */
export default function LotsPage() {
  return <List />
}
