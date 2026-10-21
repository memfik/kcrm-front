import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Тендеры — kCRM" }

/** 20 Тендеры. */
export default function TendersPage() {
  return <List />
}
