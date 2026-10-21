import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Конструктор прейскуранта — kCRM" }

/** 24 Конструктор прейскуранта. */
export default function PriceBuilderPage() {
  return <List />
}
