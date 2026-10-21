import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Акты монтажа — kCRM" }

/** 14 Акты монтажа и демонтажа. */
export default function InstallActsPage() {
  return <List />
}
