import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "КП — kCRM" }

/** 05 Коммерческие предложения. */
export default function OffersPage() {
  return <List />
}
