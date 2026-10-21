import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "ID-каналы — kCRM" }

/** 40 ID-каналы. */
export default function ChannelIdsPage() {
  return <List />
}
