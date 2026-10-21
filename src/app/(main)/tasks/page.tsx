import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Задачи — kCRM" }

/** 15 Задачи. */
export default function TasksPage() {
  return <List />
}
