import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Абоненты — kCRM" }

/** 13 Абоненты. */
export default function SubscribersPage() {
  return <List />
}
