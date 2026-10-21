import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Песочница — kCRM" }

/** 07 Песочница. */
export default function SandboxPage() {
  return <List />
}
