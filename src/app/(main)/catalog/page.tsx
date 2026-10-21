import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Продукт-каталог — kCRM" }

/** 23 Продукт-каталог. */
export default function CatalogPage() {
  return <List />
}
