import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Шаблоны форм — kCRM" }

/** 47 Шаблоны форм. */
export default function FormTemplatesPage() {
  return <List />
}
