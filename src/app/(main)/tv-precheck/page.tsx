import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Предварительная проверка ТВ — kCRM" }

/** 37 Предварительная проверка ТВ. */
export default function TvPrecheckPage() {
  return <List />
}
