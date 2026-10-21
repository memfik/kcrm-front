import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Заявки IP — kCRM" }

/** 11 Заявки IP. */
export default function IpRequestsPage() {
  return <List />
}
